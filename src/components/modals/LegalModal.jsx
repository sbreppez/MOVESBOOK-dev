import React from "react";
import { FONT_DISPLAY, FONT_BODY } from "../../constants/fonts";
import { Ic } from "../shared/Ic";
import { useT } from "../../hooks/useTranslation";
import { useSettings } from "../../hooks/useSettings";
import { LEGAL_CONTENT } from "../../constants/legalContent";

export const LegalModal = ({ page, onClose }) => {
  const { C, settings } = useSettings();
  const t = useT();
  const lang = settings?.language || "en";
  const content = LEGAL_CONTENT[lang]?.[page] || LEGAL_CONTENT.en[page];

  return (
    <div style={{ position:"absolute", inset:0, zIndex:910, display:"flex", flexDirection:"column", background:C.bg }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 16px",
        background:C.surface, borderBottom:`2px solid ${C.border}`, flexShrink:0 }}>
        <span style={{ fontWeight:900, fontSize:16, letterSpacing:2, fontFamily:FONT_DISPLAY, color:C.accent,
          textTransform:"uppercase" }}>
          {content.title}
        </span>
        <div style={{ flex:1 }}/>
        <button onClick={onClose}
          style={{ background:"none", border:"none", cursor:"pointer", padding:4, display:"flex" }}>
          <Ic n="x" s={20} c={C.textMuted}/>
        </button>
      </div>

      {/* Last updated */}
      <div style={{ padding:"8px 16px", fontSize:11, color:C.textMuted, fontFamily:FONT_BODY,
        borderBottom:`1px solid ${C.borderLight}`, flexShrink:0 }}>
        {t("lastUpdated")}: {content.lastUpdated}
      </div>

      {/* Sections */}
      <div style={{ flex:1, overflow:"auto", padding:"8px 0 80px" }}>
        {content.sections.map((sec, i) => (
          <div key={i} style={{ padding:"14px 16px", borderBottom:`1px solid ${C.borderLight}`,
            background: i % 2 === 0 ? C.surface : "transparent" }}>
            <div style={{ fontWeight:800, fontSize:13, color:C.accent,
              fontFamily:FONT_DISPLAY, letterSpacing:0.5, marginBottom:8,
              textTransform:"uppercase" }}>
              {sec.heading}
            </div>
            <div style={{ fontSize:12, color:C.textSec, lineHeight:1.75,
              whiteSpace:"pre-wrap", fontFamily:FONT_BODY }}>
              {sec.body}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
