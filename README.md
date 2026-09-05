# Vet Care — Κτηνιατρικό Κέντρο, Οβρυά Πατρών

A bilingual (Greek / English) website for the **Vet Care** veterinary centre at
Δημοκρατίας 149, Οβρυά, Πάτρα. Plain HTML, CSS and JavaScript — **no build step,
no framework, no dependencies, no third-party requests at runtime.**

---

## Running it locally

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

Any static file server works (`npx serve`, VS Code Live Server…). Don't open
`index.html` straight off the disk with `file://` — the relative paths for the
fonts and the icon sprite need a real server.

## Deploying

The repository root **is** the site. Pick whichever host you prefer:

| Host | What to do | Config already in the repo |
|---|---|---|
| **Hostinger** (current target) | Upload the contents of this folder into `public_html` via hPanel → File Manager, or over FTP | `.htaccess` |
| **Netlify** | Connect the repo, or drag the folder onto the dashboard. No build command, publish directory `.` | `netlify.toml`, `_headers` |
| **Cloudflare Pages** | Connect the repo. Framework preset "None", build command empty, output directory `/` | `_headers` |
| **Vercel** | `vercel --prod` from this folder, or connect the repo | `vercel.json` |
| **GitHub Pages** | Settings → Pages → branch, folder `/ (root)`. Good for previewing: everything works except the parts that need PHP — the live Google feed, and sending a booking request or a review to the server. The four quoted reviews still show, read straight from `curated-reviews.json` | `.nojekyll` |

Each host reads only its own file and ignores the others, so they can all live
in the repo together. On Hostinger that means **`.htaccess`** — it sets the
custom 404, the security headers, caching and compression, and has a
commented-out https redirect to switch on once the certificate is live.

`404.html` is picked up automatically by all three as the not-found page.

The configs set caching (fonts and artwork for a year, HTML always revalidated)
and security headers, including a Content-Security-Policy of
`script-src 'self'` with no `unsafe-inline` — verified in a real browser with no
violations. If you later add any third-party script, that header needs updating
or the script will be blocked.

Before going live, replace `https://www.vet-care.gr/` with the real domain in
`sitemap.xml`, `robots.txt`, and the `canonical` / `og:url` / `og:image` tags at
the top of `index.html`, `privacy.html`, `cookies.html` and `404.html`.

---

## The booking form: two modes

**Mode 1 — email app (how it ships).** Pressing *Send request* opens the
visitor's own mail client with the whole request pre-filled and addressed to
`info@vet-care.gr`; they press Send there. Nothing is stored anywhere and no
third party is involved.

Because a visitor may have no mail client set up — common on desktop — the form
does not simply claim an email is on its way. It watches whether the page
actually loses focus to another app, and if nothing takes over within a moment
it says so plainly and shows an escape hatch under the form: **copy the request
to the clipboard**, **open a mail link**, or **call the clinic**. The typed
details stay in the form throughout. There is also a line above the button
telling the visitor this happens, so it is never a surprise.

Honest summary: in this mode nothing arrives automatically. It is a sane
stopgap, not a long-term answer for a clinic that wants bookings to land in an
inbox by themselves.

**Mode 2 — the site sends it itself (recommended on Hostinger).**
`send.php` ships ready to use. To switch over:

1. Make sure `send.php` is uploaded next to `index.html`.
2. In `js/booking.js`, set:
   ```js
   var ENDPOINT = "send.php";
   ```
3. Open `send.php` and set `FROM` to a mailbox **on your own domain** (create
   `noreply@vet-care.gr` in hPanel → Emails). Mail sent with a `From:` on
   gmail.com or similar is rejected or spam-filed by most providers — this is
   the single most common reason a contact form "doesn't work".
4. Send yourself a test request.

The script validates the input, strips CR/LF from every header field to close
the classic `mail()` header-injection hole, honours the same hidden spam trap as
the browser, and sets `Reply-To` to the visitor so replying in your mail client
goes straight back to them. It **stores nothing** — no database, no log, no copy
on disk — which is why turning it on needs only a small edit to `privacy.html`
§ 2.1 (delivery by the website rather than by your email app) and no new data
processor anywhere else.

If mail still does not arrive, `mail()` may be disabled on your plan. The fix is
to send over SMTP with PHPMailer using the mailbox credentials from hPanel; the
rest of `send.php` is unchanged. If the form ever fails mid-submission it falls
back to the same escape hatch as mode 1, so a request is never silently lost.

## Reviews

