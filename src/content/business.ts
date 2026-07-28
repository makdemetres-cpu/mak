export const PHONE_DISPLAY = "+30 639 104 729";
export const PHONE_HREF = "tel:+30639104729";
export const EMAIL = "maktheplumber@gmail.com";
export const VAT_NUMBER = "EL835105724";

// [TO CONFIRM] — real production domain once registered; falls back to a
// placeholder so metadata/sitemap/structured-data generation never breaks.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hydrocore.gr";

export const BUSINESS_ADDRESS = {
  streetAddress: "Καραμανλή 12",
  postalCode: "19016",
  addressLocality: "Αθήνα",
  addressCountry: "GR",
};

export const BUSINESS_ADDRESS_DISPLAY_EL = "Καραμανλή 12, 190 16 Αθήνα";
export const BUSINESS_ADDRESS_DISPLAY_EN = "Karamanli 12, 190 16 Athens";

export const GEO = {
  // [TO CONFIRM] — approximate central-Athens coordinates; the confirmed
  // street address and postcode haven't been geocoded to a precise point.
  latitude: 37.9838,
  longitude: 23.7275,
};
