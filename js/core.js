"use strict";

/* ---------- seed (the whole chat, structured) ---------- */
const SEED = {
  account:{ tc:"", day:"", power:"", vip:"", spender:"", goal:"" },
  dust:{ current:0, target:0, gold:0 },
  nodes:[
    {name:"Truegold Bracers (Health)",   cur:0, max:8,  costs:[40,56,74,102,136,184,248,334]},
    {name:"Truegold Bows (Lethality)",   cur:0, max:8,  costs:[40,56,74,102,136,184,248,334]},
    {name:"Truegold Vests (Defense)",    cur:0, max:12, costs:[54,66,81,97,118,145,178,216,270,324,388,480]},
    {name:"Truegold Legionaries (Rally Capacity)", cur:0, max:12, costs:[83,102,125,150,184,225,276,334,418,502,602,744]},
    {name:"Truegold Arrows (Attack)",    cur:0, max:12, costs:[54,66,81,97,118,145,178,216,270,324,388,480]},
    {name:"Truegold Archers (unlock)", cur:0, max:1, costs:[2236]},
    {name:"Truegold Archer Healing",  cur:0, max:10, costs:[102,137,188,255,341,459,612,836,1100,1500]},
    {name:"Truegold Archer Aid",      cur:0, max:10, costs:[51,68,94,127,170,229,306,418,561,765]},
    {name:"Truegold Archer Training", cur:0, max:10, costs:[102,137,188,255,341,459,612,836,1100,1500]}
  ],
  infNodes:[
    {name:"Truegold Shields (Health)",   cur:0, max:8,  costs:[40,56,74,102,136,184,248,334]},
    {name:"Truegold Blades (Lethality)", cur:0, max:8,  costs:[40,56,74,102,136,184,248,334]},
    {name:"Truegold Plating (Defense)",  cur:0, max:12, costs:[54,66,81,97,118,145,178,216,270,324,388,480]},
    {name:"Truegold Legionaries (Rally Capacity)", cur:0, max:12, costs:[83,102,125,150,184,225,276,334,418,502,602,744]},
    {name:"Truegold Mauls (Attack)",     cur:0, max:12, costs:[54,66,81,97,118,145,178,216,270,324,388,480]},
    {name:"Truegold Infantry (unlock)", cur:0, max:1, costs:[2236]},
    {name:"Truegold Infantry Healing",  cur:0, max:10, costs:[102,137,188,255,341,459,612,836,1100,1500]},
    {name:"Truegold Infantry Aid",      cur:0, max:10, costs:[51,68,94,127,170,229,306,418,561,765]},
    {name:"Truegold Infantry Training", cur:0, max:10, costs:[102,137,188,255,341,459,612,836,1100,1500]}
  ],
  cavNodes:[
    {name:"Truegold Charge (Lethality)",   cur:0, max:8,  costs:[40,56,74,102,136,184,248,334]},
    {name:"Truegold Farriery (Health)",    cur:0, max:8,  costs:[40,56,74,102,136,184,248,334]},
    {name:"Truegold Lances (Attack)",      cur:0, max:12, costs:[54,66,81,97,118,145,178,216,270,324,388,480]},
    {name:"Truegold Legionaries (Rally Capacity)", cur:0, max:12, costs:[83,102,125,150,184,225,276,334,418,502,602,744]},
    {name:"Truegold Platecraft (Defense)", cur:0, max:12, costs:[54,66,81,97,118,145,178,216,270,324,388,480]},
    {name:"Truegold Cavalry (unlock)", cur:0, max:1, costs:[2236]},
    {name:"Truegold Cavalry Healing",  cur:0, max:10, costs:[102,137,188,255,341,459,612,836,1100,1500]},
    {name:"Truegold Cavalry Aid",      cur:0, max:10, costs:[51,68,94,127,170,229,306,418,561,765]},
    {name:"Truegold Cavalry Training", cur:0, max:10, costs:[102,137,188,255,341,459,612,836,1100,1500]}
  ],
  trackNow:[],
  weekly:{ week:"", items:[
    {t:"Bear Hunt — join every rally", d:false},
    {t:"Arena Shop — Custom Mythic Hero Gear Chest", d:false},
    {t:"Alliance Shop — everything at 70% off (never shields)", d:false},
    {t:"VIP Shop — Forgehammers + 100 Enhancement XP", d:false},
    {t:"Trial Shop — Truegold Dust first, then Mithril", d:false},
    {t:"Alliance Championship Shop — Master Emblems", d:false}
  ]},
  packs:[
    {t:"2nd construction queue", aud:4.99, kind:"once", note:"Permanent — doubles building speed", d:false},
    {t:"Ultra Value Monthly Card", aud:14.99, first:7.99, kind:"month", note:"Daily gems + Stamina + 30 days VIP — best value", d:false},
    {t:"Weekly Benefits Card", aud:7.99, kind:"week", note:"Governor gear materials + speedups", d:false},
    {t:"Extra march queue", aud:5.99, kind:"once", note:"Permanent — more gathering and rallies", d:false},
    {t:"Intel Monthly Card", aud:7.99, kind:"month", note:"Steady extras if you log in daily", d:false}
  ],
  trackFarm:[],
  pillars:[
    {name:"Building",      v:0, b:0, g:""},
    {name:"Troop",         v:0, b:0, g:""},
    {name:"Hero",          v:0, b:0, g:""},
    {name:"Hero Gear",     v:0, b:0, g:""},
    {name:"Governor Gear", v:0, b:0, g:""},
    {name:"Governor Charm",v:0, b:0, g:""},
    {name:"Tech",          v:0, b:0, g:""},
    {name:"Pet",           v:0, b:0, g:""},
    {name:"Master",        v:0, b:0, g:""}
  ],
  combat:{ attW:0, attL:0, defW:0, defL:0, leth:0, hp:0 },
  resources:[ // same order as the in-game Items list
    {n:"General speedup (min)",          h:""},
    {n:"Soldier Training speedup (min)", h:""},
    {n:"Construction speedup (min)",     h:""},
    {n:"Research speedup (min)",         h:""},
    {n:"Learning speedup (min)",         h:""},
    {n:"Soldier Healing speedup (min)",  h:""},
    {n:"Bread",  h:""},
    {n:"Wood",   h:""},
    {n:"Stone",  h:""},
    {n:"Iron",   h:""},
    {n:"Gold",   h:""}
  ],
  goldShards:[
    {n:"Saul",     need:900, have:0},
    {n:"Amadeus",  need:940, have:0},
    {n:"Charles",  need:463, have:0},
    {n:"Hilde",    need:740, have:0},
    {n:"Marlin",   need:700, have:0},
    {n:"Zoe",      need:600, have:0},
    {n:"Jaeger",   need:700, have:0},
    {n:"Eric",     need:700, have:0},
    {n:"Rosa",     need:500, have:0},
    {n:"Petra",    need:500, have:0},
    {n:"Margot",   need:700, have:0},
    {n:"Alcar",    need:600, have:0},
    {n:"Thrud",    need:800, have:0},
    {n:"Triton",   need:700, have:0},
    {n:"Sophia",   need:100, have:0},
    {n:"Ava",      need:940, have:0},
    {n:"Long Fei", need:400, have:0},
    {n:"Yang",     need:300, have:0}
  ],
  masters:[
    {n:"Pan",       l:"0", note:"Lethality research — +15% Def at Kindred Soul · Best for Archers · push to 100 (Ways-and-Means / Falconer)"},
    {n:"Valora",    l:"0", note:"Health research — +15% Atk at Kindred Soul · Best for Infantry · rally / Bear Hunt value"},
    {n:"Roman",     l:"0", note:"Attack research — +15% Atk/Def at Kindred Soul · Best for Cavalry"},
    {n:"Wilson",    l:"0", note:"Health research — +10% Atk/Def at Kindred Soul · Best for Infantry"},
    {n:"Cassia",    l:"0", note:"Defense research — +20% Lethality/Health at Kindred Soul · Best for all squads"},
    {n:"Guinevere", l:"0", note:"Defense research — +15% Lethality/Health at Kindred Soul · Best for all squads"},
    {n:"Aena",      l:"0", note:"Lethality research — +15% Atk/Def at Kindred Soul · Best for Cavalry"},
    {n:"Isnor",     l:"0", note:"Attack research — +15% Lethality/Health at Kindred Soul · Best for Archers"}
  ],
  dustSrc:[
    {t:"Redeem Truegold + Gold → Dust in the War Academy", d:false},
    {t:"Truegold Crucible event", d:false},
    {t:"Kingdom of Power (KvK) shop", d:false},
    {t:"Watchtower Intel missions (TC30+)", d:false},
    {t:"Gift codes (check optimizer’s codes page)", d:false},
    {t:"Dust pack — best single-spend value", d:false}
  ],
  openData:[],
  notes:"",
  mysticTrials:[
    {k:"Mystic Trial (overall)", v:"", log:[]},
    {k:"Coliseum (Heroes + Hero Gear)", v:"", log:[]},
    {k:"Forest of Life (Pets)", v:"", log:[]},
    {k:"Crystal Cave (Charms)", v:"", log:[]},
    {k:"Knowledge Nexus (Techs)", v:"", log:[]},
    {k:"Molten Fort (Gov Gear)", v:"", log:[]},
    {k:"Radiant Spire (ALL stats — full power)", v:"", log:[]}
  ],
  tg:{ have:0, need:0, ttgHave:0, ttgNeed:0 },
  govGear:{ targetIdx:0, have:{satin:0,threads:0,vision:0}, pieces:[
    {name:"Cav 1", cur:0},{name:"Cav 2", cur:0},{name:"Inf 1", cur:0},
    {name:"Inf 2", cur:0},{name:"Archer 1", cur:0},{name:"Archer 2", cur:0}
  ]},
  forecast:{ log:[] },
  today:{ routineDate:"", kvkDate:"", bearDate:"", kvkPeriod:14, bearPeriod:2, routine:[
    {t:"Intel Missions → collect Hunting Arrows", d:false},
    {t:"Gathering marches all out", d:false},
    {t:"Overfeed the Truegold Crucible", d:false},
    {t:"Super Refine — daily discounted Tier 2 (TTG)", d:false},
    {t:"Claim house / suppression gold", d:false}
  ]},
  ui:{ tab:"Home", collapsed:{}, density:"comfortable" },
  troopCounts:{ inf:{cur:0,tgt:0}, arc:{cur:0,tgt:0}, cav:{cur:0,tgt:0} },
  bear:{ arrows:0, members:0 },
  heroGear:{
    have:{ xp:0, fh:0, mg:0, mith:0 },
    rows:[
      {type:"Infantry", slot:"Helm (Lethality)",  lvC:0, lvT:0, mC:0, mT:0, xp:0, fh:0, mg:0, mith:0},
      {type:"Infantry", slot:"Gloves (Health)",   lvC:0, lvT:0, mC:0, mT:0, xp:0, fh:0, mg:0, mith:0},
      {type:"Infantry", slot:"Chest (Health)",    lvC:0, lvT:0, mC:0, mT:0, xp:0, fh:0, mg:0, mith:0},
      {type:"Infantry", slot:"Boots (Lethality)", lvC:0, lvT:0, mC:0, mT:0, xp:0, fh:0, mg:0, mith:0},
      {type:"Cavalry",  slot:"Helm (Lethality)",  lvC:0, lvT:0, mC:0, mT:0, xp:0, fh:0, mg:0, mith:0},
      {type:"Cavalry",  slot:"Gloves (Health)",   lvC:0, lvT:0, mC:0, mT:0, xp:0, fh:0, mg:0, mith:0},
      {type:"Cavalry",  slot:"Chest (Health)",    lvC:0, lvT:0, mC:0, mT:0, xp:0, fh:0, mg:0, mith:0},
      {type:"Cavalry",  slot:"Boots (Lethality)", lvC:0, lvT:0, mC:0, mT:0, xp:0, fh:0, mg:0, mith:0},
      {type:"Archer",   slot:"Helm (Lethality)",  lvC:0, lvT:0, mC:0, mT:0, xp:0, fh:0, mg:0, mith:0},
      {type:"Archer",   slot:"Gloves (Health)",   lvC:0, lvT:0, mC:0, mT:0, xp:0, fh:0, mg:0, mith:0},
      {type:"Archer",   slot:"Chest (Health)",    lvC:0, lvT:0, mC:0, mT:0, xp:0, fh:0, mg:0, mith:0},
      {type:"Archer",   slot:"Boots (Lethality)", lvC:0, lvT:0, mC:0, mT:0, xp:0, fh:0, mg:0, mith:0}
    ]
  },
  charms:{ targetLvl:0, have:{guides:0,designs:0}, rows:[
    {type:"Cavalry", lvl:0, tgt:0},{type:"Cavalry", lvl:0, tgt:0},{type:"Cavalry", lvl:0, tgt:0},{type:"Cavalry", lvl:0, tgt:0},{type:"Cavalry", lvl:0, tgt:0},{type:"Cavalry", lvl:0, tgt:0},
    {type:"Infantry", lvl:0, tgt:0},{type:"Infantry", lvl:0, tgt:0},{type:"Infantry", lvl:0, tgt:0},{type:"Infantry", lvl:0, tgt:0},{type:"Infantry", lvl:0, tgt:0},{type:"Infantry", lvl:0, tgt:0},
    {type:"Archer", lvl:0, tgt:0},{type:"Archer", lvl:0, tgt:0},{type:"Archer", lvl:0, tgt:0},{type:"Archer", lvl:0, tgt:0},{type:"Archer", lvl:0, tgt:0},{type:"Archer", lvl:0, tgt:0}
  ]},
  widgets:{ have:0, rows:[] },
  heroInfo:{ "Wee & Woo":{type:"Archer"}, "Sophia":{type:"Cavalry"} },
  history:[],
  farm:[],
  farmChecks:[],
  buildings:[
    {n:"Town Center",    stepIdx:0, note:"METRONOME — raise one tier to uncap the rest", d:false},
    {n:"Range",          stepIdx:0, note:"Archer line — your main combat", d:false},
    {n:"War Academy",    stepIdx:0, note:"Research speed + T11 gate", d:false},
    {n:"Embassy",        stepIdx:0, note:"Rally/garrison capacity — events", d:false},
    {n:"Command Center", stepIdx:0, note:"March capacity — rally contribution", d:false},
    {n:"Barracks",       stepIdx:0, note:"Infantry tanks", d:false},
    {n:"Stable",         stepIdx:0, note:"Cavalry (off-focus) — defer", d:false},
    {n:"Infirmary",      stepIdx:0, note:"Healing sustain — defer, big", d:false}
  ]
};

