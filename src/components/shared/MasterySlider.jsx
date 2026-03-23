import React, { useState } from 'react';
import { C } from '../../constants/colors';
import { masteryColor, masteryLabel, lbl } from '../../constants/styles';
import { useT } from '../../hooks/useTranslation';

export const MasterySlider = ({ value, onChange }) => {
  const t = useT();
  const col = masteryColor(value);
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
        <label style={lbl()}>{t("mastery")}</label>
        <span style={{ fontSize:13, color:col, fontWeight:700 }}>{value}% · {masteryLabel(value)}</span>
      </div>
      <div style={{ position:"relative", height:6, borderRadius:3, background:C.border, marginBottom:10 }}>
        <div style={{ position:"absolute", inset:0, width:`${value}%`, borderRadius:3, background:`linear-gradient(90deg, ${C.red}, ${col})`, transition:"width 0.08s" }}/>
      </div>
      <input type="range" min={0} max={100} value={value} onChange={e=>onChange(+e.target.value)} style={{ width:"100%", accentColor:col, cursor:"pointer" }}/>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:C.textMuted, marginTop:4 }}>
        <span>Beginner</span><span style={{color:C.yellow}}>Consistent</span><span style={{color:C.green}}>{t("masteredCheck")}</span>
      </div>
    </div>
  );
};
