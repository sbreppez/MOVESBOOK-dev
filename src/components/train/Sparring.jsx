import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { Ic } from '../shared/Ic';
import { useT } from '../../hooks/useTranslation';
import { useSettings } from '../../hooks/useSettings';
import { BodyCheckIn } from '../shared/BodyCheckIn';
import { TrainingLog } from '../shared/TrainingLog';
import { Spar1v1 } from './Spar1v1';
import { compressImage } from '../../utils/imageUtils';
import { todayLocal } from '../../utils/dateUtils';

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmtTimeTenths = (ms) => {
  const totalSec = Math.floor(ms / 1000);
  const tenths = Math.floor((ms % 1000) / 100);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}.${tenths}`;
};

const fmtTimeSec = (sec) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

const fmtDuration = (ms) => {
  const sec = Math.round(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
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

export const Sparring = ({ moves, catColors, sparring, settings, onSaveSession, onSettingsChange, reflections, onReflectionsChange, onClose, addCalendarEvent, rivals, onRivalsChange, addToast }) => {
  const t = useT();
  const { settings: appSettings } = useSettings();
  const isDark = (appSettings.theme || settings.theme) === "dark";

  // ── Spar mode chooser ──
  const [sparMode, setSparMode] = useState(null); // null | 'solo' | '1v1'

  // ── Screen state ──
  const [screen, setScreen] = useState("setup");

  // ── Setup state ──
  const [mode, setMode] = useState("rounds");
  const [targetRounds, setTargetRounds] = useState(5);
  const [timeLimit, setTimeLimit] = useState(10);
  const [restRatio, setRestRatio] = useState(1.0);
  const [showCountdown, setShowCountdown] = useState(false);

  // ── Active session state ──
  const [phase, setPhase] = useState("ready"); // ready, work, rest, getReady
  const [roundNum, setRoundNum] = useState(0);
  const [roundLog, setRoundLog] = useState([]);
  const [workStart, setWorkStart] = useState(null);
  const [workElapsed, setWorkElapsed] = useState(0);
  const [restTotal, setRestTotal] = useState(0);
  const [restRemaining, setRestRemaining] = useState(0);
  const [sessionStart, setSessionStart] = useState(null);
  const [sessionElapsed, setSessionElapsed] = useState(0);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [lastWorkMs, setLastWorkMs] = useState(0);
  const restStartRef = useRef(null);
  const restTotalRef = useRef(0);
  const getReadyFired = useRef(new Set());
  const timerRef = useRef(null);
  const sessionTimerRef = useRef(null);

  // ── Done screen state ──
  const [notes, setNotes] = useState("");
  const [reflection, setReflection] = useState("");
  const [selectedMoves, setSelectedMoves] = useState([]);
  const [moveSearch, setMoveSearch] = useState("");
  const [exertion, setExertion] = useState(null);
  const [bodyStatus, setBodyStatus] = useState(null);
  const [prBroken, setPrBroken] = useState(null);
  const [showShareCard, setShowShareCard] = useState(false);
  const [sharePhoto, setSharePhoto] = useState(null);
  const canvasRef = useRef(null);
  const photoInputRef = useRef(null);
  const [completedSession, setCompletedSession] = useState(null);

  // ── Pending PR detection (shown on done screen before save) ──
  const pendingPRs = useMemo(() => {
    if (!completedSession) return [];
    const records = sparring.records || {};
    const prs = [];
    if (!records.mostRounds || completedSession.rounds > records.mostRounds.value) {
      prs.push({ type: "mostRounds", value: completedSession.rounds });
    }
    if (!records.longestRound || completedSession.longestRound > records.longestRound.value) {
      prs.push({ type: "longestRound", value: completedSession.longestRound });
    }
    const totalSec = Math.round(completedSession.totalDuration / 1000);
    if (!records.longestSession || totalSec > records.longestSession.value) {
      prs.push({ type: "longestSession", value: totalSec });
    }
    if (mode === "death") {
      if (!records.longestDeathSession || totalSec > records.longestDeathSession.value) {
        prs.push({ type: "longestDeath", value: totalSec });
      }
    }
    return prs;
  }, [completedSession, sparring.records, mode]);

  // ── Cleanup timers on unmount ──
  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
  }, []);

  // ── Session timer (total elapsed) ──
  useEffect(() => {
    if (screen === "active" && phase !== "ready" && sessionStart) {
      sessionTimerRef.current = setInterval(() => {
        setSessionElapsed(Date.now() - sessionStart);
      }, 1000);
      return () => clearInterval(sessionTimerRef.current);
    }
  }, [screen, phase, sessionStart]);

  // ── Work phase timer (100ms for smooth tenths) ──
  useEffect(() => {
    if (phase === "work" && workStart) {
      timerRef.current = setInterval(() => {
        setWorkElapsed(Date.now() - workStart);
      }, 100);
      return () => clearInterval(timerRef.current);
    }
  }, [phase, workStart]);

  // ── Rest phase timer ──
  useEffect(() => {
    if (phase !== "rest" && phase !== "getReady") return;
    if (!restStartRef.current) return;

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - restStartRef.current;
      const remaining = Math.max(0, restTotalRef.current - elapsed);
      setRestRemaining(remaining);

      const secLeft = Math.ceil(remaining / 1000);

      // Trigger getReady at 5 seconds
      if (secLeft <= 5 && phase !== "getReady") {
        setPhase("getReady");
        getReadyFired.current.clear();
      }

      // Beeps during getReady
      if (phase === "getReady" || secLeft <= 5) {
        if (secLeft >= 1 && secLeft <= 5 && !getReadyFired.current.has(secLeft)) {
          getReadyFired.current.add(secLeft);
          const freqs = { 5: 660, 4: 700, 3: 770, 2: 830, 1: 880 };
          beep(freqs[secLeft] || 880, 150, 0.25 + (5 - secLeft) * 0.05);
          haptic(20 + (5 - secLeft) * 15);
        }
      }

      // Rest done
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        beep(1100, 300, 0.4);
        haptic([80, 40, 80]);
        startNextRound();
      }
    }, 100);

    return () => clearInterval(timerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- phase-only by intent; startNextRound is not memoized and adding it would tear down/rebuild the 100ms interval on every render
  }, [phase]);

  // ── Check if session should end ──
  const shouldEndSession = useCallback(() => {
    if (mode === "rounds" && roundNum >= targetRounds) return true;
    if (mode === "time" && sessionElapsed >= timeLimit * 60 * 1000) return true;
    return false;
  }, [mode, roundNum, targetRounds, timeLimit, sessionElapsed]);

  // ── Start first round ──
  const handleTapToStart = () => {
    // Resume audio context on user gesture (iOS)
    try { getAudioCtx(); } catch {}
    beep(880, 200, 0.3);
    haptic(40);
    const now = Date.now();
    setSessionStart(now);
    setRoundNum(1);
    setWorkStart(now);
    setWorkElapsed(0);
    setPhase("work");
  };

  // ── Stop work → start rest ──
  const handleStopWork = () => {
    if (phase !== "work") return;
    const workMs = Date.now() - workStart;
    beep(440, 200, 0.2);
    haptic(30);

    const workSecs = Math.round(workMs / 1000);
    const restSecs = Math.max(3, Math.round((workMs * restRatio) / 1000));
    const restMs = restSecs * 1000;

    setRoundLog(prev => [...prev, { round: roundNum, workMs, workSecs, restSecs }]);
    setLastWorkMs(workMs);
    setRestTotal(restMs);
    setRestRemaining(restMs);
    restTotalRef.current = restMs;
    restStartRef.current = Date.now();
    getReadyFired.current.clear();
    setShowRestTimer(showCountdown);

    // Check if this is the last round
    if (mode === "rounds" && roundNum >= targetRounds) {
      finishSession([...roundLog, { round: roundNum, workMs, workSecs, restSecs }]);
      return;
    }
    if (mode === "time" && sessionElapsed >= timeLimit * 60 * 1000) {
      finishSession([...roundLog, { round: roundNum, workMs, workSecs, restSecs }]);
      return;
    }

    setPhase("rest");
  };

  // ── Start next round (auto after rest) ──
  const startNextRound = () => {
    const nextRound = roundNum + 1;

    // Check if we should end
    if (mode === "rounds" && roundNum >= targetRounds) {
      finishSession(roundLog);
      return;
    }
    if (mode === "time" && sessionElapsed >= timeLimit * 60 * 1000) {
      finishSession(roundLog);
      return;
    }

    setRoundNum(nextRound);
    setWorkStart(Date.now());
    setWorkElapsed(0);
    setPhase("work");
    beep(880, 200, 0.3);
    haptic(40);
  };

  // ── End session manually ──
  const handleEndSession = (e) => {
    e.stopPropagation();
    let log = [...roundLog];
    // If in work phase, save current round
    if (phase === "work" && workStart) {
      const workMs = Date.now() - workStart;
      const workSecs = Math.round(workMs / 1000);
      const restSecs = Math.max(3, Math.round((workMs * restRatio) / 1000));
      if (workSecs > 0) log.push({ round: roundNum, workMs, workSecs, restSecs });
    }
    finishSession(log);
  };

  // ── Finish and go to done screen ──
  const finishSession = (log) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);

    const totalDuration = sessionStart ? Date.now() - sessionStart : 0;
    const workTimes = log.map(r => r.workSecs);
    const avg = workTimes.length > 0 ? Math.round(workTimes.reduce((a, b) => a + b, 0) / workTimes.length) : 0;
    const longest = workTimes.length > 0 ? Math.max(...workTimes) : 0;
    const shortest = workTimes.length > 0 ? Math.min(...workTimes) : 0;

    setCompletedSession({
      rounds: log.length,
      roundLog: log,
      totalDuration,
      avgRoundLength: avg,
      longestRound: longest,
      shortestRound: shortest,
    });
    setRoundLog(log);
    setScreen("done");
  };

  // ── Save session ──
  const handleSave = () => {
    if (!completedSession) return;
    const session = {
      id: Date.now(),
      mode,
      targetRounds: mode === "rounds" ? targetRounds : null,
      timeLimit: mode === "time" ? timeLimit : null,
      restRatio,
      rounds: completedSession.rounds,
      roundLog: completedSession.roundLog,
      totalDuration: completedSession.totalDuration,
      avgRoundLength: completedSession.avgRoundLength,
      longestRound: completedSession.longestRound,
      shortestRound: completedSession.shortestRound,
      movesTrained: selectedMoves,
      notes,
      reflection: reflection.trim() || null,
      exertion,
      bodyStatus,
      date: new Date().toISOString(),
    };

    // Check PRs
    const records = { ...(sparring.records || {}) };
    const prs = [];

    if (!records.mostRounds || session.rounds > records.mostRounds.value) {
      records.mostRounds = { value: session.rounds, date: session.date, mode };
      prs.push({ type: "mostRounds", value: session.rounds });
    }
    if (!records.longestRound || session.longestRound > records.longestRound.value) {
      records.longestRound = { value: session.longestRound, date: session.date };
      prs.push({ type: "longestRound", value: session.longestRound });
    }
    const totalSec = Math.round(session.totalDuration / 1000);
    if (!records.longestSession || totalSec > records.longestSession.value) {
      records.longestSession = { value: totalSec, date: session.date, mode };
      prs.push({ type: "longestSession", value: totalSec });
    }
    if (mode === "death") {
      if (!records.longestDeathSession || totalSec > records.longestDeathSession.value) {
        records.longestDeathSession = { value: totalSec, date: session.date };
        prs.push({ type: "longestDeath", value: totalSec });
      }
    }

    const updatedSparring = {
      sessions: [session, ...(sparring.sessions || [])],
      records,
    };

    onSaveSession(session, updatedSparring);

    if (addCalendarEvent) {
      const modeLabel = mode === "rounds" ? `${session.rounds} rounds` : mode === "time" ? "Timed" : "Cypher Till Death";
      addCalendarEvent({
        date: todayLocal(),
        type: "training",
        title: `Sparring — ${modeLabel}`,
        duration: Math.round((session.totalDuration || 0) / 60000) || 1,
        notes: notes.trim() || null,
        exertion, bodyStatus,
        source: "sparring",
      }, { silent: true });
    }

    if (prs.length > 0) {
      setPrBroken(prs[0]);
    } else {
      onClose();
    }
  };

  const handleDiscard = () => onClose();

  // ── Background color based on phase ──
  const getBg = () => {
    if (screen !== "active") return C.bg;
    if (phase === "ready") return C.bg;
    if (phase === "work") return isDark ? "#1a0606" : "#fff0f0";
    if (phase === "rest") return isDark ? "#061208" : "#f0fff2";
    if (phase === "getReady") return isDark ? "#0a0a1e" : "#f0f0ff";
    return C.bg;
  };

  const catColor = (cat) => catColors[cat] || C.textMuted;

  // ── Chooser screen ──
  if (sparMode === null) {
    return (
      <div style={{ position:"absolute", inset:0, zIndex:500, background:C.bg, display:"flex", flexDirection:"column" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"13px 18px", borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
          <span style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:16, letterSpacing:2, color:C.text, textTransform:"uppercase" }}>{t("spar")}</span>
          <button onClick={onClose} style={{ background:C.surfaceAlt, border:`1px solid ${C.border}`, cursor:"pointer", color:C.textSec, padding:5, borderRadius:7, display:"flex" }}>
            <Ic n="x" s={14}/>
          </button>
        </div>
        <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24, gap:16 }}>
          <button onClick={() => setSparMode("solo")}
            style={{ width:"100%", maxWidth:320, padding:"28px 20px", borderRadius:16, border:`2px solid ${C.border}`, background:C.surface, cursor:"pointer", textAlign:"center", transition:"all 0.15s" }}>
            <div style={{ marginBottom:8 }}><Ic n="fist" s={36} c={C.text}/></div>
            <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:20, color:C.text, letterSpacing:1, textTransform:"uppercase" }}>{t("soloSpar")}</div>
            <div style={{ fontSize:13, color:C.textMuted, marginTop:6 }}>{t("soloSparDesc")}</div>
          </button>
          <button onClick={() => setSparMode("1v1")}
            style={{ width:"100%", maxWidth:320, padding:"28px 20px", borderRadius:16, border:`2px solid ${C.accent}44`, background:C.accent + "0a", cursor:"pointer", textAlign:"center", transition:"all 0.15s" }}>
            <div style={{ marginBottom:8 }}><Ic n="swords" s={36} c={C.accent}/></div>
            <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:20, color:C.accent, letterSpacing:1, textTransform:"uppercase" }}>{t("oneVsOne")}</div>
            <div style={{ fontSize:13, color:C.textMuted, marginTop:6 }}>{t("oneVsOneDesc")}</div>
          </button>
        </div>
      </div>
    );
  }

  // ── 1v1 mode ──
  if (sparMode === "1v1") {
    return <Spar1v1
      sparring={sparring}
      onSaveSession={onSaveSession}
      addCalendarEvent={addCalendarEvent}
      rivals={rivals}
      onRivalsChange={onRivalsChange}
      addToast={addToast}
      onClose={() => { setSparMode(null); onClose(); }}
    />;
  }

  // ── PR Celebration Screen ──
  if (prBroken) {
    const prMessages = {
      mostRounds: `${prBroken.value} rounds — you outlasted yourself`,
      longestRound: `${prBroken.value}s round. That's focus.`,
      longestSession: `${fmtDuration(prBroken.value * 1000)}. New record. The cypher will know.`,
      longestDeath: `${fmtDuration(prBroken.value * 1000)} of Cypher Till Death. Legendary.`,
    };

    return (
      <div style={{ position:"absolute", inset:0, zIndex:500, background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24 }}>
        <style>{`@keyframes mb-pr-pop { 0% { transform:scale(0.5); opacity:0; } 50% { transform:scale(1.1); } 100% { transform:scale(1); opacity:1; } }`}</style>
        <div style={{ animation:"mb-pr-pop 0.6s ease-out", textAlign:"center" }}>
          <div style={{ marginBottom:12 }}><Ic n="flame" s={48} c={C.accent}/></div>
          <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:22, color:C.accent, letterSpacing:2, marginBottom:8 }}>
            {t("newRecord").toUpperCase()}!
          </div>
          <div style={{ fontFamily:FONT_BODY, fontSize:16, color:C.textSec, maxWidth:300, lineHeight:1.5, marginBottom:32 }}>
            {prMessages[prBroken.type] || "New personal record!"}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10, width:"100%", maxWidth:280 }}>
            <button onClick={() => setShowShareCard(true)}
              style={{ width:"100%", padding:14, borderRadius:12, border:"none", background:C.accent, color:"#fff", cursor:"pointer", fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:13, letterSpacing:1 }}>
              {t("share").toUpperCase()}
            </button>
            <button onClick={onClose}
              style={{ width:"100%", padding:14, borderRadius:12, border:`1px solid ${C.border}`, background:C.surfaceAlt, color:C.text, cursor:"pointer", fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:13, letterSpacing:1 }}>
              {t("done")}
            </button>
          </div>
        </div>

        {/* Share card modal */}
        {showShareCard && (
          <ShareCard
            session={completedSession}
            mode={mode}
            prBroken={prBroken}
            photo={sharePhoto}
            onPhotoChange={setSharePhoto}
            onClose={() => { setShowShareCard(false); onClose(); }}
            t={t}
          />
        )}
      </div>
    );
  }

  // ── SETUP SCREEN ──
  if (screen === "setup") {
    const MODE_CARDS = [
      { id: "rounds", icon: "hash", label: t("roundsMode"), desc: t("setNumberOfRounds") },
      { id: "time", icon: "timer", label: t("timeLimitMode"), desc: t("trainWithinTimeWindow") },
      { id: "death", icon: "skull", label: t("cypherTillDeath"), desc: t("noLimitGoUntilYouStop") },
    ];
    const RATIO_OPTIONS = [0.5, 0.75, 1.0, 1.5, 2.0];
    const TIME_OPTIONS = [5, 10, 15, 20, 30];

    return (
      <div style={{ position:"absolute", inset:0, zIndex:500, background:C.bg, display:"flex", flexDirection:"column" }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"13px 18px", borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
          <span style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:16, letterSpacing:2, color:C.brown }}>{t("spar")}</span>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={() => setScreen("history")}
              style={{ background:C.surfaceAlt, border:`1px solid ${C.border}`, cursor:"pointer", color:C.textSec, padding:"5px 10px", borderRadius:7, fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:11, letterSpacing:0.5 }}>
              {t("sessionHistory")}
            </button>
            <button onClick={onClose} style={{ background:C.surfaceAlt, border:`1px solid ${C.border}`, cursor:"pointer", color:C.textSec, padding:5, borderRadius:7, display:"flex" }}>
              <Ic n="x" s={14}/>
            </button>
          </div>
        </div>

        <div style={{ flex:1, overflow:"auto", padding:18 }}>
          {/* Session mode */}
          <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:11, color:C.textMuted, letterSpacing:1.5, marginBottom:10 }}>SESSION MODE</div>
          <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:24 }}>
            {MODE_CARDS.map(mc => {
              const active = mode === mc.id;
              return (
                <button key={mc.id} onClick={() => setMode(mc.id)}
                  style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px",
                    background: active ? (C.accent + "14") : C.surface,
                    border: `2px solid ${active ? C.accent : C.border}`,
                    borderRadius:12, cursor:"pointer", textAlign:"left", transition:"all 0.15s" }}>
                  <Ic n={mc.icon} s={24}/>
                  <div>
                    <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:14, color: active ? C.accent : C.text, letterSpacing:0.5 }}>{mc.label}</div>
                    <div style={{ fontSize:11, color:C.textMuted, marginTop:2 }}>{mc.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Rounds config */}
          {mode === "rounds" && (
            <div style={{ marginBottom:24 }}>
              <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:11, color:C.textMuted, letterSpacing:1.5, marginBottom:10 }}>{t("roundsMode")}</div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:20 }}>
                <button onClick={() => setTargetRounds(Math.max(1, targetRounds - 1))}
                  style={{ width:48, height:48, borderRadius:12, border:`2px solid ${C.border}`, background:C.surface, cursor:"pointer", fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:24, color:C.text, display:"flex", alignItems:"center", justifyContent:"center" }}>−</button>
                <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:48, color:C.text, minWidth:60, textAlign:"center" }}>{targetRounds}</div>
                <button onClick={() => setTargetRounds(Math.min(30, targetRounds + 1))}
                  style={{ width:48, height:48, borderRadius:12, border:`2px solid ${C.border}`, background:C.surface, cursor:"pointer", fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:24, color:C.text, display:"flex", alignItems:"center", justifyContent:"center" }}>+</button>
              </div>
            </div>
          )}

          {/* Time limit config */}
          {mode === "time" && (
            <div style={{ marginBottom:24 }}>
              <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:11, color:C.textMuted, letterSpacing:1.5, marginBottom:10 }}>{t("timeLimitMode")}</div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {TIME_OPTIONS.map(mins => {
                  const active = timeLimit === mins;
                  return (
                    <button key={mins} onClick={() => setTimeLimit(mins)}
                      style={{ borderRadius:20, padding:"8px 18px", border:`1.5px solid ${active ? C.accent : C.border}`,
                        background: active ? C.accent + "26" : C.surfaceAlt, color: active ? C.accent : C.textSec,
                        fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:13, cursor:"pointer", transition:"all 0.15s" }}>
                      {mins} min
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Rest ratio */}
          <div style={{ marginBottom:8 }}>
            <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:11, color:C.textMuted, letterSpacing:1.5, marginBottom:10 }}>{t("restRatio")}</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {RATIO_OPTIONS.map(r => {
                const active = restRatio === r;
                return (
                  <button key={r} onClick={() => setRestRatio(r)}
                    style={{ borderRadius:20, padding:"8px 16px", border:`1.5px solid ${active ? C.accent : C.border}`,
                      background: active ? C.accent + "26" : C.surfaceAlt, color: active ? C.accent : C.textSec,
                      fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:13, cursor:"pointer", transition:"all 0.15s" }}>
                    {Math.round(r * 100)}%
                  </button>
                );
              })}
            </div>
            <div style={{ fontSize:11, color:C.textMuted, marginTop:8 }}>
              {t("restExplain")} {Math.round(restRatio * 100)}%
            </div>
          </div>

          {/* Show rest countdown toggle */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 0", borderTop:`1px solid ${C.border}`, marginTop:16 }}>
            <div>
              <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:13, color:C.text }}>{t("showRestCountdown")}</div>
              <div style={{ fontSize:11, color:C.textMuted, marginTop:2 }}>
                {showCountdown ? t("countdownVisible") : t("battleModeLabel")}
              </div>
            </div>
            <button onClick={() => setShowCountdown(!showCountdown)}
              style={{ width:46, height:26, borderRadius:13, background: showCountdown ? C.accent : C.border, border:"none", cursor:"pointer", position:"relative", transition:"background 0.2s", flexShrink:0 }}>
              <div style={{ position:"absolute", top:4, left: showCountdown ? 24 : 4, width:18, height:18, borderRadius:"50%", background:"#fff", transition:"left 0.2s", boxShadow:"0 1px 4px rgba(0,0,0,0.3)" }}/>
            </button>
          </div>

          {/* How it works */}
          <div style={{ background:C.surface, borderRadius:12, padding:14, marginTop:16, border:`1px solid ${C.border}` }}>
            <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:11, color:C.textMuted, letterSpacing:1, marginBottom:6 }}>{t("howItWorks")}</div>
            <div style={{ fontSize:11, color:C.textSec, lineHeight:1.6 }}>
              {t("howItWorksText")}
            </div>
          </div>
        </div>

        {/* Start button */}
        <div style={{ padding:"14px 18px 24px", flexShrink:0 }}>
          <button onClick={() => setScreen("active")}
            style={{ width:"100%", padding:16, borderRadius:12, border:"none", background:C.accent, color:"#fff", cursor:"pointer", fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:16, letterSpacing:1.5, transition:"background 0.15s" }}>
            {t("startSession")}
          </button>
        </div>
      </div>
    );
  }

  // ── ACTIVE SESSION SCREEN ──
  if (screen === "active") {
    const modeLabel = mode === "rounds" ? `R${roundNum}/${targetRounds}`
      : mode === "time" ? `R${roundNum}`
      : `R${roundNum}`;

    const progressDots = mode === "rounds" ? Array.from({ length: targetRounds }, (_, i) => {
      const done = i < roundLog.length;
      const current = i === roundLog.length && (phase === "work" || phase === "rest" || phase === "getReady");
      return (
        <div key={i} style={{ width:8, height:8, borderRadius:"50%",
          background: done ? C.green : current ? C.accent : C.surfaceHigh,
          transition:"background 0.3s" }}/>
      );
    }) : null;

    return (
      <div style={{ position:"absolute", inset:0, zIndex:500, background:getBg(), display:"flex", flexDirection:"column", transition:"background 0.4s ease" }}>
        <style>{`
          @keyframes mb-breathe { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
          @keyframes mb-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
          @keyframes mb-pop-in { 0% { transform: scale(0.3); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        `}</style>

        {/* Top bar */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 18px", flexShrink:0, zIndex:2 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:18, color:C.text }}>{modeLabel}</span>
            {mode === "time" && sessionStart && (
              <span style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:13, color:C.textMuted }}>
                {t("remaining")}: {fmtTimeSec(Math.max(0, timeLimit * 60 - Math.round(sessionElapsed / 1000)))}
              </span>
            )}
            {mode === "death" && sessionStart && (
              <span style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:13, color:C.textMuted }}>
                {t("elapsed")}: {fmtTimeSec(Math.round(sessionElapsed / 1000))}
              </span>
            )}
          </div>
          {/* Mode emoji */}
          <Ic n={mode==="rounds"?"hash":mode==="time"?"timer":"skull"} s={18}/>
        </div>

        {/* Progress dots */}
        {progressDots && (
          <div style={{ display:"flex", gap:4, justifyContent:"center", padding:"0 18px 8px", flexShrink:0 }}>
            {progressDots}
          </div>
        )}

        {/* ── TAP TO START ── */}
        {phase === "ready" && (
          <div onClick={handleTapToStart}
            style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", userSelect:"none", WebkitTapHighlightColor:"transparent" }}>
            <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:64, color:C.accent, lineHeight:1 }}>
              {t("tapToStart")}
            </div>
            <div style={{ fontSize:18, marginTop:16, display:"flex", alignItems:"center", gap:6 }}>
              <Ic n={mode==="rounds"?"hash":mode==="time"?"timer":"skull"} s={18}/>
              <span style={{ fontFamily:FONT_DISPLAY, fontWeight:700, color:C.textSec }}>
                {mode === "rounds" ? t("roundsMode") : mode === "time" ? t("timeLimitMode") : t("cypherTillDeath")}
              </span>
            </div>
            <div style={{ fontSize:13, color:C.textMuted, marginTop:20, animation:"mb-breathe 3s ease-in-out infinite", letterSpacing:0.5 }}>
              {t("anywhereOnScreen")}
            </div>
          </div>
        )}

        {/* ── WORK PHASE ── */}
        {phase === "work" && (
          <div onClick={handleStopWork}
            style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", userSelect:"none", WebkitTapHighlightColor:"transparent", position:"relative" }}>
            <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:48, color:C.red, animation:"mb-pulse 2s ease-in-out infinite" }}>
              {t("go")}
            </div>
            <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:80, color:C.text, lineHeight:1, marginTop:12 }}>
              {fmtTimeTenths(workElapsed)}
            </div>
            <div style={{ fontSize:13, color:C.textMuted, marginTop:20, animation:"mb-breathe 3s ease-in-out infinite", letterSpacing:0.5 }}>
              {t("tapToStopRound")}
            </div>

            {/* Previous round chips */}
            {roundLog.length > 0 && (
              <div style={{ display:"flex", gap:6, flexWrap:"wrap", justifyContent:"center", marginTop:24, padding:"0 20px" }}>
                {roundLog.map((r, i) => (
                  <div key={i} style={{ padding:"4px 10px", borderRadius:12, background:C.surfaceAlt, border:`1px solid ${C.border}`,
                    fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:11, color:C.textSec }}>
                    R{r.round}:{r.workSecs}s
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── REST PHASE ── */}
        {(phase === "rest" || phase === "getReady") && (
          <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", position:"relative" }}>

            {phase === "rest" && (
              <>
                <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:48, color:C.green }}>
                  {t("rest")}
                </div>

                {/* Timer — blurred or visible */}
                <div style={{ position:"relative", marginTop:12 }}>
                  <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:80, color:C.text, lineHeight:1,
                    filter: showRestTimer ? "none" : "blur(24px)", transition:"filter 0.3s" }}>
                    {fmtTimeTenths(restRemaining)}
                  </div>
                  {/* Overlay text when blurred */}
                  {!showRestTimer && (
                    <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
                      <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:20, color:C.text, letterSpacing:2 }}>
                        {t("opponentsTurn")}
                      </div>
                      <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:14, color:C.textMuted, marginTop:4, letterSpacing:1 }}>
                        {t("stayFocused")}
                      </div>
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                <div style={{ width:"80%", maxWidth:300, height:4, borderRadius:2, background:C.surfaceHigh, marginTop:20, overflow:"hidden" }}>
                  <div style={{ height:"100%", borderRadius:2, background:C.green,
                    width: `${restTotal > 0 ? ((restTotal - restRemaining) / restTotal) * 100 : 0}%`,
                    transition:"width 0.1s linear" }}/>
                </div>

                {/* Eye toggle */}
                <button onClick={() => setShowRestTimer(!showRestTimer)}
                  style={{ display:"flex", alignItems:"center", gap:6, marginTop:16, padding:"8px 16px", borderRadius:20,
                    background:C.surfaceAlt, border:`1px solid ${C.border}`, cursor:"pointer", transition:"all 0.15s" }}>
                  <Ic n={showRestTimer ? "eye" : "eyeOff"} s={16} c={C.textSec}/>
                  <span style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:11, color:C.textSec, letterSpacing:0.5 }}>
                    {showRestTimer ? t("hideTimer") : t("showTimer")}
                  </span>
                </button>

                {/* Work info */}
                <div style={{ fontSize:11, color:C.textMuted, marginTop:12 }}>
                  Your round: {Math.round(lastWorkMs / 1000)}s → Rest: {Math.round(restTotal / 1000)}s
                </div>
              </>
            )}

            {phase === "getReady" && (
              <>
                <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:36, color:C.blue, letterSpacing:3 }}>
                  {t("getReady")}
                </div>
                <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:140, color:C.text, lineHeight:1, marginTop:8,
                  animation:"mb-pop-in 0.3s ease-out" }}>
                  {Math.ceil(restRemaining / 1000)}
                </div>
              </>
            )}
          </div>
        )}

        {/* END SESSION button — always at bottom */}
        {phase !== "ready" && (
          <div onClick={e => e.stopPropagation()} style={{ padding:"14px 18px 24px", flexShrink:0, zIndex:2 }}>
            <button onClick={handleEndSession}
              style={{ width:"100%", padding:14, borderRadius:12, border:`2px solid ${C.accent}44`, background:`${C.accent}18`, color:C.accent,
                cursor:"pointer", fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:13, letterSpacing:1 }}>
              {t("endSession")}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── DONE SCREEN ──
  if (screen === "done" && completedSession) {
    const cs = completedSession;
    const modeIcon = mode === "rounds" ? "hash" : mode === "time" ? "timer" : "skull";
    const modeText = mode === "death" ? t("cypherTillDeath") : mode === "time" ? t("timeLimitMode") : t("roundsMode");
    const showMovePicker = settings.trackMovesInSparring !== false;

    const filteredMoves = moves.filter(m =>
      m.name.toLowerCase().includes(moveSearch.toLowerCase())
    );

    const toggleMove = (id) => {
      setSelectedMoves(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    return (
      <div style={{ position:"absolute", inset:0, zIndex:500, background:C.bg, display:"flex", flexDirection:"column" }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"13px 18px", borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
          <span style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:16, letterSpacing:2, color:C.green }}>
            {mode === "death" ? `${t("youSurvived")}` : `${t("sessionComplete")}`}
          </span>
          <button onClick={handleDiscard} style={{ background:C.surfaceAlt, border:`1px solid ${C.border}`, cursor:"pointer", color:C.textSec, padding:5, borderRadius:7, display:"flex" }}>
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
                  {pendingPRs.map(pr => pr.type === "mostRounds" ? `${pr.value} ${t("roundsMode").toLowerCase()}` : pr.type === "longestRound" ? `${pr.value}s ${t("longestRoundLabel").toLowerCase()}` : pr.type === "longestSession" ? fmtDuration(pr.value * 1000) : fmtDuration(pr.value * 1000)).join(" · ")}
                </div>
              </div>
            </div>
          </>)}

          {/* Mode badge */}
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
            <Ic n={modeIcon} s={18}/>
            <span style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:13, color:C.textSec }}>{modeText}</span>
          </div>

          {/* Stats grid */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
            {[
              { label: t("roundsMode"), value: cs.rounds },
              { label: t("avgRoundLength"), value: `${cs.avgRoundLength}s` },
              { label: t("totalTime"), value: fmtDuration(cs.totalDuration) },
              { label: t("longestRoundLabel"), value: `${cs.longestRound}s` },
            ].map((s, i) => (
              <div key={i} style={{ background:C.surface, borderRadius:10, padding:12, border:`1px solid ${C.border}`, textAlign:"center" }}>
                <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:24, color:C.text }}>{s.value}</div>
                <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:10, color:C.textMuted, letterSpacing:1, marginTop:4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Round breakdown */}
          <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:11, color:C.textMuted, letterSpacing:1, marginBottom:8 }}>{t("roundBreakdown")}</div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:20 }}>
            {cs.roundLog.map((r, i) => (
              <div key={i} style={{ padding:"5px 12px", borderRadius:16, background:C.surface, border:`1px solid ${C.border}`,
                fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:11, color:C.textSec }}>
                R{r.round}:{r.workSecs}s
              </div>
            ))}
          </div>

          {/* Body Check-In */}
          <BodyCheckIn
            exertion={exertion}
            onExertionChange={setExertion}
            bodyStatus={bodyStatus}
            onBodyStatusChange={setBodyStatus}
            settings={settings}
            onSettingsChange={onSettingsChange}
          />

          {/* Move picker */}
          {showMovePicker && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:11, color:C.textMuted, letterSpacing:1, marginBottom:8 }}>{t("whatDidYouTrain")}</div>
              <input
                type="text" placeholder={t("searchMoves")} value={moveSearch}
                onChange={e => setMoveSearch(e.target.value)}
                style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"8px 12px", color:C.text, fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:FONT_BODY, marginBottom:8 }}
              />
              <div style={{ maxHeight:200, overflow:"auto", borderRadius:10, border:`1px solid ${C.border}` }}>
                {filteredMoves.map(m => {
                  const sel = selectedMoves.includes(m.id);
                  return (
                    <button key={m.id} onClick={() => toggleMove(m.id)}
                      style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"10px 12px",
                        background: sel ? C.accent + "14" : "transparent",
                        border:"none", borderBottom:`1px solid ${C.border}`, cursor:"pointer", textAlign:"left" }}>
                      <div style={{ width:20, height:20, borderRadius:4, border:`2px solid ${sel ? C.accent : C.border}`,
                        background: sel ? C.accent : "transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        {sel && <Ic n="check" s={12} c="#fff"/>}
                      </div>
                      <div>
                        <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:13, color:C.text }}>{m.name}</div>
                        <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:10, color:catColor(m.category), letterSpacing:0.3 }}>{m.category}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
              {selectedMoves.length > 0 && (
                <div style={{ fontSize:11, color:C.textMuted, marginTop:6 }}>
                  {selectedMoves.length} move{selectedMoves.length !== 1 ? "s" : ""} selected
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div style={{ marginBottom:16 }}>
            <textarea
              value={notes} onChange={e => setNotes(e.target.value)}
              placeholder={t("workedOnNotes")}
              rows={3}
              style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:12, color:C.text, fontSize:13, fontFamily:FONT_BODY, resize:"vertical", outline:"none", boxSizing:"border-box" }}
            />
          </div>

          {/* Training Log */}
          <TrainingLog value={reflection} onChange={setReflection}
            framingKey="reflectionSparring" reflections={reflections}
            onReflectionsChange={onReflectionsChange} />
        </div>

        {/* Save / Discard */}
        <div style={{ padding:"14px 18px 24px", flexShrink:0, display:"flex", gap:10 }}>
          <button onClick={handleDiscard}
            style={{ flex:1, padding:14, borderRadius:12, border:`1px solid ${C.border}`, background:C.surfaceAlt, color:C.textSec, cursor:"pointer", fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:13, letterSpacing:1 }}>
            {t("discardSession")}
          </button>
          <button onClick={handleSave}
            style={{ flex:2, padding:14, borderRadius:12, border:"none", background:C.green, color:"#fff", cursor:"pointer", fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:13, letterSpacing:1 }}>
            {t("saveSession")}
          </button>
        </div>
      </div>
    );
  }

  // ── HISTORY SCREEN ──
  if (screen === "history") {
    const sessions = sparring.sessions || [];
    return (
      <div style={{ position:"absolute", inset:0, zIndex:500, background:C.bg, display:"flex", flexDirection:"column" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 18px", borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
          <button onClick={() => setScreen("setup")}
            style={{ background:C.surfaceAlt, border:`1px solid ${C.border}`, cursor:"pointer", color:C.textSec, padding:5, borderRadius:7, display:"flex", transform:"rotate(180deg)" }}>
            <Ic n="chevR" s={14}/>
          </button>
          <span style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:16, letterSpacing:2, color:C.brown, flex:1 }}>{t("sessionHistory")}</span>
          <button onClick={onClose} style={{ background:C.surfaceAlt, border:`1px solid ${C.border}`, cursor:"pointer", color:C.textSec, padding:5, borderRadius:7, display:"flex" }}>
            <Ic n="x" s={14}/>
          </button>
        </div>
        <div style={{ flex:1, overflow:"auto", padding:"12px 18px" }}>
          {sessions.length === 0 && (
            <div style={{ textAlign:"center", color:C.textMuted, fontSize:13, padding:"40px 0" }}>{t("emptyEntries")}</div>
          )}
          {sessions.map(s => {
            const d = new Date(s.date);
            const modeIcon = s.mode === "rounds" ? "hash" : s.mode === "time" ? "timer" : "skull";
            return (
              <div key={s.id} style={{ padding:"12px 14px", marginBottom:8, background:C.surface, border:`1px solid ${C.border}`, borderRadius:8 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <Ic n={modeIcon} s={16}/>
                    <div>
                      <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:14, color:C.text }}>
                        {s.rounds} {t("roundsMode").toLowerCase()}
                      </div>
                      <div style={{ fontSize:11, color:C.textMuted, marginTop:2 }}>
                        {fmtDuration(s.totalDuration)} · avg {s.avgRoundLength}s · {d.toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
                {s.roundLog && s.roundLog.length > 0 && (
                  <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginTop:8 }}>
                    {s.roundLog.map((r, i) => (
                      <span key={i} style={{ padding:"2px 8px", borderRadius:10, background:C.surfaceAlt, fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:10, color:C.textMuted }}>
                        R{r.round}:{r.workSecs}s
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
};

// ── Share Card Sub-Component ─────────────────────────────────────────────────

const ShareCard = ({ session, mode, prBroken, photo, onPhotoChange, onClose, t }) => {
  const canvasRef = useRef(null);
  const photoInputRef = useRef(null);

  const generateCard = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = 1080, H = 1350;
    canvas.width = W;
    canvas.height = H;

    // Background
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, W, H);

    // Photo if available
    if (photo) {
      try {
        const img = new Image();
        img.src = photo;
        await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
        ctx.globalAlpha = 0.4;
        const scale = Math.max(W / img.width, H / img.height);
        const dw = img.width * scale, dh = img.height * scale;
        ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
        ctx.globalAlpha = 1.0;
        // Gradient overlay
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, "rgba(10,10,10,0.3)");
        grad.addColorStop(0.5, "rgba(10,10,10,0.6)");
        grad.addColorStop(1, "rgba(10,10,10,0.95)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
      } catch {}
    }

    // Branding
    ctx.font = "bold 32px 'Barlow Condensed', sans-serif";
    ctx.fillStyle = "#cf0000";
    ctx.fillText("MOVES", 60, 80);
    ctx.fillStyle = "#ffffff";
    ctx.fillText("BOOK", 60 + ctx.measureText("MOVES").width, 80);

    // PR label
    ctx.font = "900 48px 'Barlow Condensed', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("COMPLETE", W / 2, H * 0.35);

    // PR stat
    const prMessages = {
      mostRounds: `${prBroken.value} ROUNDS`,
      longestRound: `${prBroken.value}s ROUND`,
      longestSession: `${fmtDuration(prBroken.value * 1000)}`,
      longestDeath: `${fmtDuration(prBroken.value * 1000)}`,
    };

    ctx.font = "900 96px 'Barlow Condensed', sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(prMessages[prBroken.type] || "NEW RECORD", W / 2, H * 0.48);

    ctx.font = "bold 36px 'Barlow Condensed', sans-serif";
    ctx.fillStyle = "#e53935";
    ctx.fillText("NEW PERSONAL RECORD", W / 2, H * 0.55);

    // Session details
    ctx.font = "700 28px 'Barlow', sans-serif";
    ctx.fillStyle = "#b3b3b3";
    const details = `${session.rounds} rounds · avg ${session.avgRoundLength}s · ${fmtDuration(session.totalDuration)}`;
    ctx.fillText(details, W / 2, H * 0.65);

    const modeLabel = mode === "death" ? "CYPHER TILL DEATH" : mode === "time" ? "TIME LIMIT" : "ROUNDS MODE";
    ctx.fillText(modeLabel, W / 2, H * 0.70);

    // Date + URL
    ctx.font = "500 24px 'Barlow', sans-serif";
    ctx.fillStyle = "#7a7a7a";
    ctx.fillText(new Date().toLocaleDateString(), W / 2, H * 0.88);
    ctx.fillText("movesbook.vercel.app", W / 2, H * 0.92);

    ctx.textAlign = "start";
  }, [photo, session, mode, prBroken]);

  useEffect(() => { generateCard(); }, [generateCard]);

  const handlePhotoInput = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onPhotoChange(await compressImage(file, 1080));
  };

  const handleShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const blob = await new Promise(r => canvas.toBlob(r, "image/png"));
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], "sparring-pr.png", { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: "MovesBook Sparring PR" });
          onClose();
          return;
        }
      }
      // Fallback: download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "sparring-pr.png";
      a.click();
      URL.revokeObjectURL(url);
      onClose();
    } catch {}
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:600, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ width:"100%", maxWidth:360, maxHeight:"80vh", overflow:"auto" }}>
        <canvas ref={canvasRef} style={{ width:"100%", borderRadius:12, display:"block" }}/>
      </div>
      <div style={{ display:"flex", gap:10, marginTop:16, width:"100%", maxWidth:360 }}>
        <input ref={photoInputRef} type="file" accept="image/*" capture="camera" style={{ display:"none" }} onChange={handlePhotoInput}/>
        <button onClick={() => photoInputRef.current?.click()}
          style={{ flex:1, padding:12, borderRadius:10, border:`1px solid ${C.border}`, background:C.surfaceAlt, color:C.text, cursor:"pointer", fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:11, letterSpacing:0.5 }}>
          {t("addPhoto")}
        </button>
        <button onClick={handleShare}
          style={{ flex:1, padding:12, borderRadius:10, border:"none", background:C.accent, color:"#fff", cursor:"pointer", fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:11, letterSpacing:0.5 }}>
          {t("share")}
        </button>
      </div>
      <button onClick={onClose}
        style={{ marginTop:12, padding:"10px 24px", borderRadius:10, border:"none", background:"transparent", color:C.textMuted, cursor:"pointer", fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:11 }}>
        {t("close")}
      </button>
    </div>
  );
};