/* ---------- storage: tiered (window.storage → localStorage → memory) ---------- */
const KEY="kingshot-console-v1";
const CFG_KEY="kingshot-sync-cfg";
const TOK_KEY="kingshot-sync-token";
let mem=null;
const hasStore = typeof window!=="undefined" && window.storage && typeof window.storage.set==="function";
function lsGet(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
function lsSet(k,v){ try{ localStorage.setItem(k,v); return true; }catch(e){ return false; } }
function lsDel(k){ try{ localStorage.removeItem(k); }catch(e){} }

async function load(){
  if(hasStore){ try{ const r=await window.storage.get(KEY,false); if(r&&r.value) return JSON.parse(r.value); }catch(e){} }
  const ls=lsGet(KEY); if(ls){ try{ return JSON.parse(ls); }catch(e){} }
  return mem?JSON.parse(mem):null;
}
async function persistLocal(){
  const payload=JSON.stringify(state);
  let ok=false;
  if(hasStore){ try{ await window.storage.set(KEY,payload,false); ok=true; }catch(e){} }
  if(lsSet(KEY,payload)) ok=true;
  if(!ok) mem=payload;
  return ok;
}

/* ---------- sync config + token (device-local only; token never synced) ---------- */
function loadCfg(){ const s=lsGet(CFG_KEY); if(s){ try{ return JSON.parse(s); }catch(e){} } return {owner:"",repo:"",branch:"main",path:"kingshot/console-data.json",on:false}; }
function saveCfg(c){ lsSet(CFG_KEY,JSON.stringify(c)); }
function loadTok(){ return lsGet(TOK_KEY)||""; }
function saveTok(t){ if(t) lsSet(TOK_KEY,t); else lsDel(TOK_KEY); }
let syncCfg=loadCfg();
let remoteSha=null;

/* ---------- GitHub API ---------- */
function ghUrl(cfg,withRef){
  const p=cfg.path.split("/").map(encodeURIComponent).join("/");
  return `https://api.github.com/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/contents/${p}`+(withRef?`?ref=${encodeURIComponent(cfg.branch)}`:"");
}
async function ghGet(cfg,tok){
  const r=await fetch(ghUrl(cfg,true),{headers:{Authorization:`Bearer ${tok}`,Accept:"application/vnd.github+json"}});
  if(r.status===404) return {sha:null,data:null};
  if(!r.ok) throw new Error("GitHub read failed ("+r.status+")");
  const j=await r.json();
  const json=decodeURIComponent(escape(atob((j.content||"").replace(/\n/g,""))));
  return {sha:j.sha,data:json?JSON.parse(json):null};
}
async function ghPut(cfg,tok,sha,urgent){
  const content=btoa(unescape(encodeURIComponent(JSON.stringify(state,null,2))));
  const body={message:`console update ${new Date().toISOString()}`,content,branch:cfg.branch};
  if(sha) body.sha=sha;
  const payload=JSON.stringify(body), keepalive=!!urgent&&payload.length<60000; // keepalive lets the save finish while the page closes
  let r=await fetch(ghUrl(cfg,false),{method:"PUT",keepalive,headers:{Authorization:`Bearer ${tok}`,Accept:"application/vnd.github+json","Content-Type":"application/json"},body:payload});
  if(r.status===409||r.status===422){ const e=new Error("conflict"); e.conflict=true; throw e; } // another device saved first — caller merges and retries
  if(!r.ok) throw new Error("GitHub write failed ("+r.status+")");
  const j=await r.json(); return j.content.sha;
}
/* ---------- two-device safe sync ----------
   We keep a copy of the data as it was at the last sync (the "base"). When GitHub has changed since then
   (another device saved), we merge: whatever each side changed is kept; only if both changed the same
   value does this device win. Lists of named things (heroes, packs, events…) merge item by item. */
const BASE_KEY="kingshot-sync-base", PEND_KEY="kingshot-sync-pending";
const syncBase=()=>{ try{ return JSON.parse(lsGet(BASE_KEY)||"null"); }catch(e){ return null; } };
const setSyncBase=d=>lsSet(BASE_KEY,JSON.stringify(d));
const setPending=v=>{ if(v) lsSet(PEND_KEY,"1"); else lsDel(PEND_KEY); };
const isPending=()=>!!lsGet(PEND_KEY);
const jeq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const isObj=x=>x&&typeof x==="object"&&!Array.isArray(x);
function itemId(x){ if(!isObj(x)) return null; for(const k of ["n","name","hero","k","slot","t","d"]) if(x[k]!=null&&x[k]!=="") return k+":"+x[k]+(x.type?"|"+x.type:""); return null; }
function merge3(b,l,r){
  if(jeq(l,r)) return l; if(jeq(l,b)) return r; if(jeq(r,b)) return l;
  if(isObj(l)&&isObj(r)){ const o={}, B=isObj(b)?b:{};
    new Set([...Object.keys(l),...Object.keys(r)]).forEach(k=>{ if(k==="ui"){ if(l.ui!==undefined) o.ui=l.ui; return; } const v=merge3(B[k],l[k],r[k]); if(v!==undefined) o[k]=v; });
    return o; }
  if(Array.isArray(l)&&Array.isArray(r)){
    const ids=a=>a.map(itemId), li=ids(l), ri=ids(r), B=Array.isArray(b)?b:[], bi=ids(B);
    const uniq=a=>a.every(x=>x!=null)&&new Set(a).size===a.length;
    if(!uniq(li)||!uniq(ri)) return l; // no stable ids — this device wins
    const bm=new Map(B.map((x,i)=>[bi[i],x])), rm=new Map(r.map((x,i)=>[ri[i],x])), out=[];
    l.forEach((x,i)=>{ const id=li[i];
      if(rm.has(id)) out.push(merge3(bm.get(id),x,rm.get(id)));
      else if(!bm.has(id)||!jeq(bm.get(id),x)) out.push(x); }); // other device deleted it — drop unless we edited it
    r.forEach((x,i)=>{ const id=ri[i]; if(!li.includes(id)&&!bm.has(id)) out.push(x); }); // other device added it
    return out; }
  return l; // both changed the same value — this device wins
}
async function syncPull(silent){
  const tok=loadTok(); if(!syncCfg.owner||!syncCfg.repo||!tok){ if(!silent) syncStatus("Fill in repo + token first","err"); return; }
  syncStatus("Pulling…");
  try{ const {sha,data}=await ghGet(syncCfg,tok); remoteSha=sha;
    if(!data){ syncStatus("No remote file yet — Push to create it","warn"); return; }
    const base=syncBase(), local=JSON.parse(JSON.stringify(state));
    const unsynced=isPending()||syncPending||(base&&!jeq(base,local));
    let merged=false;
    const noUi=o=>{ const c=Object.assign({},o); delete c.ui; return c; };
    if(unsynced){ state=mergeSeed(merge3(base||data,local,data)); merged=!jeq(noUi(state),noUi(mergeSeed(data))); } // no base yet: keep this device's unsynced edits
    else state=mergeSeed(data);
    setSyncBase(data); renderAll(); if(typeof buildLayout==="function") buildLayout(); await persistLocal();
    if(merged){ setPending(true); syncPending=true; await syncPush(true); syncStatus("Merged this device's changes with GitHub ✓","ok"); }
    else { setPending(false); syncStatus("Pulled ✓ "+new Date().toLocaleTimeString(),"ok"); }
  }catch(e){ syncStatus(e.message,"err"); }
}
async function syncPush(silent,urgent){
  const tok=loadTok(); if(!syncCfg.owner||!syncCfg.repo||!tok){ if(!silent) syncStatus("Fill in repo + token first","err"); return; }
  syncPending=false; clearTimeout(syncTimer);
  syncStatus("Pushing…");
  const mergeRemote=async()=>{ const cur=await ghGet(syncCfg,tok); let changed=false;
    if(cur.data&&cur.sha!==remoteSha){ const base=syncBase();
      const m=base?merge3(base,JSON.parse(JSON.stringify(state)),cur.data):JSON.parse(JSON.stringify(state));
      changed=!jeq(m,state); state=mergeSeed(m); setSyncBase(cur.data); }
    remoteSha=cur.sha; return changed; };
  try{
    let changed=false;
    if(!urgent) changed=await mergeRemote(); // closing the page: no time to read first — a conflict is merged next time
    try{ remoteSha=await ghPut(syncCfg,tok,remoteSha,urgent); }
    catch(e){ if(!e.conflict||urgent) throw e; changed=(await mergeRemote())||changed; remoteSha=await ghPut(syncCfg,tok,remoteSha,false); }
    setSyncBase(JSON.parse(JSON.stringify(state))); setPending(false);
    if(changed){ renderAll(); await persistLocal(); }
    syncStatus((changed?"Merged with your other device ✓ ":"Synced ✓ ")+new Date().toLocaleTimeString(),"ok");
  }catch(e){ setPending(true); syncStatus(e.conflict?"Other device saved first — will merge on next sync":e.message,e.conflict?"warn":"err"); }
}
// Auto-push waits until you've stopped editing for a minute (or you leave the page).
// Every push is a commit, and every commit rebuilds the GitHub Pages site — pushing on every edit
// kept cancelling the site build, so page updates never went live while you were editing.
const SYNC_IDLE_MS=60000;
let syncTimer=null, syncPending=false;
function scheduleSyncPush(){ if(!syncCfg.on) return; syncPending=true; setPending(true); clearTimeout(syncTimer); syncTimer=setTimeout(()=>flushSync(),SYNC_IDLE_MS);
  syncStatus("Changes saved on this device — syncing to GitHub after 1 min idle"); }
function flushSync(urgent){ if(!syncPending) return Promise.resolve(); return syncPush(true,urgent); }
document.addEventListener("visibilitychange",()=>{ if(document.visibilityState==="hidden") flushSync(true); });
window.addEventListener("pagehide",()=>flushSync(true));

/* ---------- local save (drives local persistence + optional sync) ---------- */
let saveTimer=null;
function setSaveUI(cls,txt){ ["saveDot","saveDotM"].forEach(id=>{ const d=document.getElementById(id); if(d) d.className="dot"+(cls?" "+cls:""); }); const t=document.getElementById("saveTxt"); if(t) t.textContent=txt; }
function scheduleSave(){
  try{ takeSnapshot(); }catch(e){}
  try{ trackHammers(); }catch(e){}
  setSaveUI("busy","Saving…");
  clearTimeout(saveTimer);
  saveTimer=setTimeout(async()=>{ const ok=await persistLocal(); setSaveUI(ok?"":"err",ok?"Saved":"Session only"); scheduleSyncPush(); },400);
}

/* ---------- export / import ---------- */
function exportData(){
  const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob);
  a.download="kingshot-console-data.json"; a.click(); URL.revokeObjectURL(a.href);
  syncStatus("Exported JSON ✓","ok");
}
function importData(file){
  const rd=new FileReader();
  rd.onload=()=>{ try{ const data=JSON.parse(rd.result); state=mergeSeed(data); renderAll(); scheduleSave(); syncStatus("Imported ✓","ok"); }
    catch(e){ syncStatus("Import failed: bad JSON","err"); } };
  rd.readAsText(file);
}

