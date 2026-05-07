import React, { useState, useMemo } from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { Ic } from '../shared/Ic';

function deriveSourceMap(buckets) {
  const m = new Map();
  if (!buckets) return m;
  buckets.drillSessions.forEach(s => {
    if (s.moveId) m.set(s.moveId, "Drill");
  });
  buckets.sparSoloSessions.forEach(s => {
    (s.movesTrained || []).forEach(id => {
      if (!m.has(id)) m.set(id, "Spar Solo");
    });
  });
  buckets.savedCombos.forEach(e => {
    (e.moveIds || []).forEach(id => {
      if (!m.has(id)) m.set(id, "Combine");
    });
  });
  buckets.setsPracticed.forEach(e => {
    (e.moveIds || []).forEach(id => {
      if (!m.has(id)) m.set(id, "FlashCards");
    });
  });
  buckets.movesTrained.forEach(mv => {
    if (!m.has(mv.id)) m.set(mv.id, null);
  });
  return m;
}

export function LogTodayMovePicker({
  moves,
  cats,
  catColors,
  buckets,
  onToggleTrainedToday,
  addToast,
  onClose,
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const sourceMap = useMemo(() => deriveSourceMap(buckets), [buckets]);

  const q = searchQuery.toLowerCase().trim();

  const filtered = useMemo(() => {
    if (!q) return moves;
    return moves.filter(m => m.name.toLowerCase().includes(q));
  }, [moves, q]);

  const handleRowTap = (move) => {
    const sourceName = sourceMap.get(move.id);
    if (sourceName !== undefined) {
      addToast({
        icon: "info",
        title: sourceName
          ? `Already in your log via ${sourceName}`
          : "Already in your log",
      });
      return;
    }
    onToggleTrainedToday(move.id);
  };

  // ── Container ──────────────────────────────────────────────────────────────
  const overlay = {
    position: "absolute", inset: 0, zIndex: 600, background: C.bg,
    display: "flex", flexDirection: "column", overflow: "hidden",
  };

  // ── Header ─────────────────────────────────────────────────────────────────
  const header = {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "12px 14px 8px", flexShrink: 0,
  };
  const headerTitle = {
    fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 16,
    letterSpacing: 2, color: C.text, textTransform: "uppercase",
  };

  // ── Search bar ─────────────────────────────────────────────────────────────
  const searchBar = {
    padding: "10px 14px 8px", background: C.bg, flexShrink: 0,
    display: "flex", alignItems: "center", gap: 8,
    borderBottom: `1px solid ${C.border}`,
  };
  const searchInput = {
    background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 8, padding: "9px 12px", fontSize: 14,
    fontFamily: FONT_BODY, color: C.text, outline: "none", flex: 1,
  };

  // ── Scroll body ────────────────────────────────────────────────────────────
  const scrollBody = { flex: 1, overflowY: "auto", padding: "0 16px 24px" };

  // ── Category header ────────────────────────────────────────────────────────
  const catHeader = (isFirst) => ({
    fontSize: 10, fontFamily: FONT_DISPLAY, fontWeight: 800,
    letterSpacing: 1.5, color: C.textMuted, textTransform: "uppercase",
    marginTop: isFirst ? 8 : 21, marginBottom: 5,
  });

  // ── Move row ───────────────────────────────────────────────────────────────
  const rowStyle = (catColor) => ({
    display: "flex", alignItems: "center", gap: 12,
    padding: "12px 12px 12px 14px",
    background: C.surface, borderRadius: 8,
    borderLeft: `4px solid ${catColor}`,
    marginBottom: 6, minHeight: 44, cursor: "pointer",
  });

  const checkbox = {
    width: 18, height: 18, borderRadius: 4, flexShrink: 0,
    border: `2px solid ${C.border}`, background: "transparent",
  };

  // ── Empty state: no moves in library ──────────────────────────────────────
  if (moves.length === 0) {
    return (
      <div style={overlay}>
        <div style={header}>
          <span style={headerTitle}>ADD A MOVE</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <Ic n="x" s={18} c={C.textMuted} />
          </button>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
          <Ic n="lock" s={32} c={C.textMuted} />
          <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textMuted, marginTop: 12, textAlign: "center" }}>
            Your move library is empty. Add moves first.
          </p>
        </div>
      </div>
    );
  }

  // ── Group filtered moves by category ──────────────────────────────────────
  const grouped = cats
    .map(cat => ({
      cat,
      color: catColors[cat] || C.textMuted,
      moves: filtered.filter(m => m.category === cat),
    }))
    .filter(g => g.moves.length > 0);

  // Also catch moves whose category isn't in cats (data edge case)
  const knownCats = new Set(cats);
  const uncategorized = filtered.filter(m => !knownCats.has(m.category));
  if (uncategorized.length > 0) {
    grouped.push({ cat: "Other", color: C.textMuted, moves: uncategorized });
  }

  return (
    <div style={overlay}>
      {/* Header */}
      <div style={header}>
        <span style={headerTitle}>ADD A MOVE</span>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
          <Ic n="x" s={18} c={C.textMuted} />
        </button>
      </div>

      {/* Search bar */}
      <div style={searchBar}>
        <Ic n="search" s={14} c={C.textMuted} />
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search moves..."
          style={searchInput}
        />
      </div>

      {/* Scroll body */}
      <div style={scrollBody}>
        {grouped.length === 0 ? (
          /* Empty search state */
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 20px" }}>
            <Ic n="search" s={32} c={C.textMuted} />
            <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textMuted, marginTop: 12, textAlign: "center" }}>
              No moves match your search.
            </p>
          </div>
        ) : (
          grouped.map((group, gi) => (
            <div key={group.cat}>
              <div style={catHeader(gi === 0)}>{group.cat}</div>
              {group.moves.map(move => {
                const sourceName = sourceMap.get(move.id);
                const locked = sourceName !== undefined;
                return (
                  <div
                    key={move.id}
                    onClick={() => handleRowTap(move)}
                    style={rowStyle(group.color)}
                  >
                    {locked ? (
                      <Ic n="lock" s={18} c={C.textMuted} />
                    ) : (
                      <div style={checkbox} />
                    )}
                    <span style={{ flex: 1, fontSize: 13, fontFamily: FONT_BODY, color: C.text }}>
                      {move.name}
                    </span>
                    {locked && (
                      <span style={{ fontSize: 11, color: C.textMuted, fontStyle: "italic" }}>
                        {sourceName ? `· in log via ${sourceName}` : "· in log"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default LogTodayMovePicker;
