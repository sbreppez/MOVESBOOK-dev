import React, { useState } from 'react';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { useSettings } from '../../hooks/useSettings';
import { useT } from '../../hooks/useTranslation';
import { Btn } from '../shared/Btn';

export const IdeaForm = ({ idea, onSave, onCancel }) => {
  const { C } = useSettings();
  const t = useT();

  const [f, setF] = useState({
    emoji: idea?.emoji || "",
    title: idea?.title || "",
    text: idea?.text || "",
    link: idea?.link || "",
    source: idea?.source || "",
  });

  const set = (k) => (v) => setF(p => ({ ...p, [k]: v }));

  const handleSave = () => {
    if (!f.text.trim()) return;
    onSave({
      emoji: f.emoji,
      title: f.title.trim(),
      text: f.text.trim(),
      link: f.link.trim(),
      source: f.source,
    });
  };

  const sourceOptions = [
    { value: "", key: "sourceCustom" },
    { value: "lastTraining", key: "sourceLastTraining" },
    { value: "video", key: "sourceVideo" },
  ];

  const pill = (active) => ({
    padding: "6px 14px", borderRadius: 20, cursor: "pointer", fontSize: 11,
    fontWeight: 700, fontFamily: FONT_DISPLAY, border: `1.5px solid ${active ? C.accent : C.border}`,
    background: active ? `${C.accent}20` : "transparent",
    color: active ? C.accent : C.textSec, transition: "all 0.15s",
    textTransform: "uppercase",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Emoji + Title */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input value={f.emoji} onChange={e => set("emoji")(e.target.value)}
          style={{
            width: 44, height: 44, textAlign: "center", fontSize: 22,
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
            color: C.text, fontFamily: FONT_BODY,
          }}/>
        <input value={f.title} onChange={e => set("title")(e.target.value)}
          placeholder={t("ideaTitle")}
          style={{
            flex: 1, padding: "10px 12px", fontSize: 14, fontFamily: FONT_BODY,
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
            color: C.text,
          }}/>
      </div>

      {/* Text */}
      <div>
        <label style={{ fontSize: 11, fontWeight: 800, color: C.textMuted, fontFamily: FONT_DISPLAY, letterSpacing: 1, textTransform: "uppercase" }}>
          {t("ideaText")}
        </label>
        <textarea value={f.text} onChange={e => set("text")(e.target.value)}
          rows={3}
          style={{
            width: "100%", padding: "8px 12px", fontSize: 13, fontFamily: FONT_BODY,
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
            color: C.text, resize: "vertical", marginTop: 4, boxSizing: "border-box",
          }}/>
      </div>

      {/* Link */}
      <div>
        <label style={{ fontSize: 11, fontWeight: 800, color: C.textMuted, fontFamily: FONT_DISPLAY, letterSpacing: 1, textTransform: "uppercase" }}>
          {t("ideaLink")}
        </label>
        <input value={f.link} onChange={e => set("link")(e.target.value)}
          placeholder="https://..."
          style={{
            width: "100%", padding: "8px 12px", fontSize: 13, fontFamily: FONT_BODY,
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
            color: C.text, marginTop: 4, boxSizing: "border-box",
          }}/>
      </div>

      {/* Source */}
      <div>
        <label style={{ fontSize: 11, fontWeight: 800, color: C.textMuted, fontFamily: FONT_DISPLAY, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6, display: "block" }}>
          {t("ideaSource")}
        </label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {sourceOptions.map(opt => (
            <button key={opt.value} onClick={() => set("source")(opt.value)}
              style={pill(f.source === opt.value)}>
              {t(opt.key)}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
        <Btn variant="secondary" onClick={onCancel}>{t("cancel")}</Btn>
        <Btn variant="primary" onClick={handleSave}>{t("save")}</Btn>
      </div>
    </div>
  );
};
