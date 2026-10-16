import type { Metadata } from "next";
import { AffordabilityCalculator } from "@/components/AffordabilityCalculator";
import { catalogue, getCatalogueCar } from "@/lib/catalogue";
import type { SearchParams } from "@/lib/marketplace";
import { firstParam } from "@/lib/ownership";

export const metadata: Metadata = { title: "Affordability — Carpur" };

export default async function Affordability({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const query = await searchParams;
  const car = getCatalogueCar(firstParam(query.id) ?? "") ?? catalogue[0];
  const cars = catalogue.map(({ id, siteId, n, p, t, f, b, reference }) => ({ id, siteId, n, p, t, f, b, bodyStyle: reference.bodyStyle }));
  return (
    <section className="sec">
      <p className="k">Affordability</p>
      <h2>A car you love. A budget that works.</h2>
      <AffordabilityCalculator key={car.siteId} cars={cars} initialId={car.siteId} />
    </section>
  );
}
