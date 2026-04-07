import React from 'react';
import { FONT_BODY } from '../../constants/fonts';
import { useSettings } from '../../hooks/useSettings';
import { Ic } from './Ic';

export const ExpandableText = ({ text, maxLines = 2, fontSize = 12, color, lineHeight = 1.4, expanded, onToggle, style }) => {
  const { C } = useSettings();
  if (!text?.trim()) return null;

  const clampHeight = maxLines * lineHeight * fontSize;
  const textColor = color || C.textSec;

  return (
    <div style={{ ...style }}>
      <div style={{
        overflow: "hidden",
        maxHeight: expanded ? 9999 : clampHeight,
        transition: "max-height 0.25s ease",
      }}>
        <div style={{
          fontSize, color: textColor, lineHeight, fontFamily: FONT_BODY,
          whiteSpace: "pre-wrap", wordBreak: "break-word",
        }}>
          {text}
        </div>
      </div>
      <button
        onClick={e => { e.stopPropagation(); onToggle?.(); }}
        style={{
          display: "flex", alignItems: "center", gap: 2,
          background: "none", border: "none", cursor: "pointer",
          padding: "4px 0", color: C.textMuted, fontSize: 11,
          fontFamily: FONT_BODY,
        }}
      >
        <Ic n={expanded ? "chevU" : "chevD"} s={12} c={C.textMuted}/>
      </button>
    </div>
  );
};
