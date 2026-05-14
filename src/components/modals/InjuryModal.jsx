import React, { useState } from 'react';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { lbl } from '../../constants/styles';
import { Modal } from '../shared/Modal';
import { Btn } from '../shared/Btn';
import { Txtarea } from '../shared/Txtarea';
import { useT } from '../../hooks/useTranslation';
import { useSettings } from '../../hooks/useSettings';

const CHIP_ORDER = [
  { part: "head",       side: null    },
  { part: "neck",       side: null    },
  { part: "shoulder",   side: "left"  },
  { part: "shoulder",   side: "right" },
  { part: "elbow",      side: "left"  },
  { part: "elbow",      side: "right" },
  { part: "wrist",      side: "left"  },
  { part: "wrist",      side: "right" },
  { part: "upperBack",  side: null    },
  { part: "lowerBack",  side: null    },
  { part: "hip",        side: "left"  },
  { part: "hip",        side: "right" },
  { part: "knee",       side: "left"  },
  { part: "knee",       side: "right" },
  { part: "ankle",      side: "left"  },
  { part: "ankle",      side: "right" },
];

const todayYMD = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

const partLabelKey = (p) => p ? "bodyPart" + p.charAt(0).toUpperCase() + p.slice(1) : "";

export const InjuryModal = ({ injury, onClose, onSave, onDelete }) => {
  const { C } = useSettings();
  const t = useT();
  const isEdit = !!injury;
  const [bodyPart,    setBodyPart]    = useState(injury?.bodyPart    || "");
  const [side,        setSide]        = useState(injury?.side        || null);
  const [severity,    setSeverity]    = useState(injury?.severity    || 0);
  const [startDate,   setStartDate]   = useState(injury?.startDate || todayYMD());
  const [description, setDescription] = useState(injury?.description || "");
  const [resolved,        setResolved]        = useState(injury?.resolved || false);
  const [resolutionNote,  setResolutionNote]  = useState(injury?.resolutionNote || "");

  const sevColors = { 1: C.green, 2: C.yellow, 3: C.accent };
  const canSave = bodyPart && severity > 0 && startDate;

  const chipStyle = (active) => ({
    borderRadius: 20, padding: "5px 13px",
    border: `1.5px solid ${active ? C.accent : C.border}`,
    background: active ? C.accent + "18" : "transparent",
    color: active ? C.accent : C.text,
    fontSize: 11, fontWeight: 700, fontFamily: FONT_DISPLAY,
    letterSpacing: 0.5, textTransform: "uppercase",
    cursor: "pointer", transition: "all 0.15s",
    width: "100%",
  });

  const chipLabel = (chip) => {
    const part = t(partLabelKey(chip.part));
    if (!chip.side) return part;
    return `${t(chip.side === "left" ? "leftSide" : "rightSide")} ${part}`;
  };

  const isChipActive = (chip) => bodyPart === chip.part && (side || null) === (chip.side || null);

  const handleChipClick = (chip) => {
    setBodyPart(chip.part);
    setSide(chip.side);
  };

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      id: injury?.id || Date.now().toString(),
      bodyPart,
      side: side || null,
      severity,
      startDate,
      description: description.trim(),
      resolved,
      resolvedDate: resolved
        ? (injury?.resolved ? injury.resolvedDate : todayYMD())
        : null,
      resolutionNote: resolved ? (resolutionNote.trim() || null) : null,
    });
    onClose();
  };

  const handleDelete = () => {
    if (onDelete && injury) onDelete(injury.id);
    onClose();
  };

  return (
    <Modal title={isEdit ? t("editInjury") : t("newInjury")} onClose={onClose}>
      {/* Body part chip grid */}
      <div style={{ marginBottom: 14 }}>
        <label style={lbl()}>{t("bodyPart")} *</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 6 }}>
          {CHIP_ORDER.map((chip, i) => (
            <button key={i} onClick={() => handleChipClick(chip)} style={chipStyle(isChipActive(chip))}>
              {chipLabel(chip)}
            </button>
          ))}
        </div>
      </div>

      {/* Severity */}
      <div style={{ marginBottom: 14 }}>
        <label style={lbl()}>{t("severity")} *</label>
        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
          {[1, 2, 3].map(s => {
            const active = severity === s;
            const color = sevColors[s];
            return (
              <button key={s} onClick={() => setSeverity(s)}
                style={{
                  flex: 1, padding: "9px 8px", borderRadius: 8, cursor: "pointer",
                  fontSize: 11, fontWeight: 800, fontFamily: FONT_DISPLAY,
                  letterSpacing: 0.5, textTransform: "uppercase",
                  border: `1.5px solid ${active ? color : C.border}`,
                  background: active ? color : C.surface,
                  color: active ? "#fff" : C.textMuted,
                  transition: "all 0.15s",
                }}>
                {t(s === 1 ? "severityMild" : s === 2 ? "severityModerate" : "severitySevere")}
              </button>
            );
          })}
        </div>
      </div>

      {/* Start date */}
      <div style={{ marginBottom: 14 }}>
        <label style={lbl()}>{t("startDate")} *</label>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
          style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
            padding: "9px 12px", color: C.text, fontSize: 14, outline: "none", fontFamily: FONT_BODY,
            boxSizing: "border-box" }} />
      </div>

      {/* Description */}
      <Txtarea
        label={t("injuryDescription")}
        value={description}
        onChange={setDescription}
        rows={3}
        placeholder={t("injuryDescPlaceholder")}
        autoExpand
      />

      {/* Resolve UI — edit mode only */}
      {isEdit && (
        <div style={{ marginBottom: 14 }}>
          {!resolved ? (
            <Btn variant="secondary" onClick={() => setResolved(true)}>{t("markAsResolved")}</Btn>
          ) : (
            <>
              <div style={{ fontSize: 11, color: C.textMuted, fontFamily: FONT_BODY, marginBottom: 8 }}>
                {t("resolvedOn")} {injury?.resolved && injury?.resolvedDate ? injury.resolvedDate : todayYMD()}
              </div>
              <Txtarea
                label={t("injuryResolutionPrompt")}
                value={resolutionNote}
                onChange={setResolutionNote}
                rows={2}
                autoExpand
              />
              <Btn variant="secondary" onClick={() => setResolved(false)}>{t("reopen")}</Btn>
            </>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, justifyContent: isEdit ? "space-between" : "flex-end", alignItems: "center" }}>
        {isEdit && <Btn variant="danger" onClick={handleDelete}>{t("delete")}</Btn>}
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="secondary" onClick={onClose}>{t("cancel")}</Btn>
          <Btn onClick={handleSave} disabled={!canSave}>{t("save")}</Btn>
        </div>
      </div>
    </Modal>
  );
};
