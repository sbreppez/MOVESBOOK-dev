import React, { useState } from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { Ic } from '../shared/Ic';
import { useT } from '../../hooks/useTranslation';
import { todayLocal } from '../../utils/dateUtils';

export const ManageReminders = ({ reminders, onRemindersChange, addToast, settings, onClose }) => {
  const t = useT();
  const items = reminders?.items || [];
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addText, setAddText] = useState("");

  const confirmDelete = settings?.confirmDelete !== false;

  const handleDelete = (id) => {
    onRemindersChange({ ...reminders, items: items.filter(i => i.id !== id) });
    addToast({ icon: "trash", title: t("noteDeleted") });
    setDeletingId(null);
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditText(item.text);
  };

  const handleEditSave = (id) => {
    const text = editText.trim();
    if (!text) return;
    onRemindersChange({
      ...reminders,
      items: items.map(i => i.id === id ? { ...i, text } : i)
    });
    addToast({ icon: "mapPin", title: t("noteSaved") });
    setEditingId(null);
    setEditText("");
  };

  const handleAddSave = () => {
    const text = addText.trim();
    if (!text) return;
    const newItem = { id: Date.now().toString(), text, createdAt: todayLocal() };
    onRemindersChange({ ...reminders, items: [...items, newItem] });
    addToast({ icon: "mapPin", title: t("noteSaved") });
    setAddText("");
    setShowAddForm(false);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr + "T00:00:00");
      const day = d.getDate();
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      return `${t("added")} ${day} ${months[d.getMonth()]}`;
    } catch { return dateStr; }
  };

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 500, background: C.bg,
      display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 16px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Ic n="mapPin" s={16} c={C.textMuted}/>
          <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 14,
            letterSpacing: 1.5, color: C.text }}>{t("myNotes")}</span>
        </div>
        <button onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}>
          <Ic n="x" s={18} c={C.text} />
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto", padding: "12px 0" }}>
        {items.length === 0 && !showAddForm ? (
          /* Empty state */
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", padding: "60px 24px", gap: 8 }}>
            <span style={{ fontSize: 16, color: C.textMuted, fontFamily: FONT_DISPLAY,
              fontWeight: 700 }}>{t("noNotesYet")}</span>
            <span style={{ fontSize: 13, color: C.textMuted, textAlign: "center",
              lineHeight: 1.5 }}>{t("noNotesDesc")}</span>
            <button onClick={() => setShowAddForm(true)}
              style={{ marginTop: 16, background: C.accent, color: "#fff", border: "none",
                fontSize: 11, fontFamily: FONT_DISPLAY, fontWeight: 700, borderRadius: 8,
                padding: "10px 20px", cursor: "pointer", letterSpacing: 0.5 }}>
              + {t("addNote")}
            </button>
          </div>
        ) : (
          <>
            {items.map(item => (
              <div key={item.id} style={{ background: C.surface, borderRadius: 8,
                padding: 12, margin: "0 12px 8px" }}>

                {deletingId === item.id ? (
                  /* Delete confirmation */
                  <div style={{ textAlign: "center", padding: "8px 0" }}>
                    <div style={{ fontSize: 13, color: C.text, marginBottom: 12, fontFamily: FONT_BODY }}>
                      {t("deleteThisNote")}
                    </div>
                    <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
                      <button onClick={() => setDeletingId(null)}
                        style={{ background: "none", border: "none", color: C.textMuted, fontSize: 11,
                          fontFamily: FONT_DISPLAY, fontWeight: 700, cursor: "pointer", padding: "6px 12px" }}>
                        {t("cancel") || "CANCEL"}
                      </button>
                      <button onClick={() => handleDelete(item.id)}
                        style={{ background: `${C.accent}2e`, color: C.accent, border: "none",
                          fontSize: 11, fontFamily: FONT_DISPLAY, fontWeight: 700, borderRadius: 8,
                          padding: "6px 14px", cursor: "pointer" }}>
                        {t("delete") || "DELETE"}
                      </button>
                    </div>
                  </div>
                ) : editingId === item.id ? (
                  /* Edit mode */
                  <div>
                    <textarea value={editText} onChange={e => setEditText(e.target.value.slice(0, 280))}
                      rows={2}
                      style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`,
                        borderRadius: 8, padding: 12, fontSize: 14, fontFamily: FONT_BODY,
                        color: C.text, resize: "none", outline: "none", boxSizing: "border-box",
                        maxHeight: 120, overflow: "auto" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                      <span style={{ fontSize: 10, color: C.textMuted }}>{editText.length}/280</span>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => { setEditingId(null); setEditText(""); }}
                          style={{ background: "none", border: "none", color: C.textMuted, fontSize: 11,
                            fontFamily: FONT_DISPLAY, fontWeight: 700, cursor: "pointer", padding: "6px 10px" }}>
                          {t("cancel") || "CANCEL"}
                        </button>
                        <button onClick={() => handleEditSave(item.id)} disabled={!editText.trim()}
                          style={{ background: editText.trim() ? C.accent : C.border, color: "#fff",
                            border: "none", fontSize: 11, fontFamily: FONT_DISPLAY, fontWeight: 700,
                            borderRadius: 8, padding: "6px 14px", cursor: editText.trim() ? "pointer" : "default",
                            opacity: editText.trim() ? 1 : 0.5 }}>
                          {t("save") || "SAVE"}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Normal display */
                  <>
                    <div onClick={() => handleEdit(item)}
                      style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.text, fontStyle: "italic",
                        lineHeight: 1.5, cursor: "pointer", wordBreak: "break-word" }}>
                      {item.text}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                      <span style={{ fontSize: 10, color: C.textMuted }}>{formatDate(item.createdAt)}</span>
                      <button onClick={() => confirmDelete ? setDeletingId(item.id) : handleDelete(item.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}>
                        <Ic n="trash" s={14} c={C.textMuted} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}

            {/* Add form or Add button */}
            {showAddForm ? (
              <div style={{ margin: "4px 12px 8px" }}>
                <textarea value={addText} onChange={e => setAddText(e.target.value.slice(0, 280))}
                  placeholder={t("writeYourselfANote")}
                  rows={2}
                  style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`,
                    borderRadius: 8, padding: 12, fontSize: 14, fontFamily: FONT_BODY,
                    color: C.text, resize: "none", outline: "none", boxSizing: "border-box",
                    maxHeight: 120, overflow: "auto" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                  <span style={{ fontSize: 10, color: C.textMuted }}>{addText.length}/280</span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => { setShowAddForm(false); setAddText(""); }}
                      style={{ background: "none", border: "none", color: C.textMuted, fontSize: 11,
                        fontFamily: FONT_DISPLAY, fontWeight: 700, cursor: "pointer", padding: "6px 10px" }}>
                      {t("cancel") || "CANCEL"}
                    </button>
                    <button onClick={handleAddSave} disabled={!addText.trim()}
                      style={{ background: addText.trim() ? C.accent : C.border, color: "#fff",
                        border: "none", fontSize: 11, fontFamily: FONT_DISPLAY, fontWeight: 700,
                        borderRadius: 8, padding: "6px 14px", cursor: addText.trim() ? "pointer" : "default",
                        opacity: addText.trim() ? 1 : 0.5 }}>
                      {t("save") || "SAVE"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowAddForm(true)}
                style={{ display: "block", width: "calc(100% - 24px)", margin: "4px 12px",
                  background: C.surfaceAlt, border: `1.5px dashed ${C.border}`, borderRadius: 10,
                  padding: 12, fontSize: 11, fontFamily: FONT_DISPLAY, fontWeight: 700,
                  color: C.textSec, cursor: "pointer", letterSpacing: 0.5, textAlign: "center" }}>
                + {t("addNote")}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
