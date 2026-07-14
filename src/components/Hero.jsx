import { motion } from 'framer-motion';
import { EmberCanvas } from './EmberCanvas';
import './Hero.css';

const HEADLINE = ['Fire-Forged', 'in the Heart', 'of Athens'];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14, delayChildren: 0.5 } },
};

const line = {
  hidden: { y: '100%', opacity: 0 },
  show: { y: '0%', opacity: 1, transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] } },
};

export function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero__bg" aria-hidden="true" />
      <EmberCanvas />
      <div className="hero__vignette" aria-hidden="true" />

      <div className="hero__content container">
        <motion.p
          className="eyebrow hero__eyebrow"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          Est. Athens &mdash; Charcoal &amp; Dry-Aged Beef
        </motion.p>

        <motion.h1 className="hero__title" initial="hidden" animate="show" variants={container}>
          {HEADLINE.map((word) => (
            <span className="hero__line-wrap" key={word}>
              <motion.span className="hero__line" variants={line}>
                {word}
              </motion.span>
            </span>
          ))}
        </motion.h1>

        <motion.p
          className="hero__sub"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.15 }}
        >
          PYRA is a modern Athenian steakhouse &mdash; 28-day dry-aged cuts, live-fire
          charcoal cooking, and a wine list built for the occasion. Just 2 minutes
          from the metro station, open every evening.
        </motion.p>

        <motion.div
          className="hero__cta-row"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.35 }}
        >
          <a href="#reserve" className="btn btn-primary">
            Reserve a Table
          </a>
          <a href="#menu" className="btn btn-ghost">
            Explore the Menu
          </a>
        </motion.div>
      </div>

      <motion.a
        href="#story"
        className="hero__scroll"
        aria-label="Scroll to learn more"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.8 }}
      >
        <span className="hero__scroll-line" />
        <span>Scroll</span>
      </motion.a>
    </section>
  );
}
