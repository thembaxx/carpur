import rows from "../../data/toyota-2026-10-13.json";
import { CARS, type Car } from "./data";

export const CATALOGUE_CHECKED_AT = "2026-10-13";

export interface CatalogueCar extends Car {
  reference: {
    url: string;
    checkedAt: string;
    range: string;
    bodyStyle: string;
    fuelDescription: string;
    transmissionDescription: string;
    consumption: number | null;
    seats: number;
  };
}

/** Presentation adapter for the original app's unchanged manufacturer snapshot. */
const featuredPaintByRange = new Map(rows.flatMap((row) => {
  const fixture = CARS.find((car) => car.siteId === `catalogue-toyota-${row.id}`);
  return fixture ? [[row.rangeName.replace(/^Toyota\s+/i, ""), fixture.c] as const] : [];
}));

export const catalogue: CatalogueCar[] = rows.map((row) => {
  const siteId = `catalogue-toyota-${row.id}`;
  const featured = CARS.find((car) => car.siteId === siteId);
  const range = row.rangeName.replace(/^Toyota\s+/i, "");
  const model = row.name.toLowerCase().includes(range.toLowerCase()) || (range === "Land Cruiser Prado" && /prado/i.test(row.name)) ? row.name : `${range} ${row.name}`;
  const fuel: Car["f"] = /plug-in/i.test(row.fuelType) ? "Plug-in Hybrid" : /hybrid/i.test(row.fuelType) ? "Hybrid" : /diesel/i.test(row.fuelType) ? "Diesel" : "Petrol";
  const bodyStyle = ({ hatch: "Hatchback", suv: "SUV", sedan: "Sedan", coupe: "Coupe", "mini-van-taxi": "MPV" } as Record<string, string>)[row.bodyType] || "Other";
  const price = Number(row.price);
  if (!Number.isFinite(price) || price <= 0) throw new Error(`Invalid manufacturer price for ${siteId}`);
  return {
    id: featured?.id ?? siteId,
    siteId,
    n: `Toyota ${model}`,
    p: price,
    t: /manual/i.test(row.transmission) ? "Manual" : "Automatic",
    // The renderer has three illustrative shapes; the sourced body style is retained below.
    b: row.bodyType === "suv" ? "suv" : row.bodyType === "mini-van-taxi" ? "mpv" : "hatch",
    f: fuel,
    c: featuredPaintByRange.get(range) ?? "#c8ccd2",
    image: row.image.mobile || row.image.thumbnail,
    reference: {
      url: row.sourceUrl,
      checkedAt: CATALOGUE_CHECKED_AT,
      range,
      bodyStyle,
      fuelDescription: row.fuelType,
      transmissionDescription: row.transmission,
      consumption: Number.isFinite(Number(row.fuelcon)) ? Number(row.fuelcon) : null,
      seats: Number(row.seats),
    },
  } satisfies CatalogueCar;
}).sort((a, b) => a.p - b.p);

export const featuredCars = CARS.map((fixture) => {
  const car = catalogue.find((entry) => entry.siteId === fixture.siteId);
  if (!car) throw new Error(`Missing featured catalogue record ${fixture.siteId}`);
  return car;
});

export function getCatalogueCar(id: string) {
  return catalogue.find((car) => car.siteId === id || car.id === id);
}
