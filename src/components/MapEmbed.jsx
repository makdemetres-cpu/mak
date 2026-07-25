import { useConsent } from '../consent/useConsent';
import { MAP_EMBED_URL } from '../data/restaurant';
import './MapEmbed.css';

export function MapEmbed({ tabIndex }) {
  const { consent, openPreferences } = useConsent();
  const allowed = Boolean(consent?.categories?.maps);

  if (!allowed) {
    return (
      <div className="map-embed__placeholder">
        <p>Our interactive map loads content from OpenStreetMap and requires functional cookies.</p>
        <button type="button" className="btn-text" onClick={openPreferences}>
          Manage Cookie Preferences
        </button>
      </div>
    );
  }

  return <iframe title="PYRA Athens location map" src={MAP_EMBED_URL} loading="lazy" tabIndex={tabIndex} />;
}
