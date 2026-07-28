# HydroCore — Launch Checklist

Phase 7 deliverables: Lighthouse numbers, the manual cookie-testing checklist,
the photography shot list, and every `[TO CONFIRM]` item left in the codebase.
Nothing here was invented as fact — anything not independently verifiable was
either sourced from the original brief or explicitly flagged below.

## Lighthouse (production build, mobile-throttled)

Run with `npm run build && npx next start -p 3002`, audited with
`npx lighthouse <url> --chrome-flags="--headless=new --no-sandbox"`
(no custom `--preset`, i.e. Lighthouse's default mobile emulation + throttling).

| Page | Performance | Accessibility | Best Practices | SEO |
| --- | --- | --- | --- | --- |
| `/` (home) | 95 | 100 | 100 | 100 |
| `/services` | 95 | 100 | 100 | 100 |
| `/services/emergency-leaks` | 95 | 100 | 100 | 100 |
| `/book` | 88 | 100 | 100 | 100 |
| `/cookies` | 91 | 100 | 100 | 100 |
| `/en/services` | 92 | 100 | 100 | 100 |
| `/` (desktop preset) | 100 | 100 | 100 | 100 |

Performance scores in the high-80s/low-90s on mobile are mostly font-loading
and the Turbopack dev-vs-prod JS payload — nothing currently flagged as a
Lighthouse opportunity/diagnostic above the "informational" threshold. Re-run
this table once real photography replaces the `ImagePlaceholder` blocks (see
below) and once the production domain/CDN is live — real images and a CDN's
edge caching will move these numbers, for better or worse, and should be
re-measured against the real hosting target rather than local `next start`.

## Manual cookie-testing checklist

Everything below was already verified once against the local dev server with
a scripted browser (Playwright), but this is the walkthrough for a human to
repeat by hand — in a real browser, both locales, before launch — since a
script can't catch everything a person notices.

**Setup**: open the site in a private/incognito window (guarantees no
existing cookies), with DevTools → Application → Cookies open.

1. **First load, before any interaction**
   - [ ] Confirm the cookie list is empty, or contains only `NEXT_LOCALE` —
     never `hydrocore_consent` before you've made a choice.
   - [ ] Confirm the banner is visible at the bottom of the screen and does
     **not** cover the footer's legal links (scroll down to check).
   - [ ] Confirm "Accept all" and "Reject all" look identical in size/weight
     — no visual nudge toward one or the other.
2. **Reject flow**
   - [ ] Click "Reject all". Banner disappears.
   - [ ] Check `hydrocore_consent` cookie value — `functional`, `analytics`,
     `marketing` should all be `false`.
   - [ ] Visit `/contact` — the map should still show the placeholder card,
     not a live embed. Confirm no request to `maps.google.com` fired
     (DevTools → Network, filter `google`).
3. **Accept flow** (clear cookies, reload first)
   - [ ] Click "Accept all". Banner disappears, `hydrocore_consent` shows all
     categories `true`.
   - [ ] Visit `/contact` — the real Google Maps iframe should load.
4. **Customize flow** (clear cookies, reload first)
   - [ ] Click "Customize". A modal opens with a backdrop; page content
     behind it should not be interactable while it's open.
   - [ ] Confirm no checkbox is pre-ticked (except "Strictly necessary",
     which is on and disabled/non-interactive).
   - [ ] Tick only "Functional", click "Save preferences". Modal closes,
     cookie reflects `functional: true`, others `false`.
   - [ ] Reopen via the "Cookie Preferences" link in the footer — previously
     saved choices should be reflected, not reset.
5. **Keyboard-only pass** (mouse untouched)
   - [ ] Tab from a fresh page load. First stop should land in the cookie
     banner's three controls; after cycling through them, Tab should
     continue into the page (skip link, header nav, etc.) — it must **not**
     loop forever inside the banner.
   - [ ] Open the preferences modal with Enter/Space. Tab should cycle only
     within the modal (true trap) — Escape should close it.
6. **Expiry / re-prompt**
   - [ ] After accepting/rejecting, manually edit the `hydrocore_consent`
     cookie's `timestamp` field (DevTools → Application → Cookies → edit
     value) to a date more than 180 days in the past, then reload. The
     banner should reappear (expired consent is treated as no consent).
   - [ ] Bump `CONSENT_POLICY_VERSION` in `src/lib/consent/types.ts`,
     reload with a still-valid-looking cookie from an older version — the
     banner should reappear (a version mismatch also forces re-prompt).
