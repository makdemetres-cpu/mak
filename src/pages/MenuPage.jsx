import { Link } from 'react-router-dom';
import { Menu } from '../components/Menu';
import { useConsent } from '../consent/useConsent';
import './MenuPage.css';

export function MenuPage() {
  const { openPreferences } = useConsent();

  return (
    <div className="menu-page">
      <header className="menu-page__header">
        <div className="container menu-page__header-inner">
          <Link to="/" className="menu-page__logo">
            PYRA<span>.</span>
          </Link>
          <Link to="/" className="menu-page__back">
            &larr; Back to Home
          </Link>
        </div>
      </header>

      <main className="menu-page__main">
        <Menu />

        <div className="container menu-page__cta">
          <p>Ready to taste it for yourself?</p>
          <Link to="/reserve" className="btn btn-primary">
            Reserve a Table
          </Link>
        </div>
      </main>

      <footer className="menu-page__footer">
        <div className="container menu-page__footer-inner">
          <p>&copy; {new Date().getFullYear()} PYRA Athens Steakhouse.</p>
          <div className="menu-page__footer-links">
            <Link to="/privacy">Privacy Policy</Link>
            <button type="button" className="menu-page__footer-btn" onClick={openPreferences}>
              Cookie Preferences
            </button>
            <Link to="/">Back to homepage</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
