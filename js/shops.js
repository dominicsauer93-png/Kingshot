"use strict";
/* =====================================================================
   SHOP GUIDE — every shop, event shop and pack you've shown me, with what to buy.
   Reference data (not your progress), so it lives in code, not console-data.json.
   seen = date of the screenshot it came from. Add new shops by dropping screenshots in shops/inbox.
   ===================================================================== */
const SHOP_RULES=[
  "Only buy packs at 3,000% or more — then rank by what they give for your blockers, not the %.",
  "Blockers right now: Mythic Gear (hero gear), Gilded Threads (governor gear), Charm Designs.",
  "Shards: every hero to 4★ is the goal. 5★ costs 600 per hero — only Ava / Wee & Woo / Yang later.",
  "Hall of Heroes sells every season except the newest — S7 (Ava, Wee & Woo, Charles) unlocks when Gen 8 arrives (~7 Dec 2026).",
  "From ~1 Mar 2027 (predicted, Gen 9): Gen 7 heroes join the gold key loot pool — free S7 shards, so don't spend on Charles.",
  "Monthly budget A$100 — resets on the 1st."
];
// seasons, for the Hall of Heroes chests
const HERO_SEASON={S1:"Helga, Jabel, Amadeus, Saul (shards: Jabel, Saul only)",S2:"Zoe, Hilde, Marlin",S3:"Eric, Petra, Jaeger",S4:"Margot, Rosa, Alcar",S5:"Long Fei, Thrud, Vivian",S6:"Triton, Sophia, Yang",S7:"Ava, Wee & Woo, Charles"};
// what the mystery items are
const ITEM_KEY=[
  ["Gold chest (spool, scroll, cloth)","Governor gear materials — random: Satin, Gilded Threads or Artisan's Vision"],
  ["Grey “?” chest (armour)","Lucky Hero Gear Chest — random hero gear item, small chance of Mythic Gear"],
  ["Red Custom Mythic chest","1 Mythic Gear of your choice"],
  ["Orange puzzle piece","General Mythic shard — any Mythic hero except Amadeus and Helga"],
  ["Purple puzzle piece","Epic general shard — not for your Mythic heroes"],
  ["Blue crystal","Mithril"],["Red / gold bottle","Elite Spices (master affinity)"],
  ["Grey claw stone","Common taming mark"],["Lion badge","Pet promotion medallion"]
];
const SHOP_DB=[
  {n:"Hall of Heroes",cur:"Marks of Valor",when:"During Hall of Heroes",seen:"2026-10-26",
   best:["10K Enhancement XP × 10 — 1 Mark each","Triton shards (S6 silver, 9) until 4★","Amadeus widgets (S1 blue, 10) — 16 to widget Lv 7, Bear rallies","Yang widgets (S6 blue, 18) — 34 to Lv 10","From mid-Nov: save Marks — S7 (Ava, Wee & Woo widgets) unlocks with Gen 8 on ~7 Dec"],
   skip:["Ava shards (10) — Ava is already 4★","General shards (12) when a season chest has your hero cheaper"],
   items:[["Ava shard",10,370],["General Mythic shard",12,100],["S6 shard chest",9,500],["S6 widget chest",18,300],["S5 shard chest",8,500],["S5 widget chest",16,300],["S4 shard chest",7,500],["S4 widget chest",14,300],["S3 shard chest",6,500],["S3 widget chest",12,300],["S2 shard chest",5,500],["S2 widget chest",10,300],["S1 shard chest",5,550],["S1 widget chest",10,300],["Epic shard (purple)",3,550],["10K Enhancement XP",1,10]],
   note:"Each chest gives 1 shard or 1 widget of your choice from that season (see Seasons below)."},
  {n:"Arena Shop",cur:"Arena coins",when:"Refreshes weekly",seen:"2026-10-26",
   best:["Custom Mythic Hero Gear chest (12,000) — every week, your #1 blocker","Lucky Hero Gear chest × 2 (3,750) — chance of Mythic","General Mythic shards (2,500) → Ava with what's left"],
   skip:["Mithril — 10,000 for 1 (only if Mithril becomes the blocker)","Forgehammers — 1,625–2,500 for 1","Skill books, pet items, Epic / Rare shards"],
   items:[["Pet medallion (−35%)",1560,1],["Forgehammer (−35%)",1625,1],["Custom Mythic Hero Gear chest",12000,1],["Lucky Hero Gear chest",3750,2],["Forgehammer",2500,5],["Hero shard (featured hero)",2000,5],["General Mythic shard",2500,3],["Mithril",10000,3],["Growth manual",240,30],["Nutrient potion",1200,5],["Pet medallion",2400,2],["Advanced taming mark?",4800,1],["Epic general shard",500,5],["Rare general shard",250,10],["Mythic Conquest / Expedition book",1000,10],["Epic Conquest / Expedition book",500,10],["Rare Conquest / Expedition book",150,10],["5K Enhancement XP",150,200]]},
  {n:"Trial Shop",cur:"Trial crystals",when:"Refreshes weekly",seen:"2026-10-26",
   best:["Mithril × 1 (2,500) — cheapest Mithril anywhere","Lucky Hero Gear chests (250, 20) — chance of Mythic, 15× cheaper than Arena","General Mythic shards (500, 10) — cheapest shards anywhere → Ava","Charm Designs (250, 40) — cheapest Designs"],
   skip:["Speedups, Guides unless Designs are covered"],
   items:[["Mithril",2500,1],["General Mythic shard",500,10],["100 Enhancement XP",50,30],["Lucky Hero Gear chest",250,20],["Orange puzzle with a house (?)",1000,10],["Charm Design",250,40],["Charm Guide",250,40],["Truegold Dust",50,400],["Gov gear gold chest (random)",500,20],["1 h speedup",300,200]],
   note:"Best shop overall — check it every week."},
  {n:"Swordland Shop",cur:"Swordland coins",when:"Refreshes every 14 days",seen:"2026-10-26",
   best:["Gilded Threads × 50 (100 each) — your gov gear blocker","Charles shards (2,500, 6) — a second Charles source","Satin (1 each) with spare coins"],
   skip:["General shards (Trial is 500)","Hammers, speedups, XP, Guides, Vision"],
   items:[["Hero shard — Charles",2500,6],["Hero shard — Ava?",2500,6],["Hero shard — helmet hero (?)",2500,6],["General Mythic shard",2500,6],["100 Enhancement XP",250,40],["Forgehammer",1250,20],["Satin",1,5000],["Gilded Threads",100,50],["Artisan's Vision",500,30],["Charm Design",500,50],["Charm Guide",500,25],["1 h speedups (4 kinds)",250,50],["5K Enhancement XP",75,200]]},
  {n:"Tidal Shop",cur:"Tidal coins (from Tri-Alliance Clash)",when:"Refreshes every 14 days",seen:"2026-10-26",
   best:["Gilded Threads × 25 (100 each)","Satin (1 each)"],
   skip:["General shards (Trial is 500)","Designs (Trial is 250)","Hammers, speedups, pet items"],
   items:[["Advanced taming mark?",3000,2],["Growth manual",150,30],["Nutrient potion",750,5],["Pet medallion",1500,2],["General Mythic shard",2500,3],["100 Enhancement XP",250,20],["Forgehammer",1250,10],["Satin",1,2500],["Gilded Threads",100,25],["Artisan's Vision",500,15],["Charm Design",500,20],["Charm Guide",500,10],["1 h speedups (4 kinds)",250,20]]},
  {n:"Alliance Championship Shop",cur:"Championship coins",when:"Refreshes weekly",seen:"2026-10-26",
   best:["Gilded Threads × 100 (100 each) — the biggest Threads limit","Gov gear gold chest (1,000, 1)","Satin (1 each)"],
   skip:["General shards (Trial is 500)","Hero shards unless it's a hero you use","Speedups, pet items, books"],
   items:[["Gov gear gold chest (featured)",1000,1],["Master emblem? (blue book, featured)",15,250],["Gilded Threads",100,100],["Satin",1,10000],["Hero shard (pirate hero)",2000,10],["Blue crystal (?)",1500,15],["Master emblem? (blue book)",15,1000],["Artisan's Vision",500,5],["Growth manual",150,30],["Pet medallion",1500,2],["1 h speedup",400,5],["Advanced taming mark?",3000,1],["Mythic Expedition book",500,10],["General Mythic shard",2500,2]],
   note:"Threads every week: AC 100 + Swordland 50 + Tidal 25 (every 2 weeks)."},
  {n:"KvK Shop (Kingdom of Power)",cur:"KvK gold medals (+ silver for Exclusive items)",when:"Refreshes weekly",seen:"2026-10-26",
   best:["Truegold (2 each, 10) — very cheap, buy all","Charm Designs / Guides (6 each)","Mythic Conquest + Expedition books (6 each, 50) only with spare medals"],
   skip:["7-day decorations (city skin, frame) unless you like them","5 min speedups"],
   items:[["Exclusive (silver): 7-day frame",30,1],["Exclusive (silver): Truegold",2,50],["Exclusive (silver): General shard",25,3],["7-day city skin",150,1],["5 min troop speedup",2,100],["7-day nameplate",30,1],["Truegold",2,10],["Artisan's Vision",6,5],["Charm Design",6,"sold out"],["Charm Guide",6,5],["Mythic Expedition book",6,50],["Mythic Conquest book",6,50],["1 h speedup",5,3]],
   note:"Exclusive (silver) items need silver KvK medals — Truegold 50 at 2 each is the best deal in the shop."},
  {n:"Alliance Shop — daily",cur:"Alliance coins (you had 882,902)",when:"Refreshes daily · Wilson gives −10%",seen:"2026-10-27",
   best:["Epic hero shards when on sale (−10% or better) — check if it's a hero you use","10 × 100 V-tokens (330, −50%)","1 h speedups at −50% (13,000)"],
   skip:["Relocation / teleport items unless you're moving","Building skins","5 min speedups"],
   items:[["1 h learning speedup (−10%)",23400,1],["Building skin? (−50%)",20000,1],["10 × 100 V-tokens (−50%)",330,5],["Alliance teleport (−50%)",33330,1],["Random teleport (−50%)",16500,1],["5 min learning speedup (−10%)",1980,4],["1 h building speedup (−50%)",13000,1],["Epic hero shard (−10%)",29700,2],["Alliance teleport (−80%)",13330,1],["Advanced teleport (−50%)",65000,1],["Alliance teleport (−10%)",60300,1],["5 min troop speedup (−10%)",1980,4]],
   note:"Items and discounts change every day — only buy at −50% or more, and only things you'd use. Never shields."},
  {n:"Alliance Shop — weekly",cur:"Alliance coins",when:"Refreshes weekly · Wilson gives −10%",seen:"2026-10-27",
   best:["Pet food ×1,000 bags (13,330, −80%, 15) — cheap pet food","Pet chest (20,000, −80%, 10) — mixed pet items","Epic hero shards (6,600, −80%, 2) if you use the hero","10 × 100 V-tokens (330, −50%, 5)"],
   skip:["Building skin, name tag, troop reassignment unless needed","100,000 scroll unless you know what it is"],
   items:[["1,000 pet food (−80%)",13330,15],["Pet chest (−80%)",20000,10],["Scroll (?) (−80%)",100000,1],["Epic hero shard (−80%)",6600,2],["Building skin? (−50%)",6500,1],["Name change tag (−50%)",6500,1],["10 × 100 V-tokens (−50%)",330,5],["Troop transfer? (−80%)",5200,1]],
   note:"With 880K+ alliance coins, buy the −80% pet items every week. Never shields."},
  {n:"Fishing Tournament",cur:"Fishing Tokens / Points",when:"~3 days (ends ~29 Oct; Sunken Treasure Hunt ~30 Oct)",seen:"2026-10-27",
   best:["Dreamweaver's Tide collection (108/150) → Squads' Attack +2% PERMANENT — top priority","Never let bait sit at 10 (refills 1 every 3 h) — fish ~3 times a day","Use Treasure Charts on Ocean Prospector — better fish and Ocean Chests","Daily Drill: 1,500 + 2,000 points · Season missions: 10K–50K points for chests","Spend all Fishing Tokens on Sunken Treasure Hunt before it ends (1% 5 General shards, 3% hammer, 13% Mythic manual)"],
   skip:["Fishing Pro Set (A$1.49, 2,600%) — under 3,000%","Fishing Pro / Master passes unless budget allows — event ends before 1 Nov"],
   items:[["Fishing Pro pass — +10% tokens/points, 50 Truegold, 5 hammers, 2 General shards, keys, charts","A$7.99","3,000%"],["Fishing Master pass — +20% tokens/points, 75 Truegold, promotion items, charts","A$14.99","4,000%"],["Fishing Pro Set — 500 gems, chart, shell, items","A$1.49","2,600%"],["Sunken Treasure Hunt — 1 hunt",1500,"tokens"],["Sunken Treasure Hunt — 10 hunts",15000,"tokens"]],
   note:"Bait: start 5, +1 every 3 h, max 10. Power Cast multiplies points but uses that many baits. Vouchers add +0.5× each. Every 10 unused tokens → 10K resources at the end. Unused special items carry to the next session."},
  {n:"Halloween Party",cur:"Halloween Candy",when:"7 days (27 Oct – 2 Nov 2026)",seen:"2026-10-27",
   best:["Daily: reach 300 Prankster Points → 2 General Mythic shards, 3 Forgehammers, 3 h speedup (every day!)","Candy Party Pack I is free — claim it (100 candy, 2 gold keys)","Spend candy in Coven Clash (20 per attack) — Witch hits drop Lucky Hero Gear chests (Mythic chance)","Audacious Adventure free track to level 21: General shards, Truegold, keys, chests","Surprising Symphony missions — finish them all for 20 wands, 70 Truegold, 2 General shards","Prankster King: do each day's stage (1 day each) — Power Boost, Beast Slay, Hero, Training, Hero Gear, Gather, Gov Gear"],
   skip:["Candy Party Pack II (A$7.99, 4,400%) only if you'd use the candy — 1,000 candy + 70 Truegold + 2,500 gems","Top-up Benefits — only counts spending you'd do anyway","Masquerade wands — cosmetic town skins"],
   items:[["Candy Party Pack I — 100 candy, 2 gold keys, resources","Free",""],["Candy Party Pack II — 2,500 gems, 1,000 candy, 18 custom chests, 70 Truegold, avatar frame","A$7.99","4,400%"],["Witchbane pass (Audacious Adventure, middle track)","paid",""],["Pranksterbane pass (Audacious Adventure, top track)","paid",""]],
   note:"Unused candy turns into resource chests at the end. Coven Clash: 0.2% Prankster Time per attack (free attacks); Witch appears 20% of the time. Mission rewards are only resources."},
  {n:"Alliance Mobilization",cur:"Alliance Points (no shop)",when:"Every 2 weeks · rewards tallied Sunday 00:00 UTC",seen:"2026-10-30",
   best:["Do your exclusive missions every day — the first one each day gives 200% Alliance Points","Custom Mission Voucher: pick a double-points mission (first each day); later voucher missions give 120%","Refresh exclusive missions you haven't accepted yet — don't abandon accepted ones (uses the attempt)","Stay in the alliance until the tally — leaving loses alliance rewards"],
   skip:["Victorious Mobilization Pack unless you want Artisan's Vision — no shards"],
   items:[["Mobilization Booster Pack — 4 vouchers, 1K gems, 4 General Mythic shards, 20 Truegold, 10 resource chests, 10 × 100 VIP?, 1 chest · 1 a day","A$2.99","4,000%"],["Victorious Mobilization Pack — 4 vouchers, 1K gems, 24 Artisan's Vision, 20 Truegold, 10 resource chests, 10 × 100 VIP?, 1 chest · 1 a day","A$2.99","4,000%"]],
   note:"No coin shop — points come from alliance members' missions. Leagues: Rookie → Junior → Senior → Elite → Legendary; top 3 (milestone level 8) move up, bottom 3 drop. Needs TC 10 and an alliance of 15+."},
  {n:"Champagne Fair",cur:"Vouchers",when:"Event, 2 days",seen:"2026-10-26",
   best:["S7 widget chest × 10 — bought 26 Oct (Ava needs 6, Wee & Woo 15)","S6 widget chest × 10 → Yang (850 each, he needs 34 for widget Lv 10)","Charm Designs × 10 (350)","Charm Guides × 10 (350)","Forgehammer × 1 with what's left (500)"],
   skip:["Mithril — 20,000 for 1","Skill books, pet items, gold, resource chests"],
   items:[["S7 widget chest (Ava / W&W / Charles)",1000,10],["S6 widget chest (Triton / Sophia / Yang)",850,10],["S5 widget chest (Long Fei / Thrud / Vivian)",700,10],["Mithril",20000,3],["Forgehammer",500,10],["Pet medallion",1000,5],["Advanced taming mark?",2000,2],["General Mythic shard",1000,10],["Artisan's Vision",350,10],["Charm Design",350,10],["Charm Guide",350,10],["Mythic Conquest skill book",200,100],["Mythic Expedition skill manual",200,100],["Nutrient potion",500,10],["Growth manual",100,50],["Pet food ×10",60,10],["100 Enhancement XP",100,20],["1,000 gold",200,150],["Resource chest",10,99999]]},
  {n:"Dragon's Caravan",cur:"Dragon Essence",when:"With the Dragon Essence event (7 days)",seen:"2026-10-19",
   best:["Focus-hero shards (20 each)","32 Charm Designs (80)","20 Truegold (40)","28 Forgehammers (200)"],
   skip:["Leftover essence is lost when it ends — spend it all"],
   items:[["28 Forgehammers",200,40],["Mithril",160,25],["100 thread spools",40,100],["20 Truegold",40,50],["Hero shard (3 heroes)",20,1075],["32 Charm Designs or Guides",80,100],["28 Lucky chests",200,100],["8–9 × 1 h speedups",40,100]],
   note:"Essence: Value Pack A$7.99 = 300 (1 a day) is the best per dollar."},
  {n:"Weekly Benefits Card — Mythic",cur:"A$14.99 each",when:"Weekly (7 days), up to 5 cards",seen:"2026-10-26",
   best:["Governor Charm — 150 Designs + 150 Guides (best Designs per A$: 10)"],
   skip:["Governor Gear — its 90 gold chests are random, Threads not guaranteed","Hero Gear — hammers aren't the blocker","Pet, Building"],
   items:[["Pet — 22.5K food, 40 chests (+5K food)","A$14.99","4,100%"],["Governor Charm — 150 Designs, 150 Guides (+6 chests)","A$14.99","6,500%"],["Governor Gear — 90 gold chests, 100 Vision (+4, 10, 2)","A$14.99","7,500%"],["Hero Gear — 90 hammers, 120 Lucky chests (+3, 4)","A$14.99","7,500%"],["Building — 200 × 1 h, 100K gold (+7 × 1 h)","A$14.99","3,500%"]],
   note:"Every card also gives 5,000 gems, 40 × 100 V-tokens and 63 chests."},
  {n:"Weekly Benefits Card — Epic",cur:"A$7.99",when:"Weekly (7 days), choose one",seen:"2026-10-19",
   best:["Charm — 60 Designs + 60 Guides (Mythic tier is better value)"],skip:["Pet, Building"],
   items:[["Pet — 9,000 food, 16 chests (+5,000)","A$7.99",""],["Charm — 60 Designs + 60 Guides (+6 chests)","A$7.99",""],["Gov Gear — 35 chests + 40 scrolls","A$7.99",""],["Hero Gear — 36 hammers + 9,000 XP (+3, 4)","A$7.99","7,000%"],["Building — 80 × 1 h + 40K gold","A$7.99",""]],
   note:"Every card also gives 2,500 gems, 25 × 100 V-tokens and 25 chests."},
  {n:"Exclusive Gear Packs (widgets)",cur:"A$",when:"With the Exclusive Gear Fund",seen:"2026-10-26",
   best:["Mortar (Wee & Woo) — 15 widgets = widget Lv 2 → 3","Chameleos (Ava) — 15 widgets = Lv 5 → 6 + 9 toward 7"],
   skip:["Justice Fist (Charles) — free-shards-only hero","Higher tiers (A$14.99 +) unless you really need more"],
   items:[["Justice Fist — Charles, 15 widgets","A$7.99","3,000%"],["Chameleos — Ava, 15 widgets","A$7.99","3,000%"],["Mortar — Wee & Woo, 15 widgets","A$7.99","3,000%"]],
   note:"Only paid source of S7 widgets until S8. After each A$7.99 pack the next tier is A$14.99, then 30.99 … (contents not confirmed)."},
  {n:"Exclusive Gear Fund",cur:"Fund points",when:"~14 days",seen:"2026-10-26",
   best:["Reach level 14 — paid track already bought","Levels 7–14: 154K gems, 204 hammers, 228 Lucky Hero Gear chests, 504 gov gear chests"],skip:[],
   items:[],note:"Lucky chests are your best free Mythic Gear chance — tell me how many Mythic you get."},
  {n:"Truegold Myth",cur:"A$14.99",when:"7 days",seen:"2026-10-26",
   best:["Best Truegold Dust per A$ seen (~29) — only if T11 is the push"],skip:["Doesn't help Mythic, Threads or Designs"],
   items:[["5,000 gems, 350 dust, 30K gold, 160 chests + daily track (30 dust, 20K gold, 50 dust, 30K gold)","A$14.99","4,900%"]]},
  {n:"Sails Aloft (Voyage)",cur:"A$",when:"Wavebound Voyage",seen:"2026-10-21",
   best:["Common is the best hours per A$ (12.5)"],skip:["Only worth it to reach the 120 milestone (180 Designs)"],
   items:[["Common — 100 × 1 h voyage speedups, 2,500 gems","A$7.99","3,600%"],["Uncommon — 180 × 1 h, 5,000 gems","A$14.99","3,300%"],["Rare — 320 × 1 h, 10K gems","A$30.99","3,100%"]]},
  {n:"Dragon Value Pack",cur:"A$7.99",when:"Dragon Essence event, 1 a day",seen:"2026-10-19",
   best:["300 essence + 2,500 gems — best essence per A$"],skip:["Bigger Dragon packs (~25 essence per A$)"],items:[["Value — 300 essence, 2,500 gems","A$7.99","3,630%"]]},
  {n:"Path of Honor (Hero Rally paid track)",cur:"A$14.99",when:"Hero Rally (~14 days), 31 levels × 90 points",seen:"2026-10-26",
   best:["Pick 40 General Mythic shards (not Charles) — they go to Ava","4,800 gems + 140 Truegold + 12 keys make it good value overall — November maybe"],
   skip:["Not worth it just for Charles","Free track has no shards — resources, XP, Epic books"],
   items:[["Choose: 40 General Mythic shards OR 40 Charles shards","A$14.99","3,343%"],["4,800 gems · 140 Truegold · 12 + 12 Mythic skill books · 16 × 3 h speedups · 12 keys · 30 × 10 stamina","",""]]},
  {n:"Lucky Chip Pack (Hero Roulette)",cur:"US$",when:"Hero Roulette",seen:"2026-10-20",
   best:[],skip:["All under 3,000% — use gems (1,500 per token, Spin 10 = 9 tokens)"],items:[["Common — 5 tokens","US$1.99","2,540%"],["Uncommon — 10","US$4.99","2,180%"],["Rare — 20","US$9.99","2,140%"],["Epic — 40","US$19.99","2,120%"]]}
];
const SHOP_MISSING=[];
// events that have (or may have) their own shop / exchange. shop = the SHOP_DB entry once it's saved.
const EVENT_SHOPS=[
  [/kvk|kingdom of power/i,"KvK Shop (Kingdom of Power)"],[/hall of heroes/i,"Hall of Heroes"],[/champagne/i,"Champagne Fair"],
  [/dragon essence|dragon'?s caravan/i,"Dragon's Caravan"],[/hero rally/i,"Path of Honor (Hero Rally paid track)"],[/swordland/i,"Swordland Shop"],
  [/alliance championship$/i,"Alliance Championship Shop"],[/exclusive gear fund/i,"Exclusive Gear Fund"],[/hero roulette/i,"Lucky Chip Pack (Hero Roulette)"],
  [/wavebound voyage/i,"Sails Aloft (Voyage)"],
  [/officer project/i,"Officer Project"],[/fishing/i,"Fishing Tournament"],[/sanctuary/i,"Sanctuary Battle"],[/tri-alliance/i,"Tidal Shop"],
  [/alliance mobilization/i,"Alliance Mobilization"],[/armament/i,"Armament Competition"],[/strongest governor/i,"Strongest Governor"],
  [/merchant empire/i,"Merchant Empire"],[/alliance brawl/i,"Alliance Brawl"],[/golden glaives/i,"Golden Glaives"],[/flamedragon|dragon banquet/i,"Flamedragon Tyrant"],
  [/halloween/i,"Halloween Party"],[/mystic trial/i,"Mystic Trials"],[/finder'?s fortune/i,"Finder's Fortune"]];
const evShopSaved=name=>SHOP_DB.some(x=>x.n===name);
const STALE_DAYS=45; // shop / deal data older than this gets a "check" marker
const staleDays=d=>d?Math.round((new Date(gameToday())-new Date(d))/864e5):0;
function staleShops(){ return SG_REGULAR.map(([n])=>SHOP_DB.find(s=>s.n===n)).filter(s=>s&&staleDays(s.seen)>STALE_DAYS); }
const noShop=n=>(state.noShop||[]).includes(n); // events you've marked as having no shop
function eventShopFor(e){ const m=EVENT_SHOPS.find(([re])=>re.test((e&&e.n)||"")); return m?{name:m[1],saved:evShopSaved(m[1])||noShop(m[1]),none:noShop(m[1])}:null; }
function eventShopProgress(){ const all=[...new Set(EVENT_SHOPS.map(x=>x[1]))]; return {saved:all.filter(n=>evShopSaved(n)||noShop(n)).length,none:all.filter(noShop).length,total:all.length,missing:all.filter(n=>!evShopSaved(n)&&!noShop(n))}; }

// the page: a simple shopping list first (one tile per shop, what to buy right now), details tucked below
const SG_REGULAR=[["Trial Shop","Weekly"],["Arena Shop","Weekly"],["Alliance Championship Shop","Weekly"],["KvK Shop (Kingdom of Power)","Weekly"],["Swordland Shop","Every 2 weeks"],["Tidal Shop","Every 2 weeks"],["Alliance Shop — weekly","Weekly"],["Alliance Shop — daily","Daily"]];
const SG_EVENT=["Halloween Party","Alliance Mobilization","Fishing Tournament","Hall of Heroes","Champagne Fair","Dragon's Caravan","Exclusive Gear Fund"];
const sgShort=n=>n.replace(/ \(.*\)$/,"").replace(/ Shop$/,"").replace(/^Alliance Shop — /,"Alliance ").replace(/^Alliance Championship$/,"Alliance Champ.");
function renderShopGuide(){
  const host=$("#shopGuide"); if(!host) return;
  // (budget notes live on Packs)
  const N=blockerNeeds(), idx=n=>SHOP_DB.findIndex(s=>s.n===n);
  const fdS=s=>s?new Date(s+"T00:00:00").toLocaleDateString(undefined,{day:"numeric",month:"short"}):"";
  const tile=([n,when])=>{ const s=SHOP_DB[idx(n)]; if(!s) return ""; const b=liveBuys(s,N).need, seen=new Set(), top=b.filter(x=>!seen.has(x.k)&&seen.add(x.k)).slice(0,2);
    const old=staleDays(s.seen)>STALE_DAYS;
    return `<button class="sgtile" data-i="${idx(n)}"><span class="sgt-h"><b>${esc(sgShort(n))}</b><small>${old?`<span class="warn">seen ${staleDays(s.seen)}d ago</span>`:esc(when)}</small></span>`+
      (top.length?top.map(x=>`<span class="sgt-buy">${esc(x.it[0].replace(/ \(.*\)/,""))}<em>${fmt(x.it[1])}</em></span>`).join(""):'<span class="sgt-none">Nothing you need ✓</span>')+`</button>`; };
  const shopBody=i=>{ const s=SHOP_DB[i]; return liveBuysH(s,N)+(s.best.length?`<div class="sgbest"><b>Usually buy</b><ol>${s.best.map(x=>`<li>${esc(x)}</li>`).join("")}</ol></div>`:"")+
      (s.skip.length?`<div class="sgskip"><b>Skip</b><ul>${s.skip.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>`:"")+
      (s.items.length?`<details class="fold mt"><summary><span class="grow">Everything it sells</span><small class="faint">seen ${fdS(s.seen)}</small></summary><div class="fbody" style="padding:0"><table class="gtable"><thead><tr><th>Item</th><th>Cost</th><th>${typeof s.items[0][2]==="number"?"Limit":"%"}</th></tr></thead><tbody>${s.items.map(([a,b,c])=>`<tr><td>${esc(a)}</td><td class="mono">${typeof b==="number"?fmt(b):esc(b)}</td><td class="mono">${typeof c==="number"?fmt(c):esc(c)}</td></tr>`).join("")}</tbody></table></div></details>`:"")+
      (s.note?`<p class="muted" style="margin:8px 0 0">${esc(s.note)}</p>`:""); };
  const fold=i=>{ const s=SHOP_DB[i]; return `<details class="fold sgshop"><summary><span class="grow">${esc(s.n)}</span><small class="faint">${esc(s.cur)}</small></summary><div class="fbody">${shopBody(i)}</div></details>`; };
  const regIdx=SG_REGULAR.map(([n])=>idx(n)).filter(i=>i>=0), evIdx=SG_EVENT.map(idx).filter(i=>i>=0), packIdx=SHOP_DB.map((_,i)=>i).filter(i=>!regIdx.includes(i)&&!evIdx.includes(i));
  const ep=eventShopProgress();
  const liveEv=liveEvents().map(x=>eventShopFor(x.e)).filter(x=>x&&x.saved&&idx(x.name)>=0&&!SG_REGULAR.some(r=>r[0]===x.name)&&SHOP_DB[idx(x.name)].items.some(it=>typeof it[1]==="number")).map(x=>[x.name,"On now"]).filter((x,i,a)=>a.findIndex(y=>y[0]===x[0])===i);
  const blk=["mg","threads","designs","mith","gen"].filter(k=>N[k]&&N[k].short).map(k=>`${RES_LABEL[k]} <b>${fmt(N[k].short)}</b> short`);
  // the page is just what to buy; everything else opens in a panel
  host.innerHTML=`<div class="card sghead"><b style="font-size:16px">Buy now</b>${blk.length?`<p class="sgblk">Short of: ${blk.join(" · ")}</p>`:""}</div>`+
    `<div class="sgtiles">${liveEv.map(tile).join("")}${SG_REGULAR.map(tile).join("")}</div>`+
    `<div class="dlinks"><button class="link" id="sgAll">All shops &amp; packs ›</button><button class="link" id="sgSrc">Where supplies come from ›</button>${ep.missing.length?`<button class="link" id="sgCam">📸 ${ep.missing.length} shops to capture ›</button>`:""}</div>`;
  on("sgCam",()=>openCamSheet(true));
  host.querySelectorAll(".sgtile").forEach(t=>t.onclick=()=>{ const i=+t.dataset.i, sh=SHOP_DB[i]; openSheet({title:sh.n,sub:`${sh.cur}${sh.when?" · "+sh.when:""}`,build(f){ f.innerHTML=shopBody(i); }}); });
  on("sgAll",()=>openSheet({title:"All shops & packs",sub:"Tap one to see what it sells.",build(f){
    f.innerHTML=`<h3 class="sgsec">Shops</h3><div class="card dcard sggrp">${regIdx.map(fold).join("")}</div><h3 class="sgsec">Event shops</h3><div class="card dcard sggrp">${evIdx.map(fold).join("")}</div><h3 class="sgsec">Packs</h3><div class="card dcard sggrp">${packIdx.map(fold).join("")}</div>
      <h3 class="sgsec">Reference</h3><div class="card dcard sggrp"><details class="fold"><summary><span class="grow">How I pick</span></summary><div class="fbody"><ul class="sgrules">${SHOP_RULES.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div></details>
      <details class="fold"><summary><span class="grow">Hero seasons</span></summary><div class="fbody"><table class="gtable"><tbody>${Object.entries(HERO_SEASON).map(([k,v])=>`<tr><td class="mono">${k}</td><td>${esc(v)}</td></tr>`).join("")}</tbody></table></div></details>
      <details class="fold"><summary><span class="grow">What the icons are</span></summary><div class="fbody"><table class="gtable"><tbody>${ITEM_KEY.map(([k,v])=>`<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join("")}</tbody></table></div></details></div>
      <p class="faint mt" style="font-size:13.5px">New shop or pack? Upload a screenshot with 📸, or to shops/inbox in the repo.</p>`; }}));
  on("sgSrc",()=>openSheet({title:"Where supplies come from",sub:"Free sources and buy order.",build(f){ const src=$("#srcFold .fbody"); f.innerHTML=src?src.innerHTML:""; }}));
}
