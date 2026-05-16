import React, { useState, forwardRef, useImperativeHandle } from "react";
import { C } from "../../constants/colors";
import { FONT_BODY } from "../../constants/fonts";
import { useT } from "../../hooks/useTranslation";
import { Ic } from "../shared/Ic";
import { BattleFormBody, emptyBattle } from "../battle/BattleFormBody";
import { createHomeNoteFromLog } from "../../utils/logTodayHomeNote";

export const LogTodayBattle = forwardRef(function LogTodayBattle({
  date,
  existingEvent,
  moves,
  battleFormats,
  setBattleFormats,
  setBattles,
  addCalendarEvent,
  updateCalendarEvent,
  addToast,
  setIdeas,
  setHomeStack,
  onClose,
}, ref) {
  const t = useT();
  const [battle, setBattle] = useState(() =>
    existingEvent?.battle || emptyBattle(date)
  );
  const [addToHome, setAddToHome] = useState(false);

  const handleSave = () => {
    if (!battle.eventName.trim()) return;

    setBattles?.(prev => {
      const list = prev || [];
      const idx = list.findIndex(b => b.id === battle.id);
      if (idx >= 0) {
        const next = list.slice();
        next[idx] = battle;
        return next;
      }
      return [...list, battle];
    });

    const isUpdate = !!existingEvent?.id;
    const record = {
      ...(isUpdate
        ? { id: existingEvent.id, createdAt: existingEvent.createdAt }
        : {}),
      date: battle.date,
      type: "battle",
      source: "log_today",
      title: t("battleEvent"),
      notes: battle.eventName,
      battle,
    };

    if (isUpdate) {
      updateCalendarEvent?.(record);
    } else {
      addCalendarEvent?.(record, { silent: true });
    }

    if (addToHome) {
      const lines = [];
      if (battle.eventName?.trim()) lines.push(`${t("eventName")}\n${battle.eventName.trim()}`);
      if (battle.location?.trim()) lines.push(`${t("location")}\n${battle.location.trim()}`);
      if (battle.format) lines.push(`${t("battleFormat") || "Format"}\n${battle.format}`);
      if (battle.battleNotes?.trim()) lines.push(`${t("notes")}\n${battle.battleNotes.trim()}`);
      createHomeNoteFromLog({
        section: t("battle"), date: battle.date, summary: lines.join("\n\n"),
        setIdeas, setHomeStack,
      });
    }

    addToast?.({ icon: "swords", title: t(isUpdate ? "sessionUpdated" : "battleLogged") });
    onClose?.();
  };

  useImperativeHandle(ref, () => ({
    save: () => handleSave(),
  }));

  return (
    <div style={{ padding: "16px 16px 24px" }}>
      <BattleFormBody
        battle={battle}
        onChange={(patch) => setBattle((prev) => ({ ...prev, ...patch }))}
        moves={moves}
        battleFormats={battleFormats}
        setBattleFormats={setBattleFormats}
      />

      {/* Add to HOME checkbox */}
      <label style={{
        display: "flex", alignItems: "center", gap: 8,
        marginTop: 10, cursor: "pointer", userSelect: "none",
      }}>
        <span style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 18, height: 18, borderRadius: 4,
          border: `2px solid ${addToHome ? C.green : C.border}`,
          background: addToHome ? C.green : "transparent",
        }}>
          {addToHome && <Ic n="check" s={12} c="#fff" />}
        </span>
        <input
          type="checkbox"
          checked={addToHome}
          onChange={e => setAddToHome(e.target.checked)}
          style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
        />
        <span style={{ fontSize: 13, fontFamily: FONT_BODY, color: C.textSec }}>
          {t("logTodayAddToHome")}
        </span>
      </label>
    </div>
  );
});

export default LogTodayBattle;
