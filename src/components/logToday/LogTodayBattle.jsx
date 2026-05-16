import React, { useState, forwardRef, useImperativeHandle } from "react";
import { useT } from "../../hooks/useTranslation";
import { BattleFormBody, emptyBattle } from "../battle/BattleFormBody";

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
  onClose,
}, ref) {
  const t = useT();
  const [battle, setBattle] = useState(() =>
    existingEvent?.battle || emptyBattle(date)
  );

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
    </div>
  );
});

export default LogTodayBattle;
