# Working agreements — Ermis' Villas

Standing instructions from the site's owner. These apply to every session, not
just the one they were given in.

---

## Always say when the site is ready to refresh

The owner previews this site on **GitHub Pages**, at
`https://makdemetres-cpu.github.io/mak/`, served from the branch
`claude/ermis-villas-website-fzbg3f`.

**After every change — however small — end the reply by telling them the site is
ready to refresh.** Do not leave them guessing whether a push has landed or
whether what they are looking at is current.

Use this shape, at the end of the message:

> **Ready to refresh** — pushed `<short sha>`. Give GitHub Pages about a minute.
> **What's new to look at:** <the two or three things they should actually click
> or scroll to in order to see this change>

Rules that make that statement true rather than decorative:

1. **Push first.** "Ready to refresh" means the commit is on the remote, not
   that the files changed on disk. Never say it before `git push` succeeds.
2. **Bump the cache version if `css/` or `js/` changed.** Every asset URL
   carries `?v=YYMMDD`, and the hero's ES module imports carry the same string.
   Skip this and the owner gets new HTML with a stale stylesheet, which looks
   broken rather than out of date. See README → "Cache busting":
   ```bash
   OLD=<current>; NEW=$(date +%y%m%d)
   sed -i "s/?v=$OLD/?v=$NEW/g" *.html js/hero/*.js
   ```
3. **Verify before announcing.** Serve the site locally and check the changed
   pages load with no console errors before claiming it is ready.
4. **Say if a hard refresh is needed.** With the version bumped it should not
   be. If for any reason it is, say so and give the shortcut
   (`Ctrl+Shift+R` / `Cmd+Shift+R`).
5. **Point at something concrete.** "What's new" should name a page, a section
   or an interaction — not restate the commit message.
6. **Say when there is nothing to see.** Some work is invisible in the browser:
   structured data, the sitemap, the share card, print styles. Say so plainly
   and explain how it *can* be checked, rather than implying a visible change.

---

## Project facts worth knowing before editing

- Static site: plain HTML, CSS and JS. **No build step**, no `npm install`
  needed to run or deploy. Serve with `python3 -m http.server 8080`.
- **Everything factual is a placeholder** — company name, VAT, addresses,
  estate names, rates, testimonials, commercial terms. `README.md` →
  "Before you launch" is the authoritative list. Never quietly present a
  placeholder as if it were real.
- Business details live in **one** file, `js/data.js`, and are hydrated into
  the markup by `js/main.js` via `data-ev` attributes. The JSON-LD blocks
  duplicate some of them on purpose, because crawlers do not run our JS.
- The 3D hero is built entirely in code in `js/hero/` — no model or texture
  downloads. Its camera is a pure function of scroll position; there is no
  timeline. Do not introduce one.
- Accessibility has been measured, not eyeballed: contrast ratios are
  calculated, the mobile menu traps focus, form errors are wired to their
  fields. Keep it that way — `--brass` is for fills, `--brass-ink` is for text.
