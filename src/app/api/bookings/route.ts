import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";
import { sendBookingEmails } from "@/lib/email";
import { uploadBookingPhoto, PhotoValidationError } from "@/lib/storage";
import { generateBookingReference } from "@/lib/reference";
import { getService } from "@/content/services";
import {
  bookingSchema,
  HONEYPOT_FIELD_NAME,
  MIN_SUBMIT_ELAPSED_MS,
} from "@/lib/validation/booking";

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(request: Request) {
  const ip = getClientIp(request);

  const { success: withinLimit } = await checkRateLimit(ip);
  if (!withinLimit) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const formData = await request.formData();

  // Honeypot: real users never populate this (it's hidden from view). Any
  // value at all means a bot filled every field it could find.
  const honeypot = formData.get(HONEYPOT_FIELD_NAME);
  if (typeof honeypot === "string" && honeypot.length > 0) {
    return NextResponse.json({ error: "invalid_submission" }, { status: 400 });
  }

  const raw = {
    locale: formData.get("locale"),
    serviceSlug: formData.get("serviceSlug"),
    urgency: formData.get("urgency"),
    preferredDate: formData.get("preferredDate"),
    timeSlot: formData.get("timeSlot"),
    address: formData.get("address"),
    postcode: formData.get("postcode"),
    propertyType: formData.get("propertyType"),
    floor: formData.get("floor") ?? "",
    parkingNotes: formData.get("parkingNotes") ?? "",
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    notes: formData.get("notes") ?? "",
    privacyAccepted: formData.get("privacyAccepted") === "true",
    honeypot: honeypot ?? "",
    formRenderedAt: formData.get("formRenderedAt"),
  };

  const parsed = bookingSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", issues: parsed.error.issues }, { status: 400 });
  }
  const booking = parsed.data;

  // Timing check: a real person needs at least a few seconds to get
  // through six steps. Faster than this is a scripted submission.
  const elapsed = Date.now() - booking.formRenderedAt;
  if (elapsed < MIN_SUBMIT_ELAPSED_MS) {
    return NextResponse.json({ error: "invalid_submission" }, { status: 400 });
  }

  const service = getService(booking.locale, booking.serviceSlug);
  if (!service) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  // Defense-in-depth against double-booking a slot: the client already
  // greys out taken slots via the availability endpoint, but that's a
  // point-in-time read, not a lock, so re-check right before writing.
  const conflict = await prisma.booking.findFirst({
    where: {
      preferredDate: new Date(`${booking.preferredDate}T00:00:00.000Z`),
      timeSlot: booking.timeSlot,
    },
    select: { id: true },
  });
  if (conflict) {
    return NextResponse.json({ error: "slot_taken" }, { status: 409 });
  }

  let photoUrl: string | null = null;
  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    try {
      photoUrl = await uploadBookingPhoto(photo);
    } catch (error) {
      if (error instanceof PhotoValidationError) {
        return NextResponse.json({ error: "invalid_photo" }, { status: 400 });
      }
      throw error;
    }
  }

  const buildData = (reference: string) => ({
    reference,
    locale: booking.locale,
    serviceSlug: booking.serviceSlug,
    urgency: booking.urgency,
    preferredDate: new Date(`${booking.preferredDate}T00:00:00.000Z`),
    timeSlot: booking.timeSlot,
    address: booking.address,
    postcode: booking.postcode,
    propertyType: booking.propertyType,
    floor: booking.floor || null,
    parkingNotes: booking.parkingNotes || null,
    name: booking.name,
    phone: booking.phone,
    email: booking.email,
    notes: booking.notes || null,
    photoUrl,
    privacyAccepted: booking.privacyAccepted,
    privacyAcceptedAt: new Date(),
  });

  let created;
  try {
    created = await prisma.booking.create({ data: buildData(generateBookingReference()) });
  } catch (error) {
    // Astronomically unlikely reference collision — retry once with a
    // freshly generated one rather than failing the whole submission.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      created = await prisma.booking.create({ data: buildData(generateBookingReference()) });
    } else {
      throw error;
    }
  }

  await sendBookingEmails({ booking, reference: created.reference, serviceTitle: service.title });

  return NextResponse.json({ reference: created.reference }, { status: 201 });
}
