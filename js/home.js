"use strict";
/* =====================================================================
   HOME
   ===================================================================== */
// "have / next step" tile — the small step up front, the end goal as a faint line
const fmtK=v=>v>=1e4&&v<1e6?fmt(Math.round(v/1e3))+"K":fmtBig(v); // 172,000 → 172K so tiles fit on a phone
function stepTileH(id,label,h,v,goal,f){ f=f||fmtK; return tileH({id,label,value:f(h),sub:(!v?"not needed next":`next ${f(v)} · `+(v>h?`<span class="bad">${f(v-h)} short</span>`:`<span class="ok">enough ✓</span>`))+(goal?`<br><span class="faint">end goal ${f(goal)}</span>`:""),p:v?pc(h,v):null,cls:v&&h>=v?"ok":""}); }
function tileH({id,label,value,sub,p,cls,txt,color,go,clamp}){
  return `<button class="tile" ${id?`id="${id}"`:""} ${go?`data-go="${esc(go)}"`:""}><span class="l"><span>${label}</span></span><span class="v ${txt?"txt":""} ${clamp?"clamp":""}" ${color?`style="color:${color}"`:""}>${value}</span>${sub!=null?`<span class="s">${sub}</span>`:""}${p!=null?barH(p,cls||""):""}</button>`;
}
function homeList(o){ // Home checklist: next 5 still to do; ticked items slide away
  const arr=o.arr, show=!!state.ui[o.key], n=arr.filter(r=>r.d).length, host=$(o.list);
  $(o.cnt).textContent=arr.length?(n===arr.length?o.done:`${n} of ${arr.length} done`):"No items yet";
  $(o.bar).innerHTML=barH(pc(n,arr.length),n===arr.length&&n?"ok":"");
  const left=arr.filter(r=>!r.d), CAP=5, more=arr.length>Math.min(CAP,left.length);
  const b=$(o.btn); b.hidden=!more; b.textContent=show?"Show less":`Show all ${arr.length}`;
  b.onclick=()=>{ state.ui[o.key]=!show; scheduleSave(); homeList(o); };
  const list=show?arr:left.slice(0,CAP);
  buildChecks(host,list,{tickOnly:true,onTick:()=>{ clearTimeout(host._t); host._t=setTimeout(()=>homeList(o),show?0:380); }});
  if(!list.length) host.innerHTML=`<li class="faint" style="padding:8px 0">${esc(o.done)}</li>`;
}
/* ---------- event mode: what to do while an event is live ---------- */
const EVENT_STEPS=[
  [/kvk|kingdom of power/i,["Use speedups on the matching prep day only","Governor Gear upgrades on its day","Pet advances on its day","Pet combat skills on before the battle"]],
  [/officer project/i,["Forgehammers into hero gear mastery","Level widgets (lowest rally hero first)"]],
  [/hall of heroes/i,["Spend Marks of Valor on widgets + shards","General shards into your focus hero"]],
  [/armament/i,["Small speedups only — save the big ones for KvK"]],
  [/bear/i,["Pet buffs on: Panther, Elephant, Great Moose, Bison, War Bear","Lead rallies with your Bear heroes (Amadeus, Ava, Yang)"]],
  [/strongest governor/i,["Check today's theme — spend only on that"]],
  [/hero roulette/i,["Set the wheel to your focus hero (Change) — Wee & Woo or Ava","Tokens cost 1,500 gems — always Spin 10 (9 tokens)","Reach the chests: 70 spins (30 shards + 30 books + 30 manuals), 120 (50 each)","Skip Lucky Chip packs — under 3,000%"]],
  [/voyage/i,["Keep all 4 sails running — 8 h each, start one before bed","Open treasures — merging 3 Premium is random (Exquisite or Majestic)","Milestones: 20 = 40 Guides · 60 = 80 Designs · 120 = 180 · 200 = 240 Designs"]],
  [/alliance mobilization/i,["First exclusive mission each day = 200% points — do it daily","Custom Mission Voucher → pick a double-points mission","Refresh missions you haven't accepted; never abandon an accepted one","Booster Pack (A$2.99, 4,000%): 4 General shards + 20 Truegold + 1K gems — 1 a day"]],
  [/fishing/i,["Dreamweaver's Tide collection → +2% Squads' Attack permanent — finish it first","Fish before bait hits 10 (+1 every 3 h) — about 3 times a day","Treasure Charts → Ocean Prospector for better fish and chests","Daily Drill: 1,500 + 2,000 points","Spend all tokens on Sunken Treasure Hunt before the end"]],
  [/halloween/i,["Claim the free Candy Party Pack I","Collect candy every day: daily challenges + free candy store first (a couple of thousand), then gather / beasts / speedups","Reach 300 Prankster Points every day = daily chest (2 General shards, 3 hammers, 3 h) — Prankster Time gives free attacks","Short of 300 one day? Save the candy and use it the next day","Spend all candy by 2 Nov — leftovers become resource chests","Surprising Symphony missions as they line up with each day's stage"]],
  [/eternity'?s reach/i,["Register the same day, all troops at home (5–6 full marches, no losses)","Skill order — row 1 Right · 2 Right · 3 Left · 4 Left · 5 Right","Start: all marches on Cesares (guards) to level the skill tree","Skill 3: 2 weakest on Cesares, 3–4 gather — recall the nearest one every 60 s (common veins only)","Skill 5: save it for Vein Outbursts — then send every march to gather","Max level: stop Cesares, gather at 6 nodes · skip the Peak at 23 min"]],
  [/nearby beasts/i,["Hunt beasts on the map for points","Reach 80 points: Expedition manuals + Conquest books, keys, potions","Top ranks add hero shards + gems"]],
  [/golden glaives/i,["Do Watchtower Intel missions for Dim Goldstone","Redeem in order: gold Truegold item (20) → 5 Truegold (5) → 1 h speedups (4) → 10K XP (3)","Skip the resource carts"]],
  [/dragon essence/i,["Claim the free Ashen Bounty","Value Pack (1 a day) is the cheapest essence per $","Store: focus-hero shards 20 each · Mithril 160 · 28 Hammers 200 · 32 Charm Designs 80 · 20 Truegold 40"]]];
const minsTxt=m=>{ m=num(m); const d=Math.floor(m/1440), h=Math.floor(m%1440/60); return d?`${fmt(d)}d ${h}h`:`${h}h`; };
function eventHave(e){ const n=e.n||"", R=state.resources||[], rv=k=>{ const r=R.find(x=>new RegExp(k,"i").test(x.n)); return r?num(r.h):0; }, out=[];
  if(/kvk|kingdom of power|armament/i.test(n)){ [["General","General speedups"],["Training","Training"],["Construction","Construction"],["Research","Research"],["Healing","Healing"]].forEach(([k,l])=>{ const v=rv(k); if(v) out.push([l,minsTxt(v)]); }); }
  if(/kvk|kingdom of power/i.test(n)){ const G=(state.govGear&&state.govGear.have)||{}; if(num(G.satin)) out.push(["Satin",fmtBig(num(G.satin))]); if(num(G.threads)) out.push(["Threads",fmt(num(G.threads))]); if(num(G.vision)) out.push(["Artisan's Vision",fmt(num(G.vision))]);
    const P=(state.pets&&state.pets.have)||{}; if(num(P.food)) out.push(["Pet Food",fmtBig(num(P.food))]); }
  if(/officer project/i.test(n)){ const H=(state.heroGear&&state.heroGear.have)||{}; out.push(["Forgehammers",fmt(num(H.fh))]); out.push(["Widgets",fmt(((state.widgets&&state.widgets.rows)||[]).reduce((t,r)=>t+num(r.have),0))]); }
  if(/hall of heroes/i.test(n)){ out.push(["General shards",fmt(num(state.shardGeneral))]); const f=shardOrder()[0]; if(f) out.push([`${f.n} shards`,`${fmt(num(f.have))} (${fmt(shardNeed(f)-num(f.have))} short)`]); }
  return out; }
const EVENT_IMP={top:0,high:1,normal:2,low:3}; // set per event in its edit panel
function eventRank(e){ if(e.imp&&EVENT_IMP[e.imp]!=null) return EVENT_IMP[e.imp]-0.5; // your own setting wins
  const i=[/kvk|kingdom of power/i,/hall of heroes/i,/officer project/i,/strongest governor/i,/armament/i].findIndex(r=>r.test(e.n||""));
  return i>=0?[0,1,1,1.5,2.2][i]:/bear/i.test(e.n||"")?3.2:2.5; }
function liveEvents(){ return (state.events||[]).map(e=>({e,a:activeOcc(e)})).filter(x=>x.a).sort((a,b)=>eventRank(a.e)-eventRank(b.e)); }
// Halloween Party → Prankster King: one stage a day (game days, UTC)
const HALLOWEEN_STAGES=[["2026-10-27","Power Boost","build and research"],["2026-10-28","Beast Slay","stamina on beasts (also gets candy)"],["2026-10-29","Hero Development","recruit, use hero shards (6,000 pts per Mythic shard)"],
  ["2026-10-30","Soldier Training","train troops"],["2026-10-31","Hero Gear","spend hammers and XP"],["2026-11-01","Gather Resources","all marches gathering (also gets candy)"],["2026-11-02","Governor Gear","spend Threads and Satin"]];
// short=true → today + tomorrow only (the full list sits in the fold)
function stagesH(e,short){ if(!/halloween/i.test(e.n||"")) return ""; const t=gameToday(), i=HALLOWEEN_STAGES.findIndex(([d])=>d===t);
  const L=short?(i<0?[]:HALLOWEEN_STAGES.slice(i,i+2)):HALLOWEEN_STAGES; if(!L.length) return "";
  return `<div class="estages">${short?"":"<b>Prankster King — one stage a day</b>"}${L.map(([d,n,w])=>`<div class="est${d===t?" now":d<t?" past":""}"><span>${d===t&&short?"Today":new Date(d+"T00:00:00").toLocaleDateString(undefined,{weekday:"short",day:"numeric"})}</span><b>${esc(n)}</b><em>${esc(w)}</em></div>`).join("")}</div>`; }
function renderEventMode(){
  const box=$("#eventMode"), live=liveEvents();
  const cur=live[0]; box.hidden=!cur; if(!cur) return;
  const e=cur.e, steps=(EVENT_STEPS.find(([r])=>r.test(e.n||""))||[0,[]])[1], start=new Date(gameToday()+"T00:00:00"); start.setDate(start.getDate()-(cur.a.day-1));
  const left=cur.a.len-cur.a.day, have=eventHave(e);
  // how long is left: "end not confirmed" when the game hasn't shown the end date yet
  const leftTxt=(x,a)=>x.endOpen?"end not confirmed":a.len-a.day?`${a.len-a.day} more day${a.len-a.day>1?"s":""}`:"last day";
  const st=(HALLOWEEN_STAGES.find(([d])=>d===gameToday())||[]), todayStage=/halloween/i.test(e.n||"")&&st[1]?`${st[1]} — ${st[2]}`:"";
  const ncam=camMissing(false).length, bt=battleFor(e);
  // hero banner: big title, a ring for day X of Y, today's stage and what to spend as chips
  const R=26, C=2*Math.PI*R, frac=cur.a.len>1&&!e.endOpen?cur.a.day/cur.a.len:1;
  box.innerHTML=`<svg class="ering" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="${R}" class="er0"/><circle cx="32" cy="32" r="${R}" class="er1" stroke-dasharray="${(C*frac).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 32 32)"/></svg>
    <div class="eringt"><b>${e.endOpen?`D${cur.a.day}`:`${cur.a.day}/${cur.a.len}`}</b><small>${e.endOpen?"end ?":left?"days":"last day"}</small></div>
    <p class="eey">${ico("bolt")} Live now</p><h2 class="etitle">${esc(e.n||"Event")}</h2>
    ${todayStage?`<p class="eline"><b>Today:</b> ${esc(todayStage)}</p>`:""}
    <div class="echips"><span class="echip">${esc(spendFor(e)||"Tap How to play")}</span>${have.slice(0,2).map(([l,v])=>`<span class="echip">${esc(l)} ${esc(v)}</span>`).join("")}</div>
    <div class="eacts">${steps.length||stagesH(e)?`<button class="btn sm" id="evHow">How to play ›</button>`:""}${bt?`<button class="btn sm primary" id="evBattle">⚔ Battle card</button>`:""}${ncam?`<button class="btn sm" id="evCam">📸 ${ncam}</button>`:""}${live.length>1?`<button class="btn sm" id="evOthers">+${live.length-1} on now</button>`:""}</div>`;
  on("evHow",()=>openSheet({title:e.n||"Event",sub:`${cur.a.len>1?`Day ${cur.a.day} of ${cur.a.len} · `:""}${leftTxt(e,cur.a)}`,build(f){ f.innerHTML=`${stagesH(e)}${steps.length?`<ul class="etips">${steps.map(t=>`<li>${esc(t)}</li>`).join("")}</ul>`:""}`; }}));
  on("evOthers",()=>openSheet({title:"Also on now",sub:"Tap one to see or edit it.",build(f){ f.innerHTML=`<div class="list">${live.slice(1).map(({e:x,a},i)=>`<button class="lrow erow2" data-i="${i+1}"><span style="flex:1;min-width:0"><b>${esc(x.n||"Event")}${(()=>{ const sh=eventShopFor(x); return sh&&!sh.saved?" 📸":""; })()}</b><br><span class="faint" style="font-size:13px">${esc(spendFor(x)||"tap to add what to spend")}</span></span><span class="mono faint">${x.endOpen?`day ${a.day}`:a.len>1?`${a.day}/${a.len}`:"today"}</span></button>`).join("")}</div>`;
    f.querySelectorAll(".erow2").forEach(b=>b.onclick=()=>openEventSheet(live[+b.dataset.i].e)); }}));
  on("evBattle",()=>openBattle(e));
  on("evCam",()=>openCamSheet(false));
}
function renderHome(){
  const d=new Date();
  // events run on the game day (UTC); before the daily reset your local date is a day ahead — say so
  const gd=new Date(gameToday()+"T00:00:00"), rs=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()+1));
  $("#homeSub").textContent=d.toLocaleDateString(undefined,{weekday:"short",day:"numeric",month:"short"})+
    (ymd(d)!==gameToday()?` · game day ${gd.toLocaleDateString(undefined,{weekday:"short",day:"numeric",month:"short"})} until ${rs.toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"})}`:"")+" · Kingdom day "+kingdomDay();
  paintGoals(); renderPlanToday();
  const kt=$("#kTag"); if(kt) kt.textContent="Kingdom "+((state.account&&state.account.kingdom)||455);
  renderKpis();
  renderEventMode();
  renderFresh(); renderBagCheck(); renderTimelines();
  // daily + weekly checklists reset here (they live in Data → Checklists now, not on Home)
  const t=state.today; const today=fcToday();
  if(t.routineDate!==today){ t.routine.forEach(r=>r.d=false); t.routineDate=today; scheduleSave(); }
  const pa=[], al=$("#packAlert"); al.hidden=true; // card renewals now show in "Your plan today"
  if(pa.length) al.innerHTML=`<b>Card ending:</b> `+pa.map(({p,n})=>`${esc(p.t)} — ${n<0?`ended ${-n} day${n===-1?"":"s"} ago`:n===0?"ends today":`ends in ${n} day${n===1?"":"s"}`}`).join(" · ")+` <span class="faint">→ renew or untick</span>`;
  const w=state.weekly, wk=weekKey();
  if(w.week!==wk){ w.items.forEach(r=>r.d=false); w.week=wk; scheduleSave(); }
  renderEvents();
}

