import React, { useState } from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { Ic } from '../shared/Ic';

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

export function LogTodayTraining({ buckets, moves, sets, isPending, onToggleExclusion }) {
  if (!buckets) return null;

  const checkPending = isPending || (() => false);
  const makeXButton = (source, sourceId) =>
    onToggleExclusion
      ? <TileXButton onClick={() => onToggleExclusion(source, sourceId)} />
      : null;

  const sections = [
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
  ];

  let firstNonEmpty = true;
  return (
    <div>
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
  );
}

export default LogTodayTraining;
