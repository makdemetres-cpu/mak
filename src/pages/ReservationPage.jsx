import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HOURS,
  ADDRESS_LINES,
  PHONE_DISPLAY,
  PHONE_HREF,
  RESERVATION_EMAIL,
  MAP_EMBED_URL,
} from '../data/restaurant';
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

function Field({ label, children, full }) {
  return (
    <label className={`field ${full ? 'field--full' : ''}`}>
      <span className="field__label">{label}</span>
      {children}
    </label>
  );
}

export function ReservationPage() {
  const location = useLocation();
  const dish = location.state?.dish;

  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  function update(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.name || !form.email || !form.date || !form.time) {
      setError('Please fill in your name, email, date, and time.');
      return;
    }

    if (dish && !form.doneness) {
      setError('Please choose a preferred doneness for your dish.');
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
            <form className="reservation__form" onSubmit={handleSubmit}>
              {dish && (
                <div className="reservation__dish-banner">
                  <span>Reserving</span>
                  <strong>{dish}</strong>
                </div>
              )}

              <Field label="Full Name">
                <input type="text" required value={form.name} onChange={update('name')} placeholder="Your name" />
              </Field>
              <Field label="Email">
                <input type="email" required value={form.email} onChange={update('email')} placeholder="you@email.com" />
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
              <Field label="Date">
                <input type="date" required value={form.date} onChange={update('date')} />
              </Field>
              <Field label="Time">
                <input type="time" required value={form.time} onChange={update('time')} />
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
                  <Field label="Preferred Doneness">
                    <select value={form.doneness} onChange={update('doneness')} required>
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

              {error && <p className="reservation__error">{error}</p>}

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
              <iframe title="PYRA Athens location map" src={MAP_EMBED_URL} loading="lazy" />
            </div>
          </motion.aside>
        </div>
      </main>

      <footer className="reserve-page__footer">
        <div className="container reserve-page__footer-inner">
          <p>&copy; {new Date().getFullYear()} PYRA Athens Steakhouse.</p>
          <Link to="/">Back to homepage</Link>
        </div>
      </footer>
    </div>
  );
}