/* ---------- Home summary strip: the four numbers that matter today ---------- */
function renderKpis(){ const box=$("#kpis"); if(!box) return;
  const A=typeof vPlanAll==="function"?vPlanAll():null, w=typeof weekDelta==="function"?weekDelta("power"):null;
  const nx=(state.events||[]).map(e=>({e,o:nextOcc(e)})).filter(x=>x.o&&!x.o.past&&x.o.days>0&&!activeOcc(x.e)&&!(num(x.e.every)&&num(x.e.every)<=2)).sort((a,b)=>a.o.days-b.o.days||eventRank(a.e)-eventRank(b.e))[0];
  const K=[
    A?{v:`A$${Math.round(A.spare)}`,l:`${A.M.label.slice(0,3)} spare`,c:"y",go:()=>setTab("Shop","Paid")}:null,
    {v:fmtK(num(state.stars)),l:"Stars ⭐",c:"",go:()=>setTab("Shop","Paid")},
    w?{v:`${w.d>=0?"+":"−"}${fmtBig(Math.abs(w.d))}`,l:"power/wk",c:w.d>=0?"g":"r",go:()=>setTab("Progress","Overview")}:{v:"—",l:"power/wk",c:""},
    nx?{v:`${nx.o.days}d`,l:nx.e.n,c:"",go:()=>openEventSheet(nx.e)}:{v:"—",l:"next event",c:""}].filter(Boolean);
  const bars=[A?Math.min(100,(A.M.bud-A.spare)/A.M.bud*100):0,Math.min(100,num(state.stars)/50),w?Math.min(100,Math.abs(w.d)/Math.max(1,num((state.history||[]).slice(-1)[0]?.v?.power))*1000):0,nx?Math.max(8,100-nx.o.days*7):0];
  box.innerHTML=K.map((k,i)=>`<button class="kpi ${k.c}" data-i="${i}"><b>${esc(k.v)}</b><span>${esc(k.l)}</span><i class="kbar k${i}"><i style="width:${bars[i]||0}%"></i></i></button>`).join("");
  bindAll(box,".kpi",b=>{ const k=K[+b.dataset.i]; if(k.go) k.go(); }); }

