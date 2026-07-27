import type { Metadata } from "next";
import { displayFont, bodyFont, monoFont } from "@/fonts";
import "../globals.css";

export const metadata: Metadata = {
  title: "HydroCore Admin",
  robots: { index: false, follow: false },
};

/**
 * A separate root layout from the marketing site's [locale]/layout.tsx —
 * the admin dashboard is an internal tool, not part of the bilingual
 * public site, so it gets its own <html>/<body> and skips next-intl
 * entirely rather than pretending to need a locale.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable}`}>
      <body className="min-h-screen bg-ink text-bone antialiased">{children}</body>
    </html>
  );
}
