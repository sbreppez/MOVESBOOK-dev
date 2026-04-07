import React, { useState, useEffect } from 'react';
import { FONT_DISPLAY } from '../../constants/fonts';
import { useSettings } from '../../hooks/useSettings';
import { Ic } from './Ic';

export const BottomSheet = ({ open, onClose, title, titleIcon, children, maxHeight, zIndex }) => {
  const { C } = useSettings();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => setVisible(true));
      return () => { document.body.style.overflow = prev || ""; };
    } else {
      setVisible(false);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
        zIndex: zIndex || 1000, display: "flex", alignItems: "flex-end",
        justifyContent: "center",
      }}>
      <div onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 420, maxHeight: maxHeight || "70vh",
          background: C.bg, borderRadius: "20px 20px 0 0",
          border: `1px solid ${C.border}`, borderBottom: "none",
          display: "flex", flexDirection: "column", overflow: "hidden",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.3)",
          transform: visible ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.3s ease",
        }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 18px", borderBottom: `1px solid ${C.borderLight}`, flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {titleIcon && <span style={{ fontSize: 16 }}>{titleIcon}</span>}
            <span style={{
              fontWeight: 800, fontSize: 14, letterSpacing: 1.5,
              color: C.text, fontFamily: FONT_DISPLAY, textTransform: "uppercase",
            }}>
              {title}
            </span>
          </div>
          <button onClick={onClose}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: C.textMuted, padding: 4, borderRadius: 6,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
            <Ic n="x" s={16}/>
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 14px" }}>
          {children}
        </div>
      </div>
    </div>
  );
};
