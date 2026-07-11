import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Reveal } from './Reveal';
import './Testimonials.css';

const QUOTES = [
  {
    text: 'The Tomahawk for two is the best steak I have had in Athens, full stop. The charcoal char was perfect.',
    author: 'Elena K.',
    role: 'Kolonaki',
  },
  {
    text: "A dining room that feels like an occasion every time. The dry-aged wagyu is worth the trip alone.",
    author: 'Marco D.',
    role: 'Visiting from Milan',
  },
  {
    text: 'Service that understands pacing, a wine list that actually fits Greek cuts of beef. Rare.',
    author: 'Sophia P.',
    role: 'Glyfada',
  },
];

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
              <p className="testimonials__attr">
                {active.author} <span>&mdash; {active.role}</span>
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="testimonials__dots">
          {QUOTES.map((q, i) => (
            <button
              key={q.author}
              className={`testimonials__dot ${i === index ? 'is-active' : ''}`}
              aria-label={`Show testimonial from ${q.author}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
