import React from 'react';
import { FONT_DISPLAY } from '../../constants/fonts';
import { useT } from '../../hooks/useTranslation';
import { useSettings } from '../../hooks/useSettings';
import { BodyPartChipGrid } from './BodyPartChipGrid';

const partLabelKey = (p) => p ? "bodyPart" + p.charAt(0).toUpperCase() + p.slice(1) : "";

export const SorenessSheet = ({ value = [], onChange }) => {
  const { C } = useSettings();
  const t = useT();

  const sevColors = { 1: C.green, 2: C.yellow, 3: C.accent };

  const handleToggle = (chip) => {
    const idx = value.findIndex(
      s => s.bodyPart === chip.bodyPart && s.side === (chip.side || null)
    );
    if (idx >= 0) {
      onChange(value.filter((_, i) => i !== idx));
    } else {
      onChange([...value, { bodyPart: chip.bodyPart, side: chip.side || null, severity: 1 }]);
    }
  };

  const handleSeverityChange = (idx, newSeverity) => {
    onChange(value.map((s, i) => i === idx ? { ...s, severity: newSeverity } : s));
  };

  const buildLabel = (entry) => {
    const part = t(partLabelKey(entry.bodyPart));
    if (!entry.side) return part;
    return `${t(entry.side === "left" ? "leftSide" : "rightSide")} ${part}`;
  };

  return (
    <div>
      <BodyPartChipGrid
        selected={value.map(s => ({ bodyPart: s.bodyPart, side: s.side }))}
        onToggle={handleToggle}
      />

      {value.map((entry, idx) => (
        <div
          key={`${entry.bodyPart}-${entry.side || "none"}`}
          style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: FONT_DISPLAY, letterSpacing: 0.5 }}>
            {buildLabel(entry)}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {[1, 2, 3].map(s => {
              const active = entry.severity === s;
              const color = sevColors[s];
              return (
                <button
                  key={s}
                  onClick={() => handleSeverityChange(idx, s)}
                  style={{
                    flex: 1, padding: "9px 8px", borderRadius: 8, cursor: "pointer",
                    fontSize: 11, fontWeight: 800, fontFamily: FONT_DISPLAY,
                    letterSpacing: 0.5, textTransform: "uppercase",
                    border: `1.5px solid ${active ? color : C.border}`,
                    background: active ? color : C.surface,
                    color: active ? "#fff" : C.textMuted,
                    transition: "all 0.15s",
                  }}>
                  {t(s === 1 ? "severityMild" : s === 2 ? "severityModerate" : "severitySevere")}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
