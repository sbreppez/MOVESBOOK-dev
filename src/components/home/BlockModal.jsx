import React, { useState } from 'react';
import { FONT_DISPLAY } from '../../constants/fonts';
import { useSettings } from '../../hooks/useSettings';
import { useT } from '../../hooks/useTranslation';
import { Modal } from '../shared/Modal';
import { Btn } from '../shared/Btn';

const TAG_OPTIONS = [
  { value:"",             key:"tagNone" },
  { value:"breaking",     key:"tagBreaking" },
  { value:"drill",        key:"tagDrill" },
  { value:"conditioning", key:"tagConditioning" },
  { value:"flexibility",  key:"tagFlexibility" },
];
const TIME_OPTIONS = ["morning","midday","afternoon","evening"];
const REPEAT_OPTIONS = [
  { value:"daily",        key:"repeatEveryDay" },
  { value:"specificDays", key:"repeatSpecificDays" },
  { value:"workdays",     key:"repeatWorkdays" },
  { value:"none",         key:"repeatNone" },
];
const DOW_LABELS = ['S','M','T','W','T','F','S'];

export const BlockModal = ({ onClose, onSave, onDelete, block }) => {
  const { C } = useSettings();
  const t = useT();
  const isEdit = !!block;

  const [f, setF] = useState({
    emoji: block?.emoji || "🤸",
    name: block?.name || "",
    duration: block?.duration || 30,
    description: block?.description || "",
    checkable: block?.checkable ?? true,
    repeatType: block?.repeat?.type || "daily",
    repeatDays: block?.repeat?.days || [],
    timeOfDay: block?.timeOfDay || "morning",
    tag: block?.tag || "",
  });
  const [confirmDel, setConfirmDel] = useState(false);

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
      tag: f.tag,
    });
    onClose();
  };

  const toggleDay = (d) => {
    setF(p => ({
      ...p,
      repeatDays: p.repeatDays.includes(d)
        ? p.repeatDays.filter(x => x !== d)
        : [...p.repeatDays, d].sort(),
    }));
  };

  const lbl = { display:"block", fontSize:11, fontWeight:800, letterSpacing:1.5, color:C.textSec, fontFamily:FONT_DISPLAY, marginBottom:6, marginTop:14 };
  const inp = { width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 12px", color:C.text, fontSize:14, outline:"none", boxSizing:"border-box" };

  const pill = (active) => ({
    padding:"6px 14px", borderRadius:20, cursor:"pointer", fontSize:12, fontWeight:700,
    fontFamily:FONT_DISPLAY, letterSpacing:0.5, border:`1.5px solid ${active ? C.accent : C.border}`,
    background: active ? `${C.accent}20` : "transparent", color: active ? C.accent : C.textMuted,
    transition:"all 0.15s",
  });

  return (
    <Modal title={isEdit ? t("editBlock") : t("addBlock")} onClose={onClose}
      footer={
        <div style={{ display:"flex", gap:8, justifyContent: isEdit ? "space-between" : "flex-end" }}>
          {isEdit && !confirmDel && <Btn variant="danger" small onClick={() => setConfirmDel(true)}>{t("delete")}</Btn>}
          {isEdit && confirmDel && (
            <div style={{ display:"flex", gap:6, alignItems:"center" }}>
              <span style={{ fontSize:11, color:C.accent, fontWeight:700 }}>{t("deleteBlock")}</span>
              <Btn variant="danger" small onClick={() => { onDelete(); onClose(); }}>{t("confirm")}</Btn>
              <Btn variant="secondary" small onClick={() => setConfirmDel(false)}>{t("cancel")}</Btn>
            </div>
          )}
          <Btn variant="primary" onClick={handleSave} disabled={!f.name.trim()}>{t("save")}</Btn>
        </div>
      }>

      {/* Emoji + Name row */}
      <div style={{ display:"flex", gap:8, alignItems:"flex-end" }}>
        <div style={{ width:60 }}>
          <label style={lbl}>{t("blockEmoji")}</label>
          <input value={f.emoji} onChange={e => set("emoji")(e.target.value)} maxLength={4}
            style={{ ...inp, textAlign:"center", fontSize:20, padding:"6px 4px" }}/>
        </div>
        <div style={{ flex:1 }}>
          <label style={lbl}>{t("blockName")}</label>
          <input value={f.name} onChange={e => set("name")(e.target.value)} placeholder={t("blockNamePlaceholder")}
            style={inp}/>
        </div>
      </div>

      {/* Duration */}
      <label style={lbl}>{t("blockDuration")}</label>
      <input type="number" value={f.duration} onChange={e => set("duration")(e.target.value)} min={0}
        style={{ ...inp, width:100 }}/>

      {/* Description */}
      <label style={lbl}>{t("blockDescription")}</label>
      <textarea value={f.description} onChange={e => set("description")(e.target.value)}
        placeholder={t("blockDescPlaceholder")} rows={2}
        style={{ ...inp, resize:"vertical", fontFamily:"inherit" }}/>

      {/* Checkable toggle */}
      <label style={lbl}>{t("blockCheckable")}</label>
      <button onClick={() => set("checkable")(!f.checkable)}
        style={{
          width:46, height:26, borderRadius:13, border:"none", cursor:"pointer",
          background: f.checkable ? C.accent : C.border, position:"relative", transition:"background 0.2s",
        }}>
        <div style={{
          position:"absolute", top:4, left: f.checkable ? 24 : 4, width:18, height:18, borderRadius:"50%",
          background:"#fff", transition:"left 0.2s", boxShadow:"0 1px 4px rgba(0,0,0,0.3)",
        }}/>
      </button>
      <span style={{ fontSize:11, color:C.textMuted, marginLeft:8 }}>{t("blockCheckableDesc")}</span>

      {/* Training Type Tag */}
      <label style={lbl}>{t("trainingType")}</label>
      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
        {TAG_OPTIONS.map(opt => (
          <button key={opt.value} onClick={() => set("tag")(opt.value)} style={pill(f.tag === opt.value)}>
            {t(opt.key)}
          </button>
        ))}
      </div>

      {/* Time of Day */}
      <label style={lbl}>{t("blockTimeOfDay")}</label>
      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
        {TIME_OPTIONS.map(tod => (
          <button key={tod} onClick={() => set("timeOfDay")(tod)} style={pill(f.timeOfDay === tod)}>
            {t("tod" + tod.charAt(0).toUpperCase() + tod.slice(1))}
          </button>
        ))}
      </div>

      {/* Repeat */}
      <label style={lbl}>{t("blockRepeat")}</label>
      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
        {REPEAT_OPTIONS.map(opt => (
          <button key={opt.value} onClick={() => set("repeatType")(opt.value)} style={pill(f.repeatType === opt.value)}>
            {t(opt.key)}
          </button>
        ))}
      </div>

      {/* Day selector (specificDays only) */}
      {f.repeatType === "specificDays" && (
        <div style={{ display:"flex", gap:6, marginTop:10 }}>
          {DOW_LABELS.map((ltr, i) => {
            const active = f.repeatDays.includes(i);
            return (
              <button key={i} onClick={() => toggleDay(i)}
                style={{
                  width:36, height:36, borderRadius:"50%", cursor:"pointer", fontSize:13, fontWeight:800,
                  fontFamily:FONT_DISPLAY, border:`2px solid ${active ? C.accent : C.border}`,
                  background: active ? `${C.accent}20` : "transparent",
                  color: active ? C.accent : C.textMuted, transition:"all 0.15s",
                }}>
                {ltr}
              </button>
            );
          })}
        </div>
      )}
    </Modal>
  );
};
