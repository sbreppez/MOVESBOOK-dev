import React, { useState, useRef, useEffect } from 'react';
import { lbl, inp } from '../../constants/styles';

export const Inp = ({ label, value, onChange, placeholder, type="text" }) => {
  const [local, setLocal] = useState(value);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  useEffect(() => { setLocal(value); }, [value]);
  const handleChange = e => { const v = e.target.value; setLocal(v); onChangeRef.current(v); };
  return (
    <div style={{ marginBottom:14 }}>
      <label style={lbl()}>{label}</label>
      <input type={type} value={local} onChange={handleChange} placeholder={placeholder} style={inp()}/>
    </div>
  );
};
