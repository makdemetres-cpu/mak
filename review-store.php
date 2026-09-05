<?php
/**
 * Vet Care — shared storage for reviews left on the website
 * ---------------------------------------------------------------------------
 * The store is a JSON file, which is plenty for a clinic's volume and needs no
 * database setup on Hostinger. Two things keep it out of public view:
 *
 *   1. data/.htaccess denies the directory — but .htaccess only works on
 *      Apache/LiteSpeed, and a misconfigured or different server would ignore
 *      it. So it cannot be the only defence.
 *   2. The file is named .php and begins with an exit guard, so even if a
 *      server hands it out directly it executes as PHP and returns nothing.
 *
 * Safest of all is to move it above the web root entirely — set 'reviews_file'
 * in config.php to something like __DIR__ . '/../vetcare-data/reviews.json.php'.
 */

declare(strict_types=1);

/* Anything fetching the raw file gets a 404 and no data. */
const REVIEW_STORE_GUARD = "<?php http_response_code(404); exit; ?>\n";

function review_store_path(array $config): string {
    return (string)($config['reviews_file'] ?? __DIR__ . '/data/reviews.json.php');
}

function review_store_decode(string $contents): array {
    if (str_starts_with($contents, '<?php')) {
        $break = strpos($contents, "?>");
        $contents = $break === false ? '' : substr($contents, $break + 2);
    }
    $rows = json_decode(trim($contents), true);
    return is_array($rows) ? $rows : [];
}

function review_store_load(string $file): array {
    if (!is_file($file)) return [];
    return review_store_decode((string)file_get_contents($file));
}

function review_store_save(string $file, array $rows): bool {
    $dir = dirname($file);
    if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) return false;
    $payload = REVIEW_STORE_GUARD . json_encode(
        array_values($rows),
        JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT
    );
    /* Write to a temporary file and move it into place, so a crash mid-write
       cannot leave a half-written store behind. */
    $tmp = $file . '.tmp';
    if (file_put_contents($tmp, $payload, LOCK_EX) === false) return false;
    return rename($tmp, $file);
}
