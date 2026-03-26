import React, { Fragment } from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY } from '../../constants/fonts';
import { Ic } from '../shared/Ic';
import { Highlight } from '../shared/Highlight';
import { masteryColor } from '../../constants/styles';
import { useSettings } from '../../hooks/useSettings';

export const MoveListRow = ({ move, catColor, onEdit, onDelete, onMove, allCats, catColors, onToggleTrainedToday }) => {
  const { settings } = useSettings();
  const showMastery = settings.showMastery !== false;
  return (
    <div onClick={onEdit} style={{ position:"relative", display:"flex", alignItems:"center", gap:10, background:C.bg, borderRadius:8, padding:"10px 12px", border:`1px solid ${C.border}`, borderLeft:`4px solid ${catColor}`, cursor:"pointer" }}>
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
      {showMastery&&<Fragment>
        <div style={{ width:44, height:3, borderRadius:2, background:C.border, flexShrink:0 }}>
          <div style={{ height:"100%", width:`${move.mastery}%`, borderRadius:2, background:masteryColor(move.mastery) }}/>
        </div>
        <span style={{ fontSize:12, color:masteryColor(move.mastery), fontWeight:700, width:30, textAlign:"right", flexShrink:0 }}>{move.mastery}%</span>
      </Fragment>}
      <button onClick={e=>{e.stopPropagation();onDelete();}}
        style={{ background:"none", border:"none", cursor:"pointer", padding:2, display:"flex", flexShrink:0 }}>
        <Ic n="x" s={13} c={C.textMuted}/>
      </button>
    </div>
  );
};
