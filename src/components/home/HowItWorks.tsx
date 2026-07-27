import { Container, Grid } from "@/components/primitives/Container";
import { Section, SectionKicker } from "@/components/primitives/Section";
import { FadeRise } from "@/components/primitives/FadeRise";
import { Mono } from "@/components/primitives/Mono";
import type { HomeContent } from "@/content/home";

export function HowItWorks({ content }: { content: HomeContent["howItWorks"] }) {
  return (
    <Section contrast>
      <Container>
        <FadeRise>
          <SectionKicker number="02" label={content.kicker} className="text-ink/60" />
          <h2 className="mt-4 max-w-[24ch] text-2xl font-display text-ink">{content.heading}</h2>
        </FadeRise>

        <Grid className="mt-12">
          {content.steps.map((step, index) => (
            <FadeRise
              key={step.number}
              className="col-span-4 sm:col-span-4 lg:col-span-3"
              style={{ transitionDelay: `${index * 60}ms` }}
            >
              <div className="border-t border-ink/15 pt-5">
                <Mono className="text-mono-base text-patina">{step.number}</Mono>
                <h3 className="mt-3 text-lg font-display text-ink">{step.title}</h3>
                <p className="mt-2 max-w-[32ch] text-sm text-ink/70">{step.description}</p>
              </div>
            </FadeRise>
          ))}
        </Grid>
      </Container>
    </Section>
  );
}
