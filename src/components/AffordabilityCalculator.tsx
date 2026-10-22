"use client";

import { Fragment, useState } from "react";
import { DEFAULTS, R } from "@/lib/data";
import { findOwnershipCar, type OwnershipCar } from "@/lib/ownership";
import { CostBreakdown } from "./CostBreakdown";

const SLIDERS = [
  ["dep", "Deposit (%)", 0, 50, 5],
  ["n", "Term (months)", 12, 72, 12],
  ["rate", "Interest rate (%)", 6, 20, 0.5],
  ["km", "Distance per month (km)", 200, 4000, 100],
  ["fp", "Petrol price (R/L)", 18, 32, 0.5],
] as const;

export function AffordabilityCalculator({
  cars,
  initialId,
}: {
  cars: OwnershipCar[];
  initialId: string;
}) {
  const [id, setId] = useState(initialId);
  const [options, setOptions] = useState({ ...DEFAULTS });
  const car = findOwnershipCar(cars, id) ?? cars[0];
  return (
    <div className="hero" style={{ alignItems: "start" }}>
      <div className="card" id="af">
        <label htmlFor="p">Car</label>
        <select id="p" value={car.siteId} onChange={(event) => setId(event.currentTarget.value)}>
          {cars.map((item) => (
            <option key={item.siteId} value={item.siteId}>{`${item.n} — ${R(item.p)}`}</option>
          ))}
        </select>
        {SLIDERS.map(([key, label, min, max, step]) => (
          <Fragment key={key}>
            <label htmlFor={key}>
              {`${label}: `}
              <b id={`o${key}`}>{options[key]}</b>
            </label>
            <input
              type="range"
              id={key}
              min={min}
              max={max}
              step={step}
              value={options[key]}
              onChange={(event) => {
                const value = event.currentTarget.valueAsNumber;
                if (Number.isFinite(value)) setOptions((current) => ({ ...current, [key]: value }));
              }}
            />
          </Fragment>
        ))}
      </div>
      <CostBreakdown price={car.p} options={options} nonPetrol={car.f !== "Petrol"} />
    </div>
  );
}
