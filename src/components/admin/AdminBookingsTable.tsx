"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";

export interface AdminBookingRow {
  id: string;
  reference: string;
  serviceSlug: string;
  urgency: string;
  preferredDate: string;
  timeSlot: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  postcode: string;
  status: "NEW" | "CONFIRMED" | "COMPLETED";
  createdAt: string;
}

type SortKey = "preferredDate" | "createdAt";

const STATUSES: AdminBookingRow["status"][] = ["NEW", "CONFIRMED", "COMPLETED"];

function SortButton({
  label,
  sortKeyValue,
  activeKey,
  dir,
  onToggle,
}: {
  label: string;
  sortKeyValue: SortKey;
  activeKey: SortKey;
  dir: "asc" | "desc";
  onToggle: (key: SortKey) => void;
}) {
  const active = activeKey === sortKeyValue;
  return (
    <button
      type="button"
      onClick={() => onToggle(sortKeyValue)}
      className={cn("text-left text-sm uppercase tracking-[0.05em]", active ? "text-brass" : "text-bone-dim")}
    >
      {label} {active && (dir === "asc" ? "↑" : "↓")}
    </button>
  );
}

export function AdminBookingsTable({ bookings }: { bookings: AdminBookingRow[] }) {
  const [rows, setRows] = useState(bookings);
  const [sortKey, setSortKey] = useState<SortKey>("preferredDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const cmp = a[sortKey].localeCompare(b[sortKey]);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  async function updateStatus(id: string, status: AdminBookingRow["status"]) {
    setPendingId(id);
    setError(null);
    const previous = rows;
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, status } : row)));

    try {
      const response = await fetch(`/api/admin/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Update failed");
    } catch {
      setRows(previous);
      setError("Couldn't update that booking. Try again.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="mt-8">
      {error && (
        <p role="alert" className="mb-4 text-sm text-alert-text">
          {error}
        </p>
      )}
      {sorted.length === 0 ? (
        <p className="text-sm text-bone-dim">No bookings yet.</p>
      ) : (
        <div className="overflow-x-auto border border-slate-line">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-line text-left">
                <th className="p-3 font-normal">Reference</th>
                <th className="p-3 font-normal">Service</th>
                <th className="p-3 font-normal">Urgency</th>
                <th className="p-3 font-normal">
                  <SortButton label="Date" sortKeyValue="preferredDate" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} />
                </th>
                <th className="p-3 font-normal">Slot</th>
                <th className="p-3 font-normal">Customer</th>
                <th className="p-3 font-normal">Address</th>
                <th className="p-3 font-normal">
                  <SortButton label="Booked" sortKeyValue="createdAt" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} />
                </th>
                <th className="p-3 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => (
                <tr key={row.id} className="border-b border-slate-line last:border-0">
                  <td className="p-3 font-mono text-xs text-brass-lite">{row.reference}</td>
                  <td className="p-3">{row.serviceSlug}</td>
                  <td className="p-3">{row.urgency}</td>
                  <td className="p-3 font-mono text-xs">{row.preferredDate}</td>
                  <td className="p-3 font-mono text-xs">{row.timeSlot}</td>
                  <td className="p-3">
                    <div>{row.name}</div>
                    <div className="text-bone-dim">{row.phone}</div>
                    <div className="text-bone-dim">{row.email}</div>
                  </td>
                  <td className="p-3">
                    {row.address}, {row.postcode}
                  </td>
                  <td className="p-3 font-mono text-xs text-bone-dim">{new Date(row.createdAt).toLocaleString("en-GB")}</td>
                  <td className="p-3">
                    <select
                      value={row.status}
                      disabled={pendingId === row.id}
                      onChange={(event) => updateStatus(row.id, event.target.value as AdminBookingRow["status"])}
                      className="border border-slate-line bg-ink px-2 py-1 text-bone"
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
