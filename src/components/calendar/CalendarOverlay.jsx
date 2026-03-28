import React, { useState, useMemo, useCallback } from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { CAT_COLORS } from '../../constants/categories';
import { useT } from '../../hooks/useTranslation';
import { Ic } from '../shared/Ic';
import { EXERTION_OPTIONS, BODY_PARTS, BODY_STATES } from '../shared/BodyCheckIn';
import { SessionJournal } from './SessionJournal';

const toYMD = (d) => {
  if (!d) return null;
  if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  try { return new Date(d).toISOString().split("T")[0]; } catch { return null; }
};

const MONTH_KEYS = ["january","february","march","april","may","june","july","august","september","october","november","december"];
const DAY_KEYS = ["sunS","monS","tueS","wedS","thuS","friS","satS"];

export const CalendarOverlay = ({
  moves, setMoves, reps, sparring, musicflow, habits, ideas,
  calendar, setCalendar,
  cats, catColors, settings, onSettingsChange,
  addToast, initialDay,
  onClose,
}) => {
  const t = useT();
  const today = new Date().toISOString().split("T")[0];

  const [viewDate, setViewDate] = useState(() => {
    if (initialDay) return new Date(initialDay + "T00:00:00");
    return new Date();
  });
  const [selectedDay, setSelectedDay] = useState(initialDay || today);
  const [showJournal, setShowJournal] = useState(!!initialDay);
  const [editEvent, setEditEvent] = useState(null);
  const [showTypePicker, setShowTypePicker] = useState(false);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

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
    (habits || []).forEach(h => (h.checkIns || []).forEach(d => mark(d, "habits")));
    (ideas || []).forEach(i => (i.journal || []).forEach(j => mark(j.date, "notes")));
    (calendar?.events || []).forEach(e => {
      if (e.type === "training") mark(e.date, "moves");
      else mark(e.date, "notes");
    });
    return map;
  }, [moves, reps, sparring, habits, ideas, calendar]);

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
    addToast({ emoji: "✅", title: t("sessionLogged"), msg: "" });
  }, [setCalendar, setMoves, addToast, t]);

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
      <div style={{ position: "absolute", inset: 0, zIndex: 500, background: C.bg, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <SessionJournal
          date={editEvent?.date || selectedDay || today}
          event={editEvent?.id ? editEvent : null}
          moves={moves}
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

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 500, background: C.bg, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "13px 18px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 16, color: C.text, letterSpacing: 1 }}>
          {t("calendar")}
        </span>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}>
          <Ic n="x" s={20} c={C.textMuted} />
        </button>
      </div>

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

            return (
              <button
                key={dateStr}
                onClick={() => {
                  setSelectedDay(selectedDay === dateStr ? null : dateStr);
                  setShowTypePicker(false);
                }}
                style={{
                  background: isSelected ? C.accent + "22" : hasActivity ? C.surfaceAlt : "transparent",
                  border: isToday ? `2px solid ${C.accent}` : isSelected ? `1.5px solid ${C.accent}` : "1.5px solid transparent",
                  borderRadius: 8,
                  padding: "8px 2px 4px",
                  cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center",
                  minHeight: 44,
                  transition: "all 0.12s",
                }}
              >
                <span style={{
                  fontFamily: FONT_DISPLAY, fontWeight: isToday ? 900 : 600,
                  fontSize: 13, color: isToday ? C.accent : C.text, lineHeight: 1,
                }}>
                  {dayNum}
                </span>
                {dots.length > 0 && (
                  <div style={{ display: "flex", gap: 3, marginTop: 4 }}>
                    {dots.slice(0, 4).map((color, di) => (
                      <div key={di} style={{ width: 5, height: 5, borderRadius: "50%", background: color }} />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Day detail panel */}
        {selectedDay && dayData && (
          <div style={{ marginTop: 12, background: C.surface, borderRadius: 14, padding: 14,
            border: `1px solid ${C.border}` }}>
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

            {/* Type picker dropdown */}
            {showTypePicker && (
              <div style={{ background: C.surfaceAlt, borderRadius: 10, padding: 6, marginBottom: 8,
                border: `1px solid ${C.border}` }}>
                {[
                  { type: "training", emoji: "🎯", label: t("training") },
                  { type: "battle", emoji: "⚔️", label: t("battleEvent") },
                  { type: "rest", emoji: "😴", label: t("restDay") },
                  { type: "journal", emoji: "📌", label: t("journalEvent") },
                ].map(opt => (
                  <button key={opt.type} onClick={() => openNewEvent(opt.type)}
                    style={{ width: "100%", padding: "10px 12px", background: "none", border: "none",
                      cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
                      color: C.text, fontSize: 13, fontFamily: FONT_DISPLAY, fontWeight: 700,
                      letterSpacing: 0.5, borderRadius: 8 }}>
                    <span style={{ fontSize: 16 }}>{opt.emoji}</span>{opt.label}
                  </button>
                ))}
              </div>
            )}

            {/* No activity */}
            {dayData.movesTrained.length === 0 && dayData.repSessions.length === 0 &&
             dayData.sparringSessions.length === 0 && dayData.musicflowSessions.length === 0 &&
             dayData.habitsCompleted.length === 0 &&
             dayData.notesOnDay.length === 0 && dayData.calendarEvents.length === 0 && (
              <div style={{ color: C.textMuted, fontSize: 12, fontFamily: FONT_BODY, padding: "12px 0", textAlign: "center" }}>
                {t("noActivity")}
              </div>
            )}

            {/* Calendar Events */}
            {dayData.calendarEvents.length > 0 && (
              <div>
                <div style={sectionLabel}>{t("calendarEvents")}</div>
                {dayData.calendarEvents.map(e => (
                  <div key={e.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "8px 10px", background: C.surfaceAlt, borderRadius: 10, marginBottom: 4 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 14 }}>
                          {e.type === "training" ? "🎯" : e.type === "battle" ? "⚔️" : e.type === "rest" ? "😴" : "📌"}
                        </span>
                        <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 12, color: C.text }}>
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
                            <span key={cat} style={{ fontSize: 9, fontFamily: FONT_DISPLAY, fontWeight: 700,
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
                ))}
              </div>
            )}

            {/* Moves Trained */}
            {dayData.movesTrained.length > 0 && (
              <div>
                <div style={sectionLabel}>{t("movesTrained")}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {dayData.movesTrained.map(m => (
                    <span key={m.id} style={{ display: "inline-flex", alignItems: "center", gap: 4,
                      fontSize: 11, fontFamily: FONT_BODY, color: C.text,
                      background: C.surfaceAlt, borderRadius: 8, padding: "3px 8px" }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%",
                        background: catColors[m.category] || CAT_COLORS[m.category] || C.accent }} />
                      {m.name}
                    </span>
                  ))}
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
                        "{r.reflection}"
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
                        "{s.reflection}"
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
                        "{s.reflection}"
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
    </div>
  );
};
