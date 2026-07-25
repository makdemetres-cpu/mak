import { useCallback, useEffect, useMemo, useState } from 'react';
import { loadConsent, persistConsent } from './consentStorage';
import { ConsentContext } from './context';

const BANNER_DELAY_MS = 2200;

export function ConsentProvider({ children }) {
  const [consent, setConsent] = useState(() => loadConsent());
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [delayElapsed, setDelayElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDelayElapsed(true), BANNER_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const applyDecision = useCallback((categories) => {
    setConsent(persistConsent(categories));
    setPreferencesOpen(false);
  }, []);

  const acceptAll = useCallback(() => applyDecision({ fonts: true, maps: true }), [applyDecision]);
  const rejectAll = useCallback(() => applyDecision({ fonts: false, maps: false }), [applyDecision]);
  const savePreferences = useCallback((categories) => applyDecision(categories), [applyDecision]);
  const openPreferences = useCallback(() => setPreferencesOpen(true), []);
  const closePreferences = useCallback(() => setPreferencesOpen(false), []);

  const value = useMemo(
    () => ({
      consent,
      bannerVisible: consent === null && delayElapsed,
      preferencesOpen,
      acceptAll,
      rejectAll,
      savePreferences,
      openPreferences,
      closePreferences,
    }),
    [consent, delayElapsed, preferencesOpen, acceptAll, rejectAll, savePreferences, openPreferences, closePreferences]
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}
