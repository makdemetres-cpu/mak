# Ermis' Villas — website

A static marketing and enquiry site for **Ermis' Villas**, a family-run business
letting four private estates on the Greek coast. Plain HTML, CSS and JavaScript —
no framework, no build step, no `npm install` needed to run or deploy it.

The hero is a **scroll-driven 3D tour**: the camera travels up the drive, the
front door opens, and the tour continues through the house, entirely under the
visitor's control. It moves only while they scroll, stops exactly where they
stop, and reverses exactly on the way back up.

---

## ⚠️ Before you launch

**Everything factual on this site is a placeholder.** Nothing below is a
suggestion — a rental site with an invented company name and an invented
cancellation policy is a legal problem, not a design one.

### 1. Replace the business details — `js/data.js`

Every line marked `PLACEHOLDER` in `js/data.js`. This one file feeds the footer,
the contact page, the booking form and the privacy policy on every page, so you
only edit it once:

| Field | What it needs to be |
|---|---|
| `legalName`, `legalForm` | The entity that actually signs the rental agreements |
| `vatNumber`, `gemiNumber`, `taxOffice` | Real ΑΦΜ, Γ.Ε.ΜΗ. and ΔΟΥ |
| `address` | The registered seat — the privacy policy is required to state it |
| `email`, `privacyEmail`, `phone`, `phoneHref`, `whatsapp`, `whatsappHref` | Working contact routes |

### 2. Replace the estates — `js/data.js` → `ESTATES`

Names, locations, capacities, nightly rates and the descriptive lines are all
invented. Each estate also needs its real **AADE Short-Term Residence Property
Registry number**, which Greek law requires to be displayed on every listing and
advertisement for the property.

The estates also appear in hand-written form on the homepage (`index.html`,
`#estates`) and in the contact page legend — search for `Villa Thalassa` to find
every occurrence.

### 3. Replace the commercial terms — `index.html`, `#faq`

The FAQ answers about deposits, cancellation windows, minimum stays and what is
included in the rate are **indicative wording, not your terms**. They are marked
with an HTML comment above the block. Align them with your actual rental
agreement, or delete the specifics and point to the agreement instead.

### 4. Replace the testimonials — `index.html`

The three guest quotes are written for layout. Replace them with real,
attributable quotes, with the guest's permission.

### 5. Finish the privacy policy — `privacy.html`

The document is complete in structure and covers what the GDPR requires, but:

- Two visible **editor's notes** (`.todo` blocks) need answering and then
  deleting — one about naming your processors, one about whether any estate has
  CCTV. If any property has cameras, that has to be described in §3, and guests
  told on arrival.
- §7 describes recipients by category. Article 13(1)(e) permits that, but name
  the actual hosting provider, email provider, form provider and accountant once
  they are chosen, and keep an Article 30 record of processing alongside.
- §9's cookie table must match what the live site actually sets. It is accurate
  today; it stops being accurate the moment you add analytics.
- **Have a Greek data-protection lawyer read it before you publish.** This is a
  thorough draft written against GDPR (EU) 2016/679, Greek Law 4624/2019 and
  Greek Law 3471/2006 — it is not legal advice, and nobody here is your lawyer.

### 6. Decide where form submissions go — `js/data.js` → `FORM_ENDPOINT`

Left empty, the booking and contact forms compose the enquiry into an email and
open the visitor's mail client. That genuinely works on a static host with
nothing behind it, but it depends on the visitor having a mail client and
pressing send.

Set `FORM_ENDPOINT` to a form endpoint (Formspree, Netlify Forms, your own API)
and both forms POST JSON to it instead, falling back to the email route if the
request fails. **If you do, name that provider in the privacy policy §7** — they
become a processor.

### 7. Finish the booking terms — `terms.html`

The document is complete and drafted to sit correctly inside Greek and EU
consumer law, but it is **not yet your contract**:

- **Every figure marked _"to confirm"_ is a placeholder** — deposit percentage,
  balance date, cancellation bands, security deposit, check-in and check-out
  times, accepted payment methods. Replace them with your real terms. A payment
  or cancellation schedule you never agreed to is not enforceable, and a guest
  who relies on it and is then told something different has a fair complaint.
- **§4 taxes** needs the levies that actually apply to you, by name and rate,
  plus your VAT position. Rates change most years; don't publish figures your
  accountant hasn't confirmed.
- **§11 is the one to deal with first — see below.**
- Then have a Greek lawyer read the whole document.

