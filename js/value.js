"use strict";
/* =====================================================================
   BEST VALUE — fills your monthly budget with the paid deals that close
   YOUR gaps fastest per A$.
   y = what a deal gives. alt:true = you choose ONE of the yields (a store you spend in).
   on = "always" (shop / cards) or a regex for the event it comes with.
   wk = weekly card (can be bought each week). est = amounts estimated.
   ===================================================================== */
const VALUE_ITEMS=[["tg","Truegold"],["gen","General shards"],["designs","Charm Designs"],["widgets","S7 widgets"],["lucky","Lucky Hero Gear chests"],["dust","Truegold Dust"]];
const GEMS_PER_SHARD=1500; // gems count as Hero Roulette spins: ~1 shard per 1,500 gems
const VALUE_DB=[
  {n:"Truegold Weekly Card",seen:"2026-10-19",a:7.99,pc:"4,600%",on:"always",wk:true,y:{tg:144}},
  {n:"Intel Monthly Pass",seen:"2026-10-19",a:7.99,pc:"4,625%",on:"always",y:{tg:105,gems:2500}},
  {n:"Truegold Dust Weekly Card",seen:"2026-10-19",a:7.99,on:"always",wk:true,y:{dust:180}},
  {n:"Truegold Myth",seen:"2026-10-26",a:14.99,pc:"4,900%",on:"always",y:{dust:430,gems:5000}},
  {n:"Weekly Benefits — Mythic Governor Charm",seen:"2026-10-26",a:14.99,pc:"6,500%",on:"always",wk:true,y:{designs:150,gems:5000}},
  {n:"Weekly Benefits — Epic Charm",seen:"2026-10-19",a:7.99,on:"always",wk:true,y:{designs:60,gems:2500}},
  {n:"Weekly Benefits — Mythic Hero Gear",seen:"2026-10-26",a:14.99,pc:"7,500%",on:"always",wk:true,y:{lucky:120,gems:5000}},
  {n:"Dragon Value Pack (spend in Dragon's Caravan)",seen:"2026-10-19",a:7.99,pc:"3,630%",on:/dragon essence/i,alt:true,y:{tg:140,designs:96,gen:15},note:"300 essence — pick one in the store"},
  {n:"Path of Honor (Hero Rally)",seen:"2026-10-26",a:14.99,pc:"3,343%",on:/hero rally/i,y:{gen:40,tg:140,gems:4800},note:"Pick the 40 General shards"},
  {n:"Audacious Adventure — Witchbane",seen:"2026-10-27",a:7.99,pc:"4,000%",on:/halloween/i,est:true,y:{tg:90,gen:5}},
  {n:"Audacious Adventure — Pranksterbane",seen:"2026-10-27",a:14.99,pc:"5,000%",on:/halloween/i,est:true,needs:"Audacious Adventure — Witchbane",y:{tg:180,gen:10}},
  {n:"Candy Party Pack II",seen:"2026-10-27",a:7.99,pc:"4,400%",on:/halloween/i,y:{tg:70,gems:2500}},
  {n:"Fishing Pro pass",seen:"2026-10-27",a:7.99,pc:"3,000%",on:/fishing/i,est:true,y:{tg:50,gen:2}},
  {n:"Fishing Master pass",seen:"2026-10-27",a:14.99,pc:"4,000%",on:/fishing/i,est:true,y:{tg:75}},
  {n:"Chameleos widgets (Ava)",seen:"2026-10-26",a:7.99,pc:"3,000%",on:/exclusive gear fund/i,y:{widgets:15}},
  {n:"Mortar widgets (Wee & Woo)",seen:"2026-10-26",a:7.99,pc:"3,000%",on:/exclusive gear fund/i,y:{widgets:15}}
];
const vLab=k=>(VALUE_ITEMS.find(x=>x[0]===k)||[k,k])[1];
const vLiveFor=d=>d.on==="always"?null:liveEvents().find(x=>d.on.test(x.e.n||""));
const vOnNow=d=>d.on==="always"||!!vLiveFor(d);
function vBuyBy(d){ const x=vLiveFor(d); if(!x||x.e.endOpen) return null; const t=new Date(gameToday()+"T00:00:00"); t.setDate(t.getDate()+(x.a.len-x.a.day)); return ymd(t); }
// what you're short of — the next few steps, so the plan closes real gaps instead of chasing end goals
function vNeeds(){
  const N=blockerNeeds(), out={};
  const B=(state.buildings||[]).filter(b=>!b.d&&BUILD_TIERS[b.n]); let tg=0, n=0;
  for(const b of B){ const st=BUILD_TIERS[b.n].steps; for(let i=b.stepIdx||0;i<st.length&&n<3;i++,n++) tg+=st[i].tg; if(n>=3) break; }
  out.tg=Math.max(0,tg-num(state.tg.have));
  out.designs=N.designs?N.designs.short:0;
  out.gen=N.gen?N.gen.short:0;
  const W=(state.widgets&&state.widgets.rows)||[]; out.widgets=["Ava","Wee & Woo"].reduce((t,h)=>{ const r=W.find(x=>x.hero===h); return t+(r?Math.max(0,widNext(num(r.lvl))-num(r.have)):0); },0);
  out.lucky=N.mg&&N.mg.short?N.mg.short*40:0; // a Mythic Gear is roughly 1 in 40 Lucky chests
  out.dust=Math.max(0,computeTarget()-num(state.dust.current));
  return out; }
