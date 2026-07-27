import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { getBookingContent } from "@/content/booking";
import { getServices } from "@/content/services";
import { BookingWizard } from "@/components/booking/BookingWizard";

export async function generateMetadata({ params }: PageProps<"/[locale]/book">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const { meta } = getBookingContent(locale);
  return { title: meta.title, description: meta.description };
}

export default async function BookPage({ params }: PageProps<"/[locale]/book">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return <BookingWizard content={getBookingContent(locale)} services={getServices(locale)} locale={locale} />;
}
