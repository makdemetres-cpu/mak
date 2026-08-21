/* ==========================================================================
   HydroCore — GDPR consent manager
   - Blocks everything non-essential until the visitor chooses.
   - Stores a granular, timestamped decision in localStorage.
   - Re-openable anytime via the "Cookie Settings" link in the footer.
   - See privacy.html §8 for the full cookie table this UI maps to.
   ========================================================================== */
(() => {
  "use strict";

  const STORAGE_KEY = "hc_consent_v1";
  const CATS = ["necessary", "preferences", "analytics", "marketing"];

  function getConsent() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      return parsed;
    } catch (e) { return null; }
  }

  function saveConsent(consent) {
    consent.necessary = true;
    consent.ts = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
    document.dispatchEvent(new CustomEvent("hc:consentchange", { detail: consent }));
    applyIntegrations(consent);
  }

  /* Nothing loads until consent is explicit. If you wire up real
     analytics/marketing tags, gate their <script> injection here —
     never in the raw page HTML. */
  function applyIntegrations(consent) {
    if (consent.analytics) loadAnalyticsStub();
    if (consent.marketing) loadMarketingStub();
  }

  const GA_MEASUREMENT_ID = ""; // e.g. "G-XXXXXXX" — left blank in this demo, so nothing is ever loaded
  function loadAnalyticsStub() {
    if (!GA_MEASUREMENT_ID || window.__hcAnalyticsLoaded) return;
    window.__hcAnalyticsLoaded = true;
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag("js", new Date());
    gtag("config", GA_MEASUREMENT_ID, { anonymize_ip: true });
  }
  function loadMarketingStub() {
    /* Placeholder: no marketing/ad pixels are wired up in this demo build. */
  }

  /* ---------------- UI ---------------- */
  function buildBannerOverlay() {
    const el = document.createElement("div");
    el.className = "cookie-banner-overlay";
    el.id = "cookieBannerOverlay";
    document.body.appendChild(el);
    return el;
  }

  function buildBanner() {
    const el = document.createElement("div");
    el.className = "cookie-banner";
    el.id = "cookieBanner";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-label", "Cookie consent");
    el.innerHTML = `
      <div class="cookie-banner__inner">
        <div class="cookie-banner__text">
          <h3>
            <span data-lang-el>🍪 Χρησιμοποιούμε cookies</span>
            <span data-lang-en>🍪 We use cookies</span>
          </h3>
          <p data-lang-el>Χρησιμοποιούμε απολύτως απαραίτητα cookies για τη λειτουργία του site, και προαιρετικά cookies προτιμήσεων/στατιστικών μόνο με τη συγκατάθεσή σας. Δείτε την <a href="privacy.html#cookies">Πολιτική Cookies</a>.</p>
          <p data-lang-en>We use strictly necessary cookies to run this site, and optional preference/analytics cookies only with your consent. See our <a href="privacy.html#cookies">Cookie Policy</a>.</p>
        </div>
        <div class="cookie-banner__actions">
          <button class="btn btn-ghost btn-sm" id="cookieManage" type="button">
            <span data-lang-el>Ρυθμίσεις</span><span data-lang-en>Manage</span>
          </button>
          <button class="btn btn-ghost btn-sm" id="cookieReject" type="button">
            <span data-lang-el>Απόρριψη μη απαραίτητων</span><span data-lang-en>Reject non-essential</span>
          </button>
          <button class="btn btn-primary btn-sm" id="cookieAccept" type="button">
            <span data-lang-el>Αποδοχή όλων</span><span data-lang-en>Accept all</span>
          </button>
        </div>
      </div>`;
    document.body.appendChild(el);
    return el;
  }

  function catCopy(id) {
    const map = {
      necessary: {
        title: { el: "Απολύτως Απαραίτητα", en: "Strictly Necessary" },
        desc: { el: "Απαιτούνται για βασικές λειτουργίες (πλοήγηση, ασφάλεια, αποθήκευση των προτιμήσεών σας cookie). Δεν μπορούν να απενεργοποιηθούν.", en: "Required for core functions (navigation, security, remembering your cookie choice). Cannot be turned off." }
      },
      preferences: {
        title: { el: "Προτιμήσεις", en: "Preferences" },
        desc: { el: "Θυμούνται επιλογές όπως τη γλώσσα εμφάνισης (Ελληνικά/English) στις επόμενες επισκέψεις σας.", en: "Remember choices like display language (Greek/English) across your visits." }
      },
      analytics: {
        title: { el: "Στατιστικά / Ανάλυση", en: "Analytics" },
        desc: { el: "Ανώνυμα στατιστικά επισκεψιμότητας για να βελτιώνουμε το site. Ανενεργά σε αυτή τη demo έκδοση.", en: "Anonymous traffic statistics to help us improve the site. Inactive in this demo build." }
      },
      marketing: {
        title: { el: "Μάρκετινγκ", en: "Marketing" },
        desc: { el: "Θα χρησιμοποιούνταν για εξατομικευμένες διαφημίσεις. Δεν χρησιμοποιείται σήμερα.", en: "Would be used for personalised advertising. Not currently in use." }
      }
    };
    return map[id];
  }

  function buildModal() {
    const overlay = document.createElement("div");
    overlay.className = "cookie-modal-overlay";
    overlay.id = "cookieOverlay";

    const modal = document.createElement("div");
    modal.className = "cookie-modal";
    modal.id = "cookieModal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "cookieModalTitle");

    const catsHtml = CATS.map((id) => {
      const c = catCopy(id);
      const locked = id === "necessary";
      return `
      <div class="cookie-cat">
        <div class="cookie-cat__head">
          <h4><span data-lang-el>${c.title.el}</span><span data-lang-en>${c.title.en}</span></h4>
          <button type="button" class="toggle ${locked ? "is-on is-disabled" : ""}" data-cat="${id}" ${locked ? 'aria-disabled="true"' : 'aria-pressed="false"'}></button>
        </div>
        <p><span data-lang-el>${c.desc.el}</span><span data-lang-en>${c.desc.en}</span></p>
      </div>`;
    }).join("");

    modal.innerHTML = `
      <div class="cookie-modal__head">
        <div>
          <h3 id="cookieModalTitle"><span data-lang-el>Ρυθμίσεις Cookies</span><span data-lang-en>Cookie Settings</span></h3>
          <p style="color:var(--text-soft);font-size:.86rem;margin-top:6px">
            <span data-lang-el>Επιλέξτε ποιες κατηγορίες cookies επιτρέπετε. Περισσότερα στην <a href="privacy.html#cookies" style="color:var(--deep);font-weight:700">Πολιτική Cookies</a>.</span>
            <span data-lang-en>Choose which categories of cookies you allow. More in our <a href="privacy.html#cookies" style="color:var(--deep);font-weight:700">Cookie Policy</a>.</span>
          </p>
        </div>
        <button class="cookie-modal__close" id="cookieModalClose" type="button" aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
      ${catsHtml}
      <div class="cookie-modal__actions">
        <button class="btn btn-ghost btn-sm" id="cookieRejectModal" type="button"><span data-lang-el>Απόρριψη όλων</span><span data-lang-en>Reject all</span></button>
        <button class="btn btn-primary btn-sm" id="cookieSaveModal" type="button"><span data-lang-el>Αποθήκευση προτιμήσεων</span><span data-lang-en>Save preferences</span></button>
      </div>`;

    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    return { overlay, modal };
  }

  document.addEventListener("DOMContentLoaded", () => {
    const bannerOverlay = buildBannerOverlay();
    const banner = buildBanner();
    const { overlay, modal } = buildModal();

    const openModal = () => { overlay.classList.add("is-visible"); modal.classList.add("is-visible"); };
    const closeModal = () => { overlay.classList.remove("is-visible"); modal.classList.remove("is-visible"); };

    /* This gate reappears on every visit (by design), so scrolling stays
       locked from the moment the page loads until the visitor resolves it
       via Accept, Reject, or Save/Reject inside Manage. */
    document.body.style.overflow = "hidden";
    function resolveGate() {
      document.body.style.overflow = "";
      bannerOverlay.classList.remove("is-visible");
      banner.classList.remove("is-visible");
    }

    function setToggleState(id, on) {
      const btn = modal.querySelector(`.toggle[data-cat="${id}"]`);
      if (!btn || btn.classList.contains("is-disabled")) return;
      btn.classList.toggle("is-on", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    }
    function readToggles() {
      const out = {};
      CATS.forEach((id) => {
        const btn = modal.querySelector(`.toggle[data-cat="${id}"]`);
        out[id] = btn.classList.contains("is-on");
      });
      return out;
    }
    modal.querySelectorAll(".toggle").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.classList.contains("is-disabled")) return;
        btn.classList.toggle("is-on");
        btn.setAttribute("aria-pressed", btn.classList.contains("is-on") ? "true" : "false");
      });
    });

    const existing = getConsent();
    if (existing) {
      CATS.forEach((id) => setToggleState(id, !!existing[id]));
      applyIntegrations(existing);
    }
    // Shown on every visit by design, regardless of a past choice.
    setTimeout(() => {
      bannerOverlay.classList.add("is-visible");
      banner.classList.add("is-visible");
    }, 300);

    document.getElementById("cookieAccept").addEventListener("click", () => {
      saveConsent({ preferences: true, analytics: true, marketing: true });
      resolveGate();
      window.HCToast && window.HCToast(window.HC_LANG.t("consentAcceptedAll"));
    });
    document.getElementById("cookieReject").addEventListener("click", () => {
      saveConsent({ preferences: false, analytics: false, marketing: false });
      resolveGate();
      window.HCToast && window.HCToast(window.HC_LANG.t("consentRejected"));
    });
    document.getElementById("cookieManage").addEventListener("click", () => {
      CATS.forEach((id) => setToggleState(id, existing ? !!existing[id] : id === "necessary"));
      openModal();
    });
    document.getElementById("cookieModalClose").addEventListener("click", closeModal);
    overlay.addEventListener("click", closeModal);
    window.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
    document.getElementById("cookieRejectModal").addEventListener("click", () => {
      CATS.forEach((id) => setToggleState(id, id === "necessary"));
      saveConsent(readToggles());
      closeModal();
      resolveGate();
      window.HCToast && window.HCToast(window.HC_LANG.t("consentRejected"));
    });
    document.getElementById("cookieSaveModal").addEventListener("click", () => {
      saveConsent(readToggles());
      closeModal();
      resolveGate();
      window.HCToast && window.HCToast(window.HC_LANG.t("consentSaved"));
    });

    // reopen from footer link on any page
    document.querySelectorAll("[data-open-cookie-settings]").forEach((trigger) => {
      trigger.addEventListener("click", (e) => {
        e.preventDefault();
        const c = getConsent();
        CATS.forEach((id) => setToggleState(id, c ? !!c[id] : id === "necessary"));
        openModal();
      });
    });
  });
})();
