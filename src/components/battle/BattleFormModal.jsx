import React, { useEffect, useState } from "react";
import { C } from "../../constants/colors";
import { FONT_DISPLAY, FONT_BODY } from "../../constants/fonts";
import { todayLocal } from "../../utils/dateUtils";
import { useT } from "../../hooks/useTranslation";
import { Modal } from "../shared/Modal";
import { BattleFormBody, emptyBattle } from "./BattleFormBody";

export const BattleFormModal = ({ open, onClose, onSave, initialValue, moves = [], battleFormats = [], setBattleFormats }) => {
  const t = useT();
  const [battle, setBattle] = useState(() => initialValue || emptyBattle(todayLocal()));

  // Reset when re-opened with a new initialValue
  useEffect(() => {
    if (!open) return;
    setBattle(initialValue || emptyBattle(todayLocal()));
  }, [open, initialValue]);

  if (!open) return null;

  const canSave = battle.eventName.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave(battle);
    onClose();
  };

  const footer = (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <button
        type="button"
        onClick={handleSave}
        disabled={!canSave}
        style={{
          background: canSave ? C.accent : C.surfaceAlt,
          color: canSave ? C.onAccent : C.textMuted,
          border: "none",
          borderRadius: 8,
          fontFamily: FONT_DISPLAY, fontWeight: 800, letterSpacing: 1,
          textTransform: "uppercase",
          padding: "13px 16px",
          fontSize: 14,
          width: "100%",
          cursor: canSave ? "pointer" : "not-allowed",
        }}
      >
        {t("save")}
      </button>
      <button
        type="button"
        onClick={onClose}
        style={{
          background: "none", border: "none",
          color: C.textMuted, fontFamily: FONT_BODY, fontSize: 14,
          cursor: "pointer", padding: "8px 16px", width: "100%",
        }}
      >
        {t("cancel")}
      </button>
    </div>
  );

  return (
    <Modal title={t("battle")} onClose={onClose} footer={footer}>
      <BattleFormBody
        key={battle.id}
        battle={battle}
        onChange={(patch) => setBattle((prev) => ({ ...prev, ...patch }))}
        moves={moves}
        battleFormats={battleFormats}
        setBattleFormats={setBattleFormats}
      />
    </Modal>
  );
};
