import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { Ic } from '../shared/Ic';
import { useT } from '../../hooks/useTranslation';
import { useSettings } from '../../hooks/useSettings';
import { todayLocal } from '../../utils/dateUtils';

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmtTimeTenths = (ms) => {
  const totalSec = Math.floor(ms / 1000);
  const tenths = Math.floor((ms % 1000) / 100);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}.${tenths}`;
};

const fmtDuration = (ms) => {
  const sec = Math.round(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
};

const fmtRoundDuration = (ms) => {
  const sec = Math.round(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}:${String(s).padStart(2, "0")}` : `${s}s`;
};

// ── Audio ────────────────────────────────────────────────────────────────────

let _audioCtx = null;
const getAudioCtx = () => {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (_audioCtx.state === "suspended") _audioCtx.resume();
  return _audioCtx;
};

const beep = (freq, duration, volume) => {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    gain.gain.value = volume;
    osc.start();
    osc.stop(ctx.currentTime + duration / 1000);
  } catch {}
};

const haptic = (pattern) => {
  try { if (navigator.vibrate) navigator.vibrate(pattern); } catch {}
};

// ── Main Component ───────────────────────────────────────────────────────────

export const Spar1v1 = ({ sparring, onSaveSession, addCalendarEvent, rivals, onRivalsChange, addToast, onClose }) => {
  const t = useT();
  const { settings } = useSettings();
  const isDark = (settings.theme) === "dark";

  // ── Screen state ──
  const [screen, setScreen] = useState("setup"); // setup, coinflip, session, summary, prCelebration

  // ── Setup state ──
  const [opponentName, setOpponentName] = useState("");
  const [linkedPersonId, setLinkedPersonId] = useState(null);
  const [showPeoplePicker, setShowPeoplePicker] = useState(false);
  const [targetRounds, setTargetRounds] = useState(0); // 0 = unlimited
  const [hasRoundLimit, setHasRoundLimit] = useState(false);
  const [location, setLocation] = useState("");
  const [firstSide, setFirstSide] = useState(null); // 'user' | 'opponent' | null (coin flip pending)
  const [whoGoesFirstChoice, setWhoGoesFirstChoice] = useState(null); // 'me' | 'opponent' | 'coin'

  // ── Coin flip state ──
  const [flipResult, setFlipResult] = useState(null);
  const [flipDone, setFlipDone] = useState(false);

  // ── Session state ──
  const [currentSide, setCurrentSide] = useState("user");
  const [roundLog, setRoundLog] = useState([]);
  const [roundNum, setRoundNum] = useState(1);
  const [sessionStartMs, setSessionStartMs] = useState(null);
  const [roundStartMs, setRoundStartMs] = useState(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [currentRoundMs, setCurrentRoundMs] = useState(0);
  const timerRef = useRef(null);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showAutoEnd, setShowAutoEnd] = useState(false);

  // ── Summary state ──
  const [editOpponent, setEditOpponent] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [journal, setJournal] = useState("");
  const [completedSession, setCompletedSession] = useState(null);

  // ── PR state ──
  const [prBroken, setPrBroken] = useState(null);

  // ── After-save state ──
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [savedSession, setSavedSession] = useState(null);

  // ── Pending PR detection (shown on summary screen before save) ──
  const pendingPRs = useMemo(() => {
    if (!completedSession) return [];
    const records = sparring.records1v1 || {};
    const prs = [];
    const totalRounds = completedSession.roundLog.length;
    const longestRoundSec = Math.round(Math.max(...completedSession.roundLog.map(r => r.durationMs)) / 1000);
    const totalSec = Math.round(completedSession.totalDuration / 1000);
    if (!records.mostRounds || totalRounds > records.mostRounds.value) {
      prs.push({ type: "mostRounds", value: totalRounds });
    }
    if (!records.longestRound || longestRoundSec > records.longestRound.value) {
      prs.push({ type: "longestRound", value: longestRoundSec });
    }
    if (!records.longestSession || totalSec > records.longestSession.value) {
      prs.push({ type: "longestSession", value: totalSec });
    }
    return prs;
  }, [completedSession, sparring.records1v1]);

  // ── People for autocomplete ──
  const allPeople = (rivals || []).map(r => ({ id: r.id, name: r.name, type: r.type || "rival" }));

  const filteredPeople = opponentName.trim().length > 0
    ? allPeople.filter(p => p.name.toLowerCase().includes(opponentName.trim().toLowerCase())).slice(0, 5)
    : [];

  // ── Timer ──
  useEffect(() => {
    if (screen === "session" && sessionStartMs) {
      timerRef.current = setInterval(() => {
        const now = Date.now();
        setElapsedMs(now - sessionStartMs);
        setCurrentRoundMs(now - (roundStartMs || sessionStartMs));
      }, 100);
      return () => clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [screen, sessionStartMs, roundStartMs]);

  // ── Start Session ──
  const handleStart = () => {
    if (whoGoesFirstChoice === "coin") {
      const result = Math.random() < 0.5 ? "user" : "opponent";
      setFlipResult(result);
      setScreen("coinflip");
      return;
    }
    const side = whoGoesFirstChoice === "me" ? "user" : "opponent";
    setFirstSide(side);
    setCurrentSide(side);
    beginSession(side);
  };

  const beginSession = (side) => {
    const now = Date.now();
    setSessionStartMs(now);
    setRoundStartMs(now);
    setCurrentSide(side);
    setRoundNum(1);
    setRoundLog([]);
    setElapsedMs(0);
    setCurrentRoundMs(0);
    setScreen("session");
    beep(880, 200, 0.3);
    haptic([100]);
  };

  // ── Coin flip auto-advance ──
  useEffect(() => {
    if (screen === "coinflip" && !flipDone) {
      const timer = setTimeout(() => setFlipDone(true), 2200);
      return () => clearTimeout(timer);
    }
  }, [screen, flipDone]);

  const handleCoinDone = () => {
    setFirstSide(flipResult);
    setCurrentSide(flipResult);
    beginSession(flipResult);
  };

  // ── Toggle side (tap anywhere) ──
  const handleToggle = useCallback(() => {
    if (showEndConfirm || showAutoEnd) return;
    const now = Date.now();
    const roundDuration = now - (roundStartMs || sessionStartMs);

    const entry = { roundNumber: roundNum, side: currentSide, durationMs: roundDuration };
    const newLog = [...roundLog, entry];
    setRoundLog(newLog);

    const newRoundNum = roundNum + 1;
    setRoundNum(newRoundNum);
    setRoundStartMs(now);
    setCurrentRoundMs(0);

    const nextSide = currentSide === "user" ? "opponent" : "user";
    setCurrentSide(nextSide);

    beep(currentSide === "user" ? 660 : 880, 150, 0.25);
    haptic([50]);

    // Check auto-end
    if (hasRoundLimit && targetRounds > 0 && newLog.length >= targetRounds) {
      setShowAutoEnd(true);
    }
  }, [roundNum, currentSide, roundLog, roundStartMs, sessionStartMs, showEndConfirm, showAutoEnd, hasRoundLimit, targetRounds]);

  // ── End Session ──
  const handleEndSession = useCallback(() => {
    clearInterval(timerRef.current);

    // Capture in-progress round
    const now = Date.now();
    const finalRoundDuration = now - (roundStartMs || sessionStartMs);
    const finalLog = [...roundLog, { roundNumber: roundNum, side: currentSide, durationMs: finalRoundDuration }];

    const totalDuration = now - sessionStartMs;
    const userRounds = finalLog.filter(r => r.side === "user").length;
    const opponentRounds = finalLog.filter(r => r.side === "opponent").length;
    const userTotalMs = finalLog.filter(r => r.side === "user").reduce((s, r) => s + r.durationMs, 0);
    const opponentTotalMs = finalLog.filter(r => r.side === "opponent").reduce((s, r) => s + r.durationMs, 0);

    const session = {
      id: Date.now(),
      opponent: opponentName.trim(),
      opponentId: linkedPersonId,
      location: location.trim(),
      targetRounds: hasRoundLimit ? targetRounds : null,
      roundLog: finalLog,
      totalDuration,
      userRounds,
      opponentRounds,
      userTotalMs,
      opponentTotalMs,
      journal: null,
      date: new Date().toISOString(),
      firstSide: firstSide || "user",
    };

    setCompletedSession(session);
    setEditOpponent(session.opponent);
    setEditLocation(session.location);
    setShowEndConfirm(false);
    setShowAutoEnd(false);
    setScreen("summary");
  }, [roundLog, roundNum, currentSide, roundStartMs, sessionStartMs, opponentName, linkedPersonId, location, hasRoundLimit, targetRounds, firstSide]);

  // ── Save ──
  const handleSave = () => {
    const session = {
      ...completedSession,
      opponent: editOpponent.trim() || completedSession.opponent,
      location: editLocation.trim(),
      journal: journal.trim() || null,
    };

    // PR check
    const records = { ...(sparring.records1v1 || {}) };
    const newPRs = [];
    const totalRounds = session.roundLog.length;
    const longestRound = Math.max(...session.roundLog.map(r => r.durationMs));
    const longestRoundSec = Math.round(longestRound / 1000);

    if (!records.mostRounds || totalRounds > records.mostRounds.value) {
      records.mostRounds = { value: totalRounds, date: session.date };
      newPRs.push({ type: "mostRounds", value: totalRounds });
    }
    if (!records.longestRound || longestRoundSec > records.longestRound.value) {
      records.longestRound = { value: longestRoundSec, date: session.date };
      newPRs.push({ type: "longestRound", value: longestRoundSec });
    }
    const totalSec = Math.round(session.totalDuration / 1000);
    if (!records.longestSession || totalSec > records.longestSession.value) {
      records.longestSession = { value: totalSec, date: session.date };
      newPRs.push({ type: "longestSession", value: totalSec });
    }

    const updatedSparring = {
      ...sparring,
      sessions1v1: [session, ...(sparring.sessions1v1 || [])],
      records1v1: records,
    };

    onSaveSession(session, updatedSparring);

    // Calendar event
    if (addCalendarEvent) {
      addCalendarEvent({
        date: todayLocal(),
        type: "training",
        title: `1v1 Spar vs ${session.opponent || t("opponent")}`,
        duration: Math.round((session.totalDuration || 0) / 60000) || 1,
        notes: session.location ? `${t("locationLabel")}: ${session.location}` : null,
        source: "spar-1v1",
      }, { silent: true });
    }

    // Link to person's spar history
    if (linkedPersonId && onRivalsChange) {
      const sparEntry = {
        date: session.date,
        rounds: session.roundLog.length,
        totalDuration: session.totalDuration,
        roundLog: session.roundLog,
        perspective: "self",
        importedAt: null,
        importedFrom: null,
      };
      onRivalsChange(prev => prev.map(r =>
        r.id === linkedPersonId
          ? { ...r, sparHistory: [...(r.sparHistory || []), sparEntry] }
          : r
      ));
    }

    setSavedSession(session);

    // PR celebration or after-save
    if (newPRs.length > 0) {
      setPrBroken(newPRs[0]);
      setScreen("prCelebration");
    } else if (!linkedPersonId && session.opponent) {
      setShowAddPerson(true);
    } else {
      if (addToast) addToast({ icon: "check", title: t("sessionSaved") });
      onClose();
    }
  };

  // ── JSON Export ──
  const handleShareJSON = async () => {
    const session = {
      ...completedSession,
      opponent: editOpponent.trim() || completedSession.opponent,
      location: editLocation.trim(),
    };

    const exportData = {
      _format: "movesbook-spar-v1",
      session: {
        type: "1v1",
        opponent: session.opponent,
        location: session.location,
        date: session.date,
        rounds: session.roundLog.length,
        totalDuration: session.totalDuration,
        roundLog: session.roundLog,
        userRounds: session.userRounds,
        opponentRounds: session.opponentRounds,
        userTotalMs: session.userTotalMs,
        opponentTotalMs: session.opponentTotalMs,
      },
    };

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const safeName = (session.opponent || "partner").replace(/[^a-zA-Z0-9]/g, "_");
    const dateStr = todayLocal();
    const filename = `MOVESBOOK_SPAR_${safeName}_${dateStr}.json`;

    try {
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], filename, { type: "application/json" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: `MovesBook Spar — ${session.opponent}` });
          return;
        }
      }
      // Fallback: download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch(e) { console.warn("[MB] Spar1v1 share fallback download failed (Capacitor: needs @capacitor/share):", e); }
  };

  // ── Add person after save ──
  const handleAddPerson = (type) => {
    if (!savedSession || !onRivalsChange) return;
    const sparEntry = {
      date: savedSession.date,
      rounds: savedSession.roundLog.length,
      totalDuration: savedSession.totalDuration,
      roundLog: savedSession.roundLog,
      perspective: "self",
      importedAt: null,
      importedFrom: null,
    };
    const newPerson = {
      id: Date.now(),
      name: savedSession.opponent,
      type,
      photo: null,
      crew: "",
      city: "",
      instagram: "",
      stance: "unknown",
      strongDomains: [],
      signatureMoves: "",
      gamePlan: "",
      sparringJournal: "",
      targetWhen: "",
      targetWhere: "",
      confidence: null,
      battles: [],
      sparHistory: [sparEntry],
      videoRefs: [],
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
    };
    onRivalsChange(prev => [...prev, newPerson]);
    setShowAddPerson(false);
    if (addToast) addToast({ icon: "check", title: t("sessionSaved") });
    onClose();
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ── SETUP SCREEN ──
  // ═══════════════════════════════════════════════════════════════════════════

  if (screen === "setup") {
    const canStart = opponentName.trim().length > 0 && whoGoesFirstChoice !== null;

    return (
      <div style={{ position:"absolute", inset:0, zIndex:500, background:C.bg, display:"flex", flexDirection:"column" }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"13px 18px", borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
          <span style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:16, letterSpacing:2, color:C.text, textTransform:"uppercase" }}>
            {t("oneVsOne")}
          </span>
          <button onClick={onClose} style={{ background:C.surfaceAlt, border:`1px solid ${C.border}`, cursor:"pointer", color:C.textSec, padding:5, borderRadius:7, display:"flex" }}>
            <Ic n="x" s={14}/>
          </button>
        </div>

        <div style={{ flex:1, overflow:"auto", padding:18 }}>
          {/* Opponent name */}
          <div style={{ marginBottom:24 }}>
            <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:11, color:C.textMuted, letterSpacing:1.5, marginBottom:10, textTransform:"uppercase" }}>
              {t("opponentName")}
            </div>
            <div style={{ position:"relative" }}>
              <input
                type="text"
                value={opponentName}
                onChange={(e) => {
                  setOpponentName(e.target.value);
                  setLinkedPersonId(null);
                  if (e.target.value.trim().length > 0) setShowPeoplePicker(true);
                  else setShowPeoplePicker(false);
                }}
                onFocus={() => { if (opponentName.trim().length > 0) setShowPeoplePicker(true); }}
                placeholder={t("opponentNamePlaceholder")}
                style={{ width:"100%", padding:"12px 14px", borderRadius:10, border:`1.5px solid ${C.border}`, background:C.surface, color:C.text, fontFamily:FONT_BODY, fontSize:14, outline:"none", boxSizing:"border-box" }}
              />
              {showPeoplePicker && filteredPeople.length > 0 && !linkedPersonId && (
                <div style={{ position:"absolute", top:"100%", left:0, right:0, zIndex:10, background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, marginTop:4, overflow:"hidden", boxShadow:"0 4px 12px rgba(0,0,0,0.2)" }}>
                  {filteredPeople.map(p => (
                    <button key={p.id} onClick={() => {
                      setOpponentName(p.name);
                      setLinkedPersonId(p.id);
                      setShowPeoplePicker(false);
                    }}
                      style={{ width:"100%", padding:"10px 14px", border:"none", background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", gap:8, textAlign:"left" }}>
                      <Ic n={p.type==="rival"?"swords":p.type==="sparringMate"?"fist":"users"} s={12} c={C.textMuted}/>
                      <span style={{ fontFamily:FONT_BODY, fontSize:14, color:C.text }}>{p.name}</span>
                      <span style={{ fontFamily:FONT_DISPLAY, fontSize:10, color:C.textMuted, marginLeft:"auto", textTransform:"uppercase" }}>
                        {p.type === "sparringMate" ? t("sparringMate") : p.type === "crew" ? t("crew") : t("rivals")}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {linkedPersonId && (
                <div style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", fontSize:11, color:C.green, fontFamily:FONT_DISPLAY, fontWeight:700 }}>
                  ✓ {t("linked")}
                </div>
              )}
            </div>
          </div>

          {/* Round count */}
          <div style={{ marginBottom:24 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
              <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:11, color:C.textMuted, letterSpacing:1.5, textTransform:"uppercase" }}>
                {t("roundCountOptional")}
              </div>
              <button onClick={() => { setHasRoundLimit(!hasRoundLimit); if (!hasRoundLimit) setTargetRounds(5); }}
                style={{ width:40, height:22, borderRadius:11, background: hasRoundLimit ? C.accent : C.border, border:"none", cursor:"pointer", position:"relative", transition:"background 0.2s", flexShrink:0 }}>
                <div style={{ position:"absolute", top:3, left: hasRoundLimit ? 21 : 3, width:16, height:16, borderRadius:"50%", background:"#fff", transition:"left 0.2s", boxShadow:"0 1px 3px rgba(0,0,0,0.3)" }}/>
              </button>
            </div>
            {hasRoundLimit && (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:20 }}>
                <button onClick={() => setTargetRounds(Math.max(1, targetRounds - 1))}
                  style={{ width:44, height:44, borderRadius:12, border:`2px solid ${C.border}`, background:C.surface, cursor:"pointer", fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:22, color:C.text, display:"flex", alignItems:"center", justifyContent:"center" }}>−</button>
                <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:44, color:C.text, minWidth:50, textAlign:"center" }}>{targetRounds}</div>
                <button onClick={() => setTargetRounds(Math.min(30, targetRounds + 1))}
                  style={{ width:44, height:44, borderRadius:12, border:`2px solid ${C.border}`, background:C.surface, cursor:"pointer", fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:22, color:C.text, display:"flex", alignItems:"center", justifyContent:"center" }}>+</button>
              </div>
            )}
            {!hasRoundLimit && (
              <div style={{ fontSize:11, color:C.textMuted, fontStyle:"italic" }}>{t("unlimitedRounds")}</div>
            )}
          </div>

          {/* Location */}
          <div style={{ marginBottom:24 }}>
            <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:11, color:C.textMuted, letterSpacing:1.5, marginBottom:10, textTransform:"uppercase" }}>
              {t("locationLabel")}
            </div>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t("locationPlaceholder")}
              style={{ width:"100%", padding:"12px 14px", borderRadius:10, border:`1.5px solid ${C.border}`, background:C.surface, color:C.text, fontFamily:FONT_BODY, fontSize:14, outline:"none", boxSizing:"border-box" }}
            />
          </div>

          {/* Who goes first */}
          <div style={{ marginBottom:24 }}>
            <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:11, color:C.textMuted, letterSpacing:1.5, marginBottom:10, textTransform:"uppercase" }}>
              {t("whoGoesFirst")}
            </div>
            <div style={{ display:"flex", gap:8 }}>
              {[
                { id: "me", label: t("me"), icon: "user" },
                { id: "opponent", label: opponentName.trim() || t("opponent"), icon: "swords" },
                { id: "coin", label: t("coinFlip"), icon: "dices" },
              ].map(opt => {
                const active = whoGoesFirstChoice === opt.id;
                return (
                  <button key={opt.id} onClick={() => setWhoGoesFirstChoice(opt.id)}
                    style={{ flex:1, padding:"14px 8px", borderRadius:12, border:`2px solid ${active ? C.accent : C.border}`,
                      background: active ? C.accent + "14" : C.surface, cursor:"pointer", textAlign:"center", transition:"all 0.15s" }}>
                    <div style={{ marginBottom:4 }}><Ic n={opt.icon} s={24} c={active ? C.accent : C.textMuted}/></div>
                    <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:11, color: active ? C.accent : C.text, letterSpacing:0.5,
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{opt.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* How it works */}
          <div style={{ background:C.surface, borderRadius:8, padding:14, border:`1px solid ${C.border}` }}>
            <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:11, color:C.textMuted, letterSpacing:1, marginBottom:6, textTransform:"uppercase" }}>
              {t("howItWorks")}
            </div>
            <div style={{ fontSize:13, color:C.textSec, lineHeight:1.6 }}>
              {t("oneVsOneHowItWorks")}
            </div>
          </div>
        </div>

        {/* Start button */}
        <div style={{ padding:"14px 18px 24px", flexShrink:0 }}>
          <button onClick={handleStart} disabled={!canStart}
            style={{ width:"100%", padding:16, borderRadius:12, border:"none",
              background: canStart ? C.accent : C.surfaceHigh, color: canStart ? "#fff" : C.textMuted,
              cursor: canStart ? "pointer" : "default", fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:16, letterSpacing:1.5, transition:"all 0.15s" }}>
            {t("startSession")}
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ── COIN FLIP SCREEN ──
  // ═══════════════════════════════════════════════════════════════════════════

  if (screen === "coinflip") {
    const resultLabel = flipResult === "user" ? t("youGoFirst") : `${opponentName.trim() || t("opponent")} ${t("goesFirst")}`;

    return (
      <div onClick={flipDone ? handleCoinDone : undefined}
        style={{ position:"absolute", inset:0, zIndex:500, background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor: flipDone ? "pointer" : "default" }}>
        {/* Coin */}
        <div style={{
          width:120, height:120, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:64, perspective:400,
          animation: "coinFlip 2s ease-out forwards",
        }}>
          <div style={{
            animation: "coinSpin 2s ease-out forwards",
            transformStyle: "preserve-3d",
          }}>
            🪙
          </div>
        </div>

        {/* Result */}
        <div style={{ marginTop:40, textAlign:"center", opacity: flipDone ? 1 : 0, transition:"opacity 0.4s" }}>
          <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:28, color:C.text, letterSpacing:1 }}>
            {resultLabel}
          </div>
          <div style={{ fontSize:13, color:C.textMuted, marginTop:12 }}>
            {t("tapToContinue")}
          </div>
        </div>

        {/* CSS animation */}
        <style>{`
          @keyframes coinSpin {
            0% { transform: rotateY(0deg) scale(1); }
            50% { transform: rotateY(1080deg) scale(1.3); }
            80% { transform: rotateY(1620deg) scale(1.1); }
            100% { transform: rotateY(1800deg) scale(1); }
          }
        `}</style>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ── SESSION SCREEN ──
  // ═══════════════════════════════════════════════════════════════════════════

  if (screen === "session") {
    const isUser = currentSide === "user";
    const bgColor = isUser
      ? (isDark ? "#1a0808" : "#fff0f0")
      : (isDark ? "#080a1a" : "#f0f0ff");
    const sideColor = isUser ? C.accent : (isDark ? "#42a5f5" : "#1565c0");
    const sideLabel = isUser ? t("yourRound") : `${opponentName.trim() || t("opponent")}`;
    const roundLabel = hasRoundLimit && targetRounds > 0
      ? `${t("roundN")} ${roundNum} / ${targetRounds}`
      : `${t("roundN")} ${roundNum}`;

    return (
      <div onClick={handleToggle}
        style={{ position:"absolute", inset:0, zIndex:500, background:bgColor, display:"flex", flexDirection:"column", userSelect:"none", cursor:"pointer", transition:"background 0.3s" }}>

        {/* Top bar */}
        <div style={{ padding:"16px 18px 8px", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
          <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:13, color:C.textMuted, letterSpacing:1, textTransform:"uppercase" }}>
            {roundLabel}
          </div>
          <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:13, color:C.textMuted, letterSpacing:1 }}>
            {fmtTimeTenths(elapsedMs)}
          </div>
        </div>

        {/* Previous rounds */}
        {roundLog.length > 0 && (
          <div style={{ padding:"0 18px 8px", display:"flex", gap:4, flexWrap:"wrap", overflow:"hidden", maxHeight:60 }}>
            {roundLog.slice(-8).map((r, i) => (
              <span key={i} style={{
                padding:"2px 8px", borderRadius:10,
                background: r.side === "user" ? C.accent + "22" : (isDark ? "#42a5f522" : "#1565c022"),
                fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:10,
                color: r.side === "user" ? C.accent : (isDark ? "#42a5f5" : "#1565c0"),
              }}>
                R{r.roundNumber}:{fmtRoundDuration(r.durationMs)}
              </span>
            ))}
          </div>
        )}

        {/* Center content */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12 }}>
          <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:20, color:sideColor, letterSpacing:3, textTransform:"uppercase" }}>
            {sideLabel}
          </div>
          <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:72, color:C.text, letterSpacing:2 }}>
            {fmtTimeTenths(currentRoundMs)}
          </div>
          <div style={{ fontSize:13, color:C.textMuted, marginTop:8, textTransform:"uppercase" }}>
            {t("tapToSwitch")}
          </div>
        </div>

        {/* End session button */}
        <div style={{ padding:"12px 18px 28px", flexShrink:0 }}>
          <button onClick={(e) => { e.stopPropagation(); setShowEndConfirm(true); }}
            style={{ width:"100%", padding:14, borderRadius:12, border:`1.5px solid ${C.accent}22`, background:C.accent + "18", color:C.accent, cursor:"pointer", fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:13, letterSpacing:1, textTransform:"uppercase" }}>
            {t("endSession")}
          </button>
        </div>

        {/* End confirmation modal */}
        {showEndConfirm && (
          <div onClick={(e) => e.stopPropagation()} style={{ position:"fixed", inset:0, zIndex:600, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
            <div style={{ background:C.surface, borderRadius:16, padding:24, maxWidth:320, width:"100%", textAlign:"center" }}>
              <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:16, color:C.text, marginBottom:8, textTransform:"uppercase" }}>
                {t("endSessionConfirm")}
              </div>
              <div style={{ fontSize:13, color:C.textMuted, marginBottom:20 }}>
                {roundLog.length + 1} {t("roundsCompleted")}
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={() => setShowEndConfirm(false)}
                  style={{ flex:1, padding:12, borderRadius:10, border:`1px solid ${C.border}`, background:C.surfaceAlt, color:C.text, cursor:"pointer", fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:13 }}>
                  {t("cancel")}
                </button>
                <button onClick={handleEndSession}
                  style={{ flex:1, padding:12, borderRadius:10, border:"none", background:C.accent, color:"#fff", cursor:"pointer", fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:13 }}>
                  {t("endSession")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Auto-end modal */}
        {showAutoEnd && (
          <div onClick={(e) => e.stopPropagation()} style={{ position:"fixed", inset:0, zIndex:600, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
            <div style={{ background:C.surface, borderRadius:16, padding:24, maxWidth:320, width:"100%", textAlign:"center" }}>
              <div style={{ marginBottom:8 }}><Ic n="bell" s={32} c={C.textMuted}/></div>
              <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:16, color:C.text, marginBottom:8, textTransform:"uppercase" }}>
                {t("targetReached")}
              </div>
              <div style={{ fontSize:13, color:C.textMuted, marginBottom:20 }}>
                {targetRounds} {t("roundsCompleted")}
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={() => setShowAutoEnd(false)}
                  style={{ flex:1, padding:12, borderRadius:10, border:`1px solid ${C.border}`, background:C.surfaceAlt, color:C.text, cursor:"pointer", fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:13 }}>
                  {t("keepGoing")}
                </button>
                <button onClick={handleEndSession}
                  style={{ flex:1, padding:12, borderRadius:10, border:"none", background:C.accent, color:"#fff", cursor:"pointer", fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:13 }}>
                  {t("endSession")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ── SUMMARY SCREEN ──
  // ═══════════════════════════════════════════════════════════════════════════

  if (screen === "summary" && completedSession) {
    const s = completedSession;
    const longestRound = Math.max(...s.roundLog.map(r => r.durationMs));

    return (
      <div style={{ position:"absolute", inset:0, zIndex:500, background:C.bg, display:"flex", flexDirection:"column" }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"13px 18px", borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
          <span style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:16, letterSpacing:2, color:C.text, textTransform:"uppercase" }}>
            {t("sessionSummary")}
          </span>
          <button onClick={() => { onClose(); }} style={{ background:C.surfaceAlt, border:`1px solid ${C.border}`, cursor:"pointer", color:C.textSec, padding:5, borderRadius:7, display:"flex" }}>
            <Ic n="x" s={14}/>
          </button>
        </div>

        <div style={{ flex:1, overflow:"auto", padding:18 }}>
          {/* PR badge */}
          {pendingPRs.length > 0 && (<>
            <style>{`@keyframes mb-pr-pop { 0% { transform:scale(0.5); opacity:0; } 50% { transform:scale(1.1); } 100% { transform:scale(1); opacity:1; } }`}</style>
            <div style={{ background:`${C.accent}14`, border:`1.5px solid ${C.accent}40`, borderRadius:12, padding:"10px 14px", marginBottom:14, display:"flex", alignItems:"center", gap:10, animation:"mb-pr-pop 0.5s ease-out" }}>
              <Ic n="flame" s={22} c={C.accent}/>
              <div>
                <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:11, color:C.accent, letterSpacing:1.5 }}>{t("newPersonalRecord")}</div>
                <div style={{ fontFamily:FONT_BODY, fontSize:11, color:C.textSec, marginTop:2 }}>
                  {pendingPRs.map(pr => pr.type === "mostRounds" ? `${pr.value} ${t("roundsMode") || "rounds"}` : pr.type === "longestRound" ? `${pr.value}s` : fmtDuration(pr.value * 1000)).join(" · ")}
                </div>
              </div>
            </div>
          </>)}

          {/* Editable opponent + location */}
          <div style={{ display:"flex", gap:10, marginBottom:16 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:10, color:C.textMuted, letterSpacing:1, marginBottom:4, textTransform:"uppercase" }}>{t("vs")}</div>
              <input type="text" value={editOpponent} onChange={(e) => setEditOpponent(e.target.value)}
                style={{ width:"100%", padding:"8px 10px", borderRadius:8, border:`1px solid ${C.border}`, background:C.surface, color:C.text, fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:16, outline:"none", boxSizing:"border-box" }}/>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:10, color:C.textMuted, letterSpacing:1, marginBottom:4, textTransform:"uppercase" }}>{t("locationLabel")}</div>
              <input type="text" value={editLocation} onChange={(e) => setEditLocation(e.target.value)}
                style={{ width:"100%", padding:"8px 10px", borderRadius:8, border:`1px solid ${C.border}`, background:C.surface, color:C.text, fontFamily:FONT_BODY, fontSize:14, outline:"none", boxSizing:"border-box" }}/>
            </div>
          </div>

          {/* Date */}
          <div style={{ fontSize:11, color:C.textMuted, marginBottom:16 }}>
            {new Date(s.date).toLocaleDateString()} · {new Date(s.date).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })}
          </div>

          {/* Stats grid */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
            {[
              { label: t("yourRoundsLabel"), value: s.userRounds, color: C.accent },
              { label: t("theirRoundsLabel"), value: s.opponentRounds, color: isDark ? "#42a5f5" : "#1565c0" },
              { label: t("yourTimeLabel"), value: fmtDuration(s.userTotalMs), color: C.accent },
              { label: t("theirTimeLabel"), value: fmtDuration(s.opponentTotalMs), color: isDark ? "#42a5f5" : "#1565c0" },
              { label: t("totalTime"), value: fmtDuration(s.totalDuration), color: C.text },
              { label: t("longestRound"), value: fmtDuration(longestRound), color: C.text },
            ].map((stat, i) => (
              <div key={i} style={{ background:C.surface, borderRadius:8, padding:"12px 14px", border:`1px solid ${C.border}` }}>
                <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:10, color:C.textMuted, letterSpacing:1, marginBottom:4, textTransform:"uppercase" }}>{stat.label}</div>
                <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:22, color:stat.color }}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Per-round breakdown */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:11, color:C.textMuted, letterSpacing:1.5, marginBottom:10, textTransform:"uppercase" }}>
              {t("roundBreakdown")}
            </div>
            <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
              {s.roundLog.map((r, i) => (
                <span key={i} style={{
                  padding:"4px 10px", borderRadius:10,
                  background: r.side === "user" ? C.accent + "22" : (isDark ? "#42a5f522" : "#1565c022"),
                  fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:11,
                  color: r.side === "user" ? C.accent : (isDark ? "#42a5f5" : "#1565c0"),
                }}>
                  R{r.roundNumber}: {fmtRoundDuration(r.durationMs)}
                </span>
              ))}
            </div>
          </div>

          {/* Journal */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:11, color:C.textMuted, letterSpacing:1.5, marginBottom:10, textTransform:"uppercase" }}>
              {t("journal")}
            </div>
            <textarea
              value={journal}
              onChange={(e) => setJournal(e.target.value)}
              placeholder={t("journalPlaceholder")}
              rows={4}
              style={{ width:"100%", padding:"12px 14px", borderRadius:10, border:`1.5px solid ${C.border}`, background:C.surface, color:C.text, fontFamily:FONT_BODY, fontSize:14, outline:"none", resize:"vertical", boxSizing:"border-box" }}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ padding:"10px 18px 24px", flexShrink:0, display:"flex", flexDirection:"column", gap:8 }}>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={handleShareJSON}
              style={{ flex:1, padding:12, borderRadius:10, border:`1px solid ${C.border}`, background:C.surfaceAlt, color:C.text, cursor:"pointer", fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:11, letterSpacing:0.5, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              <Ic n="share-2" s={14}/> {t("shareJSON")}
            </button>
            <button onClick={handleSave}
              style={{ flex:2, padding:12, borderRadius:10, border:"none", background:C.accent, color:"#fff", cursor:"pointer", fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:13, letterSpacing:1 }}>
              {t("save")}
            </button>
          </div>
          <button onClick={onClose}
            style={{ width:"100%", padding:12, borderRadius:10, border:`1px solid ${C.border}`, background:C.surfaceAlt, color:C.textMuted, cursor:"pointer", fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:11 }}>
            {t("discard")}
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ── PR CELEBRATION ──
  // ═══════════════════════════════════════════════════════════════════════════

  if (screen === "prCelebration" && prBroken) {
    const prMessages = {
      mostRounds: `${prBroken.value} ${t("roundsCompleted").toUpperCase()}`,
      longestRound: `${prBroken.value}s ${t("roundN").toUpperCase()}`,
      longestSession: fmtDuration(prBroken.value * 1000),
    };

    return (
      <div style={{ position:"absolute", inset:0, zIndex:500, background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24 }}>
        <div style={{ marginBottom:16 }}><Ic n="flame" s={64} c={C.accent}/></div>
        <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:32, color:C.text, textAlign:"center", letterSpacing:1 }}>
          {prMessages[prBroken.type] || "NEW RECORD"}
        </div>
        <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:16, color:C.accent, marginTop:8, letterSpacing:2, textTransform:"uppercase" }}>
          {t("newPersonalRecord")}
        </div>
        <div style={{ fontSize:13, color:C.textMuted, marginTop:8, textTransform:"uppercase" }}>
          1v1 vs {savedSession?.opponent || ""}
        </div>
        <div style={{ display:"flex", gap:10, marginTop:32 }}>
          <button onClick={() => {
            if (!linkedPersonId && savedSession?.opponent) {
              setShowAddPerson(true);
              setScreen("summary");
            } else {
              if (addToast) addToast({ icon: "check", title: t("sessionSaved") });
              onClose();
            }
          }}
            style={{ padding:"14px 32px", borderRadius:12, border:"none", background:C.accent, color:"#fff", cursor:"pointer", fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:14, letterSpacing:1 }}>
            {t("done")}
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ── ADD PERSON BOTTOM SHEET ──
  // ═══════════════════════════════════════════════════════════════════════════

  if (showAddPerson && savedSession) {
    return (
      <div style={{ position:"absolute", inset:0, zIndex:500, background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24 }}>
        <div style={{ marginBottom:12 }}><Ic n="users" s={40} c={C.textMuted}/></div>
        <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:18, color:C.text, textAlign:"center", marginBottom:4, textTransform:"uppercase" }}>
          {t("addPersonPrompt")}
        </div>
        <div style={{ fontSize:14, color:C.textMuted, marginBottom:24, textAlign:"center" }}>
          {savedSession.opponent}
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:10, width:"100%", maxWidth:300 }}>
          <button onClick={() => handleAddPerson("rival")}
            style={{ padding:14, borderRadius:12, border:`1.5px solid ${C.border}`, background:C.surface, color:C.text, cursor:"pointer", fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:14, display:"flex", alignItems:"center", gap:10 }}>
            {t("addAsRival")}
          </button>
          <button onClick={() => handleAddPerson("sparringMate")}
            style={{ padding:14, borderRadius:12, border:`1.5px solid ${C.border}`, background:C.surface, color:C.text, cursor:"pointer", fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:14, display:"flex", alignItems:"center", gap:10 }}>
            {t("addAsSparringMate")}
          </button>
          <button onClick={() => handleAddPerson("crew")}
            style={{ padding:14, borderRadius:12, border:`1.5px solid ${C.border}`, background:C.surface, color:C.text, cursor:"pointer", fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:14, display:"flex", alignItems:"center", gap:10 }}>
            {t("addAsCrew")}
          </button>
          <button onClick={() => { setShowAddPerson(false); if (addToast) addToast({ icon: "check", title: t("sessionSaved") }); onClose(); }}
            style={{ padding:14, borderRadius:12, border:"none", background:"transparent", color:C.textMuted, cursor:"pointer", fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:13 }}>
            {t("skip")}
          </button>
        </div>
      </div>
    );
  }

  return null;
};
