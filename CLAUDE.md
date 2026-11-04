# Notes for Claude

## Eternity's Reach — shout the reminder
When the user mentions Eternity's Reach (or says it's on / coming up), open your reply in CAPITALS with:

**RECALL ONE MARCH EVERY 60 SECONDS — THE WHOLE EVENT!**
- Last run (3 Nov 2026): rank 16, 382,860 copper (2nd best). 17 common-vein recalls paid = 85K (up from 9). 23 were tapped — 6 came too early or off a common vein.
- Rank 10 had 437,573 — 55K more, with no Peak and no Master Isnor copper (same as you). Their extra: veins +30.3K, 4 more paid recalls +20K, Scattered Ore +10.4K. You beat them on Cesares (42K vs 36K).
- Top 10 = 55 Charm Designs + 40 Guides + 5,000 gems (vs 47 / 38 / 4,500).
- Scattered Copper Ore: 41.3K — rank 10 got 51.7K, so grab more of it.
- Skill order: Right, Right, Left, Left, Right. Skip the Peak. Save Skill 5 for Vein Outbursts.

- Runs every 14 days at 9 pm Brisbane (11:00 UTC). Best ever: rank 13 with 383,822 (25 Aug 2026). Top 10 needed 437.6K on 3 Nov.

Full guide, ranking table and full history: the Eternity's Reach event note in `console-data.json`.

## Shop guide
- All shops, event shops and packs live in `js/shops.js` (`SHOP_DB`), shown in Plan → Shop guide. Keep it up to date whenever the user shows a shop or pack: items, cost, limit, %, date seen, and Buy / Skip advice.
- Screenshots may arrive in `shops/inbox/` — read them, update `SHOP_DB`, then delete them (keep the README).
- Rules: only packs at 3,000%+; rank by blockers (Mythic Gear, Gilded Threads, Charm Designs); heroes to 4★; monthly budget A$100, resets on the 1st.
- Hall of Heroes sells every season except the newest. Seasons: S7 Ava, Wee & Woo, Charles · S6 Triton, Sophia, Yang · S5 Long Fei, Thrud, Vivian · S4 Margot, Rosa, Alcar · S3 Eric, Petra, Jaeger · S2 Zoe, Hilde, Marlin · S1 Helga, Jabel, Amadeus, Saul.
- Only use confirmed numbers; mark guesses.

## Releasing code changes
- Run `node scripts/bump.mjs` before committing any change to js/, css/ or index.html. It bumps the cache name in sw.js and the `?v=` on every file in index.html, so devices load the new files straight away.
