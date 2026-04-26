import React, { useState, useRef, useEffect } from 'react';
import { C } from '../../constants/colors';
import { lbl, inp } from '../../constants/styles';

export const Txtarea = ({ label, hint, value, onChange, placeholder, rows=3, autoExpand=false, minHeight }) => {
  const [local, setLocal] = useState(value);
  const onChangeRef = useRef(onChange);
  const textareaRef = useRef(null);
  onChangeRef.current = onChange;
  useEffect(() => { setLocal(value); }, [value]);

  const autoResize = (el) => {
    if (!el || !autoExpand) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  };

  useEffect(() => {
    if (autoExpand && textareaRef.current) autoResize(textareaRef.current);
  }, [local, autoExpand]);

  const handleChange = e => {
    const v = e.target.value;
    setLocal(v);
    onChangeRef.current(v);
    if (autoExpand) autoResize(e.target);
  };

  return (
    <div style={{ marginBottom:14 }}>
      {label && <label style={lbl()}>{label}</label>}
      {hint && <div style={{ fontSize:11, color:C.textMuted, marginBottom:5, fontStyle:"italic" }}>{hint}</div>}
      <textarea
        ref={textareaRef}
        value={local}
        onChange={handleChange}
        placeholder={placeholder}
        rows={rows}
        style={{ ...inp(), resize: autoExpand ? "none" : "vertical", overflow: autoExpand ? "hidden" : undefined, ...(minHeight ? { minHeight } : {}) }}
      />
    </div>
  );
};
