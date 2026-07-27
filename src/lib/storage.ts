import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { ALLOWED_PHOTO_TYPES, MAX_PHOTO_BYTES } from "@/lib/validation/booking";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "booking-photos";

const supabase = supabaseUrl && serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null;

export class PhotoValidationError extends Error {}

/**
 * Validates and uploads the customer's optional problem photo. Re-checks
 * type and size server-side — never trusts the client's own checks, since
 * a request can always be crafted by hand to skip the browser entirely.
 */
export async function uploadBookingPhoto(file: File): Promise<string | null> {
  if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
    throw new PhotoValidationError("Unsupported file type");
  }
  if (file.size > MAX_PHOTO_BYTES) {
    throw new PhotoValidationError("File too large");
  }

  if (!supabase) {
    console.warn(
      "[storage] SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY not set — the booking photo was validated but NOT uploaded. Set these before production launch.",
    );
    return null;
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${extension}`;

  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    console.error("[storage] Failed to upload booking photo:", error);
    return null;
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
