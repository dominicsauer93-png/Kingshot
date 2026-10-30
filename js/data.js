"use strict";
/* =====================================================================
   DATA
   ===================================================================== */
function buildChecks(host,arr,o){
  o=o||{}; host.innerHTML="";
  arr.forEach(item=>{
    const li=document.createElement("li"); if(item.d) li.classList.add("done");
    const cb=document.createElement("input"); cb.type="checkbox"; cb.className="cbx"; cb.checked=!!item.d; cb.setAttribute("aria-label","Done: "+item.t);
    cb.onchange=()=>{ item.d=cb.checked; li.classList.toggle("done",cb.checked); scheduleSave(); if(o.onTick) o.onTick(); };
    const sp=document.createElement("span"); sp.className="txt"; sp.textContent=item.t;
    li.append(cb,sp);
    if(!o.tickOnly){ sp.contentEditable="true"; sp.setAttribute("role","textbox"); sp.setAttribute("aria-label","Edit item");
      sp.oninput=()=>{ item.t=sp.textContent; scheduleSave(); };
      sp.onkeydown=e=>{ if(e.key==="Enter"){ e.preventDefault(); sp.blur(); } };
      const x=document.createElement("button"); x.className="x"; x.textContent="×"; x.setAttribute("aria-label","Remove "+item.t);
      x.onclick=()=>{ const snap=JSON.stringify(state), i=arr.indexOf(item); if(i>-1){ arr.splice(i,1); buildChecks(host,arr,o); scheduleSave(); toast("Item removed",snap); } };
      li.appendChild(x); }
    host.appendChild(li);
  });
  if(!o.tickOnly){ const add=document.createElement("button"); add.className="add"; add.textContent="+ Add item";
    add.onclick=()=>{ arr.push({t:"New item",d:false}); buildChecks(host,arr,o); scheduleSave(); const s=host.querySelectorAll(".txt"), last=s[s.length-1]; if(last){ last.focus(); document.getSelection().selectAllChildren(last); } };
    host.appendChild(add); }
}
/* ---------- free path, shops & packs ---------- */
const SUPPLY_SRC=[
  ["Mithril","Red hero gear (Lv 100+)","Mystic Trials → Trial Shop → Arena Shop, Champagne Fair"],
  ["Forgehammers","Hero gear mastery","Trial Shop, VIP Shop, Adventure Stall"],
  ["Truegold Dust","Buildings past Lv 30, T11","Trial Shop, Adventure Stall"],
  ["Widgets","Hero exclusive gear","Buccaneer Bounty, Mystery Shop, Champagne Fair, Hall of Heroes"],
  ["Charm Designs / Guides","Governor charms","Eternity's Reach, Swordland Shop, Tidal Shop, KvK shop"],
  ["Satin / Gilded Threads","Governor gear","Viking Vengeance, Alliance Championship Shop"],
  ["Artisan's Vision","Governor gear","Swordland Shop, Tidal Shop"],
  ["Master Emblems","Masters","Alliance Championship Shop"],
  ["Hero shards","Hero stars","Intel, Terrors, Conquest, VIP daily, Hero Roulette"],
  ["Pet Food / Taming Marks","Pets","Pet Adventure, events"],
  ["Stamina","Terrors, rallies","VIP Shop, events (very limited)"],
  ["Speedups","Everything","Events, missions — save for event days"],
  ["Bread, Wood, Stone, Iron, Gold","Building, training","Gathering, farm account, events — never buy"]];
const SHOP_LIST=[
  ["Trial Shop",["Truegold Dust","Mithril","Pure Gold Dust (once unlocked)"]],
  ["Arena Shop",["Custom Mythic Hero Gear Chest (weekly)","Nothing else unless tokens are left over"]],
  ["Alliance Shop",["Everything at 70% off you can use","40% off items if tokens are left","Never shields"]],
  ["VIP Shop",["Forgehammers","100 Enhancement XP","Advanced Teleports if needed"]],
  ["Swordland Shop",["Artisan's Vision","100 XP Parts","Satin / Gilded Threads","Charm Designs + Guides"]],
  ["Tidal Shop",["100 XP Parts","Artisan's Vision","Charm Designs + Guides"]],
  ["Alliance Championship",["Master Emblems","Gilded Threads"]]];
