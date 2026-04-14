import React, { Fragment, useState } from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY } from '../../constants/fonts';
import { Ic } from '../shared/Ic';
import { Highlight } from '../shared/Highlight';
import { masteryColor, CARD_BASE, CARD_BODY } from '../../constants/styles';
import { useSettings } from '../../hooks/useSettings';
import { useT } from '../../hooks/useTranslation';
import { computeDecay, showDecayArrow } from '../../utils/masteryDecay';
import { todayLocal } from '../../utils/dateUtils';
import { CATS, CAT_COLORS } from '../../constants/categories';

export const MoveTile = ({ move, onClick, onEdit, onDelete, onDuplicate, onMove, allCats=CATS, catColors=CAT_COLORS, searchQuery="", onToggleTrainedToday, selectMode, isSelected }) => {
  const { settings } = useSettings();
  const t = useT();
  const [expanded, setExpanded] = useState(false);
  const { displayMastery } = computeDecay(move, settings.decaySensitivity);
  const hasDecayArrow = showDecayArrow(move, settings.decaySensitivity);
  const col=masteryColor(displayMastery), catCol=catColors[move.category]||C.accent;
  const showMastery = settings.showMastery !== false;
  const compact = settings.compactCards;
  return (
    <div onClick={onClick} style={{ position:"relative", background:C.surface, borderRadius:8,
      padding: compact ? "7px 8px 5px" : "10px 10px 8px", cursor:"pointer", borderLeft:`4px solid ${catCol}`,
      outline: selectMode && isSelected ? `2px solid ${C.green}` : "none" }}>

      {selectMode && (
        <div style={{ position:"absolute", top:8, left:8, width:20, height:20, borderRadius:5,
          border:`2px solid ${isSelected ? C.green : C.border}`,
          background: isSelected ? C.green : "transparent",
          display:"flex", alignItems:"center", justifyContent:"center", zIndex:2 }}>
          {isSelected && <Ic n="check" s={12} c="#fff"/>}
        </div>
      )}

      {/* Main layout: two columns */}
      <div style={{ display:"flex", gap:10 }}>

        {/* LEFT COLUMN — name, tension role */}
        <div style={{ flex:1, minWidth:0 }}>
          {/* Move name */}
          <span style={{ fontWeight:700, fontSize: compact ? 13 : 16, color:C.text, lineHeight:1.2,
            display:"block", paddingRight:4, fontFamily:FONT_DISPLAY,
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            <Highlight text={move.name} query={searchQuery}/>
          </span>

          {/* Tension role — only if set */}
          {move.tensionRole && (
            <span style={{ fontSize:11, color:C.textMuted, fontFamily:FONT_DISPLAY, fontWeight:700,
              letterSpacing:0.5, marginTop:2, display:"block" }}>
              {t("tensionRole_" + move.tensionRole) || move.tensionRole}
            </span>
          )}
        </div>

        {/* RIGHT COLUMN — icons + mastery */}
        <div style={{ flexShrink:0, display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
          {/* Icons row: lightbulb + external link + trained circle */}
          <div style={{ display:"flex", alignItems:"center", gap:4 }}>
            {/* Lightbulb — linked note indicator (future feature) */}
            {move.linkedNote && (
              <Ic n="bulb" s={14} c={C.yellow}/>
            )}

            {/* External link */}
            {move.link && settings.linkOnCard === "both" && (
              <a href={move.link.startsWith("http") ? move.link : "https://" + move.link}
                target="_blank" rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                style={{ display:"flex", alignItems:"center", justifyContent:"center",
                  width:20, height:20, color:C.textMuted, padding:0, textDecoration:"none" }}>
                <Ic n="extLink" s={12} c={C.textMuted}/>
              </a>
            )}

            {/* Trained today circle */}
            {!selectMode && onToggleTrainedToday && (() => {
              const isTrained = move.date === todayLocal();
              return <button onClick={e => { e.stopPropagation(); onToggleTrainedToday(move.id); }}
                style={{ width:16, height:16, borderRadius:"50%", flexShrink:0, padding:0,
                  border: isTrained ? "none" : `1.5px solid ${C.border}`,
                  background: isTrained ? C.green : "transparent",
                  display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                {isTrained && <Ic n="check" s={10} c="#fff"/>}
              </button>;
            })()}
          </div>

          {/* Mastery bar — no percentage number */}
          {showMastery && (
            <div style={{ width:44, height:3, borderRadius:2, background:C.border }}>
              <div style={{ height:"100%", width:`${displayMastery}%`, borderRadius:2,
                background:`linear-gradient(90deg,${C.red},${col})` }}/>
            </div>
          )}
        </div>
      </div>

      {/* Description — expandable via chevron */}
      {move.description && (
        <button onClick={e => { e.stopPropagation(); setExpanded(x => !x); }}
          style={{ background:"none", border:"none", cursor:"pointer", padding:"4px 0 0",
            display:"flex", alignItems:"flex-start", gap:4, width:"100%", textAlign:"left" }}>
          <Ic n={expanded ? "chevD" : "chevR"} s={12} c={C.textMuted} style={{ flexShrink:0, marginTop:1 }}/>
          <div style={{ fontSize:11, color:C.textSec, lineHeight:1.4, flex:1,
            overflow:"hidden", textOverflow:"ellipsis",
            ...(expanded ? {} : { display:"-webkit-box", WebkitLineClamp:1, WebkitBoxOrient:"vertical" })
          }}>
            {move.description}
          </div>
        </button>
      )}
    </div>
  );
};
