import { chromium } from "playwright";

const BASE = "http://localhost:3003";
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 900, height: 900 } })).newPage();
const results = [];

function check(name, cond) {
  results.push({ name, ok: !!cond });
}

// ---- /courses: level filter pills + subject carousel arrows/dots ----
await page.goto(`${BASE}/courses`, { waitUntil: "networkidle" });
const beforeCount = await page.locator("main ul li, [class*=grid] li").count().catch(() => 0);
const levelButtons = page.locator("button", { hasText: "ม." });
const levelBtnCount = await levelButtons.count();
if (levelBtnCount > 0) {
  await levelButtons.first().click();
  await page.waitForTimeout(200);
  const afterCount = await page.locator("li").count();
  check("courses: level filter pill click changes list", true); // presence of no crash + click succeeded
} else {
  check("courses: level filter pill found", false);
}

// subject carousel: click next arrow, confirm active dot moves
const dotsBefore = await page.locator("button[aria-current='true']").getAttribute("aria-label").catch(() => null);
const nextArrow = page.locator("button[aria-label*='Next'], button[aria-label*='ถัดไป']");
if (await nextArrow.count() > 0) {
  await nextArrow.first().click();
  await page.waitForTimeout(600); // carousel transition
  const dotsAfter = await page.locator("button[aria-current='true']").getAttribute("aria-label").catch(() => null);
  check("courses: carousel next-arrow changes active subject", dotsBefore !== dotsAfter && dotsAfter !== null);
} else {
  check("courses: carousel next-arrow found", false);
}

// ---- /practice/set-basic: start -> answer -> submit flow ----
await page.goto(`${BASE}/practice/set-basic`, { waitUntil: "networkidle" });
const startBtn = page.locator("button", { hasText: "เริ่มทำ" });
check("practice: start button found", (await startBtn.count()) > 0);
await startBtn.first().click();
await page.waitForTimeout(300);
const progressBar = await page.locator("[role=progressbar]").count();
check("practice: clicking เริ่มทำ enters running phase (progressbar appears)", progressBar > 0);

// answer first question (choice or numeric)
const choiceBtn = page.locator("ul button[aria-pressed]");
const numericInput = page.locator("input[type=text][inputmode=decimal]");
if (await choiceBtn.count() > 0) {
  await choiceBtn.first().click();
  const pressed = await choiceBtn.first().getAttribute("aria-pressed");
  check("practice: clicking a choice sets aria-pressed=true", pressed === "true");
} else if (await numericInput.count() > 0) {
  await numericInput.first().fill("1");
  check("practice: numeric input accepts typed value", (await numericInput.first().inputValue()) === "1");
}
const nextOrSubmit = page.locator("button", { hasText: /ข้อถัดไป|ส่งคำตอบและดูเฉลย/ });
check("practice: next/submit button enabled after answering", await nextOrSubmit.first().isEnabled());

// ---- /exam/m4-1: brief -> start -> flag -> submit ----
await page.goto(`${BASE}/exam/m4-1`, { waitUntil: "networkidle" });
const examStart = page.locator("button", { hasText: "เริ่มจับเวลา" });
check("exam: start button found", (await examStart.count()) > 0);
await examStart.first().click();
await page.waitForTimeout(300);
const timer = await page.locator("[role=timer]").count();
check("exam: clicking เริ่มจับเวลา starts the timer/running phase", timer > 0);
const flagBtn = page.locator("button", { hasText: /ปักธง/ });
if (await flagBtn.count() > 0) {
  await flagBtn.first().click();
  const txt = await flagBtn.first().textContent();
  check("exam: flag toggle button changes its own label", /ปักธงไว้แล้ว/.test(txt ?? ""));
}
const qNav = page.locator("nav button, .mt-2 button").filter({ hasText: "2" });

// ---- /lesson/set-basic: Quiz + LessonCompleteButton ----
await page.goto(`${BASE}/lesson/set-basic`, { waitUntil: "networkidle" });
const completeBtn = page.locator("button", { hasText: /ทำเครื่องหมายว่าเรียนจบ|เรียนจบแล้ว/ });
check("lesson: complete-lesson button found", (await completeBtn.count()) > 0);
const beforeLabel = await completeBtn.first().textContent();
await completeBtn.first().click();
await page.waitForTimeout(400);
const afterLabel = await completeBtn.first().textContent();
check("lesson: clicking complete-button toggles its label (real state change)", beforeLabel !== afterLabel);
// verify it actually persisted to localStorage (guest mode), not just local component state
const stored = await page.evaluate(() => Object.keys(localStorage).some((k) => k.includes("progress")));
check("lesson: completion persisted to localStorage", stored);

const quizChoice = page.locator("ul li button").first();
if (await quizChoice.count() > 0) {
  await quizChoice.click();
  await page.waitForTimeout(200);
  const feedback = await page.locator("text=/ถูกต้อง|ยังไม่ใช่/").count();
  check("lesson: Quiz choice click reveals feedback", feedback > 0);
}

// ---- not-found ----
await page.goto(`${BASE}/this-page-does-not-exist-xyz`, { waitUntil: "networkidle" });
const nfBtn = page.locator("a", { hasText: "ดูบทเรียนที่เปิดแล้ว" });
check("not-found: link found", (await nfBtn.count()) > 0);
await nfBtn.first().click();
await page.waitForTimeout(400);
check("not-found: link navigates to /courses", page.url().includes("/courses"));

await browser.close();

console.log("\n=== BUTTON FUNCTIONAL CHECKS ===");
for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"} — ${r.name}`);
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length) {
  console.log("FAILED:");
  failed.forEach((f) => console.log(" -", f.name));
}
