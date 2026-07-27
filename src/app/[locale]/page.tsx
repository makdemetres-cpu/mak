import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { getHomeContent } from "@/content/home";
import { Hero } from "@/components/home/Hero";
import { TrustStrip } from "@/components/home/TrustStrip";
import { Services } from "@/components/home/Services";
import { HowItWorks } from "@/components/home/HowItWorks";
import { FeaturedWork } from "@/components/home/FeaturedWork";
import { Testimonials } from "@/components/home/Testimonials";
import { ServiceArea } from "@/components/home/ServiceArea";
import { BookingCta } from "@/components/home/BookingCta";

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const { meta } = getHomeContent(locale);
  return {
    title: meta.title,
    description: meta.description,
  };
}

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const content = getHomeContent(locale);

  return (
    <>
      <Hero content={content.hero} />
      <TrustStrip items={content.trust} />
      <Services content={content.services} />
      <HowItWorks content={content.howItWorks} />
      <FeaturedWork content={content.work} />
      <Testimonials content={content.testimonials} />
      <ServiceArea content={content.serviceArea} />
      <BookingCta content={content.bookingCta} />
    </>
  );
}
