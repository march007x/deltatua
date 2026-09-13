import { chromium } from "playwright";
import fs from "node:fs";

const BASE = "http://localhost:3003";
const OUT = "p8-screens";
fs.mkdirSync(OUT, { recursive: true });

const ROUTES = [
  "/",
  "/courses",
  "/login",
  "/plan",
  "/today",
  "/tasks",
  "/exams",
  "/exam",
  "/exam/m4-1",
  "/practice",
  "/practice/set-basic",
  "/progress",
  "/lesson/set-basic",
  "/account",
  "/does-not-exist-404-check",
];

const browser = await chromium.launch();
const results = [];

for (const theme of ["light", "dark"]) {
  const context = await browser.newContext({ viewport: { width: 375, height: 800 } });
  await context.addInitScript((t) => window.localStorage.setItem("delta-theme", t), theme);
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
  page.on("pageerror", (e) => consoleErrors.push(String(e)));

  for (const route of ROUTES) {
    try {
      await page.goto(`${BASE}${route}`, { waitUntil: "networkidle", timeout: 20000 });
      await page.waitForTimeout(250);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      const finalUrl = page.url();
      const fname = `${OUT}/${route.replace(/\//g, "_") || "home"}-375-${theme}.png`;
      await page.screenshot({ path: fname, fullPage: true });
      results.push({ route, theme, overflow, finalUrl, ok: true });
    } catch (e) {
      results.push({ route, theme, error: String(e), ok: false });
    }
  }
  await context.close();
  if (consoleErrors.length) results.push({ route: "*console*", theme, errors: consoleErrors.slice(0, 15) });
}

await browser.close();

console.log("\n=== RESULTS ===");
for (const r of results) console.log(JSON.stringify(r));

const overflows = results.filter((r) => r.overflow);
const fails = results.filter((r) => r.ok === false);
console.log("\n=== SUMMARY ===");
console.log("overflow count:", overflows.length);
overflows.forEach((o) => console.log("  OVERFLOW:", o.route, o.theme));
console.log("nav failures:", fails.length);
fails.forEach((f) => console.log("  FAIL:", f.route, f.theme, f.error));
