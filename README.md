# Ermis' Villas — website

A static marketing and enquiry site for **Ermis' Villas**, a family-run business
letting four private estates on the Greek coast. Plain HTML, CSS and JavaScript —
no framework, no build step, no `npm install` needed to run or deploy it.

The hero is a **scroll-driven flight through the villa**: the camera travels up
the drive, out over the pool, the front door opens, and the tour continues
through the house and up the stair. The villa is built entirely in code — and
every surface on it is a patch cut from photographs of the real house, so the
shapes are modelled and the substance is photographic. It is entirely under the
visitor's control: it moves only while they scroll, stops exactly where they
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

### 4. Replace the seed reviews — `js/data.js` → `SEED_REVIEWS`

Four quotes written for layout. They are what the review section shows before
any real review arrives, and real ones push them off one at a time as they come
in — so they are a floor, not a fixture. Replace them with real, attributable
quotes with the guest's permission, or empty the array and let the section fill
up on its own. They are excluded from the average and the review count either
way, so they can never inflate your score. See step 12 for the rest of it.

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

### 10. Check the arrival points — `js/travel.js`

The booking form's arrival step no longer has any free text in it. "Picking up
from" and "Flight or crossing" used to be two empty boxes, and an empty box
accepts `jtyi45oy4` as readily as `Paros Airport` — which is what came through
it. Now the airport, the port, the airline and the ferry line are all chosen
from lists in `js/travel.js`, and the only thing typed is the flight's number,
which takes digits and nothing else.

**What needs checking before launch:** `ARRIVAL_POINTS` is keyed by estate id,
and the entries were chosen to suit the *placeholder* locations in `data.js`. The
airports and ports themselves are real, but when the four houses become real
ones, go through the lists and make sure every entry is somewhere a driver would
genuinely be sent — and that the drive times in the `sub` line are true.

```js
anemos: [
  { id: 'pas', kind: 'air', code: 'PAS', name: 'Paros Airport', sub: 'Alyki — 25m by road' },
  …
]
```

`kind` is `air` or `sea`, and decides which list a guest is shown once they say
how they are travelling. `AIRLINES` and `FERRY_LINES` are working lists of real
operators serving Greece — extend them freely; anyone flying with a carrier not
on the list is told to say so in the notes, which reaches you just the same.

**What this does *not* do:** choosing from these lists proves the airport is an
airport, the airline is an airline, and that `A3 352` is a well-formed flight
designator. It does **not** prove that A3 352 flies on the day in question. That
needs a live schedules feed from a commercial flight-data provider — a paid
subscription, and a new processor to name in `privacy.html` §7. Until then, treat
a flight number as *the guest says so*, like everything else they tell you.

### 11. Date the legal documents when you finalise them

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

### 12. Guest reviews — connect the backend

The homepage shows the four most recent reviews and has a **Leave a review**
button. Until `js/data.js` → `REVIEWS` has a URL and a key it runs in **preview
mode**: the form works and the rolling four behave exactly as they will live,
but everything stays in the visitor's own browser and nobody else sees it. A
red editor's note on the page says so, and removes itself once you fill the
values in.

To make it real, in Supabase (free, no card):

1. Create a project. Note the **Project URL** and the **anon / publishable**
   key from Settings → API. The anon key is meant to be public — it ships in
   every visitor's browser either way — and row-level security below is what
   actually protects the table. **Never put the `service_role` key here**; it
   bypasses every policy you are about to write.

2. Run this in the SQL editor:

```sql
create table public.reviews (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text not null check (char_length(name) between 1 and 60),
  rating      smallint not null check (rating between 1 and 5),
  body        text not null check (char_length(body) between 10 and 600),
  approved    boolean not null default false
);

alter table public.reviews enable row level security;

-- Anyone may add a review. The checks above are the real validation: the
-- browser's are a courtesy to the guest, not a defence.
create policy "anyone can leave a review"
  on public.reviews for insert to anon with check (true);

-- Only approved reviews are readable. If you set REVIEWS.moderated = false in
-- js/data.js, change this to `using (true)` so unapproved ones show too.
create policy "approved reviews are public"
  on public.reviews for select to anon using (approved = true);
```

3. Paste the URL and anon key into `js/data.js` → `REVIEWS`.

