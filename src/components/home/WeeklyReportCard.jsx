import React, { useMemo } from 'react';
import { FONT_DISPLAY } from '../../constants/fonts';
import { useT } from '../../hooks/useTranslation';
import { useSettings } from '../../hooks/useSettings';
import { Ic } from '../shared/Ic';
import { computeWeeklyReport } from '../../utils/reportEngine';
import { CAT_COLORS } from '../../constants/categories';

const getMonday = (dateStr) => {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split("T")[0];
};

const addDays = (dateStr, n) => {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
};

export const WeeklyReportCard = ({ moves, reps, sparring, musicflow, calendar, cats, catColors, reports, setReports }) => {
  const t = useT();
  const { C } = useSettings();

  const today = new Date().toISOString().split("T")[0];
  const thisMonday = getMonday(today);
  const lastMonday = addDays(thisMonday, -7);

  // Show if: it's Monday through Wednesday, or user hasn't dismissed this week's report
  const dayOfWeek = new Date(today + "T00:00:00").getDay();
  const showWindow = dayOfWeek >= 0 && dayOfWeek <= 3; // Sun-Wed (show through Wednesday)
  const dismissed = reports?.weeklyDismissed === thisMonday;

  const report = useMemo(() => {
    if (dismissed || !showWindow) return null;
    return computeWeeklyReport(lastMonday, { moves, reps, sparring, musicflow, calendar, cats });
  }, [dismissed, showWindow, lastMonday, moves, reps, sparring, musicflow, calendar, cats]);

  if (!report || dismissed || !showWindow) return null;
  // Don't show if nothing happened last week
  if (report.sessionCount === 0 && report.movesAdded === 0) return null;

  const catColor = report.sharpestCategory ? ((catColors || CAT_COLORS)[report.sharpestCategory] || C.accent) : null;

  const handleDismiss = () => {
    setReports(prev => ({ ...prev, weeklyDismissed: thisMonday }));
  };

  return (
    <div style={{ margin:"10px 14px 8px", padding:16, borderRadius:14,
      background:C.surface, border:`1.5px solid ${C.accent}30`,
      position:"relative" }}>

      <button onClick={handleDismiss}
        style={{ position:"absolute", top:10, right:10, background:"none", border:"none",
          cursor:"pointer", padding:4 }}>
        <Ic n="x" s={14} c={C.textMuted}/>
      </button>

      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
        <Ic n="barChart" s={16} c={C.accent}/>
        <span style={{ fontSize:12, fontWeight:900, letterSpacing:1.5, color:C.accent,
          fontFamily:FONT_DISPLAY }}>{t("lastWeek")}</span>
      </div>

      <div style={{ display:"flex", gap:16, alignItems:"center", flexWrap:"wrap" }}>
        <div>
          <div style={{ fontSize:22, fontWeight:900, color:C.text, fontFamily:FONT_DISPLAY }}>
            {report.sessionCount}
          </div>
          <div style={{ fontSize:9, fontWeight:700, letterSpacing:1, color:C.textMuted,
            fontFamily:FONT_DISPLAY }}>{t("sessionsCount")}</div>
        </div>

        {report.movesAdded > 0 && (
          <div>
            <div style={{ fontSize:22, fontWeight:900, color:C.text, fontFamily:FONT_DISPLAY }}>
              +{report.movesAdded}
            </div>
            <div style={{ fontSize:9, fontWeight:700, letterSpacing:1, color:C.textMuted,
              fontFamily:FONT_DISPLAY }}>{t("movesAddedLabel")}</div>
          </div>
        )}

        {report.sharpestCategory && (
          <div style={{ flex:1, textAlign:"right" }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:1, color:C.textMuted,
              fontFamily:FONT_DISPLAY, marginBottom:2 }}>{t("sharpest")}</div>
            <span style={{ fontSize:11, fontWeight:800, color:catColor,
              background:`${catColor}18`, borderRadius:6, padding:"2px 8px",
              fontFamily:FONT_DISPLAY }}>{report.sharpestCategory}</span>
          </div>
        )}
      </div>
    </div>
  );
};
