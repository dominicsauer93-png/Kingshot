"use strict";
/* =====================================================================
   BASE
   ===================================================================== */
function renderBase(){ renderResearch(); renderT11(); renderTroops(); renderBuildings(); renderRes(); }
function phaseTotals(list){ let gold=0,res=0,stone=0,iron=0,days=0; (list||[]).forEach(nd=>{ const k=nodeResKey(nd); if(!k) return; const R=NODE_RES[k], mx=nd.max||12; for(let i=Math.max(0,nd.cur);i<mx;i++){ if(R.gold[i]!=null){ gold+=R.gold[i]; res+=R.res[i]; stone+=R.stone[i]; iron+=R.iron[i]; days+=R.days[i]; } } }); return {gold,res,stone,iron,days}; }
function nodeRowsH(list,key){
  return `<div class="nodes">`+list.map(nd=>{ const mx=nd.max||12, done=nd.cur>=mx, idx=state[key].indexOf(nd);
    return `<div class="node"><span class="nn">${esc(nd.name.replace(/^Truegold /,""))}</span>
      <span class="stepper" role="group" aria-label="${esc(nd.name)} level"><button data-k="${key}" data-i="${idx}" data-d="-1" ${nd.cur<=0?"disabled":""} aria-label="Lower ${esc(nd.name)}">−</button><output>${nd.cur}<small>/${mx}</small></output><button data-k="${key}" data-i="${idx}" data-d="1" ${done?"disabled":""} aria-label="Raise ${esc(nd.name)}">+</button></span>
      ${barH(pc(nd.cur,mx),done?"ok":"")}<span class="nc ${done?"ok":""}">${done?"done ✓":fmt(nodeRem(nd))+" dust"}</span></div>`; }).join("")+`</div>`;
}
function laterH(list,key){
  const items=sortTree(list,key).filter(isLaterNode); if(!items.length) return "";
  const u=unlockedCount(), d=items.reduce((s,n)=>s+nodeRem(n),0);
  if(!state.ui.laterOpen) state.ui.laterOpen={};
  return `<details class="fold mt" data-later="${key}" ${state.ui.laterOpen[key]?"open":""}><summary><span class="grow">After unlock <span class="faint" style="font-weight:500">· Healing, Aid, Training</span><br><span class="faint" style="font-weight:500;font-size:14px">${u>=3?"All 3 troop types unlocked — go ahead":`Start once all 3 troop types are unlocked (${u}/3) · not in Dust needed`}</span></span><span class="mono faint">${d>0?fmt(d)+" dust":"done ✓"}</span></summary><div class="fbody">${nodeRowsH(items,key)}</div></details>`;
}
let stepFocus=null;
function renderT11(){
  const act=activePhase(), tgt=computeTarget(), cur=num(state.dust.current), gold=num(state.dust.gold), gT=goldTarget();
  if(!state.ui.t11Open) state.ui.t11Open={};
  const open=PHASES.filter(ph=>phaseRem(ph)>0&&ph!==act), done=PHASES.filter(ph=>phaseRem(ph)<=0&&ph!==act);
  const core=ph=>sortTree(coreNodes(state[ph.k]),ph.k);
  const tot=ph=>{ const t=phaseTotals(coreNodes(state[ph.k])); return `<div class="kv mt"><span>Dust <b class="gold">${fmt(phaseRem(ph))}</b></span><span>Gold <b>${fmtBig(t.gold)}</b></span><span>Research <b>~${Math.round(t.days)}d</b></span><span>Bread <b>${fmtBig(t.res)}</b></span><span>Wood <b>${fmtBig(t.res)}</b></span><span>Stone <b>${fmtBig(t.stone)}</b></span><span>Iron <b>${fmtBig(t.iron)}</b></span></div>`; };
  const gap=Math.max(0,tgt-cur);
  // compact: what's left on the active troop type, ranked; finished nodes on one line; everything else folded
  const C=core(act), left=C.filter(nd=>nd.cur<(nd.max||12)), fin=C.filter(nd=>nd.cur>=(nd.max||12));
  let html=`<div class="card dcard"><div class="dch"><h3>T11 ${act.n}</h3>${tgt>0?(gap>0?`<span class="pill a">${fmt(gap)} dust to go</span>`:'<span class="pill g">dust gate met</span>'):'<span class="pill g">unlocked ✓</span>'}</div>`+
    left.map((nd,i)=>{ const mx=nd.max||12; return `<button class="drow t11n" data-k="${act.k}" data-i="${state[act.k].indexOf(nd)}"><span class="dn${i===0?" go":""}">${i+1}</span><span class="dt"><b>${esc(nd.name.replace(/^Truegold /,""))}</b><span>${nd.cur}/${mx}</span><span class="pbar"><i style="width:${pc(nd.cur,mx)}%"></i></span></span><span class="dv">${fmt(nodeRem(nd))}<small>dust</small></span></button>`; }).join("")+
    (fin.length?`<div class="drow"><span class="dt"><span>${fin.map(nd=>`${esc(nd.name.replace(/^Truegold /,"").replace(/ \(.*\)/,""))} ${nd.cur}/${nd.max||12} ✓`).join(" · ")}</span></span></div>`:"")+
    `<button class="drow" id="t11Gold"><span class="dt"><b>Gold</b><span>${gold<gT?`<span class="bad">${fmtBig(gT-gold)} short</span> of ${fmtBig(gT)}`:'<span class="ok">enough ✓</span>'}</span></span><span class="dv">${fmtBig(gold)}</span></button></div>`;
  html+=`<details class="card dcard dfold mt" id="t11More"${state.ui.t11More?" open":""}><summary class="dch"><h3>More T11</h3><span class="faint" style="font-size:12.5px">${[...open,...done].map(ph=>ph.n).join(", ")}, after unlock ›</span></summary><div style="padding:0 14px 12px">${tot(act)}${laterH(state[act.k],act.k)}`;
  [...open,...done].forEach(ph=>{ const isDone=phaseRem(ph)<=0;
    html+=`<details class="fold mt" data-phase="${ph.k}" ${state.ui.t11Open[ph.k]?"open":""}><summary><span class="grow">${isDone?`Done — ${ph.n}s`:`Next — ${ph.n}`}</span>${isDone?tagH("ok","T11 unlocked ✓"):tagH("plain",fmt(phaseRem(ph))+" dust")}</summary><div class="fbody">${nodeRowsH(core(ph),ph.k)}${isDone?"":tot(ph)}${laterH(state[ph.k],ph.k)}</div></details>`; });
  html+=`</div></details>`;
  const host=$("#t11Body"); host.innerHTML=html;
  host.querySelectorAll(".stepper button").forEach(b=>b.onclick=()=>{ const L=state[b.dataset.k], nd=L[+b.dataset.i], mx=nd.max||12; nd.cur=Math.max(0,Math.min(mx,nd.cur+ +b.dataset.d)); stepFocus=`${b.dataset.k}|${b.dataset.i}|${b.dataset.d}`; afterEdit(); });
  if(stepFocus){ const [k,i,d]=stepFocus.split("|"); const nb=host.querySelector(`.stepper button[data-k="${k}"][data-i="${i}"][data-d="${d}"]`); stepFocus=null; if(nb&&!nb.disabled) nb.focus({preventScroll:true}); }
  host.querySelectorAll("details[data-phase]").forEach(d=>d.ontoggle=()=>{ state.ui.t11Open[d.dataset.phase]=d.open; scheduleSave(); });
  host.querySelectorAll("details[data-later]").forEach(d=>d.ontoggle=()=>{ state.ui.laterOpen[d.dataset.later]=d.open; scheduleSave(); });
  on("t11Gold",openDustSheet);
  host.querySelectorAll(".t11n").forEach(b=>b.onclick=()=>{ const nd=state[b.dataset.k][+b.dataset.i], mx=nd.max||12; openSheet({title:nd.name.replace(/^Truegold /,""),sub:`T11 node · max ${mx}`,build(f){ f.appendChild(fld("Level now",{type:"num",value:nd.cur,get:()=>nd.cur,set:v=>nd.cur=Math.max(0,Math.min(mx,Math.round(v)))})); const i=infoBox(); f.appendChild(i); const rf=()=>{ i.innerHTML=nd.cur>=mx?"Done ✓":`${fmt(nodeRem(nd))} dust to max`; }; rf(); return rf; }}); });
  const tm=$("#t11More"); if(tm) tm.ontoggle=()=>{ state.ui.t11More=tm.open; scheduleSave(); };
  $$(".phName").forEach(e=>e.textContent=act.n);
  buildForecast();
}
function openDustSheet(){ const d=state.dust; openSheet({title:"Dust & Gold in hand",sub:"Used for the T11 unlock gate.",build(f){
  f.appendChild(frow(fld("Truegold Dust",{type:"num",value:d.current,get:()=>d.current,set:v=>d.current=v}),fld("Gold",{type:"num",value:d.gold,get:()=>d.gold,set:v=>d.gold=v,hint:"shorthand works: 2.5m"}))); }}); }