/* ---------- events ---------- */
function renderEvents(){
  const list=(state.events||[]).filter(e=>!activeOcc(e)).map(e=>({e,o:nextOcc(e)})).filter(x=>x.o&&!x.o.past).sort((a,b)=>a.o.days-b.o.days||String(a.e.time||"").localeCompare(String(b.e.time||"")));
  const up=$("#evUpcoming");
  const tone=e=>/kvk|kingdom of power|eternity|bear|swordland|tri-alliance|championship|sanctuary|brawl/i.test(e.n||"")?"v":/officer|armament|governor|hall of heroes/i.test(e.n||"")?"y":"t";
  const L2=list.filter(x=>!(num(x.e.every)&&num(x.e.every)<=2)).slice(0,6), re=typeof resEnds==="function"?resEnds():null, rc=(state.research||{}).current;
  up.innerHTML=`<div class="cup">${re&&rc&&rc.n&&re>new Date()?`<button class="cupc y" id="cupRes"><b>${Math.max(0,Math.ceil((re-new Date())/864e5))}d</b><span>${esc(rc.n)} done</span></button>`:""}${L2.map(({e,o})=>`<button class="cupc ${tone(e)} cupev" data-i="${state.events.indexOf(e)}"><b>${o.days===0?"today":o.days+"d"}</b><span>${esc(e.n||"Event")}${e.time?` · ${esc(e.time)}`:""}</span></button>`).join("")}</div>`+(L2.length?"":`<p class="dnote">Nothing new starting soon.</p>`);
  on("cupRes",()=>setTab("Town","Research"));
  bindAll(up,".cupev",b=>openEventSheet(state.events[+b.dataset.i]));
  on("evAdd",()=>openEventSheet(null));
  on("evAll",openAllEventsSheet);
}
// what to spend during each event (your own text wins; these are the defaults)
const EVENT_SPEND=[[/kvk|kingdom of power/i,"Speedups, training, Gov Gear, pet advances"],[/officer project/i,"Forgehammers + widgets"],[/hall of heroes/i,"Marks of Valor → widgets & shards"],[/armament/i,"Small stuff only — save for KvK"],[/bear/i,"Nothing — just lead rallies"],[/strongest governor/i,"Today's theme items"],[/hero roulette/i,"Gems from the roulette fund — Spin 10 only"],[/voyage/i,"Nothing — keep all 4 sails running"],[/dragon essence/i,"Value Pack only — essence into focus-hero shards"]];
const EVENT_LEN=[[/hall of heroes/i,3],[/armament competition \(type 1\)/i,2]];
const spendFor=e=>String(e.spend||"").trim()||((EVENT_SPEND.find(([re])=>re.test(e.n||""))||[])[1]||"");
const evLen=e=>Math.max(1,Math.floor(num(e.len))||((EVENT_LEN.find(([re])=>re.test(e.n||""))||[])[1]||1));
function activeOcc(e){ const L=evLen(e); for(let k=0;k<L;k++){ if(occursOn(e,-k)) return {day:k+1,len:L}; } return null; }
// note text → one fact per line ("·" and full stops start new lines)
function noteHtml(t){ const L=String(t||"").split(/\n| · |(?<=\.)\s+(?=[A-Z0-9])/).map(x=>x.trim()).filter(Boolean);
  return L.length?`<ul>${L.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`:""; }
