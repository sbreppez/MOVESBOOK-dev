import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { CAT_COLORS, CATEGORY_DOMAIN_MAP, DOMAIN_COLORS } from '../../constants/categories';
import { useSettings } from '../../hooks/useSettings';
import { useT } from '../../hooks/useTranslation';
import { Ic } from '../shared/Ic';
import { Modal } from '../shared/Modal';
import { BottomSheet } from '../shared/BottomSheet';
import { IdeaForm } from './IdeaForm';
import { LogTodayModal } from '../logToday/LogTodayModal';
import { SessionJournal } from '../calendar/SessionJournal';
import { BattleResultDetail } from '../reflect/BattleResultDetail';
import { computeAllDayMaps, computeDayMap, getTasksForDay, getPrevDayTasks } from '../train/battlePrepHelpers';
import { todayLocal } from '../../utils/dateUtils';
import { setEventTraining, removeEventTraining } from '../../utils/trainingLog';

// 4px borderLeft stripe per event source
const stripeColor = (event, C) => {
  if (event.source === "home-idea") return C.yellow;
  if (event.source === "log_today") return C.accent;
  if (event.type === "battle") return C.accent;
  return C.textMuted; // session_journal + tool sources + everything else
};

export const DaySections = ({
  selectedDate, dayData,
  moves, setMoves,
  setIdeas,
  setCalendar,
  addCalendarEvent, updateCalendarEvent, recordEventTraining,
  sets, cats, catColors, settings, onSettingsChange,
  addToast,
  battleprep, onToggleBattlePrepTask, onGoToPrep,
  restLog, setRestLog, restTypes, setRestTypes,
  injuries, setInjuries,
  setBattles, battleFormats, setBattleFormats,
  setHomeStack,
  onOpenMove,
}) => {
  const { C } = useSettings();
  const t = useT();

  // Modal state — mirrors CalendarOverlay's day-detail interaction surface
  const [editEvent, setEditEvent] = useState(null);
  const [showJournal, setShowJournal] = useState(false);
  const [selectedLogTodayEvent, setSelectedLogTodayEvent] = useState(null);
  const [editHomeNote, setEditHomeNote] = useState(null);
  const [confirmDeleteNote, setConfirmDeleteNote] = useState(null);
  const [confirmDeleteEvent, setConfirmDeleteEvent] = useState(null);
  const [detailBattle, setDetailBattle] = useState(null);

  // Precompute battle-prep dayMaps so battle tile taps can pass the prep arc
  // through to BattleResultDetail (matches CalendarOverlay's #141 behavior).
  const allDayMaps = React.useMemo(() => {
    if (!battleprep?.plans?.length) return [];
    return computeAllDayMaps(battleprep.plans);
  }, [battleprep?.plans]);

  const handleSaveEvent = useCallback((eventObj) => {
    setCalendar(prev => {
      const exists = prev.events.find(e => e.id === eventObj.id);
      if (exists) {
        return { ...prev, events: prev.events.map(e => e.id === eventObj.id ? eventObj : e) };
      }
      return { ...prev, events: [...prev.events, eventObj] };
    });
    if (eventObj.type === "training") {
      setMoves(prev => setEventTraining(prev, {
        eventId: eventObj.id,
        moveIds: eventObj.moveIds || [],
        date: eventObj.date,
        source: 'session_journal',
        count: 0,
      }));
    }
    setShowJournal(false);
    setEditEvent(null);
    if (addToast) addToast({ icon: "check", title: t("sessionLogged"), msg: "" });
  }, [setCalendar, setMoves, addToast, t]);

  const handleDeleteEvent = useCallback((id) => {
    setCalendar(prev => ({ ...prev, events: prev.events.filter(e => e.id !== id) }));
    setMoves(prev => removeEventTraining(prev, id));
  }, [setCalendar, setMoves]);

  if (!dayData) return null;

  const totalEvents = dayData.calendarEvents.length;
  const totalSessions =
    dayData.repSessions.length +
    dayData.sparringSessions.length +
    dayData.sparringSessions1v1.length +
    dayData.musicflowSessions.length;
  const totalMoves = dayData.movesTrained.length;

  const sectionHeaderStyle = {
    fontSize: 10, fontWeight: 800, fontFamily: FONT_DISPLAY,
    letterSpacing: 1.5, textTransform: "uppercase",
    color: C.textMuted, padding: "8px 4px 4px",
  };

  // ── Tile renderers ──

  const renderHomeIdeaNote = (event) => (
    <HomeIdeaNote
      key={event.id}
      event={event}
      C={C} t={t}
      onEdit={(evt) => setEditHomeNote(evt)}
      onDelete={(evt) => {
        if (settings?.confirmDelete !== false) setConfirmDeleteNote(evt);
        else handleDeleteEvent(evt.id);
      }}
    />
  );

  const renderEventTile = (event) => {
    const stripe = stripeColor(event, C);
    const isLogToday = event.source === "log_today";
    const isBattle = event.type === "battle";
    const clickable = isLogToday || isBattle;

    const onTileClick = () => {
      if (isLogToday) {
        setSelectedLogTodayEvent(event);
      } else if (isBattle) {
        openBattleDetail(event);
      }
    };

    return (
      <div key={event.id}
        onClick={clickable ? onTileClick : undefined}
        style={{
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          padding: "10px 12px", background: C.surface, borderRadius: 8,
          borderLeft: `4px solid ${stripe}`, marginBottom: 6,
          cursor: clickable ? "pointer" : "default",
        }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <Ic n={event.type === "training" ? "target"
              : event.type === "battle" ? "swords"
              : event.type === "rest" ? "pause" : "mapPin"} s={14} c={C.textSec}/>
            <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 13, color: C.text,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {event.title || t(
                event.type === "training" ? "trainingSession"
                : event.type === "battle" ? "battleEvent"
                : event.type === "rest" ? "restDay" : "journalEvent"
              )}
            </span>
            {event.duration && (
              <span style={{ fontSize: 10, color: C.textMuted, fontFamily: FONT_DISPLAY, flexShrink: 0 }}>
                {event.duration} {t("aboutXMin")}
              </span>
            )}
          </div>
          {event.categories?.length > 0 && (
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
              {event.categories.map(cat => (
                <span key={cat} style={{ fontSize: 10, fontFamily: FONT_DISPLAY, fontWeight: 700,
                  color: catColors?.[cat] || CAT_COLORS[cat] || C.textSec,
                  background: (catColors?.[cat] || CAT_COLORS[cat] || C.accent) + "18",
                  borderRadius: 6, padding: "1px 6px" }}>
                  {cat}
                </span>
              ))}
            </div>
          )}
          {event.notes && (
            <div style={{ fontSize: 11, color: C.textSec, marginTop: 3, fontFamily: FONT_BODY,
              overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box",
              WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
              {event.notes}
            </div>
          )}
          {event.source && (
            <div style={{ fontSize: 10, color: C.textMuted, marginTop: 3, fontFamily: FONT_DISPLAY,
              fontWeight: 600, letterSpacing: 0.3, fontStyle: "italic" }}>
              {event.source === "rep_counter" ? t("viaRepCounter") :
               event.source === "sparring" ? t("viaSparring") :
               event.source === "spar-1v1" ? t("via1v1Spar") :
               event.source === "combo_machine" ? t("viaComboMachine") :
               event.source === "lab" ? t("viaLab") :
               event.source === "rrr" ? t("viaRRR") : ""}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 4, flexShrink: 0, marginLeft: 6 }}>
          {isBattle ? (
            <button onClick={(ev) => { ev.stopPropagation(); openBattleDetail(event); }}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
              aria-label={t("battleResultDetail")}>
              <Ic n="eye" s={14} c={C.textMuted}/>
            </button>
          ) : (
            <button onClick={(ev) => {
              ev.stopPropagation();
              if (isLogToday) {
                setSelectedLogTodayEvent(event);
              } else {
                setEditEvent(event);
                setShowJournal(true);
              }
            }}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
              aria-label={t("edit")}>
              <Ic n="edit" s={14} c={C.textMuted}/>
            </button>
          )}
          <button onClick={(ev) => {
              ev.stopPropagation();
              if (settings?.confirmDelete !== false) setConfirmDeleteEvent(event);
              else handleDeleteEvent(event.id);
            }}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
            aria-label={t("delete")}>
            <Ic n="trash" s={14} c={C.textMuted}/>
          </button>
        </div>
      </div>
    );
  };

  const openBattleDetail = (event) => {
    const allPlans = [...(battleprep?.plans || []), ...(battleprep?.history || [])];
    let foundBattle = null;
    let foundPlan = null;
    for (const p of allPlans) {
      const b = (p.battles || []).find(bb => bb.date === event.date);
      if (b) { foundBattle = b; foundPlan = p; break; }
    }
    const foundDayMap = foundPlan
      ? (allDayMaps.find(d => d.planId === foundPlan.id)?.dayMap
        || computeDayMap(foundPlan).dayMap)
      : null;
    setDetailBattle({
      battle: foundBattle || { date: event.date, id: null, eventName: event.title, reflection: null },
      plan: foundPlan,
      dayMap: foundDayMap,
    });
  };

  // ── Sessions row helpers — taps open SessionJournal on the calendar event echo ──

  // Find the calendar event echo for a session by stable id. Tools write
  // `sessionId: session.id` on the echo alongside the source tag. Old echoes
  // (pre-sessionId) miss the lookup → tile renders display-only, cursor stays
  // default so the user can see it's not tappable.
  const findSessionEvent = (sessionRecord, sourceTag) => {
    return (dayData.calendarEvents || []).find(
      e => e.source === sourceTag && e.sessionId === sessionRecord.id
    ) || null;
  };

  const openSessionJournalForEvent = (event) => {
    if (!event) return;
    setEditEvent(event);
    setShowJournal(true);
  };

  const renderDrillRow = (r) => {
    const event = findSessionEvent(r, 'rep_counter');
    const clickable = !!event;
    return (
    <div key={`drill-${r.id}`}
      onClick={clickable ? () => openSessionJournalForEvent(event) : undefined}
      style={{
      background: C.surface, borderRadius: 8, padding: "8px 12px", marginBottom: 4,
      fontSize: 11, color: C.textSec,
      cursor: clickable ? "pointer" : "default",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 9, fontFamily: FONT_DISPLAY, fontWeight: 800, letterSpacing: 1,
          color: C.textMuted }}>{t("drill")}</span>
        <span style={{ color: C.text, fontWeight: 700, fontFamily: FONT_DISPLAY }}>{r.moveName}</span>
        <span>{r.reps} reps</span>
        {r.duration > 0 && <span>{Math.round(r.duration)}s</span>}
      </div>
      {r.reflection && (
        <div style={{ fontSize: 11, color: C.textMuted, fontStyle: "italic", marginTop: 2 }}>
          &quot;{r.reflection}&quot;
        </div>
      )}
    </div>
    );
  };

  const renderSparRow = (s, kind) => {
    const sourceTag = kind === "1v1" ? 'spar-1v1' : 'sparring';
    const event = findSessionEvent(s, sourceTag);
    const clickable = !!event;
    return (
    <div key={`${kind}-${s.id}`}
      onClick={clickable ? () => openSessionJournalForEvent(event) : undefined}
      style={{
      background: C.surface, borderRadius: 8, padding: "8px 12px", marginBottom: 4,
      fontSize: 11, color: C.textSec,
      cursor: clickable ? "pointer" : "default",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 9, fontFamily: FONT_DISPLAY, fontWeight: 800, letterSpacing: 1,
          color: C.textMuted }}>{kind === "1v1" ? t("spar") + " 1V1" : t("spar")}</span>
        <span style={{ color: C.text, fontWeight: 700, fontFamily: FONT_DISPLAY }}>
          {s.roundLog?.length || 0} rounds
        </span>
        {kind === "1v1" && s.opponent && (
          <span style={{ color: C.textMuted }}>vs {s.opponent}</span>
        )}
        {s.notes && <span style={{ fontStyle: "italic" }}>{s.notes}</span>}
      </div>
      {s.reflection && (
        <div style={{ fontSize: 11, color: C.textMuted, fontStyle: "italic", marginTop: 2 }}>
          &quot;{s.reflection}&quot;
        </div>
      )}
    </div>
    );
  };

  const renderMusicflowRow = (s) => {
    const event = findSessionEvent(s, 'musicflow');
    const clickable = !!event;
    return (
    <div key={`mf-${s.id}`}
      onClick={clickable ? () => openSessionJournalForEvent(event) : undefined}
      style={{
      background: C.surface, borderRadius: 8, padding: "8px 12px", marginBottom: 4,
      fontSize: 11, color: C.textSec,
      cursor: clickable ? "pointer" : "default",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 9, fontFamily: FONT_DISPLAY, fontWeight: 800, letterSpacing: 1,
          color: C.textMuted }}>{t("flow")}</span>
        <span style={{ color: C.text, fontWeight: 700, fontFamily: FONT_DISPLAY }}>
          {Math.floor(s.duration / 60)}:{String(s.duration % 60).padStart(2, "0")}
        </span>
        <span>Stage {s.stageReached}</span>
      </div>
      {s.reflection && (
        <div style={{ fontSize: 11, color: C.textMuted, fontStyle: "italic", marginTop: 2 }}>
          &quot;{s.reflection}&quot;
        </div>
      )}
    </div>
    );
  };

  // ── Render ──

  // Active battleprep tasks/battles for selectedDate, one block per plan whose
  // dayMap covers this date. Battle days render the BATTLE DAY tile; everything
  // else renders the per-task checkbox card. computeAllDayMaps returns the plan
  // identity (planId + planName + eventName) but not the live plan record, so
  // resolve it from battleprep.plans for completedTasks lookups.
  const todayStr = todayLocal();
  const prepBlocks = React.useMemo(() => {
    if (!allDayMaps.length) return [];
    const planById = new Map((battleprep?.plans || []).map(p => [p.id, p]));
    return allDayMaps.flatMap(({ planId, dayMap }) => {
      const info = dayMap[selectedDate];
      if (!info) return [];
      const plan = planById.get(planId);
      if (!plan) return [];
      const prevKeys = getPrevDayTasks(planId, selectedDate, dayMap);
      const tasks = getTasksForDay(planId, selectedDate, info, prevKeys);
      return [{ plan, info, tasks }];
    });
  }, [allDayMaps, battleprep?.plans, selectedDate]);

  const anySection = totalEvents > 0 || totalSessions > 0 || totalMoves > 0 || prepBlocks.length > 0;
  if (!anySection && !showJournal) return null;

  return (
    <>
      <div style={{ padding: "0 12px" }}>
        {/* PREP PHASES (battleprep) */}
        {prepBlocks.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <div style={sectionHeaderStyle}>
              {t("prepPhases")} · {prepBlocks.length}
            </div>
            {prepBlocks.map(({ plan, info, tasks }) => {
              const completed = plan.completedTasks || {};
              const isPast = selectedDate < todayStr;
              const isBattleDay = info.type === "battle";
              const phaseColor = info.phaseColor || (isBattleDay ? C.red : C.accent);
              const planLabel = plan.eventName || plan.planName || "";

              if (isBattleDay) {
                return (
                  <div key={`bd-${plan.id}`}
                    onClick={() => openBattleDetail({ date: selectedDate, title: planLabel })}
                    style={{
                      background: C.surface, borderRadius: 8, padding: "12px 14px", marginBottom: 4,
                      borderLeft: `4px solid ${C.red}`, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 10,
                    }}>
                    <Ic n="swords" s={18} c={C.red}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 13,
                        letterSpacing: 0.5, color: C.red, textTransform: "uppercase" }}>
                        {t("battleDay")}
                      </div>
                      {planLabel && (
                        <div style={{ fontSize: 11, color: C.textSec, marginTop: 1,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {planLabel}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              return (
                <div key={`pt-${plan.id}`} style={{
                  background: C.surface, borderRadius: 8, padding: "10px 12px", marginBottom: 4,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: tasks.length ? 6 : 0 }}>
                    {planLabel && (
                      <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 11,
                        color: C.text, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {planLabel}
                      </span>
                    )}
                    {info.phase && (
                      <span style={{
                        fontSize: 10, fontFamily: FONT_DISPLAY, fontWeight: 700,
                        background: `${phaseColor}25`, color: phaseColor,
                        borderRadius: 4, padding: "1px 6px",
                      }}>
                        {info.phase}
                      </span>
                    )}
                  </div>
                  {tasks.map((task, i) => {
                    const done = !!completed[`${selectedDate}-${i}`];
                    return (
                      <button key={i}
                        onClick={() => !isPast && onToggleBattlePrepTask?.(plan.id, selectedDate, i)}
                        style={{
                          display: "flex", alignItems: "center", gap: 8, width: "100%",
                          padding: "7px 2px", background: "none", border: "none",
                          cursor: isPast ? "default" : "pointer",
                          borderBottom: i < tasks.length - 1 ? `1px solid ${C.borderLight || C.border}` : "none",
                          textAlign: "left", opacity: isPast ? 0.5 : 1,
                        }}>
                        <div style={{
                          width: 20, height: 20, borderRadius: 5,
                          border: `2px solid ${done ? C.green : C.border}`,
                          background: done ? C.green : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                          {done && <Ic n="check" s={12} c="#fff"/>}
                        </div>
                        <span style={{ fontSize: 14, flexShrink: 0 }}>{task.emoji}</span>
                        <span style={{
                          flex: 1, fontSize: 11, fontFamily: FONT_BODY,
                          color: done ? C.textMuted : C.text,
                          textDecoration: done ? "line-through" : "none",
                          opacity: done ? 0.45 : 1, lineHeight: 1.4,
                        }}>
                          {t(task.key)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* EVENTS */}
        {totalEvents > 0 && (
          <div style={{ marginBottom: 8 }}>
            <div style={sectionHeaderStyle}>
              {t("calendarEvents")} · {totalEvents}
            </div>
            {dayData.calendarEvents.map(e =>
              e.source === "home-idea" ? renderHomeIdeaNote(e) : renderEventTile(e)
            )}
          </div>
        )}

        {/* SESSIONS */}
        {totalSessions > 0 && (
          <div style={{ marginBottom: 8 }}>
            <div style={sectionHeaderStyle}>
              {t("sessionsHeader")} · {totalSessions}
            </div>
            {dayData.repSessions.map(renderDrillRow)}
            {dayData.sparringSessions.map(s => renderSparRow(s, "solo"))}
            {dayData.sparringSessions1v1.map(s => renderSparRow(s, "1v1"))}
            {dayData.musicflowSessions.map(renderMusicflowRow)}
          </div>
        )}

        {/* MOVES TRAINED */}
        {totalMoves > 0 && (
          <div style={{ marginBottom: 8 }}>
            <div style={sectionHeaderStyle}>
              {t("movesTrained")} · {totalMoves}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4,
              background: C.surface, borderRadius: 8, padding: "10px 12px" }}>
              {dayData.movesTrained.map((m, i) => {
                const domainKey = CATEGORY_DOMAIN_MAP[m.category]?.primary;
                const domainColor = domainKey ? DOMAIN_COLORS[domainKey] : null;
                return (
                  <span key={`${m.id}-${i}`}
                    onClick={onOpenMove ? () => onOpenMove(m.id) : undefined}
                    style={{ display: "inline-flex", alignItems: "center", gap: 4,
                    fontSize: 11, fontFamily: FONT_BODY, color: C.text,
                    background: C.surfaceAlt, borderRadius: 8, padding: "3px 8px",
                    cursor: onOpenMove ? "pointer" : "default" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%",
                      background: catColors?.[m.category] || CAT_COLORS[m.category] || C.accent }}/>
                    {domainColor && <span style={{ width: 4, height: 4, borderRadius: "50%",
                      background: domainColor, marginLeft: -2 }}/>}
                    {m.name}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}

      {/* SessionJournal fullscreen overlay */}
      {showJournal && (
        <div style={{
          position: "fixed", inset: 0, background: C.bg, zIndex: 600,
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
          <SessionJournal
            date={editEvent?.date || selectedDate}
            event={editEvent?.id ? editEvent : null}
            moves={moves}
            sets={sets}
            cats={cats}
            catColors={catColors}
            settings={settings}
            onSettingsChange={onSettingsChange}
            initialType={editEvent?.type || "training"}
            onSave={handleSaveEvent}
            onCancel={() => { setShowJournal(false); setEditEvent(null); }}
          />
        </div>
      )}

      {/* Edit home-idea note */}
      {editHomeNote && (
        <BottomSheet open={true} onClose={() => setEditHomeNote(null)} title={t("editNote")}>
          <IdeaForm
            idea={editHomeNote}
            onSave={(fields) => {
              if (setIdeas && editHomeNote.ideaId) {
                setIdeas(prev => prev.map(i =>
                  i.id === editHomeNote.ideaId
                    ? { ...i, title: fields.title, text: fields.text, link: fields.link, showDate: fields.showDate }
                    : i
                ));
              }
              setCalendar(prev => ({
                ...prev,
                events: (prev.events || []).map(e =>
                  e.id === editHomeNote.id
                    ? { ...e, title: fields.title, text: fields.text, link: fields.link, showDate: fields.showDate || e.date }
                    : e
                ),
              }));
              setEditHomeNote(null);
            }}
            onCancel={() => setEditHomeNote(null)}
          />
        </BottomSheet>
      )}

      {/* Delete note confirmation */}
      {confirmDeleteNote && (
        <Modal onClose={() => setConfirmDeleteNote(null)}>
          <div style={{ padding: 20, textAlign: "center" }}>
            <Ic n="trash" s={28} c={C.accent}/>
            <h3 style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 16, letterSpacing: 1, color: C.text, margin: "8px 0" }}>
              {t("delete")}
            </h3>
            <p style={{ fontSize: 13, color: C.textSec, marginBottom: 16, lineHeight: 1.5 }}>
              {t("deleteNoteConfirm") || "Delete this note?"}
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setConfirmDeleteNote(null)}
                style={{ flex: 1, padding: "10px", background: C.surfaceAlt, border: `1px solid ${C.border}`,
                  borderRadius: 8, cursor: "pointer", fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 13, color: C.text }}>
                {t("cancel")}
              </button>
              <button onClick={() => { handleDeleteEvent(confirmDeleteNote.id); setConfirmDeleteNote(null); }}
                style={{ flex: 1, padding: "10px", background: C.accent, border: "none",
                  borderRadius: 8, cursor: "pointer", fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 13, color: "#fff" }}>
                {t("delete")}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete event confirmation */}
      {confirmDeleteEvent && (
        <Modal onClose={() => setConfirmDeleteEvent(null)}>
          <div style={{ padding: 20, textAlign: "center" }}>
            <Ic n="trash" s={28} c={C.accent}/>
            <h3 style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 16, letterSpacing: 1, color: C.text, margin: "8px 0" }}>
              {t("delete")}
            </h3>
            <p style={{ fontSize: 13, color: C.textSec, marginBottom: 16, lineHeight: 1.5 }}>
              {t("deleteEventConfirm") || "Delete this event?"}
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setConfirmDeleteEvent(null)}
                style={{ flex: 1, padding: "10px", background: C.surfaceAlt, border: `1px solid ${C.border}`,
                  borderRadius: 8, cursor: "pointer", fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 13, color: C.text }}>
                {t("cancel")}
              </button>
              <button onClick={() => { handleDeleteEvent(confirmDeleteEvent.id); setConfirmDeleteEvent(null); }}
                style={{ flex: 1, padding: "10px", background: C.accent, border: "none",
                  borderRadius: 8, cursor: "pointer", fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 13, color: "#fff" }}>
                {t("delete")}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Battle result detail */}
      <BattleResultDetail
        open={!!detailBattle}
        battle={detailBattle?.battle}
        plan={detailBattle?.plan}
        dayMap={detailBattle?.dayMap}
        onClose={() => setDetailBattle(null)}
        onLogReflection={({ planId, battleId: _battleId }) => {
          const date = detailBattle?.battle?.date;
          setDetailBattle(null);
          if (onGoToPrep && planId && date) {
            onGoToPrep({ focus: "plan", planId, date, phase: "reflection" });
          }
        }}
        onOpenPrep={({ planId }) => {
          const date = detailBattle?.battle?.date;
          setDetailBattle(null);
          if (onGoToPrep && planId && date) {
            onGoToPrep({ focus: "plan", planId, date });
          }
        }}
        t={t}
      />

      {/* LogToday modal */}
      {selectedLogTodayEvent && (
        <LogTodayModal
          date={selectedLogTodayEvent.date}
          existingEvent={selectedLogTodayEvent}
          moves={moves}
          sets={sets}
          cats={cats}
          catColors={catColors}
          addCalendarEvent={addCalendarEvent}
          updateCalendarEvent={updateCalendarEvent}
          recordEventTraining={recordEventTraining}
          addToast={addToast}
          restLog={restLog}
          setRestLog={setRestLog}
          restTypes={restTypes}
          setRestTypes={setRestTypes}
          injuries={injuries}
          setInjuries={setInjuries}
          setBattles={setBattles}
          battleFormats={battleFormats}
          setBattleFormats={setBattleFormats}
          setIdeas={setIdeas}
          setHomeStack={setHomeStack}
          onClose={() => setSelectedLogTodayEvent(null)}
        />
      )}
    </>
  );
};

// ── Home-idea note tile (expand + 3-dot menu, ported from CalendarOverlay) ──
const HomeIdeaNote = ({ event, C, t, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef(null);
  const hasText = event.text && event.text.trim();

  useEffect(() => {
    if (!menu) return;
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenu(false); };
    document.addEventListener("pointerdown", h);
    return () => document.removeEventListener("pointerdown", h);
  }, [menu]);

  return (
    <div style={{ background: C.surface, borderRadius: 8, marginBottom: 6, overflow: "visible",
      borderLeft: `4px solid ${C.yellow}` }}>
      <div style={{ display: "flex", alignItems: "center", padding: "10px 12px", gap: 8 }}>
        <Ic n="fileText" s={14} c={C.textSec}/>
        <span style={{ flex: 1, fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 13, color: C.text,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {event.title || t("note")}
        </span>
        <div ref={menuRef} style={{ flexShrink: 0, position: "relative" }}>
          <button onClick={(e) => { e.stopPropagation(); setMenu(m => !m); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: 2 }}>
            <Ic n="more" s={13}/>
          </button>
          {menu && (
            <div onClick={(e) => e.stopPropagation()}
              style={{
                position: "absolute", top: 24, right: 0, background: C.bg,
                border: `1px solid ${C.border}`, borderRadius: 9, overflow: "hidden",
                zIndex: 9999, minWidth: 140, boxShadow: "0 8px 28px rgba(0,0,0,0.22)",
              }}>
              <button onClick={() => { setMenu(false); onEdit?.(event); }}
                style={{ width: "100%", padding: "9px 13px", background: "none", border: "none",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                  color: C.text, fontSize: 12, fontFamily: "inherit" }}>
                <Ic n="edit" s={12} c={C.textSec}/>{t("edit")}
              </button>
              <button onClick={() => { setMenu(false); onDelete?.(event); }}
                style={{ width: "100%", padding: "9px 13px", background: "none", border: "none",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                  color: C.accent, fontSize: 12, fontFamily: "inherit", borderTop: `1px solid ${C.border}` }}>
                <Ic n="trash" s={12} c={C.accent}/>{t("delete")}
              </button>
            </div>
          )}
        </div>
      </div>
      {hasText && (
        <>
          {expanded && (
            <div style={{ padding: "0 12px 10px 34px", fontSize: 11, fontFamily: FONT_BODY,
              color: C.textSec, lineHeight: 1.5 }}>
              {event.text}
            </div>
          )}
          <button onClick={() => setExpanded(x => !x)}
            style={{ width: "100%", display: "flex", justifyContent: "center",
              padding: "4px 0 6px", background: "none", border: "none", cursor: "pointer" }}>
            <Ic n={expanded ? "chevU" : "chevD"} s={12} c={C.textMuted}/>
          </button>
        </>
      )}
    </div>
  );
};

export default DaySections;
