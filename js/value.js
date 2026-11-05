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
  {n:"Treasure Cove — all 5 days",seen:"2026-11-05",a:39.95,pc:"4,860%",on:/treasure cove/i,set:5,y:{designs:385,tg:170,gen:20,gems:25000,guides:85,fh:36},x:"38 Gov Gear chests · 20 Pet Advancement chests · 100× 1h speedups",note:"5 packs × A$7.99, one unlocks each day — only worth it if you buy all 5 (grand prize: pick 300 Charm Designs)"},
  {n:"Justice Fist widgets (Charles)",hero:"Charles",seen:"2026-10-26",a:7.99,pc:"3,000%",on:/exclusive gear fund/i,y:{widgets:15}},
  {n:"Sails Aloft — Common",seen:"2026-10-21",a:7.99,pc:"3,600%",on:/wavebound voyage/i,y:{gems:2500},x:"100× 1h voyage speedups"},
  {n:"Sails Aloft — Uncommon",seen:"2026-10-21",a:14.99,pc:"3,300%",on:/wavebound voyage/i,y:{gems:5000},x:"180× 1h voyage speedups"},
  {n:"Sails Aloft — Rare",seen:"2026-10-21",a:30.99,pc:"3,100%",on:/wavebound voyage/i,y:{gems:10000},x:"320× 1h voyage speedups"},
  {n:"Chameleos widgets (Ava)",hero:"Ava",seen:"2026-10-26",a:7.99,pc:"3,000%",on:/exclusive gear fund/i,y:{widgets:15}},
  {n:"Mortar widgets (Wee & Woo)",hero:"Wee & Woo",seen:"2026-10-26",a:7.99,pc:"3,000%",on:/exclusive gear fund/i,y:{widgets:15}}
];
/* ---------- what a pack is really worth to you ----------
   Every item gets an A$ price: what it costs in the regular pack that sells it.
   Items you still need count in full; anything past your need (or not needed at all) counts 25%.
   Worth ÷ price = how many dollars of value you get per dollar (1.0× = same as buying the usual way). */
const V_PRICE={designs:[14.99/150,"Mythic Charm weekly card: 150 for A$14.99"],lucky:[14.99/120,"Mythic Hero Gear weekly card: 120 for A$14.99"],
  tg:[7.99/144,"Truegold Weekly Card: 144 for A$7.99"],dust:[7.99/180,"Truegold Dust Weekly Card: 180 for A$7.99"],
  gen:[14.99/40,"Path of Honor: 40 for A$14.99"],widgets:[7.99/15,"Exclusive gear pack: 15 for A$7.99"],gems:[(14.99/40)/GEMS_PER_SHARD,"1,500 gems ≈ 1 General shard (Hero Roulette)"],
  guides:[null,"no A$ price yet"],fh:[null,"no A$ price yet"],mith:[null,"no A$ price yet"],threads:[null,"no A$ price yet"]};
const V_LAB={guides:"Charm Guides",fh:"Forgehammers",mith:"Mithril",threads:"Gilded Threads",gems:"Gems"};
const V_SOON=1, V_LATER=0.6, V_SPARE=0.1; // needed for your next steps · needed later in your plans · not in any plan
const vWidNeed=h=>{ const r=((state.widgets&&state.widgets.rows)||[]).find(x=>x.hero===h); return r?Math.max(0,widNext(num(r.lvl))-num(r.have)):0; }; // widgets for that hero's next level
function vWorth(d,need,plan){ need=need||vNeeds(); plan=plan||vPlanNeeds(); const rows=[]; let full=0,toYou=0;
  Object.entries(d.y).forEach(([k,n])=>{ const P=V_PRICE[k]; if(!P) return;
    const soon=k==="gems"?n:k==="widgets"&&d.hero?vWidNeed(d.hero):Math.max(0,num(need[k])), later=k==="gems"?n:Math.max(soon,k==="widgets"&&d.hero?vWidNeed2(d.hero):num(plan[k]));
    const uS=Math.min(n,soon), uL=Math.min(n-uS,later-soon), rest=n-uS-uL;
    if(P[0]==null){ rows.push({k,n,each:null,src:P[1],val:0,counted:0,uS,uL,rest}); return; }
    const val=n*P[0], counted=(uS*V_SOON+uL*V_LATER+rest*V_SPARE)*P[0];
    rows.push({k,n,each:P[0],src:P[1],val,counted,uS,uL,rest}); full+=val; toYou+=counted; });
  const priced=rows.filter(r=>r.each!=null);
  if(d.alt&&priced.length){ const b=priced.slice().sort((x,c)=>c.counted-x.counted)[0]; rows.forEach(r=>r.pick=r===b); return {rows,full:b.val,toYou:b.counted,ratio:d.a?b.counted/d.a:0,alt:true}; } // you choose one
  return {rows,full,toYou,ratio:d.a?toYou/d.a:0}; }
