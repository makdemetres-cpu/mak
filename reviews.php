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
                    'source'  => 'google',
                    'author'  => (string)($r['authorAttribution']['displayName'] ?? 'Google'),
                    'url'     => (string)($r['authorAttribution']['uri'] ?? ($r['googleMapsUri'] ?? '')),
                    'rating'  => $stars,
                    'text'    => $text,
                    'time'    => (string)($r['publishTime'] ?? ''),
                    'ago'     => (string)($r['relativePublishTimeDescription'] ?? ''),
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

/* ------------------------------------------- reviews left on this website */
foreach (review_store_load(review_store_path($config)) as $r) {
    if (($r['status'] ?? '') !== 'approved') {
        continue;                           /* nothing publishes unapproved */
    }
    if ((int)($r['rating'] ?? 0) < MIN_STARS) {
        continue;
    }
    $out['reviews'][] = [
        'source' => 'site',
        'author' => (string)($r['author'] ?? ''),
        'url'    => '',
        'rating' => (int)$r['rating'],
        'text'   => (string)($r['text'] ?? ''),
        'time'   => (string)($r['created'] ?? ''),
        'ago'    => '',
    ];
}

/* Newest first, then keep five. A new review anywhere pushes the oldest out. */
usort($out['reviews'], static fn(array $a, array $b): int => strcmp($b['time'], $a['time']));
$out['reviews'] = array_slice($out['reviews'], 0, MAX_SHOWN);

echo json_encode($out, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
