import React, { useState } from 'react';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { useSettings } from '../../hooks/useSettings';
import { useT } from '../../hooks/useTranslation';
import { Btn } from '../shared/Btn';
import { Ic } from '../shared/Ic';

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
    name: routine?.name || "",
    steps: routine?.steps || [],
    repeatType: routine?.repeat?.type || "daily",
    repeatDays: routine?.repeat?.days || [],
    timeOfDay: routine?.timeOfDay || "morning",
  });

  const set = (k) => (v) => setF(p => ({ ...p, [k]: v }));

  const handleSave = () => {
    if (!f.name.trim()) return;
    onSave({
      name: f.name.trim(),
      steps: f.steps.filter(s => s.text.trim()).map(s => ({ id: s.id, text: s.text.trim() })),
      repeat: { type: f.repeatType, days: f.repeatDays },
      timeOfDay: f.timeOfDay,
    });
  };

  const pill = (active) => ({
    padding: "6px 14px", borderRadius: 20, cursor: "pointer", fontSize: 11,
    fontWeight: 700, fontFamily: FONT_DISPLAY, border: `1.5px solid ${active ? C.accent : C.border}`,
    background: active ? `${C.accent}20` : "transparent",
    color: active ? C.accent : C.textSec, transition: "all 0.15s",
    textTransform: "uppercase",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Name */}
      <input value={f.name} onChange={e => set("name")(e.target.value)}
        placeholder={t("routineName")}
        style={{
          width: "100%", padding: "10px 12px", fontSize: 14, fontFamily: FONT_BODY,
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
          color: C.text, outline: "none", boxSizing: "border-box",
        }}/>

      {/* Steps — checklist builder */}
      <div>
        <label style={{ fontSize: 11, fontWeight: 800, color: C.textMuted, fontFamily: FONT_DISPLAY, letterSpacing: 1, textTransform: "uppercase" }}>
          {t("steps")}
        </label>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 6 }}>
          {f.steps.map((step, idx) => (
            <div key={step.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${C.border}`, flexShrink: 0 }}/>
              <input
                value={step.text}
                onChange={e => {
                  const newSteps = [...f.steps];
                  newSteps[idx] = { ...step, text: e.target.value };
                  set("steps")(newSteps);
                }}
                placeholder={`${t("step")} ${idx + 1}`}
                style={{
                  flex: 1, padding: "8px 12px", fontSize: 13, fontFamily: FONT_BODY,
                  background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
                  color: C.text, outline: "none", boxSizing: "border-box",
                }}/>
              <button onClick={() => set("steps")(f.steps.filter((_, i) => i !== idx))}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 4, flexShrink: 0 }}>
                <Ic n="x" s={14} c={C.textMuted}/>
              </button>
            </div>
          ))}
          <button onClick={() => set("steps")([...f.steps, { id: Date.now().toString(), text: "" }])}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 12px",
              background: "transparent", border: `1.5px dashed ${C.border}`,
              borderRadius: 8, cursor: "pointer", color: C.accent,
              fontSize: 12, fontWeight: 700, fontFamily: FONT_DISPLAY,
            }}>
            <Ic n="plus" s={14} c={C.accent}/> {t("addStep")}
          </button>
        </div>
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
                    color: active ? C.accent : C.textMuted, fontSize: 11, fontWeight: 800,
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
