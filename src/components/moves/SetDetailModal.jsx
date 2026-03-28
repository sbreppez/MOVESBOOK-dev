import React, { useState, useRef } from 'react';
import { C, PRESET_COLORS } from '../../constants/colors';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { Modal } from '../shared/Modal';
import { Inp } from '../shared/Inp';
import { Txtarea } from '../shared/Txtarea';
import { Btn } from '../shared/Btn';
import { Ic } from '../shared/Ic';
import { MasterySlider } from '../shared/MasterySlider';
import { useT } from '../../hooks/useTranslation';
import { usePlural } from '../../hooks/useTranslation';
import { useSettings } from '../../hooks/useSettings';
import { masteryColor, lbl, inp } from '../../constants/styles';

const ensureHttps = (url) => {
  if (!url || !url.trim()) return "";
  const u = url.trim();
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  return "https://" + u;
};

export const SetDetailModal = ({ item, onClose, onSave, type="set", allMoves=[], allSets=[] }) => {
  const t = useT();
  const { moveCountStr } = usePlural();
  const { C } = useSettings();
  const [name,    setName]    = useState(item.name   || "");
  const [color,   setColor]   = useState(item.color  || PRESET_COLORS[1]);
  const [link,    setLink]    = useState(item.link   || "");
  const [mastery, setMastery] = useState(item.mastery ?? 0);
  const [details, setDetails] = useState(item.details || "");
  const [notes,   setNotes]   = useState(item.notes  || "");
  const [date,    setDate]    = useState(item.date   || new Date().toISOString().split("T")[0]);
  const [localIds, setLocalIds] = useState(type==="set" ? (item.moveIds||[]) : (item.setIds||[]));
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQ, setPickerQ] = useState("");
  const localDragItem = useRef(null);
  const [localDragOver, setLocalDragOver] = useState(null);
  const isSet = type === "set";

  const handleSave = () => {
    if (!name.trim()) return;
    const extra = isSet ? { moveIds: localIds } : { setIds: localIds };
    onSave({ name: name.trim(), color, link: ensureHttps(link.trim()), mastery, notes: notes.trim(), details: details.trim(), date, ...extra });
    onClose();
  };

  const toggleId = (id) => setLocalIds(p => p.includes(id) ? p.filter(i=>i!==id) : [...p, id]);
  const removeId = (id) => setLocalIds(p => p.filter(i=>i!==id));

  const handleDragStart = idx => { localDragItem.current = idx; };
  const handleDragOver  = (e, idx) => { e.preventDefault(); e.stopPropagation(); setLocalDragOver(idx); };
  const handleDrop      = (toIdx) => {
    if (localDragItem.current===null||localDragItem.current===toIdx) { setLocalDragOver(null); localDragItem.current=null; return; }
    const arr = [...localIds];
    const [moved] = arr.splice(localDragItem.current, 1);
    const adj = localDragItem.current < toIdx ? toIdx-1 : toIdx;
    arr.splice(adj, 0, moved);
    setLocalIds(arr);
    localDragItem.current=null; setLocalDragOver(null);
  };

  // All categories from allMoves
  const allCats = [...new Set(allMoves.map(m=>m.category))].sort();
  const q = pickerQ.toLowerCase().trim();

  return (
    <Modal title={isSet ? "EDIT SET" : "EDIT ROUND"} onClose={onClose} wide>
      {/* Color stripe */}
      <div style={{ height:5, borderRadius:4, background:`linear-gradient(90deg,${color},${color}55)`, marginBottom:16 }}/>

      <Inp label="NAME *" value={name} onChange={setName} placeholder={isSet ? "e.g. Opening Set…" : "e.g. Top 16…"}/>

      {/* Details */}
      <div style={{ marginBottom:16 }}>
        <label style={lbl()}>{t("detailsLabel")}</label>
        <textarea value={details} onChange={e=>setDetails(e.target.value)} rows={2}
          placeholder={isSet ? "Describe this set — style, purpose, context…" : "Describe this round…"}
          style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8,
            padding:"9px 12px", color:C.text, fontSize:13, outline:"none", resize:"vertical",
            fontFamily:FONT_BODY, lineHeight:1.5 }}/>
      </div>

      {/* Colour */}
      <div style={{ marginBottom:16 }}>
        <label style={lbl()}>{t("colour")}</label>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:4 }}>
          {PRESET_COLORS.map(c=>(
            <button key={c} onClick={()=>setColor(c)}
              style={{ width:30, height:30, borderRadius:6, background:c, cursor:"pointer", outline:"none",
                border: color===c ? `3px solid ${C.brown}` : `2px solid transparent` }}/>
          ))}
        </div>
      </div>

      {/* ── MOVES IN THIS SET — Notion-style inline picker ── */}
      {isSet && (
        <div style={{ marginBottom:16 }}>
          <label style={lbl()}>{t("movesInThisSet")} ({localIds.length})</label>

          {/* Added moves — draggable to reorder */}
          {localIds.length > 0 && (
            <div onDragOver={e=>e.preventDefault()} onDrop={()=>{ if(localDragItem.current!==null) handleDrop(localIds.length); }}
              style={{ marginBottom:6 }}>
              {localIds.map((id, idx)=>{
                const m = allMoves.find(mv=>mv.id===id); if(!m) return null;
                const col = masteryColor(m.mastery||0);
                const isOver = localDragOver===idx;
                return (
                  <div key={id}
                    draggable
                    onDragStart={e=>{ e.stopPropagation(); handleDragStart(idx); }}
                    onDragEnd={()=>{ localDragItem.current=null; setLocalDragOver(null); }}
                    onDragOver={e=>handleDragOver(e,idx)}
                    onDrop={e=>{ e.stopPropagation(); handleDrop(idx); }}
                    style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px",
                      background: isOver ? `${C.accent}0e` : C.surfaceAlt,
                      borderRadius:8, marginBottom:3,
                      border:`1px solid ${isOver?C.accent:C.borderLight}`,
                      opacity: localDragItem.current===idx ? 0.4 : 1, cursor:"grab" }}>
                    <span style={{ fontSize:11, fontWeight:700, color:C.textMuted, flexShrink:0, minWidth:16 }}>{idx+1}.</span>
                    <div style={{ width:7, height:7, borderRadius:"50%", background:col, flexShrink:0 }}/>
                    <span style={{ flex:1, fontSize:13, color:C.text }}>{m.name}</span>
                    <span style={{ fontSize:10, color:C.textMuted, flexShrink:0 }}>{m.category}</span>
                    <span style={{ fontSize:11, color:col, fontWeight:700, flexShrink:0 }}>{m.mastery||0}%</span>
                    <button onClick={()=>removeId(id)}
                      style={{ background:"none", border:"none", cursor:"pointer", padding:3, display:"flex", flexShrink:0 }}>
                      <Ic n="x" s={12} c={C.accent}/>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* + Add moves button / inline picker */}
          {!pickerOpen ? (
            <button onClick={()=>{ setPickerOpen(true); setPickerQ(""); }}
              style={{ width:"100%", padding:"9px 12px", background:"none",
                border:`1.5px dashed ${C.border}`, borderRadius:8, cursor:"pointer",
                color:C.accent, fontSize:13, fontFamily:FONT_BODY,
                display:"flex", alignItems:"center", gap:8, textAlign:"left" }}>
              <Ic n="plus" s={14} c={C.accent}/>
              {t("addAMovePlaceholder")}
            </button>
          ) : (
            <div style={{ border:`1.5px solid ${C.accent}`, borderRadius:10, overflow:"hidden", background:C.bg }}>
              {/* Search bar */}
              <div style={{ display:"flex", alignItems:"center", padding:"8px 10px", gap:6, borderBottom:`1px solid ${C.borderLight}` }}>
                <Ic n="search" s={13} c={C.textMuted}/>
                <input value={pickerQ} onChange={e=>setPickerQ(e.target.value)}
                  placeholder={t("searchMoves")}
                  style={{ flex:1, background:"none", border:"none", outline:"none", color:C.text, fontSize:13, fontFamily:"inherit" }}/>
                <button onClick={()=>setPickerOpen(false)}
                  style={{ background:"none", border:"none", cursor:"pointer", padding:2, display:"flex" }}>
                  <Ic n="x" s={13} c={C.textMuted}/>
                </button>
              </div>
              {/* Move list grouped by category */}
              <div style={{ maxHeight:220, overflow:"auto" }}>
                {allCats.map(cat => {
                  const catMoves = allMoves.filter(m => m.category===cat && (!q || m.name.toLowerCase().includes(q) || cat.toLowerCase().includes(q)));
                  if (catMoves.length===0) return null;
                  return (
                    <div key={cat}>
                      <div style={{ padding:"5px 10px", background:C.surfaceAlt, fontSize:9, fontWeight:800, letterSpacing:1.5, color:C.textMuted, fontFamily:FONT_DISPLAY }}>
                        {cat.toUpperCase()}
                      </div>
                      {catMoves.map(m => {
                        const added = localIds.includes(m.id);
                        const col = masteryColor(m.mastery||0);
                        return (
                          <button key={m.id} onClick={()=>toggleId(m.id)}
                            style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"9px 12px",
                              background: added ? `${C.accent}10` : "transparent",
                              border:"none", borderBottom:`1px solid ${C.borderLight}`,
                              cursor:"pointer", textAlign:"left" }}>
                            {/* Checkbox */}
                            <div style={{ width:16, height:16, borderRadius:4, flexShrink:0,
                              border:`2px solid ${added ? C.accent : C.border}`,
                              background: added ? C.accent : "transparent",
                              display:"flex", alignItems:"center", justifyContent:"center" }}>
                              {added&&<Ic n="check" s={10} c="#fff"/>}
                            </div>
                            <div style={{ width:7, height:7, borderRadius:"50%", background:col, flexShrink:0 }}/>
                            <span style={{ flex:1, fontSize:13, color:C.text }}>{m.name}</span>
                            <span style={{ fontSize:10, color:col, fontWeight:700 }}>{m.mastery||0}%</span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
                {allMoves.filter(m=>!q||m.name.toLowerCase().includes(q)).length===0&&(
                  <div style={{ padding:"16px", textAlign:"center", color:C.textMuted, fontSize:12 }}>No moves match "{pickerQ}"</div>
                )}
              </div>
              {/* Done button */}
              <div style={{ padding:"8px 10px", borderTop:`1px solid ${C.borderLight}` }}>
                <button onClick={()=>setPickerOpen(false)}
                  style={{ width:"100%", padding:"8px", background:C.accent, border:"none", borderRadius:7,
                    color:C.bg, fontSize:12, fontWeight:900, fontFamily:FONT_DISPLAY, letterSpacing:1, cursor:"pointer" }}>
                  {t("done")} — {moveCountStr(localIds.length)}
                </button>
              </div>
            </div>
          )}
        </div>
      )}


      {/* Mastery slider */}
      <div style={{ marginBottom:16 }}>
        <label style={lbl()}>{isSet?t("howWellKnowSet"):t("howWellKnowRound")} — <span style={{ color:masteryColor(mastery), fontWeight:800 }}>{mastery}%</span></label>
        <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:6, flexWrap:"wrap" }}>
          {[[0,"🌱 "+t("justStarted")],[25,"🔧 "+t("learning")],[50,"⚡ "+t("gettingThere")],[75,"🔥 "+t("almostThere")],[100,"💎 "+t("mastered")]].map(([v,label])=>(
            <button key={v} onClick={()=>setMastery(v)}
              style={{ fontSize:11, padding:"3px 8px", borderRadius:12, cursor:"pointer", fontFamily:FONT_BODY,
                background: mastery===v ? masteryColor(v) : C.surfaceAlt,
                color: mastery===v ? C.bg : C.textSec,
                border: `1px solid ${mastery===v ? masteryColor(v) : C.border}` }}>
              {label}
            </button>
          ))}
        </div>
        <input type="range" min={0} max={100} value={mastery} onChange={e=>setMastery(Number(e.target.value))}
          style={{ width:"100%", accentColor:masteryColor(mastery), marginTop:4 }}/>
        <div style={{ height:4, borderRadius:2, background:C.border, marginTop:4 }}>
          <div style={{ height:"100%", width:`${mastery}%`, borderRadius:2, background:masteryColor(mastery), transition:"width 0.2s" }}/>
        </div>
      </div>

      {/* Video Link */}
      <Inp label="VIDEO LINK (optional)" value={link} onChange={setLink} placeholder="https://youtube.com/…"/>

      {/* Date Created */}
      <div style={{ marginBottom:14 }}>
        <label style={lbl()}>{t("date")}</label>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)}
          style={{ ...inp(), colorScheme:"light dark" }}/>
      </div>

      <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
        <Btn variant="secondary" onClick={onClose}>{t("cancel")}</Btn>
        <Btn onClick={handleSave} disabled={!name.trim()}>{t("save")}</Btn>
      </div>
    </Modal>
  );
};
