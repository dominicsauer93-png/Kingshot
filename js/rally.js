"use strict";
/* =====================================================================
   RALLY
   ===================================================================== */
function renderRally(){
  const c=state.combat, col=p=>p>=60?"ok":p>=50?"warn":"bad";
  const ap=(num(c.attW)+num(c.attL))>0?num(c.attW)/(num(c.attW)+num(c.attL))*100:0;
  const dp=(num(c.defW)+num(c.defL))>0?num(c.defW)/(num(c.defW)+num(c.defL))*100:0;
  $("#combatTiles").innerHTML=
    tileH({id:"cAtt",label:"Attacker win rate",value:ap.toFixed(0)+"%",color:`var(--${col(ap)==="ok"?"green":col(ap)==="warn"?"amber":"red"})`,sub:`${fmt(num(c.attW))} W · ${fmt(num(c.attL))} L`,p:ap,cls:col(ap)})+
    tileH({id:"cDef",label:"Defender win rate",value:dp.toFixed(0)+"%",color:`var(--${col(dp)==="ok"?"green":col(dp)==="warn"?"amber":"red"})`,sub:`${fmt(num(c.defW))} W · ${fmt(num(c.defL))} L`,p:dp,cls:col(dp)})+
    tileH({id:"cLeth",label:"Squads' Lethality",value:num(c.leth).toFixed(1)+"%",sub:"main goal"})+
    tileH({id:"cHp",label:"Squads' Health",value:num(c.hp).toFixed(1)+"%",sub:"raise via Battle Tier VI"});
  ["cAtt","cDef","cLeth","cHp"].forEach(id=>on(id,openCombatSheet));
  // pillars
  const pl=$("#pillars");
  const prow=(p,i)=>{ const ratio=p.b>0?p.v/p.b:1, cls=ratio>=1?"ok":ratio>=0.85?"warn":"bad";
    return `<button class="lrow" data-i="${i}" style="grid-template-columns:1fr"><span class="pillar"><span class="pn">${esc(p.name)}</span>
      <span class="bar ${cls}"><i style="width:${Math.min(100,ratio*100).toFixed(1)}%"></i>${p.b>0?`<span class="bench" style="left:${Math.min(99,p.b/Math.max(p.v,p.b)*100).toFixed(1)}%"></span>`:""}</span>
      <span class="pv">${fmtBig(p.v)} / ${fmtBig(p.b)}</span><span class="grade g-${esc(p.g||"")}">${esc(p.g)||"–"}</span></span></button>`; };
  // behind the benchmark first; areas you're ahead in fold away
  const P=state.pillars.map((p,i)=>({p,i})), behind=P.filter(({p})=>p.b>0&&p.v<p.b), ahead=P.filter(x=>!behind.includes(x));
  pl.innerHTML=(behind.length?behind.map(({p,i})=>prow(p,i)).join(""):'<p class="dnote">Ahead of the benchmark everywhere ✓</p>')+
    (ahead.length?`<details class="dfold"><summary>Ahead in ${ahead.length} more ›</summary>${ahead.map(({p,i})=>prow(p,i)).join("")}</details>`:"");
  bindAll(pl,".lrow",b=>openPillarSheet(state.pillars[+b.dataset.i]));
  renderFocusHeroes(); renderWeekly(); renderProgress(); renderHeroCards(); renderHeroRoles(); renderShards(); renderMasters(); renderMystic();
}
/* ---------- Focus heroes: shards, widgets and the next step for each focus hero, in one place ---------- */
function renderFocusHeroes(){ const box=$("#focusHeroes"); if(!box) return;
  const G=state.goldShards||[], W=(state.widgets&&state.widgets.rows)||[];
  const F=G.filter(r=>r.rally||r.focus).sort((a,b)=>heroUse(b.n)-heroUse(a.n));
  const gen=num(state.shardGeneral), gf=genOrder()[0]; // General shards go to this hero
  if(!F.length){ box.innerHTML=""; return; }
  box.innerHTML=`<div class="card dcard"><div class="dch"><h3>Focus heroes</h3><span class="faint" style="font-size:12.5px">stars · widgets · next step</span></div>`+F.map(r=>{
    const st=hasStars(r), p=num(r.pos), nx=st&&p<SHARD_MAX?SHARD_LEAF[p]:0, h=num(r.have), w=W.find(x=>x.hero===r.n), wl=w?num(w.lvl):null, wn=w&&wl<10?widNext(wl):0;
    const sh=!st?"set stars":p>=SHARD_MAX?'<span class="ok">5★ max</span>':h>=nx?`<span class="ok">${esc(starLabel(p+1))} ready</span>`:gf===r&&h+gen>=nx?`<span class="ok">${esc(starLabel(p+1))} ready with General shards</span>`:`${fmt(nx-h)} shards to ${esc(starLabel(p+1))}${gf===r&&gen?` (${fmt(gen)} General)`:""}`;
    const wd=w==null?"":wl>=10?' · widgets <span class="ok">max</span>':num(w.have)>=wn?` · widgets <span class="ok">Lv ${wl+1} ready</span>`:` · widgets ${fmt(wn-num(w.have))} short`;
    return `<button class="drow fhrow" data-n="${esc(r.n)}">${heroAv(r.n)}<span class="dt"><b>${esc(r.n)} <span class="gold" style="font-weight:500">${st?starGlyphs(p):""}</span></b><span>${sh}${wd}</span></span><span class="dv">${st?esc(starLabel(p)):"—"}<small>${w?`widgets ${wl}/10`:""}</small></span></button>`; }).join("")+`</div>`;
  bindAll(box,".fhrow",b=>openShardSheet(G.find(x=>x.n===b.dataset.n))); }
