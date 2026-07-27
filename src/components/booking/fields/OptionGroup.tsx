"use client";

import { useId, useRef } from "react";
import { cn } from "@/lib/cn";
import { Mono } from "@/components/primitives/Mono";

export interface Option<T extends string> {
  value: T;
  title: string;
  body?: string;
  number?: string;
}

/**
 * Accessible single-select visual list (radiogroup with roving tabindex —
 * only one item is ever a Tab stop; arrow keys move both focus and
 * selection between options, matching native radio-button behavior).
 */
export function OptionGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  error,
  columns = 1,
  className,
}: {
  label: string;
  options: ReadonlyArray<Option<T>>;
  value: T | null;
  onChange: (value: T) => void;
  error?: string;
  columns?: 1 | 2 | 3;
  className?: string;
}) {
  const groupId = useId();
  const errorId = `${groupId}-error`;
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  function handleKeyDown(event: React.KeyboardEvent, index: number) {
    if (!["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft"].includes(event.key)) return;
    event.preventDefault();
    const dir = event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (index + dir + options.length) % options.length;
    const next = options[nextIndex];
    onChange(next.value);
    refs.current[next.value]?.focus();
  }

  const columnClass = columns === 2 ? "sm:grid-cols-2" : columns === 3 ? "sm:grid-cols-3" : "";

  return (
    <div role="radiogroup" aria-label={label} aria-describedby={error ? errorId : undefined} className={className}>
      <div className={cn("grid gap-3", columnClass)}>
        {options.map((option, index) => {
          const checked = option.value === value;
          const isTabbable = value ? checked : index === 0;
          return (
            <button
              key={option.value}
              ref={(el) => {
                refs.current[option.value] = el;
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={isTabbable ? 0 : -1}
              onClick={() => onChange(option.value)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={cn(
                "flex items-start gap-4 border p-5 text-left transition-colors",
                checked ? "border-brass bg-slate" : "border-slate-line hover:border-bone-dim",
              )}
            >
              {option.number && <Mono className="mt-0.5 text-mono-base text-brass">{option.number}</Mono>}
              <div>
                <p className="text-base text-bone">{option.title}</p>
                {option.body && <p className="mt-1 text-sm text-bone-dim">{option.body}</p>}
              </div>
            </button>
          );
        })}
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-3 text-sm text-alert-text">
          {error}
        </p>
      )}
    </div>
  );
}
