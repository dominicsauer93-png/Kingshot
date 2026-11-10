"use strict";
/* =====================================================================
   UI LAYER — view cards, edit sheet, pages
   ===================================================================== */
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const pc=(have,need)=>need>0?Math.max(0,Math.min(100,have/need*100)):100;
const barH=(p,cls="")=>`<div class="bar ${cls}"><i style="width:${Math.max(0,Math.min(100,p)).toFixed(1)}%"></i></div>`;
const tagH=(cls,txt)=>`<span class="tag ${cls}">${txt}</span>`;
const shortTag=(need,have)=>need<=0?tagH("plain","nothing needed"):have>=need?tagH("ok","covered ✓"):tagH("warn",fmt(need-have)+" short");
const slotName=s=>String(s||"").replace(/ \(.*/,"");
const slotStat=s=>{ const m=String(s||"").match(/\(([^)]+)\)/); return m?m[1]:""; };
const EDIT_ICON=`<svg class="vc-edit" aria-hidden="true"><use href="#i-pen"/></svg>`;
function on(id,fn){ const el=document.getElementById(id); if(el) el.onclick=fn; }
function bindAll(host,sel,fn){ host.querySelectorAll(sel).forEach(el=>el.onclick=()=>fn(el)); }

/* ---------- render scheduling ---------- */
let renderQueued=false;
function queueRender(){ if(renderQueued) return; renderQueued=true; requestAnimationFrame(()=>{ renderQueued=false; renderActive(); }); }
function afterEdit(){ scheduleSave(); queueRender(); if(sheetRefresh) sheetRefresh(); }

/* ---------- toast + undo ---------- */
let toastTimer=null;
function toast(msg,undoSnap){
  if(undoSnap) try{ logDone(msg); }catch(e){} // an undoable action = something you did; it feeds the weekly report
  const t=$("#toast"); $("#toastMsg").textContent=msg;
  const u=$("#toastUndo"); u.textContent=undoSnap?"Undo":"";
  u.onclick=undoSnap?()=>{ state=JSON.parse(undoSnap); renderAll(); scheduleSave(); t.classList.remove("show"); }:null;
  t.classList.add("show"); clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.classList.remove("show"),undoSnap?10000:3200);
}
function showUndo(msg,snap){ toast(msg,snap); }
function confirmSheet({title,msg,ok,danger,onOk}){
  openSheet({title,sub:"",noFoot:true,build(f){ f.innerHTML=`<p class="cmsg">${msg}</p><div class="rowb cbtns"><button class="btn" id="cfNo">Cancel</button><button class="btn ${danger?"danger solid":"primary"}" id="cfYes">${esc(ok||"OK")}</button></div>`;
    f.querySelector("#cfNo").onclick=()=>closeSheet(); f.querySelector("#cfYes").onclick=()=>{ closeSheet(); onOk(); }; }}); }

