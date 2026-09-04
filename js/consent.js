/* ===========================================================================
   Cookie / tracker consent
   ---------------------------------------------------------------------------
   Legal basis this implementation is written against:

   * GDPR (EU) 2016/679 — art. 4(11) and art. 7: consent must be freely given,
     specific, informed and unambiguous, given by a clear affirmative act, and
     be as easy to withdraw as it was to give.
   * ePrivacy Directive 2002/58/EC as transposed by Greek Law 3471/2006,
     art. 4(5): storing or reading information on a subscriber's terminal
     equipment needs prior consent, EXCEPT where it is strictly necessary to
     provide a service the user explicitly requested.
   * Greek DPA (ΑΠΔΠΧ) Recommendation 1/2020 on trackers, and its 2022 sweep of
     news websites: only strictly necessary trackers may be pre-enabled; a
     first-layer banner offering only "I agree" and "More options", or styling
     accept more prominently than reject, is unlawful.
   * EDPB Guidelines 03/2022 on deceptive design patterns — no "hindering"
     (reject buried behind extra clicks), no "stirring" (visual nudging).

   What this site actually stores
   -----------------------------
   Strictly necessary, no consent required, and set even if you reject:
     · vetcare.lang    — the language you picked
     · vetcare.consent — this decision, so we can honour it and stop asking
   Both are localStorage entries, first-party, never sent anywhere.
   Nothing else is stored today. No analytics tool is installed; the analytics
   category exists so that if one is ever added it is already gated behind
   opt-in consent, and `runAnalytics()` below is the single place to wire it.

   HOW OFTEN THE BANNER SHOWS — and why (the brief asked for this reasoning)
   ------------------------------------------------------------------------
   The brief suggested showing the banner on every single page load. That is
   right up to the moment the visitor answers, and wrong afterwards:

     · Before a choice exists, the banner appears on every page load, in both
       languages, on every page — nothing non-essential runs meanwhile. There
       is no cookie wall: the whole site stays usable while it is open, since
       consent conditioned on access would not be "freely given" (art. 7(4)).
     · Once a choice exists it is respected and the banner stops. Re-asking a
       visitor who already refused is exactly the "nagging" the EDPB lists as a
       deceptive pattern in Guidelines 03/2022, and the Greek DPA's 2022
       enforcement letters make the same point: a refusal must be honoured, not
       worn down.
     · Consent does not last forever. Neither GDPR nor Law 3471/2006 fixes a
       period, so we follow the supervisory-authority convention of refreshing
       it after about six months (CNIL's published figure; the ΑΠΔΠΧ has not
       set a shorter one). ACCEPTANCE AND REFUSAL EXPIRE ALIKE — expiring only
       refusals would be a dark pattern in disguise.
     · Withdrawal is one click, from the footer of every page ("Ρυθμίσεις
       cookies"), i.e. exactly as easy as giving consent was.

   Where the stricter reading was chosen: we treat the analytics category as
   opt-in even though a purely anonymous, first-party audience count could
   arguably be argued as exempt; and we self-host the fonts and use a drawn
   map instead of a Google Maps iframe, so no third party sees a visitor's IP
   before they consent.
   =========================================================================== */

