import type { Body } from "./car-model";

/**
 * Fixture for the 4 featured Toyota variants shown in the artifact.
 * In the real app, keep using the existing catalogue data layer (44 variants) and map each record to this shape.
 * `siteId` / `image` come from the live site (nou2.vercel.app); `body`, `fuel` and `color` were chosen for the
 * artifact — verify `fuel` and `body` against the real catalogue.
 */
export interface Car {
  id: string; // artifact id
  siteId: string; // real route id: /vehicles/[siteId]
  n: string; // name
  p: number; // manufacturer reference price (ZAR)
  t: "Manual" | "Automatic";
  b: Body; // 3D body style + silhouette
  f: "Petrol" | "Diesel" | "Hybrid" | "Electric" | "Plug-in Hybrid";
  c: string; // illustrative paint colour for the 3D model / silhouette
  image: string; // real manufacturer image (use with next/image; silhouette is the fallback)
}

const IMG = "https://assets.cdntoyota.co.za/toyotacms23/attachments/";
export const CARS: Car[] = [
  {
    id: "starlet",
    siteId: "catalogue-toyota-1616",
    n: "Toyota Starlet 1.5L Xi 5MT",
    p: 273700,
    t: "Manual",
    b: "hatch",
    f: "Petrol",
    c: "#c8ccd2",
    image: IMG + "cl3e5s0o000i50mmhp6z2t8cn-starlet-xi-wbg-rgb.desktop.png",
  },
  {
    id: "rumion",
    siteId: "catalogue-toyota-1743",
    n: "Toyota Rumion 1.5 S MT",
    p: 314100,
    t: "Manual",
    b: "mpv",
    f: "Petrol",
    c: "#6c7a89",
    image: IMG + "cmhtf9nxq143w4kak3vv1havx-resized-rumion-1-5-s-zhj-rgb.desktop.png",
  },
  {
    id: "urban",
    siteId: "catalogue-toyota-1611",
    n: "Toyota Urban Cruiser 1.5 Xs MT",
    p: 342700,
    t: "Manual",
    b: "suv",
    f: "Petrol",
    c: "#b3422e",
    image: IMG + "clf7zsbt800jv0pqrg9dsirx2-urban-cruiser-xr-rgb-ret-zhj.desktop.png",
  },
  {
    id: "cross",
    siteId: "catalogue-toyota-1919",
    n: "Toyota COROLLA CROSS 1.8 Xi",
    p: 429100,
    t: "Automatic",
    b: "suv",
    f: "Petrol",
    c: "#2d4a63",
    image: IMG + "cmdg0bf6v05d2jcak5c1o3577-corolla-cross-xi-040-rgb.desktop.png",
  },
];
export const getCar = (id?: string | null) => CARS.find((c) => c.id === id || c.siteId === id);

/** ZAR formatter used everywhere: "R 273 700" */
export const R = (n: number) => "R " + Math.round(n).toLocaleString("en-ZA");

/* ---- Ownership-cost model (identical to the artifact). Assumptions are PLACEHOLDERS — see HANDOFF.md §9. ---- */
export const ASSUME = { litresPer100: 6.5, insurancePct: 0.05, maintenancePct: 0.015 };
export const DEFAULTS = { dep: 10, n: 60, rate: 12.5, km: 1500, fp: 24 };
export type CostOpts = Partial<typeof DEFAULTS>;

/** Monthly finance instalment. dep = deposit %, n = months, rate = annual % */
export const fin = (p: number, dep = 10, n = 60, rate = 12.5) => {
  const P = p * (1 - dep / 100),
    r = rate / 1200;
  return (P * r) / (1 - Math.pow(1 + r, -n));
};
/** Monthly running costs: fuel (km, L/100km, R/L), insurance, maintenance */
export const run = (p: number, km = 1500, L = ASSUME.litresPer100, fp = 24) => ({
  fuel: ((km * L) / 100) * fp,
  ins: (p * ASSUME.insurancePct) / 12,
  mnt: (p * ASSUME.maintenancePct) / 12,
});
export const sum = (o: { fuel: number; ins: number; mnt: number }) => o.fuel + o.ins + o.mnt;
/** Total cost of ownership after `y` years (deposit + instalments capped at term + running costs) */
export const total = (p: number, y: number, o: CostOpts = {}) => {
  const { dep = 10, n = 60, rate = 12.5, km = 1500, fp = 24 } = o;
  const m = y * 12;
  return (
    (p * dep) / 100 +
    fin(p, dep, n, rate) * Math.min(m, n) +
    sum(run(p, km, ASSUME.litresPer100, fp)) * m
  );
};
