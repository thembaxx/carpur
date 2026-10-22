"use client";

import Link from "next/link";
import { useReveal } from "@/hooks/useReveal";
import { R, type Car } from "@/lib/data";
import { CarImage } from "./CarImage";

export function CarCard({
  car,
  reveal = false,
  eager = false,
}: {
  car: Car;
  reveal?: boolean;
  eager?: boolean;
}) {
  const ref = useReveal<HTMLAnchorElement>(reveal);
  return (
    <Link
      ref={ref}
      className={`card${reveal ? " rv" : ""}`}
      href={`/vehicles/${car.siteId}`}
      prefetch={false}
    >
      <CarImage key={car.image} car={car} eager={eager} />
      <span className="k">New · {car.t}</span>
      <b>{car.n}</b>
      <span className="mut" style={{ fontSize: 13 }}>
        Manufacturer reference price
      </span>
      <b style={{ fontSize: 22 }}>{R(car.p)}</b>
    </Link>
  );
}
