import { useState, useRef, useEffect, useCallback } from 'react';
import { FONT_DISPLAY } from '../../constants/fonts';
import { Ic } from './Ic';
import { useSettings } from '../../hooks/useSettings';

export const DropdownPill = ({ label, value = [], options, onChange, defaultLabel }) => {
  const { C } = useSettings();
  const [open, setOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const pillRef = useRef(null);
  const popoverRef = useRef(null);

  const isActive = value.length > 0;

  // ── Pill display text ──
  let pillText = label;
  if (value.length === 1) {
    const sel = options.find(o => o.key === value[0]);
    pillText = `${label}: ${sel?.label || value[0]}`;
  } else if (value.length > 1) {
    pillText = `${label}: ${value.length}`;
  }

  // ── Close on click/tap outside ──
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (
        pillRef.current && !pillRef.current.contains(e.target) &&
        popoverRef.current && !popoverRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("touchstart", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
    };
  }, [open]);

  // ── Toggle with edge detection ──
  const handleToggle = useCallback(() => {
    if (!open && pillRef.current) {
      const rect = pillRef.current.getBoundingClientRect();
      setAlignRight(rect.left + 200 > window.innerWidth);
    }
    setOpen(prev => !prev);
  }, [open]);

  // ── Selection logic ──
  const handleSelect = useCallback((key) => {
    if (key === "__all__") {
      onChange([]);
    } else if (value.includes(key)) {
      onChange(value.filter(k => k !== key));
    } else {
      onChange([...value, key]);
    }
  }, [onChange, value]);

  const isSelected = (key) => {
    if (key === "__all__") return value.length === 0;
    return value.includes(key);
  };

  // ── Build full option list with "All" row prepended ──
  const allOptions = [
    { key: "__all__", label: defaultLabel },
    ...options,
  ];

  // ── Render ──
  return (
    <div style={{ position: "relative", flexShrink: 0 }} ref={pillRef}>
      <button
        onClick={handleToggle}
        style={{
          display: "flex", alignItems: "center",
          padding: "6px 12px", borderRadius: 20, minHeight: 32,
          fontSize: 11, fontWeight: 700, fontFamily: FONT_DISPLAY,
          letterSpacing: 0.3, whiteSpace: "nowrap", cursor: "pointer",
          border: `1.5px solid ${isActive ? C.accent : C.border}`,
          background: C.surface,
          color: isActive ? C.accent : C.textSec,
        }}
      >
        <span>{pillText}</span>
        <svg width={12} height={12} viewBox="0 0 12 12" fill="none"
          style={{ marginLeft: 4, transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.15s ease" }}>
          <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor"
            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          ref={popoverRef}
          style={{
            position: "absolute", top: "calc(100% + 4px)",
            ...(alignRight ? { right: 0 } : { left: 0 }),
            minWidth: 160, maxHeight: 280, overflowY: "auto",
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 8, zIndex: 100, padding: "4px 0",
            boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
          }}
        >
          {allOptions.map(opt => {
            const checked = isSelected(opt.key);
            return (
              <button
                key={opt.key}
                onClick={() => handleSelect(opt.key)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  width: "100%", padding: "0 12px", minHeight: 44,
                  fontSize: 13, fontWeight: 600, fontFamily: FONT_DISPLAY,
                  color: checked ? C.accent : C.text,
                  background: "transparent", border: "none",
                  cursor: "pointer", textAlign: "left",
                }}
              >
                {/* Checkbox */}
                {checked ? (
                  <div style={{
                    width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                    background: C.accent,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Ic n="check" s={10} c="#fff" />
                  </div>
                ) : (
                  <div style={{
                    width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                    border: `1.5px solid ${C.textMuted}`,
                    background: "transparent",
                  }} />
                )}

                {/* Color dot — only for options that have a color */}
                {opt.color && (
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: opt.color, flexShrink: 0,
                  }} />
                )}

                {/* Label */}
                <span style={{ flex: 1 }}>{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
