import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { getWorkPageContent } from "@/content/pages";
import { getHomeContent } from "@/content/home";
import { PageHero } from "@/components/primitives/PageHero";
import { Container, Grid } from "@/components/primitives/Container";
import { Section } from "@/components/primitives/Section";
import { FadeRise } from "@/components/primitives/FadeRise";
import { ImagePlaceholder } from "@/components/primitives/ImagePlaceholder";
import { BookingCta } from "@/components/home/BookingCta";

export async function generateMetadata({ params }: PageProps<"/[locale]/work">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const { meta } = getWorkPageContent(locale);
  return { title: meta.title, description: meta.description };
}

export default async function WorkPage({ params }: PageProps<"/[locale]/work">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const content = getWorkPageContent(locale);
  const { work, bookingCta } = getHomeContent(locale);

  return (
    <>
      <PageHero eyebrow={content.eyebrow} title={content.title} intro={content.intro} />

      <Section className="pt-0">
        <Container>
          <Grid className="gap-y-14">
            {work.projects.map((project, index) => (
              <FadeRise
                key={project.title}
                className="col-span-4 sm:col-span-8 lg:col-span-6"
                style={{ transitionDelay: `${index * 70}ms` }}
              >
                <ImagePlaceholder label={project.imageLabel} aspect="4 / 3" />
                <h2 className="mt-4 text-lg font-display text-bone">{project.title}</h2>
                <p className="mt-1 text-sm text-bone-dim">{project.caption}</p>
              </FadeRise>
            ))}
          </Grid>
        </Container>
      </Section>

      <BookingCta content={bookingCta} />
    </>
  );
}