function buildForecast(){
  if(!state.forecast) state.forecast={log:[]};
  on("fcLog",()=>{ const today=fcToday(), entry={d:today,dust:num(state.dust.current),gold:num(state.dust.gold)};
    const ex=state.forecast.log.findIndex(e=>e.d===today); if(ex>=0) state.forecast.log[ex]=entry; else state.forecast.log.push(entry);
    const m=$("#fcMsg"); m.textContent=`Logged ${fmt(entry.dust)} dust · ${fmtBig(entry.gold)} gold`; m.hidden=false; afterEdit(); });
  const h=$("#fcHistory"), log=[...(state.forecast.log||[])].sort((a,b)=>b.d.localeCompare(a.d)).slice(0,6);
  h.innerHTML=log.length?`<div class="list">`+log.map(e=>`<div class="lrow"><span class="mono" style="font-size:14px">${e.d} · ${fmt(e.dust)} dust · ${fmtBig(e.gold)} gold</span><button class="x" data-d="${e.d}" aria-label="Remove check-in ${e.d}">×</button></div>`).join("")+`</div>`:"";
  h.querySelectorAll(".x").forEach(b=>b.onclick=()=>{ const snap=JSON.stringify(state); state.forecast.log=state.forecast.log.filter(e=>e.d!==b.dataset.d); afterEdit(); toast("Check-in removed",snap); });
  paintForecast();
}
function renderTroops(){
  const tc=state.troopCounts; const L=[["inf","Infantry"],["arc","Archer"],["cav","Cavalry"]];
  $("#troopBody").innerHTML=L.map(([k,l])=>{ const t=tc[k]||{cur:0,tgt:0}, p=pc(num(t.cur),num(t.tgt)), done=num(t.tgt)>0&&num(t.cur)>=num(t.tgt);
    return `<button class="lrow" data-k="${k}" data-l="${l}" style="grid-template-columns:1fr auto"><span style="min-width:0;display:flex;flex-direction:column;gap:6px"><span class="rowb"><span class="lt">${l}</span><span class="mono muted" style="font-size:14px">${fmt(num(t.cur))} / ${fmt(num(t.tgt))}</span></span>${barH(p,done?"ok":"big")}</span><span class="lv">${p.toFixed(0)}%</span></button>`; }).join("");
  bindAll($("#troopBody"),".lrow",b=>openTroopSheet(b.dataset.k,b.dataset.l));
}
function openTroopSheet(k,l){ const t=state.troopCounts[k]||(state.troopCounts[k]={cur:0,tgt:0}); openSheet({title:`${l} troops`,sub:"Shorthand works: 500k, 1.5m",build(f){
  f.appendChild(frow(fld("Current",{type:"num",value:t.cur,get:()=>t.cur,set:v=>t.cur=v}),fld("Target",{type:"num",value:t.tgt,get:()=>t.tgt,set:v=>t.tgt=v}))); }}); }
