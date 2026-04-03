import React, { useState, useMemo, useRef, useCallback } from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { Ic } from '../shared/Ic';
import { useT } from '../../hooks/useTranslation';

const DEFAULT_TRANSITIONS = ["Thread","Jump","Counter Spin","Slide","Sweep","Touch Foot","Kick","Hop","Roll","Twist","Drop","Spin Through"];

const STATES = [null, "works", "interesting", "explore", "doesntWork"];
const STATE_ICONS = { works: "\u2705", interesting: "\u2b50", explore: "\ud83d\udd0d", doesntWork: "\u274c" };
const STATE_COLORS = (C) => ({
  works: C.green,
  interesting: C.yellow,
  explore: C.blue,
  doesntWork: `${C.red}66`,
});

const abbrev = (s, n = 7) => s.length <= n ? s : s.slice(0, n) + "\u2026";

// ── Main Component ──────────────────────────────────────────────────────────
export const FlowMap = ({ moves, cats, catColors, flowmap, onFlowmapChange, combos, onSaveMove, onSaveSet, addToast, onClose }) => {
  const t = useT();

  const [screen, setScreen] = useState("home");
  const [gridMoves, setGridMoves] = useState({ rows: [], cols: [], mode: null });
  const [viewMode, setViewMode] = useState("icons"); // icons | heat
  const [detailPair, setDetailPair] = useState(null);

  // Between categories picker state
  const [betweenStep, setBetweenStep] = useState(1);
  const [rowCat, setRowCat] = useState(null);

  // Custom picker state
  const [customSelected, setCustomSelected] = useState([]);

  const pairings = flowmap.pairings || {};
  const transitions = combos?.transitions?.length ? combos.transitions : DEFAULT_TRANSITIONS;

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const counts = { works: 0, interesting: 0, explore: 0, doesntWork: 0 };
    Object.values(pairings).forEach(p => { if (p.state && counts[p.state] !== undefined) counts[p.state]++; });
    return counts;
  }, [pairings]);

  const totalEvaluated = stats.works + stats.interesting + stats.explore + stats.doesntWork;

  // ── Unexplored pairings ───────────────────────────────────────────────────
  const unexplored = useMemo(() => {
    const pairs = [];
    for (let i = 0; i < moves.length && pairs.length < 20; i++) {
      for (let j = 0; j < moves.length && pairs.length < 20; j++) {
        if (i === j) continue;
        const key = `${moves[i].id}\u2192${moves[j].id}`;
        if (!pairings[key]) pairs.push({ a: moves[i], b: moves[j], key });
      }
    }
    return pairs.slice(0, 5);
  }, [moves, pairings]);

  // ── Categories with move counts ───────────────────────────────────────────
  const catMoveCounts = useMemo(() => {
    const map = {};
    moves.forEach(m => { map[m.category] = (map[m.category] || 0) + 1; });
    return map;
  }, [moves]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getPairing = (aId, bId) => pairings[`${aId}\u2192${bId}`] || {};

  const setPairing = useCallback((aId, bId, update) => {
    const key = `${aId}\u2192${bId}`;
    onFlowmapChange(prev => ({
      ...prev,
      pairings: {
        ...(prev.pairings || {}),
        [key]: { ...(prev.pairings?.[key] || {}), ...update, date: new Date().toISOString().split("T")[0] }
      }
    }));
  }, [onFlowmapChange]);

  const cycleState = useCallback((aId, bId) => {
    const cur = getPairing(aId, bId).state || null;
    const idx = STATES.indexOf(cur);
    const next = STATES[(idx + 1) % STATES.length];
    setPairing(aId, bId, { state: next });
  }, [pairings, setPairing]);

  // ── Open grid ─────────────────────────────────────────────────────────────
  const openWithin = (cat) => {
    const catMoves = moves.filter(m => m.category === cat);
    if (catMoves.length < 2) { addToast(t("noMovesInCategory")); return; }
    setGridMoves({ rows: catMoves, cols: catMoves, mode: "within" });
    setScreen("grid");
  };

  const openBetween = (catA, catB) => {
    const rowMoves = moves.filter(m => m.category === catA);
    const colMoves = moves.filter(m => m.category === catB);
    if (rowMoves.length < 1 || colMoves.length < 1) { addToast(t("noMovesInCategory")); return; }
    setGridMoves({ rows: rowMoves, cols: colMoves, mode: "between" });
    setScreen("grid");
  };

  const openCustom = () => {
    const selected = moves.filter(m => customSelected.includes(m.id));
    if (selected.length < 2) return;
    setGridMoves({ rows: selected, cols: selected, mode: "custom" });
    setScreen("grid");
  };

  // ── Shared styles ─────────────────────────────────────────────────────────
  const overlay = { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: C.bg, zIndex: 500, display: "flex", flexDirection: "column", overflow: "hidden" };
  const headerBar = { display: "flex", alignItems: "center", padding: "12px 16px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 };
  const scrollArea = { flex: 1, overflowY: "auto", padding: "16px", WebkitOverflowScrolling: "touch" };
  const cardStyle = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px", marginBottom: 12, cursor: "pointer" };
  const chipStyle = (active) => ({
    display: "inline-block", padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${active ? C.accent : C.border}`,
    background: active ? `${C.accent}20` : C.surface, color: active ? C.accent : C.text, fontSize: 13, fontFamily: FONT_BODY,
    cursor: "pointer", marginRight: 8, marginBottom: 8, fontWeight: active ? 700 : 400
  });
  const btnPrimary = { background: C.accent, color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", fontSize: 14, fontFamily: FONT_DISPLAY, fontWeight: 700, letterSpacing: 1, cursor: "pointer", textAlign: "center" };

  // ── HEADER ────────────────────────────────────────────────────────────────
  const Header = ({ title, onBack }) => (
    <div style={headerBar}>
      <div onClick={onBack} style={{ cursor: "pointer", padding: 4, marginRight: 12 }}>
        <Ic name="x" size={22} color={C.text} />
      </div>
      <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 18, letterSpacing: 1, color: C.text }}>{title}</span>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // HOME SCREEN
  // ════════════════════════════════════════════════════════════════════════════
  if (screen === "home") {
    const stColors = STATE_COLORS(C);
    return (
      <div style={overlay}>
        <Header title={t("flowMap")} onBack={onClose} />
        <div style={scrollArea}>
          {/* Subtitle */}
          <p style={{ color: C.textSec, fontSize: 13, marginTop: 0, marginBottom: 16 }}>{t("flowMapDesc")}</p>

          {/* Stats banner */}
          {totalEvaluated > 0 && (
            <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
              {[["works", stColors.works], ["interesting", stColors.interesting], ["explore", stColors.explore], ["doesntWork", stColors.doesntWork]].map(([key, col]) => (
                <div key={key} style={{ background: `${col}18`, border: `1px solid ${col}44`, borderRadius: 10, padding: "8px 14px", minWidth: 60, textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: col, fontFamily: FONT_DISPLAY }}>{stats[key]}</div>
                  <div style={{ fontSize: 10, color: C.textSec, marginTop: 2 }}>{t(key === "explore" ? "needsExploration" : key)}</div>
                </div>
              ))}
            </div>
          )}

          {/* Pick mode cards */}
          {[
            { emoji: "\ud83d\udfe6", key: "withinCategory", descKey: "withinCategoryDesc", action: () => setScreen("pickWithin") },
            { emoji: "\ud83d\udd00", key: "betweenCategories", descKey: "betweenCategoriesDesc", action: () => { setBetweenStep(1); setRowCat(null); setScreen("pickBetween"); } },
            { emoji: "\u270f\ufe0f", key: "customPick", descKey: "customPickDesc", action: () => { setCustomSelected([]); setScreen("pickCustom"); } },
          ].map(({ emoji, key, descKey, action }) => (
            <div key={key} style={cardStyle} onClick={action}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 24 }}>{emoji}</span>
                <div>
                  <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 15, letterSpacing: 0.5, color: C.text }}>{t(key)}</div>
                  <div style={{ fontSize: 12, color: C.textSec, marginTop: 2 }}>{t(descKey)}</div>
                </div>
              </div>
            </div>
          ))}

          {/* Unexplored pairings */}
          {unexplored.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 13, letterSpacing: 1, color: C.textSec, marginBottom: 10 }}>{t("unexploredPairings")}</div>
              {unexplored.map(({ a, b, key }) => (
                <div key={key} style={{ ...cardStyle, display: "flex", alignItems: "center", gap: 8, padding: "10px 14px" }}
                  onClick={() => { setDetailPair({ a, b }); }}>
                  <span style={{ fontSize: 12, color: catColors[a.category] || C.textSec, fontWeight: 700 }}>{a.name}</span>
                  <span style={{ color: C.textMuted, fontSize: 12 }}>\u2192</span>
                  <span style={{ fontSize: 12, color: catColors[b.category] || C.textSec, fontWeight: 700 }}>{b.name}</span>
                </div>
              ))}
            </div>
          )}

          {totalEvaluated === 0 && unexplored.length === 0 && (
            <div style={{ textAlign: "center", color: C.textMuted, marginTop: 40, fontSize: 13 }}>{t("noPairingsYet")}</div>
          )}
        </div>

        {/* Detail modal */}
        {detailPair && <DetailModal pair={detailPair} pairings={pairings} transitions={transitions}
          catColors={catColors} onSave={setPairing} onSaveSet={onSaveSet} addToast={addToast} t={t}
          onClose={() => setDetailPair(null)} />}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // WITHIN CATEGORY PICKER
  // ════════════════════════════════════════════════════════════════════════════
  if (screen === "pickWithin") {
    const availCats = cats.filter(c => (catMoveCounts[c] || 0) >= 2);
    return (
      <div style={overlay}>
        <Header title={t("withinCategory")} onBack={() => setScreen("home")} />
        <div style={scrollArea}>
          <p style={{ color: C.textSec, fontSize: 13, marginTop: 0, marginBottom: 16 }}>{t("selectCategory")}</p>
          {availCats.map(cat => {
            const count = catMoveCounts[cat] || 0;
            const total = count * (count - 1);
            return (
              <div key={cat} style={cardStyle} onClick={() => openWithin(cat)}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 4, height: 32, borderRadius: 2, background: catColors[cat] || C.accent, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{cat}</div>
                    <div style={{ fontSize: 11, color: C.textSec, marginTop: 2 }}>{count} moves \u00b7 {total} {t("possiblePairings")}</div>
                  </div>
                  <span style={{ color: C.textMuted, fontSize: 16 }}>\u203a</span>
                </div>
              </div>
            );
          })}
          {availCats.length === 0 && (
            <div style={{ textAlign: "center", color: C.textMuted, marginTop: 40, fontSize: 13 }}>{t("noMovesInCategory")}</div>
          )}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // BETWEEN CATEGORIES PICKER
  // ════════════════════════════════════════════════════════════════════════════
  if (screen === "pickBetween") {
    const availCats = cats.filter(c => (catMoveCounts[c] || 0) >= 1);
    const filteredCats = betweenStep === 2 ? availCats.filter(c => c !== rowCat) : availCats;
    const title = betweenStep === 1 ? t("selectRowCategory") : t("selectColumnCategory");
    return (
      <div style={overlay}>
        <Header title={t("betweenCategories")} onBack={() => { if (betweenStep === 2) { setBetweenStep(1); setRowCat(null); } else setScreen("home"); }} />
        <div style={scrollArea}>
          <p style={{ color: C.textSec, fontSize: 13, marginTop: 0, marginBottom: 16 }}>{title}</p>
          {filteredCats.map(cat => (
            <div key={cat} style={cardStyle} onClick={() => {
              if (betweenStep === 1) { setRowCat(cat); setBetweenStep(2); }
              else openBetween(rowCat, cat);
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 4, height: 32, borderRadius: 2, background: catColors[cat] || C.accent, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{cat}</div>
                  <div style={{ fontSize: 11, color: C.textSec, marginTop: 2 }}>{catMoveCounts[cat] || 0} moves</div>
                </div>
                <span style={{ color: C.textMuted, fontSize: 16 }}>{"\u203a"}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // CUSTOM PICKER
  // ════════════════════════════════════════════════════════════════════════════
  if (screen === "pickCustom") {
    const grouped = {};
    moves.forEach(m => { (grouped[m.category] = grouped[m.category] || []).push(m); });
    return (
      <div style={overlay}>
        <Header title={t("customPick")} onBack={() => setScreen("home")} />
        <div style={scrollArea}>
          <p style={{ color: C.textSec, fontSize: 13, marginTop: 0, marginBottom: 12 }}>
            {t("selectMoves")} ({customSelected.length}/8)
          </p>
          {cats.filter(c => grouped[c]?.length).map(cat => (
            <div key={cat} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <div style={{ width: 3, height: 14, borderRadius: 2, background: catColors[cat] || C.accent }} />
                <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 12, letterSpacing: 0.5, color: C.textSec }}>{cat}</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {grouped[cat].map(m => {
                  const sel = customSelected.includes(m.id);
                  // Count how many pairings this move has
                  const exploredCount = Object.keys(pairings).filter(k => k.startsWith(`${m.id}\u2192`) || k.endsWith(`\u2192${m.id}`)).length;
                  return (
                    <div key={m.id} style={chipStyle(sel)} onClick={() => {
                      if (sel) setCustomSelected(p => p.filter(id => id !== m.id));
                      else if (customSelected.length < 8) setCustomSelected(p => [...p, m.id]);
                    }}>
                      {m.name}
                      {exploredCount > 0 && <span style={{ fontSize: 10, color: C.textMuted, marginLeft: 4 }}>({exploredCount})</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {customSelected.length >= 2 && (
            <div style={{ position: "sticky", bottom: 0, padding: "12px 0", background: C.bg }}>
              <button style={{ ...btnPrimary, width: "100%" }} onClick={openCustom}>{t("buildFlowMap")}</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // GRID SCREEN
  // ════════════════════════════════════════════════════════════════════════════
  if (screen === "grid") {
    const { rows, cols } = gridMoves;
    const isSelfGrid = gridMoves.mode !== "between";

    return (
      <div style={overlay}>
        <Header title={t("flowMap")} onBack={() => setScreen("home")} />

        {/* View toggle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "8px 16px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          {["icons", "heat"].map(mode => (
            <div key={mode} style={chipStyle(viewMode === mode)} onClick={() => setViewMode(mode)}>
              {mode === "icons" ? t("iconsView") : t("heatMap")}
            </div>
          ))}
        </div>

        <GridView
          rows={rows} cols={cols} isSelfGrid={isSelfGrid} pairings={pairings}
          catColors={catColors} viewMode={viewMode} C={C} t={t}
          onCycleState={cycleState}
          onDoubleTap={(a, b) => setDetailPair({ a, b })}
        />

        {/* Detail modal */}
        {detailPair && <DetailModal pair={detailPair} pairings={pairings} transitions={transitions}
          catColors={catColors} onSave={setPairing} onSaveSet={onSaveSet} addToast={addToast} t={t}
          onClose={() => setDetailPair(null)} />}
      </div>
    );
  }

  return null;
};

// ════════════════════════════════════════════════════════════════════════════
// GRID VIEW
// ════════════════════════════════════════════════════════════════════════════
const GridView = ({ rows, cols, isSelfGrid, pairings, catColors, viewMode, C, t, onCycleState, onDoubleTap }) => {
  const containerRef = useRef(null);
  const tapTimerRef = useRef({});
  const ROW_LABEL_W = 80;
  const PAD = 16;

  // Calculate cell size
  const numCols = cols.length;
  const availW = (typeof window !== 'undefined' ? Math.min(window.innerWidth, 520) : 375) - ROW_LABEL_W - PAD * 2;
  const cellSize = Math.max(44, Math.min(80, Math.floor(availW / numCols)));
  const gridW = cellSize * numCols;
  const stColors = STATE_COLORS(C);

  const handleTap = (a, b) => {
    const key = `${a.id}-${b.id}`;
    if (tapTimerRef.current[key]) {
      clearTimeout(tapTimerRef.current[key]);
      tapTimerRef.current[key] = null;
      onDoubleTap(a, b);
    } else {
      tapTimerRef.current[key] = setTimeout(() => {
        tapTimerRef.current[key] = null;
        onCycleState(a.id, b.id);
      }, 280);
    }
  };

  return (
    <div ref={containerRef} style={{ flex: 1, overflowX: "auto", overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
      <div style={{ display: "inline-block", minWidth: ROW_LABEL_W + gridW + PAD, padding: `8px ${PAD}px` }}>

        {/* Column headers */}
        <div style={{ display: "flex", marginLeft: ROW_LABEL_W }}>
          {cols.map(m => (
            <div key={m.id} style={{
              width: cellSize, height: 48, display: "flex", alignItems: "flex-end", justifyContent: "center",
              paddingBottom: 4, flexShrink: 0
            }}>
              <span style={{
                fontSize: 9, color: C.textSec, fontWeight: 600, textAlign: "center",
                lineHeight: 1.1, overflow: "hidden", maxWidth: cellSize - 4, wordBreak: "break-all"
              }}>{abbrev(m.name, 6)}</span>
            </div>
          ))}
        </div>

        {/* Rows */}
        {rows.map(rowMove => (
          <div key={rowMove.id} style={{ display: "flex", alignItems: "center", height: cellSize }}>
            {/* Row label */}
            <div style={{
              width: ROW_LABEL_W, flexShrink: 0, display: "flex", alignItems: "center", gap: 4, paddingRight: 6
            }}>
              <div style={{ width: 3, height: 18, borderRadius: 2, background: catColors[rowMove.category] || C.accent, flexShrink: 0 }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {abbrev(rowMove.name, 8)}
              </span>
            </div>

            {/* Cells */}
            {cols.map(colMove => {
              const isSelf = rowMove.id === colMove.id;
              const pairing = pairings[`${rowMove.id}\u2192${colMove.id}`] || {};
              const state = pairing.state;
              const hasNotes = !!pairing.notes;
              const color = state ? stColors[state] : null;

              if (isSelf && isSelfGrid) {
                return (
                  <div key={colMove.id} style={{
                    width: cellSize, height: cellSize, flexShrink: 0,
                    background: `${C.textMuted}15`, borderRadius: 4, margin: 0.5
                  }} />
                );
              }

              return (
                <div key={colMove.id}
                  onClick={() => handleTap(rowMove, colMove)}
                  style={{
                    width: cellSize, height: cellSize, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: `1px solid ${C.border}`, borderRadius: 4, margin: 0.5,
                    cursor: "pointer", position: "relative",
                    background: viewMode === "heat" && color ? `${color}30` : C.surface,
                    transition: "background 0.15s"
                  }}>
                  {/* State indicator */}
                  {viewMode === "icons" && state && (
                    <span style={{ fontSize: cellSize < 50 ? 14 : 18 }}>{STATE_ICONS[state]}</span>
                  )}
                  {viewMode === "heat" && !color && (
                    <span style={{ fontSize: 8, color: C.textMuted }}>\u00b7</span>
                  )}
                  {/* Notes dot */}
                  {hasNotes && (
                    <div style={{
                      position: "absolute", top: 2, right: 2, width: 5, height: 5,
                      borderRadius: "50%", background: C.yellow
                    }} />
                  )}
                  {/* Previously explored blue dot (has data but no current state) */}
                  {!state && pairing.date && (
                    <div style={{
                      position: "absolute", top: 2, right: 2, width: 5, height: 5,
                      borderRadius: "50%", background: C.blue
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// DETAIL MODAL
// ════════════════════════════════════════════════════════════════════════════
const DetailModal = ({ pair, pairings, transitions, catColors, onSave, onSaveSet, addToast, t, onClose }) => {
  const { a, b } = pair;
  const key = `${a.id}\u2192${b.id}`;
  const existing = pairings[key] || {};

  const [state, setState] = useState(existing.state || null);
  const [transition, setTransition] = useState(existing.transition || null);
  const [notes, setNotes] = useState(existing.notes || "");

  const stColors = STATE_COLORS(C);

  const handleSave = () => {
    onSave(a.id, b.id, { state, transition, notes });
    onClose();
  };

  const handleAddToLibrary = () => {
    onSaveSet({
      name: `${a.name} \u2192 ${b.name}`,
      color: catColors[a.category] || "#4a4a6a",
      moveIds: [a.id, b.id],
      notes: notes || `${transition ? `Transition: ${transition}` : ""}`,
      mastery: 0,
      date: new Date().toISOString().split("T")[0],
    });
    addToast(t("savedToLibrary"));
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)",
      zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center", padding: 16
    }} onClick={onClose}>
      <div style={{
        background: C.bg, borderRadius: 16, maxWidth: 420, width: "100%", maxHeight: "85vh",
        overflowY: "auto", padding: 20, boxShadow: "0 8px 32px rgba(0,0,0,0.3)"
      }} onClick={e => e.stopPropagation()}>

        {/* Move A → Move B */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, justifyContent: "center" }}>
          <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 16, color: catColors[a.category] || C.text }}>{a.name}</span>
          <span style={{ color: C.textMuted, fontSize: 18 }}>\u2192</span>
          <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 16, color: catColors[b.category] || C.text }}>{b.name}</span>
        </div>

        {/* State selector */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {STATES.filter(s => s).map(s => {
              const active = state === s;
              const col = stColors[s];
              return (
                <div key={s} style={{
                  ...chipStyleFn(active, col, C),
                }} onClick={() => setState(state === s ? null : s)}>
                  <span style={{ marginRight: 4 }}>{STATE_ICONS[s]}</span>
                  {t(s === "explore" ? "needsExploration" : s)}
                </div>
              );
            })}
          </div>
        </div>

        {/* Transition selector */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.textSec, marginBottom: 6, fontFamily: FONT_DISPLAY, letterSpacing: 0.5 }}>{t("transition")}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {transitions.map(tr => (
              <div key={tr} style={{
                display: "inline-block", padding: "5px 12px", borderRadius: 20,
                border: `1.5px solid ${transition === tr ? C.accent : C.border}`,
                background: transition === tr ? `${C.accent}20` : C.surface,
                color: transition === tr ? C.accent : C.textSec,
                fontSize: 12, cursor: "pointer", fontWeight: transition === tr ? 700 : 400
              }} onClick={() => setTransition(transition === tr ? null : tr)}>
                {tr}
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.textSec, marginBottom: 6, fontFamily: FONT_DISPLAY, letterSpacing: 0.5 }}>{t("notes")}</div>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="..."
            style={{
              width: "100%", minHeight: 60, padding: 10, borderRadius: 10, border: `1px solid ${C.border}`,
              background: C.surface, color: C.text, fontSize: 13, fontFamily: FONT_BODY, resize: "vertical", outline: "none"
            }} />
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, flexDirection: "column" }}>
          <button style={{ ...btnPrimaryFn(C), width: "100%" }} onClick={handleSave}>{t("save")}</button>
          {state === "works" && (
            <button style={{
              background: `${C.green}18`, color: C.green, border: `1.5px solid ${C.green}44`,
              borderRadius: 10, padding: "10px 20px", fontSize: 13, fontFamily: FONT_DISPLAY, fontWeight: 700,
              letterSpacing: 0.5, cursor: "pointer", width: "100%"
            }} onClick={() => { handleAddToLibrary(); handleSave(); }}>
              {t("addToLibrary")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Utility style functions for DetailModal (need C access)
const chipStyleFn = (active, col, C) => ({
  display: "inline-flex", alignItems: "center", padding: "6px 12px", borderRadius: 20,
  border: `1.5px solid ${active ? col : C.border}`,
  background: active ? `${col}22` : C.surface,
  color: active ? col : C.textSec,
  fontSize: 12, cursor: "pointer", fontWeight: active ? 700 : 400
});

const btnPrimaryFn = (C) => ({
  background: C.accent, color: "#fff", border: "none", borderRadius: 10,
  padding: "12px 24px", fontSize: 14, fontFamily: FONT_DISPLAY, fontWeight: 700,
  letterSpacing: 1, cursor: "pointer", textAlign: "center"
});
