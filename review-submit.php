<?php
/**
 * Vet Care — receive a review left on the website
 * ---------------------------------------------------------------------------
 * Stores the review as PENDING. Nothing reaches the public page until someone
 * at the clinic approves it in review-admin.php. That is not optional polish:
 * an unmoderated public form on a real business's site attracts spam and abuse,
 * and the clinic is the publisher of whatever appears there.
 *
 * Data protection: a review is personal data — a name plus an opinion, made
 * public. The form takes an explicit tick before it can be sent, and
 * privacy.html § 2.6 says what is kept, for how long, and how to have it
 * removed. Only the display name the visitor chooses is published; the optional
 * email is kept solely so the clinic can come back to them, and is never shown.
 */

declare(strict_types=1);

require __DIR__ . '/review-store.php';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function reply(int $code, array $payload): never {
    http_response_code($code);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    reply(405, ['ok' => false, 'error' => 'method']);
}

$config = is_file(__DIR__ . '/config.php') ? require __DIR__ . '/config.php' : [];
$file   = review_store_path($config);

$raw = file_get_contents('php://input');
if ($raw === false || strlen($raw) > 20000) {
    reply(413, ['ok' => false, 'error' => 'too_large']);
}
$data = json_decode($raw, true);
if (!is_array($data)) {
    reply(400, ['ok' => false, 'error' => 'malformed']);
}

/* Same hidden trap as the booking form: answer 200 so a bot learns nothing. */
if (!empty($data['website'])) {
    reply(200, ['ok' => true]);
}

$clean = static function ($value, int $max): string {
    $value = is_string($value) ? trim($value) : '';
    $value = str_replace(["\r\n", "\r"], "\n", $value);
    return mb_substr($value, 0, $max);
};

$author = $clean($data['author'] ?? '', 60);
$email  = $clean($data['email'] ?? '', 160);
$text   = $clean($data['text'] ?? '', 1200);
$rating = (int)($data['rating'] ?? 0);

if ($author === '' || mb_strlen($author) < 2) {
    reply(422, ['ok' => false, 'error' => 'author']);
}
if ($rating < 1 || $rating > 5) {
    reply(422, ['ok' => false, 'error' => 'rating']);
}
if (mb_strlen($text) < 10) {
    reply(422, ['ok' => false, 'error' => 'text']);
}
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    reply(422, ['ok' => false, 'error' => 'email']);
}
if (empty($data['consent'])) {
    reply(422, ['ok' => false, 'error' => 'consent']);
}

$dir = dirname($file);
if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) {
    reply(500, ['ok' => false, 'error' => 'storage']);
}

/* A lock file, so two people submitting at the same instant cannot overwrite
   one another's review between the read and the write. */
$lock = fopen($file . '.lock', 'c');
if ($lock === false || !flock($lock, LOCK_EX)) {
    if ($lock !== false) {
        fclose($lock);
    }
    reply(500, ['ok' => false, 'error' => 'busy']);
}

$existing = review_store_load($file);

/* Light rate limit: one submission per address per hour, and the address is
   stored only as a salted hash so the file never holds a raw IP. */
$fingerprint = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . '|vetcare-reviews');
$hourAgo = time() - 3600;
foreach ($existing as $row) {
    if (($row['fingerprint'] ?? '') === $fingerprint
        && strtotime((string)($row['created'] ?? '')) > $hourAgo) {
        flock($lock, LOCK_UN);
        fclose($lock);
        reply(429, ['ok' => false, 'error' => 'rate']);
    }
}

$existing[] = [
    'id'          => bin2hex(random_bytes(8)),
    'status'      => 'pending',
    'author'      => $author,
    'email'       => $email,
    'rating'      => $rating,
    'text'        => $text,
    'created'     => gmdate('c'),
    'fingerprint' => $fingerprint,
];

$saved = review_store_save($file, $existing);
flock($lock, LOCK_UN);
fclose($lock);

if (!$saved) {
    reply(500, ['ok' => false, 'error' => 'storage']);
}

reply(200, ['ok' => true]);
