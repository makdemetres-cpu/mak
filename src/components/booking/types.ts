import type { PropertyTypeValue, ServiceSlug, TimeSlot, UrgencyValue } from "@/lib/validation/booking";

export interface BookingFormState {
  serviceSlug: ServiceSlug | null;
  urgency: UrgencyValue | null;
  address: string;
  postcode: string;
  propertyType: PropertyTypeValue | null;
  floor: string;
  parkingNotes: string;
  preferredDate: string; // YYYY-MM-DD
  timeSlot: TimeSlot | null;
  name: string;
  phone: string;
  email: string;
  notes: string;
  photo: File | null;
  privacyAccepted: boolean;
  honeypot: string;
}

export const initialBookingFormState: BookingFormState = {
  serviceSlug: null,
  urgency: null,
  address: "",
  postcode: "",
  propertyType: null,
  floor: "",
  parkingNotes: "",
  preferredDate: "",
  timeSlot: null,
  name: "",
  phone: "",
  email: "",
  notes: "",
  photo: null,
  privacyAccepted: false,
  honeypot: "",
};

export type FormErrors = Partial<Record<keyof BookingFormState, string>>;
