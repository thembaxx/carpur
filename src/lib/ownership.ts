import type { Car } from "./data";

/** Only the fields required by the interactive calculator and comparison. */
export type OwnershipCar = Pick<Car, "id" | "siteId" | "n" | "p" | "t" | "f" | "b"> & {
  bodyStyle: string;
};

export const ESTIMATE_ASSUMPTIONS =
  "Assumes 6.5 L/100 km, insurance 5% and maintenance 1.5% of price a year. Estimates, not finance or insurance offers.";
export const ENERGY_MODEL_NOTE =
  "Energy costs use an illustrative petrol model, not this vehicle’s actual energy use. Diesel, hybrid and charging costs need separate estimates.";

export function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function findOwnershipCar(cars: OwnershipCar[], id: string | null | undefined) {
  return cars.find((car) => car.siteId === id || car.id === id);
}
