<?php
/**
 * Vet Care — review moderation
 * ---------------------------------------------------------------------------
 * A single password-protected page for approving, hiding or deleting reviews
 * left on the website. Nothing a visitor submits appears publicly until it is
 * approved here.
 *
 * Set 'admin_password_hash' in config.php first. Generate it with:
 *   php -r "echo password_hash('your-password', PASSWORD_DEFAULT), PHP_EOL;"
 *
 * Keep the URL to yourself. It is not linked from anywhere on the site and is
 * marked noindex, but it is only ever as private as the password.
 */

declare(strict_types=1);

/* The session cookie carries the only thing standing between a stranger and
   the reviewers' names and email addresses, so it is locked down before the
   session starts: unreadable to scripts, never sent to another site, and
   HTTPS-only wherever the site is served over HTTPS. */
session_set_cookie_params([
    'httponly' => true,
    'samesite' => 'Strict',
    'secure'   => (($_SERVER['HTTPS'] ?? '') !== '' && ($_SERVER['HTTPS'] ?? '') !== 'off')
        || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https',
]);
session_start();
header('X-Robots-Tag: noindex, nofollow');
header('Referrer-Policy: same-origin');
header('Cache-Control: no-store, private');

require __DIR__ . '/review-store.php';

$config = is_file(__DIR__ . '/config.php') ? require __DIR__ . '/config.php' : [];
$hash   = (string)($config['admin_password_hash'] ?? '');
$file   = review_store_path($config);

/* ------------------------------------------------------- brute-force guard
   A single password protects this page, and a pause between attempts does not
   slow an attacker who simply opens fifty connections at once — each one waits
   in parallel. So failures are counted and remembered instead: after enough of
   them from one address, that address is refused for a while, whether or not
   it then guesses correctly. Counting is per address, so an attacker can never
   lock the clinic out of its own page. */
const LOGIN_MAX_FAILURES = 8;
const LOGIN_LOCKOUT_SECONDS = 900;   /* 15 minutes */

$attemptsFile = dirname($file) . '/login-attempts.json.php';

function login_attempts_load(string $file): array {
    if (!is_file($file)) return [];
    $rows = review_store_decode((string)file_get_contents($file));
    /* Forget an address that has been quiet for a day, so the file cannot grow
       forever. Pruning on 'until' instead would drop every record that has not
       yet reached the lockout threshold — and the count would never build up. */
    $cutoff = time() - 86400;
    return array_filter(
        is_array($rows) ? $rows : [],
        static fn($r) => is_array($r) && (int)($r['seen'] ?? 0) > $cutoff
    );
}

/* Written here rather than through review_store_save(), which renumbers rows
   with array_values() — correct for a list of reviews, fatal for a map keyed
   by address: the keys would be thrown away and no count would ever match. */
function login_attempts_save(string $file, array $rows): void {
    $dir = dirname($file);
    if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) return;
    $payload = REVIEW_STORE_GUARD . json_encode((object)$rows, JSON_UNESCAPED_UNICODE);
    $tmp = $file . '.tmp';
    if (file_put_contents($tmp, $payload, LOCK_EX) !== false) {
        rename($tmp, $file);
    }
}

$who = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . '|vetcare-admin');
$attempts = login_attempts_load($attemptsFile);
$lockedUntil = (int)($attempts[$who]['until'] ?? 0);
$lockedOut = $lockedUntil > time();

function load(string $file): array { return review_store_load($file); }
function save(string $file, array $rows): void { review_store_save($file, $rows); }

$error = '';

/* ------------------------------------------------------------------ login */
if (($_POST['action'] ?? '') === 'login') {
    if ($lockedOut) {
        $minutes = max(1, (int)ceil(($lockedUntil - time()) / 60));
        $error = 'Πολλές αποτυχημένες προσπάθειες. Δοκιμάστε ξανά σε ' . $minutes . ' λεπτά.';
    } elseif ($hash === '') {
        $error = 'Δεν έχει οριστεί κωδικός στο config.php.';
    } elseif (password_verify((string)($_POST['password'] ?? ''), $hash)) {
        session_regenerate_id(true);
        $_SESSION['vetcare_admin'] = true;
        $_SESSION['csrf'] = bin2hex(random_bytes(16));
        unset($attempts[$who]);                 /* a good login clears the slate */
        login_attempts_save($attemptsFile, $attempts);
    } else {
        usleep(400000);                          /* still slow a single guesser */
        $failures = (int)($attempts[$who]['n'] ?? 0) + 1;
        $attempts[$who] = [
            'n'     => $failures,
            'seen'  => time(),
            'until' => $failures >= LOGIN_MAX_FAILURES ? time() + LOGIN_LOCKOUT_SECONDS : 0,
        ];
        login_attempts_save($attemptsFile, $attempts);
        if ($failures >= LOGIN_MAX_FAILURES) {
            $error = 'Πολλές αποτυχημένες προσπάθειες. Δοκιμάστε ξανά σε '
                . (int)ceil(LOGIN_LOCKOUT_SECONDS / 60) . ' λεπτά.';
            $lockedOut = true;
        } else {
            $error = 'Λάθος κωδικός.';
        }
    }
}

