<?php
/**
 * Vet Care — booking request handler
 * ---------------------------------------------------------------------------
 * OPTIONAL. The site works without this file; it exists so the booking form can
 * deliver requests by itself on a PHP host such as Hostinger, with no
 * third-party form service and no API key.
 *
 * TO SWITCH IT ON
 *   1. Upload this file alongside index.html (it must sit in the same folder).
 *   2. In js/booking.js change the endpoint to:   var ENDPOINT = "send.php";
 *   3. Send yourself a test request and check it arrives.
 *
 * TWO THINGS TO CHECK FIRST
 *   · $FROM below must be an address ON YOUR OWN DOMAIN. Mail sent with a
 *     From: of gmail.com, etc. is rejected or spam-filed by most providers.
 *     Create noreply@vet-care.gr in the Hostinger email panel, or use any
 *     existing mailbox on the domain.
 *   · If mail still does not arrive, Hostinger's PHP mail() may be disabled on
 *     your plan. The fix is SMTP: install PHPMailer and send through the
 *     mailbox credentials instead. The rest of this file stays the same.
 *
 * PRIVACY: this script sends the request on and stores nothing — no database,
 * no log file, no copy on disk. That matches what privacy.html says today, so
 * turning it on does not require a policy change beyond §2.1, which should then
 * describe delivery by the website itself rather than by your email app.
 */

declare(strict_types=1);

const TO      = 'info@vet-care.gr';
const FROM    = 'noreply@vet-care.gr';   // must be on this domain — see above
const SUBJECT = 'Αίτημα ραντεβού από τον ιστότοπο';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function fail(int $code, string $message): never {
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    fail(405, 'Method not allowed');
}

$raw = file_get_contents('php://input');
if ($raw === false || strlen($raw) > 20000) {
    fail(413, 'Payload too large');
}

$data = json_decode($raw, true);
if (!is_array($data)) {
    fail(400, 'Malformed request');
}

/* Same spam trap as the client side: a filled hidden field means a bot.
   Answer 200 so it learns nothing, and send no mail. */
if (!empty($data['website'])) {
    echo json_encode(['ok' => true], JSON_UNESCAPED_UNICODE);
    exit;
}

$field = static function (array $d, string $key, int $max = 500): string {
    $value = isset($d[$key]) && is_string($d[$key]) ? trim($d[$key]) : '';
    /* Strip CR/LF: without this, a crafted value could inject extra mail
       headers (the classic mail() header-injection hole). */
    $value = str_replace(["\r", "\n", "%0a", "%0d"], ' ', $value);
    return mb_substr($value, 0, $max);
};

$name    = $field($data, 'name', 120);
$phone   = $field($data, 'phone', 40);
$email   = $field($data, 'email', 160);
$animal  = $field($data, 'animal', 80);
$date    = $field($data, 'date', 20);
$slot    = $field($data, 'slot', 80);
$message = isset($data['message']) && is_string($data['message'])
    ? mb_substr(trim($data['message']), 0, 2000)   /* newlines are fine in a body */
    : '';

if ($name === '' || $phone === '' || $animal === '') {
    fail(422, 'Missing required fields');
}
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    fail(422, 'Invalid email address');
}

$body = "Νέο αίτημα ραντεβού από τον ιστότοπο\n"
      . "=====================================\n\n"
      . "Ονοματεπώνυμο: {$name}\n"
      . "Τηλέφωνο:      {$phone}\n"
      . "Email:         " . ($email !== '' ? $email : '—') . "\n"
      . "Είδος ζώου:    {$animal}\n"
      . "Ημερομηνία:    " . ($date !== '' ? $date : '—') . "\n"
      . "Ώρα:           {$slot}\n\n"
      . "Λόγος επίσκεψης:\n"
      . ($message !== '' ? $message : '—') . "\n\n"
      . "-- \n"
      . "Στάλθηκε από τη φόρμα ραντεβού του vet-care.gr\n"
      . 'Ώρα: ' . (new DateTimeImmutable('now', new DateTimeZone('Europe/Athens')))->format('d/m/Y H:i') . "\n";

$headers = [
    'From: Vet Care <' . FROM . '>',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'MIME-Version: 1.0',
];
/* Reply-To only when the visitor gave an address, and only after validation —
   so "reply" in the clinic's mail client goes straight back to them. */
if ($email !== '') {
    $headers[] = 'Reply-To: ' . $email;
}

$encodedSubject = '=?UTF-8?B?' . base64_encode(SUBJECT . ' — ' . $name) . '?=';

if (!mail(TO, $encodedSubject, $body, implode("\r\n", $headers))) {
    fail(500, 'Mail delivery failed');
}

echo json_encode(['ok' => true], JSON_UNESCAPED_UNICODE);
