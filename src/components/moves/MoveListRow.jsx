import React from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY } from '../../constants/fonts';
import { Ic } from '../shared/Ic';
import { Highlight } from '../shared/Highlight';
import { masteryColor } from '../../constants/styles';
import { useSettings } from '../../hooks/useSettings';
import { computeDecay, showDecayArrow } from '../../utils/masteryDecay';

export const MoveListRow = ({ move, catColor, onEdit, onDelete, onMove, allCats, catColors, onToggleTrainedToday }) => {
  const { settings } = useSettings();
  const { displayMastery } = computeDecay(move, settings.decaySensitivity);
  const hasDecayArrow = showDecayArrow(move, settings.decaySensitivity);
  const showMastery = settings.showMastery !== false;
  return (
    <div onClick={onEdit} style={{ position:"relative", display:"flex", alignItems:"center", gap:10, background:C.surface, borderRadius:8, padding:"10px 12px", borderLeft:`4px solid ${catColor}`, cursor:"pointer" }}>
      <div style={{ flex:1, minWidth:0 }}>
        <span style={{ color:C.text, fontSize:14, fontWeight:600, fontFamily:FONT_DISPLAY,
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{move.name}</span>
        {move.description&&<div style={{ fontSize:11, color:C.textSec, marginTop:2, lineHeight:1.4,
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{move.description}</div>}
      </div>
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
      {showMastery&&<div style={{ width:44, height:3, borderRadius:2, background:C.border, flexShrink:0 }}>
        <div style={{ height:"100%", width:`${displayMastery}%`, borderRadius:2, background:masteryColor(displayMastery) }}/>
      </div>}
      <span style={{ fontSize:11, color:masteryColor(displayMastery), fontWeight:700, fontFamily:FONT_DISPLAY, width:30, textAlign:"right", flexShrink:0 }}>{displayMastery}%{hasDecayArrow&&<span style={{ fontSize:10, color:C.red, marginLeft:1 }}>▼</span>}</span>
      <button onClick={e=>{e.stopPropagation();onDelete();}}
        style={{ background:"none", border:"none", cursor:"pointer", padding:2, display:"flex", flexShrink:0 }}>
        <Ic n="x" s={13} c={C.textMuted}/>
      </button>
    </div>
  );
};
