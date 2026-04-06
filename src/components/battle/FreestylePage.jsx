import { useState, useEffect, useRef } from 'react';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { PRESET_COLORS } from '../../constants/colors';
import { CAT_COLORS } from '../../constants/categories';
import { masteryColor } from '../../constants/styles';
import { computeDecay } from '../../utils/masteryDecay';
import { lbl } from '../../constants/styles';
import { Ic } from '../shared/Ic';
import { Btn } from '../shared/Btn';
import { Modal } from '../shared/Modal';
import { useT } from '../../hooks/useTranslation';
import { usePlural } from '../../hooks/useTranslation';
import { useSettings } from '../../hooks/useSettings';

export const FreestylePage = ({ moves, sets=[], settings={}, onAddTrigger, addToast, freestyle, onFreestyleChange }) => {
  const t = useT();
  const { moveCountStr } = usePlural();
  const { C } = useSettings();
  const showMastery   = settings.showMastery  !== false;
  const showMoveCount = settings.showMoveCount !== false;
  const dm = m => computeDecay(m, settings.decaySensitivity).displayMastery;
  const [reorderMode, setReorderMode] = useState(false);

  // ── Trust Mode ──
  const trustMode = freestyle?.trustMode || false;
  const [trustNote, setTrustNote] = useState("");
  const [revealing, setRevealing] = useState(false);
  const revealTimerRef = useRef(null);
  const trustTouchRef = useRef(null);

  useEffect(() => () => { if(revealTimerRef.current) clearTimeout(revealTimerRef.current); }, []);

  const toggleTrust = () => {
    const next = !trustMode;
    if (onFreestyleChange) onFreestyleChange(prev => ({ ...prev, trustMode: next }));
    if (next) {
      try {
        const rm = JSON.parse(localStorage.getItem("mb_reminders") || "{}");
        if (rm.items?.length > 0) setTrustNote(rm.items[Math.floor(Math.random() * rm.items.length)].text);
        else setTrustNote("");
      } catch { setTrustNote(""); }
    }
    setRevealing(false);
    if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
  };

  const handleReveal = () => {
    setRevealing(true);
    if (addToast) addToast({ icon: "sparkles", title: t("trustYourPreparation") });
    revealTimerRef.current = setTimeout(() => setRevealing(false), 5000);
  };

  const handleTrustTouchStart = (e) => {
    trustTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const handleTrustTouchEnd = (e) => {
    if (!trustTouchRef.current) return;
    const dx = e.changedTouches[0].clientX - trustTouchRef.current.x;
    const dy = e.changedTouches[0].clientY - trustTouchRef.current.y;
    if (Math.abs(dx) > Math.abs(dy) && dx > 50) {
      const first = toUse.find(i => !i.checked);
      if (first) {
        setToUse(p => p.map(i => i.id === first.id ? { ...i, checked: true } : i));
        try { navigator.vibrate?.(10); } catch {}
      }
    }
    trustTouchRef.current = null;
  };
  const [toUse,        setToUse]        = useState(() => {
    try { const s = localStorage.getItem("mb_freestyle_list"); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [usedOpen,     setUsedOpen]     = useState(true);
  const [dragging,     setDragging]     = useState(null);
  const [dropping,     setDropping]     = useState(false);
  const [confirmReset,      setConfirmReset]      = useState(false);
  const [showSaveList,      setShowSaveList]      = useState(false);
  const [showLoadList,      setShowLoadList]      = useState(false);
  const [saveListName,      setSaveListName]      = useState("");
  const [confirmLoadList,   setConfirmLoadList]   = useState(null);
  const [confirmDeleteList, setConfirmDeleteList] = useState(null);
  const [savedLists, setSavedLists] = useState(() => {
    try { const s = localStorage.getItem("mb_freestyle_saved"); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  useEffect(() => {
    try { localStorage.setItem("mb_freestyle_saved", JSON.stringify(savedLists)); } catch {}
  }, [savedLists]);

  const saveList = () => {
    if (!saveListName.trim()) return;
    const entry = { id:Date.now(), name:saveListName.trim(),
      savedAt: new Date().toLocaleDateString("en-AU",{day:"2-digit",month:"short",year:"numeric"}),
      items: JSON.parse(JSON.stringify(toUse)) };
    setSavedLists(p=>[...p, entry]);
    setSaveListName(""); setShowSaveList(false);
  };
  const loadList = (entry) => {
    setToUse(JSON.parse(JSON.stringify(entry.items)));
    setConfirmLoadList(null); setShowLoadList(false);
  };
  const deleteList = (id) => {
    setSavedLists(p=>p.filter(l=>l.id!==id));
    setConfirmDeleteList(null);
  };
  const [pickerOpen,   setPickerOpen]   = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerSel,    setPickerSel]    = useState([]);
  const [expCats,      setExpCats]      = useState({});
  const toUseDragItem = useRef(null);
  const [toUseDragOver, setToUseDragOver] = useState(null);

  const getMoveById = id => moves.find(m=>m.id===id);
  const getSetById  = id => sets.find(s=>s.id===id);
  const allCats = [...new Set(moves.map(m=>m.category))].sort();
  useEffect(() => {
    try { localStorage.setItem("mb_freestyle_list", JSON.stringify(toUse)); } catch {}
  }, [toUse]);

  const handleToUseReorderDrop = toIdx => {
    if (toUseDragItem.current===null||toUseDragItem.current===toIdx) { setToUseDragOver(null); toUseDragItem.current=null; return; }
    const uncheckedItems = toUse.filter(i=>!i.checked);
    const checkedItems   = toUse.filter(i=>i.checked);
    const arr = [...uncheckedItems];
    const [moved] = arr.splice(toUseDragItem.current, 1);
    const adj = toUseDragItem.current < toIdx ? toIdx-1 : toIdx;
    arr.splice(adj, 0, moved);
    setToUse([...arr, ...checkedItems]);
    toUseDragItem.current=null; setToUseDragOver(null);
  };

  const addToUse = (refId, type="move") => {
    if (toUse.find(i=>i.refId===refId)) return;
    setToUse(p=>[...p, { id:Date.now(), refId, type, checked:false }]);
  };
  const toggle     = (id) => setToUse(p=>p.map(i=>i.id===id ? {...i, checked:!i.checked} : i));
  const removeItem = (id) => setToUse(p=>p.filter(i=>i.id!==id));
  const moveFreestyleUp   = (idx) => { setToUse(prev=>{ const unc=prev.filter(i=>!i.checked); const chk=prev.filter(i=>i.checked); if(idx===0) return prev; const n=[...unc]; [n[idx],n[idx-1]]=[n[idx-1],n[idx]]; return [...n,...chk]; }); };
  const moveFreestyleDown = (idx, len) => { setToUse(prev=>{ const unc=prev.filter(i=>!i.checked); const chk=prev.filter(i=>i.checked); if(idx>=unc.length-1) return prev; const n=[...unc]; [n[idx],n[idx+1]]=[n[idx+1],n[idx]]; return [...n,...chk]; }); };
  const reset      = ()  => { setToUse([]); setConfirmReset(false); };

  // Picker helpers
  const isInList   = (refId) => !!toUse.find(i=>i.refId===refId);
  const isSelected = (refId) => pickerSel.includes(refId);
  const togglePick = (refId) => setPickerSel(p => p.includes(refId) ? p.filter(x=>x!==refId) : [...p,refId]);
  const confirmPick = () => {
    const now = Date.now();
    const toAddMoves = pickerSel.filter(id=>moves.find(m=>m.id===id) && !toUse.find(i=>i.refId===id));
    const toAddSets  = pickerSel.filter(id=>sets.find(s=>s.id===id)  && !toUse.find(i=>i.refId===id));
    const newItems = [
      ...toAddMoves.map((id,i)=>({ id:now+i,       refId:id, type:"move", checked:false })),
      ...toAddSets.map((id,i) =>({ id:now+1000+i,  refId:id, type:"set",  checked:false })),
    ];
    if (newItems.length) setToUse(p=>[...p,...newItems]);
    setPickerOpen(false); setPickerSel([]);
  };
  const openPicker = () => { setPickerSearch(""); setPickerSel([]); setExpCats({}); setPickerOpen(true); };
  useEffect(()=>{ if(onAddTrigger) openPicker(); },[onAddTrigger]);

  // Category select helpers
  const catMoveIds   = cat => moves.filter(m=>m.category===cat).map(m=>m.id);
  const catAvail     = cat => catMoveIds(cat).filter(mid=>!isInList(mid));
  const isCatAll     = cat => catAvail(cat).length > 0 && catAvail(cat).every(mid=>pickerSel.includes(mid));
  const isCatPartial = cat => catAvail(cat).some(mid=>pickerSel.includes(mid)) && !isCatAll(cat);
  const toggleCat    = cat => {
    const avail = catAvail(cat);
    if (isCatAll(cat)) setPickerSel(p=>p.filter(id=>!avail.includes(id)));
    else setPickerSel(p=>[...new Set([...p, ...avail])]);
  };
  const allAvailMoveIds = moves.filter(m=>!isInList(m.id)).map(m=>m.id);
  const allAvailSetIds  = sets.filter(s=>!isInList(s.id)).map(s=>s.id);
  const allAvailIds = [...allAvailMoveIds, ...allAvailSetIds];
  const isAllSel    = allAvailIds.length > 0 && allAvailIds.every(id=>pickerSel.includes(id));
  const isAllPart   = allAvailIds.some(id=>pickerSel.includes(id)) && !isAllSel;
  const toggleAll   = () => { if(isAllSel) setPickerSel([]); else setPickerSel(allAvailIds); };

  const q = pickerSearch.toLowerCase().trim();
  const filteredMoves = q ? moves.filter(m=>m.name.toLowerCase().includes(q)||m.category.toLowerCase().includes(q)) : null;

  const unchecked = toUse.filter(i=>!i.checked);
  const checked   = toUse.filter(i=>i.checked);

  return (
    <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column", position:"relative" }}>

      {/* Header */}
      <div style={{ padding:"8px 12px", borderBottom:`1px solid ${C.borderLight}`, background:C.surface,
        flexShrink:0, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <span style={{ fontSize:12, fontWeight:800, letterSpacing:2, color:C.textMuted, fontFamily:FONT_DISPLAY }}>
          {t("toUse")} <span style={{fontWeight:400, letterSpacing:0, fontSize:11}}>· {unchecked.length} left · {checked.length} used</span>
        </span>
        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          {/* Trust Mode */}
          <button onClick={toggleTrust}
            style={{ background:"none", border:`1px solid ${trustMode?C.accent:C.border}`, borderRadius:6,
              cursor:"pointer", color:trustMode?C.accent:C.textMuted, padding:"5px 8px",
              fontSize:11, fontFamily:FONT_DISPLAY, fontWeight:700, letterSpacing:1,
              display:"flex", alignItems:"center", gap:4 }}>
            <Ic n={trustMode?"eyeOff":"eye"} s={13} c={trustMode?C.accent:C.textMuted}/>
            {t("trustMode")}
          </button>
          {/* Reset */}
          <button onClick={()=>setConfirmReset(true)} disabled={toUse.length===0}
            style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:6, cursor:"pointer",
              color:C.textMuted, padding:"5px 11px", fontSize:13, fontFamily:FONT_DISPLAY, fontWeight:700,
              display:"flex", alignItems:"center", opacity:toUse.length===0?0.35:1 }}
            title={t("resetList")}>↺</button>
          {/* Load */}
          <button onClick={()=>setShowLoadList(true)}
            style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:6, cursor:"pointer",
              color:C.textMuted, padding:"5px 11px", fontSize:13, fontFamily:FONT_DISPLAY, fontWeight:700,
              display:"flex", alignItems:"center", gap:4 }}
            title={t("loadSavedList")}>
            📂 {t("loadBtn")}
            {savedLists.length>0&&<span style={{ background:C.accent, color:C.bg, borderRadius:8,
              padding:"0 5px", fontSize:10, fontFamily:FONT_DISPLAY }}>{savedLists.length}</span>}
          </button>
          {/* Save */}
          <button onClick={()=>{ setSaveListName(""); setShowSaveList(true); }}
            style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:6, cursor:"pointer",
              color:C.textMuted, padding:"5px 11px", fontSize:13, fontFamily:FONT_DISPLAY, fontWeight:700,
              display:"flex", alignItems:"center", gap:4 }}
            title={t("saveCurrentList")}>
            💾 {t("saveBtn")}
          </button>
          {/* Reorder */}
          <button onClick={()=>setReorderMode(r=>!r)}
            style={{ background:reorderMode?C.accent:"none", border:`1px solid ${reorderMode?C.accent:C.border}`, borderRadius:6, cursor:"pointer",
              color:reorderMode?C.bg:C.textMuted, padding:"5px 11px", fontSize:13, fontFamily:FONT_DISPLAY, fontWeight:700 }}>
            {reorderMode?t("done"):"⇅"}
          </button>
        </div>
      </div>

      {/* List */}
      <div style={{ flex:1, overflow:"auto", paddingBottom:80 }}
        onDragOver={e=>{ if(!trustMode){ e.preventDefault(); setDropping(true); }}}
        onDragLeave={e=>{ if(!e.currentTarget.contains(e.relatedTarget)) setDropping(false); }}
        onDrop={e=>{ e.preventDefault(); setDropping(false); if(dragging) addToUse(dragging,"move"); setDragging(null); }}>

        {/* ── Trust Mode ON view ── */}
        {trustMode&&!revealing&&(
          <div onTouchStart={handleTrustTouchStart} onTouchEnd={handleTrustTouchEnd}
            style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
              minHeight:"60vh", padding:"40px 20px", userSelect:"none" }}>
            <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:48, color:C.text, lineHeight:1 }}>
              {unchecked.length}
            </div>
            <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:12, color:C.textMuted,
              letterSpacing:2, textTransform:"uppercase", marginTop:6 }}>
              {t("movesReady")}
            </div>
            {trustNote&&(
              <div style={{ fontFamily:FONT_BODY, fontSize:13, color:C.textMuted, fontStyle:"italic",
                textAlign:"center", maxWidth:280, marginTop:20, lineHeight:1.5 }}>
                {trustNote}
              </div>
            )}
            <button onClick={handleReveal}
              style={{ marginTop:32, background:C.surfaceAlt, border:`1px solid ${C.border}`, borderRadius:8,
                padding:"10px 24px", color:C.text, fontSize:12, fontWeight:800, fontFamily:FONT_DISPLAY,
                letterSpacing:2, cursor:"pointer" }}>
              {t("reveal")}
            </button>
          </div>
        )}

        {/* ── Revealing list (5 sec peek) ── */}
        {trustMode&&revealing&&(
          <div style={{ animation:"trustRevealFade 5s ease-in forwards" }}>
            <style>{`@keyframes trustRevealFade { 0%{opacity:1} 80%{opacity:1} 100%{opacity:0} }`}</style>
            {unchecked.map((item)=>{
              const isSet = item.type==="set";
              const m = isSet ? getSetById(item.refId) : getMoveById(item.refId);
              if(!m) return null;
              const dotColor = isSet ? (m.color||C.accent) : masteryColor(dm(m));
              return (
                <div key={item.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px",
                  borderBottom:`1px solid ${C.borderLight}`, background:C.bg }}>
                  <div style={{ width:7, height:7, borderRadius: isSet?"2px":"50%", background:dotColor, flexShrink:0 }}/>
                  <span style={{ flex:1, fontSize:13, color:C.text, fontFamily:FONT_BODY }}>{m.name}</span>
                  {isSet && <span style={{ fontSize:9, fontWeight:800, letterSpacing:1, color:C.textMuted, fontFamily:FONT_DISPLAY, background:C.surface, borderRadius:4, padding:"2px 5px" }}>SET</span>}
                  {!isSet && showMastery&&<span style={{ fontSize:11, color:masteryColor(dm(m)), fontWeight:700, flexShrink:0 }}>{dm(m)}%</span>}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Normal list (Trust Mode OFF) ── */}
        {!trustMode&&dropping&&(
          <div style={{ margin:10, padding:14, border:`2px dashed ${C.accent}`, borderRadius:10, textAlign:"center", color:C.accent, fontSize:13, fontWeight:700 }}>
            Drop to add ↓
          </div>
        )}

        {!trustMode&&toUse.length===0&&!dropping&&(
          <div style={{ textAlign:"center", padding:40, color:C.textMuted }}>
            <div style={{ marginBottom:8 }}><Ic n="target" s={28} c={C.textMuted}/></div>
            <p style={{ fontSize:13 }}>Tap + below to build your freestyle list</p>
          </div>
        )}

        {!trustMode&&<div>
          {unchecked.map((item,idx)=>{
            const isSet = item.type==="set";
            const m = isSet ? getSetById(item.refId) : getMoveById(item.refId);
            if(!m) return null;
            const dotColor = isSet ? (m.color||C.accent) : masteryColor(dm(m));
            return (
              <div key={item.id}
                style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px",
                  borderBottom:`1px solid ${C.borderLight}`, background:C.bg }}>
                {!reorderMode&&<button onClick={()=>toggle(item.id)}
                  style={{ width:20, height:20, borderRadius:4, border:`2px solid ${C.accent}`,
                    background:"transparent", cursor:"pointer", flexShrink:0,
                    display:"flex", alignItems:"center", justifyContent:"center", padding:0 }}>
                </button>}
                <div style={{ width:7, height:7, borderRadius: isSet?"2px":"50%", background:dotColor, flexShrink:0 }}/>
                <span style={{ flex:1, fontSize:13, color:C.text, fontFamily:FONT_BODY }}>{m.name}</span>
                {isSet && <span style={{ fontSize:9, fontWeight:800, letterSpacing:1, color:C.textMuted, fontFamily:FONT_DISPLAY, background:C.surface, borderRadius:4, padding:"2px 5px" }}>SET</span>}
                {!isSet && showMastery&&<span style={{ fontSize:11, color:masteryColor(dm(m)), fontWeight:700, flexShrink:0 }}>{dm(m)}%</span>}
                {!reorderMode&&<button onClick={()=>removeItem(item.id)}
                  style={{ background:"none", border:"none", cursor:"pointer", padding:2, display:"flex", flexShrink:0 }}>
                  <Ic n="x" s={11} c={C.textMuted}/>
                </button>}
                {reorderMode&&<div style={{ display:"flex", flexDirection:"column", gap:2, flexShrink:0 }}>
                  <button onClick={()=>moveFreestyleUp(idx)} disabled={idx===0}
                    style={{ width:26, height:26, borderRadius:6, border:`1px solid ${C.border}`, background:C.bg,
                      cursor:idx===0?"default":"pointer", color:idx===0?C.border:C.accent,
                      fontSize:14, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>▲</button>
                  <button onClick={()=>moveFreestyleDown(idx, unchecked.length)} disabled={idx===unchecked.length-1}
                    style={{ width:26, height:26, borderRadius:6, border:`1px solid ${C.border}`, background:C.bg,
                      cursor:idx===unchecked.length-1?"default":"pointer", color:idx===unchecked.length-1?C.border:C.accent,
                      fontSize:14, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>▼</button>
                </div>}
              </div>
            );
          })}
        </div>}

        {!trustMode&&checked.length>0&&(
          <div>
            <button onClick={()=>setUsedOpen(o=>!o)}
              style={{ width:"100%", background:C.surfaceAlt, border:"none", borderTop:`1px solid ${C.border}`,
                borderBottom:`1px solid ${C.border}`, cursor:"pointer",
                display:"flex", alignItems:"center", gap:6, padding:"8px 12px", color:C.textMuted }}>
              <Ic n={usedOpen?"chevD":"chevR"} s={12} c={C.textMuted}/>
              <span style={{ fontSize:12, fontWeight:800, letterSpacing:1.5, fontFamily:FONT_DISPLAY }}>USED · {checked.length}</span>
            </button>
            {usedOpen && checked.map(item=>{
              const isSet = item.type==="set";
              const m = isSet ? getSetById(item.refId) : getMoveById(item.refId);
              if(!m) return null;
              const dotColor = isSet ? (m.color||C.accent) : masteryColor(dm(m));
              return (
                <div key={item.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px",
                  borderBottom:`1px solid ${C.borderLight}`, background:C.surfaceAlt, opacity:0.6 }}>
                  <button onClick={()=>toggle(item.id)}
                    style={{ width:20, height:20, borderRadius:4, border:`2px solid ${C.textMuted}`,
                      background:C.textMuted, cursor:"pointer", flexShrink:0,
                      display:"flex", alignItems:"center", justifyContent:"center", padding:0 }}>
                    <Ic n="check" s={12} c={C.bg}/>
                  </button>
                  <div style={{ width:7, height:7, borderRadius: isSet?"2px":"50%", background:dotColor, flexShrink:0 }}/>
                  <span style={{ flex:1, fontSize:13, color:C.textMuted, fontFamily:FONT_BODY, textDecoration:"line-through" }}>{m.name}</span>
                  {isSet && <span style={{ fontSize:9, fontWeight:800, letterSpacing:1, color:C.textMuted, fontFamily:FONT_DISPLAY, background:C.surface, borderRadius:4, padding:"2px 5px" }}>SET</span>}
                  {!isSet && showMastery&&<span style={{ fontSize:11, color:masteryColor(dm(m)), fontWeight:700, flexShrink:0 }}>{dm(m)}%</span>}
                  <button onClick={()=>removeItem(item.id)}
                    style={{ background:"none", border:"none", cursor:"pointer", padding:2, display:"flex", flexShrink:0 }}>
                    <Ic n="x" s={11} c={C.textMuted}/>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>



      {/* ── Notion-style Move Picker overlay ── */}
      {pickerOpen&&(
        <div style={{ position:"absolute", inset:0, background:C.bg, zIndex:600, display:"flex", flexDirection:"column" }}>
          {/* Picker header */}
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 12px",
            background:C.surface, borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
            <input value={pickerSearch} onChange={e=>setPickerSearch(e.target.value)}
              placeholder={t("searchMoves")}
              style={{ flex:1, background:C.bg, border:`1px solid ${C.border}`, borderRadius:8,
                padding:"7px 10px", color:C.text, fontSize:13, fontFamily:FONT_BODY, outline:"none" }}/>
            <button onClick={()=>{ setPickerOpen(false); setPickerSel([]); }}
              style={{ background:"none", border:"none", cursor:"pointer", padding:4 }}>
              <Ic n="x" s={16} c={C.textMuted}/>
            </button>
          </div>
          {/* Select All row */}
          {!pickerSearch&&(
            <div onClick={toggleAll}
              style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 14px",
                borderBottom:`2px solid ${C.border}`, background:C.surfaceAlt, cursor:"pointer" }}>
              <div style={{ width:18, height:18, borderRadius:4, flexShrink:0,
                border:`2px solid ${isAllSel||isAllPart ? C.accent : C.border}`,
                background: isAllSel ? C.accent : "transparent",
                display:"flex", alignItems:"center", justifyContent:"center" }}>
                {isAllSel && <Ic n="check" s={11} c="#fff"/>}
                {isAllPart && <div style={{ width:8, height:2, background:C.accent, borderRadius:1 }}/>}
              </div>
              <span style={{ fontSize:12, fontWeight:800, letterSpacing:1.5, color:C.brownMid, fontFamily:FONT_DISPLAY }}>
                SELECT ALL
              </span>
              <span style={{ fontSize:11, color:C.textMuted, marginLeft:"auto" }}>
                {allAvailIds.length} available
              </span>
            </div>
          )}

          {/* Picker list */}
          <div style={{ flex:1, overflow:"auto", padding:"8px 0" }}>
            {(filteredMoves || allCats.map(()=>null)).length===0&&(
              <div style={{ padding:24, textAlign:"center", color:C.textMuted, fontSize:13 }}>{t("emptySearch")}</div>
            )}
            {filteredMoves ? (
              // flat search results
              filteredMoves.map(m=>{
                const inList   = isInList(m.id);
                const selected = isSelected(m.id);
                return (
                  <div key={m.id} onClick={()=>{ if(!inList) togglePick(m.id); }}
                    style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 14px",
                      borderBottom:`1px solid ${C.borderLight}`,
                      background: selected ? `${C.accent}12` : "transparent",
                      cursor: inList ? "default" : "pointer", opacity: inList ? 0.45 : 1 }}>
                    <div style={{ width:18, height:18, borderRadius:4, flexShrink:0,
                      border:`2px solid ${selected?C.accent:C.border}`,
                      background: selected ? C.accent : "transparent",
                      display:"flex", alignItems:"center", justifyContent:"center" }}>
                      {selected&&<Ic n="check" s={11} c="#fff"/>}
                      {inList&&!selected&&<Ic n="check" s={11} c={C.textMuted}/>}
                    </div>
                    <div style={{ width:7, height:7, borderRadius:"50%", background:masteryColor(dm(m)), flexShrink:0 }}/>
                    <span style={{ flex:1, fontSize:13, color:C.text, fontFamily:FONT_BODY }}>{m.name}</span>
                    <span style={{ fontSize:10, color:C.textMuted, fontFamily:FONT_DISPLAY }}>{m.category}</span>
                    {showMastery&&<span style={{ fontSize:11, color:masteryColor(dm(m)), fontWeight:700 }}>{dm(m)}%</span>}
                  </div>
                );
              })
            ) : (
              // grouped by category + sets section
              allCats.map(cat=>{
                const catMoves = moves.filter(m=>m.category===cat);
                const isExp = expCats[cat] !== false;
                const col = CAT_COLORS[cat]||C.accent;
                return (
                  <div key={cat}>
                    <div style={{ display:"flex", alignItems:"center", background:C.surface,
                      borderBottom:`1px solid ${C.borderLight}` }}>
                      {/* Category checkbox */}
                      <div onClick={()=>toggleCat(cat)}
                        style={{ padding:"7px 6px 7px 14px", cursor:"pointer", display:"flex", alignItems:"center" }}>
                        <div style={{ width:18, height:18, borderRadius:4, flexShrink:0,
                          border:`2px solid ${isCatAll(cat)||isCatPartial(cat) ? C.accent : C.border}`,
                          background: isCatAll(cat) ? C.accent : "transparent",
                          display:"flex", alignItems:"center", justifyContent:"center" }}>
                          {isCatAll(cat)     && <Ic n="check" s={11} c="#fff"/>}
                          {isCatPartial(cat) && <div style={{ width:8, height:2, background:C.accent, borderRadius:1 }}/>}
                        </div>
                      </div>
                      {/* Category expand button */}
                      <button onClick={()=>setExpCats(p=>({...p,[cat]:!isExp}))}
                        style={{ flex:1, display:"flex", alignItems:"center", gap:7, padding:"7px 14px 7px 4px",
                          background:"transparent", border:"none", cursor:"pointer", textAlign:"left" }}>
                        <div style={{ width:8, height:8, borderRadius:"50%", background:col, flexShrink:0 }}/>
                        <span style={{ flex:1, fontSize:12, fontWeight:800, letterSpacing:1, color:C.brownMid, fontFamily:FONT_DISPLAY }}>{cat}</span>
                        <span style={{ fontSize:10, color:C.textMuted }}>{catMoves.length}</span>
                        <Ic n={isExp?"chevD":"chevR"} s={11} c={C.textMuted}/>
                      </button>
                    </div>
                    {isExp && catMoves.map(m=>{
                      const inList   = isInList(m.id);
                      const selected = isSelected(m.id);
                      return (
                        <div key={m.id} onClick={()=>{ if(!inList) togglePick(m.id); }}
                          style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 14px 8px 28px",
                            borderBottom:`1px solid ${C.borderLight}`,
                            background: selected ? `${C.accent}12` : "transparent",
                            cursor: inList ? "default" : "pointer", opacity: inList ? 0.45 : 1 }}>
                          <div style={{ width:18, height:18, borderRadius:4, flexShrink:0,
                            border:`2px solid ${selected?C.accent:C.border}`,
                            background: selected ? C.accent : "transparent",
                            display:"flex", alignItems:"center", justifyContent:"center" }}>
                            {selected&&<Ic n="check" s={11} c="#fff"/>}
                            {inList&&!selected&&<Ic n="check" s={11} c={C.textMuted}/>}
                          </div>
                          <div style={{ width:7, height:7, borderRadius:"50%", background:masteryColor(dm(m)), flexShrink:0 }}/>
                          <span style={{ flex:1, fontSize:13, color:C.text, fontFamily:FONT_BODY }}>{m.name}</span>
                          {showMastery&&<span style={{ fontSize:11, color:masteryColor(dm(m)), fontWeight:700 }}>{dm(m)}%</span>}
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}

            {/* ── SETS section (only in grouped view) ── */}
            {!filteredMoves && sets.length>0&&(
              <div>
                <div style={{ display:"flex", alignItems:"center", background:C.surfaceAlt,
                  borderTop:`2px solid ${C.border}`, borderBottom:`1px solid ${C.borderLight}` }}>
                  <div onClick={()=>{
                    const avail = sets.filter(s=>!isInList(s.id)).map(s=>s.id);
                    const allSel = avail.every(id=>pickerSel.includes(id));
                    if(allSel) setPickerSel(p=>p.filter(id=>!avail.includes(id)));
                    else setPickerSel(p=>[...new Set([...p,...avail])]);
                  }} style={{ padding:"7px 6px 7px 14px", cursor:"pointer", display:"flex", alignItems:"center" }}>
                    {(()=>{
                      const avail = sets.filter(s=>!isInList(s.id)).map(s=>s.id);
                      const allS = avail.length>0 && avail.every(id=>pickerSel.includes(id));
                      const partS = avail.some(id=>pickerSel.includes(id)) && !allS;
                      return (
                        <div style={{ width:18, height:18, borderRadius:4, flexShrink:0,
                          border:`2px solid ${allS||partS?C.accent:C.border}`,
                          background:allS?C.accent:"transparent",
                          display:"flex", alignItems:"center", justifyContent:"center" }}>
                          {allS  && <Ic n="check" s={11} c="#fff"/>}
                          {partS && <div style={{ width:8, height:2, background:C.accent, borderRadius:1 }}/>}
                        </div>
                      );
                    })()}
                  </div>
                  <button onClick={()=>setExpCats(p=>({...p,"__sets__":p["__sets__"]===false?true:false}))}
                    style={{ flex:1, display:"flex", alignItems:"center", gap:7, padding:"7px 14px 7px 4px",
                      background:"transparent", border:"none", cursor:"pointer", textAlign:"left" }}>
                    <span style={{ fontSize:12, fontWeight:800, letterSpacing:1.5, color:C.brownMid, fontFamily:FONT_DISPLAY }}>SETS</span>
                    <span style={{ fontSize:10, color:C.textMuted, marginLeft:"auto" }}>{sets.length}</span>
                    <Ic n={expCats["__sets__"]===false?"chevR":"chevD"} s={11} c={C.textMuted}/>
                  </button>
                </div>
                {expCats["__sets__"]!==false && sets.map(s=>{
                  const inList   = isInList(s.id);
                  const selected = isSelected(s.id);
                  return (
                    <div key={s.id} onClick={()=>{ if(!inList) togglePick(s.id); }}
                      style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 14px",
                        borderBottom:`1px solid ${C.borderLight}`,
                        background: selected ? `${C.accent}12` : "transparent",
                        cursor: inList ? "default" : "pointer", opacity: inList ? 0.45 : 1 }}>
                      <div style={{ width:18, height:18, borderRadius:4, flexShrink:0,
                        border:`2px solid ${selected?C.accent:C.border}`,
                        background: selected ? C.accent : "transparent",
                        display:"flex", alignItems:"center", justifyContent:"center" }}>
                        {selected&&<Ic n="check" s={11} c="#fff"/>}
                        {inList&&!selected&&<Ic n="check" s={11} c={C.textMuted}/>}
                      </div>
                      <div style={{ width:7, height:7, borderRadius:2, background:s.color||C.accent, flexShrink:0 }}/>
                      <span style={{ flex:1, fontSize:13, color:C.text, fontFamily:FONT_BODY }}>{s.name}</span>
                      <span style={{ fontSize:9, fontWeight:800, letterSpacing:1, color:C.textMuted, fontFamily:FONT_DISPLAY,
                        background:C.surface, borderRadius:4, padding:"2px 5px" }}>
                        {(s.moveIds||[]).length} moves
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Picker footer */}
          <div style={{ padding:"10px 14px", borderTop:`1px solid ${C.border}`, background:C.surface, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ fontSize:12, color:C.textMuted }}>
              {pickerSel.length>0 ? `${pickerSel.length} selected` : t("tapToSelect")}
            </span>
            <button onClick={confirmPick} disabled={pickerSel.length===0}
              style={{ padding:"8px 18px", background:pickerSel.length>0?C.accent:C.border, border:"none",
                borderRadius:8, color:C.bg, fontSize:13, fontWeight:800, fontFamily:FONT_DISPLAY,
                letterSpacing:1, cursor:pickerSel.length>0?"pointer":"default" }}>
              {t("done")} {pickerSel.length>0?`(${pickerSel.length})`:""}
            </button>
          </div>
        </div>
      )}

      {/* Save List Modal */}
      {showSaveList&&(
        <Modal title={t("saveFreestyleList")} onClose={()=>setShowSaveList(false)}>
          <p style={{ fontSize:13, color:C.textSec, marginBottom:14, lineHeight:1.6 }}>
            Saves your current list of {moveCountStr(toUse.length)} to reuse later.
          </p>
          <div style={{ marginBottom:20 }}>
            <label style={lbl()}>{t("listNameLabel")} *</label>
            <input autoFocus value={saveListName} onChange={e=>setSaveListName(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter") saveList(); }}
              placeholder="e.g. Battle Set, Warm-Up Routine…"
              style={{ width:"100%", background:C.surface, border:`1.5px solid ${C.accent}`, borderRadius:8,
                padding:"9px 12px", color:C.text, fontSize:14, outline:"none",
                fontFamily:FONT_BODY, boxSizing:"border-box" }}/>
          </div>
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
            <Btn variant="secondary" onClick={()=>setShowSaveList(false)}>{t("cancel")}</Btn>
            <Btn onClick={saveList} disabled={!saveListName.trim()}>💾 Save List</Btn>
          </div>
        </Modal>
      )}

      {/* Load List Modal */}
      {showLoadList&&!confirmLoadList&&!confirmDeleteList&&(
        <Modal title={t("loadFreestyleList")} onClose={()=>setShowLoadList(false)}>
          {savedLists.length===0 ? (
            <div style={{ textAlign:"center", padding:"24px 0", color:C.textMuted }}>
              <div style={{ fontSize:28, marginBottom:8 }}>📂</div>
              <div style={{ fontSize:13, fontWeight:700, fontFamily:FONT_DISPLAY, marginBottom:4 }}>{t("noSavedListsYet")}</div>
              <div style={{ fontSize:12 }}>Build a list then tap 💾 Save to store it for later.</div>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <p style={{ fontSize:12, color:C.textMuted, marginBottom:4, lineHeight:1.5 }}>
                Tap a list to load it. Your current list will be replaced.
              </p>
              {savedLists.map(entry=>(
                <div key={entry.id}
                  style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px",
                    background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, cursor:"pointer" }}
                  onClick={()=>setConfirmLoadList(entry)}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:800, fontSize:14, color:C.text, fontFamily:FONT_DISPLAY, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{entry.name}</div>
                    <div style={{ fontSize:11, color:C.textMuted, marginTop:2 }}>
                      {moveCountStr(entry.items.length)} · Saved {entry.savedAt}
                    </div>
                  </div>
                  <button onClick={e=>{ e.stopPropagation(); setConfirmDeleteList(entry); }}
                    style={{ background:"none", border:"none", cursor:"pointer", padding:6, display:"flex" }}>
                    <Ic n="trash" s={14} c={C.accent}/>
                  </button>
                </div>
              ))}
            </div>
          )}
          <div style={{ display:"flex", justifyContent:"flex-end", marginTop:16 }}>
            <Btn variant="secondary" onClick={()=>setShowLoadList(false)}>{t("close")}</Btn>
          </div>
        </Modal>
      )}

      {/* Confirm Load */}
      {confirmLoadList&&(
        <Modal title={t("loadListTitle")} onClose={()=>setConfirmLoadList(null)}>
          <p style={{ fontSize:13, color:C.textSec, marginBottom:8, lineHeight:1.6 }}>
            Load <strong style={{color:C.text}}>{confirmLoadList.name}</strong>?
          </p>
          <p style={{ fontSize:12, color:C.accent, fontWeight:700, marginBottom:20 }}>
            ⚠️ Your current list will be replaced.
          </p>
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
            <Btn variant="secondary" onClick={()=>setConfirmLoadList(null)}>{t("cancel")}</Btn>
            <Btn variant="danger" onClick={()=>loadList(confirmLoadList)}>{t("yesLoad")}</Btn>
          </div>
        </Modal>
      )}

      {/* Confirm Delete List */}
      {confirmDeleteList&&(
        <Modal title={t("deleteListTitle")} onClose={()=>setConfirmDeleteList(null)}>
          <p style={{ fontSize:13, color:C.textSec, marginBottom:8, lineHeight:1.6 }}>
            Delete <strong style={{color:C.text}}>{confirmDeleteList.name}</strong>?
          </p>
          <p style={{ fontSize:12, color:C.accent, fontWeight:700, marginBottom:20 }}>⚠️ {t("cannotBeUndone")}</p>
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
            <Btn variant="secondary" onClick={()=>setConfirmDeleteList(null)}>{t("cancel")}</Btn>
            <Btn variant="danger" onClick={()=>deleteList(confirmDeleteList.id)}>{t("delete")}</Btn>
          </div>
        </Modal>
      )}

      {/* Confirm reset modal */}
      {confirmReset&&(
        <Modal title={t("resetListTitle")} onClose={()=>setConfirmReset(false)}>
          <p style={{ color:C.textSec, marginBottom:20, lineHeight:1.6 }}>
            This will clear all <strong style={{color:C.text}}>{toUse.length} moves</strong> from your freestyle list. This cannot be undone.
          </p>
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
            <Btn variant="secondary" onClick={()=>setConfirmReset(false)}>{t("cancel")}</Btn>
            <Btn variant="danger" onClick={reset}>{t("resetBtn")}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};
