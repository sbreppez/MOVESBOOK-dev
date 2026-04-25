import React, { useState, useEffect, useRef } from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { lbl } from '../../constants/styles';
import { Ic } from '../shared/Ic';
import { Modal } from '../shared/Modal';
import { Btn } from '../shared/Btn';
import { useT, usePlural } from '../../hooks/useTranslation';
import { useSettings } from '../../hooks/useSettings';
import { useTrainModal } from '../../hooks/useTrainContext';
import { ensureHttps } from './helpers';
import { TypeChooserModal } from './TypeChooserModal';
import { IdeaTile } from './IdeaTile';
import { HabitsPage } from './HabitsPage';
import { BattlePrepPage } from './BattlePrepPage';
import { todayLocal, toLocalYMD } from '../../utils/dateUtils';

export const IdeasPage = ({ onAddMove, onAddTrigger, ideas, setIdeas, habits=[], setHabits=()=>{}, calendar, onOpenCalendarJournal, battleprep, setBattleprep, moves, sets, addToast, externalTrainSubTab, onTrainSubTabUsed, battlePrepSeed, onBattlePrepSeedUsed, addCalendarEvent, removeCalendarEvent, onSubTabChange, onOpenSharedCalendar }) => {
  const t = useT();
  const { resultCountStr } = usePlural();
  const { settings: ideaSettings } = useSettings();
  const [view,       setView]       = useState("list");
  useEffect(() => { setView("list"); }, []);
  const [typeChooser,setTypeChooser]= useState(false);
  const prevAddTrigger = useRef(onAddTrigger);
  useEffect(()=>{
    if(onAddTrigger !== prevAddTrigger.current && onAddTrigger > 0){
      if(trainTab==="habits") { /* handled by HabitsPage */ }
      else if(trainTab==="prep") { /* prep manages its own flow */ }
      else if(trainTab==="notes") { openModal("note", null, addIdea); }
      else { setTypeChooser(true); }
    }
    prevAddTrigger.current = onAddTrigger;
  // eslint-disable-next-line react-hooks/exhaustive-deps -- ref-compare guard prevents re-fire; trainTab read fresh from closure
  },[onAddTrigger]);
  const { openModal } = useTrainModal();
  const [trainTab,   setTrainTab]   = useState("goals");
  // Report active sub-tab to parent for contextual + menu
  // eslint-disable-next-line react-hooks/exhaustive-deps -- trainTab-only by intent; onSubTabChange should be wrapped in useCallback at parent (deferred)
  useEffect(() => { if (onSubTabChange) onSubTabChange(trainTab); }, [trainTab]);
  // External navigation: Calendar → PREP
  useEffect(() => {
    if (externalTrainSubTab) {
      setTrainTab(externalTrainSubTab);
      if (onTrainSubTabUsed) onTrainSubTabUsed();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- externalTrainSubTab-only by intent; onTrainSubTabUsed call is the consume signal
  }, [externalTrainSubTab]);
  // Auto-link: sync move count to target goals that have autoLink=true
  const { settings: ideaSettings2 } = useSettings();
  // We get moves count from localStorage as a proxy (no prop needed)
  useEffect(() => {
    if (!ideaSettings2.targetAutoLink) return;
    try {
      const m = localStorage.getItem("mb_moves");
      const cnt = m ? JSON.parse(m).length : 0;
      setIdeas(p => p.map(i => (i.type==="target" && i.autoLink) ? {...i, current:cnt} : i));
    } catch {}
  }, [ideaSettings2.targetAutoLink, setIdeas]);
  const [search,     setSearch]     = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [reorderMode, setReorderMode] = useState(false);

  const [confirmDel,  setConfirmDel]  = useState(null); // holds idea to delete
  const [hintDismissed, setHintDismissed] = useState(() => {
    try { return localStorage.getItem("mb_hint_goal_journal") === "1"; } catch { return false; }
  });
  const dismissHint = () => {
    setHintDismissed(true);
    try { localStorage.setItem("mb_hint_goal_journal", "1"); } catch {}
  };
  const [quickLogDismissed, setQuickLogDismissed] = useState(() => {
    try { const st = JSON.parse(localStorage.getItem("mb_settings") || "{}"); return st.quickLogDismissed === todayLocal(); } catch { return false; }
  });
  const dismissQuickLog = () => {
    setQuickLogDismissed(true);
    try { const st = JSON.parse(localStorage.getItem("mb_settings") || "{}"); st.quickLogDismissed = todayLocal(); localStorage.setItem("mb_settings", JSON.stringify(st)); } catch {}
  };

  const addIdea   = (fields) => setIdeas(p=>[...p,{ id:Date.now(), ...fields }]);
  const del       = id => setIdeas(p=>p.filter(i=>i.id!==id));
  const askDelete = (idea) => setConfirmDel(idea);
  const save      = (id, fields) => setIdeas(p=>p.map(i=>i.id===id?{...i,...fields}:i));
  const incrTarget = (id) => setIdeas(p=>p.map(i=>i.id===id?{...i,current:Math.min((i.current||0)+1,i.target||9999)}:i));
  const decrTarget = (id) => setIdeas(p=>p.map(i=>i.id===id?{...i,current:Math.max(0,(i.current||0)-1)}:i));
  const [logEntry,   setLogEntry]   = useState(null); // { id } — which target to log
  const [logText,    setLogText]    = useState("");
  const [logLink,    setLogLink]    = useState("");
  const confirmLogEntry = (id) => {
    // increment always, add journal entry if text provided
    incrTarget(id);
    if (logText.trim()) {
      const entry = { id:Date.now(), date: new Date().toLocaleDateString("en-AU",{day:"2-digit",month:"short",year:"numeric"}), text:logText.trim(), link:ensureHttps(logLink.trim()) };
      setIdeas(p=>p.map(i=>i.id===id?{...i,journal:[entry,...(i.journal||[])]}:i));
    }
    setLogEntry(null); setLogText(""); setLogLink("");
  };
  const dup       = id => { const orig=ideas.find(i=>i.id===id); if(orig) setIdeas(p=>[...p,{...orig,id:Date.now(),title:(orig.title||"")+" (copy)",pinned:false}]); };
  const moveIdeaUp = (idx, list) => {
    if(idx===0) return;
    setIdeas(prev=>{
      // Build new visible order with the swap
      const newList=[...list];
      [newList[idx],newList[idx-1]]=[newList[idx-1],newList[idx]];
      // Rebuild full array: replace visible items in their original positions with new order
      const visibleIds=new Set(list.map(i=>i.id));
      const result=[]; let vi=0;
      prev.forEach(item=>{ if(visibleIds.has(item.id)) result.push(newList[vi++]); else result.push(item); });
      return result;
    });
  };
  const moveIdeaDown = (idx, list) => {
    if(idx===list.length-1) return;
    setIdeas(prev=>{
      const newList=[...list];
      [newList[idx],newList[idx+1]]=[newList[idx+1],newList[idx]];
      const visibleIds=new Set(list.map(i=>i.id));
      const result=[]; let vi=0;
      prev.forEach(item=>{ if(visibleIds.has(item.id)) result.push(newList[vi++]); else result.push(item); });
      return result;
    });
  };
  const changeColor = (id, color) => setIdeas(p=>p.map(i=>i.id===id?{...i,color}:i));
  const togglePin   = (id) => setIdeas(p=>p.map(i=>i.id===id&&i.type!=="goal"?{...i,pinned:!i.pinned}:i));

  const q = search.toLowerCase().trim();
  const base = q ? ideas.filter(i=>(i.title||"").toLowerCase().includes(q)||(i.text||"").toLowerCase().includes(q)) : ideas;
  // In reorder mode use raw order so ▲▼ buttons map correctly; otherwise sort goals first
  const filtered = reorderMode ? base : [
    ...base.filter(i=>i.type==="goal"),
    ...base.filter(i=>i.type!=="goal"&&i.pinned),
    ...base.filter(i=>i.type!=="goal"&&!i.pinned),
  ];

  // Split ideas by type for sub-tabs
  const goals = ideas.filter(i=>i.type==="goal"||i.type==="target");
  const notes = ideas.filter(i=>i.type==="note");

  return (
    <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
      {/* Quick Log banner */}
      {(()=>{
        const todayStr = todayLocal();
        const hasTodayTraining = (calendar?.events||[]).some(e => e.date === todayStr && e.type === "training");
        if (hasTodayTraining || quickLogDismissed || !onOpenCalendarJournal) return null;
        return (
          <div style={{ margin:"0 12px 6px", display:"flex", alignItems:"center", gap:8,
            background:C.surfaceAlt, borderRadius:10, padding:"10px 14px" }}>
            <button onClick={onOpenCalendarJournal}
              style={{ flex:1, display:"flex", alignItems:"center", gap:8, background:"none",
                border:"none", cursor:"pointer", padding:0, textAlign:"left" }}>
              <Ic n="target" s={16}/>
              <span style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:13, color:C.text,
                letterSpacing:0.3 }}>{t("logTodaysSession")}</span>
              <Ic n="chevR" s={14} c={C.textMuted}/>
            </button>
            <button onClick={dismissQuickLog}
              style={{ background:"none", border:"none", cursor:"pointer", padding:2, display:"flex", flexShrink:0 }}>
              <Ic n="x" s={14} c={C.textMuted}/>
            </button>
          </div>
        );
      })()}
      {/* Battle Prep banners — reminder takes priority over countdown */}
      {(()=>{
        const plans = battleprep?.plans || [];
        if (!plans.length) return null;
        const todayStr = todayLocal();

        // 1. Check for unreflected past battles (reminder banner)
        let reminderBattle = null, reminderPlan = null;
        for (const plan of plans) {
          for (const b of (plan.battles || [])) {
            if (b.date < todayStr && !b.reflectionLogged
              && (b.reminderDismissCount || 0) < 3
              && b.lastDismissDate !== todayStr) {
              if (!reminderBattle || b.date > reminderBattle.date) {
                reminderBattle = b; reminderPlan = plan;
              }
            }
          }
        }

        if (reminderBattle && reminderPlan) {
          const battleName = reminderBattle.eventName || reminderPlan.eventName || reminderPlan.planName;
          const label = (t("howDidBattleGo") || "How did {name} go?").replace("{name}", battleName || t("yourBattle") || "your battle");
          return (
            <div style={{ margin:"0 12px 8px", display:"flex", alignItems:"center", gap:8,
              background:`${C.accent}18`, border:`1px solid ${C.accent}40`, borderRadius:10, padding:"12px 14px",
              width:"calc(100% - 24px)" }}>
              <button onClick={()=>{ setTrainTab("prep"); }}
                style={{ flex:1, display:"flex", alignItems:"center", gap:8, background:"none",
                  border:"none", cursor:"pointer", padding:0, textAlign:"left" }}>
                <Ic n="swords" s={16}/>
                <span style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:13, color:C.text, letterSpacing:0.3 }}>
                  {label}
                </span>
              </button>
              <button onClick={()=>{
                setBattleprep(prev => ({
                  ...prev,
                  plans: (prev.plans || []).map(p => {
                    if (p.id !== reminderPlan.id) return p;
                    return { ...p, battles: (p.battles || []).map(b => {
                      if (b.id !== reminderBattle.id) return b;
                      return { ...b, lastDismissDate: todayStr, reminderDismissCount: (b.reminderDismissCount || 0) + 1 };
                    })};
                  }),
                }));
              }}
                style={{ background:"none", border:"none", cursor:"pointer", padding:2, display:"flex", flexShrink:0 }}>
                <Ic n="x" s={14} c={C.textMuted}/>
              </button>
            </div>
          );
        }

        // 2. Countdown banner (only if no reminder showing)
        let nearest = null, nearestPlan = null;
        for (const plan of plans) {
          const fb = (plan.battles||[]).filter(b=>b.date>=todayStr).sort((a,b)=>a.date.localeCompare(b.date));
          if (fb.length && (!nearest || fb[0].date < nearest.date)) { nearest = fb[0]; nearestPlan = plan; }
        }
        if (!nearest || !nearestPlan) return null;
        const daysLeft = Math.ceil((new Date(nearest.date+" 00:00:00") - new Date(todayStr+" 00:00:00")) / 86400000);
        let sessionsLeft = 0;
        const td = nearestPlan.trainingDays || [];
        for (let d = new Date(todayStr); d <= new Date(nearest.date); d.setDate(d.getDate()+1)) {
          const ds = toLocalYMD(d);
          const override = (nearestPlan.customDayOverrides||{})[ds];
          if (override === "rest") continue;
          if (override === "training" || td.includes(d.getDay())) {
            if (ds !== nearest.date) sessionsLeft++;
          }
        }
        const presetColors = { smoke:"#e53935", prove:"#ffa726", mark:"#1db954", custom:"#7a7a7a" };
        const pc = presetColors[nearestPlan.preset] || C.textMuted;
        const displayName = nearestPlan.eventName || nearestPlan.planName;
        return (
          <button onClick={()=>{ setTrainTab("prep"); }}
            style={{ margin:"0 12px 8px", display:"flex", alignItems:"center", gap:8,
              background:`${pc}18`, border:`1px solid ${pc}40`, borderRadius:10, padding:"10px 14px",
              cursor:"pointer", textAlign:"left", width:"calc(100% - 24px)" }}>
            <Ic n="swords" s={16}/>
            <span style={{ flex:1, fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:11, letterSpacing:0.5 }}>
              <span style={{ color:C.text }}>{displayName}</span>
              <span style={{ color:C.textSec }}> {"\u2014"} </span>
              <span style={{ color:C.textSec }}><span style={{ color:C.text, fontWeight:900 }}>{daysLeft}</span> {t("daysLeft")} (<span style={{ color:C.red, fontWeight:900 }}>{sessionsLeft} {t("daysTraining")}</span>)</span>
              {plans.length > 1 && <span style={{ color:C.textMuted, fontSize:10 }}> +{plans.length - 1}</span>}
            </span>
            <Ic n="chevR" s={14} c={C.textMuted}/>
          </button>
        );
      })()}
      {/* Sub-tab nav */}
      <div style={{ display:"flex", background:C.surface, borderBottom:`2px solid ${C.border}`, flexShrink:0, alignItems:"stretch" }}>
        {(()=>{
          const order = (ideaSettings.trainTabOrder||["goals","habits","notes","prep"]);
          const planCount = battleprep?.plans?.length || 0;
          const tabDefs = { goals:["goals","GOALS",goals.length], notes:["notes","NOTES",notes.length], habits:["habits","HABITS",null], prep:["prep","PREP",planCount||null] };
          return order.map(tabId => tabDefs[tabId]||tabDefs.goals);
        })().map(([id,label,count])=>{
          const on = trainTab===id;
          return (
            <button key={id} onClick={()=>setTrainTab(id)}
              style={{ flex:1, padding:"9px 4px", border:"none", cursor:"pointer",
                background: "none",
                color: on ? C.text : C.textMuted,
                fontSize:11, fontWeight:800, letterSpacing:1, fontFamily:FONT_DISPLAY,
                display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}>
              <span style={{ borderBottom:`2px solid ${on?C.accent:"transparent"}`, paddingBottom:3 }}>{label}</span>
              {count==="active"&&<div style={{ width:6, height:6, borderRadius:"50%", background:C.accent, flexShrink:0 }}/>}
              {count!==null&&count!=="active"&&<span style={{ fontSize:10, color:on?C.text:C.textMuted,
                background:C.surfaceAlt, borderRadius:10, padding:"0 5px" }}>{count}</span>}
            </button>
          );
        })}
        {/* Habit completion indicator — done today / total */}
        {(()=>{
          if (!habits.length) return null;
          const today = todayLocal();
          const doneToday = habits.filter(h => (h.checkIns||[]).includes(today)).length;
          const allOn = doneToday === habits.length;
          const someOn = doneToday > 0;
          return (
            <button onClick={()=>setTrainTab("habits")}
              style={{ padding:"0 12px", border:"none", cursor:"pointer", background:"transparent",
                display:"flex", alignItems:"center", gap:4, flexShrink:0,
                borderBottom:`3px solid transparent` }}
              title={`${doneToday} of ${habits.length} habits done today`}>
              <span style={{ fontSize: allOn ? 18 : 15,
                opacity: someOn ? 1 : 0.35, lineHeight:1 }}>{allOn?"✅":"✓"}</span>
              <span style={{ fontSize:11, fontWeight:900, fontFamily:FONT_DISPLAY,
                color: allOn ? C.green : someOn ? C.textSec : C.textMuted }}>
                {doneToday}/{habits.length}
              </span>
            </button>
          );
        })()}
      </div>
      {/* Search + view toggle (only for goals/notes) */}
      {(trainTab==="goals"||trainTab==="notes")&&<div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"6px 14px", borderBottom:`1px solid ${C.borderLight}`, background:C.surface, flexShrink:0 }}>
        <span style={{ fontSize:11, fontWeight:700, letterSpacing:1.5, color:C.textMuted, fontFamily:FONT_DISPLAY }}>
          {trainTab==="goals"?"GOALS":"NOTES"} · {trainTab==="goals"?goals.length:notes.length}
        </span>
        <div style={{ display:"flex", gap:3 }}>
          {!reorderMode&&<button onClick={()=>{ setShowSearch(s=>!s); setSearch(""); }}
            style={{ background:"none", border:"none", cursor:"pointer", padding:4, color:showSearch?C.accent:C.textMuted }}>
            <Ic n="search" s={16}/>
          </button>}
          {!reorderMode&&<button onClick={()=>setView(v=>v==="list"?"tiles":"list")}
            style={{ background:"none", border:"none", cursor:"pointer", padding:4, color:C.textMuted }}>
            <Ic n={view==="list"?"grid":"list"} s={16}/>
          </button>}
          <button onClick={()=>{ setReorderMode(r=>!r); setSearch(""); setShowSearch(false); }}
            style={{ background:reorderMode?C.accent:"none", border:"none", cursor:"pointer", padding:"4px 8px", borderRadius:5,
              color:reorderMode?C.bg:C.textMuted, fontSize:13, fontWeight:800, fontFamily:FONT_DISPLAY, letterSpacing:1 }}>
            {reorderMode?"DONE":"⇅"}
          </button>
        </div>
      </div>}
      {trainTab==="habits" && <HabitsPage onAddTrigger={trainTab==="habits"?onAddTrigger:null} habits={habits} setHabits={setHabits}/>}
      {trainTab==="prep" && <BattlePrepPage battleprep={battleprep} setBattleprep={setBattleprep} moves={moves} sets={sets} addToast={addToast} calendar={calendar} battlePrepSeed={battlePrepSeed} onBattlePrepSeedUsed={onBattlePrepSeedUsed} addCalendarEvent={addCalendarEvent} removeCalendarEvent={removeCalendarEvent} onAddTrigger={trainTab==="prep"?onAddTrigger:null} onOpenSharedCalendar={onOpenSharedCalendar}/>}
      {(trainTab==="goals"||trainTab==="notes")&&showSearch&&(
        <div style={{ padding:"6px 14px", background:C.surface, borderBottom:`1px solid ${C.borderLight}` }}>
          <div style={{ display:"flex", alignItems:"center", background:C.bg, borderRadius:7, padding:"5px 10px", gap:6, border:`1px solid ${search?C.accent:C.border}` }}>
            <Ic n="search" s={13} c={C.textMuted}/>
            <input autoFocus value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…"
              style={{ flex:1, background:"none", border:"none", outline:"none", color:C.text, fontSize:13, fontFamily:"inherit" }}/>
            {search&&<button onClick={()=>setSearch("")} style={{ background:"none", border:"none", cursor:"pointer", color:C.textMuted, padding:0, display:"flex" }}><Ic n="x" s={13}/></button>}
          </div>
          {search&&<div style={{ fontSize:11, color:C.textMuted, marginTop:4 }}>{resultCountStr(filtered.length)}</div>}
        </div>
      )}
      {(trainTab==="goals"||trainTab==="notes")&&<div style={{ flex:1, overflow:"auto", padding:10, paddingBottom:76 }}>
        <div
          style={view==="tiles"
            ? {display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,minWidth:0}
            : {display:"flex",flexDirection:"column",gap:6}}
        >
          {(()=>{ const visibleIdeas = filtered.filter(i=>trainTab==="goals"?(i.type==="goal"||i.type==="target"):i.type==="note"); return visibleIdeas.map((idea, idx) => (
            <div key={idea.id} style={{ position:"relative", minWidth:0, overflow:"visible" }}>
              {reorderMode&&(
                <div style={{ position:"absolute", right:6, top:"50%", transform:"translateY(-50%)", zIndex:10,
                  display:"flex", flexDirection:"column", gap:2 }}>
                  <button onClick={()=>moveIdeaUp(idx,visibleIdeas)} disabled={idx===0}
                    style={{ width:26, height:26, borderRadius:6, border:`1px solid ${C.border}`, background:C.bg,
                      cursor:idx===0?"default":"pointer", color:idx===0?C.border:C.accent,
                      fontSize:14, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>▲</button>
                  <button onClick={()=>moveIdeaDown(idx,visibleIdeas)} disabled={idx===visibleIdeas.length-1}
                    style={{ width:26, height:26, borderRadius:6, border:`1px solid ${C.border}`, background:C.bg,
                      cursor:idx===visibleIdeas.length-1?"default":"pointer", color:idx===visibleIdeas.length-1?C.border:C.accent,
                      fontSize:14, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>▼</button>
                </div>
              )}
              <IdeaTile
                idea={idea}
                viewMode={reorderMode?"list":view}
                searchQuery={search}
                onEdit={()=>{ if(!reorderMode) openModal(idea.type, idea, fields=>save(idea.id,fields)); }}
                onDelete={()=>askDelete(idea)}
                onDuplicate={()=>dup(idea.id)}
                onAddToMove={text=>onAddMove(text)}
                onChangeColor={col=>changeColor(idea.id,col)}
                onTogglePin={()=>togglePin(idea.id)}
                onIncrTarget={()=>incrTarget(idea.id)}
                onDecrTarget={()=>decrTarget(idea.id)}
                onShowJournalHint={!hintDismissed && !reorderMode && (idea.type==="goal"||idea.type==="target")}
                onDismissHint={dismissHint}
                draggable={false}/>
            </div>
          )); })()}
          {view!=="tiles"&&!reorderMode&&filtered.filter(i=>trainTab==="goals"?(i.type==="goal"||i.type==="target"):i.type==="note").length>0&&(
            <div style={{ minHeight:36 }}/>
          )}
        </div>
        {ideas.length===0&&<div style={{ textAlign:"center", padding:40, color:C.textMuted }}><div style={{ marginBottom:8 }}><Ic n="paperclip" s={28} c={C.textMuted}/></div><p style={{fontSize:13}}>{t("emptyHintNotes")}</p></div>}
        {filtered.length===0&&search&&<div style={{ textAlign:"center", padding:30, color:C.textMuted }}><p style={{fontSize:13}}>{t("noResultsFor")} &quot;{search}&quot;</p></div>}
      </div>
      }
      {typeChooser&&<TypeChooserModal onClose={()=>setTypeChooser(false)} onChoose={t=>{ setTypeChooser(false); setTrainTab((t==="goal"||t==="target")?"goals":"notes"); openModal(t, null, addIdea); }}/>}
      {logEntry&&(
        <Modal title={t("logProgress")} onClose={()=>{ confirmLogEntry(logEntry.id); }}>
          <div style={{ marginBottom:6 }}>
            <div style={{ fontSize:13, fontWeight:800, color:C.text, fontFamily:FONT_DISPLAY, marginBottom:2 }}>{logEntry.title}</div>
            <div style={{ fontSize:11, color:C.textMuted, marginBottom:14 }}>
              {(logEntry.current||0)+1} / {logEntry.target} {logEntry.unit} after this
            </div>
          </div>
          <div style={{ marginBottom:12 }}>
            <label style={{ ...lbl(), fontSize:11, letterSpacing:1.5 }}>ADD A NOTE (optional)</label>
            <textarea value={logText} onChange={e=>setLogText(e.target.value)} rows={3} autoFocus
              placeholder={`e.g. "Finally nailed the six step — 20 clean reps today"`}
              style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8,
                padding:"9px 12px", color:C.text, fontSize:13, outline:"none", fontFamily:FONT_BODY,
                boxSizing:"border-box", resize:"none", lineHeight:1.5, marginTop:4 }}/>
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={{ ...lbl(), fontSize:11, letterSpacing:1.5 }}>REFERENCE LINK (optional)</label>
            <input value={logLink} onChange={e=>setLogLink(e.target.value)} placeholder="https://youtube.com/…"
              style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8,
                padding:"9px 12px", color:C.text, fontSize:13, outline:"none", fontFamily:FONT_BODY, boxSizing:"border-box", marginTop:4 }}/>
          </div>
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
            <Btn variant="secondary" onClick={()=>{ confirmLogEntry(logEntry.id); }}>Skip note</Btn>
            <Btn onClick={()=>confirmLogEntry(logEntry.id)}>+ Log {(logEntry.current||0)+1}</Btn>
          </div>
        </Modal>
      )}
      {confirmDel&&(
        <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.6)", zIndex:4000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div style={{ background:C.bg, border:`2px solid ${C.border}`, borderRadius:14, padding:24, width:"100%" }}>
            <div style={{ fontWeight:800, fontSize:16, letterSpacing:2, color:C.brown, fontFamily:FONT_DISPLAY, marginBottom:12 }}>
              {confirmDel.type==="goal"?t("deleteGoal"):t("deleteNote")}
            </div>
            <p style={{ color:C.textSec, marginBottom:20, lineHeight:1.6 }}>
              Delete <strong style={{color:C.text}}>{confirmDel.title}</strong>? This cannot be undone.
            </p>
            <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
              <Btn variant="secondary" onClick={()=>setConfirmDel(null)}>Keep it</Btn>
              <Btn variant="danger" onClick={()=>{ del(confirmDel.id); setConfirmDel(null); }}>{t("delete")}</Btn>
            </div>
          </div>
        </div>
      )}
      {/* NoteModal, GoalModal, AddIdeaModal are rendered at App level via TrainModalCtx */}
    </div>
  );
};
