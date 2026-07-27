import { cn } from "@/lib/cn";

/** Numerals/technical wrapper: phone numbers, response times, prices, section numbers. */
export function Mono({
  as: Tag = "span",
  children,
  className,
}: {
  as?: "span" | "p" | "div";
  children: React.ReactNode;
  className?: string;
}) {
  return <Tag className={cn("font-mono", className)}>{children}</Tag>;
}
