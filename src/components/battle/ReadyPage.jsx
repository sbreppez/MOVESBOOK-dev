import React, { useState, useEffect, useRef, Fragment } from 'react';
import { PRESET_COLORS } from '../../constants/colors';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { lbl } from '../../constants/styles';
import { INIT_ROUNDS } from '../../constants/categories';
import { useSettings } from '../../hooks/useSettings';
import { useT, usePlural } from '../../hooks/useTranslation';
import { Ic } from '../shared/Ic';
import { Modal } from '../shared/Modal';
import { Btn } from '../shared/Btn';
import { NameModal } from '../shared/NameModal';
import { EditRoundView } from './EditRoundView';
import { FreestylePage } from './FreestylePage';
import { RivalsPage } from './RivalsPage';
import { NewRoundModal } from './NewRoundModal';
import { BattlePrepPage } from '../train/BattlePrepPage';
import { PremiumGate } from '../shared/PremiumGate';
import { SectionBrief } from '../shared/SectionBrief';
import { computeDecay } from '../../utils/masteryDecay';

export const ReadyPage = ({ moves, sets, setSets, rounds, setRounds, settings={}, onAddTrigger, onAddTrigger2=0, onSubTabChange, addToast, freestyle, onFreestyleChange, rivals, onRivalsChange, addCalendarEvent, removeCalendarEvent, onSimulate, battleprep, setBattleprep, calendar, battlePrepSeed, onBattlePrepSeedUsed, onOpenSharedCalendar, isPremium }) => {
  const t = useT();
  const { moveCountStr, itemCountStr, roundCountStr, entryCountStr } = usePlural();
  const { C } = useSettings();
  const showMastery   = settings.showMastery  === true;
  const showMoveCount = settings.showMoveCount === true;
  const [battleTab, setBattleTab] = useState("plan");
  const setBattleTabAndNotify = (t) => { setBattleTab(t); if(onSubTabChange) onSubTabChange(t); };
  // Notify parent of initial sub-tab
  useEffect(()=>{ if(onSubTabChange) onSubTabChange("plan"); },[]);

  // ── PLAN sub-tab state ──────────────────────────────────────────────────────
  const [expRounds, setExpRounds] = useState({});
  const [expEntries, setExpEntries] = useState({});
  const [editRound, setEditRound] = useState(null);
  const [addingRound, setAddingRound] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [reorderRounds, setReorderRounds] = useState(false);
  const moveRoundUp   = (idx) => { if(idx===0) return; setRounds(prev=>{ const n=[...prev]; [n[idx],n[idx-1]]=[n[idx-1],n[idx]]; return n; }); };
  const moveRoundDown = (idx) => { setRounds(prev=>{ if(idx>=prev.length-1) return prev; const n=[...prev]; [n[idx],n[idx+1]]=[n[idx+1],n[idx]]; return n; }); };

  // ── Battle Templates ────────────────────────────────────────────────────────
  const [templates, setTemplates] = useState(() => {
    try { const s = localStorage.getItem("mb_templates"); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  useEffect(() => {
    try { localStorage.setItem("mb_templates", JSON.stringify(templates)); } catch {}
    const timer = setTimeout(() => {
      if (window.__MB_USER__?.uid && window.__MB_DB__) window.__MB_DB__.save(window.__MB_USER__.uid, "templates", templates);
    }, 1500);
    return () => clearTimeout(timer);
  }, [templates]);
  useEffect(() => {
    const handler = () => {
      const raw = localStorage.getItem("mb_templates");
      if (raw) { try { const p = JSON.parse(raw); setTemplates(p); } catch {} }
    };
    window.addEventListener("mb-auth-resolved", handler);
    return () => window.removeEventListener("mb-auth-resolved", handler);
  }, []);

  const [showSaveTemplate,  setShowSaveTemplate]  = useState(false);
  const [showLoadTemplate,  setShowLoadTemplate]  = useState(false);
  const [templateName,      setTemplateName]      = useState("");
  const [confirmLoadTpl,    setConfirmLoadTpl]    = useState(null); // template to load
  const [confirmDeleteTpl,  setConfirmDeleteTpl]  = useState(null); // template to delete

  const saveTemplate = () => {
    if (!templateName.trim()) return;
    const tpl = {
      id: Date.now(),
      name: templateName.trim(),
      savedAt: new Date().toLocaleDateString("en-AU", {day:"2-digit", month:"short", year:"numeric"}),
      rounds: JSON.parse(JSON.stringify(rounds)), // deep clone
    };
    setTemplates(p => [...p, tpl]);
    setTemplateName("");
    setShowSaveTemplate(false);
  };

  const loadTemplate = (tpl) => {
    setRounds(JSON.parse(JSON.stringify(tpl.rounds)));
    setConfirmLoadTpl(null);
    setShowLoadTemplate(false);
  };

  const deleteTemplate = (id) => {
    setTemplates(p => p.filter(t => t.id !== id));
    setConfirmDeleteTpl(null);
  };

  const [freestyleAddTick, setFreestyleAddTick] = useState(0);
  const [rivalsAddTick, setRivalsAddTick] = useState(0);
  const [prepAddTick, setPrepAddTick] = useState(0);
  useEffect(()=>{
    if(!onAddTrigger) return;
    if(battleTab==="freestyle") setFreestyleAddTick(t=>t+1);
    else if(battleTab==="rivals") setRivalsAddTick(t=>t+1);
    else if(battleTab==="prep") setPrepAddTick(t=>t+1);
    else if(battleTab==="plan") setAddingRound(true);
  },[onAddTrigger]);
  // onAddTrigger2 in Battle: "Add Move" opens freestyle picker regardless of sub-tab
  useEffect(()=>{
    if(!onAddTrigger2) return;
    setFreestyleAddTick(t=>t+1);
  },[onAddTrigger2]);

  // ── Vocab picker state (inside Edit Round) ──────────────────────────────────
  const [pickerEntry, setPickerEntry] = useState(null); // { roundId, entryId }
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerSel, setPickerSel] = useState([]);       // [{ type, refId }]

  // ── Sets detail modal ───────────────────────────────────────────────────────
  const [editSet, setEditSet] = useState(null);
  const [addingSet, setAddingSet] = useState(false);

  const allCats = [...new Set(moves.map(m => m.category))].sort();
  const getMove = id => moves.find(m => m.id === id);
  const getSet  = id => sets.find(s => s.id === id);

  // ── Round/Entry helpers ─────────────────────────────────────────────────────
  const addRound = (name, color=PRESET_COLORS[0], entryCount=1) => {
    const id = Date.now();
    const entries = Array.from({length: Math.max(1, entryCount)}, (_,i) => ({
      id: id + i + 1, name: entryCount === 1 ? t("entryPrefix")+" 1" : t("entryPrefix")+" "+(i+1), items: []
    }));
    setRounds(p => [...p, { id, name, color, notes:"", date: new Date().toISOString().split("T")[0], entries }]);
  };
  const deleteRound = rid => setRounds(p => p.filter(r => r.id !== rid));
  const updateRound = (rid, fields) => setRounds(p => p.map(r => r.id === rid ? {...r,...fields} : r));

  const addEntry = rid => setRounds(p => p.map(r => {
    if (r.id !== rid) return r;
    const n = (r.entries||[]).length + 1;
    return {...r, entries:[...(r.entries||[]), { id: Date.now(), name:t("entryPrefix")+" "+n, items:[] }]};
  }));
  const removeEntry = (rid, eid) => setRounds(p => p.map(r =>
    r.id !== rid ? r : {...r, entries: (r.entries||[]).filter(e => e.id !== eid)}
  ));
  const addItemToEntry = (rid, eid, items) => setRounds(p => p.map(r => {
    if (r.id !== rid) return r;
    return {...r, entries: (r.entries||[]).map(e => {
      if (e.id !== eid) return e;
      const existing = new Set((e.items||[]).map(i => i.type+":"+i.refId));
      const toAdd = items.filter(i => !existing.has(i.type+":"+i.refId));
      return {...e, items:[...e.items, ...toAdd]};
    })};
  }));
  const removeItemFromEntry = (rid, eid, idx) => setRounds(p => p.map(r =>
    r.id !== rid ? r : {...r, entries: (r.entries||[]).map(e =>
      e.id !== eid ? e : {...e, items: (e.items||[]).filter((_,i) => i !== idx)}
    )}
  ));
  const reorderEntryItems = (rid, eid, fromIdx, toIdx) => setRounds(p => p.map(r => {
    if (r.id !== rid) return r;
    return {...r, entries: (r.entries||[]).map(e => {
      if (e.id !== eid) return e;
      const items = [...e.items];
      const [moved] = items.splice(fromIdx, 1);
      const adj = fromIdx < toIdx ? toIdx - 1 : toIdx;
      items.splice(adj, 0, moved);
      return {...e, items};
    })};
  }));

  // find which entry in a round already contains an item
  const findDupes = (round, type, refId) => {
    const found = [];
    (round.entries||[]).forEach(e => {
      if (e.items.some(i => i.type === type && i.refId === refId)) found.push(e.name);
    });
    return found;
  };

  // ── Drag within entry items ─────────────────────────────────────────────────
  const entryDragItem = useRef(null);
  const [entryDragOver, setEntryDragOver] = useState(null);

  // ── Sets CRUD ────────────────────────────────────────────────────────────────
  const addSet = name => setSets(p => [...p, { id:Date.now(), name, color:PRESET_COLORS[1], notes:"", mastery:0, date:new Date().toISOString().split("T")[0] }]);
  const deleteSet = sid => setSets(p => p.filter(s => s.id !== sid));
  const updateSet = (sid, fields) => setSets(p => p.map(s => s.id === sid ? {...s,...fields} : s));

  const masteryColorLocal = p => p < 30 ? C.red : p < 60 ? C.yellow : p < 80 ? C.blue : C.green;
  const dm = m => computeDecay(m, settings.decaySensitivity).displayMastery;

  // ── PLAN layout ─────────────────────────────────────────────────────────────
  // ── Tension Role mapping ────────────────────────────────────────────────────
  const ROLE_LEVEL = { flow:1, build:2, hit:3, peak:4 };
  const TENSION_COLORS = { 1: C.textMuted, 2: C.blue, 3: C.yellow, 4: C.red };

  const getItemTension = (item) => {
    if (item.tensionOverride) return ROLE_LEVEL[item.tensionOverride] || 2;
    if (item.type === "move") {
      const m = getMove(item.refId);
      if (m?.tensionRole) return ROLE_LEVEL[m.tensionRole] || 2;
    }
    return 2; // default build
  };

  const LEVEL_TO_ROLE = { 1:"flow", 2:"build", 3:"hit", 4:"peak" };

  const cycleItemTension = (roundId, entryId, itemIdx) => {
    setRounds(prev => prev.map(r => r.id !== roundId ? r : {
      ...r,
      entries: (r.entries||[]).map(e => e.id !== entryId ? e : {
        ...e,
        items: (e.items||[]).map((it, i) => {
          if (i !== itemIdx) return it;
          const cur = getItemTension(it);
          const next = (cur % 4) + 1;
          return { ...it, tensionOverride: LEVEL_TO_ROLE[next] };
        })
      })
    }));
  };

  const resetItemTension = (roundId, entryId, itemIdx) => {
    setRounds(prev => prev.map(r => r.id !== roundId ? r : {
      ...r,
      entries: (r.entries||[]).map(e => e.id !== entryId ? e : {
        ...e,
        items: (e.items||[]).map((it, i) => i !== itemIdx ? it : { ...it, tensionOverride: null })
      })
    }));
    if (addToast) addToast({ icon:"refresh", title: t("resetToDefault") });
  };

  const TensionDots = ({ level, onTap, onLongPress }) => {
    const color = TENSION_COLORS[level] || TENSION_COLORS[2];
    const longRef = useRef(null);
    return (
      <button
        onClick={e=>{ e.stopPropagation(); onTap(); }}
        onTouchStart={()=>{ longRef.current = setTimeout(()=>{ if(onLongPress) onLongPress(); }, 600); }}
        onTouchEnd={()=>clearTimeout(longRef.current)}
        onMouseDown={()=>{ longRef.current = setTimeout(()=>{ if(onLongPress) onLongPress(); }, 600); }}
        onMouseUp={()=>clearTimeout(longRef.current)}
        onMouseLeave={()=>clearTimeout(longRef.current)}
        style={{ background:"none", border:"none", cursor:"pointer", padding:"6px 4px",
          display:"flex", alignItems:"center", gap:3, flexShrink:0, minWidth:44, justifyContent:"center" }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ width:6, height:6, borderRadius:"50%",
            background: i <= level ? color : `${color}33` }}/>
        ))}
      </button>
    );
  };

  const ArcVis = ({ items }) => {
    if (!items || items.length < 2) return null;
    const W = 200, H = 60, PAD_X = 16, PAD_Y = 8;
    const plotW = W - PAD_X * 2, plotH = H - PAD_Y * 2;
    const points = items.map((it, i) => {
      const tension = getItemTension(it);
      const x = PAD_X + (items.length === 1 ? plotW / 2 : (i / (items.length - 1)) * plotW);
      const y = PAD_Y + plotH - (((tension - 1) / 3) * plotH);
      return { x, y, tension };
    });
    const lineStr = points.map(p => `${p.x},${p.y}`).join(" ");
    const areaStr = `${PAD_X},${H - PAD_Y} ${lineStr} ${W - PAD_X},${H - PAD_Y}`;
    const gridYs = [1,2,3,4].map(v => PAD_Y + plotH - (((v - 1) / 3) * plotH));
    return (
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
        style={{ width:"100%", height:60, display:"block", padding:"0", boxSizing:"border-box" }}>
        {gridYs.map((gy,i) => (
          <line key={i} x1={PAD_X} y1={gy} x2={W - PAD_X} y2={gy}
            stroke={C.border} strokeWidth={0.5} strokeOpacity={0.3}/>
        ))}
        <polygon points={areaStr} fill={C.accent} fillOpacity={0.1}/>
        <polyline points={lineStr} fill="none" stroke={C.accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        {points.map((p,i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} fill={TENSION_COLORS[p.tension]}/>
        ))}
      </svg>
    );
  };

  const getArcFeedback = (items) => {
    if (!items || items.length < 3) return null;
    const levels = items.map(it => getItemTension(it));
    const allSame = levels.every(l => l === levels[0]);
    if (allSame) return t("arcNoDynamics");
    const hasPeak = levels.includes(4);
    if (hasPeak) return t("arcBuild");
    for (let i = 1; i < levels.length; i++) {
      if (levels[i] >= 3 && levels[i - 1] >= 3) return t("arcBackToBack");
    }
    const last = levels[levels.length - 1];
    if (last >= 3) return t("arcStrongCloser");
    return null;
  };

  // ── Arc legend (first-time) ───────────────────────────────────────────────
  const [arcLegendOpen, setArcLegendOpen] = useState(!(settings.arcLegendSeen));

  const ArcLegend = () => {
    const seen = settings.arcLegendSeen;
    return (
      <div style={{ margin:"4px 0 6px", padding:"8px 16px", background:C.surface, borderRadius:8, border:"none" }}>
        <div onClick={()=>{ setArcLegendOpen(p=>!p); if(!seen && window.__MB_SETTINGS_SET__) window.__MB_SETTINGS_SET__(s=>({...s,arcLegendSeen:true})); }}
          style={{ display:"flex", alignItems:"center", cursor:"pointer", gap:6 }}>
          <Ic n={arcLegendOpen?"chevD":"chevR"} s={10} c={C.textMuted}/>
          <span style={{ fontSize:10, fontWeight:800, letterSpacing:1, color:C.brownMid, fontFamily:FONT_DISPLAY }}>{t("roundArc")}</span>
        </div>
        {arcLegendOpen && (
          <div style={{ marginTop:6 }}>
            <div style={{ fontSize:13, color:C.textSec, fontStyle:"italic", fontFamily:FONT_BODY, lineHeight:1.4, marginBottom:6 }}>{t("roundArcExplain")}</div>
            <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:4 }}>
              {[{e:"\ud83c\udf0a",n:1,l:"arcLegendFlow"},{e:"\ud83d\udcc8",n:2,l:"arcLegendBuild"},{e:"\ud83d\udca5",n:3,l:"arcLegendHit"},{e:"\ud83d\udd25",n:4,l:"arcLegendPeak"}].map(x=>(
                <div key={x.n} style={{ display:"flex", alignItems:"center", gap:3, fontSize:11, color:C.textMuted }}>
                  <span>{x.e}</span>
                  {[1,2,3,4].map(i=><div key={i} style={{ width:5, height:5, borderRadius:"50%", background: i<=x.n ? TENSION_COLORS[x.n] : `${TENSION_COLORS[x.n]}33` }}/>)}
                  <span>{t(x.l)}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize:11, color:C.textMuted, fontStyle:"italic" }}>{t("tapDotsToOverride")}</div>
          </div>
        )}
      </div>
    );
  };

  const PlanView = () => {
    return (
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <SectionBrief desc={t("battlePlanBrief")} stat={`${rounds.length} rounds configured`} settings={settings}/>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 16px", flexShrink:0 }}>
          <span style={{ fontSize:14, fontWeight:800, letterSpacing:1.5, color:C.brownMid, fontFamily:FONT_DISPLAY }}>{t("rounds")}</span>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <button onClick={()=>setConfirmRestore(true)}
              style={{ background:"none", border:"none", cursor:"pointer", padding:4 }}
              title={t("resetRounds")}>
              <Ic n="refreshCw" s={16} c={C.textSec}/>
            </button>
            <button onClick={()=>setShowLoadTemplate(true)}
              style={{ background:"none", border:"none", cursor:"pointer", padding:4 }}
              title={t("loadSavedTemplate")}>
              <Ic n="download" s={16} c={C.textSec}/>
            </button>
            <button onClick={()=>{ setTemplateName(""); setShowSaveTemplate(true); }}
              style={{ background:"none", border:"none", cursor:"pointer", padding:4 }}
              title={t("saveCurrentTemplate")}>
              <Ic n="upload" s={16} c={C.textSec}/>
            </button>
            {rounds.length>1&&<button onClick={()=>setReorderRounds(r=>!r)}
              style={{ background:reorderRounds?C.accent:"none", border:"none", cursor:"pointer", padding:"4px 8px", borderRadius:5,
                color:reorderRounds?C.bg:C.textMuted, fontSize:13, fontWeight:800, fontFamily:FONT_DISPLAY, letterSpacing:1 }}>
              {reorderRounds?t("done"):"⇅"}
            </button>}
          </div>
        </div>

        {/* Confirm restore modal */}
        {confirmRestore&&(
          <Modal title={t("restoreDefaultRounds")} onClose={()=>setConfirmRestore(false)}>
            <p style={{ color:C.textSec, marginBottom:8, lineHeight:1.6, fontSize:13 }}>
              This will replace your current rounds with the default battle structure:
            </p>
            <div style={{ background:C.surfaceAlt, borderRadius:8, padding:"10px 14px", marginBottom:16, fontSize:13, color:C.textSec, lineHeight:1.9 }}>
              Prelims · Top 32 · Top 16 · Top 8 · Semi-Finals · Finals · Reserve
            </div>
            <p style={{ color:C.accent, fontWeight:700, fontSize:13, marginBottom:20, lineHeight:1.6 }}>
              ⚠️ All your current rounds and their entries will be permanently erased. This cannot be undone.
            </p>
            <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
              <Btn variant="secondary" onClick={()=>setConfirmRestore(false)}>{t("cancel")}</Btn>
              <Btn variant="danger" onClick={()=>{ setRounds(INIT_ROUNDS); setConfirmRestore(false); }}>{t("yesRestore")}</Btn>
            </div>
          </Modal>
        )}

        {/* Save Template Modal */}
        {showSaveTemplate&&(
          <Modal title={t("saveBattleTemplate")} onClose={()=>setShowSaveTemplate(false)}>
            <p style={{ fontSize:13, color:C.textSec, marginBottom:14, lineHeight:1.6 }}>
              Saves your current round structure and all entries as a reusable template.
            </p>
            <div style={{ marginBottom:6 }}>
              <label style={lbl()}>{t("templateNameLabel")} *</label>
              <input autoFocus value={templateName} onChange={e=>setTemplateName(e.target.value)}
                onKeyDown={e=>{ if(e.key==="Enter") saveTemplate(); }}
                placeholder="e.g. Red Bull BC One, Local Jam, 2v2 Format…"
                style={{ width:"100%", background:C.surface, border:`1.5px solid ${C.accent}`, borderRadius:8,
                  padding:"9px 12px", color:C.text, fontSize:14, outline:"none", fontFamily:FONT_BODY, boxSizing:"border-box" }}/>
            </div>
            <div style={{ fontSize:11, color:C.textMuted, marginBottom:20, marginTop:6 }}>
              {roundCountStr(rounds.length)} will be saved ·{" "}
              {rounds.reduce((n,r)=>n+(r.entries?.length||0),0)} entr{rounds.reduce((n,r)=>n+(r.entries?.length||0),0)!==1?"ies":"y"} total
            </div>
            <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
              <Btn variant="secondary" onClick={()=>setShowSaveTemplate(false)}>{t("cancel")}</Btn>
              <Btn onClick={saveTemplate} disabled={!templateName.trim()}>Save Template</Btn>
            </div>
          </Modal>
        )}

        {/* Load Template Modal */}
        {showLoadTemplate&&!confirmLoadTpl&&!confirmDeleteTpl&&(
          <Modal title={t("loadBattleTemplate")} onClose={()=>setShowLoadTemplate(false)}>
            {templates.length===0 ? (
              <div style={{ textAlign:"center", padding:"24px 0", color:C.textMuted }}>
                <div style={{ marginBottom:8 }}><Ic n="download" s={28} c={C.textMuted}/></div>
                <div style={{ fontSize:13, fontWeight:700, fontFamily:FONT_DISPLAY, marginBottom:4 }}>{t("noTemplatesSaved")}</div>
                <div style={{ fontSize:13 }}>Set up your rounds then tap Save to create your first template.</div>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <p style={{ fontSize:13, color:C.textMuted, marginBottom:4, lineHeight:1.5 }}>
                  Tap a template to load it. This will replace your current rounds and entries.
                </p>
                {templates.map(tpl=>(
                  <div key={tpl.id}
                    style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px",
                      background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, cursor:"pointer" }}
                    onClick={()=>setConfirmLoadTpl(tpl)}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:800, fontSize:14, color:C.text, fontFamily:FONT_DISPLAY, letterSpacing:0.5, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{tpl.name}</div>
                      <div style={{ fontSize:11, color:C.textMuted, marginTop:3 }}>
                        {roundCountStr(tpl.rounds.length)} ·{" "}
                        {tpl.rounds.reduce((n,r)=>n+(r.entries?.length||0),0)} entr{tpl.rounds.reduce((n,r)=>n+(r.entries?.length||0),0)!==1?"ies":"y"} · Saved {tpl.savedAt}
                      </div>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginTop:5 }}>
                        {tpl.rounds.slice(0,6).map(r=>(
                          <span key={r.id} style={{ fontSize:10, padding:"1px 7px", borderRadius:10,
                            background:`${r.color||C.accent}25`, color:r.color||C.accent,
                            fontFamily:FONT_DISPLAY, fontWeight:700 }}>{r.name}</span>
                        ))}
                        {tpl.rounds.length>6&&<span style={{ fontSize:10, color:C.textMuted }}>+{tpl.rounds.length-6} more</span>}
                      </div>
                    </div>
                    <button onClick={e=>{ e.stopPropagation(); setConfirmDeleteTpl(tpl); }}
                      style={{ background:"none", border:"none", cursor:"pointer", padding:6, display:"flex", flexShrink:0 }}>
                      <Ic n="trash" s={14} c={C.accent}/>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display:"flex", justifyContent:"flex-end", marginTop:16 }}>
              <Btn variant="secondary" onClick={()=>setShowLoadTemplate(false)}>{t("close")}</Btn>
            </div>
          </Modal>
        )}

        {/* Confirm Load */}
        {confirmLoadTpl&&(
          <Modal title={t("loadTemplate")} onClose={()=>setConfirmLoadTpl(null)}>
            <p style={{ fontSize:13, color:C.textSec, marginBottom:8, lineHeight:1.6 }}>
              Load <strong style={{color:C.text}}>{confirmLoadTpl.name}</strong>?
            </p>
            <p style={{ fontSize:13, color:C.accent, fontWeight:700, marginBottom:20, lineHeight:1.6 }}>
              ⚠️ Your current rounds and all their entries will be replaced. This cannot be undone.
            </p>
            <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
              <Btn variant="secondary" onClick={()=>setConfirmLoadTpl(null)}>{t("cancel")}</Btn>
              <Btn variant="danger" onClick={()=>loadTemplate(confirmLoadTpl)}>{t("yesLoadTemplate")}</Btn>
            </div>
          </Modal>
        )}

        {/* Confirm Delete Template */}
        {confirmDeleteTpl&&(
          <Modal title={t("deleteTemplate")} onClose={()=>setConfirmDeleteTpl(null)}>
            <p style={{ fontSize:13, color:C.textSec, marginBottom:8, lineHeight:1.6 }}>
              Delete <strong style={{color:C.text}}>{confirmDeleteTpl.name}</strong>?
            </p>
            <p style={{ fontSize:13, color:C.accent, fontWeight:700, marginBottom:20 }}>
              ⚠️ {t("cannotBeUndone")}
            </p>
            <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
              <Btn variant="secondary" onClick={()=>setConfirmDeleteTpl(null)}>{t("cancel")}</Btn>
              <Btn variant="danger" onClick={()=>deleteTemplate(confirmDeleteTpl.id)}>{t("delete")}</Btn>
            </div>
          </Modal>
        )}

        {/* Simulate Competition button — premium */}
        {isPremium && rounds.length >= 2 && onSimulate && (
          <div style={{ padding:"8px 16px 0", flexShrink:0 }}>
            <button onClick={onSimulate}
              style={{
                width:"100%", padding:14, borderRadius:12,
                border:`1px solid ${C.accent}`, background:"transparent",
                color:C.accent, cursor:"pointer",
                fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:13,
                letterSpacing:1,
                display:"flex", alignItems:"center", justifyContent:"center",
                gap:8, minHeight:44,
              }}>
              {t("simulateCompetition")}
            </button>
          </div>
        )}

        {/* Rounds list */}
        <div style={{ flex:1, overflow:"auto", padding:"8px 16px" }}>
          {isPremium && rounds.some(r => (r.entries||[]).some(e => (e.items||[]).filter(it=>it.type==="move").length >= 2)) && <ArcLegend/>}
          {rounds.length === 0 && (
            <div style={{ textAlign:"center", padding:40, color:C.textMuted }}>
              <Ic n="sword" s={32} c={C.textMuted}/>
              <p style={{ fontSize:13 }}>No rounds yet — tap ADD to create one</p>
            </div>
          )}
          {rounds.map((round, roundIdx) => {
            const rColor = round.color || C.accent;
            const isOpen = expRounds[round.id] !== false; // default open
            const entryCount = (round.entries||[]).length;
            return (
              <div key={round.id} style={{ position:"relative", marginBottom:6, borderRadius:8, overflow:"hidden", background:C.surface, borderLeft:`4px solid ${rColor}` }}>
                {/* Round header */}
                <div style={{ display:"flex", alignItems:"center", padding:"14px 16px", gap:6 }}>
                  {/* Chevron toggle */}
                  {!reorderRounds&&<button onClick={()=>setExpRounds(p=>({...p,[round.id]:!isOpen}))}
                    style={{ background:"none", border:"none", cursor:"pointer", display:"flex", padding:0, flexShrink:0 }}>
                    <Ic n={isOpen?"chevD":"chevR"} s={13} c={C.textMuted}/>
                  </button>}
                  {/* Title */}
                  <span onClick={()=>{ if(!reorderRounds) setEditRound(round); }}
                    style={{ flex:1, fontWeight:800, fontSize:16, color:C.brown, fontFamily:FONT_DISPLAY, letterSpacing:1.2, cursor:reorderRounds?"default":"pointer" }}>
                    {round.name}
                  </span>
                  {!reorderRounds&&<span style={{ fontSize:13, color:C.textMuted, fontWeight:400, fontFamily:FONT_DISPLAY, flexShrink:0 }}>
                    {entryCountStr(entryCount)}
                  </span>}
                  {!reorderRounds&&<button onClick={()=>setEditRound(round)}
                    style={{ background:"none", border:"none", cursor:"pointer", padding:3, display:"flex", flexShrink:0 }}>
                    <Ic n="edit" s={12} c={C.textMuted}/>
                  </button>}
                  {!reorderRounds&&<button onClick={()=>deleteRound(round.id)}
                    style={{ background:"none", border:"none", cursor:"pointer", padding:3, display:"flex", flexShrink:0 }}>
                    <Ic n="x" s={13} c={C.textMuted}/>
                  </button>}
                  {reorderRounds&&<div style={{ display:"flex", flexDirection:"column", gap:2, flexShrink:0 }}>
                    <button onClick={()=>moveRoundUp(roundIdx)} disabled={roundIdx===0}
                      style={{ width:26, height:26, borderRadius:6, border:`1px solid ${C.border}`, background:C.bg,
                        cursor:roundIdx===0?"default":"pointer", color:roundIdx===0?C.border:C.accent,
                        fontSize:14, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>▲</button>
                    <button onClick={()=>moveRoundDown(roundIdx)} disabled={roundIdx===rounds.length-1}
                      style={{ width:26, height:26, borderRadius:6, border:`1px solid ${C.border}`, background:C.bg,
                        cursor:roundIdx===rounds.length-1?"default":"pointer", color:roundIdx===rounds.length-1?C.border:C.accent,
                        fontSize:14, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>▼</button>
                  </div>}
                </div>
                {/* Entries — expanded by default */}
                {isOpen && (round.entries||[]).map(entry => {
                  const moveItems = (entry.items||[]).filter(it => it.type === "move");
                  return (
                    <div key={entry.id}
                      style={{ borderTop:`1px solid ${C.borderLight}`, padding:"6px 12px 6px 28px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                        <Ic n="chevR" s={10} c={C.textMuted}/>
                        <span style={{ fontSize:11, fontWeight:700, color:C.brownMid, fontFamily:FONT_DISPLAY, flex:1 }}>{entry.name}</span>
                        <span style={{ fontSize:10, color:C.textMuted }}>{(entry.items||[]).length} items</span>
                      </div>
                      {moveItems.length >= 2 && <ArcVis items={entry.items}/>}
                      {(() => { const fb = getArcFeedback(entry.items); return fb ? <div style={{ fontSize:10, color:C.textSec, fontStyle:"italic", padding:"2px 0 4px" }}>{fb}</div> : null; })()}
                      {(entry.items||[]).map((item,i) => {
                        const label = item.type==="move" ? getMove(item.refId)?.name : getSet(item.refId)?.name;
                        if (!label) return null;
                        const tension = getItemTension(item);
                        return (
                          <div key={i} style={{ fontSize:10, color:C.textMuted, paddingLeft:14, paddingTop:2, display:"flex", alignItems:"center", gap:4 }}>
                            <span>·</span>
                            {item.type==="set"&&<span style={{ fontSize:8, background:`${C.blue}22`, color:C.blue, padding:"0 3px", borderRadius:3, fontFamily:FONT_DISPLAY, fontWeight:700 }}>SET</span>}
                            <span style={{ flex:1 }}>{label}</span>
                            {isPremium&&item.type==="move"&&<TensionDots level={tension}
                              onTap={()=>cycleItemTension(round.id, entry.id, i)}
                              onLongPress={()=>resetItemTension(round.id, entry.id, i)}/>}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ── Edit Round full-screen ───────────────────────────────────────────────────
  // EditRoundView is defined as a top-level component below ReadyPage

  // ── Vocab Picker overlay ─────────────────────────────────────────────────────
  const VocabPicker = ({ pickerState }) => {
    const t = useT();
  const { entryId, applyLocal } = pickerState;
    const q = pickerSearch.toLowerCase().trim();
    const toggleSel = (type, refId) => {
      const key = type+":"+refId;
      setPickerSel(p => p.some(i=>i.type+":"+i.refId===key) ? p.filter(i=>i.type+":"+i.refId!==key) : [...p,{type,refId}]);
    };
    const isSelected = (type, refId) => pickerSel.some(i=>i.type===type&&i.refId===refId);
    const confirm = () => {
      if (pickerState.applyLocal) pickerState.applyLocal(entryId, pickerSel);
      setPickerEntry(null);
    };

    return (
      <div style={{ position:"absolute", inset:0, background:C.bg, zIndex:600, display:"flex", flexDirection:"column" }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", background:C.surface, borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
          <button onClick={()=>setPickerEntry(null)} style={{ background:"none", border:"none", cursor:"pointer", color:C.accent, fontSize:13, fontFamily:FONT_DISPLAY, fontWeight:700, padding:0 }}>← Back</button>
          <span style={{ flex:1, fontWeight:900, fontSize:14, letterSpacing:1.5, color:C.brown, fontFamily:FONT_DISPLAY }}>{t("addToEntry")}</span>
          {pickerSel.length>0&&<span style={{ fontSize:11, color:C.accent, fontWeight:700, fontFamily:FONT_DISPLAY }}>{pickerSel.length} selected</span>}
        </div>
        {/* Search */}
        <div style={{ padding:"8px 12px", borderBottom:`1px solid ${C.borderLight}`, flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", background:C.surface, borderRadius:7, padding:"6px 10px", gap:6, border:`1px solid ${q?C.accent:C.border}` }}>
            <Ic n="search" s={13} c={C.textMuted}/>
            <input value={pickerSearch} onChange={e=>setPickerSearch(e.target.value)}
              placeholder={t("searchMovesAndSets")}
              style={{ flex:1, background:"none", border:"none", outline:"none", color:C.text, fontSize:13, fontFamily:"inherit" }}/>
            {pickerSearch&&<button onClick={()=>setPickerSearch("")} style={{ background:"none", border:"none", cursor:"pointer", color:C.textMuted, padding:0, display:"flex" }}><Ic n="x" s={13}/></button>}
          </div>
        </div>
        {/* List */}
        <div style={{ flex:1, overflow:"auto" }}>
          {/* Sets section */}
          {sets.filter(s=>!q||s.name.toLowerCase().includes(q)).length>0&&(
            <div>
              <div style={{ padding:"6px 12px", background:C.surfaceAlt, borderBottom:`1px solid ${C.border}` }}>
                <span style={{ fontSize:10, fontWeight:800, letterSpacing:1.5, color:C.textMuted, fontFamily:FONT_DISPLAY }}>{t("sets")}</span>
              </div>
              {sets.filter(s=>!q||s.name.toLowerCase().includes(q)).map(s => {
                const sel = isSelected("set", s.id);
                return (
                  <button key={s.id} onClick={()=>toggleSel("set",s.id)}
                    style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"10px 14px",
                      background: sel ? `${C.accent}12` : "transparent",
                      border:"none", borderBottom:`1px solid ${C.borderLight}`, cursor:"pointer", textAlign:"left" }}>
                    <div style={{ width:16, height:16, borderRadius:4, border:`2px solid ${sel?C.accent:C.border}`,
                      background:sel?C.accent:"transparent", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                      {sel&&<Ic n="check" s={10} c="#fff"/>}
                    </div>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:s.color||C.blue, flexShrink:0 }}/>
                    <span style={{ flex:1, fontSize:13, color:C.text }}>{s.name}</span>
                    <span style={{ fontSize:10, background:`${C.blue}22`, color:C.blue, padding:"1px 5px", borderRadius:4, fontFamily:FONT_DISPLAY, fontWeight:700 }}>SET</span>
                    {showMastery&&<span style={{ fontSize:11, color:masteryColorLocal(dm(s)), fontWeight:700 }}>{dm(s)}%</span>}
                  </button>
                );
              })}
            </div>
          )}
          {/* Moves by category */}
          {allCats.map(cat => {
            const catMoves = moves.filter(m=>m.category===cat&&(!q||m.name.toLowerCase().includes(q)));
            if(catMoves.length===0) return null;
            return (
              <div key={cat}>
                <div style={{ padding:"6px 12px", background:C.surfaceAlt, borderBottom:`1px solid ${C.border}` }}>
                  <span style={{ fontSize:10, fontWeight:800, letterSpacing:1.5, color:C.textMuted, fontFamily:FONT_DISPLAY, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", display:"block" }}>{cat.toUpperCase()}</span>
                </div>
                {catMoves.map(m => {
                  const sel = isSelected("move", m.id);
                  return (
                    <button key={m.id} onClick={()=>toggleSel("move",m.id)}
                      style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"10px 14px",
                        background: sel ? `${C.accent}12` : "transparent",
                        border:"none", borderBottom:`1px solid ${C.borderLight}`, cursor:"pointer", textAlign:"left" }}>
                      <div style={{ width:16, height:16, borderRadius:4, border:`2px solid ${sel?C.accent:C.border}`,
                        background:sel?C.accent:"transparent", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                        {sel&&<Ic n="check" s={10} c="#fff"/>}
                      </div>
                      <div style={{ width:8, height:8, borderRadius:"50%", background:masteryColorLocal(dm(m)), flexShrink:0 }}/>
                      <span style={{ flex:1, fontSize:13, color:C.text }}>{m.name}</span>
                      {showMastery&&<span style={{ fontSize:11, color:masteryColorLocal(dm(m)), fontWeight:700 }}>{dm(m)}%</span>}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
        {/* Confirm bar */}
        <div style={{ padding:"10px 14px", borderTop:`1px solid ${C.border}`, background:C.surface, flexShrink:0 }}>
          <button onClick={confirm} disabled={pickerSel.length===0}
            style={{ width:"100%", padding:"11px", background:pickerSel.length>0?C.accent:C.border, border:"none", borderRadius:8,
              color:C.bg, fontSize:13, fontWeight:900, fontFamily:FONT_DISPLAY, letterSpacing:1.5, cursor:pickerSel.length>0?"pointer":"default",
              opacity: pickerSel.length>0?1:0.5 }}>
            ADD {pickerSel.length>0?pickerSel.length+" SELECTED":"TO ENTRY"}
          </button>
        </div>
      </div>
    );
  };

  // ── Sets detail modal ─────────────────────────────────────────────────────────
  const SetDetailModalInner = ({ set, onClose }) => {
    const [f, setF] = useState({ name:set.name, color:set.color||C.blue, notes:set.notes||"", mastery:set.mastery||0 });
    const save = () => { updateSet(set.id, f); onClose(); };
    return (
      <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:800, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
        <div style={{ background:C.bg, borderRadius:16, width:"100%", maxWidth:400, overflow:"hidden", boxShadow:"0 24px 80px rgba(0,0,0,0.4)" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 16px", background:C.surface, borderBottom:`1px solid ${C.border}` }}>
            <span style={{ fontWeight:900, fontSize:16, letterSpacing:2, fontFamily:FONT_DISPLAY, color:C.text }}>{t("editSet")}</span>
            <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", padding:2 }}><Ic n="x" s={18} c={C.textMuted}/></button>
          </div>
          <div style={{ padding:"16px 16px 20px" }}>
            <label style={{ fontSize:11, fontWeight:800, letterSpacing:1.5, color:C.textMuted, fontFamily:FONT_DISPLAY, display:"block", marginBottom:5 }}>{t("name")}</label>
            <input value={f.name} onChange={e=>setF(p=>({...p,name:e.target.value}))}
              style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 12px", color:C.text, fontSize:14, outline:"none", boxSizing:"border-box", fontFamily:FONT_BODY, marginBottom:14 }}/>
            <label style={{ fontSize:11, fontWeight:800, letterSpacing:1.5, color:C.textMuted, fontFamily:FONT_DISPLAY, display:"block", marginBottom:5 }}>{t("color")}</label>
            <div style={{ display:"flex", gap:8, marginBottom:14 }}>
              {PRESET_COLORS.map(col=>(
                <button key={col} onClick={()=>setF(p=>({...p,color:col}))}
                  style={{ width:24, height:24, borderRadius:"50%", background:col, border:f.color===col?`2px solid ${C.text}`:"2px solid transparent", cursor:"pointer", padding:0 }}/>
              ))}
            </div>
            <label style={{ fontSize:11, fontWeight:800, letterSpacing:1.5, color:C.textMuted, fontFamily:FONT_DISPLAY, display:"block", marginBottom:5 }}>{t("notes")}</label>
            <textarea value={f.notes} onChange={e=>setF(p=>({...p,notes:e.target.value}))} rows={3}
              placeholder={t("describeSet")}
              style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 12px", color:C.text, fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:FONT_BODY, resize:"vertical", marginBottom:14 }}/>
            {showMastery&&(<Fragment>
              <label style={{ fontSize:11, fontWeight:800, letterSpacing:1.5, color:C.textMuted, fontFamily:FONT_DISPLAY, display:"block", marginBottom:5 }}>MASTERY — {f.mastery}%</label>
              <input type="range" min={0} max={100} value={f.mastery} onChange={e=>setF(p=>({...p,mastery:+e.target.value}))}
                style={{ width:"100%", accentColor:C.accent, cursor:"pointer", marginBottom:14 }}/>
            </Fragment>)}
            <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:4 }}>
              <button onClick={onClose} style={{ padding:"9px 18px", borderRadius:8, border:`1px solid ${C.border}`, background:C.surface, color:C.text, cursor:"pointer", fontSize:13, fontWeight:700, fontFamily:FONT_DISPLAY }}>{t("cancel")}</button>
              <button onClick={save} style={{ padding:"9px 18px", borderRadius:8, border:"none", background:C.accent, color:C.bg, cursor:"pointer", fontSize:13, fontWeight:900, fontFamily:FONT_DISPLAY, letterSpacing:0.8 }}>{t("save")}</button>
            </div>
          </div>
        </div>
      </div>
    );
  };


  // ── Sub-tab bar ──────────────────────────────────────────────────────────────
  const subTabs = [["plan",t("plan")],["prep",t("prep")],["freestyle",t("freestyle")],["rivals",t("rivals")]];

  return (
    <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column", position:"relative" }}>
      {/* Sub-tab bar */}
      <div style={{ display:"flex", background:"transparent", flexShrink:0 }}>
        {subTabs.map(([id,label])=>(
          <button key={id} onClick={()=>setBattleTabAndNotify(id)}
            style={{ flex:1, padding:"9px 0", background:"none", border:"none", cursor:"pointer",
              fontSize:14, fontWeight:800, letterSpacing:1.5, fontFamily:FONT_DISPLAY, textTransform:"uppercase",
              color: battleTab===id ? C.text : C.textMuted }}>
            <span style={{ borderBottom: battleTab===id ? `2px solid ${C.accent}` : "2px solid transparent", paddingBottom:3 }}>{label}</span>
          </button>
        ))}
      </div>

      {/* PLAN tab */}
      {battleTab==="plan"&&(
        <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column", position:"relative" }}>
          <PlanView/>
          {editRound&&<EditRoundView round={editRound}
            onSave={updateRound} onClose={()=>setEditRound(null)}
            getMove={getMove} getSet={getSet}
            setPickerEntry={setPickerEntry} setPickerSearch={setPickerSearch} setPickerSel={setPickerSel}
            showMoveCount={showMoveCount}/>}
          {pickerEntry&&<VocabPicker pickerState={pickerEntry}/>}
        </div>
      )}

      {/* PREP tab */}
      {battleTab==="prep"&&(isPremium?<><SectionBrief desc={t("battlePrepBrief")} settings={settings}/><BattlePrepPage battleprep={battleprep} setBattleprep={setBattleprep} moves={moves} sets={sets} addToast={addToast} calendar={calendar} battlePrepSeed={battlePrepSeed} onBattlePrepSeedUsed={onBattlePrepSeedUsed} addCalendarEvent={addCalendarEvent} removeCalendarEvent={removeCalendarEvent} onAddTrigger={prepAddTick} onOpenSharedCalendar={onOpenSharedCalendar}/></>:<div style={{padding:20}}><PremiumGate feature="battlePrep" addToast={addToast}/></div>)}

      {/* FREESTYLE tab */}
      {battleTab==="freestyle"&&<FreestylePage moves={moves} sets={sets} settings={settings} onAddTrigger={freestyleAddTick} addToast={addToast} freestyle={freestyle} onFreestyleChange={onFreestyleChange}/>}

      {/* RIVALS tab */}
      {battleTab==="rivals"&&(isPremium?<><SectionBrief desc={t("rivalsBrief")} settings={settings}/><RivalsPage rivals={rivals||[]} onRivalsChange={onRivalsChange} addToast={addToast} onAddTrigger={rivalsAddTick} addCalendarEvent={addCalendarEvent}/></>:<div style={{padding:20}}><PremiumGate feature="rivals" addToast={addToast}/></div>)}

      {/* Modals */}
      {addingRound&&<NewRoundModal onClose={()=>setAddingRound(false)}
        onConfirm={({name,color,entries})=>{ addRound(name,color,entries); setAddingRound(false); }}/>}
      {addingSet&&<NameModal title="NEW SET" placeholder="e.g. Opening Combo…" onClose={()=>setAddingSet(false)}
        onConfirm={name=>{ addSet(name); setAddingSet(false); }}/>}
      {editSet&&<SetDetailModalInner set={editSet} onClose={()=>setEditSet(null)}/>}
    </div>
  );
};
