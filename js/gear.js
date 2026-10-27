"use strict";
/* =====================================================================
   GEAR
   ===================================================================== */
function renderGear(){ renderReports(); renderHeroGear(); renderWidgets(); renderCharms(); renderPets(); renderGov(); }

/* ---------- hero gear ---------- */
function hgState(r){
  const L=num(r.lvC), M=num(r.mC), nx=HG_IMB.find(x=>x[0]>L);
  if(!nx) return {cls:"s-done",tag:tagH("ok","Max imbuement ✓"),line:"Fully imbued"};
  const need=nx[1], ok=M>=need, ahead=M>need, ready=L>=nx[0]-1&&ok;
  if(!ok){ const fhc=hgFhCumulative(need)-hgFhCumulative(M), my=hgMythFromMastery(need)-hgMythFromMastery(M);
    return {cls:"s-block",req:{fh:fhc,mg:my},tag:tagH("bad",`Mastery +${need-M}`),line:`${fmt(fhc)} hammers${my?` + ${my} Mythic`:""} → ${nx[0]===100?"lets it turn red":"Lv "+nx[0]+" imbue"}`}; }
  if(ready){ const H=(state.heroGear&&state.heroGear.have)||{}, mS=Math.max(0,nx[2]-num(H.mith)), yS=Math.max(0,nx[3]-num(H.mg)); // only "ready" if you can afford the imbue
    if(mS||yS) return {cls:"s-warn",req:{mith:nx[2],mg:nx[3]},tag:tagH("warn","Need materials"),line:`Lv ${nx[0]} imbue — short ${[mS?mS+" Mithril":"",yS?yS+" Mythic":""].filter(Boolean).join(" + ")}`}; }
  if(ready) return {cls:"s-ready",req:{mith:nx[2],mg:nx[3]},tag:tagH("ok","Ready to imbue"),line:`Lv ${nx[0]}: ${nx[2]?nx[2]+" Mithril + ":""}${nx[3]} Mythic`+(ahead?" · mastery already ahead":"")};
  if(ahead) return {cls:"s-warn",tag:tagH("warn","Hold hammers"),line:`Mastery is ahead — XP to Lv ${nx[0]-1} first`};
  return {cls:"",tag:tagH("plain",`XP to Lv ${nx[0]-1}`),line:`Then Lv ${nx[0]} imbue (mastery ${need} ✓)`};
}
// what each next step needs vs what's in the bag, e.g. "Hammers 110/132 ✓ · Mythic 1/2 ✓"
const HG_MAT={fh:["Hammers","fh"],mith:["Mithril","mith"],mg:["Mythic","mg"]};
function hgReqH(req){ if(!req) return ""; const H=state.heroGear.have||{};
  return Object.entries(req).filter(([,v])=>v>0).map(([k,v])=>{ const h=num(H[HG_MAT[k][1]]), ok=h>=v; return `<span class="${ok?"ok":"bad"}">${HG_MAT[k][0]} ${fmt(h)}/${fmt(v)} ${ok?"✓":"✗"}</span>`; }).join(" · "); }
const hgAfford=st=>!!st.req&&Object.entries(st.req).every(([k,v])=>num((state.heroGear.have||{})[HG_MAT[k][1]])>=v);
// Ranking matches the optimiser's picks (kingshotoptimizer.com weighted stat gain) using simple rules:
//  1. stat order (HG_STAT_ORDER): Lethality on every troop first, then Infantry Health (front line takes the hits), then Archer, Cavalry Health
//  2. Quaad: Forgehammers only one step behind the next imbue (pieces with mastery ahead wait)
//  3. a mastery step before an imbue (mastery gives the bigger gain, e.g. +6.5% vs +1.4%)
//  4. cheaper imbue first (Lv 120 before Lv 140)
// Materials go to the top picks first; a green badge means you can afford it now.
const HG_STAT_ORDER=["Archer Lethality","Cavalry Lethality","Infantry Lethality","Infantry Health","Archer Health","Cavalry Health"];
const hgStatRank=r=>{ const i=HG_STAT_ORDER.indexOf(r.type+" "+slotStat(r.slot)); return i<0?9:i; };
const hgAct=st=>st.cls==="s-block"?0:st.req?1:2; // mastery, imbue, XP
function hgPriority(rows){
  const H=state.heroGear.have||{}, bag={fh:num(H.fh),mith:num(H.mith),mg:num(H.mg),xp:num(H.xp)};
  const L=rows.map(r=>({r,st:hgState(r)})).filter(x=>x.st.cls!=="s-done");
  L.forEach(x=>{ x.wait=x.st.cls==="s-warn"&&!x.st.req?1:0; }); // "Hold hammers": mastery already ahead — Quaad says wait
  const ord=(a,b)=>a.wait-b.wait||hgStatRank(a.r)-hgStatRank(b.r)||hgAct(a.st)-hgAct(b.st)||num(a.r.lvC)-num(b.r.lvC);
  L.sort(ord);
  L.forEach(x=>{ const req=Object.entries(x.st.req||{}), need=x.st.req?req:(x.st.cls===""?[["xp",1]]:[]);
    x.now=!x.wait&&need.length>0&&need.every(([k,v])=>bag[k]>=v);
    // a higher pick keeps its materials even when it can't go yet — so a lower pick never spends the Mythic the #1 is waiting for
    if(x.st.req&&!x.wait) req.forEach(([k,v])=>bag[k]=Math.max(0,bag[k]-v)); });
  const out=L.map(x=>x.r); out.now=new Set(L.filter(x=>x.now).map(x=>x.r));
  out.why=r=>{ const st=hgState(r); return `${r.type} ${slotStat(r.slot)} · ${st.cls==="s-block"?"mastery step":st.req?"imbue":"XP to the next imbue"}`; }; return out; }
// little pictures for each gear slot and troop type (line drawings, follow the text colour)
const SLOT_ICON={
  helm:'<path d="M4.5 14a7.5 7.5 0 0 1 15 0v4.5h-4.2V15H8.7v3.5H4.5z"/><path d="M12 6.5V3.5M8.7 12h6.6"/>',
  gloves:'<path d="M7.5 21v-7.5L5.2 10.4V6.3a1.2 1.2 0 0 1 2.4 0V9.5M7.6 9.5V4.5a1.2 1.2 0 0 1 2.4 0V9M10 9V3.7a1.2 1.2 0 0 1 2.4 0V9M12.4 9V4.9a1.2 1.2 0 0 1 2.4 0V12l1.6-1.8a1.3 1.3 0 0 1 2 1.6L15.8 16v5z"/><path d="M7.5 18h8.3"/>',
  chest:'<path d="M8.5 3.5 12 5.3l3.5-1.8L20 6.6l-2.3 4.1V21H6.3V10.7L4 6.6z"/><path d="M12 5.3V21M6.3 14h11.4"/>',
  boots:'<path d="M7.5 3.5h5.5V13l5.4 2.7a2.1 2.1 0 0 1 1.1 1.9V20H6v-3l1.5-2.4z"/><path d="M6 17h13.5M7.5 8h5.5"/>'};
const TROOP_ICON={
  Infantry:'<path d="M12 3l7 2.8v5.4c0 4.6-3 8.3-7 9.8-4-1.5-7-5.2-7-9.8V5.8z"/><path d="M12 8v8M8.5 11.5h7"/>',
  Cavalry:'<path d="M6 21v-5.5c0-2.3 1-4 2.6-5.3L8 6.5l2.6 1.6L13 4l1 3.5c3 .7 5 3.5 5 6.5l-2.4.8-2.3-1.8-1.3 2.3V21"/><circle cx="12.2" cy="9.3" r=".6"/>',
  Archer:'<path d="M6 3c7.5 2.6 7.5 15.4 0 18M6 3v18"/><path d="M3.5 12h15.5M16.5 9.4 19.2 12l-2.7 2.6"/>'};
