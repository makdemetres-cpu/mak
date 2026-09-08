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
  const CATS = [
    {
      id: "necessary",
      title: "Strictly necessary",
      desc: "Keeps your cookie choice and lets forms work. These cannot be switched off and never identify you.",
      locked: true,
    },
    {
      id: "preferences",
      title: "Preferences",
      desc: "Remembers small choices you make on the site — such as a review you submitted — on this device only.",
    },
    {
      id: "analytics",
      title: "Analytics",
      desc: "Anonymous, aggregated statistics about which pages get read, so I can improve them. Nothing is loaded unless you allow it.",
    },
    {
      id: "marketing",
      title: "Marketing",
      desc: "Would allow advertising or remarketing tags. None are used on this site today; the switch is here so the choice stays yours if that ever changes.",
    },
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
    el.setAttribute("aria-label", "Cookie choices");
    el.innerHTML =
      "<h3>Cookies, honestly</h3>" +
      "<p>This site uses one strictly necessary cookie-equivalent to remember this choice. " +
      "Anything else — preferences and anonymous analytics — only runs if you say yes. " +
      "You can change your mind at any time from the footer. " +
      '<a href="cookies.html">Cookie Policy</a> · <a href="privacy.html">Privacy Policy</a></p>' +
      '<div class="cc__actions">' +
        '<button type="button" class="btn" data-cc="accept">Accept all</button>' +
        '<button type="button" class="btn" data-cc="reject">Reject non-essential</button>' +
        '<button type="button" class="btn" data-cc="prefs">Customise</button>' +
      "</div>";
    document.body.appendChild(el);
    return el;
  }

  function buildPrefs() {
    const el = document.createElement("div");
    el.className = "cc-prefs";
    el.id = "cookiePrefs";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-label", "Cookie settings");

    const rows = CATS.map((c) =>
      '<div class="cc-cat">' +
        '<div class="cc-cat__body"><h4>' + c.title + "</h4><p>" + c.desc + "</p></div>" +
        '<label class="check"><input type="checkbox" data-cat="' + c.id + '"' +
          (c.locked ? " checked disabled" : "") + '>' +
          '<span class="muted-sm">' + (c.locked ? "Always on" : "Allow") + "</span>" +
        "</label>" +
      "</div>"
    ).join("");

    el.innerHTML =
      '<div class="cc-prefs__box">' +
        "<h3>Cookie settings</h3>" +
        '<p class="muted-sm" style="margin-bottom:18px">Switch on only what you are comfortable with. ' +
        'Full detail in the <a href="cookies.html" style="color:var(--bright)">Cookie Policy</a>.</p>' +
        rows +
        '<div class="cc-prefs__actions">' +
          '<button type="button" class="btn" data-cc="save">Save my choices</button>' +
          '<button type="button" class="btn btn--ghost" data-cc="close">Cancel</button>' +
        "</div>" +
      "</div>";
    document.body.appendChild(el);
    return el;
  }

  const banner = buildBanner();
  const prefs = buildPrefs();

  function openBanner() { requestAnimationFrame(() => banner.classList.add("is-open")); }
  function closeBanner() { banner.classList.remove("is-open"); }
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
