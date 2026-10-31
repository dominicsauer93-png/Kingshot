"use strict";
/* =====================================================================
   EXTRAS — bag check, income tracking + timelines, live shop advice,
   weekly planner, event battle card, weekly report.
   ===================================================================== */

/* ---------- the 6 numbers every plan runs on ---------- */
const BAG_KEYS=[
  ["mg","Mythic Gear",()=>state.heroGear.have,"mg"],
  ["mith","Mithril",()=>state.heroGear.have,"mith"],
  ["threads","Threads",()=>state.govGear.have||(state.govGear.have={}),"threads"],
  ["designs","Designs",()=>state.charms.have||(state.charms.have={}),"designs"],
  ["fh","Hammers",()=>state.heroGear.have,"fh"],
  ["gen","Gen. shards",()=>state,"shardGeneral"]];
// the rest of the bag, one tap away (no change tracking — just keeps every number in one place)
const BAG_MORE=[["Truegold",()=>state.tg,"have"],["Tempered TG",()=>state.tg,"ttgHave"],["TG Dust",()=>state.dust,"current"],["Gold",()=>state.dust,"gold"],
  ["Lucky chests",()=>hgChests(),"lucky"],["Custom Mythic chests",()=>hgChests(),"custom"],["Satin",()=>state.govGear.have,"satin"],["Vision",()=>state.govGear.have,"vision"],["Guides",()=>state.charms.have,"guides"],["Gear XP",()=>state.heroGear.have,"xp"],["Pet food",()=>state.pets.have||(state.pets.have={}),"food"]];
/* ---------- hero gear chests: unopened Lucky / Custom Mythic chests, and your real Mythic drop rate ---------- */
const hgChests=()=>state.heroGear.chests||(state.heroGear.chests={lucky:0,custom:0,log:[]});
function mythicRate(){ const L=hgChests().log||[], o=L.reduce((t,x)=>t+num(x.opened),0), m=L.reduce((t,x)=>t+num(x.mythic),0);
  return o>=20?{r:m/o,learned:true,o,m}:{r:1/40,learned:false,o,m}; } // until 20 are logged, assume ~1 Mythic per 40 Lucky chests
function openChestSheet(){ const C=hgChests(), H=state.heroGear.have;
  openSheet({title:"Hero gear chests",sub:"Chests waiting to be opened, and what came out.",build(f){
    f.appendChild(frow(fld("Lucky Hero Gear chests",{type:"num",value:C.lucky,get:()=>C.lucky,set:v=>C.lucky=v}),fld("Custom Mythic chests",{type:"num",value:C.custom,get:()=>C.custom,set:v=>C.custom=v})));
    const inf=infoBox(); f.appendChild(inf);
    const op=document.createElement("div"); op.className="card mt";
    op.innerHTML=`<b>I opened Lucky chests</b><div class="frow mt"><label class="f"><span>How many opened</span><input id="chO" inputmode="numeric"></label><label class="f"><span>Mythic Gear got</span><input id="chM" inputmode="numeric"></label></div><button class="btn primary sm mt" id="chLog">Save — adds the Mythic to your bag</button>`;
    f.appendChild(op);
    const cu=document.createElement("button"); cu.className="btn mt"; cu.textContent="I opened 1 Custom Mythic chest (+1 Mythic Gear)"; f.appendChild(cu);
    const rf=()=>{ const R=mythicRate(), nx=blockerNeeds().mg;
      inf.innerHTML=`Expected from your Lucky chests: <b>~${(num(C.lucky)*R.r).toFixed(1)} Mythic Gear</b> <span class="faint">(${R.learned?`your rate: 1 in ${Math.round(1/R.r)} from ${fmt(R.o)} opened`:`assumed 1 in 40 — log ${20-R.o} more to learn your real rate`})</span>`+
        (nx?`<br>Next Mythic need: <b>${esc(nx.what)}</b>${nx.short?` — ${nx.short} short`:" ✓"}`:""); };
    op.querySelector("#chLog").onclick=()=>{ const o=Math.round(num(op.querySelector("#chO").value)), m=Math.round(num(op.querySelector("#chM").value)); if(!o) return;
      const snap=JSON.stringify(state); (C.log||(C.log=[])).push({d:gameToday(),opened:o,mythic:m}); C.lucky=Math.max(0,num(C.lucky)-o); H.mg=num(H.mg)+m; afterEdit(); toast(`Logged ${o} chests → ${m} Mythic`,snap); openChestSheet(); }; // reopen so the chest counts show the new numbers
    cu.onclick=()=>{ if(num(C.custom)<1) return; const snap=JSON.stringify(state); C.custom=num(C.custom)-1; H.mg=num(H.mg)+1; afterEdit(); toast("Custom Mythic chest opened (+1 Mythic)",snap); openChestSheet(); };
    rf(); return rf; }}); }
