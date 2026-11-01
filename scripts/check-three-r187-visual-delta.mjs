import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";

// Compare the actual current-main and candidate application stages, not the
// historical r128 design artifact (which current main already differs from).
const baselineDir = process.argv[2];
const candidateDir = process.argv[3];
if (!baselineDir || !candidateDir) {
  throw new Error("Expected baseline and candidate screenshot directories");
}
const files = readdirSync(baselineDir).filter((name) => name.endsWith(".png")).sort();
if (files.length < 44) throw new Error(`Expected 44 stage/hero samples, got ${files.length}`);
const actual = readdirSync(candidateDir).filter((name) => name.endsWith(".png")).sort();
if (files.join("|") !== actual.join("|")) {
  throw new Error("Baseline and candidate screenshot inventories differ");
}
const reports = [];
for (const name of files) {
  const before = PNG.sync.read(readFileSync(path.join(baselineDir, name)));
  const after = PNG.sync.read(readFileSync(path.join(candidateDir, name)));
  if (before.width !== after.width || before.height !== after.height) {
    throw new Error(`Viewport/layout regression in ${name}: ${before.width}x${before.height} vs ${after.width}x${after.height}`);
  }
  let changed = 0;
  for (let i = 0; i < before.data.length; i += 4) {
    if (
      Math.abs(before.data[i] - after.data[i]) > 10 ||
      Math.abs(before.data[i + 1] - after.data[i + 1]) > 10 ||
      Math.abs(before.data[i + 2] - after.data[i + 2]) > 10
    ) changed++;
  }
  const percent = +(changed / (before.width * before.height) * 100).toFixed(4);
  reports.push({ name, percent, pass: percent <= 1 });
  console.log(`${percent <= 1 ? "PASS" : "FAIL"} ${name}: ${percent}% significant pixel differences`);
}
const summary = {
  compared: reports.length,
  maximumPercent: Math.max(...reports.map((x) => x.percent)),
  averagePercent: +(reports.reduce((sum, x) => sum + x.percent, 0) / reports.length).toFixed(4),
  thresholdPercent: 1,
  reports,
};
mkdirSync("parity", { recursive: true });
writeFileSync("parity/three-r187-vs-current-main.json", JSON.stringify(summary, null, 2) + "\n");
console.log(`Compared ${summary.compared} views; maximum ${summary.maximumPercent}%, average ${summary.averagePercent}%`);
if (reports.some((x) => !x.pass)) process.exitCode = 1;