function renderBuildings(){
  const t=state.tg; let w=0,s=0,i=0,tg=0,ttg=0; state.buildings.forEach(bl=>{ const r=bldRem(bl); w+=r.w; s+=r.s; i+=r.i; tg+=r.tg; ttg+=r.ttg; });
  t.need=Math.round(tg); t.ttgNeed=Math.round(ttg);
  const bn=bldNextStep(), nb=bn&&bn.bl, ns=bn&&bn.st; // shared with Home
  $("#tgTiles").innerHTML=stepTileH("tgA","Truegold",num(t.have),ns?ns.tg:0,tg)+stepTileH("tgB","Tempered Truegold",num(t.ttgHave),ns?ns.ttg:0,ttg)+
    (ns?`<div class="info" style="grid-column:1/-1">Next: <b>${esc(nb.n)}</b> → ${esc(ns.to)}</div>`:"");
  on("tgA",openTGSheet); on("tgB",openTGSheet);
  // Tempered Truegold from refining Truegold. Tier 1 = refines 1–20 of the week: 20 TG each (first refine of the day half price), gives 1–3 TTG (random).
  // Minimum target = worst luck (1 TTG per refine); average = 2 per refine. Tier 2+ costs 50–160 TG per refine, so we plan on Tier 1 only.
  const ttgShort=Math.max(0,ttg-num(t.ttgHave)), tgShort=Math.max(0,tg-num(t.have));
  const T1=20, wkTG=7*10+13*20; // 20 refines a week, 7 of them at the daily half price
  const plan=per=>{ const refines=Math.ceil(ttgShort/per), weeks=Math.ceil(refines/T1), full=Math.floor(refines/T1), rest=refines-full*T1;
    const cost=full*wkTG+Math.min(rest,7)*10+Math.max(0,rest-7)*20; return {refines,weeks,cost,total:tgShort+cost}; };
  const minP=plan(1), avgP=plan(2);
  $("#tgNote").innerHTML=ttgShort?`<details class="dfold tgfold"><summary>Refining ${fmt(ttgShort)} TTG needs <b>${fmt(avgP.total)} TG</b> on average (~${avgP.weeks} weeks) ›</summary><p class="faint" style="margin:6px 0 0">Worst luck: ${fmt(minP.total)} TG (~${minP.weeks} weeks). ${fmt(tgShort)} TG for buildings + refining at Tier 1 only (20 refines a week, 20 TG each, first of the day half price; 1–3 TTG each). Tier 2+ is 50–160 TG a refine — only worth it if you're in a hurry.</p></details>`
    :"Tempered Truegold covered ✓ — keep refining Tier 1 weekly for the next tier. Defer Stable &amp; Infirmary.";
  $("#buildBody").innerHTML=state.buildings.map((bl,k)=>{ const r=bldRem(bl);
    return `<button class="lrow" data-i="${k}" ${bl.d?'style="opacity:.6"':""}><span style="min-width:0"><span class="lt" style="display:block"><span class="faint mono">${k+1}.</span> ${esc(bl.n)}</span><span class="ls">${bl.d?"done ✓":`${esc(r.cur)} → TG 8`}</span></span><span class="lv">${bl.d?tagH("ok","done"):`${fmt(r.tg)} TG<br><span class="faint" style="font-weight:500">${fmt(r.ttg)} TTG</span>`}</span></button>`; }).join("");
  bindAll($("#buildBody"),".lrow",b=>openBuildingSheet(state.buildings[+b.dataset.i]));
  $("#bldTotals").innerHTML=`<span>Wood <b>${fmtBig(w)}</b></span><span>Bread <b>${fmtBig(w)}</b></span><span>Stone <b>${fmtBig(s)}</b></span><span>Iron <b>${fmtBig(i)}</b></span><span>Truegold <b class="gold">${fmt(tg)}</b></span><span>Tempered TG <b class="gold">${fmt(ttg)}</b></span>`;
  on("addBuild",()=>{ const bl={n:"New building",stepIdx:0,note:"",d:false}; state.buildings.push(bl); afterEdit(); openBuildingSheet(bl); });
}
function openTGSheet(){ const t=state.tg; openSheet({title:"Truegold in hand",build(f){
  f.appendChild(frow(fld("Truegold",{type:"num",value:t.have,get:()=>t.have,set:v=>t.have=v}),fld("Tempered Truegold",{type:"num",value:t.ttgHave,get:()=>t.ttgHave,set:v=>t.ttgHave=v}))); }}); }