function weekKey(){ const d=new Date(); const k=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate())); k.setUTCDate(k.getUTCDate()-((k.getUTCDay()+6)%7)); return k.toISOString().slice(0,10); }
const packMonthly=p=>p.kind==="month"?num(p.aud):p.kind==="week"?num(p.aud)*52/12:0;
const PACK_DAYS={month:30,week:7}, PACK_PER={once:"one-off",month:"per month",week:"per week"};
const packPrice=p=>p.first&&!p.firstDone?num(p.first):num(p.aud); // first-buy price only until you've bought it once
function packDaysLeft(p){ // ticked card: days until it runs out (negative = ended)
  if(!p.d||!PACK_DAYS[p.kind]||!p.bought) return null;
  const end=new Date(p.bought+"T00:00:00"); end.setDate(end.getDate()+PACK_DAYS[p.kind]);
  return Math.round((end-new Date(fcToday()+"T00:00:00"))/864e5);
}
function packAlerts(){ return (state.packs||[]).map(p=>({p,n:packDaysLeft(p)})).filter(x=>x.n!=null&&x.n<=3); }
function packLeftH(n){ return n==null?"":n<0?`<span class="bad">Ended ${-n} day${n===-1?"":"s"} ago</span>`:n===0?`<span class="bad">Ends today</span>`:n<=3?`<span class="warn">Ends in ${n} day${n===1?"":"s"}</span>`:`<span class="ok">${n} days left</span>`; }
function renderShopsPacks(){
  $("#srcTable").innerHTML=`<thead><tr><th>Supply</th><th>Used for</th><th>Best free source</th></tr></thead><tbody>`+SUPPLY_SRC.map(([a,b,c])=>`<tr><td>${esc(a)}</td><td class="muted">${esc(b)}</td><td>${esc(c)}</td></tr>`).join("")+`</tbody>`;
  $("#shopTable").innerHTML=`<thead><tr><th>Shop</th><th>Buy in this order</th></tr></thead><tbody>`+SHOP_LIST.map(([a,L])=>`<tr><td>${esc(a)}</td><td><ol>${L.map(x=>`<li>${esc(x)}</li>`).join("")}</ol></td></tr>`).join("")+`</tbody>`;
  const P=state.packs||[], nextBuy=P.find(p=>!p.d), own=P.filter(p=>p.d), mo=own.reduce((t,p)=>t+packMonthly(p),0), once=own.filter(p=>p.kind==="once").reduce((t,p)=>t+num(p.aud),0);
  const bud=num(state.packBudget), left=bud-mo;
  const nbCost=nextBuy?(nextBuy.kind==="once"?packPrice(nextBuy):nextBuy.kind==="week"?packPrice(nextBuy)*52/12:packPrice(nextBuy)):0;
  $("#packTiles").innerHTML=tileH({label:"Your monthly spend",value:"A$"+mo.toFixed(2),sub:own.some(p=>p.kind!=="once")?"from ticked cards":"no cards ticked"})+
    tileH({id:"pkBudget",label:"Monthly budget",value:bud?(left<0?"−":"")+"A$"+Math.abs(left).toFixed(2):"Set budget",color:bud?(left<0?"var(--red)":"var(--green)"):"",txt:!bud,sub:bud?`${left<0?"over":"left"} of A$${bud.toFixed(2)}`:"tap to set",p:bud?Math.min(100,mo/bud*100):null,cls:bud&&left<0?"bad":""})+
    tileH({label:"One-off buys",value:"A$"+once.toFixed(2),sub:`${own.filter(p=>p.kind==="once").length} of ${P.filter(p=>p.kind==="once").length} permanent unlocks`})+
    (nextBuy?tileH({label:"Next best buy",value:esc(nextBuy.t),txt:true,clamp:true,sub:`A$${packPrice(nextBuy).toFixed(2)}${nextBuy.first&&!nextBuy.firstDone?" first buy":""} · ${PACK_PER[nextBuy.kind]||""}${bud?(nbCost<=left?' · <span class="ok">fits budget ✓</span>':` · <span class="bad">A$${(nbCost-Math.max(0,left)).toFixed(2)} over</span>`):""}`}):tileH({label:"Next best buy",value:"All bought",txt:true}));
  on("pkBudget",openPackBudgetSheet);
  const bought=p=>p.d&&p.kind==="once"; // owned one-off unlocks are hidden in a fold at the bottom
  const rows=P.map((p,i)=>({p,i})), owned=rows.filter(x=>bought(x.p));
  const packRow=({p,i},k)=>{ const n=packDaysLeft(p), rec=!!PACK_DAYS[p.kind];
    return `<div class="pack${bought(p)?" owned":""}"><input type="checkbox" class="cbx" data-i="${i}"${p.d?" checked":""} aria-label="Own ${esc(p.t)}">
      <span><span class="pn">${esc(p.t)}</span>${bought(p)?" "+tagH("ok","Owned ✓"):""}<br><span class="pd">${esc(p.note||"")}</span>
      ${p.d&&rec?`<span class="pl">${p.bought?packLeftH(n):'<span class="faint">set the date you bought it (✎)</span>'}${p.bought&&n<=3?`<button class="renew" data-i="${i}">Renewed today</button>`:""}</span>`:""}</span>
      <span class="pp">${p.viaStars?`${fmt(starsFor(p.aud))} ⭐`:`A$${packPrice(p).toFixed(2)}`}<small>${p.first&&!p.firstDone?"first buy · ":""}${PACK_PER[p.kind]||""}</small></span>
      <button class="shr-edit" data-i="${i}" aria-label="Edit ${esc(p.t)}"><svg aria-hidden="true"><use href="#i-pen"/></svg></button></div>`; };
  // this month's buys live in the plan above (always current); here: your cards, anything else you saved, what you own
  const cards=rows.filter(x=>x.p.d&&PACK_DAYS[x.p.kind]), other=rows.filter(x=>!x.p.d&&!x.p.auto);
  const grp=(t,sub)=>`<div class="shgrp"><span>${t}</span><small>${sub}</small></div>`;
  $("#packList").innerHTML=(cards.length?grp("My cards","renew when they end"+(cards.some(x=>!x.p.bought)?" · set the bought date (✎)":""))+cards.map(packRow).join(""):"")+
    (other.length?grp("Saved for later","not in this month's plan")+other.map(packRow).join(""):"")+
    (owned.length?`<details class="shfold"><summary>${grp(`Already owned (${owned.length})`,"untick if bought by mistake")}</summary>${owned.map(packRow).join("")}</details>`:"")+
    `<p class="pknever">✕ <b>Never buy:</b> resource packs, random chests, big mixed bundles.</p>`;
  $$("#packList input[data-i]").forEach(c=>c.onchange=()=>{ const p=P[+c.dataset.i]; p.d=c.checked;
    if(c.checked&&PACK_DAYS[p.kind]){ p.bought=fcToday(); if(p.first) p.firstDone=true; }
    packStars(p,c.checked?1:-1); afterEdit(); });
  $$("#packList .renew").forEach(b=>b.onclick=()=>{ const p=P[+b.dataset.i], snap=JSON.stringify(state); p.bought=fcToday(); p.firstDone=true; packStars(p,1); afterEdit(); toast(`${p.t} renewed`,snap); });
  bindAll($("#packList"),".shr-edit",b=>openPackSheet(P[+b.dataset.i]));
  on("addPack",()=>{ const p={t:"New pack",aud:0,kind:"once",note:"",d:false}; P.push(p); afterEdit(); openPackSheet(p); });
}
function openPackBudgetSheet(){
  openSheet({title:"Monthly budget",sub:"What you're happy to spend each month on cards and packs.",build(f){
    f.appendChild(fld("Budget (A$ per month)",{type:"num",decimal:true,value:state.packBudget||"",get:()=>state.packBudget||"",set:v=>state.packBudget=v,ph:"e.g. 30"}));
    const inf=infoBox(); f.appendChild(inf);
    const rf=()=>{ const P=state.packs||[], mo=P.filter(p=>p.d&&!num(p.stars)).reduce((t,p)=>t+packMonthly(p),0), b=num(state.packBudget);
      inf.innerHTML=`Ticked cards cost <b>A$${mo.toFixed(2)}</b> a month (weekly cards × 52 ÷ 12; Star packs not counted — their Stars pay for packs).`+(b?` That leaves <b class="${b-mo<0?"bad":"ok"}">A$${(b-mo).toFixed(2)}</b>.`:""); };
    rf(); return rf; }});
}
// Stars move with your ticks: Star packs add, packs paid with Stars spend (unticking undoes it)
function packStars(p,dir){ let ch=0;
  if(num(p.stars)) ch+=num(p.stars); if(num(p.addStars)) ch+=num(p.addStars);
  if(p.viaStars) ch-=starsFor(p.aud);
  if(p.web==="m"&&dir>0) state.webMonth=p.auto; if(p.web==="o") state.webOnceDone=dir>0;
  if(ch) state.stars=Math.max(0,num(state.stars)+ch*dir); }