function openEventSheet(ev){
  const isNew=!ev; if(isNew){ ev={n:"New event",date:fcToday(),every:7,time:"",note:""}; state.events.push(ev); afterEdit(); }
  openSheet({title:isNew?"New event":(ev.n||"Event"),sub:"Set any past or future date — it repeats from there.",
    build(f){
      // note: easy-to-read view first (one fact per line), editing tucked under "Edit note"
      const nv=document.createElement("div"); nv.className="evnote"; f.appendChild(nv);
      const paintNote=()=>{ nv.innerHTML=noteHtml(ev.note)||'<span class="faint">No notes yet.</span>'; }; paintNote();
      const ed=document.createElement("details"); ed.className="fold"; ed.innerHTML="<summary>Edit note</summary>"; const eb=document.createElement("div"); eb.className="fbody"; ed.appendChild(eb);
      eb.appendChild(fld("Note",{type:"area",rows:8,value:ev.note,set:v=>{ ev.note=v; paintNote(); },hint:"Start a new line for each point."})); f.appendChild(ed);
      if(battleFor(ev)){ const bb=document.createElement("button"); bb.className="btn primary"; bb.textContent="⚔ Open battle card"; bb.onclick=()=>{ closeSheet(); openBattle(ev); }; f.appendChild(bb); }
      f.appendChild(fld("Event name",{value:ev.n,set:v=>ev.n=v}));
      f.appendChild(frow(fld("Date (any occurrence)",{type:"date",value:ev.date,set:v=>{ ev.date=v; delete ev.guess; }}),fld("Repeats every (days)",{type:"num",value:ev.every||0,get:()=>ev.every,set:v=>ev.every=Math.max(0,Math.floor(v)),hint:"0 = one-off"})));
      f.appendChild(frow(fld("Lasts (days)",{type:"num",value:evLen(ev),get:()=>evLen(ev),set:v=>{ ev.len=Math.max(1,Math.floor(v)||1); delete ev.guess; }}),fld("Time (optional)",{type:"time",value:ev.time,set:v=>ev.time=v})));
      f.appendChild(fld("End date not confirmed yet",{type:"check",value:!!ev.endOpen,set:v=>{ if(v) ev.endOpen=true; else delete ev.endOpen; },hint:"Tick when the game hasn't shown when it ends. Untick once you know, and set the days."}));
      f.appendChild(fld("What to spend",{value:spendFor(ev),ph:"e.g. Speedups + Gov Gear",set:v=>ev.spend=v,hint:"Shown on Home while the event is on."}));
      f.appendChild(fld("Importance",{type:"select",value:ev.imp||"",options:[["","Auto"],["top","Top — show first"],["high","High"],["normal","Normal"],["low","Low"]],set:v=>{ if(v) ev.imp=v; else delete ev.imp; },hint:"When several events are on, the most important one leads the Home card."}));
      const inf=infoBox(); f.appendChild(inf);
      const r=()=>{ const o=nextOcc(ev); inf.innerHTML=o?(o.past?"This one-off event has passed.":`Next: <b>${new Date(o.date+"T00:00:00").toLocaleDateString(undefined,{weekday:"long",day:"numeric",month:"long"})}</b> (${whenTxt(o)}) · ${repeatTxt(ev)}`):"Pick a date."; };
      r(); return r;
    },
    onDelete:()=>{ const i=state.events.indexOf(ev); if(i>-1) state.events.splice(i,1); }});
}
function openAllEventsSheet(){
  openSheet({title:"All events",sub:"Tap one to edit it.",build(f){
    const draw=()=>{ f.innerHTML=""; const L=document.createElement("div"); L.className="list";
      (state.events||[]).forEach(ev=>{ const o=nextOcc(ev); const b=document.createElement("button"); b.className="lrow";
        b.innerHTML=`<span style="min-width:0"><span class="lt" style="display:block">${esc(ev.n||"Event")}</span><span class="ls">${repeatTxt(ev)} · ${o?(o.past?"passed":whenTxt(o)):"no date"}</span></span><span class="chev">›</span>`;
        b.onclick=()=>openEventSheet(ev); L.appendChild(b); });
      f.appendChild(L); const a=document.createElement("button"); a.className="add"; a.textContent="+ Add event"; a.onclick=()=>openEventSheet(null); f.appendChild(a); };
    draw(); return draw; }});
}