if (($_GET['logout'] ?? '') === '1') {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
    }
    session_destroy();
    header('Location: review-admin.php');
    exit;
}

$authed = !empty($_SESSION['vetcare_admin']);

/* --------------------------------------------------------------- moderate */
if ($authed && ($_POST['action'] ?? '') === 'moderate') {
    if (!hash_equals((string)($_SESSION['csrf'] ?? ''), (string)($_POST['csrf'] ?? ''))) {
        $error = 'Έληξε η συνεδρία. Δοκιμάστε ξανά.';
    } else {
        $rows = load($file);
        $id = (string)($_POST['id'] ?? '');
        $do = (string)($_POST['do'] ?? '');
        foreach ($rows as $i => $row) {
            if (($row['id'] ?? '') !== $id) continue;
            if ($do === 'approve')      $rows[$i]['status'] = 'approved';
            elseif ($do === 'hide')     $rows[$i]['status'] = 'pending';
            elseif ($do === 'delete')   unset($rows[$i]);
            break;
        }
        save($file, array_values($rows));
    }
}

$rows = $authed ? load($file) : [];
usort($rows, static fn($a, $b) => strcmp((string)($b['created'] ?? ''), (string)($a['created'] ?? '')));
$pending = array_values(array_filter($rows, static fn($r) => ($r['status'] ?? '') !== 'approved'));
$live    = array_values(array_filter($rows, static fn($r) => ($r['status'] ?? '') === 'approved'));

function e(?string $s): string { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }

/* str_repeat() throws on a negative count, so a rating outside 1-5 — only
   possible if the file were edited by hand — would blank the whole page. */
