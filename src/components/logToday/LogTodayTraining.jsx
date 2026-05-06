import React, { useState } from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { Ic } from '../shared/Ic';
import { Txtarea } from '../shared/Txtarea';
import { BottomSheet } from '../shared/BottomSheet';
import { LogTodayMovePicker } from './LogTodayMovePicker';
import { LogTodaySetPicker } from './LogTodaySetPicker';
import { todayLocal } from '../../utils/dateUtils';

function fmtDuration(totalSec) {
  if (!totalSec || totalSec < 0) return "0:00";
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

const tileStyle = {
  background: C.surface,
  borderRadius: 8,
  padding: "14px 40px 14px 16px",
  position: "relative",
};

const titleStyle = {
  fontSize: 16,
  fontFamily: FONT_DISPLAY,
  fontWeight: 800,
  color: C.text,
  textTransform: "uppercase",
  letterSpacing: 1.2,
  lineHeight: 1.2,
  display: "block",
};

const subtitleStyle = {
  fontSize: 13,
  fontFamily: FONT_BODY,
  fontWeight: 400,
  color: C.textMuted,
  marginTop: 4,
  display: "block",
};

const expansionItemStyle = {
  fontSize: 13,
  fontFamily: FONT_BODY,
  color: C.textSec,
  padding: "8px 0",
  borderTop: `1px solid ${C.borderLight}`,
};

const expansionContainerStyle = {
  marginTop: 8,
};

function TileXButton({ onClick }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      aria-label="Remove from log"
      style={{
        position: "absolute",
        top: 8,
        right: 8,
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 6,
        lineHeight: 0,
      }}
    >
      <Ic n="x" s={12} c={C.textMuted} />
    </button>
  );
}

function ChevronToggle({ expanded, onToggle }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "8px 0 0",
        display: "flex",
        alignItems: "center",
        gap: 6,
        width: "100%",
        textAlign: "left",
      }}
    >
      <Ic n={expanded ? "chevD" : "chevR"} s={12} c={C.textMuted} />
      <span style={{
        fontSize: 11,
        color: C.textMuted,
        fontFamily: FONT_DISPLAY,
        fontWeight: 700,
        letterSpacing: 1,
        textTransform: "uppercase",
      }}>
        {expanded ? "HIDE" : "SHOW"}
      </span>
    </button>
  );
}

