"use client";

/**
 * Fires a DOM event the cookie-preferences modal (built in the cookie-consent
 * phase) listens for. Decouples the footer from that modal's implementation.
 */
export function CookiePreferencesTrigger({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new CustomEvent("open-cookie-preferences"))}
    >
      {children}
    </button>
  );
}