const bagVal=k=>{ const b=BAG_KEYS.find(x=>x[0]===k); return num(b[2]()[b[3]]); };

/* ---------- income: every rise in the bag counts (spending doesn't), per month ---------- */
function trackIncome(){
  const I=state.income||(state.income={}), m=gameToday().slice(0,7);
  BAG_KEYS.forEach(([k])=>{ const h=bagVal(k), r=I[k]||(I[k]={since:gameToday(),got:{}});
    if(r.seen!=null&&h>num(r.seen)) r.got[m]=num(r.got[m])+h-num(r.seen);
    r.seen=h; }); }
// average gained per day since tracking started (null until a week of data)
function incomeRate(k){ const r=state.income&&state.income[k]; if(!r) return null;
  const days=Math.round((new Date(gameToday())-new Date(r.since))/864e5); if(days<7) return null;
  return Object.values(r.got).reduce((t,v)=>t+num(v),0)/days; }
function incomeDays(k){ const r=state.income&&state.income[k]; return r?Math.round((new Date(gameToday())-new Date(r.since))/864e5):0; }

/* ---------- what you need next, per blocker (shared by timelines + live shop advice) ---------- */
function blockerNeeds(){
  const out={};
  const hp=hgPlanLeft(), H=state.heroGear.have||{};
  const top=hp.length?hp[0]:null, prio=top?null:hgPriority(state.heroGear.rows||[]), st=prio&&prio[0]?hgState(prio[0]):null;
  const req=top?{mg:num(top.mg),mith:num(top.mith),fh:num(top.fh)}:(st&&st.req)||{};
  const label=top?`${top.type} ${top.slot}`:prio&&prio[0]?`${prio[0].type} ${slotName(prio[0].slot)}`:"";
  if(req.mg) out.mg={need:req.mg,what:`${label} needs ${req.mg} Mythic`};
  if(req.mith) out.mith={need:req.mith,what:`${label} needs ${req.mith} Mithril`};
  if(req.fh) out.fh={need:req.fh,what:`${label} needs ${req.fh} hammers`};
  const gv=govNextStep(); if(gv) out.threads={need:gv.need.t,what:`${gv.p.name} → ${(GOV_TIERS[gv.to]||[""])[0]} needs ${gv.need.t} Threads`};
  const cn=charmNextList(3), cd=cn.reduce((t,r)=>t+CHARM_COSTS[num(r.lvl)][1],0); if(cd) out.designs={need:cd,what:`next ${cn.length} charm levels need ${fmt(cd)} Designs`};
  const ava=(state.goldShards||[]).find(r=>r.n==="Ava"); if(ava&&hasStars(ava)&&num(ava.pos)<SHARD_MAX) out.gen={need:Math.max(0,SHARD_LEAF[num(ava.pos)]-num(ava.have)),what:`Ava's next star needs ${SHARD_LEAF[num(ava.pos)]} shards`};
  Object.entries(out).forEach(([k,o])=>{ o.have=bagVal(k); o.short=Math.max(0,o.need-o.have); });
  return out; }

