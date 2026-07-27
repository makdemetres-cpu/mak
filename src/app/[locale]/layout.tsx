import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { displayFont, bodyFont, monoFont } from "@/fonts";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SkipLink } from "@/components/layout/SkipLink";
import { ConsentProvider } from "@/components/consent/ConsentProvider";
import { getConsentContent } from "@/content/consent";
import { LocalBusinessJsonLd } from "@/components/seo/LocalBusinessJsonLd";
import { SITE_URL } from "@/content/business";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "HydroCore — Plumbing Engineers, Athens",
    template: "%s | HydroCore",
  },
  description:
    "HydroCore has serviced Athens homes for 23 years — emergency leaks, boiler installs, bathroom renovations and underfloor heating.",
  openGraph: {
    siteName: "HydroCore",
    type: "website",
    locale: "el_GR",
    alternateLocale: "en_US",
  },
  twitter: {
    card: "summary",
  },
};

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable}`}
    >
      <body className="flex min-h-screen flex-col antialiased">
        <LocalBusinessJsonLd />
        <NextIntlClientProvider>
          <SkipLink />
          <ConsentProvider content={getConsentContent(locale)}>
            <Header />
            <main id="main-content" tabIndex={-1} className="flex-1">
              {children}
            </main>
            <Footer />
          </ConsentProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
