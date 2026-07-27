import { Link } from "@/i18n/navigation";
import { Container, Grid } from "@/components/primitives/Container";
import { Section, SectionKicker } from "@/components/primitives/Section";
import { FadeRise } from "@/components/primitives/FadeRise";
import { Mono } from "@/components/primitives/Mono";
import type { HomeContent } from "@/content/home";

export function Services({ content }: { content: HomeContent["services"] }) {
  return (
    <Section>
      <Container>
        <FadeRise>
          <SectionKicker number="01" label={content.kicker} />
          <h2 className="mt-4 max-w-[24ch] text-2xl font-display text-bone">{content.heading}</h2>
        </FadeRise>

        <FadeRise className="mt-12 border-t border-slate-line">
          {content.items.map((item) => (
            <Link
              key={item.slug}
              href={`/services/${item.slug}`}
              className="block border-b border-slate-line py-8 transition-colors hover:bg-slate"
            >
              <Grid className="items-baseline">
                <Mono className="col-span-4 text-mono-base text-brass sm:col-span-1">{item.number}</Mono>

                <h3 className="col-span-4 mt-2 text-xl font-display text-bone sm:col-span-7 sm:mt-0 lg:col-span-5">
                  {item.title}
                </h3>

                <p className="col-span-4 mt-2 text-base text-bone-dim sm:col-span-8 sm:mt-4 lg:col-span-4 lg:mt-0">
                  {item.description}
                </p>

                <p className="col-span-4 mt-2 text-sm text-bone-dim sm:col-span-8 sm:mt-2 lg:col-span-2 lg:mt-0 lg:text-right">
                  {item.pricePrefix}{" "}
                  <Mono className="text-mono-base">{item.priceValue}</Mono>
                </p>
              </Grid>
            </Link>
          ))}
        </FadeRise>
      </Container>
    </Section>
  );
}