Two things in there are deliberate and worth keeping when you revise it: the
re-letting refund in §9 (a term that keeps 100% of the price for a cancellation
made months ahead, with no attempt to re-let, risks being struck down as unfair
under Law 2251/1994), and the unlimited-liability carve-outs in §15, which you
cannot exclude anyway.

### 8. ⚠️ Resolve the package-travel question — `terms.html` §11

**This is the most consequential legal issue on the site, and it needs a lawyer
rather than a template.**

Under the Package Travel Directive (EU) 2015/2302, implemented in Greece by
Ministerial Decision 7397/2018, combining **accommodation with carriage of
passengers** — your airport transfers — or with car rental, or with other
tourist services that form a significant part of the value or are advertised as
an essential feature of the trip, can make the seller the **organiser of a
package**.

This site advertises chauffeur transfers, a private chef and curated
experiences as essential features. If that makes you an organiser, you take on
prescribed pre-contractual information, liability for the performance of the
*whole* package including other people's services, price-revision limits,
statutory traveller termination rights, and — the expensive one — **compulsory
insolvency protection**: a bond, guarantee or insurance that refunds and
repatriates travellers if the business fails. There is also an intermediate
"linked travel arrangement" regime with its own duties.

Get advice on which of the three you are. If you are an organiser, §11 has to
be rewritten around that regime, the booking flow must serve the prescribed
information form *before* the contract is made, and the insolvency protection
has to be in place first. Selling packages without it is an offence, not a
technicality.

### 9. Switch on the social icons — `js/data.js` → `social`

All three URLs are empty, so the footer's social row renders nothing and removes
itself. Paste a full profile URL in and that icon appears; leave one empty and it
stays absent. An icon that links nowhere reads as a broken site rather than a
deliberate absence, which is why it works this way round.

```js
social: {
  whatsapp:  "https://wa.me/30XXXXXXXXXX",
  instagram: "https://instagram.com/yourhandle",
  facebook:  ""                                  // not on Facebook? leave it
}
```

### 10. Date the legal documents when you finalise them

`privacy.html` and `terms.html` each carry a hard-coded in-force date in their
`.legal__meta` block:

```html
<p><b>Version:</b> 1.0 · <b>In force from:</b> <time datetime="2026-08-26">26 August 2026</time></p>
```

**Change both the `datetime` attribute and the visible text whenever you change
the substance of either document, and bump the version number.** They used to be
derived from the file's modification date, which meant a deploy that only touched
the CSS silently re-dated your privacy policy — a date that moves on its own is
worse than no date at all, and under Article 12 GDPR you need to be able to say
what was in force when.

---

## ⚠️ One find-and-replace before launch: the domain

Three things need an absolute URL and there is no domain yet, so they all use
`https://example.com` as a placeholder: the link-preview images, the structured
data, and the sitemap. One command fixes all of them:

```bash
sed -i 's#https://example.com#https://YOURDOMAIN#g' *.html sitemap.xml robots.txt
sed -i 's#content="assets/img/#content="https://YOURDOMAIN/assets/img/#' *.html
```

The second line makes the `og:image` paths absolute. Relative ones work on most
platforms; Twitter in particular does not resolve them.

### Cache busting

Every `css/` and `js/` URL carries a `?v=` version string, and the hero's ES
module imports carry the same one. Without it, a returning visitor gets new
HTML with a stylesheet the browser cached days ago, which looks broken rather
than out of date — and on GitHub Pages you will chase it for ten minutes
wondering why a deploy did nothing.

**Bump it whenever anything in `css/` or `js/` changes:**

```bash
OLD=260826d; NEW=$(date +%y%m%d)
sed -i "s/?v=$OLD/?v=$NEW/g" *.html js/hero/*.js
printf '%s\n' "$NEW" > version.txt          # keep this in step — see below
```

**Deploying twice in one day?** Then `date +%y%m%d` gives you the string that
is already live, the command is a no-op, and every visitor who loaded the site
between the two deploys gets the new HTML with the old stylesheet — the exact
failure the version exists to prevent. Add a letter: `260826` → `260826b` →
`260826c`. Anything that changes the string works; the date is only a
convention for reading it later.

### The other half: stale HTML

`?v=` versions every stylesheet and script. **What it cannot version is the
HTML file itself**, and GitHub Pages serves that with `max-age=600` and gives
you no way to change it. So for ten minutes after a deploy that *restructures
the markup*, a visitor can be handed a stale page — and because the assets are
versioned, a stale page that looks perfectly fine while being the wrong page.
It cost us one round of "I refreshed and nothing changed" on the booking form.

