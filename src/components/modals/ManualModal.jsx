import React, { useState, useRef, useEffect, useMemo } from "react";
import { FONT_DISPLAY, FONT_BODY } from "../../constants/fonts";
import { Ic } from "../shared/Ic";
import { useT, usePlural } from "../../hooks/useTranslation";
import { useSettings } from "../../hooks/useSettings";
import { MANUAL_CONTENT } from "../../constants/manualContent";

export const ManualModal = ({ onClose }) => {
  const { C, settings } = useSettings();
  const sections = MANUAL_CONTENT[settings?.language || "en"] || MANUAL_CONTENT.en;
  const t = useT();
  const { resultCountStr } = usePlural();
  const [search, setSearch] = useState("");
  const [openSections, setOpenSections] = useState({});
  const searchRef = useRef(null);

  const q = search.toLowerCase().trim();

  const filtered = sections.map(sec => ({
    ...sec,
    items: sec.items.filter(item =>
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.body.toLowerCase().includes(q)
    )
  })).filter(sec => !q || sec.items.length > 0);

  // Auto-expand all sections when searching
  const sectionsOpen = q
    ? Object.fromEntries(filtered.map(s => [s.id, true]))
    : openSections;

  const toggleSection = (id) => {
    if (q) return; // don't toggle when searching
    setOpenSections(p => ({ ...p, [id]: !p[id] }));
  };

  const highlight = (text) => {
    if (!q) return text;
    const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === q
        ? <mark key={i} style={{ background:`${C.accent}40`, color:C.text, borderRadius:2, padding:"0 1px" }}>{part}</mark>
        : part
    );
  };

  return (
    <div style={{ position:"absolute", inset:0, zIndex:900, display:"flex", flexDirection:"column",
      background:C.bg }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 16px",
        background:C.surface, borderBottom:`2px solid ${C.border}`, flexShrink:0 }}>
        <span style={{ fontWeight:900, fontSize:16, letterSpacing:2, fontFamily:FONT_DISPLAY, color:C.accent }}>
          {t("userManual")}
        </span>
        <div style={{ flex:1 }}/>
        <button onClick={onClose}
          style={{ background:"none", border:"none", cursor:"pointer", padding:4, display:"flex" }}>
          <Ic n="x" s={20} c={C.textMuted}/>
        </button>
      </div>

      {/* Search bar */}
      <div style={{ padding:"10px 14px", background:C.surface, borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, background:C.bg,
          border:`1.5px solid ${q ? C.accent : C.border}`, borderRadius:10, padding:"7px 12px",
          transition:"border-color 0.15s" }}>
          <span style={{ fontSize:14, color:C.textMuted }}>🔍</span>
          <input
            ref={searchRef}
            value={search}
            onChange={e=>setSearch(e.target.value)}
            placeholder={t("searchManual")}
            style={{ flex:1, background:"none", border:"none", outline:"none", color:C.text,
              fontSize:13, fontFamily:FONT_BODY }}
            autoFocus
          />
          {search&&(
            <button onClick={()=>setSearch("")}
              style={{ background:"none", border:"none", cursor:"pointer", padding:0, display:"flex" }}>
              <Ic n="x" s={13} c={C.textMuted}/>
            </button>
          )}
        </div>
        {q&&(
          <div style={{ fontSize:11, color:C.textMuted, marginTop:6, fontFamily:FONT_DISPLAY }}>
            {resultCountStr(filtered.reduce((acc,s)=>acc+s.items.length,0))} for "{search}"
          </div>
        )}
      </div>

      {/* Sections */}
      <div style={{ flex:1, overflow:"auto", padding:"8px 0 80px" }}>
        {filtered.length===0&&(
          <div style={{ textAlign:"center", padding:"60px 20px", color:C.textMuted }}>
            <div style={{ fontSize:32, marginBottom:10 }}>🤷</div>
            <div style={{ fontSize:14, fontWeight:700, fontFamily:FONT_DISPLAY, marginBottom:6 }}>{t("nothingFound")}</div>
            <div style={{ fontSize:12 }}>{t("tryDifferentKeywords")}</div>
          </div>
        )}
        {filtered.map(sec=>{
          const isOpen = sectionsOpen[sec.id];
          return (
            <div key={sec.id} style={{ borderBottom:`1px solid ${C.borderLight}` }}>
              {/* Section header */}
              <button
                onClick={()=>toggleSection(sec.id)}
                style={{ width:"100%", display:"flex", alignItems:"center", gap:10,
                  padding:"12px 16px", background:"none", border:"none", cursor:"pointer",
                  textAlign:"left" }}>
                <span style={{ fontSize:18 }}>{sec.icon}</span>
                <span style={{ flex:1, fontWeight:900, fontSize:13, letterSpacing:1.5,
                  fontFamily:FONT_DISPLAY, color:C.text }}>{sec.title.replace(/^\p{Emoji}\s*/u, "")}</span>
                <span style={{ fontSize:11, color:C.textMuted, fontFamily:FONT_DISPLAY,
                  marginRight:4 }}>{sec.items.length}</span>
                <Ic n={isOpen?"chevD":"chevR"} s={13} c={C.textMuted}/>
              </button>

              {/* Items */}
              {isOpen&&sec.items.map((item,i)=>(
                <div key={i} style={{ padding:"10px 16px 14px 44px",
                  background: i%2===0 ? C.surface : "transparent",
                  borderTop:`1px solid ${C.borderLight}` }}>
                  <div style={{ fontWeight:800, fontSize:13, color:C.accent,
                    fontFamily:FONT_DISPLAY, letterSpacing:0.5, marginBottom:6 }}>
                    {highlight(item.title)}
                  </div>
                  <div style={{ fontSize:12, color:C.textSec, lineHeight:1.75,
                    whiteSpace:"pre-wrap", fontFamily:FONT_BODY }}>
                    {highlight(item.body)}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};
