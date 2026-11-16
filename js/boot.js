"use strict";
/* =====================================================================
   RENDER ALL + BOOT
   ===================================================================== */
/* ---------- Update everything (one page) ---------- */
function renderUpdate(){
  const host=$("#qBody"); if(!host||host.contains(document.activeElement)) return;
  if(!state.ui.qOpen||Object.keys(state.ui.qOpen).filter(k=>state.ui.qOpen[k]).length!==1) state.ui.qOpen={[Object.keys(state.ui.qOpen||{}).find(k=>state.ui.qOpen[k])||"Bag"]:true};
  host.innerHTML="";
  // ---- one input, no label box (the table/row gives the label); d = digits wide
  const box=(o)=>{ const el=fld("",o).querySelector("input,select"); el.setAttribute("aria-label",o.aria);
    if(o.d) el.style.setProperty("--d",o.d); if(o.max!=null&&o.type==="num"){ el.title=`${o.aria} (max ${o.max})`; const mark=()=>el.classList.toggle("atmax",num(o.get())>=o.max); mark(); el.addEventListener("input",mark); }
    el.setAttribute("enterkeyhint","next"); return el; };
  const n=(aria,obj,key,o)=>Object.assign({type:"num",aria,value:obj[key],get:()=>obj[key],set:v=>obj[key]=v},o||{});
  // ---- pattern 1: matrix — one header, one row per thing, same columns
  const mx=(head,rows,cls)=>{ if(rows.length>=10&&matchMedia("(min-width:1100px)").matches){ const h=Math.ceil(rows.length/2), w=document.createElement("div"); w.className="qmx2"; w.append(mx1(head,rows.slice(0,h),cls),mx1(head,rows.slice(h),cls)); return w; } return mx1(head,rows,cls); };
  const mx1=(head,rows,cls)=>{ const t=document.createElement("table"); t.className="qmx"+(cls?" "+cls:"");
    t.innerHTML=`<thead>${head.map(r=>`<tr><td></td>${r.map(c=>`<th scope="col"${c.span?` colspan="${c.span}"`:""}${c.gs?' class="gs"':""}>${c.h}</th>`).join("")}</tr>`).join("")}</thead><tbody></tbody>`;
    rows.forEach(r=>{ const tr=t.tBodies[0].insertRow(), th=document.createElement("th"); th.scope="row"; th.innerHTML=r.h; tr.appendChild(th);
      r.cells.forEach((c,i)=>{ const td=tr.insertCell(); if(r.gs&&r.gs.includes(i)) td.className="gs"; if(c) td.appendChild(box(c)); }); });
    t.addEventListener("keydown",e=>{ if(e.target.tagName!=="INPUT"||!/^(Enter|ArrowDown|ArrowUp)$/.test(e.key)) return; // Enter / ↓ = next row, same column
      const td=e.target.closest("td"), rows=[...t.tBodies[0].rows], r=rows.indexOf(td.parentElement)+(e.key==="ArrowUp"?-1:1);
      const nx=rows[r]&&rows[r].cells[td.cellIndex]&&rows[r].cells[td.cellIndex].querySelector("input,select"); if(nx){ e.preventDefault(); nx.focus(); } });
    const w=document.createElement("div"); w.className="qmxw"; w.appendChild(t); return w; };
  // ---- pattern 2: list — label left, sized input right, two columns on wide screens
  const ls=(items)=>{ const g=document.createElement("div"); g.className="qlist"; items=items.filter(Boolean);
    const dmax=Math.max(...items.map(o=>o.d||0)); items.forEach(o=>{ if(o.type!=="select") o.d=dmax; }); // one width per list = one clean right edge
    items.forEach(o=>{ const row=document.createElement("label"); row.className="qrow";
      row.innerHTML=`<span class="ql">${esc(o.label)}${o.note?` <small>${esc(o.note)}</small>`:""}</span>`; const el=box(Object.assign({aria:o.label},o)); row.appendChild(el);
      if(o.unit) row.insertAdjacentHTML("beforeend",`<small class="qu">${esc(o.unit)}</small>`); g.appendChild(row); }); return g; };
  const L=(label,obj,key,o)=>Object.assign(n(label,obj,key),{label},o||{});
  const sub=t=>{ const h=document.createElement("div"); h.className="qsub"; h.textContent=t; return h; };
  const ti=t=>`<span class="qti">${hgIcon(TROOP_ICON[t])}<span class="full">${t}</span><span class="abbr" aria-hidden="true">${t.slice(0,3)}</span></span>`;
  const groups=[];
  const group=(key,title,hint,build)=>{ groups.push([key,title]); const d=document.createElement("details"); d.className="fold"; d.dataset.k=key; if(state.ui.qOpen[key]) d.open=true;
    d.innerHTML=`<summary><span class="grow">${title}</span><span class="qsaved" aria-live="polite"></span><span class="u-font-weight-500-font-size-14px faint">${hint||""}</span></summary><div class="fbody form"></div>`;
    { let t=null; const ok=()=>{ const q=d.querySelector(".qsaved"); q.textContent="Saved ✓"; q.classList.add("on"); clearTimeout(t); t=setTimeout(()=>q.classList.remove("on"),1600); };
      d.addEventListener("input",ok); d.addEventListener("change",ok); } // confirm each edit right where you typed
    const body=d.querySelector(".fbody"); let built=false; const fill=()=>{ if(built) return; built=true; build(body); };
    if(d.open) fill(); d.ontoggle=()=>{ if(d.open){ state.ui.qOpen={[key]:true}; fill(); host.querySelectorAll("details.fold").forEach(o=>{ if(o!==d) o.open=false; }); } else if(state.ui.qOpen[key]) delete state.ui.qOpen[key]; scheduleSave(); };
    host.appendChild(d); };
  const H=state.heroGear.have, C=state.charms.have, P=state.pets.have, G=state.govGear.have;
  group("Bag","Materials in your bag","dust, gold, gear, charms, pets",b=>{
    b.append(sub("T11 & buildings"),ls([L("Truegold Dust",state.dust,"current",{d:7}),L("Gold",state.dust,"gold",{d:11}),L("Truegold",state.tg,"have",{d:6}),L("Tempered Truegold",state.tg,"ttgHave",{d:6})]));
    b.append(sub("Hero Gear"),ls([L("Enhancement XP",H,"xp",{d:11}),L("Forgehammers",H,"fh",{d:6}),L("Mythic Gear",H,"mg",{d:4}),L("Mithril",H,"mith",{d:4})]));
    b.append(sub("Charms"),ls([L("Charm Guides",C,"guides",{d:6}),L("Charm Designs",C,"designs",{d:6})]));
    b.append(sub("Pets"),ls([L("Pet Food",P,"food",{d:9}),L("Growth Manuals",P,"manuals",{d:6}),L("Nutrient Potions",P,"potions",{d:6}),L("Medallions",P,"medals",{d:5}),L("Common Taming Marks",P,"tmCommon",{d:6}),L("Advanced Taming Marks",P,"tmAdv",{d:6})]));
    b.append(sub("Governor Gear"),ls([L("Satin",G,"satin",{d:7}),L("Gilded Threads",G,"threads",{d:6}),L("Artisan's Vision",G,"vision",{d:5})]));
  });
  group("Widgets","Widgets","level + in hand per hero",b=>{
    b.append(mx([[{h:"Level <small>/10</small>"},{h:"In hand"}]],state.widgets.rows.map(r=>({h:`${heroAvSm(r.hero)}<span>${esc(r.hero||"Hero")}</span>`,
      cells:[n(`${r.hero} widget level`,r,"lvl",{min:0,max:10,d:2}),n(`${r.hero} widgets in hand`,r,"have",{d:4})]}))),"hero"); });
  group("HG","Hero Gear","level + mastery per piece",b=>{
    const rows=state.heroGear.rows, T=TROOP_ORDER.filter(t=>rows.some(r=>r.type===t)), S=[...new Set(rows.map(r=>slotName(r.slot)))];
    b.append(mx([T.map((t,i)=>({h:ti(t),span:2,gs:i>0})), T.flatMap((t,i)=>[{h:"Lv",gs:i>0},{h:`M<span class="wide">astery</span>`}])],
      S.map(s=>({h:`${hgIcon(SLOT_ICON[s.toLowerCase()]||SLOT_ICON.helm)}<span>${esc(s)}</span>`, gs:T.map((_,i)=>i*2).filter(i=>i>0),
        cells:T.flatMap(t=>{ const r=rows.find(x=>x.type===t&&slotName(x.slot)===s); return r?[n(`${t} ${s} level`,r,"lvC",{min:0,max:200,d:3}),n(`${t} ${s} mastery`,r,"mC",{min:0,max:20,d:2})]:[null,null]; })})),"hg"));
    const p=document.createElement("p"); p.className="qnote"; p.textContent="Lv = gear level (max 200) · M = mastery (max 20) · Enter or ↓ moves down a column."; b.append(p); });
  group("Charms","Charms","current level of each charm",b=>{
    const T=TROOP_ORDER.filter(t=>state.charms.rows.some(r=>r.type===t)), k=Math.max(...T.map(t=>state.charms.rows.filter(r=>r.type===t).length));
    b.append(mx([Array.from({length:k},(_,i)=>({h:String(i+1)}))],T.map(t=>({h:ti(t),cells:Array.from({length:k},(_,i)=>{ const r=state.charms.rows.filter(x=>x.type===t)[i]; return r?n(`${t} charm ${i+1} level`,r,"lvl",{min:0,max:22,d:2,set:v=>{ if(num(v)!==num(r.lvl)) r.st=0; r.lvl=v; }}):null; })})),"charm"));
    const p=document.createElement("p"); p.className="qnote"; p.textContent="Charm level, 0–22."; b.append(p); });
  group("Pets","Pets","level of each pet",b=>{
    b.append(ls(state.pets.rows.slice().sort((a,c)=>petRank(a)-petRank(c)).map(r=>L(r.n||"Pet",r,"lvl",{min:0,max:r.max||undefined,d:3,unit:r.max?"/"+r.max:""})))); });
  group("Gov","Governor Gear","tier of each piece",b=>{
    b.append(ls(state.govGear.pieces.slice().sort((a,c)=>byTroop(a,c,p=>p.name)).map(p=>({type:"select",label:p.name||"Piece",aria:p.name,value:String(p.cur),options:govOpts(),set:v=>p.cur=parseInt(v,10)})))); });
  group("T11","T11 nodes","level of each node",b=>{
    PHASES.slice().sort((a,c)=>byTroop(a,c,p=>p.n)).forEach(ph=>{ const Ls=sortTree(state[ph.k],ph.k); b.append(sub(ph.n));
      b.append(ls(Ls.map(nd=>{ const m=nd.name.replace(/^Truegold /,"").replace(/ \(unlock\)/," unlock").match(/^(.*?)(?: \((.*)\))?$/);
        return L(m[1],nd,"cur",{note:m[2]||"",min:0,max:nd.max||12,d:2,unit:"/"+(nd.max||12)}); }))); }); });
  group("Masters","Masters","affinity + skill levels",b=>{
    const M=state.masters.slice().sort((a,c)=>mastRank(a)-mastRank(c)); M.forEach(m=>{ if(!Array.isArray(m.skills)) m.skills=[{l:0},{l:0},{l:0},{l:0}]; });
    b.append(mx([[{h:"Affinity"},{h:"S1"},{h:"S2"},{h:"S3"},{h:"S4"}]],M.map(m=>({h:esc(m.n),cells:[{type:"num",aria:`${m.n} affinity`,value:m.l,get:()=>m.l,set:v=>m.l=String(v),min:0,max:100,d:3},
      ...[0,1,2,3].map(i=>{ const sk=m.skills[i]||(m.skills[i]={l:0}), cap=skillCap(m.n,i); return n(`${m.n} skill ${i+1}`,sk,"l",{min:0,max:cap||99,d:2}); })]})),"mast"));
    const p=document.createElement("p"); p.className="qnote"; p.textContent="Gold number = at max. Hover or long-press a box to see its max."; b.append(p); });
  group("Shards","Gold hero shards","shards in hand",b=>{
    b.append(ls([{type:"num",label:"General Mythic shards",aria:"General Mythic shards",value:state.shardGeneral||0,get:()=>state.shardGeneral||0,set:v=>state.shardGeneral=v,d:4}]));
    b.append(mx([[{h:"Stars"},{h:"Shards"}]],state.goldShards.map(r=>({h:`${heroAvSm(r.n)}<span>${esc(r.n||"Hero")}</span>`,cells:[
      {type:"select",aria:`${r.n} star tier`,value:hasStars(r)?String(num(r.pos)):"",options:(hasStars(r)?[]:[["","—"]]).concat(STAR_OPTS),set:v=>{ r.pos=v===""?null:parseInt(v,10); if(r.tgt==null) r.tgt=SHARD_MAX; }},
      n(`${r.n} shards`,r,"have",{d:4})]})),"hero")); });
  group("Troops","Troops","current counts",b=>{
    b.append(ls(TROOP_KEYS.map(([k,l])=>L(l,state.troopCounts[k]||(state.troopCounts[k]={cur:0,tgt:0}),"cur",{d:9})))); });
  group("Buildings","Buildings","current tier",b=>{
    b.append(ls(state.buildings.map(bl=>{ const B=BUILD_TIERS[bl.n]; return B?{type:"select",label:bl.n,aria:bl.n,value:String(Math.min(B.steps.length,bl.stepIdx||0)),options:bldOptions(bl),set:v=>bl.stepIdx=parseInt(v,10)}:null; }))); });
  group("Power","Power & combat","pillars, wins, Lethality, Health",b=>{
    b.append(sub("Power pillars"),ls(state.pillars.map(p=>L(p.name,p,"v",{d:11}))));
    const c=state.combat;
    b.append(sub("Combat"),ls([L("Attacker wins",c,"attW",{d:5}),L("Attacker losses",c,"attL",{d:5}),L("Defender wins",c,"defW",{d:5}),L("Defender losses",c,"defL",{d:5}),L("Lethality",c,"leth",{decimal:true,d:6,unit:"%"}),L("Health",c,"hp",{decimal:true,d:6,unit:"%"})]));
    b.append(sub("Account"),ls([{type:"num",label:"Total power",value:state.account.power,get:()=>state.account.power,set:v=>state.account.power=String(v),d:11},{label:"VIP",value:state.account.vip,set:v=>state.account.vip=v,d:3},{label:"Town Center",value:state.account.tc,set:v=>state.account.tc=v,d:14}])); });
  group("Res","Resources & speedups","type speedups like 4d 4h",b=>{
    const R=state.resources, sp=r=>/\(min\)/.test(r.n), dur=r=>minsTxt(r.h)+(num(r.h)%60?" "+(num(r.h)%60)+"m":"");
    b.append(sub("Speedups — type like the game shows: 4d 4h 3m"),ls(R.filter(sp).map(r=>({label:r.n.replace(/ speedup \(min\)$/i,"").replace(/ \(min\)$/,""),aria:r.n,value:dur(r),set:v=>{ const m=parseDur(v); if(m!=null) r.h=String(m); },d:12}))));
    b.append(sub("Resources"),ls(R.filter(r=>!sp(r)).map(r=>({type:"num",label:r.n,value:r.h,get:()=>r.h,allowEmpty:true,set:v=>r.h=v===""?"":String(v),d:13})))); });
  group("Mystic","Mystic Trials","rank per zone",b=>{
    b.append(ls(state.mysticTrials.map(z=>{ const m=(z.k||"Zone").match(/^(.*?)(?: \((.*)\))?$/); return {type:"num",label:m[1],note:m[2]||"",value:z.v,get:()=>z.v,allowEmpty:true,set:v=>{ z.v=v===""?"":String(v); if(v!=="") mysticLogEntry(z); },d:4,unit:"rank"}; }))); });
  $("#qJump").innerHTML=groups.map(([k,t])=>`<button class="chip" data-k="${esc(k)}">${esc(t)}</button>`).join("");
  $$("#qJump .chip").forEach(c=>c.onclick=()=>{ host.querySelectorAll("details.fold").forEach(d=>{ d.open=d.dataset.k===c.dataset.k; });
    const d=host.querySelector(`details.fold[data-k="${c.dataset.k}"]`); if(d) setTimeout(()=>d.scrollIntoView({behavior:"smooth",block:"start"}),30); });
}
const TAB_RENDER={Home:()=>renderHome(),Upgrade:()=>renderUpgrade(),Heroes:()=>{ renderRally(); renderGear(); },Governor:()=>{ renderRally(); renderGear(); },Town:()=>renderBase(),Progress:()=>renderRally(),Shop:()=>renderPlan(),Data:()=>{ renderPlan(); renderData(); renderUpdate(); }};
const dirtyTabs=new Set();
function renderPrep(){ migrateEvents(); migrateMasterNotes(); if(!state.ui.sub) state.ui.sub={}; }
function renderAll(){ renderPrep(); dirtyTabs.clear(); TABS.forEach(t=>TAB_RENDER[t]()); }
function renderFirst(){ renderActive(); const idle=window.requestIdleCallback||(f=>setTimeout(f,200)); // open tab first, the rest in the background
  idle(()=>{ if(!dirtyTabs.size) return; renderPrep(); [...dirtyTabs].forEach(t=>{ if(t!==state.ui.tab){ dirtyTabs.delete(t); TAB_RENDER[t](); } }); }); }
