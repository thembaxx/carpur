import type { Metadata } from "next";
import { CarCard } from "@/components/CarCard";
import { EmptyState } from "@/components/EmptyState";
import { FilterChips } from "@/components/FilterChips";
import { marketplaceState, visibleCatalogue, type SearchParams } from "@/lib/marketplace";

export const metadata: Metadata = { title: "Carpur — New and used cars" };

export default async function Marketplace({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const state = marketplaceState(await searchParams);
  const cars = visibleCatalogue(state);
  return (
    <section className="sec">
      <p className="k">Marketplace</p>
      <h2>{state.used ? "Used cars" : "New cars"}</h2>
      <FilterChips state={state} />
      {cars.length ? (
        <div className="grid">
          {cars.map((car, index) => (
            <CarCard key={car.siteId} car={car} eager={index < 4} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={state.used ? "Seller inventory is coming" : "No variants listed yet"}
          description={
            state.used
              ? "Dealerships and private sellers are adding stock."
              : "Try another fuel type or browse petrol cars."
          }
          action={state.used ? "List a car" : "Show all new cars"}
          href={state.used ? "/sell" : "/marketplace"}
        />
      )}
    </section>
  );
}
