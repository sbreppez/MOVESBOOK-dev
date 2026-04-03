import React from 'react';
import { lbl, inp } from '../../constants/styles';

export const Sel = ({ label, value, onChange, options }) => (
  <div style={{ marginBottom:14 }}><label style={lbl()}>{label}</label>
    <select value={value} onChange={e=>onChange(e.target.value)} style={inp()}>
      {options.map(o=><option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}
    </select>
  </div>
);
