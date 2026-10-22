"use client";

import { useEffect, useRef } from "react";

let observer: IntersectionObserver | undefined;

/** One shared observer, with each .rv element revealed only once. */
export function useReveal<T extends HTMLElement>(enabled = true) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;
    if (
      !window.IntersectionObserver ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      element.classList.add("in");
      return;
    }
    observer ??= new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            observer?.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(element);
    return () => observer?.unobserve(element);
  }, [enabled]);
  return ref;
}
