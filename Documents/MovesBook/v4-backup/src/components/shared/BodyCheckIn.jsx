import React from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY } from '../../constants/fonts';
import { useT } from '../../hooks/useTranslation';
import { Ic } from './Ic';

export const EXERTION_OPTIONS = [
  { value: 1, emoji: "\u{1F60C}", key: "exertionEasy" },
  { value: 2, emoji: "\u{1F60A}", key: "exertionModerate" },
  { value: 3, emoji: "\u{1F624}", key: "exertionHard" },
  { value: 4, emoji: "\u{1F975}", key: "exertionMax" },
];

export const BODY_PARTS = [
  { field: "wrists",    emoji: "\u{1F91A}", key: "wrists" },
  { field: "shoulders", emoji: "\u{1F4AA}", key: "shoulders" },
  { field: "knees",     emoji: "\u{1F9B5}", key: "knees" },
  { field: "back",      emoji: "\u{1F519}", key: "lowerBack" },
];

export const BODY_STATES = [
  null,
  { key: "good",  color: "green" },
  { key: "tight", color: "yellow" },
  { key: "pain",  color: "red" },
];

export const BodyCheckIn = ({ exertion, onExertionChange, bodyStatus, onBodyStatusChange, settings, onSettingsChange }) => {
  const t = useT();
  const collapsed = settings?.bodyCheckCollapsed ?? false;

  const toggleCollapse = () => {
    onSettingsChange(prev => ({ ...prev, bodyCheckCollapsed: !collapsed }));
  };

  const handleExertionTap = (value) => {
    onExertionChange(exertion === value ? null : value);
  };

  const handleBodyTap = (field) => {
    const current = bodyStatus ? (bodyStatus[field] || 0) : 0;
    const next = (current + 1) % 4;
    const base = bodyStatus || { wrists: 0, shoulders: 0, knees: 0, back: 0 };
    const updated = { ...base, [field]: next };
    const allZero = Object.values(updated).every(v => v === 0);
    onBodyStatusChange(allZero ? null : updated);
  };

  const labelStyle = {
    fontFamily: FONT_DISPLAY,
    fontWeight: 700,
    fontSize: 10,
    color: C.textMuted,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
  };

  return (
    <div style={{
      background: C.surface,
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
    }}>
      {/* Header */}
      <button
        onClick={toggleCollapse}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
        }}
      >
        <span style={{
          fontFamily: FONT_DISPLAY,
          fontWeight: 700,
          fontSize: 11,
          color: C.textMuted,
          letterSpacing: 1,
          textTransform: "uppercase",
        }}>
          {t("bodyCheckIn")}
        </span>
        <Ic n={collapsed ? "chevR" : "chevD"} s={14} c={C.textMuted} />
      </button>

      {!collapsed && (
        <div style={{ marginTop: 12 }}>
          {/* Exertion row */}
          <div style={labelStyle}>{t("howHardWasThat")}</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {EXERTION_OPTIONS.map(opt => {
              const active = exertion === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleExertionTap(opt.value)}
                  style={{
                    borderRadius: 20,
                    padding: "6px 14px",
                    border: `1.5px solid ${active ? C.accent : C.border}`,
                    background: active ? C.accent + "26" : C.surfaceAlt,
                    color: active ? C.accent : C.textSec,
                    fontFamily: FONT_DISPLAY,
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    whiteSpace: "nowrap",
                    letterSpacing: 0.3,
                  }}
                >
                  {opt.emoji} {t(opt.key)}
                </button>
              );
            })}
          </div>

          {/* Body status row */}
          <div style={{ ...labelStyle, marginTop: 12 }}>{t("howsYourBody")}</div>
          <div style={{ display: "flex", gap: 8 }}>
            {BODY_PARTS.map(part => {
              const val = bodyStatus?.[part.field] || 0;
              const state = BODY_STATES[val];
              const stateColor = state ? C[state.color] : null;
              return (
                <button
                  key={part.field}
                  onClick={() => handleBodyTap(part.field)}
                  style={{
                    flex: 1,
                    minWidth: 44,
                    minHeight: 44,
                    borderRadius: 10,
                    border: `1.5px solid ${stateColor || C.border}`,
                    background: stateColor ? stateColor + "14" : "transparent",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    gap: 2,
                    padding: 4,
                  }}
                >
                  <span style={{ fontSize: 18, lineHeight: 1 }}>{part.emoji}</span>
                  <span style={{
                    fontSize: 9,
                    fontFamily: FONT_DISPLAY,
                    fontWeight: 700,
                    letterSpacing: 0.3,
                    color: stateColor || C.textMuted,
                  }}>
                    {state ? t(state.key) : t(part.key)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
