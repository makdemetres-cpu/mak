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

### The grid animation

Gallery items, the three approach steps and the services block all enter from
the left and right edges, alternating by position. That alternation is applied
in `js/main.js` to any container marked `data-reveal-sides`, rather than being
hard-coded in the HTML, because the direction has to follow position in the
group and filtering the gallery changes what is on screen without changing DOM
order.

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

Three delivery modes. Pick one with a single line at the top of `js/contact.js`:

```js
var FORM_MODE = "mailto";   // "mailto" | "php" | "web3forms"
```

### `"mailto"` — ships enabled

Opens the visitor's own email client with everything filled in. Nothing is
transmitted anywhere, no processor exists, no server is needed. Works on any
host from the moment the site goes live.

The catch: some visitors have no mail client configured and will just abandon
the enquiry. Fine as a launch default, worth upgrading later.

### `"php"` — recommended once he is on a Greek host

Posts to `contact.php` on this same domain, which emails him directly. **Still
no third party** — nothing to declare under GDPR Art. 28, and no transfer
question under Art. 44–49, because the data never leaves his own hosting. For a
Greek business this is the cleanest option there is.

Needs PHP with `mail()`: standard on Papaki, Top.host, IP.gr and any cPanel
host. **Not** available on Netlify, Vercel or GitHub Pages, which serve static
files only.

To enable, set `FORM_MODE = "php"` and open `contact.php`:

```php
$TO   = 'xpegkas@gmail.com';
$FROM = 'no-reply@example.gr';   // ← must be a real mailbox ON THIS DOMAIN
```

**`$FROM` is the one that catches people out.** It has to be an address on the
site's own domain. Putting the visitor's address there makes the message fail
SPF and DKIM at Gmail, which is precisely how contact-form mail ends up
silently in spam. The visitor's address goes in `Reply-To`, so hitting reply
still works normally.

The handler validates every field, refuses submissions without the consent
checkbox, blocks CR/LF header injection on the name and email, silently
absorbs honeypot hits so bots learn nothing, and throttles to 8 messages per
IP per hour. The throttle is keyed on a hash of the IP, never the IP itself,
so the throttle files hold no personal data.

### `"web3forms"` — easiest on a static host

Posts to `api.web3forms.com`. Get a free key at
[web3forms.com](https://web3forms.com) (no account; it arrives by email), set
`FORM_MODE = "web3forms"` and paste it into `WEB3FORMS_KEY`.

**If you switch this on you must also:**

1. Name Web3Forms as a processor in `privacy.html` §4 — the row is written and
   marked, it just needs completing.
2. Confirm which country stores the submissions. If it is outside the EEA,
   state the transfer safeguard as well (Art. 44–49). This is exactly the
   question the `"php"` mode avoids having to answer.

If this mode is selected but the key is empty, the form falls back to `mailto`
and logs a warning rather than posting enquiries into a void.

### In every mode

The consent checkbox is required, is never pre-ticked, and blocks submission
until ticked — pre-ticked consent boxes are invalid (GDPR Recital 32; CJEU
C-673/17 *Planet49*). Validation messages appear in whichever language the
visitor is reading.

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
- **The banner appears every time someone opens the site.** Not once and then
  never again: it reappears on each new browsing session. The visitor's saved
  choice stays in force and is pre-filled in the Manage panel throughout, so
  re-asking never quietly re-enables anything they turned off. Change this
  with `REASK` at the top of `js/consent.js` — `"session"` (current),
  `"remember"` (ask once, then quiet for 12 months), or `"always"` (every
  single page load, including moving to the privacy policy and back). All
  three are compliant; `"remember"` is the gentler one for returning
  visitors if the current behaviour proves annoying.
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
contact.php           Optional self-hosted form handler (only used in "php" mode)

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
- A rAF-throttled sweep backs the observer up. IntersectionObserver only
  reports an element when its intersection ratio *crosses* a threshold, and a
  hard fling on a long phone page can carry an element from below the fold to
  above it between two samples — ratio 0 both times, no threshold crossed, no
  callback, and that section stays invisible for good. Measured before the
  sweep existed: a fast scroll left **17 of 21 sections blank**. The sweep is
  passive, runs at most once per animation frame, only looks at elements not
  yet revealed, and removes its own listeners once none are left.

The horizontal travel is reduced on screens under 640px: a 34px slide reads as
a jolt on a phone and is the usual cause of the jitter these effects get blamed
for. `prefers-reduced-motion` disables the animation entirely.

---

## Accessibility

The palette carries **two** text tones, not three. A paler third tone was
tried (#9A9A98) and measured **2.51:1** against the tinted section background
— far below the WCAG AA minimum of 4.5:1 for text at that size. It is gone,
and there is a comment at the top of `css/style.css` saying so. Hierarchy
below the secondary tone is carried by size and letter-spacing instead. If
you lighten any text colour, re-check it: every text/background pair on the
site currently clears 4.5:1 in both light and dark themes.

Every non-inline interactive target meets the WCAG 2.2 SC 2.5.8 24px minimum.

## Verified

Automated sweep across 5 pages × 9 widths (320 / 360 / 390 / 414 / 768 / 1024
/ 1280 / 1440 / 1920), in both light and dark themes:

- Zero horizontal overflow at every width, on every page
- No console errors, JS exceptions or failed requests, on any page at any width
- No element overflows the viewport or clips its own text
- Every text/background pair clears WCAG AA 4.5:1, light and dark
- Heading order is sequential with exactly one `<h1>` per page
- Consent: banner appears, page still scrolls before choosing, nothing stored
  before a choice, granular save works, choice is timestamped and versioned,
  banner stays away on return
- Form: blocks empty submission, rejects malformed email, refuses to send
  without the privacy consent box, consent box is not pre-ticked
- Lightbox: opens, navigates, closes on Escape, traps focus, swipes on touch
- Renders correctly in dark mode, with reduced motion, and with JavaScript
  fully disabled
- Survives `localStorage` and `sessionStorage` being blocked entirely — no
  exceptions, and it still asks for consent rather than assuming it
- All non-inline tap targets meet the WCAG 2.2 SC 2.5.8 24px minimum
- The header fits, and the menu opens and closes, down to 320px
- Back-to-top stays reachable and clear of the consent banner at every width
- Every section enters from a side, and elements genuinely travel
  horizontally (measured, not assumed)
- **No section is ever left blank after a fast scroll.** Hard wheel-flings to
  the bottom at 320 / 390 / 768 / 1440px, flings down then back up, instant
  jumps to the bottom, and deep links to every section — nothing stuck
  invisible in any of them

Not yet checked, because this environment has no access to them: real Safari on
iOS, and Firefox.
