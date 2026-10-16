import Link from "next/link";
import { FUEL_FILTERS, marketplaceHref, type MarketplaceState } from "@/lib/marketplace";

export function FilterChips({ state }: { state: MarketplaceState }) {
  return (
    <div className="row" aria-label="Marketplace filters">
      {[false, true].map((used) => <Link key={String(used)} className={`fc${state.used === used ? " on" : ""}`} href={marketplaceHref(state, { used })} prefetch={false} aria-current={state.used === used ? "true" : undefined}>{used ? "Used" : "New"}</Link>)}
      <span style={{ width: 12 }} />
      {FUEL_FILTERS.map((fuel) => <Link key={fuel} className={`fc${state.fuel === fuel ? " on" : ""}`} href={marketplaceHref(state, { fuel })} prefetch={false} aria-current={state.fuel === fuel ? "true" : undefined}>{fuel}</Link>)}
      <span style={{ width: 12 }} />
      <Link className="fc" href={marketplaceHref(state, { sort: state.sort === "price-low" ? "price-high" : "price-low" })} prefetch={false}>{`Price ${state.sort === "price-low" ? "low → high" : "high → low"}`}</Link>
    </div>
  );
}
