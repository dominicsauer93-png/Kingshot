"use strict";
/* =====================================================================
   BASE
   ===================================================================== */
function renderBase(){ renderT11(); renderTroops(); renderBuildings(); renderRes(); }
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
  let html=`<div class="card"><div class="rowb"><h3 style="margin:0">Now — T11 ${act.n}</h3>${tgt>0?(gap>0?tagH("bad",`${fmt(gap)} dust to go`):tagH("ok","dust gate met")):tagH("ok","unlocked ✓")}</div>
    <div class="gate-hero"><span class="big">${fmt(cur)}</span><span class="of">/ ${fmt(tgt)} dust</span></div>${barH(pc(cur,tgt),"big"+(gap?"":" ok"))}
    <div class="tiles t2 mt">${tileH({id:"t11Dust",label:"Dust in hand",value:fmt(cur),sub:"tap to update"})}${tileH({id:"t11Gold",label:"Gold in hand",value:fmtBig(gold),sub:gold<gT?`<span class="bad">${fmtBig(gT-gold)} short</span> of ${fmtBig(gT)}`:`<span class="ok">covers ${fmtBig(gT)}</span>`})}</div>
    ${nodeRowsH(core(act),act.k)}${tot(act)}${laterH(state[act.k],act.k)}</div>`;
  [...open,...done].forEach(ph=>{ const isDone=phaseRem(ph)<=0;
    html+=`<details class="fold mt" data-phase="${ph.k}" ${state.ui.t11Open[ph.k]?"open":""}><summary><span class="grow">${isDone?`Done — ${ph.n}s`:`Next — ${ph.n}`}</span>${isDone?tagH("ok","T11 unlocked ✓"):tagH("plain",fmt(phaseRem(ph))+" dust")}</summary><div class="fbody">${nodeRowsH(core(ph),ph.k)}${isDone?"":tot(ph)}${laterH(state[ph.k],ph.k)}</div></details>`; });
  const host=$("#t11Body"); host.innerHTML=html;
  host.querySelectorAll(".stepper button").forEach(b=>b.onclick=()=>{ const L=state[b.dataset.k], nd=L[+b.dataset.i], mx=nd.max||12; nd.cur=Math.max(0,Math.min(mx,nd.cur+ +b.dataset.d)); stepFocus=`${b.dataset.k}|${b.dataset.i}|${b.dataset.d}`; afterEdit(); });
  if(stepFocus){ const [k,i,d]=stepFocus.split("|"); const nb=host.querySelector(`.stepper button[data-k="${k}"][data-i="${i}"][data-d="${d}"]`); stepFocus=null; if(nb&&!nb.disabled) nb.focus({preventScroll:true}); }
  host.querySelectorAll("details[data-phase]").forEach(d=>d.ontoggle=()=>{ state.ui.t11Open[d.dataset.phase]=d.open; scheduleSave(); });
  host.querySelectorAll("details[data-later]").forEach(d=>d.ontoggle=()=>{ state.ui.laterOpen[d.dataset.later]=d.open; scheduleSave(); });
  on("t11Dust",openDustSheet); on("t11Gold",openDustSheet);
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
  $("#tgNote").innerHTML=ttgShort?`<b>Truegold target incl. refining for ${fmt(ttgShort)} TTG:</b> minimum <b>${fmt(minP.total)} TG</b> (worst luck, ~${minP.weeks} weeks) · average <b>${fmt(avgP.total)} TG</b> (~${avgP.weeks} weeks).<br><span class="faint">${fmt(tgShort)} TG for buildings + refining at Tier 1 only (20 refines a week, 20 TG each, first of the day half price; 1–3 TTG each). Tier 2+ is 50–160 TG a refine — only worth it if you're in a hurry.</span>`
    :"Tempered Truegold covered ✓ — keep refining Tier 1 weekly for the next tier. Defer Stable &amp; Infirmary.";
  $("#buildBody").innerHTML=state.buildings.map((bl,k)=>{ const r=bldRem(bl);
    return `<button class="lrow" data-i="${k}" ${bl.d?'style="opacity:.6"':""}><span style="min-width:0"><span class="lt" style="display:block"><span class="faint mono">${k+1}.</span> ${esc(bl.n)}</span><span class="ls">${bl.d?"done ✓":`${esc(r.cur)} → TG 8`}${bl.note?" · "+esc(bl.note):""}</span></span><span class="lv">${bl.d?tagH("ok","done"):`${fmt(r.tg)} TG<br><span class="faint" style="font-weight:500">${fmt(r.ttg)} TTG</span>`}</span></button>`; }).join("");
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
  $("#resBody").innerHTML=state.resources.map((r,i)=>`<button class="tile" data-i="${i}"><span class="l"><span>${esc(r.n||"Material")}</span></span><span class="v">${String(r.h||"").trim()===""?"—":fmtBig(num(r.h))}</span></button>`).join("");
  bindAll($("#resBody"),".tile",b=>openResSheet(state.resources[+b.dataset.i]));
  on("addRes",()=>{ const r={n:"New material",h:""}; state.resources.push(r); afterEdit(); openResSheet(r); });
}
function openResSheet(r){ openSheet({title:r.n||"Material",build(f){
  f.appendChild(fld("Name",{value:r.n,set:v=>r.n=v}));
  f.appendChild(fld("Amount",{type:"num",value:r.h,get:()=>r.h,allowEmpty:true,set:v=>r.h=v===""?"":String(v),hint:"Shorthand works: 2.5b, 300m. Speedups in minutes."})); },
  onDelete:()=>{ const i=state.resources.indexOf(r); if(i>-1) state.resources.splice(i,1); }}); }

