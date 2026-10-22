"use client";
import { useEffect, useRef } from "react";
import type { Body } from "@/lib/car-model";
import { silhouette } from "@/lib/silhouette";
import { usePrefs } from "@/lib/prefs";

interface Props {
  body: Body;
  color: string;
  /** Show the HATCH / SUV / MPV switcher (home hero only). */
  pick?: boolean;
}

/**
 * The dark "stage" panel with the orbitable 3D car. The canvas and controls are created imperatively
 * by createStudio() (same DOM and classes as the artifact); React only owns the container.
 * Changing quality re-mounts the renderer. Falls back to the SVG silhouette without WebGL.
 */
export function CarStudio({ body, color, pick = false }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { quality } = usePrefs();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let cancelled = false;
    let dispose: (() => void) | undefined;
    el.setAttribute("aria-label", "3D car viewer. Drag to orbit.");
    const showFallback = () => {
      el.innerHTML = silhouette(body, color);
      el.setAttribute("aria-label", `Illustrative ${body} silhouette. 3D preview unavailable.`);
    };
    // Keep Three.js out of the server render and load it only for a mounted viewer.
    void import("@/lib/car-model")
      .then(({ createStudio }) => {
        if (cancelled) return;
        try {
          dispose = createStudio(el, { body, color, pick, quality });
        } catch {
          showFallback();
        }
      })
      .catch(() => {
        if (!cancelled) showFallback();
      });
    return () => {
      cancelled = true;
      dispose?.();
      el.replaceChildren();
    };
  }, [body, color, pick, quality]);

  return (
    <div ref={ref} className="stage" role="group" aria-label="3D car viewer. Drag to orbit." />
  );
}
