// Smoke test for the console (run by .github/workflows/tests.yml, or locally: node tests/smoke.mjs).
// Opens index.html with the real console-data.json at phone and PC sizes, visits every tab,
// and fails on any page error, any sideways page scroll, or broken core features.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = new URL("../", import.meta.url);
const page = fileURLToPath(new URL("index.html", root));
const data = readFileSync(new URL("console-data.json", root), "utf8");
const fails = [];
const check = (ok, msg) => { if (!ok) fails.push(msg); console.log((ok ? "✓ " : "✗ ") + msg);
  if (!ok && process.env.GITHUB_ACTIONS) console.log(`::error title=Smoke test::${msg.replace(/\n/g, " ")}`); }; // shows as an annotation on the PR

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
for (const [w, h, label] of [[390, 844, "phone"], [1280, 900, "pc"]]) {
  const p = await browser.newPage({ viewport: { width: w, height: h } });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto("file://" + page + "#home");
  await p.evaluate(d => localStorage.setItem("kingshot-console-v1", d), data);
  await p.reload(); await p.waitForFunction(() => document.querySelector("#homeTiles .tile")); await p.waitForTimeout(500);
  const tabs = await p.evaluate(() => Object.entries({ Home: [], ...SUBS }).flatMap(([t, s]) => s.length ? s.map(x => [t, x]) : [[t, null]]));
  for (const [t, s] of tabs) {
    await p.evaluate(([t, s]) => setTab(t, s), [t, s]); await p.waitForTimeout(120);
    const over = await p.evaluate(() => { if (document.documentElement.scrollWidth <= innerWidth + 1) return "";
      const wide = [...document.querySelectorAll("body *")].filter(e => e.getBoundingClientRect().right > innerWidth + 1 && e.offsetParent)
        .map(e => e.tagName.toLowerCase() + (e.id ? "#" + e.id : "") + (e.className && typeof e.className === "string" ? "." + e.className.split(" ")[0] : "")).slice(0, 3);
      return `${document.documentElement.scrollWidth}px wide (${wide.join(", ")})`; });
    check(!over, `${label}: ${t}${s ? " › " + s : ""} fits the screen${over ? " — " + over : ""}`);
  }
  // core features
  check(await p.evaluate(() => typeof merge3 === "function" && merge3({a:1,b:1},{a:2,b:1},{a:1,b:3}).a === 2 && merge3({a:1,b:1},{a:2,b:1},{a:1,b:3}).b === 3), `${label}: two-device merge keeps both edits`);
  await p.evaluate(() => setTab("Home")); await p.waitForTimeout(150);
  check(await p.locator("#todayRoutine li").count() > 0, `${label}: Home routine renders`);
  await p.evaluate(() => openSearch()); await p.fill("#srchIn", "shards"); await p.waitForTimeout(100);
  check(await p.locator("#srchList button").count() > 0, `${label}: search finds sections`);
  await p.evaluate(() => closeSearch());
  check(await p.evaluate(() => /BEGIN:VCALENDAR[\s\S]*END:VCALENDAR/.test(icsText())), `${label}: calendar file builds`);
  check(errs.length === 0, `${label}: no page errors${errs.length ? " — " + errs.join(" | ") : ""}`);
  await p.close();
}
await browser.close();
JSON.parse(data); check(true, "console-data.json is valid JSON");
if (fails.length) { console.log(`\n${fails.length} check(s) failed`); process.exit(1); }
console.log("\nAll checks passed");
