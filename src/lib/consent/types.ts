export interface ConsentCategories {
  /** Always true — not user-toggleable, and never gates anything that
   * needs a choice (session/security cookies, the consent record itself). */
  necessary: true;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

export interface ConsentRecord {
  categories: ConsentCategories;
  timestamp: string;
  /** Bumped whenever the privacy/cookie policy changes materially —
   * a stored record with an old version is treated as expired. */
  version: string;
}

export const CONSENT_COOKIE_NAME = "hydrocore_consent";
export const CONSENT_POLICY_VERSION = "1.0";
export const CONSENT_MAX_AGE_DAYS = 180; // 6 months, per the brief
