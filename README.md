# Χρόνης Πέγκας Photography

A single-page, bilingual (Ελληνικά / English) portfolio site for a wedding,
christening and event photographer based in Ioannina, Greece.

Plain HTML, CSS and JavaScript. No build step, no framework, no npm install —
upload the folder and it runs. Total page weight on first load is roughly
**480 KB**, most of which is photographs.

---

## ⚠️ Before you publish — the short list

Nothing here is optional. The first three are legal requirements.

| # | What | Where |
|---|------|-------|
| 1 | Fill in every yellow `[ΣΥΜΠΛΗΡΩΣΤΕ]` placeholder | `privacy.html`, `terms.html`, and the footer of every page |
| 2 | Replace the placeholder photographs with real ones | `assets/img/` |
| 3 | Confirm the Data Protection Authority's address is current | `privacy.html` §7 |
| 4 | Replace `https://www.example.gr/` with the real domain | `index.html`, `sitemap.xml`, `robots.txt` |
| 5 | Set the publication date on the three legal pages | `privacy.html`, `cookies.html`, `terms.html` |

The placeholders are **deliberately highlighted in yellow** on the live page.
That is intentional: an unfilled legal placeholder is the one thing that must
never ship quietly. When they are all filled in, the yellow disappears on its
own — there is no CSS to remove.

Search for them all at once:

```bash
grep -rn "ΣΥΜΠΛΗΡΩΣΤΕ\|example\.gr\|\[ΑΦΜ\]\|\[ΕΠΩΝΥΜΙΑ\]" --include="*.html" --include="*.xml" --include="*.txt" .
```

### The values you need to collect

- Full registered business name (πλήρης νόμιμη επωνυμία)
- Registered address, postcode, Ioannina — **this becomes public**
- ΑΦΜ and ΔΟΥ
- ΓΕΜΗ number, if the business has one
- Public telephone number
- Hosting provider name and the country its servers are in
- Accountant's name (named as a processor in `privacy.html` §4)
- How long photo archives are kept (`privacy.html` §3)
- Delivery times for the first selection and the full gallery (`index.html`, §03)
- Chronis' real story details: age when he started, year of the first wedding,
  roughly how many weddings since (`index.html`, §02)

---

## Replacing the photographs

Every file in `assets/img/` is a generated grey placeholder, not a real
photograph. **None of it is stock imagery**, so there is no licence to clear
and nothing to attribute — but none of it is his work either, and all of it
must be replaced.

Keep the same filenames and roughly the same dimensions:

| File | Size | Where it appears |
|------|------|------------------|
| `hero.jpg` | 2000 × 1250 | Full-width opening image |
| `work-01.jpg` … `work-09.jpg` | ≥1200 × 1500 | Portfolio grid |
| `portrait.jpg` | 1200 × 1500 | Portrait of Chronis, "Ο Χρόνης" section |
| `og-image.jpg` | 1200 × 630 | The preview card when the link is shared |
| `apple-touch-icon.png` | 180 × 180 | iOS home-screen icon |

Notes:

- **The grid crops every image to 4:5.** Portrait or landscape originals both
  work — the important part of the frame should be near the centre.
- Export at **JPEG quality 80–85, sRGB, longest edge 2000px**. Bigger files
  will not look better on screen and will make the site slow on 4G.
- The site renders photographs in black and white (`filter: grayscale(1)` in
  `css/style.css`). To show them in colour, delete those four declarations.
- If you change a photo's aspect ratio, update its `width` and `height`
  attributes in the HTML. They are there to reserve space while the image
  loads — without them the page jumps around as it loads, which Google
  measures and penalises.

### Changing the categories

Each grid item carries `data-cat="wedding|christening|event"`, which is what
the filter buttons match on. To add a category, add a filter button with a
matching `data-filter` value — the JavaScript needs no changes.

---

## Switching the palette

The site ships in direction **04 "Μελάνι"** — paper, ink, one hairline, and no
accent colour at all, so the only colour a visitor ever sees is in the
photographs themselves.

Three alternatives are pre-written at the top of `css/style.css`. Replace the
five values in the `PALETTE` block and the whole site changes; nothing else in
the stylesheet hard-codes a colour.

