import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin/session";
import { AdminBookingsTable } from "@/components/admin/AdminBookingsTable";

export default async function AdminPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const bookings = await prisma.booking.findMany({
    orderBy: { preferredDate: "asc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between">
        <p className="font-display text-xl text-bone">HydroCore Admin — Bookings</p>
        <form method="POST" action="/api/admin/logout">
          <button type="submit" className="text-sm text-bone-dim underline decoration-slate-line underline-offset-4 hover:text-bone">
            Sign out
          </button>
        </form>
      </div>

      <AdminBookingsTable
        bookings={bookings.map((b) => ({
          id: b.id,
          reference: b.reference,
          serviceSlug: b.serviceSlug,
          urgency: b.urgency,
          preferredDate: b.preferredDate.toISOString().slice(0, 10),
          timeSlot: b.timeSlot,
          name: b.name,
          phone: b.phone,
          email: b.email,
          address: b.address,
          postcode: b.postcode,
          status: b.status,
          createdAt: b.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
