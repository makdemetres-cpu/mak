import { Container } from "@/components/primitives/Container";
import { Section, SectionKicker } from "@/components/primitives/Section";
import { FadeRise } from "@/components/primitives/FadeRise";
import { ServiceRows } from "@/components/services/ServiceRows";
import type { HomeContent } from "@/content/home";
import type { ServiceDetail } from "@/content/services";

export function Services({
  content,
  items,
}: {
  content: HomeContent["services"];
  items: ServiceDetail[];
}) {
  return (
    <Section>
      <Container>
        <FadeRise>
          <SectionKicker number="01" label={content.kicker} />
          <h2 className="mt-4 max-w-[24ch] text-2xl font-display text-bone">{content.heading}</h2>
        </FadeRise>

        <ServiceRows items={items} className="mt-12 border-t border-slate-line" />
      </Container>
    </Section>
  );
}
