import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Reveal } from './Reveal';
import './Reservation.css';

const RESTAURANT_EMAIL = 'reservations@pyra-athens.gr';

const initialForm = {
  name: '',
  email: '',
  phone: '',
  date: '',
  time: '',
  guests: '2',
  notes: '',
};

function Field({ label, children, full }) {
  return (
    <label className={`field ${full ? 'field--full' : ''}`}>
      <span className="field__label">{label}</span>
      {children}
    </label>
  );
}

export function Reservation() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

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

    setStatus('sending');

    const subject = `Reservation request — ${form.name}`;
    const bodyLines = [
      `Name: ${form.name}`,
      `Email: ${form.email}`,
      `Phone: ${form.phone || '—'}`,
      `Date: ${form.date}`,
      `Time: ${form.time}`,
      `Guests: ${form.guests}`,
      `Notes: ${form.notes || '—'}`,
    ];
    const mailto = `mailto:${RESTAURANT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;

    window.setTimeout(() => {
      window.location.href = mailto;
      setStatus('sent');
    }, 600);
  }

  return (
    <section className="section reservation" id="reserve">
      <div className="container reservation__grid">
        <div className="reservation__intro">
          <Reveal type="up">
            <p className="eyebrow">Reservations</p>
          </Reveal>
          <Reveal type="up" delay={0.08}>
            <h2 className="section-title">
              Reserve your <em>table</em>
            </h2>
          </Reveal>
          <Reveal type="up" delay={0.16}>
            <p className="section-lede">
              For parties larger than 10, or same-day requests, please call us directly
              at <a href="tel:+302103334455" className="reservation__phone">+30 210 333 4455</a>.
            </p>
          </Reveal>
        </div>

        <Reveal type="scale" delay={0.1} className="reservation__card">
          <AnimatePresence mode="wait">
            {status === 'sent' ? (
              <motion.div
                key="success"
                className="reservation__success"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                <svg viewBox="0 0 52 52" width="52" aria-hidden="true">
                  <circle cx="26" cy="26" r="24" fill="none" stroke="var(--color-gold)" strokeWidth="1.4" />
                  <motion.path
                    d="M15 27l8 8 16-16"
                    fill="none"
                    stroke="var(--color-gold)"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </svg>
                <h3>Request ready to send</h3>
                <p>Your email client should now be open with the details pre-filled. We&rsquo;ll confirm within a few hours.</p>
                <button className="btn-text" onClick={() => { setForm(initialForm); setStatus('idle'); }}>
                  Make another request
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                className="reservation__form"
                onSubmit={handleSubmit}
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
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
                <Field label="Special Requests" full>
                  <textarea rows={3} value={form.notes} onChange={update('notes')} placeholder="Allergies, occasion, seating preference…" />
                </Field>

                {error && <p className="reservation__error">{error}</p>}

                <button type="submit" className="btn btn-primary reservation__submit" disabled={status === 'sending'}>
                  {status === 'sending' ? 'Preparing request…' : 'Request Reservation'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </Reveal>
      </div>
    </section>
  );
}
