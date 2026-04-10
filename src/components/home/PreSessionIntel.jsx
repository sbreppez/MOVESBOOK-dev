import React, { useState } from 'react';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { useSettings } from '../../hooks/useSettings';
import { useT } from '../../hooks/useTranslation';
import { Ic } from '../shared/Ic';

export const PreSessionIntel = ({ presession, setPresession }) => {
  const { C } = useSettings();
  const t = useT();
  const [editField, setEditField] = useState(null); // "fromLastSession" | "fromFootage" | null
  const [editText, setEditText] = useState("");
  const [newTry, setNewTry] = useState("");

  const { fromLastSession, fromFootage, wantToTry = [] } = presession || {};
  const hasAnything = fromLastSession || fromFootage || wantToTry.length > 0;
  if (!hasAnything) return null;

  const startEdit = (field) => {
    setEditField(field);
    setEditText(presession[field] || "");
  };

  const saveEdit = () => {
    setPresession(prev => ({ ...prev, [editField]: editText.trim() || null }));
    setEditField(null);
    setEditText("");
  };

  const clearField = (field) => {
    setPresession(prev => ({ ...prev, [field]: null }));
  };

  const addTry = () => {
    if (!newTry.trim()) return;
    setPresession(prev => ({
      ...prev,
      wantToTry: [...(prev.wantToTry || []), { id: Date.now(), text: newTry.trim(), date: new Date().toISOString().split("T")[0] }],
    }));
    setNewTry("");
  };

  const removeTry = (id) => {
    setPresession(prev => ({
      ...prev,
      wantToTry: (prev.wantToTry || []).filter(i => i.id !== id),
    }));
  };

  const sectionStyle = { marginBottom:10 };
  const labelStyle = { fontSize:10, fontWeight:800, letterSpacing:1.2, color:C.textMuted, fontFamily:FONT_DISPLAY, marginBottom:4, display:"flex", alignItems:"center", gap:4 };
  const noteStyle = { fontSize:13, color:C.text, fontFamily:FONT_BODY, lineHeight:1.5 };

  const NoteSection = ({ field, label, value }) => (
    <div style={sectionStyle}>
      <div style={labelStyle}>
        {label}
        <button onClick={() => startEdit(field)} style={{ background:"none", border:"none", cursor:"pointer", padding:2 }}>
          <Ic n="edit" s={10} c={C.textMuted}/>
        </button>
        <button onClick={() => clearField(field)} style={{ background:"none", border:"none", cursor:"pointer", padding:2 }}>
          <Ic n="x" s={10} c={C.textMuted}/>
        </button>
      </div>
      {editField === field ? (
        <div style={{ display:"flex", gap:6 }}>
          <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={2} autoFocus
            style={{
              flex:1, background:C.surfaceAlt, border:`1px solid ${C.border}`, borderRadius:8,
              padding:"8px 10px", color:C.text, fontSize:13, outline:"none", resize:"vertical", fontFamily:FONT_BODY,
            }}/>
          <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
            <button onClick={saveEdit} style={{ background:C.accent, border:"none", borderRadius:6, padding:"6px 8px", cursor:"pointer" }}>
              <Ic n="check" s={12} c="#fff"/>
            </button>
            <button onClick={() => setEditField(null)} style={{ background:C.surfaceAlt, border:`1px solid ${C.border}`, borderRadius:6, padding:"6px 8px", cursor:"pointer" }}>
              <Ic n="x" s={12} c={C.textMuted}/>
            </button>
          </div>
        </div>
      ) : (
        <div style={noteStyle}>{value}</div>
      )}
    </div>
  );

  return (
    <div style={{
      margin:"4px 12px 8px", padding:"12px 14px", borderRadius:14,
      background:`${C.accent}08`, border:`1.5px solid ${C.accent}30`,
    }}>
      <div style={{
        fontSize:11, fontWeight:800, letterSpacing:1.5, color:C.accent,
        fontFamily:FONT_DISPLAY, marginBottom:10, display:"flex", alignItems:"center", gap:6,
      }}>
        <Ic n="scroll" s={13} c={C.accent}/>
        {t("beforeYouTrain")}
      </div>

      {fromLastSession && <NoteSection field="fromLastSession" label={t("fromLastSession")} value={fromLastSession}/>}
      {fromFootage && <NoteSection field="fromFootage" label={t("fromFootageReview")} value={fromFootage}/>}

      {wantToTry.length > 0 && (
        <div style={sectionStyle}>
          <div style={labelStyle}>{t("wantToTry")}</div>
          {wantToTry.map(item => (
            <div key={item.id} style={{
              display:"flex", alignItems:"center", gap:8, padding:"4px 0",
            }}>
              <button onClick={() => removeTry(item.id)}
                style={{
                  width:20, height:20, borderRadius:4, border:`1.5px solid ${C.border}`,
                  background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                  flexShrink:0,
                }}>
                <Ic n="check" s={10} c={C.textMuted}/>
              </button>
              <span style={{ fontSize:13, color:C.text, fontFamily:FONT_BODY }}>{item.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Inline add "want to try" */}
      <div style={{ display:"flex", gap:6, marginTop:4 }}>
        <input value={newTry} onChange={e => setNewTry(e.target.value)} placeholder={t("addNote")}
          onKeyDown={e => { if(e.key === "Enter") addTry(); }}
          style={{
            flex:1, background:C.surfaceAlt, border:`1px solid ${C.border}`, borderRadius:8,
            padding:"9px 12px", color:C.text, fontSize:14, outline:"none", fontFamily:FONT_BODY,
          }}/>
        <button onClick={addTry} disabled={!newTry.trim()}
          style={{
            background: newTry.trim() ? C.accent : C.surfaceAlt, border:"none", borderRadius:8,
            padding:"0 12px", cursor: newTry.trim() ? "pointer" : "default",
          }}>
          <Ic n="plus" s={14} c={newTry.trim() ? "#fff" : C.textMuted}/>
        </button>
      </div>
    </div>
  );
};
