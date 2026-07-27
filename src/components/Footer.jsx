import { useState } from 'react';
import { Link } from 'react-router-dom';
import { scrollToSection } from '../utils/scrollToSection';
import { useConsent } from '../consent/useConsent';
import { ConfettiBurst } from './ConfettiBurst';
import './Footer.css';

const SOCIALS = [
  { label: 'Instagram', href: '#' },
  { label: 'Facebook', href: '#' },
  { label: 'TripAdvisor', href: '#' },
];

export function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const { openPreferences } = useConsent();

  function handleSubscribe(e) {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
  }

  function handleHashClick(e, hash) {
    e.preventDefault();
    scrollToSection(hash);
  }

  return (
    <footer className="footer">
      <div className="container footer__top">
        <div className="footer__brand">
          <a href="#top" className="footer__logo" onClick={(e) => handleHashClick(e, '#top')}>
            PYRA<span>.</span>
          </a>
          <p>Athens Steakhouse — fire-forged since day one.</p>
        </div>

        <nav className="footer__links" aria-label="Footer">
          <a href="#story" onClick={(e) => handleHashClick(e, '#story')}>
            Our Story
          </a>
          <Link to="/menu">Menu</Link>
          <a href="#gallery" onClick={(e) => handleHashClick(e, '#gallery')}>
            Ambiance
          </a>
          <a href="#reviews" onClick={(e) => handleHashClick(e, '#reviews')}>
            Reviews
          </a>
          <Link to="/visit">Visit</Link>
          <Link to="/reserve">Reserve</Link>
          <Link to="/privacy">Privacy Policy</Link>
          <button type="button" className="footer__cookie-btn" onClick={openPreferences}>
            Cookie Preferences
          </button>
        </nav>

        <form className="footer__newsletter" onSubmit={handleSubscribe}>
          {subscribed && <ConfettiBurst />}
          <span className="footer__newsletter-label">Join the list for seasonal menus &amp; events</span>
          {subscribed ? (
            <p className="footer__newsletter-thanks">You&rsquo;re on the list — thank you.</p>
          ) : (
            <div className="footer__newsletter-row">
              <input
                type="email"
                required
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label="Email address"
              />
              <button type="submit" className="btn-text">
                Join
              </button>
            </div>
          )}
        </form>
      </div>

      <div className="container footer__bottom">
        <p>&copy; {new Date().getFullYear()} PYRA Athens Steakhouse. All rights reserved.</p>
        <div className="footer__socials">
          {SOCIALS.map((s) => (
            <a key={s.label} href={s.href} aria-label={s.label}>
              {s.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
