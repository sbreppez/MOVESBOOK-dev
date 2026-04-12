import React, { useState } from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { lbl } from '../../constants/styles';
import { IDEA_COLORS } from '../../constants/categories';
import { Btn } from '../shared/Btn';
import { Ic } from '../shared/Ic';
import { useT } from '../../hooks/useTranslation';
import { ensureHttps } from './helpers';
import { todayLocal } from '../../utils/dateUtils';

export const NoteModal = ({ onClose, onSave, idea }) => {
  const t = useT();
  const [title, setTitle] = useState(idea?.title || "");
  const [text,  setText]  = useState(idea?.text  || "");
  const [color, setColor] = useState(idea?.color || IDEA_COLORS[1]);
  const [link,  setLink]  = useState(idea?.link  || "");
  const [showDate, setShowDate] = useState(idea?.showDate || "");
  const [pinnedNotes, setPinnedNotes] = useState(idea?.pinnedNotes || idea?.pinned || false);
  const [homeOnly, setHomeOnly] = useState(idea?.homeOnly !== false);
  const isEdit = !!idea;
  const handleSave = () => {
    if (!title.trim() && !text.trim()) return;
    onSave({ type:"note", title:title.trim(), text:text.trim(), color, link:ensureHttps(link.trim()),
      showDate:showDate||null, pinnedNotes, homeOnly });
    onClose();
  };
  const taStyle = { width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8,
    padding:"9px 12px", color:C.text, fontSize:13, outline:"none", resize:"vertical",
    fontFamily:FONT_BODY, boxSizing:"border-box", lineHeight:1.5 };
  return (
    <div style={{ width:"100%", maxHeight:"90%", background:C.surface, borderRadius:16, display:"flex", flexDirection:"column", overflow:"hidden", boxShadow:"0 16px 48px rgba(0,0,0,0.5)" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 16px", background:C.surface, borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
        <span style={{ fontWeight:900, fontSize:16, letterSpacing:2, fontFamily:FONT_DISPLAY, color:C.text }}>{isEdit?t("editNote"):t("newNote")}</span>
        <div style={{ display:"flex", gap:8 }}>
          <Btn variant="secondary" onClick={onClose}>{t("cancel")}</Btn>
          <Btn onClick={handleSave} disabled={!title.trim()&&!text.trim()}>{t("save")}</Btn>
        </div>
      </div>
      <div style={{ flex:1, overflow:"auto", padding:16 }}>
        <div style={{ fontSize:11, color:C.textMuted, fontFamily:FONT_BODY,
          lineHeight:1.5, marginBottom:10, fontStyle:"italic" }}>
          {t("noteHint")}
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={lbl()}>{t("title")}</label>
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder={t("noteTitle")}
            style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8,
              padding:"9px 12px", color:C.text, fontSize:14, outline:"none", fontFamily:FONT_BODY, boxSizing:"border-box" }}/>
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={lbl()}>{t("description")}</label>
          <textarea value={text} onChange={e=>setText(e.target.value)} placeholder={t("describeIdea")} rows={8} style={taStyle}/>
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={lbl()}>{t("videoRefLinkOptional")}</label>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <input value={link} onChange={e=>setLink(e.target.value)} placeholder="https://youtube.com/…"
              style={{ flex:1, background:C.surface, border:`1px solid ${C.border}`, borderRadius:8,
                padding:"9px 12px", color:C.text, fontSize:13, outline:"none", fontFamily:FONT_BODY, boxSizing:"border-box" }}/>
            {link&&<a href={link.startsWith("http")?link:"https://"+link} target="_blank" rel="noopener noreferrer"
              style={{ flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center",
                width:34, height:34, borderRadius:8, background:C.accent, color:C.bg, textDecoration:"none" }}
              title="Open link"><Ic n="extLink" s={15} c="#fff"/></a>}
          </div>
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={lbl()}>{t("showIdeaOn")}</label>
          <input type="date" value={showDate} onChange={e=>setShowDate(e.target.value)}
            style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8,
              padding:"9px 12px", color:C.text, fontSize:13, outline:"none", fontFamily:FONT_BODY,
              boxSizing:"border-box", marginTop:4 }}/>
          {showDate && showDate < todayLocal() && (
            <div style={{ fontSize:11, color:C.accent, fontWeight:700, fontFamily:FONT_DISPLAY,
              marginTop:4, display:"flex", alignItems:"center", gap:4 }}>
              <Ic n="info" s={12} c={C.accent}/>
              {t("pastDateWarning")}
            </div>
          )}
        </div>
        <div style={{ marginBottom:14 }}>
          <button onClick={()=>setPinnedNotes(!pinnedNotes)}
            style={{ display:"flex", alignItems:"center", gap:10, width:"100%",
              padding:"6px 0", background:"transparent", border:"none",
              cursor:"pointer", textAlign:"left" }}>
            <div style={{ width:20, height:20, borderRadius:5, flexShrink:0,
              border:`2px solid ${pinnedNotes?C.green:C.border}`,
              background:pinnedNotes?C.green:"transparent",
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              {pinnedNotes && <Ic n="check" s={12} c="#fff"/>}
            </div>
            <span style={{ fontSize:13, fontFamily:FONT_BODY, color:C.text }}>
              {t("pinToTop")}
            </span>
          </button>
        </div>
        <div style={{ marginBottom:14 }}>
          <button onClick={()=>setHomeOnly(!homeOnly)}
            style={{ display:"flex", alignItems:"center", gap:10, width:"100%",
              padding:"6px 0", background:"transparent", border:"none",
              cursor:"pointer", textAlign:"left" }}>
            <div style={{ width:20, height:20, borderRadius:5, flexShrink:0,
              border:`2px solid ${homeOnly?C.green:C.border}`,
              background:homeOnly?C.green:"transparent",
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              {homeOnly && <Ic n="check" s={12} c="#fff"/>}
            </div>
            <span style={{ fontSize:13, fontFamily:FONT_BODY, color:C.text }}>
              {t("showOnHome")}
            </span>
          </button>
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={lbl()}>{t("colour")}</label>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:6 }}>
            {IDEA_COLORS.map(c=>(
              <button key={c} onClick={()=>setColor(c)} style={{ width:30, height:30, borderRadius:6, background:c, cursor:"pointer", outline:"none",
                border: color===c ? `3px solid ${C.brown}` : `2px solid transparent` }}/>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
