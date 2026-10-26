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
  box.innerHTML=`<div class="rowb"><b style="font-size:16px">Bag check</b>${days==null?'<span class="tag warn">not checked yet</span>':days===0?'<span class="tag ok">checked today ✓</span>':`<span class="tag ${days>2?"warn":"plain"}">checked ${days} day${days>1?"s":""} ago</span>`}</div>
    <p class="muted" style="margin:4px 0 8px">Type what the game shows. Arrows = change since your last check.</p>
    <div class="bcgrid">${BAG_KEYS.map(([k,l])=>`<label class="bccell"><span>${l}</span><input inputmode="numeric" data-k="${k}" value="${bagVal(k)}"><em data-ch="${k}">${ch(k)}</em></label>`).join("")}</div>
    <div class="rowb mt"><span class="faint">Everything else: Update everything</span><button class="btn primary sm" id="bcSave">Save ✓</button></div>`;
  box.querySelectorAll("input").forEach(x=>{ x.onfocus=()=>x.select(); x.onkeydown=e=>{ if(e.key==="Enter") x.blur(); };
    x.onchange=()=>{ if(!/\d/.test(x.value)){ x.value=bagVal(x.dataset.k); return; } const b=BAG_KEYS.find(y=>y[0]===x.dataset.k); b[2]()[b[3]]=Math.max(0,Math.round(num(x.value))); box.querySelector(`[data-ch="${x.dataset.k}"]`).innerHTML=ch(x.dataset.k); scheduleSave(); }; });
  on("bcSave",()=>{ state.bagCheck={d:fcToday(),v:Object.fromEntries(BAG_KEYS.map(([k])=>[k,bagVal(k)]))}; afterEdit(); toast("Bag saved"); });
}

/* ---------- Home: timelines ---------- */
function renderTimelines(){
  const box=$("#timelines"); if(!box) return;
  const N=blockerNeeds(), rows=[["threads","Threads"],["mg","Mythic Gear"],["designs","Designs"],["gen","General shards"],["mith","Mithril"]].filter(([k])=>N[k]);
  const days=incomeDays("fh");
  box.innerHTML=`<div class="rowb"><b style="font-size:16px">How long until…</b><span class="faint">${days<7?`tracking ${days}/7 days`:"from what you collect"}</span></div>`+
    rows.map(([k,l])=>{ const n=N[k], r=incomeRate(k), d=n.short&&r?Math.ceil(n.short/r):null;
      const when=!n.short?'<b class="ok">ready ✓</b>':r==null?'<span class="faint">tracking…</span>':r<=0?'<b class="bad">none coming in</b>':`<b class="${d<=7?"ok":d<=28?"warn":"bad"}">~${d<7?d+" day"+(d>1?"s":""):Math.round(d/7)+" week"+(Math.round(d/7)>1?"s":"")}</b>`;
      return `<div class="tlrow"><div class="rowb"><span>${esc(n.what)}</span>${when}</div>${barH(pc(n.have,n.need),n.short?"":"ok")}<span class="faint" style="font-size:13px">${fmt(n.have)} / ${fmt(n.need)}${r!=null?` · +${r>=1?fmt(Math.round(r)):r.toFixed(1)} a day`:""}</span></div>`; }).join("")+
    (days<7?`<p class="faint" style="margin:6px 0 0;font-size:13.5px">Timelines appear after a week of bag updates — every rise counts as income.</p>`:"");
}

/* ---------- Shop guide: live advice from the bag ---------- */
const ITEM_RES=[[/Custom Mythic Hero Gear chest/i,"mg",1],[/Lucky Hero Gear/i,"mg",2],[/Mithril/i,"mith",1],[/Gilded Threads/i,"threads",1],[/Charm Design/i,"designs",1],[/General Mythic shard/i,"gen",1],[/Forgehammer/i,"fh",1]];
const RES_LABEL={mg:"Mythic Gear",mith:"Mithril",threads:"Threads",designs:"Designs",gen:"General shards",fh:"Hammers"};
function liveBuys(shop,N){
  N=N||blockerNeeds();
  const L=(shop.items||[]).filter(it=>typeof it[1]==="number").map(it=>{ const m=ITEM_RES.find(([re])=>re.test(it[0])); return m?{it,k:m[1],sub:m[2]}:null; }).filter(Boolean);
  const order=["mg","threads","designs","mith","gen","fh"];
  const need=L.filter(x=>N[x.k]&&N[x.k].short>0).sort((a,b)=>order.indexOf(a.k)-order.indexOf(b.k)||a.sub-b.sub||a.it[1]-b.it[1]);
  const covered=L.filter(x=>!(N[x.k]&&N[x.k].short>0));
  return {need,covered,N}; }
