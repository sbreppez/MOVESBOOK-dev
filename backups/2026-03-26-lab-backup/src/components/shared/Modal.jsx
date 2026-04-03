import React from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY } from '../../constants/fonts';
import { Ic } from './Ic';

export const Modal = ({ title, onClose, children, wide }) => (
  <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:"28px 12px" }}>
    <div onClick={e=>e.stopPropagation()} style={{ background:C.bg, border:`2px solid ${C.border}`, borderRadius:14, width:"100%", maxWidth:wide?660:420, maxHeight:"86vh", overflow:"auto", boxShadow:"0 24px 80px rgba(0,0,0,0.4)" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"13px 18px", borderBottom:`1px solid ${C.border}`, position:"sticky", top:0, background:C.bg, zIndex:10 }}>
        <span style={{ fontWeight:800, fontSize:15, letterSpacing:2, color:C.brown, fontFamily:FONT_DISPLAY }}>{title}</span>
        <button onClick={onClose} style={{ background:C.surfaceAlt, border:`1px solid ${C.border}`, cursor:"pointer", color:C.textSec, padding:5, borderRadius:7, display:"flex" }}><Ic n="x" s={14}/></button>
      </div>
      <div style={{ padding:18 }}>{children}</div>
    </div>
  </div>
);
