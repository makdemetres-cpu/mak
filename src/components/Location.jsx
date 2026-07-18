import { Reveal } from './Reveal';
import {
  HOURS,
  ADDRESS_LINES,
  PHONE_DISPLAY,
  PHONE_HREF,
  RESERVATION_EMAIL,
  MAP_EMBED_URL,
  GOOGLE_MAPS_URL,
} from '../data/restaurant';
import './Location.css';

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
            <p>
              {ADDRESS_LINES.map((line, i) => (
                <span key={line}>
                  {line}
                  {i < ADDRESS_LINES.length - 1 && <br />}
                </span>
              ))}
            </p>
          </Reveal>

          <Reveal type="up" delay={0.22} className="location__block">
            <h3>Contact</h3>
            <p>
              <a href={PHONE_HREF}>{PHONE_DISPLAY}</a>
              <br />
              <a href={`mailto:${RESERVATION_EMAIL}`}>{RESERVATION_EMAIL}</a>
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
          <iframe title="PYRA Athens location map" src={MAP_EMBED_URL} loading="lazy" tabIndex={-1} />
          <a
            href={GOOGLE_MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="location__map-link"
            aria-label="Open PYRA's location in Google Maps"
          >
            <span>View on Google Maps &#8599;</span>
          </a>
        </Reveal>
      </div>
    </section>
  );
}
