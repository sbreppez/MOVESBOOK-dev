import React, { useState, useEffect, useRef } from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { Ic } from '../shared/Ic';
import { useT } from '../../hooks/useTranslation';

export const ReminderBlock = ({ reminders, onRemindersChange, addToast, onOpenManage }) => {
  const t = useT();
  const items = reminders?.items || [];
  const [expanded, setExpanded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addText, setAddText] = useState("");
  const [editingInline, setEditingInline] = useState(false);
  const [editText, setEditText] = useState("");
  const touchRef = useRef({ startX: 0, startY: 0 });
  const rotateRef = useRef(null);

  // Clamp index if items change
  useEffect(() => {
    if (currentIndex >= items.length) setCurrentIndex(Math.max(0, items.length - 1));
  }, [items.length, currentIndex]);

  // Auto-rotate every 30s when expanded, multiple items, and not editing
  useEffect(() => {
    if (!expanded || items.length <= 1 || editingInline) { clearInterval(rotateRef.current); return; }
    rotateRef.current = setInterval(() => {
      setCurrentIndex(i => (i + 1) % items.length);
    }, 30000);
    return () => clearInterval(rotateRef.current);
  }, [expanded, items.length, editingInline]);

  const resetRotation = () => {
    clearInterval(rotateRef.current);
    if (expanded && items.length > 1 && !editingInline) {
      rotateRef.current = setInterval(() => {
        setCurrentIndex(i => (i + 1) % items.length);
      }, 30000);
    }
  };

  const handleTouchStart = (e) => {
    touchRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY };
  };
  const handleTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touchRef.current.startX;
    const dy = e.changedTouches[0].clientY - touchRef.current.startY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx < 0) setCurrentIndex(i => (i + 1) % items.length);
      else setCurrentIndex(i => (i - 1 + items.length) % items.length);
      resetRotation();
    }
  };

  const handleSave = () => {
    const text = addText.trim();
    if (!text) return;
    const newItem = { id: Date.now().toString(), text, createdAt: new Date().toISOString().split("T")[0] };
    onRemindersChange({ ...reminders, items: [...items, newItem] });
    addToast({ icon: "mapPin", title: t("noteSaved") });
    setAddText("");
    setShowAddForm(false);
  };

  const handleEditSave = () => {
    const text = editText.trim();
    if (!text) return;
    const updated = items.map((item, i) =>
      i === currentIndex ? { ...item, text } : item
    );
    onRemindersChange({ ...reminders, items: updated });
    addToast({ icon: "mapPin", title: t("noteSaved") });
    setEditingInline(false);
    setEditText("");
  };

  if (items.length === 0) return null;

  // ── Collapsed ──
  if (!expanded) {
    // Inline edit mode while collapsed
    if (editingInline) {
      return (
        <div style={{ background: C.surfaceAlt, borderRadius: 8, padding: "8px 14px",
          margin: "10px 12px 0" }}>
          <textarea value={editText} onChange={e => setEditText(e.target.value.slice(0, 280))}
            rows={2} autoFocus
            style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 8, padding: 12, fontSize: 14, fontFamily: FONT_BODY,
              color: C.text, resize: "none", outline: "none", boxSizing: "border-box",
              maxHeight: 120, overflow: "auto" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
            <span style={{ fontSize: 10, color: C.textMuted }}>{editText.length}/280</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setEditingInline(false); setEditText(""); }}
                style={{ background: "none", border: "none", color: C.textMuted, fontSize: 12,
                  fontFamily: FONT_DISPLAY, fontWeight: 700, cursor: "pointer", padding: "6px 10px" }}>
                {t("cancel") || "CANCEL"}
              </button>
              <button onClick={handleEditSave} disabled={!editText.trim()}
                style={{ background: editText.trim() ? C.accent : C.border, color: "#fff",
                  border: "none", fontSize: 12, fontFamily: FONT_DISPLAY, fontWeight: 700,
                  borderRadius: 8, padding: "8px 16px", cursor: editText.trim() ? "pointer" : "default",
                  opacity: editText.trim() ? 1 : 0.5 }}>
                {t("save") || "SAVE"}
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Normal collapsed bar
    const current = items[currentIndex] || items[0];
    return (
      <div onClick={() => setExpanded(true)}
        style={{ display: "flex", alignItems: "center", gap: 8,
          background: C.surfaceAlt, borderRadius: 8, padding: "8px 14px",
          margin: "10px 12px 0", cursor: "pointer" }}>
        <span style={{ lineHeight: 1, flexShrink: 0 }}><Ic n="mapPin" s={14} c={C.textMuted}/></span>
        <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.text, fontStyle: "italic",
          flex: 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
          {current?.text}
        </span>
        <span onClick={(e) => {
            e.stopPropagation();
            setEditText(current?.text || "");
            setEditingInline(true);
          }}
          style={{ display: "flex", alignItems: "center", justifyContent: "center",
            width: 36, height: 36, flexShrink: 0, cursor: "pointer" }}>
          <Ic n="edit" s={14} c={C.textMuted} />
        </span>
        <span style={{ color: C.textMuted, fontSize: 14, lineHeight: 1, flexShrink: 0 }}>›</span>
      </div>
    );
  }

  // ── Expanded ──
  const current = items[currentIndex] || items[0];
  return (
    <div style={{ background: C.surfaceAlt, borderRadius: 8, padding: 14,
      margin: "10px 12px 0" }}>
      {/* Header: pin left, edit + collapse right */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
        <span style={{ lineHeight: 1, flex: 1 }}><Ic n="mapPin" s={14} c={C.textMuted}/></span>
        <span onClick={(e) => {
            e.stopPropagation();
            setEditText(current?.text || "");
            setEditingInline(true);
          }}
          style={{ display: "flex", alignItems: "center", justifyContent: "center",
            width: 36, height: 36, cursor: "pointer" }}>
          <Ic n="edit" s={14} c={C.textMuted} />
        </span>
        <span onClick={() => { setExpanded(false); setShowAddForm(false); setEditingInline(false); setEditText(""); }}
          style={{ color: C.textMuted, fontSize: 14, cursor: "pointer", padding: "2px 4px" }}>‹</span>
      </div>

      {/* Reminder text or inline edit */}
      {editingInline ? (
        <div style={{ padding: "6px 0" }}>
          <textarea value={editText} onChange={e => setEditText(e.target.value.slice(0, 280))}
            rows={3} autoFocus
            style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 8, padding: 12, fontSize: 14, fontFamily: FONT_BODY,
              color: C.text, resize: "none", outline: "none", boxSizing: "border-box",
              maxHeight: 120, overflow: "auto" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
            <span style={{ fontSize: 10, color: C.textMuted }}>{editText.length}/280</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setEditingInline(false); setEditText(""); }}
                style={{ background: "none", border: "none", color: C.textMuted, fontSize: 12,
                  fontFamily: FONT_DISPLAY, fontWeight: 700, cursor: "pointer", padding: "6px 10px" }}>
                {t("cancel") || "CANCEL"}
              </button>
              <button onClick={handleEditSave} disabled={!editText.trim()}
                style={{ background: editText.trim() ? C.accent : C.border, color: "#fff",
                  border: "none", fontSize: 12, fontFamily: FONT_DISPLAY, fontWeight: 700,
                  borderRadius: 8, padding: "8px 16px", cursor: editText.trim() ? "pointer" : "default",
                  opacity: editText.trim() ? 1 : 0.5 }}>
                {t("save") || "SAVE"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}
          style={{ padding: "10px 8px", minHeight: 40 }}>
          <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.text, fontStyle: "italic",
            lineHeight: 1.6, textAlign: "center", wordBreak: "break-word" }}>
            {current?.text}
          </div>
        </div>
      )}

      {/* Dots and buttons hidden during edit */}
      {!editingInline && (
        <>
          {/* Dot indicators */}
          {items.length > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 10 }}>
              {items.map((_, i) => (
                <div key={i} onClick={() => { setCurrentIndex(i); resetRotation(); }}
                  style={{ width: 6, height: 6, borderRadius: "50%", cursor: "pointer",
                    background: i === currentIndex ? C.accent : C.border }} />
              ))}
            </div>
          )}

          {/* Add form or buttons */}
          {showAddForm ? (
            <div style={{ marginTop: 6 }}>
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
                    style={{ background: "none", border: "none", color: C.textMuted, fontSize: 12,
                      fontFamily: FONT_DISPLAY, fontWeight: 700, cursor: "pointer", padding: "6px 10px" }}>
                    {t("cancel") || "CANCEL"}
                  </button>
                  <button onClick={handleSave} disabled={!addText.trim()}
                    style={{ background: addText.trim() ? C.accent : C.border, color: "#fff",
                      border: "none", fontSize: 12, fontFamily: FONT_DISPLAY, fontWeight: 700,
                      borderRadius: 8, padding: "8px 16px", cursor: addText.trim() ? "pointer" : "default",
                      opacity: addText.trim() ? 1 : 0.5 }}>
                    {t("save") || "SAVE"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 4 }}>
              <button onClick={() => setShowAddForm(true)}
                style={{ background: C.surfaceHigh, color: C.textSec, border: "none",
                  fontSize: 11, fontFamily: FONT_DISPLAY, fontWeight: 700, borderRadius: 8,
                  padding: "6px 14px", cursor: "pointer", letterSpacing: 0.5 }}>
                + {t("addNote")}
              </button>
              <button onClick={onOpenManage}
                style={{ background: C.surfaceHigh, color: C.textSec, border: "none",
                  fontSize: 11, fontFamily: FONT_DISPLAY, fontWeight: 700, borderRadius: 8,
                  padding: "6px 14px", cursor: "pointer", letterSpacing: 0.5 }}>
                {t("manageNotes")}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