function renderActive(){ // after an edit: redraw only the tab you're looking at; the rest redraw when opened
  renderPrep(); const cur=TABS.includes(state.ui.tab)?state.ui.tab:"Home";
  TAB_RENDER[cur](); TABS.forEach(t=>{ if(t!==cur) dirtyTabs.add(t); else dirtyTabs.delete(t); });
}
/* ---------- quick search (Ctrl K) ---------- */
const SEARCH_KW={
  "Hero Gear":"mithril forgehammer forgehammers red gear imbuement mastery enhancement xp mythic gear chest",
  "Widgets":"exclusive gear widget",
  "Charms":"charm designs guides lethality health",
  "Governor Gear":"gov gear satin gilded threads artisan vision",
  "Gold Hero Shards":"shards stars star tier general mythic",
  "Hero Roles":"tier list kvk bear garrison joiner arena conquest solo use score best heroes hero page troop type",
  "Progress":"history chart trend growth power lethality health win rate over time",
  "Masters":"emblems affinity cassia pan kindred soul",
  "Mystic Trials":"rank zone mithril",
  "Pets":"pet food taming marks growth manuals potions medallions",
  "T11 Unlocks":"truegold dust infantry archer cavalry t11 nodes",
  "Troop Plan":"troops train training",
  "Build Order — TG6→TG8":"buildings town center tg truegold barracks range stable",
  "Resources & Speedups":"bread wood stone iron gold speedups",
  "Shops & Packs":"packs paid budget card monthly weekly aud spend best value per dollar pick plan compare",
  "Shop guide":"free shops trial arena alliance swordland tidal kvk coins shop guide best buy hall of heroes marks champagne vouchers dragon caravan weekly benefits widgets fund seasons",
  "Reminders":"reminders notifications calendar ics ntfy alerts phone",
  "Today":"routine daily checklist",
  "Upcoming Events":"events calendar kvk bear hunt hall of heroes armament",
  "Do next":"next upgrade priorities",
  "Update all":"update everything bag materials form",
  "Combat Quality":"win rate lethality health attacker defender",
  "Power Grades":"power pillars benchmark grade",
  "Data & Sync":"github sync token backup export import",
  "Account":"governor town center vip kingdom day power"};
