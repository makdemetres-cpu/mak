import { Piazzolla, Inter_Tight, IBM_Plex_Mono } from "next/font/google";

/**
 * Piazzolla substitutes for Fraunces: Fraunces' Google Fonts metadata
 * (ofl/fraunces/METADATA.pb) lists only latin, latin-ext, vietnamese —
 * no Greek. Piazzolla is a variable serif with the same opsz+wght
 * mechanism and full greek/greek-ext coverage, so headlines don't
 * switch typeface between locales.
 */
export const displayFont = Piazzolla({
  weight: "variable",
  style: "normal",
  subsets: ["latin", "greek"],
  axes: ["opsz"],
  variable: "--font-piazzolla",
  display: "swap",
});

export const bodyFont = Inter_Tight({
  weight: "variable",
  style: "normal",
  subsets: ["latin", "greek"],
  variable: "--font-inter-tight",
  display: "swap",
});

/**
 * IBM Plex Mono has no Greek subset at all. It is only ever used for
 * digits, punctuation and section numbering (01 / 02), so this is
 * fine — Greek words must render in bodyFont, never in this face.
 */
export const monoFont = IBM_Plex_Mono({
  weight: ["400", "500"],
  style: "normal",
  subsets: ["latin"],
  variable: "--font-plex-mono",
  display: "swap",
});
