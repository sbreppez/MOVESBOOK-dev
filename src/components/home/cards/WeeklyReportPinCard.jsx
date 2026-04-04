import React, { useMemo } from 'react';
import { FONT_DISPLAY } from '../../../constants/fonts';
import { useSettings } from '../../../hooks/useSettings';
import { useT } from '../../../hooks/useTranslation';
import { computeWeeklyReport } from '../../../utils/reportEngine';

export const WeeklyReportPinCard = ({ moves, reps, sparring, musicflow, calendar, cats, catColors }) => {
  const { C } = useSettings();
  const t = useT();

  const report = useMemo(() => {
    const now = new Date();
    const dow = now.getDay();
    const lastMon = new Date(now);
    lastMon.setDate(lastMon.getDate() - ((dow + 6) % 7) - 7);
    const weekStart = lastMon.toISOString().split("T")[0];
    return computeWeeklyReport(weekStart, { moves, reps, sparring, musicflow, calendar, cats });
  }, [moves, reps, sparring, musicflow, calendar, cats]);

  if (!report || (report.sessionCount === 0 && report.movesAdded === 0)) return null;

  const catColor = report.sharpestCategory && catColors?.[report.sharpestCategory]
    ? catColors[report.sharpestCategory] : C.accent;

  return (
    <div style={{
      background:C.surface, borderRadius:14, border:`1.5px solid ${C.border}`,
      borderLeft:`4px solid ${C.accent}`, padding:"12px 14px", marginBottom:8,
    }}>
      <div style={{ fontSize:11, fontWeight:800, letterSpacing:1.5, color:C.textMuted, fontFamily:FONT_DISPLAY, marginBottom:10 }}>
        {t("weeklyReportPin")}
      </div>
      <div style={{ display:"flex", gap:12, alignItems:"flex-end" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:22, fontWeight:900, fontFamily:FONT_DISPLAY, color:C.accent }}>{report.sessionCount}</div>
          <div style={{ fontSize:9, fontWeight:800, letterSpacing:1, color:C.textMuted, fontFamily:FONT_DISPLAY }}>{t("sessionsCount")}</div>
        </div>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:22, fontWeight:900, fontFamily:FONT_DISPLAY, color:C.green }}>{report.movesAdded}</div>
          <div style={{ fontSize:9, fontWeight:800, letterSpacing:1, color:C.textMuted, fontFamily:FONT_DISPLAY }}>{t("movesAddedLabel")}</div>
        </div>
        {report.sharpestCategory && (
          <div style={{ textAlign:"center" }}>
            <div style={{
              fontSize:11, fontWeight:800, fontFamily:FONT_DISPLAY, letterSpacing:0.5,
              padding:"4px 10px", borderRadius:8, background:`${catColor}24`, color:catColor,
            }}>{report.sharpestCategory}</div>
            <div style={{ fontSize:9, fontWeight:800, letterSpacing:1, color:C.textMuted, fontFamily:FONT_DISPLAY, marginTop:3 }}>{t("sharpest")}</div>
          </div>
        )}
      </div>
    </div>
  );
};
