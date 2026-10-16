"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import type { Quality } from "./car-model";

/**
 * Same behaviour and localStorage keys as the artifact:
 *   cp.t = theme ("auto" | "light" | "dark")   cp.q = 3D quality   cp.s = saved car ids (garage)
 * Theme "auto" removes data-theme so the prefers-color-scheme media query in globals.css applies.
 * Add the no-flash script from HANDOFF.md §5 to <head> in app/layout.tsx.
 */
export type Theme = "auto" | "light" | "dark";

const ld = (k: string): unknown => {
  try { return JSON.parse(localStorage.getItem(k) ?? "null"); } catch { return null; }
};
const sv = (k: string, v: unknown) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
};

interface Ctx {
  theme: Theme; setTheme: (t: Theme) => void;
  quality: Quality; setQuality: (q: Quality) => void;
  saved: string[]; toggleSaved: (id: string) => void;
}
const PrefsCtx = createContext<Ctx | null>(null);

interface Preferences { theme: Theme; quality: Quality; saved: string[] }
const DEFAULTS: Preferences = { theme: "auto", quality: "auto", saved: [] };
const KEYS = ["cp.t", "cp.q", "cp.s"];
const listeners = new Set<() => void>();
let snapshot: Preferences | undefined;

function readPreferences(): Preferences {
  const theme = ld("cp.t"), quality = ld("cp.q"), saved = ld("cp.s");
  return {
    theme: theme === "light" || theme === "dark" ? theme : "auto",
    quality: quality === "save" || quality === "high" ? quality : "auto",
    saved: Array.isArray(saved) ? [...new Set(saved.filter((id): id is string => typeof id === "string"))] : [],
  };
}
function getSnapshot() { return snapshot ??= readPreferences(); }
function getServerSnapshot() { return DEFAULTS; }
function applyTheme(theme: Theme) {
  if (theme === "auto") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", theme);
}
function emit() { listeners.forEach((listener) => listener()); }
function onStorage(event: StorageEvent) {
  if (event.key !== null && !KEYS.includes(event.key)) return;
  snapshot = readPreferences();
  applyTheme(snapshot.theme);
  emit();
}
function subscribe(listener: () => void) {
  if (listeners.size === 0) window.addEventListener("storage", onStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

export function PrefsProvider({ children }: { children: ReactNode }) {
  const prefs = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  useEffect(() => {
    // The server default must never clear the theme already applied by the head script.
    applyTheme(getSnapshot().theme);
  }, []);

  const setTheme = useCallback((theme: Theme) => {
    snapshot = { ...getSnapshot(), theme };
    sv("cp.t", theme);
    applyTheme(theme);
    emit();
  }, []);
  const setQuality = useCallback((quality: Quality) => {
    snapshot = { ...getSnapshot(), quality };
    sv("cp.q", quality);
    emit();
  }, []);
  const toggleSaved = useCallback((id: string) => {
    const current = getSnapshot();
    const saved = current.saved.includes(id) ? current.saved.filter((value) => value !== id) : [...current.saved, id];
    snapshot = { ...current, saved };
    sv("cp.s", saved);
    emit();
  }, []);

  const value = useMemo(() => ({ ...prefs, setTheme, setQuality, toggleSaved }), [prefs, setTheme, setQuality, toggleSaved]);
  return <PrefsCtx.Provider value={value}>{children}</PrefsCtx.Provider>;
}

export function usePrefs() {
  const c = useContext(PrefsCtx);
  if (!c) throw new Error("usePrefs must be used inside <PrefsProvider>");
  return c;
}
