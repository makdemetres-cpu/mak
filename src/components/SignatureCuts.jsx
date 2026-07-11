import { RevealGroup, RevealItem, Reveal } from './Reveal';
import './SignatureCuts.css';

const CUTS = [
  {
    name: 'Tomahawk',
    weight: '1.1kg',
    desc: '45-day dry-aged, bone-in, charcoal-seared and finished with rosemary butter.',
    price: '€92',
    tag: 'For Two',
  },
  {
    name: 'Filet Mignon',
    weight: '250g',
    desc: 'The most tender cut, lightly charred, served with a Madeira reduction.',
    price: '€48',
    tag: "Chef's Pick",
  },
  {
    name: 'Wagyu Ribeye',
    weight: '300g',
    desc: 'Australian F1 wagyu, marbled and rich, finished simply with sea salt.',
    price: '€78',
    tag: 'Limited',
  },
  {
    name: 'Porterhouse',
    weight: '700g',
    desc: 'Two cuts in one — strip and filet — dry-aged 30 days.',
    price: '€68',
    tag: 'Signature',
  },
];

export function SignatureCuts() {
  return (
    <section className="section cuts">
      <div className="container">
        <div className="section-head">
          <Reveal type="up">
            <p className="eyebrow">Signature Cuts</p>
          </Reveal>
          <Reveal type="up" delay={0.08}>
            <h2 className="section-title">
              Cut, aged, and <em>fired</em> in-house
            </h2>
          </Reveal>
        </div>

        <RevealGroup as="div" className="cuts__grid" stagger={0.1}>
          {CUTS.map((cut) => (
            <RevealItem as="article" key={cut.name} className="cut-card" type="up">
              <div className="cut-card__top">
                <span className="cut-card__tag">{cut.tag}</span>
                <span className="cut-card__weight">{cut.weight}</span>
              </div>
              <svg className="cut-card__icon" viewBox="0 0 64 64" width="46" aria-hidden="true">
                <circle cx="32" cy="32" r="26" fill="none" stroke="var(--color-gold)" strokeWidth="1" opacity="0.5" />
                <path
                  d="M18 32c0-8 6-15 14-15s14 7 14 15-6 15-14 15-14-7-14-15z"
                  fill="none"
                  stroke="var(--color-ember)"
                  strokeWidth="1.2"
                />
              </svg>
              <h3 className="cut-card__name">{cut.name}</h3>
              <p className="cut-card__desc">{cut.desc}</p>
              <div className="cut-card__footer">
                <span className="cut-card__price">{cut.price}</span>
                <a href="#reserve" className="btn-text">
                  Reserve &rarr;
                </a>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
