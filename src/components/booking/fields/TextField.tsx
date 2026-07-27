"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";

export function TextField({
  label,
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  type = "text",
  required,
  autoComplete,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  placeholder?: string;
  type?: "text" | "email" | "tel";
  required?: boolean;
  autoComplete?: string;
  className?: string;
}) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm text-bone-dim">
        {label}
        {required && (
          <span aria-hidden="true" className="text-brass">
            {" "}
            *
          </span>
        )}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          "mt-2 w-full border bg-transparent px-4 py-3 text-base text-bone placeholder:text-bone-dim/60 focus:outline-none",
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
