import { ENERGY_MODEL_NOTE } from "@/lib/ownership";

export function EnergyModelNote({ show }: { show: boolean }) {
  return show ? <p className="mut" style={{ fontSize: 12, marginTop: 10 }}>{ENERGY_MODEL_NOTE}</p> : null;
}
