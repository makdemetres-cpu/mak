import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import './ConfirmationPage.css';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [hour, minute] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hour, minute);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function ConfirmationPage() {
  const { state } = useLocation();
  const hasDetails = Boolean(state?.name && state?.date && state?.time);

  return (
    <div className="confirm-page">
      <div className="confirm-page__glow" aria-hidden="true" />

      <header className="confirm-page__header">
        <div className="container confirm-page__header-inner">
          <Link to="/" className="confirm-page__logo">
            PYRA<span>.</span>
          </Link>
        </div>
      </header>

      <main className="confirm-page__main container">
        <motion.div
          className="confirm-card"
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.svg
            className="confirm-card__check"
            viewBox="0 0 72 72"
            width="64"
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            <circle cx="36" cy="36" r="33" fill="none" stroke="var(--color-gold)" strokeWidth="1.4" />
            <motion.path
              d="M20 37l11 11 22-22"
              fill="none"
              stroke="var(--color-gold)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.7, delay: 0.4, ease: 'easeOut' }}
            />
          </motion.svg>

          <motion.p
            className="eyebrow confirm-card__eyebrow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            Reservation Requested
          </motion.p>

          <motion.h1
            className="confirm-card__title"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.55 }}
          >
            Thank You for Your Reservation!
          </motion.h1>

          <motion.p
            className="confirm-card__details"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.62 }}
          >
            {hasDetails ? (
              <>
                We look forward to welcoming <strong>{state.name}</strong> on{' '}
                <strong>{formatDate(state.date)}</strong> at <strong>{formatTime(state.time)}</strong> for{' '}
                <strong>
                  {state.guests} {Number(state.guests) === 1 ? 'guest' : 'guests'}
                </strong>
                .
              </>
            ) : (
              'We look forward to welcoming you to PYRA soon.'
            )}
          </motion.p>

          <motion.p
            className="confirm-card__note"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            A confirmation email has been opened in your mail app &mdash; please send it so our team can
            finalize your table. We&rsquo;ll be in touch within a few hours.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <Link to="/" className="btn btn-primary confirm-card__cta">
              Return to Homepage
            </Link>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
