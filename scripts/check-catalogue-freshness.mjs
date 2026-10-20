import { readFileSync } from "node:fs";
const source = JSON.parse(readFileSync(new URL("../data/catalogue-source.json", import.meta.url)));
const isoDate = /^\d{4}-\d{2}-\d{2}$/;
if (!isoDate.test(source.observedAt || "")) throw Error("Catalogue provenance needs a valid observedAt date");
const observed = Date.parse(source.observedAt + "T12:00:00Z");
const ageDays = Math.floor((Date.now() - observed) / 86_400_000);
if (!Number.isFinite(ageDays) || ageDays < -1) throw Error("Catalogue observedAt invalid or in the future");
if (!Number.isInteger(source.variants) || source.variants < 1 || !source.repository || !source.commit || !source.path) throw Error("Incomplete catalogue evidence");
const ttl = Number(process.env.CATALOGUE_MAX_AGE_DAYS || 30);
console.log("Catalogue snapshot observed " + source.observedAt + " (" + ageDays + " days old, max " + ttl + "). Manufacturer reference prices are NOT live dealer quotes.");
if (ageDays > ttl) {
  console.error("Manufacturer catalogue needs editorial refresh and source verification. Do not silently label stale prices as live.");
  process.exitCode = 1;
}
