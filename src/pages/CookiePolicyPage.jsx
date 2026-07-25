import { Link } from 'react-router-dom';
import { useConsent } from '../consent/useConsent';
import { RESERVATION_EMAIL } from '../data/restaurant';
import './CookiePolicyPage.css';

const LAST_UPDATED = 'July 25, 2026';

const ENTRIES = [
  {
    name: 'pyra_cookie_consent',
    provider: 'PYRA (first party)',
    purpose:
      'Keeps a timestamped record of your latest cookie choice, for our own compliance records. We ask again on every visit regardless of what this contains.',
    duration: 'Overwritten each time you make a choice',
    category: 'Strictly Necessary',
  },
  {
    name: 'Google Fonts request (fonts.googleapis.com, fonts.gstatic.com)',
    provider: 'Google LLC (third party)',
    purpose: 'Loads the Cinzel, Cormorant Garamond, and Inter typefaces used across the site.',
    duration: 'No cookie is set; the request only happens while you’ve allowed it',
    category: 'Functional',
  },
  {
    name: 'OpenStreetMap map embed (openstreetmap.org)',
    provider: 'OpenStreetMap Foundation (third party)',
    purpose: 'Displays the interactive map of our location on the Visit and Reservation pages.',
    duration: 'Controlled by OpenStreetMap, not by us; only loaded while you’ve allowed it',
    category: 'Functional',
  },
];

export function CookiePolicyPage() {
  const { openPreferences } = useConsent();

  return (
    <div className="cookie-page">
      <header className="cookie-page__header">
        <div className="container cookie-page__header-inner">
          <Link to="/" className="cookie-page__logo">
            PYRA<span>.</span>
          </Link>
          <Link to="/" className="cookie-page__back">
            &larr; Back to Home
          </Link>
        </div>
      </header>

      <main className="cookie-page__main container">
        <p className="eyebrow">Legal</p>
        <h1 className="section-title">
          Cookie <em>Policy</em>
        </h1>
        <p className="cookie-page__updated">Last updated: {LAST_UPDATED}</p>

        <div className="cookie-page__body">
          <p>
            This page lists every cookie, browser storage item, and third-party resource this website can
            load, exactly as we found it when we audited the code. For how we handle personal data more
            broadly, see our <Link to="/privacy">Privacy Policy</Link>.
          </p>

          <p>
            Nothing on this list runs until you choose to allow it. We ask you to choose every time you visit
            &mdash; we don&rsquo;t use a previous visit&rsquo;s choice to skip asking again. You can change
            your mind at any time:
          </p>

          <button type="button" className="btn btn-primary cookie-page__manage-btn" onClick={openPreferences}>
            Manage Cookie Preferences
          </button>

          <table className="cookie-page__table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Provider</th>
                <th>Purpose</th>
                <th>Duration</th>
                <th>Category</th>
              </tr>
            </thead>
            <tbody>
              {ENTRIES.map((entry) => (
                <tr key={entry.name}>
                  <td>{entry.name}</td>
                  <td>{entry.provider}</td>
                  <td>{entry.purpose}</td>
                  <td>{entry.duration}</td>
                  <td>{entry.category}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2>What each category means</h2>
          <ul>
            <li>
              <strong>Strictly Necessary</strong> &mdash; required for the site (and this cookie preference
              system itself) to function. Always on, can&rsquo;t be turned off.
            </li>
            <li>
              <strong>Functional</strong> &mdash; optional features that make the site nicer to use, but
              aren&rsquo;t required. Off by default; you choose whether to turn them on.
            </li>
          </ul>
          <p>
            We don&rsquo;t use any analytics or marketing cookies, so those categories currently have nothing
            in them.
          </p>

          <h2>Questions</h2>
          <p>
            If anything here is unclear, contact us at <a href={`mailto:${RESERVATION_EMAIL}`}>{RESERVATION_EMAIL}</a>.
          </p>
        </div>
      </main>

      <footer className="cookie-page__footer">
        <div className="container cookie-page__footer-inner">
          <p>&copy; {new Date().getFullYear()} PYRA Athens Steakhouse.</p>
          <div className="cookie-page__footer-links">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/">Back to homepage</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
