import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useConsent } from '../../consent/useConsent';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import './CookieBanner.css';

export function CookieBanner() {
  const { bannerVisible, acceptAll, rejectAll, openPreferences } = useConsent();
  const trapRef = useFocusTrap(bannerVisible);

  return (
    <AnimatePresence>
      {bannerVisible && (
        <motion.div
          ref={trapRef}
          className="cookie-banner"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-banner-title"
          aria-describedby="cookie-banner-desc"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="cookie-banner__inner container">
            <div className="cookie-banner__text">
              <p id="cookie-banner-title" className="cookie-banner__title">
                We value your privacy
              </p>
              <p id="cookie-banner-desc">
                We only use cookies and similar technology that are strictly necessary, plus two optional
                features (custom fonts and an interactive map) that stay off unless you allow them. Read our{' '}
                <Link to="/privacy">Privacy Policy</Link> or the full <Link to="/cookies">Cookie Policy</Link>{' '}
                for details.
              </p>
            </div>
            <div className="cookie-banner__actions">
              <button type="button" className="btn btn-ghost" onClick={rejectAll}>
                Reject All
              </button>
              <button type="button" className="btn btn-primary" onClick={acceptAll}>
                Accept All
              </button>
              <button type="button" className="cookie-banner__manage" onClick={openPreferences}>
                Manage Preferences
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
