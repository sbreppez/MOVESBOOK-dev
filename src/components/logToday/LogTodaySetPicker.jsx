import React, { useState, useMemo } from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { Ic } from '../shared/Ic';

export function LogTodaySetPicker({
  sets,
  selectedSetIds,
  onToggleSelection,
  onClose,
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const q = searchQuery.toLowerCase().trim();

  const filtered = useMemo(() => {
    if (!q) return sets;
    return sets.filter(s => (s.name || "").toLowerCase().includes(q));
  }, [sets, q]);

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
  const scrollBody = { flex: 1, overflowY: "auto", padding: "8px 16px 24px" };

  // ── Set row ───────────────────────────────────────────────────────────────
  const rowStyle = (setColor) => ({
    display: "flex", alignItems: "center", gap: 12,
    padding: "12px 12px 12px 14px",
    background: C.surface, borderRadius: 8,
    borderLeft: `4px solid ${setColor}`,
    marginBottom: 6, minHeight: 44, cursor: "pointer",
  });

  const checkbox = {
    width: 18, height: 18, borderRadius: 4, flexShrink: 0,
    border: `2px solid ${C.border}`, background: "transparent",
  };
  const checkboxSelected = {
    width: 18, height: 18, borderRadius: 4, flexShrink: 0,
    border: `2px solid ${C.accent}`, background: C.accent,
    display: "flex", alignItems: "center", justifyContent: "center",
  };

  // ── Empty state: no sets in library ───────────────────────────────────────
  if (sets.length === 0) {
    return (
      <div style={overlay}>
        <div style={header}>
          <span style={headerTitle}>ADD A SET</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <Ic n="x" s={18} c={C.textMuted} />
          </button>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
          <Ic n="lock" s={32} c={C.textMuted} />
          <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textMuted, marginTop: 12, textAlign: "center" }}>
            No sets yet. Create one in Sets first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={overlay}>
      {/* Header */}
      <div style={header}>
        <span style={headerTitle}>ADD A SET</span>
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
          placeholder="Search sets..."
          style={searchInput}
        />
      </div>

      {/* Scroll body */}
      <div style={scrollBody}>
        {filtered.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 20px" }}>
            <Ic n="search" s={32} c={C.textMuted} />
            <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textMuted, marginTop: 12, textAlign: "center" }}>
              No matching sets.
            </p>
          </div>
        ) : (
          filtered.map(set => {
            const isSelected = selectedSetIds.includes(set.id);
            const setColor = set.color || C.blue;
            const moveCount = (set.moveIds || []).length;
            return (
              <div
                key={set.id}
                onClick={() => onToggleSelection(set.id)}
                style={rowStyle(setColor)}
              >
                {isSelected ? (
                  <div style={checkboxSelected}>
                    <Ic n="check" s={12} c="#fff" />
                  </div>
                ) : (
                  <div style={checkbox} />
                )}
                <span style={{ flex: 1, fontSize: 13, fontFamily: FONT_BODY, color: C.text }}>
                  {set.name}
                </span>
                <span style={{ fontSize: 11, color: C.textMuted, fontStyle: "italic" }}>
                  {moveCount} moves
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default LogTodaySetPicker;