Two things now cover it:

- A `<meta http-equiv="Cache-Control">` in every page, which helps in the
  browsers that honour it and is harmless in the ones that do not.
- `version.txt` in the repository root, holding the current version string,
  and `checkVersion()` in `js/main.js`. On every page load it fetches that file
  — with `cache: no-store` **and** a unique `?t=` query, because Chromium
  enforces no-store internally without telling the server and a CDN edge would
  otherwise serve its own stale copy of the very file whose job is to be
  current — compares it against the version the page was built with, and if
  the page is older, reloads once.

**"Once" is doing real work in that sentence.** If an edge is still handing out
old HTML, a naive version of this reloads forever. The target version is
written to `sessionStorage` before the reload and checked before the next one,
capping it at one attempt per version per tab, and any storage failure is
treated as "do not reload at all". Better a stale page than a spinning one.

So `version.txt` must be bumped with the rest. If it drifts *behind*, nothing
happens and you are back where you started; if it drifts *ahead*, every
visitor reloads once for nothing. The command above does both together.

### Link previews

`assets/img/share-card.jpg` (1200×630) is rendered out of the site's own 3D
scene, so it needs no photography and no licence. To regenerate it after a
design change, screenshot the homepage hero at 1200×630 with the header hidden.

### Structured data

`index.html` carries `LodgingBusiness` and `WebSite`; each estate page carries
`VacationRental` and `BreadcrumbList`. Note that the telephone, email and
address appear **both** in `js/data.js` and inside the JSON-LD blocks. That
duplication is deliberate — crawlers do not run the site's JavaScript, so those
values have to be present in the markup. Update both, and check the result with
Google's Rich Results Test before launch.

`FAQPage` markup is deliberately absent: Google restricted FAQ rich results to
government and health sites, so it would add clutter and return nothing.

---

## Running it

No build step, no dependencies:

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

Deploy by copying the whole directory to any static host. `404.html` is picked up
automatically by GitHub Pages, Netlify, Vercel and Cloudflare Pages.

---

## What's in it

| File | |
|---|---|
| `index.html` | Homepage — 3D hero, the family, four estates, services, guests, FAQ |
| `booking.html` | Four-step booking enquiry with a running summary |
| `contact.html` | Direct lines, a drawn chart of the four locations, contact form |
| `estate-*.html` | One detail page per estate — setting, house, grounds, distances, rates |
| `terms.html` | Booking terms & conditions |
| `privacy.html` | Privacy & cookie policy |
| `404.html` | Custom not-found page |
| `css/base.css` | Tokens, reset, typography, buttons, form controls |
| `css/site.css` | Header, mobile menu, hero, homepage sections, footer, consent |
| `css/pages.css` | Booking, contact, legal documents, 404, estate pages |
| `css/print.css` | Print rules (loaded `media="print"`, costs nothing on screen) |
| `robots.txt`, `sitemap.xml` | Crawling |
| `js/data.js` | **The only file with business facts in it** |
| `js/main.js` | Header state, mobile menu, accordions, scroll reveals |
| `js/consent.js` | Cookie consent |
| `js/booking.js`, `js/contact.js` | The two forms |
| `js/hero/` | The 3D hero (see below) |

---

## The 3D hero

`js/hero/` — four files, no model or texture downloads at all. The villa, its
interior, the pool, the terrace and the planting are all built from primitives in
code, and the sky is painted into a 512×256 canvas at runtime and used for the
background, the image-based lighting and the reflections.

| File | |
|---|---|
| `scene.js` | Renderer, camera, lights, environment, quality tiers, resize |
| `villa.js` | All the geometry — shell, glazing, interior, grounds |
| `path.js` | The camera choreography: 16 keyframes of position, target and focal length |
| `photos.js` | The seven photographs, and the maths that makes each one fill the frame |
| `index.js` | Binds scroll to the camera, drives the panels, handles fallbacks |

### The photographs

Seven photographs stand in for the modelled surfaces, one per chapter, in the
order the camera meets them: the house across the pool, the approach at dusk,
the front door, the great room, the kitchen, the fire, and a bedroom over the
water. The camera move underneath is unchanged — same keyframes, same door,
same scroll binding.

Each one is a plane placed on the camera's own view axis and sized, every
frame, from the live field of view, aspect ratio and distance so that it
covers the frame exactly. That is `object-fit: cover` done in three
dimensions, and it has one consequence worth understanding:

> **No photograph is ever cropped on disk for framing.** Whatever a given
> screen shape cannot fit simply falls outside the frustum. A phone held
> upright sees very nearly the whole picture; a wide laptop sees a band
> through the middle of it.

Which band is the `focus` value in the table at the top of `photos.js`. It
slides the picture up the frame, so **positive shows more of the bottom of the
photograph and negative shows more of the top**. Each value has a comment
saying what it is protecting — the horizon in the bedroom, the pendants in the
kitchen. Change one, reload, look.

Each photograph dissolves in **on top of** the one before it, which holds at
full opacity underneath until it is completely covered. Fading one out while
fading the other in would let a quarter of the model show through between
them, and the join reads as a double exposure. While a photograph is covering
the frame outright the villa behind it is switched off, taking the frame from
about forty-three draw calls to two; it returns the instant anything could be
seen through, so a photograph that fails to load leaves the modelled villa
standing in its place.

### Replacing or re-cropping the photographs

The originals live in `assets/` exactly as they were uploaded.
`tools/hero-photos.py` is the only thing that writes to `assets/img/hero/` —
edit it and re-run rather than hand-editing the output:

```bash
pip install Pillow
python3 tools/hero-photos.py
```

It trims two watermarks (the crop boxes are measured, and commented with the
row numbers), upscales, and writes WebP and JPEG at two sizes. **If you upload
larger originals, set the scale factors in `SIZES` to 1** — the upscale exists
only to compensate for 736px sources, and upscaling something already large
just spends video memory.

Which set a visitor gets turns on the pointing device, not on the 3D quality
tier next door: a mouse means a machine with the memory for seven 1288px
textures at roughly 10MB each, a finger means a phone where that would be 70MB
and a reloaded tab. Textures load one chapter ahead of where the visitor is,
so somebody who never scrolls never downloads six of them.

### How the scroll binding works

`.hero__stage` is a 640vh scroll track with a `position: sticky` viewport inside
it. Progress through that track is a single number, `t`, from 0 to 1, and the
camera is a pure function of `t` — interpolated along a Catmull-Rom spline
through the keyframes in `path.js`.

Because it is a function rather than a timeline:

- **It stops dead when you stop.** There is no playhead to keep running.
- **Reverse is free.** Scrolling up runs the same function backwards.
- **Nothing drifts out of sync**, on any device, at any frame rate.

A frame-rate-independent exponential damp smooths the input, so a 120 Hz tablet
and a 60 Hz laptop travel at the same speed rather than one arriving twice as
fast.

### Why it doesn't lag

- **Rendering is strictly on demand.** When the camera has settled, the render
  loop shuts down entirely — measured at **0 draw calls** while a visitor sits
  still. A parked page costs no GPU and no battery.
- **The shadow map is baked once**, not every frame, because nothing in the
  scene moves except the front door.
- **Repeated geometry is instanced** — slats, stair treads, bottles, mullions,
  trees, shrubs are one draw call each rather than hundreds.
- **Quality is tiered at boot**, not adapted at runtime, so a phone never
  visibly "pops" down a level when it warms up.
- Measured on the mobile tier: **~43 draw calls and ~4k triangles per frame.**

### Fallbacks

If WebGL is unavailable, the context fails, or the visitor has asked for reduced
motion, the hero collapses into a designed stacked layout with all the same
content — now with the same seven photographs behind the seven panels, in the
same order. Nothing is lost but the fly-in. The JavaScript-off path gets it too.

Those are CSS background images rather than `<img>` tags, deliberately: a CSS
image is only fetched when it lands on something that renders, so a visitor who
gets the real hero never downloads one of them, whereas a hidden `<img>` would
be downloaded by everybody. All three paths are tested.

### Editing the tour

Everything about the move is the `KEYS` table at the top of `path.js` — one row
per shot: `[t, posX, posY, posZ, lookX, lookY, lookZ, fov]`. Position and target
are on separate splines so the camera can turn independently of where it is
travelling. `CHAPTERS` below it maps ranges of `t` to the copy panels in
`index.html`, matched by `data-chapter`.

Watch out for two things when moving keyframes: the camera must not pass through
solid geometry (the stairwell void in `villa.js` exists precisely so it can climb
to the landing), and the spline can overshoot slightly past a keyframe, so leave
clearance.

---

## Typography