function openCombatSheet(){
  const c=state.combat;
  openSheet({title:"Combat quality",sub:"From your battle reports and stats screen.",build(f){
    f.appendChild(frow(fld("Attacker wins",{type:"num",value:c.attW,get:()=>c.attW,set:v=>c.attW=v}),fld("Attacker losses",{type:"num",value:c.attL,get:()=>c.attL,set:v=>c.attL=v})));
    f.appendChild(frow(fld("Defender wins",{type:"num",value:c.defW,get:()=>c.defW,set:v=>c.defW=v}),fld("Defender losses",{type:"num",value:c.defL,get:()=>c.defL,set:v=>c.defL=v})));
    f.appendChild(frow(fld("Squads' Lethality %",{type:"num",decimal:true,value:c.leth,get:()=>c.leth,set:v=>c.leth=v}),fld("Squads' Health %",{type:"num",decimal:true,value:c.hp,get:()=>c.hp,set:v=>c.hp=v})));
  }});
}
function openPillarSheet(p){
  openSheet({title:p.name,sub:"Power for this pillar vs the in-game benchmark.",build(f){
    f.appendChild(frow(fld("Your power",{type:"num",value:p.v,get:()=>p.v,set:v=>p.v=v,hint:"shorthand works: 12.5m"}),fld("Benchmark",{type:"num",value:p.b,get:()=>p.b,set:v=>p.b=v})));
    f.appendChild(fld("In-game grade",{type:"select",value:p.g||"",options:[["","–"],["SS","SS"],["S","S"],["A","A"],["B","B"],["C","C"],["D","D"]],set:v=>p.g=v}));
    const inf=infoBox(); f.appendChild(inf);
    const r=()=>{ const ratio=p.b>0?p.v/p.b:0; inf.innerHTML=p.b>0?`You're at <b>${(ratio*100).toFixed(0)}%</b> of the benchmark (${ratio>=1?"ahead":"behind by "+fmtBig(p.b-p.v)}).`:"Add the benchmark to compare."; };
    r(); return r; }});
}

/* ---------- hero tier lists (Gen 8, Oct 2026) ---------- */
const HERO_ROLES=[ // [key, label, short, weight] — rally-lead roles count double (you lead rallies)
  ["kvkLead","KvK rally lead","KvK lead",2],["kvkJoin","KvK joiner","KvK join",1],["gar","Garrison lead","Garrison",1],["gar64","60/40 garrison","60/40",1],
  ["bearLead","Bear rally lead","Bear lead",2],["bearJoin","Bear joiner","Bear join",1],["solo","Solo march","Solo",1],["arena","Arena / Conquest","Arena",1]];
const HERO_GEN8=["Diego","Liz","Luna"];
const HERO_TIERS={
  kvkLead:{S:"Ava,Diego,Luna",A:"Charles,Triton,Liz,Yang",B:"Long Fei,Sophia,Thrud,Wee & Woo",C:"Saul,Zoe,Helga,Jabel,Hilde,Eric,Jaeger,Marlin,Margot,Amadeus,Alcar,Petra,Vivian,Rosa",D:"Olive,Seth,Forrest,Edwin,Diana,Fahd,Yeonwoo,Amane,Quinn,Gordon,Howard,Chenko"},
  kvkJoin:{S:"Amadeus,Saul,Gordon,Chenko,Yeonwoo,Amane,Hilde,Margot,Triton,Wee & Woo,Ava,Diego,Luna",A:"Howard,Quinn,Rosa,Fahd,Vivian,Charles,Eric",B:"Petra,Thrud,Yang",C:"Jabel,Helga,Marlin,Zoe,Jaeger,Alcar,Long Fei,Sophia,Liz",D:"Olive,Seth,Forrest,Edwin,Diana"},
  gar:{S:"Wee & Woo,Diego,Liz",A:"Charles,Thrud,Sophia,Luna",B:"Yang,Margot,Triton,Ava,Vivian",C:"Helga,Amadeus,Jabel,Petra,Saul,Marlin,Zoe,Eric,Hilde,Rosa,Alcar,Jaeger,Long Fei",D:"Olive,Seth,Forrest,Edwin,Diana,Fahd,Yeonwoo,Amane,Quinn,Gordon,Howard,Chenko"},
  gar64:{S:"Wee & Woo,Diego,Liz",A:"Saul,Triton,Charles,Sophia",B:"Jaeger,Alcar,Long Fei,Ava,Thrud",C:"Helga,Amadeus,Jabel,Petra,Rosa,Marlin,Zoe,Hilde,Yang,Eric,Vivian,Margot,Luna",D:"Olive,Seth,Forrest,Edwin,Diana,Fahd,Yeonwoo,Amane,Quinn,Gordon,Howard,Chenko"},
  bearLead:{S:"Amadeus,Ava,Luna",A:"Helga,Petra,Wee & Woo,Yang",B:"Diego,Liz",C:"Margot,Triton,Alcar,Zoe,Thrud,Rosa,Vivian",D:"Olive,Seth,Forrest,Edwin,Diana,Fahd,Howard,Eric,Gordon,Quinn,Yeonwoo,Amane,Chenko,Saul,Jabel,Hilde,Charles,Long Fei,Sophia,Marlin,Jaeger"},
  bearJoin:{S:"Amadeus,Chenko,Yeonwoo,Amane,Margot,Vivian,Ava,Wee & Woo,Luna",A:"Petra",B:"Rosa,Yang",C:"Jaeger,Thrud,Hilde,Marlin,Liz",D:"Jabel,Saul,Helga,Quinn,Diana,Gordon,Howard,Fahd,Olive,Seth,Forrest,Edwin,Zoe,Eric,Alcar,Long Fei,Triton,Sophia,Charles,Diego"},
  solo:{S:"Ava,Diego,Liz,Luna",A:"Thrud,Sophia,Charles,Triton,Wee & Woo",B:"Long Fei,Yang",C:"Helga,Zoe,Saul,Jabel,Hilde,Marlin,Amadeus,Eric,Petra,Margot,Alcar,Rosa,Jaeger,Vivian",D:"Olive,Seth,Forrest,Edwin,Diana,Fahd,Yeonwoo,Amane,Gordon,Quinn,Howard,Chenko"},
  arena:{S:"Yang,Charles,Wee & Woo,Diego,Liz,Luna",A:"Thrud,Sophia,Triton,Ava",B:"Margot,Long Fei,Vivian",C:"Petra,Rosa,Alcar",D:"Edwin,Forrest,Seth,Olive,Fahd,Diana,Gordon,Amane,Howard,Quinn,Chenko,Yeonwoo,Helga,Saul,Hilde,Jabel,Jaeger,Zoe,Marlin,Eric,Amadeus"}};
