"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Moves focus into the returned container as soon as `active` becomes
 * true. When `trap` is also true, Tab/Shift+Tab additionally wrap within
 * the container (for true modals with a backdrop, like the preferences
 * panel). When `trap` is false, focus still lands in the container so
 * keyboard/screen-reader users notice it immediately, but Tab continues
 * out into the rest of the document afterwards — for the non-blocking
 * cookie banner, which has no backdrop and must never keep keyboard
 * users from reaching the rest of the page.
 */
export function useFocusTrap<T extends HTMLElement>(active: boolean, trap = true) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const container = ref.current;
    if (!active || !container) return;

    const getFocusable = () => Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));

    getFocusable()[0]?.focus();

    if (!trap) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Tab" || !container) return;
      const items = getFocusable();
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    container.addEventListener("keydown", handleKeyDown);
    return () => container.removeEventListener("keydown", handleKeyDown);
  }, [active, trap]);

  return ref;
}
