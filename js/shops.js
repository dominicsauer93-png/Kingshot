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
const SHOP_MISSING=["Arena Shop (Mythic Gear)","Trial Shop (Mithril, Truegold Dust)","Alliance Shop","Swordland Shop","Tidal Shop","Alliance Championship Shop","KvK / Kingdom of Power shop"];

function renderShopGuide(){
  const host=$("#shopGuide"); if(!host) return;
  const mo=state.packMonths||{}, cur=gameToday().slice(0,7), last=Object.keys(mo).sort().pop();
  const fdS=s=>s?new Date(s+"T00:00:00").toLocaleDateString(undefined,{day:"numeric",month:"short"}):"";
  host.innerHTML=`<div class="info"><b>How I pick</b><ul class="sgrules">${SHOP_RULES.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`+
      (last&&mo[last].closed?`<span class="faint">${new Date(last+"-01T00:00:00").toLocaleDateString(undefined,{month:"long"})} closed — A$${num(mo[last].spent).toFixed(2)} spent${mo[last].note?` (${esc(mo[last].note)})`:""}. ${last<cur?"New month — budget is fresh.":"Budget resets on the 1st."}</span>`:"")+`</div>`+
    SHOP_DB.map((s,i)=>`<details class="fold mt sgshop"${state.ui.sgOpen===i?" open":""} data-i="${i}"><summary><span class="grow">${esc(s.n)} <small class="faint" style="font-weight:500">${esc(s.cur)} · ${esc(s.when)}</small></span><small class="faint">seen ${fdS(s.seen)}</small></summary><div class="fbody">`+
      (s.best.length?`<div class="sgbest"><b>Buy</b><ol>${s.best.map(x=>`<li>${esc(x)}</li>`).join("")}</ol></div>`:"")+
      (s.skip.length?`<div class="sgskip"><b>Skip</b><ul>${s.skip.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>`:"")+
      (s.items.length?`<div class="card mt" style="padding:0;overflow:hidden"><table class="gtable"><thead><tr><th>Item</th><th>Cost</th><th>${typeof s.items[0][2]==="number"?"Limit":"%"}</th></tr></thead><tbody>${s.items.map(([a,b,c])=>`<tr><td>${esc(a)}</td><td class="mono">${typeof b==="number"?fmt(b):esc(b)}</td><td class="mono">${typeof c==="number"?fmt(c):esc(c)}</td></tr>`).join("")}</tbody></table></div>`:"")+
      (s.note?`<p class="muted" style="margin:8px 0 0">${esc(s.note)}</p>`:"")+`</div></details>`).join("")+
    `<details class="fold mt"><summary><span class="grow">Hero seasons <small class="faint" style="font-weight:500">for Hall of Heroes chests</small></span></summary><div class="fbody"><table class="gtable"><tbody>${Object.entries(HERO_SEASON).map(([k,v])=>`<tr><td class="mono">${k}</td><td>${esc(v)}</td></tr>`).join("")}</tbody></table></div></details>`+
    `<details class="fold mt"><summary><span class="grow">What the icons are</span></summary><div class="fbody"><table class="gtable"><tbody>${ITEM_KEY.map(([k,v])=>`<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join("")}</tbody></table></div></details>`+
    `<div class="info mt"><b>Still to add:</b> ${SHOP_MISSING.map(esc).join(" · ")}<br><span class="faint">Upload screenshots to the <b>shops/inbox</b> folder in the Kingshot repo (GitHub app → Add file → Upload files), then tell Claude “uploaded”.</span></div>`;
  host.querySelectorAll("details.sgshop").forEach(d=>d.ontoggle=()=>{ if(d.open) state.ui.sgOpen=+d.dataset.i; else if(state.ui.sgOpen===+d.dataset.i) delete state.ui.sgOpen; scheduleSave(); });
}