/* ---------- edit sheet (bottom sheet on phones, side panel on computers) ---------- */
let sheetRefresh=null, sheetLastFocus=null;
const setBehind=on=>[".app","#quickBtn","#toast"].forEach(q=>{ const e=$(q); if(e) e.inert=on; }); // block the page behind a sheet or search
function openSheet({title,sub,build,onDelete,delLabel,noFoot}){
  $("#shTitle").textContent=title; const s=$("#shSub"); s.textContent=sub||""; s.hidden=!sub;
  const body=$("#shBody"); body.innerHTML=""; body.scrollTop=0;
  const form=document.createElement("div"); form.className="form"; body.appendChild(form);
  sheetRefresh=build(form)||null;
  if(!noFoot&&!onDelete&&!form.querySelector("input,select,textarea")) noFoot=true; // info-only sheets need no Done bar
  $("#sheetWrap .sh-foot").hidden=!!noFoot&&!onDelete;
  const del=$("#shDel"); del.hidden=!onDelete; del.textContent=delLabel||"Remove";
  del.onclick=onDelete?()=>{ const snap=JSON.stringify(state); onDelete(); closeSheet(); scheduleSave(); renderAll(); toast(`${title} removed`,snap); }:null;
  const w=$("#sheetWrap"); const wasOpen=w.classList.contains("open"); if(!wasOpen) sheetLastFocus=document.activeElement;
  if(!wasOpen) pushOverlay(); setBehind(true);
  w.classList.add("open"); w.setAttribute("aria-hidden","false"); document.body.style.overflow="hidden";
  setTimeout(()=>{ const first=form.querySelector("input:not([type=checkbox]),select,textarea");
    if(first && matchMedia("(min-width:900px)").matches) first.focus({preventScroll:true}); else $("#sheetWrap .sh-head .iconbtn").focus({preventScroll:true}); },80);
}
function closeSheet(fromHistory){
  const w=$("#sheetWrap"); if(!w.classList.contains("open")) return;
  if(!fromHistory) popOverlay(); setBehind(false);
  if(document.activeElement && w.contains(document.activeElement)) document.activeElement.blur();
  w.classList.remove("open"); w.setAttribute("aria-hidden","true"); document.body.style.overflow="";
  sheetRefresh=null; if(sheetLastFocus&&sheetLastFocus.isConnected) sheetLastFocus.focus({preventScroll:true});
}
function initSheet(){
  $("#shBody").addEventListener("focusin",e=>{ if(e.target.matches("input,select,textarea")&&matchMedia("(max-width:899px)").matches) setTimeout(()=>e.target.scrollIntoView({block:"center",behavior:"smooth"}),250); });
  $$("#sheetWrap [data-close]").forEach(b=>b.addEventListener("click",()=>closeSheet()));
  document.addEventListener("keydown",e=>{
    const open=$("#sheetWrap").classList.contains("open"); if(!open) return;
    if(e.key==="Escape"){ e.preventDefault(); closeSheet(); }
    if(e.key==="Tab"){ // keep focus inside the sheet
      const f=[...$("#sheetWrap .sheet").querySelectorAll("button:not([hidden]),input,select,textarea,a[href],summary,[tabindex]:not([tabindex=\"-1\"])")].filter(x=>x.offsetParent!==null);
      if(!f.length) return; const a=f[0], z=f[f.length-1];
      if(e.shiftKey&&document.activeElement===a){ z.focus(); e.preventDefault(); } else if(!e.shiftKey&&document.activeElement===z){ a.focus(); e.preventDefault(); }
    }
  });
  // swipe the sheet down to close (phones)
  const sh=$("#sheetWrap .sheet"); let y0=null, dy=0;
  sh.addEventListener("touchstart",e=>{ const t=e.target; if(!t.closest(".sh-head,.grab")) return; y0=e.touches[0].clientY; dy=0; sh.style.transition="none"; },{passive:true});
  sh.addEventListener("touchmove",e=>{ if(y0==null) return; dy=Math.max(0,e.touches[0].clientY-y0); sh.style.transform=`translateY(${dy}px)`; },{passive:true});
  sh.addEventListener("touchend",()=>{ if(y0==null) return; sh.style.transition=""; sh.style.transform=""; if(dy>90) closeSheet(); y0=null; });
}