function openBuildingSheet(bl){
  openSheet({title:bl.n||"Building",sub:"Current tier and progress.",build(f){
    f.appendChild(fld("Building",{value:bl.n,set:v=>bl.n=v}));
    const B=BUILD_TIERS[bl.n];
    if(B) f.appendChild(fld("Currently at",{type:"select",value:String(bl.stepIdx||0),options:[["0",B.from+" (start)"]].concat(B.steps.map((st,k)=>[String(k+1),st.to])),set:v=>bl.stepIdx=parseInt(v,10)}));
    f.appendChild(fld("Note",{value:bl.note,set:v=>bl.note=v}));
    f.appendChild(fld("Done",{type:"check",value:bl.d,set:v=>bl.d=v}));
    const inf=infoBox(); f.appendChild(inf);
    const rf=()=>{ const r=bldRem(bl); inf.innerHTML=bl.d?"Marked done.":B?`To TG 8: <b>${fmt(r.tg)}</b> TG · <b>${fmt(r.ttg)}</b> TTG · Wood ${fmtBig(r.w)} · Stone ${fmtBig(r.s)} · Iron ${fmtBig(r.i)}`:"No cost table for this building name."; }; rf(); return rf; },
    onDelete:()=>{ const i=state.buildings.indexOf(bl); if(i>-1) state.buildings.splice(i,1); }});
}
function renderRes(){
  migrateResources();
  const rb=$("#resBody"); rb.className="card dcard"; rb.removeAttribute("style");
  const isSp=r=>/\(min\)/.test(r.n||""), rrow=(r,i)=>`<button class="drow resrow" data-i="${i}"><span class="dt"><b>${esc(String(r.n||"Material").replace(/ speedup \(min\)/," speedups"))}</b>${isSp(r)&&num(r.h)?`<span>${minsTxt(r.h)}</span>`:""}</span><span class="dv">${String(r.h||"").trim()===""?"—":fmtBig(num(r.h))}<small>${isSp(r)?"min":""}</small></span></button>`;
  const R=state.resources.map((r,i)=>({r,i}));
  rb.innerHTML=`<div class="dch"><h3>Speedups</h3></div>${R.filter(x=>isSp(x.r)).map(x=>rrow(x.r,x.i)).join("")}<div class="dsub">Resources</div>${R.filter(x=>!isSp(x.r)).map(x=>rrow(x.r,x.i)).join("")}`;
  bindAll(rb,".resrow",b=>openResSheet(state.resources[+b.dataset.i]));
  on("addRes",()=>{ const r={n:"New material",h:""}; state.resources.push(r); afterEdit(); openResSheet(r); });
}
function openResSheet(r){ openSheet({title:r.n||"Material",build(f){
  f.appendChild(fld("Name",{value:r.n,set:v=>r.n=v}));
  f.appendChild(fld("Amount",{type:"num",value:r.h,get:()=>r.h,allowEmpty:true,set:v=>r.h=v===""?"":String(v),hint:"Shorthand works: 2.5b, 300m. Speedups in minutes."})); },
  onDelete:()=>{ const i=state.resources.indexOf(r); if(i>-1) state.resources.splice(i,1); }}); }


