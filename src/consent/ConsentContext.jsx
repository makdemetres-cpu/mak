import { useCallback, useMemo, useState } from 'react';
import { persistConsent } from './consentStorage';
import { ConsentContext } from './context';

export function ConsentProvider({ children }) {
  // Always starts undecided: the banner re-prompts on every fresh visit,
  // even if a previous choice is on record (see consentStorage.js).
  const [consent, setConsent] = useState(null);
  const [preferencesOpen, setPreferencesOpen] = useState(false);

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
      awaitingDecision: consent === null,
      bannerVisible: consent === null && !preferencesOpen,
      preferencesOpen,
      acceptAll,
      rejectAll,
      savePreferences,
      openPreferences,
      closePreferences,
    }),
    [consent, preferencesOpen, acceptAll, rejectAll, savePreferences, openPreferences, closePreferences]
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}
