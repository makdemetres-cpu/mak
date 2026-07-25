import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useConsent } from '../../consent/useConsent';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useOutsideClick } from '../../hooks/useOutsideClick';
import './CookiePreferencesModal.css';

const CATEGORIES = [
  {
    key: 'fonts',
    label: 'Fonts',
    description:
      "Loads our custom typefaces (Cinzel, Cormorant Garamond, Inter) from Google's servers. Without this, the site uses your device's default fonts instead — everything still works.",
  },
  {
    key: 'maps',
    label: 'Maps',
    description:
      "Loads the interactive OpenStreetMap embed showing our location. Without this, you'll see our address as text plus a link to open Google Maps instead.",
  },
];

export function CookiePreferencesModal() {
  const { consent, preferencesOpen, closePreferences, acceptAll, rejectAll, savePreferences } = useConsent();
  const trapRef = useFocusTrap(preferencesOpen);
  useOutsideClick(trapRef, preferencesOpen, closePreferences);

  const [draft, setDraft] = useState({ fonts: false, maps: false });

  useEffect(() => {
    if (preferencesOpen) {
      setDraft({
        fonts: Boolean(consent?.categories?.fonts),
        maps: Boolean(consent?.categories?.maps),
      });
    }
  }, [preferencesOpen, consent]);

  function toggle(key) {
    setDraft((d) => ({ ...d, [key]: !d[key] }));
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') closePreferences();
  }

  return (
    <AnimatePresence>
      {preferencesOpen && (
        <motion.div
          className="cookie-modal__overlay"
          onKeyDown={handleKeyDown}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            ref={trapRef}
            className="cookie-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-modal-title"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="cookie-modal__header">
              <h2 id="cookie-modal-title">Cookie Preferences</h2>
              <button
                type="button"
                className="cookie-modal__close"
                onClick={closePreferences}
                aria-label="Close cookie preferences"
              >
                &times;
              </button>
            </div>

            <p className="cookie-modal__intro">
              Choose which optional features to allow. See the full{' '}
              <Link to="/cookies">Cookie Policy</Link> for exactly what each one loads.
            </p>

            <div className="cookie-modal__category">
              <div className="cookie-modal__category-head">
                <span className="cookie-modal__category-label">Strictly Necessary</span>
                <span className="cookie-modal__badge">Always Active</span>
              </div>
              <p>Remembers your cookie choice itself. Doesn&rsquo;t track you and can&rsquo;t be disabled.</p>
            </div>

            {CATEGORIES.map((cat) => (
              <div className="cookie-modal__category" key={cat.key}>
                <div className="cookie-modal__category-head">
                  <span className="cookie-modal__category-label">{cat.label}</span>
                  <label className="cookie-modal__switch">
                    <input
                      type="checkbox"
                      checked={draft[cat.key]}
                      onChange={() => toggle(cat.key)}
                      aria-label={`${cat.label} cookies`}
                    />
                    <span className="cookie-modal__switch-track" aria-hidden="true" />
                  </label>
                </div>
                <p>{cat.description}</p>
              </div>
            ))}

            <div className="cookie-modal__actions">
              <button type="button" className="btn btn-ghost" onClick={rejectAll}>
                Reject All
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => savePreferences(draft)}>
                Save Preferences
              </button>
              <button type="button" className="btn btn-primary" onClick={acceptAll}>
                Accept All
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
