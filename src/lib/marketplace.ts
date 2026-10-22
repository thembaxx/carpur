import { catalogue } from "./catalogue";

export const FUEL_FILTERS = [
  "All",
  "Petrol",
  "Diesel",
  "Hybrid",
  "Electric",
  "Plug-in Hybrid",
] as const;
export type SearchParams = Record<string, string | string[] | undefined>;

export function marketplaceState(search: SearchParams) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (first !== undefined) params.set(key, first);
  }
  return {
    params: params.toString(),
    used: params.get("inventory") === "sellers" || params.get("condition") === "USED",
    fuel: params.get("fuel") || "All",
    sort: params.get("sort") === "price-high" ? "price-high" : "price-low",
    body: params.get("body") || "",
    query: params.get("q")?.trim().toLowerCase() || "",
    condition: params.get("condition") || "",
    examples: params.get("inventory") === "examples",
  };
}
export type MarketplaceState = ReturnType<typeof marketplaceState>;

export function marketplaceHref(
  state: MarketplaceState,
  change: { used?: boolean; fuel?: string; sort?: string },
) {
  const params = new URLSearchParams(state.params);
  if (change.used !== undefined) {
    if (change.used) {
      params.set("inventory", "sellers");
      params.set("condition", "USED");
    } else {
      params.delete("inventory");
      params.delete("condition");
    }
  }
  if (change.fuel !== undefined) {
    if (change.fuel === "All") params.delete("fuel");
    else params.set("fuel", change.fuel);
  }
  if (change.sort !== undefined) params.set("sort", change.sort);
  const query = params.toString();
  return `/marketplace${query ? `?${query}` : ""}`;
}

export function visibleCatalogue(state: MarketplaceState) {
  // Seller services and illustrative examples have not been imported into this fresh repo.
  if (state.used || state.examples || (state.condition && state.condition !== "NEW")) return [];
  return catalogue
    .filter(
      (car) =>
        (state.fuel === "All" || car.f === state.fuel) &&
        (!state.body || car.reference.bodyStyle === state.body) &&
        (!state.query || `${car.n} South Africa`.toLowerCase().includes(state.query)),
    )
    .sort((a, b) => (state.sort === "price-high" ? b.p - a.p : a.p - b.p));
}
