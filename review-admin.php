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

session_start();
header('X-Robots-Tag: noindex, nofollow');
header('Referrer-Policy: same-origin');

require __DIR__ . '/review-store.php';

$config = is_file(__DIR__ . '/config.php') ? require __DIR__ . '/config.php' : [];
$hash   = (string)($config['admin_password_hash'] ?? '');
$file   = review_store_path($config);

function load(string $file): array { return review_store_load($file); }
function save(string $file, array $rows): void { review_store_save($file, $rows); }

$error = '';

/* ------------------------------------------------------------------ login */
if (($_POST['action'] ?? '') === 'login') {
    if ($hash === '') {
        $error = 'Δεν έχει οριστεί κωδικός στο config.php.';
    } elseif (password_verify((string)($_POST['password'] ?? ''), $hash)) {
        session_regenerate_id(true);
        $_SESSION['vetcare_admin'] = true;
        $_SESSION['csrf'] = bin2hex(random_bytes(16));
    } else {
        /* Slow a guesser down without locking the clinic out. */
        usleep(400000);
        $error = 'Λάθος κωδικός.';
    }
}

if (($_GET['logout'] ?? '') === '1') {
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
  <form class="login" method="post">
    <input type="hidden" name="action" value="login">
    <div class="field">
      <label for="pw">Κωδικός</label>
      <input type="password" id="pw" name="password" autocomplete="current-password" required>
    </div>
    <button class="btn" type="submit">Σύνδεση</button>
  </form>
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
        <span class="rv__stars" aria-label="<?= (int)($r['rating'] ?? 0) ?> στα 5"><?= str_repeat('★', (int)($r['rating'] ?? 0)) ?><?= str_repeat('☆', 5 - (int)($r['rating'] ?? 0)) ?></span>
        <span class="tag tag--wait">Σε αναμονή</span>
        <span class="rv__meta"><?= e(substr((string)($r['created'] ?? ''), 0, 10)) ?><?= !empty($r['email']) ? ' · ' . e($r['email']) : '' ?></span>
      </div>
      <p class="rv__text"><?= e($r['text'] ?? '') ?></p>
      <div class="rv__actions">
        <form method="post"><input type="hidden" name="action" value="moderate"><input type="hidden" name="csrf" value="<?= e($_SESSION['csrf'] ?? '') ?>"><input type="hidden" name="id" value="<?= e($r['id'] ?? '') ?>"><input type="hidden" name="do" value="approve"><button class="btn btn--forest" type="submit">Έγκριση</button></form>
        <form method="post" onsubmit="return confirm('Οριστική διαγραφή αυτής της κριτικής;');"><input type="hidden" name="action" value="moderate"><input type="hidden" name="csrf" value="<?= e($_SESSION['csrf'] ?? '') ?>"><input type="hidden" name="id" value="<?= e($r['id'] ?? '') ?>"><input type="hidden" name="do" value="delete"><button class="btn btn--ghost" type="submit">Διαγραφή</button></form>
      </div>
    </article>
  <?php endforeach; ?>

  <h2 style="margin-top:2.5rem">Δημοσιευμένες (<?= count($live) ?>)</h2>
  <?php if (!$live): ?><p class="admin__empty">Καμία δημοσιευμένη κριτική ακόμη.</p><?php endif; ?>
  <?php foreach ($live as $r): ?>
    <article class="rv">
      <div class="rv__top">
        <span class="rv__name"><?= e($r['author'] ?? '') ?></span>
        <span class="rv__stars"><?= str_repeat('★', (int)($r['rating'] ?? 0)) ?><?= str_repeat('☆', 5 - (int)($r['rating'] ?? 0)) ?></span>
        <span class="tag tag--live">Δημοσιευμένη</span>
        <span class="rv__meta"><?= e(substr((string)($r['created'] ?? ''), 0, 10)) ?></span>
      </div>
      <p class="rv__text"><?= e($r['text'] ?? '') ?></p>
      <div class="rv__actions">
        <form method="post"><input type="hidden" name="action" value="moderate"><input type="hidden" name="csrf" value="<?= e($_SESSION['csrf'] ?? '') ?>"><input type="hidden" name="id" value="<?= e($r['id'] ?? '') ?>"><input type="hidden" name="do" value="hide"><button class="btn btn--ghost" type="submit">Απόσυρση</button></form>
        <form method="post" onsubmit="return confirm('Οριστική διαγραφή αυτής της κριτικής;');"><input type="hidden" name="action" value="moderate"><input type="hidden" name="csrf" value="<?= e($_SESSION['csrf'] ?? '') ?>"><input type="hidden" name="id" value="<?= e($r['id'] ?? '') ?>"><input type="hidden" name="do" value="delete"><button class="btn btn--ghost" type="submit">Διαγραφή</button></form>
      </div>
    </article>
  <?php endforeach; ?>
<?php endif; ?>
</main>
</body>
</html>
