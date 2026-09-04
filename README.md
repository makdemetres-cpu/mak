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
| **Netlify** | Connect the repo, or drag the folder onto the dashboard. No build command, publish directory `.` | `netlify.toml`, `_headers` |
| **Cloudflare Pages** | Connect the repo. Framework preset "None", build command empty, output directory `/` | `_headers` |
| **Vercel** | `vercel --prod` from this folder, or connect the repo | `vercel.json` |
| **GitHub Pages / any static host** | Upload everything as-is | — |

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

## Making the booking form deliver email

Out of the box the form needs **zero configuration**: pressing *Send* opens the
visitor's own email client with the request pre-filled and addressed to
`info@vet-care.gr`. Nothing is broken on a fresh deploy, and no data passes
through a third party.

To have requests arrive automatically instead:

1. Open **`js/booking.js`** and set the endpoint near the top:
   ```js
   var ENDPOINT = "https://formspree.io/f/XXXXXXX";   // or your own /api/booking
   ```
   The form then sends a JSON `POST` with `name`, `phone`, `email`, `animal`,
   `date`, `slot`, `message`, `language`. A failed request falls back to a clear
   error telling the visitor to phone instead.
2. **Update the privacy policy to match.** `privacy.html` currently describes
   the mailto behaviour truthfully (§ 2.1) and says no data is stored in any
   database. If you route the form through a service, that service becomes a
   data processor: name it in § 5, and check in § 6 whether it stores data
   outside the EEA. There are `TODO` comments at both spots in the HTML.

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
| **Social media links** | `index.html`, Contact section | The `href="#"` placeholders and the "links will go live once confirmed" note should both go once the real Facebook / Instagram URLs are known. |
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
css/fonts.css         self-hosted Alegreya + Alegreya Sans (Greek + Latin subsets)
css/style.css         the whole design system — tokens at the top, sections in order
js/head.js            marks the document script-capable before first paint
js/i18n.js            every string on the site, in Greek and English
js/consent.js         the cookie banner and preference dialog
js/booking.js         booking form validation and delivery
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
