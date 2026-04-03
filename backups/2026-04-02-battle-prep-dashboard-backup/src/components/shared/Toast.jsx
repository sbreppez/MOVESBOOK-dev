import React from 'react';
import { C } from '../../constants/colors';
import { Ic } from './Ic';

export const Toast = ({ toasts, remove }) => (
  <div style={{ position:"fixed", top:68, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, zIndex:9999, display:"flex", flexDirection:"column", alignItems:"flex-end", gap:8, pointerEvents:"none", padding:"0 10px", boxSizing:"border-box" }}>
    {toasts.map(t => (
      <div key={t.id} style={{ background: C.surface, border:`2px solid ${C.accent}`, borderRadius:10, padding:"11px 14px", boxShadow:`0 6px 24px rgba(0,0,0,0.25)`, display:"flex", alignItems:"flex-start", gap:10, pointerEvents:"all", animation:"toastIn 0.3s ease" }}>
        <span style={{ fontSize:16, flexShrink:0 }}>{t.emoji||"⚔"}</span>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:800, fontSize:13, color:C.accent, marginBottom:2, letterSpacing:0.5 }}>{t.title}</div>
          <div style={{ fontSize:13, color:C.textSec, lineHeight:1.5 }}>{t.msg}</div>
        </div>
        <button onClick={()=>remove(t.id)} style={{ background:"none", border:"none", cursor:"pointer", color:C.textMuted, padding:2, flexShrink:0, display:"flex" }}><Ic n="x" s={13}/></button>
      </div>
    ))}
    <style>{`@keyframes toastIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}`}</style>
  </div>
);
