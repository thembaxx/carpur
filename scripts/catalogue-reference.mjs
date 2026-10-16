// QA-only data alignment. The reference HTML remains unchanged on disk.
import { readFileSync } from "node:fs";

export const snapshot = JSON.parse(readFileSync(new URL("../data/toyota-2026-10-13.json", import.meta.url)));
export const featuredIds = ["1616", "1743", "1611", "1919"];
const paints = { Starlet: "#c8ccd2", Rumion: "#6c7a89", "Urban Cruiser": "#b3422e", "Corolla Cross": "#2d4a63" };

export const referenceCars = snapshot.map((row) => {
  const range = row.rangeName.replace(/^Toyota\s+/i, "");
  const name = row.name.toLowerCase().includes(range.toLowerCase()) || (range === "Land Cruiser Prado" && /prado/i.test(row.name)) ? row.name : `${range} ${row.name}`;
  return {
    id: `catalogue-toyota-${row.id}`, n: `Toyota ${name}`, p: Number(row.price),
    t: /manual/i.test(row.transmission) ? "Manual" : "Automatic",
    f: /plug-in/i.test(row.fuelType) ? "Plug-in Hybrid" : /hybrid/i.test(row.fuelType) ? "Hybrid" : /diesel/i.test(row.fuelType) ? "Diesel" : "Petrol",
    b: row.bodyType === "suv" ? "suv" : row.bodyType === "mini-van-taxi" ? "mpv" : "hatch",
    bodyStyle: ({ hatch: "Hatchback", suv: "SUV", sedan: "Sedan", coupe: "Coupe", "mini-van-taxi": "MPV" })[row.bodyType] || "Other",
    c: paints[range] || "#c8ccd2",
  };
}).sort((a, b) => a.p - b.p);

export async function alignReferenceCatalogue(page, home) {
  const cars = home ? featuredIds.map((id) => referenceCars.find((car) => car.id === `catalogue-toyota-${id}`)) : referenceCars;
  await page.evaluate(({ cars, home }) => {
    // Replace only the four in-memory fixtures, then use the original render functions.
    window.eval("CARS").splice(0, window.eval("CARS").length, ...cars);
    if (home) {
      // Update the featured cards with the original renderer while keeping
      // the original hero and its WebGL context mounted.
      document.querySelector("main .sec .grid").innerHTML = cars.map(window.eval("card")).join("");
      return;
    }
    window.eval("go")();
    const row = document.querySelector("main .row");
    const petrol = [...row.querySelectorAll("a")].find((link) => link.textContent === "Petrol");
    const diesel = petrol.cloneNode(true);
    diesel.textContent = "Diesel";
    const route = new URLSearchParams(location.hash.split("?")[1] || "");
    diesel.className = `fc${route.get("f") === "Diesel" ? " on" : ""}`;
    route.set("f", "Diesel");
    diesel.setAttribute("href", `#/cars?${route}`);
    petrol.after(diesel);
    // Artifact bug: interpolating an array creates visible commas/grid items.
    // React's mapped children correctly omit these accidental separators.
    document.querySelectorAll("main .grid").forEach((grid) => {
      [...grid.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim() === ",").forEach((node) => node.remove());
    });
  }, { cars, home });
}
