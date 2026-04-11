import React, { useState } from "react";
import { FONT_DISPLAY, FONT_BODY } from "../../constants/fonts";
import { Ic } from "../shared/Ic";
import { useT } from "../../hooks/useTranslation";
import { useSettings } from "../../hooks/useSettings";
import { todayLocal, toLocalYMD } from '../../utils/dateUtils';
import { StanceRadarChart } from "./StanceRadarChart";
import { ShareCardOverlay } from "../shared/ShareCardOverlay";

export const STANCE_DOMAINS = ["musicality","performance","technique","variety","creativity","personality"];

// ── Stamina helpers ──
const computeStamina = (sparring) => {
  const sessions = sparring?.sessions || [];
  if (!sessions.length) return { empty: true };

  const avgRounds = Math.round(sessions.reduce((s, x) => s + (x.rounds || 0), 0) / sessions.length * 10) / 10;
  const avgRoundLen = Math.round(sessions.reduce((s, x) => s + (x.avgRoundLength || 0), 0) / sessions.length);

  // Consistency: do later rounds drop off?
  let consistency = "stable";
  const withLogs = sessions.filter(s => s.roundLog && s.roundLog.length >= 3);
  if (withLogs.length) {
    let drops = 0;
    withLogs.forEach(s => {
      const log = s.roundLog;
      const half = Math.floor(log.length / 2);
      const firstAvg = log.slice(0, half).reduce((a, r) => a + r.workSecs, 0) / half;
      const secondAvg = log.slice(half).reduce((a, r) => a + r.workSecs, 0) / (log.length - half);
      if (secondAvg < firstAvg * 0.8) drops++;
    });
    if (drops > withLogs.length / 2) consistency = "dropsOff";
  }

  // Trend: last 5 vs previous 5
  let trend = "stable";
  if (sessions.length >= 6) {
    const last5 = sessions.slice(-5).reduce((s, x) => s + (x.rounds || 0), 0) / 5;
    const prev5 = sessions.slice(-10, -5).reduce((s, x) => s + (x.rounds || 0), 0) / Math.min(5, sessions.slice(-10, -5).length || 1);
    if (last5 > prev5 * 1.1) trend = "improving";
    else if (last5 < prev5 * 0.9) trend = "declining";
  }

  return { avgRounds, avgRoundLen, consistency, trend };
};

// ── Vocabulary helpers ──
const computeVocabulary = (moves) => {
  const total = moves.length;
  if (!total) return { total: 0, learned: 0, versions: 0, creations: 0, battleReady: 0, variations: 0, deepestBranch: 0, foundationPct: 0, avgMastery: 0 };

  let learned = 0, versions = 0, creations = 0;
  moves.forEach(m => {
    if (m.origin === "creation") creations++;
    else if (m.origin === "version") versions++;
    else learned++;
  });

  const battleReady = moves.filter(m => (m.mastery || 0) >= 80).length;
  const variations = moves.filter(m => m.parentId).length;

  // Deepest lineage branch via BFS
  const children = {};
  const hasParent = new Set();
  moves.forEach(m => {
    if (m.parentId) {
      hasParent.add(m.id);
      if (!children[m.parentId]) children[m.parentId] = [];
      children[m.parentId].push(m.id);
    }
  });
  let deepestBranch = 0;
  const roots = moves.filter(m => !m.parentId).map(m => m.id);
  if (Object.keys(children).length) {
    const queue = roots.filter(id => children[id]).map(id => ({ id, depth: 1 }));
    while (queue.length) {
      const { id, depth } = queue.shift();
      if (depth > deepestBranch) deepestBranch = depth;
      (children[id] || []).forEach(cid => queue.push({ id: cid, depth: depth + 1 }));
    }
  }

  const foundationCats = ["Toprocks", "Footworks", "Godowns", "Freezes"];
  const foundationCount = moves.filter(m => foundationCats.includes(m.category)).length;
  const foundationPct = Math.round(foundationCount / total * 100);
  const avgMastery = Math.round(moves.reduce((s, m) => s + (m.mastery || 0), 0) / total);

  return { total, learned, versions, creations, battleReady, variations, deepestBranch, foundationPct, avgMastery };
};