const vLab=k=>(VALUE_ITEMS.find(x=>x[0]===k)||[k,V_LAB[k]||k])[1];
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
// everything your saved upgrade plans still need (beyond what's in your bag) — the "later" horizon
function vPlanNeeds(){ const out={}, sh=(k,v,have)=>out[k]=Math.max(0,Math.round(v-num(have)));
  let g=0,d=0; ((state.charms&&state.charms.rows)||[]).forEach(r=>{ for(let l=num(r.lvl);l<Math.min(num(r.tgt),22);l++){ const c=CHARM_COSTS[l]; if(c){ g+=c[0]; d+=c[1]; } } });
  const CH=state.charms.have||{}; sh("designs",d,CH.designs); sh("guides",g,CH.guides);
  const G=state.govGear||{}, gT=num(G.targetIdx); let t=0; (G.pieces||[]).forEach(pc=>{ if(gT>num(pc.cur)) t+=govRem(num(pc.cur),gT).t; }); sh("threads",t,(G.have||{}).threads); // every piece to your target tier
  let tg=0; (state.buildings||[]).filter(b=>!b.d&&BUILD_TIERS[b.n]).forEach(b=>BUILD_TIERS[b.n].steps.slice(b.stepIdx||0).forEach(st=>tg+=num(st.tg))); sh("tg",tg,state.tg.have);
  const H=state.heroGear.have||{}, HR=state.heroGear.rows||[]; ["mg","mith","fh"].forEach(k=>sh(k,HR.reduce((a,r)=>a+num(r[k]),0),H[k])); // every hero gear piece to its target
  out.lucky=out.mg?Math.max(0,Math.round(out.mg/mythicRate().r)-num(hgChests().lucky)):0;
  const ava=(state.goldShards||[]).find(r=>r.n==="Ava"); let gs=0; if(ava&&hasStars(ava)) for(let i=num(ava.pos);i<Math.min(num(ava.tgt)||SHARD_MAX,SHARD_MAX);i++) gs+=SHARD_LEAF[i]; sh("gen",gs-num(ava&&ava.have),state.shardGeneral);
  out.dust=Math.max(0,computeTarget()-num(state.dust.current));
  return out; }
const vWidNeed2=h=>{ const r=((state.widgets&&state.widgets.rows)||[]).find(x=>x.hero===h); if(!r) return 0; const l=num(r.lvl); return Math.max(0,widNext(l)+(l<9?widNext(l+1):0)-num(r.have)); }; // next 2 levels
const vY=(d,k)=>num(d.y[k])+(k==="gen"?num(d.y.gems)/GEMS_PER_SHARD:0);
// The month's money: real A$ (budget − renewals − Star packs) plus Stars (balance + Star packs not yet bought this month)
const STAR_TIERS={0.99:99,1.49:99,2.99:199,4.99:299,7.99:499,14.99:999,30.99:1999,79.99:4999,159.99:9999}; // in-game A$ price → Stars (assumed; check one in game)
const starsFor=a=>STAR_TIERS[num(a).toFixed(2)*1]||Math.round(num(a)/0.0155);
const STAR_A=14.99/999; // ≈ A$ of packs per Star
// web store prices are in A$ (store.centurygames.com shows AU$) — no exchange rate needed
const WEB_STARS=[{id:"m",t:"Web store: 499 + 499 Stars",aud:7.99,stars:998},{id:"o",t:"Web store: 999 + 999 Stars",aud:14.99,stars:1998,once:true}];
function vPlanMonth(){ const cur=gameToday().slice(0,7), mo=state.packMonths||{}, closed=mo[cur]&&mo[cur].closed;
  const d=new Date(cur+"-01T00:00:00Z"); if(closed) d.setUTCMonth(d.getUTCMonth()+1); const key=d.toISOString().slice(0,7);
  const P=state.packs||[], bought=P.filter(p=>p.auto===key&&p.d&&!p.web), bud=num(state.packBudget)||100;
  const thisMonth=p=>String(p.bought||"").slice(0,7)===key;
  // cards you own renew this month — set that money aside first (weekly cards ×4)
  const renew=P.filter(p=>p.d&&(p.kind==="month"||p.kind==="week")&&!p.auto&&!num(p.stars)).map(p=>({t:p.t,a:num(p.aud)*(p.kind==="week"?4:1)}));
  // Star packs: your Kingdom Special (in-game) + the cheap web store packs
  const fund=P.filter(p=>p.d&&num(p.stars)&&!p.auto).map(p=>({t:p.t,a:num(p.aud),stars:num(p.stars),gen:num(p.gen),got:thisMonth(p)}))
    .concat(WEB_STARS.filter(w=>w.once?(!state.webOnceDone||state.webOnceMonth===key):state.webMonthly!==false).map(w=>({t:w.t,a:w.aud,stars:w.stars,web:w.id,once:w.once,got:w.once?!!state.webOnceDone:state.webMonth===key})));
  const cashOut=num((mo[key]||{}).spent)+bought.filter(p=>!p.viaStars).reduce((t,p)=>t+num(p.aud),0)+renew.reduce((t,r)=>t+r.a,0)+fund.reduce((t,f)=>t+f.a,0);
  const cash=Math.max(0,bud-cashOut), stars=num(state.stars)+fund.filter(f=>!f.got).reduce((t,f)=>t+f.stars,0);
  return {key,label:d.toLocaleDateString(undefined,{month:"long",timeZone:"UTC"}),cash,stars,left:cash+stars*STAR_A,bud,bought,renew,fund,extra:{gen:fund.reduce((t,f)=>t+num(f.gen),0)}}; }
