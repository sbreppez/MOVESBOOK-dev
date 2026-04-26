import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { CAT_COLORS, CATEGORY_DOMAIN_MAP, DOMAIN_COLORS } from '../../constants/categories';
import { useT } from '../../hooks/useTranslation';
import { Ic } from '../shared/Ic';
import { EXERTION_OPTIONS, BODY_PARTS, BODY_STATES } from '../shared/BodyCheckIn';
import { SessionJournal } from './SessionJournal';
import { computeAllDayMaps, getTasksForDay, getPrevDayTasks } from '../train/battlePrepHelpers';
import { ReportsTimeline } from './ReportsTimeline';
import { Modal } from '../shared/Modal';
import { BottomSheet } from '../shared/BottomSheet';
import { IdeaForm } from '../home/IdeaForm';
import { todayLocal, toLocalYMD } from '../../utils/dateUtils';

const toYMD = (d) => {
  if (!d) return null;
  if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  try { return toLocalYMD(d); } catch { return null; }
};

const MONTH_KEYS = ["january","february","march","april","may","june","july","august","september","october","november","december"];
const DAY_KEYS = ["sunS","monS","tueS","wedS","thuS","friS","satS"];

export const CalendarOverlay = ({
  moves, setMoves, reps, sparring, musicflow, habits, ideas, setIdeas,
  sets,
  calendar, setCalendar,
  cats, catColors, settings, onSettingsChange,
  addToast,
  onClose, onGoToPrep,
  battleprep, onToggleBattlePrepTask, initialMonth,
  inline, onAddTrigger, reports, isPremium,
}) => {
  const t = useT();
  const today = todayLocal();

  const [viewDate, setViewDate] = useState(() => {
    if (initialMonth) return new Date(initialMonth.year, initialMonth.month, 1);
    return new Date();
  });
  const [selectedDay, setSelectedDay] = useState(today);
  const [showJournal, setShowJournal] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [battlePrepPrompt, setBattlePrepPrompt] = useState(null);
  const [calView, setCalView] = useState("days");
  const [confirmDeleteNote, setConfirmDeleteNote] = useState(null);
  const [editHomeNote, setEditHomeNote] = useState(null);
  const prevAddTrigger = useRef(onAddTrigger);

  useEffect(() => {
    if (onAddTrigger !== prevAddTrigger.current && onAddTrigger > 0) {
      setSelectedDay(today); setShowTypePicker(true); setShowJournal(false);
    }
    prevAddTrigger.current = onAddTrigger;
  // eslint-disable-next-line react-hooks/exhaustive-deps -- onAddTrigger-only by intent; today value freshly captured per render
  }, [onAddTrigger]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  // Compute all battle prep day maps
  const allDayMaps = useMemo(() => {
    if (!battleprep?.plans?.length) return [];
    return computeAllDayMaps(battleprep.plans);
  }, [battleprep?.plans]);

  // Build activity map
  const activityMap = useMemo(() => {
    const map = {};
    const mark = (d, type) => {
      const k = toYMD(d);
      if (!k) return;
      if (!map[k]) map[k] = {};
      map[k][type] = true;
    };
    (moves || []).forEach(m => mark(m.date, "moves"));
    (reps || []).forEach(r => mark(r.date, "moves"));
    (sparring?.sessions || []).forEach(s => mark(s.date, "sparring"));
    (sparring?.sessions1v1 || []).forEach(s => mark(s.date, "sparring"));
    (habits || []).forEach(h => (h.checkIns || []).forEach(d => mark(d, "habits")));
    (ideas || []).forEach(i => (i.journal || []).forEach(j => mark(j.date, "notes")));
    (calendar?.events || []).forEach(e => {
      if (e.type === "training") mark(e.date, "moves");
      else mark(e.date, "notes");
    });
    // Add battle prep phase data
    for (const dm of allDayMaps) {
      for (const [dateStr, info] of Object.entries(dm.dayMap)) {
        if (!map[dateStr]) map[dateStr] = {};
        if (!map[dateStr].battlePrepPhases) map[dateStr].battlePrepPhases = [];
        map[dateStr].battlePrepPhases.push({ planId: dm.planId, planName: dm.planName, preset: dm.preset, phase: info.phase, phaseColor: info.phaseColor, type: info.type, session: info.session, eventName: info.eventName });
        if (info.type === "battle") map[dateStr].battleDay = true;
      }
    }
    return map;
  }, [moves, reps, sparring, habits, ideas, calendar, allDayMaps]);

  // Day detail data
  const dayData = useMemo(() => {
    if (!selectedDay) return null;
    const d = selectedDay;
    return {
      movesTrained: (moves || []).filter(m => toYMD(m.date) === d),
      repSessions: (reps || []).filter(r => toYMD(r.date) === d),
      sparringSessions: (sparring?.sessions || []).filter(s => toYMD(s.date) === d),
      musicflowSessions: (musicflow?.sessions || []).filter(s => toYMD(s.date) === d),
      habitsCompleted: (habits || []).filter(h => (h.checkIns || []).includes(d)),
      notesOnDay: (ideas || []).filter(i => (i.journal || []).some(j => toYMD(j.date) === d)),
      calendarEvents: (calendar?.events || []).filter(e => e.date === d),
    };
  }, [selectedDay, moves, reps, sparring, musicflow, habits, ideas, calendar]);

  const handleSaveEvent = useCallback((eventObj) => {
    setCalendar(prev => {
      const exists = prev.events.find(e => e.id === eventObj.id);
      if (exists) {
        return { ...prev, events: prev.events.map(e => e.id === eventObj.id ? eventObj : e) };
      }
      return { ...prev, events: [...prev.events, eventObj] };
    });
    // Update move dates for tagged moves
    if (eventObj.type === "training" && eventObj.moveIds?.length) {
      setMoves(prev => prev.map(m =>
        eventObj.moveIds.includes(m.id) ? { ...m, date: eventObj.date } : m
      ));
    }
    setShowJournal(false);
    setEditEvent(null);
    addToast({ icon: "check", title: t("sessionLogged"), msg: "" });
    // Show "Go to Prep" prompt for new future battle events
    if (eventObj.type === "battle" && eventObj.date >= today && onGoToPrep) {
      setBattlePrepPrompt({ date: eventObj.date, eventName: eventObj.title || "" });
    }
  }, [setCalendar, setMoves, addToast, t, today, onGoToPrep]);

  const handleDeleteEvent = useCallback((id) => {
    setCalendar(prev => ({
      ...prev,
      events: prev.events.filter(e => e.id !== id),
    }));
  }, [setCalendar]);

  const openNewEvent = (type) => {
    setEditEvent({ type, date: selectedDay });
    setShowTypePicker(false);
    setShowJournal(true);
  };

  const sectionLabel = {
    fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 10,
    color: C.textMuted, letterSpacing: 1, textTransform: "uppercase",
    marginBottom: 6, marginTop: 14,
  };

  // Render grid cells
  const cells = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push(dateStr);
  }

  // Body log data for selected day
  const bodyLogData = useMemo(() => {
    if (!dayData) return null;
    const sessions = [];
    dayData.sparringSessions.forEach(s => {
      if (s.exertion || s.bodyStatus) sessions.push({ type: t("sparringSession"), exertion: s.exertion, bodyStatus: s.bodyStatus });
    });
    dayData.repSessions.forEach(r => {
      if (r.exertion || r.bodyStatus) sessions.push({ type: t("repSession"), label: r.moveName, exertion: r.exertion, bodyStatus: r.bodyStatus });
    });
    dayData.calendarEvents.filter(e => e.type === "training").forEach(e => {
      if (e.exertion || e.bodyStatus) sessions.push({ type: t("training"), exertion: e.exertion, bodyStatus: e.bodyStatus });
    });
    if (sessions.length === 0) return null;
    // Compute worst body status
    const worst = { wrists: 0, shoulders: 0, knees: 0, back: 0 };
    sessions.forEach(s => {
      if (s.bodyStatus) {
        Object.keys(worst).forEach(k => { if ((s.bodyStatus[k] || 0) > worst[k]) worst[k] = s.bodyStatus[k]; });
      }
    });
    const hasBodyStatus = Object.values(worst).some(v => v > 0);
    return { sessions, worst: hasBodyStatus ? worst : null };
  }, [dayData, t]);

  // Journal overlay
  if (showJournal) {
    return (
      <div style={ inline ? { flex:1, background: C.bg, display: "flex", flexDirection: "column", overflow: "hidden" } : { position: "absolute", inset: 0, zIndex: 500, background: C.bg, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <SessionJournal
          date={editEvent?.date || selectedDay || today}
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
    );
  }

  // ── Home-idea note tile (expandable, three-dot menu) ──
  const HomeIdeaNote = ({ event, onEdit, onDelete }) => {
    const [expanded, setExpanded] = useState(false);
    const [menu, setMenu] = useState(false);
    const menuRef = useRef(null);
    const hasText = event.text && event.text.trim();

    useEffect(() => {
      if (!menu) return;
      const h = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenu(false); };
      document.addEventListener("pointerdown", h);
      return () => document.removeEventListener("pointerdown", h);
    }, [menu]);

    return (
      <div style={{ background: C.surfaceAlt, borderRadius: 8, marginBottom: 4, overflow: "visible" }}>
        <div style={{ display: "flex", alignItems: "center", padding: "10px 12px", gap: 8 }}>
          <Ic n="fileText" s={14} c={C.textSec}/>
          <span style={{ flex: 1, fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 13, color: C.text,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {event.title || t("note")}
          </span>
                    {/* Three-dot menu */}
          <div ref={menuRef} style={{ flexShrink: 0, position: "relative" }}>
            <button onClick={e => { e.stopPropagation(); setMenu(m => !m); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: 2 }}>
              <Ic n="more" s={13}/>
            </button>
            {menu && (
              <div onClick={e => e.stopPropagation()}
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
        {hasText && (<>
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
        </>)}
      </div>
    );
  };

  return (
    <div style={ inline ? { flex:1, background: C.bg, display: "flex", flexDirection: "column", overflow: "hidden" } : { position: "absolute", inset: 0, zIndex: 500, background: C.bg, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header — hidden in inline mode */}
      {!inline && <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "13px 18px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 16, color: C.text, letterSpacing: 1 }}>
          {t("calendar")}
        </span>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}>
          <Ic n="x" s={20} c={C.textMuted} />
        </button>
      </div>}

      {/* Days / Reports toggle — inline mode only, hidden when single option */}
      {inline && isPremium && (
        <div style={{ display: "flex", gap: 8, padding: "8px 16px", flexShrink: 0 }}>
          {[["days", t("calDays")], ["reports", t("calReports")]].map(([id, label]) => {
            const on = calView === id;
            return (
              <button key={id} onClick={() => setCalView(id)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 0",
                  fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 14, letterSpacing: 1.5,
                  textTransform: "uppercase", color: on ? C.text : C.textMuted }}>
                <span style={{ borderBottom: `2px solid ${on ? C.accent : "transparent"}`, paddingBottom: 3 }}>{label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Log Session button — ghost/outline style, inline mode + days view only */}
      {inline && (!isPremium || calView === "days") && (
        <div style={{ padding:"8px 16px 0", flexShrink:0 }}>
          <button onClick={() => {
            setEditEvent({ type: "training", date: selectedDay });
            setShowTypePicker(false);
            setShowJournal(true);
          }}
            style={{
              width:"100%", padding:14, borderRadius:12,
              border:`1px solid ${C.accent}`, background:"transparent",
              color:C.accent, cursor:"pointer",
              fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:13,
              letterSpacing:1, textTransform:"uppercase",
              display:"flex", alignItems:"center", justifyContent:"center",
              gap:8, minHeight:44,
            }}>
            {t("logSession")}
          </button>
        </div>
      )}

      {/* Days view */}
      {(!inline || calView === "days") && <>
      {/* Battle Prep prompt — shown after saving a future battle event */}
      {battlePrepPrompt && (
        <div style={{ margin: "8px 12px", background: `${C.accent}10`, border: `1px solid ${C.accent}30`,
          borderRadius: 8, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 16 }}>{"\u2694\uFE0F"}</span>
            <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 13, color: C.text,
              letterSpacing: 0.3, flex: 1 }}>{t("wantTrainingPlan")}</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { onGoToPrep(battlePrepPrompt); setBattlePrepPrompt(null); }}
              style={{ flex: 1, padding: "8px 12px", background: C.accent, border: "none", borderRadius: 8,
                cursor: "pointer", fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 11,
                letterSpacing: 1, color: "#fff" }}>
              {t("goToPrep")} {"\u2192"}
            </button>
            <button onClick={() => setBattlePrepPrompt(null)}
              style={{ flex: 1, padding: "8px 12px", background: C.surfaceAlt, border: `1px solid ${C.border}`,
                borderRadius: 8, cursor: "pointer", fontFamily: FONT_DISPLAY, fontWeight: 700,
                fontSize: 11, letterSpacing: 0.5, color: C.textMuted }}>
              {t("notNow")}
            </button>
          </div>
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", WebkitOverflowScrolling: "touch", padding: "0 12px 20px" }}>
        {/* Month navigation */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 4px 10px" }}>
          <button onClick={prevMonth} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, display: "flex" }}>
            <Ic n="chevL" s={20} c={C.textSec} />
          </button>
          <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 16, letterSpacing: 1, color: C.text }}>
            {t(MONTH_KEYS[month]).toUpperCase()} {year}
          </span>
          <button onClick={nextMonth} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, display: "flex" }}>
            <Ic n="chevR" s={20} c={C.textSec} />
          </button>
        </div>

        {/* Day-of-week headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 2 }}>
          {DAY_KEYS.map(k => (
            <div key={k} style={{ textAlign: "center", fontFamily: FONT_DISPLAY, fontWeight: 700,
              fontSize: 10, color: C.textMuted, letterSpacing: 0.5, padding: "4px 0" }}>
              {t(k)}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
          {cells.map((dateStr, i) => {
            if (!dateStr) return <div key={`empty-${i}`} />;
            const dayNum = parseInt(dateStr.split("-")[2], 10);
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDay;
            const activity = activityMap[dateStr];
            const hasActivity = !!activity;
            const dots = [];
            if (activity?.moves) dots.push(C.green);
            if (activity?.sparring) dots.push(C.red);
            if (activity?.habits) dots.push(C.blue);
            if (activity?.notes) dots.push(C.yellow);

            // Battle prep phase dots (unique colors, max 3)
            const bpPhases = activity?.battlePrepPhases || [];
            const bpColors = [...new Set(bpPhases.map(p => p.phaseColor))].slice(0, 3);
            const isBattleDay = !!activity?.battleDay;

            return (
              <button
                key={dateStr}
                onClick={() => {
                  setSelectedDay(selectedDay === dateStr ? null : dateStr);
                  setShowTypePicker(false);
                }}
                style={{
                  background: isSelected ? C.accent + "22" : hasActivity || bpPhases.length ? C.surfaceAlt : "transparent",
                  border: isToday ? `2px solid ${C.accent}` : isSelected ? `1.5px solid ${C.accent}` : "1.5px solid transparent",
                  borderRadius: 8,
                  padding: "6px 2px 3px",
                  cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center",
                  minHeight: 50,
                  transition: "all 0.12s",
                }}
              >
                <span style={{
                  fontFamily: FONT_DISPLAY, fontWeight: isToday ? 900 : 600,
                  fontSize: 13, color: isToday ? C.accent : C.text, lineHeight: 1,
                }}>
                  {isBattleDay ? "\u2694\uFE0F" : dayNum}
                </span>
                {isBattleDay && <span style={{ fontSize: 8, fontFamily: FONT_DISPLAY, fontWeight: 700, color: C.text, lineHeight: 1 }}>{dayNum}</span>}
                {dots.length > 0 && (
                  <div style={{ display: "flex", gap: 3, marginTop: 3 }}>
                    {dots.slice(0, 4).map((color, di) => (
                      <div key={di} style={{ width: 5, height: 5, borderRadius: "50%", background: color }} />
                    ))}
                  </div>
                )}
                {bpColors.length > 0 && (
                  <div style={{ display: "flex", gap: 2, marginTop: 2 }}>
                    {bpColors.map((color, di) => (
                      <div key={di} style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Battle prep phase legend */}
        {allDayMaps.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "8px 2px", marginTop: 6, borderTop: `1px solid ${C.borderLight}` }}>
            {allDayMaps.map(dm => {
              const currentInfo = dm.dayMap[today];
              const dotColor = currentInfo?.phaseColor || C.textMuted;
              return (
                <div key={dm.planId} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: dotColor }} />
                  <span style={{ fontSize: 10, fontFamily: FONT_DISPLAY, fontWeight: 700, color: C.textSec }}>{dm.planName}</span>
                  {currentInfo && <span style={{ fontSize: 8, fontFamily: FONT_DISPLAY, fontWeight: 600, color: currentInfo.phaseColor }}>{currentInfo.phase}</span>}
                </div>
              );
            })}
          </div>
        )}

        {/* Day detail panel */}
        {selectedDay && dayData && (
          <div style={{ marginTop: 12, background: C.surface, borderRadius: 8, padding: 14 }}>
            {/* Day header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 14, color: C.text }}>
                {parseInt(selectedDay.split("-")[2], 10)} {t(MONTH_KEYS[parseInt(selectedDay.split("-")[1], 10) - 1])}
                {selectedDay === today && (
                  <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, color: C.accent,
                    background: C.accent + "18", borderRadius: 6, padding: "2px 6px", letterSpacing: 0.5 }}>
                    {t("today")}
                  </span>
                )}
              </span>
              <button
                onClick={() => setShowTypePicker(v => !v)}
                style={{ background: C.accent, border: "none", cursor: "pointer", borderRadius: "50%",
                  width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Ic n="plus" s={16} c={C.bg} />
              </button>
            </div>

            <BottomSheet
              open={showTypePicker}
              onClose={() => setShowTypePicker(false)}
              title={t("logSession")}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { type: "training", icon: "target", label: t("training") },
                  { type: "battle", icon: "swords", label: t("battleEvent") },
                  { type: "rest", icon: "pause", label: t("restDay") },
                  { type: "journal", icon: "mapPin", label: t("journalEvent") },
                ].map(opt => (
                  <button
                    key={opt.type}
                    onClick={() => openNewEvent(opt.type)}
                    style={{
                      display: "flex", alignItems: "center", gap: 12, width: "100%",
                      padding: "14px 16px", borderRadius: 8, cursor: "pointer",
                      background: C.surfaceAlt, border: "none", textAlign: "left",
                    }}
                  >
                    <Ic n={opt.icon} s={18} c={C.textSec}/>
                    <span style={{
                      fontSize: 14, fontFamily: FONT_DISPLAY, fontWeight: 700, color: C.text
                    }}>
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            </BottomSheet>

            {/* Battle Prep Phases */}
            {(()=>{
              const bpPhases = activityMap[selectedDay]?.battlePrepPhases || [];
              if (!bpPhases.length) return null;
              // Group by plan
              const byPlan = {};
              bpPhases.forEach(p => { if (!byPlan[p.planId]) byPlan[p.planId] = p; });
              return (
                <div>
                  <div style={sectionLabel}>{t("prepPhases") || "PREP PHASES"}</div>
                  {Object.values(byPlan).map(entry => {
                    const isBattle = entry.type === "battle";
                    const isFutureBattle = isBattle && selectedDay >= today && onGoToPrep;
                    const plan = (battleprep?.plans || []).find(p => p.id === entry.planId);
                    const dayMapInfo = plan ? (() => {
                      const dm = allDayMaps.find(d => d.planId === plan.id);
                      return dm?.dayMap?.[selectedDay];
                    })() : null;
                    const prevKeys = plan && dayMapInfo ? getPrevDayTasks(plan.id, selectedDay, allDayMaps.find(d => d.planId === plan.id)?.dayMap || {}) : [];
                    const tasks = plan && dayMapInfo ? getTasksForDay(plan.id, selectedDay, dayMapInfo, prevKeys) : [];
                    const completed = plan?.completedTasks || {};
                    return (
                      <div key={entry.planId} style={{ background: C.surfaceAlt, borderRadius: 8, padding: 10, marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: isBattle || !tasks.length ? 0 : 6 }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: entry.phaseColor, flexShrink: 0 }} />
                          <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 11, color: C.text, flex: 1 }}>{entry.planName}</span>
                          <span style={{ fontSize: 10, fontFamily: FONT_DISPLAY, fontWeight: 700, background: `${entry.phaseColor}25`, color: entry.phaseColor, borderRadius: 4, padding: "1px 6px" }}>{entry.phase}</span>
                        </div>
                        {isBattle && (
                          <div
                            onClick={isFutureBattle ? () => onGoToPrep({ focus: "plan", planId: entry.planId, date: selectedDay }) : undefined}
                            style={{ textAlign: "center", padding: "8px 0 4px", cursor: isFutureBattle ? "pointer" : undefined }}>
                            <span style={{ fontSize: 20 }}>{"\u2694\uFE0F"}</span>
                            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 11, letterSpacing: 1, color: C.red, marginTop: 2 }}>{t("battleDay")}</div>
                          </div>
                        )}
                        {!isBattle && tasks.map((task, i) => {
                          const done = !!completed[`${selectedDay}-${i}`];
                          return (
                            <button key={i} onClick={() => onToggleBattlePrepTask && onToggleBattlePrepTask(entry.planId, selectedDay, i)}
                              style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "6px 2px", background: "none", border: "none", cursor: "pointer", borderBottom: i < tasks.length - 1 ? `1px solid ${C.borderLight}` : "none", textAlign: "left" }}>
                              <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${done ? C.green : C.border}`, background: done ? C.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                {done && <Ic n="check" s={11} c="#fff" />}
                              </div>
                              <span style={{ fontSize: 13, flexShrink: 0 }}>{task.emoji}</span>
                              <span style={{ flex: 1, fontSize: 11, fontFamily: FONT_BODY, color: done ? C.textMuted : C.text, textDecoration: done ? "line-through" : "none", opacity: done ? 0.45 : 1 }}>{t(task.key)}</span>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* No activity */}
            {dayData.movesTrained.length === 0 && dayData.repSessions.length === 0 &&
             dayData.sparringSessions.length === 0 && dayData.musicflowSessions.length === 0 &&
             dayData.habitsCompleted.length === 0 &&
             dayData.notesOnDay.length === 0 && dayData.calendarEvents.length === 0 &&
             !(activityMap[selectedDay]?.battlePrepPhases?.length) && (
              <div style={{ color: C.textMuted, fontSize: 11, fontFamily: FONT_BODY, padding: "12px 0", textAlign: "center" }}>
                {t("noActivity")}
              </div>
            )}

            {/* Calendar Events */}
            {dayData.calendarEvents.length > 0 && (
              <div>
                <div style={sectionLabel}>{t("calendarEvents")}</div>
                {dayData.calendarEvents.map(e => {
                  if (e.source === "home-idea") {
                    return <HomeIdeaNote key={e.id} event={e}
                      onEdit={(evt) => setEditHomeNote(evt)}
                      onDelete={(evt) => setConfirmDeleteNote(evt)}
                    />;
                  }
                  return (
                  <div key={e.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "8px 10px", background: C.surfaceAlt, borderRadius: 8, marginBottom: 4 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Ic n={e.type==="training"?"target":e.type==="battle"?"swords":e.type==="rest"?"pause":"mapPin"} s={14}/>
                        <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 11, color: C.text }}>
                          {e.title || t(e.type === "training" ? "trainingSession" : e.type === "battle" ? "battleEvent" : e.type === "rest" ? "restDay" : "journalEvent")}
                        </span>
                        {e.duration && (
                          <span style={{ fontSize: 10, color: C.textMuted }}>
                            {e.duration} {t("aboutXMin")}
                          </span>
                        )}
                      </div>
                      {e.categories?.length > 0 && (
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                          {e.categories.map(cat => (
                            <span key={cat} style={{ fontSize: 10, fontFamily: FONT_DISPLAY, fontWeight: 700,
                              color: catColors[cat] || CAT_COLORS[cat] || C.textSec,
                              background: (catColors[cat] || CAT_COLORS[cat] || C.accent) + "18",
                              borderRadius: 6, padding: "1px 6px" }}>
                              {cat}
                            </span>
                          ))}
                        </div>
                      )}
                      {e.notes && <div style={{ fontSize: 11, color: C.textSec, marginTop: 3 }}>{e.notes}</div>}
                      {e.eventLink && (
                        <a href={e.eventLink} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: 11, color: C.blue, marginTop: 3, display: "flex", alignItems: "center", gap: 4, textDecoration: "none" }}>
                          <Ic n="link" s={11} c={C.blue} />
                          {e.eventLink.length > 40 ? e.eventLink.slice(0, 40) + "…" : e.eventLink}
                        </a>
                      )}
                      {e.source && (
                        <div style={{ fontSize: 10, color: C.textMuted, marginTop: 3, fontFamily: FONT_DISPLAY,
                          fontWeight: 600, letterSpacing: 0.3, fontStyle: "italic" }}>
                          {e.source === "rep_counter" ? t("viaRepCounter") :
                           e.source === "sparring" ? t("viaSparring") :
                           e.source === "spar-1v1" ? t("via1v1Spar") :
                           e.source === "combo_machine" ? t("viaComboMachine") :
                           e.source === "lab" ? t("viaLab") :
                           e.source === "rrr" ? t("viaRRR") : ""}
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                      <button onClick={() => { setEditEvent(e); setShowJournal(true); }}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                        <Ic n="edit" s={14} c={C.textMuted} />
                      </button>
                      <button onClick={() => handleDeleteEvent(e.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                        <Ic n="trash" s={14} c={C.textMuted} />
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}

            {/* Moves Trained */}
            {dayData.movesTrained.length > 0 && (
              <div>
                <div style={sectionLabel}>{t("movesTrained")}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {dayData.movesTrained.map(m => {
                    const domainKey = CATEGORY_DOMAIN_MAP[m.category]?.primary;
                    const domainColor = domainKey ? DOMAIN_COLORS[domainKey] : null;
                    return (
                      <span key={m.id} style={{ display: "inline-flex", alignItems: "center", gap: 4,
                        fontSize: 11, fontFamily: FONT_BODY, color: C.text,
                        background: C.surfaceAlt, borderRadius: 8, padding: "3px 8px" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%",
                          background: catColors[m.category] || CAT_COLORS[m.category] || C.accent }} />
                        {domainColor && <span style={{ width: 4, height: 4, borderRadius: "50%",
                          background: domainColor, marginLeft: -2 }} />}
                        {m.name}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Rep Counter Sessions */}
            {dayData.repSessions.length > 0 && (
              <div>
                <div style={sectionLabel}>{t("repSession")}</div>
                {dayData.repSessions.map(r => (
                  <div key={r.id} style={{ fontSize: 11, color: C.textSec, padding: "3px 0" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <span style={{ color: C.text, fontWeight: 600 }}>{r.moveName}</span>
                      <span>{r.reps} reps</span>
                      {r.duration > 0 && <span>{Math.round(r.duration)}s</span>}
                    </div>
                    {r.reflection && (
                      <div style={{ fontSize: 11, color: C.textMuted, fontStyle: "italic", marginTop: 2 }}>
                        &quot;{r.reflection}&quot;
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Sparring Sessions */}
            {dayData.sparringSessions.length > 0 && (
              <div>
                <div style={sectionLabel}>{t("sparringSession")}</div>
                {dayData.sparringSessions.map(s => (
                  <div key={s.id} style={{ fontSize: 11, color: C.textSec, padding: "3px 0" }}>
                    <span style={{ color: C.text, fontWeight: 600 }}>
                      {s.roundLog?.length || 0} rounds
                    </span>
                    {s.notes && <span style={{ marginLeft: 8, fontStyle: "italic" }}>{s.notes}</span>}
                    {s.reflection && (
                      <div style={{ fontSize: 11, color: C.textMuted, fontStyle: "italic", marginTop: 2 }}>
                        &quot;{s.reflection}&quot;
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Music Flow Sessions */}
            {dayData.musicflowSessions.length > 0 && (
              <div>
                <div style={sectionLabel}>{t("musicFlow")}</div>
                {dayData.musicflowSessions.map(s => (
                  <div key={s.id} style={{ fontSize: 11, color: C.textSec, padding: "3px 0" }}>
                    <span style={{ color: C.text, fontWeight: 600 }}>
                      {Math.floor(s.duration / 60)}:{String(s.duration % 60).padStart(2, "0")}
                    </span>
                    <span style={{ marginLeft: 8 }}>Stage {s.stageReached}</span>
                    {s.reflection && (
                      <div style={{ fontSize: 11, color: C.textMuted, fontStyle: "italic", marginTop: 2 }}>
                        &quot;{s.reflection}&quot;
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Habits */}
            {dayData.habitsCompleted.length > 0 && (
              <div>
                <div style={sectionLabel}>{t("habitCompleted")}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {dayData.habitsCompleted.map(h => (
                    <span key={h.id} style={{ fontSize: 11, color: C.blue, background: C.blue + "14",
                      borderRadius: 8, padding: "3px 8px", fontWeight: 600 }}>
                      {h.name || h.text || "Habit"}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {dayData.notesOnDay.length > 0 && (
              <div>
                <div style={sectionLabel}>{t("noteCreated")}</div>
                {dayData.notesOnDay.map(n => (
                  <div key={n.id} style={{ fontSize: 11, color: C.textSec, padding: "3px 0" }}>
                    <span style={{ color: C.text, fontWeight: 600 }}>{n.text || n.title || "Note"}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Body Log */}
            {bodyLogData && (
              <div>
                <div style={sectionLabel}>{t("bodyLog")}</div>
                {/* Exertion */}
                {bodyLogData.sessions.filter(s => s.exertion).map((s, i) => {
                  const opt = EXERTION_OPTIONS.find(o => o.value === s.exertion);
                  return (
                    <div key={i} style={{ fontSize: 11, color: C.textSec, padding: "2px 0" }}>
                      {s.type}{s.label ? ` (${s.label})` : ""}: {opt?.emoji} {t(opt?.key || "")}
                    </div>
                  );
                })}
                {/* Body status */}
                {bodyLogData.worst && (
                  <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                    {BODY_PARTS.map(part => {
                      const val = bodyLogData.worst[part.field] || 0;
                      const state = BODY_STATES[val];
                      const dotColor = state ? C[state.color] : C.textMuted;
                      return (
                        <div key={part.field} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          <span style={{ fontSize: 14 }}>{part.emoji}</span>
                          <span style={{ width: 7, height: 7, borderRadius: "50%", background: dotColor }} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      </>}

      {/* Reports timeline */}
      {inline && calView === "reports" && (
        <ReportsTimeline
          moves={moves} reps={reps} sparring={sparring} musicflow={musicflow}
          calendar={calendar} cats={cats} catColors={catColors}
          battleprep={battleprep} rivals={null} reports={reports}
          onSelectDay={(dateStr) => { setCalView("days"); setSelectedDay(dateStr); setShowTypePicker(false); }}/>
      )}

      {/* Edit home-idea note */}
      {editHomeNote && (
        <BottomSheet open={true} onClose={() => setEditHomeNote(null)} title={t("editNote")}>
          <IdeaForm
            idea={editHomeNote}
            onSave={(fields) => {
              // Sync edit to ideas store (single source of truth)
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

      {/* Delete note confirmation modal */}
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
    </div>
  );
};