/* ---------- Home: bag check ---------- */
function renderBagCheck(){
  const box=$("#bagCheck"); if(!box) return;
  const bc=state.bagCheck||{}, prev=bc.v||{}, days=bc.d?Math.round((new Date(fcToday())-new Date(bc.d))/864e5):null;
  const ch=k=>{ if(prev[k]==null) return '<span class="faint">—</span>'; const d=bagVal(k)-num(prev[k]); return d>0?`<span class="ok">▲ ${fmt(d)}</span>`:d<0?`<span class="bad">▼ ${fmt(-d)}</span>`:'<span class="faint">same</span>'; };
  box.innerHTML=`<div class="dch"><h3>My bag</h3>${days==null?'<span class="pill a">not checked yet</span>':days===0?'<span class="pill g">checked today</span>':`<span class="pill${days>2?" a":""}">checked ${days} day${days>1?"s":""} ago</span>`}<button class="link" id="bcSave">Save ✓</button></div>
    <div class="bcgrid">${BAG_KEYS.map(([k,l])=>`<label class="bccell"><span>${l}</span><input inputmode="numeric" data-k="${k}" value="${bagVal(k)}"><em data-ch="${k}">${ch(k)}</em></label>`).join("")}</div>
    <details class="dfold" id="bcMore"${state.ui.bcMore?" open":""}><summary>More numbers ›</summary><div class="bcgrid">${BAG_MORE.map(([l,o,k],i)=>`<label class="bccell"><span>${l}</span><input inputmode="numeric" data-m="${i}" value="${num(o()[k])}"></label>`).join("")}</div></details>
    ${(()=>{ const st=staleShops(); return st.length?`<button class="drow" id="bcStale" style="width:100%;background:none;border-left:0;border-right:0;border-bottom:0;color:var(--text)"><span class="dt"><b>📸 ${st.length} shop${st.length>1?"s":""} not checked for ${STALE_DAYS}+ days</b></span><span class="chev">›</span></button>`:""; })()}`;
  box.querySelectorAll("[data-m]").forEach(x=>{ x.onfocus=()=>x.select(); x.onkeydown=e=>{ if(e.key==="Enter") x.blur(); };
    x.onchange=()=>{ const [,o,k]=BAG_MORE[+x.dataset.m]; if(!/\d/.test(x.value)){ x.value=num(o()[k]); return; } o()[k]=Math.max(0,Math.round(num(x.value))); scheduleSave(); }; });
  const bm=$("#bcMore"); bm.ontoggle=()=>{ state.ui.bcMore=bm.open; scheduleSave(); };
  on("bcStale",()=>setTab("Shop","Free shops"));
  box.querySelectorAll("input").forEach(x=>{ x.onfocus=()=>x.select(); x.onkeydown=e=>{ if(e.key==="Enter") x.blur(); };
    x.onchange=()=>{ if(!/\d/.test(x.value)){ x.value=bagVal(x.dataset.k); return; } const b=BAG_KEYS.find(y=>y[0]===x.dataset.k); b[2]()[b[3]]=Math.max(0,Math.round(num(x.value))); box.querySelector(`[data-ch="${x.dataset.k}"]`).innerHTML=ch(x.dataset.k); scheduleSave(); }; });
  on("bcSave",()=>{ state.bagCheck={d:fcToday(),v:Object.fromEntries(BAG_KEYS.map(([k])=>[k,bagVal(k)]))}; afterEdit(); toast("Bag saved"); });
}

/* ---------- Home: what's out of date — the console can't read the game, so it says what to refresh ---------- */
function freshList(){ const out=[], bc=state.bagCheck||{}, bd=bc.d?Math.round((new Date(fcToday())-new Date(bc.d))/864e5):null;
  if(bd==null||bd>2) out.push({t:bd==null?"Bag numbers never checked":`Bag numbers checked ${bd} days ago`,go:()=>{ const b=$("#bagCheck"); if(b){ b.scrollIntoView({behavior:"smooth",block:"center"}); const i=b.querySelector("input"); if(i) i.focus(); } }});
  const st=staleShops(); if(st.length) out.push({t:`${st.length} shop price list${st.length>1?"s are":" is"} ${STALE_DAYS}+ days old`,go:()=>openCamSheet(true)});
  const vd=VALUE_DB.filter(d=>vOnNow(d)&&staleDays(d.seen)>STALE_DAYS); if(vd.length) out.push({t:`${vd.length} pack price${vd.length>1?"s":""} not seen for ${STALE_DAYS}+ days`,go:()=>setTab("Shop","Paid")});
  (state.packs||[]).filter(p=>p.d&&PACK_DAYS[p.kind]&&!p.bought&&!p.resetDay).forEach(p=>out.push({t:`${p.t}: set the date you bought it`,go:()=>openPackSheet(p)}));
  if(syncCfg.owner&&loadTok()&&!syncCfg.device) out.push({t:"Name this device (PC, Phone…) for sync",go:()=>{ setTab("Data","Sync"); setTimeout(()=>{ const d=$("#scDev"); if(d){ d.scrollIntoView({block:"center"}); d.focus(); } },150); }});
  if(state.stars==null) out.push({t:"Enter your Kingdom Stars balance",go:()=>{ setTab("Shop","Paid"); setTimeout(()=>{ const b=$("#bvStars"); if(b) b.click(); },150); }});
  { const e=typeof resEnds==="function"?resEnds():null, c=(state.research||{}).current; if(e&&c&&c.n&&e<=new Date()) out.unshift({t:`Research done: ${c.n} — start the next one`,go:()=>{ setTab("Town","Research"); setTimeout(openResCurrentSheet,150); }}); }
  (state.events||[]).filter(e=>e.guess).forEach(e=>out.push({t:`${e.n}: dates are a guess — confirm them`,go:()=>openEventSheet(e)}));
  (state.events||[]).filter(e=>e.endOpen&&activeOcc(e)&&activeOcc(e).day>14).forEach(e=>out.push({t:`${e.n}: still no end date`,go:()=>openEventSheet(e)}));
  return out; }
