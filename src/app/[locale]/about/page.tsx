import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { getAboutPageContent } from "@/content/pages";
import { getHomeContent } from "@/content/home";
import { PageHero } from "@/components/primitives/PageHero";
import { Container, Grid } from "@/components/primitives/Container";
import { Section } from "@/components/primitives/Section";
import { FadeRise } from "@/components/primitives/FadeRise";
import { ImagePlaceholder } from "@/components/primitives/ImagePlaceholder";
import { BookingCta } from "@/components/home/BookingCta";

export async function generateMetadata({ params }: PageProps<"/[locale]/about">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const { meta } = getAboutPageContent(locale);
  return { title: meta.title, description: meta.description };
}

export default async function AboutPage({ params }: PageProps<"/[locale]/about">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const content = getAboutPageContent(locale);
  const { bookingCta } = getHomeContent(locale);
  const teamPhotoLabel =
    locale === "el"
      ? "Φωτογραφία: η ομάδα της HydroCore, γκρουπ φωτογραφία σε απλό φόντο"
      : "Photo: the HydroCore team, group shot against a plain wall";

  return (
    <>
      <PageHero eyebrow={content.eyebrow} title={content.title} intro={content.intro} />

      <Section className="pt-0">
        <Container>
          <Grid>
            <FadeRise className="col-span-4 sm:col-span-4 lg:col-span-6">
              <div className="space-y-5">
                {content.story.map((paragraph) => (
                  <p key={paragraph} className="max-w-[58ch] text-base text-bone-dim">
                    {paragraph}
                  </p>
                ))}
              </div>
            </FadeRise>

            <FadeRise
              className="col-span-4 mt-10 sm:col-span-4 lg:col-span-5 lg:col-start-8 lg:mt-0"
              style={{ transitionDelay: "80ms" }}
            >
              <ImagePlaceholder label={teamPhotoLabel} aspect="4 / 5" />
            </FadeRise>
          </Grid>
        </Container>
      </Section>

      <Section className="pt-0">
        <Container>
          <FadeRise>
            <h2 className="max-w-[24ch] text-2xl font-display text-bone">{content.valuesHeading}</h2>
          </FadeRise>

          <Grid className="mt-12">
            {content.values.map((value, index) => (
              <FadeRise
                key={value.title}
                className="col-span-4 sm:col-span-4 lg:col-span-4"
                style={{ transitionDelay: `${index * 60}ms` }}
              >
                <div className="border-t border-slate-line pt-5">
                  <h3 className="text-lg font-display text-bone">{value.title}</h3>
                  <p className="mt-2 max-w-[32ch] text-sm text-bone-dim">{value.body}</p>
                </div>
              </FadeRise>
            ))}
          </Grid>
        </Container>
      </Section>

      <BookingCta content={bookingCta} />
    </>
  );
}
