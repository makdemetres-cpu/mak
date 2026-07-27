import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidBookingDate } from "@/lib/validation/booking";

/** Which slots are already booked for a given date, so the picker can grey them out. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (!date || !isValidBookingDate(date)) {
    return NextResponse.json({ error: "invalid_date" }, { status: 400 });
  }

  const bookings = await prisma.booking.findMany({
    where: { preferredDate: new Date(`${date}T00:00:00.000Z`) },
    select: { timeSlot: true },
  });

  return NextResponse.json({ takenSlots: bookings.map((b) => b.timeSlot) });
}
