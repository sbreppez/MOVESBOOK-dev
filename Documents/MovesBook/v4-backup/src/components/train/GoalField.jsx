import React, { useState, useRef, useEffect } from 'react';
import { C } from '../../constants/colors';
import { FONT_BODY } from '../../constants/fonts';
import { lbl } from '../../constants/styles';

export const GoalField = ({ label, hint, value, onChange, rows=2, placeholder, minHeight }) => {
  const [local, setLocal] = useState(value);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  useEffect(() => { setLocal(value); }, [value]);
  const handleChange = e => { const v = e.target.value; setLocal(v); onChangeRef.current(v); };
  const fieldInputStyle = { width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8,
    padding:"9px 12px", color:C.text, fontSize:13, outline:"none", fontFamily:FONT_BODY, boxSizing:"border-box" };
  return (
    <div style={{ marginBottom:18 }}>
      <label style={{ ...lbl(), fontSize:11, letterSpacing:1.5 }}>{label}</label>
      {hint&&<div style={{ fontSize:11, color:C.textMuted, marginBottom:5, fontStyle:"italic" }}>{hint}</div>}
      <textarea value={local} onChange={handleChange}
        rows={rows} placeholder={placeholder||""}
        style={{ ...fieldInputStyle, resize:"vertical", lineHeight:1.5, ...(minHeight ? { minHeight } : {}) }}/>
    </div>
  );
};
