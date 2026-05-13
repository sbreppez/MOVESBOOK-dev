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
import { NoteModal } from '../train/NoteModal';
import { InjuryModal } from '../modals/InjuryModal';
import { getNextTrainingDay } from '../../utils/nextTrainingDay';

const todayYMD = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};
const partLabelKey = (p) => p ? "bodyPart" + p.charAt(0).toUpperCase() + p.slice(1) : "";

const SUB_TABS = ["calendar", "stance", "reports", "history"];

const daysBetween = (d1, d2) => {
  if (!d1 || !d2) return null;
  return Math.max(1, Math.floor((new Date(d2 + "T12:00:00") - new Date(d1 + "T12:00:00")) / 86400000));
};

export const ReflectPage = ({
  ideas, setIdeas, moves, setMoves, reps, sparring, musicflow, habits, setHabits,
  homeStack: _homeStack, setHomeStack,
  calendar, setCalendar, cats, catColors, settings, onSettingsChange,
  addToast, stance, battleprep, onToggleBattlePrepTask,
  onOpenStanceAssessment, addCalendarEvent, removeCalendarEvent: _removeCalendarEvent,
  updateCalendarEvent, markMoveTrainedToday,
  onSubTabChange, onGoToPrep, initialMonth, initialFocus, onInitialFocusUsed, sets, onAddTrigger, parentSubTab, reports, injuries, setInjuries,
  isPremium
}) => {
  const t = useT();
  const { C } = useSettings();
  const [reflectTab, setReflectTab] = useState(parentSubTab || "calendar");
  const [showStanceConfirm, setShowStanceConfirm] = useState(false);
  const [calendarAddTick, setCalendarAddTick] = useState(0);
  const [addToHomeContext, setAddToHomeContext] = useState(null);
  const [injuryModalOpen, setInjuryModalOpen] = useState(false);
  const [editingInjury, setEditingInjury] = useState(null);
  const [resolveConfirm, setResolveConfirm] = useState(null);
  const [resolvedExpanded, setResolvedExpanded] = useState(false);

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

  // ── Injuries: active and resolved ──────────────────────────────────────────
  const activeInjuriesList = useMemo(() =>
    (injuries || []).filter(i => !i.resolved)
      .sort((a, b) => (b.date || b.startDate || "").localeCompare(a.date || a.startDate || "")),
    [injuries]
  );
  const resolvedInjuriesList = useMemo(() =>
    (injuries || []).filter(i => i.resolved)
      .sort((a, b) => (b.resolvedDate || "").localeCompare(a.resolvedDate || "")),
    [injuries]
  );

  // ── Archived ideas/goals (kept under their own section) ────────────────────
  const ideaHistoryEntries = useMemo(() => {
    const entries = [];
    (ideas || []).filter(i => i.archived === true).forEach(idea => {
      entries.push({
        id: `idea_${idea.id}`,
        kind: idea.type === "goal" || idea.type === "target" ? "goal" : "note",
        date: idea.archivedDate || idea.createdDate || "",
        data: idea,
      });
    });
    return entries.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [ideas]);

  const ghostBtn = {
    background: "transparent", border: `1px solid ${C.accent}`,
    color: C.accent, borderRadius: 8, padding: "6px 12px",
    fontSize: 11, fontWeight: 800, fontFamily: FONT_DISPLAY,
    letterSpacing: 1, textTransform: "uppercase",
    display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
  };

  const sectionHeader = {
    fontSize: 10, fontWeight: 800, fontFamily: FONT_DISPLAY,
    letterSpacing: 1.5, color: C.textMuted, textTransform: "uppercase",
    marginBottom: 8,
  };

  const emptyMini = {
    fontSize: 12, color: C.textMuted, fontFamily: FONT_BODY,
    padding: "12px 4px", fontStyle: "italic",
  };

  const renderInjuryCard = (inj, isResolved) => {
    const stripeColor = inj.severity ? sevColors[inj.severity] : C.border;
    const partLabel = inj.bodyPart ? t(partLabelKey(inj.bodyPart)) : "";
    const sideLabel = inj.side ? t(inj.side === "left" ? "leftSide" : "rightSide") : "";
    const fullLabel = sideLabel ? `${sideLabel} ${partLabel}` : partLabel;
    const dateStart = inj.date || inj.startDate || "";
    const dur = isResolved ? daysBetween(dateStart, inj.resolvedDate) : null;

    return (
      <div key={inj.id}
        onClick={() => { setEditingInjury(inj); setInjuryModalOpen(true); }}
        style={{
          background: C.surface, borderRadius: 8,
          borderLeft: `4px solid ${stripeColor}`,
          padding: "12px 14px", marginBottom: 6,
          cursor: "pointer",
        }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: C.text, fontFamily: FONT_DISPLAY }}>
            {fullLabel}
          </span>
          {inj.severity && (
            <span style={{ fontSize: 10, fontWeight: 700, color: stripeColor, fontFamily: FONT_DISPLAY, textTransform: "uppercase", letterSpacing: 0.5 }}>
              {t(sevLabels[inj.severity])}
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, color: C.textMuted, fontFamily: FONT_BODY, marginBottom: 4 }}>
          {dateStart}
          {isResolved && inj.resolvedDate ? ` → ${inj.resolvedDate}` : ""}
          {dur ? ` (${dur} ${t("daysInjured")})` : ""}
        </div>
        {inj.description && (
          <div style={{ fontSize: 12, color: C.textSec, fontFamily: FONT_BODY, lineHeight: 1.4, marginBottom: 6 }}>
            {inj.description}
          </div>
        )}
        {!isResolved && (
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={(e) => { e.stopPropagation(); setResolveConfirm(inj); }}
              style={ghostBtn}>
              <Ic n="check" s={12} c={C.accent}/>{t("markResolved")}
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderHistoryEntry = (entry) => {
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

  const handleSaveAddToHomeNote = (fields) => {
    const id = Date.now().toString();
    setIdeas(prev => [{
      id, type: 'note', title: fields.title, text: fields.text,
      link: fields.link, showDate: fields.showDate || null,
      createdDate: new Date().toISOString(),
    }, ...prev]);
    setHomeStack(prev => ({
      ...prev,
      defaultStack: [{ id, type: 'note' }, ...(prev.defaultStack || [])],
    }));
    if (fields.showDate && addCalendarEvent) {
      addCalendarEvent({
        date: fields.showDate, type: "journal",
        title: fields.title || "Note", text: fields.text || "",
        source: "home-idea", ideaId: id,
      }, { silent: true });
    }
    if (addToast) addToast({ icon: "home", title: t("addNoteToHome") });
    setAddToHomeContext(null);
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
          addCalendarEvent={addCalendarEvent}
          updateCalendarEvent={updateCalendarEvent}
          markMoveTrainedToday={markMoveTrainedToday}
          onGoToPrep={onGoToPrep}
          battleprep={battleprep} initialMonth={initialMonth} initialFocus={initialFocus} onInitialFocusUsed={onInitialFocusUsed}
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
              onOpenAssessment={onOpenStanceAssessment} />
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
            {/* + Log injury */}
            <button onClick={() => { setEditingInjury(null); setInjuryModalOpen(true); }}
              style={{
                width: "100%", padding: "10px 16px", marginBottom: 14,
                background: "transparent", border: `1.5px dashed ${C.border}`,
                borderRadius: 8, color: C.accent, cursor: "pointer",
                fontSize: 13, fontWeight: 800, fontFamily: FONT_DISPLAY,
                letterSpacing: 1, textTransform: "uppercase",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}>
              <Ic n="plus" s={14} c={C.accent}/>{t("addInjury")}
            </button>

            {/* Active injuries */}
            <div style={{ marginBottom: 21 }}>
              <div style={sectionHeader}>{t("activeInjuries")}</div>
              {activeInjuriesList.length === 0
                ? <div style={emptyMini}>{t("noActiveInjuries")}</div>
                : activeInjuriesList.map(inj => renderInjuryCard(inj, false))}
            </div>

            {/* Resolved injuries (collapsible) */}
            <div style={{ marginBottom: 21 }}>
              <button onClick={() => setResolvedExpanded(x => !x)}
                style={{ background: "none", border: "none", padding: 0, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 6, marginBottom: 8, width: "100%" }}>
                <Ic n={resolvedExpanded ? "chevD" : "chevR"} s={13} c={C.textMuted}/>
                <span style={{ ...sectionHeader, marginBottom: 0 }}>{t("injuryHistory")}</span>
              </button>
              {resolvedExpanded && (
                resolvedInjuriesList.length === 0
                  ? <div style={emptyMini}>{t("noInjuryHistory")}</div>
                  : resolvedInjuriesList.map(inj => renderInjuryCard(inj, true))
              )}
            </div>

            {/* Archived ideas/goals */}
            {ideaHistoryEntries.length > 0 && (
              <div>
                <div style={sectionHeader}>{t("archived")}</div>
                {ideaHistoryEntries.map(renderHistoryEntry)}
              </div>
            )}

            {/* Truly empty state */}
            {activeInjuriesList.length === 0 && resolvedInjuriesList.length === 0 && ideaHistoryEntries.length === 0 && (
              <div style={{ textAlign: "center", padding: 40, color: C.textMuted }}>
                <div style={{ marginBottom: 8 }}><Ic n="archive" s={28} c={C.textMuted}/></div>
                <p style={{ fontSize: 13 }}>{t("noHistoryYet")}</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Add-to-Home → direct note capture (REFLECT → HOME loop arrow) */}
      {addToHomeContext && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
          zIndex: 10000, display: "flex", alignItems: "center",
          justifyContent: "center", padding: 10,
        }}>
          <NoteModal
            headerLabel={t("addNoteToHome")}
            prefill={{
              title: addToHomeContext,
              showDate: getNextTrainingDay(battleprep),
            }}
            onClose={() => setAddToHomeContext(null)}
            onSave={handleSaveAddToHomeNote}
          />
        </div>
      )}

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

      {/* Injury modal (create + edit) */}
      {injuryModalOpen && (
        <InjuryModal
          injury={editingInjury}
          onClose={() => { setInjuryModalOpen(false); setEditingInjury(null); }}
          onSave={(payload) => {
            if (editingInjury) {
              setInjuries(prev => prev.map(i => i.id === payload.id ? payload : i));
            } else {
              setInjuries(prev => [...(prev || []), payload]);
            }
          }}
          onDelete={(id) => setInjuries(prev => (prev || []).filter(i => i.id !== id))}
        />
      )}

      {/* Mark resolved confirmation */}
      {resolveConfirm && (
        <Modal title={t("markResolved")} onClose={() => setResolveConfirm(null)}>
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <div style={{ fontSize: 13, color: C.textSec, marginBottom: 18, lineHeight: 1.5 }}>{t("markResolvedConfirm")}</div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <Btn variant="secondary" onClick={() => setResolveConfirm(null)}>{t("cancel")}</Btn>
              <Btn style={{ background: C.accent, color: "#fff" }} onClick={() => {
                const id = resolveConfirm.id;
                const day = todayYMD();
                setInjuries(prev => (prev || []).map(i => i.id === id ? { ...i, resolved: true, resolvedDate: day } : i));
                setResolveConfirm(null);
              }}>{t("confirm")}</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
