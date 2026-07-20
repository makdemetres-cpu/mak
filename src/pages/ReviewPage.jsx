import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { StarRatingInput } from '../components/StarRatingInput';
import { REVIEW_EMAIL } from '../data/restaurant';
import './ReviewPage.css';

const initialForm = { name: '', rating: 0, review: '' };

export function ReviewPage() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.name || !form.rating || !form.review) {
      setError('Please add your name, a star rating, and a few words about your visit.');
      return;
    }

    setStatus('sending');

    const subject = `My PYRA Review — ${form.name}`;
    const bodyLines = [
      `Name: ${form.name}`,
      `Rating: ${form.rating} out of 5 stars`,
      '',
      form.review,
    ];
    const mailto = `mailto:${REVIEW_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;

    window.setTimeout(() => {
      setStatus('sent');

      window.setTimeout(() => {
        try {
          const mailFrame = document.createElement('iframe');
          mailFrame.style.display = 'none';
          mailFrame.src = mailto;
          document.body.appendChild(mailFrame);
          window.setTimeout(() => mailFrame.remove(), 2000);
        } catch {
          // Opening the mail client is a best-effort convenience; never block the thank-you state on it.
        }
      }, 300);
    }, 500);
  }

  return (
    <div className="review-page">
      <header className="review-page__header">
        <div className="container review-page__header-inner">
          <Link to="/" className="review-page__logo">
            PYRA<span>.</span>
          </Link>
          <Link to="/" className="review-page__back">
            &larr; Back to Home
          </Link>
        </div>
      </header>

      <main className="review-page__main container">
        <div className="review-page__card">
          <AnimatePresence mode="wait">
            {status === 'sent' ? (
              <motion.div
                key="success"
                className="review-page__success"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <svg viewBox="0 0 72 72" width="60" aria-hidden="true">
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
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </svg>
                <h1 className="section-title">Thank You for Your Review!</h1>
                <p>
                  Your email client should now be open with your review pre-filled &mdash; please send it
                  so we can share it with the team.
                </p>
                <Link to="/" className="btn btn-primary">
                  Return to Homepage
                </Link>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                className="review-page__form"
                onSubmit={handleSubmit}
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <p className="eyebrow">Leave a Review</p>
                <h1 className="section-title">
                  Tell us about your <em>visit</em>
                </h1>
                <p className="section-lede">
                  We read every review &mdash; a few words about your evening helps us keep getting it right.
                </p>

                <label className="field review-page__field">
                  <span className="field__label">Your Rating</span>
                  <StarRatingInput value={form.rating} onChange={(rating) => setForm((f) => ({ ...f, rating }))} />
                </label>

                <label className="field review-page__field">
                  <span className="field__label">Full Name</span>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Your name"
                  />
                </label>

                <label className="field review-page__field">
                  <span className="field__label">Your Review</span>
                  <textarea
                    required
                    rows={5}
                    value={form.review}
                    onChange={(e) => setForm((f) => ({ ...f, review: e.target.value }))}
                    placeholder="What did you order, and what stood out?"
                  />
                </label>

                {error && <p className="review-page__error">{error}</p>}

                <button type="submit" className="btn btn-primary review-page__submit" disabled={status === 'sending'}>
                  {status === 'sending' ? 'Sending…' : 'Submit Review'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="review-page__footer">
        <div className="container review-page__footer-inner">
          <p>&copy; {new Date().getFullYear()} PYRA Athens Steakhouse.</p>
          <Link to="/">Back to homepage</Link>
        </div>
      </footer>
    </div>
  );
}