// ── Consistency helpers ──
const computeConsistency = (calendar) => {
  const events = (calendar?.events || []).filter(e => e.type === "training");
  if (!events.length) return { empty: true };

  const today = todayLocal();
  const fourWeeksAgo = toLocalYMD(new Date(Date.now() - 28 * 86400000));
  const recent = events.filter(e => e.date >= fourWeeksAgo);
  const avgPerWeek = (recent.length / 4).toFixed(1);

  // Unique sorted dates
  const dates = [...new Set(events.map(e => e.date))].sort();

  // Current streak
  let streak = 0;
  const todayMs = new Date(today + "T00:00:00").getTime();
  for (let i = 0; i <= 365; i++) {
    const d = toLocalYMD(new Date(todayMs - i * 86400000));
    if (dates.includes(d)) streak++;
    else if (i === 0) continue; // today might not have a session yet
    else break;
  }

  // Longest gap
  let longestGap = 0;
  for (let i = 1; i < dates.length; i++) {
    const diff = Math.round((new Date(dates[i]).getTime() - new Date(dates[i - 1]).getTime()) / 86400000);
    if (diff > longestGap) longestGap = diff;
  }

  return { avgPerWeek, streak, longestGap };
};

// ── Format seconds as Xm Xs ──
const fmtSecs = (s) => {
  if (!s) return "0s";
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return m ? `${m}m ${sec}s` : `${sec}s`;
};