The section between Services and Booking shows up to **five 4- and 5-star
reviews**, from three sources: reviews quoted by hand from the Google listing
(always shown, first), then whatever the Google API returns and whatever the
clinic has approved from the website's own form, newest first. A new review
anywhere pushes the oldest off the page by itself.

### Reviews quoted by hand — `curated-reviews.json`

The four reviews on the site now were copied from the clinic's Google listing
into **`curated-reviews.json`**. This needs no Google account, no API key, no
card on file and no monthly quota.

It is also the one part of the section that needs **no server at all**. On a PHP
host `reviews.php` reads the file and merges it with everything else; on a host
that cannot run PHP — GitHub Pages, or opening the folder through any static
file server — `js/reviews.js` reads the very same file directly. One file, one
set of reviews, and they appear either way. What a static host cannot do is the
live Google feed or reviews left through the site's own form: both need a
server, so on GitHub Pages you see these four and nothing else.

Each entry has:

| Field | |
|---|---|
| `text` | the review, **word for word**, punctuation and typos included |
| `author` | the reviewer's name from Google — optional |
| `rating` | 4 or 5 — optional |
| `translation` | English, shown labelled as a translation under the Greek when a visitor switches language — optional |
| `date` | `YYYY-MM-DD`, used only for ordering — optional |
| `show` | set to `false` to take one down without deleting it |

`author` and `rating` are optional and **nothing is invented to fill them in**:
with no name the card shows no name, with no rating it shows no stars. All four
entries currently carry the reviewer's name and their 5-star rating, copied
from the listing.

Only ever paste reviews that are genuinely on the listing. An invented
testimonial is unlawful under the Unfair Commercial Practices Directive as
amended by the Omnibus Directive, and readers spot them anyway.

The **"see more"** button beside *Leave a review* opens the Google listing,
where every review can be read. Its address comes from `google_listing_url` in
`config.php` when set, otherwise from the API or Place ID, and failing all of
those from a Google Maps search for the clinic by name and street. To set it
exactly: open the clinic on Google Maps, press **Share**, and paste what it
gives you into `config.php` — no API key needed.

### Google reviews — what you need to set up

This part is **optional**. Skip it and the section still works: the quoted
reviews and any left through the site's own form are shown, and the rating
summary line simply stays hidden. Set it up and the section also carries the
live 4- and 5-star reviews and the clinic's current score.

**Any Google account will do.** This reads public place data, so you do not need
to own the clinic's Google Business listing — ownership only matters for replying
to reviews and editing the listing. Whoever's account holds the billing is the
one who pays, so moving it to the clinic's own account later is tidier for a
long-lived site; swapping the key is a one-line change.

1. Copy `config.sample.php` to **`config.php`** (it is git-ignored, because it
   holds an API key).
2. In Google Cloud: create a project, **enable billing** (a card is required
   even inside the free allowance), enable **Places API (New)** — not the older
   legacy "Places API" — create an API key, and restrict it: Application
   restrictions → IP addresses → your Hostinger server IP; API restrictions →
   Places API (New).
3. **Cap the daily quota** — APIs & Services → Places API (New) → Quotas → set
   requests per day to about 30. See the cost note below for why this matters.
