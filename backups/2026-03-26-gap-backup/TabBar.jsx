import React from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY } from '../../constants/fonts';
import { Ic } from './Ic';
import { useT } from '../../hooks/useTranslation';

export const TabBar = ({ active, onChange, badges={} }) => {
  const t = useT();
  const tabs = [{id:"ideas",icon:"target",label:t("train"),tid:"tour-tab-ideas"},{id:"wip",icon:"scroll",label:t("vocab"),tid:"tour-tab-wip"},{id:"ready",icon:"sword",label:t("battle"),tid:"tour-tab-ready"}];
  return (
  <div style={{ display:"flex", background:C.surface, borderBottom:`2px solid ${C.border}` }}>
    {tabs.map(tb=>{
      const on = active===tb.id;
      return (
        <button id={tb.tid} key={tb.id} onClick={()=>onChange(tb.id)} style={{ flex:1, padding:"9px 6px", border:"none", cursor:"pointer", background:on?C.bg:"transparent", color:on?C.accent:C.textSec, borderBottom:`3px solid ${on?C.accent:"transparent"}`, display:"flex", alignItems:"center", justifyContent:"center", gap:5, fontSize:14, fontWeight:800, letterSpacing:2, transition:"all 0.15s", fontFamily:FONT_DISPLAY, position:"relative" }}>
          <Ic n={tb.icon} s={13} c={on?C.accent:C.textMuted}/>{tb.label}
          {badges[tb.id]>0&&<span style={{ position:"absolute", top:-2, right:-2, minWidth:16, height:16, borderRadius:8, background:C.red, color:"#fff", fontSize:9, fontWeight:900, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 4px", lineHeight:1 }}>{badges[tb.id]}</span>}
        </button>
      );
    })}
  </div>
  );
};
