import React, { useState } from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { Modal } from '../shared/Modal';
import { Inp } from '../shared/Inp';
import { Btn } from '../shared/Btn';
import { Ic } from '../shared/Ic';
import { useT } from '../../hooks/useTranslation';

/**
 * Add/Edit attribute modal. Used from Settings and quick-add in MoveModal.
 *
 * Props:
 *   onClose        — close callback
 *   onSave(def)    — receives complete attribute definition
 *   attr           — existing attribute to edit (null = add mode)
 *   existingNames  — array of other attribute names (for duplicate check)
 */
export const AttributeModal = ({ onClose, onSave, attr, existingNames = [] }) => {
  const t = useT();
  const [name, setName] = useState(attr?.name || "");
  const [multi, setMulti] = useState(attr?.multi || false);
  const [values, setValues] = useState(attr?.values || []);
  const [newVal, setNewVal] = useState("");
  const [error, setError] = useState("");

  const addValue = () => {
    const v = newVal.trim();
    if (!v) return;
    if (values.length >= 20) { setError(t("maxValues")); return; }
    if (values.some(x => x.toLowerCase() === v.toLowerCase())) { setError(t("valueMustBeUnique")); return; }
    setValues(prev => [...prev, v]);
    setNewVal("");
    setError("");
  };

  const removeValue = (idx) => {
    setValues(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) { setError(t("nameRequired")); return; }
    if (existingNames.some(n => n.toLowerCase() === trimmed.toLowerCase())) { setError(t("nameMustBeUnique")); return; }
    if (values.length === 0) { setError(t("valueRequired")); return; }
    onSave({
      id: attr?.id || ("ca_" + Date.now()),
      name: trimmed,
      multi,
      values,
      order: attr?.order ?? Date.now(),
    });
  };

  const chipStyle = (active) => ({
    padding: "6px 14px",
    borderRadius: 20,
    border: `1.5px solid ${active ? C.accent : C.border}`,
    background: active ? C.accent : C.surface,
    color: active ? C.bg : C.textSec,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700,
    fontFamily: FONT_DISPLAY,
    letterSpacing: 0.3,
  });

  return (
    <Modal title={attr ? t("editAttribute") : t("addAttribute")} onClose={onClose}>
      <Inp label={t("attributeName")} value={name} onChange={setName} placeholder="e.g. Concept" />

      {/* Selection Type */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, color: C.textMuted,
          fontFamily: FONT_DISPLAY, marginBottom: 6 }}>{t("selectionType")}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setMulti(false)} style={chipStyle(!multi)}>{t("singleSelect")}</button>
          <button onClick={() => setMulti(true)} style={chipStyle(multi)}>{t("multiSelect")}</button>
        </div>
      </div>

      {/* Values list */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, color: C.textMuted,
          fontFamily: FONT_DISPLAY, marginBottom: 6 }}>{t("attributeValues")}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
          {values.map((v, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6,
              background: C.surfaceAlt, borderRadius: 8, padding: "6px 10px",
              border: `1px solid ${C.borderLight}` }}>
              <span style={{ flex: 1, fontSize: 13, color: C.text, fontFamily: FONT_BODY }}>{v}</span>
              <button onClick={() => removeValue(i)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 2,
                  color: C.textMuted, display: "flex" }}>
                <Ic n="x" s={13} c={C.textMuted} />
              </button>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <input
            value={newVal}
            onChange={e => setNewVal(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addValue(); } }}
            placeholder={t("addValue") + "..."}
            style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 7, padding: "7px 10px", color: C.text, fontSize: 13,
              fontFamily: FONT_BODY, outline: "none" }}
          />
          <button onClick={addValue}
            style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`,
              borderRadius: 7, padding: "7px 12px", cursor: "pointer",
              color: C.text, fontSize: 13, fontWeight: 700, fontFamily: FONT_DISPLAY }}>
            +
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ fontSize: 12, color: C.accent, marginBottom: 12 }}>{error}</div>
      )}

      {/* Buttons */}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <Btn variant="secondary" onClick={onClose}>{t("cancel")}</Btn>
        <Btn onClick={handleSave}>{t("confirm")}</Btn>
      </div>
    </Modal>
  );
};
