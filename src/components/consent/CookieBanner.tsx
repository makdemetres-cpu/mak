"use client";

import { useEffect } from "react";
import { useFocusTrap } from "@/components/consent/useFocusTrap";
import { useConsent } from "@/components/consent/ConsentContext";
import { Container } from "@/components/primitives/Container";
import type { ConsentContent } from "@/content/consent";

/**
 * The two mandatory choices (Accept/Reject) are deliberately styled as
 * identical twins — same border, same weight, same size — per the brief's
 * explicit requirement that Reject carry the same visual prominence and
 * click count as Accept. "Customize" is visually secondary (a text link)
 * since it isn't one of the two symmetric choices.
 */
const CHOICE_BUTTON_CLASSES =
  "border border-bone px-6 py-3 text-sm font-medium text-bone transition-colors hover:bg-bone hover:text-ink";

export function CookieBanner({ content }: { content: ConsentContent["banner"] }) {
  const { acceptAll, rejectAll, openPreferences } = useConsent();
  const ref = useFocusTrap<HTMLDivElement>(true);

  // Keep the footer's legal links reachable — a fixed banner would
  // otherwise sit on top of them once the user scrolls to the bottom.
  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const applyPadding = () => {
      document.body.style.paddingBottom = `${node.offsetHeight}px`;
    };
    applyPadding();

    const observer = new ResizeObserver(applyPadding);
    observer.observe(node);
    return () => {
      observer.disconnect();
      document.body.style.paddingBottom = "";
    };
  }, [ref]);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-body"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-line bg-ink"
    >
      <Container className="py-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-[62ch]">
            <p id="cookie-banner-title" className="font-display text-lg text-bone">
              {content.title}
            </p>
            <p id="cookie-banner-body" className="mt-2 text-sm text-bone-dim">
              {content.body}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={openPreferences}
              className="text-sm text-bone-dim underline decoration-slate-line underline-offset-4 hover:text-bone"
            >
              {content.customize}
            </button>
            <button type="button" onClick={rejectAll} className={CHOICE_BUTTON_CLASSES}>
              {content.rejectAll}
            </button>
            <button type="button" onClick={acceptAll} className={CHOICE_BUTTON_CLASSES}>
              {content.acceptAll}
            </button>
          </div>
        </div>
      </Container>
    </div>
  );
}
