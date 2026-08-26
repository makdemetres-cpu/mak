/* ==========================================================================
   Ermis' Villas — contact form
   Same two submission routes as the booking flow: POST to EV.FORM_ENDPOINT if
   one is configured, otherwise compose the message into an email so the form
   still works on a static host with nothing behind it.
   ========================================================================== */
(() => {
  "use strict";

  const form = document.getElementById('contactForm');
  if (!form) return;

  const BUSINESS = (window.EV && window.EV.BUSINESS) || {};
  const ENDPOINT = (window.EV && window.EV.FORM_ENDPOINT) || '';
  const el = (id) => document.getElementById(id);
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const TOPICS = {
    general: 'A general question',
    estate: 'One of the houses',
    dates: 'Dates and availability',
    services: 'Chef, cars or experiences',
    existing: 'An existing booking',
    privacy: 'My personal data'
  };

  function setError(id, on) {
    const input = el(id);
    const field = input.closest('.field');
    if (field) field.classList.toggle('has-error', on);
    input.setAttribute('aria-invalid', on ? 'true' : 'false');
  }

  function validate() {
    let ok = true;
    [['cName', (v) => !!v.trim()],
     ['cEmail', (v) => EMAIL_RE.test(v.trim())],
     ['cMessage', (v) => v.trim().length >= 4]
    ].forEach(([id, test]) => {
      const bad = !test(el(id).value);
      setError(id, bad);
      if (bad) ok = false;
    });
    if (!ok) {
      const first = form.querySelector('.has-error input, .has-error textarea');
      if (first) first.focus();
    }
    return ok;
  }

  // Clear an error as soon as the visitor starts fixing it.
  form.addEventListener('input', (e) => {
    const field = e.target.closest('.field.has-error');
    if (field) field.classList.remove('has-error');
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (form.querySelector('input[name="website"]').value) return;   // honeypot

    const consent = el('cConsent');
    el('cConsentError').style.display = consent.checked ? 'none' : 'block';
    if (!consent.checked) { consent.focus(); return; }
    if (!validate()) return;

    const payload = {
      sentAt: new Date().toISOString(),
      name: el('cName').value.trim(),
      email: el('cEmail').value.trim(),
      phone: el('cPhone').value.trim(),
      topic: TOPICS[el('cTopic').value] || el('cTopic').value,
      message: el('cMessage').value.trim()
    };

    // If they arrived on a tagged link this visit, say which one. See
    // js/main.js → initCampaign and privacy.html §9.
    const campaign = window.EV.campaign && window.EV.campaign();
    if (campaign) payload.campaign = campaign;

    const btn = el('cSubmit');
    btn.setAttribute('aria-disabled', 'true');
    btn.textContent = 'Sending…';

    if (ENDPOINT) {
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then((r) => { if (!r.ok) throw new Error('bad status'); finish(false); })
        .catch(() => { openMail(payload); finish(true); });
    } else {
      openMail(payload);
      finish(true);
    }
  });

  function openMail(p) {
    const body = [
      `Name: ${p.name}`,
      `Email: ${p.email}`,
      p.phone ? `Phone: ${p.phone}` : '',
      `About: ${p.topic}`,
      '',
      p.message,
      (window.EV.campaignLine && window.EV.campaignLine()) ? '\n' + window.EV.campaignLine() : ''
    ].filter(Boolean).join('\n').slice(0, 1800);

    window.location.href = `mailto:${BUSINESS.email || ''}` +
      `?subject=${encodeURIComponent('Website enquiry — ' + p.topic)}` +
      `&body=${encodeURIComponent(body)}`;
  }

  function finish(viaMail) {
    form.hidden = true;
    el('cMailFallback').style.display = viaMail ? 'block' : 'none';
    const done = el('cDone');
    done.classList.add('is-shown');
    done.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
})();
