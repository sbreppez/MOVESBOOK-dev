import React, { useState, forwardRef, useImperativeHandle } from "react";
import { useT } from "../../hooks/useTranslation";
import { BattleFormBody, emptyBattle } from "../battle/BattleFormBody";

export const LogTodayBattle = forwardRef(function LogTodayBattle({
  date,
  moves,
  battleFormats,
  setBattleFormats,
  setBattles,
  addCalendarEvent,
  addToast,
  onClose,
}, ref) {
  const t = useT();
  const [battle, setBattle] = useState(() => emptyBattle(date));

  const handleSave = () => {
    if (!battle.eventName.trim()) return;
    if (setBattles) setBattles(prev => [...prev, battle]);
    if (addCalendarEvent) {
      addCalendarEvent({
        date: battle.date,
        type: "battle",
        title: t("battleEvent"),
        notes: battle.eventName ? battle.eventName : "",
        source: "logToday",
      }, { silent: true });
    }
    if (addToast) addToast({ icon: "swords", title: t("battleLogged") });
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
