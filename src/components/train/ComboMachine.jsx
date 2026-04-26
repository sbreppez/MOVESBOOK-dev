import React, { useState, useEffect, useRef, useCallback } from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { CAT_COLORS } from '../../constants/categories';
import { Ic } from '../shared/Ic';
import { useT } from '../../hooks/useTranslation';
import { useSettings } from '../../hooks/useSettings';
import { SectionBrief } from '../shared/SectionBrief';
import { todayLocal } from '../../utils/dateUtils';

// Rainbow palette per move count — cold (violet) to warm (red)
const TIERS = {
  3: { color: CAT_COLORS.Godowns        }, // violet — coldest
  4: { color: CAT_COLORS.Footworks      }, // blue
  5: { color: CAT_COLORS.Blowups        }, // teal
  6: { color: CAT_COLORS.Freezes        }, // green
  7: { color: CAT_COLORS["Power Moves"] }, // amber
  8: { color: CAT_COLORS.Transitions    }, // orange
  9: { color: CAT_COLORS.Toprocks       }, // red — warmest
};

const DEFAULT_TRANSITIONS = ["Thread","Jump","Counter Spin","Slide","Sweep","Touch Foot","Kick","Hop","Roll","Twist","Drop","Spin Through"];

// ── Main Component ──────────────────────────────────────────────────────────
export const ComboMachine = ({ moves, catColors, combos, onCombosChange, onSaveSet, addToast, onClose, addCalendarEvent }) => {
  const t = useT();
  const { settings: ctxSettings } = useSettings();
  const [screen, setScreen] = useState("main");
  const [moveCount, setMoveCount] = useState(5);
  const [slots, setSlots] = useState([]);
  const [hasSpun, setHasSpun] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [visibleCards, setVisibleCards] = useState(new Set());
  const [saveModal, setSaveModal] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [drillMode, setDrillMode] = useState("random"); // "random" | "branch"
  const [branchRoot, setBranchRoot] = useState(null);
  const timers = useRef([]);

  // Cleanup timers on unmount
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const tier = TIERS[moveCount];
  const tierColor = tier.color;

  const getCatColor = (cat) => catColors?.[cat] || CAT_COLORS[cat] || C.textMuted;

  // ── Descendants helper ──────────────────────────────────────────────────
  const getDescendants = (rootId) => {
    const desc = [];
    const queue = [rootId];
    while (queue.length) {
      const pid = queue.shift();
      moves.forEach(m => {
        if (m.parentId === pid && !desc.find(d => d.id === m.id)) {
          desc.push(m);
          queue.push(m.id);
        }
      });
    }
    return desc;
  };

  // ── Moves that have children (for branch root picker) ──
  const movesWithChildren = moves.filter(m => moves.some(c => c.parentId === m.id));

  // ── Pool ────────────────────────────────────────────────────────────────
  const branchDescendants = drillMode === "branch" && branchRoot ? getDescendants(branchRoot.id) : [];
  const pool = drillMode === "branch" && branchRoot
    ? branchDescendants
    : combos.selectedMoveIds
      ? moves.filter(m => combos.selectedMoveIds.includes(m.id))
      : moves;
  const transitions = combos.transitions?.length ? combos.transitions : DEFAULT_TRANSITIONS;

  // ── Spin ────────────────────────────────────────────────────────────────
  const generateCombo = useCallback(() => {
    if (!pool.length) { addToast({ icon:"info", title:t("comboNoMoves") }); return; }

    const newSlots = [];
    const used = new Set();

    for (let i = 0; i < moveCount; i++) {
      // Move
      let move;
      if (slots[i]?.moveLocked && slots[i]?.move) {
        move = slots[i].move;
      } else {
        // Try to pick unique if pool is large enough
        const available = pool.length > moveCount
          ? pool.filter(m => !used.has(m.id))
          : pool;
        move = available[Math.floor(Math.random() * available.length)];
      }
      used.add(move.id);

      // Transition
      let trans = null;
      if (i > 0) {
        if (slots[i]?.transLocked && slots[i]?.transition) {
          trans = slots[i].transition;
        } else {
          trans = transitions[Math.floor(Math.random() * transitions.length)];
        }
      }

      newSlots.push({ move, transition: trans, moveLocked: slots[i]?.moveLocked || false, transLocked: slots[i]?.transLocked || false });
    }

    // Animation
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setSlots(newSlots);
    setSpinning(true);
    setHasSpun(true);
    setVisibleCards(new Set());

    for (let i = 0; i < newSlots.length; i++) {
      const tid = setTimeout(() => {
        setVisibleCards(prev => { const n = new Set(prev); n.add(i); return n; });
      }, 150 * i);
      timers.current.push(tid);
    }
    const endTid = setTimeout(() => setSpinning(false), 150 * (newSlots.length - 1) + 500);
    timers.current.push(endTid);
  }, [pool, transitions, moveCount, slots, addToast, t]);

  // ── Lock toggles ───────────────────────────────────────────────────────
  const toggleMoveLock = (i) => {
    if (!hasSpun || spinning) return;
    setSlots(prev => prev.map((s, idx) => idx === i ? { ...s, moveLocked: !s.moveLocked } : s));
    try { navigator.vibrate?.(10); } catch {}
  };
  const toggleTransLock = (i) => {
    if (!hasSpun || spinning || i === 0) return;
    setSlots(prev => prev.map((s, idx) => idx === i ? { ...s, transLocked: !s.transLocked } : s));
    try { navigator.vibrate?.(10); } catch {}
  };

  // ── Reset on count change ──────────────────────────────────────────────
  const changeCount = (delta) => {
    const n = Math.max(3, Math.min(9, moveCount + delta));
    if (n !== moveCount) {
      setMoveCount(n);
      setSlots([]);
      setHasSpun(false);
      setSpinning(false);
      setVisibleCards(new Set());
    }
  };

  // ── Save as Set ────────────────────────────────────────────────────────
  const openSaveModal = () => {
    const d = todayLocal();
    setSaveName(`Combo ${d}`);
    setSaveModal(true);
  };
  const doSave = () => {
    const comboText = slots.map((s, i) => {
      const prefix = i > 0 && s.transition ? ` \u2192 [${s.transition}] \u2192 ` : "";
      return prefix + s.move.name;
    }).join("");
    onSaveSet({
      name: saveName || `Combo ${todayLocal()}`,
      color: tierColor,
      moveIds: slots.map(s => s.move.id),
      notes: comboText,
      mastery: 0,
      date: todayLocal(),
    });
    setSaveModal(false);
    addToast({ icon:"check", title: t("comboSaved") });
    if (addCalendarEvent) {
      addCalendarEvent({
        date: todayLocal(),
        type: "training",
        title: `Combo Machine — ${saveName || "Combo"}`,
        categories: [...new Set(slots.map(s => s.move.category))],
        moveIds: slots.map(s => s.move.id),
        notes: comboText,
        source: "combo_machine",
      }, { silent: true });
    }
  };

  // ── Combo preview text ─────────────────────────────────────────────────
  const comboPreview = slots.map((s, i) => {
    const parts = [];
    if (i > 0 && s.transition) parts.push({ text: s.transition, type: "trans" });
    parts.push({ text: s.move.name, type: "move", cat: s.move.category });
    return parts;
  }).flat();

  // ════════════════════════════════════════════════════════════════════════
  // MOVE PICKER SCREEN
  // ════════════════════════════════════════════════════════════════════════
  if (screen === "movePicker") return <MovePicker moves={moves} catColors={catColors} combos={combos} onCombosChange={onCombosChange} onBack={() => setScreen("main")} />;

  // ════════════════════════════════════════════════════════════════════════
  // TRANSITION MANAGER SCREEN
  // ════════════════════════════════════════════════════════════════════════
  if (screen === "transitionManager") return <TransitionManager combos={combos} onCombosChange={onCombosChange} onBack={() => setScreen("main")} />;

  // ════════════════════════════════════════════════════════════════════════
  // MAIN SCREEN
  // ════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ position:"absolute", inset:0, zIndex:500, background:C.bg, display:"flex", flexDirection:"column", fontFamily:FONT_BODY }}>
      <style>{`
        @keyframes mb-combo-spin { 0%{transform:rotateX(90deg) scale(0.8);opacity:0} 60%{transform:rotateX(-5deg) scale(1.02);opacity:1} 100%{transform:rotateX(0) scale(1);opacity:1} }
        @keyframes mb-combo-flicker { 0%,49%{opacity:1} 50%,100%{opacity:0.3} }
      `}</style>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", padding:"14px 16px", borderBottom:`1px solid ${C.border}`, background:C.header, flexShrink:0 }}>
        <span style={{ flex:1, fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:16, letterSpacing:1.5, color:C.headerText }}>{t("combine")}</span>
        <button onClick={() => setScreen("transitionManager")} style={{ background:"none", border:"none", cursor:"pointer", padding:6, marginRight:6 }}>
          <Ic n="list" s={20} c={C.headerText}/>
        </button>
        <button onClick={() => setScreen("movePicker")} style={{ background:"none", border:"none", cursor:"pointer", padding:6, marginRight:6 }}>
          <Ic n="filter" s={20} c={C.headerText}/>
        </button>
        <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", padding:6 }}>
          <Ic n="x" s={22} c={C.headerText}/>
        </button>
      </div>

      <SectionBrief desc={t("combineBrief")} stat={`${moves.length} moves in your library`} settings={ctxSettings}/>

      {/* Difficulty bar — COMBINE [N] MOVES, centered as a group */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:18, padding:"10px 16px", borderBottom:`1px solid ${C.borderLight}`, flexShrink:0 }}>
        {/* Left label */}
        <span style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:16, letterSpacing:1.5, color:C.text, textTransform:"uppercase" }}>{t("combine")}</span>
        {/* Counter */}
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={() => changeCount(-1)} disabled={moveCount <= 3}
            style={{ width:38, height:38, borderRadius:10, border:`2px solid ${C.border}`, background:C.surface,
              display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", opacity:moveCount<=3?0.3:1 }}>
            <Ic n="minus" s={16} c={C.text}/>
          </button>
          <span style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:32, color:tierColor, minWidth:30, textAlign:"center", transition:"color 0.2s" }}>{moveCount}</span>
          <button onClick={() => changeCount(1)} disabled={moveCount >= 9}
            style={{ width:38, height:38, borderRadius:10, border:`2px solid ${C.border}`, background:C.surface,
              display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", opacity:moveCount>=9?0.3:1 }}>
            <Ic n="plus" s={16} c={C.text}/>
          </button>
        </div>
        {/* Right label */}
        <span style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:16, letterSpacing:1.5, color:C.text, textTransform:"uppercase" }}>{t("moves")}</span>
      </div>

      {/* Mode toggle: RANDOM | BRANCH DRILL */}
      <div style={{ display:"flex", gap:6, padding:"8px 16px", borderBottom:`1px solid ${C.borderLight}`, flexShrink:0 }}>
        {["random","branch"].map(dm => {
          const active = drillMode === dm;
          return (
            <button key={dm} onClick={() => {
              setDrillMode(dm);
              if (dm === "random") { setBranchRoot(null); }
              setSlots([]); setHasSpun(false); setVisibleCards(new Set());
            }}
              style={{
                flex:1, padding:"7px 0", borderRadius:20,
                border:`1.5px solid ${active ? C.accent : C.border}`,
                background: active ? `${C.accent}18` : C.surface,
                color: active ? C.accent : C.textSec,
                fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:11, letterSpacing:0.8,
                cursor:"pointer",
              }}>
              {dm === "random" ? t("random") : t("branchDrill")}
            </button>
          );
        })}
      </div>

      {/* Branch root picker / message */}
      {drillMode === "branch" && !branchRoot && (
        <div style={{ padding:"12px 16px", maxHeight:200, overflowY:"auto", borderBottom:`1px solid ${C.borderLight}` }}>
          <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:11, color:C.textMuted, letterSpacing:0.5, marginBottom:8 }}>
            {t("pickRootMove")}
          </div>
          {movesWithChildren.length === 0 ? (
            <div style={{ fontSize:13, color:C.textMuted, fontFamily:FONT_BODY, padding:"8px 0" }}>
              {t("branchTooSmall")}
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
              {movesWithChildren.map(m => (
                <button key={m.id} onClick={() => { setBranchRoot(m); setSlots([]); setHasSpun(false); setVisibleCards(new Set()); }}
                  style={{
                    background:C.surface, border:`1.5px solid ${C.border}`, borderRadius:8,
                    padding:"8px 12px", cursor:"pointer", textAlign:"left",
                    display:"flex", alignItems:"center", justifyContent:"space-between",
                  }}>
                  <span style={{ fontFamily:FONT_BODY, fontSize:13, color:C.text }}>{m.name}</span>
                  <span style={{ fontFamily:FONT_DISPLAY, fontSize:10, color:C.textMuted }}>
                    {getDescendants(m.id).length} {t("descendants")}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Branch root selected info + too small warning */}
      {drillMode === "branch" && branchRoot && (
        <div style={{ padding:"8px 16px", borderBottom:`1px solid ${C.borderLight}`, display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
          <Ic n="tree" s={14}/>
          <span style={{ fontFamily:FONT_BODY, fontSize:13, color:C.text, fontWeight:600 }}>{branchRoot.name}</span>
          <span style={{ fontFamily:FONT_DISPLAY, fontSize:10, color:C.textMuted }}>
            ({branchDescendants.length} {t("descendants")})
          </span>
          <button onClick={() => { setBranchRoot(null); setSlots([]); setHasSpun(false); }}
            style={{ marginLeft:"auto", background:"none", border:"none", cursor:"pointer", padding:4 }}>
            <Ic n="x" s={14} c={C.textMuted}/>
          </button>
        </div>
      )}
      {drillMode === "branch" && branchRoot && branchDescendants.length < 3 && (
        <div style={{ padding:"8px 16px", background:`${C.yellow}15`, fontSize:13, color:C.yellow, fontFamily:FONT_BODY }}>
          {t("branchTooSmall")}
        </div>
      )}

      {/* Scrollable card list */}
      <div style={{ flex:1, overflowY:"auto", padding:"12px 16px", WebkitOverflowScrolling:"touch" }}>
        {!hasSpun && (
          <div style={{ textAlign:"center", padding:"40px 20px", color:C.textMuted }}>
            <div style={{ marginBottom:12 }}><Ic n="dices" s={48} c={C.textMuted}/></div>
            <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:14, letterSpacing:1 }}>{t("spin")}</div>
            {pool.length > 0 && <div style={{ fontSize:11, marginTop:6, color:C.textMuted }}>{pool.length} {t("selectMoves").toLowerCase().includes("move") ? "moves" : t("selectMoves")}</div>}
          </div>
        )}

        {slots.map((slot, i) => (
          <div key={i}>
            {/* Transition connector */}
            {i > 0 && (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", margin:"2px 0" }}
                onClick={() => toggleTransLock(i)}>
                {/* Vertical line + arrow */}
                <div style={{ width:1, height:10, background:C.border }}/>
                <span style={{ fontSize:10, color:C.textMuted, lineHeight:1 }}>{"\u2193"}</span>
                {/* Pill */}
                <div style={{
                  background: slot.transLocked ? `${C.yellow}20` : C.surfaceAlt,
                  border: `1.5px solid ${slot.transLocked ? C.yellow : C.border}`,
                  borderRadius:14, padding:"3px 14px", cursor:"pointer",
                  display:"flex", alignItems:"center", gap:6
                }}>
                  <span style={{
                    fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:11, color: slot.transLocked ? C.yellow : C.textSec,
                    animation: spinning && visibleCards.has(i) ? undefined : spinning ? "mb-combo-flicker 0.08s infinite" : undefined,
                  }}>
                    {visibleCards.has(i) || !spinning ? slot.transition : "..."}
                  </span>
                  {hasSpun && !spinning && <span style={{ fontSize:10 }}>{slot.transLocked ? "\u{1F512}" : ""}</span>}
                </div>
                <div style={{ width:1, height:10, background:C.border }}/>
              </div>
            )}

            {/* Move card */}
            <div
              onClick={() => toggleMoveLock(i)}
              style={{
                display:"flex", alignItems:"center", gap:10,
                background: C.surface,
                border: `1.5px solid ${slot.moveLocked ? C.yellow : C.border}`,
                borderRadius:8, overflow:"hidden", cursor: hasSpun && !spinning ? "pointer" : "default",
                opacity: visibleCards.has(i) ? 1 : (spinning ? 0 : 1),
                animation: visibleCards.has(i) && spinning ? "mb-combo-spin 500ms ease-out forwards" : undefined,
                transition: !spinning ? "border-color 0.2s" : undefined,
              }}
            >
              {/* Category color bar */}
              <div style={{ width:4, alignSelf:"stretch", background: getCatColor(slot.move.category), flexShrink:0 }}/>

              {/* Number badge */}
              <div style={{
                width:28, height:28, borderRadius:8, flexShrink:0,
                background: `${getCatColor(slot.move.category)}30`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:13, color: getCatColor(slot.move.category),
                marginLeft:6,
              }}>{i + 1}</div>

              {/* Move info */}
              <div style={{ flex:1, padding:"10px 0", minWidth:0 }}>
                <div style={{
                  fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:16, color:C.text,
                  animation: spinning && !visibleCards.has(i) ? "mb-combo-flicker 0.08s infinite" : undefined,
                  whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
                }}>
                  {visibleCards.has(i) || !spinning ? slot.move.name : "..."}
                </div>
                <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:10, color: getCatColor(slot.move.category), marginTop:2, letterSpacing:0.5 }}>
                  {slot.move.category}
                </div>
              </div>

              {/* Lock badge */}
              {hasSpun && !spinning && (
                <div style={{ padding:"4px 10px 4px 0", fontSize:11, color: slot.moveLocked ? C.yellow : C.textMuted, fontFamily:FONT_DISPLAY, fontWeight:700, display:"flex", alignItems:"center", gap:3 }}>
                  {slot.moveLocked ? <><span>{"\u{1F512}"}</span><span style={{ fontSize:10 }}>LOCKED</span></> : <span style={{ opacity:0.4, fontSize:10 }}>{t("tapToLock")}</span>}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Combo preview */}
        {hasSpun && !spinning && comboPreview.length > 0 && (
          <div style={{ marginTop:14, padding:"10px 12px", background:C.surfaceAlt, borderRadius:8, border:`1px solid ${C.borderLight}` }}>
            <div style={{ fontSize:10, fontFamily:FONT_DISPLAY, fontWeight:700, color:C.textMuted, letterSpacing:1, marginBottom:6 }}>COMBO</div>
            <div style={{ fontSize:13, lineHeight:1.6, fontFamily:FONT_BODY }}>
              {comboPreview.map((p, idx) => (
                <span key={idx}>
                  {p.type === "trans" && <span style={{ color:C.accent, fontStyle:"italic", fontSize:11 }}>{" \u2192 "}{p.text}{" \u2192 "}</span>}
                  {p.type === "move" && <span style={{ color: getCatColor(p.cat), fontWeight:700 }}>{p.text}</span>}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Lock hint */}
        {hasSpun && !spinning && (
          <div style={{ textAlign:"center", marginTop:10, fontSize:10, color:C.textMuted, fontFamily:FONT_BODY }}>
            {t("lockToKeep")}
          </div>
        )}
      </div>

      {/* Bottom buttons */}
      <div style={{ display:"flex", gap:10, padding:"12px 16px", borderTop:`1px solid ${C.border}`, background:C.bg, flexShrink:0 }}>
        {hasSpun && !spinning && (
          <>
            <button onClick={openSaveModal}
              style={{ flex:1, padding:14, borderRadius:8, border:`2px solid ${C.green}`, background:"transparent",
                fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:13, letterSpacing:1, color:C.green, cursor:"pointer" }}>
              {t("saveAsSet")}
            </button>
            <button onClick={() => { setSlots([]); setHasSpun(false); setVisibleCards(new Set()); }}
              style={{ padding:"14px 18px", borderRadius:8, border:`2px solid ${C.red}`, background:"transparent",
                fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:13, letterSpacing:1, color:C.red, cursor:"pointer" }}>
              {t("discard")}
            </button>
          </>
        )}
        <button onClick={generateCombo} disabled={spinning || !pool.length}
          style={{ flex: hasSpun && !spinning ? 1 : "1 1 100%", padding:14, borderRadius:8, border:"none",
            background: !pool.length ? C.surfaceAlt : tierColor, color:"#fff",
            fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:14, letterSpacing:1.5,
            cursor: spinning || !pool.length ? "not-allowed" : "pointer", opacity: spinning ? 0.6 : 1 }}>
          {hasSpun ? t("spinAgain") : t("spin")}
        </button>
      </div>

      {/* Save modal */}
      {saveModal && (
        <div style={{ position:"absolute", inset:0, zIndex:600, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
          onClick={() => setSaveModal(false)}>
          <div onClick={e => e.stopPropagation()}
            style={{ background:C.bg, borderRadius:16, padding:24, width:"100%", maxWidth:380, border:`1px solid ${C.border}` }}>
            <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:14, color:C.text, marginBottom:14, letterSpacing:1 }}>{t("setName")}</div>
            <input value={saveName} onChange={e => setSaveName(e.target.value)}
              style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:`1.5px solid ${C.border}`, background:C.surface,
                color:C.text, fontFamily:FONT_BODY, fontSize:14, outline:"none", boxSizing:"border-box" }}
              autoFocus/>
            <div style={{ marginTop:12, padding:"8px 0", fontSize:11, color:C.textMuted, fontFamily:FONT_BODY, lineHeight:1.5 }}>
              {comboPreview.map((p, idx) => (
                <span key={idx}>
                  {p.type === "trans" && <span style={{ color:C.accent, fontStyle:"italic" }}>{" \u2192 "}{p.text}{" \u2192 "}</span>}
                  {p.type === "move" && <span style={{ color:getCatColor(p.cat), fontWeight:600 }}>{p.text}</span>}
                </span>
              ))}
            </div>
            <button onClick={doSave}
              style={{ width:"100%", marginTop:14, padding:12, borderRadius:8, border:"none",
                background:C.green, color:"#fff", fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:13, letterSpacing:1, cursor:"pointer" }}>
              {t("saveAsSet")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// MOVE PICKER SUB-SCREEN
// ════════════════════════════════════════════════════════════════════════════
const MovePicker = ({ moves, catColors, combos, onCombosChange, onBack }) => {
  const t = useT();
  const allIds = moves.map(m => m.id);
  const [selected, setSelected] = useState(() => combos.selectedMoveIds ? new Set(combos.selectedMoveIds) : new Set(allIds));
  const [search, setSearch] = useState("");

  const getCatColor = (cat) => catColors?.[cat] || CAT_COLORS[cat] || C.textMuted;

  const filtered = search
    ? moves.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.category.toLowerCase().includes(search.toLowerCase()))
    : moves;

  const toggle = (id) => {
    setSelected(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const selectAll = () => setSelected(new Set(allIds));

  const done = () => {
    const sel = selected.size === moves.length ? null : [...selected];
    onCombosChange({ ...combos, selectedMoveIds: sel });
    onBack();
  };

  const allSelected = selected.size === allIds.length;
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(allIds));

  return (
    <div style={{ position:"absolute", inset:0, zIndex:500, background:C.bg, display:"flex", flexDirection:"column", fontFamily:FONT_BODY }}>
      {/* Header — FlashCards-style: no border, no surface fill */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 14px 8px", flexShrink:0 }}>
        <button onClick={onBack} style={{ background:"none", border:"none", cursor:"pointer", padding:4, display:"flex" }}>
          <Ic n="chevL" s={18} c={C.textMuted} />
        </button>
        <span style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:16, letterSpacing:2, color:C.text, textTransform:"uppercase" }}>{t("selectMoves")}</span>
        <span style={{ width:26 }}/>{/* spacer to balance back button */}
      </div>

      {/* Search */}
      <div style={{ padding:"6px 16px 8px", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, background:C.surface, border:`1.5px solid ${C.border}`, borderRadius:8, padding:"8px 12px" }}>
          <Ic n="search" s={14} c={C.textMuted}/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("search")}
            style={{ flex:1, border:"none", background:"transparent", color:C.text, fontFamily:FONT_BODY, fontSize:13, outline:"none" }}/>
        </div>
      </div>

      {/* Select All / count — FlashCards link style */}
      <div style={{ padding:"0 16px 6px", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
        <button onClick={toggleAll}
          style={{ background:"none", border:"none", cursor:"pointer", padding:"6px 0",
            fontFamily:FONT_DISPLAY, fontSize:11, fontWeight:700, letterSpacing:1, textTransform:"uppercase", color:C.accent }}>
          {allSelected ? t("deselectAll") : t("selectAll")}
        </button>
        <span style={{ fontSize:11, color:C.textMuted }}>{selected.size} / {moves.length}</span>
      </div>

      {/* List — tile-style, item color carries identity */}
      <div style={{ flex:1, overflowY:"auto", WebkitOverflowScrolling:"touch", padding:"4px 16px 12px" }}>
        {filtered.map(m => {
          const checked = selected.has(m.id);
          const catColor = getCatColor(m.category);
          return (
            <button key={m.id} onClick={() => toggle(m.id)}
              style={{ display:"flex", alignItems:"center", gap:12, width:"100%",
                padding:"12px 12px 12px 14px",
                background: checked ? `${catColor}18` : C.surface,
                border:"none", borderLeft:`4px solid ${catColor}`, borderRadius:8,
                cursor:"pointer", marginBottom:6, minHeight:44 }}>
              {/* Checkbox */}
              <div style={{ width:22, height:22, borderRadius:5, border:`2px solid ${checked ? catColor : C.textMuted}`,
                background: checked ? catColor : "transparent",
                display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                {checked && <Ic n="check" s={14} c="#fff"/>}
              </div>
              {/* Info — name in category color, subtitle muted */}
              <div style={{ flex:1, minWidth:0, textAlign:"left" }}>
                <div style={{ fontFamily:FONT_DISPLAY, fontSize:14, fontWeight:700, color:catColor, letterSpacing:0.3, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{m.name}</div>
                <div style={{ fontFamily:FONT_BODY, fontSize:11, color:C.textMuted }}>{m.category}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Done — FlashCards Start button parity */}
      <div style={{ padding:"12px 16px", flexShrink:0 }}>
        <button onClick={done}
          style={{ width:"100%", padding:14, borderRadius:8, border:"none", background:C.accent, color:"#fff",
            fontFamily:FONT_DISPLAY, fontWeight:800, fontSize:16, letterSpacing:1.5, cursor:"pointer", textTransform:"uppercase", minHeight:48 }}>
          {t("done")}
        </button>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// TRANSITION MANAGER SUB-SCREEN
// ════════════════════════════════════════════════════════════════════════════
const TransitionManager = ({ combos, onCombosChange, onBack }) => {
  const t = useT();
  const [list, setList] = useState([...(combos.transitions?.length ? combos.transitions : DEFAULT_TRANSITIONS)]);
  const [input, setInput] = useState("");

  const addTrans = () => {
    const name = input.trim();
    if (!name || list.includes(name)) return;
    setList(prev => [...prev, name]);
    setInput("");
  };

  const removeTrans = (i) => {
    if (list.length <= 1) return;
    setList(prev => prev.filter((_, idx) => idx !== i));
  };

  const done = () => {
    onCombosChange({ ...combos, transitions: list });
    onBack();
  };

  return (
    <div style={{ position:"absolute", inset:0, zIndex:500, background:C.bg, display:"flex", flexDirection:"column", fontFamily:FONT_BODY }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", padding:"14px 16px", borderBottom:`1px solid ${C.border}`, background:C.header, flexShrink:0 }}>
        <button onClick={onBack} style={{ background:"none", border:"none", cursor:"pointer", padding:6, marginRight:8 }}>
          <Ic n="chevR" s={20} c={C.headerText} />
        </button>
        <span style={{ flex:1, fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:14, letterSpacing:1.2, color:C.headerText }}>{t("manageTransitions")}</span>
      </div>

      {/* Add input */}
      <div style={{ display:"flex", gap:8, padding:"12px 16px", borderBottom:`1px solid ${C.borderLight}`, flexShrink:0 }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addTrans()}
          placeholder={t("manageTransitions")}
          style={{ flex:1, padding:"10px 12px", borderRadius:8, border:`1.5px solid ${C.border}`, background:C.surface,
            color:C.text, fontFamily:FONT_BODY, fontSize:13, outline:"none" }}/>
        <button onClick={addTrans}
          style={{ padding:"10px 18px", borderRadius:8, border:"none", background:C.accent, color:"#fff",
            fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:13, cursor:"pointer" }}>
          +
        </button>
      </div>

      {/* List */}
      <div style={{ flex:1, overflowY:"auto", WebkitOverflowScrolling:"touch" }}>
        {list.map((tr, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", padding:"12px 16px", borderBottom:`1px solid ${C.borderLight}` }}>
            <span style={{ flex:1, fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:13, color:C.text }}>{tr}</span>
            <button onClick={() => removeTrans(i)} disabled={list.length <= 1}
              style={{ background:"none", border:"none", cursor: list.length <= 1 ? "not-allowed" : "pointer", padding:6, opacity: list.length <= 1 ? 0.3 : 1 }}>
              <Ic n="x" s={16} c={C.red}/>
            </button>
          </div>
        ))}
      </div>

      {/* Done */}
      <div style={{ padding:"12px 16px", borderTop:`1px solid ${C.border}`, flexShrink:0 }}>
        <button onClick={done}
          style={{ width:"100%", padding:14, borderRadius:8, border:"none", background:C.accent, color:"#fff",
            fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:13, letterSpacing:1.5, cursor:"pointer" }}>
          {t("done")}
        </button>
      </div>
    </div>
  );
};
