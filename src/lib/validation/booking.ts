import { z } from "zod";

export const SERVICE_SLUGS = [
  "emergency-leaks",
  "boiler-installation-service",
  "bathroom-renovation",
  "underfloor-heating",
  "drain-clearing",
  "water-heaters",
] as const;

export type ServiceSlug = (typeof SERVICE_SLUGS)[number];

export const URGENCY_VALUES = ["EMERGENCY_TODAY", "WITHIN_48H", "FLEXIBLE"] as const;
export type UrgencyValue = (typeof URGENCY_VALUES)[number];

export const PROPERTY_TYPES = ["APARTMENT", "HOUSE", "OTHER"] as const;
export type PropertyTypeValue = (typeof PROPERTY_TYPES)[number];

// 2-hour on-site windows within the confirmed Mon–Sat 08:00–20:00 working hours.
export const TIME_SLOTS = ["08:00-10:00", "10:00-12:00", "12:00-14:00", "14:00-16:00", "16:00-18:00", "18:00-20:00"] as const;
export type TimeSlot = (typeof TIME_SLOTS)[number];

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

/** Decoy field name a bot's form-filler is likely to populate; real users never see it. */
export const HONEYPOT_FIELD_NAME = "companyWebsite";
/** Submissions faster than this after the form rendered are treated as spam. */
export const MIN_SUBMIT_ELAPSED_MS = 3000;

export function normalizePhone(input: string): string {
  return input.replace(/[\s\-().]/g, "");
}

// Greek mobiles: 69XXXXXXXX (10 digits). Landlines: 2XXXXXXXXX (10 digits,
// area code + number). Both optionally prefixed with +30 or 0030.
const GREEK_PHONE_REGEX = /^(\+30|0030)?(69\d{8}|2\d{9})$/;

export function isValidGreekPhone(input: string): boolean {
  return GREEK_PHONE_REGEX.test(normalizePhone(input));
}

export function normalizePostcode(input: string): string {
  return input.replace(/\s/g, "");
}

const POSTCODE_REGEX = /^\d{5}$/;

export function isValidGreekPostcode(input: string): boolean {
  return POSTCODE_REGEX.test(normalizePostcode(input));
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(input: string): boolean {
  return EMAIL_REGEX.test(input);
}

export function isPastDate(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(`${dateStr}T00:00:00`);
  return date.getTime() < today.getTime();
}

export function isSunday(dateStr: string): boolean {
  const date = new Date(`${dateStr}T00:00:00`);
  return date.getDay() === 0;
}

export function isValidBookingDate(dateStr: string): boolean {
  if (Number.isNaN(new Date(`${dateStr}T00:00:00`).getTime())) return false;
  return !isPastDate(dateStr) && !isSunday(dateStr);
}

// Server-side authoritative schema. Internal messages only (English) — the
// wizard's own step-by-step client validation is what end users see, in
// their own language, using the same helpers above. This schema is a
// defense-in-depth backstop, not the primary UX.
export const bookingSchema = z.object({
  locale: z.enum(["el", "en"]),
  serviceSlug: z.enum(SERVICE_SLUGS),
  urgency: z.enum(URGENCY_VALUES),
  preferredDate: z.string().refine(isValidBookingDate, "Invalid booking date"),
  timeSlot: z.enum(TIME_SLOTS),
  address: z.string().trim().min(3).max(200),
  postcode: z.string().refine(isValidGreekPostcode, "Invalid Greek postcode"),
  propertyType: z.enum(PROPERTY_TYPES),
  floor: z.string().trim().max(50).optional().or(z.literal("")),
  parkingNotes: z.string().trim().max(300).optional().or(z.literal("")),
  name: z.string().trim().min(2).max(120),
  phone: z.string().refine(isValidGreekPhone, "Invalid Greek phone number"),
  email: z.email(),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  privacyAccepted: z.literal(true),
  // Spam defenses
  honeypot: z.string().max(0, "Spam detected"),
  formRenderedAt: z.coerce.number(),
});

export type BookingInput = z.infer<typeof bookingSchema>;
