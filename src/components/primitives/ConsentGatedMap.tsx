"use client";

import { useConsent } from "@/components/consent/ConsentContext";
import { MapConsentPlaceholder } from "@/components/primitives/MapConsentPlaceholder";

const BUSINESS_ADDRESS = "Καραμανλή 12, Αθήνα, Ελλάδα"; // [TO CONFIRM] — full/verified address needed before launch

/**
 * Shows the real Google Maps embed once Functional consent is granted;
 * otherwise the placeholder. No request to google.com fires — no script,
 * no iframe — until that consent exists, per the brief's "load
 * conditionally after consent, don't just overlay a banner on scripts
 * that already fire" requirement.
 */
export function ConsentGatedMap({
  title,
  body,
  cta,
}: {
  title: string;
  body: string;
  cta: string;
}) {
  const { categories } = useConsent();

  if (!categories?.functional) {
    return <MapConsentPlaceholder title={title} body={body} cta={cta} />;
  }

  return (
    <div style={{ aspectRatio: "4 / 3" }} className="border border-slate-line">
      <iframe
        title={title}
        src={`https://maps.google.com/maps?q=${encodeURIComponent(BUSINESS_ADDRESS)}&z=14&output=embed`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="h-full w-full border-0 grayscale-[20%]"
      />
    </div>
  );
}
