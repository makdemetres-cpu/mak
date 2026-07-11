import { Reveal, RevealGroup, RevealItem } from './Reveal';
import './Story.css';

const STATS = [
  { value: '28', unit: 'Days', label: 'Dry-Aged in House' },
  { value: '100', unit: '%', label: 'Charcoal Fired' },
  { value: '12', unit: 'Cuts', label: 'On the Menu' },
  { value: '450', unit: 'Labels', label: 'In the Cellar' },
];

export function Story() {
  return (
    <section className="section story" id="story">
      <div className="container story__grid">
        <div className="story__text">
          <Reveal type="up">
            <p className="eyebrow">Our Story</p>
          </Reveal>
          <Reveal type="up" delay={0.08}>
            <h2 className="section-title">
              An Athenian tribute to <em>live-fire</em> craft
            </h2>
          </Reveal>
          <Reveal type="up" delay={0.16}>
            <p className="section-lede">
              PYRA began with a simple obsession: fire, done properly. We dry-age our
              beef in-house, char it over Greek holm-oak charcoal, and finish every
              plate the way it's been done in this city for generations &mdash; unhurried,
              generous, and shared.
            </p>
          </Reveal>
          <Reveal type="up" delay={0.24}>
            <p className="section-lede">
              Our dining room sits in a restored neoclassical building near
              Syntagma Square, where marble floors and warm brass light meet the
              glow of the open charcoal grill.
            </p>
          </Reveal>
          <Reveal type="up" delay={0.32}>
            <a href="#menu" className="btn-text">
              View the Full Menu &rarr;
            </a>
          </Reveal>
        </div>

        <Reveal type="scale" delay={0.1} className="story__visual">
          <div className="story__panel">
            <div className="story__glow" aria-hidden="true" />
            <svg className="story__flame" viewBox="0 0 200 260" width="100%" aria-hidden="true">
              <path
                d="M100 20 C60 70 40 110 40 155 C40 205 65 235 100 235 C135 235 160 205 160 155 C160 110 140 70 100 20 Z"
                fill="none"
                stroke="var(--color-gold)"
                strokeWidth="1"
                opacity="0.5"
              />
              <path
                d="M100 70 C78 100 68 128 68 155 C68 185 82 205 100 205 C118 205 132 185 132 155 C132 128 122 100 100 70 Z"
                fill="none"
                stroke="var(--color-ember)"
                strokeWidth="1"
                opacity="0.7"
              />
            </svg>
          </div>
        </Reveal>
      </div>

      <RevealGroup as="div" className="story__stats container" stagger={0.1}>
        {STATS.map((s) => (
          <RevealItem as="div" key={s.label} className="story__stat">
            <span className="story__stat-value">
              {s.value}
              <small>{s.unit}</small>
            </span>
            <span className="story__stat-label">{s.label}</span>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}