const heroKey=n=>String(n||"").toLowerCase().replace(/\s+/g," ").trim();
const TIER_OF={}; Object.entries(HERO_TIERS).forEach(([role,t])=>Object.entries(t).forEach(([g,list])=>list.split(",").forEach(h=>{ (TIER_OF[heroKey(h)]??={name:h})[role]=g; })));
const TIER_PTS={S:4,A:3,B:2,C:1,D:0};
const heroUse=n=>{ const t=TIER_OF[heroKey(n)]; return t?HERO_ROLES.reduce((s,[r,,,w])=>s+(TIER_PTS[t[r]]||0)*w,0):0; };
const trH=g=>`<span class="tr tr-${g||"x"}">${g||"–"}</span>`;
function heroRoster(){ // your heroes = the Gold Hero Shards list
  const m={}; (state.goldShards||[]).forEach(r=>{ const k=heroKey(r.n); if(TIER_OF[k]) m[k]={n:TIER_OF[k].name,pos:hasStars(r)?num(r.pos):0,rally:!!r.rally,r}; });
  return m;
}
function renderHeroRoles(){
  const mine=heroRoster(), gen8=HERO_GEN8.map(heroKey);
  const R=HERO_ROLES.find(([r])=>r===state.ui.roleSel)||HERO_ROLES[0], [role,label]=R;
  const L=Object.values(mine).filter(h=>TIER_OF[heroKey(h.n)][role]).sort((a,b)=>TIER_PTS[TIER_OF[heroKey(b.n)][role]]-TIER_PTS[TIER_OF[heroKey(a.n)][role]]||b.pos-a.pos).slice(0,3);
  const soon=gen8.filter(k=>TIER_OF[k][role]==="S"&&!mine[k]).map(k=>TIER_OF[k].name);
  $("#roleBest").innerHTML=`<div class="rolechips">${HERO_ROLES.map(([r,l,sh])=>`<button class="chip" data-r="${r}" aria-selected="${r===role}">${esc(sh||l)}</button>`).join("")}</div>
    <div class="card dcard mt"><div class="dch"><h3>${esc(label)}</h3><span class="faint" style="font-size:12.5px">your best 3</span></div>${L.map(h=>`<div class="drow">${heroAv(h.n)}<span class="dt"><b>${esc(h.n)}${h.rally?` <span class="faint">${icoI("sword")}</span>`:""}</b><span class="gold" style="letter-spacing:1px">${starGlyphs(h.pos)}</span></span>${trH(TIER_OF[heroKey(h.n)][role])}</div>`).join("")}
    ${soon.length?`<p class="dnote">Gen 8 soon: ${soon.map(esc).join(", ")} (S)</p>`:""}</div>`;
  $$("#roleBest .rolechips .chip").forEach(b=>b.onclick=()=>{ state.ui.roleSel=b.dataset.r; scheduleSave(); renderHeroRoles(); });
  [["#roleFold","roleOpen"],["#tierFold","tierOpen"]].forEach(([id,k])=>{ const d=$(id); d.open=!!state.ui[k]; d.ontoggle=()=>{ if(state.ui[k]!==d.open){ state.ui[k]=d.open; scheduleSave(); } }; });
  const mode=state.ui.tierAll?"all":"mine";
  $$("#tierSeg button").forEach(b=>{ b.setAttribute("aria-pressed",String(b.dataset.v===mode)); b.onclick=()=>{ state.ui.tierAll=b.dataset.v==="all"; scheduleSave(); renderHeroRoles(); }; });
  const keys=Object.keys(TIER_OF).filter(k=>mode==="all"||mine[k]||gen8.includes(k));
  keys.sort((a,b)=>heroUse(TIER_OF[b].name)-heroUse(TIER_OF[a].name)||TIER_OF[a].name.localeCompare(TIER_OF[b].name));
  $("#tierTable").innerHTML=`<thead><tr><th>Hero</th>${HERO_ROLES.map(([,,s])=>`<th>${esc(s)}</th>`).join("")}<th>Use</th></tr></thead><tbody>`+
    keys.map(k=>{ const t=TIER_OF[k], h=mine[k], s8=gen8.includes(k);
      return `<tr><td><b>${esc(t.name)}</b>${h&&h.rally?" "+icoI("sword"):""}${s8?' <span class="tag plain" style="padding:2px 6px;font-size:10.5px">soon</span>':""}</td>${HERO_ROLES.map(([r])=>`<td>${trH(t[r])}</td>`).join("")}<td class="cnt">${heroUse(t.name)}</td></tr>`; }).join("")+`</tbody>`;
}