// real money spent in a month, worked out from your ticks (a closed month keeps the total you entered)
function monthSpent(key){ const mo=(state.packMonths||{})[key]||{}; if(mo.closed) return num(mo.spent);
  const P=state.packs||[], inM=p=>String(p.bought||"").slice(0,7)===key;
  return num(mo.spent)+P.filter(p=>p.auto===key&&p.d&&!p.viaStars).reduce((t,p)=>t+num(p.aud),0)
    +P.filter(p=>p.d&&PACK_DAYS[p.kind]&&inM(p)).reduce((t,p)=>t+num(p.aud),0)
    +(state.webMonth===key?7.99:0)+(state.webOnceMonth===key?14.99:0); }
// pay with Stars where they go furthest (whole packs only — use as many Stars as possible), the rest in cash;
// if the cash still runs out, drop the lowest-ranked picks
function vPay(picked,M){ let L=picked.slice();
  for(;;){ // a set (e.g. 5 daily packs) is paid one pack at a time, so some days can go on Stars and the rest in cash
    const U=[]; L.forEach((p,i)=>{ const n=p.d.set||1; for(let j=0;j<n;j++) U.push({i,a:p.d.a/n,c:starsFor(p.d.a/n)}); });
    const S=Math.floor(M.stars), best=new Array(S+1).fill(null); best[0]=[];
    U.forEach((u,ui)=>{ for(let v=S;v>=u.c;v--) if(!best[v]&&best[v-u.c]&&!best[v-u.c].includes(ui)) best[v]=best[v-u.c].concat(ui); });
    let v=S; while(v>0&&!best[v]) v--; const viaS=new Set(best[v]);
    const cash=U.reduce((t,u,ui)=>t+(viaS.has(ui)?0:u.a),0);
    if(cash<=M.cash+0.005||!L.length) return {list:L.map((p,i)=>{ const mine=U.map((u,ui)=>({u,ui})).filter(x=>x.u.i===i), st=mine.filter(x=>viaS.has(x.ui));
        const starCost=st.reduce((t,x)=>t+x.u.c,0), cashCost=mine.filter(x=>!viaS.has(x.ui)).reduce((t,x)=>t+x.u.a,0);
        return Object.assign({pay:!st.length?"cash":st.length===mine.length?"stars":"mix",starCost,cashCost},p); }),starsLeft:S-v,cashLeft:M.cash-cash};
    L.pop(); } }
const vPayTxt=p=>p.pay==="stars"?`${fmt(p.starCost)} ⭐`:p.pay==="mix"?`A$${p.cashCost.toFixed(2)} + ${fmt(p.starCost)} ⭐`:`A$${p.d.a.toFixed(2)}`;
const STAR_WEB=[["499 + 499 Stars","A$7.99","100% bonus","Monthly — about one A$14.99 pack for A$7.99"],["999 + 999 Stars","A$14.99","100% bonus","Once ever — about two A$14.99 packs"],["1,999 + 100 Stars + 20 General shards","exclusive","5% + shards","Monthly — your Kingdom Special, +100 Stars on the web"],["9,999 + 500 Stars + frame","A$159.99","5%","Monthly — only if you need that many"],["Other Star bundles","A$4.49–1,599","5%","No better than buying packs in game"]];
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
      if(vWorth(x.d,need).ratio<0.95) return; // and worth at least what you'd pay for the same items elsewhere
      // one score, three factors: share of each gap it fills per A$ (×2 for blockers) × the game's value %
      const sc=g.reduce((t,p)=>t+p.v*(VALUE_BLOCKERS.includes(p.k)?2:1),0)/cost*((vPc(x.d)||3000)/4000)*Math.max(.25,vWorth(x.d,need).ratio);
      if(!best||sc>best.sc) best={x,par,sc}; });
    if(!best) break;
    const add=x=>{ const g=gain(x.d), why=g.map(p=>[p.k,Math.min(vY(x.d,p.k),rem[p.k]),vY(x.d,p.k)>=rem[p.k]]); x.used=true; picked.push({d:x.d,c:x.c,why}); left-=x.d.a; g.forEach(p=>rem[p.k]=Math.max(0,rem[p.k]-vY(x.d,p.k))); };
    if(best.par) add(best.par); add(best.x); }
  return {picked,left,need,rem}; }