**Moderation.** `REVIEWS.moderated` ships as `false`, so a review goes live the
moment it is written — which is what was asked for, and what the rolling four
are built around. **Turn it to `true` before you take real bookings**, and
change the select policy to match. It costs you a tick in the Supabase table
editor per review, and it means nothing appears on your business's homepage at
three in the morning without a person having read it first.

It is also the honest answer to a question EU law now makes you answer. Since
the 2019 amendment to the Unfair Commercial Practices Directive — in Greece,
Law 2251/1994 — a trader displaying consumer reviews must state **whether and
how** they check the reviews come from people who actually used the service,
and presenting unverified reviews as genuine guest reviews is a listed unfair
practice. `privacy.html` §18 currently says, plainly, that reviews are not
verified. If you start checking that reviewers really stayed, rewrite that
section to describe what you do. Either way it must be true.

**What is deliberately not here.** No aggregate-rating structured data, so
Google will not show stars under your search listing. That is on purpose while
any of the four are placeholders — star snippets built from invented reviews
are what manual penalties are for. Once every review is real and verified, it
is a small addition to `index.html`'s JSON-LD.

**Spam.** There is a hidden honeypot field, a 12-hour per-browser cooldown
(`REVIEWS.cooldownHours`) and length limits enforced by the database. All of
that is a courtesy against accidents, not a defence against anyone determined
— client-side limits are trivially bypassed. If reviews start attracting junk,
add rate limiting at Supabase and turn moderation on.

### 13. ⚠️ Clear the hero photographs — `assets/img/walk/`, `js/data.js`

The seven photographs the hero walks through came from a listing or an agency
site. **Nobody has established who holds the rights to them**, and nothing has
confirmed that the house in them is the Villa Kyma the hero names in the sky on
its opening frame.

Two separate exposures: copyright, and — if the house is not that estate — a
misleading action under Law 2251/1994, because a guest choosing a villa on the
strength of its pictures is exactly the decision that provision is about.

Licence them and confirm the house, or replace them, or at minimum set
`HERO_TITLE` to `''` so the site stops naming an estate it may not be showing.
The full write-up is in **Photography** below.

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

## The hero — the villa, wearing the photographs

`js/hero/`. The hero is a **scroll-driven flight through a modelled villa**:
up the drive, out over the pool, the front door swings open, through the
threshold, past the table and the island, into the double-height room, and up
the floating stair to look back out over the water. The house, its interior,
the pool, the terrace and the planting are all built from primitives in code —
no model files, no downloads.

**Not one surface on it is a flat colour.** Every material the model wears is
a patch cut out of the photographs of the real house: its render, its stone,
its timber, its floors, its water, its planting. The shapes are the model's;
the substance is photographic.

| File | |
|---|---|
| `scene.js` | Renderer, camera, sky, lighting, quality tiers, resize |
| `villa.js` | All the geometry — shell, glazing, interior, grounds |
| `path.js` | The camera choreography: 16 keyframes of position, target and focal length, plus the chapters |
| `skin.js` | **The photographic surfaces** — which patch goes on which material, at what scale |
| `index.js` | Binds scroll to the camera, drives the panels, handles fallbacks |
| `photos.js`, `walk.js` | **Unwired.** Two earlier heroes that put the photographs on planes in front of the camera. Nothing imports either; kept because this hero has changed direction more than once. |

### Cutting the surfaces out of the photographs

`tools/villa-skin.py` writes fourteen tiles into `assets/img/skin/` — about
300KB in total, and roughly 4MB of video memory across the whole villa.

```bash
pip install pillow numpy
python3 tools/villa-skin.py
```

Each one is a crop of a photograph put through three steps, and every step is
there because skipping it produced something visibly wrong on screen:

1. **Crop** a region that is only the material. The boxes are fractions of the
   source, so they survive a re-export at a different size. A crop that
   strays one percent into a window reveal puts a hard dark band in the tile,
   and a hard band repeated across a wall is the most conspicuous thing in the
   frame — so the tool measures the large-scale spread of each crop and warns
   when it looks like it is straddling two different things. That check exists
   because four bad tiles got through three rounds of judging them by eye.

