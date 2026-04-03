import React, { useState } from 'react';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { lbl } from '../../constants/styles';
import { HABIT_COLORS } from '../../constants/categories';
import { Modal } from '../shared/Modal';
import { Btn } from '../shared/Btn';
import { useT } from '../../hooks/useTranslation';
import { useSettings } from '../../hooks/useSettings';

export const HabitModal = ({ onClose, onSave, habit }) => {
  const { C } = useSettings();
  const t = useT();
  const isEdit = !!habit;
  const [name,      setName]      = useState(habit?.name      || "");
  const [frequency, setFrequency] = useState(habit?.frequency || "daily");
  const [color,     setColor]     = useState(habit?.color     || HABIT_COLORS[0]);
  const [why,       setWhy]       = useState(habit?.why       || "");
  const [notes,     setNotes]     = useState(habit?.notes     || "");
  const [timeOfDay, setTimeOfDay] = useState(habit?.timeOfDay || "anytime");

  const inputStyle = { width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8,
    padding:"9px 12px", color:C.text, fontSize:13, outline:"none", fontFamily:FONT_BODY,
    boxSizing:"border-box", lineHeight:1.5 };

  const TOD = [
    {id:"morning",   label:"🌅 Morning"},
    {id:"afternoon", label:"☀️ Afternoon"},
    {id:"evening",   label:"🌙 Evening"},
    {id:"anytime",   label:"⚡ Anytime"},
  ];

  return (
    <Modal title={isEdit?t("editHabit"):t("newHabit")} onClose={onClose}>
      {/* Name */}
      <div style={{ marginBottom:14 }}>
        <label style={lbl()}>{t("habitNameLabel")} *</label>
        <div style={{ fontSize:11, color:C.textMuted, marginBottom:5, fontStyle:"italic" }}>
          {t("habitTip")}
        </div>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder={t("habitNamePlaceholder")}
          style={{ ...inputStyle, fontSize:14, fontWeight:700, border:`1.5px solid ${C.accent}` }}/>
      </div>

      {/* Why */}
      <div style={{ marginBottom:14 }}>
        <label style={lbl()}>WHY? <span style={{ fontWeight:400, fontSize:10, color:C.textMuted }}>{t("whyOptional")}</span></label>
        <input value={why} onChange={e=>setWhy(e.target.value)}
          placeholder={t("whyHabitPlaceholder")}
          style={inputStyle}/>
      </div>

      {/* Time of day */}
      <div style={{ marginBottom:14 }}>
        <label style={lbl()}>{t("timeOfDayLabel")}</label>
        <div style={{ display:"flex", gap:6, marginTop:6, flexWrap:"wrap" }}>
          {TOD.map(t=>(
            <button key={t.id} onClick={()=>setTimeOfDay(t.id)}
              style={{ padding:"7px 12px", borderRadius:8, cursor:"pointer", fontSize:11, fontWeight:800,
                fontFamily:FONT_DISPLAY, letterSpacing:0.3, border:`2px solid ${timeOfDay===t.id?C.accent:C.border}`,
                background: timeOfDay===t.id ? `${C.accent}15` : C.surface,
                color: timeOfDay===t.id ? C.accent : C.textMuted }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Frequency */}
      <div style={{ marginBottom:14 }}>
        <label style={lbl()}>{t("frequencyLabel")}</label>
        <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:6 }}>
          {[
            {id:"daily",    label:t("everyDay")},
            {id:"2x",       label:t("freq2x")},
            {id:"3x",       label:t("freq3x")},
            {id:"4x",       label:t("freq4x")},
            {id:"5x",       label:t("freq5x")},
            {id:"6x",       label:t("freq6x")},
            {id:"weekdays", label:t("freqWeekdays")},
          ].map(f=>(
            <button key={f.id} onClick={()=>setFrequency(f.id)}
              style={{ padding:"7px 12px", borderRadius:8, cursor:"pointer", fontSize:11, fontWeight:800,
                fontFamily:FONT_DISPLAY, letterSpacing:0.5, border:`2px solid ${frequency===f.id?C.accent:C.border}`,
                background: frequency===f.id ? `${C.accent}15` : C.surface,
                color: frequency===f.id ? C.accent : C.textMuted }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div style={{ marginBottom:14 }}>
        <label style={lbl()}>NOTES <span style={{ fontWeight:400, fontSize:10, color:C.textMuted }}>{t("notesOptional")}</span></label>
        <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3}
          placeholder={t("notesHabitPlaceholder")}
          style={{ ...inputStyle, resize:"vertical" }}/>
      </div>

      <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
        <Btn variant="secondary" onClick={onClose}>{t("cancel")}</Btn>
        <Btn onClick={()=>{ if(name.trim()){ onSave({name:name.trim(), frequency, color, why:why.trim(), notes:notes.trim(), timeOfDay}); onClose(); }}} disabled={!name.trim()}>{t("save")}</Btn>
      </div>
    </Modal>
  );
};
