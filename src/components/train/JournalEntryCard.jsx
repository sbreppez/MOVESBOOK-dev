import React, { Fragment, useState } from 'react';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { Ic } from '../shared/Ic';
import { Txtarea } from '../shared/Txtarea';
import { useT } from '../../hooks/useTranslation';
import { useSettings } from '../../hooks/useSettings';
import { ensureHttps } from './helpers';

export const JournalEntryCard = ({ entry, onDelete, onUpdate }) => {
  const { C } = useSettings();
  const t = useT();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(entry.text || "");
  const [link, setLink] = useState(entry.link || "");
  const inputStyle = { width:"100%", background:C.surfaceAlt, border:`1px solid ${C.border}`, borderRadius:7,
    padding:"9px 12px", color:C.text, fontSize:14, outline:"none", fontFamily:FONT_BODY, boxSizing:"border-box" };
  const save = () => { onUpdate({ text:text.trim(), link:ensureHttps(link.trim()) }); setEditing(false); };
  return (
    <div style={{ background:C.surface, borderRadius:8,
      padding:"12px 14px", marginBottom:10 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
        <span style={{ fontSize:10, fontWeight:800, color:C.accent, letterSpacing:1.5, fontFamily:FONT_DISPLAY }}>{entry.date}</span>
        <div style={{ display:"flex", gap:4 }}>
          <button onClick={()=>{ setText(entry.text||""); setLink(entry.link||""); setEditing(x=>!x); }}
            style={{ background:"none", border:"none", cursor:"pointer", padding:2, display:"flex" }}>
            <Ic n="edit" s={12} c={editing?C.accent:C.textMuted}/>
          </button>
          <button onClick={onDelete}
            style={{ background:"none", border:"none", cursor:"pointer", padding:2, display:"flex" }}>
            <Ic n="x" s={13} c={C.textMuted}/>
          </button>
        </div>
      </div>
      {editing ? (
        <div>
          <Txtarea
            value={text}
            onChange={setText}
            rows={3}
            autoExpand
          />
          <input value={link} onChange={e=>setLink(e.target.value)}
            placeholder={t("videoRefLink")}
            style={{ ...inputStyle, marginBottom:8 }}/>
          <div style={{ display:"flex", gap:6, justifyContent:"flex-end" }}>
            <button onClick={()=>setEditing(false)}
              style={{ padding:"5px 12px", background:"none", border:`1px solid ${C.border}`, borderRadius:6,
                color:C.textMuted, fontSize:11, cursor:"pointer", fontFamily:FONT_DISPLAY }}>{t("cancel")}</button>
            <button onClick={save}
              style={{ padding:"5px 12px", background:C.accent, border:"none", borderRadius:6,
                color:"#fff", fontSize:11, cursor:"pointer", fontWeight:700, fontFamily:FONT_DISPLAY }}>{t("save")}</button>
          </div>
        </div>
      ) : (
        <Fragment>
          <p style={{ fontSize:13, color:C.textSec, lineHeight:1.6, whiteSpace:"pre-wrap", margin:0 }}>{entry.text}</p>
          {entry.link&&<a href={entry.link.startsWith("http")?entry.link:"https://"+entry.link} target="_blank" rel="noopener noreferrer"
            style={{ display:"inline-flex", alignItems:"center", gap:4, marginTop:6, fontSize:11, color:C.accent,
              fontWeight:700, fontFamily:FONT_DISPLAY, textDecoration:"none", letterSpacing:0.5 }}>
            <Ic n="extLink" s={11} c={C.accent}/>{t("viewReference")}
          </a>}
        </Fragment>
      )}
    </div>
  );
};