function stars(mixed $rating): string {
    $n = max(0, min(5, (int)$rating));
    return str_repeat('★', $n) . str_repeat('☆', 5 - $n);
}
?>
<!DOCTYPE html>
<html lang="el">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Κριτικές — διαχείριση | Vet Care</title>
<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="css/fonts.css">
<link rel="stylesheet" href="css/style.css">
<style>
  body { padding: 2rem 0 4rem; }
  .admin { max-width: 780px; margin-inline: auto; padding-inline: 1.25rem; }
  .admin h1 { font-size: var(--step-4); margin-bottom: 0.35rem; }
  .admin__intro { color: var(--text-soft); margin-bottom: 2rem; }
  .rv {
    display: grid; gap: 0.6rem; padding: 1.15rem 1.25rem; margin-bottom: 0.85rem;
    background: var(--white); border: 1px solid var(--line); border-radius: var(--radius-m);
    box-shadow: var(--shadow-s);
  }
  .rv__top { display: flex; flex-wrap: wrap; gap: 0.6rem 1rem; align-items: baseline; }
  .rv__name { font-weight: 700; color: var(--forest-900); }
  .rv__meta { font-size: 0.85rem; color: var(--text-soft); }
  .rv__stars { color: var(--ochre-400); letter-spacing: 0.08em; }
  .rv__text { white-space: pre-wrap; }
  .rv__actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .rv__actions .btn { min-height: 42px; padding-inline: 1rem; font-size: 0.9rem; }
  .tag { display: inline-block; padding: 0.15rem 0.6rem; border-radius: 999px; font-size: 0.75rem;
         font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
  .tag--live { background: #e7f2e9; color: #1d5230; }
  .tag--wait { background: var(--ochre-200); color: #6b4c11; }
  .admin__err { padding: 0.9rem 1.1rem; border-radius: var(--radius-m); background: #fdf3f1;
                border: 1px solid #eec6bd; color: #8c2c1b; margin-bottom: 1.25rem; }
  .admin__empty { color: var(--text-soft); padding: 1rem 0 2rem; }
  form.login { display: grid; gap: 0.85rem; max-width: 24rem; }
</style>
</head>
<body>
<main class="admin">
<?php if (!$authed): ?>
  <h1>Διαχείριση κριτικών</h1>
  <p class="admin__intro">Συνδεθείτε για να εγκρίνετε τις κριτικές που αφήνουν οι επισκέπτες.</p>
  <?php if ($error): ?><p class="admin__err"><?= e($error) ?></p><?php endif; ?>
  <?php if (!$lockedOut): ?>
  <form class="login" method="post">
    <input type="hidden" name="action" value="login">
    <div class="field">
      <label for="pw">Κωδικός</label>
      <input type="password" id="pw" name="password" autocomplete="current-password" required>
    </div>
    <button class="btn" type="submit">Σύνδεση</button>
  </form>
  <?php endif; ?>
<?php else: ?>
  <h1>Κριτικές</h1>
  <p class="admin__intro">
    Οι κριτικές εμφανίζονται στον ιστότοπο μόνο αφού τις εγκρίνετε εδώ.
    Στην αρχική σελίδα προβάλλονται οι <strong>πέντε νεότερες με 4 ή 5 αστέρια</strong>,
    μαζί με τις κριτικές από το Google. —
    <a href="review-admin.php?logout=1">Αποσύνδεση</a>
  </p>
  <?php if ($error): ?><p class="admin__err"><?= e($error) ?></p><?php endif; ?>

  <h2>Σε αναμονή (<?= count($pending) ?>)</h2>
  <?php if (!$pending): ?><p class="admin__empty">Καμία κριτική σε αναμονή.</p><?php endif; ?>
  <?php foreach ($pending as $r): ?>
    <article class="rv">
      <div class="rv__top">
        <span class="rv__name"><?= e($r['author'] ?? '') ?></span>
        <span class="rv__stars" aria-label="<?= (int)($r['rating'] ?? 0) ?> στα 5"><?= stars($r['rating'] ?? 0) ?></span>
        <span class="tag tag--wait">Σε αναμονή</span>
        <span class="rv__meta"><?= e(substr((string)($r['created'] ?? ''), 0, 10)) ?><?= !empty($r['email']) ? ' · ' . e($r['email']) : '' ?></span>
      </div>
      <p class="rv__text"><?= e($r['text'] ?? '') ?></p>
      <div class="rv__actions">
        <form method="post"><input type="hidden" name="action" value="moderate"><input type="hidden" name="csrf" value="<?= e($_SESSION['csrf'] ?? '') ?>"><input type="hidden" name="id" value="<?= e($r['id'] ?? '') ?>"><input type="hidden" name="do" value="approve"><button class="btn btn--forest" type="submit">Έγκριση</button></form>
        <form method="post" data-confirm="Οριστική διαγραφή αυτής της κριτικής;"><input type="hidden" name="action" value="moderate"><input type="hidden" name="csrf" value="<?= e($_SESSION['csrf'] ?? '') ?>"><input type="hidden" name="id" value="<?= e($r['id'] ?? '') ?>"><input type="hidden" name="do" value="delete"><button class="btn btn--ghost" type="submit">Διαγραφή</button></form>
      </div>
    </article>
  <?php endforeach; ?>

  <h2 style="margin-top:2.5rem">Δημοσιευμένες (<?= count($live) ?>)</h2>
  <?php if (!$live): ?><p class="admin__empty">Καμία δημοσιευμένη κριτική ακόμη.</p><?php endif; ?>
  <?php foreach ($live as $r): ?>
    <article class="rv">
      <div class="rv__top">
        <span class="rv__name"><?= e($r['author'] ?? '') ?></span>
        <span class="rv__stars"><?= stars($r['rating'] ?? 0) ?></span>
        <span class="tag tag--live">Δημοσιευμένη</span>
        <span class="rv__meta"><?= e(substr((string)($r['created'] ?? ''), 0, 10)) ?></span>
      </div>
      <p class="rv__text"><?= e($r['text'] ?? '') ?></p>
      <div class="rv__actions">
        <form method="post"><input type="hidden" name="action" value="moderate"><input type="hidden" name="csrf" value="<?= e($_SESSION['csrf'] ?? '') ?>"><input type="hidden" name="id" value="<?= e($r['id'] ?? '') ?>"><input type="hidden" name="do" value="hide"><button class="btn btn--ghost" type="submit">Απόσυρση</button></form>
        <form method="post" data-confirm="Οριστική διαγραφή αυτής της κριτικής;"><input type="hidden" name="action" value="moderate"><input type="hidden" name="csrf" value="<?= e($_SESSION['csrf'] ?? '') ?>"><input type="hidden" name="id" value="<?= e($r['id'] ?? '') ?>"><input type="hidden" name="do" value="delete"><button class="btn btn--ghost" type="submit">Διαγραφή</button></form>
      </div>
    </article>
  <?php endforeach; ?>
<?php endif; ?>
</main>
<script src="js/admin.js"></script>
</body>
</html>
