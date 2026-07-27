import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin/session";

const VALID_STATUSES = ["NEW", "CONFIRMED", "COMPLETED"] as const;

export async function PATCH(request: Request, context: RouteContext<"/api/admin/bookings/[id]">) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const status = body?.status;

  if (typeof status !== "string" || !VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: { status: status as (typeof VALID_STATUSES)[number] },
  });

  return NextResponse.json({ booking: { id: updated.id, status: updated.status } });
}