2. **Flatten** the lighting out of it. A photograph of a wall in Mykonos at
   midday has the sun baked into it, one edge bright and the other in shadow;
   tile that and you get a repeating gradient that reads as corduroy. Each
   patch is divided by a blurred copy of its own luminance — on luminance
   only, so the colour survives — then pulled most of the way to its own mean
   for the plain materials. **That second step is the difference between
   plaster and wallpaper**, and there is more on why below.

3. **Make it tile.** By wrapping the patch onto itself and cross-fading, not
   by mirroring it.

#### Why mirroring was wrong

The obvious way to kill a seam is to mirror the patch into a 2×2 block, so
every edge meets its own reflection. It works, it is two lines, and it was the
first thing here.

It also stamps a diamond of symmetry through the middle of every tile, and the
eye finds regular symmetry faster than almost anything else. On screen the
villa's ceilings and walls came out covered in repeating medallions — the
interior looked like a room papered in a damask print, which sank the whole
idea in one frame.

So the patch is now rolled by half its width and blended with a raised cosine
that falls to zero at the edges, then the same again vertically. Both edges of
the result are the same 50/50 mixture of the same two neighbouring columns, so
they match exactly, and nothing is reflected. The cost is a little softening
where the fade is strongest, which on grain is invisible.

### Scale, tint, and the two things that are not photographs

**Repeat counts** are in `skin.js`, one per material. They are per material
rather than per mesh, because a material is shared by every mesh that uses it,
so each is a compromise chosen for the largest surface it lands on. Ground and
sea get big numbers because those planes are 300 and 900 units across.

**Tints are white** almost everywhere, because a `MeshStandardMaterial`
multiplies its map by its colour and a map on a material that kept its old
colour comes out doubly tinted and muddy. The exceptions are pairs the model
needs to keep apart — dark timber from light, a shadowed stone wall from a
sunlit one — and those are multiplied by a *neutral* grey, so they are the
same photograph darker rather than the same photograph recoloured.

Two deliberate departures, both documented in place:

- **The planting** is the one place a tint is not neutral, and it needed the
  saturation taken out of the pixels as well. The only greenery in the seven
  photographs is a banana plant three feet from a window — a vivid, wet,
  tropical green. An avenue of cypresses wearing it is a municipal park.
- **Brass** has no source at all: every fitting in this house is stainless. The
  door pull and the handrail wear the stainless patch under a warm multiplier.

The emissive fittings — `glow`, `glowWarm`, `ember`, `wineGlow` — are
deliberately left alone. They are not surfaces, they are light: a lit shade, a
fire, a backlit bottle. There is no photograph of light.

### The sky and the sun were rebuilt too

This scene used to be composed for a golden hour: an amber horizon under a
deep teal zenith, a low warm sun, warm haze. That flattered a modelled house.

It is the wrong light for this one. The photographs were taken in hard Mykonos
sun in the middle of the day, and lighting their surfaces with a sunset is the
one thing guaranteed to make them look fake — white render against a `#3779B2`
sky cannot be lit by an amber horizon and still read as the same wall. So the
sky gradient, the ground bounce, the sun's colour and height, and the aerial
haze are all now **sampled out of the photographs themselves**. The pool and
the sea were also un-mirrored: built as near-mirrors they reflected the sky and
showed almost none of their own map, so the pool came out the navy of the sky
instead of the turquoise it is in every photograph.

### What this does and does not look like

It looks like the modelled villa, in the real house's materials, under the real
house's sun. It does not look like a photograph of the house, and it cannot:
the model is an invented building — a 27-metre facade, a double-height room, a
floating stair — and the photographs are of a different, real house whose
proportions do not correspond. Anything that maps a whole facade onto a
modelled wall stretches it.

That trade was made deliberately and with the owner's answer in hand: the
camera flight is the one that was wanted, the photographs supply everything you
see, and where the two disagree the photographs win.

### How the scroll binding works

`.hero__stage` is a 640vh scroll track with a `position: sticky` viewport inside
it. Progress through that track is a single number, `t`, from 0 to 1, and the
camera is a pure function of `t` — one multiplication in `walk.js`, with no
timeline, no playhead and no autoplay anywhere in the file.

Because it is a function rather than a timeline:

- **It stops dead when you stop.** There is no playhead to keep running.
- **Reverse is free.** Scrolling up runs the same function backwards.
- **Nothing drifts out of sync**, on any device, at any frame rate.