/* ---------- Do next (one ranked list) ---------- */
function doHtml(g,i){ // one row: number, task + detail, then ✓ Done (when ready) or ›
  return `<div class="drow dorow"><button class="dogo" data-i="${i}"><span class="dn${g.ready?" go":""}" aria-hidden="true">${i+1}</span>
    <span class="dt"><b>${g.title}</b><span>${g.ready?'<span class="ok">Ready</span> · ':""}${g.detail}</span></span></button>`+
    (g.apply?`<button class="didit" data-i="${i}" title="Spends the materials and moves it up a level — Undo if not">✓ Done</button>`:`<span class="chev" aria-hidden="true">›</span>`)+`</div>`;
}
let lastGoals=[];
/* ---------- next steps: one engine for every tab and Home ----------
   Each section says what its next small step is. Home ranks them with your rule:
   ready now first, then main heroes (hero gear, widgets, shards), then whole-army stats. */
const CHARM_ORDER=["Infantry","Archer","Cavalry"]; // Quaad: Infantry first
// optimiser charm plan: an exchange row (Guides → Designs) and stage-by-stage upgrades, in the optimiser's order
const charmPlanRow=x=>((state.charms&&state.charms.rows)||[]).filter(r=>r.type===x.type)[x.i-1];
const charmLvH=r=>`Lv ${num(r.lvl)}${num(r.st)?` · ${num(r.st)}/5`:""}`;
function charmPlanLeft(){ return ((state.charms&&state.charms.plan)||[]).filter(x=>{ if(x.kind==="x") return !x.done; const r=charmPlanRow(x); return r&&num(r.lvl)*5+num(r.st)<x.toL*5+num(x.toS); }); }
function charmPlanApply(x){ const h=state.charms.have; if(x.kind==="x"){ h.guides=num(h.guides)-x.g; h.designs=num(h.designs)+x.d; x.done=true; return; }
  const r=charmPlanRow(x); h.guides=num(h.guides)-x.g; h.designs=num(h.designs)-x.d; r.lvl=x.toL; r.st=num(x.toS); }
function charmNextList(n){ return ((state.charms&&state.charms.rows)||[]).filter(r=>num(r.lvl)<num(r.tgt)&&num(r.lvl)<22).sort((a,b)=>CHARM_ORDER.indexOf(a.type)-CHARM_ORDER.indexOf(b.type)||num(a.lvl)-num(b.lvl)).slice(0,n||3); }
function widNextRow(){ const W=(state.widgets&&state.widgets.rows)||[], R=W.some(r=>r.rally)?W.filter(r=>r.rally):W;
  return R.filter(r=>num(r.lvl)<10).sort((a,b)=>num(a.lvl)-num(b.lvl)||(widNext(num(a.lvl))-num(a.have))-(widNext(num(b.lvl))-num(b.have)))[0]||null; }
function petNextStep(){ const P=state.pets||{rows:[]};
  const r=(P.rows||[]).filter(x=>{ const g=num(x.tgt)||num(x.max); return num(x.lvl)>0&&g>num(x.lvl)&&PET_INFO[x.n]; }).sort((a,b)=>petRank(a)-petRank(b))[0]; if(!r) return null;
  const to=Math.min((Math.floor(num(r.lvl)/10)+1)*10,num(r.tgt)||num(r.max)); return {r,to,cost:petCost(Object.assign({},r,{tgt:to}))}; }
// optimiser plan for governor gear (one tier per row) — leads when saved, like the hero gear plan
const govPlanPiece=x=>((state.govGear&&state.govGear.pieces)||[]).find(p=>p.name===x.name);
function govPlanLeft(){ return ((state.govGear&&state.govGear.plan)||[]).filter(x=>{ const p=govPlanPiece(x); return p&&num(p.cur)<x.to; }); }
function govNextStep(){ const g=state.govGear; if(!g||!g.pieces) return null; const P=govPlan(), pl=govPlanLeft()[0];
  if(pl){ const p=govPlanPiece(pl); return {p,P,to:num(p.cur)+1,need:govRem(num(p.cur),num(p.cur)+1)}; }
  if(!P.cur||!P.step.length) return null;
  const p=P.step.slice().sort((a,b)=>num(a.cur)-num(b.cur))[0]; return {p,P,to:num(p.cur)+1,need:govRem(num(p.cur),num(p.cur)+1)}; }
