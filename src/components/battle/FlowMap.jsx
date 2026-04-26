import React, { useState, useMemo, useRef, useCallback } from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { Ic } from '../shared/Ic';
import { useT } from '../../hooks/useTranslation';
import { todayLocal } from '../../utils/dateUtils';
import { useSettings } from '../../hooks/useSettings';
import { SectionBrief } from '../shared/SectionBrief';
import { CAT_COLORS } from '../../constants/categories';
import {
  toolModeTileStyle,
  toolModeTitleStyle,
  toolModeDescStyle,
  toolListContainerStyle,
  toolHeaderStyle,
  toolHeaderTitleStyle,
  toolBackButtonStyle,
} from '../moves/toolModeTile.styles';

const DEFAULT_TRANSITIONS = ["Thread","Jump","Counter Spin","Slide","Sweep","Touch Foot","Kick","Hop","Roll","Twist","Drop","Spin Through"];

const STATES = [null, "works", "interesting", "explore", "doesntWork"];
const STATE_IC = { works: "checkCircle", interesting: "star", explore: "search", doesntWork: "xCircle" };
const STATE_COLORS = (C) => ({
  works: C.green,
  interesting: C.yellow,
  explore: C.blue,
  doesntWork: C.red,
});
const STATE_BG_COLORS = (C) => ({
  works: `${C.green}4D`,
  interesting: `${C.yellow}66`,
  explore: `${C.blue}40`,
  doesntWork: `${C.red}33`,
});

const IMPACT_LEVELS = [
  { value: 1, label: "weak" },
  { value: 2, label: "chill" },
  { value: 3, label: "solid" },
  { value: 4, label: "fire" },
  { value: 5, label: "dope" },
];
const IMPACT_TENSION = { 1: "low", 2: "low", 3: "mid", 4: "high", 5: "peak" };

