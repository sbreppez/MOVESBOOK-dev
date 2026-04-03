import React from 'react';
import { C } from '../../constants/colors';
import { Ic } from './Ic';

export const Crumbs = ({ items }) => (
  <div style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, color:C.textMuted, padding:"5px 14px", background:C.surface, borderBottom:`1px solid ${C.borderLight}`, flexShrink:0 }}>
    {items.map((x,i)=>(
      <span key={i} style={{ display:"flex", alignItems:"center", gap:4 }}>
        {i>0 && <Ic n="chevR" s={12} c={C.textMuted}/>}
        <span style={{ color:i===items.length-1?C.textSec:C.textMuted }}>{x}</span>
      </span>
    ))}
  </div>
);
