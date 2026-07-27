import { cn } from "@/lib/cn";

export function Hairline({ className }: { className?: string }) {
  return <hr className={cn("m-0 border-0 border-t border-slate-line", className)} />;
}
