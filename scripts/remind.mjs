// Daily reminder check (run by .github/workflows/reminders.yml).
// Reads console-data.json and sends a phone notification through ntfy.sh when
// an event is on today or tomorrow, or a monthly/weekly card ends within 3 days.
// Does nothing unless the NTFY_TOPIC secret is set.
import { readFileSync } from "node:fs";

const topic = (process.env.NTFY_TOPIC || "").trim();
const data = JSON.parse(readFileSync(new URL("../console-data.json", import.meta.url), "utf8"));
const num = v => { const n = parseFloat(String(v ?? "").replace(/,/g, "")); return isNaN(n) ? 0 : n; };
const day = d => { const x = new Date(d + "T00:00:00Z"); return Math.round(x.getTime() / 864e5); };
const now = process.env.NOW ? new Date(process.env.NOW) : new Date(); // NOW=2026-11-15T22:50:00Z to test
const today = day(new Intl.DateTimeFormat("en-CA", { timeZone: process.env.TZ || "Australia/Brisbane" }).format(now));

const gameDay = day(now.toISOString().slice(0, 10)); // events run on game days (UTC)
const lines = [];
const EVENT_LEN = [[/hall of heroes/i, 3], [/armament competition \(type 1\)/i, 2]];
for (const e of data.events || []) {
  if (!e.date) continue;
  const start = day(e.date), every = Math.floor(num(e.every)), len = Math.max(1, Math.floor(num(e.len)) || (EVENT_LEN.find(([r]) => r.test(e.n || "")) || [0, 1])[1]);
  const dayOf = off => { const d = gameDay + off - start; return d < 0 ? -1 : every > 0 ? d % every : d; }; // day index inside the current run
  const runs = off => { const d = gameDay + off - start; if (d < 0) return false; return every > 0 ? d % every < len : d < len; };
  const starts = off => { const d = gameDay + off - start; return d >= 0 && (every > 0 ? d % every === 0 : d === 0); };
  if (/bear/i.test(e.n || "")) { if (starts(0)) lines.push(`🐻 ${e.n} today${e.time ? " at " + e.time : ""}`); continue; }
  const hoursLeft = () => Math.ceil(((gameDay + 1 + (len - 1 - dayOf(0))) * 864e5 - now.getTime()) / 36e5);
  if (runs(0) && len > 1 && !e.endOpen && dayOf(0) >= len - 2) lines.push(`⏳ ${e.n} ends in ${hoursLeft()}h (10 am Brisbane${dayOf(0) === len - 2 ? " tomorrow" : ""}) — spend all event currency and tokens`);
  else if (runs(0)) lines.push(`⚡ ${e.n} is on today${e.time ? " (" + e.time + ")" : ""}`);
  else if (starts(1)) lines.push(`📅 ${e.n} starts tomorrow — save for it`);
}
const PACK_DAYS = { month: 30, week: 7 };
for (const p of data.packs || []) {
  if (!p.d || !PACK_DAYS[p.kind] || !p.bought) continue;
  const left = day(p.bought) + PACK_DAYS[p.kind] - today;
  if (left < 0) lines.push(`💳 ${p.t} ended ${-left} day(s) ago — renew or untick`);
  else if (left <= 3) lines.push(`💳 ${p.t} ends ${left === 0 ? "today" : `in ${left} day(s)`}`);
}

console.log(lines.length ? lines.join("\n") : "Nothing to remind today.");
if (!topic) { console.log("NTFY_TOPIC not set — no notification sent."); process.exit(0); }
if (!lines.length) process.exit(0);
const r = await fetch(`https://ntfy.sh/${encodeURIComponent(topic)}`, {
  method: "POST", body: lines.join("\n"),
  headers: { Title: "Kingshot today", Tags: "crown", Click: "https://dominicsauer93-png.github.io/Kingshot/" }
});
console.log("ntfy:", r.status);
if (!r.ok) process.exit(1);
