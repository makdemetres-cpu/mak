<?php
/**
 * Vet Care — reviews feed
 * ---------------------------------------------------------------------------
 * Returns the newest 4- and 5-star reviews as JSON, merging two sources:
 *   · Google, fetched live through the Places API
 *   · reviews left on this website, once the clinic has approved them
 *
 * WHY THIS RUNS ON THE SERVER
 * The Google API key must never reach the browser — anyone could read it from
 * the page source and spend the clinic's quota. The browser calls this file,
 * this file calls Google, and only the finished review text comes back.
 *
 * WHY NOTHING IS CACHED
 * Google Maps Platform policy allows place IDs to be stored indefinitely but
 * requires ratings, reviews, hours and similar content to be "requested live
 * and not warehoused". So each page view means one live call. At a local
 * clinic's traffic that normally sits inside the monthly free allowance; if it
 * ever does not, the honest fix is fewer calls (load the section only when it
 * scrolls into view — which the front end already does), not a cache that
 * breaks the terms.
 *
 * Google also requires attribution: the reviewer's name, a link to the review
 * and the Google logo are all shown by js/reviews.js.
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

const MIN_STARS = 4;   /* the brief: show only 4- and 5-star reviews */
const MAX_SHOWN = 5;   /* newest five; a new one pushes the oldest out */

require __DIR__ . '/review-store.php';

$config = is_file(__DIR__ . '/config.php') ? require __DIR__ . '/config.php' : [];

$out = [
    'ok'        => true,
    'reviews'   => [],
    'rating'    => null,
    'total'     => null,
    'googleUrl' => null,
    'writeUrl'  => null,
    'notice'    => null,
];

/* ------------------------------------------------------------------ Google */
$key     = trim((string)($config['google_api_key'] ?? ''));
$placeId = trim((string)($config['google_place_id'] ?? ''));

if ($placeId !== '') {
    /* These two work without an API key and are always safe to offer. */
    $out['googleUrl'] = 'https://search.google.com/local/reviews?placeid=' . rawurlencode($placeId);
    $out['writeUrl']  = 'https://search.google.com/local/writereview?placeid=' . rawurlencode($placeId);
}

if ($key !== '' && $placeId !== '') {
    /* The host is configurable so the parsing can be exercised against a stub
       in testing; it defaults to Google and should stay that way in production. */
    $base = (string)($config['google_api_base'] ?? 'https://places.googleapis.com/v1/places/');
    $url = $base . rawurlencode($placeId);
    $fields = 'rating,userRatingCount,googleMapsUri,reviews';

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 6,
        CURLOPT_HTTPHEADER     => [
            'X-Goog-Api-Key: ' . $key,
            'X-Goog-FieldMask: ' . $fields,
            'Accept-Language: el',
        ],
    ]);
    $body = curl_exec($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);

    if ($body !== false && $status === 200) {
        $place = json_decode((string)$body, true);
        if (is_array($place)) {
            $out['rating'] = isset($place['rating']) ? (float)$place['rating'] : null;
            $out['total']  = isset($place['userRatingCount']) ? (int)$place['userRatingCount'] : null;
            if (!empty($place['googleMapsUri'])) {
                $out['googleUrl'] = $place['googleMapsUri'];
            }
            foreach (($place['reviews'] ?? []) as $r) {
                $stars = (int)($r['rating'] ?? 0);
                $text  = trim((string)($r['text']['text'] ?? $r['originalText']['text'] ?? ''));
                if ($stars < MIN_STARS || $text === '') {
                    continue;
                }
                $out['reviews'][] = [
                    'source'      => 'google',
                    'author'      => (string)($r['authorAttribution']['displayName'] ?? 'Google'),
                    'url'         => (string)($r['authorAttribution']['uri'] ?? ($r['googleMapsUri'] ?? '')),
                    'rating'      => $stars,
                    'text'        => $text,
                    'translation' => '',
                    'time'        => (string)($r['publishTime'] ?? ''),
                    'ago'         => (string)($r['relativePublishTimeDescription'] ?? ''),
                ];
            }
        }
    } else {
        /* Never break the page over a third party being slow or over quota. */
        $out['notice'] = 'google_unavailable';
    }
} elseif ($key === '' || $placeId === '') {
    $out['notice'] = 'google_not_configured';
}

