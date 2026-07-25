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
          className="cookie-consent__overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            ref={trapRef}
            className="cookie-consent"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-banner-title"
            aria-describedby="cookie-banner-desc"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <p id="cookie-banner-title" className="cookie-consent__title">
              We value your privacy
            </p>
            <p id="cookie-banner-desc" className="cookie-consent__desc">
              We only use cookies and similar technology that are strictly necessary, plus two optional
              features (custom fonts and an interactive map) that stay off unless you allow them. Read our{' '}
              <Link to="/privacy">Privacy Policy</Link> or the full <Link to="/cookies">Cookie Policy</Link>{' '}
              for details.
            </p>
            <div className="cookie-consent__actions">
              <button type="button" className="btn btn-ghost" onClick={rejectAll}>
                Reject All
              </button>
              <button type="button" className="btn btn-primary" onClick={acceptAll}>
                Accept All
              </button>
              <button type="button" className="cookie-consent__manage" onClick={openPreferences}>
                Manage Preferences
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
