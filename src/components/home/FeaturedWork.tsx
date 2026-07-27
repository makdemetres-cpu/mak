import { Container, Grid } from "@/components/primitives/Container";
import { Section, SectionKicker } from "@/components/primitives/Section";
import { FadeRise } from "@/components/primitives/FadeRise";
import { ImagePlaceholder } from "@/components/primitives/ImagePlaceholder";
import type { HomeContent } from "@/content/home";

function ProjectCard({ project }: { project: HomeContent["work"]["projects"][number] }) {
  return (
    <div>
      <ImagePlaceholder label={project.imageLabel} aspect="4 / 3" />
      <h3 className="mt-4 text-lg font-display text-bone">{project.title}</h3>
      <p className="mt-1 text-sm text-bone-dim">{project.caption}</p>
    </div>
  );
}

/** Designed for exactly the three projects in the content data: one large
 * lead project, two smaller ones stacked beside it. */
export function FeaturedWork({ content }: { content: HomeContent["work"] }) {
  const [lead, ...rest] = content.projects;

  return (
    <Section>
      <Container>
        <FadeRise>
          <SectionKicker number="03" label={content.kicker} />
          <h2 className="mt-4 max-w-[24ch] text-2xl font-display text-bone">{content.heading}</h2>
        </FadeRise>

        <Grid className="mt-12">
          <FadeRise className="col-span-4 sm:col-span-8 lg:col-span-7">
            {lead && <ProjectCard project={lead} />}
          </FadeRise>

          <div className="col-span-4 mt-10 flex flex-col gap-10 sm:col-span-8 lg:col-span-5 lg:col-start-8 lg:mt-0">
            {rest.map((project, index) => (
              <FadeRise key={project.title} style={{ transitionDelay: `${(index + 1) * 80}ms` }}>
                <ProjectCard project={project} />
              </FadeRise>
            ))}
          </div>
        </Grid>
      </Container>
    </Section>
  );
}
