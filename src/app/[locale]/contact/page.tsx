import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { getContactPageContent } from "@/content/pages";
import { getHomeContent } from "@/content/home";
import { PHONE_DISPLAY, PHONE_HREF, EMAIL, VAT_NUMBER } from "@/content/business";
import { PageHero } from "@/components/primitives/PageHero";
import { Container, Grid } from "@/components/primitives/Container";
import { Section } from "@/components/primitives/Section";
import { FadeRise } from "@/components/primitives/FadeRise";
import { Hairline } from "@/components/primitives/Hairline";
import { Mono } from "@/components/primitives/Mono";
import { Button } from "@/components/primitives/Button";
import { ConsentGatedMap } from "@/components/primitives/ConsentGatedMap";

export async function generateMetadata({ params }: PageProps<"/[locale]/contact">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const { meta } = getContactPageContent(locale);
  return { title: meta.title, description: meta.description };
}

export default async function ContactPage({ params }: PageProps<"/[locale]/contact">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const content = getContactPageContent(locale);
  const { serviceArea, hero } = getHomeContent(locale);
  const footer = await getTranslations("footer");

  return (
    <>
      <PageHero eyebrow={content.eyebrow} title={content.title} intro={content.intro} />

      <Section className="pt-0">
        <Container>
          <Grid>
            <FadeRise className="col-span-4 sm:col-span-8 lg:col-span-5">
              <dl className="space-y-6">
                <div>
                  <dt className="text-sm text-bone-dim uppercase tracking-[0.08em]">{footer("contactHeading")}</dt>
                  <dd className="mt-2">
                    <a href={PHONE_HREF} className="font-mono text-lg text-bone hover:text-brass-lite">
                      {PHONE_DISPLAY}
                    </a>
                  </dd>
                  <dd className="mt-1">
                    <a href={`mailto:${EMAIL}`} className="text-base text-bone hover:text-brass-lite">
                      {EMAIL}
                    </a>
                  </dd>
                </div>

                <Hairline />

                <div>
                  <dt className="text-sm text-bone-dim uppercase tracking-[0.08em]">{content.hoursHeading}</dt>
                  <dd className="mt-2 max-w-[38ch] text-base text-bone-dim">{content.hours}</dd>
                </div>

                <Hairline />

                <div>
                  <dt className="text-sm text-bone-dim uppercase tracking-[0.08em]">{content.addressHeading}</dt>
                  <dd className="mt-2 text-base text-bone-dim">{footer("address")}</dd>
                  <dd className="mt-1 text-sm text-bone-dim">
                    {footer("vatLabel")} <Mono>{VAT_NUMBER}</Mono>
                  </dd>
                </div>
              </dl>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Button href="/book" variant="primary">
                  {hero.ctaPrimary}
                </Button>
                <Button href={PHONE_HREF} variant="alert">
                  {hero.ctaEmergency}
                </Button>
              </div>
            </FadeRise>

            <FadeRise
              className="col-span-4 mt-10 sm:col-span-8 lg:col-span-6 lg:col-start-7 lg:mt-0"
              style={{ transitionDelay: "80ms" }}
            >
              <ConsentGatedMap title={serviceArea.mapTitle} body={serviceArea.mapBody} cta={serviceArea.mapCta} />
            </FadeRise>
          </Grid>
        </Container>
      </Section>
    </>
  );
}