/* ---------- form fields for the sheet ---------- */
function fld(label,o){
  o=o||{};
  if(o.type==="check"){
    const w=document.createElement("label"); w.className="fcheck";
    w.innerHTML=`<input type="checkbox" class="cbx"><span>${esc(label)}</span>`;
    const i=w.querySelector("input"); i.checked=!!o.value; i.onchange=()=>{ o.set(i.checked); afterEdit(); };
    return w;
  }
  const w=document.createElement("label"); w.className="f"; w.innerHTML=`<span>${esc(label)}</span>`;
  let i;
  if(o.type==="select"){
    i=document.createElement("select");
    i.innerHTML=o.options.map(([v,t])=>`<option value="${esc(v)}">${esc(t)}</option>`).join("");
    i.value=String(o.value); i.onchange=()=>{ o.set(i.value); afterEdit(); };
  } else if(o.type==="area"){
    i=document.createElement("textarea"); i.value=o.value||""; i.rows=o.rows||4;
    i.oninput=()=>{ o.set(i.value); afterEdit(); };
  } else {
    i=document.createElement("input"); i.autocomplete="off";
    if(o.type==="date"||o.type==="time"){ i.type=o.type; i.value=o.value||""; i.onchange=()=>{ o.set(i.value); afterEdit(); }; }
    else if(o.type==="num"){
      i.className="num"; i.inputMode=o.decimal?"decimal":"numeric";
      const show=v=>(v===""||v==null)?"":(o.decimal?String(v):fmt(num(v)));
      i.value=show(o.value); if(o.ph) i.placeholder=o.ph;
      i.oninput=()=>{ const raw=i.value.trim(); let v=raw===""&&o.allowEmpty?"":num(raw);
        if(v!==""&&o.min!=null) v=Math.max(o.min,v); if(v!==""&&o.max!=null) v=Math.min(o.max,v); o.set(v); afterEdit(); };
      i.onfocus=()=>{ i.value=i.value.replace(/,/g,""); setTimeout(()=>i.select(),0); };
      i.onblur=()=>{ if(o.get) i.value=show(o.get()); };
    } else {
      i.value=o.value||""; if(o.ph) i.placeholder=o.ph; if(o.list) i.setAttribute("list",o.list);
      i.oninput=()=>{ o.set(i.value); afterEdit(); };
    }
  }
  w.appendChild(i);
  if(o.hint){ const e=document.createElement("em"); e.innerHTML=o.hint; w.appendChild(e); }
  return w;
}
function frow(...els){ const d=document.createElement("div"); d.className="frow"+(els.length===3?" r3":""); els.forEach(e=>d.appendChild(e)); return d; }
function infoBox(){ const d=document.createElement("div"); d.className="info"; return d; }

/* =====================================================================
   THEME
   ===================================================================== */
const THEME_KEY="kingshot-theme";
const getTheme=()=>{ const t=lsGet(THEME_KEY); return t==="light"||t==="auto"?t:"dark"; }; // dark is the default
function applyTheme(t){
  if(t==="light"||t==="dark"){ document.documentElement.setAttribute("data-theme",t); lsSet(THEME_KEY,t); }
  else { let d=true; try{ d=matchMedia("(prefers-color-scheme: dark)").matches; }catch(e){} document.documentElement.setAttribute("data-theme",d?"dark":"light"); lsSet(THEME_KEY,"auto"); }
  const icon=t==="light"?"#i-sun":t==="dark"?"#i-moon":"#i-auto";
  $$(".themebtn use").forEach(u=>u.setAttribute("href",icon));
  $$(".themebtn").forEach(b=>b.setAttribute("aria-label",`Theme: ${t} — tap to change`));
  $$("#themeSeg button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.v===t?"true":"false"));
  requestAnimationFrame(()=>{ const bg=getComputedStyle(document.documentElement).getPropertyValue("--bg").trim(); const m=document.querySelector('meta[name="theme-color"]'); if(m&&bg) m.content=bg; paintMysticChart(); });
}
function initTheme(){
  $$(".themebtn").forEach(b=>b.onclick=()=>{ const order=["auto","light","dark"], n=order[(order.indexOf(getTheme())+1)%3]; applyTheme(n); toast("Theme: "+n[0].toUpperCase()+n.slice(1)); });
  $$("#themeSeg button").forEach(b=>b.onclick=()=>applyTheme(b.dataset.v));
  try{ matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>{ if(getTheme()==="auto") applyTheme("auto"); }); }catch(e){}
  applyTheme(getTheme());
}

