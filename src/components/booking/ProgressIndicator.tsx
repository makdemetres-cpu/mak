import { cn } from "@/lib/cn";
import { Mono } from "@/components/primitives/Mono";

export function ProgressIndicator({
  current,
  total,
  label,
}: {
  current: number;
  total: number;
  label: string;
}) {
  return (
    <div>
      <Mono className="text-mono-sm text-bone-dim" aria-live="polite">
        {label}
      </Mono>
      <div className="mt-3 flex gap-1.5" aria-hidden="true">
        {Array.from({ length: total }, (_, index) => (
          <div
            key={index}
            className={cn("h-1 flex-1 transition-colors", index < current ? "bg-brass" : "bg-slate-line")}
          />
        ))}
      </div>
    </div>
  );
}
