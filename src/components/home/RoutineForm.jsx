import React, { useState } from 'react';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { useSettings } from '../../hooks/useSettings';
import { useT } from '../../hooks/useTranslation';
import { Btn } from '../shared/Btn';

const TIME_OPTIONS = ["morning", "midday", "afternoon", "evening"];
const REPEAT_OPTIONS = [
  { value: "daily",        key: "repeatEveryDay" },
  { value: "specificDays", key: "repeatSpecificDays" },
  { value: "workdays",     key: "repeatWorkdays" },
  { value: "none",         key: "repeatNone" },
];
const DOW_LABELS = ['S','M','T','W','T','F','S'];
const TOD_KEYS = { morning: "todMorning", midday: "todMidday", afternoon: "todAfternoon", evening: "todEvening" };

export const RoutineForm = ({ routine, onSave, onCancel }) => {
  const { C } = useSettings();
  const t = useT();
  const isEdit = !!routine;

  const [f, setF] = useState({
    emoji: routine?.emoji || "",
    name: routine?.name || "",
    duration: routine?.duration || 30,
    description: routine?.description || "",
    checkable: routine?.checkable ?? true,
    repeatType: routine?.repeat?.type || "daily",
    repeatDays: routine?.repeat?.days || [],
    timeOfDay: routine?.timeOfDay || "morning",
  });

  const set = (k) => (v) => setF(p => ({ ...p, [k]: v }));

  const handleSave = () => {
    if (!f.name.trim()) return;
    onSave({
      emoji: f.emoji,
      name: f.name.trim(),
      duration: Math.max(0, parseInt(f.duration) || 0),
      description: f.description.trim(),
      checkable: f.checkable,
      repeat: { type: f.repeatType, days: f.repeatDays },
      timeOfDay: f.timeOfDay,
    });
  };

  const pill = (active) => ({
    padding: "6px 14px", borderRadius: 20, cursor: "pointer", fontSize: 12,
    fontWeight: 700, fontFamily: FONT_DISPLAY, border: `1.5px solid ${active ? C.accent : C.border}`,
    background: active ? `${C.accent}20` : "transparent",
    color: active ? C.accent : C.textSec, transition: "all 0.15s",
    textTransform: "uppercase",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Emoji + Name */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input value={f.emoji} onChange={e => set("emoji")(e.target.value)}
          style={{
            width: 44, height: 44, textAlign: "center", fontSize: 22,
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
            color: C.text, fontFamily: FONT_BODY,
          }}/>
        <input value={f.name} onChange={e => set("name")(e.target.value)}
          placeholder={t("routineName")}
          style={{
            flex: 1, padding: "10px 12px", fontSize: 14, fontFamily: FONT_BODY,
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
            color: C.text,
          }}/>
      </div>

      {/* Duration */}
      <div>
        <label style={{ fontSize: 11, fontWeight: 800, color: C.textMuted, fontFamily: FONT_DISPLAY, letterSpacing: 1, textTransform: "uppercase" }}>
          {t("routineDuration")}
        </label>
        <input type="number" value={f.duration} onChange={e => set("duration")(e.target.value)}
          style={{
            width: "100%", padding: "8px 12px", fontSize: 14, fontFamily: FONT_BODY,
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
            color: C.text, marginTop: 4,
          }}/>
      </div>

      {/* Description */}
      <div>
        <label style={{ fontSize: 11, fontWeight: 800, color: C.textMuted, fontFamily: FONT_DISPLAY, letterSpacing: 1, textTransform: "uppercase" }}>
          {t("routineDescription")}
        </label>
        <textarea value={f.description} onChange={e => set("description")(e.target.value)}
          rows={3}
          style={{
            width: "100%", padding: "8px 12px", fontSize: 13, fontFamily: FONT_BODY,
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
            color: C.text, resize: "vertical", marginTop: 4, boxSizing: "border-box",
          }}/>
      </div>

      {/* Checkable */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.textSec, fontFamily: FONT_DISPLAY, textTransform: "uppercase" }}>
          {t("routineCheckable")}
        </span>
        <button onClick={() => set("checkable")(!f.checkable)}
          style={{
            width: 44, height: 26, borderRadius: 13, border: "none", cursor: "pointer",
            background: f.checkable ? C.green : C.surfaceAlt,
            position: "relative", transition: "background 0.2s",
          }}>
          <div style={{
            width: 20, height: 20, borderRadius: "50%", background: "#fff",
            position: "absolute", top: 3,
            left: f.checkable ? 21 : 3, transition: "left 0.2s",
          }}/>
        </button>
      </div>

      {/* Time of Day */}
      <div>
        <label style={{ fontSize: 11, fontWeight: 800, color: C.textMuted, fontFamily: FONT_DISPLAY, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6, display: "block" }}>
          {t("todMorning").split(" ")[0] ? "TIME OF DAY" : "TIME OF DAY"}
        </label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {TIME_OPTIONS.map(tod => (
            <button key={tod} onClick={() => set("timeOfDay")(tod)}
              style={pill(f.timeOfDay === tod)}>
              {t(TOD_KEYS[tod]) || tod}
            </button>
          ))}
        </div>
      </div>

      {/* Repeat */}
      <div>
        <label style={{ fontSize: 11, fontWeight: 800, color: C.textMuted, fontFamily: FONT_DISPLAY, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6, display: "block" }}>
          REPEAT
        </label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {REPEAT_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => set("repeatType")(opt.value)}
              style={pill(f.repeatType === opt.value)}>
              {t(opt.key)}
            </button>
          ))}
        </div>

        {f.repeatType === "specificDays" && (
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            {DOW_LABELS.map((label, i) => {
              const active = f.repeatDays.includes(i);
              return (
                <button key={i} onClick={() => {
                  set("repeatDays")(active ? f.repeatDays.filter(d => d !== i) : [...f.repeatDays, i]);
                }}
                  style={{
                    width: 34, height: 34, borderRadius: "50%", border: `1.5px solid ${active ? C.accent : C.border}`,
                    background: active ? `${C.accent}20` : "transparent",
                    color: active ? C.accent : C.textMuted, fontSize: 12, fontWeight: 800,
                    fontFamily: FONT_DISPLAY, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
        <Btn variant="secondary" onClick={onCancel}>{t("cancel")}</Btn>
        <Btn variant="primary" onClick={handleSave}>{t("save")}</Btn>
      </div>
    </div>
  );
};
