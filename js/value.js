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
  {n:"Mobilization Booster Pack",seen:"2026-10-30",a:2.99,pc:"4,000%",on:/alliance mobilization/i,y:{gen:4,tg:20,gems:1000},note:"1 a day during the event"},
  {n:"Victorious Mobilization Pack",seen:"2026-10-30",a:2.99,pc:"4,000%",on:/alliance mobilization/i,y:{tg:20,gems:1000},note:"1 a day · + 24 Artisan's Vision"},
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
  out.lucky=N.mg&&N.mg.short?Math.max(0,Math.round(N.mg.short/mythicRate().r)-num(hgChests().lucky)):0; // Lucky chests still needed after the ones in your bag (your logged rate, or ~1 in 40)
  out.dust=Math.max(0,computeTarget()-num(state.dust.current));
  return out; }
const vY=(d,k)=>num(d.y[k])+(k==="gen"?num(d.y.gems)/GEMS_PER_SHARD:0);
// The month's money: real A$ (budget − renewals − Star packs) plus Stars (balance + Star packs not yet bought this month)
const STAR_TIERS={0.99:99,1.49:99,2.99:199,4.99:299,7.99:499,14.99:999,30.99:1999,79.99:4999,159.99:9999}; // in-game A$ price → Stars (assumed; check one in game)
const starsFor=a=>STAR_TIERS[num(a).toFixed(2)*1]||Math.round(num(a)/0.0155);
const STAR_A=14.99/999; // ≈ A$ of packs per Star
const fxRate=()=>(num(state.fx)||1.55)*(1+(state.fxFee==null?3:num(state.fxFee))/100); // A$ per US$ incl. your bank's foreign fee — set both in the ⭐ panel
const WEB_STARS=[{id:"m",t:"Web store: 499 + 499 Stars",usd:4.99,stars:998},{id:"o",t:"Web store: 999 + 999 Stars (once ever)",usd:9.99,stars:1998,once:true}];
function vPlanMonth(){ const cur=gameToday().slice(0,7), mo=state.packMonths||{}, closed=mo[cur]&&mo[cur].closed;
  const d=new Date(cur+"-01T00:00:00Z"); if(closed) d.setUTCMonth(d.getUTCMonth()+1); const key=d.toISOString().slice(0,7);
  const P=state.packs||[], bought=P.filter(p=>p.auto===key&&p.d&&!p.web), bud=num(state.packBudget)||100;
  const thisMonth=p=>String(p.bought||"").slice(0,7)===key;
  // cards you own renew this month — set that money aside first (weekly cards ×4)
  const renew=P.filter(p=>p.d&&(p.kind==="month"||p.kind==="week")&&!p.auto&&!num(p.stars)).map(p=>({t:p.t,a:num(p.aud)*(p.kind==="week"?4:1)}));
  // Star packs: your Kingdom Special (in-game) + the cheap web store packs
  const fund=P.filter(p=>p.d&&num(p.stars)&&!p.auto).map(p=>({t:p.t,a:num(p.aud),stars:num(p.stars),gen:num(p.gen),got:thisMonth(p)}))
    .concat(WEB_STARS.filter(w=>w.once?!state.webOnceDone:state.webMonthly!==false).map(w=>({t:w.t,a:w.usd*fxRate(),usd:w.usd,stars:w.stars,web:w.id,once:w.once,got:w.once?false:state.webMonth===key})));
  const cashOut=num((mo[key]||{}).spent)+bought.filter(p=>!p.viaStars).reduce((t,p)=>t+num(p.aud),0)+renew.reduce((t,r)=>t+r.a,0)+fund.reduce((t,f)=>t+f.a,0);
  const cash=Math.max(0,bud-cashOut), stars=num(state.stars)+fund.filter(f=>!f.got).reduce((t,f)=>t+f.stars,0);
  return {key,label:d.toLocaleDateString(undefined,{month:"long",timeZone:"UTC"}),cash,stars,left:cash+stars*STAR_A,bud,bought,renew,fund,extra:{gen:fund.reduce((t,f)=>t+num(f.gen),0)}}; }
// pay with Stars where they go furthest (whole packs only — use as many Stars as possible), the rest in cash;
// if the cash still runs out, drop the lowest-ranked picks
function vPay(picked,M){ let L=picked.slice();
  for(;;){ const cost=L.map(p=>starsFor(p.d.a)), S=Math.floor(M.stars), best=new Array(S+1).fill(null); best[0]=[];
    cost.forEach((c,i)=>{ for(let v=S;v>=c;v--) if(!best[v]&&best[v-c]&&!best[v-c].includes(i)) best[v]=best[v-c].concat(i); });
    let v=S; while(v>0&&!best[v]) v--; const viaS=new Set(best[v]);
    const cash=L.reduce((t,p,i)=>t+(viaS.has(i)?0:p.d.a),0);
    if(cash<=M.cash+0.005||!L.length) return {list:L.map((p,i)=>Object.assign({pay:viaS.has(i)?"stars":"cash",starCost:cost[i]},p)),starsLeft:S-v,cashLeft:M.cash-cash};
    L.pop(); } }
