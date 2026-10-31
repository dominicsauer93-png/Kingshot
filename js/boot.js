"use strict";
/* =====================================================================
   RENDER ALL + BOOT
   ===================================================================== */
/* ---------- Update everything (one page) ---------- */
function renderUpdate(){
  const host=$("#qBody"); if(!host||host.contains(document.activeElement)) return; // don't rebuild while typing
  if(!state.ui.qOpen) state.ui.qOpen={Bag:true};
  host.innerHTML="";
  const N=(label,obj,key,o)=>fld(label,Object.assign({type:"num",value:obj[key],get:()=>obj[key],set:v=>obj[key]=v},o||{}));
  const S=(label,val,opts,set)=>fld(label,{type:"select",value:String(val),options:opts,set});
  const grid=(...els)=>{ const g=document.createElement("div"); g.className="qgrid"; els.flat(3).forEach(e=>g.appendChild(e)); return g; };
  const sub=t=>{ const h=document.createElement("div"); h.className="qsub"; h.textContent=t; return h; };
  const groups=[];
  const group=(key,title,hint,build)=>{ groups.push([key,title]); const d=document.createElement("details"); d.className="fold"; d.dataset.k=key; if(state.ui.qOpen[key]) d.open=true;
    d.innerHTML=`<summary><span class="grow">${title}</span><span class="faint" style="font-weight:500;font-size:14px">${hint||""}</span></summary><div class="fbody form"></div>`;
    const body=d.querySelector(".fbody"); let built=false;
    const fill=()=>{ if(built) return; built=true; build(body); };
    if(d.open) fill(); d.ontoggle=()=>{ state.ui.qOpen[key]=d.open; if(d.open) fill(); scheduleSave(); };
    host.appendChild(d); };
  const H=state.heroGear.have, C=state.charms.have, P=state.pets.have, G=state.govGear.have;
  group("Bag","Materials in your bag","dust, gold, gear, charms, pets",b=>{
    b.append(sub("T11 & buildings"),grid(N("Truegold Dust",state.dust,"current"),N("Gold",state.dust,"gold"),N("Truegold",state.tg,"have"),N("Tempered Truegold",state.tg,"ttgHave")));
    b.append(sub("Hero Gear"),grid(N("Enhancement XP",H,"xp"),N("Forgehammers",H,"fh"),N("Mythic Gear",H,"mg"),N("Mithril",H,"mith")));
    b.append(sub("Charms"),grid(N("Charm Guides",C,"guides"),N("Charm Designs",C,"designs")));
    b.append(sub("Pets"),grid(N("Pet Food",P,"food"),N("Growth Manuals",P,"manuals"),N("Nutrient Potions",P,"potions"),N("Medallions",P,"medals"),N("Common Taming Marks",P,"tmCommon"),N("Advanced Taming Marks",P,"tmAdv")));
    b.append(sub("Governor Gear"),grid(N("Satin",G,"satin"),N("Gilded Threads",G,"threads"),N("Artisan's Vision",G,"vision")));
  });
  group("Widgets","Widgets","level + in hand per hero",b=>{
    state.widgets.rows.forEach(r=>b.append(sub(r.hero||"Hero"),grid(N("Level",r,"lvl",{min:0,max:10}),N("Widgets in hand",r,"have")))); });
  group("HG","Hero Gear","level + mastery per piece",b=>{
    HG_TYPES.forEach(t=>{ const ps=state.heroGear.rows.filter(r=>r.type===t); if(!ps.length) return; b.append(sub(t));
      b.append(grid(ps.map(r=>[N(`${slotName(r.slot)} level`,r,"lvC",{min:0,max:200}),N(`${slotName(r.slot)} mastery`,r,"mC",{min:0,max:20})]))); }); });
  group("Charms","Charms","current level of each charm",b=>{
    const opts=Array.from({length:23},(_,i)=>[String(i),"Lv "+i]);
    ["Infantry","Archer","Cavalry"].forEach(t=>{ const rs=state.charms.rows.filter(r=>r.type===t); if(!rs.length) return; b.append(sub(t));
      b.append(grid(rs.map((r,i)=>S(`Charm ${i+1}`,r.lvl,opts,v=>r.lvl=parseInt(v,10))))); }); });
  group("Pets","Pets","level of each pet",b=>{
    b.append(grid(state.pets.rows.slice().sort((a,c)=>petRank(a)-petRank(c)).map(r=>N(r.n||"Pet",r,"lvl",{min:0})))); });
  group("Gov","Governor Gear","tier of each piece",b=>{
    b.append(grid(state.govGear.pieces.map(p=>S(p.name||"Piece",p.cur,govOpts(),v=>p.cur=parseInt(v,10))))); });
  group("T11","T11 nodes","level of each node",b=>{
    PHASES.forEach(ph=>{ const L=sortTree(state[ph.k],ph.k); b.append(sub(ph.n));
      b.append(grid(L.map(nd=>N(`${nd.name.replace(/^Truegold /,"").replace(/ \(unlock\)/," unlock")} (max ${nd.max||12})`,nd,"cur",{min:0,max:nd.max||12})))); }); });
  group("Masters","Masters","affinity + skill levels",b=>{
    state.masters.slice().sort((a,c)=>mastRank(a)-mastRank(c)).forEach(m=>{ if(!Array.isArray(m.skills)) m.skills=[{l:0},{l:0},{l:0},{l:0}];
      b.append(sub(m.n),grid(fld("Affinity",{type:"num",value:m.l,get:()=>m.l,set:v=>m.l=String(v),min:0,max:100}),
        [0,1,2,3].map(i=>{ const sk=m.skills[i]||(m.skills[i]={l:0}), cap=skillCap(m.n,i); return N(`Skill ${i+1}${cap?` (max ${cap})`:""}`,sk,"l",{min:0,max:cap||99}); }))); }); });
  group("Shards","Gold hero shards","shards in hand",b=>{
    b.append(grid(fld("General Mythic shards",{type:"num",value:state.shardGeneral||0,get:()=>state.shardGeneral||0,set:v=>state.shardGeneral=v})));
    state.goldShards.forEach(r=>b.append(sub(r.n||"Hero"),grid(S("Star tier",hasStars(r)?num(r.pos):"",(hasStars(r)?[]:[["","— not set —"]]).concat(STAR_OPTS),v=>{ r.pos=v===""?null:parseInt(v,10); if(r.tgt==null) r.tgt=SHARD_MAX; }),N("Hero shards",r,"have")))); });
  group("Troops","Troops","current counts",b=>{
    b.append(grid([["inf","Infantry"],["arc","Archer"],["cav","Cavalry"]].map(([k,l])=>N(l,state.troopCounts[k]||(state.troopCounts[k]={cur:0,tgt:0}),"cur")))); });
  group("Buildings","Buildings","current tier",b=>{
    b.append(grid(state.buildings.map(bl=>{ const B=BUILD_TIERS[bl.n]; return B?S(bl.n,bl.stepIdx||0,[["0",B.from]].concat(B.steps.map((st,k)=>[String(k+1),st.to])),v=>bl.stepIdx=parseInt(v,10)):null; }).filter(Boolean))); });
  group("Power","Power & combat","pillars, wins, Lethality, Health",b=>{
    b.append(sub("Power pillars"),grid(state.pillars.map(p=>N(p.name,p,"v"))));
    const c=state.combat;
    b.append(sub("Combat"),grid(N("Attacker wins",c,"attW"),N("Attacker losses",c,"attL"),N("Defender wins",c,"defW"),N("Defender losses",c,"defL"),N("Lethality %",c,"leth",{decimal:true}),N("Health %",c,"hp",{decimal:true})));
    b.append(sub("Account"),grid(fld("Total power",{type:"num",value:state.account.power,get:()=>state.account.power,set:v=>state.account.power=String(v)}),fld("VIP",{value:state.account.vip,set:v=>state.account.vip=v}),fld("Town Center",{value:state.account.tc,set:v=>state.account.tc=v})));
  });
  group("Res","Resources & speedups","speedups in minutes",b=>{
    b.append(grid(state.resources.map(r=>fld(r.n||"Material",{type:"num",value:r.h,get:()=>r.h,allowEmpty:true,set:v=>r.h=v===""?"":String(v)})))); });
  group("Mystic","Mystic Trials","rank per zone",b=>{
    b.append(grid(state.mysticTrials.map(z=>fld(z.k||"Zone",{type:"num",value:z.v,get:()=>z.v,allowEmpty:true,set:v=>{ z.v=v===""?"":String(v); if(v!=="") mysticLogEntry(z); }})))); });
  // jump bar: open one group, fold the rest, scroll to it
  $("#qJump").innerHTML=groups.map(([k,t])=>`<button class="chip" data-k="${esc(k)}">${esc(t)}</button>`).join("");
  $$("#qJump .chip").forEach(c=>c.onclick=()=>{ host.querySelectorAll("details.fold").forEach(d=>{ d.open=d.dataset.k===c.dataset.k; });
    const d=host.querySelector(`details.fold[data-k="${c.dataset.k}"]`); if(d) setTimeout(()=>d.scrollIntoView({behavior:"smooth",block:"start"}),30); });
}
const TAB_RENDER={Home:()=>renderHome(),Upgrade:()=>renderUpgrade(),Heroes:()=>{ renderRally(); renderGear(); },Governor:()=>{ renderRally(); renderGear(); },Town:()=>renderBase(),Progress:()=>renderRally(),Shop:()=>renderPlan(),Data:()=>{ renderPlan(); renderData(); renderUpdate(); }};
const dirtyTabs=new Set();
function renderPrep(){ migrateEvents(); migrateMasterNotes(); if(!state.ui.sub) state.ui.sub={}; }
function renderAll(){ renderPrep(); TABS.forEach(t=>TAB_RENDER[t]()); dirtyTabs.clear(); }
function renderActive(){ // after an edit: redraw only the tab you're looking at; the rest redraw when opened
  renderPrep(); const cur=TABS.includes(state.ui.tab)?state.ui.tab:"Home";
  TAB_RENDER[cur](); TABS.forEach(t=>{ if(t!==cur) dirtyTabs.add(t); else dirtyTabs.delete(t); });
}
/* ---------- quick search (Ctrl K) ---------- */
const SEARCH_KW={
  "Hero Gear":"mithril forgehammer forgehammers red gear imbuement mastery enhancement xp mythic gear chest",
  "Widgets":"exclusive gear widget",
  "Charms":"charm designs guides lethality health",
  "Governor Gear":"gov gear satin gilded threads artisan vision",
  "Gold Hero Shards":"shards stars star tier general mythic",
  "Hero Roles":"tier list kvk bear garrison joiner arena conquest solo use score best heroes hero page troop type",
  "Progress":"history chart trend growth power lethality health win rate over time",
  "Masters":"emblems affinity cassia pan kindred soul",
  "Mystic Trials":"rank zone mithril",
  "Pets":"pet food taming marks growth manuals potions medallions",
  "T11 Unlocks":"truegold dust infantry archer cavalry t11 nodes",
  "Troop Plan":"troops train training",
  "Build Order — TG6→TG8":"buildings town center tg truegold barracks range stable",
  "Resources & Speedups":"bread wood stone iron gold speedups",
  "Shops & Packs":"packs paid budget card monthly weekly aud spend best value per dollar pick plan compare",
  "Shop guide":"free shops trial arena alliance swordland tidal kvk coins shop guide best buy hall of heroes marks champagne vouchers dragon caravan weekly benefits widgets fund seasons",
  "Reminders":"reminders notifications calendar ics ntfy alerts phone",
  "Today":"routine daily checklist",
  "Upcoming Events":"events calendar kvk bear hunt hall of heroes armament",
  "Do next":"next upgrade priorities",
  "Update all":"update everything bag materials form",
  "Combat Quality":"win rate lethality health attacker defender",
  "Power Grades":"power pillars benchmark grade",
  "Data & Sync":"github sync token backup export import",
  "Account":"governor town center vip kingdom day power"};
