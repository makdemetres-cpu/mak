/* ==========================================================================
   Χρόνης Πέγκας Photography — cookie & storage consent
   --------------------------------------------------------------------------
   Design decisions here are legal ones, not aesthetic ones:

   • Nothing non-essential runs before an explicit choice. There are no
     analytics, no pixels and no embeds in this build at all, so at present
     the only thing stored before consent is the consent record itself and
     the language preference — both exempt under Art. 5(3) ePrivacy.

   • The banner does NOT block the page and does NOT lock scrolling. A
     visitor can read the entire site without answering. Consent must be
     freely given (GDPR Art. 4(11), Art. 7); a wall that forces a click is
     not freely given.

   • Accept and Decline are rendered IDENTICALLY — same size, border, fill,
     type and position. Not merely "similar": a filled Accept next to an
     outlined Decline is the exact asymmetry the EDPB (Guidelines 03/2022 on
     deceptive design) and the CNIL have sanctioned. Do not restyle one
     without the other, and do not promote Accept to a primary button.

   • Consent is stored with a timestamp and a version. It expires after 12
     months, in line with Greek DPA guidance, after which the visitor is
     asked again. Bumping CONSENT_VERSION re-asks everyone immediately —
     do that whenever the cookie table in cookies.html changes.

   • Withdrawal is as easy as giving: "Ρυθμίσεις cookies" in the footer
     reopens this panel on every page (GDPR Art. 7(3)).

   IF YOU LATER ADD ANALYTICS OR EMBEDS, wire them into applyConsent()
   below and nowhere else. Never put a third-party <script> tag in the page
   HTML — that fires before this file can stop it.
   ========================================================================== */