function openPackSheet(p){
  openSheet({title:p.t||"Pack",sub:"Price, type and when you bought it.",build(f){
    f.appendChild(fld("Name",{value:p.t,set:v=>p.t=v}));
    f.appendChild(frow(fld("Price (A$)",{type:"num",decimal:true,value:p.aud,get:()=>p.aud,set:v=>p.aud=v}),
      fld("Type",{type:"select",value:p.kind||"once",options:[["once","One-off (permanent)"],["month","Monthly card (30 days)"],["week","Weekly card (7 days)"]],set:v=>p.kind=v})));
    if(p.kind!=="once"){
      f.appendChild(frow(fld("First-buy price (A$)",{type:"num",decimal:true,allowEmpty:true,value:p.first==null?"":p.first,get:()=>p.first==null?"":p.first,set:v=>p.first=v===""?null:v,hint:"leave empty if none"}),
        fld("Bought on",{type:"date",value:p.bought||"",set:v=>p.bought=v})));
      f.appendChild(fld("I've used the first-buy price",{type:"check",value:!!p.firstDone,set:v=>p.firstDone=v}));
    }
    f.appendChild(fld("Paid with Stars",{type:"check",value:!!p.viaStars,set:v=>{ if(v) p.viaStars=true; else delete p.viaStars; },hint:"Ticking the pack then takes its Stars off your balance."}));
    f.appendChild(fld("Note",{value:p.note,set:v=>p.note=v}));
    const inf=infoBox(); f.appendChild(inf);
    const rf=()=>{ const n=packDaysLeft(p); inf.innerHTML=p.kind==="once"?(p.d?"Owned ✓ — hidden under “Already owned”.":"Permanent once bought."):!p.d?"Tick it on the list when you buy it — the timer starts from today.":p.bought?`${packLeftH(n)} · costs <b>A$${packMonthly(p).toFixed(2)}</b> a month`:"Set the date you bought it to see days left."; };
    rf(); return rf; },
    onDelete:()=>{ const i=state.packs.indexOf(p); if(i>-1) state.packs.splice(i,1); }});
}

