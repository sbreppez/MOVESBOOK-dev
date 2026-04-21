import React, { useState, useRef, useEffect } from 'react';
import { lbl, inp } from '../../constants/styles';

export const Txtarea = ({ label, value, onChange, placeholder, rows=3, autoExpand=false }) => {
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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- autoResize is a closure recreated each render; including it would loop
  }, [local, autoExpand]);

  const handleChange = e => {
    const v = e.target.value;
    setLocal(v);
    onChangeRef.current(v);
    if (autoExpand) autoResize(e.target);
  };

  return (
    <div style={{ marginBottom:14 }}>
      <label style={lbl()}>{label}</label>
      <textarea
        ref={textareaRef}
        value={local}
        onChange={handleChange}
        placeholder={placeholder}
        rows={rows}
        style={{ ...inp(), resize: autoExpand ? "none" : "vertical", overflow: autoExpand ? "hidden" : undefined }}
      />
    </div>
  );
};