- **01 Πέτρα** — Old Town limestone, Epirot moss. Warmest, most traditional.
- **02 Παμβώτιδα** — mist over the lake. Cool and quiet.
- **03 Ασήμι** — near-black and oxidised silver, after Ioannina's silversmithing
  tradition. Dark; also swap the values inside the dark-theme blocks.

## Typography

**GFS Didot** for display, **Commissioner** for everything else — both served
from `assets/fonts/`, not from Google's CDN.

That is a legal choice, not a performance one. Loading fonts from
`fonts.googleapis.com` transmits every visitor's IP address to Google with no
legal basis, and a German court awarded damages against a site owner for
exactly that (LG München I, 20 Jan 2022, 3 O 17493/20). Self-hosting removes
the transfer completely. **Do not "optimise" this back to a Google Fonts
`<link>`.**

Both faces were verified to carry a full Greek character set before adoption.
This rules out most display serifs: Cormorant Garamond and Playfair Display —
the two faces nearly every wedding template uses — ship **no Greek glyphs at
all** and would silently fall back to a system font on the first Greek word.

---

## The contact form

Ships in **mailto mode**: submitting opens the visitor's own email client with
everything filled in, and no data is transmitted to any third party. It works
from the moment the site goes live and carries no processor liability.

To send messages directly instead, open `js/contact.js` and set:

```js
var FORM_ENDPOINT_KEY = "your-web3forms-access-key";
```