/* ---------- hero avatar badge: initial, coloured by troop type ---------- */
const AV_COL={Infantry:"av-i",Archer:"av-a",Cavalry:"av-c"};
const heroAv=n=>{ const t=(state.heroInfo&&state.heroInfo[n]&&state.heroInfo[n].type)||""; return `<span class="hav ${AV_COL[t]||""}" aria-hidden="true">${esc(String(n||"?").replace(/[^A-Za-z]/g,"").slice(0,1)||"?")}</span>`; };

/* ---------- hero pages: everything about one hero in one place ---------- */
const HERO_TYPES=["Infantry","Cavalry","Archer"];
const heroInfo=n=>{ if(!state.heroInfo) state.heroInfo={}; return state.heroInfo[n]||(state.heroInfo[n]={}); };
const shardRow=n=>(state.goldShards||[]).find(r=>heroKey(r.n)===heroKey(n));
const widRow=n=>((state.widgets&&state.widgets.rows)||[]).find(r=>heroKey(r.hero)===heroKey(n));
function heroGearSum(type){ const R=((state.heroGear&&state.heroGear.rows)||[]).filter(r=>r.type===type); if(!R.length) return null;
  return {n:R.length,avg:Math.round(R.reduce((t,r)=>t+num(r.lvC),0)/R.length),red:R.filter(r=>num(r.lvC)>=100).length,low:R.slice().sort((a,b)=>num(a.lvC)-num(b.lvC))[0]}; }
function heroFacts(n){
  const sr=shardRow(n), wr=widRow(n), t=TIER_OF[heroKey(n)]||{}, info=heroInfo(n);
  const st=sr&&hasStars(sr)?num(sr.pos):null, have=sr?num(sr.have):0, nextCost=st!=null&&st<SHARD_MAX?SHARD_LEAF[st]:0;
  const shortAll=sr?Math.max(0,shardNeed(sr)-have):0, wl=wr?num(wr.lvl):null, wNext=wr?widNext(wl):0, wHave=wr?num(wr.have):0;
  const S=HERO_ROLES.filter(([r])=>t[r]==="S").map(([,,sh])=>sh);
  let next="";
  if(st!=null&&nextCost&&have>=nextCost) next=`<span class="ok">Ready:</span> star step to ${esc(starLabel(st+1))} (${nextCost} shards)`;
  else if(wr&&wNext&&wHave>=wNext) next=`<span class="ok">Ready:</span> widget Lv ${wl} → ${wl+1}`;
  else { const opts=[]; if(st!=null&&nextCost) opts.push([nextCost-have,`${fmt(nextCost-have)} shards to ${esc(starLabel(st+1))}`]); if(wr&&wNext) opts.push([wNext-wHave,`${fmt(wNext-wHave)} widgets to Lv ${wl+1}`]);
    opts.sort((a,b)=>a[0]-b[0]); next=opts.length?"Closest: "+opts[0][1]:st!=null&&st>=SHARD_MAX?"5★ max ✓":"Set stars on the Shards page"; }
  return {sr,wr,t,info,st,have,nextCost,shortAll,wl,wNext,wHave,S,next,use:heroUse(n),gear:info.type?heroGearSum(info.type):null};
}
function heroCardH(n,rank){ const f=heroFacts(n); // one row: badge, name + stars, the one next thing, use score
  return `<button class="drow hrow hcard" data-h="${esc(n)}">${heroAv(n)}<span class="dt"><b>${esc(n)}${f.sr&&f.sr.rally?` <span class="faint">${icoI("sword")}</span>`:""} <span class="gold hstars">${f.st!=null?starGlyphs(f.st):""}</span></b><span>${f.st!=null?esc(starLabel(f.st)):"stars not set"}${f.info.type?` · ${esc(f.info.type)}`:""}${f.wr?` · widget ${f.wl}`:""}</span><span class="hnext2">${f.next}</span></span><span class="dv${f.use>=25?" ok":""}">${f.use}<small>use</small></span></button>`; }
