import { RevealGroup, RevealItem, Reveal } from './Reveal';
import { DishCard } from './DishCard';
import tomahawkImage from '../assets/tomahawk-for-two.jpg';
import filetMignonImage from '../assets/filet-mignon.jpg';
import './SignatureCuts.css';

const CUTS = [
  {
    name: 'Tomahawk',
    weight: '1.1kg',
    desc: '45-day dry-aged, bone-in, charcoal-seared and finished with rosemary butter.',
    price: '€92',
    tag: 'For Two',
    image: tomahawkImage,
  },
  {
    name: 'Filet Mignon',
    weight: '250g',
    desc: 'The most tender cut, lightly charred, served with a Madeira reduction.',
    price: '€48',
    tag: "Chef's Pick",
    image: filetMignonImage,
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
            <p className="eyebrow">Signature Dishes</p>
          </Reveal>
          <Reveal type="up" delay={0.08}>
            <h2 className="section-title">
              Cut, aged, and <em>fired</em> in-house
            </h2>
          </Reveal>
        </div>

        <RevealGroup as="div" className="cuts__grid" stagger={0.1}>
          {CUTS.map((cut) => (
            <RevealItem as="div" key={cut.name} type="up">
              <DishCard {...cut} />
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
