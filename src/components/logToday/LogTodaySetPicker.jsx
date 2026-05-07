import React, { useState, useMemo } from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { useT } from '../../hooks/useTranslation';
import { Ic } from '../shared/Ic';

export function LogTodaySetPicker({
  sets = [],
  selectedSetIds = [],
  onToggleSelection,
  onClose,
}) {
  const t = useT();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sets;
    return sets.filter(s => (s.name || "").toLowerCase().includes(q));
  }, [sets, search]);

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
          {t("addASet")}
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
            placeholder={t("searchSets")}
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
        paddingBottom: 16, paddingTop: 8,
      }}>
        {!hasResults ? (
          <div style={{
            textAlign: "center", padding: 30,
            fontFamily: FONT_BODY, fontSize: 13, color: C.textMuted,
          }}>
            {t("noSetsMatch")}
          </div>
        ) : filtered.map(set => {
          const checked = selectedSetIds.includes(set.id);
          const moveCount = (set.moveIds || []).length;
          return (
            <button
              key={set.id}
              onClick={() => onToggleSelection?.(set.id)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                width: "calc(100% - 32px)", marginLeft: 16, marginRight: 16, marginBottom: 4,
                background: C.surface, borderRadius: 8,
                border: "none",
                padding: "10px 14px",
                cursor: "pointer", textAlign: "left",
              }}
            >
              <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{
                  fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 800,
                  letterSpacing: 1.2, textTransform: "uppercase", color: C.text,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {set.name}
                </span>
                <span style={{
                  fontFamily: FONT_BODY, fontSize: 11, color: C.textMuted,
                }}>
                  {moveCount} {t("moves").toLowerCase()}
                </span>
              </div>
              <span style={{
                width: 18, height: 18, borderRadius: 4,
                border: `2px solid ${checked ? C.accent : C.border}`,
                background: checked ? C.accent : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, marginLeft: 8,
              }}>
                {checked && <Ic n="check" s={12} c="#fff" />}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default LogTodaySetPicker;
