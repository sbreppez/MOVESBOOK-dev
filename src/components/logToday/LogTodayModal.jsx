import React, { useState, useRef, useMemo } from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY } from '../../constants/fonts';
import { useT } from '../../hooks/useTranslation';
import { Ic } from '../shared/Ic';
import { todayLocal } from '../../utils/dateUtils';
import { LogTodayTraining } from './LogTodayTraining';
import { LogTodayRest } from './LogTodayRest';
import { LogTodayMovePicker } from './LogTodayMovePicker';
import { LogTodaySetPicker } from './LogTodaySetPicker';
import { ComingSoonState } from './ComingSoonState';

export function LogTodayModal({
  date,
  existingEvent,
  moves,
  sets,
  cats,
  catColors,
  addCalendarEvent,
  updateCalendarEvent,
  recordEventTraining,
  addToast,
  restLog,
  setRestLog,
  restTypes,
  setRestTypes,
  injuries,
  setInjuries,
  onClose,
}) {
  const t = useT();
  const formRef = useRef(null);
  const restRef = useRef(null);
  const effectiveDate = date || todayLocal();

  const [activeTab, setActiveTab] = useState("training");
  const [pendingMoveIds, setPendingMoveIds] = useState(existingEvent?.moveIds || []);
  const [pendingSetIds, setPendingSetIds] = useState(existingEvent?.setIds || []);
  const [movePickerOpen, setMovePickerOpen] = useState(false);
  const [setPickerOpen, setSetPickerOpen] = useState(false);

  const togglePendingMove = (moveId) => {
    setPendingMoveIds(prev =>
      prev.includes(moveId) ? prev.filter(x => x !== moveId) : [...prev, moveId]
    );
  };
  const togglePendingSet = (setId) => {
    setPendingSetIds(prev =>
      prev.includes(setId) ? prev.filter(x => x !== setId) : [...prev, setId]
    );
  };

  const isToday = effectiveDate === todayLocal();
  const dateDisplay = useMemo(() => {
    const d = new Date(effectiveDate + "T00:00:00");
    const day = d.getDate();
    const monthKeys = ["january","february","march","april","may","june",
                       "july","august","september","october","november","december"];
    return `${day} ${t(monthKeys[d.getMonth()])} ${d.getFullYear()}`;
  }, [effectiveDate, t]);
  const titleText = isToday
    ? t("logToday")
    : t("logDate").replace("{date}", dateDisplay);

  const tabs = [
    { id: "training", label: t("training") },
    { id: "battle", label: t("battle") },
    { id: "conditioning", label: t("conditioning") },
    { id: "rest", label: t("rest") },
  ];

  const isTraining = activeTab === "training";
  const isRest = activeTab === "rest";

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 500,
      background: C.bg, display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      {/* Sticky header */}
      <div style={{
        flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "13px 18px",
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 16,
            color: C.text, letterSpacing: 1, textTransform: "uppercase",
          }}>
            {titleText}
          </span>
          {isToday && (
            <span style={{
              fontSize: 10, fontWeight: 700, color: C.accent,
              background: C.accent + "18", borderRadius: 6, padding: "2px 6px",
              letterSpacing: 0.5, fontFamily: FONT_DISPLAY,
            }}>
              {t("today")}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          aria-label={t("close")}
          style={{
            background: "none", border: "none", cursor: "pointer", padding: 4,
            display: "flex", alignItems: "center",
          }}
        >
          <Ic n="x" s={20} c={C.textMuted} />
        </button>
      </div>

      {/* Sticky sub-tab nav */}
      <div style={{
        flexShrink: 0,
        display: "flex", gap: 18, padding: "8px 16px 0",
        background: C.bg,
      }}>
        {tabs.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: "0 0 6px 0",
              }}
            >
              <span style={{
                fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 800,
                letterSpacing: 1.5, textTransform: "uppercase",
                color: active ? C.text : C.textMuted,
                borderBottom: active
                  ? `2px solid ${C.accent}`
                  : "2px solid transparent",
                paddingBottom: 0,
                display: "inline-block",
              }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Scrollable body — Training and Rest forms stay mounted (toggled via
          display:none) so their local state persists across sub-tab switches.
          ComingSoon has no form state, stays conditional. */}
      <div style={{
        flex: 1, minHeight: 0,
        overflowY: "auto", WebkitOverflowScrolling: "touch",
        paddingBottom: 16,
      }}>
        <div style={{ display: isTraining ? "block" : "none" }}>
          <LogTodayTraining
            ref={formRef}
            date={effectiveDate}
            existingEvent={existingEvent}
            moves={moves}
            sets={sets}
            cats={cats}
            catColors={catColors}
            pendingMoveIds={pendingMoveIds}
            pendingSetIds={pendingSetIds}
            onTogglePendingMove={togglePendingMove}
            onTogglePendingSet={togglePendingSet}
            onOpenMovePicker={() => setMovePickerOpen(true)}
            onOpenSetPicker={() => setSetPickerOpen(true)}
            addCalendarEvent={addCalendarEvent}
            updateCalendarEvent={updateCalendarEvent}
            recordEventTraining={recordEventTraining}
            addToast={addToast}
            onClose={onClose}
          />
        </div>
        <div style={{ display: isRest ? "block" : "none" }}>
          <LogTodayRest
            ref={restRef}
            date={effectiveDate}
            restLog={restLog}
            setRestLog={setRestLog}
            restTypes={restTypes}
            setRestTypes={setRestTypes}
            injuries={injuries}
            setInjuries={setInjuries}
            addToast={addToast}
            onClose={onClose}
          />
        </div>
        {!isTraining && !isRest && <ComingSoonState />}
      </div>

      {/* Sticky footer */}
      <div style={{
        flexShrink: 0,
        display: "flex", gap: 10,
        padding: "12px 16px",
        borderTop: `1px solid ${C.borderLight}`,
        background: C.bg,
      }}>
        <button
          onClick={onClose}
          style={{
            flex: 1, background: "transparent", border: `1px solid ${C.border}`,
            color: C.textSec, borderRadius: 8, padding: "12px 16px",
            fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 12,
            letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer",
          }}
        >
          {t("cancel")}
        </button>
        <button
          onClick={() => {
            if (isTraining) formRef.current?.save();
            else if (isRest) restRef.current?.save();
          }}
          disabled={!isTraining && !isRest}
          style={{
            flex: 1, background: C.accent, color: "#fff", border: "none",
            borderRadius: 8, padding: "12px 16px",
            fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 12,
            letterSpacing: 1.5, textTransform: "uppercase",
            cursor: (isTraining || isRest) ? "pointer" : "not-allowed",
            opacity: (isTraining || isRest) ? 1 : 0.4,
          }}
        >
          {t("save")}
        </button>
      </div>

      {/* Picker overlays — z-index 600, cover entire modal chrome */}
      {movePickerOpen && (
        <LogTodayMovePicker
          moves={moves || []}
          cats={cats || []}
          catColors={catColors || {}}
          selectedMoveIds={pendingMoveIds}
          onToggleSelection={togglePendingMove}
          onClose={() => setMovePickerOpen(false)}
        />
      )}
      {setPickerOpen && (
        <LogTodaySetPicker
          sets={sets || []}
          selectedSetIds={pendingSetIds}
          onToggleSelection={togglePendingSet}
          onClose={() => setSetPickerOpen(false)}
        />
      )}
    </div>
  );
}

export default LogTodayModal;
