/* ==========================================================================
   SITRIXWEB — hero console

   Replaces the globe with something that answers back. Visitors type a
   command (or tap one of the chips, which is how it works on a phone) and
   the console responds in whichever language the site is set to, and where
   it makes sense, takes them to the section they asked about.

   Deliberate choices:
   • It never steals focus on load. Autofocusing an input at the top of a
     page hijacks the first keystroke and, on mobile, throws the keyboard
     over the hero before anyone has read it.
   • Output is a live region, so a screen reader announces responses.
   • The typing effect is decoration: under prefers-reduced-motion every
     line prints instantly, and the caret stops blinking.
   • No timers run when it is idle — the only loop is the one printing a
     line, and it stops when the queue empties.
   ========================================================================== */
(() => {
  "use strict";

  const root = document.getElementById("console");
  if (!root) return;

  const out = root.querySelector(".console__out");
  const input = root.querySelector(".console__input");
  const form = root.querySelector(".console__form");
  const chipRow = root.querySelector(".console__chips");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  const L = () => (window.SitrixLang ? window.SitrixLang.get() : "en");

  /* ------------------------------------------------------------ commands */
  /* Each command answers in both languages; `go` scrolls to a section after
     the answer has printed, so the console explains before it moves you. */
  const COMMANDS = {
    help: {
      names: ["help", "?", "βοηθεια", "βοήθεια"],
      lines: {
        en: ["Commands: <b>work</b> · <b>book</b> · <b>price</b> · <b>stack</b> · <b>about</b> · <b>contact</b>",
             "Also: <b>lang</b> to switch language, <b>clear</b> to wipe the screen."],
        el: ["Εντολές: <b>work</b> · <b>book</b> · <b>price</b> · <b>stack</b> · <b>about</b> · <b>contact</b>",
             "Επίσης: <b>lang</b> για αλλαγή γλώσσας, <b>clear</b> για καθαρισμό."],
      },
    },
    work: {
      names: ["work", "works", "portfolio", "εργα", "έργα"],
      lines: {
        en: ["4 selected projects — brand sites, reservations, an accessibility rebuild.", "Taking you there…"],
        el: ["4 επιλεγμένα έργα — εταιρικά sites, κρατήσεις, ανακατασκευή προσβασιμότητας.", "Σας πάω εκεί…"],
      },
      go: "works",
    },
    book: {
      names: ["book", "booking", "call", "κρατηση", "κράτηση"],
      lines: {
        en: ["A free 30-minute call. No payment, no card, no pitch.", "Opening the calendar…"],
        el: ["Δωρεάν κλήση 30 λεπτών. Καμία πληρωμή, καμία κάρτα, καμία πίεση.", "Ανοίγω το ημερολόγιο…"],
      },
      go: "booking",
    },
    price: {
      names: ["price", "prices", "cost", "τιμη", "τιμή", "τιμες", "τιμές"],
      lines: {
        en: ["Fixed price per project, quoted from a written scope — never per hour and never open-ended.",
             "The call is where we work out what yours would be. Type <b>book</b>."],
        el: ["Σταθερή τιμή ανά έργο, από γραπτό αντικείμενο — ποτέ με την ώρα, ποτέ ανοιχτά.",
             "Στην κλήση βρίσκουμε τι κοστίζει το δικό σας. Γράψτε <b>book</b>."],
      },
    },
    stack: {
      names: ["stack", "tech", "τεχνολογιες", "τεχνολογίες"],
      lines: {
        en: ["Hand-written HTML, CSS and JavaScript. A headless CMS when you need to edit things yourself.",
             "No page builder, no bloated theme, nothing you cannot take elsewhere."],
        el: ["HTML, CSS και JavaScript γραμμένα στο χέρι. Headless CMS όταν θέλετε να τα αλλάζετε μόνοι σας.",
             "Χωρίς page builder, χωρίς βαρύ theme, τίποτα που να μην μπορείτε να πάρετε αλλού."],
      },
    },
    about: {
      names: ["about", "who", "studio", "στουντιο", "στούντιο"],
      lines: {
        en: ["One developer in Thessaloniki, working across the EU. Studio opened 01.06.2026.", "More below…"],
        el: ["Ένας προγραμματιστής στη Θεσσαλονίκη, με πελάτες σε όλη την ΕΕ. Έναρξη 01.06.2026.", "Περισσότερα παρακάτω…"],
      },
      go: "about",
    },
    contact: {
      names: ["contact", "email", "mail", "επικοινωνια", "επικοινωνία"],
      lines: {
        en: ["Email is the fastest way to reach me — I answer within a working day."],
        el: ["Το email είναι ο γρηγορότερος τρόπος — απαντώ εντός μίας εργάσιμης."],
      },
      run() {
        const cfg = window.SITRIX || {};
        print('<a class="ulink" href="mailto:' + (cfg.email || "") + '">' + (cfg.email || "") + "</a>", "link");
      },
    },
    lang: {
      names: ["lang", "language", "γλωσσα", "γλώσσα"],
      lines: { en: ["Switching language…"], el: ["Αλλαγή γλώσσας…"] },
      run() {
        if (window.SitrixLang) window.SitrixLang.set(L() === "el" ? "en" : "el");
      },
    },
    clear: {
      names: ["clear", "cls", "καθαρισμος", "καθαρισμός"],
      run() { out.innerHTML = ""; },
    },
    /* A couple of replies for the people who will inevitably try. */
    whoami: {
      names: ["whoami"],
      lines: {
        en: ["A visitor with good taste in websites."],
        el: ["Ένας επισκέπτης με καλό γούστο στα websites."],
      },
    },
    sudo: {
      names: ["sudo", "rm", "rm -rf", "hack"],
      lines: {
        en: ["Nice try. This one is read-only."],
        el: ["Καλή προσπάθεια. Αυτό εδώ είναι μόνο για ανάγνωση."],
      },
    },
  };

  const NOT_FOUND = {
    en: ["Command not found. Type <b>help</b> to see what this thing knows."],
    el: ["Άγνωστη εντολή. Γράψτε <b>help</b> για να δείτε τι ξέρει."],
  };
  const BOOT = {
    en: ["SitrixWeb console · ready", "Type <b>help</b>, or tap a command below."],
    el: ["Κονσόλα SitrixWeb · έτοιμη", "Γράψτε <b>help</b> ή πατήστε μια εντολή παρακάτω."],
  };

  function lookup(raw) {
    const q = raw.trim().toLowerCase();
    if (!q) return null;
    for (const key in COMMANDS) {
      if (COMMANDS[key].names.indexOf(q) !== -1) return COMMANDS[key];
    }
    return undefined;   // typed something, but nothing matched
  }

  /* -------------------------------------------------------------- output */
  let queue = [], typing = false;

  function line(cls) {
    const el = document.createElement("p");
    el.className = "console__line" + (cls ? " console__line--" + cls : "");
    out.appendChild(el);
    return el;
  }

  function scrollOut() { out.scrollTop = out.scrollHeight; }

  function print(html, cls) {
    // Instant: used for echoes, links and reduced-motion output.
    const el = line(cls);
    el.innerHTML = html;
    scrollOut();
    trim();
  }

  function type(html, cls) {
    if (reduced.matches) { print(html, cls); return; }
    queue.push({ html, cls });
    if (!typing) next();
  }

  function next() {
    const item = queue.shift();
    if (!item) { typing = false; return; }
    typing = true;
    const el = line(item.cls);
    // Type the visible characters while leaving any markup intact: the text
    // is revealed by growing a substring of the final HTML only at tag
    // boundaries, so a half-typed <b> never renders as literal angle
    // brackets.
    const chunks = item.html.match(/(<[^>]+>|[^<]{1})/g) || [];
    let i = 0;
    const step = () => {
      el.innerHTML = chunks.slice(0, ++i).join("");
      scrollOut();
      if (i < chunks.length) {
        setTimeout(step, chunks[i - 1] && chunks[i - 1][0] === "<" ? 0 : 13);
      } else {
        trim();
        next();
      }
    };
    step();
  }

  // Keep the transcript short; this is a hero panel, not a log file.
  function trim() {
    while (out.children.length > 40) out.removeChild(out.firstChild);
  }

  function goTo(id) {
    const target = document.getElementById(id);
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY - 72;
    window.scrollTo({ top, behavior: reduced.matches ? "auto" : "smooth" });
  }

  /* --------------------------------------------------------------- input */
  const history = [];
  let histIndex = -1;

  function run(raw) {
    const value = raw.trim();
    if (!value) return;
    history.push(value);
    histIndex = history.length;

    print("<span>&gt;</span> " + escapeHtml(value), "echo");

    const cmd = lookup(value);
    if (cmd === undefined) {
      (NOT_FOUND[L()] || NOT_FOUND.en).forEach((l) => type(l, "err"));
      return;
    }
    if (cmd.lines) (cmd.lines[L()] || cmd.lines.en).forEach((l) => type(l));
    if (cmd.run) cmd.run();
    if (cmd.go) setTimeout(() => goTo(cmd.go), reduced.matches ? 0 : 700);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[c]);
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    run(input.value);
    input.value = "";
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (histIndex > 0) input.value = history[--histIndex] || "";
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (histIndex < history.length - 1) input.value = history[++histIndex] || "";
      else { histIndex = history.length; input.value = ""; }
    }
  });

  // The chips are the whole interface on a phone, and a shortcut on desktop.
  chipRow.addEventListener("click", (e) => {
    const chip = e.target.closest("[data-cmd]");
    if (!chip) return;
    run(chip.getAttribute("data-cmd"));
    if (!window.matchMedia("(hover: none)").matches) input.focus();
  });

  // Clicking anywhere in the panel puts the caret where you would expect.
  root.addEventListener("click", (e) => {
    if (e.target.closest("a, [data-cmd]")) return;
    if (!window.matchMedia("(hover: none)").matches) input.focus();
  });

  root.addEventListener("focusin", () => root.classList.add("is-live"));
  root.addEventListener("focusout", () => root.classList.remove("is-live"));

  /* ---------------------------------------------------------------- boot */
  function boot() {
    out.innerHTML = "";
    (BOOT[L()] || BOOT.en).forEach((l) => type(l, "sys"));
  }

  // Re-boot in the new language when the visitor switches, and relabel the
  // input's placeholder and accessible name.
  document.addEventListener("sitrix:lang", () => {
    queue = [];
    boot();
  });

  boot();
})();