const hgIcon=d=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${d}</svg>`;
// hammers gained per month: every rise in the bag counts, spending doesn't
function trackHammers(){
  const hg=state.heroGear; if(!hg||!hg.have) return; const h=num(hg.have.fh);
  if(hg.fhSeen!=null&&h>num(hg.fhSeen)){ const m=gameToday().slice(0,7); hg.fhGot=hg.fhGot||{}; hg.fhGot[m]=num(hg.fhGot[m])+h-num(hg.fhSeen); }
  hg.fhSeen=h; }
function hgMonthGot(back){ const d=new Date(gameToday()+"T00:00:00Z"); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth()-back); return num((state.heroGear.fhGot||{})[d.toISOString().slice(0,7)]); }
/* ---------- optimiser plan: the upgrades kingshotoptimizer.com picked (checked with Quaad) ----------
   When a plan is saved it leads the Hero Gear tab and Home, in the optimiser's order. */
const hgPlanRow=s=>((state.heroGear&&state.heroGear.rows)||[]).find(r=>r.type===s.type&&slotName(r.slot)===s.slot);
function hgPlanLeft(){ return ((state.heroGear&&state.heroGear.plan)||[]).filter(s=>{ const r=hgPlanRow(s); return r&&((s.mTo!=null&&num(r.mC)<s.mTo)||(s.lvTo!=null&&num(r.lvC)<s.lvTo)); }); }
function hgPlanWhat(s){ const r=hgPlanRow(s); return [s.lvTo!=null&&num(r.lvC)<s.lvTo?`Lv ${num(r.lvC)} → ${s.lvTo}`:"",s.mTo!=null&&num(r.mC)<s.mTo?`Mastery ${num(r.mC)} → ${s.mTo}`:""].filter(Boolean).join(" + "); }
function hgPlanApply(s){ const H=state.heroGear.have, r=hgPlanRow(s); ["fh","mg","mith"].forEach(k=>H[k]=num(H[k])-num(s[k])); if(s.mTo!=null) r.mC=Math.max(num(r.mC),s.mTo); if(s.lvTo!=null) r.lvC=Math.max(num(r.lvC),s.lvTo); }
function renderHeroGear(){
  const hg=state.heroGear; if(!hg.have) hg.have={xp:0,fh:0,mg:0,mith:0};
  if(hg.fhSeen==null) hg.fhSeen=num(hg.have.fh);
  const plan=hgPlanLeft(), prio=hgPriority(hg.rows), top=prio.slice(0,3), rank=new Map(plan.length?plan.map((x,i)=>[hgPlanRow(x),i+1]):top.map((r,i)=>[r,i+1]));
  const n3={fh:0,mith:0,mg:0};
  if(plan.length) plan.forEach(x=>["fh","mith","mg"].forEach(k=>n3[k]+=num(x[k])));
  else top.forEach(r=>{ const st=hgState(r); if(st.req) Object.entries(st.req).forEach(([k,v])=>n3[k]+=v); });
  const got=hgMonthGot(0);
  const nTile=(k,label,extra)=>{ const h=num(hg.have[k]), v=n3[k];
    return tileH({id:"hgm_"+k,label,value:fmt(h),sub:v?(v>h?`<span class="bad">${fmtK(v-h)} short</span>`:`<span class="ok">enough ✓</span>`):(extra||"not needed"),p:v?pc(h,v):null,cls:v&&h>=v?"ok":""}); };
  $("#hgMats").innerHTML=nTile("mg","Mythic Gear")+nTile("mith","Mithril")+nTile("fh","Hammers",`+${fmt(got)} this mo.`);
  $$("#hgMats .tile").forEach(t=>t.onclick=openHgMatsSheet);
  const host=$("#hgBody"); host.innerHTML="";
  const SRC={mg:"Arena Shop (Custom Mythic Gear Chest), Merchant Empire, Armament",mith:"Mystic Trials, Trial Shop, Arena Shop",fh:"VIP Shop, Trial Shop, Merchant Empire"};
  const lack=["mg","mith","fh"].find(k=>n3[k]>num(hg.have[k])), MATN={mg:"Mythic Gear",mith:"Mithril",fh:"Forgehammers"};
  const d=document.createElement("div"); d.className="info hgsum";
  const bag={fh:num(hg.have.fh),mith:num(hg.have.mith),mg:num(hg.have.mg)};
  const stat=r=>{ const st=hgState(r); if(!st.req) return `<span class="faint">XP first</span>`; // walk the bag down the list so #2 and #3 see what #1 used
    const miss=Object.entries(st.req).filter(([k,v])=>v>bag[k]).map(([k,v])=>`${fmt(v-bag[k])} ${HG_MAT[k][0]}`);
    Object.entries(st.req).forEach(([k,v])=>bag[k]-=v);
    return miss.length?`<span class="bad">short ${miss.join(" + ")}</span>`:`<span class="ok">ready ✓</span>`; };
  d.innerHTML=(prio.length?`<b>Next up</b>`+top.map((r,i)=>`<br><span class="hgnum${prio.now.has(r)?" go":""}">${i+1}</span> ${esc(r.type)} <b>${esc(slotName(r.slot))}</b> <span class="faint">${hgState(r).cls==="s-block"?"mastery":"imbue"}</span> · ${stat(r)}`).join(""):"<b>All pieces fully imbued ✓</b>")+
    (lack?`<br><span class="faint" style="font-size:13.5px">Get ${MATN[lack]} from ${SRC[lack]}.</span>`:"");
  if(plan.length){ const pb={fh:num(hg.have.fh),mith:num(hg.have.mith),mg:num(hg.have.mg)};
    d.innerHTML=`<b>Optimiser plan</b> <span class="faint">${hg.planDate?"· "+esc(fd(hg.planDate)):""} · checked with Quaad</span>`+plan.map((x,i)=>{
      const cost=[["fh","hammers"],["mg","Mythic"],["mith","Mithril"]].filter(([k])=>num(x[k])).map(([k,l])=>{ const ok=pb[k]>=num(x[k]); pb[k]-=num(x[k]); return `<span class="${ok?"ok":"bad"}">${fmt(num(x[k]))} ${l} ${ok?"✓":"✗"}</span>`; }).join(" · ");
      return `<div class="hgplan"><span class="hgnum">${i+1}</span><span class="hgp-t">${esc(x.type)} <b>${esc(x.slot)}</b> <span class="faint">${esc(hgPlanWhat(x))}</span>${x.gain?` <span class="gold">+${x.gain}%</span>`:""}<br><span class="hgp-c">${cost}</span></span><button class="didit hgp-done" data-i="${i}">✓ Done</button></div>`; }).join("")+
      `<span class="faint" style="font-size:13.5px">Tap Done after you do it in game — it spends the materials and updates the piece.</span>`;
    bindAll(d,".hgp-done",b=>{ const x=plan[+b.dataset.i], snap=JSON.stringify(state); hgPlanApply(x); afterEdit(); toast(`${x.type} ${x.slot}: done`,snap); }); }
  host.appendChild(d);
  HG_TYPES.forEach(type=>{
    const pieces=hg.rows.filter(r=>r.type===type); if(!pieces.length) return;
    const blk=pieces.find(r=>hgState(r).cls==="s-block"), rdy=pieces.find(r=>hgState(r).cls==="s-ready"), low=pieces.filter(r=>num(r.lvC)<119).sort((a,b)=>num(b.lvC)-num(a.lvC))[0];
    const next=blk?`next: ${slotName(blk.slot)} mastery`:low?`next: ${slotName(low.slot)} → Lv 119`:rdy?`ready: ${slotName(rdy.slot)} imbue`:"all on track";
    const sec=document.createElement("div"); sec.className="mt";
    sec.innerHTML=`<h2 class="h2"><span class="hgtroop">${hgIcon(TROOP_ICON[type])}${type}</span> <small>${esc(next)}</small></h2><div class="hggrid"></div>`;
    const grid=sec.querySelector(".hggrid");
    pieces.forEach(r=>{ const L=num(r.lvC), st=hgState(r), b=document.createElement("button"); b.className="hgcard "+st.cls;
      b.innerHTML=`<span class="hgc-top"><span class="hgc-ic">${hgIcon(SLOT_ICON[slotName(r.slot).toLowerCase()]||SLOT_ICON.helm)}</span>
          <span class="hgc-id"><span class="hgc-n">${esc(slotName(r.slot))}</span><span class="hgc-s">${esc(slotStat(r.slot))}</span></span>
          <span class="hgc-lv"><b>${L}</b><small>Lv</small></span></span>${rank.has(r)?`<span class="hgnum hgc-rank${prio.now.has(r)?" go":""}">${rank.get(r)}</span>`:""}
        <span class="hgc-mid"><span class="hgc-b">${hgBonus(L).toFixed(1)}%<small> bonus</small></span><span class="hgc-m">Mastery <b>${num(r.mC)}</b></span></span>
        ${barH(pc(L,Math.max(num(r.lvT),L)),st.cls==="s-ready"||st.cls==="s-done"?"ok":st.cls==="s-block"?"bad":"")}
        <span class="hgc-st">${st.tag}</span><span class="hgc-line">${st.line}</span>`;
      b.onclick=()=>openHgSheet(r); grid.appendChild(b); });
    host.appendChild(sec);
  });
  on("addHg",()=>{ const r={type:"Archer",slot:"New (stat)",lvC:0,lvT:0,mC:0,mT:0,xp:0,fh:0,mg:0,mith:0}; hg.rows.push(r); afterEdit(); openHgSheet(r); });
}
function openHgMatsSheet(){
  const h=state.heroGear.have, need={xp:0,fh:0,mg:0,mith:0}; state.heroGear.rows.forEach(r=>{ const c=hgCalcCost(r); for(const k in need) need[k]+=c[k]; });
  openSheet({title:"Hero Gear materials",sub:"What you have in your bag right now.",build(f){
    const cap=infoBox(); cap.innerHTML=`Hammers gained: <b>+${fmt(hgMonthGot(0))}</b> this month · +${fmt(hgMonthGot(1))} last month<br><b>Long-term</b> <span class="faint">(to the mastery targets on each piece — a cap, not a goal)</span><br>${fmt(need.fh)} Forgehammers · ${fmt(need.mith)} Mithril · ${fmt(need.mg)} Mythic · ${fmtBig(need.xp)} XP`;
    f.appendChild(frow(fld("Enhancement XP",{type:"num",value:h.xp,get:()=>h.xp,set:v=>h.xp=v}),fld("Forgehammers",{type:"num",value:h.fh,get:()=>h.fh,set:v=>h.fh=v})));
    f.appendChild(frow(fld("Mythic Gear",{type:"num",value:h.mg,get:()=>h.mg,set:v=>h.mg=v}),fld("Mithril",{type:"num",value:h.mith,get:()=>h.mith,set:v=>h.mith=v})));
    f.appendChild(cap);
  }});
}
function openHgSheet(r){
  openSheet({title:`${r.type} ${slotName(r.slot)}`,sub:slotStat(r.slot)||"Hero gear piece",build(f){
    f.appendChild(frow(fld("Troop",{type:"select",value:r.type,options:HG_TYPES.map(t=>[t,t]),set:v=>r.type=v}),fld("Slot (stat)",{value:r.slot,set:v=>r.slot=v})));
    f.appendChild(frow(fld("Level now",{type:"num",value:r.lvC,get:()=>r.lvC,set:v=>r.lvC=v,min:0,max:200}),fld("Level target",{type:"num",value:r.lvT,get:()=>r.lvT,set:v=>r.lvT=v,min:0,max:200})));
    f.appendChild(frow(fld("Mastery now",{type:"num",value:r.mC,get:()=>r.mC,set:v=>r.mC=v,min:0,max:20}),fld("Mastery target",{type:"num",value:r.mT,get:()=>r.mT,set:v=>r.mT=v,min:0,max:20})));
    const inf=infoBox(), cg=document.createElement("div"); cg.className="costgrid"; f.appendChild(inf); f.appendChild(cg);
    const rf=()=>{ const L=num(r.lvC), M=num(r.mC), nx=HG_IMB.find(x=>x[0]>L), st=hgState(r), c=hgCalcCost(r);
      inf.innerHTML=`Bonus now <b>${hgBonus(L).toFixed(1)}%</b>${L<119?` · at Lv 119: <b>${hgBonus(119).toFixed(1)}%</b>`:""}<br>`+
        (nx?`Next imbuement <b>Lv ${nx[0]}</b> needs mastery ${nx[1]} ${M>=nx[1]?'<span class="ok">✓</span>':'<span class="bad">✗</span>'} · ${nx[2]?nx[2]+" Mithril + ":""}${nx[3]} Mythic<br>`:"")+`${st.tag} ${st.line}`;
      cg.innerHTML=`<div>XP<b>${c.xpExact?"":"~"}${fmtBig(c.xp)}</b></div><div>Hammers<b>${fmt(c.fh)}</b></div><div>Mythic<b>${fmt(c.mg)}</b></div><div>Mithril<b>${fmt(c.mith)}</b></div>`; };
    const note=document.createElement("p"); note.className="lead"; note.style.margin="0"; note.textContent="Costs above are to reach your targets."; f.appendChild(note);
    rf(); return rf; },
    onDelete:()=>{ const i=state.heroGear.rows.indexOf(r); if(i>-1) state.heroGear.rows.splice(i,1); }});
}

/* ---------- widgets ---------- */
function renderWidgets(){
  const w=state.widgets; w.rows.forEach(r=>{ if(r.have==null) r.have=0; });
  if(w.have){ if(w.rows[0]) w.rows[0].have=(w.rows[0].have||0)+num(w.have); w.have=0; }
  if(!w.rallySet){ w.rows.forEach(r=>{ if(["Amadeus","Yang","Ava"].includes(r.hero)) r.rally=true; }); w.rallySet=true; }
  const R=w.rows.some(r=>r.rally)?w.rows.filter(r=>r.rally):w.rows;
  const total=R.reduce((s,r)=>s+widRem(num(r.lvl)),0), haveSum=R.reduce((s,r)=>s+num(r.have),0);
  const low=widNextRow(); // shared with Home
  $("#widTiles").innerHTML=low?stepTileH("wTot",`Next: ${esc(low.hero)} Lv ${num(low.lvl)} → ${num(low.lvl)+1}`,num(low.have),widNext(num(low.lvl)),total):tileH({id:"wTot",label:"Widgets (rally heroes)",value:"All maxed",txt:true});
  on("wTot",()=>low&&openWidSheet(low));
  const b=$("#widBody");
  const L=w.rows.slice().sort((a,c)=>(!!c.rally)-(!!a.rally)||num(a.lvl)-num(c.lvl));
  b.innerHTML=L.map(r=>{ const lvl=Math.max(0,Math.min(10,num(r.lvl))), have=num(r.have), next=widNext(lvl);
    const cls=lvl>=10?"s-done":!r.rally?"s-dim":have>=next?"s-ready":"";
    return `<button class="vcard ${cls}" data-i="${w.rows.indexOf(r)}">${EDIT_ICON}<span class="vc-top"><span class="vc-name">${esc(r.hero||"Hero")}</span>${r.rally?tagH("acc","⚔ Rally"):""}</span>
      <span class="vc-big">${lvl}<small>/ 10</small></span><span class="pips" aria-hidden="true">${Array.from({length:10},(_,i)=>`<span class="${i<lvl?"on":""}"></span>`).join("")}</span>
      <span class="vc-line">${lvl>=10?`<span class="ok">MAX ✓</span> · ${fmt(have)} spare`:`Next: <b>${fmt(next)}</b> · have ${fmt(have)} ${have>=next?'<span class="ok">ready</span>':`<span class="bad">${fmt(next-have)} short</span>`}`}</span></button>`; }).join("");
  bindAll(b,".vcard",x=>openWidSheet(w.rows[+x.dataset.i]));
  on("addWid",()=>{ const r={hero:"",lvl:0,have:0}; w.rows.push(r); afterEdit(); openWidSheet(r); });
}
function openWidSheet(r){
  openSheet({title:r.hero||"New hero",sub:"Widget level and widgets in hand.",build(f){
    f.appendChild(fld("Hero",{value:r.hero,list:"widHeroList",set:v=>r.hero=v}));
    f.appendChild(frow(fld("Widget level (0–10)",{type:"num",value:r.lvl,get:()=>r.lvl,set:v=>r.lvl=v,min:0,max:10}),fld("Widgets in hand",{type:"num",value:r.have,get:()=>r.have,set:v=>r.have=v})));
    f.appendChild(fld("Rally hero (counts toward totals)",{type:"check",value:r.rally,set:v=>r.rally=v}));
    const inf=infoBox(); f.appendChild(inf);
    const rf=()=>{ const lvl=num(r.lvl); inf.innerHTML=lvl>=10?"Maxed ✓":`Next level costs <b>${widNext(lvl)}</b> · to max <b>${fmt(widRem(lvl))}</b>`; }; rf(); return rf; },
    onDelete:()=>{ const i=state.widgets.rows.indexOf(r); if(i>-1) state.widgets.rows.splice(i,1); }});
}

/* ---------- charms ---------- */
function renderCharms(){
  const c=state.charms; if(!c.have) c.have={guides:0,designs:0}; if(c.targetLvl==null) c.targetLvl=22;
  c.rows.forEach(r=>{ if(r.tgt==null) r.tgt=c.targetLvl; });
  let G=0,D=0; c.rows.forEach(r=>{ const m=charmRem(r.lvl,r.tgt,num(r.st)); G+=m.g; D+=m.d; });
  const gh=num(c.have.guides), dh=num(c.have.designs);
  const order=["Infantry","Archer","Cavalry"]; // Quaad: Infantry first
  // next 3 upgrades: one level each, Infantry first, lowest charm first — small steps instead of the whole end goal
  const next=charmNextList(3); // shared with Home
  const cpl=charmPlanLeft(), n3={g:0,d:0};
  if(cpl.length){ let dx=0; cpl.forEach(x=>{ if(x.kind==="x"){ n3.g+=x.g; dx+=x.d; } else { n3.g+=x.g; n3.d+=x.d; } }); n3.d=Math.max(0,n3.d-dx); } // exchanged Designs count toward the need
  else next.forEach(r=>{ const k=CHARM_COSTS[num(r.lvl)]; n3.g+=k[0]; n3.d+=k[1]; });
  $("#charmMats").innerHTML=stepTileH("chD","Charm Designs",dh,n3.d,D)+stepTileH("chG","Charm Guides",gh,n3.g,G);
  on("chG",openCharmMatsSheet); on("chD",openCharmMatsSheet);
  const bag={g:gh,d:dh}, idx=r=>c.rows.filter(x=>x.type===r.type).indexOf(r)+1;
  const nb=$("#charmNext"); nb.innerHTML=next.length?`<b>Next up</b>`+next.map((r,i)=>{ const L=num(r.lvl), k=CHARM_COSTS[L], miss=[];
      if(k[1]>bag.d) miss.push(`${fmt(k[1]-Math.max(0,bag.d))} Designs`); if(k[0]>bag.g) miss.push(`${fmt(k[0]-Math.max(0,bag.g))} Guides`); bag.g-=k[0]; bag.d-=k[1];
      return `<br><span class="hgnum${miss.length?"":" go"}">${i+1}</span> ${esc(r.type)} <b>Charm ${idx(r)}</b> <span class="faint">Lv ${L} → ${L+1}</span> · ${miss.length?`<span class="bad">short ${miss.join(" + ")}</span>`:'<span class="ok">ready ✓</span>'}`; }).join("")+
    `<br><span class="faint" style="font-size:13.5px">Tiles show what these 3 need. The end goal gets done one level at a time.</span>`:"<b>All charms at target ✓</b>";
  if(cpl.length){ const bag={g:gh,d:dh};
    nb.innerHTML=`<b>Optimiser plan</b> <span class="faint">${c.planDate?"· "+esc(fd(c.planDate)):""}</span>`+cpl.map((x,i)=>{ let what,cost;
      if(x.kind==="x"){ what=`<b>Exchange</b> <span class="faint">Guides → Designs (50%)</span>`; const ok=bag.g>=x.g; bag.g-=x.g; bag.d+=x.d; cost=`<span class="${ok?"ok":"bad"}">−${fmt(x.g)} Guides ${ok?"✓":"✗"}</span> · <span class="ok">+${fmt(x.d)} Designs</span>`; }
      else { const r=charmPlanRow(x); what=`${esc(x.type)} <b>Charm ${x.i}</b> <span class="faint">${charmLvH(r)} → ${x.toS?`Lv ${x.toL} · ${x.toS}/5`:`Lv ${x.toL}`}</span>${x.gain?` <span class="gold">+${x.gain}%</span>`:""}`;
        cost=[["g","Guides"],["d","Designs"]].map(([k,l])=>{ const ok=bag[k]>=x[k]; bag[k]-=x[k]; return `<span class="${ok?"ok":"bad"}">${fmt(x[k])} ${l} ${ok?"✓":"✗"}</span>`; }).join(" · "); }
      return `<div class="hgplan"><span class="hgnum">${i+1}</span><span class="hgp-t">${what}<br><span class="hgp-c">${cost}</span></span><button class="didit chp-done" data-i="${i}">✓ Done</button></div>`; }).join("")+
      `<span class="faint" style="font-size:13.5px">Tap Done after you do it in game — it updates your Guides, Designs and the charm.</span>`;
    bindAll(nb,".chp-done",b=>{ const x=cpl[+b.dataset.i], snap=JSON.stringify(state); charmPlanApply(x); afterEdit(); toast("Charm plan step done",snap); }); }
  $("#charmBody").innerHTML=order.map(type=>{ const rows=c.rows.filter(r=>r.type===type); if(!rows.length) return "";
    let g=0,d=0,lv=0,tg=0,at=0; rows.forEach(r=>{ const m=charmRem(r.lvl,r.tgt,num(r.st)); g+=m.g; d+=m.d; lv+=r.lvl; tg+=r.tgt; if(r.lvl>=r.tgt) at++; });
    const done=at===rows.length;
    return `<button class="vcard ${done?"s-done":""}" data-t="${type}">${EDIT_ICON}<span class="vc-top"><span class="vc-name">${type} charms</span>${type==="Infantry"?tagH("gold","first"):""}<span class="vc-meta">avg Lv ${(lv/rows.length).toFixed(1)}</span></span>
      <span class="charm6">${rows.map((r,i)=>`<span style="padding:6px 8px;border-radius:9px;border:1px solid ${r.lvl>=r.tgt?"var(--green)":"var(--line)"};background:var(--panel-2)"><span class="faint" style="font-size:12.5px;display:block">Charm ${i+1}</span><b class="mono">${r.lvl}</b>${num(r.st)?`<span class="faint mono" style="font-size:12.5px">·${num(r.st)}/5</span>`:""}<span class="faint mono" style="font-size:13px"> → ${r.tgt}</span></span>`).join("")}</span>
      <span class="vc-line">${(()=>{ if(done) return '<span class="ok">All at target ✓</span>'; const nx=rows.filter(r=>r.lvl<r.tgt).sort((a,b)=>a.lvl-b.lvl)[0], k=CHARM_COSTS[nx.lvl];
        return `Next: Charm ${rows.indexOf(nx)+1} Lv ${nx.lvl} → ${nx.lvl+1} · <b>${fmt(k[1])}</b> Designs + <b>${fmt(k[0])}</b> Guides <span class="faint">· ${at}/${rows.length} at target</span>`; })()}</span>${barH(pc(lv,tg),done?"ok":"")}</button>`; }).join("");
  bindAll($("#charmBody"),".vcard",b=>openCharmSheet(b.dataset.t));
}
function openCharmMatsSheet(){
  const h=state.charms.have;
  openSheet({title:"Charm materials",sub:"In your bag right now.",build(f){
    f.appendChild(frow(fld("Charm Guides",{type:"num",value:h.guides,get:()=>h.guides,set:v=>h.guides=v}),fld("Charm Designs",{type:"num",value:h.designs,get:()=>h.designs,set:v=>h.designs=v})));
  }});
}
function openCharmSheet(type){
  const c=state.charms, rows=c.rows.filter(r=>r.type===type), opts=Array.from({length:23},(_,i)=>[String(i),"Lv "+i]);
  openSheet({title:`${type} charms`,sub:"Current level → target for each charm.",build(f){
    const all=document.createElement("div"); all.className="frow";
    let setTo=String(rows[0]?rows[0].tgt:10);
    all.appendChild(fld("Set all 6 targets to",{type:"select",value:setTo,options:opts,set:v=>{ setTo=v; rows.forEach(r=>r.tgt=parseInt(v,10)); }}));
    f.appendChild(all);
    const list=document.createElement("div"); list.className="stack"; f.appendChild(list);
    const inf=infoBox(); f.appendChild(inf);
    const draw=()=>{ list.innerHTML=""; rows.forEach((r,i)=>{ list.appendChild(frow(fld(`Charm ${i+1} now`,{type:"select",value:String(r.lvl),options:opts,set:v=>r.lvl=parseInt(v,10)}),fld(`Charm ${i+1} target`,{type:"select",value:String(r.tgt),options:opts,set:v=>r.tgt=parseInt(v,10)}))); }); };
    let lastT=rows.map(r=>r.tgt).join();
    const rf=()=>{ let g=0,d=0; rows.forEach(r=>{ const m=charmRem(r.lvl,r.tgt,num(r.st)); g+=m.g; d+=m.d; }); inf.innerHTML=`To reach your targets: <b>${fmt(g)}</b> Guides · <b>${fmt(d)}</b> Designs`;
      const t=rows.map(r=>r.tgt).join(); if(t!==lastT){ lastT=t; draw(); } };
    draw(); rf(); return rf; }});
}

/* ---------- pets ---------- */
function renderPets(){
  const P=state.pets; if(!P.have) P.have={};
  P.rows.forEach(r=>{ const i=PET_INFO[r.n]; if(i&&!num(r.max)) r.max=i.max; });
  const t={food:0,manuals:0,potions:0,medals:0,kvk:0,ab:0};
  P.rows.filter(r=>num(r.lvl)>0).forEach(r=>{ const c=petCost(r); if(c) Object.keys(t).forEach(k=>t[k]+=c[k]); });
  const M=[["food","Pet Food"],["manuals","Growth Manuals"],["potions","Nutrient Potions"],["medals","Medallions"]];
  const pn=petNextStep(), nxC=pn&&pn.cost; // shared with Home
  $("#petNext").innerHTML=pn?`<b>Next up:</b> ${esc(pn.r.n)} Lv ${num(pn.r.lvl)} → ${pn.to} — tiles show what that needs.`:"";
  $("#petMats").innerHTML=M.map(([k,l])=>stepTileH("pm_"+k,l,num(P.have[k]),nxC?nxC[k]:0,t[k])).join("")+
    tileH({id:"pm_tm",label:"Taming Marks",value:`${fmt(num(P.have.tmCommon))} · ${fmt(num(P.have.tmAdv))}`,sub:"common · advanced"});
  $$("#petMats .tile").forEach(x=>x.onclick=openPetMatsSheet);
  $("#petKvk").innerHTML=t.kvk?`Advancing your pets to target is worth <b class="gold">${fmt(t.kvk)}</b> KvK / Strongest Governor points (${fmt(t.ab)} Alliance Brawl) — save advances for those days.`:"";
  const b=$("#petBody");
  const atGoal=r=>{ const g=num(r.tgt)||num(r.max); return num(r.lvl)>0&&g>0&&num(r.lvl)>=g; };
  const card=r=>{ const sk=PET_SKILL[r.n], info=PET_INFO[r.n], lv=num(r.lvl), mx=num(r.max), goal=num(r.tgt)||mx, done=goal>0&&lv>=goal, c=petCost(r), nextAdv=(Math.floor(lv/10)+1)*10;
    const cls=!lv?"s-dim":done?"s-done":"";
    return `<button class="vcard ${cls}" data-i="${P.rows.indexOf(r)}">${EDIT_ICON}<span class="vc-top">${sk&&sk[1]<=10?`<span class="rank">#${sk[1]}</span>`:""}<span class="vc-name">${esc(r.n||"Pet")}</span>${info?`<span class="vc-meta">Gen ${info.gen}</span>`:""}</span>
      ${sk&&sk[0]?`<span class="vc-line"><b>${esc(sk[0])}</b>${sk[2]?" · "+esc(sk[2]):""}</span>`:sk&&sk[2]?`<span class="vc-line">${esc(sk[2])}</span>`:""}
      <span class="vc-big">${lv}<small>/ ${goal||"?"}${num(r.tgt)?" target":""}</small></span>${barH(pc(lv,goal),done?"ok":"")}
      <span class="vc-line">${!lv?"Not owned yet":done?'<span class="ok">At target ✓</span>':c?`Next advance Lv ${mx&&nextAdv>mx?mx:nextAdv} · to target: food ${c.exact?"":"~"}${fmtBig(c.food)}, manuals ${fmt(c.manuals)}`:""}</span></button>`; };
  const sorted=P.rows.slice().sort((a,c)=>petRank(a)-petRank(c)), act=sorted.filter(r=>!atGoal(r)), mxd=sorted.filter(atGoal);
  b.innerHTML=act.map(card).join("");
  const mh=$("#petMaxed"); mh.hidden=!mxd.length;
  mh.innerHTML=`<summary><span class="grow">Pets at target <span class="faint" style="font-weight:500">(${mxd.length})</span></span></summary><div class="fbody"><div class="grid" style="--min:200px">${mxd.map(card).join("")}</div></div>`;
  if(state.ui.petMaxOpen) mh.open=true; mh.ontoggle=()=>{ state.ui.petMaxOpen=mh.open; scheduleSave(); };
  [b,mh].forEach(h=>bindAll(h,".vcard",x=>openPetSheet(P.rows[+x.dataset.i])));
  on("addPet",()=>{ const r={n:"",lvl:0,tgt:0,max:0}; P.rows.push(r); afterEdit(); openPetSheet(r); });
}
function openPetMatsSheet(){
  const h=state.pets.have;
  openSheet({title:"Pet materials",sub:"In your bag right now.",build(f){
    f.appendChild(frow(fld("Pet Food",{type:"num",value:h.food,get:()=>h.food,set:v=>h.food=v}),fld("Growth Manuals",{type:"num",value:h.manuals,get:()=>h.manuals,set:v=>h.manuals=v})));
    f.appendChild(frow(fld("Nutrient Potions",{type:"num",value:h.potions,get:()=>h.potions,set:v=>h.potions=v}),fld("Promotion Medallions",{type:"num",value:h.medals,get:()=>h.medals,set:v=>h.medals=v})));
    f.appendChild(frow(fld("Common Taming Marks",{type:"num",value:h.tmCommon,get:()=>h.tmCommon,set:v=>h.tmCommon=v}),fld("Advanced Taming Marks",{type:"num",value:h.tmAdv,get:()=>h.tmAdv,set:v=>h.tmAdv=v})));
  }});
}
function openPetSheet(r){
  openSheet({title:r.n||"New pet",sub:(PET_SKILL[r.n]&&PET_SKILL[r.n][0])||"Pet",build(f){
    f.appendChild(fld("Pet",{value:r.n,list:"petList",set:v=>{ r.n=v; if(PET_INFO[v]) r.max=PET_INFO[v].max; }}));
    f.appendChild(frow(fld("Level",{type:"num",value:r.lvl,get:()=>r.lvl,set:v=>r.lvl=v,min:0}),fld("Target",{type:"num",value:r.tgt||"",get:()=>r.tgt||"",ph:"max",allowEmpty:true,set:v=>r.tgt=v===""?0:v}),fld("Max",{type:"num",value:r.max||"",get:()=>r.max||"",allowEmpty:true,set:v=>r.max=v===""?0:v})));
    const inf=infoBox(); f.appendChild(inf);
    const rf=()=>{ const c=petCost(r), sk=PET_SKILL[r.n];
      inf.innerHTML=(sk?`${sk[1]<=14?`Priority <b>#${sk[1]}</b> · `:""}${sk[0]?`<b>${esc(sk[0])}</b>`:""}${sk[2]?" · "+esc(sk[2]):""}<br>`:"")+
        (c?`To target: food <b>${c.exact?"":"~"}${fmt(c.food)}</b> · manuals <b>${fmt(c.manuals)}</b> · potions <b>${fmt(c.potions)}</b> · medallions <b>${fmt(c.medals)}</b><br>Worth <b>${fmtBig(c.kvk)}</b> KvK / SG points`:"Pick a pet from the list to see costs."); };
    rf(); return rf; },
    onDelete:()=>{ const i=state.pets.rows.indexOf(r); if(i>-1) state.pets.rows.splice(i,1); }});
}

/* ---------- gold hero shards: star tiers ----------
   Each star has 6 steps (T0–T5). The first 5 steps cost the tier's base amount and the 6th costs the next tier's base:
   0★: 1,1,1,1,1,5 · 1★: 5×5 + 15 · 2★: 15×5 + 40 · 3★: 40×5 + 100 · 4★: 100×6  → 0★ to 5★ = 1,065 shards */
const SHARD_LEAF=[1,1,1,1,1,5, 5,5,5,5,5,15, 15,15,15,15,15,40, 40,40,40,40,40,100, 100,100,100,100,100,100];
const SHARD_MAX=SHARD_LEAF.length; // 30 = 5★ max
const starLabel=p=>p>=SHARD_MAX?"5★ Max":`${Math.floor(p/6)}★ T${p%6}`;
const starGlyphs=p=>{ const s=Math.min(5,Math.floor(p/6)); return "★".repeat(s)+"☆".repeat(5-s); };
const STAR_OPTS=Array.from({length:SHARD_MAX+1},(_,i)=>[String(i),starLabel(i)]);
const hasStars=r=>r.pos!=null&&r.pos!=="";
function shardNeed(r){ if(!hasStars(r)) return num(r.need); const a=Math.max(0,Math.min(SHARD_MAX,num(r.pos))), b=Math.max(a,Math.min(SHARD_MAX,r.tgt==null||r.tgt===""?SHARD_MAX:num(r.tgt))); let t=0; for(let i=a;i<b;i++) t+=SHARD_LEAF[i]; return t; }
let shardFocus=null;
function renderShards(){
  const L=state.goldShards||[]; let N=0,H=0,S=0,dn=0;
  L.forEach(r=>{ const n=shardNeed(r),h=num(r.have); N+=n; H+=Math.min(h,n); S+=Math.max(0,n-h); if(h>=n&&n>0) dn++; });
  const top=shardOrder()[0]; // most-used hero still short
  // rally heroes for shards (one-time default: Ava, Yang, Wee & Woo — change per hero in its edit panel)
  if(!state.shardRallySet){ L.forEach(r=>{ r.rally=["Ava","Yang","Wee & Woo"].includes(r.n); }); state.shardRallySet=true; }
  const gen=num(state.shardGeneral), genFor=genOrder()[0]; // general shards → most-used hero still short
  const tn=top&&hasStars(top)?SHARD_LEAF[num(top.pos)]:0;
  $("#shardTiles").innerHTML=(top?stepTileH("shNext",`Focus: ${esc(top.n)} → ${hasStars(top)?esc(starLabel(num(top.pos)+1)):"?"}`,num(top.have),tn,shardNeed(top)):tileH({label:"Focus hero",value:"All done",txt:true}))+
    tileH({id:"shGen",label:"General Mythic shards",value:fmt(gen),sub:genFor?`use on <b>${esc(genFor.n)}</b>`:"any hero except Amadeus & Helga"});
  on("shNext",()=>top&&openShardSheet(top)); on("shGen",openGeneralShardSheet);
  const b=$("#goldShardBody");
  const starPos=r=>hasStars(r)?num(r.pos):-1, isDone=r=>{ const n=shardNeed(r); return (hasStars(r)&&num(r.pos)>=SHARD_MAX)||(n>0&&num(r.have)>=n); };
  const order=L.map((r,i)=>({r,i})).sort((a,c)=>heroUse(c.r.n)-heroUse(a.r.n)||starPos(c.r)-starPos(a.r)||String(a.r.n).localeCompare(String(c.r.n)));
  const open=order.filter(x=>!isDone(x.r)), focus=open.slice(0,3), next=open.slice(3).filter(x=>heroUse(x.r.n)>=15), spare=open.slice(3).filter(x=>heroUse(x.r.n)<15), done=order.filter(x=>isDone(x.r));
  let rank=0;
  const row=({r,i})=>{ rank++; const h=num(r.have),st=hasStars(r),p=num(r.pos),maxed=st&&p>=SHARD_MAX,nx=st&&!maxed?SHARD_LEAF[p]:0,ready=nx&&h>=nx;
    return `<div class="shrow2 ${maxed?"done":""}" data-i="${i}">
      <button class="sh2-id" data-i="${i}" aria-label="Edit ${esc(r.n||"hero")}"><span class="shr-rank">${rank}</span>
        <span class="sh2-who"><span class="sh2-name">${esc(r.n||"Hero")}${r.rally?" ⚔":""}</span>
        <span class="sh2-star">${st?`<span class="gold">${starGlyphs(p)}</span> ${esc(starLabel(p))}`:'<span class="faint">tap to set stars</span>'} <span class="sh2-use">· Use ${heroUse(r.n)}</span></span></span></button>
      <label class="sh2-have">Have <input inputmode="numeric" data-i="${i}" value="${h}" aria-label="${esc(r.n)} shards in hand"></label>
      <span class="sh2-out">${maxed?'<span class="ok">5★ max ✓</span>':!st?"":ready?`<button class="didit sh2-up" data-i="${i}">Upgrade → ${esc(starLabel(p+1))}</button>`:`<span class="bad">${fmt(nx-h)} short</span> of ${fmt(nx)}`}</span>
      ${maxed||!st?"":barH(pc(h,nx),ready?"ok":"")}</div>`; };
  const grp=(t,sub)=>`<div class="shgrp"><span>${t}</span><small>${sub}</small></div>`;
  b.innerHTML=(focus.length?grp("Focus now","")+focus.map(row).join(""):"")+
    (next.length?grp("Next up","")+next.map(row).join(""):"")+
    (spare.length?`<details class="shfold"${state.ui.shSpare?" open":""} data-k="shSpare"><summary>${grp(`Spare shards only (${spare.length})`,"")}</summary>${spare.map(row).join("")}</details>`:"")+
    (done.length?`<details class="shfold"${state.ui.shDone?" open":""} data-k="shDone"><summary>${grp(`Done (${done.length})`,"")}</summary>${done.map(row).join("")}</details>`:"")||`<div class="empty">No heroes yet</div>`;
  b.querySelectorAll("details.shfold").forEach(d=>d.ontoggle=()=>{ state.ui[d.dataset.k]=d.open; scheduleSave(); });
  bindAll(b,".sh2-id",x=>openShardSheet(L[+x.dataset.i]));
  bindAll(b,".sh2-up",x=>{ const r=L[+x.dataset.i], p=num(r.pos), snap=JSON.stringify(state); r.pos=p+1; r.have=Math.max(0,num(r.have)-SHARD_LEAF[p]); afterEdit(); toast(`${r.n}: ${starLabel(p+1)} (−${SHARD_LEAF[p]} shards)`,snap); });
  b.querySelectorAll(".sh2-have input").forEach(x=>{ x.onfocus=()=>x.select(); x.onkeydown=e=>{ if(e.key==="Enter") x.blur(); };
    x.onchange=()=>{ const r=L[+x.dataset.i]; if(!/\d/.test(x.value)){ x.value=num(r.have); return; } const v=Math.max(0,num(x.value)); r.have=Math.round(v); afterEdit(); }; });
  on("addGoldShard",()=>{ const r={n:"New hero",need:0,have:0,pos:0,tgt:SHARD_MAX}; L.push(r); afterEdit(); openShardSheet(r); });
}
function shardOrder(){ // every hero still short, most-used first
  return (state.goldShards||[]).filter(r=>shardNeed(r)>num(r.have)&&!(hasStars(r)&&num(r.pos)>=SHARD_MAX)).sort((a,b)=>heroUse(b.n)-heroUse(a.n));
}
function genOrder(){ // heroes general shards can go to, most-used first (not Amadeus/Helga, not done)
  return (state.goldShards||[]).filter(r=>!/amadeus|helga/i.test(r.n||"")&&shardNeed(r)>num(r.have)).sort((a,b)=>heroUse(b.n)-heroUse(a.n));
}
function openGeneralShardSheet(){
  openSheet({title:"General Mythic shards",sub:"Fit any Mythic hero except Amadeus and Helga.",build(f){
    f.appendChild(fld("General shards in hand",{type:"num",value:state.shardGeneral||0,get:()=>state.shardGeneral||0,set:v=>state.shardGeneral=v}));
    const inf=infoBox(); f.appendChild(inf);
    const rf=()=>{ const g=num(state.shardGeneral), top=genOrder().slice(0,3);
      inf.innerHTML=`<b>Best use:</b> most-used heroes first — `+(top.length?top.map(r=>`${esc(r.n)} needs <b>${fmt(shardNeed(r)-num(r.have))}</b>`).join(", then "):"all done")+
        `.<br>Amadeus only takes his own shards.`+(g?`<br>You have <b>${fmt(g)}</b> to place.`:""); };
    rf(); return rf; }});
}
function openShardSheet(r){
  openSheet({title:r.n||"Hero",sub:"Star tier and hero shards.",build(f){
    f.appendChild(fld("Hero",{value:r.n,set:v=>r.n=v}));
    f.appendChild(frow(fld("Star tier now",{type:"select",value:hasStars(r)?String(num(r.pos)):"",options:(hasStars(r)?[]:[["","— not set —"]]).concat(STAR_OPTS),set:v=>{ r.pos=v===""?null:parseInt(v,10); if(r.tgt==null) r.tgt=SHARD_MAX; }}),
      fld("Target",{type:"select",value:String(r.tgt==null?SHARD_MAX:num(r.tgt)),options:STAR_OPTS,set:v=>r.tgt=parseInt(v,10)})));
    f.appendChild(fld("Hero shards in hand",{type:"num",value:r.have,get:()=>r.have,set:v=>r.have=v}));
    f.appendChild(fld("Rally hero (⚔ marker)",{type:"check",value:r.rally,set:v=>r.rally=v}));
    const inf=infoBox(); f.appendChild(inf);
    const rf=()=>{ if(!hasStars(r)){ inf.innerHTML=`Set the star tier and the shards needed are worked out for you. (Old number: <b>${fmt(num(r.need))}</b>)`; return; }
      const n=shardNeed(r), h=num(r.have), p=num(r.pos), nx=p<SHARD_MAX?SHARD_LEAF[p]:0;
      inf.innerHTML=p>=SHARD_MAX?"5★ Max ✓":`Next step (${esc(starLabel(p+1))}): <b>${nx}</b> shards<br>To ${esc(starLabel(r.tgt==null?SHARD_MAX:num(r.tgt)))}: <b>${fmt(n)}</b> shards · ${h>=n?'<span class="ok">you have enough ✓</span>':`<span class="bad">${fmt(n-h)} short</span>`}`; };
    rf(); return rf;
  },onDelete:()=>{ const i=state.goldShards.indexOf(r); if(i>-1) state.goldShards.splice(i,1); }});
}

/* ---------- governor gear ---------- */
/* ---------- governor gear plan (your rule) ----------
   Infantry + Archer go up a tier first; Cavalry follows one tier behind:
   Inf+Arch → Gold T1, Inf+Arch → Gold T2, Cav → Gold T1, Inf+Arch → Gold T3, Cav → Gold T2 … (each tier = its 0★) */
const GOV_MS=[14,18,22,26,30,34,38,42,46,50,54]; // Gold, Gold T1, Gold T2, Gold T3, Red, Red T1 …
const govIsCav=p=>/cav/i.test(p.name||"");
function govPlan(){
  const g=state.govGear, main=g.pieces.filter(p=>!govIsCav(p)), cav=g.pieces.filter(govIsCav);
  const goals=[]; for(let i=1;i<GOV_MS.length;i++){ goals.push({who:"main",to:GOV_MS[i]}); goals.push({who:"cav",to:GOV_MS[i-1]}); }
  const set=w=>w==="main"?main:cav, open=G=>set(G.who).some(p=>num(p.cur)<G.to);
  const ci=goals.findIndex(open), cur=ci<0?null:goals[ci];
  const mainT=(goals.find(G=>G.who==="main"&&open(G))||{to:GOV_MS[GOV_MS.length-1]}).to;
  const cavT=(goals.find(G=>G.who==="cav"&&open(G))||{to:GOV_MS[GOV_MS.length-1]}).to;
  const label=G=>`${G.who==="main"?"Infantry + Archer":"Cavalry"} → ${GOV_TIERS[G.to][0]}`;
  const tgtOf=p=>govIsCav(p)?cavT:mainT;
  const step=cur?set(cur.who).filter(p=>num(p.cur)<cur.to).sort((a,b)=>num(a.cur)-num(b.cur)):[];
  let s=0,t=0,v=0; step.forEach(p=>{ const r=govRem(num(p.cur),cur.to); s+=r.s; t+=r.t; v+=r.v; });
  return {goals,ci,cur,label,tgtOf,step,need:{s,t,v}};
}
function renderGov(){
  const g=state.govGear; if(!g.have) g.have={satin:0,threads:0,vision:0};
  const P=govPlan(), cur=P.cur; const {s,t,v}=P.need;
  const at=cur?(cur.who==="main"?g.pieces.filter(p=>!govIsCav(p)):g.pieces.filter(govIsCav)).filter(p=>num(p.cur)>=cur.to).length:6, of=cur?(cur.who==="main"?g.pieces.filter(p=>!govIsCav(p)).length:g.pieces.filter(govIsCav).length):6;
  $("#govPlan").innerHTML=`<b>Your plan:</b> Infantry + Archer go up a tier first, Cavalry stays one tier behind.<br>`+
    P.goals.map((G,idx)=>({G,idx})).filter(({G,idx})=>idx===P.ci-1||idx===P.ci||(idx>P.ci&&(G.who==="main"?state.govGear.pieces.filter(p=>!govIsCav(p)):state.govGear.pieces.filter(govIsCav)).some(p=>num(p.cur)<G.to))).slice(0,4).map(({G,idx})=>{ const done=idx<P.ci||P.ci<0, now=idx===P.ci;
      return `<span class="${done?"ok":now?"":"faint"}">${done?"✓":now?"▶":"·"} ${esc(P.label(G))}</span>${now&&P.step.length?` <span class="faint">— next: ${P.step.map(p=>`${esc(p.name)} (${esc(GOV_TIERS[num(p.cur)][0])})`).join(", ")}</span>`:""}`; }).join("<br>");
  const gpl=govPlanLeft();
  if(gpl.length){ const bag={s:num(g.have.satin),t:num(g.have.threads),v:num(g.have.vision)};
    $("#govPlan").innerHTML=`<b>Optimiser plan</b> <span class="faint">${g.planDate?"· "+esc(fd(g.planDate)):""}</span>`+gpl.map((x,i)=>{ const p=govPlanPiece(x), n=govRem(num(p.cur),x.to);
      const cost=[["s","Satin"],["t","Threads"],["v","Vision"]].filter(([k])=>n[k]).map(([k,l])=>{ const ok=bag[k]>=n[k]; bag[k]-=n[k]; return `<span class="${ok?"ok":"bad"}">${fmtK(n[k])} ${l} ${ok?"✓":"✗"}</span>`; }).join(" · ");
      return `<div class="hgplan"><span class="hgnum">${i+1}</span><span class="hgp-t"><b>${esc(p.name)}</b> <span class="faint">${esc(GOV_TIERS[num(p.cur)][0])} → ${esc(GOV_TIERS[x.to][0])}</span>${x.gain?` <span class="gold">+${x.gain}%</span>`:""}<br><span class="hgp-c">${cost}</span></span><button class="didit gvp-done" data-i="${i}">✓ Done</button></div>`; }).join("")+
      `<span class="faint" style="font-size:13.5px">Tap Done after you do it in game — it spends the materials and updates the piece.</span>`;
    bindAll($("#govPlan"),".gvp-done",bt=>{ const x=gpl[+bt.dataset.i], p=govPlanPiece(x), n=govRem(num(p.cur),x.to), snap=JSON.stringify(state);
      g.have.satin=num(g.have.satin)-n.s; g.have.threads=num(g.have.threads)-n.t; g.have.vision=num(g.have.vision)-n.v; p.cur=x.to; afterEdit(); toast(`${p.name}: ${GOV_TIERS[x.to][0]}`,snap); }); }
  const gn=govNextStep(), np=gn&&gn.p, n1=gn?gn.need:{s:0,t:0,v:0}; // next single upgrade, shared with Home
  const mt=(id,l,need,have)=>stepTileH(id,l,have,{gvS:n1.s,gvG:n1.t,gvV:n1.v}[id],need);
  $("#govTiles").innerHTML=tileH({id:"gvT",label:"Current step",value:cur?esc(GOV_TIERS[cur.to][0]):"Plan done",txt:true,sub:cur?`${cur.who==="main"?"Inf + Archer":"Cavalry"} · ${at}/${of} there`:"",p:pc(at,of),cls:at===of?"ok":""})+
    mt("gvS","Satin",s,num(g.have.satin))+mt("gvG","Gilded Threads",t,num(g.have.threads))+mt("gvV","Artisan's Vision",v,num(g.have.vision));
  on("gvT",()=>P.step[0]&&openGovPieceSheet(P.step[0])); ["gvS","gvG","gvV"].forEach(id=>on(id,openGovMatsSheet));
  const b=$("#govBody");
  b.innerHTML=g.pieces.map((p,i)=>{ const tgt=P.tgtOf(p), done=p.cur>=tgt, r=govRem(p.cur,tgt);
    return `<button class="vcard ${done?"s-done":""}" data-i="${i}">${EDIT_ICON}<span class="vc-top"><span class="vc-name">${esc(p.name||"Piece")}</span></span><span class="vc-big" style="font:700 17px var(--f-body);color:var(--text)">${esc(GOV_TIERS[p.cur]?GOV_TIERS[p.cur][0]:"—")}</span>${barH(tgt>0?pc(p.cur,tgt):100,done?"ok":"")}<span class="vc-line">${done?'<span class="ok">At target ✓</span>':(P.cur&&P.cur.who!==(govIsCav(p)?"cav":"main"))?`<span class="faint">waits — ${esc(GOV_TIERS[tgt][0])} after ${govIsCav(p)?"Inf + Archer go up":"Cavalry catches up"}</span>`:`→ ${esc(GOV_TIERS[tgt][0])} · ${fmtBig(r.s)} Satin`}</span></button>`; }).join("");
  bindAll(b,".vcard",x=>openGovPieceSheet(g.pieces[+x.dataset.i]));
  $("#govNote").innerHTML=(np?`Materials above: the next upgrade, <b>${esc(np.name)}</b> → ${esc((GOV_TIERS[num(np.cur)+1]||[""])[0])}. The faint line is the whole current step. `:"")+"Each card shows that piece's own target (Cavalry's is one tier lower).";
}
const govOpts=()=>GOV_TIERS.map((r,i)=>[String(i),r[0]]);
function openGovTargetSheet(){ const g=state.govGear; openSheet({title:"Governor Gear target",sub:"All 6 pieces aim for this tier.",build(f){ f.appendChild(fld("Target tier",{type:"select",value:String(g.targetIdx),options:govOpts(),set:v=>g.targetIdx=parseInt(v,10)})); }}); }
function openGovMatsSheet(){ const h=state.govGear.have; openSheet({title:"Governor Gear materials",sub:"In your bag right now.",build(f){
  f.appendChild(fld("Satin",{type:"num",value:h.satin,get:()=>h.satin,set:v=>h.satin=v}));
  f.appendChild(frow(fld("Gilded Threads",{type:"num",value:h.threads,get:()=>h.threads,set:v=>h.threads=v}),fld("Artisan's Vision",{type:"num",value:h.vision,get:()=>h.vision,set:v=>h.vision=v}))); }}); }
function openGovPieceSheet(p){ openSheet({title:p.name||"Piece",sub:"Governor Gear piece.",build(f){
  f.appendChild(fld("Name",{value:p.name,set:v=>p.name=v}));
  f.appendChild(fld("Current tier",{type:"select",value:String(p.cur),options:govOpts(),set:v=>p.cur=parseInt(v,10)}));
  const inf=infoBox(); f.appendChild(inf);
  const rf=()=>{ const r=govRem(p.cur,state.govGear.targetIdx); inf.innerHTML=p.cur>=state.govGear.targetIdx?"At target ✓":`To ${esc(GOV_TIERS[state.govGear.targetIdx][0])}: <b>${fmt(r.s)}</b> Satin · <b>${fmt(r.t)}</b> Threads · <b>${fmt(r.v)}</b> Vision`; }; rf(); return rf; }}); }

