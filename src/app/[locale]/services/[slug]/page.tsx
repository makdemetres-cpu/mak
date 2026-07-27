import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { getService, getServices, getServiceDetailLabels } from "@/content/services";
import { getHomeContent } from "@/content/home";
import { Container, Grid } from "@/components/primitives/Container";
import { Section, SectionKicker } from "@/components/primitives/Section";
import { FadeRise } from "@/components/primitives/FadeRise";
import { Breadcrumb } from "@/components/primitives/Breadcrumb";
import { Link } from "@/i18n/navigation";
import { BookingCta } from "@/components/home/BookingCta";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => getServices(locale).map((service) => ({ locale, slug: service.slug })));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/services/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const service = getService(locale, slug);
  if (!service) notFound();
  return {
    title: service.title,
    description: service.summary,
  };
}

export default async function ServiceDetailPage({ params }: PageProps<"/[locale]/services/[slug]">) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const service = getService(locale, slug);
  if (!service) notFound();

  const labels = getServiceDetailLabels(locale);
  const otherServices = getServices(locale).filter((item) => item.slug !== slug);
  const { bookingCta } = getHomeContent(locale);

  return (
    <>
      <Section className="pb-16 sm:pb-20 lg:pb-24">
        <Container>
          <FadeRise>
            <Breadcrumb
              items={[
                { label: labels.breadcrumbHome, href: "/" },
                { label: labels.breadcrumbServices, href: "/services" },
                { label: service.title },
              ]}
            />
            <SectionKicker number={service.number} label={labels.breadcrumbServices} />
            <h1 className="mt-6 max-w-[24ch] text-2xl font-display text-bone">{service.title}</h1>
            <p className="mt-6 max-w-[62ch] text-md text-bone-dim">{service.intro}</p>
          </FadeRise>

          <Grid className="mt-12">
            <FadeRise className="col-span-4 sm:col-span-4 lg:col-span-6">
              <h2 className="text-lg font-display text-bone">{labels.includedHeading}</h2>
              <ul className="mt-4 space-y-3 border-t border-slate-line pt-4">
                {service.included.map((line) => (
                  <li key={line} className="flex gap-3 text-base text-bone-dim">
                    <span className="text-brass" aria-hidden="true">
                      —
                    </span>
                    {line}
                  </li>
                ))}
              </ul>
            </FadeRise>

            <FadeRise
              className="col-span-4 mt-10 sm:col-span-4 lg:col-span-5 lg:col-start-8 lg:mt-0"
              style={{ transitionDelay: "80ms" }}
            >
              <h2 className="text-lg font-display text-bone">{labels.signsHeading}</h2>
              <ul className="mt-4 space-y-3 border-t border-slate-line pt-4">
                {service.signs.map((line) => (
                  <li key={line} className="flex gap-3 text-base text-bone-dim">
                    <span className="text-patina" aria-hidden="true">
                      —
                    </span>
                    {line}
                  </li>
                ))}
              </ul>
            </FadeRise>
          </Grid>

          <FadeRise className="mt-16" style={{ transitionDelay: "120ms" }}>
            <p className="text-sm text-bone-dim uppercase tracking-[0.08em]">{labels.otherServicesHeading}</p>
            <ul className="mt-6 grid grid-cols-1 gap-x-8 gap-y-3 border-t border-slate-line pt-6 sm:grid-cols-2 lg:grid-cols-3">
              {otherServices.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/services/${item.slug}`}
                    className="text-base text-bone-dim underline decoration-slate-line underline-offset-4 hover:text-bone hover:decoration-brass-lite"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </FadeRise>
        </Container>
      </Section>

      <BookingCta content={bookingCta} />
    </>
  );
}