Self-hosted, never from Google's CDN, so no visitor's IP address is handed to a
third party just to render text — a deliberate decision the privacy policy
relies on.

- **Fraunces** — display serif, for headlines, numerals and pull quotes
- **Hanken Grotesk** — text grotesque, for body copy, navigation and forms

Both are free and openly licensed (SIL Open Font License). They were chosen as
close free equivalents to the high-contrast display serif in the client's
reference image, which is a commercial typeface in the Canela/Domaine family. If
you licence the original, drop the `.woff2` files into `assets/fonts/` and swap
the `src` and `font-family` in `css/fonts.css` — nothing else needs to change.

### Regenerating the fonts

Latin and Latin-Extended subsets only; there is deliberately no Greek subset,
because the site is English-only and neither family ships Greek glyphs. Avoid
Greek script in the copy — it will fall back to a system font.

```bash
curl -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0" \
  "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..700&display=swap"
# then download the woff2 URLs it prints into assets/fonts/
```

---

## Rebuilding the three.js bundle

`js/vendor/three.slim.js` is a tree-shaken build containing only the parts of
three.js this site uses — 123 KB gzipped instead of 170 KB for the stock module.
`js/vendor/three-slim-entry.js` is the entry point that lists those exports.

You only need this if you upgrade three.js or import something new in
`js/hero/`. If you add an import, add it to the entry file too or the build will
not include it.

```bash
npm install three@0.169.0 esbuild
npx esbuild js/vendor/three-slim-entry.js --bundle --format=esm --minify \
  --legal-comments=none --target=es2020 --outfile=js/vendor/three.slim.js
```

---

## Cookie consent

`js/consent.js`. Nothing beyond strictly necessary storage is read or written
before the visitor chooses; refusing is one click in the same place, at the same
size, as accepting; the choice is timestamped and versioned; and it can be
withdrawn from **Cookie settings** in the footer of every page.

The banner currently appears **once per visit** rather than once ever, because
that is what the client asked for. It is lawful — the visitor is simply asked
afresh each session — but it is not the usual choice and it will depress opt-in
rates a little. To remember the answer for twelve months instead, set
`ASK_EVERY_VISIT = false` at the top of the file. Nothing else changes.

There are no analytics or advertising tags on the site at all, so "accept all"
genuinely does nothing today — which is what the banner says. If you add any,
load them from inside `loadAnalytics()` / `loadMarketing()` in that file and
never as a `<script>` in the page, or the consent gate becomes decorative.

---

## Photography

Seven photographs, in the hero only — see **The 3D hero → The photographs**.
Everywhere else the site is still drawn or built in code: the estates are
hairline drawings of their settings, and the contact page's map of the four
locations is a drawing rather than a map service.

### ⚠️ These seven need their rights sorted out

They were supplied as uploads, and two of them arrived carrying somebody
else's mark:

| | |
|---|---|
| `assets/Ermis Villas hero no 1.jpg` | a `TheBrainAndTheBrawn.com` copyright line across the bottom |
| `assets/ermis villas hero no 6.jpg` | a Pinterest `FOLLOW MMV_TRADES` overlay |

Both marks have been trimmed off the versions the site loads, on request. **A
trimmed watermark is not a licence.** Removing it changes what the picture
looks like and nothing about who owns it, and a visible credit is usually
evidence that somebody expected to be credited. Before this site takes a
booking, either establish that you hold the rights to all seven, or replace
them — `tools/hero-photos.py` regenerates everything from whatever is in
`assets/`, so swapping the originals and re-running is the whole job.

Worth knowing as well: they are seven different houses, not seven rooms of one.
The front door in photographs 2 and 3 carries a street number, `28`, that
belongs to neither. Guests do compare photographs to what they arrive at, and
the AADE registry number on each listing is a promise about a specific
property. Photographs of the four estates you actually let are the real answer
here; these are a good-looking placeholder.

When those real photographs exist, the natural places for them beyond the hero
are the estate rows on the homepage and a gallery on each estate's own page,
which does not exist yet.

---

## Accessibility & browser support

Skip link, visible focus rings, real `<button>`s with `aria-expanded` on every
accordion, labelled form fields with error messages tied to their inputs, a
keyboard-dismissable mobile menu, and `prefers-reduced-motion` honoured
throughout — including switching the 3D hero off entirely.

Needs a modern evergreen browser: ES modules, CSS custom properties,
`grid-template-rows` transitions, `:has()`, and WebGL for the hero (which
degrades gracefully without it).