function searchIndex(){
  const heroes=(state.goldShards||[]).map(r=>r.n).join(" ").toLowerCase();
  return $$(".sec[data-key]").map(sec=>{ const tab=sec.closest(".page").dataset.tab, sub=sec.dataset.sub||"", key=sec.dataset.key;
    const h=sec.querySelector("h2"), head=h?h.childNodes[0].textContent.trim():"";
    const kw=(SEARCH_KW[key]||"")+(/Shards|Hero Roles/.test(key)?" "+heroes:"");
    return {tab,sub,key,title:key,hay:[key,head,sub,tab,kw].join(" ").toLowerCase()}; });
}
let srchSel=0, srchRes=[];
function openSearch(){
  const w=$("#srch"), inp=$("#srchIn"); w.hidden=false; inp.value=""; paintSearch(); setTimeout(()=>inp.focus(),0);
}
function closeSearch(){ $("#srch").hidden=true; }
function paintSearch(){
  const q=$("#srchIn").value.toLowerCase().trim(), words=q.split(/\s+/).filter(Boolean), idx=searchIndex();
  const rx=words.map(w=>new RegExp("(^|[^a-z0-9])"+w.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")));
  const score=x=>x.title.toLowerCase().includes(q)?-1:Math.min(...rx.map(r=>{ const m=x.hay.match(r); return m?m.index:1e9; }));
  srchRes=!words.length?idx:idx.filter(x=>rx.every(r=>r.test(x.hay))).map(x=>({x,s:score(x)})).sort((a,b)=>a.s-b.s).map(o=>o.x);
  srchSel=Math.min(srchSel,Math.max(0,srchRes.length-1)); if(!q) srchSel=0;
  $("#srchList").innerHTML=srchRes.length?srchRes.map((r,i)=>`<li><button role="option" data-i="${i}" aria-selected="${i===srchSel}"><span>${esc(r.title)}</span><span class="where">${esc(r.tab)}${r.sub&&r.sub!==r.title?" › "+esc(r.sub):""}</span></button></li>`).join(""):`<li class="none">Nothing found for “${esc(q)}”</li>`;
  $$("#srchList button").forEach(b=>b.onclick=()=>pickSearch(+b.dataset.i));
}
function pickSearch(i){ const r=srchRes[i]; if(!r) return; closeSearch(); goToSection(null,r.key);
  setTimeout(()=>{ const sec=[...$$(".sec[data-key]")].find(x=>x.dataset.key===r.key); if(sec&&!sec.hidden&&!sec.dataset.sub) sec.scrollIntoView({behavior:"smooth",block:"start"}); },80); }
function initSearch(){
  ["searchSide","searchTop"].forEach(id=>on(id,openSearch));
  const inp=$("#srchIn");
  inp.oninput=()=>{ srchSel=0; paintSearch(); };
  inp.onkeydown=e=>{ if(e.key==="ArrowDown"||e.key==="ArrowUp"){ e.preventDefault(); srchSel=Math.max(0,Math.min(srchRes.length-1,srchSel+(e.key==="ArrowDown"?1:-1))); paintSearch(); const sb=$(`#srchList button[data-i="${srchSel}"]`); if(sb) sb.scrollIntoView({block:"nearest"}); }
    else if(e.key==="Enter"){ e.preventDefault(); pickSearch(srchSel); } else if(e.key==="Escape"){ closeSearch(); } };
  $("#srch").addEventListener("click",e=>{ if(e.target.id==="srch") closeSearch(); });
  document.addEventListener("keydown",e=>{ const t=e.target, typing=t&&(t.isContentEditable||/INPUT|TEXTAREA|SELECT/.test(t.tagName));
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){ e.preventDefault(); $("#srch").hidden?openSearch():closeSearch(); }
    else if(e.key==="/"&&!typing&&$("#srch").hidden){ e.preventDefault(); openSearch(); }
    else if(e.key==="Escape"&&!$("#srch").hidden) closeSearch(); });
}
/* ---------- quick update: the numbers you change most, one sheet ---------- */
function parseDur(v){ const t=String(v||"").toLowerCase().trim(); if(!t) return null;
  if(/^[\d,.]+$/.test(t)) return Math.round(num(t)); // plain number = minutes
  let m=0, ok=false; t.replace(/(\d+(?:\.\d+)?)\s*(d|day|days|h|hr|hrs|hour|hours|m|min|mins|minute|minutes)\b/g,(_,n,u)=>{ ok=true; n=parseFloat(n); m+=u[0]==="d"?n*1440:u[0]==="h"?n*60:n; return ""; });
  return ok?Math.round(m):null; }
function openQuickSheet(){
  openSheet({title:"Quick update",sub:"The numbers you change most. Everything else is in Settings → Update all.",build(f){
    const sub=t=>{ const h=document.createElement("div"); h.className="qsub"; h.textContent=t; f.appendChild(h); };
    const N=(label,obj,k,o)=>fld(label,Object.assign({type:"num",value:obj[k],get:()=>obj[k],set:v=>obj[k]=v},o||{}));
    const H=state.heroGear.have, G=state.govGear.have||(state.govGear.have={}), C=state.charms.have||(state.charms.have={});
    sub("Truegold & hero gear");
    f.appendChild(frow(N("Truegold Dust",state.dust,"current"),N("Truegold",state.tg,"have")));
    f.appendChild(frow(N("Forgehammers",H,"fh"),N("Mithril",H,"mith")));
    f.appendChild(frow(N("Mythic Gear",H,"mg"),N("Enhancement XP",H,"xp",{hint:"shorthand works: 1.2m"})));
    sub("Hero shards");
    const SH=shardOrder().filter(r=>!/amadeus|helga/i.test(r.n||"")).slice(0,3);
    f.appendChild(frow(fld("General Mythic shards",{type:"num",value:state.shardGeneral||0,get:()=>state.shardGeneral||0,set:v=>state.shardGeneral=v}),...(SH[0]?[N(SH[0].n+" shards",SH[0],"have")]:[])));
    if(SH.length>1) f.appendChild(frow(...SH.slice(1).map(r=>N(r.n+" shards",r,"have"))));
    const W=(state.widgets&&state.widgets.rows)||[];
    if(W.length){ sub("Widgets in hand"); for(let i=0;i<W.length;i+=2) f.appendChild(frow(...W.slice(i,i+2).map(r=>N(r.hero||"Widget",r,"have")))); }
    sub("Speedups — type like the game shows: 4d 4h 3m");
    const R=state.resources||[], SP=[["General","General"],["Soldier Training","Training"],["Construction","Construction"],["Research","Research"],["Soldier Healing","Healing"]];
    const spF=([k,l])=>{ const r=R.find(x=>x.n.startsWith(k+" speedup")); if(!r) return null;
      return fld(l,{value:minsTxt(r.h)+(num(r.h)%60?" "+(num(r.h)%60)+"m":""),set:v=>{ const m=parseDur(v); if(m!=null) r.h=String(m); }}); };
    const sf=SP.map(spF).filter(Boolean); for(let i=0;i<sf.length;i+=2) f.appendChild(frow(...sf.slice(i,i+2)));
    sub("Governor gear & charms");
    f.appendChild(frow(N("Satin",G,"satin"),N("Gilded Threads",G,"threads")));
    f.appendChild(frow(N("Artisan's Vision",G,"vision"),N("Charm Guides",C,"guides")));
    f.appendChild(frow(N("Charm Designs",C,"designs"),document.createElement("span")));
  }});
}
function initStatic(){
  const dl=document.createElement("datalist"); dl.id="widHeroList"; dl.innerHTML=WID_HEROES.map(h=>`<option value="${esc(h)}">`).join(""); document.body.appendChild(dl);
  const pl=document.createElement("datalist"); pl.id="petList"; pl.innerHTML=Object.keys(PET_INFO).map(n=>`<option value="${esc(n)}">`).join(""); document.body.appendChild(pl);
}

/* ---------- boot ---------- */
(async function(){
  initStatic(); buildNav(); initSheet(); initTheme(); initInstall(); initSearch(); on("quickBtn",openQuickSheet);
  const saved=await load();
  if(saved) state=mergeSeed(saved);
  if(Array.isArray(state.nodes)){
    state.nodes.forEach(n=>{ if(n.max==null) n.max=/unlock/i.test(n.name)?1:12;
      if(!Array.isArray(n.costs)||!n.costs.length){ const k=Object.keys(NODE_COSTS).find(x=>n.name.toLowerCase().includes(x)); if(k) n.costs=NODE_COSTS[k].slice(); }
      delete n.rem; delete n.next; });
    if(!state.nodes.some(n=>/unlock/i.test(n.name))) state.nodes.push({name:"Truegold Archers (unlock)",cur:0,max:1,costs:[2236]});
  }
  ["infNodes","cavNodes"].forEach(key=>{
    if(!Array.isArray(state[key])||!state[key].length) state[key]=structuredClone(SEED[key]);
    else state[key].forEach(n=>{ if(n.max==null) n.max=/unlock/i.test(n.name)?1:12;
      if(!Array.isArray(n.costs)||!n.costs.length){ const k=Object.keys(NODE_COSTS).find(x=>n.name.toLowerCase().includes(x)); if(k) n.costs=NODE_COSTS[k].slice(); }
      delete n.rem; delete n.next; });
  });
  if(!state.govGear||!Array.isArray(state.govGear.pieces)) state.govGear=structuredClone(SEED.govGear);
  if(!state.forecast||!Array.isArray(state.forecast.log)) state.forecast={log:[]};
  if(Array.isArray(state.mysticTrials)) state.mysticTrials.forEach(z=>{ if(!Array.isArray(z.log)) z.log=[]; if(!z.log.length){ const val=parseFloat(z.v); if(isFinite(val)) z.log.push({d:fcToday(),v:val}); } });
  if(!state.today||!Array.isArray(state.today.routine)) state.today=structuredClone(SEED.today);
  if(!state.weekly||!Array.isArray(state.weekly.items)) state.weekly=structuredClone(SEED.weekly);
  if(!Array.isArray(state.packs)) state.packs=structuredClone(SEED.packs);
  if(!state.heroInfo||typeof state.heroInfo!=="object") state.heroInfo=structuredClone(SEED.heroInfo);
  if(!Array.isArray(state.history)) state.history=[];
  takeSnapshot();
  state.packs.forEach(p=>{ if(p.d&&p.first&&p.kind!=="once") p.firstDone=true; }); // already-bought cards have used their first-buy price
  if(!state.ui||typeof state.ui!=="object") state.ui={tab:"Home"};
  if(!state.troopCounts) state.troopCounts=structuredClone(SEED.troopCounts);
  if(!state.heroGear||!Array.isArray(state.heroGear.rows)) state.heroGear=structuredClone(SEED.heroGear);
  if(!state.charms||!Array.isArray(state.charms.rows)||!state.charms.rows[0]||state.charms.rows[0].type===undefined) state.charms=structuredClone(SEED.charms);
  if(!state.widgets||!Array.isArray(state.widgets.rows)) state.widgets=structuredClone(SEED.widgets);
  if(!state.pets||!Array.isArray(state.pets.rows)) state.pets={have:{food:0,manuals:0,potions:0,medals:0,tmCommon:0,tmAdv:0},rows:[]};
  if(!Array.isArray(state.goldShards)) state.goldShards=structuredClone(SEED.goldShards);
  if(!Array.isArray(state.events)) migrateEvents();
  if(Array.isArray(state.resources)) state.resources.forEach(r=>{ delete r.need; delete r.s; delete r.use; });
  if(Array.isArray(state.buildings)) state.buildings.forEach(bl=>{ if(bl.stepIdx===undefined) bl.stepIdx=0; delete bl.t; delete bl.tg; delete bl.ttg; delete bl.time; });
  if(state.account && !state.account.dayAnchor){ const d=parseInt(state.account.day)||443; const a=new Date(); a.setUTCDate(a.getUTCDate()-(d-1)); state.account.dayAnchor=a.toISOString().slice(0,10); }
  state.ui.tab=TAB_ALIAS[state.ui.tab]||state.ui.tab;
  renderAll(); buildSync(); buildUpload(); initCommaFormatting(); initNoDrag();
  const fromHash=tabFromHash(); setTab(fromHash?fromHash[0]:state.ui.tab, fromHash?fromHash[1]:undefined, false);
  const persists=hasStore||lsSet("__probe__","1"); if(!persists) setSaveUI("err","Session only");
  if(syncCfg.on && syncCfg.owner && loadTok()) syncPull(true);
})();
