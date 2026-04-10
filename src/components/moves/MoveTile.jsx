import React, { Fragment } from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY } from '../../constants/fonts';
import { Ic } from '../shared/Ic';
import { Highlight } from '../shared/Highlight';
import { masteryColor, CARD_BASE, CARD_BODY } from '../../constants/styles';
import { useSettings } from '../../hooks/useSettings';
import { computeDecay, showDecayArrow } from '../../utils/masteryDecay';
import { CATS, CAT_COLORS } from '../../constants/categories';

export const MoveTile = ({ move, onClick, onEdit, onDelete, onDuplicate, onMove, allCats=CATS, catColors=CAT_COLORS, searchQuery="", onToggleTrainedToday }) => {
  const { settings } = useSettings();
  const { displayMastery } = computeDecay(move, settings.decaySensitivity);
  const hasDecayArrow = showDecayArrow(move, settings.decaySensitivity);
  const col=masteryColor(displayMastery), catCol=catColors[move.category]||C.accent;
  const showMastery = settings.showMastery !== false;
  const compact = settings.compactCards;
  return (
    <div onClick={onClick} style={{ position:"relative", background:C.surface, borderRadius:8,
      padding: compact ? "7px 8px 5px" : "10px 10px 8px", cursor:"pointer", borderLeft:`4px solid ${catCol}` }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom: showMastery ? 5 : 2 }}>
        <span style={{ fontWeight:700, fontSize: compact ? 13 : 16, color:C.text, lineHeight:1.2, flex:1, paddingRight:4, fontFamily:FONT_DISPLAY,
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", minWidth:0 }}>
          <Highlight text={move.name} query={searchQuery}/>
        </span>
        <div style={{ display:"flex", alignItems:"center", gap:2, flexShrink:0 }}>
          {onToggleTrainedToday&&(()=>{
            const isTrained = move.date === new Date().toISOString().split("T")[0];
            return <button onClick={e=>{e.stopPropagation();onToggleTrainedToday(move.id);}}
              style={{ width:16, height:16, borderRadius:"50%", flexShrink:0, padding:0,
                border: isTrained ? "none" : `1.5px solid ${C.border}`,
                background: isTrained ? C.green : "transparent",
                display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
              {isTrained&&<Ic n="check" s={10} c="#fff"/>}
            </button>;
          })()}
          {move.link&&settings.linkOnCard==="both"&&(
            <a href={move.link.startsWith("http")?move.link:"https://"+move.link} target="_blank" rel="noopener noreferrer"
              onClick={e=>e.stopPropagation()}
              style={{ display:"flex", alignItems:"center", justifyContent:"center",
                width:20, height:20, color:C.textMuted, padding:2, textDecoration:"none" }}>
              <Ic n="extLink" s={12} c={C.textMuted}/>
            </a>
          )}
          <button onClick={e=>{e.stopPropagation();onDelete();}}
            style={{ background:"none", border:"none", cursor:"pointer", padding:2, display:"flex" }}>
            <Ic n="x" s={12} c={C.textMuted}/>
          </button>
        </div>
      </div>
      {move.description&&<div style={{ fontSize:11, color:C.textSec, lineHeight:1.4, marginBottom:4,
        overflow:"hidden", textOverflow:"ellipsis", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
        {move.description}
      </div>}
      {showMastery&&<Fragment>
        <div style={{ height:3, borderRadius:2, background:C.border, marginBottom:4 }}>
          <div style={{ height:"100%", width:`${displayMastery}%`, borderRadius:2, background:`linear-gradient(90deg,${C.red},${col})` }}/>
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontSize: compact ? 11 : 13, color:col, fontWeight:700 }}>{displayMastery}%{hasDecayArrow&&<span style={{ fontSize:10, color:C.red, marginLeft:2 }}>▼</span>}</span>
        </div>
      </Fragment>}

    </div>
  );
};
