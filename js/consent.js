/* ==========================================================================
   SITRIXWEB — cookie / consent manager  (GDPR + Greek Law 4624/2019 & 3471/2006)

   Rules this implements, deliberately:
   • Nothing beyond strictly necessary storage runs before an explicit choice.
   • Accept, Reject and Customise carry equal visual weight — rejecting is
     exactly as easy as accepting (EDPB guidance on dark patterns).
   • Non-essential categories start unticked; consent is opt-in, never opt-out.
   • The choice is stored with a timestamp and a version, and can be changed
     or withdrawn at any time from the "Cookie settings" link in the footer.
   • The banner is dismissible without accepting, and refusing does not
     degrade the site.
   ========================================================================== */
(() => {
  "use strict";

  const KEY = "sitrix_consent_v1";
  const T = (k) => window.SitrixLang.t(window.SITRIX_STRINGS[k]);
  const CATS = [
    { id: "necessary",   title: "catNecessary",   desc: "catNecessaryD", locked: true },
    { id: "preferences", title: "catPreferences", desc: "catPreferencesD" },
    { id: "analytics",   title: "catAnalytics",   desc: "catAnalyticsD" },
    { id: "marketing",   title: "catMarketing",   desc: "catMarketingD" },
  ];

  function read() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function write(choice) {
    choice.necessary = true;
    choice.version = 1;
    choice.at = new Date().toISOString();
    try { localStorage.setItem(KEY, JSON.stringify(choice)); } catch (e) {}
    document.dispatchEvent(new CustomEvent("sitrix:consent", { detail: choice }));
    apply(choice);
  }

  /* Everything non-essential is injected HERE, never in the page HTML, so a
     visitor who has not consented never makes the request in the first place. */
  function apply(choice) {
    if (choice.analytics) loadAnalytics();
    // No marketing/advertising tags are wired up on this site.
  }

  const ANALYTICS_ID = "";   // e.g. a Plausible/GA id — blank means nothing loads
  function loadAnalytics() {
    if (!ANALYTICS_ID || window.__sitrixAnalytics) return;
    window.__sitrixAnalytics = true;
    /* Wire your privacy-friendly analytics here. Kept empty on purpose:
       an unconfigured site must not ship a third-party request. */
  }

  /* ---------------- banner ---------------- */
  function buildBanner() {
    const el = document.createElement("div");
    el.className = "cc";
    el.id = "cookieBanner";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-live", "polite");
    document.body.appendChild(el);
    fillBanner(el);
    return el;
  }

  /* Written as a function so the banner can be refilled when the visitor
     switches language while it is still on screen. */
  function fillBanner(el) {
    el.setAttribute("aria-label", T("ccDialogLabel"));
    el.innerHTML =
      "<h3>" + T("ccTitle") + "</h3>" +
      "<p>" + T("ccBody") + " " +
      '<a href="cookies.html">' + T("ccPolicyLink") + "</a> · " +
      '<a href="privacy.html">' + T("ccPrivacyLink") + "</a></p>" +
      '<div class="cc__actions">' +
        '<button type="button" class="btn" data-cc="accept">' + T("ccAccept") + "</button>" +
        '<button type="button" class="btn" data-cc="reject">' + T("ccReject") + "</button>" +
        '<button type="button" class="btn" data-cc="prefs">' + T("ccCustomise") + "</button>" +
      "</div>";
  }

  function buildPrefs() {
    const el = document.createElement("div");
    el.className = "cc-prefs";
    el.id = "cookiePrefs";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    document.body.appendChild(el);
    fillPrefs(el);
    return el;
  }

  function fillPrefs(el) {
    el.setAttribute("aria-label", T("ccPrefsTitle"));

    const rows = CATS.map((c) =>
      '<div class="cc-cat">' +
        '<div class="cc-cat__body"><h4>' + T(c.title) + "</h4><p>" + T(c.desc) + "</p></div>" +
        '<label class="check"><input type="checkbox" data-cat="' + c.id + '"' +
          (c.locked ? " checked disabled" : "") + '>' +
          '<span class="muted-sm">' + (c.locked ? T("ccAlwaysOn") : T("ccAllow")) + "</span>" +
        "</label>" +
      "</div>"
    ).join("");

    el.innerHTML =
      '<div class="cc-prefs__box">' +
        "<h3>" + T("ccPrefsTitle") + "</h3>" +
        '<p class="muted-sm" style="margin-bottom:18px">' + T("ccPrefsIntro") +
        '<a href="cookies.html" style="color:var(--bright)">' + T("ccPolicyLink") + "</a>.</p>" +
        rows +
        '<div class="cc-prefs__actions">' +
          '<button type="button" class="btn" data-cc="save">' + T("ccSave") + "</button>" +
          '<button type="button" class="btn btn--ghost" data-cc="close">' + T("ccCancel") + "</button>" +
        "</div>" +
      "</div>";
  }

  const banner = buildBanner();
  const prefs = buildPrefs();

  // Switching language rewrites whichever of the two is on screen, keeping
  // any ticks the visitor has already made in the preference panel.
  document.addEventListener("sitrix:lang", () => {
    const ticked = {};
    prefs.querySelectorAll("input[data-cat]").forEach((i) => { ticked[i.dataset.cat] = i.checked; });
    fillBanner(banner);
    fillPrefs(prefs);
    prefs.querySelectorAll("input[data-cat]").forEach((i) => {
      if (!i.disabled && ticked[i.dataset.cat] !== undefined) i.checked = ticked[i.dataset.cat];
    });
  });

  function openBanner() {
    document.body.classList.add("cc-open");
    requestAnimationFrame(() => banner.classList.add("is-open"));
  }
  function closeBanner() {
    banner.classList.remove("is-open");
    // The scroll-to-top button shares this corner; give it the space back.
    document.body.classList.remove("cc-open");
  }
  function openPrefs() {
    const saved = read() || {};
    prefs.querySelectorAll("input[data-cat]").forEach((i) => {
      if (i.disabled) return;
      i.checked = !!saved[i.dataset.cat];
    });
    prefs.classList.add("is-open");
    const first = prefs.querySelector("input:not([disabled])");
    if (first) setTimeout(() => first.focus({ preventScroll: true }), 80);
  }
  function closePrefs() { prefs.classList.remove("is-open"); }

  function all(v) {
    const o = {};
    CATS.forEach((c) => { o[c.id] = c.locked ? true : v; });
    return o;
  }

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-cc]");
    if (btn) {
      const act = btn.dataset.cc;
      if (act === "accept") { write(all(true)); closeBanner(); closePrefs(); }
      if (act === "reject") { write(all(false)); closeBanner(); closePrefs(); }
      if (act === "prefs")  { openPrefs(); }
      if (act === "close")  { closePrefs(); }
      if (act === "save") {
        const choice = { necessary: true };
        prefs.querySelectorAll("input[data-cat]").forEach((i) => {
          choice[i.dataset.cat] = i.disabled ? true : i.checked;
        });
        write(choice);
        closePrefs();
        closeBanner();
      }
      return;
    }
    // Footer / policy-page "Cookie settings" links re-open the panel.
    if (e.target.closest("[data-cookie-settings]")) {
      e.preventDefault();
      openPrefs();
    }
  });

  prefs.addEventListener("click", (e) => { if (e.target === prefs) closePrefs(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && prefs.classList.contains("is-open")) closePrefs();
  });

  const saved = read();
  if (saved) apply(saved);
  else setTimeout(openBanner, 900);   // let the hero land first
})();
