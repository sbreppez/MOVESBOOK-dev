import React from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY } from '../../constants/fonts';

export const Btn = ({ onClick, children, variant="primary", style:ex={}, disabled, small }) => {
  const base = { border:"none", cursor:disabled?"not-allowed":"pointer", borderRadius:8, fontWeight:700, opacity:disabled?0.45:1, display:"inline-flex", alignItems:"center", gap:6, fontFamily:FONT_DISPLAY, fontSize:small?12:14, letterSpacing:0.8, transition:"opacity 0.15s" };
  const v = {
    primary: { background:C.accent, color:C.bg, padding:small?"7px 13px":"11px 20px" },
    secondary: { background:C.surfaceAlt, color:C.text, border:`1px solid ${C.border}`, padding:small?"7px 13px":"11px 20px" },
    ghost: { background:"transparent", color:C.textSec, padding:small?"7px 13px":"11px 20px" },
    danger: { background:`${C.accent}18`, color:C.accent, border:`1px solid ${C.accent}66`, padding:small?"7px 13px":"11px 20px" },
  };
  return <button onClick={onClick} disabled={disabled} style={{...base,...v[variant],...ex}}>{children}</button>;
};
