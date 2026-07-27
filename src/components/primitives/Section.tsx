import { cn } from "@/lib/cn";

export function Section({
  id,
  children,
  className,
  contrast = false,
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
  contrast?: boolean;
}) {
  return (
    <section
      id={id}
      className={cn("py-[var(--spacing-section-y)]", contrast && "contrast-block", className)}
    >
      {children}
    </section>
  );
}

/** Editorial numbering device, e.g. "01 —— SERVICES". */
export function SectionKicker({
  number,
  label,
  className,
}: {
  number: string;
  label: string;
  className?: string;
}) {
  return (
    <p
      className={cn("text-mono-sm tracking-[0.08em] text-bone-dim uppercase", className)}
    >
      {/*
        Only the numeral and rule are set in the mono face — IBM Plex Mono
        has no Greek glyphs, so the label (often Greek) stays in the
        inherited body font rather than hanging off the same font-mono
        the number uses.
      */}
      <span className="font-mono text-brass">{number}</span>
      <span className="mx-3 font-mono text-slate-line" aria-hidden="true">
        ——
      </span>
      {label}
    </p>
  );
}
