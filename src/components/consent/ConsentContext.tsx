"use client";

import { createContext, useContext } from "react";
import type { ConsentCategories } from "@/lib/consent/types";

export interface ConsentContextValue {
  /** null until a choice has been made (or restored from a valid cookie). */
  categories: ConsentCategories | null;
  /** True once we've checked for a stored choice on the client — before
   * this, we don't yet know whether to show the banner, so we show
   * nothing rather than flashing it. */
  hydrated: boolean;
  preferencesOpen: boolean;
  openPreferences: () => void;
  closePreferences: () => void;
  acceptAll: () => void;
  rejectAll: () => void;
  savePreferences: (categories: Omit<ConsentCategories, "necessary">) => void;
}

export const ConsentContext = createContext<ConsentContextValue | null>(null);

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error("useConsent must be used within ConsentProvider");
  return ctx;
}