// "best" mixes three things: how much of your gaps it fills per A$, blockers count double, higher value % ranks higher
const VALUE_BLOCKERS=["designs","lucky"]; // Charm Designs + Lucky chests (Mythic Gear) — Threads have no paid deal yet
const vPc=d=>num(String(d.pc||"").replace(/[^\d.]/g,""));
const vWhen=d=>{ if(d.on==="always") return "any time"; const e=(state.events||[]).find(x=>d.on.test(x.n||"")); if(!e) return "event only"; const o=nextOcc(e); return o&&!o.past?`${e.n} · ${whenTxt(o)}`:e.n; };
// weekly cards: one a week — week 2 from 7 days after the month (or today) starts
const vWeekStart=(key,c)=>{ const t=gameToday(), s0=t.slice(0,7)===key?t:key+"-01", d=new Date(s0+"T00:00:00"); d.setDate(d.getDate()+7*c); return ymd(d); };
const vShort=p=>p.d.n.replace(/^Weekly Benefits — /,"")+(p.d.wk?` · wk ${p.c+1}`:""); // short name for rows
const vName=p=>p.d.n+(p.d.wk?` (week ${p.c+1})`:"");
// the whole month's plan in one place (Packs page + Home summary use it)
function vPlanAll(){
  if(!state.ui.bvPick) state.ui.bvPick=["tg","gen","designs"];
  state.ui.bvPick=state.ui.bvPick.filter(k=>VALUE_ITEMS.some(x=>x[0]===k));
  const keys=state.ui.bvPick, onlyNow=state.ui.bvNow!==false, M=vPlanMonth();
  const pk=vPick(keys,onlyNow,M.left,M.bought,M.extra), need=pk.need, PAY=vPay(pk.picked,M), picked=PAY.list;
  const rem={}; keys.forEach(k=>{ rem[k]=Math.max(0,need[k]-num(M.extra[k])); M.bought.forEach(b=>{ const d=VALUE_DB.find(x=>b.t.startsWith(x.n)); if(d&&!d.alt) rem[k]=Math.max(0,rem[k]-vY(d,k)); }); picked.forEach(p=>rem[k]=Math.max(0,rem[k]-vY(p.d,k))); });
  const planned=M.bud-PAY.cashLeft;
  return {keys,onlyNow,M,need,rem,PAY,picked,planned,spare:Math.max(0,PAY.cashLeft)}; }
const vHasX=d=>!!d.x||Object.keys(d.y).some(k=>V_PRICE[k]&&V_PRICE[k][0]==null);
const vX=r=>(Math.round(r*100)/100).toFixed(2)+"×";
function vMathH(d,need){ const W=vWorth(d,need), $=v=>"A$"+v.toFixed(2);
  return `<table class="vmath"><thead><tr><th>Item</th><th>Amount</th><th>A$ each</th><th>Worth</th><th>To you</th></tr></thead><tbody>${W.rows.map(r=>`<tr><td>${esc(V_LAB[r.k]||vLab(r.k))}<small>${esc(r.src)}</small></td><td>${fmt(r.n)}</td><td>${r.each==null?"?":r.each<0.01?r.each.toFixed(5):r.each.toFixed(3)}</td><td>${r.each==null?"—":$(r.val)}</td><td><b>${r.each==null?"—":$(r.counted)}</b><small>${r.each==null?"not counted yet":W.alt?(r.pick?"best pick ✓":"or this"):r.k==="gems"?"all count":[r.uS?`${fmt(r.uS)} next steps`:"",r.uL?`${fmt(r.uL)} later ×0.6`:"",r.rest?`${fmt(r.rest)} spare ×0.1`:""].filter(Boolean).join(" · ")}</small></td></tr>`).join("")}</tbody>
    <tfoot><tr><td colspan="3">${W.alt?"You pick one":"Total"}</td><td>${$(W.full)}</td><td><b>${$(W.toYou)}</b></td></tr><tr><td colspan="4">You pay</td><td><b>${$(d.a)}</b></td></tr><tr><td colspan="4">Value per A$1</td><td><b class="${W.ratio>=1.195?"ok":W.ratio>=0.995?"":"bad"}">${vX(W.ratio)}</b></td></tr></tfoot></table>
    ${d.x?`<p class="dnote">Also in it (not priced): ${esc(d.x)}</p>`:""}${d.set?`<p class="dnote"><b>All or nothing:</b> ${esc(d.note||"buy every part or the main prize is lost")}</p>`:""}`; }
