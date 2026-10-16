import { DEFAULTS, R, fin, run, total, type CostOpts } from "@/lib/data";
import { ESTIMATE_ASSUMPTIONS } from "@/lib/ownership";
import { EnergyModelNote } from "./EnergyModelNote";

export function CostBreakdown({ price, options, nonPetrol }: { price: number; options: CostOpts; nonPetrol: boolean }) {
  const { dep, n, rate, km, fp } = { ...DEFAULTS, ...options };
  const running = run(price, km, 6.5, fp);
  const parts = [
    ["Finance", fin(price, dep, n, rate), "var(--ac)"],
    ["Fuel", running.fuel, "#4aa3ff"],
    ["Insurance", running.ins, "#f2b84b"],
    ["Maintenance", running.mnt, "#7bd88f"],
  ] as const;
  const monthly = parts.reduce((sum, part) => sum + part[1], 0);
  return (
    <div className="card" id="res">
      <p className="k">Estimated monthly cost</p>
      <h2 aria-live="polite" aria-atomic="true">{R(monthly)}</h2>
      <div className="bar" style={{ margin: "16px 0" }} aria-hidden="true">{parts.map(([label, value, color]) => <i key={label} style={{ width: `${value / monthly * 100}%`, background: color }} />)}</div>
      {parts.map(([label, value, color]) => <p key={label} className="ln"><span><span style={{ color }} aria-hidden="true">●</span>{` ${label}`}</span><b>{R(value)}</b></p>)}
      <p className="k" style={{ marginTop: 18 }}>Ownership total</p>
      {[1, 3, 5].map((year) => <p key={year} className="ln"><span className="mut">{`${year} year${year > 1 ? "s" : ""}`}</span><b>{R(total(price, year, options))}</b></p>)}
      <p className="mut" style={{ fontSize: 12, marginTop: 10 }}>{ESTIMATE_ASSUMPTIONS}</p>
      <EnergyModelNote show={nonPetrol} />
    </div>
  );
}
