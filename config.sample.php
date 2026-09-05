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
     * ANY Google account works. This reads public place data, so you do NOT
     * need to be the owner of the clinic's Google Business listing — owning it
     * only matters for replying to reviews and editing the listing itself.
     * The account that holds the billing is the one that pays, so for a
     * long-lived site it is tidier to move this to the clinic's own account
     * eventually; swapping the key is a one-line change.
     *
     * 1. Create a project at https://console.cloud.google.com/ and switch on
     *    billing. Google requires a card on file before it will issue a key.
     * 2. Enable "Places API (New)" — not the older "Places API", which is a
     *    different, legacy product.
     * 3. Create an API key, then RESTRICT IT: Application restrictions →
     *    IP addresses → your Hostinger server's IP; API restrictions →
     *    Places API (New) only. The key lives on the server, but restricting
     *    it means a leak cannot be abused.
     * 4. CAP THE DAILY QUOTA. APIs & Services → Places API (New) → Quotas →
     *    set requests per day to ~30. Review text is billed in Google's
     *    dearest field tier (Enterprise + Atmosphere), whose free allowance is
     *    around 1,000 calls a month — roughly 33 views of the section per day.
     *    Because Google forbids storing review text, every view of that
     *    section is one call. With the cap set, going over simply means no
     *    reviews shown for the rest of that day, and never a bill.
     * 5. Find the clinic's Place ID with Google's Place ID Finder:
     *    https://developers.google.com/maps/documentation/places/web-service/place-id
     *    Search "Vet Care Δημοκρατίας 149 Οβρυά" and copy the ChIJ… value.
     *    The Place ID is not secret; only the API key is.
     *
     * Leave either value empty and the reviews section still renders — it just
     * shows the rating summary and the two buttons instead of review cards.
     * It will never invent reviews to fill the space.
     */
    'google_api_key'  => '',
    'google_place_id' => '',

    /* Where the "see more" button under the reviews sends people. This needs
     * NO API key and no Google Cloud account at all: open the clinic on Google
     * Maps, press Share, and paste the address here. Leave it empty and the
     * button simply does not appear. */
    'google_listing_url' => '',

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
