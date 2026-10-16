"use client";

import Image from "next/image";
import { useState } from "react";
import type { Car } from "@/lib/data";
import { silhouette } from "@/lib/silhouette";

export function CarImage({ car, eager = false }: { car: Car; eager?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (!car.image || failed) {
    const svg = silhouette(car.b, car.c);
    const content = svg.slice(svg.indexOf(">") + 1, svg.lastIndexOf("</svg>"));
    return <svg viewBox="0 0 300 120" aria-hidden="true" dangerouslySetInnerHTML={{ __html: content }} />;
  }
  return (
    <Image
      src={car.image} alt={car.n} width={300} height={120}
      sizes="(max-width: 555px) calc(100vw - 78px), (max-width: 821px) calc((100vw - 132px) / 2), (max-width: 1087px) calc((100vw - 186px) / 3), 235px"
      loading={eager ? "eager" : "lazy"}
      style={{ width: "100%", height: "auto", aspectRatio: "5 / 2", objectFit: "contain", marginBottom: 6 }}
      onError={() => setFailed(true)}
    />
  );
}
