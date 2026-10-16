import { R, total } from "@/lib/data";

export function OwnershipCostCard({ price }: { price: number }) {
  return (
    <div className="card" style={{ margin: "20px 0" }}>
      <b>Cost of ownership (estimate)</b>
      {[1, 3, 5].map((year) => <p className="ln" key={year}><span className="mut">{`${year}-year total`}</span><b>{R(total(price, year))}</b></p>)}
      <p className="mut" style={{ fontSize: 12 }}>10% deposit, 60 months at 12.5%, 1 500 km a month.</p>
    </div>
  );
}