// ── Component ──
export const MyStanceSection = ({ moves, stance, sparring, calendar, onOpenAssessment }) => {
  const { C } = useSettings();
  const t = useT();
  const [showShare, setShowShare] = useState(false);
  const assessments = stance?.assessments || [];
  const hasAssessment = assessments.length > 0;
  const moveCount = moves?.length || 0;

  // Nothing if <10 moves and no assessments
  if (moveCount < 10 && !hasAssessment) return null;

  // Invitation card when 10+ moves but no assessment yet
  if (!hasAssessment) return (
    <div style={{ background:C.surface, borderRadius:8,
      padding:20, margin:"12px 0", textAlign:"center" }}>
      <div style={{ marginBottom:10 }}><Ic n="compass" s={32} c={C.textMuted}/></div>
      <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:18, color:C.text, marginBottom:8 }}>
        {t("mapYourStance")}
      </div>
      <div style={{ fontFamily:FONT_BODY, fontSize:13, color:C.textSec, lineHeight:1.6, marginBottom:16 }}>
        {t("stanceIntro")}
      </div>
      <button onClick={onOpenAssessment}
        style={{ width:"100%", padding:"12px 0", background:C.accent, color:"#fff", border:"none",
          borderRadius:8, fontSize:14, fontFamily:FONT_DISPLAY, fontWeight:800, letterSpacing:1.2,
          cursor:"pointer" }}>
        {t("mapMyStance")} →
      </button>
    </div>
  );

  // ── Has assessment data ──
  const latest = assessments[assessments.length - 1];
  const previous = assessments.length >= 2 ? assessments[assessments.length - 2] : null;
  const isFirst = assessments.length === 1;

  const stamina = computeStamina(sparring);
  const vocab = computeVocabulary(moves || []);
  const consistency = computeConsistency(calendar);

  const statLabel = { fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 11, letterSpacing: 2, color: C.textMuted, marginBottom: 10 };
  const statLine = { fontFamily: FONT_BODY, fontSize: 13, color: C.textSec, lineHeight: 1.7 };
  const emptyLine = { fontFamily: FONT_BODY, fontSize: 13, color: C.textMuted, fontStyle: "italic" };

  return (
    <div style={{ background:C.surface, borderRadius:8,
      padding:16, margin:"12px 0" }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:12 }}>
        <Ic n="compass" s={14}/>
        <span style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:14, color:C.text }}>
          {t("myStance")}
        </span>
      </div>

      {/* Radar chart */}
      <StanceRadarChart current={latest.scores} previous={previous?.scores || null} C={C}/>

      {/* Last updated + share */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:6, marginBottom:14 }}>
        <div style={{ fontSize:11, color:C.textMuted, fontFamily:FONT_BODY }}>
          {t("lastUpdated")}: {latest.date}
        </div>
        <button onClick={() => setShowShare(true)}
          style={{ display:"flex", alignItems:"center", gap:5, background:"none", border:"none",
            cursor:"pointer", padding:0, fontFamily:FONT_DISPLAY, fontWeight:700,
            fontSize:11, color:C.textMuted }}>
          <Ic n="share2" s={14} c={C.textMuted}/>
          {t("shareCard")}
        </button>
      </div>

      {/* Share overlay */}
      {showShare && (
        <ShareCardOverlay
          type="stance"
          data={{ domains: latest.scores, date: latest.date }}
          onClose={() => setShowShare(false)}
          t={t}
        />
      )}

      {/* First-time note */}
      {isFirst && (
        <div style={{ fontFamily:FONT_BODY, fontSize:13, color:C.textMuted, lineHeight:1.6,
          marginBottom:12, fontStyle:"italic", textAlign:"center" }}>
          {t("stanceFirstResult")}
        </div>
      )}

      {/* Domain rows */}
      <div style={{ marginBottom:14 }}>
        {STANCE_DOMAINS.map(d => {
          const cur = latest.scores[d];
          const prev = previous?.scores?.[d];
          let arrow = "→", arrowColor = C.textMuted;
          if (prev != null) {
            if (cur > prev) { arrow = "↑"; arrowColor = C.green; }
            else if (cur < prev) { arrow = "↓"; arrowColor = C.red; }
          }
          return (
            <div key={d} style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
              padding:"8px 0", borderBottom:`1px solid ${C.borderLight}` }}>
              <span style={{ fontFamily:FONT_BODY, fontSize:13, color:C.textSec }}>{t(d)}</span>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:14, color:C.text }}>{cur}</span>
                <span style={{ fontSize:13, color:arrowColor, fontWeight:700 }}>{arrow}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── STAMINA CARD ── */}
      <div style={{ background:C.surfaceAlt, borderRadius:8, padding:16, marginTop:12 }}>
        <div style={statLabel}>{t("stamina")}</div>
        {stamina.empty ? (
          <div style={emptyLine}>{t("noSparringYet")}</div>
        ) : (
          <div>
            <div style={statLine}>{t("avgRounds")}: <span style={{ color:C.text, fontWeight:700 }}>{stamina.avgRounds}</span></div>
            <div style={statLine}>{t("avgRoundLength")}: <span style={{ color:C.text, fontWeight:700 }}>{fmtSecs(stamina.avgRoundLen)}</span></div>
            <div style={statLine}>
              {t(stamina.consistency)} · {t(stamina.trend)}
            </div>
          </div>
        )}
      </div>

      {/* ── VOCABULARY CARD ── */}
      <div style={{ background:C.surfaceAlt, borderRadius:8, padding:16, marginTop:12 }}>
        <div style={statLabel}>{t("vocabularySize")}</div>
        {!vocab.total ? (
          <div style={emptyLine}>—</div>
        ) : (
          <div>
            {/* Primary line */}
            <div style={{ fontFamily:FONT_BODY, fontSize:16, color:C.text, fontWeight:700, marginBottom:6 }}>
              {vocab.total} {t("moves") || "moves"} · <span style={{ color:C.accent }}>{vocab.creations} {t("originals")}</span>
            </div>
            {/* Origin breakdown */}
            <div style={statLine}>
              {vocab.learned} {t("learned")} · {vocab.versions} {t("yourVersions")} · {vocab.creations} {t("yourCreations")}
            </div>
            {/* Battle-ready and variations */}
            <div style={statLine}>
              {t("battleReady")}: {vocab.battleReady > 0
                ? <span style={{ color:C.green, fontWeight:700 }}>{vocab.battleReady}</span>
                : <span>0</span>}
              {" · "}{t("variations")}: {vocab.variations}
            </div>
            {/* Deepest branch */}
            <div style={statLine}>
              {t("deepestBranch")}: {vocab.deepestBranch > 0 ? vocab.deepestBranch : t("noLineageYet")}
            </div>
            {/* Foundation coverage bar */}
            <div style={{ marginTop:10 }}>
              <div style={{ height:8, borderRadius:4, background:C.borderLight, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${vocab.foundationPct}%`, background:C.blue, borderRadius:4, transition:"width 0.3s" }}/>
              </div>
              <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:11, color:C.textMuted, marginTop:4 }}>
                {t("foundationCoverage")}: {vocab.foundationPct}%
              </div>
            </div>
            {/* Average mastery */}
            <div style={{ ...statLine, marginTop:6 }}>
              {t("averageMastery")}: {vocab.avgMastery}%
            </div>
            {vocab.battleReady > 0 && (
              <div style={{ fontFamily:FONT_BODY, fontSize:13, color:C.green, marginTop:2 }}>
                {vocab.battleReady} {t("movesAtBattleReady")}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── TRAINING CONSISTENCY CARD ── */}
      <div style={{ background:C.surfaceAlt, borderRadius:8, padding:16, marginTop:12 }}>
        <div style={statLabel}>{t("trainingConsistency")}</div>
        {consistency.empty ? (
          <div style={emptyLine}>{t("noSessionsYet")}</div>
        ) : (
          <div>
            <div style={statLine}>{t("avgSessionsWeek")}: <span style={{ color:C.text, fontWeight:700 }}>{consistency.avgPerWeek}</span></div>
            <div style={statLine}>{t("currentStreak")}: <span style={{ color:C.text, fontWeight:700 }}>{consistency.streak} {consistency.streak === 1 ? "day" : "days"}</span></div>
            <div style={statLine}>{t("longestGap")}: <span style={{ color:C.text, fontWeight:700 }}>{consistency.longestGap} {consistency.longestGap === 1 ? "day" : "days"}</span></div>
          </div>
        )}
      </div>

    </div>
  );
};
