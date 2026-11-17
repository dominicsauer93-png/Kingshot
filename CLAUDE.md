# Notes for Claude

## Eternity's Reach — shout the reminder
When the user mentions Eternity's Reach (or says it's on / coming up), open your reply in CAPITALS with:

**RECALL ONE MARCH EVERY 60 SECONDS — THE WHOLE EVENT!**
- Last run (17 Nov 2026): rank 22, 372,777 copper. Rank 10 had 451,078.
- Where rank 10 beat you: **Cesares guards 117K vs your 30K (−87K)** and **Scattered Copper Ore 90K vs 41.5K (−48.5K)**. You beat them on veins (+42K) and common-vein recalls (16 paid = 80K vs 65K).
- So: keep the 60-second recalls, but hit Cesares much harder and chase every Scattered Copper Ore. (Earlier advice to stop Cesares sooner was wrong.)
- Top 10 = 55 Charm Designs + 40 Guides + 5,000 gems (vs 47 / 38 / 4,500).
- Skill order: Right, Right, Left, Left, Right. Skip the Peak. Save Skill 5 for Vein Outbursts.

- Runs every 14 days at 9 pm Brisbane (11:00 UTC). Best ever: rank 13 with 383,822 (25 Aug 2026). Top 10 needed 437.6K on 3 Nov and 451.1K on 17 Nov.

Full guide, ranking table and full history: the Eternity's Reach event note in `console-data.json`.

## Shop guide
- All shops, event shops and packs live in `js/shops.js` (`SHOP_DB`), shown in Plan → Shop guide. Keep it up to date whenever the user shows a shop or pack: items, cost, limit, %, date seen, and Buy / Skip advice.
- Screenshots may arrive in `shops/inbox/` — read them, update `SHOP_DB`, then delete them (keep the README).
- Bag screenshots may arrive in `bag/inbox/` — read them, update the bag in `console-data.json` (resources + speedups in minutes, dust/gold, heroGear.have, govGear.have, charms.have, pets.have, tg, shardGeneral), set `bagCheck` to today (`d` = date, `v` = the new values, like the app's Save does), then delete them (keep the README).
- Hero screenshots may arrive in `heroes/inbox/` — read them, update hero data in `console-data.json` (goldShards stars/shards, widgets, heroGear, heroInfo, formations), then delete them (keep the README).
- Rules: only packs at 3,000%+; rank by blockers (Mythic Gear, Gilded Threads, Charm Designs); heroes to 4★; monthly budget A$100, resets on the 1st.
- Hall of Heroes sells every season except the newest. Seasons: S7 Ava, Wee & Woo, Charles · S6 Triton, Sophia, Yang · S5 Long Fei, Thrud, Vivian · S4 Margot, Rosa, Alcar · S3 Eric, Petra, Jaeger · S2 Zoe, Hilde, Marlin · S1 Helga, Jabel, Amadeus, Saul.
- Only use confirmed numbers; mark guesses.

## Truegold building levels
- Every building's level ladder lives in `BUILD_TIERS` in `js/core.js`; the top step listed is the highest level out so far ("max for now").
- When TG 9 / TG 10 come out, append their steps (to, wood, stone, iron, TG, TTG) to each building there. Buildings at the old top then continue automatically — nothing else to change. Only use confirmed costs; mark guesses.

## Releasing code changes
- Run `node scripts/bump.mjs` before committing any change to js/, css/ or index.html. It bumps the cache name in sw.js and the `?v=` on every file in index.html, so devices load the new files straight away.
- Do this automatically, without asking, once a change is done and checked: commit, push to the working branch, open a pull request into `main` (or update the open one), and watch it for CI and review comments.
- If the branch's last PR is already merged, restart the branch from the latest `main` first, then open a new PR.
- Merge only when the user says so.
