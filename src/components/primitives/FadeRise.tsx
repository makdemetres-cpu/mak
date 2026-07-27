"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Scroll-triggered fade-and-rise, 400ms ease-out, translateY(16px) max.
 *
 * The pre-animation (invisible) state is only ever applied client-side via
 * useLayoutEffect, never in the server-rendered HTML. That means content
 * with JavaScript disabled — or before hydration completes — is fully
 * visible from the first paint, rather than stuck at opacity:0. Reduced
 * motion is enforced with the motion-reduce: variant so it wins regardless
 * of timing.
 */
export function FadeRise({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hydrated, setHydrated] = useState(false);
  const [visible, setVisible] = useState(false);

  useLayoutEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-[opacity,transform] duration-[400ms] ease-out motion-reduce:transition-none motion-reduce:transform-none motion-reduce:opacity-100",
        hydrated && !visible && "translate-y-4 opacity-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