function Section({ title, rows, isFirst, children }) {
  if (!rows || rows.length === 0) return null;
  return (
    <div style={{ marginTop: isFirst ? 0 : 21 }}>
      <div style={{
        fontSize: 10,
        fontFamily: FONT_DISPLAY,
        fontWeight: 800,
        color: C.textMuted,
        textTransform: "uppercase",
        letterSpacing: 1.5,
        marginBottom: 5,
      }}>
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {rows.map((row, i) => (
          <React.Fragment key={row.id ?? i}>
            {children(row, i)}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function DrillTile({ session, moves, pending, xButton }) {
  const name = session.moveName
    || moves?.find(m => m.id === session.moveId)?.name
    || "Move";
  return (
    <div style={{ ...tileStyle, opacity: pending ? 0.4 : 1 }}>
      {xButton}
      <span style={{ ...titleStyle, textDecoration: pending ? "line-through" : "none" }}>
        DRILL — {name}
      </span>
      <span style={subtitleStyle}>
        {session.reps} reps · {fmtDuration(session.duration)}
      </span>
    </div>
  );
}

function SparSoloTile({ session, moves, pending, xButton }) {
  const [expanded, setExpanded] = useState(false);
  const tagged = session.movesTrained || [];
  const hasExpansion = tagged.length > 0;
  const totalSec = (session.totalDuration || 0) / 1000;
  return (
    <div style={{ ...tileStyle, opacity: pending ? 0.4 : 1 }}>
      {xButton}
      <span style={{ ...titleStyle, textDecoration: pending ? "line-through" : "none" }}>
        SOLO SPAR
      </span>
      <span style={subtitleStyle}>
        {session.rounds} rounds · {fmtDuration(totalSec)}
      </span>
      {hasExpansion && (
        <ChevronToggle expanded={expanded} onToggle={() => setExpanded(x => !x)} />
      )}
      {expanded && hasExpansion && (
        <div style={expansionContainerStyle}>
          {tagged.map((mid, i) => {
            const name = moves?.find(m => m.id === mid)?.name || mid;
            return <div key={mid ?? i} style={expansionItemStyle}>{name}</div>;
          })}
        </div>
      )}
    </div>
  );
}

function Spar1v1Tile({ session, pending, xButton }) {
  const [expanded, setExpanded] = useState(false);
  const log = session.roundLog || [];
  const hasExpansion = log.length > 0;
  const opponent = session.opponent || "?";
  const loc = session.location ? ` · ${session.location}` : "";
  return (
    <div style={{ ...tileStyle, opacity: pending ? 0.4 : 1 }}>
      {xButton}
      <span style={{ ...titleStyle, textDecoration: pending ? "line-through" : "none" }}>
        1V1 SPAR — {opponent}
      </span>
      <span style={subtitleStyle}>
        {session.userRounds || 0}–{session.opponentRounds || 0}{loc}
      </span>
      {hasExpansion && (
        <ChevronToggle expanded={expanded} onToggle={() => setExpanded(x => !x)} />
      )}
      {expanded && hasExpansion && (
        <div style={expansionContainerStyle}>
          {log.map((r, i) => {
            const who = r.side === "user" ? "you" : opponent;
            return (
              <div key={i} style={expansionItemStyle}>
                Round {r.roundNumber ?? i + 1} — {who}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SetsPracticedTile({ event, sets, moves, pending, xButton }) {
  const [expanded, setExpanded] = useState(false);
  const set = event.setId ? sets?.find(s => s.id === event.setId) : null;
  const setName = set?.name || "SET UNKNOWN";
  const setMoveIds = set?.moveIds || [];
  const hasExpansion = !!set && setMoveIds.length > 0;
  const score = event.score || {};
  return (
    <div style={{ ...tileStyle, opacity: pending ? 0.4 : 1 }}>
      {xButton}
      <span style={{ ...titleStyle, textDecoration: pending ? "line-through" : "none" }}>
        {setName}
      </span>
      <span style={subtitleStyle}>
        {score.correct ?? 0}/{score.total ?? 0} correct ({score.percentage ?? 0}%)
      </span>
      {hasExpansion && (
        <ChevronToggle expanded={expanded} onToggle={() => setExpanded(x => !x)} />
      )}
      {expanded && hasExpansion && (
        <div style={expansionContainerStyle}>
          {setMoveIds.map((mid, i) => {
            const name = moves?.find(m => m.id === mid)?.name || mid;
            return <div key={mid ?? i} style={expansionItemStyle}>{name}</div>;
          })}
        </div>
      )}
    </div>
  );
}

function SavedCombosTile({ event, moves, pending, xButton }) {
  const [expanded, setExpanded] = useState(false);
  const moveIds = event.moveIds || [];
  const hasExpansion = moveIds.length > 0;
  return (
    <div style={{ ...tileStyle, opacity: pending ? 0.4 : 1 }}>
      {xButton}
      <span style={{ ...titleStyle, textDecoration: pending ? "line-through" : "none" }}>
        {event.title}
      </span>
      {event.notes && (
        <span style={{ ...subtitleStyle, whiteSpace: "normal" }}>{event.notes}</span>
      )}
      {hasExpansion && (
        <ChevronToggle expanded={expanded} onToggle={() => setExpanded(x => !x)} />
      )}
      {expanded && hasExpansion && (
        <div style={expansionContainerStyle}>
          {moveIds.map((mid, i) => {
            const name = moves?.find(m => m.id === mid)?.name || mid;
            return <div key={mid ?? i} style={expansionItemStyle}>{name}</div>;
          })}
        </div>
      )}
    </div>
  );
}

function FlowTile({ session, pending, xButton }) {
  const [expanded, setExpanded] = useState(false);
  const reflection = typeof session.reflection === "string" ? session.reflection.trim() : "";
  const hasExpansion = reflection.length > 0;
  return (
    <div style={{ ...tileStyle, opacity: pending ? 0.4 : 1 }}>
      {xButton}
      <span style={{ ...titleStyle, textDecoration: pending ? "line-through" : "none" }}>
        FLOW
      </span>
      <span style={subtitleStyle}>
        {fmtDuration(session.duration)} · Stage {session.stageReached ?? "—"} · {session.promptCount ?? 0} prompts
      </span>
      {hasExpansion && (
        <ChevronToggle expanded={expanded} onToggle={() => setExpanded(x => !x)} />
      )}
      {expanded && hasExpansion && (
        <div style={expansionContainerStyle}>
          <div style={{ ...expansionItemStyle, whiteSpace: "pre-wrap" }}>
            {reflection}
          </div>
        </div>
      )}
    </div>
  );
}

function MovesTrainedTile({ move, pending, xButton }) {
  return (
    <div style={{ ...tileStyle, opacity: pending ? 0.4 : 1 }}>
      {xButton}
      <span style={{ ...titleStyle, textDecoration: pending ? "line-through" : "none" }}>
        {move.name}
      </span>
      <span style={subtitleStyle}>{move.category}</span>
    </div>
  );
}

function ManualSessionTile({ event, pending, xButton }) {
  const [expanded, setExpanded] = useState(false);
  const notes = typeof event.notes === "string" ? event.notes.trim() : "";
  const hasExpansion = notes.length > 0;
  return (
    <div style={{ ...tileStyle, opacity: pending ? 0.4 : 1 }}>
      {xButton}
      <span style={{ ...titleStyle, textDecoration: pending ? "line-through" : "none" }}>
        {event.title}
      </span>
      {event.duration ? (
        <span style={subtitleStyle}>{event.duration} min</span>
      ) : null}
      {hasExpansion && (
        <ChevronToggle expanded={expanded} onToggle={() => setExpanded(x => !x)} />
      )}
      {expanded && hasExpansion && (
        <div style={expansionContainerStyle}>
          <div style={{ ...expansionItemStyle, whiteSpace: "pre-wrap" }}>
            {notes}
          </div>
        </div>
      )}
    </div>
  );
}

export function LogTodayTraining({
  buckets, moves, sets, isPending, onToggleExclusion,
  date, event, cats, catColors,
  addCalendarEvent, onUpdateCalendarEvent, markMoveTrainedToday,
  addToast, onClose,
}) {
  // ── Form-related styles (in-component so C tokens read fresh from the live
  //    palette — App.jsx mutates C in place on theme switch, but module-level
  //    style objects freeze to the palette at module-load time).
  const formSectionHeader = (isFirst) => ({
    fontSize: 10,
    fontFamily: FONT_DISPLAY,
    fontWeight: 800,
    color: C.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginTop: isFirst ? 0 : 21,
    marginBottom: 8,
  });

  const formInputStyle = {
    width: "100%",
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: "10px 12px",
    color: C.text,
    fontSize: 14,
    fontFamily: FONT_BODY,
    outline: "none",
    boxSizing: "border-box",
  };

  const numberInputStyle = {
    width: 64,
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: "10px 8px",
    color: C.text,
    fontSize: 14,
    fontFamily: FONT_BODY,
    outline: "none",
    textAlign: "center",
    boxSizing: "border-box",
  };

  const dashedButtonStyle = {
    width: "100%",
    background: "transparent",
    border: `1.5px dashed ${C.border}`,
    borderRadius: 8,
    padding: "10px 12px",
    color: C.accent,
    fontSize: 11,
    fontFamily: FONT_DISPLAY,
    fontWeight: 800,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    cursor: "pointer",
    textAlign: "left",
  };

  const primaryButtonStyle = {
    flex: 1,
    background: C.accent,
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "12px 16px",
    fontSize: 12,
    fontFamily: FONT_DISPLAY,
    fontWeight: 800,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    cursor: "pointer",
  };

  const secondaryButtonStyle = {
    flex: 1,
    background: "transparent",
    color: C.textSec,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: "12px 16px",
    fontSize: 12,
    fontFamily: FONT_DISPLAY,
    fontWeight: 800,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    cursor: "pointer",
  };

  const isEdit = !!event?.id;

  // ── Form state (modal-local, batched on Save) ──────────────────────────────
  const [title, setTitle] = useState(event?.title || "");
  const [pendingMoveIds, setPendingMoveIds] = useState(event?.moveIds || []);
  const [pendingSetIds, setPendingSetIds] = useState(event?.setIds || []);
  const [workDescription, setWorkDescription] = useState(event?.workDescription || "");
  const [howItFelt, setHowItFelt] = useState(event?.howItFelt || "");
  const [durationH, setDurationH] = useState(
    event?.duration ? String(Math.floor(event.duration / 60)) : ""
  );
  const [durationM, setDurationM] = useState(
    event?.duration ? String(event.duration % 60) : ""
  );
  const [location, setLocation] = useState(event?.location || "");
  const [videoLink, setVideoLink] = useState(event?.videoLink || "");
  const [videoLinkOpen, setVideoLinkOpen] = useState(!!event?.videoLink);
  const [notes, setNotes] = useState(event?.notes || "");
  const [chooserOpen, setChooserOpen] = useState(false);
  const [movePickerOpen, setMovePickerOpen] = useState(false);
  const [setPickerOpen, setSetPickerOpen] = useState(false);

  // ── Live summary line (resolves names defensively) ─────────────────────────
  const moveSummaryNames = pendingMoveIds
    .map(id => moves?.find(m => m.id === id)?.name)
    .filter(Boolean);
  const setSummaryNames = pendingSetIds
    .map(id => sets?.find(s => s.id === id)?.name)
    .filter(Boolean);
  const summaryParts = [];
  if (moveSummaryNames.length > 0) summaryParts.push(`Moves: ${moveSummaryNames.join(", ")}.`);
  if (setSummaryNames.length > 0) summaryParts.push(`Sets: ${setSummaryNames.join(", ")}.`);
  const summaryLine = summaryParts.length > 0 ? `Trained today: ${summaryParts.join(" ")}` : null;

  // ── Picker selection togglers ──────────────────────────────────────────────
  const toggleMoveSelection = (moveId) => {
    setPendingMoveIds(prev =>
      prev.includes(moveId) ? prev.filter(x => x !== moveId) : [...prev, moveId]
    );
  };
  const toggleSetSelection = (setId) => {
    setPendingSetIds(prev =>
      prev.includes(setId) ? prev.filter(x => x !== setId) : [...prev, setId]
    );
  };

  // ── Save handler ───────────────────────────────────────────────────────────
  const handleSave = () => {
    const h = parseInt(durationH, 10) || 0;
    const m = parseInt(durationM, 10) || 0;
    const totalDuration = h * 60 + m;

    const movesFromSets = pendingSetIds.flatMap(sid => {
      const s = sets?.find(x => x.id === sid);
      return s?.moveIds || [];
    });
    const allMoveIdsToMark = [...new Set([...pendingMoveIds, ...movesFromSets])];

    const record = {
      ...(event || {}),
      id: event?.id ?? Date.now(),
      date,
      type: "training",
      source: "log_today",
      title: title.trim() || "Training session",
      moveIds: allMoveIdsToMark,
      setIds: pendingSetIds,
      workDescription: workDescription.trim(),
      howItFelt: howItFelt.trim(),
      duration: totalDuration > 0 ? totalDuration : null,
      location: location.trim(),
      videoLink: videoLink.trim() || null,
      notes: notes.trim(),
    };

    if (isEdit) {
      onUpdateCalendarEvent(record);
    } else {
      addCalendarEvent(record, { silent: true, skipDedup: true });
    }

    if (markMoveTrainedToday) {
      allMoveIdsToMark.forEach(id => markMoveTrainedToday(id));
    }

    if (addToast) {
      addToast({
        icon: "check",
        title: isEdit ? "Session updated" : "Session logged",
      });
    }

    if (onClose) onClose();
  };

  const handleCancel = () => {
    if (onClose) onClose();
  };

  // ── Auto-capture buckets section (existing logic, now optional) ────────────
  const checkPending = isPending || (() => false);
  const makeXButton = (source, sourceId) =>
    onToggleExclusion
      ? <TileXButton onClick={() => onToggleExclusion(source, sourceId)} />
      : null;

  const sections = buckets ? [
    {
      title: "DRILL",
      rows: buckets.drillSessions,
      render: (s) => (
        <DrillTile
          session={s}
          moves={moves}
          pending={checkPending("rep_counter", s.id)}
          xButton={makeXButton("rep_counter", s.id)}
        />
      ),
    },
    {
      title: "SOLO SPAR",
      rows: buckets.sparSoloSessions,
      render: (s) => (
        <SparSoloTile
          session={s}
          moves={moves}
          pending={checkPending("sparring", s.id)}
          xButton={makeXButton("sparring", s.id)}
        />
      ),
    },
    {
      title: "1V1 SPAR",
      rows: buckets.sparOneVoneSessions,
      render: (s) => (
        <Spar1v1Tile
          session={s}
          pending={checkPending("spar-1v1", s.id)}
          xButton={makeXButton("spar-1v1", s.id)}
        />
      ),
    },
    {
      title: "SETS PRACTICED",
      rows: buckets.setsPracticed,
      render: (e) => (
        <SetsPracticedTile
          event={e}
          sets={sets}
          moves={moves}
          pending={checkPending("flashcards", e.id)}
          xButton={makeXButton("flashcards", e.id)}
        />
      ),
    },
    {
      title: "SAVED COMBOS",
      rows: buckets.savedCombos,
      render: (e) => (
        <SavedCombosTile
          event={e}
          moves={moves}
          pending={checkPending("combo_machine", e.id)}
          xButton={makeXButton("combo_machine", e.id)}
        />
      ),
    },
    {
      title: "FLOW",
      rows: buckets.flowSessions,
      render: (s) => (
        <FlowTile
          session={s}
          pending={checkPending("musicflow", s.id)}
          xButton={makeXButton("musicflow", s.id)}
        />
      ),
    },
    {
      title: "MOVES TRAINED",
      rows: buckets.movesTrained,
      render: (m) => (
        <MovesTrainedTile
          move={m}
          pending={checkPending("movesTrained", m.id)}
          xButton={makeXButton("movesTrained", m.id)}
        />
      ),
    },
    {
      title: "MANUAL SESSIONS",
      rows: buckets.manualSessions,
      render: (e) => (
        <ManualSessionTile
          event={e}
          pending={checkPending("manual", e.id)}
          xButton={makeXButton("manual", e.id)}
        />
      ),
    },
  ] : null;

  let firstNonEmpty = true;
  const hasSelection = pendingMoveIds.length > 0 || pendingSetIds.length > 0;

  return (
    <div style={{ position: "relative", padding: "16px 16px 24px", overflow: "hidden" }}>
      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Session title (optional)"
        style={{ ...formInputStyle, fontWeight: 700, fontSize: 16, marginBottom: 8 }}
      />

      {/* WHAT I WORKED ON */}
      <div style={{ ...formSectionHeader(true), display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span>What I worked on</span>
        <button
          onClick={() => setChooserOpen(true)}
          aria-label="Add moves or a set"
          style={{
            background: "none", border: "none", cursor: "pointer",
            padding: 4, display: "flex", alignItems: "center",
          }}
        >
          <Ic n="plus" s={14} c={C.accent} />
        </button>
      </div>
      {summaryLine && (
        <div style={{
          fontSize: 13, fontFamily: FONT_BODY, color: C.textSec,
          lineHeight: 1.5, marginBottom: 13,
        }}>
          {summaryLine}
        </div>
      )}
      <Txtarea
        value={workDescription}
        onChange={setWorkDescription}
        placeholder="Anything else..."
        rows={2}
        autoExpand
      />

      {/* HOW IT FELT */}
      <div style={formSectionHeader(false)}>How it felt</div>
      <Txtarea
        value={howItFelt}
        onChange={setHowItFelt}
        placeholder="How did it feel? (optional)"
        rows={3}
        autoExpand
      />

      {/* DURATION */}
      <div style={formSectionHeader(false)}>Duration</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={durationH}
          onChange={e => setDurationH(e.target.value)}
          placeholder="HH"
          style={numberInputStyle}
        />
        <span style={{ color: C.textMuted, fontSize: 18, fontWeight: 700 }}>:</span>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={59}
          value={durationM}
          onChange={e => setDurationM(e.target.value)}
          placeholder="MM"
          style={numberInputStyle}
        />
      </div>

      {/* LOCATION */}
      <div style={formSectionHeader(false)}>Location</div>
      <div style={{ marginBottom: 14 }}>
        <input
          type="text"
          value={location}
          onChange={e => setLocation(e.target.value)}
          placeholder="Where? (optional)"
          style={formInputStyle}
        />
      </div>

      {/* VIDEO LINK */}
      <div style={formSectionHeader(false)}>Video link</div>
      {videoLinkOpen ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <input
            type="url"
            value={videoLink}
            onChange={e => setVideoLink(e.target.value)}
            placeholder="https://..."
            style={{ ...formInputStyle, flex: 1 }}
          />
          <button
            onClick={() => { setVideoLink(""); setVideoLinkOpen(false); }}
            aria-label="Remove video link"
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: 6, display: "flex", alignItems: "center",
            }}
          >
            <Ic n="x" s={16} c={C.textMuted} />
          </button>
        </div>
      ) : (
        <button onClick={() => setVideoLinkOpen(true)} style={{ ...dashedButtonStyle, marginBottom: 14 }}>
          + Add video link
        </button>
      )}

      {/* TODAY'S NOTE */}
      <div style={formSectionHeader(false)}>Today's note</div>
      <Txtarea
        value={notes}
        onChange={setNotes}
        placeholder="Anything to remember about today?"
        rows={3}
        autoExpand
      />

      {/* Save / Cancel */}
      <div style={{ display: "flex", gap: 10, marginTop: 21, marginBottom: 8 }}>
        <button onClick={handleCancel} style={secondaryButtonStyle}>
          Cancel
        </button>
        <button onClick={handleSave} style={primaryButtonStyle}>
          {isEdit ? "Update" : "Save"}
        </button>
      </div>

      {/* Auto-capture buckets (only when buckets prop is provided) */}
      {sections && (
        <div style={{ marginTop: 28, paddingTop: 21, borderTop: `1px solid ${C.borderLight}` }}>
          {sections.map(({ title, rows, render }) => {
            if (!rows || rows.length === 0) return null;
            const isFirst = firstNonEmpty;
            firstNonEmpty = false;
            return (
              <Section key={title} title={title} rows={rows} isFirst={isFirst}>
                {render}
              </Section>
            );
          })}
        </div>
      )}

      {/* Chooser sheet — opened by the + button */}
      <BottomSheet
        open={chooserOpen}
        onClose={() => setChooserOpen(false)}
        title="Add to today"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <button
            onClick={() => { setChooserOpen(false); setMovePickerOpen(true); }}
            style={{
              display: "flex", alignItems: "center", gap: 12, width: "100%",
              padding: "14px 16px", borderRadius: 8, cursor: "pointer",
              background: C.surfaceAlt || C.surface, border: "none", textAlign: "left",
            }}
          >
            <Ic n="plus" s={18} c={C.textSec} />
            <span style={{ fontSize: 14, fontFamily: FONT_DISPLAY, fontWeight: 700, color: C.text }}>
              Add moves
            </span>
          </button>
          <button
            onClick={() => { setChooserOpen(false); setSetPickerOpen(true); }}
            style={{
              display: "flex", alignItems: "center", gap: 12, width: "100%",
              padding: "14px 16px", borderRadius: 8, cursor: "pointer",
              background: C.surfaceAlt || C.surface, border: "none", textAlign: "left",
            }}
          >
            <Ic n="plus" s={18} c={C.textSec} />
            <span style={{ fontSize: 14, fontFamily: FONT_DISPLAY, fontWeight: 700, color: C.text }}>
              Add a set
            </span>
          </button>
        </div>
      </BottomSheet>

      {/* Move picker overlay */}
      {movePickerOpen && (
        <LogTodayMovePicker
          moves={moves || []}
          cats={cats || []}
          catColors={catColors || {}}
          buckets={buckets}
          selectedMoveIds={pendingMoveIds}
          onToggleSelection={toggleMoveSelection}
          addToast={addToast || (() => {})}
          onClose={() => setMovePickerOpen(false)}
        />
      )}

      {/* Set picker overlay */}
      {setPickerOpen && (
        <LogTodaySetPicker
          sets={sets || []}
          selectedSetIds={pendingSetIds}
          onToggleSelection={toggleSetSelection}
          onClose={() => setSetPickerOpen(false)}
        />
      )}
    </div>
  );
}

export default LogTodayTraining;
