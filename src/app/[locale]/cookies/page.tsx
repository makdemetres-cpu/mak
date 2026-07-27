import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { getCookiesPageContent } from "@/content/legal";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { Mono } from "@/components/primitives/Mono";

export async function generateMetadata({ params }: PageProps<"/[locale]/cookies">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const { meta } = getCookiesPageContent(locale);
  return { title: meta.title, description: meta.description };
}

export default async function CookiesPage({ params }: PageProps<"/[locale]/cookies">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const content = getCookiesPageContent(locale);

  return (
    <LegalDocument content={content}>
      <div>
        <h2 className="text-lg font-display text-bone">{content.tableTitle}</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-line text-bone-dim">
                <th className="py-3 pr-4 font-normal">{content.tableHeadings.name}</th>
                <th className="py-3 pr-4 font-normal">{content.tableHeadings.purpose}</th>
                <th className="py-3 pr-4 font-normal">{content.tableHeadings.category}</th>
                <th className="py-3 font-normal">{content.tableHeadings.duration}</th>
              </tr>
            </thead>
            <tbody>
              {content.cookies.map((cookie) => (
                <tr key={cookie.name} className="border-b border-slate-line align-top">
                  <td className="py-3 pr-4">
                    <Mono className="text-mono-sm text-bone">{cookie.name}</Mono>
                  </td>
                  <td className="py-3 pr-4 text-bone-dim">{cookie.purpose}</td>
                  <td className="py-3 pr-4 text-bone-dim">{cookie.category}</td>
                  <td className="py-3 text-bone-dim">{cookie.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-bone-dim">{content.thirdPartyNote}</p>
      </div>
    </LegalDocument>
  );
}
