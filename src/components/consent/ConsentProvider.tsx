"use client";

import { useEffect, useState } from "react";
import { ConsentContext, type ConsentContextValue } from "@/components/consent/ConsentContext";
import { CookieBanner } from "@/components/consent/CookieBanner";
import { CookiePreferencesModal } from "@/components/consent/CookiePreferencesModal";
import { readConsent, writeConsent } from "@/lib/consent/cookie";
import type { ConsentCategories } from "@/lib/consent/types";
import type { ConsentContent } from "@/content/consent";

export function ConsentProvider({ content, children }: { content: ConsentContent; children: React.ReactNode }) {
  const [categories, setCategories] = useState<ConsentCategories | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  // Reading document.cookie during render (even in a lazy useState
  // initializer) would make the client's first render diverge from the
  // server-rendered HTML and trigger a hydration mismatch — the standard
  // fix is exactly this: render the "unknown yet" state first, then read
  // the client-only value once mounted. There's no async boundary to
  // defer this setState into (the cookie read itself is synchronous), so
  // this is one of the recognized legitimate exceptions to "don't setState
  // synchronously in an effect."
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCategories(readConsent()?.categories ?? null);
    setHydrated(true);
  }, []);

  useEffect(() => {
    function handleOpenRequest() {
      setPreferencesOpen(true);
    }
    window.addEventListener("open-cookie-preferences", handleOpenRequest);
    return () => window.removeEventListener("open-cookie-preferences", handleOpenRequest);
  }, []);

  function persist(next: ConsentCategories) {
    writeConsent(next);
    setCategories(next);
    setPreferencesOpen(false);
  }

  const value: ConsentContextValue = {
    categories,
    hydrated,
    preferencesOpen,
    openPreferences: () => setPreferencesOpen(true),
    closePreferences: () => setPreferencesOpen(false),
    acceptAll: () => persist({ necessary: true, functional: true, analytics: true, marketing: true }),
    rejectAll: () => persist({ necessary: true, functional: false, analytics: false, marketing: false }),
    savePreferences: (partial) => persist({ necessary: true, ...partial }),
  };

  const showBanner = hydrated && categories === null && !preferencesOpen;

  return (
    <ConsentContext.Provider value={value}>
      {children}
      {showBanner && <CookieBanner content={content.banner} />}
      {preferencesOpen && <CookiePreferencesModal content={content} />}
    </ConsentContext.Provider>
  );
}
