import React, { useState, useRef } from 'react';
import { C } from '../../constants/colors';
import { FONT_BODY } from '../../constants/fonts';
import { lbl } from '../../constants/styles';
import { Ic } from '../shared/Ic';
import { Btn } from '../shared/Btn';
import { useT } from '../../hooks/useTranslation';
import { ensureHttps } from './helpers';

export const JournalEntryInput = ({ onAdd, placeholder }) => {
  const [text, setText] = useState("");
  const [link, setLink] = useState("");
  const textRef = useRef(null);
  const linkRef = useRef(null);
  const t = useT();
  const handleAdd = () => {
    if (!text.trim()) return;
    onAdd({ text: text.trim(), link: ensureHttps(link.trim()) });
    setText(""); setLink("");
    if (textRef.current) textRef.current.focus();
  };
  const inputStyle = { width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8,
    padding:"9px 12px", color:C.text, fontSize:13, outline:"none", fontFamily:FONT_BODY, boxSizing:"border-box" };
  return (
    <div style={{ marginBottom:20 }}>
      <label style={{ ...lbl(), fontSize:11, letterSpacing:1.5 }}>{t("todaysNote")}</label>
      <textarea ref={textRef} value={text} onChange={e=>setText(e.target.value)} rows={4}
        placeholder={placeholder||"How did today's session go? What did you learn? Any breakthroughs or setbacks…"}
        style={{ ...inputStyle, resize:"vertical", lineHeight:1.5, marginBottom:8 }}/>
      <div style={{ marginBottom:4 }}>
        <label style={{ ...lbl(), fontSize:11, letterSpacing:1.5 }}>VIDEO REFERENCE LINK (optional)</label>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
        <input ref={linkRef} value={link} onChange={e=>setLink(e.target.value)}
          placeholder="https://youtube.com/…"
          style={{ flex:1, ...inputStyle, fontSize:12 }}/>
        {link&&<a href={link.startsWith("http")?link:"https://"+link} target="_blank" rel="noopener noreferrer"
          style={{ flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center",
            width:34, height:34, borderRadius:8, background:C.accent, color:C.bg, textDecoration:"none" }}
          title="Open link"><Ic n="extLink" s={15} c="#fff"/></a>}
      </div>
      <Btn onClick={handleAdd} disabled={!text.trim()}>{t("addEntryBtn")}</Btn>
    </div>
  );
};
