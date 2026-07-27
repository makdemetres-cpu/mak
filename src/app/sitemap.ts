import type { MetadataRoute } from "next";
import { SITE_URL } from "@/content/business";
import { routing, type AppLocale } from "@/i18n/routing";
import { getServices } from "@/content/services";

const STATIC_PATHS = ["/", "/about", "/work", "/contact", "/services", "/book", "/privacy", "/cookies", "/terms"];

function localizedPath(locale: AppLocale, path: string): string {
  // "as-needed": the default locale (el) is unprefixed, others get /{locale}.
  if (locale === routing.defaultLocale) return path;
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

function alternates(path: string): Record<string, string> {
  return Object.fromEntries(routing.locales.map((locale) => [locale, `${SITE_URL}${localizedPath(locale, path)}`]));
}

export default function sitemap(): MetadataRoute.Sitemap {
  const servicePaths = getServices(routing.defaultLocale).map((service) => `/services/${service.slug}`);
  const paths = [...STATIC_PATHS, ...servicePaths];

  return routing.locales.flatMap((locale) =>
    paths.map((path) => ({
      url: `${SITE_URL}${localizedPath(locale, path)}`,
      alternates: { languages: alternates(path) },
    })),
  );
}
