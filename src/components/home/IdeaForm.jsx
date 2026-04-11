import React, { useState } from 'react';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { useSettings } from '../../hooks/useSettings';
import { useT } from '../../hooks/useTranslation';
import { Btn } from '../shared/Btn';
import { Ic } from '../shared/Ic';

export const IdeaForm = ({ idea, onSave, onCancel }) => {
  const { C } = useSettings();
  const t = useT();

  const [f, setF] = useState({
    title: idea?.title || "",
    text: idea?.text || "",
    link: idea?.link || "",
    showDate: idea?.showDate || "",
    pinned: idea?.pinned || false,
    homeOnly: idea?.homeOnly !== false,
  });

  const set = (k) => (v) => setF(p => ({ ...p, [k]: v }));

  const handleSave = () => {
    onSave({
      title: f.title.trim(),
      text: f.text.trim(),
      link: f.link.trim(),
      showDate: f.showDate || null,
      pinned: f.pinned,
      homeOnly: f.homeOnly,
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Title */}
      <input value={f.title} onChange={e => set("title")(e.target.value)}
        placeholder={t("ideaTitle")}
        style={{
          width: "100%", padding: "10px 12px", fontSize: 14, fontFamily: FONT_BODY,
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
          color: C.text, boxSizing: "border-box", outline: "none",
        }}/>

      {/* Text */}
      <textarea value={f.text} onChange={e => set("text")(e.target.value)}
        rows={3}
        style={{
          width: "100%", padding: "10px 12px", fontSize: 13, fontFamily: FONT_BODY,
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
          color: C.text, resize: "vertical", marginTop: 4, boxSizing: "border-box", outline: "none",
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
      </div>

      {/* Pin the idea to Home */}
      <button onClick={() => set("pinned")(!f.pinned)}
        style={{
          display: "flex", alignItems: "center", gap: 10, width: "100%",
          padding: "10px 12px", borderRadius: 8, cursor: "pointer",
          background: "transparent", border: "none", textAlign: "left",
        }}>
        <div style={{
          width: 20, height: 20, borderRadius: 5, flexShrink: 0,
          border: `2px solid ${f.pinned ? C.green : C.border}`,
          background: f.pinned ? C.green : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {f.pinned && <Ic n="check" s={12} c="#fff"/>}
        </div>
        <span style={{ fontSize: 13, fontFamily: FONT_BODY, color: C.text }}>
          {t("pinIdeaToHome")}
        </span>
      </button>

      {/* Show on Home */}
      <button onClick={() => set("homeOnly")(!f.homeOnly)}
        style={{
          display: "flex", alignItems: "center", gap: 10, width: "100%",
          padding: "10px 12px", borderRadius: 8, cursor: "pointer",
          background: "transparent", border: "none", textAlign: "left",
        }}>
        <div style={{
          width: 20, height: 20, borderRadius: 5, flexShrink: 0,
          border: `2px solid ${f.homeOnly ? C.green : C.border}`,
          background: f.homeOnly ? C.green : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {f.homeOnly && <Ic n="check" s={12} c="#fff"/>}
        </div>
        <span style={{ fontSize: 13, fontFamily: FONT_BODY, color: C.text }}>
          {t("showOnHome")}
        </span>
      </button>

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