A key is free from [web3forms.com](https://web3forms.com) and arrives by email;
no account is needed. **If you switch this on, you must also:**

1. Name the provider as a processor in `privacy.html` §4 — the row is already
   written and marked, it just needs completing.
2. Check which country stores the submissions. If it is outside the EEA, state
   the transfer safeguard too (GDPR Art. 44–49). An EU-hosted form service
   avoids the question entirely.

The consent checkbox is required in both modes, is never pre-ticked, and blocks
submission until ticked. Pre-ticked consent boxes are invalid (GDPR Recital 32;
CJEU C-673/17 *Planet49*).

---

## Deploying

The site is a static folder. Every file in the root goes to the web root.

**Netlify / Vercel** — drag the folder onto the dashboard. `_redirects` wires up
the 404 page and `_headers` applies the security headers automatically.

**cPanel / Greek shared host (Papaki, Top.host…)** — upload everything to
`public_html/` over FTP. `.htaccess` handles the 404 page, HTTPS redirect and
security headers. Delete `_redirects` and `_headers`; they do nothing on Apache.

**GitHub Pages** — push and enable Pages. It serves `404.html` automatically but
**ignores `_headers` and `.htaccess`**, so the security headers below will not
be applied. Acceptable for a preview; use a real host for production.

### Security headers

`index.html` carries a Content-Security-Policy in a `<meta>` tag, which works
everywhere. But `frame-ancestors` — the directive that stops another site
embedding this one in an iframe to phish his clients — **cannot** be set from a
meta tag. It has to be a real HTTP header, which is what `_headers` and
`.htaccess` are for. Deploy one of them.

Verify after publishing at [securityheaders.com](https://securityheaders.com).

### After the domain is live

- Submit `sitemap.xml` to Google Search Console
- Test the share preview with Facebook's Sharing Debugger
- Re-run [PageSpeed Insights](https://pagespeed.web.dev) once the real
  photographs are in — they are the only thing heavy enough to affect the score

---

## Legal

Three pages, written for Greek and EU law rather than copied from a template:

- **`privacy.html`** — GDPR Art. 13 notice. Controller identity, what is
  collected and why, legal basis for each purpose, retention table, processors,
  transfers outside the EEA, all Art. 15–22 rights, and how to complain to the
  Αρχή Προστασίας Δεδομένων.
- **`cookies.html`** — the complete storage table. Two `localStorage` entries,
  both strictly necessary. No cookies in the technical sense are set at all.
- **`terms.html`** — provider identification (ΠΔ 131/2003), copyright in the
  photographs (ν. 2121/1993), an explicit AI-training reservation under Art. 4(3)
  of Directive (EU) 2019/790, liability, and Greek jurisdiction.

Points worth knowing:

- **Photographs of guests are personal data.** `privacy.html` §2(b) sets out the
  legal basis for photographing them (legitimate interest) separately from the
  basis for *publishing* them (explicit consent, always optional, never a
  condition of booking). Religious ceremony photographs may reveal religious
  belief, which is Art. 9 special-category data — hence the separate treatment.
- **The consent banner does not block the page.** Scrolling is never locked and
  nothing is stored before a choice, because consent must be freely given
  (Art. 4(11)). This was an explicit requirement and is verified by test.
- **Accept and Decline are styled identically.** Making reject less prominent
  than accept is a sanctioned dark pattern. Do not make Accept the primary
  button.
- **The ODR platform link is deliberately absent.** The EU's Online Dispute
  Resolution platform shut down in July 2025; templates that still link it are
  pointing at a dead service. `terms.html` §6 points at the Greek Consumer
  Ombudsman instead.

None of this is legal advice. For a first commercial site it is a genuinely
solid baseline, but a Greek lawyer should read the three pages once the
placeholders are filled in — an hour of their time is cheap next to a DPA
complaint.

---

## How it is built

```
index.html            Single scrolling page — hero, portfolio, story, approach, contact
privacy.html          GDPR privacy notice
cookies.html          Cookie / local storage policy
terms.html            Terms of use and copyright
404.html              Custom not-found page

css/fonts.css         Self-hosted @font-face declarations
css/style.css         Everything else. Palette tokens are at the top.

js/boot.js            Runs before first paint: marks JS available, restores language
js/strings.js         Strings JavaScript generates itself (ARIA labels, validation)
js/main.js            Navigation, language, scroll reveals, filtering, lightbox, back-to-top
js/consent.js         Cookie consent banner and preferences dialog
js/contact.js         Form validation and submission

assets/fonts/         GFS Didot + Commissioner, split by character subset (~114 KB)
assets/img/           Placeholder photographs — replace all of these
```

### Bilingual text

Both languages sit in the HTML as `data-lang-el` / `data-lang-en` pairs, and CSS
hides the inactive one. So the page reads correctly with JavaScript disabled,
both languages are visible to search engines, and switching costs one attribute
write rather than a re-render.

To edit copy, change **both** spans. `<option>` elements can't hold a span pair,
so those carry `data-el` / `data-en` attributes instead and `main.js` swaps the
label text.

### The scroll animations

Sections slide in from alternating sides using `IntersectionObserver`. There is
**not one scroll event listener in the codebase** — header state, active nav
link, reveals and the back-to-top button are all observer-driven, which the
browser evaluates off the main thread.

Three things keep it from misbehaving, all of which are load-bearing:

- Only `opacity` and `transform` are animated. Nothing triggers layout.
- The hidden state is scoped to `.js`, applied by `boot.js` before first paint.
  With JavaScript off, every section is simply visible — the page is never left
  blank waiting on an observer that will not run.
- `html { overflow-x: clip }` stops the sideways travel from creating a
  horizontal scrollbar. `clip` rather than `hidden`, because `hidden` silently
  breaks `position: sticky` on ancestors.

The horizontal travel is reduced on screens under 640px: a 34px slide reads as
a jolt on a phone and is the usual cause of the jitter these effects get blamed
for. `prefers-reduced-motion` disables the animation entirely.

---

## Verified

Checked in Chromium at 320 / 360 / 390 / 430 / 1440px:

- Zero horizontal overflow at every width, on every page
- No console errors and no failed requests, on every page
- Consent: banner appears, page still scrolls before choosing, nothing stored
  before a choice, granular save works, choice is timestamped and versioned,
  banner stays away on return
- Form: blocks empty submission, rejects malformed email, refuses to send
  without the privacy consent box, consent box is not pre-ticked
- Lightbox: opens, navigates, closes on Escape, traps focus, swipes on touch
- Renders correctly in dark mode, with reduced motion, and with JavaScript
  fully disabled
- All non-inline tap targets meet the WCAG 2.2 SC 2.5.8 24px minimum

Not yet checked, because this environment has no access to them: real Safari on
iOS, and Firefox.