function renderHeroCards(){
  const mine=Object.values(heroRoster()).sort((a,b)=>heroUse(b.n)-heroUse(a.n)||b.pos-a.pos), all=!!state.ui.heroAll, L=all?mine:mine.slice(0,6);
  const hc=$("#heroCards"); hc.className="card dcard"; hc.removeAttribute("style");
  hc.innerHTML=`<div class="dch"><h3>Your heroes</h3><span class="faint" style="font-size:12.5px">most used first</span></div>`+(L.map((h,i)=>heroCardH(h.n,i+1)).join("")||`<p class="dnote">Add heroes on the Shards page.</p>`);
  bindAll($("#heroCards"),".hcard",b=>openHeroSheet(b.dataset.h));
  const m=$("#heroMore"); m.hidden=mine.length<=6; m.textContent=all?"Show top 6":`Show all ${mine.length} heroes`; m.onclick=()=>{ state.ui.heroAll=!all; scheduleSave(); renderHeroCards(); };
}
function openHeroSheet(n){
  openSheet({title:n,sub:"Stars, shards, widget and troop type — all in one place.",build(f){
    const info=heroInfo(n), sr=shardRow(n);
    f.appendChild(frow(fld("Troop type",{type:"select",value:info.type||"",options:[["","— not set —"]].concat(HERO_TYPES.map(t=>[t,t])),set:v=>{ if(v) info.type=v; else delete info.type; }}),
      sr?fld("Rally hero ⚔",{type:"check",value:sr.rally,set:v=>sr.rally=v}):document.createElement("span")));
    if(sr){ f.appendChild(frow(fld("Star tier now",{type:"select",value:hasStars(sr)?String(num(sr.pos)):"",options:(hasStars(sr)?[]:[["","— not set —"]]).concat(STAR_OPTS),set:v=>{ sr.pos=v===""?null:parseInt(v,10); if(sr.tgt==null) sr.tgt=SHARD_MAX; }}),
      fld("Hero shards in hand",{type:"num",value:sr.have,get:()=>sr.have,set:v=>sr.have=v}))); }
    let wr=widRow(n);
    const wbox=document.createElement("div"); f.appendChild(wbox);
    const wfill=()=>{ wbox.innerHTML=""; wr=widRow(n);
      if(wr) wbox.appendChild(frow(fld("Widget level",{type:"select",value:String(num(wr.lvl)),options:Array.from({length:11},(_,i)=>[String(i),"Lv "+i]),set:v=>wr.lvl=parseInt(v,10)}),
        fld("Widgets in hand",{type:"num",value:wr.have,get:()=>wr.have,set:v=>wr.have=v})));
      else { const b=document.createElement("button"); b.className="btn sm ghost"; b.type="button"; b.textContent="+ Track this hero's widget";
        b.onclick=()=>{ state.widgets.rows.push({hero:n,lvl:0,have:0,rally:false}); afterEdit(); wfill(); }; wbox.appendChild(b); } };
    wfill();
    const inf=infoBox(); f.appendChild(inf);
    const rf=()=>{ const x=heroFacts(n);
      inf.innerHTML=`<b>Next:</b> ${x.next}<br>`+
        (x.sr&&x.st!=null?`<b>Shards:</b> ${x.st>=SHARD_MAX?"5★ max ✓":`next step ${x.nextCost} · to ${esc(starLabel(x.sr.tgt==null?SHARD_MAX:num(x.sr.tgt)))}: ${fmt(x.shortAll)} short`}<br>`:"")+
        (x.gear?`<b>${esc(x.info.type)} hero gear:</b> avg Lv ${x.gear.avg}, ${x.gear.red}/${x.gear.n} red · lowest ${esc(x.gear.low.slot)} Lv ${num(x.gear.low.lvC)}<br>`:"")+
        `<b>Use score:</b> ${x.use}/40<div class="hroles" style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px">${HERO_ROLES.map(([r,,sh])=>`<span style="display:inline-flex;align-items:center;gap:4px;font-size:13px">${trH(x.t[r])} ${esc(sh)}</span>`).join("")}</div>`; };
    rf(); return rf; }});
}

/* ---------- progress history (one snapshot per day) ---------- */
const PROG_METRICS=[
  ["power","Power",v=>fmtBig(v)],["leth","Lethality",v=>v.toFixed(1)+"%"],["hp","Health",v=>v.toFixed(1)+"%"],
  ["attWR","Attack win %",v=>v.toFixed(1)+"%"],["defWR","Defence win %",v=>v.toFixed(1)+"%"],
  ["p:Hero","Hero power",v=>fmtBig(v)],["p:Hero Gear","Hero gear power",v=>fmtBig(v)],["p:Troop","Troop power",v=>fmtBig(v)],
  ["p:Governor Gear","Gov gear power",v=>fmtBig(v)],["p:Governor Charm","Charm power",v=>fmtBig(v)],["stars","Hero star steps",v=>fmt(v)]];
function snapValues(){ const c=state.combat||{}, w=(a,b)=>(num(a)+num(b))>0?num(a)/(num(a)+num(b))*100:null, v={};
  if(num(state.account&&state.account.power)>0) v.power=num(state.account.power);
  if(num(c.leth)) v.leth=num(c.leth); if(num(c.hp)) v.hp=num(c.hp);
  const a=w(c.attW,c.attL), d=w(c.defW,c.defL); if(a!=null) v.attWR=+a.toFixed(2); if(d!=null) v.defWR=+d.toFixed(2);
  (state.pillars||[]).forEach(p=>{ if(num(p.v)>0) v["p:"+p.name]=num(p.v); });
  const st=(state.goldShards||[]).filter(hasStars).reduce((t,r)=>t+num(r.pos),0); if(st) v.stars=st;
  return v; }
function takeSnapshot(){ if(!Array.isArray(state.history)) state.history=[];
  const d=fcToday(), v=snapValues(), H=state.history, last=H[H.length-1];
  if(last&&last.d===d){ if(JSON.stringify(last.v)!==JSON.stringify(v)) last.v=v; return; }
  H.push({d,v}); if(H.length>730) H.splice(0,H.length-730); }
function progSeries(key,range){ const H=(state.history||[]).filter(e=>e.v&&e.v[key]!=null);
  if(range==="all") return H.map(e=>({d:e.d,v:e.v[key]}));
  const from=new Date(fcToday()+"T00:00:00"); from.setDate(from.getDate()-num(range)); const f=ymd(from);
  return H.filter(e=>e.d>=f).map(e=>({d:e.d,v:e.v[key]})); }