function renderFresh(){ const box=$("#fresh"); if(!box) return; const L=freshList(); box.hidden=!L.length; if(!L.length){ box.innerHTML=""; return; }
  const all=!!state.ui.freshAll, show=all?L:L.slice(0,2);
  box.innerHTML=`<div class="card dcard fresh"><div class="dch"><h3>Needs a check</h3><span class="pill a">${L.length}</span></div>${show.map((x,i)=>`<button class="drow frow2" data-i="${i}"><span class="dt"><b>${esc(x.t)}</b></span><span class="chev" aria-hidden="true">›</span></button>`).join("")}${L.length>2?`<button class="drow" id="freshMore"><span class="dt"><span>${all?"Show less":`+${L.length-2} more`}</span></span></button>`:""}</div>`;
  bindAll(box,".frow2",b=>show[+b.dataset.i].go()); on("freshMore",()=>{ state.ui.freshAll=!all; scheduleSave(); renderFresh(); }); }

/* ---------- Home: timelines ---------- */
function renderTimelines(){
  const box=$("#timelines"); if(!box) return;
  const N=blockerNeeds(), rows=[["threads","Threads"],["mg","Mythic Gear"],["designs","Designs"],["gen","General shards"],["mith","Mithril"]].filter(([k])=>N[k]);
  const days=incomeDays("fh");
  box.innerHTML=(days<7?`<p class="faint" style="margin:0 0 6px;font-size:13.5px">Learning your income — ${days}/7 days of bag updates.</p>`:"")+
    rows.map(([k,l])=>{ const n=N[k], r=incomeRate(k), d=n.short&&r?Math.ceil(n.short/r):null;
      const when=!n.short?'<b class="ok">ready ✓</b>':r==null?'<span class="faint">tracking…</span>':r<=0?'<b class="bad">none coming in</b>':`<b class="${d<=7?"ok":d<=28?"warn":"bad"}">~${d<7?d+" day"+(d>1?"s":""):Math.round(d/7)+" week"+(Math.round(d/7)>1?"s":"")}</b>`;
      return `<div class="tlrow"><div class="rowb"><span>${esc(n.what)}</span>${when}</div>${barH(pc(n.have,n.need),n.short?"":"ok")}<span class="faint" style="font-size:13px">${fmt(n.have)} / ${fmt(n.need)}${r!=null?` · +${r>=1?fmt(Math.round(r)):r.toFixed(1)} a day`:""}</span></div>`; }).join("");
}

/* ---------- Shop guide: live advice from the bag ---------- */
const ITEM_RES=[[/Custom Mythic Hero Gear chest/i,"mg",1],[/Lucky Hero Gear/i,"mg",2],[/Mithril/i,"mith",1],[/Gilded Threads/i,"threads",1],[/Charm Design/i,"designs",1],[/General Mythic shard/i,"gen",1],[/Forgehammer/i,"fh",1]];
const RES_LABEL={mg:"Mythic Gear",mith:"Mithril",threads:"Threads",designs:"Designs",gen:"General shards",fh:"Hammers"};
function liveBuys(shop,N){
  N=N||blockerNeeds();
  const L=(shop.items||[]).filter(it=>typeof it[1]==="number").map(it=>{ const m=ITEM_RES.find(([re])=>re.test(it[0])); return m?{it,k:m[1],sub:m[2]}:null; }).filter(Boolean);
  // Mithril, General shards and Lucky chests are far cheaper in some shops — skip them where they cost over 2× the cheapest
  const cheap={}; SHOP_DB.forEach(sh=>(sh.items||[]).forEach(it=>{ const m=typeof it[1]==="number"&&ITEM_RES.find(([re])=>re.test(it[0])); if(m) cheap[m[1]+m[2]]=Math.min(cheap[m[1]+m[2]]||Infinity,it[1]); }));
  const pricey=x=>["mith","gen","mg"].includes(x.k)&&x.it[1]>2*cheap[x.k+x.sub];
  const order=["mg","threads","designs","mith","gen","fh"];
  const need=L.filter(x=>N[x.k]&&N[x.k].short>0&&!pricey(x)).sort((a,b)=>order.indexOf(a.k)-order.indexOf(b.k)||a.sub-b.sub||a.it[1]-b.it[1]);
  const covered=L.filter(x=>!(N[x.k]&&N[x.k].short>0));
  return {need,covered,N}; }
