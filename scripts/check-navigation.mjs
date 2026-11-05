import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { NAV } from "../src/lib/routes.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
function checkRoute(href) {
  const pathname = new URL(href, "https://carpur.local").pathname;
  const file = pathname === "/" ? "src/app/page.tsx" : "src/app" + pathname + "/page.tsx";
  assert.ok(existsSync(join(root, file)), "Navigation points to a missing page: " + href);
}
const routes = [...NAV.map(([href]) => href)];
const header = readFileSync(join(root, "src/components/Header.tsx"), "utf8");
for (const [, href] of header.matchAll(/href="(\/[a-z0-9-]+)"/g)) routes.push(href);
for (const href of routes) checkRoute(href);
assert.ok(!header.includes('href="/sign-in"') && !header.includes('href="/sell"'));
console.log("PASS " + routes.length + " header and navigation destinations exist");
