import { forwardRef, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HOURS,
  ADDRESS_LINES,
  PHONE_DISPLAY,
  PHONE_HREF,
  RESERVATION_EMAIL,
} from '../data/restaurant';
import { DatePicker } from '../components/DatePicker';
import { TimePicker } from '../components/TimePicker';
import { MapEmbed } from '../components/MapEmbed';
import { useConsent } from '../consent/useConsent';
import './ReservationPage.css';

const DONENESS_OPTIONS = ['Rare', 'Medium-Rare', 'Medium', 'Medium-Well', 'Well-Done'];

const initialForm = {
  name: '',
  email: '',
  phone: '',
  date: '',
  time: '',
  guests: '2',
  notes: '',
  doneness: '',
  dishQuantity: '1',
};

const Field = forwardRef(function Field({ label, children, full, error, shake }, ref) {
  return (
    <label
      ref={ref}
      className={`field ${full ? 'field--full' : ''} ${error ? 'field--invalid' : ''} ${shake ? 'field--shake' : ''}`}
    >
      <span className="field__label">{label}</span>
      {children}
      {error && <span className="field__error">{error}</span>}
    </label>
  );
});

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ReservationPage() {
  const location = useLocation();
  const dish = location.state?.dish;
  const { openPreferences } = useConsent();

  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState('idle');
  const [errors, setErrors] = useState({});
  const [shakeField, setShakeField] = useState(null);
  const navigate = useNavigate();
  const fieldRefs = useRef({});

  function update(key) {
    return (e) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
      setErrors((prev) => (prev[key] ? { ...prev, [key]: '' } : prev));
    };
  }

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: '' } : prev));
  }

  function fieldRef(key) {
    return (el) => {
      fieldRefs.current[key] = el;
    };
  }

  function validate() {
    const next = {};
    if (!form.name.trim()) next.name = 'Please enter your name.';
    if (!form.email.trim()) {
      next.email = 'Please enter your email.';
    } else if (!EMAIL_PATTERN.test(form.email.trim())) {
      next.email = 'Please enter a valid email address.';
    }
    if (!form.date) next.date = 'Please select a date.';
    if (!form.time) next.time = 'Please select a time.';
    if (dish && !form.doneness) next.doneness = 'Please choose a preferred doneness.';
    return next;
  }

  function triggerShake(key) {
    setShakeField(null);
    requestAnimationFrame(() => {
      setShakeField(key);
      window.setTimeout(() => setShakeField((f) => (f === key ? null : f)), 500);
    });
  }

  function handleSubmit(e) {
    e.preventDefault();

    const nextErrors = validate();
    setErrors(nextErrors);

    const fieldOrder = ['name', 'email', 'date', 'time', 'doneness'];
    const firstInvalid = fieldOrder.find((key) => nextErrors[key]);

    if (firstInvalid) {
      const node = fieldRefs.current[firstInvalid];
      node?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      triggerShake(firstInvalid);
      return;
    }

    setStatus('sending');

    const subject = `Reservation request — ${form.name}`;
    const bodyLines = [
      `Name: ${form.name}`,
      `Email: ${form.email}`,
      `Phone: ${form.phone || '—'}`,
      `Date: ${form.date}`,
      `Time: ${form.time}`,
      `Guests: ${form.guests}`,
      ...(dish
        ? [`Dish: ${dish}`, `Quantity: ${form.dishQuantity}`, `Doneness: ${form.doneness}`]
        : []),
      `Notes: ${form.notes || '—'}`,
    ];
    const mailto = `mailto:${RESERVATION_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;

    window.setTimeout(() => {
      navigate('/confirmation', {
        state: {
          name: form.name,
          date: form.date,
          time: form.time,
          guests: form.guests,
          ...(dish
            ? { dish, dishQuantity: form.dishQuantity, doneness: form.doneness }
            : {}),
        },
      });

      window.setTimeout(() => {
        try {
          const mailFrame = document.createElement('iframe');
          mailFrame.style.display = 'none';
          mailFrame.src = mailto;
          document.body.appendChild(mailFrame);
          window.setTimeout(() => mailFrame.remove(), 2000);
        } catch {
          // Opening the mail client is a best-effort convenience; never block the confirmation page on it.
        }
      }, 300);
    }, 600);
  }

  return (
    <div className="reserve-page">
      <header className="reserve-page__header">
        <div className="container reserve-page__header-inner">
          <Link to="/" className="reserve-page__logo">
            PYRA<span>.</span>
          </Link>
          <Link to="/" className="reserve-page__back">
            &larr; Back to Home
          </Link>
        </div>
      </header>

      <main className="reserve-page__main container">
        <motion.div
          className="reserve-page__intro"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="eyebrow">Reservations</p>
          <h1 className="section-title">
            {dish ? (
              <>
                Reserve the <em>{dish}</em>
              </>
            ) : (
              <>
                Reserve your <em>table</em>
              </>
            )}
          </h1>
          <p className="section-lede">
            For parties larger than 10, or same-day requests, please call us directly at{' '}
            <a href={PHONE_HREF} className="reserve-page__phone">
              {PHONE_DISPLAY}
            </a>
            .
          </p>
        </motion.div>

        <div className="reserve-page__grid">
          <motion.div
            className="reserve-page__card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <form className="reservation__form" onSubmit={handleSubmit} noValidate>
              {dish && (
                <div className="reservation__dish-banner">
                  <span>Reserving</span>
                  <strong>{dish}</strong>
                </div>
              )}

              <Field label="Full Name" ref={fieldRef('name')} error={errors.name} shake={shakeField === 'name'}>
                <input type="text" value={form.name} onChange={update('name')} placeholder="Your name" />
              </Field>
              <Field label="Email" ref={fieldRef('email')} error={errors.email} shake={shakeField === 'email'}>
                <input type="email" value={form.email} onChange={update('email')} placeholder="you@email.com" />
              </Field>
              <Field label="Phone">
                <input type="tel" value={form.phone} onChange={update('phone')} placeholder="+30 …" />
              </Field>
              <Field label="Guests">
                <select value={form.guests} onChange={update('guests')}>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? 'Guest' : 'Guests'}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Date" ref={fieldRef('date')} error={errors.date} shake={shakeField === 'date'}>
                <DatePicker value={form.date} onChange={(value) => setField('date', value)} />
              </Field>
              <Field label="Time" ref={fieldRef('time')} error={errors.time} shake={shakeField === 'time'}>
                <TimePicker value={form.time} onChange={(value) => setField('time', value)} />
              </Field>

              {dish && (
                <>
                  <Field label="Quantity">
                    <select value={form.dishQuantity} onChange={update('dishQuantity')}>
                      {Array.from({ length: 6 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? 'Order' : 'Orders'}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field
                    label="Preferred Doneness"
                    ref={fieldRef('doneness')}
                    error={errors.doneness}
                    shake={shakeField === 'doneness'}
                  >
                    <select value={form.doneness} onChange={update('doneness')}>
                      <option value="" disabled>
                        Select doneness
                      </option>
                      {DONENESS_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </Field>
                </>
              )}

              <Field label="Special Requests" full>
                <textarea rows={3} value={form.notes} onChange={update('notes')} placeholder="Allergies, occasion, seating preference…" />
              </Field>

              <button type="submit" className="btn btn-primary reservation__submit" disabled={status === 'sending'}>
                {status === 'sending' ? 'Preparing request…' : 'Request Reservation'}
              </button>
            </form>
          </motion.div>

          <motion.aside
            className="reserve-page__sidebar"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="reserve-page__sidebar-block">
              <h3>Address</h3>
              <p>
                {ADDRESS_LINES.map((line, i) => (
                  <span key={line}>
                    {line}
                    {i < ADDRESS_LINES.length - 1 && <br />}
                  </span>
                ))}
              </p>
            </div>

            <div className="reserve-page__sidebar-block">
              <h3>Contact</h3>
              <p>
                <a href={PHONE_HREF}>{PHONE_DISPLAY}</a>
                <br />
                <a href={`mailto:${RESERVATION_EMAIL}`}>{RESERVATION_EMAIL}</a>
              </p>
            </div>

            <div className="reserve-page__sidebar-block">
              <h3>Hours</h3>
              <ul className="reserve-page__hours">
                {HOURS.map((h) => (
                  <li key={h.day}>
                    <span>{h.day}</span>
                    <span>{h.time}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="reserve-page__map">
              <MapEmbed />
            </div>
          </motion.aside>
        </div>
      </main>

      <footer className="reserve-page__footer">
        <div className="container reserve-page__footer-inner">
          <p>&copy; {new Date().getFullYear()} PYRA Athens Steakhouse.</p>
          <div className="reserve-page__footer-links">
            <Link to="/privacy">Privacy Policy</Link>
            <button type="button" className="reserve-page__footer-btn" onClick={openPreferences}>
              Cookie Preferences
            </button>
            <Link to="/">Back to homepage</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
