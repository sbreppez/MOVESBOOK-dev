import React, { useState } from "react";
import { FONT_DISPLAY, FONT_BODY } from "../../constants/fonts";
import { Ic } from "../shared/Ic";
import { useT } from "../../hooks/useTranslation";
import { useSettings } from "../../hooks/useSettings";
import { STANCE_DOMAINS } from "./MyStanceSection";

const SCREEN_CONTENT = [
  { key:"musicality",   descKey:"musicality_desc", qKeys:["musicality_s1","musicality_s2","musicality_s3","musicality_s4","musicality_s5","musicality_s6","musicality_s7","musicality_s8","musicality_s9","musicality_s10"] },
  { key:"performance",  descKey:"performance_desc", qKeys:["performance_s1","performance_s2","performance_s3","performance_s4","performance_s5","performance_s6","performance_s7","performance_s8","performance_s9","performance_s10"] },
  { key:"technique",    descKey:"technique_desc",   qKeys:["technique_s1","technique_s2","technique_s3","technique_s4","technique_s5","technique_s6","technique_s7","technique_s8","technique_s9","technique_s10"] },
  { key:"variety",      descKey:"variety_desc",     qKeys:["variety_s1","variety_s2","variety_s3","variety_s4","variety_s5","variety_s6","variety_s7","variety_s8","variety_s9","variety_s10"] },
  { key:"creativity",   descKey:"creativity_desc",  qKeys:["creativity_s1","creativity_s2","creativity_s3","creativity_s4","creativity_s5","creativity_s6","creativity_s7","creativity_s8","creativity_s9","creativity_s10"] },
  { key:"personality",  descKey:"personality_desc",  qKeys:["personality_s1","personality_s2","personality_s3","personality_s4","personality_s5","personality_s6","personality_s7","personality_s8","personality_s9","personality_s10"] },
];

export const MyStanceAssessment = ({ stance, onStanceChange, addToast, onClose }) => {
  const { C } = useSettings();
  const t = useT();
  const [screen, setScreen] = useState(0);
  const latestScores = stance?.assessments?.length ? stance.assessments[stance.assessments.length - 1].scores : null;
  const [scores, setScores] = useState(
    latestScores ? { ...latestScores } : { musicality:5, performance:5, technique:5, variety:5, creativity:5, personality:5 }
  );

  const current = SCREEN_CONTENT[screen];
  const isLast = screen === 5;

  const handleScore = (val) => {
    setScores(prev => ({ ...prev, [current.key]: val }));
  };

  const handleSave = () => {
    const today = new Date().toISOString().split("T")[0];
    onStanceChange(prev => {
      const existing = prev.assessments || [];
      const filtered = existing.filter(a => a.date !== today);
      return {
        ...prev,
        assessments: [...filtered, { id: Date.now(), date: today, scores: { ...scores } }],
      };
    });
    addToast({ icon:"compass", title:t("stanceSaved") });
    onClose();
  };

  const handleNext = () => {
    if (isLast) handleSave();
    else setScreen(s => s + 1);
  };

  return (
    <div style={{ position:"absolute", inset:0, zIndex:500, background:C.bg,
      display:"flex", flexDirection:"column", overflow:"hidden" }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"13px 18px", borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
        <div style={{ width:40 }}>
          {screen > 0 && (
            <button onClick={() => setScreen(s => s - 1)}
              style={{ background:"none", border:"none", cursor:"pointer", padding:4, display:"flex" }}>
              <Ic n="chevL" s={18} c={C.text}/>
            </button>
          )}
        </div>
        <span style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:15, letterSpacing:2,
          color:C.brown, textAlign:"center" }}>
          {t("myStance")}
        </span>
        <button onClick={onClose}
          style={{ background:"none", border:"none", cursor:"pointer", padding:4,
            color:C.textMuted, fontSize:12, fontFamily:FONT_DISPLAY, fontWeight:700, letterSpacing:1 }}>
          {t("skip")||"SKIP"}
        </button>
      </div>

      {/* Progress dots */}
      <div style={{ display:"flex", justifyContent:"center", gap:8, padding:"14px 0 6px" }}>
        {STANCE_DOMAINS.map((_, i) => (
          <div key={i} style={{ width:8, height:8, borderRadius:4,
            background: i === screen ? C.accent : C.borderLight,
            transition:"background 0.2s" }}/>
        ))}
      </div>

      {/* Scrollable content */}
      <div style={{ flex:1, overflowY:"auto", padding:"0 24px 24px",
        display:"flex", flexDirection:"column", alignItems:"center" }}>

        {/* Domain name */}
        <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:28, color:C.text,
          textAlign:"center", marginTop:20, letterSpacing:1.5 }}>
          {t(current.key)}
        </div>

        {/* Description */}
        <div style={{ fontFamily:FONT_BODY, fontSize:14, color:C.textSec, textAlign:"center",
          marginTop:8, maxWidth:340, lineHeight:1.5 }}>
          {t(current.descKey)}
        </div>

        {/* Sub-questions */}
        <div style={{ marginTop:24, maxWidth:340, width:"100%" }}>
          {current.qKeys.map((qk, i) => (
            <div key={i} style={{ fontFamily:FONT_BODY, fontSize:12, color:C.textMuted,
              textAlign:"center", lineHeight:1.6, marginBottom:2 }}>
              {t(qk)}
            </div>
          ))}
        </div>

        {/* Large value display */}
        <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:48, color:C.text,
          marginTop:32, textAlign:"center" }}>
          {scores[current.key]}
        </div>

        {/* Slider */}
        <div style={{ width:"100%", maxWidth:340, marginTop:12 }}>
          <input type="range" min={1} max={10} step={1}
            value={scores[current.key]}
            onChange={e => handleScore(+e.target.value)}
            style={{ width:"100%", accentColor:C.accent, cursor:"pointer" }}/>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
            <span style={{ fontSize:11, color:C.textMuted, fontFamily:FONT_BODY }}>
              1 — {t("justStarting")}
            </span>
            <span style={{ fontSize:11, color:C.textMuted, fontFamily:FONT_BODY }}>
              10 — {t("worldClass")}
            </span>
          </div>
        </div>

        {/* Spacer */}
        <div style={{ flex:1, minHeight:24 }}/>

        {/* Next / Save button */}
        <button onClick={handleNext}
          style={{ width:"100%", maxWidth:340, padding:"14px 0", background:C.accent, color:"#fff",
            border:"none", borderRadius:10, fontSize:14, fontFamily:FONT_DISPLAY, fontWeight:800,
            letterSpacing:1.2, cursor:"pointer", marginTop:8, marginBottom:16 }}>
          {isLast ? `${t("saveMyStance")} →` : `${t("next")||"NEXT"} →`}
        </button>
      </div>
    </div>
  );
};
