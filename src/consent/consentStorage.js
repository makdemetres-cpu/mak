export const COOKIE_POLICY_VERSION = '1.0';
export const CONSENT_STORAGE_KEY = 'pyra_cookie_consent';

// We keep a timestamped record of each choice for demonstrability, but the
// banner always re-prompts on every fresh visit regardless of what's stored
// here — see ConsentContext.jsx.
export function persistConsent(categories) {
  const record = {
    version: COOKIE_POLICY_VERSION,
    timestamp: new Date().toISOString(),
    categories: { necessary: true, ...categories },
  };
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // If storage is unavailable, the record simply won't persist.
  }
  return record;
}