function liveBuysH(shop,N){
  const {need,covered}=liveBuys(shop,N); if(!need.length&&!covered.length) return "";
  return `<div class="sglive"><b>Right now</b> <span class="faint">from your bag</span><ol>${need.slice(0,4).map(x=>`<li><b>${esc(x.it[0])}</b> — ${fmt(x.it[1])}${x.it[2]!=null?` · limit ${typeof x.it[2]==="number"?fmt(x.it[2]):esc(x.it[2])}`:""}<br><span class="faint">${esc(RES_LABEL[x.k])} short ${fmt(N[x.k].short)} — ${esc(N[x.k].what)}</span></li>`).join("")}</ol>`+
    (covered.length?`<span class="faint">Covered for now: ${[...new Set(covered.map(x=>RES_LABEL[x.k]))].join(", ")} ✓</span>`:"")+`</div>`; }

/* ---------- Event battle card (full screen while the event runs) ---------- */
const BATTLE=[[/eternity'?s reach/i,{mins:30,every:60,target:20,chips:["R","R","L","L","R"],
  tips:["Skill order (rows 1–5)","Skip the Peak at 23 min","Save Skill 5 for Vein Outbursts","Recall the nearest common-vein march when the ring hits 0"]}]];
const battleFor=e=>{ const b=BATTLE.find(([re])=>re.test((e&&e.n)||"")); return b?b[1]:null; };
let battleTimer=null;
function beep(){ try{ const a=new (window.AudioContext||window.webkitAudioContext)(), o=a.createOscillator(), g=a.createGain(); o.frequency.value=880; o.connect(g); g.connect(a.destination); g.gain.value=.2; o.start(); o.stop(a.currentTime+.25); }catch(e){} try{ navigator.vibrate&&navigator.vibrate(300); }catch(e){} }
function openBattle(e){
  const cfg=battleFor(e); if(!cfg) return;
  const key=(e.n||"")+"|"+gameToday(); if(!state.battle||state.battle.key!==key) state.battle={key,cnt:0,start:null,last:null};
  const B=state.battle, ov=document.createElement("div"); ov.className="battle"; document.body.appendChild(ov);
  const lastRun=String(e.note||"").split("\n").find(l=>/^Last run/i.test(l))||"";
  ov.innerHTML=`<div class="bt-in"><div class="rowb"><b style="font-size:18px">⚔ ${esc(e.n)}</b><button class="btn sm ghost" id="btClose">Close</button></div>
    <div class="bt-big" id="btLeft">${cfg.mins}:00</div><div class="faint" style="text-align:center">left in the session</div>
    <div class="bt-ring"><svg viewBox="0 0 170 170"><circle cx="85" cy="85" r="74" class="bt-track"/><circle cx="85" cy="85" r="74" class="bt-arc" id="btArc" stroke-dasharray="465" stroke-dashoffset="0"/></svg><div class="bt-mid"><b id="btRec">1:00</b><span>next recall</span></div></div>
    <div class="rowb"><span>Recalls</span><b><span id="btCnt">${B.cnt}</span> / ${cfg.target} <span class="faint">top 10 pace</span></b></div><div id="btBar"></div>
    <div class="bt-chips">${cfg.chips.map(c=>`<span>${c}</span>`).join("")}</div>
    <ul class="bt-tips">${cfg.tips.map(t=>`<li>${esc(t)}</li>`).join("")}</ul>
    <div class="rowb mt"><button class="btn primary" id="btGo">${B.start?"Running":"Start"}</button><button class="btn" id="btHit">I recalled ✓</button></div>
    <button class="btn ghost sm mt" id="btDone">Finish — save to the event note</button>
    ${lastRun?`<p class="faint" style="margin:8px 0 0">${esc(lastRun)}</p>`:""}</div>`;
  const $o=s=>ov.querySelector(s), mmss=s=>`${Math.floor(s/60)}:${String(Math.max(0,s%60)).padStart(2,"0")}`;
  let buzzed=false;
  const paint=()=>{ $o("#btCnt").textContent=B.cnt; $o("#btBar").innerHTML=barH(pc(B.cnt,cfg.target),B.cnt>=cfg.target?"ok":"");
    if(!B.start) return; const now=Date.now(), left=Math.max(0,Math.round((B.start+cfg.mins*60e3-now)/1000)), since=Math.round((now-(B.last||B.start))/1000), rec=cfg.every-since;
    $o("#btLeft").textContent=mmss(left); $o("#btRec").textContent=rec>0?mmss(rec):"NOW";
    $o("#btArc").setAttribute("stroke-dashoffset",465*Math.min(1,Math.max(0,since/cfg.every)));
    ov.classList.toggle("due",rec<=0); if(rec<=0&&!buzzed){ buzzed=true; beep(); } if(rec>0) buzzed=false; };
  const run=()=>{ clearInterval(battleTimer); battleTimer=setInterval(paint,500); paint(); };
  on("btGo",()=>{ if(!B.start){ B.start=Date.now(); B.last=null; scheduleSave(); } $o("#btGo").textContent="Running"; run(); });
  on("btHit",()=>{ B.cnt++; B.last=Date.now(); scheduleSave(); paint(); });
  on("btClose",()=>{ clearInterval(battleTimer); ov.remove(); });
  on("btDone",()=>{ const line=`${gameToday()}: ${B.cnt} recalls (battle card)`; e.note=String(e.note||"").replace(/\s*$/,"")+"\n"+line; clearInterval(battleTimer); ov.remove(); afterEdit(); toast("Saved to the event note — add your rank and copper there"); });
  paint(); if(B.start) run();
}