// ── Main Component ──────────────────────────────────────────────────────────
export const FlowMap = ({ moves, cats, catColors, flowmap, onFlowmapChange, combos, onSaveMove, onSaveSet: _onSaveSet, addToast, onBack }) => {
  const t = useT();
  const { settings: ctxSettings } = useSettings();

  const [screen, setScreen] = useState("home");
  const [gridMoves, setGridMoves] = useState({ rows: [], cols: [], mode: null });
  const [viewMode, setViewMode] = useState("icons"); // icons | heat
  const [detailPair, setDetailPair] = useState(null);

  // Between categories picker state
  const [betweenStep, setBetweenStep] = useState(1);
  const [rowCat, setRowCat] = useState(null);

  // Custom picker state
  const [customSelected, setCustomSelected] = useState([]);

  const pairings = useMemo(() => flowmap.pairings || {}, [flowmap.pairings]);

  // Build full transition list: defaults + custom stored + unique from pairings
  const allTransitions = useMemo(() => {
    const base = combos?.transitions?.length ? combos.transitions : DEFAULT_TRANSITIONS;
    const custom = flowmap.customTransitions || [];
    const fromPairings = new Set();
    Object.values(pairings).forEach(p => {
      if (Array.isArray(p.transitions)) p.transitions.forEach(tr => fromPairings.add(tr));
      else if (p.transition) fromPairings.add(p.transition);
    });
    const merged = new Set([...base, ...custom]);
    fromPairings.forEach(tr => merged.add(tr));
    return [...merged];
  }, [combos, flowmap.customTransitions, pairings]);

  const addCustomTransition = useCallback((name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onFlowmapChange(prev => {
      const existing = prev.customTransitions || [];
      if (existing.some(t => t.toLowerCase() === trimmed.toLowerCase())) return prev;
      return { ...prev, customTransitions: [...existing, trimmed] };
    });
  }, [onFlowmapChange]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const counts = { works: 0, interesting: 0, explore: 0, doesntWork: 0 };
    Object.values(pairings).forEach(p => { if (p.state && counts[p.state] !== undefined) counts[p.state]++; });
    return counts;
  }, [pairings]);

  const totalEvaluated = stats.works + stats.interesting + stats.explore + stats.doesntWork;
  const totalPossible = moves.length * (moves.length - 1);
  const explorePct = totalPossible > 0 ? Math.round((totalEvaluated / totalPossible) * 100) : 0;

  // ── All unexplored pairs (for random pick) ───────────────────────────────
  const allUnexplored = useMemo(() => {
    if (moves.length < 2) return [];
    const pairs = [];
    // For performance, sample if too many moves
    const limit = moves.length > 50 ? 50 : moves.length;
    for (let i = 0; i < limit; i++) {
      for (let j = 0; j < limit; j++) {
        if (i === j) continue;
        const key = `${moves[i].id}→${moves[j].id}`;
        if (!pairings[key]?.state) pairs.push({ a: moves[i], b: moves[j], key });
      }
    }
    return pairs;
  }, [moves, pairings]);

  // ── Categories with move counts ───────────────────────────────────────────
  const catMoveCounts = useMemo(() => {
    const map = {};
    moves.forEach(m => { map[m.category] = (map[m.category] || 0) + 1; });
    return map;
  }, [moves]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getPairing = useCallback((aId, bId) => pairings[`${aId}→${bId}`] || {}, [pairings]);

  const setPairing = useCallback((aId, bId, update) => {
    const key = `${aId}→${bId}`;
    onFlowmapChange(prev => ({
      ...prev,
      pairings: {
        ...(prev.pairings || {}),
        [key]: { ...(prev.pairings?.[key] || {}), ...update, date: todayLocal() }
      }
    }));
  }, [onFlowmapChange]);

  const cycleState = useCallback((aId, bId) => {
    const cur = getPairing(aId, bId).state || null;
    const idx = STATES.indexOf(cur);
    const next = STATES[(idx + 1) % STATES.length];
    setPairing(aId, bId, { state: next });
  }, [getPairing, setPairing]);

  const pickRandomUnexplored = () => {
    if (allUnexplored.length === 0) return;
    const pick = allUnexplored[Math.floor(Math.random() * allUnexplored.length)];
    setDetailPair({ a: pick.a, b: pick.b });
  };

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
  const headerBar = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 };
  const scrollArea = { flex: 1, overflowY: "auto", padding: "16px", WebkitOverflowScrolling: "touch" };
  const cardStyle = { background: C.surface, borderRadius: 8, padding: "16px", marginBottom: 6, cursor: "pointer" };
  const chipStyle = (active) => ({
    display: "inline-block", padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${active ? C.accent : C.border}`,
    background: active ? `${C.accent}20` : C.surface, color: active ? C.accent : C.text, fontSize: 13, fontFamily: FONT_BODY,
    cursor: "pointer", marginRight: 8, marginBottom: 8, fontWeight: active ? 700 : 400
  });
  const btnPrimary = { background: C.accent, color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", fontSize: 14, fontFamily: FONT_DISPLAY, fontWeight: 700, letterSpacing: 1, cursor: "pointer", textAlign: "center" };

  // ── HEADER (title left, X right) ─────────────────────────────────────────
  const Header = ({ title, onBack }) => (
    <div style={headerBar}>
      <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 18, letterSpacing: 1, color: C.text }}>{title}</span>
      <button onClick={onBack} style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, cursor: "pointer", color: C.textSec, padding: 5, borderRadius: 7, display: "flex" }}>
        <Ic n="x" s={14} c={C.textSec} />
      </button>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // HOME SCREEN
  // ════════════════════════════════════════════════════════════════════════════
  if (screen === "home") {
    const stColors = STATE_COLORS(C);
    return (
      <div style={overlay}>
        <div style={toolHeaderStyle(C)}>
          <button onClick={onBack} style={toolBackButtonStyle(C)}>
            ← {t("back")}
          </button>
          <span style={toolHeaderTitleStyle(C)}>
            {t("map")}
          </span>
        </div>
        <div style={scrollArea}>
          <SectionBrief desc={t("mapBrief")} stat={totalPossible > 0 ? t("connectionsExplored").replace("{count}", totalEvaluated).replace("{total}", totalPossible).replace("{percent}", explorePct) : null} settings={ctxSettings}/>

          {/* Progress bar + stats */}
          {totalPossible > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ height: 4, borderRadius: 2, background: C.borderLight, overflow: "hidden", marginBottom: 6 }}>
                <div style={{ height: "100%", borderRadius: 2, background: C.accent, width: `${explorePct}%`, transition: "width 0.3s" }} />
              </div>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 11, color: C.textMuted, letterSpacing: 1 }}>
                <Ic n="search" s={12} c={C.textMuted}/> {t("connectionsExplored").replace("{count}", totalEvaluated).replace("{total}", totalPossible).replace("{percent}", explorePct)}
              </div>
            </div>
          )}

          {/* Random unexplored button */}
          {totalPossible > 0 && (
            <div style={{ marginBottom: 16 }}>
              {allUnexplored.length > 0 ? (
                <div onClick={pickRandomUnexplored} style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textMuted, fontStyle: "italic", cursor: "pointer" }}>
                  <Ic n="dices" s={12} c={C.textMuted}/> {t("tryRandom")}
                </div>
              ) : totalEvaluated > 0 ? (
                <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.green, fontStyle: "italic" }}>
                  {t("allExplored")} <Ic n="sparkles" s={12} c={C.green}/>
                </div>
              ) : null}
            </div>
          )}

          {/* Stats banner */}
          {totalEvaluated > 0 && (
            <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
              {[["works", stColors.works], ["interesting", stColors.interesting], ["explore", stColors.explore], ["doesntWork", stColors.doesntWork]].map(([key, col]) => (
                <div key={key} style={{ background: `${col}18`, border: `1px solid ${col}44`, borderRadius: 8, padding: "8px 14px", minWidth: 60, textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: col, fontFamily: FONT_DISPLAY }}>{stats[key]}</div>
                  <div style={{ fontSize: 10, color: C.textSec, marginTop: 2 }}>{t(key === "explore" ? "needsExploration" : key)}</div>
                </div>
              ))}
            </div>
          )}

          {/* Pick mode cards */}
          <div style={toolListContainerStyle}>
            {[
              { key: "withinCategory",     stripe: CAT_COLORS.Blowups, descKey: "withinCategoryDesc",     subKey: "withinDesc",  action: () => setScreen("pickWithin") },
              { key: "betweenCategories",  stripe: CAT_COLORS.Godowns, descKey: "betweenCategoriesDesc",  subKey: "betweenDesc", action: () => { setBetweenStep(1); setRowCat(null); setScreen("pickBetween"); } },
              { key: "customPick",         stripe: CAT_COLORS.Custom,  descKey: "customPickDesc",         subKey: "customDesc",  action: () => { setCustomSelected([]); setScreen("pickCustom"); } },
            ].map(({ key, stripe, descKey, subKey, action }) => (
              <button key={key} style={toolModeTileStyle(stripe, C)} onClick={action}>
                <div style={toolModeTitleStyle(stripe)}>{t(key)}</div>
                <div style={toolModeDescStyle(C)}>{t(descKey)}</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textMuted, marginTop: 2, fontStyle: "italic" }}>{t(subKey)}</div>
              </button>
            ))}
          </div>

          {totalEvaluated === 0 && allUnexplored.length === 0 && moves.length < 2 && (
            <div style={{ textAlign: "center", color: C.textMuted, marginTop: 40, fontSize: 13 }}>{t("noPairingsYet")}</div>
          )}
        </div>

        {/* Detail modal */}
        {detailPair && <DetailModal pair={detailPair} pairings={pairings} transitions={allTransitions}
          catColors={catColors} cats={cats} onSave={setPairing} onSaveMove={onSaveMove} addToast={addToast} t={t}
          onAddCustomTransition={addCustomTransition}
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
                    <div style={{ fontSize: 11, color: C.textSec, marginTop: 2 }}>{count} moves · {total} {t("possiblePairings")}</div>
                  </div>
                  <span style={{ color: C.textMuted, fontSize: 16 }}>›</span>
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
                <span style={{ color: C.textMuted, fontSize: 16 }}>›</span>
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
                <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 11, letterSpacing: 0.5, color: C.textSec }}>{cat}</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {grouped[cat].map(m => {
                  const sel = customSelected.includes(m.id);
                  const exploredCount = Object.keys(pairings).filter(k => k.startsWith(`${m.id}→`) || k.endsWith(`→${m.id}`)).length;
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
        <Header title={t("map")} onBack={() => setScreen("home")} />

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

        {/* Colour legend (heat mode only) */}
        {viewMode === "heat" && <HeatLegend C={C} t={t} />}

        {/* Detail modal */}
        {detailPair && <DetailModal pair={detailPair} pairings={pairings} transitions={allTransitions}
          catColors={catColors} cats={cats} onSave={setPairing} onSaveMove={onSaveMove} addToast={addToast} t={t}
          onAddCustomTransition={addCustomTransition}
          onClose={() => setDetailPair(null)} />}
      </div>
    );
  }

  return null;
};

// ════════════════════════════════════════════════════════════════════════════
// HEAT MAP LEGEND
// ════════════════════════════════════════════════════════════════════════════
const HeatLegend = ({ C, t }) => {
  const stColors = STATE_COLORS(C);
  const bgColors = STATE_BG_COLORS(C);
  const items = [
    { key: "works", color: bgColors.works, border: stColors.works },
    { key: "interesting", color: bgColors.interesting, border: stColors.interesting },
    { key: "needsExploration", color: bgColors.explore, border: stColors.explore },
    { key: "doesntWork", color: bgColors.doesntWork, border: stColors.doesntWork },
    { key: "unexplored", color: C.surfaceAlt, border: C.border },
  ];
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, padding: "8px 16px", borderTop: `1px solid ${C.border}`, flexShrink: 0, justifyContent: "center" }}>
      {items.map(({ key, color, border }) => (
        <div key={key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 12, height: 12, borderRadius: 2, background: color, border: `1px solid ${border}` }} />
          <span style={{ fontSize: 10, color: C.textSec }}>{t(key)}</span>
        </div>
      ))}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// GRID VIEW
// ════════════════════════════════════════════════════════════════════════════
const GridView = ({ rows, cols, isSelfGrid, pairings, catColors, viewMode, C, t: _t, onCycleState, onDoubleTap }) => {
  const containerRef = useRef(null);
  const tapTimerRef = useRef({});

  const numCols = cols.length;
  const cellSize = 40;
  const stColors = STATE_COLORS(C);
  const bgColors = STATE_BG_COLORS(C);

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
      <div style={{
        display: "inline-grid",
        gridTemplateColumns: `auto repeat(${numCols}, ${cellSize}px)`,
        padding: "8px 16px", alignItems: "center"
      }}>

        {/* Column headers row: empty corner + vertical headers */}
        <div />
        {cols.map(m => (
          <div key={`h-${m.id}`} style={{
            display: "flex", alignItems: "flex-start", justifyContent: "center",
            height: 80, paddingTop: 4
          }}>
            <span style={{
              writingMode: "vertical-lr", transform: "rotate(180deg)",
              fontSize: 10, color: C.textSec, fontWeight: 600,
              whiteSpace: "nowrap", maxHeight: 76, overflow: "hidden"
            }}>{m.name}</span>
          </div>
        ))}

        {/* Data rows */}
        {rows.map(rowMove => (
          <React.Fragment key={rowMove.id}>
            {/* Row label */}
            <div style={{
              display: "flex", alignItems: "center", gap: 4, paddingRight: 8,
              whiteSpace: "nowrap", height: cellSize
            }}>
              <div style={{ width: 3, height: 18, borderRadius: 2, background: catColors[rowMove.category] || C.accent, flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: C.text, whiteSpace: "nowrap" }}>
                {rowMove.name}
              </span>
            </div>

            {/* Cells */}
            {cols.map(colMove => {
              const isSelf = rowMove.id === colMove.id;
              const pairing = pairings[`${rowMove.id}→${colMove.id}`] || {};
              const state = pairing.state;
              const color = state ? stColors[state] : null;
              const bgColor = state ? bgColors[state] : null;

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
                    background: viewMode === "heat" ? (bgColor || C.surfaceAlt) : C.surface,
                    transition: "background 0.15s"
                  }}>
                  {/* State indicator */}
                  {viewMode === "icons" && state && (
                    <Ic n={STATE_IC[state]} s={cellSize < 50 ? 14 : 18} c={stColors[state]}/>
                  )}
                  {viewMode === "heat" && !color && (
                    <span style={{ fontSize: 8, color: C.textMuted }}>·</span>
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
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// DETAIL MODAL — Two-Step Discovery Flow
// ════════════════════════════════════════════════════════════════════════════
const DetailModal = ({ pair, pairings, transitions, catColors, cats, onSave, onSaveMove, onAddCustomTransition, addToast, t, onClose }) => {
  const { a, b } = pair;
  const key = `${a.id}→${b.id}`;
  const existing = pairings[key] || {};

  // Step machine: explore → rate → addToLib
  const [step, setStep] = useState("explore");

  // Shared state across steps
  const [selectedTransitions, setSelectedTransitions] = useState(() => {
    if (Array.isArray(existing.transitions)) return existing.transitions;
    if (existing.transition) return [existing.transition];
    return [];
  });
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInputVal, setCustomInputVal] = useState("");

  // Rate step state
  const [state, setState] = useState(existing.state || null);
  const [impact, setImpact] = useState(existing.impact || null);

  // Add-to-library step state
  const [newMoveName, setNewMoveName] = useState(`${a.name} to ${b.name}`);
  const [selectedCat, setSelectedCat] = useState(null);
  const [difficulty, setDifficulty] = useState(null);
  const [origin, setOrigin] = useState("creation");

  const stColors = STATE_COLORS(C);

  const toggleTransition = (tr) => {
    setSelectedTransitions(prev =>
      prev.includes(tr) ? prev.filter(x => x !== tr) : [...prev, tr]
    );
  };

  const handleAddCustom = () => {
    const trimmed = customInputVal.trim();
    if (!trimmed) { setShowCustomInput(false); return; }
    onAddCustomTransition(trimmed);
    setSelectedTransitions(prev => prev.includes(trimmed) ? prev : [...prev, trimmed]);
    setCustomInputVal("");
    setShowCustomInput(false);
  };

  // Auto-save connection data if user rated something, then close
  const handleClose = () => {
    if (state) {
      onSave(a.id, b.id, { state, transitions: selectedTransitions, impact });
    }
    onClose();
  };

  const handleSaveToLibrary = () => {
    if (!newMoveName.trim() || !selectedCat) return;
    const today = todayLocal();
    const moveData = {
      name: newMoveName.trim(),
      category: selectedCat,
      mastery: 0,
      difficulty: difficulty || null,
      origin: origin || "creation",
      description: state === "interesting" ? (t("discoveredInFlowMap") || "Discovered in Flow Map") : "",
      source: "flowmap",
      flowmapPairing: { moveA: a.name, moveB: b.name },
      arcTension: impact ? IMPACT_TENSION[impact] : null,
      parentId: a.id,
      date: today,
    };
    onSaveMove(moveData);
    // Also save the connection with library reference
    onSave(a.id, b.id, { state, transitions: selectedTransitions, impact, savedToLibrary: true });
    addToast(t("savedTo").replace("{category}", selectedCat));
    onClose();
  };

  // ── Move A → Move B header ──
  const PairHeader = () => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, justifyContent: "center" }}>
      <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 16, color: catColors[a.category] || C.text }}>{a.name}</span>
      <span style={{ color: C.textMuted, fontSize: 18 }}>→</span>
      <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 16, color: catColors[b.category] || C.text }}>{b.name}</span>
    </div>
  );

  // ── Transition chips (reused in explore step) ──
  const TransitionChips = () => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.textSec, marginBottom: 6, fontFamily: FONT_DISPLAY, letterSpacing: 0.5 }}>{t("transition")}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {transitions.map(tr => {
          const active = selectedTransitions.includes(tr);
          return (
            <div key={tr} style={{
              display: "inline-block", padding: "5px 12px", borderRadius: 20,
              border: `1.5px solid ${active ? C.accent : C.border}`,
              background: active ? `${C.accent}20` : C.surface,
              color: active ? C.accent : C.textSec,
              fontSize: 11, cursor: "pointer", fontWeight: active ? 700 : 400
            }} onClick={() => toggleTransition(tr)}>
              {tr}
            </div>
          );
        })}
        {!showCustomInput ? (
          <div style={{
            display: "inline-block", padding: "5px 12px", borderRadius: 20,
            border: `1px dashed ${C.border}`, background: "transparent",
            color: C.textMuted, fontSize: 11, cursor: "pointer"
          }} onClick={() => setShowCustomInput(true)}>
            + {t("addCustom")}
          </div>
        ) : (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <input
              autoFocus
              value={customInputVal}
              onChange={e => setCustomInputVal(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleAddCustom(); if (e.key === "Escape") { setShowCustomInput(false); setCustomInputVal(""); } }}
              placeholder="e.g. Cartwheel"
              style={{
                padding: "5px 10px", borderRadius: 20, border: `1.5px solid ${C.accent}`,
                background: C.surface, color: C.text, fontSize: 11, fontFamily: FONT_BODY,
                outline: "none", width: 120
              }}
            />
            <div onClick={handleAddCustom} style={{
              width: 28, height: 28, borderRadius: "50%", background: C.accent,
              color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", fontSize: 14, fontWeight: 700, flexShrink: 0
            }}><Ic n="check" s={14} c="#fff"/></div>
          </div>
        )}
      </div>
    </div>
  );

  // ── Back button ──
  const BackBtn = ({ onClick }) => (
    <div onClick={onClick} style={{
      position: "absolute", top: 16, left: 16, cursor: "pointer",
      fontSize: 18, color: C.textSec, fontWeight: 600, zIndex: 1
    }}>‹ {t("back") || "Back"}</div>
  );

  // ── Close button ──
  const CloseBtn = () => (
    <div onClick={handleClose} style={{
      position: "absolute", top: 14, right: 16, cursor: "pointer",
      fontSize: 20, color: C.textMuted, fontWeight: 400, zIndex: 1
    }}>✕</div>
  );

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)",
      zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center", padding: 16
    }} onClick={handleClose}>
      <div style={{
        background: C.bg, borderRadius: 16, maxWidth: 420, width: "100%", maxHeight: "85vh",
        overflowY: "auto", padding: 20, boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        position: "relative"
      }} onClick={e => e.stopPropagation()}>

        {/* ═══ STEP: EXPLORE ═══ */}
        {step === "explore" && (<>
          <CloseBtn />
          <div style={{ paddingTop: 8 }}>
            <PairHeader />
            <TransitionChips />

            {/* TRY IT button */}
            <button style={{
              ...btnPrimaryFn(C), width: "100%", fontSize: 16, padding: "14px 24px",
              letterSpacing: 1.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 8
            }} onClick={() => setStep("rate")}>
              {t("tryIt")}
            </button>
          </div>
        </>)}

        {/* ═══ STEP: RATE ═══ */}
        {step === "rate" && (<>
          <BackBtn onClick={() => setStep("explore")} />
          <CloseBtn />
          <div style={{ paddingTop: 28 }}>
            <PairHeader />

            {/* HOW DID IT FEEL? */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.textSec, marginBottom: 8, fontFamily: FONT_DISPLAY, letterSpacing: 0.5 }}>
                {t("howDidItFeel")}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {STATES.filter(s => s).map(s => {
                  const active = state === s;
                  const col = stColors[s];
                  return (
                    <div key={s} style={chipStyleFn(active, col, C)}
                      onClick={() => setState(state === s ? null : s)}>
                      <span style={{ marginRight: 4, display:"inline-flex" }}><Ic n={STATE_IC[s]} s={14} c={col}/></span>
                      {t(s === "explore" ? "needsExploration" : s)}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* IMPACT */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.textSec, marginBottom: 8, fontFamily: FONT_DISPLAY, letterSpacing: 0.5 }}>
                {t("impactLabel") || "IMPACT"}
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                {IMPACT_LEVELS.map(lvl => {
                  const active = impact === lvl.value;
                  return (
                    <div key={lvl.value} onClick={() => setImpact(impact === lvl.value ? null : lvl.value)}
                      style={{
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                        cursor: "pointer", padding: "6px 4px", borderRadius: 12,
                        border: `2px solid ${active ? C.accent : "transparent"}`,
                        background: active ? `${C.accent}15` : "transparent",
                        transition: "all 0.15s", minWidth: 48
                      }}>
                      <span style={{
                        fontSize: active ? 28 : 22, transition: "font-size 0.15s",
                        filter: active ? "drop-shadow(0 0 6px rgba(229,57,53,0.4))" : "none"
                      }}>{lvl.value}</span>
                      <span style={{
                        fontSize: 10, fontFamily: FONT_DISPLAY, fontWeight: 700,
                        color: active ? C.accent : C.textMuted, letterSpacing: 0.3
                      }}>{t(lvl.label)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Turn this into a move? (for interesting transitions) */}
            {state === "interesting" && !existing.savedToLibrary && (
              <div onClick={() => {
                setNewMoveName(`${a.name} → ${b.name} transition`);
                setStep("addToLib");
              }}
                style={{
                  background: `${C.yellow}15`, border: `1.5px solid ${C.yellow}40`, borderRadius: 12,
                  padding: "12px 14px", marginBottom: 16, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 10, transition: "border-color 0.15s",
                }}
                onPointerEnter={e => e.currentTarget.style.borderColor = C.yellow}
                onPointerLeave={e => e.currentTarget.style.borderColor = C.yellow + "40"}>
                <Ic n="star" s={18} c={C.yellow}/>
                <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.text, fontWeight: 600 }}>
                  {t("turnIntoMove")}
                </span>
              </div>
            )}

            {/* ADD TO MOVE LIBRARY */}
            <button style={{
              ...btnPrimaryFn(C), width: "100%",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8
            }} onClick={() => setStep("addToLib")}>
              ＋ {t("addToMoveLibrary")}
            </button>
          </div>
        </>)}

        {/* ═══ STEP: ADD TO LIBRARY ═══ */}
        {step === "addToLib" && (<>
          <BackBtn onClick={() => setStep("rate")} />
          <CloseBtn />
          <div style={{ paddingTop: 28 }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: C.text, fontFamily: FONT_DISPLAY, letterSpacing: 1, marginBottom: 16, textAlign: "center" }}>
              {t("addToLibraryTitle")}
            </div>

            {/* MOVE NAME */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.textSec, marginBottom: 6, fontFamily: FONT_DISPLAY, letterSpacing: 0.5 }}>
                {t("moveName")}
              </div>
              <input
                value={newMoveName}
                onChange={e => setNewMoveName(e.target.value)}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 8,
                  border: `1.5px solid ${C.border}`, background: C.surface,
                  color: C.text, fontSize: 14, fontFamily: FONT_BODY, outline: "none",
                  boxSizing: "border-box"
                }}
              />
            </div>

            {/* SAVE IN CATEGORY */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.textSec, marginBottom: 6, fontFamily: FONT_DISPLAY, letterSpacing: 0.5 }}>
                {t("saveInCategory")}
              </div>
              <div style={{
                borderRadius: 8, border: `1px solid ${C.border}`, overflow: "hidden",
                maxHeight: 200, overflowY: "auto"
              }}>
                {(cats || []).map((cat, i) => {
                  const active = selectedCat === cat;
                  return (
                    <div key={cat} onClick={() => setSelectedCat(cat)}
                      style={{
                        display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                        cursor: "pointer", borderBottom: i < cats.length - 1 ? `1px solid ${C.borderLight}` : "none",
                        background: active ? `${C.accent}15` : C.surface,
                        transition: "background 0.12s"
                      }}>
                      <div style={{
                        width: 4, height: 20, borderRadius: 2, flexShrink: 0,
                        background: catColors[cat] || C.accent
                      }} />
                      <span style={{
                        fontSize: 13, fontWeight: active ? 700 : 400,
                        color: active ? C.accent : C.text, fontFamily: FONT_BODY
                      }}>{cat}</span>
                      {active && <span style={{ marginLeft: "auto", display:"inline-flex" }}><Ic n="check" s={14} c={C.accent}/></span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* DIFFICULTY */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.textSec, marginBottom: 6, fontFamily: FONT_DISPLAY, letterSpacing: 0.5 }}>
                {t("difficulty") || "DIFFICULTY"}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["easy", "intermediate", "advanced"].map(d => {
                  const active = difficulty === d;
                  return (
                    <div key={d} onClick={() => setDifficulty(active ? null : d)}
                      style={{
                        display: "inline-block", padding: "5px 12px", borderRadius: 20,
                        border: `1.5px solid ${active ? C.accent : C.border}`,
                        background: active ? C.accent : C.surface,
                        color: active ? C.bg : C.textSec,
                        fontSize: 11, cursor: "pointer", fontWeight: active ? 700 : 400,
                        fontFamily: FONT_DISPLAY, letterSpacing: 0.3
                      }}>
                      {t("difficulty_" + d) || d.charAt(0).toUpperCase() + d.slice(1)}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ORIGIN */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.textSec, marginBottom: 6, fontFamily: FONT_DISPLAY, letterSpacing: 0.5 }}>
                {t("origin") || "ORIGIN"}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[
                  { key: "learned", label: t("foundational") || "Foundational" },
                  { key: "version", label: t("myVersion") || "My Version" },
                  { key: "creation", label: t("myCreation") || "My Creation" },
                ].map(o => {
                  const active = origin === o.key;
                  return (
                    <div key={o.key} onClick={() => setOrigin(o.key)}
                      style={{
                        display: "inline-block", padding: "5px 12px", borderRadius: 20,
                        border: `1.5px solid ${active ? C.accent : C.border}`,
                        background: active ? C.accent : C.surface,
                        color: active ? C.bg : C.textSec,
                        fontSize: 11, cursor: "pointer", fontWeight: active ? 700 : 400,
                        fontFamily: FONT_DISPLAY, letterSpacing: 0.3
                      }}>
                      {o.label}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SAVE TO LIBRARY button */}
            <button
              disabled={!newMoveName.trim() || !selectedCat}
              style={{
                ...btnPrimaryFn(C), width: "100%",
                opacity: (!newMoveName.trim() || !selectedCat) ? 0.4 : 1,
                cursor: (!newMoveName.trim() || !selectedCat) ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8
              }}
              onClick={handleSaveToLibrary}>
              <Ic n="save" s={14} c="#fff"/> {t("saveToLibrary")}
            </button>
          </div>
        </>)}

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
  fontSize: 11, cursor: "pointer", fontWeight: active ? 700 : 400
});

const btnPrimaryFn = (C) => ({
  background: C.accent, color: "#fff", border: "none", borderRadius: 10,
  padding: "12px 24px", fontSize: 14, fontFamily: FONT_DISPLAY, fontWeight: 700,
  letterSpacing: 1, cursor: "pointer", textAlign: "center"
});