function renderProgress(){
  const keys=PROG_METRICS.filter(([k])=>(state.history||[]).some(e=>e.v&&e.v[k]!=null));
  if(!keys.some(([k])=>k===state.ui.progKey)) state.ui.progKey=(keys[0]||PROG_METRICS[0])[0];
  const range=state.ui.progRange||"90", key=state.ui.progKey, M=PROG_METRICS.find(([k])=>k===key), F=M[2];
  $("#progMetric").innerHTML=keys.map(([k,l])=>`<button class="chip" data-k="${esc(k)}" aria-pressed="${k===key}">${esc(l)}</button>`).join("");
  $$("#progMetric .chip").forEach(c=>c.onclick=()=>{ state.ui.progKey=c.dataset.k; scheduleSave(); renderProgress(); });
  $$("#progRange button").forEach(b=>{ b.setAttribute("aria-pressed",String(b.dataset.v===range)); b.onclick=()=>{ state.ui.progRange=b.dataset.v; scheduleSave(); renderProgress(); }; });
  const S=progSeries(key,range), wrap=$("#progChart");
  if(!S.length){ $("#progHead").innerHTML=""; wrap.innerHTML=`<div class="empty">No history yet — it saves itself once a day.</div>`; $("#progTbl").innerHTML=""; return; }
  const first=S[0], last=S[S.length-1], dl=last.v-first.v, worse=false;
  $("#progHead").innerHTML=`<div class="phead-big">${F(last.v)}</div><div class="phead-sub">${esc(M[1])} · ${S.length>1?(dl===0?"no change":`<span class="${dl>0?"ok":"bad"}">${dl>0?"▲":"▼"} ${F(Math.abs(dl))}</span> since ${esc(fd(first.d))}`):"first day saved — the line grows from here"}</div>`;
  const css=getComputedStyle(document.documentElement), cv=n=>css.getPropertyValue(n).trim();
  const W=640,H=220,pl=58,pr=16,pt=14,pb=28,PW=W-pl-pr,PH=H-pt-pb, vals=S.map(e=>e.v), mn=Math.min(...vals), mx=Math.max(...vals);
  const nice=x=>{ const e=10**Math.floor(Math.log10(x)), f=x/e; return (f<=1?1:f<=2?2:f<=2.5?2.5:f<=5?5:10)*e; }; // round axis steps: 280M, 300M, 320M
  const step=nice(((mx-mn)||Math.max(Math.abs(mx)*0.04,1))/3); let lo=Math.floor(mn/step)*step, hi=Math.ceil(mx/step)*step; if(hi===lo) hi=lo+step;
  const t=e=>new Date(e.d+"T00:00:00").getTime(), t0=t(first), t1=t(last);
  const X=e=>t1===t0?pl+PW/2:pl+(t(e)-t0)/(t1-t0)*PW, Y=v=>pt+PH-(v-lo)/(hi-lo)*PH, col=cv("--acc"), grid=cv("--line-soft"), ink=cv("--faint"), bg=cv("--panel");
  let g=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(M[1])} over time">`;
  for(let v=lo;v<=hi+step/2;v+=step){ const y=Y(v); g+=`<line x1="${pl}" x2="${W-pr}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${grid}"/><text x="${pl-8}" y="${(y+4).toFixed(1)}" text-anchor="end" font-size="11" font-family="JetBrains Mono,monospace" fill="${ink}">${esc(F(v))}</text>`; }
  g+=`<text x="${pl}" y="${H-8}" font-size="11" font-family="JetBrains Mono,monospace" fill="${ink}">${esc(fd(first.d))}</text>`+(S.length>1?`<text x="${W-pr}" y="${H-8}" text-anchor="end" font-size="11" font-family="JetBrains Mono,monospace" fill="${ink}">${esc(fd(last.d))}</text>`:"");
  if(S.length>1) g+=`<polyline points="${S.map(e=>X(e).toFixed(1)+","+Y(e.v).toFixed(1)).join(" ")}" fill="none" stroke="${col}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
  S.forEach((e,k)=>{ if(k>0&&k<S.length-1&&e.v!==S[k-1].v) g+=`<circle cx="${X(e).toFixed(1)}" cy="${Y(e.v).toFixed(1)}" r="3.5" fill="${bg}" stroke="${col}" stroke-width="2"/>`; }); // a dot wherever the number changed
  g+=`<circle cx="${X(last).toFixed(1)}" cy="${Y(last.v).toFixed(1)}" r="5" fill="${col}" stroke="${bg}" stroke-width="2"/>`;
  g+=`<line id="pX" y1="${pt}" y2="${pt+PH}" stroke="${ink}" stroke-dasharray="3 3" visibility="hidden"/><circle id="pDot" r="5" fill="${bg}" stroke="${col}" stroke-width="2" visibility="hidden"/><rect x="${pl}" y="${pt}" width="${PW}" height="${PH}" fill="transparent" id="pHit"/></svg><div class="ptip" id="pTip" hidden></div>`;
  wrap.innerHTML=g;
  const svg=wrap.querySelector("svg"), tip=$("#pTip"), px=$("#pX"), pd=$("#pDot");
  const show=ev=>{ const r=svg.getBoundingClientRect(), x=(ev.clientX-r.left)/r.width*W; let best=S[0]; S.forEach(e=>{ if(Math.abs(X(e)-x)<Math.abs(X(best)-x)) best=e; });
    const cx=X(best), cy=Y(best.v); px.setAttribute("x1",cx); px.setAttribute("x2",cx); px.setAttribute("visibility","visible"); pd.setAttribute("cx",cx); pd.setAttribute("cy",cy); pd.setAttribute("visibility","visible");
    tip.hidden=false; tip.innerHTML=`${esc(F(best.v))}<small>${esc(fd(best.d))}</small>`; tip.style.left=(cx/W*r.width)+"px"; tip.style.top=(cy/H*r.height)+"px"; };
  const hide=()=>{ tip.hidden=true; px.setAttribute("visibility","hidden"); pd.setAttribute("visibility","hidden"); };
  const hit=$("#pHit"); hit.onpointermove=show; hit.onpointerdown=show; hit.onpointerleave=hide;
  $("#progTbl").innerHTML=`<table class="gtable"><thead><tr><th>Date</th><th>${esc(M[1])}</th></tr></thead><tbody>${S.slice().reverse().slice(0,30).map(e=>`<tr><td>${esc(fd(e.d))}</td><td>${esc(F(e.v))}</td></tr>`).join("")}</tbody></table>`;
}

/* ---------- masters ---------- */
function mastSkillLine(m){
  const S=Array.isArray(m.skills)?m.skills:[], caps=MASTER_SKILL_MAX[m.n]||[];
  if(!S.some(x=>num(x&&x.l))) return "Skills not set";
  const have=S.reduce((t,x,i)=>t+(caps[i]?Math.min(num(x&&x.l),caps[i]):0),0), tot=caps.reduce((t,c)=>t+c,0);
  return "Skills "+[0,1,2,3].map(i=>{ const x=S[i]||{}; return num(x.l)?(skillIsMax(x,skillCap(m.n,i))?"MAX":"Lv"+num(x.l)):"🔒"; }).join(" · ")+(tot?` (${have}/${tot})`:"");
}
function renderMasters(){
  const c=(state.masters||[]).map(m=>({m,info:MASTER_INFO[m.n],lv:num(m.l)})).filter(x=>x.info&&x.lv<100&&(x.info.best===MAIN_TROOP||x.info.best==="All squads")).sort((a,b)=>b.lv-a.lv)[0];
  $("#mastNext").hidden=true; // master #1 in the list is the next one to level
  const L=state.masters.slice().sort((a,b)=>mastRank(a)-mastRank(b));
  const mb=$("#mastBody"); mb.className="card dcard mt"; mb.removeAttribute("style");
  mb.innerHTML=L.map((m,i)=>{ const info=MASTER_INFO[m.n], rk=MASTER_RANK[m.n], lv=num(m.l);
    return `<button class="drow vcard" data-i="${state.masters.indexOf(m)}">${rk?`<span class="dn${rk[0]===1?" go":""}">${rk[0]}</span>`:'<span class="dn">·</span>'}
      <span class="dt"><b>${esc(m.n)}${info?` <span class="faint" style="font-weight:500">· ${esc(info.best)}</span>`:""}</b><span>${esc(mastSkillLine(m))}</span><span class="pbar"><i class="${lv>=100?"ok":""}" style="width:${Math.min(100,lv)}%"></i></span></span>
      <span class="dv">${lv}<small>/ 100</small></span></button>`; }).join("");
  bindAll($("#mastBody"),".vcard",b=>openMastSheet(state.masters[+b.dataset.i]));
  on("addMast",()=>{ const m={n:"New master "+(state.masters.length+1),l:"0",note:""}; state.masters.push(m); afterEdit(); openMastSheet(m); });
}
function openMastSheet(m){
  const info=MASTER_INFO[m.n];
  openSheet({title:m.n,sub:info?info.title:"Custom master",build(f){
    if(!info) f.appendChild(fld("Name",{value:m.n,set:v=>m.n=v}));
    f.appendChild(fld("Affinity level (0–100)",{type:"num",value:m.l,get:()=>m.l,set:v=>m.l=String(v),min:0,max:100}));
    const how=infoBox(); f.appendChild(how);
    const sk=document.createElement("div"); sk.className="stack"; f.appendChild(sk);
    const skOf=i=>{ if(!Array.isArray(m.skills)) m.skills=[{l:0},{l:0},{l:0},{l:0}]; return m.skills[i]||(m.skills[i]={l:0}); };
    [0,1,2,3].forEach(i=>{ const s=skOf(i), cap=skillCap(m.n,i);
      const row=document.createElement("div"); row.className="frow";
      row.appendChild(fld(`Skill ${i+1} level${cap?` (max ${cap})`:""}`,{type:"num",value:s.l,get:()=>s.l,set:v=>s.l=v,min:0,max:cap||99,hint:"0 = locked"}));
      row.appendChild(fld(`Skill ${i+1} type`,{type:"select",value:s.t||"",options:[["","—"],["c","Combat"],["g","Growth"]],set:v=>s.t=v}));
      sk.appendChild(row); });
    if(info){ const facts=infoBox(); facts.innerHTML=`<b>Talent:</b> ${esc(info.talent)}<br><b>Research:</b> ${esc(info.research)} · best for ${esc(info.best)}<br><b>Kindred Soul:</b> ${esc(info.ks)}<br><b>Unlocks with:</b> ${esc(info.unlock)}`; f.appendChild(facts); }
    f.appendChild(fld("Your note",{type:"area",rows:5,value:m.note,set:v=>m.note=v}));
    const r=()=>{ how.innerHTML=`<ol style="margin:0;padding-left:18px">${masterHowTo(m,info)}</ol><div style="margin-top:6px">${esc(mastSkillLine(m))}</div>`; };
    r(); return r; },
    onDelete:()=>{ const i=state.masters.indexOf(m); if(i>-1) state.masters.splice(i,1); }});
}

/* ---------- mystic trials ---------- */
function renderMystic(){
  const b=$("#mysticBody");
  const spark=log=>{ if(log.length<2) return ""; const v=log.map(e=>e.v), lo=Math.min(...v), hi=Math.max(...v), W=64, H=22;
    const pts=v.map((x,k)=>`${(k/(v.length-1)*W).toFixed(1)},${(hi===lo?H/2:2+(x-lo)/(hi-lo)*(H-4)).toFixed(1)}`).join(" "); // lower rank = better = higher on the line
    return `<svg class="spark" viewBox="0 0 ${W} ${H}" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>`; };
  b.className="card dcard"; b.innerHTML=state.mysticTrials.map((z,i)=>{ const log=(z.log||[]).slice().sort((a,c)=>a.d.localeCompare(c.d)); const d=log.length>1?log[log.length-1].v-log[0].v:0;
    return `<button class="drow lrow" data-i="${i}"><span class="dt"><b>${esc(z.k||"Zone")}</b><span>${log.length>1?(d<0?`<span class="ok">▼ ${fmt(-d)} better</span>`:d>0?`<span class="bad">▲ ${fmt(d)} worse</span>`:"no change"):"rank logs when you update it"}</span></span><span class="${d<0?"ok":d>0?"bad":"faint"}">${spark(log)}</span><span class="dv">#${esc(String(z.v||"—"))}</span></button>`; }).join("");
  bindAll(b,".lrow",x=>openMysticSheet(state.mysticTrials[+x.dataset.i]));
  on("addMystic",()=>{ const z={k:"New zone",v:"",log:[]}; state.mysticTrials.push(z); afterEdit(); openMysticSheet(z); });
  paintMysticChart();
}
function openMysticSheet(z){
  openSheet({title:z.k||"Zone",sub:"Your rank is logged by date each time you change it.",build(f){
    f.appendChild(fld("Zone",{value:z.k,set:v=>z.k=v}));
    f.appendChild(fld("Rank",{type:"num",value:z.v,get:()=>z.v,allowEmpty:true,set:v=>{ z.v=v===""?"":String(v); if(v!=="") mysticLogEntry(z); }}));
  },onDelete:()=>{ const i=state.mysticTrials.indexOf(z); if(i>-1) state.mysticTrials.splice(i,1); }});
}
function paintMysticChart(){
  const wrap=$("#mysticChartWrap"); if(!wrap) return;
  const css=getComputedStyle(document.documentElement), cv=n=>css.getPropertyValue(n).trim();
  const zones=(state.mysticTrials||[]).map((z,i)=>({z,i,log:(Array.isArray(z.log)?z.log:[]).slice().sort((a,b)=>a.d.localeCompare(b.d))})).filter(x=>x.log.length);
  if(!zones.length){ wrap.innerHTML=`<div class="empty">Update a zone's rank to start the trend.</div>`; return; }
  const W=300,H=150,pl=40,pr=14,pt=14,pb=26,PW=W-pl-pr,PH=H-pt-pb, line=cv("--line"), faint=cv("--faint"), bg=cv("--panel");
  wrap.innerHTML=`<div class="chartgrid">`+zones.map(({z,i,log})=>{
    const col=cv("--c"+(i%8+1)), vals=log.map(e=>e.v), mn=Math.min(...vals), mx=Math.max(...vals), vp=(mx-mn)*0.15||Math.max(3,mx*0.1,1), lo=mn-vp, hi=mx+vp;
    const t0=new Date(log[0].d).getTime(), t1=new Date(log[log.length-1].d).getTime();
    const X=d=>t1===t0?pl+PW/2:pl+((new Date(d).getTime()-t0)/(t1-t0))*PW, Y=v=>hi===lo?pt+PH/2:pt+PH-((v-lo)/(hi-lo))*PH;
    const last=log[log.length-1].v, dlt=last-log[0].v;
    let svg=`<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block" role="img" aria-label="${esc(z.k)} rank trend">`;
    for(let g=0;g<=2;g++){ const v=lo+(hi-lo)*g/2, y=pt+PH-PH*g/2; svg+=`<line x1="${pl}" y1="${y.toFixed(1)}" x2="${W-pr}" y2="${y.toFixed(1)}" stroke="${line}"/><text x="${pl-6}" y="${(y+3).toFixed(1)}" text-anchor="end" font-family="JetBrains Mono,monospace" font-size="10" fill="${faint}">${fmt(Math.round(v))}</text>`; }
    if(log.length>1) svg+=`<polyline points="${log.map(e=>X(e.d).toFixed(1)+","+Y(e.v).toFixed(1)).join(" ")}" fill="none" stroke="${col}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
    log.forEach((e,k)=>{ svg+=`<circle cx="${X(e.d).toFixed(1)}" cy="${Y(e.v).toFixed(1)}" r="${k===log.length-1?4.5:3.5}" fill="${k===log.length-1?col:bg}" stroke="${col}" stroke-width="2"><title>${e.d}: #${fmt(e.v)}</title></circle>`; });
    svg+=`<text x="${pl}" y="${H-6}" font-family="JetBrains Mono,monospace" font-size="9" fill="${faint}">${fd(log[0].d)}</text><text x="${W-pr}" y="${H-6}" text-anchor="end" font-family="JetBrains Mono,monospace" font-size="9" fill="${faint}">${fd(log[log.length-1].d)}</text></svg>`;
    return `<div class="chart"><div class="rowb" style="flex-wrap:nowrap"><span style="display:flex;align-items:center;gap:6px;min-width:0"><span style="width:9px;height:9px;border-radius:50%;background:${col};flex:none"></span><b style="font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(z.k)}</b></span><b class="mono gold">#${fmt(last)}</b></div>
      <div style="font-size:13px;margin:2px 0 4px">${log.length>1?(dlt<0?`<span class="ok">▼ ${fmt(-dlt)} better</span>`:dlt>0?`<span class="bad">▲ ${fmt(dlt)} worse</span>`:`<span class="faint">no change</span>`):`<span class="faint">first log</span>`}</div>${svg}</div>`; }).join("")+`</div>`;
}

