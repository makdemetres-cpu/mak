<?php
/* ==========================================================================
   Χρόνης Πέγκας Photography — self-hosted enquiry handler
   --------------------------------------------------------------------------
   The most privacy-clean of the three form modes: the message goes straight
   from this server to his inbox. No third-party processor, so nothing to
   name under GDPR Art. 28 and no transfer question under Art. 44-49.

   Requires PHP with mail() available — standard on any Greek cPanel host
   (Papaki, Top.host, IP.gr). It will NOT run on Netlify, Vercel or GitHub
   Pages, which serve static files only; use one of the other two modes there.

   TO ENABLE:
     1. Set FORM_MODE = "php" in js/contact.js
     2. Set $TO below to the address enquiries should reach
     3. Set $FROM to a real mailbox on this domain — see the note there,
        this is the single most common reason these emails vanish
   ========================================================================== */

declare(strict_types=1);

$TO = 'xpegkas@gmail.com';

/* The envelope sender. It MUST be a mailbox on this site's own domain.
   Putting the visitor's address here makes the message fail SPF and DKIM at
   Gmail, which is exactly how contact forms end up silently in spam. The
   visitor's address goes in Reply-To instead, so hitting reply still works. */
$FROM      = 'no-reply@example.gr';          // ← CHANGE to a real mailbox on the domain
$FROM_NAME = 'Pegkas Photography website';

$MAX_PER_HOUR = 8;      // per IP address
$LOG_CONSENT  = true;   // keep a consent record (GDPR Art. 7(1))

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function fail(string $msg, int $code = 400): void {
    http_response_code($code);
    // A generic message: never reflect the submitted values back, and never
    // reveal which check failed to whoever is probing.
    echo json_encode(['success' => false, 'message' => $msg], JSON_UNESCAPED_UNICODE);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    fail('Method not allowed', 405);
}

/* ---------------------------------------------------------------- input --
   Accepts either a JSON body (what js/contact.js sends) or a normal form
   POST, so the form still works if JavaScript is unavailable. */
$raw  = file_get_contents('php://input');
$data = [];
if ($raw !== false && $raw !== '' && str_contains((string)($_SERVER['CONTENT_TYPE'] ?? ''), 'json')) {
    $decoded = json_decode($raw, true);
    if (is_array($decoded)) { $data = $decoded; }
} else {
    $data = $_POST;
}

function field(array $d, string $k, int $max): string {
    $v = isset($d[$k]) && is_scalar($d[$k]) ? trim((string)$d[$k]) : '';
    // Strips control characters, but DELIBERATELY leaves tab (\x09), LF
    // (\x0A) and CR (\x0D) alone — a multi-line message has to keep its
    // newlines. Header injection is therefore blocked separately, by the
    // explicit CR/LF check on $name and $email below. Do not "tidy" that
    // check away on the assumption this line already handled it.
    $v = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $v) ?? '';
    return mb_substr($v, 0, $max);
}

/* Honeypot: a hidden field only a bot fills in. Answer 200 so the bot learns
   nothing, but send no mail. */
if (field($data, 'website', 200) !== '') {
    echo json_encode(['success' => true]);
    exit;
}

$name    = field($data, 'name', 120);
$email   = field($data, 'email', 190);
$phone   = field($data, 'phone', 40);
$date    = field($data, 'date', 30);
$type    = field($data, 'type', 40);
$message = field($data, 'message', 5000);
$consent = !empty($data['consent']);

if ($name === '' || $email === '' || $message === '') {
    fail('Missing required fields', 422);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    fail('Invalid email address', 422);
}
/* Belt and braces: no CR/LF may reach a mail header, ever. */
if (preg_match('/[\r\n]/', $name . $email)) {
    fail('Invalid input', 422);
}
if (!$consent) {
    fail('Consent is required', 422);
}
if (!in_array($type, ['wedding', 'christening', 'event', 'other', ''], true)) {
    $type = 'other';
}

/* ------------------------------------------------------------ rate limit --
   Crude but effective against the usual scripted spam. Keyed on a hash of
   the IP, never the IP itself, so the throttle file holds no personal data. */
$ip  = (string)($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
$key = hash('sha256', $ip . '|' . date('Y-m-d-H'));
$throttle = sys_get_temp_dir() . '/xp_rate_' . $key;

$count = is_file($throttle) ? (int)file_get_contents($throttle) : 0;
if ($count >= $MAX_PER_HOUR) {
    fail('Too many requests. Please email us directly.', 429);
}
file_put_contents($throttle, (string)($count + 1), LOCK_EX);

/* ------------------------------------------------------------------ mail --*/
$typeLabels = [
    'wedding'     => 'Γάμος / Wedding',
    'christening' => 'Βάπτιση / Christening',
    'event'       => 'Εκδήλωση / Event',
    'other'       => 'Άλλο / Other',
];

$lines = [
    'Νέο μήνυμα από τον ιστότοπο — New website enquiry',
    str_repeat('-', 52),
    '',
    'Όνομα / Name:      ' . $name,
    'Email:             ' . $email,
    'Τηλέφωνο / Phone:  ' . ($phone !== '' ? $phone : '—'),
    'Ημερομηνία / Date: ' . ($date !== '' ? $date : '—'),
    'Τύπος / Type:      ' . ($typeLabels[$type] ?? '—'),
    '',
    'Μήνυμα / Message:',
    $message,
    '',
    str_repeat('-', 52),
];

if ($LOG_CONSENT) {
    $lines[] = 'Συγκατάθεση / Consent given: ναι / yes';
    $lines[] = 'Χρόνος / Timestamp: ' . gmdate('c');
    $lines[] = 'Πολιτική Απορρήτου / Privacy policy version: 1.0';
}

$body    = implode("\n", $lines);
$subject = 'Website enquiry — ' . $name;

/* Encode the subject so Greek characters survive; mail headers are ASCII. */
$encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
$encodedFrom    = '=?UTF-8?B?' . base64_encode($FROM_NAME) . '?=';

$headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'From: ' . $encodedFrom . ' <' . $FROM . '>',
    'Reply-To: ' . $email,
    'X-Mailer: PHP/' . phpversion(),
];

$sent = @mail($TO, $encodedSubject, $body, implode("\r\n", $headers), '-f' . $FROM);

if (!$sent) {
    fail('Could not send the message', 500);
}

echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE);