/* ---------- state ---------- */
// old base-tier nodes superseded by the Truegold tier — drop these even if an old save still carries them
const DEPRECATED_NODE_NAMES=new Set(["Arrows (Attack)","Vests (Defense)","Mauls (Attack)","Plating (Defense)","Lances (Attack)","Platecraft (Defense)","Legionaries (Rally)"]);
function mergeSeed(data){
  const s=Object.assign(structuredClone(SEED),data||{});
  // for name-keyed lists, keep saved entries but add any new SEED entries (e.g. new masters) that the save predates
  const NAME_KEY={masters:"n",resources:"n",goldShards:"n",nodes:"name",infNodes:"name",cavNodes:"name"};
  Object.keys(NAME_KEY).forEach(key=>{
    const seedList=SEED[key], savedList=data&&data[key], nk=NAME_KEY[key];
    if(Array.isArray(seedList)&&Array.isArray(savedList)){
      const have=new Set(savedList.map(x=>x[nk]));
      let merged=savedList.concat(seedList.filter(x=>!have.has(x[nk])).map(x=>structuredClone(x)));
      if(["nodes","infNodes","cavNodes"].includes(key)) merged=merged.filter(x=>!DEPRECATED_NODE_NAMES.has(x[nk]));
      s[key]=merged;
    }
  });
  return s;
}
let state=structuredClone(SEED);
const fmt=n=>Number(n).toLocaleString("en-US");
// accepts shorthand: 1.5k / 1.5 thousand = 1,500 · 1m / 1 mil / 1 million = 1,000,000 · 2b / 2bn / 2 billion = 2,000,000,000
const NUM_UNITS={k:1e3,thousand:1e3,m:1e6,mil:1e6,million:1e6,b:1e9,bn:1e9,billion:1e9};
const num=v=>{ const str=String(v).trim(), m=str.match(/^(-?[\d.,]+)\s*(k|thousand|m|mil|million|b|bn|billion)$/i);
  if(m){ const b=parseFloat(m[1].replace(/,/g,"")); return isNaN(b)?0:Math.round(b*NUM_UNITS[m[2].toLowerCase()]); }
  const n=parseFloat(str.replace(/[^0-9.\-]/g,"")); return isNaN(n)?0:n; };
