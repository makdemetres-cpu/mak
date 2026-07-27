import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { getServicesPageContent } from "@/content/pages";
import { getServices } from "@/content/services";
import { getHomeContent } from "@/content/home";
import { PageHero } from "@/components/primitives/PageHero";
import { Container } from "@/components/primitives/Container";
import { Section } from "@/components/primitives/Section";
import { ServiceRows } from "@/components/services/ServiceRows";
import { BookingCta } from "@/components/home/BookingCta";

export async function generateMetadata({ params }: PageProps<"/[locale]/services">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const { meta } = getServicesPageContent(locale);
  return { title: meta.title, description: meta.description };
}

export default async function ServicesPage({ params }: PageProps<"/[locale]/services">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const content = getServicesPageContent(locale);
  const items = getServices(locale);
  const { bookingCta } = getHomeContent(locale);

  return (
    <>
      <PageHero eyebrow={content.eyebrow} title={content.title} intro={content.intro} />
      <Section className="pt-0">
        <Container>
          <h2 className="sr-only">{content.listHeading}</h2>
          <ServiceRows items={items} />
        </Container>
      </Section>
      <BookingCta content={bookingCta} />
    </>
  );
}
