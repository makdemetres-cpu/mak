"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { Mono } from "@/components/primitives/Mono";
import type { BookingContent } from "@/content/booking";
import { TIME_SLOTS, type TimeSlot } from "@/lib/validation/booking";
import type { FormErrors } from "@/components/booking/types";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function StepSchedule({
  content,
  preferredDate,
  timeSlot,
  onChange,
  errors,
}: {
  content: BookingContent["steps"]["schedule"];
  preferredDate: string;
  timeSlot: TimeSlot | null;
  onChange: (patch: Partial<{ preferredDate: string; timeSlot: TimeSlot | null }>) => void;
  errors: FormErrors;
}) {
  // Keyed by date so "loading" is derived (data doesn't match the current
  // date yet) rather than tracked as its own state flag — every setState
  // call this effect makes then lives inside an async callback, not the
  // effect body itself.
  const [availability, setAvailability] = useState<{ date: string; slots: string[] } | null>(null);

  useEffect(() => {
    // No reset needed when the date is cleared: the slot picker below is
    // itself gated on `preferredDate` being set, so stale availability
    // data is simply never rendered while there's no date selected.
    if (!preferredDate) return;

    let cancelled = false;
    fetch(`/api/bookings/availability?date=${preferredDate}`)
      .then((res) => (res.ok ? res.json() : { takenSlots: [] }))
      .then((data) => {
        if (!cancelled) setAvailability({ date: preferredDate, slots: data.takenSlots ?? [] });
      })
      .catch(() => {
        if (!cancelled) setAvailability({ date: preferredDate, slots: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [preferredDate]);

  const loading = !availability || availability.date !== preferredDate;
  const takenSlots = availability && availability.date === preferredDate ? availability.slots : [];
  const allTaken = TIME_SLOTS.every((slot) => takenSlots.includes(slot));

  return (
    <div>
      <div className="max-w-xs">
        <label htmlFor="preferredDate" className="block text-sm text-bone-dim">
          {content.dateLabel} <span aria-hidden="true" className="text-brass">*</span>
        </label>
        <input
          id="preferredDate"
          type="date"
          min={todayISO()}
          value={preferredDate}
          onChange={(event) => onChange({ preferredDate: event.target.value, timeSlot: null })}
          aria-invalid={errors.preferredDate ? true : undefined}
          aria-describedby={errors.preferredDate ? "preferredDate-error" : undefined}
          className={cn(
            "mt-2 w-full border bg-transparent px-4 py-3 text-base text-bone focus:outline-none",
            errors.preferredDate ? "border-alert-text" : "border-slate-line focus:border-brass-lite",
          )}
        />
        {errors.preferredDate && (
          <p id="preferredDate-error" role="alert" className="mt-2 text-sm text-alert-text">
            {errors.preferredDate}
          </p>
        )}
      </div>

      {preferredDate && !errors.preferredDate && (
        <div className="mt-8">
          <p className="text-sm text-bone-dim">
            {content.slotLabel} <span aria-hidden="true" className="text-brass">*</span>
          </p>

          {loading ? (
            <p className="mt-3 text-sm text-bone-dim">{content.loadingSlots}</p>
          ) : allTaken ? (
            <p className="mt-3 text-sm text-bone-dim">{content.noSlots}</p>
          ) : (
            <div role="radiogroup" aria-label={content.slotLabel} className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {TIME_SLOTS.map((slot) => {
                const taken = takenSlots.includes(slot);
                const checked = timeSlot === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    role="radio"
                    aria-checked={checked}
                    disabled={taken}
                    onClick={() => onChange({ timeSlot: slot })}
                    className={cn(
                      "border px-4 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                      checked ? "border-brass bg-slate" : "border-slate-line hover:not-disabled:border-bone-dim",
                    )}
                  >
                    <Mono className="text-mono-base text-bone">{slot}</Mono>
                  </button>
                );
              })}
            </div>
          )}
          {errors.timeSlot && (
            <p role="alert" className="mt-3 text-sm text-alert-text">
              {errors.timeSlot}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