const vY=(d,k)=>num(d.y[k])+(k==="gen"?num(d.y.gems)/GEMS_PER_SHARD:0);
function vPlanMonth(){ const cur=gameToday().slice(0,7), mo=state.packMonths||{}, closed=mo[cur]&&mo[cur].closed;
  const d=new Date(cur+"-01T00:00:00Z"); if(closed) d.setUTCMonth(d.getUTCMonth()+1); const key=d.toISOString().slice(0,7);
  const bought=(state.packs||[]).filter(p=>p.auto===key&&p.d), spent=num((mo[key]||{}).spent)+bought.reduce((t,p)=>t+num(p.aud),0), bud=num(state.packBudget)||100;
  return {key,label:d.toLocaleDateString(undefined,{month:"long",timeZone:"UTC"}),left:Math.max(0,bud-spent),bud,spent,bought}; }
// greedy: each step buys the deal that fills the most of your remaining gaps per A$ (an item stops counting once it's covered)
function vPick(keys,onlyNow,budget,already){
  const need=vNeeds(), rem={}; keys.forEach(k=>rem[k]=need[k]);
  const bought=already||[], boughtOf=n=>bought.filter(p=>p.t.startsWith(n)).length;
  bought.forEach(p=>{ const d=VALUE_DB.find(x=>p.t.startsWith(x.n)); if(d&&!d.alt) keys.forEach(k=>rem[k]=Math.max(0,rem[k]-vY(d,k))); });
  const owned=n=>(state.packs||[]).some(p=>p.d&&p.t.startsWith(n)); // one-off event passes you already bought (any month) aren't suggested again
  const cands=[]; VALUE_DB.filter(d=>(!onlyNow||vOnNow(d))&&(d.wk||!owned(d.n)||boughtOf(d.n))).forEach(d=>{ for(let c=boughtOf(d.n);c<(d.wk?4:1);c++) cands.push({d,c}); });
  const gain=d=>{ const parts=keys.filter(k=>rem[k]>0&&vY(d,k)>0).map(k=>({k,v:Math.min(vY(d,k),rem[k])/need[k]})); return d.alt?parts.sort((a,b)=>b.v-a.v).slice(0,1):parts; };
  const picked=[]; let left=budget;
  const ready=x=>x.c===boughtOf(x.d.n)||picked.some(p=>p.d===x.d&&p.c===x.c-1); // week 2 only after week 1
  for(;;){ let best=null;
    cands.forEach(x=>{ if(x.used||!ready(x)) return; let par=null;
      if(x.d.needs&&!picked.some(p=>p.d.n===x.d.needs)&&!boughtOf(x.d.needs)&&!owned(x.d.needs)){ par=cands.find(y=>y.d.n===x.d.needs&&!y.used); if(!par) return; }
      const cost=x.d.a+(par?par.d.a:0); if(cost>left) return;
      const v=[...gain(x.d),...(par?gain(par.d):[])].reduce((t,p)=>t+p.v,0)/cost;
      if(v>0&&(!best||v>best.v)) best={x,par,v}; });
    if(!best||best.v<.004) break;
    const add=x=>{ const g=gain(x.d); x.used=true; picked.push({d:x.d,c:x.c}); left-=x.d.a; g.forEach(p=>rem[p.k]=Math.max(0,rem[p.k]-vY(x.d,p.k))); };
    if(best.par) add(best.par); add(best.x); }
  return {picked,left,need,rem}; }