function bldNextStep(){ const bl=(state.buildings||[]).find(b=>!b.d&&BUILD_TIERS[b.n]&&(b.stepIdx||0)<BUILD_TIERS[b.n].steps.length); return bl?{bl,st:BUILD_TIERS[bl.n].steps[bl.stepIdx||0]}:null; }
const STEP_ORDER=["fh","wid","shard","charm","gov","mast","bld","pet","t11","troop"]; // main heroes, then whole-army stats
function nextSteps(){
  const out=[], have=(o,k)=>num(o&&o[k]);
  // hero gear — same #1 as the Hero Gear tab
  const hg=state.heroGear||{rows:[],have:{}}, H=hg.have||{};
  const hp=(hg.rows||[]).length?hgPriority(hg.rows):[], top=hp.find(r=>hp.now.has(r)&&hgState(r).req)||hp[0], plan=hgPlanLeft()[0];
  if(plan){ const ready=["fh","mg","mith"].every(k=>num(H[k])>=num(plan[k]));
    out.push({k:"fh",title:`${esc(plan.type)} ${esc(plan.slot)} ${esc(hgPlanWhat(plan))}`,detail:[["fh","Hammers"],["mg","Mythic"],["mith","Mithril"]].filter(([k])=>num(plan[k])).map(([k,l])=>`<span class="${num(H[k])>=num(plan[k])?"ok":"bad"}">${l} ${fmt(num(H[k]))}/${fmt(num(plan[k]))} ${num(H[k])>=num(plan[k])?"✓":"✗"}</span>`).join(" · ")+(plan.gain?` · <span class="gold">+${plan.gain}%</span>`:""),ready,open:()=>openHgSheet(hgPlanRow(plan)),key:"Hero Gear",apply:ready?()=>hgPlanApply(plan):null}); }
  else if(top){ const st=hgState(top), nx=HG_IMB.find(x=>x[0]>num(top.lvC)), ready=!!st.req&&hp.now.has(top), block=st.cls==="s-block";
    out.push({k:"fh",title:`${esc(top.type)} ${esc(slotName(top.slot))} ${block?`mastery ${num(top.mC)} → ${nx[1]}`:st.req?`Lv ${nx[0]} imbue`:`XP to Lv ${nx[0]-1}`}`,detail:st.req?hgReqH(st.req):esc(st.line),ready,open:()=>openHgSheet(top),key:"Hero Gear",
      apply:ready?()=>{ Object.entries(st.req).forEach(([k,v])=>H[HG_MAT[k][1]]=num(H[HG_MAT[k][1]])-v); if(block) top.mC=nx[1]; else top.lvC=nx[0]; }:null}); }
  // widgets — lowest rally hero first
  const w=widNextRow(); if(w){ const nd=widNext(num(w.lvl)), ready=num(w.have)>=nd;
    out.push({k:"wid",title:`${esc(w.hero||"Hero")} widget Lv ${num(w.lvl)} → ${num(w.lvl)+1}`,detail:ready?`${fmt(nd)} widgets — you have ${fmt(num(w.have))}`:`${fmt(nd-num(w.have))} widgets short`,ready,open:()=>openWidSheet(w),key:"Widgets",
      apply:ready?()=>{ w.have=num(w.have)-nd; w.lvl=num(w.lvl)+1; }:null}); }
  // shards — most-used hero's next star step
  const sh=shardOrder().find(r=>hasStars(r)&&num(r.pos)<SHARD_MAX); if(sh){ const nd=SHARD_LEAF[num(sh.pos)], gen=genOrder()[0]===sh?num(state.shardGeneral):0, useGen=num(sh.have)<nd&&num(sh.have)+gen>=nd, ready=num(sh.have)>=nd||useGen;
    out.push({k:"shard",title:`${esc(sh.n)} → ${esc(starLabel(num(sh.pos)+1))}`,detail:useGen?`Use ${fmt(nd-num(sh.have))} of your ${fmt(gen)} General shards`:`${fmt(num(sh.have))} / ${fmt(nd)} shards`+(ready?"":` · ${fmt(nd-num(sh.have))} short`),ready,open:()=>openShardSheet(sh),key:"Gold Hero Shards",
      apply:ready?()=>{ if(useGen){ state.shardGeneral=num(state.shardGeneral)-(nd-num(sh.have)); sh.have=0; } else sh.have=num(sh.have)-nd; sh.pos=num(sh.pos)+1; }:null,useGen,genUse:useGen?nd-num(sh.have):0}); }
  // charms — one level
  const c=state.charms||{have:{}}, cp=charmPlanLeft()[0], cr=cp?null:charmNextList(1)[0];
  if(cp){ const gH=have(c.have,"guides"), dH=have(c.have,"designs"), ready=gH>=cp.g&&(cp.kind==="x"||dH>=cp.d), r=cp.kind==="x"?null:charmPlanRow(cp);
    out.push({k:"charm",title:cp.kind==="x"?`Charm exchange: ${fmt(cp.g)} Guides → ${fmt(cp.d)} Designs`:`${esc(cp.type)} Charm ${cp.i} ${charmLvH(r)} → ${cp.toS?`Lv ${cp.toL} · ${cp.toS}/5`:`Lv ${cp.toL}`}`,
      detail:cp.kind==="x"?"Step 1 of the optimiser's charm plan":`${fmt(cp.d)} Designs + ${fmt(cp.g)} Guides`+(cp.gain?` · <span class="gold">+${cp.gain}%</span>`:""),ready,open:()=>openCharmSheet(cp.type||"Cavalry"),key:"Charms",apply:ready?()=>charmPlanApply(cp):null}); }
  if(cr){ const k=CHARM_COSTS[num(cr.lvl)], gH=have(c.have,"guides"), dH=have(c.have,"designs"), ready=gH>=k[0]&&dH>=k[1];
    const idx=c.rows.filter(x=>x.type===cr.type).indexOf(cr)+1;
    out.push({k:"charm",title:`${esc(cr.type)} Charm ${idx} Lv ${num(cr.lvl)} → ${num(cr.lvl)+1}`,detail:ready?`${fmt(k[1])} Designs + ${fmt(k[0])} Guides`:[dH<k[1]?`${fmt(k[1]-dH)} Designs`:"",gH<k[0]?`${fmt(k[0]-gH)} Guides`:""].filter(Boolean).join(" + ")+" short",ready,open:()=>openCharmSheet(cr.type),key:"Charms",
      apply:ready?()=>{ c.have.guides=gH-k[0]; c.have.designs=dH-k[1]; cr.lvl=num(cr.lvl)+1; }:null}); }
  // governor gear — one piece, one tier
  const gv=govNextStep(); if(gv){ const G=state.govGear.have||{}, n=gv.need, ready=have(G,"satin")>=n.s&&have(G,"threads")>=n.t&&have(G,"vision")>=n.v;
    out.push({k:"gov",title:`${esc(gv.p.name)}: ${esc(GOV_TIERS[num(gv.p.cur)][0])} → ${esc((GOV_TIERS[gv.to]||[""])[0])}`,detail:ready?"You have the materials":[have(G,"satin")<n.s?`${fmtK(n.s-have(G,"satin"))} Satin`:"",have(G,"threads")<n.t?`${fmt(n.t-have(G,"threads"))} Threads`:"",have(G,"vision")<n.v?`${fmt(n.v-have(G,"vision"))} Vision`:""].filter(Boolean).join(" + ")+" short",ready,open:()=>openGovPieceSheet(gv.p),key:"Governor Gear",
      apply:ready?()=>{ G.satin=have(G,"satin")-n.s; G.threads=have(G,"threads")-n.t; G.vision=have(G,"vision")-n.v; gv.p.cur=gv.to; }:null}); }
  // buildings — next step of the first building in your build order
  const bn=bldNextStep(); if(bn){ const t=state.tg, ready=num(t.have)>=bn.st.tg&&num(t.ttgHave)>=bn.st.ttg;
    out.push({k:"bld",title:`${esc(bn.bl.n)} → ${esc(bn.st.to)}`,detail:`${fmt(bn.st.tg)} Truegold`+(bn.st.ttg?` + ${fmt(bn.st.ttg)} TTG`:"")+(ready?"":` · ${fmt(Math.max(0,bn.st.tg-num(t.have)))} TG short`),ready,open:()=>openBuildingSheet(bn.bl),key:"Build Order — TG6→TG8",
      apply:ready?()=>{ t.have=num(t.have)-bn.st.tg; t.ttgHave=num(t.ttgHave)-bn.st.ttg; bn.bl.stepIdx=(bn.bl.stepIdx||0)+1; }:null}); }
  // pets — next advance of your top pet
  const pn=petNextStep(); if(pn&&pn.cost){ const PH=state.pets.have||{}, M=["food","manuals","potions","medals"], ready=M.every(k=>have(PH,k)>=pn.cost[k]);
    out.push({k:"pet",title:`${esc(pn.r.n)} Lv ${num(pn.r.lvl)} → ${pn.to}`,detail:ready?"Materials ready — save the advance for a KvK / SG day":M.filter(k=>have(PH,k)<pn.cost[k]).map(k=>`${fmtK(pn.cost[k]-have(PH,k))} ${{food:"food",manuals:"manuals",potions:"potions",medals:"medallions"}[k]}`).join(" + ")+" short",ready,open:()=>openPetSheet(pn.r),key:"Pets",
      apply:ready?()=>{ M.forEach(k=>PH[k]=have(PH,k)-pn.cost[k]); pn.r.lvl=pn.to; }:null}); }
  // progress goals (no materials to spend)
  const tgt=computeTarget(), cur=num(state.dust.current), cn=closestNode();
  if(tgt>cur) out.push({k:"t11",title:`Unlock T11 ${activePhase().n}`,detail:`${fmt(tgt-cur)} Dust to go`+(cn?` · closest node: ${esc(cn.n.name.replace(/ \(.*/,""))}`:""),key:"T11 Unlocks"});
  const tc=state.troopCounts||{}; const tr=[["inf","Infantry"],["arc","Archer"],["cav","Cavalry"]].map(([k,l])=>({k,l,c:num(tc[k]&&tc[k].cur),t:num(tc[k]&&tc[k].tgt)})).filter(x=>x.t>0&&x.c<x.t).sort((a,b)=>a.c/a.t-b.c/b.t)[0];
  if(tr) out.push({k:"troop",title:`Train ${tr.l}`,detail:`${fmt(tr.t-tr.c)} to reach ${fmt(tr.t)}`,open:()=>openTroopSheet(tr.k,tr.l),key:"Troop Plan"});
  const mc=(state.masters||[]).map(m=>({m,info:MASTER_INFO[m.n],lv:num(m.l)})).filter(x=>x.info&&x.lv<100&&(x.info.best===MAIN_TROOP||x.info.best==="All squads")).sort((a,b)=>b.lv-a.lv)[0];
  if(mc){ const n2=Math.min(100,(Math.floor(mc.lv/10)+1)*10); out.push({k:"mast",title:`${esc(mc.m.n)} affinity ${mc.lv} → ${n2}`,detail:n2===100?"Kindred Soul unlocks the research tree":"Emblems needed at the breakpoint",open:()=>openMastSheet(mc.m),key:"Masters"}); }
  return out.map((g,i)=>(g.tag=g.ready?"Ready":"",g)).sort((a,b)=>(b.ready?1:0)-(a.ready?1:0)||STEP_ORDER.indexOf(a.k)-STEP_ORDER.indexOf(b.k));
}
function paintGoals(){
  const hs=$("#doNext"); if(!hs) return;
  const all=nextSteps(), showAll=!!state.ui.doAll, L=showAll?all:all.slice(0,3); lastGoals=all;
  const nReady=L.filter(g=>g.ready).length;
  hs.innerHTML=L.map((g,i)=>doHtml(g,i)).join("")||`<p class="dnote">Everything is at target ✓</p>`;
  bindAll(hs,".dogo",b=>{ const g2=L[+b.dataset.i]; goToSection(null,g2.key,g2.open); });
  bindAll(hs,".didit",b=>{ const g2=L[+b.dataset.i], snap=JSON.stringify(state); g2.apply(); afterEdit(); toast("Done: "+g2.title.replace(/<[^>]+>/g,""),snap); });
  $("#doCount").textContent="";
  const mb=$("#doMore"); mb.hidden=all.length<=3; mb.textContent=showAll?"Top 3 ›":`All ${all.length} ›`;
  mb.onclick=()=>{ state.ui.doAll=!state.ui.doAll; paintGoals(); scheduleSave(); };
}


