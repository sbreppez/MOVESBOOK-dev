import React, { useState, useEffect, useRef, useCallback } from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { CAT_COLORS, CATS } from '../../constants/categories';
import { Ic } from '../shared/Ic';
import { useT } from '../../hooks/useTranslation';

// ── Audio ───────────────────────────────────────────────────────────────────
let _audioCtx = null;
const getAudioCtx = () => {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (_audioCtx.state === "suspended") _audioCtx.resume();
  return _audioCtx;
};
const beep = (freq, dur, vol) => {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.frequency.value = freq; g.gain.value = vol;
    osc.start(); osc.stop(ctx.currentTime + dur / 1000);
  } catch {}
};

// ── Chip data (translation keys) ────────────────────────────────────────────
const TECH_CHIPS = {
  labEnergy:       ["chipBurst","chipSmooth","chipFlowy","chipSharp","chipHeavy","chipLight","chipShaking","chipBouncing","chipFreezeAir","chipFallingApart","chipLetDrop"],
  labDirection:    ["chipClockwise","chipCounterCW","chipSwitchBoth","chipBackwards","chipDiagonal","chipZigzag"],
  labLevel:        ["chipStayLow","chipStayHigh","chipLevelChange","chipFloorOnly","chipStandingOnly"],
  labSpeed:        ["chipSlowMo","chipDoubleTime","chipSpeedUp","chipSlowDown","chipThreeSpeed"],
  labBodyFocus:    ["chipHandsOnly","chipNoHands","chipElbowsShoulders","chipHipsLead","chipHeadMovement","chipOneArm"],
  labFloorContact: ["chip5Points","chip3Points","chip1Point","chipNoHandsFloor","chipKneesElbows"],
  labPath:         ["chipStraightLine","chipCircle","chipOneSpot","chipTravelFar","chipGetSmaller","chipGetBigger"],
};
const CONCEPT_CHIPS = {
  labNature:    ["chipWater","chipFire","chipWind","chipEarthquake","chipLightning","chipTree","chipWaves","chipSmoke","chipIce"],
  labAnimals:   ["chipCat","chipSnake","chipGorilla","chipSpider","chipEagle","chipOctopus","chipPanther","chipFrog"],
  labEmotions:  ["chipRage","chipJoy","chipConfidence","chipConfusion","chipCalmPower","chipSadness","chipSurprise","chipFear"],
  labTextures:  ["chipLiquid","chipRubber","chipGlass","chipSteel","chipSand","chipElastic","chipSticky"],
  labCharacters:["chipRobot","chipDrunk","chipAstronaut","chipPuppet","chipOldMan","chipBaby","chipNinja","chipBoxer"],
  labDailyLife: ["chipHeavyDoor","chipCatchFalling","chipWakingUp","chipWalkingIce","chipStuckMud","chipCarryHuge"],
};

const TECH_CATS = Object.keys(TECH_CHIPS);
const CONCEPT_CATS = Object.keys(CONCEPT_CHIPS);

const TIP_KEYS = ["labTip1","labTip2","labTip3","labTip4","labTip5"];

const emptyTech = () => {
  const o = {};
  TECH_CATS.forEach(k => o[k] = null);
  return o;
};