/* =====================================================================
   NAVIGATION — 5 tabs, sub-tabs, deep links
   ===================================================================== */
const TABS=["Home","Upgrade","Heroes","Governor","Town","Shop","Progress","Data"], NAV=TABS; // phones show 5 + More (CSS hides Shop, Progress, Settings there)
const MORE_TABS=["Shop","Progress","Data"];
const SUBS={Heroes:["Formations","Shards","Hero Gear","Widgets"],Governor:["Gov Gear","Charms","Pets","Masters"],Town:["Research","Buildings","Troops","Resources"],Shop:["Free shops","Paid"],Progress:["Overview","Mystic Trials"],Data:["Account","Sync","Reminders","Update all"]};
const TAB_ALIAS={Army:"Town",Build:"Town",Base:"Town",Gear:"Governor",Power:"Progress",Supply:"Heroes",Rally:"Heroes",Plan:"Shop",Events:"Home",Vault:"Data",Settings:"Data"};
const SUB_ALIAS={Roster:"Formations",Heroes:"Formations",Governor:"Gov Gear",T11:"Research"}; // old tab names
const TAB_ICON={
  Home:'<path d="M4 21V10l3-2V4h3v2l2-1.5L14 6V4h3v4l3 2v11h-6v-5h-4v5z"/>',
  Upgrade:'<path d="M12 20V5M6 11l6-6 6 6"/><path d="M5 20h14"/>',
  Heroes:'<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/>',
  Governor:'<path d="M12 2.5l8 3v6c0 5-3.5 8.8-8 10.5C7.5 20.3 4 16.5 4 11.5v-6z"/><path d="M12 7v10M8 11h8"/>',
  Town:'<path d="M4 21V9l4-3 4 3 4-3 4 3v12z"/><path d="M10 21v-5h4v5M4 13h16"/>',
  Shop:'<path d="M5 8h14l-1.2 12.5H6.2z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
  Progress:'<path d="M4 20V11M10 20V5M16 20v-6M20 20H3"/>',
  Data:'<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
  More:'<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>'
};
const LABEL={Data:"Settings","Free shops":"Coin shops",Paid:"Packs"}, lbl=s=>LABEL[s]||s; // shown names; saved state keeps the old keys
const slug=s=>String(s).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const scrollMem={}; let navReady=false;
const curKey=()=>{ const t=state.ui.tab; return t+"/"+((SUBS[t]&&state.ui.sub&&state.ui.sub[t])||""); };
// scroll: undefined = top, false = stay, "restore" = back to where you were on that page
function setTab(tab,sub,scroll,fromHistory){
  tab=TAB_ALIAS[tab]||tab; if(!TABS.includes(tab)) tab="Home";
  if(!state.ui.sub) state.ui.sub={};
  sub=SUB_ALIAS[sub]||sub;
  if(sub&&!(SUBS[tab]||[]).includes(sub)){ const o=Object.keys(SUBS).find(k=>SUBS[k].includes(sub)); if(o) tab=o; } // section lives on another page now
  if(navReady&&state.ui.tab) scrollMem[curKey()]=scrollY;
  if(SUBS[tab]){ if(sub&&SUBS[tab].includes(sub)) state.ui.sub[tab]=sub; if(!SUBS[tab].includes(state.ui.sub[tab])) state.ui.sub[tab]=SUBS[tab][0]; }
  const s=SUBS[tab]?state.ui.sub[tab]:null;
  const changed=state.ui.tab!==tab;
  state.ui.tab=tab;
  $$("#tabnav .tab").forEach(b=>{ const onn=b.dataset.tab===tab||(b.dataset.tab==="More"&&MORE_TABS.includes(tab));
    if(onn) b.setAttribute("aria-current","page"); else b.removeAttribute("aria-current"); });
  $$(".page").forEach(p=>p.hidden=p.dataset.tab!==tab);
  if(dirtyTabs.has(tab)){ dirtyTabs.delete(tab); renderPrep(); TAB_RENDER[tab](); }
  const page=$(`.page[data-tab="${tab}"]`);
  if(s){ page.querySelectorAll(".sec[data-sub]").forEach(x=>x.hidden=x.dataset.sub!==s);
    page.querySelectorAll(".subnav .chip").forEach(c=>c.setAttribute("aria-selected",c.dataset.sub===s?"true":"false")); }
  const mt=$("#mTitle"); if(mt) mt.textContent=lbl(tab)+(s?" · "+lbl(s):"");
  document.title=(tab==="Home"?"":lbl(tab)+(s?" · "+lbl(s):"")+" — ")+"Kingshot Console";
  const hash="#"+slug(lbl(tab))+(s?"/"+slug(lbl(s)):"");
  if(skipPop) pendingHash={hash,push:changed&&!fromHistory}; // a sheet is still stepping back in history: write the URL after that
  else if(location.hash!==hash) try{ if(changed&&navReady&&!fromHistory) history.pushState(null,"",hash); else history.replaceState(null,"",hash); }catch(e){}
  if(scroll==="restore") window.scrollTo({top:scrollMem[curKey()]||0,behavior:"instant"});
  else if(scroll!==false) window.scrollTo({top:0,behavior:"instant"});
  if(changed&&navReady){ const h=page.querySelector(".phead h1"); if(h){ h.tabIndex=-1; h.focus({preventScroll:true}); } } // screen readers hear the new page
  if(changed) scheduleSave();
}
function tabFromHash(){
  let [t,s]=(location.hash||"").replace(/^#/,"").split("/");
  const tabSlug=x=>slug(x)===t||slug(lbl(x))===t;
  let tab=TABS.find(tabSlug)||TAB_ALIAS[Object.keys(TAB_ALIAS).find(k=>slug(k)===t)]; if(!tab) return null;
  if(s==="heroes"||s==="roster") s="formations"; if(s==="governor") s="gov-gear"; if(s==="t11") s="research"; // old link names
  if(s==="shop-guide") s="free-shops"; if(s==="best-value"||s==="shops-packs") s="paid";
  const subSlug=x=>slug(x)===s||slug(lbl(x))===s;
  let sub=SUBS[tab]&&SUBS[tab].find(subSlug);
  if(s&&!sub){ const o=Object.keys(SUBS).find(k=>SUBS[k].some(subSlug)); if(o){ tab=o; sub=SUBS[o].find(subSlug); } } // section moved to another tab
  return [tab,sub];
}
/* ---------- history: Back closes a sheet or search before it leaves the page ---------- */
let overlayPushed=false, skipPop=false, pendingHash=null;
function pushOverlay(){ if(overlayPushed) return; overlayPushed=true; try{ history.pushState({ov:1},"",location.hash); }catch(e){ overlayPushed=false; } }
function popOverlay(){ if(!overlayPushed) return; overlayPushed=false; skipPop=true; try{ history.back(); }catch(e){ skipPop=false; } }
function onHistory(){
  if(skipPop){ skipPop=false; if(pendingHash){ const p=pendingHash; pendingHash=null; if(location.hash!==p.hash) try{ p.push?history.pushState(null,"",p.hash):history.replaceState(null,"",p.hash); }catch(e){} } return; }
  if(overlayPushed){ overlayPushed=false; if($("#sheetWrap").classList.contains("open")) closeSheet(true); if(!$("#srch").hidden) closeSearch(true); return; }
  const r=tabFromHash(); if(r) setTab(r[0],r[1],"restore",true);
}
function openMore(){
  openSheet({title:"More",sub:"",noFoot:true,build(f){
    const row=(t,sub)=>`<button class="lrow" data-t="${t}"><svg class="lico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${TAB_ICON[t]}</svg><span class="grow"><b>${lbl(t)}</b><br><span class="faint fs13">${sub}</span></span><span class="chev">›</span></button>`;
    f.innerHTML=`<div class="list">${row("Shop","Coin shops, packs and what to buy")}${row("Progress","This week, power chart, grades, Mystic Trials")}${row("Data","Account, sync, reminders, update all")}</div>
      <div class="f mt"><span>Theme</span><div class="seg" id="moreTheme" role="group" aria-label="Theme">${["auto","light","dark"].map(v=>`<button data-v="${v}" aria-pressed="${getTheme()===v}">${v[0].toUpperCase()+v.slice(1)}</button>`).join("")}</div></div>`;
    f.querySelectorAll("[data-t]").forEach(x=>x.onclick=()=>{ closeSheet(); setTab(x.dataset.t,null,"restore"); });
    f.querySelectorAll("#moreTheme button").forEach(b=>b.onclick=()=>{ applyTheme(b.dataset.v); f.querySelectorAll("#moreTheme button").forEach(x=>x.setAttribute("aria-pressed",x===b?"true":"false")); });
  }});
}
function buildNav(){
  const nav=$("#tabnav");
  const btn=t=>`<button class="tab" data-tab="${t}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${TAB_ICON[t]}</svg><span>${t==="More"?"More":lbl(t)}</span></button>`;
  nav.innerHTML=NAV.map(btn).join("")+btn("More");
  nav.querySelectorAll(".tab").forEach(b=>b.onclick=()=>b.dataset.tab==="More"?openMore():setTab(b.dataset.tab,null,state.ui.tab===b.dataset.tab?undefined:"restore"));
  $$(".setbtn").forEach(b=>b.onclick=()=>setTab("Data",null,"restore"));
  Object.keys(SUBS).forEach(tab=>{
    const page=$(`.page[data-tab="${tab}"]`), sn=page&&page.querySelector(".subnav"); if(!sn) return;
    sn.innerHTML=SUBS[tab].map(s=>`<button class="chip" role="tab" data-sub="${esc(s)}" aria-selected="false">${esc(lbl(s))}</button>`).join("");
    sn.querySelectorAll(".chip").forEach(c=>c.onclick=()=>{ setTab(tab,c.dataset.sub,false);
      const top=sn.getBoundingClientRect().top+scrollY-($(".mtop")?$(".mtop").getBoundingClientRect().height:0)-8; // land at the top of the new section
      if(scrollY>top) window.scrollTo({top,behavior:"instant"});
      c.scrollIntoView({block:"nearest",inline:"center",behavior:"smooth"}); });
    // the chip already names the section: hide a heading that only repeats it
    page.querySelectorAll(".sec[data-sub]").forEach(sec=>{ const h=sec.querySelector(":scope > h2"); if(h&&sec.firstElementChild===h&&h.textContent.trim().toLowerCase()===lbl(sec.dataset.sub).toLowerCase()) h.classList.add("sr-only"); });
  });
  document.addEventListener("click",e=>{ const g=e.target.closest&&e.target.closest("[data-goto]"); if(!g) return; goToSection(null,g.dataset.goto); });
  try{ history.scrollRestoration="manual"; }catch(e){} // we restore each page's own scroll
  window.addEventListener("popstate",onHistory);
  const sk=$("#skipLink"); if(sk) sk.onclick=e=>{ e.preventDefault(); const h=$(".page:not([hidden]) .phead h1")||$("#main"); h.tabIndex=-1; h.focus(); };
}
// jump to a section by its key (used by Do next and tiles)
function goToSection(tab,key,thenOpen){
  const sec=[...$$(".sec")].find(x=>x.dataset.key===key || x.dataset.sub===key);
  if(sec){ const page=sec.closest(".page"); setTab(page.dataset.tab, sec.dataset.sub); }
  else if(tab) setTab(tab);
  if(thenOpen) setTimeout(thenOpen,60);
}

