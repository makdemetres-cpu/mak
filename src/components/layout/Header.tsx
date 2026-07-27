"use client";

import { useEffect, useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Container } from "@/components/primitives/Container";
import { Button } from "@/components/primitives/Button";
import { LocaleSwitch } from "./LocaleSwitch";
import { cn } from "@/lib/cn";
import { PHONE_DISPLAY, PHONE_HREF } from "@/content/business";

const NAV_ITEMS = [
  { href: "/services", key: "services" },
  { href: "/work", key: "work" },
  { href: "/about", key: "about" },
  { href: "/contact", key: "contact" },
] as const;

export function Header() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);
  const menuId = useId();

  // Close the mobile menu on navigation. Adjusted during render (React's
  // documented pattern for "reset state when a prop changes") rather than
  // in an effect, so it doesn't cause an extra commit.
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b bg-ink/95 backdrop-blur-sm transition-colors duration-300",
        // Exactly one of these, never both — applying both at once (e.g. an
        // unconditional base class plus a conditional add-on) is a
        // stylesheet-order conflict, not something class order resolves.
        scrolled ? "border-slate-line" : "border-transparent",
      )}
    >
      <Container>
        <div className="flex h-16 items-center justify-between gap-4 sm:h-20">
          <Link href="/" className="font-display text-lg text-bone" aria-label={t("home")}>
            HydroCore
          </Link>

          <nav className="hidden items-center gap-8 lg:flex" aria-label={t("primary")}>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className="text-sm text-bone-dim transition-colors hover:text-bone"
              >
                {t(item.key)}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3 sm:gap-5">
            {/*
              A single "hidden sm:flex" wrapper, not per-child visibility
              classes: Button/LocaleSwitch already hardcode an unconditional
              display utility in their own base styles, and mixing that with
              "hidden" on the same element is a stylesheet-order conflict,
              not a specificity one — class string order doesn't decide it.
            */}
            <div className="hidden items-center gap-5 sm:flex">
              <LocaleSwitch />
              <a
                href={PHONE_HREF}
                className="font-mono text-mono-sm text-bone"
                aria-label={t("phoneAria", { phone: PHONE_DISPLAY })}
              >
                {PHONE_DISPLAY}
              </a>
              <Button href="/book" variant="primary">
                {t("bookVisit")}
              </Button>
            </div>
            {/*
              Mobile only: the phone number itself lives inside the
              hamburger menu, which would take two taps to reach. This stays
              on screen at every scroll position so calling is always one
              tap, per the brief's mobile requirement.
            */}
            <a
              href={PHONE_HREF}
              className="inline-flex h-10 w-10 items-center justify-center border border-slate-line text-bone sm:hidden"
              aria-label={t("phoneAria", { phone: PHONE_DISPLAY })}
            >
              <PhoneIcon />
            </a>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center border border-slate-line text-bone lg:hidden"
              aria-expanded={menuOpen}
              aria-controls={menuId}
              aria-label={menuOpen ? t("menuClose") : t("menuOpen")}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <MenuIcon open={menuOpen} />
            </button>
          </div>
        </div>
      </Container>

      <div id={menuId} hidden={!menuOpen} className="border-t border-slate-line bg-ink lg:hidden">
        <Container>
          <nav className="flex flex-col gap-1 py-4" aria-label={t("primary")}>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className="border-b border-slate-line py-3 text-base text-bone last:border-0"
              >
                {t(item.key)}
              </Link>
            ))}
            <a href={PHONE_HREF} className="py-3 font-mono text-mono-base text-brass-lite">
              {PHONE_DISPLAY}
            </a>
            <LocaleSwitch className="py-2" />
            <Button href="/book" variant="primary" className="mt-2 w-full">
              {t("bookVisit")}
            </Button>
          </nav>
        </Container>
      </div>
    </header>
  );
}

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3.5 2H6l1 3-1.5 1.5a8 8 0 0 0 4 4L11 9l3 1v2.5c0 .83-.72 1.47-1.53 1.36A11.5 11.5 0 0 1 2.14 3.53C2.03 2.72 2.67 2 3.5 2Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      {open ? (
        <path d="M3 3L15 15M15 3L3 15" stroke="currentColor" strokeWidth="1.5" />
      ) : (
        <path d="M2 5H16M2 9H16M2 13H16" stroke="currentColor" strokeWidth="1.5" />
      )}
    </svg>
  );
}
