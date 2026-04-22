import React from 'react';
import { useSettings } from '../../hooks/useSettings';
import { useT } from '../../hooks/useTranslation';
import { FONT_DISPLAY } from '../../constants/fonts';
import { Ic } from '../shared/Ic';
import { VERSION_CHIPS } from '../../hooks/useVersionPrompt';

export const VersionTrackingPrompt = ({ move, onDismiss, onCreateVariation }) => {
  const { C } = useSettings();
  const t = useT();

  if (!move) return null;

  return (
    <div style={{
      margin: "6px 14px", padding: 14, background: C.surfaceAlt,
      borderRadius: 8, position: "relative",
    }}>
      <button
        onClick={() => onDismiss(move.id)}
        style={{
          position: "absolute", top: 8, right: 8,
          background: "none", border: "none", cursor: "pointer",
          padding: 2, display: "flex",
        }}
      >
        <Ic n="x" s={14} c={C.textMuted} />
      </button>

      <div style={{
        fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 14,
        color: C.text, marginBottom: 8,
      }}>
        <span style={{ color: C.accent }}>{move.name}</span> — {t("createVariation")}
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {VERSION_CHIPS.map(ch => (
          <button
            key={ch.key}
            onClick={() => onCreateVariation(move, ch.key)}
            style={{
              border: `1.5px solid ${C.border}`, cursor: "pointer",
              borderRadius: 20, fontFamily: FONT_DISPLAY, fontWeight: 700,
              letterSpacing: 0.3, fontSize: 11, padding: "4px 10px",
              whiteSpace: "nowrap", transition: "all 0.15s",
              background: C.surface, color: C.textSec,
            }}
          >
            {t(ch.label)}
          </button>
        ))}
        <button
          onClick={() => onCreateVariation(move, null)}
          style={{
            border: `1.5px solid ${C.accent}`, cursor: "pointer",
            borderRadius: 20, fontFamily: FONT_DISPLAY, fontWeight: 700,
            letterSpacing: 0.3, fontSize: 11, padding: "4px 10px",
            whiteSpace: "nowrap", transition: "all 0.15s",
            background: C.accent + "18", color: C.accent,
          }}
        >
          + {t("createOwnVersion")}
        </button>
      </div>
    </div>
  );
};
