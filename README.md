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
| **GitHub Pages** | Settings → Pages → branch, folder `/ (root)`. Preview only — it cannot run PHP | `.nojekyll` |

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
| **Testimonials** | not built | The real Google rating (4.7★, 46 reviews) is shown with attribution, but no review text was available, so no testimonials section was invented. If you want one, paste real review text with the reviewer's permission. |

---

## How the site is put together

```
index.html            one-page site: hero, story, services, booking, find us, contact
privacy.html          GDPR privacy policy (bilingual)
cookies.html          cookie / tracker policy (bilingual)
404.html              custom not-found page
send.php              optional: makes the form deliver on its own (see above)
.htaccess             Hostinger/Apache config: 404, headers, caching, gzip
css/fonts.css         self-hosted Alegreya + Alegreya Sans (Greek + Latin subsets)
css/style.css         the whole design system — tokens at the top, sections in order
js/head.js            marks the document script-capable before first paint
js/i18n.js            every string on the site, in Greek and English
js/consent.js         the cookie banner and preference dialog
js/booking.js         booking form validation and delivery
js/ui-controls.js     branded dropdown + date picker (see below)
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