4. Find the clinic's **Place ID** with Google's
   [Place ID Finder](https://developers.google.com/maps/documentation/places/web-service/place-id)
   and paste both values into `config.php`.

Three things worth understanding before you switch it on:

- **Google's API returns at most 5 reviews, ever.** There is no pagination. That
  is why *"see all reviews"* is a link out to the Google listing rather than a
  longer list on the site — nobody can build the latter from this API.
- **Review text may not be stored, and it is the dearest field Google sells.**
  Their policy allows place IDs to be kept indefinitely but requires ratings and
  reviews to be *"requested live and not warehoused"*, so `reviews.php` calls
  Google per page view and caches nothing. `reviews` sits in the **Enterprise +
  Atmosphere** field tier, and a request is billed at the highest tier it
  touches; the free allowance there is roughly **1,000 calls a month**, about 33
  views of the section per day. `js/reviews.js` only fetches once the section
  scrolls into view, so a visitor who never reaches it costs nothing — but set
  the daily quota cap in step 3 and the question of a surprise bill goes away
  entirely. Check *APIs & Services → Metrics* after the first month to learn
  your real volume before raising it.
- **The key never reaches the browser.** The page calls our own `reviews.php`,
  which calls Google server-side. Leave `config.php` empty and nothing breaks —
  the section falls back to the reviews quoted by hand. It will never invent
  reviews.

### Reviews left on the website

`review-submit.php` stores submissions as **pending**. They appear publicly only
after approval in **`review-admin.php`**, which is password-protected — set
`admin_password_hash` in `config.php`:

```bash
php -r "echo password_hash('your-password', PASSWORD_DEFAULT), PHP_EOL;"
```

Moderation is not optional decoration. An unmoderated public form on a real
clinic's site attracts spam and abuse, and whatever appears there is published
by the clinic.

The store is a JSON file under `data/`, protected three ways: `data/.htaccess`
denies the directory, the file is named `.php` and starts with an exit guard so
a server that ignores `.htaccess` still returns nothing, and you can move it out
of the web root entirely by pointing `reviews_file` at, say,
`__DIR__ . '/../vetcare-data/reviews.json.php'` — the safest option on Hostinger.

Reviews are personal data: `privacy.html` § 2.6 covers what is stored, what is
published, the legal basis, and the right to have one removed. The form takes an
explicit tick before it can be sent, and only the display name and the text are
ever shown — the optional email is never published.

## Turning on analytics (only if you want it)

There is exactly one place where a non-essential script may start:
`runAnalytics()` in **`js/consent.js`**. It only ever runs after a visitor has
actively accepted. Drop your snippet in there — a cookieless option such as
Plausible keeps the current disclosures accurate — and then update the table in
`cookies.html` § 2 and the processors list in `privacy.html` § 5.

---

## Things the client still needs to fill in

Everything below is deliberately left blank or generic rather than invented.
Search the codebase for `TODO (client)` to find each one in place.

| What | Where | Why it's a placeholder |
|---|---|---|
| **Real photographs** | `index.html` — the two `.arch` blocks (hero and Our Story) | No photos of the clinic, interior or team were available. The site ships original illustrations instead; swap the `<img src>` for a real WebP/AVIF and keep the `.arch` wrapper, which does the framing (5:6 crop on desktop, 4:3 on phones). |
| **Tax details** | `privacy.html` § 1 | ΑΦΜ, ΔΟΥ and the legal form of the business are required on a Greek commercial site and were not known. |
| **Hosting provider name** | `privacy.html` § 2.4 and § 5 | Fill in once you pick a host, along with where its servers are. |
| **Instagram** | not built | No Instagram account could be found for the clinic, so the button was removed rather than left pointing nowhere. To add one back: copy the Facebook `<a>` in the Contact section, swap the href, and re-add an `i-instagram` symbol to the sprite. |
| **Facebook link** | `index.html`, Contact section | Points at `facebook.com/kthniatrikokentrovetcare`, found by search and matching the clinic's name and city. It could not be opened from the build environment to confirm the address and phone — **click it once to check** before launch. |
| **Parking note** | `index.html`, Find Us section | A commented-out slot is ready; left out rather than guessed. |
| **The "everyday services" list** | `index.html`, `.svc-extra` | Vaccinations, microchipping, travel certificates, ultrasound, dental cleaning and "urgent cases by phone" are standard for a clinic of this kind but were **not** individually confirmed. Delete any line you don't actually offer. |
| **Testimonials** | built | Four real reviews, copied word for word from the Google listing into `curated-reviews.json`, plus the live feed and the site's own form. Nothing is invented: an entry with no name shows no name, and one with no rating shows no stars. |
| **The Google listing address** | `curated-reviews.json` → `"googleUrl"`, or `config.php` → `google_listing_url` | The *"see more"* button falls back to a Google Maps search for the clinic by name and street, which lands on the listing. For the exact address: Google Maps → **Share** → copy. No API key needed. Put it in the JSON and it works on a static host too. |

---

## How the site is put together

```
index.html            one-page site: hero, story, services, booking, find us, contact
privacy.html          GDPR privacy policy (bilingual)
cookies.html          cookie / tracker policy (bilingual)
404.html              custom not-found page
send.php              optional: makes the booking form deliver on its own
curated-reviews.json  reviews quoted by hand from the Google listing — read by
                      reviews.php on a PHP host and by js/reviews.js without one
reviews.php           serves the merged review feed (quoted + Google + site)
review-submit.php     receives a review left on the site, stores it as pending
review-admin.php      password-protected moderation screen
review-store.php      shared, guarded read/write for the review store
config.sample.php     copy to config.php and fill in (git-ignored)
.htaccess             Hostinger/Apache config: 404, headers, caching, gzip
css/fonts.css         self-hosted Alegreya + Alegreya Sans (Greek + Latin subsets)
css/style.css         the whole design system — tokens at the top, sections in order
js/head.js            marks the document script-capable before first paint
js/i18n.js            every string on the site, in Greek and English
js/consent.js         the cookie banner and preference dialog
js/booking.js         booking form validation and delivery
js/ui-controls.js     branded dropdown + date picker (see below)
js/reviews.js         renders the review section and the "leave a review" form
js/main.js            reveals, sticky header, mobile drawer, live opening status
assets/fonts/         12 woff2 files, ~243 KB total
assets/img/           original SVG artwork, the logo, favicon and the social card
```

A first visit in Greek downloads about **92 KB gzipped** across 15 files, all
from this domain.

### Editing text

Everything on the homepage and in the shared chrome lives in **`js/i18n.js`**
as a Greek/English key pair — edit the string there, not in the HTML. Elements
carry `data-i18n="key"` (plain text), `data-i18n-html="key"` (inline markup
allowed) or `data-i18n-attr="alt:key"` (attributes).

The long legal prose is the exception: it is written directly in
`privacy.html` and `cookies.html` inside `<div data-lang="el">` /
`<div data-lang="en">` blocks, because splitting it into keys would make it
unreadable. The same toggle shows and hides them.

### The dropdowns and the date picker

Browsers draw `<select>` popups and the native date calendar with operating-system
widgets that CSS cannot style, so `js/ui-controls.js` rebuilds both in the page.
It is an enhancement, not a replacement: the real `<select>` and
`<input type="date">` stay in the form and remain the source of truth, and the
custom UI writes back into them and fires the same `input`/`change` events. If
that script ever fails to load, the native controls simply reappear and the form
still works.

Two behaviours worth knowing:

- The calendar **greys out Saturdays and Sundays**, because the clinic is closed
  then, and anything before today. If the opening days ever change, edit
  `disabled()` in `js/ui-controls.js`.
- On screens under 620px both controls open as a **bottom sheet** rather than an
  anchored menu, since a menu near the bottom of a phone is out of thumb reach.

Keyboard support follows the ARIA select-only combobox pattern: arrows, Home/End,
Enter, Escape and type-ahead on the dropdown; arrows, PageUp/PageDown and Enter
on the calendar.

### Keeping the pages in sync

There is no template engine. The header, drawer, footer, action bar, cookie
banner and preference dialog are **duplicated** in all four HTML files. If you
change one — a new nav item, say — change it in all four.

### The bits that are deliberately unusual

- **No Google Maps iframe.** An embedded map contacts Google and sets cookies
  the moment the page loads, before anyone has consented. The Find Us section
  is a hand-drawn SVG in the site's own palette; tapping it opens the real Maps
  directions in a new tab.
- **Self-hosted fonts.** No request to `fonts.gstatic.com`, so no visitor IP is
  disclosed to a third country just to render text.
- **No cookies at all.** Two `localStorage` entries, both strictly necessary,
  both documented in `cookies.html`. The language entry is only written if the
  visitor actually switches language.
- **The consent banner re-asks after six months** — for acceptance and refusal
  alike. The reasoning, with the sources, is in the comment block at the top of
  `js/consent.js`.

---

## Accessibility and compliance status

Checked in a real browser (Chromium, desktop 1440px and phone 390px):

- Every text/background pair on all four pages meets **WCAG AA** contrast.
- Every visible control meets the **24×24 CSS px** target minimum (WCAG 2.5.8).
- All images carry `alt`; every icon-only control has an accessible name.
- Keyboard: visible focus rings throughout, skip link, Escape closes the drawer,
  focus is restored when it closes.
- `prefers-reduced-motion: reduce` disables every transform, transition and
  looping animation, and reveals everything immediately.
- With JavaScript disabled the whole site is readable and every link, phone
  number and the map still work.
- No third-party requests, and no storage of any kind, before consent.

Re-check these after any significant edit — particularly the contrast rule, since
`--sage-500` is a decorative green that is *not* safe for small text; use
`--sage-600` on light backgrounds and `--sage-300` on the dark footer.

## Licences

- **Alegreya** and **Alegreya Sans** by Juan Pablo del Peral / Huerta
  Tipográfica — SIL Open Font License 1.1, free for commercial web use, bundled
  in `assets/fonts/`.
- All illustrations, icons, the logo and the social card were drawn for this
  project and contain no third-party assets. No stock photography is used, so
  there is nothing to license or attribute.
