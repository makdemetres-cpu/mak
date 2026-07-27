import { PHONE_DISPLAY, EMAIL, VAT_NUMBER, SITE_URL, BUSINESS_ADDRESS, GEO } from "@/content/business";

export function LocalBusinessJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Plumber",
    name: "HydroCore",
    alternateName: "mak theplumber",
    url: SITE_URL,
    telephone: PHONE_DISPLAY,
    email: EMAIL,
    vatID: VAT_NUMBER,
    address: {
      "@type": "PostalAddress",
      streetAddress: BUSINESS_ADDRESS.streetAddress,
      addressLocality: BUSINESS_ADDRESS.addressLocality,
      addressCountry: BUSINESS_ADDRESS.addressCountry,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: GEO.latitude,
      longitude: GEO.longitude,
    },
    areaServed: {
      "@type": "City",
      name: "Athens, Greece",
    },
    priceRange: "€€",
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