/* ---------- War Academy: every node with the building tier it needs (TG5–TG8) ---------- */
const TIER_N=t=>parseFloat(String(t).replace(/[^\d.]/g,""))||0;
function warTierNow(){ const b=(state.buildings||[]).find(x=>x.n==="War Academy"), B=BUILD_TIERS["War Academy"]; if(!b||!B) return "TG ?"; const i=b.stepIdx||0; return b.d?"TG 8":i?B.steps[i-1].to:B.from; }
function warState(){ const W=(state.research||{}).war||{}, mx=W.max||10, have=TIER_N(warTierNow()), lv=W.started||{};
  const all=(W.nodes||[]).map((x,i)=>({n:x.n,req:x.req,lv:num(lv[x.n]),max:i===(W.nodes||[]).length-1&&/Provisions III/.test(x.n)?100:mx,ok:TIER_N(x.req)<=have}));
  const open=all.filter(x=>x.ok), locked=all.filter(x=>!x.ok), nt=locked.length?locked.map(x=>TIER_N(x.req)).sort((a,b)=>a-b)[0]:0;
  return {all,open,locked,nextTier:nt?`TG ${nt}`:"",started:open.filter(x=>x.lv>0&&x.lv<x.max),next:open.find(x=>x.lv===0)||null,done:all.reduce((t,x)=>t+x.lv,0),total:all.reduce((t,x)=>t+x.max,0)}; }