/* ---------- Progress → Overview: weekly report ---------- */
function logDone(msg){ const L=state.doneLog||(state.doneLog=[]); L.push({d:gameToday(),t:String(msg)}); if(L.length>200) L.splice(0,L.length-200); }
function renderWeekly(){
  const box=$("#weekReport"); if(!box) return;
  const H=(state.history||[]).slice().sort((a,b)=>a.d.localeCompare(b.d)); if(H.length<2){ box.innerHTML='<div class="empty">Builds up after a few days of use.</div>'; return; }
  const last=H[H.length-1], wk=new Date(new Date(last.d)-7*864e5).toISOString().slice(0,10), first=H.filter(x=>x.d<=wk).pop()||H[0], a=first.v, b=last.v;
  const dlt=k=>num(b[k])-num(a[k]), sgn=v=>v>0?`<span class="ok">+${fmtBig(v)}</span>`:v<0?`<span class="bad">−${fmtBig(-v)}</span>`:'<span class="faint">no change</span>';
  const areas=Object.keys(b).filter(k=>k.startsWith("p:")).map(k=>[k.slice(2),dlt(k)]).filter(x=>x[1]>0).sort((x,y)=>y[1]-x[1]).slice(0,3);
  const done=(state.doneLog||[]).filter(x=>x.d>first.d);
  const up=(state.events||[]).map(e=>({e,o:nextOcc(e)})).filter(x=>x.o&&!x.o.past&&x.o.days>0&&x.o.days<=7).sort((x,y)=>x.o.days-y.o.days).slice(0,5);
  const mo=(state.packMonths||{})[gameToday().slice(0,7)];
  const spark=H.filter(x=>x.d>=first.d).map(x=>num(x.v.power)), lo=Math.min(...spark), hi=Math.max(...spark);
  box.innerHTML=`<div class="card"><div class="rowb"><b style="font-size:16px">${esc(fd(first.d))} → ${esc(fd(last.d))}</b><span>${sgn(dlt("power"))} power</span></div>
    <div class="wspark">${spark.map(v=>`<i style="height:${hi>lo?20+80*(v-lo)/(hi-lo):60}%"></i>`).join("")}</div>
    <div class="rcrows">
      <div class="rcrow"><span>Hero stars</span><b class="mono">${sgn(dlt("stars"))}</b></div>
      <div class="rcrow"><span>Lethality / Health</span><b class="mono">${sgn(dlt("leth"))} / ${sgn(dlt("hp"))}</b></div>
      ${areas.map(([n,v])=>`<div class="rcrow"><span>${esc(n)} power</span><b class="mono">${sgn(v)}</b></div>`).join("")}
      <div class="rcrow"><span>Spent this month</span><b class="mono">A$${monthSpent(gameToday().slice(0,7)).toFixed(2)}</b></div></div>
    ${done.length?`<p style="margin:10px 0 4px"><b>Done this week</b></p><ul class="wdone">${done.slice(-8).reverse().map(x=>`<li>${esc(x.t)} <span class="faint">${esc(fd(x.d))}</span></li>`).join("")}</ul>`:'<p class="faint" style="margin:10px 0 0">Upgrades you tick off with ✓ Done show up here.</p>'}
    ${up.length?`<p style="margin:10px 0 4px"><b>Coming next week</b></p><ul class="wdone">${up.map(x=>`<li>${esc(x.e.n)} <span class="faint">${whenTxt(x.o)}</span></li>`).join("")}</ul>`:""}</div>`;
}

