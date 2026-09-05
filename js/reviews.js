/* ===========================================================================
   Reviews: display and submission
   ---------------------------------------------------------------------------
   The list is fetched from reviews.php, which merges two sources server-side:
   Google (live, via the Places API, key never exposed to the browser) and
   reviews left on this site that the clinic has approved. The endpoint already
   filters to 4 and 5 stars and returns the newest five, so a new review
   anywhere pushes the oldest out of the section on its own.

   Nothing is ever invented to fill the space: if the feed is empty or Google is
   unreachable, the section says so and points at Google instead.
   =========================================================================== */

(function () {
  "use strict";

  var section = document.getElementById("reviews");
  if (!section) return;

  var listEl = document.getElementById("reviews-list");
  var stateEl = document.getElementById("reviews-state");
  var summaryEl = document.getElementById("reviews-summary");
  var scoreEl = document.getElementById("reviews-score");
  var starsEl = document.getElementById("reviews-stars");
  var countEl = document.getElementById("reviews-count");
  var attributionEl = document.getElementById("reviews-attribution");
  var allLink = document.getElementById("reviews-all");

  var data = null;

  function t(key) { return window.VetCareI18n ? window.VetCareI18n.t(key) : ""; }
  function lang() { return window.VetCareI18n ? window.VetCareI18n.lang : "el"; }

  function setState(key) {
    stateEl.hidden = !key;
    if (key) {
      stateEl.textContent = t(key);
      stateEl.setAttribute("data-state-key", key);
    } else {
      stateEl.removeAttribute("data-state-key");
    }
  }

  function starRow(rating) {
    var wrap = document.createElement("span");
    wrap.className = "stars";
    wrap.setAttribute("aria-label", t("reviews.starsLabel").replace("{n}", String(rating)));
    for (var i = 1; i <= 5; i++) {
      var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("aria-hidden", "true");
      var use = document.createElementNS("http://www.w3.org/2000/svg", "use");
      use.setAttribute("href", i <= rating ? "#i-star" : "#i-star-outline");
      svg.appendChild(use);
      if (i > rating) svg.setAttribute("class", "is-empty");
      wrap.appendChild(svg);
    }
    return wrap;
  }

  /* "2 months ago", in whichever language the page is in — computed here rather
     than using Google's pre-rendered phrase, which would not follow the toggle. */
  function relativeTime(isoString) {
    if (!isoString) return "";
    var then = new Date(isoString);
    if (isNaN(then.getTime())) return "";
    var seconds = (then.getTime() - Date.now()) / 1000;
    var units = [
      ["year", 31536000], ["month", 2592000], ["week", 604800],
      ["day", 86400], ["hour", 3600], ["minute", 60]
    ];
    try {
      var rtf = new Intl.RelativeTimeFormat(lang() === "el" ? "el" : "en", { numeric: "auto" });
      for (var i = 0; i < units.length; i++) {
        if (Math.abs(seconds) >= units[i][1] || units[i][0] === "minute") {
          return rtf.format(Math.round(seconds / units[i][1]), units[i][0]);
        }
      }
    } catch (e) {
      return then.toLocaleDateString();
    }
    return "";
  }

  function initials(name) {
    var parts = (name || "").trim().split(/\s+/);
    var out = (parts[0] || "").charAt(0);
    if (parts.length > 1) out += parts[parts.length - 1].charAt(0);
    return out.toUpperCase() || "?";
  }

  function card(review) {
    var article = document.createElement("article");
    article.className = "rvcard";

    var top = document.createElement("div");
    top.className = "rvcard__top";

    var avatar = document.createElement("span");
    avatar.className = "rvcard__avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = initials(review.author);
    top.appendChild(avatar);

    var who = document.createElement("div");
    who.className = "rvcard__who";

    var name = document.createElement("p");
    name.className = "rvcard__name";
    /* textContent, never innerHTML: this is text other people wrote. */
    name.textContent = review.author || "—";
    who.appendChild(name);

    var meta = document.createElement("p");
    meta.className = "rvcard__meta";
    var when = relativeTime(review.time) || review.ago || "";
    if (review.source === "google") {
      var badge = document.createElement("span");
      badge.className = "rvcard__src";
      badge.innerHTML = '<svg width="13" height="13" aria-hidden="true"><use href="#i-google"/></svg>';
      badge.appendChild(document.createTextNode(" " + t("reviews.sourceGoogle")));
      meta.appendChild(badge);
    } else {
      var siteBadge = document.createElement("span");
      siteBadge.className = "rvcard__src rvcard__src--site";
      siteBadge.textContent = t("reviews.sourceSite");
      meta.appendChild(siteBadge);
    }
    if (when) meta.appendChild(document.createTextNode(" · " + when));
    who.appendChild(meta);
    top.appendChild(who);
    article.appendChild(top);

    article.appendChild(starRow(review.rating));

    var quote = document.createElement("blockquote");
    quote.className = "rvcard__text";
    quote.textContent = review.text;
    article.appendChild(quote);

    if (review.url) {
      var link = document.createElement("a");
      link.className = "rvcard__link";
      link.href = review.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = t("reviews.sourceGoogle");
      article.appendChild(link);
    }
    return article;
  }

  function render() {
    if (!data) return;

    if (data.googleUrl && allLink) allLink.href = data.googleUrl;

    if (data.rating && data.total) {
      scoreEl.textContent = t("reviews.summaryRating")
        .replace("{rating}", data.rating.toFixed(1).replace(".", lang() === "el" ? "," : "."));
      starsEl.textContent = "";
      starsEl.appendChild(starRow(Math.round(data.rating)));
      countEl.textContent = t("reviews.summaryCount").replace("{total}", String(data.total));
      summaryEl.hidden = false;
    }

    listEl.textContent = "";
    if (data.reviews && data.reviews.length) {
      data.reviews.forEach(function (review, i) {
        var el = card(review);
        el.style.setProperty("--reveal-delay", i * 60 + "ms");
        listEl.appendChild(el);
      });
      setState(null);
      if (attributionEl) {
        attributionEl.hidden = !data.reviews.some(function (r) { return r.source === "google"; });
      }
    } else {
      setState(data.notice === "google_unavailable" ? "reviews.error" : "reviews.empty");
      if (attributionEl) attributionEl.hidden = true;
    }
  }

  function load() {
    setState("reviews.loading");
    fetch("reviews.php", { headers: { Accept: "application/json" } })
      .then(function (response) {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.json();
      })
      .then(function (payload) {
        data = payload;
        render();
      })
      .catch(function () {
        /* No PHP (a static preview) or the endpoint failed: say so plainly and
           leave the two buttons, which work regardless. */
        data = { reviews: [], notice: "google_unavailable" };
        render();
      });
  }

  /* Google requires review content to be fetched live rather than warehoused,
     so the call is made once, and only when the section is actually reached —
     visitors who never scroll this far cost nothing. */
  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        observer.disconnect();
        load();
      }
    }, { rootMargin: "300px" });
    observer.observe(section);
  } else {
    load();
  }

  document.addEventListener("vetcare:langchange", function () {
    var key = stateEl.getAttribute("data-state-key");
    if (key) stateEl.textContent = t(key);
    render();
  });

  /* ------------------------------------------------------------ the form */
  var dialog = document.getElementById("review-dialog");
  var form = document.getElementById("review-form");
  var openBtn = document.getElementById("review-open");
  if (!dialog || !form || !openBtn) return;

  var ratingBox = document.getElementById("rv-rating");
  var statusBox = document.getElementById("rv-status");
  var statusText = document.getElementById("rv-status-text");
  var statusIcon = statusBox ? statusBox.querySelector("use") : null;
  var chosenRating = 0;

  /* A real radio group behind star buttons: keyboard and screen readers get
     proper semantics, everyone else gets stars. */
  function buildStars() {
    ratingBox.textContent = "";
    for (var i = 1; i <= 5; i++) {
      (function (value) {
        var star = document.createElement("button");
        star.type = "button";
        star.className = "rvstars__star";
        star.setAttribute("role", "radio");
        star.setAttribute("aria-checked", value === chosenRating ? "true" : "false");
        star.setAttribute("aria-label", t("reviews.starsLabel").replace("{n}", String(value)));
        star.tabIndex = value === (chosenRating || 1) ? 0 : -1;
        star.innerHTML = '<svg aria-hidden="true"><use href="#i-star' +
          (value <= chosenRating ? "" : "-outline") + '"/></svg>';
        star.addEventListener("click", function () { setRating(value); });
        star.addEventListener("keydown", function (event) {
          if (event.key === "ArrowRight" || event.key === "ArrowUp") {
            event.preventDefault(); setRating(Math.min(5, (chosenRating || 0) + 1));
          } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
            event.preventDefault(); setRating(Math.max(1, (chosenRating || 1) - 1));
          } else if (event.key === " " || event.key === "Enter") {
            event.preventDefault(); setRating(value);
          }
        });
        ratingBox.appendChild(star);
      })(i);
    }
  }

  function setRating(value) {
    chosenRating = value;
    buildStars();
    var focusTarget = ratingBox.children[value - 1];
    if (focusTarget) focusTarget.focus();
    fieldOf(ratingBox).classList.remove("has-error");
  }

  function fieldOf(el) { return el.closest(".field") || el.closest(".consent"); }

  function setError(el, on) {
    var wrap = fieldOf(el);
    if (wrap) wrap.classList.toggle("has-error", on);
    if (el.setAttribute) el.setAttribute("aria-invalid", on ? "true" : "false");
  }

  var ICONS = { ok: "#i-check-circle", err: "#i-alert", info: "#i-info" };
  function showStatus(kind, key) {
    statusBox.classList.remove("form-status--ok", "form-status--err", "form-status--info");
    statusBox.classList.add("is-visible", "form-status--" + kind);
    if (statusIcon) statusIcon.setAttribute("href", ICONS[kind] || ICONS.info);
    statusText.textContent = t(key);
    statusBox.setAttribute("data-status-key", key);
  }
  document.addEventListener("vetcare:langchange", function () {
    var key = statusBox.getAttribute("data-status-key");
    if (key) statusText.textContent = t(key);
    buildStars();
  });

  function openDialog() {
    chosenRating = 0;
    buildStars();
    statusBox.classList.remove("is-visible");
    statusBox.removeAttribute("data-status-key");
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    var first = document.getElementById("rv-name");
    if (first) first.focus();
  }
  function closeDialog() {
    if (typeof dialog.close === "function" && dialog.open) dialog.close();
    else dialog.removeAttribute("open");
    openBtn.focus();
  }

  openBtn.addEventListener("click", openDialog);
  document.getElementById("rv-cancel").addEventListener("click", closeDialog);

  form.addEventListener("input", function (event) {
    if (event.target.getAttribute("aria-invalid") === "true") setError(event.target, false);
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    if (form.elements.website && form.elements.website.value !== "") {
      showStatus("ok", "review.status.ok");
      return;
    }

    var nameEl = document.getElementById("rv-name");
    var textEl = document.getElementById("rv-text");
    var emailEl = document.getElementById("rv-email");
    var consentEl = document.getElementById("rv-consent");
    var problems = [];

    var nameOk = nameEl.value.trim().length >= 2;
    setError(nameEl, !nameOk); if (!nameOk) problems.push(nameEl);

    var ratingOk = chosenRating >= 1 && chosenRating <= 5;
    fieldOf(ratingBox).classList.toggle("has-error", !ratingOk);
    if (!ratingOk) problems.push(ratingBox.querySelector("button"));

    var textOk = textEl.value.trim().length >= 10;
    setError(textEl, !textOk); if (!textOk) problems.push(textEl);

    var emailOk = emailEl.value.trim() === "" || /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(emailEl.value.trim());
    setError(emailEl, !emailOk); if (!emailOk) problems.push(emailEl);

    var consentOk = consentEl.checked;
    setError(consentEl, !consentOk); if (!consentOk) problems.push(consentEl);

    if (problems.length) { problems[0].focus(); return; }

    showStatus("info", "review.status.sending");
    var submitBtn = document.getElementById("rv-submit");
    submitBtn.disabled = true;

    fetch("review-submit.php", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        author: nameEl.value.trim(),
        email: emailEl.value.trim(),
        text: textEl.value.trim(),
        rating: chosenRating,
        consent: true
      })
    })
      .then(function (response) {
        return response.json().catch(function () { return {}; }).then(function (body) {
          if (!response.ok || !body.ok) {
            var e = new Error(body.error || "http");
            e.code = body.error;
            throw e;
          }
        });
      })
      .then(function () {
        showStatus("ok", "review.status.ok");
        form.reset();
        chosenRating = 0;
        buildStars();
      })
      .catch(function (err) {
        showStatus("err", err && err.code === "rate" ? "review.err.rate" : "review.status.err");
      })
      .then(function () {
        submitBtn.disabled = false;
      });
  });

  buildStars();
})();
