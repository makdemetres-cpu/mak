import { Reveal } from './Reveal';
import './Location.css';

const HOURS = [
  { day: 'Monday', time: 'Closed' },
  { day: 'Tuesday — Thursday', time: '19:00 — 00:00' },
  { day: 'Friday — Saturday', time: '13:00 — 01:00' },
  { day: 'Sunday', time: '13:00 — 23:00' },
];

export function Location() {
  return (
    <section className="section location" id="visit">
      <div className="container location__grid">
        <div className="location__info">
          <Reveal type="up">
            <p className="eyebrow">Visit Us</p>
          </Reveal>
          <Reveal type="up" delay={0.08}>
            <h2 className="section-title">
              Find us in <em>Kolonaki</em>
            </h2>
          </Reveal>

          <Reveal type="up" delay={0.16} className="location__block">
            <h3>Address</h3>
            <p>12 Voukourestiou Street<br />Kolonaki, Athens 106 71, Greece</p>
          </Reveal>

          <Reveal type="up" delay={0.22} className="location__block">
            <h3>Contact</h3>
            <p>
              <a href="tel:+302103334455">+30 210 333 4455</a>
              <br />
              <a href="mailto:reservations@pyra-athens.gr">reservations@pyra-athens.gr</a>
            </p>
          </Reveal>

          <Reveal type="up" delay={0.28} className="location__block">
            <h3>Hours</h3>
            <ul className="location__hours">
              {HOURS.map((h) => (
                <li key={h.day}>
                  <span>{h.day}</span>
                  <span>{h.time}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal type="scale" delay={0.12} className="location__map">
          <iframe
            title="PYRA Athens location map"
            src="https://www.openstreetmap.org/export/embed.html?bbox=23.7369%2C37.9755%2C23.7489%2C37.9835&layer=mapnik&marker=37.9795%2C23.7429"
            loading="lazy"
          />
        </Reveal>
      </div>
    </section>
  );
}