/* ---------- reminders: calendar file (.ics) ---------- */
function icsItems(){ const out=[];
  (state.events||[]).forEach(e=>{ if(!e.date) return; out.push({kind:"event",e,label:`${e.n}${num(e.every)?` · ${repeatTxt(e)}`:""}`}); });
  (state.packs||[]).forEach(p=>{ const n=packDaysLeft(p); if(n==null) return; const end=new Date(p.bought+"T00:00:00"); end.setDate(end.getDate()+PACK_DAYS[p.kind]); out.push({kind:"card",p,end:ymd(end),label:`${p.t} ends ${fd(ymd(end))}`}); });
  return out; }
function icsText(){
  const z=n=>String(n).padStart(2,"0"), dt=s=>s.replace(/-/g,""), stamp=new Date().toISOString().replace(/[-:]/g,"").replace(/\.\d+/,"");
  const esc2=t=>String(t||"").replace(/\\/g,"\\\\").replace(/;/g,"\;").replace(/,/g,"\\,").replace(/\n/g,"\\n");
  const L=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Kingshot Command Console//EN","CALSCALE:GREGORIAN","X-WR-CALNAME:Kingshot"];
  icsItems().forEach((x,i)=>{
    if(x.kind==="event"){ const e=x.e, every=Math.floor(num(e.every)), t=/^\d\d:\d\d$/.test(e.time||"")?e.time:"";
      L.push("BEGIN:VEVENT",`UID:ks-ev-${i}-${dt(e.date)}@kingshot-console`,`DTSTAMP:${stamp}`);
      if(t){ L.push(`DTSTART:${dt(e.date)}T${t.replace(":","")}00`,`DURATION:PT1H`); } else { const n=new Date(e.date+"T00:00:00"); n.setDate(n.getDate()+evLen(e)); L.push(`DTSTART;VALUE=DATE:${dt(e.date)}`,`DTEND;VALUE=DATE:${dt(ymd(n))}`); }
      if(every>0) L.push(`RRULE:FREQ=DAILY;INTERVAL=${every}`);
      L.push(`SUMMARY:${esc2("Kingshot: "+e.n)}`,`DESCRIPTION:${esc2("Spend: "+(spendFor(e)||"—")+(e.note?"\n"+e.note:""))}`,
        "BEGIN:VALARM","ACTION:DISPLAY",`DESCRIPTION:${esc2(e.n)}`,t?"TRIGGER:-PT30M":"TRIGGER:PT9H","END:VALARM","END:VEVENT"); }
    else { const p=x.p; L.push("BEGIN:VEVENT",`UID:ks-card-${i}-${dt(x.end)}@kingshot-console`,`DTSTAMP:${stamp}`,`DTSTART;VALUE=DATE:${dt(x.end)}`,
        `SUMMARY:${esc2("Kingshot: "+p.t+" ends")}`,`DESCRIPTION:${esc2("Renew it, then tap “Renewed today” in the console.")}`,
        "BEGIN:VALARM","ACTION:DISPLAY",`DESCRIPTION:${esc2(p.t+" ends in 3 days")}`,"TRIGGER:-P2DT15H","END:VALARM","END:VEVENT"); } });
  L.push("END:VCALENDAR"); return L.join("\r\n")+"\r\n"; }
