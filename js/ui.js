"use strict";
/* =====================================================================
   UI LAYER — view cards, edit sheet, pages
   ===================================================================== */
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const pc=(have,need)=>need>0?Math.max(0,Math.min(100,have/need*100)):100;
const barH=(p,cls="")=>`<div class="bar ${cls}"><i style="width:${Math.max(0,Math.min(100,p)).toFixed(1)}%"></i></div>`;
const tagH=(cls,txt)=>`<span class="tag ${cls}">${txt}</span>`;
const shortTag=(need,have)=>need<=0?tagH("plain","nothing needed"):have>=need?tagH("ok","covered ✓"):tagH("bad",fmt(need-have)+" short");
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
  t.classList.add("show"); clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.classList.remove("show"),undoSnap?6000:2600);
}
function showUndo(msg,snap){ toast(msg,snap); }

/* ---------- edit sheet (bottom sheet on phones, side panel on computers) ---------- */
let sheetRefresh=null, sheetLastFocus=null;
function openSheet({title,sub,build,onDelete,delLabel}){
  $("#shTitle").textContent=title; const s=$("#shSub"); s.textContent=sub||""; s.hidden=!sub;
  const body=$("#shBody"); body.innerHTML=""; body.scrollTop=0;
  const form=document.createElement("div"); form.className="form"; body.appendChild(form);
  sheetRefresh=build(form)||null;
  const del=$("#shDel"); del.hidden=!onDelete; del.textContent=delLabel||"Remove";
  del.onclick=onDelete?()=>{ const snap=JSON.stringify(state); onDelete(); closeSheet(); scheduleSave(); renderAll(); toast(`${title} removed`,snap); }:null;
  const w=$("#sheetWrap"); sheetLastFocus=document.activeElement;
  w.classList.add("open"); w.setAttribute("aria-hidden","false"); document.body.style.overflow="hidden";
  setTimeout(()=>{ const first=form.querySelector("input:not([type=checkbox]),select,textarea");
    if(first && matchMedia("(min-width:900px)").matches) first.focus({preventScroll:true}); else $("#sheetWrap .sh-head .iconbtn").focus({preventScroll:true}); },80);
}
function closeSheet(){
  const w=$("#sheetWrap"); if(!w.classList.contains("open")) return;
  if(document.activeElement && w.contains(document.activeElement)) document.activeElement.blur();
  w.classList.remove("open"); w.setAttribute("aria-hidden","true"); document.body.style.overflow="";
  sheetRefresh=null; if(sheetLastFocus&&sheetLastFocus.isConnected) sheetLastFocus.focus({preventScroll:true});
}
function initSheet(){
  $$("#sheetWrap [data-close]").forEach(b=>b.addEventListener("click",closeSheet));
  document.addEventListener("keydown",e=>{
    const open=$("#sheetWrap").classList.contains("open"); if(!open) return;
    if(e.key==="Escape"){ e.preventDefault(); closeSheet(); }
    if(e.key==="Tab"){ // keep focus inside the sheet
      const f=[...$("#sheetWrap .sheet").querySelectorAll("button:not([hidden]),input,select,textarea")].filter(x=>x.offsetParent!==null);
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
  else { document.documentElement.removeAttribute("data-theme"); lsSet(THEME_KEY,"auto"); }
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
const TABS=["Home","Heroes","Gear","Base","Shop","Data"];
const SUBS={Heroes:["Overview","Roster","Shards","Masters","Mystic Trials"],Gear:["Widgets","Hero Gear","Governor","Charms","Pets"],Base:["T11","Troops","Buildings","Resources"],Shop:["Free shops","Paid"],Data:["Update all","Account","Sync","Reminders"]};
const TAB_ALIAS={Army:"Base",Build:"Base",Power:"Heroes",Supply:"Heroes",Rally:"Heroes",Plan:"Shop",Events:"Home",Vault:"Data"};
const TAB_ICON={
  Home:'<path d="M4 21V10l3-2V4h3v2l2-1.5L14 6V4h3v4l3 2v11h-6v-5h-4v5z"/>',
  Heroes:'<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/>',
  Gear:'<path d="M12 2.5l8 3v6c0 5-3.5 8.8-8 10.5C7.5 20.3 4 16.5 4 11.5v-6z"/><path d="M12 7v10M8 11h8"/>',
  Base:'<path d="M4 21V9l4-3 4 3 4-3 4 3v12z"/><path d="M10 21v-5h4v5M4 13h16"/>',
  Shop:'<path d="M5 8h14l-1.2 12.5H6.2z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
  Data:'<path d="M5 4h10l4 4v12H5z"/><path d="M15 4v4h4M8 12h8M8 16h6"/>'
};
const LABEL={Data:"Settings","Free shops":"Coin shops",Paid:"Packs","Update all":"Update"}, lbl=s=>LABEL[s]||s; // shown names; keys, hashes and saved state keep the old ones
const slug=s=>String(s).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
function setTab(tab,sub,scroll){
  tab=TAB_ALIAS[tab]||tab; if(!TABS.includes(tab)) tab="Home";
  if(!state.ui.sub) state.ui.sub={};
  if(SUBS[tab]){ if(sub&&SUBS[tab].includes(sub)) state.ui.sub[tab]=sub; if(!SUBS[tab].includes(state.ui.sub[tab])) state.ui.sub[tab]=SUBS[tab][0]; }
  const s=SUBS[tab]?state.ui.sub[tab]:null;
  const changed=state.ui.tab!==tab;
  state.ui.tab=tab;
  $$("#tabnav .tab").forEach(b=>{ const onn=b.dataset.tab===tab; b.setAttribute("aria-selected",onn?"true":"false"); b.tabIndex=onn?0:-1; });
  $$(".page").forEach(p=>p.hidden=p.dataset.tab!==tab);
  if(dirtyTabs.has(tab)){ dirtyTabs.delete(tab); renderPrep(); TAB_RENDER[tab](); }
  const page=$(`.page[data-tab="${tab}"]`);
  if(s){ page.querySelectorAll(".sec[data-sub]").forEach(x=>x.hidden=x.dataset.sub!==s);
    page.querySelectorAll(".subnav .chip").forEach(c=>c.setAttribute("aria-selected",c.dataset.sub===s?"true":"false")); }
  const hash="#"+slug(tab)+(s?"/"+slug(s):"");
  if(location.hash!==hash) try{ history.replaceState(null,"",hash); }catch(e){}
  if(scroll!==false) window.scrollTo({top:0,behavior:"instant"in window?"instant":"auto"});
  if(changed) scheduleSave();
}
function tabFromHash(){
  let [t,s]=(location.hash||"").replace(/^#/,"").split("/");
  let tab=TABS.find(x=>slug(x)===t)||TAB_ALIAS[Object.keys(TAB_ALIAS).find(k=>slug(k)===t)]; if(!tab) return null;
  if(s==="heroes") s="roster"; // old link names
  if(s==="shop-guide") s="free-shops"; if(s==="best-value"||s==="shops-packs") s="paid";
  let sub=SUBS[tab]&&SUBS[tab].find(x=>slug(x)===s);
  if(s&&!sub){ const o=Object.keys(SUBS).find(k=>SUBS[k].some(x=>slug(x)===s)); if(o){ tab=o; sub=SUBS[o].find(x=>slug(x)===s); } } // section moved to another tab
  return [tab,sub];
}
function buildNav(){
  const nav=$("#tabnav");
  nav.innerHTML=TABS.map(t=>`<button class="tab" role="tab" data-tab="${t}" aria-selected="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${TAB_ICON[t]}</svg><span>${lbl(t)}</span></button>`).join("");
  nav.querySelectorAll(".tab").forEach(b=>b.onclick=()=>setTab(b.dataset.tab));
  nav.addEventListener("keydown",e=>{
    const k=e.key; if(!["ArrowRight","ArrowLeft","ArrowUp","ArrowDown"].includes(k)) return;
    const d=(k==="ArrowRight"||k==="ArrowDown")?1:-1, i=TABS.indexOf(state.ui.tab), n=TABS[(i+d+TABS.length)%TABS.length];
    setTab(n); nav.querySelector(`[data-tab="${n}"]`).focus(); e.preventDefault();
  });
  Object.keys(SUBS).forEach(tab=>{
    const sn=$(`.page[data-tab="${tab}"] .subnav`); if(!sn) return;
    sn.innerHTML=SUBS[tab].map(s=>`<button class="chip" role="tab" data-sub="${esc(s)}" aria-selected="false">${esc(lbl(s))}</button>`).join("");
    sn.querySelectorAll(".chip").forEach(c=>c.onclick=()=>{ setTab(tab,c.dataset.sub,false); c.scrollIntoView({block:"nearest",inline:"center",behavior:"smooth"}); });
  });
  document.addEventListener("click",e=>{ const g=e.target.closest&&e.target.closest("[data-goto]"); if(!g) return; goToSection(null,g.dataset.goto); });
  window.addEventListener("hashchange",()=>{ const r=tabFromHash(); if(r) setTab(r[0],r[1]); });
}
// jump to a section by its key (used by Do next and tiles)
function goToSection(tab,key,thenOpen){
  const sec=[...$$(".sec")].find(x=>x.dataset.key===key || x.dataset.sub===key);
  if(sec){ const page=sec.closest(".page"); setTab(page.dataset.tab, sec.dataset.sub); }
  else if(tab) setTab(tab);
  if(thenOpen) setTimeout(thenOpen,60);
}

