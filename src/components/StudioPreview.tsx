"use client";

import { useSearchParams } from "next/navigation";
import { HomeHero } from "@/components/HomeHero";
import type { Body } from "@/lib/car-model";

// Unlinked QA page: URL changes can exercise React prop updates and unmounts without reloading.
export function StudioPreview() {
  const query = useSearchParams();
  const bodyValue = query.get("body"),
    colorValue = query.get("color");
  const body: Body = bodyValue === "hatch" || bodyValue === "mpv" ? bodyValue : "suv";
  const color =
    colorValue && ["#c8ccd2", "#b3422e", "#2d4a63", "#1f6f4a", "#16191e"].includes(colorValue)
      ? colorValue
      : "#b3422e";
  return (
    <HomeHero
      body={body}
      color={color}
      pick={query.get("pick") !== "0"}
      showStudio={query.get("viewer") !== "0"}
    />
  );
}
