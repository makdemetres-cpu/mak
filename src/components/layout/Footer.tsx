import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container, Grid } from "@/components/primitives/Container";
import { Hairline } from "@/components/primitives/Hairline";
import { Mono } from "@/components/primitives/Mono";
import { CookiePreferencesTrigger } from "./CookiePreferencesTrigger";

const PHONE_DISPLAY = "+30 639 104 729";
const PHONE_HREF = "tel:+30639104729";
const EMAIL = "maktheplumber@gmail.com";
const VAT_NUMBER = "EL835105724";

export function Footer() {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-line bg-ink">
      <Container className="py-16 sm:py-20">
        <Grid>
          <div className="col-span-4 sm:col-span-8 lg:col-span-5">
            <p className="font-display text-xl text-bone">HydroCore</p>
            <p className="mt-4 max-w-[38ch] text-base text-bone-dim">{t("tagline")}</p>
          </div>

          <div className="col-span-2 sm:col-span-4 lg:col-span-3">
            <p className="font-mono text-mono-sm text-bone-dim uppercase tracking-[0.08em]">
              {t("contactHeading")}
            </p>
            <ul className="mt-4 space-y-2">
              <li>
                <a href={PHONE_HREF} className="font-mono text-sm text-bone hover:text-brass-lite">
                  {PHONE_DISPLAY}
                </a>
              </li>
              <li>
                <a href={`mailto:${EMAIL}`} className="text-sm text-bone hover:text-brass-lite">
                  {EMAIL}
                </a>
              </li>
            </ul>
          </div>

          <div className="col-span-2 sm:col-span-4 lg:col-span-4">
            <p className="font-mono text-mono-sm text-bone-dim uppercase tracking-[0.08em]">
              {t("legalHeading")}
            </p>
            <ul className="mt-4 space-y-2 text-sm text-bone-dim">
              <li>{t("legalName")}</li>
              <li>
                <Mono className="text-bone-dim">
                  {t("vatLabel")} {VAT_NUMBER}
                </Mono>
              </li>
              <li>
                <span className="sr-only">{t("addressLabel")}: </span>
                {t("address")}
              </li>
            </ul>
          </div>
        </Grid>

        <Hairline className="my-10" />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-bone-dim">
            © {year} {t("legalName")}. {t("rights")}
          </p>
          <nav aria-label={t("legalHeading")} className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/privacy" className="text-xs text-bone-dim hover:text-bone">
              {t("privacy")}
            </Link>
            <Link href="/cookies" className="text-xs text-bone-dim hover:text-bone">
              {t("cookies")}
            </Link>
            <Link href="/terms" className="text-xs text-bone-dim hover:text-bone">
              {t("terms")}
            </Link>
            <CookiePreferencesTrigger className="text-xs text-bone-dim underline decoration-slate-line underline-offset-4 hover:text-bone">
              {t("cookiePreferences")}
            </CookiePreferencesTrigger>
          </nav>
        </div>
      </Container>
    </footer>
  );
}
