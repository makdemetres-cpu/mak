import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";

/**
 * Catch-all for any path under a recognized locale that doesn't match a
 * more specific route. Without this, an unmatched URL never enters the
 * [locale] segment tree at all (there's no page to match), so Next falls
 * back to the generic root 404 instead of the branded, translated
 * [locale]/not-found.tsx. Matching into this segment and calling
 * notFound() explicitly is what makes that render correctly.
 */
export default async function CatchAll({ params }: PageProps<"/[locale]/[...rest]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  notFound();
}