function renderReminders(){
  const I=icsItems(); $("#icsList").innerHTML=I.length?I.map(x=>`<li>${esc(x.label)}</li>`).join(""):`<li>No events or ticked cards yet.</li>`;
  let hint=lsGet("kingshot-ntfy-hint"); // kept on this device only — never synced, the repo is public
  if(!hint){ hint="kingshot-"+Math.random().toString(36).slice(2,10)+Math.random().toString(36).slice(2,8); lsSet("kingshot-ntfy-hint",hint); }
  $("#ntfyTopic").textContent=hint;
  on("icsBtn",()=>{ const blob=new Blob([icsText()],{type:"text/calendar"}), a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="kingshot-reminders.ics"; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },500); toast("Calendar file downloaded"); });
}
function renderPlan(){
  const ae=document.activeElement, editing=ae&&ae.isContentEditable&&ae.closest("#routineEdit,#weekEdit,#trackNow,#trackFarm");
  if(!editing){ buildChecks($("#routineEdit"),state.today.routine,{onTick:()=>{}}); buildChecks($("#weekEdit"),state.weekly.items,{onTick:()=>{}}); buildChecks($("#trackNow"),state.trackNow); buildChecks($("#trackFarm"),state.trackFarm); }
  renderShopsPacks(); renderReminders(); renderShopGuide(); renderBestValue();
}
function renderData(){
  $("#idstrip").innerHTML=idFields.map(([k,l])=>tileH({label:l,value:esc(k==="day"?kingdomDay():k==="power"&&num(state.account.power)>0?fmtBig(num(state.account.power)):(state.account[k]||"—")),txt:true})).join("");
  $$("#idstrip .tile").forEach(t=>t.onclick=openAccountSheet);
}
function openAccountSheet(){ const a=state.account; openSheet({title:"Account",sub:"Your governor details.",build(f){
  f.appendChild(frow(fld("Town Center",{value:a.tc,set:v=>a.tc=v}),fld("VIP",{value:a.vip,set:v=>a.vip=v})));
  f.appendChild(fld("Kingdom day",{type:"num",value:kingdomDay(),get:()=>kingdomDay(),set:v=>{ if(v>0){ const d=new Date(); d.setUTCDate(d.getUTCDate()-(v-1)); a.dayAnchor=d.toISOString().slice(0,10); a.day=String(v); } },hint:"Counts up by itself each day (UTC)."}));
  f.appendChild(fld("Total power",{type:"num",value:a.power,get:()=>a.power,set:v=>a.power=String(v)}));
  f.appendChild(frow(fld("Spender",{value:a.spender,set:v=>a.spender=v}),fld("Goal",{value:a.goal,set:v=>a.goal=v}))); }}); }

