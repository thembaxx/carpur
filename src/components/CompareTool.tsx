"use client";

import { useSearchParams } from "next/navigation";
import { DEFAULTS, R, fin, run, sum, total } from "@/lib/data";
import { findOwnershipCar, type OwnershipCar } from "@/lib/ownership";
import { EnergyModelNote } from "./EnergyModelNote";

const ROWS: [string, (car: OwnershipCar) => number | string][] = [
  ["Reference price", (car) => car.p],
  ["Est. monthly cost", (car) => fin(car.p) + sum(run(car.p))],
  ["Est. 5-year cost", (car) => total(car.p, 5)],
  ["Transmission", (car) => car.t],
  ["Fuel", (car) => car.f],
  ["Body style", (car) => car.bodyStyle],
];

export function CompareTool({ cars }: { cars: OwnershipCar[] }) {
  const query = useSearchParams();
  const a = findOwnershipCar(cars, query.get("a")) ?? cars[0];
  const b = findOwnershipCar(cars, query.get("b")) ?? findOwnershipCar(cars, "cross") ?? cars[0];
  function select(side: "a" | "b", id: string) {
    if (!findOwnershipCar(cars, id)) return;
    const params = new URLSearchParams(query.toString());
    params.set("a", side === "a" ? id : a.siteId);
    params.set("b", side === "b" ? id : b.siteId);
    // Next integrates native history with useSearchParams; selecting needs no server round trip.
    window.history.pushState(null, "", `/compare?${params}`);
  }
  return (
    <>
      <div className="grid" style={{ margin: "20px 0" }}>
        <select
          id="ca"
          aria-label="First car"
          value={a.siteId}
          onChange={(event) => select("a", event.currentTarget.value)}
        >
          {cars.map((car) => (
            <option key={car.siteId} value={car.siteId}>
              {car.n}
            </option>
          ))}
        </select>
        <select
          id="cb"
          aria-label="Second car"
          value={b.siteId}
          onChange={(event) => select("b", event.currentTarget.value)}
        >
          {cars.map((car) => (
            <option key={car.siteId} value={car.siteId}>
              {car.n}
            </option>
          ))}
        </select>
      </div>
      <div className="card" style={{ overflowX: "auto" }}>
        <table aria-label="Vehicle comparison">
          <thead>
            <tr>
              <th scope="col" aria-label="Comparison metric" />
              <th scope="col">{a.n}</th>
              <th scope="col">{b.n}</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map(([label, value]) => {
              const x = value(a),
                y = value(b),
                numeric = typeof x === "number" && typeof y === "number";
              const lowerA = numeric && x < y,
                lowerB = numeric && y < x;
              const format = (entry: number | string) =>
                typeof entry === "number" ? R(entry) : entry;
              return (
                <tr key={label}>
                  <td className="mut">{label}</td>
                  <td
                    className={lowerA ? "w" : undefined}
                    aria-label={lowerA ? `${format(x)} (lower cost)` : undefined}
                  >
                    {format(x)}
                  </td>
                  <td
                    className={lowerB ? "w" : undefined}
                    aria-label={lowerB ? `${format(y)} (lower cost)` : undefined}
                  >
                    {format(y)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p
        className="mut"
        style={{ fontSize: 12, marginTop: 10 }}
      >{`Highlight marks the lower cost. Estimates use ${DEFAULTS.dep}% deposit, ${DEFAULTS.n} months at ${DEFAULTS.rate}%.`}</p>
      <EnergyModelNote show={a.f !== "Petrol" || b.f !== "Petrol"} />
    </>
  );
}
