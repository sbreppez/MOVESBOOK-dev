import { useState, useRef } from 'react';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { masteryColor } from '../../constants/styles';
import { Ic } from '../shared/Ic';
import { useT } from '../../hooks/useTranslation';
import { usePlural } from '../../hooks/useTranslation';
import { useSettings } from '../../hooks/useSettings';

export const EditRoundView = ({ round, onSave, onClose, getMove, getSet, setPickerEntry, setPickerSearch, setPickerSel, showMoveCount }) => {
  const t = useT();
  const { itemCountStr } = usePlural();
  const { C } = useSettings();
  const [localRound, setLocalRound] = useState({...round, entries: round.entries || []});
  const [localExpEntries, setLocalExpEntries] = useState({});
  const [renaming, setRenaming] = useState(null);
  const [renameVal, setRenameVal] = useState("");
  const itemDragRef = useRef(null);
  const [itemDragOver, setItemDragOver] = useState(null);
  const [confirmDeleteEntry, setConfirmDeleteEntry] = useState(null);

  const save = () => {
    onSave(round.id, { name:localRound.name, color:localRound.color, notes:localRound.notes, entries:localRound.entries });
    onClose();
  };

  const localAddEntry = () => {
    const n = (localRound.entries||[]).length + 1;
    setLocalRound(r => ({...r, entries:[...(r.entries||[]), { id:Date.now(), name:t("entryPrefix")+" "+n, items:[] }]}));
  };
  const localRemoveEntry = eid => setLocalRound(r => ({...r, entries:(r.entries||[]).filter(e=>e.id!==eid)}));
  const localAddItems = (eid, newItems) => setLocalRound(r => ({...r, entries:(r.entries||[]).map(e=>{
    if(e.id!==eid) return e;
    const ex = new Set((e.items||[]).map(i=>i.type+":"+i.refId));
    return {...e, items:[...(e.items||[]), ...newItems.filter(i=>!ex.has(i.type+":"+i.refId))]};
  })}));
  const localRemoveItem = (eid, idx) => setLocalRound(r => ({...r, entries:(r.entries||[]).map(e=>
    e.id!==eid?e:{...e,items:(e.items||[]).filter((_,i)=>i!==idx)}
  )}));
  const localReorder = (eid, fromIdx, toIdx) => setLocalRound(r => ({...r, entries:(r.entries||[]).map(e=>{
    if(e.id!==eid) return e;
    const items=[...(e.items||[])];
    const [moved]=items.splice(fromIdx,1);
    const adj = fromIdx<toIdx?toIdx-1:toIdx;
    items.splice(adj,0,moved);
    return {...e,items};
  })}));
  const localRenameEntry = (eid, name) => setLocalRound(r => ({...r, entries:(r.entries||[]).map(e=>e.id===eid?{...e,name}:e)}));
  const findLocalDupes = (type, refId, currentEid) => {
    const found = [];
    (localRound.entries||[]).forEach(e => {
      if(e.id!==currentEid && (e.items||[]).some(i=>i.type===type&&i.refId===refId)) found.push(e.name);
    });
    return found;
  };

  // ── Tension Role mapping ────────────────────────────────────────────────────
  const ROLE_LEVEL = { flow:1, build:2, hit:3, peak:4 };
  const TENSION_COLORS = { 1: C.textMuted, 2: C.blue, 3: C.yellow, 4: C.red };
  const LEVEL_TO_ROLE = { 1:"flow", 2:"build", 3:"hit", 4:"peak" };

  const getItemTension = (item) => {
    if (item.tensionOverride) return ROLE_LEVEL[item.tensionOverride] || 2;
    if (item.type === "move") {
      const m = getMove(item.refId);
      if (m?.tensionRole) return ROLE_LEVEL[m.tensionRole] || 2;
    }
    return 2;
  };

  const cycleItemTension = (entryId, itemIdx) => {
    setLocalRound(r => ({
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

  const resetItemTension = (entryId, itemIdx) => {
    setLocalRound(r => ({
      ...r,
      entries: (r.entries||[]).map(e => e.id !== entryId ? e : {
        ...e,
        items: (e.items||[]).map((it, i) => i !== itemIdx ? it : { ...it, tensionOverride: null })
      })
    }));
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
        style={{ width:"100%", height:60, display:"block", padding:"0 12px", boxSizing:"border-box" }}>
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

  return (
    <div style={{ position:"absolute", inset:0, background:C.bg, zIndex:500, display:"flex", flexDirection:"column" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", background:C.surface, borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
        <button onClick={save} style={{ background:"none", border:"none", cursor:"pointer", color:C.accent, fontSize:13, fontFamily:FONT_DISPLAY, fontWeight:700, padding:0 }}>{`← ${t("save")}`}</button>
        <div style={{ width:10, height:10, borderRadius:"50%", background:localRound.color||C.accent, flexShrink:0 }}/>
        <span style={{ flex:1, fontWeight:900, fontSize:15, letterSpacing:1.5, color:C.brown, fontFamily:FONT_DISPLAY }}>{localRound.name}</span>
        <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", padding:2 }}><Ic n="x" s={16} c={C.textMuted}/></button>
      </div>
      {/* Round meta */}
      <div style={{ padding:"10px 14px", borderBottom:`1px solid ${C.borderLight}`, flexShrink:0, background:C.surface }}>
        <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:8 }}>
          <input value={localRound.name} onChange={e=>setLocalRound(r=>({...r,name:e.target.value}))}
            style={{ flex:1, background:C.bg, border:`1px solid ${C.border}`, borderRadius:7, padding:"7px 10px",
              color:C.text, fontSize:13, fontFamily:FONT_DISPLAY, fontWeight:700, outline:"none" }}/>
        </div>
        <textarea value={localRound.notes||""} onChange={e=>setLocalRound(r=>({...r,notes:e.target.value}))}
          placeholder={t("notesRound")} rows={2}
          style={{ width:"100%", background:C.bg, border:`1px solid ${C.border}`, borderRadius:7, padding:"7px 10px",
            color:C.text, fontSize:12, fontFamily:FONT_BODY, outline:"none", resize:"none", boxSizing:"border-box" }}/>
      </div>
      {/* Entries list */}
      <div style={{ flex:1, overflow:"auto", padding:"10px 12px" }}>
        {(localRound.entries||[]).map((entry) => {
          const isOpen = localExpEntries[entry.id] !== false;
          return (
            <div key={entry.id} style={{ marginBottom:10, borderRadius:10, border:`1.5px solid ${C.border}`, overflow:"hidden", background:C.bg }}>
              <div style={{ display:"flex", alignItems:"center", padding:"8px 10px", background:C.surface, gap:6 }}>
                <button onClick={()=>setLocalExpEntries(p=>({...p,[entry.id]:!isOpen}))}
                  style={{ background:"none", border:"none", cursor:"pointer", padding:0, display:"flex", flexShrink:0 }}>
                  <Ic n={isOpen?"chevD":"chevR"} s={12} c={C.textMuted}/>
                </button>
                {renaming===entry.id ? (
                  <input autoFocus value={renameVal}
                    onChange={e=>setRenameVal(e.target.value)}
                    onBlur={()=>{ if(renameVal.trim()) localRenameEntry(entry.id,renameVal.trim()); setRenaming(null); }}
                    onKeyDown={e=>{ if(e.key==="Enter"){ if(renameVal.trim()) localRenameEntry(entry.id,renameVal.trim()); setRenaming(null); } }}
                    style={{ flex:1, background:C.bg, border:`1px solid ${C.accent}`, borderRadius:5, padding:"2px 6px",
                      color:C.text, fontSize:12, fontFamily:FONT_DISPLAY, fontWeight:700, outline:"none" }}/>
                ) : (
                  <span onDoubleClick={()=>{ setRenaming(entry.id); setRenameVal(entry.name); }}
                    style={{ flex:1, fontSize:12, fontWeight:800, color:C.brownMid, fontFamily:FONT_DISPLAY, letterSpacing:0.8, cursor:"pointer" }}
                    title={t("doubleTapRename")}>{entry.name}</span>
                )}
                {showMoveCount&&<span style={{ fontSize:10, color:C.textMuted }}>{(entry.items||[]).length}</span>}
                <button onClick={()=>{ setPickerEntry({roundId:localRound.id,entryId:entry.id,applyLocal:localAddItems}); setPickerSearch(""); setPickerSel([]); }}
                  style={{ background:C.accent, border:"none", borderRadius:6, cursor:"pointer",
                    color:C.bg, padding:"2px 7px", fontSize:10, fontFamily:FONT_DISPLAY, fontWeight:700, display:"flex", alignItems:"center", gap:3 }}>
                  <Ic n="plus" s={9} c={C.bg}/> ADD
                </button>
                <button onClick={()=>setConfirmDeleteEntry(entry)}
                  style={{ background:"none", border:"none", cursor:"pointer", padding:2, display:"flex", flexShrink:0 }}>
                  <Ic n="x" s={13} c={C.accent}/>
                </button>
              </div>
              {isOpen && (
                <div style={{ padding:"4px 0" }}
                  onDragOver={e=>e.preventDefault()}
                  onDrop={e=>{ e.stopPropagation(); if(itemDragRef.current?.eid===entry.id) localReorder(entry.id, itemDragRef.current.idx, (entry.items||[]).length); }}>
                  {(entry.items||[]).filter(it=>it.type==="move").length >= 2 && <ArcVis items={entry.items}/>}
                  {(() => { const fb = getArcFeedback(entry.items); return fb ? <div style={{ fontSize:10, color:C.textSec, fontStyle:"italic", padding:"2px 12px 4px" }}>{fb}</div> : null; })()}
                  {(entry.items||[]).length===0&&(
                    <div style={{ padding:"8px 14px", fontSize:11, color:C.textMuted, fontStyle:"italic" }}>Empty — tap ADD to fill this entry</div>
                  )}
                  {(entry.items||[]).map((item,idx)=>{
                    const label = item.type==="move" ? getMove(item.refId)?.name : getSet(item.refId)?.name;
                    if(!label) return null;
                    const dupes = findLocalDupes(item.type, item.refId, entry.id);
                    const isDragging = itemDragRef.current?.eid===entry.id&&itemDragRef.current?.idx===idx;
                    const isOver = itemDragOver?.eid===entry.id&&itemDragOver?.idx===idx;
                    const tension = getItemTension(item);
                    return (
                      <div key={idx}
                        draggable
                        onDragStart={e=>{ e.stopPropagation(); itemDragRef.current={eid:entry.id,idx}; }}
                        onDragEnd={()=>{ itemDragRef.current=null; setItemDragOver(null); }}
                        onDragOver={e=>{ e.preventDefault(); e.stopPropagation(); if(itemDragRef.current?.eid===entry.id) setItemDragOver({eid:entry.id,idx}); }}
                        onDrop={e=>{ e.stopPropagation(); if(itemDragRef.current?.eid===entry.id) { localReorder(entry.id,itemDragRef.current.idx,idx); itemDragRef.current=null; setItemDragOver(null); } }}
                        style={{ display:"flex", alignItems:"center", gap:7, padding:"7px 12px",
                          borderTop:`1px solid ${C.borderLight}`,
                          background: isOver ? `${C.accent}0e` : dupes.length>0 ? `${C.yellow}10` : "transparent",
                          opacity: isDragging ? 0.4 : 1 }}>
                        <div style={{ width:7, height:7, borderRadius:"50%", flexShrink:0,
                          background: item.type==="set" ? (getSet(item.refId)?.color||C.blue) : masteryColor(getMove(item.refId)?.mastery||0) }}/>
                        <span style={{ flex:1, fontSize:12, color:C.text }}>{label}</span>
                        {item.type==="set"&&<span style={{ fontSize:9, background:`${C.blue}22`, color:C.blue, padding:"1px 5px", borderRadius:4, fontFamily:FONT_DISPLAY, fontWeight:700 }}>SET</span>}
                        {dupes.length>0&&(
                          <span style={{ fontSize:9, color:C.yellow, fontWeight:700, fontFamily:FONT_DISPLAY }} title={t("alsoIn")+" "+dupes.join(", ")}>
                            {t("alsoIn")} {dupes[0]}
                          </span>
                        )}
                        {item.type==="move"&&<TensionDots level={tension}
                          onTap={()=>cycleItemTension(entry.id,idx)}
                          onLongPress={()=>resetItemTension(entry.id,idx)}/>}
                        <button onClick={()=>localRemoveItem(entry.id,idx)}
                          style={{ background:"none", border:"none", cursor:"pointer", padding:2, display:"flex", flexShrink:0 }}>
                          <Ic n="x" s={11} c={C.textMuted}/>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        <button onClick={localAddEntry}
          style={{ width:"100%", padding:"10px", background:"none", border:`1.5px dashed ${C.accent}`,
            borderRadius:10, cursor:"pointer", color:C.accent, fontSize:12,
            fontFamily:FONT_DISPLAY, fontWeight:700, letterSpacing:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
          <Ic n="plus" s={13} c={C.accent}/> ADD ENTRY
        </button>
      </div>
      {/* Save bar */}
      <div style={{ padding:"10px 14px", borderTop:`1px solid ${C.border}`, background:C.surface, flexShrink:0 }}>
        <button onClick={save}
          style={{ width:"100%", padding:"11px", background:C.accent, border:"none", borderRadius:8,
            color:C.bg, fontSize:13, fontWeight:900, fontFamily:FONT_DISPLAY, letterSpacing:1.5, cursor:"pointer" }}>
          SAVE ROUND
        </button>
      </div>

      {/* Delete entry confirmation */}
      {confirmDeleteEntry&&(
        <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.55)", zIndex:600, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
          <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:14, width:"100%", maxWidth:300, padding:20, boxShadow:"0 24px 60px rgba(0,0,0,0.4)" }}>
            <div style={{ fontWeight:900, fontSize:14, letterSpacing:1.5, fontFamily:FONT_DISPLAY, color:C.brown, marginBottom:8 }}>DELETE ENTRY?</div>
            <p style={{ fontSize:13, color:C.textSec, marginBottom:16, lineHeight:1.5 }}>
              "<span style={{ color:C.text, fontWeight:700 }}>{confirmDeleteEntry.name}</span>" and its {itemCountStr((confirmDeleteEntry.items||[]).length)} will be removed.
            </p>
            <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
              <button onClick={()=>setConfirmDeleteEntry(null)}
                style={{ padding:"8px 16px", borderRadius:8, border:`1px solid ${C.border}`, background:"none", color:C.textSec, fontSize:13, cursor:"pointer", fontFamily:FONT_BODY }}>
                Cancel
              </button>
              <button onClick={()=>{ localRemoveEntry(confirmDeleteEntry.id); setConfirmDeleteEntry(null); }}
                style={{ padding:"8px 16px", borderRadius:8, border:"none", background:C.accent, color:C.bg, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:FONT_BODY }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