/* ---------- sync UI ---------- */
function syncStatus(msg,cls){
  const el=$("#syncStatus"); if(el){ el.textContent=msg; el.style.color=cls==="ok"?"var(--green)":cls==="err"?"var(--red)":cls==="warn"?"var(--amber)":""; }
  const m=$("#syncMini"); if(m) m.textContent=msg;
  if(cls==="err") toast(msg);
}
function buildSync(){
  on("exportBtn",exportData);
  const fi=$("#importFile"); on("importBtn",()=>fi.click()); fi.onchange=()=>{ if(fi.files[0]) importData(fi.files[0]); fi.value=""; };
  const o=$("#scOwner"), rp=$("#scRepo"), br=$("#scBranch"), pa=$("#scPath"), tk=$("#scTok"), onB=$("#scOn");
  o.value=syncCfg.owner; rp.value=syncCfg.repo; br.value=syncCfg.branch||"main"; pa.value=syncCfg.path; onB.checked=!!syncCfg.on;
  if(loadTok()) tk.placeholder="•••••• (saved on this device)";
  on("scSave",()=>{ syncCfg={owner:o.value.trim(),repo:rp.value.trim(),branch:(br.value.trim()||"main"),path:(pa.value.trim()||"kingshot/console-data.json"),on:onB.checked}; saveCfg(syncCfg);
    if(tk.value.trim()){ saveTok(tk.value.trim()); tk.value=""; tk.placeholder="•••••• (saved on this device)"; }
    syncStatus(loadTok()?"Connected — try Pull or Push":"Saved — add a token to connect",loadTok()?"ok":"warn"); paintSyncButtons(); });
  onB.onchange=()=>{ syncCfg.on=onB.checked; saveCfg(syncCfg); };
  on("scPull",()=>syncPull(false)); on("scPush",()=>syncPush(false));
  on("scForget",()=>{ saveTok(""); tk.value=""; tk.placeholder="github_pat_…"; syncStatus("Token removed from this device","warn"); paintSyncButtons(); });
  on("sidePull",()=>syncPull(false)); on("sidePush",()=>syncPush(false));
  on("mSync",()=>{ openSheet({title:"Sync with GitHub",sub:syncCfg.owner+"/"+syncCfg.repo,build(f){
    const r=document.createElement("div"); r.className="frow";
    const a=document.createElement("button"); a.className="btn"; a.textContent="⭳ Pull (get latest)"; a.onclick=()=>{ closeSheet(); syncPull(false); };
    const b=document.createElement("button"); b.className="btn primary"; b.textContent="⭱ Push (save to GitHub)"; b.onclick=()=>{ closeSheet(); syncPush(false); };
    r.append(a,b); f.appendChild(r); const i=infoBox(); i.textContent=$("#syncStatus").textContent; f.appendChild(i); }}); });
  if(!syncCfg.owner||!loadTok()) syncStatus("Not connected — file backup works without this","");
  paintSyncButtons();
}
function paintSyncButtons(){ const c=!!(syncCfg.owner&&syncCfg.repo&&loadTok()); $("#sideSync").hidden=!c; $("#mSync").hidden=!c; }

/* ---------- install as app (PWA) ---------- */
let deferredInstall=null;
function initInstall(){
  const btns=[$("#installBtn"),$("#installBtn2")];
  const standalone=matchMedia("(display-mode: standalone)").matches||navigator.standalone;
  window.addEventListener("beforeinstallprompt",e=>{ e.preventDefault(); deferredInstall=e; btns.forEach(b=>b&&b.classList.add("show")); });
  btns.forEach(b=>b&&(b.onclick=async()=>{ if(!deferredInstall) return; deferredInstall.prompt(); await deferredInstall.userChoice.catch(()=>{}); deferredInstall=null; btns.forEach(x=>x&&x.classList.remove("show")); }));
  window.addEventListener("appinstalled",()=>{ btns.forEach(b=>b&&b.classList.remove("show")); toast("Installed ✓"); });
  const hint=$("#installHint");
  if(hint) hint.textContent=standalone?"Running as an installed app ✓":/iphone|ipad|ipod/i.test(navigator.userAgent)?"On iPhone/iPad: tap Share, then “Add to Home Screen”.":"On Android/Chrome: use “Install app” (or the browser menu → Install).";
  if("serviceWorker" in navigator && /^https:|^http:\/\/localhost/.test(location.href)) navigator.serviceWorker.register("sw.js").catch(()=>{});
}

