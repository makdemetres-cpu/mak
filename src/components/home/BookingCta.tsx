import { Container, Grid } from "@/components/primitives/Container";
import { Section } from "@/components/primitives/Section";
import { FadeRise } from "@/components/primitives/FadeRise";
import { Button } from "@/components/primitives/Button";
import type { HomeContent } from "@/content/home";

export function BookingCta({ content }: { content: HomeContent["bookingCta"] }) {
  return (
    <Section contrast>
      <Container>
        <FadeRise>
          <Grid className="items-end">
            <div className="col-span-4 sm:col-span-6 lg:col-span-7">
              <h2 className="text-2xl font-display text-ink">{content.heading}</h2>
              <p className="mt-3 max-w-[50ch] text-base text-ink/70">{content.sub}</p>
            </div>
            <div className="col-span-4 mt-8 sm:col-span-2 sm:col-start-7 lg:col-span-3 lg:col-start-10 lg:mt-0">
              <Button href="/book" variant="primary" className="w-full">
                {content.ctaPrimary}
              </Button>
            </div>
          </Grid>
        </FadeRise>
      </Container>
    </Section>
  );
}
