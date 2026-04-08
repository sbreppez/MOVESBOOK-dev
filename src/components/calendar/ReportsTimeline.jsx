import React, { useMemo, useState } from 'react';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { useT } from '../../hooks/useTranslation';
import { useSettings } from '../../hooks/useSettings';
import { Ic } from '../shared/Ic';
import { buildTimeline } from '../../utils/reportEngine';
import { CAT_COLORS } from '../../constants/categories';

const MONTH_KEYS = ["january","february","march","april","may","june","july","august","september","october","november","december"];

const formatShortDate = (dateStr) => {
  const d = new Date(dateStr + "T00:00:00");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}`;
};

export const ReportsTimeline = ({ moves, reps, sparring, musicflow, calendar, cats, catColors, battleprep, rivals, reports }) => {
  const t = useT();
  const { C } = useSettings();
  const [monthsBack, setMonthsBack] = useState(3);

  const timeline = useMemo(() => {
    const data = { moves, reps, sparring, musicflow, calendar, cats, battleprep, rivals };
    return buildTimeline(monthsBack, data, reports?.milestones || []);
  }, [moves, reps, sparring, musicflow, calendar, cats, battleprep, rivals, reports?.milestones, monthsBack]);

  if (!timeline.length) {
    return (
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:40 }}>
        <div style={{ textAlign:"center", color:C.textMuted }}>
          <Ic n="barChart" s={36} c={C.textMuted}/>
          <p style={{ fontSize:13, fontFamily:FONT_DISPLAY, fontWeight:700, letterSpacing:1, marginTop:12 }}>{t("calReports")}</p>
          <p style={{ fontSize:12, marginTop:6 }}>{t("noDataYet")}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex:1, overflow:"auto", padding:"10px 14px 80px" }}>
      {timeline.map((entry, idx) => {
        if (entry.type === "month") return <MonthTile key={`m-${entry.date}`} entry={entry} t={t} C={C} catColors={catColors}/>;
        if (entry.type === "week") return <WeekTile key={`w-${entry.date}`} entry={entry} t={t} C={C} catColors={catColors}/>;
        return <DayRow key={`d-${entry.date}`} entry={entry} t={t} C={C}/>;
      })}

      <button onClick={() => setMonthsBack(prev => prev + 3)}
        style={{ width:"100%", padding:"12px 0", marginTop:12, borderRadius:10, cursor:"pointer",
          border:`1px dashed ${C.border}`, background:"none",
          color:C.textMuted, fontSize:12, fontFamily:FONT_DISPLAY, fontWeight:700, letterSpacing:1 }}>
        {t("loadMore") || "Load more"}
      </button>
    </div>
  );
};

// ── Monthly Tile ────────────────────────────────────────────────────────────

const MonthTile = ({ entry, t, C, catColors }) => {
  const d = entry.data;
  const date = new Date(entry.date + "T00:00:00");
  const monthKey = MONTH_KEYS[date.getMonth()];
  const monthName = t(monthKey) || MONTH_KEYS[date.getMonth()];
  const year = date.getFullYear();

  return (
    <div style={{ background:C.surface, borderRadius:10,
      padding:18, marginBottom:14 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
        <Ic n="barChart" s={16} c={C.accent}/>
        <span style={{ fontSize:14, fontWeight:900, letterSpacing:1.5, color:C.accent,
          fontFamily:FONT_DISPLAY }}>{monthName.toUpperCase()} {year}</span>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:12 }}>
        <StatBox label={t("sessionsCount")} value={d.totalSessions} C={C}/>
        <StatBox label={t("movesAddedLabel")} value={d.movesAdded} C={C}/>
        <StatBox label={t("staleLabel")} value={d.staleCount} C={C} warn={d.staleCount > 0}/>
      </div>

      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
        {d.sparringFreq > 0 && (
          <span style={{ fontSize:10, color:C.textSec, background:C.surfaceAlt, borderRadius:6,
            padding:"2px 8px", fontFamily:FONT_DISPLAY, fontWeight:700 }}>
            {t("sparringFreqLabel")} {d.sparringFreq}x/{t("wk") || "wk"}
          </span>
        )}
        {d.mostTrainedCat && (
          <CatPill label={t("sharpest")} cat={d.mostTrainedCat} catColors={catColors} C={C}/>
        )}
        {d.leastTrainedCat && d.leastTrainedCat !== d.mostTrainedCat && (
          <CatPill label={t("leastTrainedCat")} cat={d.leastTrainedCat} catColors={catColors} C={C}/>
        )}
        {d.battleCount > 0 && (
          <span style={{ fontSize:10, color:C.textSec, background:C.surfaceAlt, borderRadius:6,
            padding:"2px 8px", fontFamily:FONT_DISPLAY, fontWeight:700 }}>
            {d.battleCount} {t("battlesLabel")}
          </span>
        )}
      </div>

      {d.narrative && (
        <p style={{ fontSize:12, color:C.textSec, lineHeight:1.6, margin:0, fontFamily:FONT_BODY }}>
          {d.narrative}
        </p>
      )}
    </div>
  );
};

// ── Weekly Tile ─────────────────────────────────────────────────────────────

const WeekTile = ({ entry, t, C, catColors }) => {
  const d = entry.data;
  const dateLabel = formatShortDate(entry.date);

  return (
    <div style={{ background:C.surfaceAlt, borderRadius:12,
      padding:14, marginBottom:6 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
        <span style={{ fontSize:11, fontWeight:800, letterSpacing:1.5, color:C.textSec,
          fontFamily:FONT_DISPLAY }}>{t("weekOf")} {dateLabel.toUpperCase()}</span>
      </div>

      <div style={{ display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
        <span style={{ fontSize:12, color:C.text, fontWeight:700, fontFamily:FONT_DISPLAY }}>
          {d.sessionCount} {t("sessionsCount")}
        </span>
        {d.movesAdded > 0 && (
          <span style={{ fontSize:11, color:C.textSec, fontFamily:FONT_DISPLAY }}>
            +{d.movesAdded} {t("movesAddedLabel")}
          </span>
        )}
        {d.sharpestCategory && (
          <CatPill label={t("sharpest")} cat={d.sharpestCategory} catColors={catColors} C={C} small/>
        )}
      </div>

      {d.milestones && d.milestones.length > 0 && (
        <div style={{ display:"flex", gap:6, marginTop:8, flexWrap:"wrap" }}>
          {d.milestones.map(m => (
            <span key={m.id} style={{ fontSize:10, fontWeight:700, color:C.accent,
              background:`${C.accent}18`, borderRadius:8, padding:"2px 8px",
              fontFamily:FONT_DISPLAY, letterSpacing:0.5 }}>
              {m.val ? `${m.val} ${t("movesInVocab")}` : t(m.label)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Daily Row ───────────────────────────────────────────────────────────────

const DayRow = ({ entry, t, C }) => {
  const d = entry.data;
  const dateLabel = formatShortDate(entry.date);

  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 0",
      borderBottom:`1px solid ${C.borderLight}` }}>
      <span style={{ fontSize:11, fontWeight:700, color:C.textMuted, fontFamily:FONT_DISPLAY,
        minWidth:48 }}>{dateLabel}</span>
      {d.isRest ? (
        <span style={{ fontSize:11, color:C.textMuted, fontStyle:"italic" }}>{t("restDay")}</span>
      ) : (
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", fontSize:11, color:C.textSec }}>
          {d.movesTrained > 0 && <span>{d.movesTrained} {t("movesTrainedLabel")}</span>}
          {d.movesAdded > 0 && <span>+{d.movesAdded} {t("movesAddedLabel")}</span>}
          {d.sessionsLogged > 0 && <span>{d.sessionsLogged} {t("sessionsCount")}</span>}
        </div>
      )}
    </div>
  );
};

// ── Helpers ─────────────────────────────────────────────────────────────────

const StatBox = ({ label, value, C, warn }) => (
  <div style={{ textAlign:"center", padding:"8px 4px", background:C.surfaceAlt, borderRadius:8,
    border:`1px solid ${C.borderLight}` }}>
    <div style={{ fontSize:18, fontWeight:900, color:warn?C.yellow:C.text, fontFamily:FONT_DISPLAY }}>
      {value}
    </div>
    <div style={{ fontSize:9, fontWeight:700, letterSpacing:1, color:C.textMuted,
      fontFamily:FONT_DISPLAY, marginTop:2 }}>{label}</div>
  </div>
);

const CatPill = ({ label, cat, catColors, C, small }) => {
  const catColor = (catColors || CAT_COLORS)[cat] || C.accent;
  return (
    <span style={{ fontSize:small?9:10, color:catColor, background:`${catColor}18`,
      borderRadius:6, padding:"2px 8px", fontFamily:FONT_DISPLAY, fontWeight:700 }}>
      {label}: {cat}
    </span>
  );
};