/* =====================================================================
   SHOWCASE HOME — icons, "Your plan today", hero event banner, coming-up cards
   ===================================================================== */
const ICO={star:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  cart:'<path d="M3 4h2l2.2 10.5a1 1 0 0 0 1 .8h8.6a1 1 0 0 0 1-.8L19.5 8H6"/><circle cx="9" cy="19.5" r="1.3"/><circle cx="17" cy="19.5" r="1.3"/>',
  clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  hammer:'<path d="M14 6l4 4M4 20l9-9M12.5 4.5l3-1 5 5-1 3-2.5.5-5-5z"/>',
  flask:'<path d="M9 3h6M10 3v6L4.5 18.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3"/><path d="M7 15h10"/>',
  bag:'<path d="M5 8h14l-1.2 12.5H6.2z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
  gem:'<path d="M6 4h12l3 5-9 11L3 9z"/><path d="M3 9h18M9 4l3 16 3-16"/>',
  bolt:'<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  sword:'<path d="M14.5 3.5H20v5.5L9 20l-5-5zM6.5 13.5l4 4M3 21l2.5-2.5"/>',
  shield:'<path d="M12 2.5l8 3v6c0 5-3.5 8.8-8 10.5C7.5 20.3 4 16.5 4 11.5v-6z"/>'};