7. **Cross-browser spot check**: repeat step 1–3 in at least one browser
   other than the one used for development (e.g. Safari/iOS if development
   happened on Chrome) — cookie `SameSite`/`Secure` handling has historically
   had real per-browser differences.
8. **Both locales**: repeat step 1 on `/en` as well — confirm banner/modal
   copy is in English and the consent cookie/logic behaves identically.

## Photography shot list

The site currently uses labelled placeholder blocks (`ImagePlaceholder`,
`role="img"` + `aria-label`) everywhere a real photo belongs, so screen
readers get the same brief a photographer would. There are exactly four
photo slots on the whole site — replace each `ImagePlaceholder` with a real
`next/image` once the shot exists:

| # | Where it appears | Aspect ratio | Shot needed |
| --- | --- | --- | --- |
| 1 | Homepage "Featured work" + `/work` (project 1) | 4:3 | Finished bathroom in Kolonaki — angled shot of shower and tiling, natural light |
| 2 | Homepage "Featured work" + `/work` (project 2) | 4:3 | Underfloor heating pipework before the concrete pour — tidy flat-lay shot |
| 3 | Homepage "Featured work" + `/work` (project 3) | 4:3 | Newly installed boiler — clean copper pipework connections, close-up |
| 4 | `/about` | 4:5 | The HydroCore team — group shot against a plain wall/background |

Notes for the shoot:
- Projects 1–3 reuse the **same three photos** on both the homepage teaser
  and the full `/work` page — only one shoot per project is needed, not two.
- No hero/background photography is used anywhere — the homepage hero is
  deliberately typographic (dark background, no image), so there's nothing
  to shoot for it.
- Aspect ratios above are load-bearing (they're baked into the layout grid).
  If the real shot doesn't crop cleanly to 4:3 or 4:5, flag it before final
  integration rather than stretching/squashing to fit.
- Once real photos exist, add real `alt` text describing the photo itself
  (not the placeholder brief) and verify Lighthouse/contrast again — a real
  photo behind any overlaid text needs a contrast check the placeholder's
  flat color didn't require.

## Consolidated `[TO CONFIRM]` list

Resolved with the business owner on 2026-07-28:

- **Registered address**: confirmed as `Καραμανλή 12, 190 16 Αθήνα` /
  `Karamanli 12, 190 16 Athens`. Now used consistently in the footer, the
  Google Maps embed, structured data, and the privacy/terms pages.
- **Data retention**: minimum-necessary approach adopted — booking records
  and photos are deleted as soon as they're no longer needed (normally
  shortly after the job is done), except invoicing records, kept 5 years
  per Greek tax law. Reflected in `src/content/legal.ts`.
- **Cancellation policy**: free cancellation/rescheduling up to 24 hours
  before the appointment; a call-out fee may apply for later cancellations
  or no-shows. Reflected in the Terms of Use page.
- **Hosting**: Vercel (site hosting) + Supabase, EU-region database.
  Reflected in the privacy policy's "who we share your data with" and
  "international data transfers" sections — Vercel Inc. is US-headquartered,
  so that section now names it explicitly and notes Standard Contractual
  Clauses as the safeguard for any processing outside the EEA.
- **Production domain**: confirmed as `hydrocore.gr`. Used in `SITE_URL`
  (`src/content/business.ts`), the sitemap, robots.txt, canonical/OG URLs,
  structured data, and `BOOKING_FROM_EMAIL` in `.env.example`.
- **Map coordinates** (`src/content/business.ts` → `GEO`): kept as-is.
- **Email account type**: `maktheplumber@gmail.com` is a personal Gmail
  account, not Google Workspace — consistent with it being a plain
  `@gmail.com` address rather than a custom domain (Workspace requires the
  latter). Reflected in the privacy policy's "who we share your data with"
  section (`src/content/legal.ts`).

**Not flagged, but worth a final human read-through before launch**: all
other business facts used sitewide — phone, notification email, VAT number,
working hours, service area neighbourhoods, testimonials, pricing text —
were supplied in the original project brief in earlier phases and are
treated here as confirmed; they're listed only for awareness, not because
anything about them looks wrong.
