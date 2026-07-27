import { Container, Grid } from "@/components/primitives/Container";
import { Section, SectionKicker } from "@/components/primitives/Section";
import { FadeRise } from "@/components/primitives/FadeRise";
import type { HomeContent } from "@/content/home";

/**
 * Deliberately renders exactly one placeholder slot, not fabricated quotes
 * attributed to invented people — the bracketed copy in content/home.ts
 * says so explicitly and should stay visible until it's replaced with a
 * real review.
 */
export function Testimonials({ content }: { content: HomeContent["testimonials"] }) {
  return (
    <Section>
      <Container>
        <FadeRise>
          <SectionKicker number="04" label={content.kicker} />
          <h2 className="mt-4 max-w-[24ch] text-2xl font-display text-bone">{content.heading}</h2>
        </FadeRise>

        <Grid className="mt-12">
          <FadeRise className="col-span-4 sm:col-span-7 lg:col-span-8 lg:col-start-3">
            <blockquote className="text-xl leading-snug font-display text-bone sm:text-2xl">
              {content.placeholderQuote}
            </blockquote>
            <p className="mt-6 text-sm text-bone-dim">{content.placeholderAttribution}</p>
          </FadeRise>
        </Grid>
      </Container>
    </Section>
  );
}
