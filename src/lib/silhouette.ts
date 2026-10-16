import type { Body } from "./car-model";

/** Side-profile SVG used on cards and as the WebGL fallback. Port of sil() from the reference artifact. */
export function silhouette(b: Body, c: string): string {
  const r = { hatch: 30, suv: 22, mpv: 20 }[b] ?? 26;
  const wheels = [78, 226]
    .map((x) => `<circle cx="${x}" cy="92" r="17" fill="#111"/><circle cx="${x}" cy="92" r="8" fill="#ccd"/>`)
    .join("");
  return `<svg viewBox="0 0 300 120" role="img" aria-hidden="true"><ellipse cx="150" cy="108" rx="120" ry="7" fill="#0003"/><path d="M18 92V74Q20 64 42 62L92 56Q112 ${r} 150 ${r}L205 ${r + 2}Q228 ${r + 8} 246 60L274 66Q286 70 286 92Z" fill="${c}"/><path d="M104 58Q118 ${r + 8} 150 ${r + 8}L200 ${r + 10}Q220 ${r + 14} 234 58Z" fill="#0008"/>${wheels}</svg>`;
}