/* The "see more" button's destination, in order of preference: the exact
   listing address set in config.php, then whatever the API or the Place ID
   gives us, and failing all of those a Google Maps search for the clinic by
   name and street — which needs no key, no Place ID and no configuration, and
   lands on the listing where every review can be read. Replace it by pasting
   the real address into config.php: open the clinic on Google Maps, press
   Share, and copy what it offers. */
$listing = trim((string)($config['google_listing_url'] ?? ''));
if ($listing !== '') {
    $out['googleUrl'] = $listing;
} elseif ($out['googleUrl'] === null) {
    $out['googleUrl'] = 'https://www.google.com/maps/search/?api=1&query='
        . rawurlencode('Κτηνιατρικό Κέντρο Vet Care, Δημοκρατίας 149, Οβρυά, Πάτρα');
}

/* --------------------------- reviews quoted by hand from the Google listing
   They live in curated-reviews.json, not in this file, because a host that
   cannot run PHP still has to show them: js/reviews.js reads exactly the same
   file when this endpoint does not execute. One file, one set of reviews,
   whatever the host.

   They are pinned: they always appear, ahead of everything else, which is why
   they are collected before the sort and re-attached after it. */
$pinned = [];
$curatedFile = __DIR__ . '/curated-reviews.json';
if (is_file($curatedFile)) {
    $curated = json_decode((string)file_get_contents($curatedFile), true);
    if (is_array($curated)) {
        /* The listing address for the "see more" button can live here too, so a
           static host has one as well. config.php still wins if it sets one. */
        $fromFile = trim((string)($curated['googleUrl'] ?? ''));
        if ($fromFile !== '' && $out['googleUrl'] === null) {
            $out['googleUrl'] = $fromFile;
        }
        foreach ((array)($curated['reviews'] ?? []) as $r) {
            if (isset($r['show']) && !$r['show']) {
                continue;
            }
            $author = trim((string)($r['author'] ?? ''));
            $stars  = $r['rating'] ?? null;
            $text   = trim((string)($r['text'] ?? ''));
            /* The words are the review. A missing name or star count is left
               out of the card rather than guessed at — better an unattributed
               quote than an invented signature. */
            if ($text === '') {
                continue;
            }
            if ($stars !== null) {
                $stars = (int)$stars;
                if ($stars < MIN_STARS) {
                    continue;
                }
            }
            $pinned[] = [
                'source'      => 'google',
                'author'      => $author,
                'url'         => (string)($r['url'] ?? ''),
                'rating'      => $stars,
                'text'        => $text,
                'translation' => trim((string)($r['translation'] ?? '')),
                'time'        => (string)($r['date'] ?? ''),
                'ago'         => '',
            ];
        }
    }
}

/* ------------------------------------------- reviews left on this website */
foreach (review_store_load(review_store_path($config)) as $r) {
    if (($r['status'] ?? '') !== 'approved') {
        continue;                           /* nothing publishes unapproved */
    }
    if ((int)($r['rating'] ?? 0) < MIN_STARS) {
        continue;
    }
    $out['reviews'][] = [
        'source'      => 'site',
        'author'      => (string)($r['author'] ?? ''),
        'url'         => '',
        'rating'      => (int)$r['rating'],
        'text'        => (string)($r['text'] ?? ''),
        'translation' => '',
        'time'        => (string)($r['created'] ?? ''),
        'ago'         => '',
    ];
}

/* Newest first among the rest, then the pinned ones go in front and whatever
   is newest fills the slots that remain. */
usort($out['reviews'], static fn(array $a, array $b): int => strcmp($b['time'], $a['time']));
$out['reviews'] = array_slice(array_merge($pinned, $out['reviews']), 0, MAX_SHOWN);

echo json_encode($out, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
