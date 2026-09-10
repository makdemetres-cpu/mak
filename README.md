# Sitrixweb — studio website

A dark, motion-driven single-page site for **Sitrixweb**, a one-person web development
studio in Greece (est. 1 June 2026): portfolio, reviews with an on-site submission form,
a consultation booking flow, and the legal pages an EU/Greek business needs.

Plain HTML, CSS and JavaScript. **No build step, no framework, no dependencies, no CDN** —
every byte the browser loads is served from this repository, which is also what keeps it
GDPR-clean (see [Privacy by construction](#privacy-by-construction)).

```bash
python3 -m http.server 8080     # then open http://localhost:8080
```

Any static host works: GitHub Pages, Netlify, Cloudflare Pages, a plain nginx box.

---

## Before you go live

Work down this list — everything in it is either legally required or visibly wrong until
you change it.

### 1. `js/config.js` — the single edit point

| Field | What to set |
|---|---|
| `instagram` | Your real profile URL. Every Instagram button on the site reads this one value. |
| `email` | The address you actually read. Drives the footer, the menu and the form fallbacks. |
| `phone` | Shown in the legal notice. |
| `formEndpoint` | Where the booking and review forms POST (see below). Leave `""` and they fall back to a pre-filled email. |
| `cursor` | The pointer effect: `"field"` (current), `"orbit"`, `"stardust"`, `"reticle"`, or `"off"`. Desktop only — see below. |
| `booking.workdays` / `slots` / `leadDays` / `horizonDays` | Your real availability. |

### 2. Replace the placeholder content

* **Portfolio rows** in `index.html` (marked `PLACEHOLDER PROJECTS`) — four invented
  projects are in there so the section reads correctly. Swap them for real work and point
  `href` at real case studies. Replace each row's `data-art` gradient with a screenshot:
  `data-art="url(assets/img/your-shot.jpg) center/cover"`.
* **Reviews** in `index.html` (marked `SAMPLE REVIEWS`) — these are illustrative, **not
  real client feedback**. Delete them and publish only reviews you have actually received
  and have permission to publish. Publishing invented or incentivised testimonials is an
  unfair commercial practice under Directive 2005/29/EC and Greek Law 2251/1994, and it is
  the fastest way to a complaint.
* **Copy** throughout — the About and Process sections describe how *I* assumed you work.
  Make them true.

### 3. Fill in every `[ ... ]` in the legal pages

`imprint.html`, `privacy.html`, `terms.html` and `cookies.html` are written for a Greek
sole trader working EU-wide, but they contain placeholders that are legally required to be
accurate:

* registered business name, legal form and address;
* **ΑΦΜ / VAT number**, ΔΟΥ (tax office), **ΓΕΜΗ** registration number, ΚΑΔ activity code;
* the names and countries of your **hosting provider**, email provider and (if used) video-call
  provider — required both for the imprint and for the processor list in the privacy policy;
* your phone number.

Also update the `ΑΦΜ / VAT` line in the footer of every page, and the `canonical`/`og:` URLs
in `index.html` once the domain is live.

> These documents are a solid, honest starting point written against the GDPR, Greek Law
> 4624/2019, Law 3471/2006, Law 2251/1994 and P.D. 131/2003 — **they are not legal advice.**
> Have a Greek lawyer read them once before launch. If most of your clients are Greek
> consumers, publish a Greek translation too: consumer information has to be in a language
> your customer understands.

### 4. Make the forms actually deliver

With `formEndpoint: ""` the forms validate, confirm, and then offer the visitor a
pre-filled email — nothing is lost, but nothing is automatic either. To receive submissions
directly, set `formEndpoint` to an endpoint that accepts a JSON `POST`:

* a form service (Formspree, Basin, Formcarry…), or
* your own handler — a Cloudflare Worker, a Netlify function, a small PHP script.

Both forms send flat JSON (`type`, the fields, and a `consent` timestamp). If you choose a
non-EU form service, add it to the processor list in `privacy.html` §6 and check the
transfer basis in §7 — that is exactly what those sections are for.

Bookings are **not** written to a calendar automatically; you confirm them by email. If you
later add a real scheduling backend, keep the same three-step UI and just swap what
`booking.js` does on submit.

---

## What's in here

```
index.html          the single-page site: hero · about · services · works · process · reviews · booking
privacy.html        GDPR privacy policy
cookies.html        cookie / local-storage policy
terms.html          terms of service (Greek + EU consumer law)
imprint.html        legal notice — business identification (P.D. 131/2003)
404.html            branded not-found page
css/fonts.css       self-hosted Inter (latin + greek subsets)
css/style.css       the whole design system, in labelled sections
js/config.js        deployment settings — the only file most changes need
js/site.js          nav, menu, scroll reveals, hover-peek, shared form helpers
js/globe.js         the hero globe (canvas, ~6KB, no library)
js/booking.js       calendar, time slots, stepped mobile flow, validation
js/reviews.js       star input, review submission, the writer's own copy
js/consent.js       cookie banner + preference centre
assets/fonts/       Inter woff2 subsets
```

## The cursor effect

`js/cursor.js` holds four interchangeable pointer companions; `cursor` in
`js/config.js` picks one, and that single word changes every page at once.
**Field** is the one in use: an aurora-coloured light lags well behind the
pointer and uncovers a dot-grid that is otherwise invisible, brightening a
little over anything clickable. Nothing chases the pointer — the page simply
lights up where the visitor is looking.

All four leave the real system cursor visible rather than replacing it, so nobody
loses the pointer or the text caret. They render nothing on touch devices and
nothing under `prefers-reduced-motion`, the easing is frame-rate independent (the
same settle on a 30Hz laptop and a 144Hz monitor), and the animation loop parks
itself once movement stops and the effect has finished settling.

`cursor-lab.html` is a working page for comparing the four side by side. It is
unlinked and `noindex`; delete it once you have settled on one.

## Design system

* **Palette** — `#1d1b20` base, `#3d3a3f` surfaces, `#565459` borders, `#7b7a83` body copy,
  `#efe7f9` highlights, `#c8956c` copper for every action and accent, pure white reserved
  for headlines.
* **Type** — Inter at 300 / 400 / 600–700 only. Hero 72–84px, section heads 40–56px, body
  15–17px. Oversized copper punctuation is the recurring signature.
* **Motion** — 350–600ms, `cubic-bezier(.4,0,.2,1)`, no bounce anywhere. Three layers on
  every scene: primary (content enters), secondary (shadows and icons settle ~50ms later),
  ambient (aurora drift, orbit rings, grain). Mobile shortens durations ~20% and tightens
  stagger ~30%.
* **Mobile is a redesign, not a squeeze** — the hero stacks headline above a 180px globe
  you can drag to rotate, portfolio rows swap the cursor-follow thumbnail for tap-to-expand,
  and the booking panel becomes a stepped date → time → details flow.
* **`prefers-reduced-motion`** is honoured properly: ambient loops stop, the globe renders a
  single still frame, entrances become opacity-only.

## Privacy by construction

* Fonts are **self-hosted** — reading a page never discloses a visitor's IP to a font CDN.
* No analytics, no pixels, no embeds, no third-party requests of any kind out of the box.
  The Instagram button is an ordinary link.
* The consent banner offers **Accept / Reject / Customise with equal visual weight**;
  non-essential categories start unticked and are as easy to withdraw as to give.
* Nothing non-essential is loaded before a choice — wire any future analytics inside
  `loadAnalytics()` in `js/consent.js`, never into the page HTML.
* Both forms require an explicit, unticked-by-default consent box and record a timestamp.
* Only two local-storage keys are ever written, both documented in `cookies.html`.

## Accessibility

Keyboard-operable throughout, visible focus rings, skip link, labelled form fields with
inline errors, `aria-live` on the parts that update, and semantic landmarks. Target is
**WCAG 2.2 AA**. If you change the palette, re-check contrast — the dark ground is less
forgiving than it looks.

## Browser support

Current Chrome, Firefox, Safari and Edge, desktop and mobile. Uses `IntersectionObserver`,
CSS custom properties, `clamp()` and canvas 2D — all long-standing baseline features. With
JavaScript disabled the whole page still reads: only the globe, the reveals and the two
forms need it.