A frame-rate-independent exponential damp smooths the input, so a 120 Hz tablet
and a 60 Hz laptop travel at the same speed rather than one arriving twice as
fast.

### Why it doesn't lag

Measured on this build with `renderer.info` and an instrumented render loop,
not estimated:

- **Rendering is strictly on demand.** When the camera has settled the render
  loop shuts down entirely — **0 frames over 8 seconds** of sitting still. A
  parked page costs no GPU and no battery. Worth re-checking whenever you add
  anything that mutates the scene, because it is the kind of guarantee that is
  silently lost rather than loudly broken. (Measure it *after* the damping has
  fully come to rest; catch it mid-settle and you will count the tail and
  think it is broken.)
- **Up to 138 draw calls and ~12,300 triangles** per frame on the desktop
  tier, across **19 textures** — the fourteen surface patches, the sky, and
  the environment map's mips. The patches are 256 and 512 square, about 300KB
  on disk and roughly 4MB of video memory all told, which is less than one of
  the hero photographs they were cut from.
- **The shadow map is baked once**, not every frame, because nothing in the
  scene moves except the front door.
- **Repeated geometry is instanced** — slats, stair treads, bottles, mullions,
  trees, shrubs are one draw call each rather than hundreds.
- **Mipmaps are ON for the surface patches**, and they are the one place in
  this project that needs them. A ground texture tiled forty-five times across
  three hundred units is several texels per pixel at the far end of the drive;
  without a mipmap chain that aliases into a crawling shimmer the moment the
  camera moves.

**Quality is tiered at boot and then checked.** `detectTier()` in
`js/hero/scene.js` guesses from core count and pointer type, which is all a
guess can do — a four-core desktop with a good GPU and a twelve-core laptop
throttling on battery both slip through it. So `js/hero/index.js` runs a
governor: it samples real frame times while the camera is moving and, if the
median is worse than 20ms, gives something up.

```js
const STEPS = [
  { dpr: 1,    grain: true  },   // as shipped
  { dpr: 0.78, grain: true  },   // ~40% fewer pixels
  { dpr: 0.62, grain: false }    // ~60% fewer, and no blend layer
];
```

It steps **down only**. Adapting in both directions is what makes a hero
visibly pop between sharp and soft the first time a phone warms up; one
direction means it settles once and stays there.

Resolution goes first because it is the whole cost: this scene shades millions
of pixels a frame and its geometry is trivial by comparison. The film grain
goes second — `mix-blend-mode` over the full frame is re-composited every time
the canvas under it redraws, which in a scroll-driven hero is every frame.

**Shadows are deliberately not on that list**, despite looking like the obvious
saving. The shadow map is baked exactly once, so per frame they cost one
texture lookup — while switching them off mid-scroll forces every material to
recompile, which is a visible stall spent to fix a stall. The surface textures
are not on it either: they are 4MB in total and dropping them would mean
re-uploading the villa's entire appearance mid-flight.

Two other things that were quietly expensive and are now not: the grain used to
be `inset: -50%`, four times the area of the viewport to show one screen's
worth; and `will-change` was declared on all seven hero panels, pinning seven
full-size composited layers for the life of the page.

### Fallbacks

If WebGL is unavailable, the context fails, or the visitor has asked for reduced
motion, the hero collapses into a designed stacked layout with all the same
content — now with the same seven photographs behind the seven panels, in the
same order. Nothing is lost but the fly-in. The JavaScript-off path gets it too.

Those are CSS background images rather than `<img>` tags, deliberately: a CSS
image is only fetched when it lands on something that renders, so a visitor who
gets the real hero never downloads one of them, whereas a hidden `<img>` would
be downloaded by everybody. All three paths are tested.

### Editing the flight

Everything about the move is the `KEYS` table at the top of `path.js` — one row
per shot: `[t, posX, posY, posZ, lookX, lookY, lookZ, fov]`. Position and target
are on separate splines so the camera can turn independently of where it is
travelling. `CHAPTERS` below it maps ranges of `t` to the copy panels in
`index.html`, matched by `data-chapter`.

Watch out for two things when moving keyframes: the camera must not pass through
solid geometry (the stairwell void in `villa.js` exists precisely so it can climb
to the landing), and the spline can overshoot slightly past a keyframe, so leave
clearance.

### Editing the surfaces

Two files, and they are edited in this order:

