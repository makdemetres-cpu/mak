import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Reveal } from './Reveal';
import './Menu.css';

const CATEGORIES = {
  Starters: [
    { name: 'Tartare of Beef Fillet', desc: 'Capers, shallot, egg yolk, sourdough crisp', price: '€16' },
    { name: 'Grilled Octopus', desc: 'Fava purée, red wine vinegar, oregano', price: '€19' },
    { name: 'Burrata & Charred Fig', desc: 'Basil oil, aged balsamic, hazelnut', price: '€15' },
    { name: 'Bone Marrow', desc: 'Roasted, herb gremolata, grilled sourdough', price: '€14' },
  ],
  'Steaks & Cuts': [
    { name: 'Tomahawk (1.1kg)', desc: '45-day dry-aged, rosemary butter', price: '€92' },
    { name: 'Filet Mignon (250g)', desc: 'Madeira reduction', price: '€48' },
    { name: 'Wagyu Ribeye (300g)', desc: 'Australian F1, sea salt', price: '€78' },
    { name: 'Porterhouse (700g)', desc: '30-day dry-aged, for two', price: '€68' },
    { name: 'T-Bone (500g)', desc: 'Charcoal grilled, thyme jus', price: '€52' },
  ],
  Sides: [
    { name: 'Truffle Fondant Potato', desc: 'Parmesan, black truffle', price: '€9' },
    { name: 'Charred Broccolini', desc: 'Chili, garlic, lemon', price: '€8' },
    { name: 'Wild Mushroom Orzo', desc: 'Kefalotyri, thyme', price: '€10' },
    { name: 'Village Salad', desc: 'Tomato, cucumber, feta, olive', price: '€8' },
  ],
  Desserts: [
    { name: 'Galaktoboureko', desc: 'Custard filo, orange blossom syrup', price: '€9' },
    { name: 'Dark Chocolate Fondant', desc: 'Mastiha ice cream', price: '€10' },
    { name: 'Greek Yogurt Panna Cotta', desc: 'Honey, walnut praline', price: '€8' },
  ],
  'Wine & Spirits': [
    { name: 'Assyrtiko, Santorini', desc: 'Glass / Bottle', price: '€11 / €48' },
    { name: 'Agiorgitiko, Nemea', desc: 'Glass / Bottle', price: '€10 / €44' },
    { name: 'Xinomavro, Naoussa', desc: 'Glass / Bottle', price: '€12 / €52' },
    { name: 'Metaxa 12★', desc: '40ml pour', price: '€14' },
  ],
};

const TABS = Object.keys(CATEGORIES);

export function Menu() {
  const [active, setActive] = useState(TABS[0]);

  return (
    <section className="section menu" id="menu">
      <div className="container">
        <div className="section-head section-head--center">
          <Reveal type="up">
            <p className="eyebrow" style={{ justifyContent: 'center' }}>
              The Menu
            </p>
          </Reveal>
          <Reveal type="up" delay={0.08}>
            <h2 className="section-title">
              A menu built around <em>fire</em>
            </h2>
          </Reveal>
        </div>

        <Reveal type="up" delay={0.1} className="menu__tabs" role="tablist" aria-label="Menu categories">
          {TABS.map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={active === tab}
              className={`menu__tab ${active === tab ? 'is-active' : ''}`}
              onClick={() => setActive(tab)}
            >
              {tab}
            </button>
          ))}
        </Reveal>

        <div className="menu__panel">
          <AnimatePresence mode="wait">
            <motion.ul
              key={active}
              className="menu__list"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              role="tabpanel"
            >
              {CATEGORIES[active].map((item) => (
                <li className="menu__item" key={item.name}>
                  <div className="menu__item-head">
                    <span className="menu__item-name">{item.name}</span>
                    <span className="menu__item-leader" aria-hidden="true" />
                    <span className="menu__item-price">{item.price}</span>
                  </div>
                  <p className="menu__item-desc">{item.desc}</p>
                </li>
              ))}
            </motion.ul>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
