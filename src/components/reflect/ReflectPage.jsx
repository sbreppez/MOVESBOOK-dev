import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { Ic } from '../shared/Ic';
import { Modal } from '../shared/Modal';
import { Btn } from '../shared/Btn';
import { useT } from '../../hooks/useTranslation';
import { useSettings } from '../../hooks/useSettings';
import { CalendarOverlay } from '../calendar/CalendarOverlay';
import { ReportsTimeline } from '../calendar/ReportsTimeline';
import { MyStanceSection } from '../stance/MyStanceSection';
import { DevelopmentStory } from '../stance/DevelopmentStory';
import { PremiumGate } from '../shared/PremiumGate';
import { SectionBrief } from '../shared/SectionBrief';
import { AddToHomeSheet } from '../shared/AddToHomeSheet';

const SUB_TABS = ["calendar", "stance", "reports", "history"];

const daysBetween = (d1, d2) => {
  if (!d1 || !d2) return null;
  return Math.max(1, Math.floor((new Date(d2 + "T12:00:00") - new Date(d1 + "T12:00:00")) / 86400000));
};

export const ReflectPage = ({
  ideas, setIdeas, moves, setMoves, reps, sparring, musicflow, habits, setHabits,
  homeStack: _homeStack, setHomeStack, homeIdeas: _homeIdeas, setHomeIdeas: _setHomeIdeas,
  calendar, setCalendar, cats, catColors, settings, onSettingsChange,
  addToast, stance, battleprep, onToggleBattlePrepTask,
  onOpenStanceAssessment, addCalendarEvent, removeCalendarEvent: _removeCalendarEvent,
  onSubTabChange, onGoToPrep, initialMonth, sets, onAddTrigger, parentSubTab, reports, injuries,
  isPremium
}) => {
  const t = useT();
  const { C } = useSettings();
  const [reflectTab, setReflectTab] = useState(parentSubTab || "calendar");
  const [showStanceConfirm, setShowStanceConfirm] = useState(false);
  const [calendarAddTick, setCalendarAddTick] = useState(0);
  const [addToHomeContext, setAddToHomeContext] = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- reflectTab-only by intent
  useEffect(() => { if (onSubTabChange) onSubTabChange(reflectTab); }, [reflectTab]);

  // Sync external sub-tab navigation (e.g. from Profile "View Stance" link)
  useEffect(() => {
    if (parentSubTab && SUB_TABS.includes(parentSubTab) && parentSubTab !== reflectTab) {
      setReflectTab(parentSubTab);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- parentSubTab-only by intent
  }, [parentSubTab]);

  // Add trigger — calendar/stance only; reports/history are no-ops
  const prevAddTrigger = useRef(onAddTrigger);
  useEffect(() => {
    if (onAddTrigger !== prevAddTrigger.current && onAddTrigger > 0) {
      if (reflectTab === "stance") setShowStanceConfirm(true);
      else if (reflectTab === "calendar") setCalendarAddTick(t => t + 1);
    }
    prevAddTrigger.current = onAddTrigger;
  // eslint-disable-next-line react-hooks/exhaustive-deps -- ref-compare guard prevents re-fire; reflectTab read fresh
  }, [onAddTrigger]);

  const subTabs = [
    ["calendar", t("calendar")],
    ["stance", t("stance")],
    ["reports", t("reports")],
    ["history", t("history")],
  ];

  const sevColors = { 1: C.green, 2: C.yellow, 3: C.accent };
  const sevLabels = { 1: "severityMild", 2: "severityModerate", 3: "severitySevere" };

  // ── Build combined HISTORY entries ─────────────────────────────────────────
  const historyEntries = useMemo(() => {
    const entries = [];

    (injuries || []).filter(i => i.resolved).forEach(inj => {
      const date = inj.resolvedDate || inj.date || inj.startDate || "";
      entries.push({ id: `injury_${inj.id}`, kind: "injury", date, data: inj });
    });

    (ideas || []).filter(i => i.archived === true).forEach(idea => {
      entries.push({
        id: `idea_${idea.id}`,
        kind: idea.type === "goal" || idea.type === "target" ? "goal" : "note",
        date: idea.archivedDate || idea.createdDate || "",
        data: idea,
      });
    });

    return entries.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [injuries, ideas]);

  const ghostBtn = {
    background: "transparent", border: `1px solid ${C.accent}`,
    color: C.accent, borderRadius: 8, padding: "6px 12px",
    fontSize: 11, fontWeight: 800, fontFamily: FONT_DISPLAY,
    letterSpacing: 1, textTransform: "uppercase",
    display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
  };

  const renderHistoryEntry = (entry) => {
    if (entry.kind === "injury") {
      const inj = entry.data;
      const dateStart = inj.date || inj.startDate;
      const dur = daysBetween(dateStart, inj.resolvedDate);
      const sideTxt = inj.side ? `${t(inj.side === "left" ? "leftSide" : "rightSide")} ` : "";
      return (
        <div key={entry.id} style={{ background: C.surface, borderRadius: 8, padding: "12px 14px", marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            {inj.severity && <div style={{ width: 8, height: 8, borderRadius: 4, background: sevColors[inj.severity], flexShrink: 0 }}/>}
            <span style={{ fontSize: 13, fontWeight: 800, color: C.text, fontFamily: FONT_DISPLAY }}>
              {sideTxt}{inj.bodyPart}
            </span>
            {inj.severity && <span style={{ fontSize: 10, fontWeight: 700, color: sevColors[inj.severity], fontFamily: FONT_DISPLAY }}>{t(sevLabels[inj.severity])}</span>}
          </div>
          <div style={{ fontSize: 11, color: C.textMuted, fontFamily: FONT_BODY, marginBottom: 4 }}>
            {dateStart}{inj.resolvedDate ? ` → ${inj.resolvedDate}` : ""}{dur ? ` (${dur} ${t("daysInjured")})` : ""}
          </div>
          {inj.description && <div style={{ fontSize: 11, color: C.textSec, fontFamily: FONT_BODY, lineHeight: 1.4, marginBottom: 4 }}>{inj.description}</div>}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() => {
                const ctx = `${t("resolvedInjuryContext")}: ${sideTxt}${inj.bodyPart}${dur ? `, ${dur} ${t("daysInjured")}` : ""}`;
                setAddToHomeContext(ctx);
              }}
              style={ghostBtn}>
              <Ic n="plus" s={12} c={C.accent}/>{t("addToHome")}
            </button>
          </div>
        </div>
      );
    }

    // goal or note
    const idea = entry.data;
    const kindIcon = entry.kind === "goal" ? "trophy" : "fileText";
    const ctxKey = entry.kind === "goal" ? "archivedGoalContext" : "archivedNoteContext";
    return (
      <div key={entry.id} style={{ background: C.surface, borderRadius: 8, padding: "12px 14px", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <Ic n={kindIcon} s={14} c={C.textMuted}/>
          <span style={{ fontSize: 13, fontWeight: 800, color: C.text, fontFamily: FONT_DISPLAY }}>
            {idea.title || ""}
          </span>
        </div>
        <div style={{ fontSize: 11, color: C.textMuted, fontFamily: FONT_BODY, marginBottom: 4 }}>
          {entry.date}
        </div>
        {idea.text && <div style={{ fontSize: 11, color: C.textSec, fontFamily: FONT_BODY, lineHeight: 1.4, marginBottom: 4 }}>{idea.text}</div>}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={() => setAddToHomeContext(`${t(ctxKey)}: ${idea.title || ""}`)}
            style={ghostBtn}>
            <Ic n="plus" s={12} c={C.accent}/>{t("addToHome")}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Sub-tab nav */}
      <div style={{ display: "flex", background: "transparent", flexShrink: 0 }}>
        {subTabs.map(([id, label]) => {
          const on = reflectTab === id;
          return (
            <button key={id} onClick={() => setReflectTab(id)}
              style={{ flex: 1, padding: "9px 4px", border: "none", cursor: "pointer",
                background: "none", color: on ? C.text : C.textMuted,
                fontSize: 14, fontWeight: 800, letterSpacing: 1.5, fontFamily: FONT_DISPLAY, textTransform: "uppercase" }}>
              <span style={{ borderBottom: `2px solid ${on ? C.accent : "transparent"}`, paddingBottom: 3 }}>{label}</span>
            </button>
          );
        })}
      </div>

      {/* CALENDAR */}
      {reflectTab === "calendar" && (
        <><SectionBrief desc={t("calendarBrief")} settings={settings}/>
        <CalendarOverlay inline
          moves={moves} setMoves={setMoves} reps={reps} sparring={sparring} musicflow={musicflow} habits={habits} ideas={ideas} setIdeas={setIdeas}
          sets={sets}
          calendar={calendar} setCalendar={setCalendar}
          cats={cats} catColors={catColors} settings={settings} onSettingsChange={onSettingsChange}
          addToast={addToast}
          onGoToPrep={onGoToPrep}
          battleprep={battleprep} initialMonth={initialMonth}
          onToggleBattlePrepTask={onToggleBattlePrepTask}
          onAddTrigger={calendarAddTick} reports={reports} isPremium={isPremium}
          onAddToHome={(ctx) => setAddToHomeContext(ctx)} />
        </>
      )}

      {/* STANCE */}
      {reflectTab === "stance" && (
        isPremium ? (
          <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
            <SectionBrief desc={t("stanceBrief")} settings={settings}/>
            <MyStanceSection moves={moves || []} stance={stance} sparring={sparring} calendar={calendar}
              onOpenAssessment={onOpenStanceAssessment}
              onAddToHome={(ctx) => setAddToHomeContext(ctx)} />
            <DevelopmentStory moves={moves || []} sparring={sparring} calendar={calendar} />
          </div>
        ) : <div style={{padding:20}}><PremiumGate feature="myStance" addToast={addToast}/></div>
      )}

      {/* REPORTS */}
      {reflectTab === "reports" && (
        isPremium ? (
          <>
            <SectionBrief desc={t("reportsBrief")} settings={settings}/>
            <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <ReportsTimeline
                moves={moves} reps={reps} sparring={sparring} musicflow={musicflow}
                calendar={calendar} cats={cats} catColors={catColors}
                battleprep={battleprep} rivals={null} reports={reports}
                onSelectDay={() => setReflectTab("calendar")}
                onAddToHome={(ctx) => setAddToHomeContext(ctx)} />
            </div>
          </>
        ) : <div style={{padding:20}}><PremiumGate feature="reports" addToast={addToast}/></div>
      )}

      {/* HISTORY */}
      {reflectTab === "history" && (
        <>
          <SectionBrief desc={t("historyBrief")} settings={settings}/>
          <div style={{ flex: 1, overflow: "auto", padding: "8px 16px 76px" }}>
            {historyEntries.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: C.textMuted }}>
                <div style={{ marginBottom: 8 }}><Ic n="archive" s={28} c={C.textMuted}/></div>
                <p style={{ fontSize: 13 }}>{t("noHistoryYet")}</p>
              </div>
            ) : (
              historyEntries.map(renderHistoryEntry)
            )}
          </div>
        </>
      )}

      {/* Add-to-Home sheet (REFLECT → HOME loop arrow) */}
      <AddToHomeSheet
        open={!!addToHomeContext}
        context={addToHomeContext || ""}
        onClose={() => setAddToHomeContext(null)}
        setIdeas={setIdeas}
        setHomeStack={setHomeStack}
        setHabits={setHabits}
        addCalendarEvent={addCalendarEvent}
        battleprep={battleprep}
        addToast={addToast}
      />

      {/* Stance assessment confirmation */}
      {showStanceConfirm && (
        <Modal onClose={() => setShowStanceConfirm(false)}>
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, color: C.text, fontFamily: FONT_DISPLAY }}>{t("updateStance")}</div>
            <div style={{ fontSize: 13, color: C.textSec, marginBottom: 18, lineHeight: 1.5 }}>{t("updateStanceConfirm")}</div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <Btn variant="secondary" onClick={() => setShowStanceConfirm(false)}>{t("cancel")}</Btn>
              <Btn style={{ background: C.accent, color: "#fff" }} onClick={() => { setShowStanceConfirm(false); if (onOpenStanceAssessment) onOpenStanceAssessment(); }}>{t("confirm")}</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