function searchIndex(){
  const heroes=(state.goldShards||[]).map(r=>r.n).join(" ").toLowerCase();
  const out=$$(".sec[data-key]").map(sec=>{ const tab=sec.closest(".page").dataset.tab, sub=sec.dataset.sub||"", key=sec.dataset.key;
    const h=sec.querySelector("h2"), head=h?h.childNodes[0].textContent.trim():"";
    const kw=(SEARCH_KW[key]||"")+(/Shards|Hero Roles/.test(key)?" "+heroes:"");
    return {tab:lbl(tab),sub:sub?lbl(sub):"",key,title:key,kind:"Section",hay:[key,head,sub,tab,kw].join(" ").toLowerCase()}; });
  // rows inside the pages: heroes, masters, events, packs, bag items — jump straight to the row
  const add=(title,kind,where,go,extra)=>out.push({title,kind,tab:where,sub:"",go,hay:(title+" "+kind+" "+(extra||"")).toLowerCase()});
  (state.goldShards||[]).forEach(r=>r.n&&add(r.n,"Hero shards","Heroes › Shards",()=>{ setTab("Heroes","Shards"); flashRow(r.n); },"hero"));
  ((state.widgets&&state.widgets.rows)||[]).forEach(r=>r.hero&&add(r.hero+" widget","Widget","Heroes › Widgets",()=>{ setTab("Heroes","Widgets"); flashRow(r.hero); },"hero"));
  (state.masters||[]).forEach(m=>m.n&&add(m.n,"Master","Governor › Masters",()=>{ setTab("Governor","Masters"); flashRow(m.n); }));
  (state.events||[]).forEach(e=>e.n&&add(e.n,"Event","Opens the event",()=>openEventSheet(e)));
  (typeof VALUE_DB!=="undefined"?VALUE_DB:[]).forEach(d=>add(d.n,"Pack","Shop › Packs",()=>{ setTab("Shop","Paid"); flashRow(d.n); },"buy"));
  (state.packs||[]).forEach(p=>p.t&&!VALUE_DB.some(d=>d.n===p.t)&&add(p.t,"Your pack","Shop › Packs",()=>{ setTab("Shop","Paid"); flashRow(p.t); }));
  (typeof BAG_KEYS!=="undefined"?BAG_KEYS.map(b=>b[1]).concat(BAG_MORE.map(b=>b[0])):[]).forEach(n=>add(n,"In my bag","Home › My bag",()=>{ setTab("Home"); if(!state.ui.bagAll){ state.ui.bagAll=true; renderBagCheck(); } flashRow(n,"#bagCheck"); },"material bag"));
  return out;
}
// scroll to the first row on the open page that names it, and flash it
function flashRow(txt,scope){ setTimeout(()=>{ const host=scope?$(scope):$(".page:not([hidden])"); if(!host) return; const t=String(txt).toLowerCase();
  const el=[...host.querySelectorAll(".drow,.lrow,.tile,.vcard,.bcrow,.pstep,.sh2row,.shrow2,.hgrow,tr,.card")].filter(e=>e.offsetParent).find(e=>e.textContent.toLowerCase().includes(t));
  if(!el) return; el.scrollIntoView({block:"center",behavior:"smooth"}); const fo=el.matches("button,a,input,summary")?el:el.querySelector("button,a,input,summary")||el; if(fo===el&&!el.matches("button,a,input,summary")) el.tabIndex=-1; fo.focus({preventScroll:true}); el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash"); setTimeout(()=>el.classList.remove("flash"),1800); },120); }
let srchSel=0, srchRes=[];
function openSearch(){
  const w=$("#srch"), inp=$("#srchIn"); if(w.hidden) pushOverlay(); setBehind(true); w.hidden=false; inp.value=""; inp.setAttribute("aria-expanded","true"); paintSearch(); setTimeout(()=>inp.focus(),0);
}
function closeSearch(fromHistory){ if($("#srch").hidden) return; if(!fromHistory) popOverlay(); setBehind(false); $("#srch").hidden=true; $("#srchIn").setAttribute("aria-expanded","false"); }
function paintSearch(){
  const q=$("#srchIn").value.toLowerCase().trim(), words=q.split(/\s+/).filter(Boolean), all=searchIndex(), idx=words.length?all:all.filter(x=>x.kind==="Section");
  const rx=words.map(w=>new RegExp("(^|[^a-z0-9])"+w.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")));
  const score=x=>(x.title.toLowerCase().startsWith(q)?-2:x.title.toLowerCase().includes(q)?-1:Math.min(...rx.map(r=>{ const m=x.hay.match(r); return m?m.index:1e9; })))+(x.kind==="Section"?0:.5);
  srchRes=(!words.length?idx:idx.filter(x=>rx.every(r=>r.test(x.hay))).map(x=>({x,s:score(x)})).sort((a,b)=>a.s-b.s).map(o=>o.x)).slice(0,40);
  srchSel=Math.min(srchSel,Math.max(0,srchRes.length-1)); if(!q) srchSel=0;
  const inp=$("#srchIn");
  $("#srchList").innerHTML=srchRes.length?srchRes.map((r,i)=>`<li role="option" id="so-${i}" data-i="${i}" aria-selected="${i===srchSel}">${/hero|widget/i.test(r.kind)?heroAvSm(r.title.replace(/ widget$/,"")):""}<span class="st"><b>${esc(r.title)}</b>${r.kind!=="Section"?`<small>${esc(r.kind)}</small>`:""}</span><span class="where">${esc(r.tab)}${r.sub&&r.sub!==r.title?" › "+esc(r.sub):""}</span></li>`).join(""):`<li class="none" role="presentation">Nothing found for “${esc(q)}”</li>`;
  if(srchRes.length) inp.setAttribute("aria-activedescendant","so-"+srchSel); else inp.removeAttribute("aria-activedescendant");
  $$("#srchList [role=option]").forEach(b=>b.onclick=()=>pickSearch(+b.dataset.i));
}
function pickSearch(i){ const r=srchRes[i]; if(!r) return; closeSearch(); if(r.go){ r.go(); return; } goToSection(null,r.key);
  setTimeout(()=>{ const h=$(".page:not([hidden]) .phead h1"); if(h&&document.activeElement===document.body){ h.tabIndex=-1; h.focus({preventScroll:true}); } },140);
  setTimeout(()=>{ const sec=[...$$(".sec[data-key]")].find(x=>x.dataset.key===r.key); if(sec&&!sec.hidden&&!sec.dataset.sub) sec.scrollIntoView({behavior:"smooth",block:"start"}); },80); }
function initSearch(){
  ["searchSide","searchTop"].forEach(id=>on(id,openSearch));
  on("srchCancel",()=>closeSearch());
  const inp=$("#srchIn");
  inp.oninput=()=>{ srchSel=0; paintSearch(); };
  inp.onkeydown=e=>{ if(e.key==="ArrowDown"||e.key==="ArrowUp"){ e.preventDefault(); srchSel=Math.max(0,Math.min(srchRes.length-1,srchSel+(e.key==="ArrowDown"?1:-1))); paintSearch(); const sb=$(`#so-${srchSel}`); if(sb) sb.scrollIntoView({block:"nearest"}); }
    else if(e.key==="Enter"){ e.preventDefault(); pickSearch(srchSel); } else if(e.key==="Escape"){ closeSearch(); } };
  $("#srch").addEventListener("click",e=>{ if(e.target.id==="srch") closeSearch(); });
  document.addEventListener("keydown",e=>{ const t=e.target, typing=t&&(t.isContentEditable||/INPUT|TEXTAREA|SELECT/.test(t.tagName));
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){ e.preventDefault(); $("#srch").hidden?openSearch():closeSearch(); }
    else if(e.key==="/"&&!typing&&$("#srch").hidden){ e.preventDefault(); openSearch(); }
    else if(e.key==="Escape"&&!$("#srch").hidden) closeSearch(); });
}
/* ---------- quick update: the numbers you change most, one sheet ---------- */
function parseDur(v){ const t=String(v||"").toLowerCase().trim(); if(!t) return null;
  if(/^[\d,.]+$/.test(t)) return Math.round(num(t)); // plain number = minutes
  let m=0, ok=false; t.replace(/(\d+(?:\.\d+)?)\s*(d|day|days|h|hr|hrs|hour|hours|m|min|mins|minute|minutes)\b/g,(_,n,u)=>{ ok=true; n=parseFloat(n); m+=u[0]==="d"?n*1440:u[0]==="h"?n*60:n; return ""; });
  return ok?Math.round(m):null; }
function openQuickSheet(){
  openSheet({title:"Quick update",sub:"What blocks you first. Everything else is under “More numbers”.",build(f){
    const H=state.heroGear.have, G=state.govGear.have||(state.govGear.have={}), C=state.charms.have||(state.charms.have={});
    const N=(label,obj,k,o)=>fld(label,Object.assign({type:"num",value:obj[k],get:()=>obj[k],set:v=>obj[k]=v},o||{}));
    const sub=(host,t)=>{ const h=document.createElement("div"); h.className="qsub"; h.textContent=t; host.appendChild(h); };
    const pairs=(host,els)=>{ els=els.filter(Boolean); const g=document.createElement("div"); g.className="qpairs"; els.forEach(e=>g.appendChild(e)); host.appendChild(g); }; // even grid: no half-empty rows
    // every field, keyed so the ones that block you can come first
    const need=typeof blockerNeeds==="function"?blockerNeeds():{};
    const F={
      dust:()=>N("Truegold Dust",state.dust,"current"), tg:()=>N("Truegold",state.tg,"have"),
      fh:()=>N("Forgehammers",H,"fh"), mith:()=>N("Mithril",H,"mith"), mg:()=>N("Mythic Gear",H,"mg"), xp:()=>N("Enhancement XP",H,"xp",{ph:"e.g. 1.2m"}),
      gen:()=>fld("General Mythic shards",{type:"num",value:state.shardGeneral||0,get:()=>state.shardGeneral||0,set:v=>state.shardGeneral=v}),
      satin:()=>N("Satin",G,"satin"), threads:()=>N("Gilded Threads",G,"threads"), vision:()=>N("Artisan's Vision",G,"vision"),
      guides:()=>N("Charm Guides",C,"guides"), designs:()=>N("Charm Designs",C,"designs")};
    const blocking=["mg","mith","threads","designs","fh","gen"].filter(k=>need[k]&&need[k].short>0);
    if(blocking.includes("designs")) blocking.splice(blocking.indexOf("designs")+1,0,"guides"); // Designs and Guides belong together
    sub(f,blocking.length?"Blocking your next upgrades":"Your main numbers");
    const first=blocking.length?blocking:["dust","fh","mith","mg"];
    pairs(f,first.map(k=>F[k]()));
    // the rest folds away
    const more=document.createElement("details"); more.className="fold qmore"; more.innerHTML=`<summary><span class="grow">More numbers</span><span class="faint fs13">shards, widgets, speedups, gear</span></summary><div class="fbody form"></div>`;
    const m=more.querySelector(".fbody"); f.appendChild(more);
    let built=false; const fill=()=>{ if(built) return; built=true;
      sub(m,"Truegold & hero gear"); pairs(m,["dust","tg","fh","mith","mg","xp"].filter(k=>!first.includes(k)).map(k=>F[k]()));
      sub(m,"Hero shards"); const SH=shardOrder().filter(r=>!/amadeus|helga/i.test(r.n||"")).slice(0,3);
      pairs(m,[first.includes("gen")?null:F.gen(),...SH.map(r=>N(r.n+" shards",r,"have"))]);
      const W=(state.widgets&&state.widgets.rows)||[];
      const WR=W.some(r=>r.rally)?W.filter(r=>r.rally):W.slice(0,4); // rally heroes only — the rest are in Update all
      if(WR.length){ sub(m,"Widgets in hand"); pairs(m,WR.map(r=>N((r.hero||"Hero")+" widgets",r,"have"))); }
      sub(m,"Speedups");
      const R=state.resources||[], SP=[["General","General"],["Soldier Training","Training"],["Construction","Construction"],["Research","Research"],["Soldier Healing","Healing"],["Learning","Learning"]];
      const spF=([k,l])=>{ const r=R.find(x=>x.n.startsWith(k+" speedup")); if(!r) return null;
        return fld(l,{value:minsTxt(r.h)+(num(r.h)%60?" "+(num(r.h)%60)+"m":""),ph:"4d 4h 3m",set:v=>{ const mm=parseDur(v); if(mm!=null) r.h=String(mm); }}); };
      pairs(m,SP.map(spF));
      sub(m,"Governor gear & charms"); pairs(m,["satin","threads","vision","guides","designs"].filter(k=>!first.includes(k)).map(k=>F[k]())); };
    more.ontoggle=()=>{ if(more.open) fill(); };
  }});
}
function initStatic(){
  const dl=document.createElement("datalist"); dl.id="widHeroList"; dl.innerHTML=WID_HEROES.map(h=>`<option value="${esc(h)}">`).join(""); document.body.appendChild(dl);
  const pl=document.createElement("datalist"); pl.id="petList"; pl.innerHTML=Object.keys(PET_INFO).map(n=>`<option value="${esc(n)}">`).join(""); document.body.appendChild(pl);
}

/* ---------- boot ---------- */
(async function(){
  initStatic(); buildNav(); initSheet(); initTheme(); initInstall(); initSearch(); on("quickBtn",openQuickSheet); on("homeUpd",openQuickSheet); initFabScroll(); initStatusUI();
  const saved=await load();
  if(saved) state=mergeSeed(saved); else firstRun=!(syncCfg&&syncCfg.owner);
  if(Array.isArray(state.nodes)){
    state.nodes.forEach(n=>{ if(n.max==null) n.max=/unlock/i.test(n.name)?1:12;
      if(!Array.isArray(n.costs)||!n.costs.length){ const k=Object.keys(NODE_COSTS).find(x=>n.name.toLowerCase().includes(x)); if(k) n.costs=NODE_COSTS[k].slice(); }
      delete n.rem; delete n.next; });
    if(!state.nodes.some(n=>/unlock/i.test(n.name))) state.nodes.push({name:"Truegold Archers (unlock)",cur:0,max:1,costs:[2236]});
  }
  ["infNodes","cavNodes"].forEach(key=>{
    if(!Array.isArray(state[key])||!state[key].length) state[key]=structuredClone(SEED[key]);
    else state[key].forEach(n=>{ if(n.max==null) n.max=/unlock/i.test(n.name)?1:12;
      if(!Array.isArray(n.costs)||!n.costs.length){ const k=Object.keys(NODE_COSTS).find(x=>n.name.toLowerCase().includes(x)); if(k) n.costs=NODE_COSTS[k].slice(); }
      delete n.rem; delete n.next; });
  });
  if(!state.govGear||!Array.isArray(state.govGear.pieces)) state.govGear=structuredClone(SEED.govGear);
  if(!state.forecast||!Array.isArray(state.forecast.log)) state.forecast={log:[]};
  if(Array.isArray(state.mysticTrials)) state.mysticTrials.forEach(z=>{ if(!Array.isArray(z.log)) z.log=[]; if(!z.log.length){ const val=parseFloat(z.v); if(isFinite(val)) z.log.push({d:fcToday(),v:val}); } });
  if(!state.today||!Array.isArray(state.today.routine)) state.today=structuredClone(SEED.today);
  if(!state.weekly||!Array.isArray(state.weekly.items)) state.weekly=structuredClone(SEED.weekly);
  if(!Array.isArray(state.packs)) state.packs=structuredClone(SEED.packs);
  if(!state.heroInfo||typeof state.heroInfo!=="object") state.heroInfo=structuredClone(SEED.heroInfo);
  if(!Array.isArray(state.history)) state.history=[];
  takeSnapshot();
  state.packs.forEach(p=>{ if(p.d&&p.first&&p.kind!=="once") p.firstDone=true; }); // already-bought cards have used their first-buy price
  if(!state.ui||typeof state.ui!=="object") state.ui={tab:"Home"};
  if(!state.troopCounts) state.troopCounts=structuredClone(SEED.troopCounts);
  if(!state.heroGear||!Array.isArray(state.heroGear.rows)) state.heroGear=structuredClone(SEED.heroGear);
  if(!state.charms||!Array.isArray(state.charms.rows)||!state.charms.rows[0]||state.charms.rows[0].type===undefined) state.charms=structuredClone(SEED.charms);
  if(!state.widgets||!Array.isArray(state.widgets.rows)) state.widgets=structuredClone(SEED.widgets);
  if(!state.pets||!Array.isArray(state.pets.rows)) state.pets={have:{food:0,manuals:0,potions:0,medals:0,tmCommon:0,tmAdv:0},rows:[]};
  (state.buildings||[]).forEach(b=>{ const B=BUILD_TIERS[b.n]; if(B&&b.d&&(b.stepIdx||0)<B.steps.length) b.stepIdx=B.steps.length; if(B) delete b.d; }); // "done" now comes from the level
  if(!Array.isArray(state.goldShards)) state.goldShards=structuredClone(SEED.goldShards);
  if(!Array.isArray(state.events)) migrateEvents();
  if(Array.isArray(state.resources)) state.resources.forEach(r=>{ delete r.need; delete r.s; delete r.use; });
  if(Array.isArray(state.buildings)) state.buildings.forEach(bl=>{ if(bl.stepIdx===undefined) bl.stepIdx=0; delete bl.t; delete bl.tg; delete bl.ttg; delete bl.time; });
  if(state.account && !state.account.dayAnchor){ const d=parseInt(state.account.day)||443; const a=new Date(); a.setUTCDate(a.getUTCDate()-(d-1)); state.account.dayAnchor=a.toISOString().slice(0,10); }
  state.ui.tab=TAB_ALIAS[state.ui.tab]||state.ui.tab;
  renderFirst(); buildSync(); buildUpload(); initCommaFormatting(); initNoDrag();
  const fromHash=tabFromHash(); setTab(fromHash?fromHash[0]:state.ui.tab, fromHash?fromHash[1]:undefined, false); navReady=true; initDecorate(); initUpdateNotice(); if(/\?update/.test(location.hash)){ history.replaceState(null,"",location.hash.replace("?update","")); setTimeout(openQuickSheet,300); }
  const persists=hasStore||lsSet("__probe__","1"); if(!persists) setSaveUI("err","Session only");
  if(syncCfg.on && syncCfg.owner && loadTok()) syncPull(true);
})();

/* the floating Update button hides while you scroll down (so it never sits on a number) and comes back when you scroll up */
function initFabScroll(){ const f=$("#quickBtn"); if(!f) return; let last=scrollY, tick=false;
  addEventListener("scroll",()=>{ if(tick) return; tick=true; requestAnimationFrame(()=>{ const y=scrollY, d=y-last;
    if(Math.abs(d)>6){ f.classList.toggle("away",d>0&&y>80); last=y; } tick=false; }); },{passive:true}); }

/* first visit on a new device: offer where the data should come from */
let firstRun=false;
function renderFirstRun(){ const box=$("#firstRun"); if(!box) return; box.hidden=!firstRun; if(!firstRun) return;
  box.innerHTML=`<div class="dch"><h3>Welcome — where is your data?</h3></div><p class="dnote">This device has no saved data yet. The numbers you see are examples.</p>
    <div class="frbtns"><button class="btn primary" id="frPull">Get it from GitHub</button><button class="btn" id="frImport">Import a file</button><button class="btn" id="frFresh">Start fresh</button></div>`;
  on("frPull",()=>{ firstRun=false; renderFirstRun(); setTab("Data","Sync"); });
  on("frImport",()=>{ firstRun=false; renderFirstRun(); const fi=$("#importFile"); if(fi) fi.click(); });
  on("frFresh",()=>{ firstRun=false; renderFirstRun(); scheduleSave(); toast("Starting fresh — fill in your numbers with Update"); }); }
/* save status: tap the dot to hear it; show Offline when the network is gone */
function initStatusUI(){
  on("saveBtnM",()=>{ const t=($("#saveTxt")||{}).textContent||"Saved", s=($("#syncMini")||{}).textContent||""; toast(t+(s?" · "+s:"")); });
  const off=()=>{ const b=$("#offBadge"); if(b) b.hidden=navigator.onLine!==false; document.body.classList.toggle("is-offline",navigator.onLine===false); };
  addEventListener("online",off); addEventListener("offline",off); off(); }

/* tables keep their column names on phones; short game words get a tap-to-explain */
var ABBR={TTG:"Tempered Truegold",TG:"Truegold",KvK:"Kingdom vs Kingdom",SvS:"State vs State"};
var ABBR_RX=new RegExp("\\b("+Object.keys(ABBR).join("|")+")\\b");
function decorate(root){
  root.querySelectorAll("table.gtable,table.vmath").forEach(t=>{ const H=[...t.querySelectorAll("thead th")].map(th=>th.textContent.trim()); if(!H.length) return;
    t.querySelectorAll("tbody tr").forEach(tr=>[...tr.children].forEach((td,i)=>{ if(H[i]&&!td.dataset.label) td.dataset.label=H[i]; })); });
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement&&!n.parentElement.closest("abbr,input,textarea,script,style,svg,button.chip,code")&&ABBR_RX.test(n.nodeValue)?1:2});
  const hits=[]; let n; while((n=w.nextNode())) hits.push(n);
  hits.forEach(n=>{ const parts=n.nodeValue.split(new RegExp("\\b("+Object.keys(ABBR).join("|")+")\\b")); if(parts.length<2) return;
    const f=document.createDocumentFragment(); parts.forEach((p,i)=>{ if(i%2){ const a=document.createElement("abbr"); a.title=ABBR[p]; a.textContent=p; f.appendChild(a); } else if(p) f.appendChild(document.createTextNode(p)); });
    n.parentNode.replaceChild(f,n); }); }
function initDecorate(){ const main=$("#main"); if(!main) return; let q=false;
  new MutationObserver(()=>{ if(q) return; q=true; requestAnimationFrame(()=>{ q=false; decorate(main); }); }).observe(main,{childList:true,subtree:true});
  decorate(main);
  document.addEventListener("click",e=>{ const a=e.target.closest&&e.target.closest("abbr[title]"); if(a&&!a.closest("button,a,label")) toast(a.textContent+" = "+a.title); }); }

/* a new version was installed while the app was open: offer a reload */
function initUpdateNotice(){ if(!("serviceWorker" in navigator)) return; const had=!!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener("controllerchange",()=>{ if(!had) return; toastAction("Updated — tap to reload","Reload",()=>location.reload()); }); }
