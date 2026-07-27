"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/cn";

export function LocaleSwitch({ className }: { className?: string }) {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("nav");

  return (
    <div
      className={cn("flex items-center gap-1 font-mono text-mono-sm", className)}
      aria-label={t("language")}
      role="group"
    >
      {routing.locales.map((code) => (
        <Link
          key={code}
          href={pathname}
          locale={code}
          aria-current={code === locale ? "true" : undefined}
          className={cn(
            "px-1.5 py-0.5 uppercase transition-colors",
            code === locale ? "text-brass-lite" : "text-bone-dim hover:text-bone",
          )}
        >
          {code}
        </Link>
      ))}
    </div>
  );
}
