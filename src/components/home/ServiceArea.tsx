import { Container, Grid } from "@/components/primitives/Container";
import { Section, SectionKicker } from "@/components/primitives/Section";
import { FadeRise } from "@/components/primitives/FadeRise";
import { Mono } from "@/components/primitives/Mono";
import { MapConsentPlaceholder } from "@/components/primitives/MapConsentPlaceholder";
import type { HomeContent } from "@/content/home";

export function ServiceArea({ content }: { content: HomeContent["serviceArea"] }) {
  return (
    <Section>
      <Container>
        <FadeRise>
          <SectionKicker number="05" label={content.kicker} />
          <h2 className="mt-4 max-w-[24ch] text-2xl font-display text-bone">{content.heading}</h2>
          <p className="mt-4 max-w-[50ch] text-base text-bone-dim">{content.intro}</p>
        </FadeRise>

        <Grid className="mt-12">
          <FadeRise className="col-span-4 sm:col-span-8 lg:col-span-6">
            <ul className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
              {content.areas.map((area) => (
                <li key={area}>
                  <Mono className="text-mono-base text-bone-dim">{area}</Mono>
                </li>
              ))}
            </ul>
          </FadeRise>

          <FadeRise className="col-span-4 mt-10 sm:col-span-8 lg:col-span-5 lg:col-start-8 lg:mt-0">
            <MapConsentPlaceholder title={content.mapTitle} body={content.mapBody} cta={content.mapCta} />
          </FadeRise>
        </Grid>
      </Container>
    </Section>
  );
}
