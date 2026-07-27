import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "ghost" | "alert";

const base =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-editorial)] px-6 py-3 text-sm font-medium tracking-wide transition-colors duration-200";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-brass text-ink hover:bg-brass-lite",
  ghost: "border border-slate-line text-bone hover:border-brass-lite hover:text-brass-lite",
  // --alert fails AA at this text size (see globals.css); --alert-text is
  // the contrast-safe tint reserved for exactly this use.
  alert: "border border-alert-text text-alert-text hover:bg-alert-text hover:text-ink",
};

type ButtonProps = {
  variant?: ButtonVariant;
  className?: string;
  children: React.ReactNode;
  href?: string;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
  target?: string;
  rel?: string;
};

export function Button({
  variant = "primary",
  className,
  children,
  href,
  type = "button",
  onClick,
  disabled,
  ariaLabel,
  target,
  rel,
}: ButtonProps) {
  const classes = cn(base, variants[variant], className);

  if (href) {
    if (href.startsWith("/")) {
      return (
        <Link href={href} className={classes} aria-label={ariaLabel}>
          {children}
        </Link>
      );
    }
    return (
      <a href={href} className={classes} target={target} rel={rel} aria-label={ariaLabel}>
        {children}
      </a>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}
