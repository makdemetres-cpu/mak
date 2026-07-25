import { Link } from 'react-router-dom';
import { Location } from '../components/Location';
import './VisitPage.css';

export function VisitPage() {
  return (
    <div className="visit-page">
      <header className="visit-page__header">
        <div className="container visit-page__header-inner">
          <Link to="/" className="visit-page__logo">
            PYRA<span>.</span>
          </Link>
          <Link to="/" className="visit-page__back">
            &larr; Back to Home
          </Link>
        </div>
      </header>

      <main className="visit-page__main">
        <Location />

        <div className="container visit-page__cta">
          <p>Ready to book your table?</p>
          <Link to="/reserve" className="btn btn-primary">
            Reserve a Table
          </Link>
        </div>
      </main>

      <footer className="visit-page__footer">
        <div className="container visit-page__footer-inner">
          <p>&copy; {new Date().getFullYear()} PYRA Athens Steakhouse.</p>
          <div className="visit-page__footer-links">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/">Back to homepage</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
