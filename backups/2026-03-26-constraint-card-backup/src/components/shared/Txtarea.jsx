import React, { useState, useRef, useEffect } from 'react';
import { lbl, inp } from '../../constants/styles';

export const Txtarea = ({ label, value, onChange, placeholder, rows=3 }) => {
  const [local, setLocal] = useState(value);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  useEffect(() => { setLocal(value); }, [value]);
  const handleChange = e => { const v = e.target.value; setLocal(v); onChangeRef.current(v); };
  return (
    <div style={{ marginBottom:14 }}>
      <label style={lbl()}>{label}</label>
      <textarea value={local} onChange={handleChange} placeholder={placeholder} rows={rows} style={{ ...inp(), resize:"vertical" }}/>
    </div>
  );
};