function openWarNodeSheet(n){ const W=(state.research||{}).war, x=warState().all.find(y=>y.n===n); if(!W||!x) return; if(!W.started) W.started={};
  openSheet({title:n,sub:`War Academy · needs ${x.req}${x.ok?"":" (locked)"}`,build(f){ f.appendChild(fld("Level now",{type:"num",value:num(W.started[n]),get:()=>num(W.started[n]),set:v=>{ const L=Math.max(0,Math.min(x.max,Math.round(v))); if(L) W.started[n]=L; else delete W.started[n]; }})); }}); }
function openWarAllSheet(){ openSheet({title:"War Academy",sub:`Building at ${warTierNow()} · tap a node to update it`,build(f){
  const draw=()=>{ const A=warState(), tiers=[...new Set(A.all.map(x=>x.req))];
    const first=tiers.find(t=>A.all.some(x=>x.req===t&&x.ok&&x.lv<x.max)); // open only the tier you're working on
    f.innerHTML=tiers.map(t=>{ const L=A.all.filter(x=>x.req===t), lock=!L[0].ok, d=L.filter(x=>x.lv>=x.max).length;
      return `<details class="card dcard dfold mt"${t===first?" open":""}><summary class="dch"><h3>${esc(t)}${lock?' <span class="faint" style="font-weight:500">· locked</span>':""}</h3><span class="faint" style="font-size:12.5px">${d}/${L.length} maxed ›</span></summary>${L.map(x=>`<button class="drow rsw2${lock?" dim":""}" data-n="${esc(x.n)}"><span class="dt"><b>${esc(x.n)}</b></span><span class="dv${x.lv>=x.max?" ok":""}">${x.lv>=x.max?"MAX":`${x.lv}/${x.max}`}</span></button>`).join("")}</details>`; }).join("");
    f.querySelectorAll(".rsw2").forEach(b=>b.onclick=()=>openWarNodeSheet(b.dataset.n)); };
  draw(); return draw; }}); }

/* ---------- Research: Research Academy (Battle / Growth / Economy) + War Academy, from your screenshots ---------- */
const RES_TREES=[["battle","Battle"],["growth","Growth"],["economy","Economy"]];
const RES_NEXT=["Defensive Formations","Picket Lines","Bulwark Formations","Special Defensive Training","Survival Techniques","Shield Upgrade","Leathercraft","Fortified Mail","Lance Upgrade"]; // tier V Health/Defense first
// every unfinished node as {tree,key,label,lv,max,obj}
function resNodes(){ const R=state.research||{}, out=[];
  const B=R.battle; if(B&&B.tiers) Object.entries(B.tiers).forEach(([t,o])=>Object.keys(o).forEach(n=>out.push({tree:"battle",group:"Battle — tier "+t,label:`${n} ${t}`,lv:num(o[n]),max:B.max||6,obj:o,key:n})));
  ["growth","economy"].forEach(k=>{ const T=R[k]; if(T&&T.nodes) Object.keys(T.nodes).forEach(n=>out.push({tree:k,group:k==="growth"?"Growth":"Economy",label:n,lv:num(T.nodes[n]),max:T.max||3,obj:T.nodes,key:n})); });
  return out; }
function resEnds(){ const c=(state.research||{}).current; return c&&c.ends?new Date(c.ends):null; }
const resLeftTxt=ms=>{ if(ms<=0) return "done"; const m=Math.floor(ms/6e4), d=Math.floor(m/1440), h=Math.floor(m%1440/60); return d?`${d}d ${h}h`:`${h}h ${m%60}m`; };
function resNextPick(){ const c=((state.research||{}).current||{}).n||"", N=resNodes().filter(x=>x.lv<x.max&&x.label!==c);
  for(const n of RES_NEXT){ const x=N.find(y=>y.tree==="battle"&&y.key===n&&/ V$/.test(y.label)); if(x) return x; }
  return N.filter(x=>x.tree==="battle").sort((a,b)=>a.lv/a.max-b.lv/b.max)[0]||N[0]; }