const vName=p=>p.d.n+(p.d.wk?` (week ${p.c+1})`:"");
function renderBestValue(){
  const host=$("#bestValue"); if(!host) return;
  if(!state.ui.bvPick) state.ui.bvPick=["tg","gen","designs"];
  state.ui.bvPick=state.ui.bvPick.filter(k=>VALUE_ITEMS.some(x=>x[0]===k));
  const keys=state.ui.bvPick, onlyNow=state.ui.bvNow!==false, M=vPlanMonth();
  const {picked,left,need,rem}=vPick(keys,onlyNow,M.left,M.bought);
  const order=picked.map((p,i)=>({p,i,by:vBuyBy(p.d)})).sort((a,b)=>(a.by||"9")<(b.by||"9")?-1:(a.by||"9")>(b.by||"9")?1:a.i-b.i);
  const fdD=s=>new Date(s+"T00:00:00").toLocaleDateString(undefined,{day:"numeric",month:"short"});
  const give=d=>d.alt?Object.entries(d.y).map(([k,v])=>`${fmt(v)} ${vLab(k)}`).join(" <i>or</i> "):Object.entries(d.y).map(([k,v])=>k==="gems"?`${fmt(v)} gems <i>(≈${Math.round(v/GEMS_PER_SHARD)} Roulette shards)</i>`:`${fmt(v)} ${vLab(k)}`).join(" · ");
  host.innerHTML=`<div class="card"><b style="font-size:16px">What do you want this month?</b>
      <div class="bvchips">${VALUE_ITEMS.map(([k,l])=>`<button class="chip" data-k="${k}" aria-pressed="${keys.includes(k)}">${l}${keys.includes(k)&&need[k]?` <small>· ${fmt(Math.round(need[k]))} short</small>`:""}</button>`).join("")}</div>
      <label class="bvnow"><input type="checkbox" id="bvNow"${onlyNow?" checked":""}> Only deals on now</label>
      <p class="faint" style="margin:6px 0 0;font-size:13.5px">Ranked by how much of what you're short of each A$ fills. Gems count as Hero Roulette shards.</p></div>`+
    `<div class="card mt"><div class="rowb"><b style="font-size:16px">Best buys for ${esc(M.label)}</b><button class="btn ghost sm mono" id="bvBud">A$${M.left.toFixed(2)} left of ${M.bud} ✎</button></div>`+
    (M.bought.length?`<p class="faint" style="margin:4px 0 0">Bought so far: ${M.bought.map(p=>esc(p.t)).join(", ")}</p>`:"")+
    (picked.length?`<ol class="bvlist">${order.map(({p,by})=>`<li><div class="bvrow"><b>${esc(vName(p))}</b><span class="mono gold">A$${p.d.a.toFixed(2)}</span></div>
        <span class="muted">${give(p.d)}</span>${p.d.pc?` <span class="faint">· ${p.d.pc}</span>`:""}${p.d.est?' <span class="tag plain">estimate</span>':""}${staleDays(p.d.seen)>STALE_DAYS?` <span class="tag warn">price seen ${staleDays(p.d.seen)}d ago — check</span>`:""}
        ${by?`<br><span class="tag warn">buy by ${fdD(by)}</span>`:""}${p.d.note?` <span class="faint">${esc(p.d.note)}</span>`:""}</li>`).join("")}</ol>
      <div class="rcrows">${keys.map(k=>{ const got=need[k]-rem[k]; return need[k]?`<div class="rcrow"><span>${vLab(k)}</span><b>${got>0?`<span class="ok">+${fmt(Math.round(got))}</span>`:"+0"} of ${fmt(Math.round(need[k]))} short</b></div>`:`<div class="rcrow"><span>${vLab(k)}</span><b class="faint">not short ✓</b></div>`; }).join("")}
        <div class="rcrow"><span>Spend</span><b>A$${(M.left-left).toFixed(2)} · A$${left.toFixed(2)} left</b></div></div>
      <button class="btn primary mt" id="bvUse">Use this as my ${esc(M.label)} plan</button>
      <p class="faint" style="margin:6px 0 0;font-size:13.5px">Puts these in Shops &amp; Packs (replacing unbought plan items). Tick them there as you buy — they come off this budget.</p>`
      :`<p class="faint">${keys.length?"Nothing on now closes what you picked — untick “Only deals on now” to see what's coming.":"Pick at least one item above."}</p>`)+`</div>`+
    `<h3 class="sgsec">Best per A$, by item</h3>`+
    keys.map(k=>{ const per=d=>vY(d,k)/d.a, L=VALUE_DB.filter(d=>vY(d,k)>0).sort((a,b)=>per(b)-per(a)).slice(0,4); if(!L.length) return "";
      const f=v=>v>=10?fmt(Math.round(v)):v.toFixed(1);
      return `<details class="fold mt"${k===keys[0]?" open":""}><summary><span class="grow">${vLab(k)}</span><small class="faint">best ${f(per(L[0]))} per A$</small></summary><div class="fbody">${L.map((d,i)=>`<div class="rcrow"><span>${i+1}. ${esc(d.n)} ${vOnNow(d)?'<span class="tag ok">on now</span>':""}${d.est?' <span class="tag plain">est.</span>':""}</span><b>${f(per(d))}/A$</b></div>`).join("")}</div></details>`; }).join("");
  host.querySelectorAll(".bvchips .chip").forEach(c=>c.onclick=()=>{ const k=c.dataset.k, L=state.ui.bvPick, i=L.indexOf(k); if(i>-1) L.splice(i,1); else L.push(k); scheduleSave(); renderBestValue(); });
  const nw=$("#bvNow"); nw.onchange=()=>{ state.ui.bvNow=nw.checked; scheduleSave(); renderBestValue(); };
  on("bvBud",openPackBudgetSheet);
  on("bvUse",()=>{ const snap=JSON.stringify(state), P=state.packs||(state.packs=[]);
    for(let i=P.length-1;i>=0;i--) if(!P[i].d&&(P[i].auto||/^Nov\b/.test(P[i].note||""))) P.splice(i,1); // replace unbought plan items
    order.slice().reverse().forEach(({p,by})=>P.unshift({t:vName(p),aud:p.d.a,kind:"once",d:false,auto:M.key,note:[`${M.label} plan`,by?`buy by ${fdD(by)}`:"",p.d.pc||"",p.d.note||""].filter(Boolean).join(" · ")}));
    afterEdit(); toast(`${M.label} plan saved to Shops & Packs`,snap); });
}
