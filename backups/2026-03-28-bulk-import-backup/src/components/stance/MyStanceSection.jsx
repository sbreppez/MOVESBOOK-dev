import React from "react";
import { FONT_DISPLAY, FONT_BODY } from "../../constants/fonts";
import { useT } from "../../hooks/useTranslation";
import { useSettings } from "../../hooks/useSettings";

export const STANCE_DOMAINS = ["musicality","performance","technique","variety","creativity","personality"];

export const MyStanceSection = ({ moveCount, stance, onOpenAssessment }) => {
  const { C } = useSettings();
  const t = useT();
  const assessments = stance?.assessments || [];
  const hasAssessment = assessments.length > 0;

  // Nothing if <10 moves and no assessments
  if (moveCount < 10 && !hasAssessment) return null;

  // Invitation card when 10+ moves but no assessment yet
  if (!hasAssessment) return (
    <div style={{ background:C.surface, borderRadius:14, border:`1px solid ${C.border}`,
      padding:20, margin:"12px 0", textAlign:"center" }}>
      <div style={{ fontSize:32, marginBottom:10 }}>🧭</div>
      <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:18, color:C.text, marginBottom:8 }}>
        {t("mapYourStance")}
      </div>
      <div style={{ fontFamily:FONT_BODY, fontSize:13, color:C.textSec, lineHeight:1.6, marginBottom:16 }}>
        {t("stanceIntro")}
      </div>
      <button onClick={onOpenAssessment}
        style={{ width:"100%", padding:"12px 0", background:C.accent, color:"#fff", border:"none",
          borderRadius:10, fontSize:14, fontFamily:FONT_DISPLAY, fontWeight:800, letterSpacing:1.2,
          cursor:"pointer" }}>
        {t("mapMyStance")} →
      </button>
    </div>
  );

  // Summary display when assessments exist
  const latest = assessments[assessments.length - 1];
  const isFirst = assessments.length === 1;

  return (
    <div style={{ background:C.surface, borderRadius:14, border:`1px solid ${C.border}`,
      padding:16, margin:"12px 0" }}>
      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:12 }}>
        <span style={{ fontSize:14 }}>🧭</span>
        <span style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:14, color:C.text }}>
          {t("myStance")}
        </span>
      </div>
      <div style={{ fontFamily:FONT_BODY, fontSize:13, color:C.textSec, lineHeight:1.8 }}>
        {STANCE_DOMAINS.map((d, i) => (
          <span key={d}>
            {t(d)}: <span style={{ color:C.text, fontWeight:700 }}>{latest.scores[d]}</span>
            {i < STANCE_DOMAINS.length - 1 ? " · " : ""}
          </span>
        ))}
      </div>
      {isFirst && (
        <div style={{ fontFamily:FONT_BODY, fontSize:12, color:C.textMuted, lineHeight:1.6,
          marginTop:10, fontStyle:"italic" }}>
          {t("stanceFirstResult")}
        </div>
      )}
      <button onClick={onOpenAssessment}
        style={{ marginTop:12, width:"100%", padding:"10px 0", background:"none",
          border:`1px solid ${C.accent}`, borderRadius:10, color:C.accent,
          fontSize:13, fontFamily:FONT_DISPLAY, fontWeight:700, letterSpacing:1,
          cursor:"pointer" }}>
        {t("updateMyStance")}
      </button>
    </div>
  );
};
