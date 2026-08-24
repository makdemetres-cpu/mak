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

### 7. Terms of service

There isn't one. A villa rental business needs booking terms, a cancellation
policy and a liability position as a separate document, and the FAQ is not a
substitute. Ask for it and it can be built to match.

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
| `privacy.html` | Privacy & cookie policy |
| `404.html` | Custom not-found page |
| `css/base.css` | Tokens, reset, typography, buttons, form controls |
| `css/site.css` | Header, mobile menu, hero, homepage sections, footer, consent |
| `css/pages.css` | Booking, contact, legal documents, 404 |
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
| `index.js` | Binds scroll to the camera, drives the panels, handles fallbacks |

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
content. Nothing is lost but the fly-in. Both paths are tested.

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

There is none, and none is faked. The estates are represented by hairline
drawings of their settings, and the hero is the 3D villa. Everything on the site
is either drawn or built in code, so there is nothing whose licensing has to be
tracked.

When real photographs of the four estates exist, the natural places for them are
the estate rows on the homepage and a gallery on each estate's own page, which
does not exist yet.

---

## Accessibility & browser support

Skip link, visible focus rings, real `<button>`s with `aria-expanded` on every
accordion, labelled form fields with error messages tied to their inputs, a
keyboard-dismissable mobile menu, and `prefers-reduced-motion` honoured
throughout — including switching the 3D hero off entirely.

Needs a modern evergreen browser: ES modules, CSS custom properties,
`grid-template-rows` transitions, `:has()`, and WebGL for the hero (which
degrades gracefully without it).