// ── Main Component ──────────────────────────────────────────────────────────
export const Lab = ({ moves, cats, catColors, lab, onLabChange, onSaveMove, addToast, onClose, addCalendarEvent }) => {
  const t = useT();

  // ── State ──
  const [screen, setScreen] = useState("select"); // "select" | "workspace" | "pickSeed"
  const [mode, setMode] = useState(null); // "technical" | "conceptual" | "collide" | "grow"
  const [baseName, setBaseName] = useState("");
  const [seedMove, setSeedMove] = useState(null);
  const [techSel, setTechSel] = useState(emptyTech);
  const [conceptSel, setConceptSel] = useState({ category: null, value: null });
  const [tipIdx, setTipIdx] = useState(() => Math.floor(Math.random() * TIP_KEYS.length));

  // Timer
  const [timerState, setTimerState] = useState("idle"); // "idle"|"running"|"done"
  const [timerDuration, setTimerDuration] = useState(0);
  const [timerRemaining, setTimerRemaining] = useState(0);
  const timerRef = useRef(null);
  const timerStartRef = useRef(0);

  // Save modal
  const [saveModal, setSaveModal] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveCat, setSaveCat] = useState("");

  // Custom chip add
  const [addingChip, setAddingChip] = useState(null); // { pool:"technical"|"conceptual", category:"labEnergy" }
  const [newChipText, setNewChipText] = useState("");

  // Inline saved flash
  const [savedFlash, setSavedFlash] = useState(false);
  const savedTimer = useRef(null);

  // Long press for chip removal
  const longPressRef = useRef(null);
  const [confirmRemove, setConfirmRemove] = useState(null); // { pool, category, chip }

  // ── Timer logic ──
  useEffect(() => {
    if (timerState !== "running") return;
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - timerStartRef.current;
      const rem = Math.max(0, timerDuration - elapsed);
      setTimerRemaining(rem);
      if (rem <= 0) {
        clearInterval(timerRef.current);
        setTimerState("done");
        beep(1100, 300, 0.4);
        try { navigator.vibrate?.([80, 40, 80]); } catch {}
      }
    }, 100);
    return () => clearInterval(timerRef.current);
  }, [timerState, timerDuration]);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const startTimer = (ms) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerDuration(ms);
    setTimerRemaining(ms);
    timerStartRef.current = Date.now();
    setTimerState("running");
  };

  // ── Custom chips helper ──
  const getCustomChips = (pool, cat) => {
    return lab?.customChips?.[pool]?.[cat] || [];
  };

  const addCustomChip = (pool, cat, chip) => {
    const updated = { ...lab };
    if (!updated.customChips) updated.customChips = { technical: {}, conceptual: {} };
    if (!updated.customChips[pool]) updated.customChips[pool] = {};
    if (!updated.customChips[pool][cat]) updated.customChips[pool][cat] = [];
    if (!updated.customChips[pool][cat].includes(chip)) {
      updated.customChips[pool][cat] = [...updated.customChips[pool][cat], chip];
    }
    onLabChange(updated);
  };

  const removeCustomChip = (pool, cat, chip) => {
    const updated = { ...lab };
    if (updated.customChips?.[pool]?.[cat]) {
      updated.customChips[pool][cat] = updated.customChips[pool][cat].filter(c => c !== chip);
    }
    onLabChange(updated);
    // Deselect if this chip was selected
    if (pool === "technical" || pool === "both") {
      setTechSel(prev => prev[cat] === chip ? { ...prev, [cat]: null } : prev);
    }
    if (pool === "conceptual" || pool === "both") {
      if (conceptSel.value === chip) setConceptSel({ category: null, value: null });
    }
    setConfirmRemove(null);
  };

  // ── Chip selection logic ──
  const handleTechChip = (cat, chip) => {
    setTechSel(prev => ({ ...prev, [cat]: prev[cat] === chip ? null : chip }));
  };

  const handleConceptChip = (cat, chip) => {
    if (conceptSel.category === cat && conceptSel.value === chip) {
      setConceptSel({ category: null, value: null });
    } else {
      setConceptSel({ category: cat, value: chip });
    }
  };

  // ── Randomise ──
  const randomiseTech = () => {
    const newSel = {};
    TECH_CATS.forEach(cat => {
      const all = [...TECH_CHIPS[cat], ...getCustomChips("technical", cat)];
      newSel[cat] = all[Math.floor(Math.random() * all.length)];
    });
    setTechSel(newSel);
  };

  const randomiseConcept = () => {
    const catKey = CONCEPT_CATS[Math.floor(Math.random() * CONCEPT_CATS.length)];
    const all = [...CONCEPT_CHIPS[catKey], ...getCustomChips("conceptual", catKey)];
    const chip = all[Math.floor(Math.random() * all.length)];
    setConceptSel({ category: catKey, value: chip });
  };

  const handleRandomise = () => {
    if (mode === "technical") randomiseTech();
    else if (mode === "conceptual") randomiseConcept();
    else if (mode === "collide" || mode === "grow") { randomiseTech(); randomiseConcept(); }
  };

  // ── Reset ──
  const handleReset = () => {
    setTechSel(emptyTech());
    setConceptSel({ category: null, value: null });
    setBaseName("");
    setSeedMove(null);
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerState("idle");
    setTimerDuration(0);
    setTimerRemaining(0);
  };

  // ── Live preview text ──
  const buildPreview = () => {
    const base = mode === "grow" && seedMove ? seedMove.name : (baseName.trim() || t("freestyleExploration"));
    if (mode === "grow") {
      const techParts = TECH_CATS
        .filter(cat => techSel[cat])
        .map(cat => { const k = techSel[cat]; return k.startsWith("chip") ? t(k) : k; });
      const conceptPart = conceptSel.value
        ? (conceptSel.value.startsWith("chip") ? t(conceptSel.value) : conceptSel.value) : null;
      const parts = [...techParts];
      if (conceptPart) parts.push(conceptPart);
      return parts.length ? `${t("growSeedLabel")} ${base} — ${parts.join(" + ")}` : `${t("growSeedLabel")} ${base}`;
    }
    if (mode === "technical" || mode === "collide") {
      const techParts = TECH_CATS
        .filter(cat => techSel[cat])
        .map(cat => {
          const k = techSel[cat];
          return k.startsWith("chip") ? t(k) : k;
        });
      if (mode === "technical") {
        return techParts.length ? `${base} — ${techParts.join(" + ")}` : base;
      }
      // collide
      const conceptPart = conceptSel.value
        ? (conceptSel.value.startsWith("chip") ? t(conceptSel.value) : conceptSel.value)
        : null;
      const parts = [];
      if (techParts.length) parts.push(techParts.join(" + "));
      if (conceptPart) parts.push(`${conceptPart} ${t("labEnergyWord")}`);
      return parts.length ? `${base} — ${parts.join(" + ")}` : base;
    }
    if (mode === "conceptual") {
      if (!conceptSel.value) return base;
      const label = conceptSel.value.startsWith("chip") ? t(conceptSel.value) : conceptSel.value;
      const catLabel = t(conceptSel.category);
      return `${base} — ${t("labWith")} ${label} ${t("labEnergyWord")} (${catLabel})`;
    }
    return base;
  };

  // ── Save to library ──
  const handleSaveOpen = () => {
    let defaultName, defaultCat;
    if (mode === "grow" && seedMove) {
      defaultName = `${seedMove.name} (${t("variation")})`;
      defaultCat = seedMove.category;
    } else {
      defaultName = baseName.trim()
        ? `${baseName.trim()} (${t("variation")})`
        : `${t("explore")} ${t("variation")} ${new Date().toISOString().split("T")[0]}`;
      const matchedMove = baseName.trim() ? moves.find(m => m.name.toLowerCase() === baseName.trim().toLowerCase()) : null;
      defaultCat = matchedMove?.category || (cats.length ? cats[0] : "Footworks");
    }
    setSaveName(defaultName);
    setSaveCat(defaultCat);
    setSaveModal(true);
  };

  const handleSave = () => {
    const preview = buildPreview();
    const moveData = {
      name: saveName.trim() || `${t("explore")} ${t("variation")}`,
      category: saveCat,
      description: preview,
      mastery: 0,
      date: new Date().toISOString().split("T")[0],
      status: "wip",
      attrs: {},
      origin: "creation",
    };
    if (mode === "grow" && seedMove) {
      moveData.parentId = seedMove.id;
    }
    onSaveMove(moveData);
    setSaveModal(false);
    setSavedFlash(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSavedFlash(false), 2500);
    if (addCalendarEvent) {
      addCalendarEvent({
        date: new Date().toISOString().split("T")[0],
        type: "training",
        title: `Lab — ${saveName.trim() || t("variation")}`,
        categories: saveCat ? [saveCat] : [],
        source: "lab",
      }, { silent: true });
    }
  };

  // ── Long press handler for custom chip removal ──
  const startLongPress = (pool, cat, chip) => {
    longPressRef.current = setTimeout(() => {
      setConfirmRemove({ pool, category: cat, chip });
    }, 500);
  };
  const endLongPress = () => {
    if (longPressRef.current) clearTimeout(longPressRef.current);
  };

  // ── Format timer ──
  const fmtTimer = (ms) => {
    const s = Math.ceil(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // ── Render chip row ──
  const renderChips = (catKey, chips, pool, accentColor, selected, onSelect) => {
    const customs = getCustomChips(pool, catKey);
    const allChips = [...chips, ...customs];
    return (
      <div key={catKey} style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 11, color: C.textMuted, letterSpacing: 1, marginBottom: 6 }}>
          {t(catKey)}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {allChips.map(chip => {
            const isCustom = customs.includes(chip);
            const label = chip.startsWith("chip") ? t(chip) : chip;
            const isActive = typeof selected === "string" ? selected === chip : selected?.[catKey] === chip;
            return (
              <button key={chip}
                onClick={() => onSelect(catKey, chip)}
                onPointerDown={isCustom ? () => startLongPress(pool, catKey, chip) : undefined}
                onPointerUp={isCustom ? endLongPress : undefined}
                onPointerLeave={isCustom ? endLongPress : undefined}
                style={{
                  borderRadius: 20, padding: "6px 14px", border: `1.5px solid ${isActive ? accentColor : C.border}`,
                  background: isActive ? accentColor + "22" : C.surface,
                  color: isActive ? accentColor : C.textSec,
                  fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 12, cursor: "pointer",
                  transition: "all 0.15s", whiteSpace: "nowrap",
                }}>
                {label}
              </button>
            );
          })}
          {/* Add custom chip button */}
          <button
            onClick={() => { setAddingChip({ pool, category: catKey }); setNewChipText(""); }}
            style={{
              borderRadius: 20, padding: "6px 12px", border: `1.5px dashed ${C.border}`,
              background: "none", color: C.textMuted, fontFamily: FONT_DISPLAY, fontWeight: 700,
              fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
            }}>
            <Ic n="plus" s={12} c={C.textMuted} /> {t("addCustomChip")}
          </button>
        </div>
        {/* Inline add chip input */}
        {addingChip?.pool === pool && addingChip?.category === catKey && (
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <input
              autoFocus
              value={newChipText}
              onChange={e => setNewChipText(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && newChipText.trim()) {
                  addCustomChip(pool, catKey, newChipText.trim());
                  setAddingChip(null);
                }
                if (e.key === "Escape") setAddingChip(null);
              }}
              placeholder={t("addCustomChip")}
              style={{
                flex: 1, padding: "6px 10px", borderRadius: 8, border: `1px solid ${C.border}`,
                background: C.surface, color: C.text, fontFamily: FONT_BODY, fontSize: 13,
                outline: "none",
              }}
            />
            <button
              onClick={() => { if (newChipText.trim()) { addCustomChip(pool, catKey, newChipText.trim()); setAddingChip(null); } }}
              style={{
                borderRadius: 8, padding: "6px 12px", background: accentColor, color: "#fff",
                border: "none", fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 12, cursor: "pointer",
              }}>
              <Ic n="check" s={14} c="#fff" />
            </button>
            <button
              onClick={() => setAddingChip(null)}
              style={{
                borderRadius: 8, padding: "6px 8px", background: C.surfaceAlt, color: C.textMuted,
                border: "none", cursor: "pointer",
              }}>
              <Ic n="x" s={14} c={C.textMuted} />
            </button>
          </div>
        )}
      </div>
    );
  };

  // ── Render: Mode Select Screen ────────────────────────────────────────────
  const renderModeSelect = () => {
    const modes = [
      { key: "technical",  emoji: "🔧", color: C.blue,   desc: "technicalDesc" },
      { key: "conceptual", emoji: "🎨", color: C.yellow, desc: "conceptualDesc" },
      { key: "collide",    emoji: "💥", color: C.red,    desc: "collideDesc" },
      { key: "grow",       emoji: "🌱", color: C.green,  desc: "growDesc" },
    ];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "20px 0" }}>
        {modes.map(m => (
          <button key={m.key}
            onClick={() => {
              if (m.key === "grow") { setMode("grow"); setScreen("pickSeed"); }
              else { setMode(m.key); setScreen("workspace"); }
            }}
            style={{
              background: C.surface, border: `2px solid ${m.color}30`, borderRadius: 16,
              padding: "22px 20px", cursor: "pointer", textAlign: "left",
              transition: "all 0.15s", display: "flex", alignItems: "center", gap: 16,
            }}
            onPointerEnter={e => e.currentTarget.style.borderColor = m.color}
            onPointerLeave={e => e.currentTarget.style.borderColor = m.color + "30"}>
            <span style={{ fontSize: 32 }}>{m.emoji}</span>
            <div>
              <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 16, color: m.color, letterSpacing: 1 }}>
                {t(m.key).toUpperCase()}
              </div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSec, marginTop: 4 }}>
                {t(m.desc)}
              </div>
            </div>
          </button>
        ))}
      </div>
    );
  };

  // ── Render: Seed Picker (Grow mode) ────────────────────────────────────────
  const renderSeedPicker = () => {
    const eligible = moves.filter(m => m.mastery >= 50);
    const grouped = {};
    eligible.forEach(m => {
      if (!grouped[m.category]) grouped[m.category] = [];
      grouped[m.category].push(m);
    });
    const catKeys = Object.keys(grouped);

    return (
      <div style={{ padding: "20px 0" }}>
        <button onClick={() => { setScreen("select"); setMode(null); }}
          style={{
            background: "none", border: "none", cursor: "pointer", display: "flex",
            alignItems: "center", gap: 6, padding: "8px 0", color: C.textMuted, marginBottom: 12,
          }}>
          <span style={{ fontSize: 14 }}>←</span>
          <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 12, letterSpacing: 0.5 }}>
            {t("grow").toUpperCase()}
          </span>
        </button>

        <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 14, color: C.green, letterSpacing: 1, marginBottom: 16 }}>
          🌱 {t("pickSeedMove")}
        </div>

        {catKeys.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "40px 20px", color: C.textMuted,
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🌱</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, lineHeight: 1.5 }}>
              {t("noEligibleMoves")}
            </div>
          </div>
        ) : (
          catKeys.map(cat => (
            <div key={cat} style={{ marginBottom: 16 }}>
              <div style={{
                fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 11, color: catColors?.[cat] || CAT_COLORS[cat] || C.textMuted,
                letterSpacing: 0.5, marginBottom: 6, textTransform: "uppercase",
              }}>
                {cat}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {grouped[cat].map(m => (
                  <button key={m.id} onClick={() => {
                    setSeedMove(m);
                    setBaseName(m.name);
                    setScreen("workspace");
                  }}
                    style={{
                      background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 10,
                      padding: "10px 14px", cursor: "pointer", textAlign: "left",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      transition: "border-color 0.15s",
                    }}
                    onPointerEnter={e => e.currentTarget.style.borderColor = C.green}
                    onPointerLeave={e => e.currentTarget.style.borderColor = C.border}>
                    <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.text }}>{m.name}</span>
                    <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 11, color: C.green }}>
                      {m.mastery}%
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  // ── Render: Workspace ─────────────────────────────────────────────────────
  const renderWorkspace = () => {
    const isTech = mode === "technical" || mode === "collide" || mode === "grow";
    const isConcept = mode === "conceptual" || mode === "collide" || mode === "grow";
    const modeColor = mode === "technical" ? C.blue : mode === "conceptual" ? C.yellow : mode === "grow" ? C.green : C.red;

    return (
      <div style={{ paddingBottom: 24 }}>
        {/* Back to mode select */}
        <button onClick={() => { setScreen("select"); handleReset(); }}
          style={{
            background: "none", border: "none", cursor: "pointer", display: "flex",
            alignItems: "center", gap: 6, padding: "8px 0", color: C.textMuted, marginBottom: 8,
          }}>
          <span style={{ fontSize: 14 }}>←</span>
          <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 12, letterSpacing: 0.5 }}>
            {t(mode).toUpperCase()}
          </span>
        </button>

        {/* Seed move banner (grow mode) */}
        {mode === "grow" && seedMove && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", marginBottom: 16,
            background: `${C.green}15`, border: `1.5px solid ${C.green}40`, borderRadius: 12,
          }}>
            <span style={{ fontSize: 20 }}>🌱</span>
            <div>
              <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 10, color: C.green, letterSpacing: 0.5 }}>
                {t("growSeedLabel").toUpperCase()}
              </div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.text, fontWeight: 600 }}>
                {seedMove.name}
              </div>
            </div>
            <button onClick={() => { setScreen("pickSeed"); setSeedMove(null); setBaseName(""); }}
              style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", padding: 4 }}>
              <Ic n="edit" s={14} c={C.green} />
            </button>
          </div>
        )}

        {/* Base move input (hidden in grow mode) */}
        {mode !== "grow" && (
          <div style={{ marginBottom: 20 }}>
            <input
              value={baseName}
              onChange={e => setBaseName(e.target.value)}
              placeholder={t("baseMoveOptional")}
              style={{
                width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`,
                background: C.surface, color: C.text, fontFamily: FONT_BODY, fontSize: 14,
                outline: "none", transition: "border-color 0.15s",
              }}
              onFocus={e => e.target.style.borderColor = modeColor}
              onBlur={e => e.target.style.borderColor = C.border}
            />
          </div>
        )}

        {/* Technical chips */}
        {isTech && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 14, color: C.blue, letterSpacing: 1, marginBottom: 12 }}>
              🔧 {t("technical").toUpperCase()}
            </div>
            {TECH_CATS.map(cat => renderChips(cat, TECH_CHIPS[cat], "technical", C.blue, techSel, handleTechChip))}
          </div>
        )}

        {/* Conceptual chips */}
        {isConcept && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 14, color: C.yellow, letterSpacing: 1, marginBottom: 12 }}>
              🎨 {t("conceptual").toUpperCase()}
            </div>
            {CONCEPT_CATS.map(cat => {
              const isSelected = conceptSel.category === cat ? conceptSel.value : null;
              return renderChips(cat, CONCEPT_CHIPS[cat], "conceptual", C.yellow, isSelected, handleConceptChip);
            })}
          </div>
        )}

        {/* Live Preview */}
        <div style={{
          background: C.surfaceAlt, borderRadius: 12, padding: "14px 16px", marginBottom: 20,
          border: `1px solid ${C.border}`,
        }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 10, color: C.textMuted, letterSpacing: 1, marginBottom: 6 }}>
            {t("livePreview")}
          </div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.text, lineHeight: 1.5, minHeight: 20 }}>
            {buildPreview()}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {mode === "collide" ? (
            <>
              <button onClick={handleRandomise}
                style={{
                  flex: 1, minWidth: 120, padding: "12px 16px", borderRadius: 10,
                  background: C.red, color: "#fff", border: "none",
                  fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 13, letterSpacing: 1,
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}>
                💥 {t("collide").toUpperCase()}
              </button>
              <button onClick={handleRandomise}
                style={{
                  padding: "12px 16px", borderRadius: 10, background: C.surfaceAlt,
                  color: C.text, border: `1.5px solid ${C.border}`,
                  fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 13, cursor: "pointer",
                }}>
                {t("reRoll")}
              </button>
            </>
          ) : (
            <button onClick={handleRandomise}
              style={{
                flex: 1, padding: "12px 16px", borderRadius: 10,
                background: modeColor, color: "#fff", border: "none",
                fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 13, letterSpacing: 1,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}>
              🎲 {t("randomise")}
            </button>
          )}
          <button onClick={handleReset}
            style={{
              padding: "12px 16px", borderRadius: 10, background: C.surfaceAlt,
              color: C.textMuted, border: `1.5px solid ${C.border}`,
              fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 13, cursor: "pointer",
            }}>
            {t("reset")}
          </button>
        </div>

        {/* Creativity Timer */}
        <div style={{
          background: C.surface, borderRadius: 12, padding: "14px 16px", marginBottom: 20,
          border: `1px solid ${C.border}`,
        }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 10, color: C.textMuted, letterSpacing: 1, marginBottom: 10 }}>
            {t("creativityTimer")}
          </div>
          {timerState === "idle" && (
            <div style={{ display: "flex", gap: 8 }}>
              {[60000, 180000, 300000].map(ms => (
                <button key={ms} onClick={() => startTimer(ms)}
                  style={{
                    flex: 1, padding: "10px 0", borderRadius: 8,
                    background: C.surfaceAlt, color: C.text, border: `1.5px solid ${C.border}`,
                    fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 13, cursor: "pointer",
                  }}>
                  {ms / 60000} MIN
                </button>
              ))}
            </div>
          )}
          {timerState === "running" && (
            <div>
              <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 28, color: C.text, textAlign: "center", marginBottom: 8 }}>
                {fmtTimer(timerRemaining)}
              </div>
              <div style={{ height: 4, borderRadius: 2, background: C.border }}>
                <div style={{
                  height: "100%", borderRadius: 2, background: C.green,
                  width: `${Math.max(0, (timerRemaining / timerDuration) * 100)}%`,
                  transition: "width 0.1s linear",
                }} />
              </div>
              <button onClick={() => { clearInterval(timerRef.current); setTimerState("idle"); }}
                style={{
                  marginTop: 10, padding: "6px 14px", borderRadius: 8, background: C.surfaceAlt,
                  color: C.textMuted, border: `1px solid ${C.border}`, fontFamily: FONT_DISPLAY,
                  fontWeight: 700, fontSize: 11, cursor: "pointer",
                }}>
                {t("cancel")}
              </button>
            </div>
          )}
          {timerState === "done" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 16, color: C.green, marginBottom: 4 }}>
                {t("timesUp")}
              </div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.green }}>
                {t("didYouFindSomething")}
              </div>
              <button onClick={() => setTimerState("idle")}
                style={{
                  marginTop: 10, padding: "6px 14px", borderRadius: 8, background: C.surfaceAlt,
                  color: C.textMuted, border: `1px solid ${C.border}`, fontFamily: FONT_DISPLAY,
                  fontWeight: 700, fontSize: 11, cursor: "pointer",
                }}>
                {t("reset")}
              </button>
            </div>
          )}
        </div>

        {/* Save to Library */}
        <button onClick={handleSaveOpen}
          style={{
            width: "100%", padding: "14px 0", borderRadius: 10,
            background: C.accent, color: "#fff", border: "none",
            fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 14, letterSpacing: 1,
            cursor: "pointer",
          }}>
          {t("saveToLibrary")}
        </button>
      </div>
    );
  };

  // ── Collide result display ────────────────────────────────────────────────
  // (integrated into live preview already)

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 500, background: C.bg, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "13px 18px", borderBottom: `1px solid ${C.border}`, background: C.header, flexShrink: 0,
      }}>
        <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 16, color: C.brown, letterSpacing: 1 }}>
          {t("explore")}
        </span>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}>
          <Ic n="x" s={20} c={C.textMuted} />
        </button>
      </div>

      {/* Saved flash */}
      {savedFlash && (
        <div style={{
          position: "absolute", top: 54, left: 12, right: 12, zIndex: 610,
          background: C.surface, border: `2px solid ${C.green}`, borderRadius: 10,
          padding: "11px 14px", boxShadow: "0 6px 24px rgba(0,0,0,0.25)",
          display: "flex", alignItems: "center", gap: 10,
          animation: "toastIn 0.3s ease",
        }}>
          <span style={{ fontSize: 16 }}>✅</span>
          <span style={{ fontWeight: 800, fontSize: 13, color: C.green, letterSpacing: 0.5 }}>
            {t("saveToLibrary")}
          </span>
        </div>
      )}

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 16px" }}>
        {/* Hint banner */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", marginTop: 12,
          background: C.surfaceAlt, borderRadius: 10, marginBottom: 12,
        }}>
          <div style={{ flex: 1, fontFamily: FONT_BODY, fontSize: 12, color: C.textMuted, fontStyle: "italic", lineHeight: 1.4 }}>
            {t(TIP_KEYS[tipIdx])}
          </div>
          <button onClick={() => setTipIdx(prev => (prev + 1) % TIP_KEYS.length)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, flexShrink: 0, display: "flex" }}>
            <Ic n="refresh" s={14} c={C.textMuted} />
          </button>
        </div>

        {screen === "select" && renderModeSelect()}
        {screen === "pickSeed" && renderSeedPicker()}
        {screen === "workspace" && renderWorkspace()}
      </div>

      {/* Save Modal */}
      {saveModal && (
        <div onClick={() => setSaveModal(false)}
          style={{
            position: "absolute", inset: 0, zIndex: 600, background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          }}>
          <div onClick={e => e.stopPropagation()}
            style={{
              background: C.bg, borderRadius: 16, padding: 24, width: "100%", maxWidth: 380,
              border: `1px solid ${C.border}`,
            }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 14, color: C.brown, marginBottom: 16 }}>
              {t("saveToLibrary")}
            </div>

            {/* Name */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 11, color: C.textMuted, letterSpacing: 0.5, marginBottom: 4 }}>
                {t("name")}
              </div>
              <input value={saveName} onChange={e => setSaveName(e.target.value)}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`,
                  background: C.surface, color: C.text, fontFamily: FONT_BODY, fontSize: 13, outline: "none",
                }} />
            </div>

            {/* Category */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 11, color: C.textMuted, letterSpacing: 0.5, marginBottom: 4 }}>
                {t("category")}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {(cats.length ? cats : CATS).map(cat => (
                  <button key={cat} onClick={() => setSaveCat(cat)}
                    style={{
                      borderRadius: 20, padding: "5px 12px",
                      border: `1.5px solid ${saveCat === cat ? (catColors?.[cat] || CAT_COLORS[cat] || C.accent) : C.border}`,
                      background: saveCat === cat ? (catColors?.[cat] || CAT_COLORS[cat] || C.accent) + "22" : C.surface,
                      color: saveCat === cat ? (catColors?.[cat] || CAT_COLORS[cat] || C.accent) : C.textSec,
                      fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 11, cursor: "pointer",
                    }}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div style={{
              background: C.surfaceAlt, borderRadius: 8, padding: "10px 12px", marginBottom: 16,
              fontSize: 12, color: C.textSec, fontFamily: FONT_BODY, lineHeight: 1.4,
            }}>
              {buildPreview()}
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setSaveModal(false)}
                style={{
                  padding: "10px 18px", borderRadius: 8, background: C.surfaceAlt,
                  color: C.textSec, border: "none", fontFamily: FONT_DISPLAY, fontWeight: 700,
                  fontSize: 13, cursor: "pointer",
                }}>
                {t("cancel")}
              </button>
              <button onClick={handleSave} disabled={!saveName.trim()}
                style={{
                  padding: "10px 18px", borderRadius: 8, background: C.accent, color: "#fff",
                  border: "none", fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 13,
                  cursor: "pointer", opacity: saveName.trim() ? 1 : 0.5,
                }}>
                {t("save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm remove chip modal */}
      {confirmRemove && (
        <div onClick={() => setConfirmRemove(null)}
          style={{
            position: "absolute", inset: 0, zIndex: 600, background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          }}>
          <div onClick={e => e.stopPropagation()}
            style={{
              background: C.bg, borderRadius: 14, padding: 20, width: "100%", maxWidth: 320,
              border: `1px solid ${C.border}`, textAlign: "center",
            }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 8 }}>
              {t("removeChipConfirm")}
            </div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSec, marginBottom: 16 }}>
              "{confirmRemove.chip}"
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button onClick={() => setConfirmRemove(null)}
                style={{
                  padding: "8px 20px", borderRadius: 8, background: C.surfaceAlt,
                  color: C.textSec, border: "none", fontFamily: FONT_DISPLAY, fontWeight: 700,
                  fontSize: 13, cursor: "pointer",
                }}>
                {t("cancel")}
              </button>
              <button onClick={() => removeCustomChip(confirmRemove.pool, confirmRemove.category, confirmRemove.chip)}
                style={{
                  padding: "8px 20px", borderRadius: 8, background: C.accent + "22",
                  color: C.accent, border: `1.5px solid ${C.accent}`, fontFamily: FONT_DISPLAY,
                  fontWeight: 700, fontSize: 13, cursor: "pointer",
                }}>
                {t("delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
