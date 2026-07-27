import { Container } from "@/components/primitives/Container";
import { Section } from "@/components/primitives/Section";
import { FadeRise } from "@/components/primitives/FadeRise";

/**
 * Shared header block for interior pages (/services, /about, /work,
 * /contact). Not the homepage Hero — deliberately smaller scale so it
 * doesn't compete with the one true hero.
 */
export function PageHero({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  /** Optional content rendered above the eyebrow, e.g. a Breadcrumb. */
  children?: React.ReactNode;
}) {
  return (
    <Section className="pt-16 pb-16 sm:pt-20 sm:pb-20 lg:pt-24 lg:pb-24">
      <Container>
        <FadeRise>
          {children}
          {/* Not mono: a full label, often Greek — IBM Plex Mono has no Greek glyphs. */}
          <p className="text-sm text-brass tracking-[0.08em] uppercase">{eyebrow}</p>
          <h1 className="mt-6 max-w-[24ch] text-2xl font-display text-bone">{title}</h1>
          {intro && <p className="mt-6 max-w-[62ch] text-md text-bone-dim">{intro}</p>}
        </FadeRise>
      </Container>
    </Section>
  );
}
