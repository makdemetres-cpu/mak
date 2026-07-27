import { Container } from "@/components/primitives/Container";
import { Section } from "@/components/primitives/Section";
import { PageHero } from "@/components/primitives/PageHero";
import { Hairline } from "@/components/primitives/Hairline";
import type { LegalPageContent } from "@/content/legal";

/**
 * Long-form legal text, rendered plainly rather than with the site's
 * scroll-triggered FadeRise: that primitive fires from a single
 * IntersectionObserver threshold against the wrapped element's full
 * height, which for a page this tall never crosses 15% visible and
 * left every section permanently at opacity-0.
 */
export function LegalDocument({ content, children }: { content: LegalPageContent; children?: React.ReactNode }) {
  return (
    <>
      <PageHero eyebrow={content.eyebrow} title={content.title} intro={content.intro} />

      <Section className="pt-0">
        <Container>
          <div className="max-w-[70ch] space-y-12">
            <p className="-mt-6 text-xs text-bone-dim">{content.lastUpdated}</p>
            {content.sections.map((section) => (
              <div key={section.heading}>
                <h2 className="text-lg font-display text-bone">{section.heading}</h2>
                <div className="mt-4 space-y-4">
                  {section.paragraphs.map((paragraph, index) => (
                    <p key={index} className="text-base text-bone-dim">
                      {paragraph}
                    </p>
                  ))}
                  {section.list && (
                    <ul className="list-disc space-y-2 pl-5">
                      {section.list.map((item, index) => (
                        <li key={index} className="text-base text-bone-dim">
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <Hairline className="mt-10" />
              </div>
            ))}
            {children}
          </div>
        </Container>
      </Section>
    </>
  );
}
