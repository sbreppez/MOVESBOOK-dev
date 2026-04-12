import React, { useState, useRef, useEffect } from 'react';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { useSettings } from '../../hooks/useSettings';
import { useT } from '../../hooks/useTranslation';
import { Btn } from '../shared/Btn';
import { Ic } from '../shared/Ic';
import { todayLocal } from '../../utils/dateUtils';

export const IdeaForm = ({ idea, onSave, onCancel }) => {
  const { C } = useSettings();
  const t = useT();

  const [f, setF] = useState({
    title: idea?.title || "",
    text: idea?.text || "",
    link: idea?.link || "",
    showDate: idea?.showDate || "",
  });

  const textRef = useRef(null);
  const autoResize = (el) => { if (!el) return; el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; };
  useEffect(() => { if (textRef.current) autoResize(textRef.current); }, []);

  const set = (k) => (v) => setF(p => ({ ...p, [k]: v }));

  const handleSave = () => {
    onSave({
      title: f.title.trim(),
      text: f.text.trim(),
      link: f.link.trim(),
      showDate: f.showDate || null,
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Hint */}
      <div style={{
        fontSize: 11, color: C.textMuted, fontFamily: FONT_BODY,
        lineHeight: 1.5, marginBottom: 8, fontStyle: "italic",
      }}>
        {t("noteHint")}
      </div>

      {/* Title */}
      <input value={f.title} onChange={e => set("title")(e.target.value)}
        placeholder={t("ideaTitle")}
        style={{
          width: "100%", padding: "10px 12px", fontSize: 14, fontFamily: FONT_BODY,
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
          color: C.text, boxSizing: "border-box", outline: "none",
        }}/>

      {/* Text */}
      <textarea ref={textRef} value={f.text} onChange={e => { set("text")(e.target.value); autoResize(e.target); }}
        rows={3}
        style={{
          width: "100%", padding: "10px 12px", fontSize: 13, fontFamily: FONT_BODY,
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
          color: C.text, resize: "none", overflow: "hidden", marginTop: 4, boxSizing: "border-box", outline: "none",
        }}/>

      {/* Show the idea on the: */}
      <div>
        <label style={{ fontSize: 11, fontWeight: 800, color: C.textMuted, fontFamily: FONT_DISPLAY, letterSpacing: 1, textTransform: "uppercase" }}>
          {t("showIdeaOn")}
        </label>
        <input type="date" value={f.showDate || ""} onChange={e => set("showDate")(e.target.value)}
          style={{
            width: "100%", padding: "10px 12px", fontSize: 13, fontFamily: FONT_BODY,
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
            color: C.text, marginTop: 4, boxSizing: "border-box", outline: "none",
          }}/>
        {f.showDate && f.showDate < todayLocal() && (
          <div style={{
            fontSize: 11, color: C.accent, fontWeight: 700, fontFamily: FONT_DISPLAY,
            marginTop: 4, display: "flex", alignItems: "center", gap: 4,
          }}>
            <Ic n="info" s={12} c={C.accent}/>
            {t("pastDateWarning")}
          </div>
        )}
      </div>

      {/* Link */}
      <div>
        <label style={{ fontSize: 11, fontWeight: 800, color: C.textMuted, fontFamily: FONT_DISPLAY, letterSpacing: 1, textTransform: "uppercase" }}>
          {t("ideaLink")}
        </label>
        <input value={f.link} onChange={e => set("link")(e.target.value)}
          placeholder="https://..."
          style={{
            width: "100%", padding: "10px 12px", fontSize: 13, fontFamily: FONT_BODY,
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
            color: C.text, marginTop: 4, boxSizing: "border-box", outline: "none",
          }}/>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
        <Btn variant="secondary" onClick={onCancel}>{t("cancel")}</Btn>
        <Btn variant="primary" onClick={handleSave}>{t("save")}</Btn>
      </div>
    </div>
  );
};
