"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";

export function TextArea({
  label,
  value,
  onChange,
  error,
  placeholder,
  rows = 4,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  rows?: number;
  className?: string;
}) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm text-bone-dim">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          "mt-2 w-full resize-none border bg-transparent px-4 py-3 text-base text-bone placeholder:text-bone-dim/60 focus:outline-none",
          error ? "border-alert-text" : "border-slate-line focus:border-brass-lite",
        )}
      />
      {error && (
        <p id={errorId} role="alert" className="mt-2 text-sm text-alert-text">
          {error}
        </p>
      )}
    </div>
  );
}