const ico=(k,c)=>`<span class="pico${c?" "+c:""}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICO[k]||ICO.star}</svg></span>`;
const STEP_ICO={fh:"hammer",wid:"gem",shard:"star",charm:"gem",gov:"shield",bld:"flask",pet:"star",t11:"flask",troop:"sword",mast:"star"};
// everything that matters today, from all your data: ready upgrades, deadlines, resets, blockers
function planToday(){ const out=[], S=nextSteps(), today=gameToday();
  S.filter(g=>g.ready).slice(0,3).forEach(g=>out.push({ico:STEP_ICO[g.k],tone:"g",tag:"ready now",title:g.title,detail:g.detail,apply:g.apply,open:()=>goToSection(null,g.key,g.open)}));
  (state.packs||[]).filter(p=>p.d&&PACK_DAYS[p.kind]).forEach(p=>{ const n=packDaysLeft(p); if(n!=null&&n<=1) out.push({ico:"cart",tone:"y",tag:n<=0?"renews today":"renews tomorrow",title:`Renew ${p.t}`,detail:num(p.stars)?`+${fmt(num(p.stars))} ⭐${num(p.gen)?` and ${p.gen} General shards`:""}`:`A$${num(p.aud).toFixed(2)}`,open:()=>setTab("Shop","Paid")}); });
  liveEvents().forEach(({e,a})=>{ const left=a.len-a.day; if(!e.endOpen&&left<=1&&/halloween|fishing|dragon|voyage|champagne/i.test(e.n||"")) out.push({ico:"clock",tone:"r",tag:left?"ends tomorrow":"ends today",title:`${e.n}: use everything`,detail:spendFor(e)||"Spend leftover event currency",open:()=>openEventSheet(e)}); });
  if(typeof vPlanAll==="function"){ const A=vPlanAll(); A.picked.forEach(p=>{ const by=vBuyBy(p.d); if(by){ const d=Math.round((new Date(by+"T00:00:00")-new Date(today+"T00:00:00"))/864e5); if(d<=2) out.push({ico:"cart",tone:"y",tag:d<=0?"buy today":`buy by ${new Date(by+"T00:00:00").toLocaleDateString(undefined,{day:"numeric",month:"short"})}`,title:vShort(p),detail:p.pay==="stars"?`${fmt(p.starCost)} ⭐`:`A$${p.d.a.toFixed(2)}`,open:()=>setTab("Shop","Paid")}); } }); }
  if(typeof resEnds==="function"){ const e=resEnds(), c=(state.research||{}).current; if(e&&c&&c.n&&e<=new Date()) out.push({ico:"flask",tone:"g",tag:"research done",title:"Start the next research",detail:`${c.n} finished`,open:()=>{ setTab("Town","Research"); setTimeout(openResCurrentSheet,150); }}); }
  const bc=state.bagCheck||{}, bd=bc.d?Math.round((new Date(fcToday())-new Date(bc.d))/864e5):99; if(bd>2) out.push({ico:"bag",tone:"",tag:bd>30?"never checked":`${bd} days old`,title:"Update your bag",detail:"So the plan uses today's numbers",open:()=>{ const b=$("#bagCheck"); if(b) b.scrollIntoView({behavior:"smooth",block:"center"}); }});
  const blk=S.find(g=>!g.ready); if(blk) out.push({ico:"lock",tone:"",tag:"working towards",title:blk.title,detail:blk.detail,open:()=>goToSection(null,blk.key,blk.open)});
  return out.slice(0,6); }
function renderPlanToday(){ const box=$("#doNext"); if(!box) return; const P=planToday(), all=!!state.ui.planAll, L=all?P:P.slice(0,4);
  box.innerHTML=L.map((x,i)=>`<div class="pstep"><button class="pgo" data-i="${i}">${ico(x.ico,x.tone)}<span class="dt"><b>${x.title}</b><span>${x.detail}</span><em class="ptag ${x.tone}">${esc(x.tag)}</em></span></button>${x.apply?`<button class="pdone" data-i="${i}">Done</button>`:'<span class="chev" aria-hidden="true">›</span>'}</div>`).join("")||'<p class="dnote">Nothing urgent — everything is on track ✓</p>';
  bindAll(box,".pgo",b=>{ const x=L[+b.dataset.i]; if(x.open) x.open(); });
  bindAll(box,".pdone",b=>{ const x=L[+b.dataset.i], snap=JSON.stringify(state); x.apply(); afterEdit(); toast("Done: "+x.title.replace(/<[^>]+>/g,""),snap); });
  const mb=$("#doMore"); if(mb){ mb.hidden=P.length<=4; mb.textContent=all?"Less ›":`All ${P.length} ›`; mb.onclick=()=>{ state.ui.planAll=!all; scheduleSave(); renderPlanToday(); }; } }
