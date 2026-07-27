"use client";

import { useEffect, useState } from "react";
import { useFocusTrap } from "@/components/consent/useFocusTrap";
import { useConsent } from "@/components/consent/ConsentContext";
import type { ConsentContent } from "@/content/consent";

type ToggleKey = "functional" | "analytics" | "marketing";
const TOGGLE_KEYS: ToggleKey[] = ["functional", "analytics", "marketing"];

export function CookiePreferencesModal({ content }: { content: ConsentContent }) {
  const { categories, closePreferences, acceptAll, rejectAll, savePreferences } = useConsent();
  const ref = useFocusTrap<HTMLDivElement>(true);

  // Reflects whatever was previously saved when reopening to review/change
  // it; defaults to off (never pre-ticked) the first time this is opened.
  const [draft, setDraft] = useState<Record<ToggleKey, boolean>>({
    functional: categories?.functional ?? false,
    analytics: categories?.analytics ?? false,
    marketing: categories?.marketing ?? false,
  });

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closePreferences();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closePreferences]);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/70 p-4 sm:items-center" onClick={closePreferences}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-modal-title"
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto border border-slate-line bg-ink p-6 sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="cookie-modal-title" className="text-xl font-display text-bone">
            {content.modal.title}
          </h2>
          <button
            type="button"
            onClick={closePreferences}
            aria-label={content.modal.close}
            className="shrink-0 text-bone-dim hover:text-bone"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M4 4L16 16M16 4L4 16" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </div>

        <p className="mt-3 text-sm text-bone-dim">{content.modal.intro}</p>

        <div className="mt-6 space-y-5">
          <div className="border-t border-slate-line pt-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-base text-bone">{content.categories.necessary.name}</p>
              <span className="shrink-0 text-xs text-bone-dim uppercase tracking-[0.05em]">{content.modal.alwaysOn}</span>
            </div>
            <p className="mt-1 text-sm text-bone-dim">{content.categories.necessary.description}</p>
          </div>

          {TOGGLE_KEYS.map((key) => (
            <div key={key} className="border-t border-slate-line pt-4">
              <div className="flex items-center justify-between gap-4">
                <label htmlFor={`consent-${key}`} className="text-base text-bone">
                  {content.categories[key].name}
                </label>
                <input
                  id={`consent-${key}`}
                  type="checkbox"
                  checked={draft[key]}
                  onChange={(event) => setDraft((prev) => ({ ...prev, [key]: event.target.checked }))}
                  className="h-5 w-5 shrink-0 accent-[var(--brass)]"
                />
              </div>
              <p className="mt-1 text-sm text-bone-dim">{content.categories[key].description}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3 border-t border-slate-line pt-6">
          <button
            type="button"
            onClick={rejectAll}
            className="border border-bone px-5 py-2.5 text-sm font-medium text-bone transition-colors hover:bg-bone hover:text-ink"
          >
            {content.modal.rejectAll}
          </button>
          <button
            type="button"
            onClick={acceptAll}
            className="border border-bone px-5 py-2.5 text-sm font-medium text-bone transition-colors hover:bg-bone hover:text-ink"
          >
            {content.modal.acceptAll}
          </button>
          <button
            type="button"
            onClick={() => savePreferences(draft)}
            className="ml-auto bg-brass px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-brass-lite"
          >
            {content.modal.save}
          </button>
        </div>
      </div>
    </div>
  );
}