function openWorthSheet(d){ openSheet({title:d.n,sub:`A$${d.a.toFixed(2)}${d.pc?` · game says ${d.pc}`:""} — the maths`,build(f){ f.innerHTML=vMathH(d)+`<p class="faint mt" style="font-size:13px">1.00× = the same value as buying each item from its usual pack. Higher is better. Items count in full for your next steps, ×0.6 if your saved plans need them later, ×0.1 if nothing needs them.</p>`; }}); }
function openCompareSheet(){ const need=vNeeds(), L=VALUE_DB.filter(d=>!(vPc(d)&&vPc(d)<3000)).map(d=>({d,W:vWorth(d,need),now:vOnNow(d)})).sort((a,b)=>(b.now-a.now)||(Math.abs(b.W.ratio-a.W.ratio)<=0.1*Math.max(a.W.ratio,b.W.ratio)?vPc(b.d)-vPc(a.d):0)||(b.W.ratio-a.W.ratio));
  openSheet({title:"Compare every pack",sub:"Value to you per A$1 — tap one for the maths. On now first. Within 10% of each other, the higher game % ranks first. “+ extras” = items with no A$ price yet, so it's worth a bit more than shown.",build(f){
    f.innerHTML=`<div class="list">${L.map(({d,W,now},i)=>`<details class="vcmp"><summary><span class="vc-n"><b>${esc(d.n)}${vHasX(d)?' <em class="ptag">+ extras</em>':""}</b><small class="${now?"ok":"faint"}">${now?"on now":esc(vWhen(d))} · A$${d.a.toFixed(2)}${d.wk?" a week":""}</small></span><span class="vc-r ${W.ratio>=1.195?"ok":W.ratio>=0.995?"":"bad"}">${vX(W.ratio)}<small>A$${W.toYou.toFixed(0)} to you</small></span></summary>${vMathH(d,need)}</details>`).join("")}</div>`; }}); }