const STAR_WEB=[["499 + 499 Stars","US$4.99","100% bonus","Every month — about A$15 of packs for ~A$8"],["999 + 999 Stars","US$9.99","100% bonus","Once ever — about two A$14.99 packs"],["1,999 + 100 Stars + 20 General shards","US$19.99","5% + shards","Every month — same as Kingdom Special, +100 Stars"],["9,999 + 500 Stars + frame","US$99.99","5%","Monthly — only if you need that many"]];
// greedy: each step buys the deal that fills the most of your remaining gaps per A$ (an item stops counting once it's covered)
function vPick(keys,onlyNow,budget,already,extra){
  const need=vNeeds(), rem={}; keys.forEach(k=>rem[k]=Math.max(0,need[k]-num((extra||{})[k]))); // extra = what Star packs already give (Kingdom Special's 20 shards)
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
      const g=[...gain(x.d),...(par?gain(par.d):[])]; if(!g.length) return; // only packs that still fill a gap you ticked
      if(vPc(x.d)&&vPc(x.d)<3000) return; // your rule: 3,000% or more
      // one score, three factors: share of each gap it fills per A$ (×2 for blockers) × the game's value %
      const sc=g.reduce((t,p)=>t+p.v*(VALUE_BLOCKERS.includes(p.k)?2:1),0)/cost*((vPc(x.d)||3000)/4000);
      if(!best||sc>best.sc) best={x,par,sc}; });
    if(!best) break;
    const add=x=>{ const g=gain(x.d), why=g.map(p=>[p.k,Math.min(vY(x.d,p.k),rem[p.k]),vY(x.d,p.k)>=rem[p.k]]); x.used=true; picked.push({d:x.d,c:x.c,why}); left-=x.d.a; g.forEach(p=>rem[p.k]=Math.max(0,rem[p.k]-vY(x.d,p.k))); };
    if(best.par) add(best.par); add(best.x); }
  return {picked,left,need,rem}; }