/* ---------- report card at the top of Hero Gear, Governor and Charms (same look as the weekly report) ---------- */
function weekDelta(key){ const H=(state.history||[]).slice().sort((a,b)=>a.d.localeCompare(b.d)); if(H.length<2) return null;
  const last=H[H.length-1], wk=new Date(new Date(last.d)-7*864e5).toISOString().slice(0,10), first=H.filter(x=>x.d<=wk).pop()||H[0];
  return {d:num(last.v[key])-num(first.v[key]),spark:H.filter(x=>x.d>=first.d).map(x=>num(x.v[key])),from:first.d}; }
function reportCard(id,{title,pkey,rows,doneRe}){
  const box=$("#"+id); if(!box) return;
  const w=pkey?weekDelta(pkey):null, sp=w?w.spark:[], lo=Math.min(...sp), hi=Math.max(...sp);
  const done=(state.doneLog||[]).filter(x=>w&&x.d>w.from&&doneRe&&doneRe.test(x.t));
  const sgn=v=>v>0?`<span class="ok">+${fmtBig(v)}</span>`:v<0?`<span class="bad">−${fmtBig(-v)}</span>`:'<span class="faint">no change</span>';
  box.innerHTML=`<div class="rowb"><b style="font-size:16px">${esc(title)}</b>${w?`<span>${sgn(w.d)} power <span class="faint">this week</span></span>`:""}</div>`+
    (sp.length>1&&hi>lo?`<div class="wspark">${sp.map(v=>`<i style="height:${hi>lo?20+80*(v-lo)/(hi-lo):60}%"></i>`).join("")}</div>`:"")+
    `<div class="rcrows">${rows.filter(Boolean).map(([a,b])=>`<div class="rcrow"><span>${a}</span><b>${b}</b></div>`).join("")}</div>`+
    (done.length?`<p style="margin:10px 0 4px"><b>Done this week</b></p><ul class="wdone">${done.slice(-5).reverse().map(x=>`<li>${esc(x.t)} <span class="faint">${esc(fd(x.d))}</span></li>`).join("")}</ul>`:""); }
function renderReports(){ // power trend + done list; the tiles and next-up list below carry the numbers
  reportCard("hgReport",{title:"Hero Gear",pkey:"p:Hero Gear",doneRe:/helm|gloves|chest|boots|imbue|mastery/i,rows:[
    (()=>{ const C=hgChests(), R=mythicRate(), n=num(C.lucky)+num(C.custom); return ["Chests to open",`<button class="btn sm${n?" primary":""}" id="hgChests">${n?`${fmt(num(C.lucky))} Lucky${num(C.custom)?` + ${num(C.custom)} Custom`:""} · ~${(num(C.lucky)*R.r+num(C.custom)).toFixed(1)} Mythic`:"Add chests"} ›</button>`]; })()]});
  on("hgChests",openChestSheet);
  reportCard("govReport",{title:"Governor Gear",pkey:"p:Governor Gear",doneRe:/(gold|purple|red|blue|green) (t\d )?\d★/i,rows:[]});
  reportCard("charmReport",{title:"Charms",pkey:"p:Governor Charm",doneRe:/charm/i,rows:[]});
}

/* ---------- capture event shops: upload screenshots straight to shops/inbox, or mark "no shop" ---------- */
function camMissing(all){
  if(all) return eventShopProgress().missing.map(name=>({name,ev:null}));
  const seen=new Set(); return liveEvents().map(x=>({ev:x.e,s:eventShopFor(x.e)})).filter(x=>x.s&&!x.s.saved&&!seen.has(x.s.name)&&seen.add(x.s.name)).map(x=>({name:x.s.name,ev:x.ev})); }
async function shrinkShot(file){ // phone screenshots → max 1600 px JPEG, keeps uploads quick
  const img=await createImageBitmap(file), k=Math.min(1,1600/Math.max(img.width,img.height)), c=document.createElement("canvas");
  c.width=Math.round(img.width*k); c.height=Math.round(img.height*k); c.getContext("2d").drawImage(img,0,0,c.width,c.height);
  return c.toDataURL("image/jpeg",.85).split(",")[1]; }
async function uploadShots(files,label,onStep){
  const tok=loadTok(); if(!syncCfg.owner||!syncCfg.repo||!tok) throw new Error("Connect GitHub sync first (Settings → Sync)");
  let n=0;
  for(const f of files){ n++; onStep&&onStep(n,files.length);
    const path=`shops/inbox/${gameToday()}-${slug(label)}-${Date.now()}-${n}.jpg`;
    const r=await fetch(`https://api.github.com/repos/${encodeURIComponent(syncCfg.owner)}/${encodeURIComponent(syncCfg.repo)}/contents/${path.split("/").map(encodeURIComponent).join("/")}`,
      {method:"PUT",headers:{Authorization:`Bearer ${tok}`,Accept:"application/vnd.github+json","Content-Type":"application/json"},
       body:JSON.stringify({message:`shop screenshot: ${label}`,content:await shrinkShot(f),branch:syncCfg.branch||"main"})});
    if(!r.ok) throw new Error(`Upload failed (${r.status})`); }
  return n; }
