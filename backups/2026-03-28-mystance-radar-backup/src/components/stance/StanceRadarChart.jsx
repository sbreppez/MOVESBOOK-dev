import React from "react";
import { FONT_DISPLAY } from "../../constants/fonts";
import { useT } from "../../hooks/useTranslation";

const CX = 155, CY = 155, R = 110;
const VB = "0 0 310 310";
const DOMAINS = ["musicality","performance","technique","variety","creativity","personality"];
const GRID_LEVELS = [2, 4, 6, 8, 10];

const pt = (index, scale) => {
  const angle = -Math.PI / 2 + (index * Math.PI * 2) / 6;
  return [CX + (R * scale / 10) * Math.cos(angle), CY + (R * scale / 10) * Math.sin(angle)];
};

const hexPoints = (scale) => DOMAINS.map((_, i) => pt(i, scale).join(",")).join(" ");

const polyPoints = (scores) =>
  DOMAINS.map((d, i) => pt(i, scores[d] || 1).join(",")).join(" ");

// Label offsets to avoid overlapping the chart
const labelPos = (index) => {
  const [x, y] = pt(index, 11.8);
  const anchors = ["middle","end","end","middle","start","start"];
  const dy = ["-4","2","2","12","2","2"];
  return { x, y, anchor: anchors[index], dy: dy[index] };
};

export const StanceRadarChart = ({ current, previous, C }) => {
  const t = useT();
  return (
    <svg viewBox={VB} style={{ width: "100%", maxWidth: 280, display: "block", margin: "0 auto" }}>
      {/* Grid hexagons */}
      {GRID_LEVELS.map(lv => (
        <polygon key={lv} points={hexPoints(lv)}
          fill="none" stroke={C.border} strokeWidth={0.7} opacity={0.3}/>
      ))}
      {/* Spoke lines */}
      {DOMAINS.map((_, i) => {
        const [x, y] = pt(i, 10);
        return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke={C.border} strokeWidth={0.5} opacity={0.3}/>;
      })}
      {/* Previous assessment (dashed, faded) */}
      {previous && (
        <polygon points={polyPoints(previous)}
          fill={C.textMuted + "1A"} stroke={C.textMuted} strokeWidth={1}
          strokeDasharray="4 3" fillOpacity={1}/>
      )}
      {/* Current assessment */}
      <polygon points={polyPoints(current)}
        fill={C.accent + "33"} stroke={C.accent} strokeWidth={2}/>
      {/* Vertex labels */}
      {DOMAINS.map((d, i) => {
        const lp = labelPos(i);
        return (
          <text key={d} x={lp.x} y={lp.y} dy={lp.dy}
            textAnchor={lp.anchor}
            style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 10, fill: C.textMuted }}>
            {t(d)}
          </text>
        );
      })}
    </svg>
  );
};
