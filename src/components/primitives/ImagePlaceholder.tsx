import { cn } from "@/lib/cn";

/**
 * Stand-in for real photography. Renders as a labelled block describing
 * exactly which shot belongs here (see the shot list) rather than a stock
 * photo — role="img" + aria-label so screen readers get the same brief a
 * photographer would.
 */
export function ImagePlaceholder({
  label,
  aspect = "4 / 3",
  className,
}: {
  label: string;
  aspect?: string;
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        "flex items-end border border-slate-line bg-slate p-5",
        className,
      )}
      style={{ aspectRatio: aspect }}
    >
      {/*
        Not font-mono: this is a prose caption (often Greek), and IBM Plex
        Mono has no Greek glyphs — mono type stays reserved for digits and
        technical notation per the type system, never body copy.
      */}
      <p className="text-sm text-bone-dim">{label}</p>
    </div>
  );
}