// Settings → Sync: upload any screenshots under a label of your choice (shops/inbox, same as shop captures)
function buildUpload(){ const inp=$("#upFiles"), lab=$("#upLabel"), st=$("#upStatus"); if(!inp) return;
  inp.onchange=async()=>{ const files=[...inp.files]; if(!files.length) return; const name=(lab.value||"").trim()||"screenshot";
    try{ const n=await uploadShots(files,name,(i,t)=>st.textContent=`Uploading ${i}/${t}…`); st.innerHTML=`<span class="ok">${n} uploaded ✓ — tell Claude “uploaded”</span>`; toast(`${n} screenshot${n>1?"s":""} uploaded`); lab.value=""; }
    catch(e){ st.innerHTML=`<span class="bad">${esc(e.message)}</span>`; } inp.value=""; }; }
function openCamSheet(all){
  openSheet({title:all?"Event shops to capture":"Shops to capture now",sub:"Screenshot each shop in the game, then upload here. No shop? Mark it and it stops asking.",build(f){
    const synced=!!(syncCfg.owner&&syncCfg.repo&&loadTok());
    const draw=()=>{ f.innerHTML=""; const L=camMissing(all);
      if(!synced){ const w=infoBox(); w.innerHTML="Uploading needs GitHub sync on this device (Settings → Sync). You can still mark events as “no shop”, or send screenshots in the chat."; f.appendChild(w); }
      if(!L.length){ const d=document.createElement("div"); d.className="empty"; d.textContent="Nothing to capture ✓"; f.appendChild(d); }
      L.forEach(x=>{ const row=document.createElement("div"); row.className="camrow";
        row.innerHTML=`<div><b>${esc(x.ev?x.ev.n:x.name)}</b>${x.ev&&x.ev.n!==x.name?`<br><span class="faint">${esc(x.name)}</span>`:""}<span class="camst faint"></span></div>
          <div class="camact">${synced?`<label class="btn primary sm">📸 Upload<input type="file" accept="image/*" multiple hidden></label>`:""}<button class="btn ghost sm" data-none>No shop</button></div>`;
        const st=row.querySelector(".camst"), inp=row.querySelector("input");
        if(inp) inp.onchange=async()=>{ const files=[...inp.files]; if(!files.length) return;
          try{ const n=await uploadShots(files,x.name,(i,t)=>st.textContent=` · uploading ${i}/${t}…`); st.innerHTML=` · <span class="ok">${n} uploaded ✓</span>`; toast(`${n} screenshot${n>1?"s":""} uploaded — tell Claude “uploaded”`); }
          catch(e){ st.innerHTML=` · <span class="bad">${esc(e.message)}</span>`; } inp.value=""; };
        row.querySelector("[data-none]").onclick=()=>{ const snap=JSON.stringify(state); (state.noShop||(state.noShop=[])).push(x.name); afterEdit(); toast(`${x.name}: no shop`,snap); draw(); };
        f.appendChild(row); });
      if(synced){ const o=document.createElement("label"); o.className="btn ghost mt"; o.innerHTML=`Upload other shop / pack screenshots<input type="file" accept="image/*" multiple hidden>`;
        const st=document.createElement("p"); st.className="faint"; const i2=o.querySelector("input");
        i2.onchange=async()=>{ const files=[...i2.files]; if(!files.length) return; try{ const n=await uploadShots(files,"other",(a,t)=>st.textContent=`Uploading ${a}/${t}…`); st.innerHTML=`<span class="ok">${n} uploaded ✓</span> — tell Claude “uploaded”`; }catch(e){ st.innerHTML=`<span class="bad">${esc(e.message)}</span>`; } i2.value=""; };
        f.appendChild(o); f.appendChild(st); }
      const nb=state.noShop||[]; if(nb.length){ const p=document.createElement("p"); p.className="faint mt"; p.innerHTML=`Marked no shop: ${nb.map(esc).join(", ")} <button class="btn ghost sm" id="camUndoAll">Clear</button>`; f.appendChild(p);
        p.querySelector("#camUndoAll").onclick=()=>{ state.noShop=[]; afterEdit(); draw(); }; } };
    draw(); }});
}