(function () {
  "use strict";

  var KEY = "vetcare.consent";
  var VERSION = 1;
  /* Six months, in milliseconds. */
  var MAX_AGE = 1000 * 60 * 60 * 24 * 182;

  var banner = document.getElementById("cookie-banner");
  var dialog = document.getElementById("cookie-prefs");
  var analyticsToggle = document.getElementById("pref-analytics");

  /* ----------------------------------------------------------------- *
   * Storage helpers — every access is guarded: Safari private mode and
   * "block all cookies" settings throw on localStorage.
   * ----------------------------------------------------------------- */
  function read() {
    try {
      var raw = window.localStorage.getItem(KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || parsed.v !== VERSION || typeof parsed.ts !== "number") return null;
      if (Date.now() - parsed.ts > MAX_AGE) return null; /* expired → ask again */
      return parsed;
    } catch (e) {
      return null;
    }
  }

  function write(state) {
    try {
      window.localStorage.setItem(
        KEY,
        JSON.stringify({ v: VERSION, ts: Date.now(), analytics: !!state.analytics })
      );
    } catch (e) {
      /* If we cannot remember the choice we must not act on a guess: the
         banner will simply ask again next time, and nothing extra runs. */
    }
  }

  /* ----------------------------------------------------------------- *
   * The one place any non-essential script may be started.
   * ----------------------------------------------------------------- */
  var analyticsStarted = false;
  function runAnalytics() {
    if (analyticsStarted) return;
    analyticsStarted = true;

    /* TODO (client): drop your analytics snippet in here — and ONLY here, so
       it can never execute before consent. A privacy-friendly, cookieless
       option keeps this page's disclosures accurate, e.g.:

         var s = document.createElement("script");
         s.defer = true;
         s.src = "https://plausible.io/js/script.js";
         s.setAttribute("data-domain", "vet-care.gr");
         document.head.appendChild(s);

       If you add anything that stores data or transfers it outside the EEA,
       update cookies.html (the table) and privacy.html (§ processors) to
       match — the policies must describe what the site really does. */
  }

  /* ----------------------------------------------------------------- *
   * Banner + dialog plumbing
   * ----------------------------------------------------------------- */
  function showBanner() {
    if (!banner) return;
    banner.hidden = false;
    banner.classList.add("is-open");
    banner.setAttribute("tabindex", "-1");
    /* Announce it without hijacking the page: focus moves to the notice, but
       the rest of the site stays reachable and scrollable behind it. */
    window.setTimeout(function () {
      try { banner.focus({ preventScroll: true }); } catch (e) { banner.focus(); }
    }, 350);
  }

  function hideBanner() {
    if (!banner) return;
    banner.classList.remove("is-open");
    banner.hidden = true;
  }

  function openPrefs() {
    if (!dialog) return;
    var state = read();
    if (analyticsToggle) analyticsToggle.checked = !!(state && state.analytics);
    if (typeof dialog.showModal === "function") {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  }

  function closePrefs() {
    if (!dialog) return;
    if (typeof dialog.close === "function" && dialog.open) dialog.close();
    else dialog.removeAttribute("open");
  }

  function decide(analytics) {
    write({ analytics: analytics });
    if (analytics) runAnalytics();
    hideBanner();
    closePrefs();
    document.dispatchEvent(
      new CustomEvent("vetcare:consent", { detail: { analytics: analytics } })
    );
  }

  /* Buttons are wired by intent, so accept/reject behave identically wherever
     they appear (banner or dialog) and neither path is longer than the other. */
  document.addEventListener("click", function (event) {
    var target = event.target.closest ? event.target.closest("[data-consent], [data-open-prefs]") : null;
    if (!target) return;

    if (target.hasAttribute("data-open-prefs")) {
      event.preventDefault();
      openPrefs();
      return;
    }

    var action = target.getAttribute("data-consent");
    if (action === "accept") decide(true);
    else if (action === "reject") decide(false);
    else if (action === "save") decide(!!(analyticsToggle && analyticsToggle.checked));
  });

  /* Closing the dialog with Esc or the backdrop must NOT be read as consent:
     if no decision has been recorded yet, the banner comes straight back. */
  if (dialog) {
    dialog.addEventListener("close", function () {
      if (!read()) showBanner();
    });
  }

  /* ----------------------------------------------------------------- *
   * Boot
   * ----------------------------------------------------------------- */
  var stored = read();
  if (stored) {
    if (stored.analytics) runAnalytics();
  } else {
    showBanner();
  }

  window.VetCareConsent = {
    get: read,
    open: openPrefs,
    /* Exposed so other scripts can ask before doing anything non-essential. */
    allows: function (category) {
      var s = read();
      return category === "necessary" ? true : !!(s && s[category]);
    }
  };
})();
