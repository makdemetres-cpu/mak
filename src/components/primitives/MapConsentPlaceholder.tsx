"use client";

import { Button } from "@/components/primitives/Button";

/**
 * Stand-in for the real Google Maps embed. No map script, iframe, or
 * request to Google fires here — that's the point. The consent system
 * (built in the cookie-consent phase) will listen for the same
 * "open-cookie-preferences" event the footer trigger dispatches, so this
 * button already does something useful even before that wiring exists.
 */
export function MapConsentPlaceholder({
  title,
  body,
  cta,
}: {
  title: string;
  body: string;
  cta: string;
}) {
  return (
    <div
      role="img"
      aria-label={title}
      className="flex flex-col justify-between border border-slate-line bg-slate p-6"
      style={{ aspectRatio: "4 / 3" }}
    >
      <div>
        {/* Not font-mono: this label is often Greek, and IBM Plex Mono has no Greek glyphs. */}
        <p className="text-mono-sm text-bone-dim uppercase tracking-[0.08em]">{title}</p>
        <p className="mt-3 max-w-[38ch] text-sm text-bone-dim">{body}</p>
      </div>
      <Button
        variant="ghost"
        className="self-start"
        onClick={() => window.dispatchEvent(new CustomEvent("open-cookie-preferences"))}
      >
        {cta}
      </Button>
    </div>
  );
}
