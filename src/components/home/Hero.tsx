import { Container, Grid } from "@/components/primitives/Container";
import { FadeRise } from "@/components/primitives/FadeRise";
import { Button } from "@/components/primitives/Button";
import { PHONE_HREF } from "@/content/business";
import type { HomeContent } from "@/content/home";

export function Hero({ content }: { content: HomeContent["hero"] }) {
  return (
    <section className="pt-16 pb-20 sm:pt-20 sm:pb-24 lg:pt-28 lg:pb-32">
      <Container>
        <Grid>
          <div className="col-span-4 sm:col-span-8 lg:col-span-10">
            <FadeRise>
              {/*
                Not Mono: this is a full phrase, often Greek, not a numeral
                — IBM Plex Mono has no Greek glyphs. Tracked small caps in
                the body font reads as the same editorial device without it.
              */}
              <p className="text-sm text-brass tracking-[0.08em] uppercase">{content.kicker}</p>
              <h1 className="mt-6 text-hero font-display text-bone">{content.headline}</h1>
            </FadeRise>
          </div>

          <div className="col-span-4 mt-10 sm:col-span-6 lg:col-span-5 lg:col-start-8 lg:mt-16">
            <FadeRise>
              <p className="max-w-[58ch] text-md text-bone-dim">{content.sub}</p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Button href="/book" variant="primary">
                  {content.ctaPrimary}
                </Button>
                <Button href={PHONE_HREF} variant="alert">
                  {content.ctaEmergency}
                </Button>
              </div>
            </FadeRise>
          </div>
        </Grid>
      </Container>
    </section>
  );
}
