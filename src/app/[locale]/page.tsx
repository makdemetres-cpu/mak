import { setRequestLocale } from "next-intl/server";
import { Container } from "@/components/primitives/Container";
import { Section, SectionKicker } from "@/components/primitives/Section";
import { FadeRise } from "@/components/primitives/FadeRise";

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Section>
      <Container>
        <FadeRise>
          <SectionKicker number="01" label="Phase 2 scaffold" />
          <h1 className="mt-6 max-w-[20ch] font-display text-hero text-bone">
            Homepage copy lands in Phase 3.
          </h1>
          <p className="mt-6 max-w-[62ch] text-base text-bone-dim">
            This placeholder exists only to verify the header, footer, fonts and
            design tokens render correctly end to end.
          </p>
        </FadeRise>
      </Container>
    </Section>
  );
}
