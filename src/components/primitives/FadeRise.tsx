"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/cn";

const HIDDEN_CLASSES = ["opacity-0", "translate-y-4"];

/**
 * Scroll-triggered fade-and-rise, 400ms ease-out, translateY(16px) max.
 *
 * The pre-animation (invisible) state is applied via direct DOM
 * manipulation in a layout effect, never in the server-rendered HTML or
 * through React state. That means content with JavaScript disabled — or
 * before hydration completes — is fully visible from the first paint,
 * rather than stuck at opacity:0. Reduced motion is enforced with the
 * motion-reduce: variant so it wins regardless of timing.
 */
export function FadeRise({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    ref.current?.classList.add(...HIDDEN_CLASSES);
  }, []);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          node.classList.remove(...HIDDEN_CLASSES);
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
      style={style}
      className={cn(
        "transition-[opacity,transform] duration-[400ms] ease-out motion-reduce:transition-none motion-reduce:transform-none motion-reduce:opacity-100",
        className,
      )}
    >
      {children}
    </div>
  );
}