1. **`tools/villa-skin.py`** — the crop boxes. One row per texture: which
   photograph, the box as fractions, the output size, and how hard to flatten,
   soften and desaturate it. Re-run it after any change.
   **Draw the boxes on the photographs before trusting them** — a five-line
   script that outlines each box on its source and writes a contact sheet will
   save you the three rounds of guessing this file took.
2. **`js/hero/skin.js`** — which texture goes on which material, at what repeat,
   under what tint. Every entry is commented with why.

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

**⚠️ The photographs now in the hero are not cleared for publication. This is a
launch blocker, not a nice-to-have.**

The site is otherwise drawn or built in code: the estates are hairline drawings
of their settings, and the contact page's map of the four locations is a drawing
rather than a map service. The hero is the exception.

### The seven in the hero — `assets/img/walk/`

Seven photographs of what appears to be one house, supplied as uploads and
described as **taken from a listing or an agency site**. Two things follow from
that, and both need settling before this goes anywhere near a paying guest.

**1. Nobody has established who owns them.** A photograph on a listing site
belongs to whoever shot it — usually the agency's photographer, occasionally the
owner, essentially never the person who downloaded it. That the pictures are
publicly visible on a listing is not a licence to republish them on a competing
commercial site, and "we found them online" is not a defence to a copyright
claim. Either obtain written permission from whoever holds the rights, or
commission your own. `tools/villa-walk.py` regenerates everything from whatever
sits in `assets/`, so swapping the originals and re-running is the whole job.

**2. The hero now names a specific house.** `window.EV.HERO_TITLE` in
`js/data.js` is set to **Villa Kyma**, and that name is drawn into the sky
behind the building on the opening frame. Nothing has confirmed that the house
in these photographs *is* the Villa Kyma described elsewhere on this site — the
one in Agios Lazaros with six bedrooms, a 60m pool and a screening room. If it
is not, the homepage is showing one property under another property's name.

Under Law 2251/1994 and the Unfair Commercial Practices Directive that is a
**misleading action**: information that is factually false, or that deceives the
average consumer about the main characteristics of the service, and causes them
to take a decision they would not otherwise have taken. Booking a villa on the
strength of its pictures is exactly that decision. It is also the practical
problem — guests compare photographs to what they arrive at, and the AADE
registry number on each listing is a promise about one specific property.

So, before launch, one of:

- **Confirm these are Villa Kyma, and licence them.** Everything then stands as
  built, and the name behind the building is true.
- **Licence them but they are a different house.** Then set `HERO_TITLE` to `''`
  so no name is drawn, and make sure nothing else on the page implies the hero
  is any particular estate.
- **Replace them with photographs of an estate you actually let** — the real
  answer, and the one that also fills the gaps below.

When real photographs exist, the natural places for them beyond the hero are the
estate rows on the homepage and a gallery on each estate's own page, which does
not exist yet.

### The older seven — `assets/img/hero/`, unused

The set that preceded the walk. **Nothing on the live site loads these**, so the
question is not urgent, but it is not resolved either. Two of them arrived
carrying somebody else's mark:

| | |
|---|---|
| `assets/Ermis Villas hero no 1.jpg` | a `TheBrainAndTheBrawn.com` copyright line across the bottom |
| `assets/ermis villas hero no 6.jpg` | a Pinterest `FOLLOW MMV_TRADES` overlay |

Both marks were trimmed off the processed versions, on request. **A trimmed
watermark is not a licence.** Removing it changes what the picture looks like
and nothing about who owns it, and a visible credit is usually evidence that
somebody expected to be credited.

They are also seven different houses rather than seven rooms of one — the front
door in photographs 2 and 3 carries a street number, `28`, that belongs to
neither. If they are never going back in, deleting `assets/img/hero/` and
`tools/hero-photos.py` removes about 5MB and the question with it.

---

## Accessibility & browser support

Skip link, visible focus rings, real `<button>`s with `aria-expanded` on every
accordion, labelled form fields with error messages tied to their inputs, a
keyboard-dismissable mobile menu, and `prefers-reduced-motion` honoured
throughout — including switching the 3D hero off entirely.

Needs a modern evergreen browser: ES modules, CSS custom properties,
`grid-template-rows` transitions, `:has()`, and WebGL for the hero (which
degrades gracefully without it).
