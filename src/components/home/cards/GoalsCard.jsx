import React, { useMemo } from 'react';
import { FONT_DISPLAY, FONT_BODY } from '../../../constants/fonts';
import { useSettings } from '../../../hooks/useSettings';
import { useT } from '../../../hooks/useTranslation';

export const GoalsCard = ({ ideas }) => {
  const { C } = useSettings();
  const t = useT();

  const goals = useMemo(() => {
    if (!ideas || !Array.isArray(ideas)) return [];
    return ideas.filter(i => i.type === "goal" || i.type === "target").slice(0, 3);
  }, [ideas]);

  if (goals.length === 0) return null;

  return (
    <div style={{
      background:C.surface, borderRadius:14, border:`1.5px solid ${C.border}`,
      borderLeft:`4px solid ${C.green}`, padding:"12px 14px", marginBottom:8,
    }}>
      <div style={{ fontSize:11, fontWeight:800, letterSpacing:1.5, color:C.textMuted, fontFamily:FONT_DISPLAY, marginBottom:8 }}>
        {t("goalsCard")}
      </div>
      {goals.map((g, i) => {
        const progress = g.type === "target" ? Math.round((g.currentCount || 0) / Math.max(1, g.targetCount || 1) * 100) : (g.progress || 0);
        return (
          <div key={g.id || i} style={{ padding:"5px 0", borderTop: i > 0 ? `1px solid ${C.borderLight}` : "none" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:3 }}>
              <span style={{ fontSize:13, fontWeight:700, color:C.text, fontFamily:FONT_BODY }}>{g.name || g.text}</span>
              <span style={{ fontSize:11, fontWeight:800, color:C.accent, fontFamily:FONT_DISPLAY }}>{progress}%</span>
            </div>
            <div style={{ height:4, borderRadius:2, background:C.surfaceAlt, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${Math.min(100, progress)}%`, background:C.green, borderRadius:2, transition:"width 0.3s" }}/>
            </div>
          </div>
        );
      })}
    </div>
  );
};
