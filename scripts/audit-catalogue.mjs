import { readFile, appendFile } from "node:fs/promises";

const records = JSON.parse(await readFile("data/toyota-2026-10-13.json", "utf8"));
const source = JSON.parse(await readFile("data/catalogue-source.json", "utf8"));
const issues = [];
const urls = new Set();
const ids = new Set();
const ranges = new Set();

if (!Array.isArray(records) || !records.length) issues.push("Catalogue is empty");
else for (const row of records) {
  if (ids.has(String(row.id))) issues.push("Duplicate vehicle identifier: " + row.id);
  ids.add(String(row.id));
  ranges.add(row.rangeName);
  if (!Number.isFinite(Number(row.price)) || Number(row.price) <= 0) {
    issues.push("Nonpositive or missing price for vehicle " + row.id);
  }
  if (!row.name || !row.rangeName || !row.fuelType) issues.push("Missing vehicle metadata: " + row.id);
  try {
    const url = new URL(row.sourceUrl);
    if (url.protocol !== "https:" || url.hostname !== "www.toyota.co.za") {
      issues.push("Unapproved price source for " + row.id);
    } else urls.add(url.href);
  } catch { issues.push("Missing/invalid source URL for " + row.id); }
}
if (source.variants !== records.length) issues.push("Provenance variant count does not match data");
if (source.ranges !== ranges.size) issues.push("Provenance range count does not match data");
const observed = Date.parse(source.observedAt + "T00:00:00Z");
const days = Math.floor((Date.now() - observed) / 86400000);
if (!Number.isFinite(observed) || days < 0) issues.push("Invalid source observation date");
if (days > 30) issues.push("Manufacturer snapshot older than 30 days; review source before claiming current pricing");

const report = [
  "## Carpur catalogue evidence audit", "",
  "This validates the checked-in data and provenance. It does **not** assert prices are current.",
  "",
  "- Variants: " + records.length,
  "- Ranges: " + ranges.size,
  "- Official source pages: " + urls.size,
  "- Observed: " + source.observedAt,
  "- Snapshot age: " + days + " days",
  "",
  issues.length ? "### Review needed\n" + issues.map(x => "- " + x).join("\n") : "No local integrity issues detected.",
].join("\n");
console.log(report);
if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, report + "\n");
if (issues.length) process.exitCode = 1;
