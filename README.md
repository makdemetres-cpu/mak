# HydroCore — Website

A premium, animated, bilingual (Greek/English) marketing site for **HydroCore**, a fictional Thessaloniki-founded plumbing company, built as a static site (plain HTML/CSS/JS — no build step, no framework, no dependencies to install).

> **This is a demo/portfolio build.** HydroCore, its staff, testimonials, and legal identifiers (Tax ID, Company Registry number, addresses, phone numbers) are all fictional. Replace every placeholder marked below with real information before using this in production.

## What's included

- **Homepage** (`index.html`) — hero, company story/timeline, animated stats, services, locations network, testimonials, CTA.
- **Booking system** (`booking.html`) — a real, working 4-step booking form (service → schedule → contact details → confirm) with client-side validation, spam honeypot, and a GDPR consent checkbox.
- **Privacy & Cookie Policy** (`privacy.html`) — GDPR (EU 2016/679) + Greek Law 4624/2019 + Law 3471/2006 (e-privacy/cookies) compliant.
- **Terms of Service** (`terms.html`) — booking terms, pricing, cancellation, warranty, governing law (aligned with Greek consumer law, Law 2251/1994).
- **Cookie consent banner + preference center** (`js/consent.js`) — granular opt-in (Necessary / Preferences / Analytics / Marketing), nothing non-essential loads before consent.
- **Greek/English language toggle** — persisted per visitor, defaults to Greek.
- Self-hosted **Comfortaa** (headings) + **Inter** (body) — nothing is ever requested from Google's CDN, so no visitor IP is shared with a third party just to render text.
- A photography-ready split hero (text left, image panel right — currently an elegant placeholder, built to accept a real photo — see "Adding real photography" below), single-curve section divider, borderless circular icon badges, and a floating dark stats banner, following the visual language of a reference design the client supplied.

## Running it locally

No build step. From the project root:

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

Any static file server works (`npx serve`, VS Code's Live Server, etc.) — just don't open `index.html` directly via `file://`, since the booking form's `fetch`-free JS still expects normal relative paths.

## Making the booking form send real emails

Out of the box, the booking form works with **zero configuration**: on submit it opens the visitor's email client with a pre-filled message addressed to `appointments@hydrocore.gr`, so nothing is broken if you deploy as-is.

To have it send automatically (no email client popup) instead:

1. Create a free account at **[emailjs.com](https://www.emailjs.com)**.
2. Add an Email Service (e.g. connect a Gmail/Outlook inbox) and note the **Service ID**.
3. Create an Email Template with variables matching the payload sent by `js/booking.js` (`reference`, `service`, `branch`, `urgency`, `date`, `time`, `full_name`, `phone`, `email`, `address`, `notes`, `to_email`) and note the **Template ID**.
4. Grab your **Public Key** from Account → API Keys.
5. Open `js/booking.js` and fill in:
   ```js
   const EMAILJS_CONFIG = {
     publicKey: "YOUR_PUBLIC_KEY",
     serviceId: "YOUR_SERVICE_ID",
     templateId: "YOUR_TEMPLATE_ID"
   };
   ```
6. Redeploy. The mailto: fallback stays in place automatically if the EmailJS request ever fails.

**Data protection note:** if you use EmailJS (or any similar third-party mailer), disclose it as a data processor and check whether it transfers data outside the EEA — `privacy.html` §5 already covers this, but confirm it matches whichever provider you actually pick.

## Deploying

This is a plain static site, so it runs anywhere:

- **Netlify / Vercel** — drag-and-drop the folder or connect the repo; zero config needed. This also unlocks serverless functions later if you outgrow EmailJS (e.g. to store bookings in a real database and avoid double-booked slots).
- **GitHub Pages / any static host** — works identically; the booking form still functions since email delivery happens client-side.

## Adding real photography

The hero's right-hand panel (`.hero__visual-frame` in `index.html`) is currently an elegant gradient placeholder with the logo mark, sized and positioned to accept a real photo with no other layout changes. To swap it in:

1. Add your photo to `assets/img/` (a portrait-orientation shot works best — the panel's aspect ratio is roughly 4:5).
2. In `index.html`, replace the placeholder `<div class="hero__visual-glow">`/`<svg class="hero__visual-mark">` markup inside `.hero__visual-frame` with `<img src="assets/img/your-photo.jpg" alt="...">`.
3. Add `.hero__visual-frame img{width:100%;height:100%;object-fit:cover}` to `css/style.css` so it fills the rounded frame correctly.

## Before going live — replace these placeholders

| What | Where | Current placeholder |
|---|---|---|
| Legal company name, Tax ID (ΑΦΜ), Company Registry No. (Γ.Ε.ΜΗ.) | `index.html`, `privacy.html`, `terms.html` footers | `099887766` / `123456701000` |
| Phone numbers & email addresses | site-wide | `+30 2310 555 100`, `800 700 8000`, `info@hydrocore.gr`, `appointments@hydrocore.gr`, `privacy@hydrocore.gr` |
| Branch addresses | `js/data.js` | 7 fictional addresses |
| DPO contact | `privacy.html` §1 | `privacy@hydrocore.gr` |
| EmailJS credentials | `js/booking.js` | blank (mailto fallback active) |
| Google Analytics ID (optional) | `js/consent.js` (`GA_MEASUREMENT_ID`) | blank (analytics stays off until you set this) |
| Real photography / team photos | currently uses custom SVG illustrations only, by design | — |
| Favicon / social share image | inline SVG favicon in each page `<head>` | — |

## Structure

```
index.html          Homepage
booking.html         4-step booking flow
privacy.html          Privacy & Cookie Policy (EL/EN)
terms.html            Terms of Service (EL/EN)
css/fonts.css         Self-hosted @font-face declarations
css/style.css         Full design system + components + responsive rules
js/data.js            Single source of truth for branches & services
js/strings.js         EL/EN toggle engine + small dynamic-string dictionary
js/main.js            Nav, scroll reveal, counters, testimonials, locations, services grid
js/consent.js         GDPR cookie consent banner + preference center
js/booking.js         Booking form logic, validation, EmailJS + mailto fallback
assets/fonts/         Comfortaa & Inter (Latin + Greek subsets), self-hosted
assets/img/logo-mark.svg
```

## How the Greek/English toggle works

Nearly every piece of copy on the site exists twice in the HTML, wrapped in `<span data-lang-el>…</span>` / `<span data-lang-en>…</span>` pairs. A CSS rule (`html[data-lang="en"] [data-lang-el]{display:none}` and its mirror) shows only the active language — so the toggle in `js/strings.js` just flips one attribute on `<html>` and everything updates instantly, no page reload, no flash of untranslated content. Dynamic, JS-generated strings (toasts, validation messages) come from the small dictionary in `js/strings.js`.