const fdD=s=>new Date(s+"T00:00:00").toLocaleDateString(undefined,{day:"numeric",month:"short"});
function renderBestValue(){
  const host=$("#bestValue"); if(!host) return;
  const A=vPlanAll(), {keys,M,need,rem,PAY,picked}=A;
  const order=picked.map((p,i)=>({p,i,by:vBuyBy(p.d)}));
  const fv=v=>v>=10?fmt(Math.round(v)):(Math.round(v*10)/10).toString();
  const give=d=>d.alt?Object.entries(d.y).map(([k,v])=>`${fmt(v)} ${vLab(k)}`).join(" or "):Object.entries(d.y).filter(([k])=>k!=="gems").map(([k,v])=>`${fmt(v)} ${vLab(k)}`).join(" · ");
  // month meter: where the real money goes
  const seg=[["Cards",M.renew.reduce((t,r)=>t+r.a,0),"var(--blue)"],["Kingdom",M.fund.filter(f=>!f.web).reduce((t,f)=>t+f.a,0),"var(--gold)"],["Web Stars",M.fund.filter(f=>f.web).reduce((t,f)=>t+f.a,0),"var(--acc)"],["Packs",picked.filter(p=>p.pay==="cash").reduce((t,p)=>t+p.d.a,0)+M.bought.filter(p=>!p.viaStars).reduce((t,p)=>t+num(p.aud),0),"var(--green)"]].filter(x=>x[1]>0);
  const isBlk=p=>p.why&&p.why.some(([k])=>VALUE_BLOCKERS.includes(k));
  const sub=(p,by)=>{ const bits=[give(p.d)]; if(by) bits.unshift(`<span class="bad">buy by ${fdD(by)}</span>`); else if(p.d.wk&&p.c) bits.push(`from ${fdD(vWeekStart(M.key,p.c))}`); else if(p.d.pc) bits.push(p.d.pc); bits.push(`<b>${vX(vWorth(p.d,need).ratio)}</b> value`); return bits.join(" · "); };
  // wallet ring: where the month's real money goes
  const spentTot=seg.reduce((t,x)=>t+x[1],0), RR=40, CC=2*Math.PI*RR; let off=0;
  const ring=seg.map(([l,v,c])=>{ const len=Math.min(1,v/M.bud)*CC, el=`<circle cx="50" cy="50" r="${RR}" fill="none" stroke="${c}" stroke-width="13" stroke-dasharray="${len.toFixed(1)} ${CC.toFixed(1)}" stroke-dashoffset="${(-off).toFixed(1)}" transform="rotate(-90 50 50)"/>`; off+=len; return el; }).join("");
  const nBought=M.fund.filter(f=>f.got).length+M.bought.length, nAll=M.fund.length+M.bought.length+order.length;
  const skip=(state.ui.bvSkip||{})[M.key]||[], nxi=order.findIndex(({p})=>!skip.includes(vName(p))), nx=nxi>=0?order[nxi]:null;
  const nextH=nx?(()=>{ const {p,by}=nx, w=(p.why||[])[0], ys=Object.entries(p.d.y).slice(0,3);
    return `<div class="nbuy mt"><p class="nb-ey">Next best buy${by?` · <span class="bad">by ${fdD(by)}</span>`:""}</p><h3>${esc(vShort(p))}</h3><p class="nb-s">${p.d.pc?`${p.d.pc} · `:""}${vHasX(p.d)?"+ extras · ":""}${isBlk(p)?"fixes a blocker":"best value left"}</p>
      <div class="nb-g">${ys.map(([k,v])=>`<div><b>${fmtK(v)}</b><span>${k==="gems"?"gems":vLab(k)}</span></div>`).join("")}</div>
      ${w?`<div class="nb-gap"><span>${vLab(w[0])} gap</span><span>fills <b class="ok">${fv(w[1])}</b> of ${fmt(Math.round(need[w[0]]))}</span></div><div class="mbar"><i style="width:${Math.min(100,w[1]/Math.max(1,need[w[0]])*100)}%;background:var(--green)"></i></div>`:""}
      ${(()=>{ const W=vWorth(p.d,need); return `<button class="nb-math" id="bvMath"><span>Worth to you <b>A$${W.toYou.toFixed(2)}</b> for A$${p.d.a.toFixed(2)}</span><b class="${W.ratio>=1.2?"ok":""}">${vX(W.ratio)} · maths ›</b></button>`; })()}
      <div class="nb-b"><button class="nb-buy" id="bvNextBuy">✓ I bought it · ${vPayTxt(p)}</button><button class="btn sm" id="bvNextSkip">Skip</button></div></div>`; })():"";
  const LIM=6, showAll=!!state.ui.bvAll;
  const rows=[...M.fund.map((f,fi)=>`<label class="drow${f.got?" done":""}"><input type="checkbox" class="cbx" data-f="${fi}"${f.got?" checked":""}><span class="dt"><b>${esc(f.t.replace(/^Web store: /,"Web "))}</b><span>+${fmt(f.stars)} ⭐${f.gen?` · ${f.gen} General shards`:""} · ${f.web?(f.once?"web, once ever":"web, monthly"):"monthly"}</span></span><span class="dv">A$${f.a.toFixed(2)}</span></label>`),
    ...M.bought.map(p=>`<label class="drow done"><input type="checkbox" class="cbx" data-b="${state.packs.indexOf(p)}" checked><span class="dt"><b>${esc(p.t)}</b><span>bought ✓</span></span><span class="dv">${p.viaStars?`${fmt(starsFor(p.aud))} ⭐`:`A$${num(p.aud).toFixed(2)}`}</span></label>`),
    ...order.map(({p,by},pi)=>`<label class="drow"><input type="checkbox" class="cbx" data-p="${pi}"><span class="dt"><b>${esc(vShort(p))}${isBlk(p)?' <em class="ptag r">blocker</em>':""}${by?` <em class="ptag y">by ${fdD(by)}</em>`:""}</b><span>${sub(p,null)}</span></span><span class="dv">${vPayTxt(p)}</span></label>`)];
  host.innerHTML=
    `<div class="wallet"><div class="wrow"><div class="wring"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="${RR}" fill="none" stroke="var(--track)" stroke-width="13"/>${ring}</svg><div class="wrt"><b>A$${Math.round(spentTot)}</b><small>of A$${M.bud}</small></div></div>
      <div class="wleg">${seg.map(([l,v,c])=>`<div><span><i style="background:${c}"></i>${l}</span><b>A$${v.toFixed(0)}</b></div>`).join("")}</div></div>
      <div class="wpills"><button class="wp" id="bvStars"><b class="gold">${fmt(M.stars)} ⭐</b><span>Stars ✎</span></button><button class="wp" id="bvBud"><b class="ok">A$${A.spare.toFixed(2)}</b><span>left ✎</span></button><div class="wp"><b>${nBought} / ${nAll}</b><span>bought</span></div></div></div>`+
    nextH+
    `<div class="card dcard mt"><div class="dch"><h3>${esc(M.label)} list</h3><button class="pill" id="bvItems">${keys.length} item${keys.length===1?"":"s"} ✎</button><button class="link" id="bvWhy">Why? ›</button></div>
      <div class="lprog"><span class="mbar"><i style="width:${nAll?nBought/nAll*100:0}%;background:var(--acc)"></i></span><span>${nBought} of ${nAll}</span></div>
      ${(showAll?rows:rows.slice(0,LIM)).join("")||`<p class="dnote">${keys.length?"Nothing on now closes what you picked.":"Pick what to plan for (✎ above)."}</p>`}
      ${rows.length>LIM?`<button class="drow" id="bvAll"><span class="dt"><span class="link">${showAll?"Show less":`+${rows.length-LIM} more`} ›</span></span></button>`:""}
      ${keys.length?`<div class="cov">${keys.map(k=>{ const n=Math.round(need[k]); if(!n) return `<span>${vLab(k)}</span><span class="mini"><i style="width:100%;background:var(--green)"></i></span><b>✓</b>`; const got=n-Math.round(rem[k]); return `<span>${vLab(k)}</span><span class="mini"><i style="width:${Math.min(100,got/n*100)}%${got>=n?";background:var(--green)":""}"></i></span><b>${fmt(got)}/${fmt(n)}</b>`; }).join("")}</div>`:""}
      ${M.renew.length?`<p class="dnote">Also renewing: ${M.renew.map(r=>`${esc(r.t)} A$${r.a.toFixed(2)}`).join(" · ")}</p>`:""}</div>`+
    (()=>{ const nd=vNeeds(), pl=vPlanNeeds(), bestNow=Math.max(0,...picked.map(p=>vWorth(p.d,nd,pl).ratio));
      const L=VALUE_DB.filter(d=>d.on!=="always"&&!vOnNow(d)&&!(vPc(d)&&vPc(d)<3000)).map(d=>{ const W=vWorth(d,nd,pl), e=(state.events||[]).find(x=>d.on.test(x.n||"")), o=e?nextOcc(e):null; return {d,W,o}; })
        .filter(x=>x.W.ratio>=1.2&&x.W.ratio>bestNow*0.9).sort((a,b)=>b.W.ratio-a.W.ratio).slice(0,4);
      if(!L.length) return "";
      return `<div class="card dcard mt"><div class="dch"><h3>Worth waiting for</h3><span class="faint" style="font-size:12.5px">beats packs on now</span></div>${L.map(({d,W,o})=>`<button class="drow vwait" data-n="${esc(d.n)}"><span class="dt"><b>${esc(d.n)}</b><span>${o&&!o.past?`back ${o.days===0?"today":`in ${o.days} day${o.days>1?"s":""}`} · keep A$${d.a.toFixed(2)} for it`:"date not known yet — tell me when it's announced"}</span></span><span class="dv ok">${vX(W.ratio)}</span></button>`).join("")}</div>`; })()+
    `<div class="dlinks"><button class="link" id="bvCmp">Compare every pack (the maths) ›</button><button class="link" id="bvCheap">Cheapest source of each item ›</button><button class="link" id="bvWeb">Cheaper Stars ›</button><button class="link" id="bvNever">Never buy ›</button></div>`;
  on("bvCmp",openCompareSheet); host.querySelectorAll(".vwait").forEach(b=>b.onclick=()=>{ const d=VALUE_DB.find(x=>x.n===b.dataset.n); if(d) openWorthSheet(d); }); on("bvMath",()=>nx&&openWorthSheet(nx.p.d));
  on("bvAll",()=>{ state.ui.bvAll=!showAll; scheduleSave(); renderBestValue(); });
  on("bvNextSkip",()=>{ const S=state.ui.bvSkip||(state.ui.bvSkip={}); (S[M.key]||(S[M.key]=[])).push(vName(nx.p)); scheduleSave(); renderBestValue(); });
  on("bvNextBuy",()=>{ const c=host.querySelector(`input[data-p="${nxi}"]`); if(c){ c.checked=true; c.dispatchEvent(new Event("change")); } });
  // sheets for the detail that used to sit on the page
  on("bvItems",()=>openSheet({title:"Plan for",sub:"What should the plan close this month?",build(f){
    const draw=()=>{ f.innerHTML=`<div class="bvchips">${VALUE_ITEMS.map(([k,l])=>`<button class="chip" data-k="${k}" aria-pressed="${state.ui.bvPick.includes(k)}">${l}${need[k]?` <small>· ${fmt(Math.round(need[k]))} short</small>`:""}</button>`).join("")}</div><label class="bvnow"><input type="checkbox" id="bvNow"${A.onlyNow?" checked":""}> Only deals on now</label>`;
      f.querySelectorAll(".chip").forEach(c=>c.onclick=()=>{ const k=c.dataset.k, L=state.ui.bvPick, i=L.indexOf(k); if(i>-1) L.splice(i,1); else L.push(k); scheduleSave(); renderBestValue(); draw(); });
      f.querySelector("#bvNow").onchange=e=>{ state.ui.bvNow=e.target.checked; scheduleSave(); renderBestValue(); }; };
    draw(); }}));
  on("bvWhy",()=>openSheet({title:"Why these packs",sub:"Best first: most of your gaps per A$, blockers count double, higher value % ranks higher. Packs under 3,000% are left out.",build(f){
    f.innerHTML=`<div class="list">${order.map(({p})=>`<div class="lrow" style="display:block"><b>${esc(vName(p))}</b><br><span class="ok" style="font-size:14px">Covers ${p.why.map(([k,v,last])=>`${last?"your last ":""}${fv(v)} ${vLab(k)}${k==="gen"&&!num(p.d.y.gen)?" (as gems)":""}`).join(" + ")}</span>${p.d.pc?` <span class="faint">· ${p.d.pc}</span>`:""}${p.d.est?' <span class="faint">· estimate</span>':""}${staleDays(p.d.seen)>STALE_DAYS?` <span class="warn">· price seen ${staleDays(p.d.seen)}d ago</span>`:""}${p.d.note?`<br><span class="faint" style="font-size:13.5px">${esc(p.d.note)}</span>`:""}</div>`).join("")}</div>`; }}));
  on("bvCheap",()=>openSheet({title:"Cheapest source of each item",sub:"Per A$, 3,000% or more, on now or when it comes back.",build(f){
    const ff=v=>v>=10?fmt(Math.round(v)):v.toFixed(1);
    f.innerHTML=keys.map(k=>{ const per=d=>vY(d,k)/d.a, L=VALUE_DB.filter(d=>vY(d,k)>0&&!(vPc(d)&&vPc(d)<3000)).sort((a,b)=>per(b)-per(a)).slice(0,4); if(!L.length) return "";
      return `<h3 class="sgsec">${vLab(k)}</h3><div class="list">${L.map((d,i)=>`<div class="lrow"><span style="min-width:0;flex:1">${i+1}. ${esc(d.n)}${d.pc?` <span class="faint">${d.pc}</span>`:""}<br><span class="${vOnNow(d)?"ok":"faint"}" style="font-size:13px">${vOnNow(d)?"on now":esc(vWhen(d))}</span></span><b class="mono">${ff(per(d))}/A$</b></div>`).join("")}</div>`; }).join("")||'<p class="faint">Pick what to plan for first.</p>'; }}));
  on("bvWeb",()=>openSheet({title:"Cheaper Stars",sub:"store.centurygames.com/kingshot — prices in A$.",build(f){
    f.innerHTML=`<div class="list">${STAR_WEB.map(([a,b,c,d])=>`<div class="lrow"><span style="flex:1;min-width:0"><b>${esc(a)}</b><br><span class="faint" style="font-size:13.5px">${esc(d)}</span></span><span class="mono" style="text-align:right">${esc(b)}<br><span class="faint" style="font-size:12px">${esc(c)}</span></span></div>`).join("")}</div><p class="faint mt" style="font-size:13.5px">1 Star = 1 US cent. Your bank may add a foreign fee. Stars only pay for a whole pack; buying Stars gives no Top-up Points (spending them does).</p>`; }}));
  on("bvNever",()=>openSheet({title:"Never buy",sub:"Your rule.",build(f){ f.innerHTML=`<ul class="tight"><li>Resource packs</li><li>Random chests</li><li>Big mixed bundles</li><li>Anything under 3,000%</li></ul><p class="faint mt" style="font-size:13.5px">Extra only: event packs with Mithril or Mythic shards.</p>`; }}));
  on("bvBud",openPackBudgetSheet);
  on("bvStars",()=>openSheet({title:"Kingdom Stars",sub:"Balance and web store packs.",build(f){
    f.appendChild(fld("Stars you have now",{type:"num",value:num(state.stars),get:()=>num(state.stars),set:v=>state.stars=Math.max(0,Math.round(v)),hint:"Ticking packs updates this for you — fix it here if it drifts."}));
    f.appendChild(fld("Buy the A$7.99 web pack (499 + 499 Stars) each month",{type:"check",value:state.webMonthly!==false,set:v=>state.webMonthly=v}));
    f.appendChild(fld("I've bought the once-only A$14.99 pack (999 + 999)",{type:"check",value:!!state.webOnceDone,set:v=>state.webOnceDone=v}));
    const i=infoBox(); f.appendChild(i);
    const rf=()=>{ i.innerHTML=`≈ <b>A$${(num(state.stars)*STAR_A).toFixed(2)}</b> of packs. In-game Star prices (assumed): A$2.99 = 199 · A$7.99 = 499 · A$14.99 = 999.`; }; rf(); return rf; }}));
  // ticking: a plan pack → a bought record for this month; a Star pack → Stars in; untick undoes it
  host.querySelectorAll("input[data-p]").forEach(c=>c.onchange=()=>{ const {p}=order[+c.dataset.p], snap=JSON.stringify(state);
    const r={t:vName(p),aud:p.d.a,kind:"once",d:true,auto:M.key,bought:fcToday(),note:`${M.label} plan${p.d.pc?" · "+p.d.pc:""}`}; if(p.pay==="stars") r.viaStars=true; if(p.pay==="mix"){ r.aud=Math.round(p.cashCost*100)/100; r.addStars=-p.starCost; r.note+=` · ${fmt(p.starCost)} ⭐ + A$${r.aud.toFixed(2)}`; }
    (state.packs||(state.packs=[])).push(r); packStars(r,1); afterEdit(); toast(`Bought: ${r.t}`,snap); });
  host.querySelectorAll("input[data-b]").forEach(c=>c.onchange=()=>{ const i=+c.dataset.b, r=state.packs[i], snap=JSON.stringify(state); packStars(r,-1); state.packs.splice(i,1); afterEdit(); toast(`Unticked: ${r.t}`,snap); });
  host.querySelectorAll("input[data-f]").forEach(c=>c.onchange=()=>{ const f=M.fund[+c.dataset.f], snap=JSON.stringify(state), on=c.checked;
    if(f.web==="m"){ state.webMonth=on?M.key:null; }
    else if(f.web==="o"){ state.webOnceDone=on; state.webOnceMonth=on?M.key:null; }
    else { const pk=state.packs.find(x=>x.t===f.t); if(pk){ if(on){ pk.prevBought=pk.bought; pk.bought=fcToday(); } else { pk.bought=pk.prevBought; delete pk.prevBought; } } }
    state.stars=Math.max(0,num(state.stars)+(on?1:-1)*f.stars); afterEdit(); toast(`${f.t}: ${on?"+":"−"}${fmt(f.stars)} ⭐`,snap); });
}
