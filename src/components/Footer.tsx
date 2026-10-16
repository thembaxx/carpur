"use client";

import { usePrefs, type Theme } from "@/lib/prefs";
import type { Quality } from "@/lib/car-model";

const THEMES: [Theme, string][] = [["auto", "Device"], ["light", "Light"], ["dark", "Dark"]];
const QUALITIES: [Quality, string][] = [["auto", "Automatic"], ["save", "Save battery"], ["high", "High detail"]];

export function Footer() {
  const { theme, setTheme, quality, setQuality } = usePrefs();
  return (
    <footer>
      <b style={{ color: "var(--fg)" }}>Carpur.</b>{" Beyond the price tag. Built for South Africa."}
      <div className="row" role="group" aria-label="Appearance">
        Appearance{" "}
        {THEMES.map(([value, label]) => <button key={value} type="button" className={`fc${theme === value ? " on" : ""}`} data-th={value} aria-pressed={theme === value} onClick={() => setTheme(value)}>{label}</button>)}
      </div>
      <div className="row" role="group" aria-label="3D quality">
        3D quality{" "}
        {QUALITIES.map(([value, label]) => <button key={value} type="button" className={`fc${quality === value ? " on" : ""}`} data-q={value} aria-pressed={quality === value} onClick={() => setQuality(value)}>{label}</button>)}
      </div>
      <p>Reference prices are manufacturer figures observed 13 October 2026; confirm with a dealer. Cost figures are estimates, not finance or insurance offers. 3D cars are procedural illustrations, not scans of a specific vehicle.</p>
    </footer>
  );
}
