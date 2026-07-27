import {
  CONSENT_COOKIE_NAME,
  CONSENT_MAX_AGE_DAYS,
  CONSENT_POLICY_VERSION,
  type ConsentCategories,
  type ConsentRecord,
} from "@/lib/consent/types";

function getCookieValue(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/** Returns the stored consent, or null if there isn't one, it's expired,
 * or it was recorded against an older policy version (all three cases
 * mean: re-prompt). */
export function readConsent(): ConsentRecord | null {
  const raw = getCookieValue(CONSENT_COOKIE_NAME);
  if (!raw) return null;

  try {
    const record = JSON.parse(raw) as ConsentRecord;
    if (record.version !== CONSENT_POLICY_VERSION) return null;

    const ageMs = Date.now() - new Date(record.timestamp).getTime();
    const maxAgeMs = CONSENT_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
    if (!(ageMs >= 0 && ageMs <= maxAgeMs)) return null;

    return record;
  } catch {
    return null;
  }
}

export function writeConsent(categories: ConsentCategories): ConsentRecord {
  const record: ConsentRecord = {
    categories,
    timestamp: new Date().toISOString(),
    version: CONSENT_POLICY_VERSION,
  };
  const maxAgeSeconds = CONSENT_MAX_AGE_DAYS * 24 * 60 * 60;
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(record))}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`;
  return record;
}
