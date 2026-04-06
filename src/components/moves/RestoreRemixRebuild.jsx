import React, { useState, useEffect, useRef, useCallback } from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { CAT_COLORS } from '../../constants/categories';
import { Ic } from '../shared/Ic';
import { useT } from '../../hooks/useTranslation';
import { useSettings } from '../../hooks/useSettings';

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

// ── Mode definitions ────────────────────────────────────────────────────────
const MODES = [
  { key: "restore", color: () => C.blue   },
  { key: "remix",   color: () => C.yellow },
  { key: "rebuild", color: () => C.accent },
];

const modeColor = (key) => {
  const m = MODES.find(m => m.key === key);
  return m ? m.color() : C.accent;
};

// ── Prompt templates ────────────────────────────────────────────────────────
const RESTORE_PROMPTS = [
  "Drill {move} until it feels new again",
  "Take {move} and rebuild it step by step — no shortcuts",
  "Train only foundation vocabulary today — start with {move}",
  "Focus on your weakest category — begin with {move}",
  "Do {move} with no music — find rhythm in the movement itself",
  "Do {move} at half speed — feel the space between the beats",
  "Film yourself doing {move} — watch what you actually look like",
  "Do {move} 20 times without stopping",
  "How do you get into {move}? Train only the entry",
  "Do {move} for 5 minutes straight — nothing else",
  "If you could only throw {move} in a battle — is it clean enough?",
  "Hold the end position of {move} for 10 seconds — find the balance",
  "When did you first learn {move}? Do it like day one, then do it like now",
  "Do {move} at walking pace — no momentum, just control",
  "Do you skip {move} in battles? Figure out why and fix it",
];
const REMIX_PROMPTS = [
  "Take {move} and create 3 versions by changing entry, speed, or exit",
  "Add a thread into {move} — find where it fits",
  "Remove one element from {move} — what fills the gap?",
  "Replace how {move} ends — find a new exit",
  "Shift {move} from on-beat to off-beat",
  "Do {move} at double speed, then half speed — feel the difference",
  "Do {move} but start from the opposite side",
  "Take {move} and change its level — if it's low, do it high",
  "Reverse {move} — end where you usually start",
  "Find 3 different ways to enter {move}",
  "Find 5 different ways to exit {move}",
  "Do {move} but change levels on every count",
  "Take {move} and make it travel across the floor",
  "Connect {move} directly to something from a different category",
  "Cut {move} in half — just the first part, or just the second",
];
const REBUILD_PROMPTS = [
  "Import a movement from a completely different dance style into {move}",
  "Take elements from {move} and combine them in a new order",
  "Combine {move} with a move you've never connected it to",
  "Build a 15-second round around {move} that tells a story",
  "Build a blow-up sequence: {move} → escalate → climax → freeze",
  "Watch a non-dance video and rebuild {move} with one idea from it",
  "Rebuild {move} using only one arm and both legs",
  "Take {move} and make every count change direction",
  "Invent a transition out of {move} that doesn't exist yet — name it",
  "Do {move} but stay in one square metre of floor",
  "Turn the end position of {move} into a moving pattern",
  "Start lying down and rebuild {move} from the floor up",
  "Do {move} like it's made of rubber — or glass — or liquid",
  "Build a combo starting with {move} where no category repeats",
  "Watch yourself doing {move} in a reflection and build something new from what you see",
];
const TREE_AWARE_PROMPTS = [
  "Find a standalone move with zero children — create its first variation",
  "Pick your deepest branch and add one more level to it",
];

const PROMPT_POOLS = { restore: RESTORE_PROMPTS, remix: REMIX_PROMPTS, rebuild: REBUILD_PROMPTS };

// ── Timer durations ─────────────────────────────────────────────────────────
const TIMER_OPTIONS = [
  { label: "1 MIN",  seconds: 60 },
  { label: "3 MIN",  seconds: 180 },
  { label: "5 MIN",  seconds: 300 },
  { label: "10 MIN", seconds: 600 },
  { label: "custom",  seconds: "custom" },
  { label: "noLimit", seconds: -1 },
];