(function () {
  "use strict";

  var STORAGE_KEY = "xp_consent";
  var CONSENT_VERSION = 1;
  var MAX_AGE_DAYS = 365;

  var CATEGORIES = ["necessary", "functional", "analytics", "marketing"];

  var root = document.documentElement;
  function t(key) {
    var S = window.XP_STRINGS || {};
    var lang = root.getAttribute("lang") === "en" ? "en" : "el";
    return (S[lang] && S[lang][key]) || "";
  }

  /* ---------------------------------------------------------------- state */
  function read() {
    var raw;
    try { raw = localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
    if (!raw) return null;

    var parsed;
    try { parsed = JSON.parse(raw); } catch (e) { return null; }
    if (!parsed || typeof parsed !== "object") return null;

    if (parsed.version !== CONSENT_VERSION) return null;

    var ts = Date.parse(parsed.ts);
    if (isNaN(ts)) return null;
    var ageDays = (Date.now() - ts) / 86400000;
    if (ageDays > MAX_AGE_DAYS || ageDays < -1) return null;   // expired, or a clock skew

    return parsed;
  }

  function write(choice) {
    choice.necessary = true;               // never optional, by definition
    choice.version = CONSENT_VERSION;
    choice.ts = new Date().toISOString();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(choice));
    } catch (e) {
      /* Storage blocked. The choice still applies for this page view; the
         visitor will simply be asked again next time. That is the correct
         failure mode — never assume consent that could not be recorded. */
    }
    applyConsent(choice);
    document.dispatchEvent(new CustomEvent("xp:consent", { detail: choice }));
    return choice;
  }

  /* ------------------------------------------------------------- effects */
  /* The single place where a consented category is allowed to do anything.
     This build ships with no third parties, so these branches are empty by
     design — they are the hooks, documented so the next person wires tags
     up here rather than in the HTML. */
  function applyConsent(choice) {
    if (choice.analytics) {
      /* e.g. a self-hosted or cookieless analytics snippet.
         Inject the <script> here, never in the page markup. */
    }
    if (choice.marketing) {
      /* e.g. a Meta pixel. Nothing is wired up in this build. */
    }
    if (choice.functional) {
      /* e.g. a Google Maps or Vimeo embed, which sets its own cookies.
         Swap the click-to-load placeholder for the real iframe here. */
    }
  }

  /* ------------------------------------------------------------------ UI */
  var banner = document.getElementById("cookieBanner");
  var modal = document.getElementById("cookieModal");
  var panel = modal ? modal.querySelector(".cookie-modal-panel") : null;
  var lastFocus = null;

  function showBanner() {
    if (!banner) return;
    banner.hidden = false;
    // Next frame, so the transform transition actually runs.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        banner.classList.add("is-open");
        document.body.classList.add("consent-open");
      });
    });
  }

  function hideBanner() {
    if (!banner) return;
    banner.classList.remove("is-open");
    document.body.classList.remove("consent-open");
    window.setTimeout(function () { banner.hidden = true; }, 600);
  }

  function openModal() {
    if (!modal) return;
    lastFocus = document.activeElement;
    syncSwitches(read() || { necessary: true, functional: false, analytics: false, marketing: false });
    modal.hidden = false;
    requestAnimationFrame(function () { modal.classList.add("is-open"); });
    modal.setAttribute("aria-hidden", "false");
    var firstSwitch = modal.querySelector("input:not([disabled])");
    if (firstSwitch) firstSwitch.focus();
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    window.setTimeout(function () { modal.hidden = true; }, 320);
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
    lastFocus = null;
  }

  function syncSwitches(choice) {
    CATEGORIES.forEach(function (cat) {
      var input = document.getElementById("cc-" + cat);
      if (input && !input.disabled) input.checked = !!choice[cat];
    });
  }

  function collectSwitches() {
    var out = { necessary: true };
    CATEGORIES.forEach(function (cat) {
      if (cat === "necessary") return;
      var input = document.getElementById("cc-" + cat);
      out[cat] = !!(input && input.checked);
    });
    return out;
  }

  function announce(msg) {
    if (typeof window.XP_announce === "function") window.XP_announce(msg);
  }

  /* --------------------------------------------------------------- wiring */
  function decide(choice, message) {
    write(choice);
    hideBanner();
    closeModal();
    announce(message);
  }

  var allOn = function () { return { necessary: true, functional: true, analytics: true, marketing: true }; };
  var allOff = function () { return { necessary: true, functional: false, analytics: false, marketing: false }; };

  document.querySelectorAll("[data-consent='accept']").forEach(function (b) {
    b.addEventListener("click", function () { decide(allOn(), t("consentAccepted")); });
  });
  document.querySelectorAll("[data-consent='decline']").forEach(function (b) {
    b.addEventListener("click", function () { decide(allOff(), t("consentDeclined")); });
  });
  document.querySelectorAll("[data-consent='manage']").forEach(function (b) {
    b.addEventListener("click", openModal);
  });
  document.querySelectorAll("[data-consent='save']").forEach(function (b) {
    b.addEventListener("click", function () { decide(collectSwitches(), t("consentSaved")); });
  });
  document.querySelectorAll("[data-consent='close']").forEach(function (b) {
    b.addEventListener("click", closeModal);
  });

  if (modal) {
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape" || modal.hidden) return;
      closeModal();
      // Escaping the panel without saving leaves the banner up — no choice
      // has been recorded, so none may be assumed.
      if (!read()) showBanner();
    });

    // Focus trap for the preferences dialog.
    modal.addEventListener("keydown", function (e) {
      if (e.key !== "Tab" || !panel) return;
      var f = panel.querySelectorAll("button, input:not([disabled]), a[href]");
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* ----------------------------------------------------------------- boot */
  var existing = read();
  if (existing) {
    applyConsent(existing);
  } else {
    // Small delay so the banner slides in after the page has settled rather
    // than competing with the hero for attention on first paint.
    window.setTimeout(showBanner, 700);
  }

  /* Exposed so the footer link works on every page, including the legal
     pages and the 404. */
  window.XP_openCookiePrefs = openModal;
})();
