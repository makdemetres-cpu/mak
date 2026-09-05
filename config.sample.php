<?php
/**
 * Vet Care — server-side settings
 * ---------------------------------------------------------------------------
 * COPY THIS FILE TO config.php AND FILL IT IN. config.php is deliberately kept
 * out of git (see .gitignore) because it holds an API key and a password hash.
 *
 * Nothing here is ever sent to the browser: reviews.php and the review
 * endpoints read it on the server and return only the finished data.
 */

return [
    /* ---------------------------------------------------------------------
     * Google reviews
     * ---------------------------------------------------------------------
     * 1. Create a project at https://console.cloud.google.com/ and switch on
     *    billing (reviews are a paid SKU, though a small site normally stays
     *    inside the monthly free allowance).
     * 2. Enable "Places API (New)".
     * 3. Create an API key, then RESTRICT IT: Application restrictions →
     *    IP addresses → your Hostinger server's IP; API restrictions →
     *    Places API (New) only. The key lives on the server, but restricting
     *    it means a leak cannot be abused.
     * 4. Find the clinic's Place ID with Google's Place ID Finder:
     *    https://developers.google.com/maps/documentation/places/web-service/place-id
     *    Search "Vet Care Δημοκρατίας 149 Οβρυά" and copy the ChIJ… value.
     *
     * Leave either value empty and the reviews section still renders — it just
     * shows the rating summary and the two buttons instead of review cards.
     * It will never invent reviews to fill the space.
     */
    'google_api_key'  => '',
    'google_place_id' => '',

    /* ---------------------------------------------------------------------
     * Moderation for reviews left on the website
     * ---------------------------------------------------------------------
     * Generate the hash by running this once on the server (or locally):
     *   php -r "echo password_hash('your-chosen-password', PASSWORD_DEFAULT), PHP_EOL;"
     * Paste the result below. Never store the plain password here.
     */
    'admin_password_hash' => '',

    /* Where submitted reviews are kept. The default sits under data/, which is
     * blocked from the web by data/.htaccess. Safer still on Hostinger: move it
     * above public_html, e.g. __DIR__ . '/../vetcare-data/reviews.json.php'. */
    'reviews_file' => __DIR__ . '/data/reviews.json.php',
];
