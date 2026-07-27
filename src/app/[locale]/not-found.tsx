import { getTranslations } from "next-intl/server";
import { Container } from "@/components/primitives/Container";
import { Section } from "@/components/primitives/Section";
import { Button } from "@/components/primitives/Button";
import { Mono } from "@/components/primitives/Mono";

/**
 * not-found.js doesn't receive route params, but it renders inside
 * [locale]/layout.tsx, which already called setRequestLocale — so the
 * ambient next-intl locale context is available here without them.
 */
export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <Section className="flex min-h-[60vh] items-center">
      <Container>
        <Mono className="text-mono-lg text-brass">{t("eyebrow")}</Mono>
        <h1 className="mt-6 max-w-[20ch] text-2xl font-display text-bone">{t("title")}</h1>
        <p className="mt-4 max-w-[50ch] text-base text-bone-dim">{t("body")}</p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Button href="/" variant="primary">
            {t("ctaHome")}
          </Button>
          <Button href="/services" variant="ghost">
            {t("ctaServices")}
          </Button>
        </div>
      </Container>
    </Section>
  );
}
