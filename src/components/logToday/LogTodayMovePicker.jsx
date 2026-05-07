import React, { useState, useMemo } from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { useT } from '../../hooks/useTranslation';
import { Ic } from '../shared/Ic';

export function LogTodayMovePicker({
  moves = [],
  cats = [],
  catColors = {},
  selectedMoveIds = [],
  onToggleSelection,
  onClose,
}) {
  const t = useT();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return moves;
    return moves.filter(m => (m.name || "").toLowerCase().includes(q));
  }, [moves, search]);

  const grouped = useMemo(() => {
    const out = {};
    cats.forEach(c => { out[c] = []; });
    filtered.forEach(m => {
      const cat = m.category || "Other";
      if (!out[cat]) out[cat] = [];
      out[cat].push(m);
    });
    return out;
  }, [filtered, cats]);

  const orderedCats = useMemo(() => {
    const seen = new Set();
    const result = [];
    cats.forEach(c => { if (grouped[c] && grouped[c].length > 0) { result.push(c); seen.add(c); } });
    Object.keys(grouped).forEach(c => { if (!seen.has(c) && grouped[c].length > 0) result.push(c); });
    return result;
  }, [grouped, cats]);

  const hasResults = filtered.length > 0;

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 600,
      background: C.bg, display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        flexShrink: 0,
        padding: "13px 18px",
        borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <button
          onClick={onClose}
          aria-label={t("close")}
          style={{
            background: "none", border: "none", cursor: "pointer", padding: 4,
            display: "flex", alignItems: "center",
          }}
        >
          <Ic n="chevL" s={20} c={C.textMuted} />
        </button>
        <span style={{
          fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 16,
          color: C.text, letterSpacing: 1, textTransform: "uppercase",
        }}>
          {t("addMoves")}
        </span>
      </div>

      {/* Search bar */}
      <div style={{ flexShrink: 0, padding: "8px 16px" }}>
        <div style={{
          display: "flex", alignItems: "center",
          background: C.surface, borderRadius: 8, padding: "5px 10px",
          gap: 6, border: `1px solid ${search ? C.accent : C.border}`,
        }}>
          <Ic n="search" s={14} c={C.textMuted} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t("searchMoves")}
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              fontSize: 13, color: C.text, fontFamily: FONT_BODY,
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              aria-label={t("close")}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex" }}
            >
              <Ic n="x" s={14} c={C.textMuted} />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable list */}
      <div style={{
        flex: 1, minHeight: 0,
        overflowY: "auto", WebkitOverflowScrolling: "touch",
        paddingBottom: 16,
      }}>
        {!hasResults ? (
          <div style={{
            textAlign: "center", padding: 30,
            fontFamily: FONT_BODY, fontSize: 13, color: C.textMuted,
          }}>
            {t("noMovesMatch")}
          </div>
        ) : orderedCats.map(cat => (
          <div key={cat}>
            <div style={{
              fontFamily: FONT_DISPLAY, fontSize: 10, fontWeight: 800,
              color: C.textMuted, letterSpacing: 1.5, textTransform: "uppercase",
              padding: "12px 16px 4px",
            }}>
              {cat}
            </div>
            {grouped[cat].map(move => {
              const checked = selectedMoveIds.includes(move.id);
              const stripeColor = catColors[move.category] || C.accent;
              return (
                <button
                  key={move.id}
                  onClick={() => onToggleSelection?.(move.id)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    width: "calc(100% - 32px)", marginLeft: 16, marginRight: 16, marginBottom: 4,
                    background: C.surface, borderRadius: 8,
                    borderLeft: `4px solid ${stripeColor}`,
                    border: "none",
                    padding: "10px 14px",
                    cursor: "pointer", textAlign: "left",
                  }}
                >
                  <span style={{
                    fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 800,
                    letterSpacing: 1.2, textTransform: "uppercase", color: C.text,
                    flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {move.name}
                  </span>
                  <span style={{
                    width: 18, height: 18, borderRadius: 4,
                    border: `2px solid ${checked ? C.accent : C.border}`,
                    background: checked ? C.accent : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    {checked && <Ic n="check" s={12} c="#fff" />}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default LogTodayMovePicker;
