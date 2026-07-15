import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Reveal } from './Reveal';
import './Testimonials.css';

const REVIEW_EMAIL = 'reviews@pyra-athens.gr';

const QUOTES = [
  {
    text: 'The Tomahawk for two is the best steak I have had in Athens, full stop. The charcoal char was perfect.',
    author: 'Elena K.',
    rating: 5,
  },
  {
    text: "A dining room that feels like an occasion every time. The dry-aged wagyu is worth the trip alone.",
    author: 'Marco D.',
    rating: 4.5,
  },
  {
    text: 'Service that understands pacing, a wine list that actually fits Greek cuts of beef. Rare.',
    author: 'Sophia P.',
    rating: 4,
  },
  {
    text: 'Booked a table for my parents\' anniversary and the whole night felt effortless. The porterhouse was extraordinary.',
    author: 'Dimitris A.',
    rating: 5,
  },
  {
    text: 'Came in expecting good steak, left thinking about the wine pairing for a week. Ask for the Xinomavro.',
    author: 'Rachel T.',
    rating: 4.5,
  },
];

function Stars({ rating, name }) {
  return (
    <div className="testimonials__stars" role="img" aria-label={`Rated ${rating} out of 5 stars`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.min(Math.max(rating - i, 0), 1);
        const gradientId = `star-fill-${name.replace(/[^a-zA-Z0-9]/g, '')}-${i}`;
        return (
          <svg key={i} viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
            <defs>
              <linearGradient id={gradientId}>
                <stop offset={`${fill * 100}%`} stopColor="var(--color-gold)" />
                <stop offset={`${fill * 100}%`} stopColor="transparent" />
              </linearGradient>
            </defs>
            <path
              d="M12 2.5l2.95 6.28 6.93.6-5.24 4.6 1.57 6.77L12 17.02l-6.21 3.73 1.57-6.77-5.24-4.6 6.93-.6z"
              fill={`url(#${gradientId})`}
              stroke="var(--color-gold)"
              strokeWidth="1"
              strokeLinejoin="round"
            />
          </svg>
        );
      })}
    </div>
  );
}

export function Testimonials() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % QUOTES.length), 6000);
    return () => clearInterval(id);
  }, []);

  const active = QUOTES[index];

  return (
    <section className="section testimonials" id="reviews">
      <div className="container testimonials__inner">
        <Reveal type="up">
          <p className="eyebrow" style={{ justifyContent: 'center' }}>
            Guests Say
          </p>
        </Reveal>

        <div className="testimonials__stage">
          <span className="testimonials__quote-mark" aria-hidden="true">
            &ldquo;
          </span>
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="testimonials__text">{active.text}</p>
              <Stars rating={active.rating} name={active.author} />
              <p className="testimonials__attr">{active.author}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        <a
          className="btn btn-ghost testimonials__cta"
          href={`mailto:${REVIEW_EMAIL}?subject=${encodeURIComponent('My PYRA Review')}&body=${encodeURIComponent('Rating (1-5 stars): \nYour review: ')}`}
        >
          Leave a Review
        </a>
      </div>
    </section>
  );
}
