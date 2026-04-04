import React, { useMemo } from 'react';
import { FONT_DISPLAY, FONT_BODY } from '../../../constants/fonts';
import { useSettings } from '../../../hooks/useSettings';
import { useT } from '../../../hooks/useTranslation';
import { Ic } from '../../shared/Ic';

export const BattlePrepCard = ({ battleprep, onNavigate }) => {
  const { C } = useSettings();
  const t = useT();

  const plan = useMemo(() => {
    const plans = battleprep?.plans || [];
    return plans.find(p => !p.completed && !p.archived) || null;
  }, [battleprep]);

  if (!plan) return null;

  const todayStr = new Date().toISOString().split("T")[0];
  const endDate = plan.battles?.[plan.battles.length - 1]?.date;
  const daysLeft = endDate ? Math.max(0, Math.ceil((new Date(endDate + "T12:00:00") - new Date()) / 86400000)) : null;

  // Find today's phase
  const todaySchedule = (plan.schedule || []).find(s => s.date === todayStr);
  const phase = todaySchedule?.phase || plan.currentPhase || "";

  // Count today's tasks
  const todayTasks = (todaySchedule?.tasks || []).length;

  return (
    <button onClick={() => onNavigate?.("battle", "prep")}
      style={{
        display:"block", width:"100%", textAlign:"left", cursor:"pointer",
        background:C.surface, borderRadius:14, border:`1.5px solid ${C.border}`,
        borderLeft:`4px solid ${C.red}`, padding:"12px 14px", marginBottom:8,
      }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
        <span style={{ fontSize:11, fontWeight:800, letterSpacing:1.5, color:C.textMuted, fontFamily:FONT_DISPLAY }}>
          {t("battlePrepCard")}
        </span>
        <Ic n="chevR" s={13} c={C.textMuted}/>
      </div>
      <div style={{ fontSize:14, fontWeight:800, color:C.text, fontFamily:FONT_DISPLAY, marginBottom:4 }}>
        {plan.name || plan.preset || "Battle Plan"}
      </div>
      <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
        {daysLeft !== null && (
          <span style={{ fontSize:11, color:C.textSec, fontFamily:FONT_BODY }}>
            {daysLeft} {t("daysLeft")}
          </span>
        )}
        {phase && (
          <span style={{ fontSize:11, color:C.accent, fontWeight:700, fontFamily:FONT_DISPLAY, letterSpacing:0.5 }}>
            {phase}
          </span>
        )}
        {todayTasks > 0 && (
          <span style={{ fontSize:11, color:C.textMuted, fontFamily:FONT_BODY }}>
            {todayTasks} {t("todaysTasks")}
          </span>
        )}
      </div>
    </button>
  );
};