function fmtInputs(){
  document.querySelectorAll("input").forEach(el=>{
    if(el===document.activeElement || el.type==="date" || el.type==="password" || el.type==="checkbox") return;
    const v=(el.value||"").replace(/,/g,"");
    if(/^\d{4,}$/.test(v)) el.value=Number(v).toLocaleString("en-US");
  });
}
// stop numbers being dragged from one box into another (the browser's text drag-and-drop)
function initNoDrag(){
  const isField=t=>t&&t.matches&&t.matches("input,textarea,select");
  document.addEventListener("dragstart",e=>{ if(isField(e.target)) e.preventDefault(); });
  ["dragover","drop"].forEach(ev=>document.addEventListener(ev,e=>{ if(isField(e.target)){ e.preventDefault(); if(e.dataTransfer) e.dataTransfer.dropEffect="none"; } }));
}
function initCommaFormatting(){
  document.addEventListener("focusin",e=>{ const t=e.target; if(t&&t.tagName==="INPUT"&&/^[\d,]+$/.test(t.value)) t.value=t.value.replace(/,/g,""); });
  document.addEventListener("focusout",e=>{ const t=e.target; if(t&&t.tagName==="INPUT"&&t.type!=="date"&&t.type!=="password"){ const v=(t.value||"").replace(/,/g,""); if(/^\d{4,}$/.test(v)) t.value=Number(v).toLocaleString("en-US"); } });
}

/* ---------- identity strip ---------- */
const idFields=[["tc","Town Center"],["day","Kingdom Day"],["power","Total Power"],["vip","VIP"],["spender","Spender"],["goal","Goal"]];
function kingdomDay(){
  if(!state.account.dayAnchor) return state.account.day||"—";
  const a=new Date(state.account.dayAnchor+"T00:00:00Z");
  const n=new Date(); const utc=Date.UTC(n.getUTCFullYear(),n.getUTCMonth(),n.getUTCDate());
  return Math.floor((utc-a.getTime())/86400000)+1;
}

/* ---------- dust gate ---------- */
const NODE_COSTS={
  arrows:[54,66,81,97,118,145,178,216,270,324,388,480],
  vests:[54,66,81,97,118,145,178,216,270,324,388,480],
  mauls:[54,66,81,97,118,145,178,216,270,324,388,480],
  plating:[54,66,81,97,118,145,178,216,270,324,388,480],
  legionaries:[83,102,125,150,184,225,276,334,418,502,602,744],
  archers:[2236],
  infantry:[2236]
};
function nodeCosts(nd){ if(Array.isArray(nd.costs)&&nd.costs.length) return nd.costs;
  const k=Object.keys(NODE_COSTS).find(x=>nd.name.toLowerCase().includes(x)); return k?NODE_COSTS[k]:[]; }
function nodeRem(nd){ return nodeCosts(nd).slice(Math.max(0,nd.cur||0)).reduce((s,x)=>s+x,0); }
/* ---------- T11 tree order + "after unlock" nodes ---------- */
const isLaterNode=nd=>/healing|aid|training/i.test(nd.name||"");
const isUnlockNode=nd=>/unlock/i.test(nd.name||"");
const coreNodes=list=>(list||[]).filter(nd=>!isLaterNode(nd));
function treeRank(nd,key){ // tier 1 (max 8) → tier 2 (max 12) → unlock → healing/aid/training, then seed order
  const tier=isLaterNode(nd)?3:isUnlockNode(nd)?2:(nd.max||12)<=8?0:1;
  const i=(SEED[key]||[]).findIndex(x=>x.name===nd.name);
  return tier*100+(i<0?99:i);
}
const sortTree=(list,key)=>(list||[]).slice().sort((a,b)=>treeRank(a,key)-treeRank(b,key));
const unlockedCount=()=>[state.nodes,state.infNodes,state.cavNodes].filter(L=>(L||[]).some(nd=>isUnlockNode(nd)&&nd.cur>=(nd.max||1))).length;

// phases in unlock order; the first one with dust left is the "active" one everything else tracks
const PHASES=[{k:"nodes",n:"Archer",g:"gateArc"},{k:"infNodes",n:"Infantry",g:"gateInf"},{k:"cavNodes",n:"Cavalry",g:"gateCav"}];
const phaseRem=ph=>coreNodes(state[ph.k]||[]).reduce((s,n)=>s+nodeRem(n),0);
function activePhase(){ return PHASES.find(ph=>phaseRem(ph)>0)||PHASES[PHASES.length-1]; }
function phaseGold(list){ let g=0; (list||[]).forEach(nd=>{ const k=nodeResKey(nd); if(!k) return; const R=NODE_RES[k], mx=nd.max||12; for(let i=Math.max(0,nd.cur);i<mx;i++) if(R.gold[i]!=null) g+=R.gold[i]; }); return g; }
const goldTarget=()=>phaseGold(coreNodes(state[activePhase().k]||[]));

function computeTarget(){
  const t=phaseRem(activePhase());
  state.dust.target=Math.round(t);
  return state.dust.target;
}
/* per-level resource ladders (gold, bread=wood, stone, iron, days) for the T11 panel */
const _ags={gold:[15000,18000,22000,27000,33000,40000,49000,60000,75000,90000,100000,130000],res:[700000,860000,1000000,1200000,1500000,1800000,2300000,2800000,3500000,4200000,5000000,6200000],stone:[140000,170000,210000,250000,300000,370000,460000,560000,700000,840000,1000000,1200000],iron:[35000,43000,52000,63000,77000,94000,110000,140000,170000,210000,250000,310000],days:[0.79,0.97,1.17,1.42,1.71,2.13,2.58,3.13,3.92,4.71,5.67,7.0]};
const _ulk={gold:[1000000],res:[85000000],stone:[17000000],iron:[4200000],days:[91.33]};
const NODE_RES={
  arrows:_ags, vests:_ags, mauls:_ags, plating:_ags, lances:_ags, platecraft:_ags,
  legionaries:{gold:[23000,28000,34000,41000,51000,62000,76000,93000,110000,130000,160000,200000],res:[1000000,1300000,1600000,1900000,2300000,2900000,3500000,4300000,5400000,6500000,7800000,9600000],stone:[210000,260000,320000,390000,470000,580000,710000,860000,1000000,1300000,1500000,1900000],iron:[54000,66000,81000,97000,110000,140000,170000,210000,270000,320000,390000,480000],days:[1.21,1.5,1.83,2.17,2.67,3.29,4.0,4.88,6.08,7.33,8.79,10.88]},
  archers:_ulk, infantry:_ulk, cavalry:_ulk
};
// unlock ladders (archers/infantry/cavalry) only apply to the "(unlock)" node — "Archer Healing" etc. must not match them
function nodeResKey(nd){ const n=nd.name.toLowerCase(); return Object.keys(NODE_RES).find(x=>n.includes(x) && (NODE_RES[x]!==_ulk || /unlock/.test(n))); }
function nodeResDays(list){ let days=0; (list||[]).forEach(nd=>{ const k=nodeResKey(nd); if(!k) return; const R=NODE_RES[k]; const mx=nd.max||12;
  for(let i=Math.max(0,nd.cur);i<mx;i++){ if(R.days[i]!=null) days+=R.days[i]; } }); return days; }
