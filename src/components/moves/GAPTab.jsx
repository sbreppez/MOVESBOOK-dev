import React, { useState, useMemo } from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { masteryColor, masteryLabel } from '../../constants/styles';
import { Ic } from '../shared/Ic';
import { useT } from '../../hooks/useTranslation';
import { CAT_COLORS } from '../../constants/categories';
import { computeDecay, showDecayArrow } from '../../utils/masteryDecay';
import { todayLocal } from '../../utils/dateUtils';

const PRESETS = [7, 14, 30];

export const GAPTab = ({ moves, catColors=CAT_COLORS, setMoves, onDrill, settings={}, onTrainToday }) => {
  const t = useT();
  const [threshold, setThreshold] = useState(14);
  const [customDays, setCustomDays] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const today = todayLocal();
  const todayMs = new Date(today).getTime();

  const { staleMoves, freshCount } = useMemo(() => {
    const all = moves.map(m => {
      const lastMs = m.date ? new Date(m.date).getTime() : 0;
      const daysSince = lastMs ? Math.floor((todayMs - lastMs) / 86400000) : 9999;
      const mult = m.difficulty === "easy" ? 0.7
                 : m.difficulty === "advanced" ? 1.5 : 1;
      const adjusted = Math.round(threshold * mult);
      return { ...m, daysSince, adjustedThreshold: adjusted, isStale: daysSince >= adjusted };
    });
    return {
      staleMoves: all.filter(m => m.isStale).sort((a, b) => b.daysSince - a.daysSince),
      freshCount: all.filter(m => !m.isStale).length,
    };
  }, [moves, threshold, todayMs]);

  const staleCount = staleMoves.length;
  const totalCount = moves.length;
  const freshPct = totalCount ? freshCount / totalCount : 1;

  const handleTrainToday = (id) => {
    if (onTrainToday) { onTrainToday(id); }
    else { setMoves(prev => prev.map(m => m.id === id ? { ...m, date: today } : m)); }
  };

  // Progress ring SVG
  const ringSize = 28, ringStroke = 3;
  const ringR = (ringSize - ringStroke) / 2;
  const ringC = 2 * Math.PI * ringR;
  const ringOffset = ringC * (1 - freshPct);

  return (
    <div>
      {/* ── Filter Row ── */}
      <div style={{ display:"flex", gap:6, padding:"10px 16px", flexWrap:"wrap", alignItems:"center" }}>
        {PRESETS.map(d => {
          const active = threshold === d && !showCustom;
          return (
            <button key={d} onClick={() => { setThreshold(d); setShowCustom(false); }}
              style={{ border:`1.5px solid ${active ? C.accent : C.border}`, cursor:"pointer",
                borderRadius:20, fontFamily:FONT_DISPLAY, fontWeight:700, letterSpacing:0.5,
                fontSize:11, padding:"4px 12px", whiteSpace:"nowrap", transition:"all 0.15s",
                background: active ? C.accent : C.surface,
                color: active ? C.bg : C.textSec }}>
              {d} {t("gapDaysAgo").toUpperCase().includes("DAY") ? "DAYS" : t("gapDaysAgo").split(" ")[0].toUpperCase()}
            </button>
          );
        })}
        <button onClick={() => setShowCustom(true)}
          style={{ border:`1.5px solid ${showCustom ? C.accent : C.border}`, cursor:"pointer",
            borderRadius:20, fontFamily:FONT_DISPLAY, fontWeight:700, letterSpacing:0.5,
            fontSize:11, padding:"4px 12px", whiteSpace:"nowrap", transition:"all 0.15s",
            background: showCustom ? C.accent : C.surface,
            color: showCustom ? C.bg : C.textSec }}>
          {t("gapCustomDays")}
        </button>
        {showCustom && (
          <input type="number" min="1" max="365" value={customDays}
            autoFocus
            onChange={e => {
              const v = e.target.value;
              setCustomDays(v);
              const n = parseInt(v);
              if (n > 0) setThreshold(n);
            }}
            placeholder="days"
            style={{ width:56, padding:"4px 8px", borderRadius:8, border:`1.5px solid ${C.accent}`,
              background:C.bg, color:C.text, fontSize:14, fontFamily:FONT_DISPLAY, fontWeight:700,
              outline:"none", textAlign:"center" }}
          />
        )}
      </div>

      {/* ── Summary Bar ── */}
      <div style={{ display:"flex", alignItems:"center", gap:12, padding:"6px 16px 12px", borderBottom:`1px solid ${C.borderLight}` }}>
        <svg width={ringSize} height={ringSize} style={{ transform:"rotate(-90deg)", flexShrink:0 }}>
          <circle cx={ringSize/2} cy={ringSize/2} r={ringR} fill="none" stroke={C.border} strokeWidth={ringStroke}/>
          <circle cx={ringSize/2} cy={ringSize/2} r={ringR} fill="none" stroke={C.textSec} strokeWidth={ringStroke}
            strokeDasharray={ringC} strokeDashoffset={ringOffset} strokeLinecap="round"/>
        </svg>
        <span style={{ fontSize:13, fontWeight:700, color:C.text, fontFamily:FONT_DISPLAY }}>
          {staleCount} {t("gapMovesWaiting")}
        </span>
      </div>

      {/* ── Move List ── */}
      {staleCount === 0 ? (
        <div style={{ textAlign:"center", padding:40, color:C.textMuted }}>
          <div style={{ fontSize:28, marginBottom:8 }}>✅</div>
          <p style={{ fontSize:13 }}>{t("gapAllCaughtUp")}</p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:6, padding:"10px 16px" }}>
          {staleMoves.map(m => {
            const catCol = catColors[m.category] || C.accent;
            const isTrained = m.date === today;
            const { displayMastery } = computeDecay(m, settings.decaySensitivity);
            const col = masteryColor(displayMastery);
            return (
              <div key={m.id} style={{ background:C.surface, border:"none", borderRadius:8,
                borderLeft:`4px solid ${catCol}`, padding:"14px 16px" }}>
                {/* Top row: name + trained dot + drill */}
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:16, color:C.text, fontFamily:FONT_DISPLAY,
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.name}</div>
                    <div style={{ fontSize:10, color:catCol, fontWeight:700, fontFamily:FONT_DISPLAY, letterSpacing:0.5 }}>
                      {m.category}
                    </div>
                  </div>
                  {/* Trained-today dot */}
                  <button onClick={() => handleTrainToday(m.id)}
                    style={{ width:16, height:16, borderRadius:"50%", flexShrink:0, padding:0,
                      border: isTrained ? "none" : `1.5px solid ${C.border}`,
                      background: isTrained ? C.green : "transparent",
                      display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                    {isTrained && <Ic n="check" s={10} c="#fff"/>}
                  </button>
                  {/* Video icon */}
                  {m.link && (
                    <a href={m.link.startsWith("http") ? m.link : "https://"+m.link} target="_blank" rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      style={{ display:"flex", alignItems:"center", justifyContent:"center",
                        width:24, height:24, borderRadius:6, color:C.textMuted, textDecoration:"none", flexShrink:0 }}>
                      <Ic n="extLink" s={14} c={C.textMuted}/>
                    </a>
                  )}
                  {/* DRILL button */}
                  {onDrill && (
                    <button onClick={() => onDrill(m)}
                      style={{ background:"transparent", color:catCol, border:`1px solid ${catCol}`, cursor:"pointer",
                        borderRadius:6, padding:"4px 10px", fontSize:10, fontWeight:900,
                        fontFamily:FONT_DISPLAY, letterSpacing:1, flexShrink:0 }}>
                      {t("gapDrill")}
                    </button>
                  )}
                </div>

                {/* Info row: last trained + mastery + difficulty */}
                <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                  <span style={{ fontSize:11, color:C.textMuted }}>
                    {m.daysSince >= 9999
                      ? t("gapNeverTrained")
                      : `${t("gapLastTrained")}: ${m.daysSince} ${t("gapDaysAgo")}`}
                  </span>
                  <div style={{ display:"flex", alignItems:"center", gap:4, marginLeft:"auto" }}>
                    {m.difficulty && (
                      <span style={{ fontSize:10, fontWeight:700, fontFamily:FONT_DISPLAY, letterSpacing:0.5,
                        borderRadius:4, padding:"1px 6px", background:C.surfaceAlt, color:C.textSec }}>
                        {t("difficulty_"+m.difficulty)}
                      </span>
                    )}
                    <div style={{ width:36, height:3, borderRadius:2, background:C.border }}>
                      <div style={{ height:"100%", width:`${displayMastery}%`, borderRadius:2, background:catCol }}/>
                    </div>
                    <span style={{ fontSize:11, color:catCol, fontWeight:700, fontFamily:FONT_DISPLAY }}>{displayMastery}%</span>
                    {showDecayArrow(m, settings.decaySensitivity) && (
                      <span style={{ fontSize:10, color:catCol, marginLeft:2 }}>▼</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
