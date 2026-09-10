/* ==========================================================================
   SITRIXWEB — single edit point for everything that changes per deployment.
   Nothing else in the codebase hard-codes these values; edit them here once
   and every page picks them up (see README.md → "Before you go live").
   ========================================================================== */
window.SITRIX = {
  /* Your Instagram profile. Every Instagram button on the site points here.
     Replace the handle when the account is ready — that's the only edit
     needed; the buttons already carry a sensible href as a no-JS fallback. */
  instagram: "https://www.instagram.com/sitrixweb/",

  /* Contact — used by the mailto fallbacks on the booking and review forms. */
  email: "hello@sitrixweb.com",
  phone: "+30 000 000 0000",

  /* Where the booking and review forms POST.
     Leave "" and both forms fall back to opening a pre-filled email instead,
     so the site is fully functional on plain static hosting with no backend.
     Set it to your own endpoint (Formspree, Basin, a Worker, whatever) and
     they will POST JSON to it instead. */
  formEndpoint: "",

  /* Cursor companion (desktop only — see js/cursor.js and cursor-lab.html).
     One of: "off", "orbit", "stardust", "reticle", "field".
     Changing this one word changes it on every page at once. */
  cursor: "field",

  /* Booking availability, in your local (Europe/Athens) time. */
  booking: {
    /* 0 = Sunday … 6 = Saturday. Days not listed are shown as unavailable. */
    workdays: [1, 2, 3, 4, 5],
    /* 30-minute consultation slots offered on a working day. */
    slots: ["10:00", "10:30", "11:00", "11:30", "12:00",
            "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"],
    /* Earliest bookable day, counted from today (1 = from tomorrow). */
    leadDays: 1,
    /* How far ahead the calendar lets people book. */
    horizonDays: 60,
    timezoneLabel: "Europe/Athens (EEST/EET)"
  }
};
