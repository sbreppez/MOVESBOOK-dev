import React from 'react';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { useT } from '../../hooks/useTranslation';
import { Ic } from './Ic';
import { useSettings } from '../../hooks/useSettings';

// ── Constants ────────────────────────────────────────────────────────────────
export const ROLE_LEVEL = { flow:1, build:2, hit:3, peak:4 };
export const LEVEL_TO_ROLE = { 1:"flow", 2:"build", 3:"hit", 4:"peak" };

export const getTensionColors = (C) => ({ 1: C.textMuted, 2: C.blue, 3: C.yellow, 4: C.red });

// ── Helpers ──────────────────────────────────────────────────────────────────

// Returns tension level (1-4) for a move object (no override support)
export const getMoveTension = (move) => {
  if (move?.tensionRole) return ROLE_LEVEL[move.tensionRole] || 2;
  return 2; // default build
};

// Returns tension level for an item in a round entry (supports tensionOverride)
// getMove: function that takes refId and returns move object
export const getItemTension = (item, getMove) => {
  if (item.tensionOverride) return ROLE_LEVEL[item.tensionOverride] || 2;
  if (item.type === "move") {
    const m = getMove(item.refId);
    if (m?.tensionRole) return ROLE_LEVEL[m.tensionRole] || 2;
  }
  return 2; // default build
};

// ── Arc feedback text ────────────────────────────────────────────────────────
// Takes pre-computed levels array [1-4] and t() function
export const getArcFeedback = (levels, t) => {
  if (!levels || levels.length < 3) return null;
  const allSame = levels.every(l => l === levels[0]);
  if (allSame) return t("arcNoDynamics");
  const hasPeak = levels.includes(4);
  if (hasPeak) return t("arcBuild");
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] >= 3 && levels[i - 1] >= 3) return t("arcBackToBack");
  }
  const last = levels[levels.length - 1];
  if (last >= 3) return t("arcStrongCloser");
  return null;
};

// ── ArcChart component ───────────────────────────────────────────────────────
// levels: array of tension values [1-4]
export const ArcChart = ({ levels, height = 60 }) => {
  const { C } = useSettings();
  const TENSION_COLORS = getTensionColors(C);
  if (!levels || levels.length < 2) return null;
  const W = 200, H = height, PAD_X = 16, PAD_Y = 8;
  const plotW = W - PAD_X * 2, plotH = H - PAD_Y * 2;
  const points = levels.map((tension, i) => {
    const x = PAD_X + (levels.length === 1 ? plotW / 2 : (i / (levels.length - 1)) * plotW);
    const y = PAD_Y + plotH - (((tension - 1) / 3) * plotH);
    return { x, y, tension };
  });
  const lineStr = points.map(p => `${p.x},${p.y}`).join(" ");
  const areaStr = `${PAD_X},${H - PAD_Y} ${lineStr} ${W - PAD_X},${H - PAD_Y}`;
  const gridYs = [1,2,3,4].map(v => PAD_Y + plotH - (((v - 1) / 3) * plotH));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
      style={{ width:"100%", height:H, display:"block", padding:"0", boxSizing:"border-box" }}>
      {gridYs.map((gy,i) => (
        <line key={i} x1={PAD_X} y1={gy} x2={W - PAD_X} y2={gy}
          stroke={C.border} strokeWidth={0.5} strokeOpacity={0.3}/>
      ))}
      <polygon points={areaStr} fill={C.accent} fillOpacity={0.1}/>
      <polyline points={lineStr} fill="none" stroke={C.accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      {points.map((p,i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill={TENSION_COLORS[p.tension]}/>
      ))}
    </svg>
  );
};

// ── ArcLegend component ──────────────────────────────────────────────────────
// open: boolean, onToggle: function
// onFirstSeen: optional callback fired on first toggle (for marking as seen in settings)
// hintText: optional string rendered below the legend dots (e.g. "Tap the dots to override")
// compact: boolean — if true, no background/padding (for use inside modals)
export const ArcLegend = ({ open, onToggle, onFirstSeen, hintText, compact = false }) => {
  const { C } = useSettings();
  const t = useT();
  const TENSION_COLORS = getTensionColors(C);

  const handleToggle = () => {
    onToggle();
    if (onFirstSeen) onFirstSeen();
  };

  return (
    <div style={{ padding: compact ? "6px 0" : "8px 16px", background: compact ? "transparent" : C.surface, borderRadius: compact ? 0 : 8, margin: compact ? 0 : "4px 0 6px" }}>
      <div onClick={handleToggle}
        style={{ display:"flex", alignItems:"center", cursor:"pointer", gap:6 }}>
        <Ic n={open?"chevD":"chevR"} s={10} c={C.textMuted}/>
        <span style={{ fontSize:10, fontWeight:800, letterSpacing:1, color:C.brownMid, fontFamily:FONT_DISPLAY }}>{t("roundArc")}</span>
      </div>
      {open && (
        <div style={{ marginTop:6 }}>
          <div style={{ fontSize:13, color:C.textSec, fontStyle:"italic", fontFamily:FONT_BODY, lineHeight:1.4, marginBottom:6 }}>{t("roundArcExplain")}</div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:4 }}>
            {[{e:"\ud83c\udf0a",n:1,l:"arcLegendFlow"},{e:"\ud83d\udcc8",n:2,l:"arcLegendBuild"},{e:"\ud83d\udca5",n:3,l:"arcLegendHit"},{e:"\ud83d\udd25",n:4,l:"arcLegendPeak"}].map(x=>(
              <div key={x.n} style={{ display:"flex", alignItems:"center", gap:3, fontSize:11, color:C.textMuted }}>
                <span>{x.e}</span>
                {[1,2,3,4].map(i=><div key={i} style={{ width:5, height:5, borderRadius:"50%", background: i<=x.n ? TENSION_COLORS[x.n] : `${TENSION_COLORS[x.n]}33` }}/>)}
                <span>{t(x.l)}</span>
              </div>
            ))}
          </div>
          {hintText && <div style={{ fontSize:11, color:C.textMuted, fontStyle:"italic" }}>{hintText}</div>}
        </div>
      )}
    </div>
  );
};