function liveBuysH(shop,N){
  const {need,covered}=liveBuys(shop,N); if(!need.length&&!covered.length) return "";
  return `<div class="sglive"><b>Right now</b> <span class="faint">from your bag</span><ol>${need.slice(0,4).map(x=>`<li><b>${esc(x.it[0])}</b> — ${fmt(x.it[1])}${x.it[2]!=null?` · limit ${typeof x.it[2]==="number"?fmt(x.it[2]):esc(x.it[2])}`:""}<br><span class="faint">${esc(RES_LABEL[x.k])} short ${fmt(N[x.k].short)} — ${esc(N[x.k].what)}</span></li>`).join("")}</ol>`+
    (covered.length?`<span class="faint">Covered for now: ${[...new Set(covered.map(x=>RES_LABEL[x.k]))].join(", ")} ✓</span>`:"")+`</div>`; }

/* ---------- Shop guide: this week planner ---------- */
function plannerH(){
  const N=blockerNeeds(), find=n=>SHOP_DB.find(s=>s.n===n);
  const row=(when,names)=>{ const shops=names.map(find).filter(Boolean); if(!shops.length) return "";
    const get=shops.map(s=>{ const b=liveBuys(s,N).need[0]; return b?`${s.n.replace(/ Shop.*| —.*/,"")}: ${b.it[0].replace(/ \(.*\)/,"")}`:null; }).filter(Boolean);
    return `<tr><td>${when}</td><td>${shops.map(s=>esc(s.n.replace(/ Shop$/,""))).join(" · ")}</td><td>${get.length?get.map(esc).join("<br>"):'<span class="faint">nothing you need</span>'}</td></tr>`; };
  const th=["Alliance Championship Shop","Swordland Shop","Tidal Shop"].map(find).filter(Boolean).reduce((t,s)=>{ const it=s.items.find(i=>/Gilded Threads/.test(i[0])); return t+(it?num(it[2])/(/14/.test(s.when)?2:1):0); },0);
  return `<details class="fold mt" ${state.ui.planOpen!==false?"open":""} id="sgPlan"><summary><span class="grow">This week <small class="faint" style="font-weight:500">every shop refresh</small></span></summary><div class="fbody">
    <table class="gtable"><thead><tr><th>When</th><th>Shops</th><th>Buy for your blockers</th></tr></thead><tbody>
    ${row("Weekly",["Arena Shop","Trial Shop","Alliance Championship Shop","KvK Shop (Kingdom of Power)","Alliance Shop — weekly"])}
    ${row("Every 2 weeks",["Swordland Shop","Tidal Shop"])}
    ${row("Daily",["Alliance Shop — daily"])}</tbody></table>
    <p class="muted" style="margin:8px 0 0">Guaranteed Threads: about <b>${fmt(Math.round(th))}</b> a week if you clear the limits (AC 100 weekly, Swordland 50 + Tidal 25 every 2 weeks).</p></div></details>`; }

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

/* ---------- Heroes → Overview: weekly report ---------- */
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
    <table class="gtable mt"><tbody>
      <tr><td>Hero stars</td><td class="mono">${sgn(dlt("stars"))}</td></tr>
      <tr><td>Lethality / Health</td><td class="mono">${sgn(dlt("leth"))} / ${sgn(dlt("hp"))}</td></tr>
      ${areas.map(([n,v])=>`<tr><td>${esc(n)} power</td><td class="mono">${sgn(v)}</td></tr>`).join("")}
      <tr><td>Spent this month</td><td class="mono">${mo?`A$${num(mo.spent).toFixed(2)}`:"—"}</td></tr></tbody></table>
    ${done.length?`<p style="margin:10px 0 4px"><b>Done this week</b></p><ul class="wdone">${done.slice(-8).reverse().map(x=>`<li>${esc(x.t)} <span class="faint">${esc(fd(x.d))}</span></li>`).join("")}</ul>`:'<p class="faint" style="margin:10px 0 0">Upgrades you tick off with ✓ Done show up here.</p>'}
    ${up.length?`<p style="margin:10px 0 4px"><b>Coming next week</b></p><ul class="wdone">${up.map(x=>`<li>${esc(x.e.n)} <span class="faint">${whenTxt(x.o)}</span></li>`).join("")}</ul>`:""}</div>`;
}