// "best" mixes three things: how much of your gaps it fills per A$, blockers count double, higher value % ranks higher
const VALUE_BLOCKERS=["designs","lucky"]; // Charm Designs + Lucky chests (Mythic Gear) — Threads have no paid deal yet
const vPc=d=>num(String(d.pc||"").replace(/[^\d.]/g,""));
const vName=p=>p.d.n+(p.d.wk?` (week ${p.c+1})`:"");
function renderBestValue(){
  const host=$("#bestValue"); if(!host) return;
  if(!state.ui.bvPick) state.ui.bvPick=["tg","gen","designs"];
  state.ui.bvPick=state.ui.bvPick.filter(k=>VALUE_ITEMS.some(x=>x[0]===k));
  const keys=state.ui.bvPick, onlyNow=state.ui.bvNow!==false, M=vPlanMonth();
  const pk=vPick(keys,onlyNow,M.left,M.bought,M.extra), need=pk.need, PAY=vPay(pk.picked,M), picked=PAY.list;
  const rem={}; keys.forEach(k=>{ rem[k]=Math.max(0,need[k]-num(M.extra[k])); picked.forEach(p=>rem[k]=Math.max(0,rem[k]-vY(p.d,k))); });
  const order=picked.map((p,i)=>({p,i,by:vBuyBy(p.d)})); // pick order = best buy first (most of your gaps per A$)
  const fdD=s=>new Date(s+"T00:00:00").toLocaleDateString(undefined,{day:"numeric",month:"short"});
  // why it's in the plan: what it covers of your gaps when picked ("last" = it closes that gap)
  const fv=v=>v>=10?fmt(Math.round(v)):(Math.round(v*10)/10).toString();
  const why=p=>p.why&&p.why.length?`<span class="bvwhy">Covers ${p.why.map(([k,v,last])=>`${last?"your last ":""}${fv(v)} ${vLab(k)}${k==="gen"&&!num(p.d.y.gen)?" (as gems)":""}`).join(" + ")}</span>`:"";
  const give=d=>d.alt?Object.entries(d.y).map(([k,v])=>`${fmt(v)} ${vLab(k)}`).join(" <i>or</i> "):Object.entries(d.y).map(([k,v])=>k==="gems"?`${fmt(v)} gems`:`${fmt(v)} ${vLab(k)}`).join(" · ");
  host.innerHTML=`<div class="card"><b style="font-size:16px">What do you want this month?</b>
      <div class="bvchips">${VALUE_ITEMS.map(([k,l])=>`<button class="chip" data-k="${k}" aria-pressed="${keys.includes(k)}">${l}${keys.includes(k)&&need[k]?` <small>· ${fmt(Math.round(need[k]))} short</small>`:""}</button>`).join("")}</div>
      <label class="bvnow"><input type="checkbox" id="bvNow"${onlyNow?" checked":""}> Only deals on now</label></div>`+
    `<div class="card mt"><div class="rowb"><b style="font-size:16px">Best buys for ${esc(M.label)}</b><button class="btn ghost sm mono" id="bvBud">A$${M.bud} budget ✎</button></div>`+
    (M.renew.length?`<p class="faint" style="margin:4px 0 0;font-size:13.5px">Set aside for renewals: ${M.renew.map(r=>`${esc(r.t)} A$${r.a.toFixed(2)}`).join(" · ")}</p>`:"")+
    `<div class="bvfund"><div class="bvfund-h"><b>Stars first</b><button class="btn ghost sm" id="bvStars">⭐ ${fmt(num(state.stars))} now ✎</button></div>${M.fund.map(f=>`<div class="rcrow"><span>${esc(f.t)}${f.usd?` <small class="faint">US$${f.usd.toFixed(2)}</small>`:""}${f.gen?` <span class="tag ok">+${f.gen} General shards</span>`:""}${f.got?' <span class="tag plain">bought ✓</span>':""}</span><b>A$${f.a.toFixed(2)} → ${fmt(f.stars)} ⭐</b></div>`).join("")}
      <div class="rcrow"><span>To spend on packs</span><b>${fmt(M.stars)} ⭐ + A$${M.cash.toFixed(2)}</b></div></div>`+
    (M.bought.length?`<p class="faint" style="margin:4px 0 0">Bought so far: ${M.bought.map(p=>esc(p.t)).join(", ")}</p>`:"")+
    (picked.length?[order].map(L=>`<p class="faint" style="margin:6px 0 0;font-size:13.5px">Best buy first — blockers count double, higher % and more per A$ rank higher.</p><ol class="bvlist">${L.map(({p,by})=>`<li><div class="bvrow"><b>${esc(vName(p))}${p.why&&p.why.some(([k])=>VALUE_BLOCKERS.includes(k))?' <span class="tag bad">blocker</span>':""}</b><span class="mono gold">${p.pay==="stars"?`${fmt(p.starCost)} ⭐`:`A$${p.d.a.toFixed(2)}`}</span></div>
        <span class="muted">${give(p.d)}</span>${p.d.pc?` <span class="faint">· ${p.d.pc}</span>`:""}${p.d.est?' <span class="tag plain">estimate</span>':""}${staleDays(p.d.seen)>STALE_DAYS?` <span class="tag warn">price seen ${staleDays(p.d.seen)}d ago — check</span>`:""}
        ${why(p)}${by?` <span class="tag warn">buy by ${fdD(by)}</span>`:""}${p.d.note?` <span class="faint">${esc(p.d.note)}</span>`:""}</li>`).join("")}</ol>`).join("")+`
      <div class="rcrows">${keys.map(k=>{ const got=need[k]-rem[k]; return need[k]?`<div class="rcrow"><span>${vLab(k)}</span><b>${got>0?`<span class="ok">+${fmt(Math.round(got))}</span>`:"+0"} of ${fmt(Math.round(need[k]))} short</b></div>`:`<div class="rcrow"><span>${vLab(k)}</span><b class="faint">not short ✓</b></div>`; }).join("")}
        <div class="rcrow"><span>Real money this month</span><b>A$${(M.bud-PAY.cashLeft).toFixed(2)} of A$${M.bud} · ${fmt(PAY.starsLeft)} ⭐ left</b></div></div>
      <button class="btn primary mt" id="bvUse">Use this as my ${esc(M.label)} plan</button>`
      :`<p class="faint">${keys.length?"Nothing on now closes what you picked — untick “Only deals on now” to see what's coming.":"Pick at least one item above."}</p>`)+`</div>`+
    `<details class="fold mt"><summary><span class="grow">Cheaper Stars — web store</span><small class="faint">store.centurygames.com/kingshot</small></summary><div class="fbody"><table class="gtable"><tbody>${STAR_WEB.map(([a,b,c,d])=>`<tr><td><b>${esc(a)}</b><br><span class="faint">${esc(d)}</span></td><td class="mono">${esc(b)}</td><td>${esc(c)}</td></tr>`).join("")}</tbody></table>
      <p class="faint" style="margin:8px 0 0;font-size:13.5px">1 Star = 1 US cent. Charged in US$ — your bank may add a foreign fee. Stars only pay for a whole pack, and buying Stars gives no Top-up Points (spending them does).</p></div></details>`+
    `<h3 class="sgsec">Best per A$, by item</h3>`+
    keys.map(k=>{ const per=d=>vY(d,k)/d.a, L=VALUE_DB.filter(d=>vY(d,k)>0).sort((a,b)=>per(b)-per(a)).slice(0,4); if(!L.length) return "";
      const f=v=>v>=10?fmt(Math.round(v)):v.toFixed(1);
      return `<details class="fold mt"><summary><span class="grow">${vLab(k)}</span><small class="faint">best ${f(per(L[0]))} per A$</small></summary><div class="fbody">${L.map((d,i)=>`<div class="rcrow"><span>${i+1}. ${esc(d.n)} ${vOnNow(d)?'<span class="tag ok">on now</span>':""}${d.est?' <span class="tag plain">est.</span>':""}</span><b>${f(per(d))}/A$</b></div>`).join("")}</div></details>`; }).join("");
  host.querySelectorAll(".bvchips .chip").forEach(c=>c.onclick=()=>{ const k=c.dataset.k, L=state.ui.bvPick, i=L.indexOf(k); if(i>-1) L.splice(i,1); else L.push(k); scheduleSave(); renderBestValue(); });
  const nw=$("#bvNow"); nw.onchange=()=>{ state.ui.bvNow=nw.checked; scheduleSave(); renderBestValue(); };
  on("bvBud",openPackBudgetSheet);
  on("bvStars",()=>openSheet({title:"Kingdom Stars",sub:"Balance, web store packs and exchange rate.",build(f){
    f.appendChild(fld("Stars you have now",{type:"num",value:num(state.stars),get:()=>num(state.stars),set:v=>state.stars=Math.max(0,Math.round(v)),hint:"Ticking packs updates this for you — fix it here if it drifts."}));
    f.appendChild(frow(fld("A$ per US$ (web store)",{type:"num",decimal:true,value:num(state.fx)||1.55,get:()=>num(state.fx)||1.55,set:v=>state.fx=v}),
      fld("Bank foreign fee %",{type:"num",decimal:true,value:state.fxFee==null?3:num(state.fxFee),get:()=>state.fxFee==null?3:num(state.fxFee),set:v=>state.fxFee=v,hint:"Many cards charge ~3%; 0 if yours doesn't."})));
    f.appendChild(fld("Buy the US$4.99 web pack (499 + 499 Stars) each month",{type:"check",value:state.webMonthly!==false,set:v=>state.webMonthly=v}));
    f.appendChild(fld("I've bought the once-only US$9.99 pack (999 + 999)",{type:"check",value:!!state.webOnceDone,set:v=>state.webOnceDone=v}));
    const i=infoBox(); f.appendChild(i);
    const rf=()=>{ i.innerHTML=`≈ <b>A$${(num(state.stars)*STAR_A).toFixed(2)}</b> of packs. In-game Star prices (assumed): A$2.99 = 199 · A$7.99 = 499 · A$14.99 = 999.`; }; rf(); return rf; }}));
  on("bvUse",()=>{ const snap=JSON.stringify(state), P=state.packs||(state.packs=[]);
    for(let i=P.length-1;i>=0;i--) if(!P[i].d&&(P[i].auto||/^Nov\b/.test(P[i].note||""))) P.splice(i,1); // replace unbought plan items
    order.slice().reverse().forEach(({p,by})=>P.unshift({t:vName(p),aud:p.d.a,kind:"once",d:false,auto:M.key,viaStars:p.pay==="stars"||undefined,note:[`${M.label} plan`,p.pay==="stars"?`pay ${fmt(p.starCost)} ⭐`:"",by?`buy by ${fdD(by)}`:"",p.d.pc||"",p.d.note||""].filter(Boolean).join(" · ")}));
    M.fund.filter(f=>f.web&&!f.got).reverse().forEach(f=>P.unshift({t:f.t,aud:+f.a.toFixed(2),kind:"once",d:false,auto:M.key,web:f.web,addStars:f.stars,note:`${M.label} plan · buy first on store.centurygames.com/kingshot · US$${f.usd.toFixed(2)} → ${fmt(f.stars)} ⭐`}));
    afterEdit(); toast(`${M.label} plan saved to Shops & Packs`,snap); });
}
