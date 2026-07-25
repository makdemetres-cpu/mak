export const COOKIE_POLICY_VERSION = '1.0';
export const CONSENT_STORAGE_KEY = 'pyra_cookie_consent';

const SIX_MONTHS_MS = 1000 * 60 * 60 * 24 * 30 * 6;

export function loadConsent() {
  let raw;
  try {
    raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;

  let record;
  try {
    record = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!record || record.version !== COOKIE_POLICY_VERSION) return null;

  const age = Date.now() - new Date(record.timestamp).getTime();
  if (!Number.isFinite(age) || age > SIX_MONTHS_MS) return null;

  return record;
}

export function persistConsent(categories) {
  const record = {
    version: COOKIE_POLICY_VERSION,
    timestamp: new Date().toISOString(),
    categories: { necessary: true, ...categories },
  };
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // If storage is unavailable, consent simply won't persist across reloads.
  }
  return record;
}
