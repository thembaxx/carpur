"use client";

import Link from "next/link";
import { usePrefs } from "@/lib/prefs";

export function VehicleActions({ siteId, alias }: { siteId: string; alias: string }) {
  const { saved, toggleSaved } = usePrefs();
  const matchingIds = saved.filter((id) => id === siteId || id === alias);
  const isSaved = matchingIds.length > 0;
  function toggle() {
    // Support the handoff's original aliases; new saves use the real route ID.
    if (isSaved) matchingIds.forEach(toggleSaved);
    else toggleSaved(siteId);
  }
  return (
    <div className="row">
      <button type="button" className={`btn ${isSaved ? "o" : "ac"}`} data-save={siteId} aria-pressed={isSaved} onClick={toggle}>{isSaved ? "Saved to garage ✓" : "Save to garage"}</button>
      <Link className="btn o" href={`/compare?a=${encodeURIComponent(siteId)}`} prefetch={false}>Compare</Link>
      <Link className="btn o" href={`/affordability?id=${encodeURIComponent(siteId)}`} prefetch={false}>Adjust budget</Link>
    </div>
  );
}