function openResNodeSheet(x){ openSheet({title:x.label,sub:`${x.group} · max ${x.max}`,build(f){
  f.appendChild(fld("Level now",{type:"num",value:x.lv,get:()=>num(x.obj[x.key]),set:v=>x.obj[x.key]=Math.max(0,Math.min(x.max,Math.round(v)))})); }}); }
function openResGroupSheet(g){ openSheet({title:g,sub:"Tap a node to update its level.",build(f){
  const draw=()=>{ const L=resNodes().filter(x=>x.group===g), open=L.filter(x=>x.lv<x.max).sort((a,b)=>a.lv/a.max-b.lv/b.max), done=L.filter(x=>x.lv>=x.max), cur=((state.research||{}).current||{}).n;
    f.innerHTML=`<div class="card dcard">${open.map((x,i)=>`<button class="drow rsn" data-i="${L.indexOf(x)}"><span class="dt"><b>${esc(x.label)}</b><span>${x.label===cur?'<span class="ok">researching now</span>':""}</span><span class="pbar"><i style="width:${pc(x.lv,x.max)}%"></i></span></span><span class="dv">${x.lv}/${x.max}</span></button>`).join("")}
      ${done.length?`<details class="dfold"><summary>Maxed (${done.length}) ›</summary>${done.map(x=>`<button class="drow rsn" data-i="${L.indexOf(x)}"><span class="dt"><b>${esc(x.label)}</b></span><span class="dv ok">MAX</span></button>`).join("")}</details>`:""}</div>`;
    f.querySelectorAll(".rsn").forEach(b=>b.onclick=()=>openResNodeSheet(L[+b.dataset.i])); };
  draw(); return draw; }}); }
function openResCurrentSheet(){ const R=state.research||(state.research={}), c=R.current||(R.current={n:"",ends:""});
  const opts=resNodes().filter(x=>x.lv<x.max).map(x=>[x.label,x.label]);
  openSheet({title:"Researching now",sub:"Set what's researching and when it finishes.",build(f){
    f.appendChild(fld("Research",{type:"select",value:c.n,options:[["","— none —"]].concat(opts),set:v=>c.n=v}));
    f.appendChild(fld("Time left (days)",{type:"num",decimal:true,value:"",allowEmpty:true,ph:"e.g. 5.7",set:v=>{ if(v!=="") c.ends=new Date(Date.now()+num(v)*864e5).toISOString(); },hint:"Or tick below when it's done."}));
    f.appendChild(fld("It's finished — add +1 level",{type:"check",value:false,set:v=>{ if(!v) return; const x=resNodes().find(y=>y.label===c.n); if(x) x.obj[x.key]=Math.min(x.max,x.lv+1); c.n=""; c.ends=""; }}));
  }}); }
