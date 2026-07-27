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
      className={cn(
        "font-mono text-mono-sm tracking-[0.08em] text-bone-dim uppercase",
        className,
      )}
    >
      <span className="text-brass">{number}</span>
      <span className="mx-3 text-slate-line" aria-hidden="true">
        ——
      </span>
      {label}
    </p>
  );
}