// ── Component ───────────────────────────────────────────────────────────────
export const RestoreRemixRebuild = ({ moves, catColors, rrr, onRRRChange, addToast, addCalendarEvent, onClose }) => {
  const t = useT();
  const { settings } = useSettings();
  const showMastery = settings.showMastery === true;

  // ── Navigation state ──
  const [screen, setScreen] = useState("modes"); // modes | picker | prompt | summary
  const [mode, setMode] = useState(null); // restore | remix | rebuild

  // ── Summary state ──
  const [summaryNotes, setSummaryNotes] = useState("");
  const [lastPromptText, setLastPromptText] = useState("");
  const [lastTimerDuration, setLastTimerDuration] = useState(0);

  // ── Move picker state ──
  const [selectedMoveId, setSelectedMoveId] = useState(null);
  const [manualMoveName, setManualMoveName] = useState("");

  // ── Prompt state ──
  const [currentPromptIdx, setCurrentPromptIdx] = useState(-1);
  const [isTreeAware, setIsTreeAware] = useState(false);
  const [promptFade, setPromptFade] = useState(true);
  const recentIndices = useRef([]);
  const treeAwareShuffle = useRef(0);

  // ── Timer state ──
  const [timerState, setTimerState] = useState("idle"); // idle | picking | running | done
  const [timerDuration, setTimerDuration] = useState(0);
  const [timerRemaining, setTimerRemaining] = useState(0);
  const timerRef = useRef(null);
  const [customMinutes, setCustomMinutes] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  // ── Tree-aware eligibility ──
  const treeEligible = moves.filter(m => m.parentId).length >= 5;

  // ── Derived ──
  const moveName = selectedMoveId
    ? (moves.find(m => m.id === selectedMoveId)?.name || "")
    : manualMoveName.trim();

  const mc = mode ? modeColor(mode) : C.accent;

  // ── Prompt selection ──
  const pickPrompt = useCallback((forceNew = false) => {
    if (!mode) return;
    const pool = PROMPT_POOLS[mode];
    let useTree = false;

    // Tree-aware: max 1 per 5 shuffles
    if (treeEligible && treeAwareShuffle.current >= 5) {
      useTree = Math.random() < 0.4;
      if (useTree) treeAwareShuffle.current = 0;
    }

    if (useTree) {
      const idx = Math.floor(Math.random() * TREE_AWARE_PROMPTS.length);
      setIsTreeAware(true);
      setCurrentPromptIdx(idx);
      return;
    }

    treeAwareShuffle.current++;
    setIsTreeAware(false);

    let idx;
    let attempts = 0;
    do {
      idx = Math.floor(Math.random() * pool.length);
      attempts++;
    } while (forceNew && recentIndices.current.includes(idx) && attempts < 30);

    recentIndices.current = [...recentIndices.current.slice(-4), idx];
    setCurrentPromptIdx(idx);
  }, [mode, treeEligible]);

  // ── Timer countdown ──
  useEffect(() => {
    if (timerState !== "running") return;
    timerRef.current = setInterval(() => {
      if (timerDuration === -1) {
        // No limit — count UP
        setTimerRemaining(prev => prev + 1);
      } else {
        setTimerRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setTimerState("done");
            beep(1100, 300, 0.4);
            try { navigator.vibrate?.([80, 40, 80]); } catch {}
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [timerState, timerDuration]);

  // ── Cleanup timer on unmount ──
  useEffect(() => () => clearInterval(timerRef.current), []);

  // ── Format time ──
  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // ── Get current prompt text ──
  const getPromptText = () => {
    if (currentPromptIdx < 0) return "";
    const pool = isTreeAware ? TREE_AWARE_PROMPTS : PROMPT_POOLS[mode];
    const template = pool[currentPromptIdx] || pool[0];
    return template.replace(/\{move\}/g, moveName);
  };

  // ── Shuffle with fade ──
  const handleShuffle = () => {
    setPromptFade(false);
    setTimeout(() => {
      pickPrompt(true);
      setPromptFade(true);
    }, 200);
  };

  // ── Screen transitions ──
  const goToMode = (m) => {
    setMode(m);
    setSelectedMoveId(null);
    setManualMoveName("");
    setScreen("picker");
  };

  const goToPrompt = () => {
    recentIndices.current = [];
    treeAwareShuffle.current = 0;
    pickPrompt(false);
    setTimerState("idle");
    setTimerDuration(0);
    setTimerRemaining(0);
    setShowCustomInput(false);
    setCustomMinutes("");
    setScreen("prompt");
  };

  const handleDone = () => {
    clearInterval(timerRef.current);
    // Capture before reset
    setLastPromptText(getPromptText());
    setLastTimerDuration(timerDuration === -1 ? timerRemaining : timerDuration);
    // Save last used
    onRRRChange({
      lastUsed: {
        mode,
        moveId: selectedMoveId || null,
        moveName: moveName || null,
        date: new Date().toISOString().split("T")[0],
      }
    });
    setScreen("summary");
  };

  const handleSaveAndClose = () => {
    const today = new Date().toISOString().split("T")[0];
    const selectedMove = selectedMoveId ? moves.find(m => m.id === selectedMoveId) : null;
    const notesWithPrompt = [summaryNotes.trim(), lastPromptText ? `Prompt: ${lastPromptText}` : ""].filter(Boolean).join("\n\n");
    if (addCalendarEvent) {
      addCalendarEvent({
        date: today, type: "training",
        title: `${t(mode)} — ${moveName}`,
        categories: selectedMove ? [selectedMove.category] : [],
        moveIds: selectedMoveId ? [selectedMoveId] : [],
        duration: lastTimerDuration > 0 ? Math.round(lastTimerDuration / 60) : null,
        notes: notesWithPrompt || null,
        source: "rrr",
      });
    }
    setSummaryNotes("");
    setTimerState("idle");
    setTimerDuration(0);
    setTimerRemaining(0);
    setScreen("modes");
  };

  const handleBack = () => {
    if (screen === "summary") {
      setScreen("prompt");
    } else if (screen === "prompt") {
      clearInterval(timerRef.current);
      setTimerState("idle");
      setTimerDuration(0);
      setTimerRemaining(0);
      setShowCustomInput(false);
      setCustomMinutes("");
      setScreen("picker");
    } else if (screen === "picker") {
      setScreen("modes");
    }
  };

  // ── Group moves by category ──
  const allCats = [...new Set(moves.map(m => m.category))].sort();
  const movesByCat = {};
  allCats.forEach(cat => { movesByCat[cat] = moves.filter(m => m.category === cat); });

  // ── Mastery colour helper ──
  const masteryColor = (v) => v >= 90 ? C.green : v >= 60 ? C.yellow : C.textMuted;

  // ═════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════════════

  return (
    <div style={{ position:"absolute", inset:0, zIndex:500, background:C.bg, display:"flex", flexDirection:"column", overflow:"hidden" }}>

      {/* ── Header bar ── */}
      <div style={{ display:"flex", alignItems:"center", padding:"10px 13px", borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
        {screen !== "modes" ? (
          <button onClick={handleBack} style={{ background:"none", border:"none", cursor:"pointer", padding:4, color:C.text, display:"flex" }}>
            <Ic n="arrow-left" s={18} c={C.text}/>
          </button>
        ) : (
          <div style={{ width:26 }}/>
        )}
        <div style={{ flex:1, textAlign:"center", fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:14, letterSpacing:1.5, color: screen !== "modes" ? mc : C.text }}>
          {screen === "modes" && t("restoreRemixRebuild")}
          {screen === "picker" && t(mode)}
          {screen === "prompt" && t(mode)}
          {screen === "summary" && t(mode)}
        </div>
        <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", padding:4, color:C.textMuted, display:"flex" }}>
          <Ic n="x" s={18} c={C.textMuted}/>
        </button>
      </div>

      {/* ── Content area ── */}
      <div style={{ flex:1, overflowY:"auto", padding:"16px 14px" }}>

        {/* ════════ MODE SELECTOR ════════ */}
        {screen === "modes" && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {MODES.map(m => {
              const c = m.color();
              const isLast = rrr?.lastUsed?.mode === m.key;
              return (
                <button key={m.key} onClick={() => goToMode(m.key)}
                  style={{
                    background:C.surface, borderRadius:14,
                    border: isLast ? `2px solid ${c}4d` : `1px solid ${C.border}`,
                    padding:"20px 20px 20px 24px", textAlign:"left", cursor:"pointer",
                    display:"flex", alignItems:"flex-start", gap:16, position:"relative", overflow:"hidden",
                  }}>
                  {/* Left colour bar */}
                  <div style={{ position:"absolute", left:0, top:0, bottom:0, width:4, background:c }}/>
                  <div>
                    <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:18, letterSpacing:1.5, color:c }}>
                      {t(m.key)}
                    </div>
                    <div style={{ fontFamily:FONT_BODY, fontSize:13, color:C.textMuted, fontStyle:"italic", marginTop:4, lineHeight:1.5 }}>
                      {t(m.key + "Desc")}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* ════════ MOVE PICKER ════════ */}
        {screen === "picker" && (
          <div>
            {/* Library section */}
            {moves.length > 0 ? (
              <>
                <div style={{ fontFamily:FONT_DISPLAY, fontSize:11, letterSpacing:1.5, color:C.textMuted, fontWeight:700, marginBottom:10 }}>
                  {t("pickAMove")}
                </div>
                {allCats.map(cat => {
                  const catMoves = movesByCat[cat];
                  if (!catMoves?.length) return null;
                  const cc = catColors[cat] || CAT_COLORS[cat] || CAT_COLORS.Custom;
                  return (
                    <div key={cat} style={{ marginBottom:12 }}>
                      {/* Category header */}
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                        <div style={{ width:8, height:8, borderRadius:"50%", background:cc, flexShrink:0 }}/>
                        <span style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:12, letterSpacing:1, color:C.textSec }}>{cat}</span>
                      </div>
                      {/* Move rows */}
                      {catMoves.map(mv => {
                        const isSel = selectedMoveId === mv.id;
                        return (
                          <button key={mv.id}
                            onClick={() => { setSelectedMoveId(isSel ? null : mv.id); setManualMoveName(""); }}
                            style={{
                              display:"flex", alignItems:"center", gap:10, width:"100%",
                              background: isSel ? mc + "18" : "transparent",
                              border: isSel ? `1.5px solid ${mc}` : `1px solid ${C.borderLight}`,
                              borderRadius:10, padding:"10px 12px", marginBottom:4, cursor:"pointer",
                              textAlign:"left", transition:"all 0.15s",
                            }}>
                            <div style={{ width:3, height:20, borderRadius:2, background:cc, flexShrink:0 }}/>
                            <span style={{ flex:1, fontFamily:FONT_BODY, fontSize:14, color:C.text }}>{mv.name}</span>
                            {showMastery && <span style={{ fontSize:11, color:masteryColor(mv.mastery||0), fontWeight:700 }}>{mv.mastery||0}%</span>}
                            {isSel && <Ic n="check" s={16} c={mc}/>}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </>
            ) : (
              <div style={{ fontFamily:FONT_BODY, fontSize:13, color:C.textMuted, textAlign:"center", padding:"20px 0" }}>
                {t("noMovesYetTypeBelow")}
              </div>
            )}

            {/* Manual input section */}
            <div style={{ marginTop:moves.length > 0 ? 16 : 0 }}>
              <div style={{ fontFamily:FONT_DISPLAY, fontSize:11, letterSpacing:1.5, color:C.textMuted, fontWeight:700, marginBottom:8 }}>
                {t("orTypeAMove")}
              </div>
              <input
                type="text" value={manualMoveName}
                onChange={e => { setManualMoveName(e.target.value); setSelectedMoveId(null); }}
                placeholder="e.g. Six Step, Windmill..."
                style={{
                  width:"100%", boxSizing:"border-box", background:C.surface,
                  border:`1px solid ${C.border}`, borderRadius:10, padding:12,
                  fontSize:14, fontFamily:FONT_BODY, color:C.text, outline:"none",
                }}
              />
            </div>

            {/* GO button */}
            <button
              onClick={goToPrompt}
              disabled={!moveName}
              style={{
                width:"100%", marginTop:20, padding:14, borderRadius:12, border:"none",
                background: moveName ? mc : C.surfaceAlt,
                color: moveName ? "#fff" : C.textMuted,
                fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:14, letterSpacing:1.2,
                cursor: moveName ? "pointer" : "default", opacity: moveName ? 1 : 0.5,
                transition:"all 0.15s",
              }}>
              {t(mode)}
            </button>
          </div>
        )}

        {/* ════════ PROMPT SCREEN ════════ */}
        {screen === "prompt" && (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
            {/* Mode badge */}
            <div style={{
              background: mc + "26", color:mc, fontFamily:FONT_DISPLAY, fontWeight:700,
              fontSize:11, letterSpacing:1.5, borderRadius:20, padding:"4px 14px",
              border:`1.5px solid ${mc}`, marginBottom:20, textTransform:"uppercase",
            }}>
              {t(mode)}
            </div>

            {/* Move name */}
            <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:28, color:C.text, textAlign:"center", marginBottom:4 }}>
              {moveName}
            </div>

            {/* Prompt card */}
            <div style={{
              background:C.surface, borderRadius:14, padding:20, margin:"16px 0",
              width:"100%", boxSizing:"border-box",
              opacity: promptFade ? 1 : 0, transition:"opacity 0.2s",
            }}>
              <div style={{ fontFamily:FONT_BODY, fontSize:16, color:C.text, lineHeight:1.7, textAlign:"center", fontStyle:"italic" }}>
                {getPromptText()}
              </div>
            </div>

            {/* Shuffle + Timer buttons */}
            <div style={{ display:"flex", gap:10, marginBottom:16, width:"100%", justifyContent:"center" }}>
              <button onClick={handleShuffle}
                style={{
                  flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                  background:C.surfaceHigh, color:C.textSec, border:"none", borderRadius:10,
                  padding:"10px 16px", cursor:"pointer", fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:11,
                  letterSpacing:0.5,
                }}>
                <Ic n="shuffle" s={14} c={C.textSec}/> {t("differentPrompt")}
              </button>
              <button onClick={() => setTimerState(timerState === "idle" ? "picking" : "idle")}
                style={{
                  display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                  background: timerState !== "idle" ? mc + "22" : C.surfaceHigh,
                  color: timerState !== "idle" ? mc : C.textSec,
                  border: timerState !== "idle" ? `1.5px solid ${mc}` : "none",
                  borderRadius:10, padding:"10px 16px", cursor:"pointer",
                  fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:11, letterSpacing:0.5,
                }}>
                <Ic n="timer" s={14} style={{display:"inline-block",verticalAlign:"middle",marginRight:4}}/> {t("timer")}
              </button>
            </div>

            {/* Timer chips */}
            {timerState === "picking" && (
              <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap", justifyContent:"center" }}>
                {TIMER_OPTIONS.map(opt => (
                  <button key={opt.label}
                    onClick={() => {
                      if (opt.seconds === "custom") {
                        setShowCustomInput(true);
                      } else if (opt.seconds === -1) {
                        setShowCustomInput(false); setTimerDuration(-1); setTimerRemaining(0); setTimerState("running");
                      } else {
                        setShowCustomInput(false); setTimerDuration(opt.seconds); setTimerRemaining(opt.seconds); setTimerState("running");
                      }
                    }}
                    style={{
                      background: (opt.seconds === "custom" && showCustomInput) ? mc + "22" : C.surface,
                      border:`1.5px solid ${mc}`, borderRadius:20,
                      padding:"6px 14px", cursor:"pointer", fontFamily:FONT_DISPLAY,
                      fontWeight:700, fontSize:12, color:mc, letterSpacing:0.5,
                    }}>
                    {opt.seconds === "custom" ? t("customTimer") : opt.seconds === -1 ? t("noLimitTimer") : opt.label}
                  </button>
                ))}
              </div>
            )}

            {/* Custom timer input */}
            {timerState === "picking" && showCustomInput && (
              <div style={{ display:"flex", gap:8, marginBottom:16, justifyContent:"center", alignItems:"center" }}>
                <input type="number" min="1" max="120" value={customMinutes}
                  onChange={e => setCustomMinutes(e.target.value)}
                  placeholder="min"
                  style={{
                    width:60, textAlign:"center", padding:"8px 6px", borderRadius:10,
                    border:`1.5px solid ${mc}`, background:C.surface, color:C.text,
                    fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:14, outline:"none",
                  }}/>
                <button
                  onClick={() => {
                    const mins = parseInt(customMinutes, 10);
                    if (mins > 0) {
                      setTimerDuration(mins * 60); setTimerRemaining(mins * 60);
                      setTimerState("running"); setShowCustomInput(false);
                    }
                  }}
                  style={{
                    padding:"8px 18px", borderRadius:10, border:"none",
                    background:mc, color:"#fff", fontFamily:FONT_DISPLAY,
                    fontWeight:700, fontSize:12, letterSpacing:1, cursor:"pointer",
                    opacity: parseInt(customMinutes, 10) > 0 ? 1 : 0.4,
                  }}>
                  {t("go")}
                </button>
              </div>
            )}

            {/* Timer running / done */}
            {(timerState === "running" || timerState === "done") && (
              <div style={{ width:"100%", marginBottom:16 }}>
                <div style={{ textAlign:"center", fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:24, color: timerState === "done" ? C.green : mc, marginBottom:8 }}>
                  {timerState === "done" && timerDuration !== -1 ? "TIME'S UP" : fmt(timerRemaining)}
                </div>
                {/* Progress bar — hidden for no-limit mode */}
                {timerDuration > 0 && <div style={{ height:4, borderRadius:2, background:C.surfaceAlt, overflow:"hidden" }}>
                  <div style={{
                    height:"100%", borderRadius:2,
                    background: timerState === "done" ? C.green : mc,
                    width: `${((timerDuration - timerRemaining) / timerDuration) * 100}%`,
                    transition:"width 1s linear",
                  }}/>
                </div>}
              </div>
            )}

            {/* Hint line */}
            <div style={{ textAlign:"center", fontSize:11, color:C.textMuted, lineHeight:1.5,
              padding:"0 16px", marginBottom:8, fontStyle:"italic" }}>
              {t("rrrHint")}
            </div>

            {/* DONE button */}
            <button onClick={handleDone}
              style={{
                width:"100%", marginTop:20, padding:14, borderRadius:12, border:"none",
                background:C.green, color:"#fff", fontFamily:FONT_DISPLAY, fontWeight:900,
                fontSize:14, letterSpacing:1.2, cursor:"pointer",
              }}>
              <Ic n="check" s={14} c="#fff"/> {t("done") || "DONE"}
            </button>
          </div>
        )}

        {/* ════════ SUMMARY SCREEN ════════ */}
        {screen === "summary" && (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"8px 0" }}>
            {/* Mode badge */}
            <div style={{
              background: mc + "26", color:mc, fontFamily:FONT_DISPLAY, fontWeight:700,
              fontSize:11, letterSpacing:1.5, borderRadius:20, padding:"4px 14px",
              border:`1.5px solid ${mc}`, marginBottom:16, textTransform:"uppercase",
            }}>
              {t(mode)}
            </div>

            {/* Checkmark */}
            <div style={{ width:56, height:56, borderRadius:"50%", background:C.green,
              display:"flex", alignItems:"center", justifyContent:"center", marginBottom:12 }}>
              <Ic n="check" s={28} c="#fff"/>
            </div>
            <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:14, letterSpacing:2,
              color:C.green, marginBottom:20, textAlign:"center" }}>
              {t("sessionComplete")}
            </div>

            {/* Move name */}
            <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:22, color:C.text,
              textAlign:"center", marginBottom:6 }}>
              {moveName}
            </div>

            {/* Prompt text */}
            {lastPromptText && (
              <div style={{ background:C.surface, borderRadius:12, padding:16, margin:"8px 0 16px",
                width:"100%", boxSizing:"border-box" }}>
                <div style={{ fontFamily:FONT_BODY, fontSize:14, color:C.textSec,
                  lineHeight:1.6, textAlign:"center", fontStyle:"italic" }}>
                  {lastPromptText}
                </div>
              </div>
            )}

            {/* Duration */}
            {lastTimerDuration > 0 && (
              <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:13, color:C.textMuted,
                marginBottom:16 }}>
                Duration: {Math.round(lastTimerDuration / 60)} min
              </div>
            )}

            {/* Notes */}
            <div style={{ width:"100%", marginBottom:20 }}>
              <textarea
                value={summaryNotes}
                onChange={e => setSummaryNotes(e.target.value)}
                placeholder={t("howDidItGo")}
                rows={3}
                style={{
                  width:"100%", background:C.surface, border:`1px solid ${C.border}`,
                  borderRadius:10, padding:12, color:C.text, fontSize:14,
                  fontFamily:FONT_BODY, resize:"vertical", outline:"none", boxSizing:"border-box",
                }}
              />
            </div>

            {/* SAVE & CLOSE */}
            <button onClick={handleSaveAndClose}
              style={{
                width:"100%", padding:14, borderRadius:12, border:"none",
                background:C.green, color:"#fff", fontFamily:FONT_DISPLAY, fontWeight:900,
                fontSize:14, letterSpacing:1.2, cursor:"pointer",
              }}>
              <Ic n="check" s={14} c="#fff"/> {t("saveAndClose")}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