function renderResearch(){ const box=$("#researchBody"); if(!box) return; const R=state.research||{};
  const N=resNodes(), left=N.reduce((t,x)=>t+Math.max(0,x.max-x.lv),0), end=resEnds(), ms=end?end-Date.now():null, nx=resNextPick(), cur=R.current||{};
  const groups=[...new Set(N.map(x=>x.group))].map(g=>{ const L=N.filter(x=>x.group===g), lv=L.reduce((t,x)=>t+x.lv,0), mx=L.reduce((t,x)=>t+x.max,0), open=L.filter(x=>x.lv<x.max).sort((a,b)=>b.lv/b.max-a.lv/a.max);
    return {g,left:mx-lv,p:pc(lv,mx),sub:open.length?`${open.length} not maxed · ${esc(open[0].label)} ${open[0].lv}/${open[0].max}`:"all maxed ✓"}; });
  const W=R.war||{}, WA=warState();
  const t11=computeTarget()-num(state.dust.current);
  box.innerHTML=`<div class="kpis"><button class="kpi y" data-k="dust"><b>${fmt(num(state.dust.current))}</b><span>TG Dust</span></button><button class="kpi${ms!=null&&ms<=0?" g":""}" data-k="cur"><b>${ms==null?"—":resLeftTxt(ms)}</b><span>to finish</span></button><button class="kpi" data-k="left"><b>${fmt(left)}</b><span>levels left</span></button><button class="kpi" data-k="t11"><b>${t11>0?fmtK(t11):"✓"}</b><span>dust to T11</span></button></div>
    <div class="rsgrid"><div><div class="card dcard"><div class="dch"><h3>Researching now</h3>${end?`<span class="pill ${ms<=0?"g":"y"}">${ms<=0?"finished — start the next":`done ${end.toLocaleDateString(undefined,{weekday:"short",day:"numeric",month:"short"})}`}</span>`:""}</div>
      ${cur.n?`<button class="drow" id="resCurRow"><span class="dt"><b>${esc(cur.n)}</b><span>${(()=>{ const x=N.find(y=>y.label===cur.n); return x?`${x.group} · ${x.lv}/${x.max} → ${x.lv+1}/${x.max}`:""; })()}</span></span><span class="dv">${ms==null?"":resLeftTxt(ms)}<small>${ms!=null&&ms>0?"left":""}</small></span></button>`:'<button class="drow" id="resSet" style="width:100%;background:none;border-left:0;border-right:0;border-bottom:0;color:var(--text);font:inherit"><span class="dt"><span>Nothing set — tap to set it</span></span><span class="chev">›</span></button>'}
      ${nx?`<p class="dnote">Next up: <b style="color:var(--text)">${esc(nx.label)}</b> (${nx.lv}/${nx.max}) — tier V Health/Defense first, then tier VI.</p>`:""}</div>
    <div class="card dcard mt"><div class="dch"><h3>Research Academy</h3><span class="faint" style="font-size:12.5px">${R.battle&&R.battle.seen?`from screenshots ${esc(fd(R.battle.seen))}`:""}</span></div>
      ${groups.map(x=>`<button class="drow rsg" data-g="${esc(x.g)}"><span class="dt"><b>${esc(x.g)}</b><span>${x.sub}</span><span class="pbar"><i class="${x.left?"":"ok"}" style="width:${x.p}%"></i></span></span><span class="dv">${fmt(x.left)}<small>left</small></span></button>`).join("")||'<p class="dnote">Upload Tech Research screenshots to start.</p>'}</div>
    </div><div>${W.seen?`<div class="card dcard"><div class="dch"><h3>War Academy</h3><span class="faint" style="font-size:12.5px">building ${esc(warTierNow())}</span></div>
      <button class="drow" id="warAll"><span class="dt"><b>${WA.open.length} unlocked · ${WA.locked.length} need ${esc(WA.nextTier||"")}</b><span>${fmt(WA.done)} of ${fmt(WA.total)} levels done · tap for every node</span><span class="pbar"><i style="width:${pc(WA.done,WA.total)}%"></i></span></span><span class="chev">›</span></button>
      ${WA.started.map(x=>`<button class="drow rsw" data-n="${esc(x.n)}"><span class="dt"><b>${esc(x.n)}</b><span>started · ${x.req}</span><span class="pbar"><i style="width:${pc(x.lv,x.max)}%"></i></span></span><span class="dv">${x.lv}/${x.max}</span></button>`).join("")}
      ${WA.next?`<button class="drow rsw" data-n="${esc(WA.next.n)}"><span class="dt"><b>${esc(WA.next.n)}</b><span>next on the path · ${WA.next.req}</span></span><span class="dv">${WA.next.lv}/${WA.next.max}</span></button>`:""}</div>`:""}</div></div>`;
  box.querySelectorAll(".rsg").forEach(b=>b.onclick=()=>openResGroupSheet(b.dataset.g));
  box.querySelectorAll(".rsw").forEach(b=>b.onclick=()=>openWarNodeSheet(b.dataset.n));
  on("warAll",openWarAllSheet);
  on("resCurRow",openResCurrentSheet); on("resSet",openResCurrentSheet);
  box.querySelectorAll(".kpi").forEach(b=>b.onclick=()=>{ const k=b.dataset.k; if(k==="cur") openResCurrentSheet(); else if(k==="dust"||k==="t11") $("#t11Body").scrollIntoView({behavior:"smooth"}); });
}