function fmtBig(n){ n=Math.round(n); if(n>=1e9) return (n/1e9).toFixed(2).replace(/\.?0+$/,"")+"B"; if(n>=1e6) return (n/1e6).toFixed(1).replace(/\.0$/,"")+"M"; if(n>=1e3) return Number(n).toLocaleString("en-US"); return String(n); }

function recurUntil(anchorStr, period){
  if(!anchorStr) return null;
  const day=86400000;
  const a=new Date(anchorStr+"T00:00:00"), t=new Date(fcToday()+"T00:00:00");
  const diff=Math.round((t-a)/day);
  const rem=((diff%period)+period)%period;
  return rem===0 ? 0 : (period-rem);
}
function closestNode(){
  const open=coreNodes(state[activePhase().k]||[]).filter(n=>n.cur<(n.max||12)).map(n=>({n,rem:nodeRem(n)})).filter(x=>x.rem>0);
  if(!open.length) return null;
  open.sort((a,b)=>a.rem-b.rem); return open[0];
}

/* ---------- events calendar ---------- */
function esc(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
const DAY_MS=86400000;
// next occurrence of an event from today (local dates). every=0 → one-off.
function nextOcc(ev){
  if(!ev||!ev.date) return null;
  const a=new Date(ev.date+"T00:00:00"), t=new Date(gameToday()+"T00:00:00");
  if(isNaN(a)) return null;
  let diff=Math.round((a-t)/DAY_MS);
  const every=Math.max(0,Math.floor(num(ev.every)));
  if(every) diff=((diff%every)+every)%every; // the date can be any past or future occurrence
  else if(diff<0) return {days:diff, past:true, date:ev.date};
  return {days:diff, past:false, date:ymd(new Date(t.getTime()+diff*DAY_MS))};
}
function occursOn(ev,dayOffset){
  if(!ev||!ev.date) return false;
  const a=new Date(ev.date+"T00:00:00"), t=new Date(gameToday()+"T00:00:00");
  if(isNaN(a)) return false;
  const diff=Math.round((a-t)/DAY_MS)-dayOffset;
  const every=Math.max(0,Math.floor(num(ev.every)));
  return every ? ((diff%every)+every)%every===0 : diff===0;
}
function whenTxt(o){ return o.past?"passed":o.days===0?"today":o.days===1?"tomorrow":`in ${o.days}d`; }
function repeatTxt(ev){ const n=Math.floor(num(ev.every)); return !n?"one-off":n===1?"every day":n===7?"every week":`every ${n} days`; }

/* ---------- forecast ---------- */
function ymd(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
function fcToday(){ return ymd(new Date()); }
function fd(d){ if(!d) return ""; const x=new Date(String(d).slice(0,10)+"T00:00:00"); if(isNaN(x)) return String(d); // "23 Sep" (adds the year if it's not this year)
  return x.toLocaleDateString(undefined,{day:"numeric",month:"short",...(x.getFullYear()!==new Date().getFullYear()?{year:"numeric"}:{})}); }
function gameToday(){ return new Date().toISOString().slice(0,10); } // event days follow the game clock (UTC), same as Kingdom day
function forecastCalc(){
  const log=(state.forecast&&state.forecast.log)||[];
  if(log.length<2) return null;
  const s=[...log].sort((a,b)=>a.d.localeCompare(b.d));
  let dustGain=0, goldGain=0, days=0;
  for(let i=1;i<s.length;i++){
    const dd=(new Date(s[i].d)-new Date(s[i-1].d))/86400000;
    if(dd<=0) continue; days+=dd;
    const ad=s[i].dust-s[i-1].dust; if(ad>0) dustGain+=ad;
    const ag=s[i].gold-s[i-1].gold; if(ag>0) goldGain+=ag;
  }
  if(days<=0) return null;
  return { dustRate:dustGain/days, goldRate:goldGain/days, days, latest:s[s.length-1] };
}
function addDays(n){ const d=new Date(); d.setDate(d.getDate()+Math.ceil(n)); return ymd(d); }
function paintForecast(){
  const out=document.getElementById("fcOut"); if(!out) return;
  const f=forecastCalc();
  if(!f){ out.innerHTML=`<span class="sub">Log at least two check-ins on different days to see a projection.</span>`; return; }
  const dustTgt=computeTarget(), goldTgt=goldTarget();
  const curDust=num(state.dust.current), curGold=num(state.dust.gold);
  const dNeed=Math.max(0,dustTgt-curDust), gNeed=Math.max(0,goldTgt-curGold);
  const dDays = f.dustRate>0 ? dNeed/f.dustRate : Infinity;
  const gDays = f.goldRate>0 ? gNeed/f.goldRate : Infinity;
  const line=(label,rate,need,dys)=>{
    const rateTxt=rate>0?fmt(Math.round(rate))+"/day":"no gain logged";
    const when = need<=0 ? `<b style="color:var(--green)">already met</b>` : (isFinite(dys)?`~<b>${addDays(dys)}</b> (${Math.ceil(dys)}d)`:`<b style="color:var(--red)">never at current rate</b>`);
    return `<div style="margin-bottom:4px">${label}: ${rateTxt} · ${when}</div>`;
  };
  let html=`<div class="mono" style="font-size:13.5px">`;
  html+=line("Dust",f.dustRate,dNeed,dDays);
  html+=line("Gold",f.goldRate,gNeed,gDays);
  const both=Math.max(isFinite(dDays)?dDays:0, isFinite(gDays)?gDays:0);
  const blocked=(!isFinite(dDays)&&dNeed>0)||(!isFinite(gDays)&&gNeed>0);
  html+=`</div>`;
  html+=`<div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--line)">`;
  if(dNeed<=0&&gNeed<=0) html+=`<b style="color:var(--green)">Both gates met — start the research.</b>`;
  else if(blocked) html+=`<b style="color:var(--amber)">One gate isn't growing — log more, or lift that rate.</b>`;
  else html+=`<b style="color:var(--gold)">T11 ${activePhase().n} unlockable ~${addDays(both)}</b> (whichever gate lands last).`;
  html+=`<br><span class="sub">Then ~${Math.round(nodeResDays(coreNodes(state[activePhase().k]||[])))}d research on top (runs once you start it). Based on ${f.days.toFixed(0)}d of history.</span></div>`;
  out.innerHTML=html;
}

/* ---------- hero gear cost tables (kingshotoptimizer.com) ---------- */
// XP: exact at every listed level; the site's own table only samples every 5th level past 10,
// so between two knots we linearly interpolate (flagged ~ in the UI) — not a guess, a defined,
// reproducible calc using the site's own checkpoints.
const HG_XP_KNOTS=[[0,0],[1,10],[2,25],[3,45],[4,70],[5,100],[6,135],[7,175],[8,220],[9,270],[10,325],
 [15,675],[20,1150],[25,1750],[30,2480],[35,3430],[40,4640],[45,6290],[50,8440],[55,11090],[60,14250],
 [65,18100],[70,22710],[75,28260],[80,34820],[85,42570],[90,51570],[95,61820],[100,73320],[105,83620],
 [110,97620],[115,112870],[120,125970],[125,143720],[130,162720],[135,182970],[140,200070],[145,222820],
 [150,246820],[155,272070],[160,293170],[165,321670],[170,352670],[175,386170],[180,414770],[185,453270],
 [190,494270],[195,537770],[200,574370]];
function hgXpCumulative(lv){
  lv=Math.max(0,Math.min(200,lv));
  for(let i=0;i<HG_XP_KNOTS.length-1;i++){
    const [l0,c0]=HG_XP_KNOTS[i], [l1,c1]=HG_XP_KNOTS[i+1];
    if(lv>=l0&&lv<=l1){
      if(lv===l0) return {v:c0,exact:true};
      if(lv===l1) return {v:c1,exact:true};
      const t=(lv-l0)/(l1-l0);
      return {v:c0+t*(c1-c0), exact:false};
    }
  }
  return {v:HG_XP_KNOTS[HG_XP_KNOTS.length-1][1], exact:true};
}
// Forgehammers: exact formula, Mastery 0-20 → 10 per level, verified against the site's table (cumulative 2100 @ M20).
function hgFhCumulative(m){ m=Math.max(0,Math.min(20,m)); return 10*m*(m+1)/2; }
// Mythic Gear from Mastery 11-20: exact, matches the site's table (cumulative 55 @ M20).
function hgMythFromMastery(m){ m=Math.max(0,Math.min(20,m)); return m<=10?0:(m-10)*(m-9)/2; }
// Red Gear ascension (Lv100+): exact milestone table, every 20-level step listed on the site.
const HG_ASCEND_STEPS=[ {lv:100,mith:0,myth:2}, {lv:120,mith:10,myth:3}, {lv:140,mith:20,myth:5}, {lv:160,mith:30,myth:5}, {lv:180,mith:40,myth:10}, {lv:200,mith:50,myth:10} ];
function hgAscendCost(curLv,tgtLv){
  let mith=0,myth=0;
  HG_ASCEND_STEPS.forEach(s=>{ if(s.lv>curLv && s.lv<=tgtLv){ mith+=s.mith; myth+=s.myth; } });
  return {mith,myth};
}
function hgCalcCost(r){
  const lvC=num(r.lvC), lvT=num(r.lvT), mC=num(r.mC), mT=num(r.mT);
  const xpLo=hgXpCumulative(lvC), xpHi=hgXpCumulative(lvT);
  const xp=Math.max(0,Math.round(xpHi.v-xpLo.v));
  const xpExact=xpLo.exact&&xpHi.exact;
  const fh=Math.max(0, hgFhCumulative(mT)-hgFhCumulative(mC));
  const mythM=Math.max(0, hgMythFromMastery(mT)-hgMythFromMastery(mC));
  const asc=hgAscendCost(lvC,lvT);
  return { xp, xpExact, fh, mg: mythM+asc.myth, mith: asc.mith };
}

/* ---------- hero gear (per-troop drop-downs of piece cards) ---------- */
const HG_TYPES=["Archer","Infantry","Cavalry"]; // main troop first
const HG_KEYS=[["xp","hgXp","XP"],["fh","hgFh","FH"],["mg","hgMg","Myth"],["mith","hgMith","Mith"]];
// imbuement milestones: [level, mastery needed, mithril, mythic gear] (optimizer "Imbuement Costs" table)
const HG_IMB=HG_ASCEND_STEPS.map((x,i)=>[x.lv,10+i,x.mith,x.myth]);
const hgBonus=L=>L<=100?15+0.35*L:50+0.5*(L-100); // stat bonus % (Mythic 0-100, Red 100-200)

/* ---------- pets ---------- */
// pet names from the in-game roster; max levels only where confirmed (others: enter your own)
// pet advance costs per generation: [advance to, pet food (cumulative from Lv1), growth manuals, nutrient potions, promotion medallions, SG/KvK pts, Alliance Brawl pts]
const PET_T={
  g1a:[[10,1715,15,0,0,25000,15000],[20,4895,30,0,0,50000,30000],[30,9905,45,10,0,100000,60000],[40,17565,60,20,0,150000,90000],[50,28865,90,30,10,225000,135000]],
  g1b:[[10,2530,20,0,0,25000,15000],[20,7890,40,0,0,50000,30000],[30,16910,60,10,0,100000,60000],[40,31230,90,20,0,150000,90000],[50,52850,130,20,10,225000,135000],[60,83770,175,50,20,337500,202500]],
  g2:[[10,3795,25,0,0,25000,15000],[20,11835,50,0,0,50000,30000],[30,25365,75,10,0,100000,60000],[40,46845,100,20,0,150000,90000],[50,79275,155,30,10,225000,135000],[60,125655,200,50,20,337500,202500],[70,188955,255,80,40,500000,300000]],
  g3:[[10,5060,30,0,0,25000,15000],[20,15780,60,0,0,50000,30000],[30,33820,95,10,0,100000,60000],[40,62460,125,20,0,150000,90000],[50,105700,190,30,10,225000,135000],[60,167540,250,50,20,337500,202500],[70,251940,310,80,40,500000,300000],[80,360420,380,100,60,600000,360000]],
  g4:[[10,6325,35,0,0,25000,15000],[20,19725,70,0,0,50000,30000],[30,42275,110,15,0,100000,60000],[40,78075,145,35,0,150000,90000],[50,132125,220,50,10,225000,135000],[60,209425,290,65,20,337500,202500],[70,314925,365,85,40,500000,300000],[80,450525,440,100,60,600000,360000],[90,622525,585,115,80,725000,435000],[100,834625,730,135,100,875000,525000]]
};
const PET_INFO={"Gray Wolf":{gen:1,max:50,t:"g1a"},"Lynx":{gen:1,max:60,t:"g1b"},"Bison":{gen:1,max:60,t:"g1b"},"Moose":{gen:2,max:70,t:"g2"},"Cheetah":{gen:2,max:70,t:"g2"},
  "Lion":{gen:3,max:80,t:"g3"},"Grizzly Bear":{gen:3,max:80,t:"g3"},"Mighty Bison":{gen:4,max:100,t:"g4"},"Giant Rhino":{gen:4,max:100,t:"g4"},
  "Alpha Black Panther":{gen:5,max:100,t:"g4"},"Great Moose":{gen:5,max:100,t:"g4"},"Regal White Lion":{gen:6,max:100,t:"g4"},"Ironclad War Elephant":{gen:6,max:100,t:"g4"},"Ironclad War Bear":{gen:7,max:100,t:"g4"}};
// what each pet does for your fights (active 2-hour skill) and upgrade priority for a Lethality/Health combat build
const PET_SKILL={"Alpha Black Panther":["+10% Troop Lethality",1,"Lethality is your main goal"],
  "Ironclad War Elephant":["+10% Squad Health",2,"Health is your weakest stat"],
  "Great Moose":["+150,000 Rally Capacity",3,"you lead rallies — more troops in every rally"],
  "Mighty Bison":["+15,000 Squad Capacity",4,"more troops in every march"],
  "Ironclad War Bear":["−10% enemy Defense",5,"works like extra damage"],
  "Giant Rhino":["+10% Squad Attack",6,"good, but Attack < Lethality/Health"],
  "Regal White Lion":["+10% Squad Defense",7,"defensive, lowest-value stat"],
  "Grizzly Bear":["The Howler: +25% March Speed, −4% enemy Lethality for 2h",8,"use just before rallies / KvK fights"],"Lion":["Gift of the King: free Badland item every ~31h",9,"no combat buff — claim it each time, don't level it"],"Cheetah":["",10,"older pet, max 70"],
  "Moose":["−3% enemy Squad Health",11,""],"Bison":["",12,""],"Lynx":["",13,""],"Gray Wolf":["",14,""]};
const petRank=r=>(PET_SKILL[r.n]||[,99])[1];
function petFoodAt(T,lv){ // cumulative food to reach level lv (linear inside a 10-level band)
  let prevL=0, prevF=0;
  for(const [L,F] of T){ if(lv<=L) return prevF+(F-prevF)*(lv-prevL)/(L-prevL); prevL=L; prevF=F; }
  return prevF;
}
function petCost(r){ // cost from current level to target (or max)
  const info=PET_INFO[r.n]; if(!info) return null;
  const T=PET_T[info.t], lv=num(r.lvl), goal=Math.min(num(r.tgt)||num(r.max)||info.max, info.max);
  const c={food:0,manuals:0,potions:0,medals:0,kvk:0,ab:0,exact:lv%10===0};
  if(goal<=lv) return c;
  c.food=Math.max(0,Math.round(petFoodAt(T,goal)-petFoodAt(T,lv)));
  T.forEach(([L,,m,p,md,k,ab])=>{ if(L>lv&&L<=goal){ c.manuals+=m; c.potions+=p; c.medals+=md; c.kvk+=k; c.ab+=ab; } });
  return c;
}

/* ---------- charms ---------- */
const CHARM_COSTS=[
 [5,5],[40,15],[60,40],[80,100],[100,200],[120,300],[140,400],[200,400],[300,400],[420,420],
 [560,420],[580,600],[610,780],[645,960],[685,1140],[730,1320],[780,1500],[835,1680],[895,1860],[960,2040],
 [1030,2220],[1105,2400]
];
function charmRem(cur,tgt){ let g=0,d=0; for(let i=Math.max(0,cur);i<Math.min(22,tgt);i++){ g+=CHARM_COSTS[i][0]; d+=CHARM_COSTS[i][1]; } return {g,d}; }
const CHARM_TYPES=["Archer","Infantry","Cavalry"]; // main troop first

/* ---------- widgets ---------- */
const WID_COSTS=[5,10,15,20,25,30,35,40,45,50];
const WID_HEROES=["Yang","Amadeus","Petra","Chenko","Yeonwoo","Amane","Zoe","Jabel","Marlin","Quinn","Vivian","Thrud","Eric","Saul","Helga","Hilde","Jaeger","Ava","Margot","Wee & Woo","Seo-yul","Gwen","Norah","Cyra","Reina","Bahar","Wilson","Roman","Cassia","Guinevere","Valora","Pan"];
function widRem(lvl){ return WID_COSTS.slice(Math.max(0,Math.min(10,lvl))).reduce((s,x)=>s+x,0); }
function widNext(lvl){ return lvl>=10?0:WID_COSTS[Math.max(0,lvl)]; }

/* ---------- governor gear ---------- */
const GOV_TIERS=[
 ["Green 0★",1500,15,0],["Green 1★",3800,40,0],
 ["Blue 0★",7000,70,0],["Blue 1★",9700,95,0],["Blue 2★",1000,10,45],["Blue 3★",1000,10,50],
 ["Purple 0★",1500,15,60],["Purple 1★",1500,15,70],["Purple 2★",6500,65,40],["Purple 3★",8000,80,50],
 ["Purple T1 0★",10000,95,60],["Purple T1 1★",11000,110,70],["Purple T1 2★",13000,130,85],["Purple T1 3★",15000,160,100],
 ["Gold 0★",22000,220,40],["Gold 1★",23000,230,40],["Gold 2★",25000,250,45],["Gold 3★",26000,260,45],
 ["Gold T1 0★",28000,280,45],["Gold T1 1★",30000,300,55],["Gold T1 2★",32000,320,55],["Gold T1 3★",35000,340,55],
 ["Gold T2 0★",38000,360,55],["Gold T2 1★",43000,430,75],["Gold T2 2★",45000,460,80],["Gold T2 3★",48000,500,85],
 ["Gold T3 0★",60000,600,120],["Gold T3 1★",70000,700,140],["Gold T3 2★",80000,800,160],["Gold T3 3★",90000,900,180],
 ["Red 0★",108000,1080,220],["Red 1★",114000,1140,230],["Red 2★",121000,1210,240],["Red 3★",128000,1280,250],
 ["Red T1 0★",154000,1540,300],["Red T1 1★",163000,1630,320],["Red T1 2★",173000,1730,340],["Red T1 3★",183000,1830,360],
 ["Red T2 0★",220000,2200,430],["Red T2 1★",233000,2330,460],["Red T2 2★",247000,2470,490],["Red T2 3★",264000,2640,520],
 ["Red T3 0★",288000,2880,570],["Red T3 1★",302000,3020,600],["Red T3 2★",317000,3170,630],["Red T3 3★",333000,3330,660],
 ["Red T4 0★",358000,3580,720],["Red T4 1★",384000,3840,770],["Red T4 2★",403000,4030,810],["Red T4 3★",423000,4230,850],
 ["Red T5 0★",451000,4510,910],["Red T5 1★",479000,4790,970],["Red T5 2★",507000,5070,1030],["Red T5 3★",535000,5350,1090],
 ["Red T6 0★",548000,5480,1110],["Red T6 1★",565000,5650,1140],["Red T6 2★",582000,5820,1170],["Red T6 3★",599000,5990,1210]
];
function govRem(curIdx,tgtIdx){ let s=0,t=0,v=0; for(let i=Math.max(0,curIdx+1);i<=tgtIdx;i++){ const r=GOV_TIERS[i]; if(r){s+=r[1];t+=r[2];v+=r[3];} } return {s,t,v}; }

/* ---------- resources ---------- */
// one-time tidy: speedups in minutes only (old "(hrs)" rows converted/removed), game order first
function migrateResources(){
  const R=state.resources; if(!Array.isArray(R)) return;
  const fix={"learning speedup (min":"Learning speedup (min)"};
  R.forEach(r=>{ const k=(r.n||"").toLowerCase(); if(fix[k]) r.n=fix[k]; });
  R.slice().forEach(r=>{ const m=(r.n||"").match(/^(.*speedup) \(hrs\)$/i); if(!m) return;
    const minName=m[1]+" (min)", tgt=R.find(x=>(x.n||"").toLowerCase()===minName.toLowerCase());
    const hrs=num(r.h);
    if(hrs>0&&!(tgt&&num(tgt.h)>0)){ if(tgt) tgt.h=String(Math.round(hrs*60)); else R.push({n:minName,h:String(Math.round(hrs*60))}); }
    R.splice(R.indexOf(r),1); });
  // merge duplicate names (keep the one with a value)
  const seen={}; R.slice().forEach(r=>{ const k=(r.n||"").toLowerCase(); if(!k) return;
    if(seen[k]){ if(String(seen[k].h||"").trim()===""&&String(r.h||"").trim()!=="") seen[k].h=r.h; R.splice(R.indexOf(r),1); } else seen[k]=r; });
  const order=SEED.resources.map(x=>x.n.toLowerCase());
  const rank=r=>{ const i=order.indexOf((r.n||"").toLowerCase()); return i<0?999:i; };
  const sorted=R.map((r,i)=>({r,i})).sort((a,b)=>rank(a.r)-rank(b.r)||a.i-b.i).map(x=>x.r);
  R.length=0; sorted.forEach(r=>R.push(r));
}
// big amounts show as 2.76B / 332.6M; tap to see or edit the full number (shorthand works)
const resShow=v=>{ const t=String(v==null?"":v).trim(); return t===""?"":fmtBig(num(t)); };

/* ---------- masters ---------- */
// game facts per master (from the in-game Masters screen) — levels and notes stay in state
const MASTER_INFO={
  Valora:   {title:"Bear Hunter",         talent:"Hunter Instinct",    research:"Squads' Health",    best:"Infantry",   ks:"+15% Squads' Attack",                        unlock:"Generation 3 Heroes", tip:"skip"},
  Pan:      {title:"Palace Administrator",talent:"Efficient Reserves", research:"Squads' Lethality", best:"Archers",    ks:"+15% Squads' Defense",                       unlock:"Generation 3 Heroes"},
  Roman:    {title:"Arena Champion",      talent:"Star Belligerent",   research:"Squads' Attack",    best:"Cavalry",    ks:"+15% Squads' Attack · +15% Squads' Defense", unlock:"Generation 3 Heroes"},
  Cassia:   {title:"Battle Master",       talent:"Horn of Valor",      research:"Squads' Defense",   best:"All squads", ks:"+20% Squads' Lethality · +20% Squads' Health", unlock:"Truegold 5"},
  Guinevere:{title:"Queen of Holy Sword", talent:"Holy Sword Domain",  research:"Squads' Defense",   best:"All squads", ks:"+15% Squads' Lethality · +15% Squads' Health", unlock:"Generation 4 Heroes"},
  Wilson:   {title:"Royal Herald",        talent:"Trade Decree",       research:"Squads' Health",    best:"Infantry",   ks:"+10% Squads' Attack · +10% Squads' Defense", unlock:"Generation 4 Heroes"},
  Aena:     {title:"Caravan Queen",       talent:"Beneficent Mogul",   research:"Squads' Lethality", best:"Cavalry",    ks:"+15% Squads' Attack · +15% Squads' Defense", unlock:"Generation 5 Heroes"},
  Isnor:    {title:"Legendary Explorer",  talent:"Old Hand",           research:"Squads' Attack",    best:"Archers",    ks:"+15% Squads' Lethality · +15% Squads' Health", unlock:"Generation 5 Heroes"}
};
const MAIN_TROOP="Archers";
// upgrade order for a rally leader chasing Lethality + Health (like PET_SKILL ranks)
const MASTER_RANK={
  Cassia:[1,"+20% Lethality + Health for all troops · combat skills · +Rally Capacity"],
  Pan:[2,"10 levels from Kindred Soul → Archer Lethality research"],
  Guinevere:[3,"+15% Lethality + Health for all troops"],
  Isnor:[4,"+15% Lethality + Health · Archers · still low level"],
  Valora:[5,"Infantry Health research · Bear Hunt"],
  Roman:[6,"Cavalry Attack · Attack/Defense buff"],
  Wilson:[7,"Infantry · Growth skills only"],
  Aena:[8,"Cavalry · Growth skills only"]};
const mastRank=m=>(MASTER_RANK[m.n]||[99])[0];
function masterHowTo(m,info){
  const lv=Math.max(0,Math.min(100,Math.floor(num(m.l))));
  const steps=[];
  if(lv>=100) steps.push(`<b>Kindred Soul reached</b> — spend <b>Master Emblems</b> in this master's research tree.`);
  else { const next=Math.min(100,(Math.floor(lv/10)+1)*10);
    steps.push(`<b>Next goal:</b> level ${lv} → ${next}${next===100?" (Kindred Soul — unlocks the research tree)":""}. Each 10-level breakpoint needs <b>Emblems</b> to break through.`); }
  steps.push(`<b>Gifts:</b> Copper Horn (~10), Silver Goblet (~100), Elite Spice (~1,000 affinity) — all add to the same total.`);
  if(info&&info.tip==="skip") steps.push(`<b>Realm Journey only:</b> she levels naturally from normal journeys — don't spend Adventure Supplies on her.`);
  else steps.push(`<b>Lostlands:</b> good target for Adventure Supplies until 1,000 affinity (then they settle in your town). Realm Journey adds random progress.`);
  return steps.map(t=>`<li>${t}</li>`).join("");
}
function paintMastNext(){
  const el=document.getElementById("mastNext"); if(!el) return;
  const c=(state.masters||[]).map(m=>({m,info:MASTER_INFO[m.n],lv:num(m.l)}))
    .filter(x=>x.info&&x.lv<100&&(x.info.best===MAIN_TROOP||x.info.best==="All squads"))
    .sort((a,b)=>b.lv-a.lv)[0];
  el.innerHTML = c ? `<b>Level up next:</b> ${esc(c.m.n)} (${c.lv} → ${Math.min(100,(Math.floor(c.lv/10)+1)*10)}) — best for ${c.info.best}, closest to the next breakpoint.`
                   : `<b>All ${MAIN_TROOP} / all-squad masters are at Kindred Soul.</b>`;
}
// max level of each master skill (from the game)
const MASTER_SKILL_MAX={Pan:[5,5,5,10],Valora:[10,5,5,10],Roman:[10,10,10,10],Cassia:[10,20,20,20],Aena:[10,10,10,10],Guinevere:[10,10,20,20],Isnor:[10,10,10,10],Wilson:[10,10,10,10]};
const skillCap=(name,i)=>{ const c=MASTER_SKILL_MAX[name]; return c&&c[i]?c[i]:0; };
const skillIsMax=(sk,cap)=>cap?num(sk&&sk.l)>=cap:!!(sk&&sk.max);

/* per-tier building ladders: each step = reaching the next sub-tier {to,w(=bread),s,i,tg,ttg}. Wood=Bread. */
function _bstep(to,w,s,i,tg,ttg){ return {to,w,s,i,tg,ttg}; }
function _band(from,arr){ return arr; }
const _troop=[ // Barracks/Stable/Range, from TG6
  _bstep("TG 6.1",38e6,7.6e6,1.9e6,108,6),_bstep("TG 6.2",38e6,7.6e6,1.9e6,108,6),_bstep("TG 6.3",38e6,7.6e6,1.9e6,108,6),_bstep("TG 6.4",38e6,7.6e6,1.9e6,108,6),
  _bstep("TG 7",38e6,7.6e6,1.9e6,54,13),
  _bstep("TG 7.1",46e6,9.3e6,2.3e6,108,9),_bstep("TG 7.2",46e6,9.3e6,2.3e6,108,9),_bstep("TG 7.3",46e6,9.3e6,2.3e6,108,9),_bstep("TG 7.4",46e6,9.3e6,2.3e6,108,9),
  _bstep("TG 8",46e6,9.3e6,2.3e6,54,18)];
const BUILD_TIERS={
  "Town Center":{from:"TG 7",steps:[_bstep("TG 7.1",130e6,26e6,6.6e6,240,20),_bstep("TG 7.2",130e6,26e6,6.6e6,240,20),_bstep("TG 7.3",130e6,26e6,6.6e6,240,20),_bstep("TG 7.4",130e6,26e6,6.6e6,240,20),_bstep("TG 8",130e6,26e6,6.6e6,120,40)]},
  "Barracks":{from:"TG 6",steps:_troop}, "Stable":{from:"TG 6",steps:_troop}, "Range":{from:"TG 6",steps:_troop},
  "Infirmary":{from:"TG 6",steps:[_bstep("TG 6.1",27e6,5.4e6,1.3e6,48,3),_bstep("TG 6.2",27e6,5.4e6,1.3e6,48,3),_bstep("TG 6.3",27e6,5.4e6,1.3e6,48,3),_bstep("TG 6.4",27e6,5.4e6,1.3e6,48,3),_bstep("TG 7",27e6,5.4e6,1.3e6,24,6),_bstep("TG 7.1",33e6,6.6e6,1.6e6,48,4),_bstep("TG 7.2",33e6,6.6e6,1.6e6,48,4),_bstep("TG 7.3",33e6,6.6e6,1.6e6,48,4),_bstep("TG 7.4",33e6,6.6e6,1.6e6,48,4),_bstep("TG 8",33e6,6.6e6,1.6e6,24,8)]},
  "Command Center":{from:"TG 6",steps:[_bstep("TG 6.1",32e6,6.5e6,1.6e6,48,3),_bstep("TG 6.2",32e6,6.5e6,1.6e6,48,3),_bstep("TG 6.3",32e6,6.5e6,1.6e6,48,3),_bstep("TG 6.4",32e6,6.5e6,1.6e6,48,3),_bstep("TG 7",32e6,6.5e6,1.6e6,24,6),_bstep("TG 7.1",39e6,7.9e6,1.9e6,48,4),_bstep("TG 7.2",39e6,7.9e6,1.9e6,48,4),_bstep("TG 7.3",39e6,7.9e6,1.9e6,48,4),_bstep("TG 7.4",39e6,7.9e6,1.9e6,48,4),_bstep("TG 8",39e6,7.9e6,1.9e6,24,8)]},
  "War Academy":{from:"TG 5",steps:[_bstep("TG 5.1",48e6,9.6e6,2.4e6,90,4),_bstep("TG 5.2",48e6,9.6e6,2.4e6,90,4),_bstep("TG 5.3",48e6,9.6e6,2.4e6,90,4),_bstep("TG 5.4",48e6,9.6e6,2.4e6,90,4),_bstep("TG 6",48e6,9.6e6,2.4e6,45,9),_bstep("TG 6.1",54e6,10e6,2.7e6,108,6),_bstep("TG 6.2",54e6,10e6,2.7e6,108,6),_bstep("TG 6.3",54e6,10e6,2.7e6,108,6),_bstep("TG 6.4",54e6,10e6,2.7e6,108,6),_bstep("TG 7",54e6,10e6,2.7e6,54,13),_bstep("TG 7.1",66e6,13e6,3.3e6,108,9),_bstep("TG 7.2",66e6,13e6,3.3e6,108,9),_bstep("TG 7.3",66e6,13e6,3.3e6,108,9),_bstep("TG 7.4",66e6,13e6,3.3e6,108,9),_bstep("TG 8",66e6,13e6,3.3e6,54,18)]},
  "Embassy":{from:"TG 6",steps:[_bstep("TG 6.1",21e6,4.3e6,1.0e6,60,3),_bstep("TG 6.2",21e6,4.3e6,1.0e6,60,3),_bstep("TG 6.3",21e6,4.3e6,1.0e6,60,3),_bstep("TG 6.4",21e6,4.3e6,1.0e6,60,3),_bstep("TG 7",21e6,4.3e6,1.0e6,30,7),_bstep("TG 7.1",26e6,5.3e6,1.3e6,60,5),_bstep("TG 7.2",26e6,5.3e6,1.3e6,60,5),_bstep("TG 7.3",26e6,5.3e6,1.3e6,60,5),_bstep("TG 7.4",26e6,5.3e6,1.3e6,60,5),_bstep("TG 8",26e6,5.3e6,1.3e6,30,10)]}
};
function bldRem(bl){
  const B=BUILD_TIERS[bl.n]; if(!B||bl.d) return {w:0,s:0,i:0,tg:0,ttg:0,cur:bl.d?"Done":"—"};
  const idx=Math.max(0,Math.min(B.steps.length,bl.stepIdx||0));
  let w=0,s=0,i=0,tg=0,ttg=0;
  for(let k=idx;k<B.steps.length;k++){ const st=B.steps[k]; w+=st.w; s+=st.s; i+=st.i; tg+=st.tg; ttg+=st.ttg; }
  const cur = idx===0 ? B.from : B.steps[idx-1].to;
  return {w,s,i,tg,ttg,cur};
}

/* ---------- mystic trials ---------- */
function mysticLogEntry(zone){
  const val=parseFloat(zone.v); if(!isFinite(val)) return;
  const d=fcToday();
  if(!Array.isArray(zone.log)) zone.log=[];
  const ex=zone.log.findIndex(e=>e.d===d);
  if(ex>=0) zone.log[ex]={d,v:val}; else zone.log.push({d,v:val});
}

// older saves kept KvK + Bear Hunt countdowns in state.today — turn them into events once
function migrateEvents(){
  if(Array.isArray(state.events)) return;
  const t=state.today||{};
  state.events=[
    {n:"KvK", date:t.kvkDate||"", every:t.kvkPeriod||14, time:"", note:""},
    {n:"Bear Hunt", date:t.bearDate||"", every:t.bearPeriod||2, time:"", note:""}
  ];
}
// one-time: replace old master notes ("Laggard" etc.) with the standard research / Kindred Soul / best-for format
const MASTER_NOTES_V=2;
function migrateMasterNotes(){
  if(state.masterNotesV>=MASTER_NOTES_V) return;
  const std=Object.fromEntries(SEED.masters.map(m=>[m.n,m.note]));
  (state.masters||[]).forEach(m=>{ if(std[m.n]) m.note=std[m.n]; });
  state.masterNotesV=MASTER_NOTES_V;
  scheduleSave();
}

