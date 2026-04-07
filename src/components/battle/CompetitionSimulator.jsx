import React, { useState, useEffect, useRef, useCallback, Fragment } from 'react';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { Ic } from '../shared/Ic';
import { useT } from '../../hooks/useTranslation';
import { useSettings } from '../../hooks/useSettings';
import { BodyCheckIn } from '../shared/BodyCheckIn';
import { TrainingLog } from '../shared/TrainingLog';
import { Modal } from '../shared/Modal';
import { Btn } from '../shared/Btn';
import { compressImage } from '../../utils/imageUtils';

// ── Helpers (copied from Sparring — module-scoped, not exported) ────────────

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

// ── Default round counts for known bracket names ─────────────────────────────

const getDefaultRoundCount = (name) => {
  const n = (name || "").toLowerCase();
  if (n.includes("prelim")) return 2;
  if (n.includes("32")) return 2;
  if (n.includes("16")) return 2;
  if (n.includes("8")) return 3;
  if (n.includes("semi")) return 3;
  if (n.includes("final")) return 3;
  return 2;
};

// ── Main Component ───────────────────────────────────────────────────────────

export const CompetitionSimulator = ({
  rounds, moves, catColors, sparring, settings,
  onSaveSession, reflections, onReflectionsChange,
  onSettingsChange, addCalendarEvent, onClose,
}) => {
  const t = useT();
  const { settings: appSettings, C } = useSettings();
  const isDark = (appSettings.theme || settings.theme) === "dark";

  // ── Screen state ──
  const [screen, setScreen] = useState("setup");

  // ── Setup state ──
  const [bracketConfig, setBracketConfig] = useState(() =>
    rounds.map(r => ({
      roundId: r.id,
      name: r.name,
      color: r.color || C.accent,
      enabled: !(r.name || "").toLowerCase().includes("reserve"),
      roundCount: getDefaultRoundCount(r.name),
      breakTime: 15,
      entries: r.entries || [],
    }))
  );
  const [restRatio, setRestRatio] = useState(1.0);
  const [showCustomise, setShowCustomise] = useState(false);

  // ── Active session state ──
  const [activeBracketIdx, setActiveBracketIdx] = useState(0);
  const [phase, setPhase] = useState("ready");
  const [roundNum, setRoundNum] = useState(0);
  const [roundLog, setRoundLog] = useState([]);
  const [workStart, setWorkStart] = useState(null);
  const [workElapsed, setWorkElapsed] = useState(0);
  const [restTotal, setRestTotal] = useState(0);
  const [restRemaining, setRestRemaining] = useState(0);
  const [lastWorkMs, setLastWorkMs] = useState(0);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [sessionStart, setSessionStart] = useState(null);
  const [sessionElapsed, setSessionElapsed] = useState(0);
  const restStartRef = useRef(null);
  const restTotalRef = useRef(0);
  const getReadyFired = useRef(new Set());
  const timerRef = useRef(null);
  const sessionTimerRef = useRef(null);

  // ── Bracket tracking ──
  const [completedBrackets, setCompletedBrackets] = useState([]);
  const [currentBracketLog, setCurrentBracketLog] = useState([]);

  // ── Wait period ──
  const [waitStart, setWaitStart] = useState(null);
  const [waitRemaining, setWaitRemaining] = useState(0);
  const waitTimerRef = useRef(null);

  // ── Bracket announcement ──
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const announcementTimerRef = useRef(null);

  // ── Done screen ──
  const [notes, setNotes] = useState("");
  const [reflection, setReflection] = useState("");
  const [exertion, setExertion] = useState(null);
  const [bodyStatus, setBodyStatus] = useState(null);
  const [completedSession, setCompletedSession] = useState(null);

  // ── Share card ──
  const [showShareCard, setShowShareCard] = useState(false);
  const [sharePhoto, setSharePhoto] = useState(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const canvasRef = useRef(null);
  const photoInputRef = useRef(null);

  // ── Derived values ──
  const activeBrackets = bracketConfig.filter(b => b.enabled);
  const currentBracket = activeBrackets[activeBracketIdx] || null;
  const isLastBracket = activeBracketIdx >= activeBrackets.length - 1;
  const nextBracket = isLastBracket ? null : activeBrackets[activeBracketIdx + 1];
  const totalRoundsAll = activeBrackets.reduce((sum, b) => sum + b.roundCount, 0);

  // Estimated time in minutes
  const estimatedMinutes = Math.round(
    activeBrackets.reduce((sum, b) => sum + b.roundCount * 1.5, 0) + // ~90s avg round + rest
    activeBrackets.slice(0, -1).reduce((sum, b) => sum + b.breakTime, 0) // break times
  );

  // ── Cleanup all timers on unmount ──
  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    if (waitTimerRef.current) clearInterval(waitTimerRef.current);
    if (announcementTimerRef.current) clearTimeout(announcementTimerRef.current);
  }, []);

  // ── Session timer (total elapsed) ──
  useEffect(() => {
    if ((screen === "active" || screen === "waiting" || screen === "bracketDone") && sessionStart) {
      sessionTimerRef.current = setInterval(() => {
        setSessionElapsed(Date.now() - sessionStart);
      }, 1000);
      return () => clearInterval(sessionTimerRef.current);
    }
  }, [screen, sessionStart]);

  // ── Work phase timer (100ms for smooth tenths) ──
  useEffect(() => {
    if (phase === "work" && workStart && screen === "active") {
      timerRef.current = setInterval(() => {
        setWorkElapsed(Date.now() - workStart);
      }, 100);
      return () => clearInterval(timerRef.current);
    }
  }, [phase, workStart, screen]);

  // ── Rest phase timer ──
  useEffect(() => {
    if (screen !== "active") return;
    if (phase !== "rest" && phase !== "getReady") return;
    if (!restStartRef.current) return;

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - restStartRef.current;
      const remaining = Math.max(0, restTotalRef.current - elapsed);
      setRestRemaining(remaining);

      const secLeft = Math.ceil(remaining / 1000);

      if (secLeft <= 5 && phase !== "getReady") {
        setPhase("getReady");
        getReadyFired.current.clear();
      }

      if (phase === "getReady" || secLeft <= 5) {
        if (secLeft >= 1 && secLeft <= 5 && !getReadyFired.current.has(secLeft)) {
          getReadyFired.current.add(secLeft);
          const freqs = { 5: 660, 4: 700, 3: 770, 2: 830, 1: 880 };
          beep(freqs[secLeft] || 880, 150, 0.25 + (5 - secLeft) * 0.05);
          haptic(20 + (5 - secLeft) * 15);
        }
      }

      if (remaining <= 0) {
        clearInterval(timerRef.current);
        beep(1100, 300, 0.4);
        haptic([80, 40, 80]);
        startNextRound();
      }
    }, 100);

    return () => clearInterval(timerRef.current);
  }, [phase, screen]);

  // ── Wait period timer ──
  const waitDurationRef = useRef(0);
  useEffect(() => {
    if (screen !== "waiting" || !waitStart) return;
    waitTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - waitStart;
      const remaining = Math.max(0, waitDurationRef.current - elapsed);
      setWaitRemaining(remaining);
      if (remaining <= 0) {
        clearInterval(waitTimerRef.current);
        advanceToNextBracket();
      }
    }, 1000);
    return () => clearInterval(waitTimerRef.current);
  }, [screen, waitStart]);

  // ── Get move references for a bracket ──
  const getMoveRefs = useCallback((bracket) => {
    if (!bracket) return [];
    const allItems = (bracket.entries || []).flatMap(e => e.items || []);
    return allItems.map(item => {
      if (item.type === "move") {
        const m = moves.find(mv => mv.id === item.refId);
        return m ? { name: m.name, category: m.category } : null;
      }
      return null;
    }).filter(Boolean);
  }, [moves]);

  const currentMoveRefs = currentBracket ? getMoveRefs(currentBracket) : [];
  const nextMoveRefs = nextBracket ? getMoveRefs(nextBracket) : [];

  // ── Start simulation ──
  const startSimulation = () => {
    if (activeBrackets.length === 0) return;
    const now = Date.now();
    setSessionStart(now);
    setActiveBracketIdx(0);
    setCompletedBrackets([]);
    setCurrentBracketLog([]);
    setRoundNum(0);
    setRoundLog([]);
    setScreen("active");
    setShowAnnouncement(true);
    announcementTimerRef.current = setTimeout(() => {
      setShowAnnouncement(false);
      setPhase("ready");
    }, 3000);
  };

  // ── Tap to start (first round of a bracket) ──
  const handleTapToStart = () => {
    try { getAudioCtx(); } catch {}
    beep(880, 200, 0.3);
    haptic(40);
    setRoundNum(1);
    setWorkStart(Date.now());
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

    const entry = { round: roundNum, workMs, workSecs, restSecs };
    const updatedLog = [...currentBracketLog, entry];
    setCurrentBracketLog(updatedLog);
    setRoundLog(prev => [...prev, { ...entry, bracket: currentBracket?.name }]);
    setLastWorkMs(workMs);

    // Check if this is the last round of the bracket
    if (currentBracket && roundNum >= currentBracket.roundCount) {
      finishBracket(updatedLog);
      return;
    }

    setRestTotal(restMs);
    setRestRemaining(restMs);
    restTotalRef.current = restMs;
    restStartRef.current = Date.now();
    getReadyFired.current.clear();
    setPhase("rest");
  };

  // ── Start next round (auto after rest) ──
  const startNextRound = () => {
    if (currentBracket && roundNum >= currentBracket.roundCount) {
      finishBracket(currentBracketLog);
      return;
    }

    const next = roundNum + 1;
    setRoundNum(next);
    setWorkStart(Date.now());
    setWorkElapsed(0);
    setPhase("work");
    beep(880, 200, 0.3);
    haptic(40);
  };

  // ── End bracket early ──
  const handleEndBracketEarly = (e) => {
    e.stopPropagation();
    let log = [...currentBracketLog];
    if (phase === "work" && workStart) {
      const workMs = Date.now() - workStart;
      const workSecs = Math.round(workMs / 1000);
      const restSecs = Math.max(3, Math.round((workMs * restRatio) / 1000));
      if (workSecs > 0) {
        const entry = { round: roundNum, workMs, workSecs, restSecs };
        log.push(entry);
        setRoundLog(prev => [...prev, { ...entry, bracket: currentBracket?.name }]);
      }
    }
    finishBracket(log);
  };

  // ── Finish bracket ──
  const finishBracket = (log) => {
    if (timerRef.current) clearInterval(timerRef.current);

    const workTimes = log.map(r => r.workSecs);
    const avg = workTimes.length > 0 ? Math.round(workTimes.reduce((a, b) => a + b, 0) / workTimes.length) : 0;

    const bracket = {
      name: currentBracket?.name || `Bracket ${activeBracketIdx + 1}`,
      color: currentBracket?.color || C.accent,
      rounds: log.length,
      roundLog: log,
      breakTime: currentBracket?.breakTime || 15,
      avgRoundLength: avg,
    };

    const updated = [...completedBrackets, bracket];
    setCompletedBrackets(updated);

    if (isLastBracket) {
      finishCompetition(updated);
    } else {
      setScreen("bracketDone");
    }
  };

  // ── Start wait period ──
  const startWaitPeriod = () => {
    const breakMins = currentBracket?.breakTime || 15;
    const breakMs = breakMins * 60 * 1000;
    waitDurationRef.current = breakMs;
    setWaitRemaining(breakMs);
    setWaitStart(Date.now());
    setScreen("waiting");
  };

  // ── Skip wait ──
  const skipWait = () => {
    if (waitTimerRef.current) clearInterval(waitTimerRef.current);
    setWaitStart(null);
    advanceToNextBracket();
  };

  // ── Advance to next bracket ──
  const advanceToNextBracket = () => {
    if (waitTimerRef.current) clearInterval(waitTimerRef.current);
    setWaitStart(null);
    const nextIdx = activeBracketIdx + 1;
    setActiveBracketIdx(nextIdx);
    setCurrentBracketLog([]);
    setRoundNum(0);
    setPhase("ready");
    setWorkElapsed(0);
    setRestRemaining(0);
    setScreen("active");
    setShowAnnouncement(true);
    announcementTimerRef.current = setTimeout(() => {
      setShowAnnouncement(false);
      setPhase("ready");
    }, 3000);
  };

  // ── Finish competition ──
  const finishCompetition = (allBrackets) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    if (waitTimerRef.current) clearInterval(waitTimerRef.current);

    const totalDuration = sessionStart ? Date.now() - sessionStart : 0;
    const allRoundLogs = allBrackets.flatMap(b => b.roundLog);
    const workTimes = allRoundLogs.map(r => r.workSecs);
    const totalRounds = allRoundLogs.length;
    const avg = workTimes.length > 0 ? Math.round(workTimes.reduce((a, b) => a + b, 0) / workTimes.length) : 0;
    const longest = workTimes.length > 0 ? Math.max(...workTimes) : 0;
    const shortest = workTimes.length > 0 ? Math.min(...workTimes) : 0;

    // Active duration = total minus wait times
    const totalWaitMs = allBrackets.slice(0, -1).reduce((sum, b) => sum + (b.breakTime || 0) * 60 * 1000, 0);
    const activeDuration = Math.max(0, totalDuration - totalWaitMs);

    setCompletedSession({
      brackets: allBrackets,
      rounds: totalRounds,
      roundLog: allRoundLogs,
      totalDuration,
      activeDuration,
      avgRoundLength: avg,
      longestRound: longest,
      shortestRound: shortest,
    });
    setScreen("done");
  };

  // ── Save session ──
  const handleSave = () => {
    if (!completedSession) return;
    const session = {
      id: Date.now(),
      mode: "competition",
      isCompetition: true,
      restRatio,
      rounds: completedSession.rounds,
      roundLog: completedSession.roundLog.map(r => ({ ...r, bracket: r.bracket || null })),
      brackets: completedSession.brackets,
      totalDuration: completedSession.totalDuration,
      activeDuration: completedSession.activeDuration,
      avgRoundLength: completedSession.avgRoundLength,
      longestRound: completedSession.longestRound,
      shortestRound: completedSession.shortestRound,
      notes,
      reflection: reflection.trim() || null,
      exertion,
      bodyStatus,
      date: new Date().toISOString(),
    };

    const updatedSparring = {
      sessions: [session, ...(sparring.sessions || [])],
      records: sparring.records || {},
    };

    onSaveSession(session, updatedSparring);

    if (addCalendarEvent) {
      const bracketNames = (completedSession.brackets || []).map(b => b.name).join(" → ");
      addCalendarEvent({
        date: new Date().toISOString().split("T")[0],
        type: "training",
        title: `Competition Sim — ${bracketNames}`,
        duration: Math.round((completedSession.totalDuration || 0) / 60000) || 1,
        notes: notes.trim() || null,
        exertion, bodyStatus,
        source: "competition",
      }, { silent: true });
    }

    onClose();
  };

  const handleDiscard = () => onClose();

  const handleExitSimulation = () => {
    if (screen === "done") { onClose(); return; }
    setShowExitConfirm(true);
  };

  const exitConfirmModal = showExitConfirm && (
    <Modal title={t("exitSimulationConfirm")} onClose={() => setShowExitConfirm(false)}>
      <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
        <Btn variant="secondary" onClick={() => setShowExitConfirm(false)}>{t("cancel")}</Btn>
        <Btn variant="danger" onClick={onClose}>{t("exit")}</Btn>
      </div>
    </Modal>
  );

  // ── Background color based on phase ──
  const getBg = () => {
    if (screen !== "active") return C.bg;
    if (showAnnouncement) return C.bg;
    if (phase === "ready") return C.bg;
    if (phase === "work") return isDark ? "#1a0606" : "#fff0f0";
    if (phase === "rest") return isDark ? "#061208" : "#f0fff2";
    if (phase === "getReady") return isDark ? "#0a0a1e" : "#f0f0ff";
    return C.bg;
  };

  const catColor = (cat) => catColors[cat] || C.textMuted;

  // ── Performance trend text ──
  const getTrendText = () => {
    if (!completedSession || !completedSession.brackets || completedSession.brackets.length < 2) return null;
    const avgs = completedSession.brackets.map(b => b.avgRoundLength);
    const first = avgs[0];
    const last = avgs[avgs.length - 1];
    const diff = last - first;
    if (Math.abs(diff) <= 2) return t("consistentAcrossBrackets") || "Consistent across brackets";
    if (diff > 0) return t("roundsGotLonger") || "Rounds got longer — endurance holding";
    return t("roundsGotShorter") || "Rounds got shorter — you warmed up";
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // ── SHARE CARD ──
  // ══════════════════════════════════════════════════════════════════════════════

  const ShareCard = () => {
    const cvRef = useRef(null);

    const generateCard = useCallback(() => {
      const canvas = cvRef.current;
      if (!canvas || !completedSession) return;
      const ctx = canvas.getContext("2d");
      const W = 1080, H = 1350;
      canvas.width = W; canvas.height = H;

      // Background
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, W, H);

      // Photo overlay
      if (sharePhoto) {
        const img = new Image();
        img.onload = () => {
          const iw = img.width, ih = img.height;
          const scale = Math.max(W / iw, H / ih);
          const sw = iw * scale, sh = ih * scale;
          ctx.globalAlpha = 0.4;
          ctx.drawImage(img, (W - sw) / 2, (H - sh) / 2, sw, sh);
          ctx.globalAlpha = 1;
          const grad = ctx.createLinearGradient(0, 0, 0, H);
          grad.addColorStop(0, "rgba(10,10,10,0.3)");
          grad.addColorStop(0.5, "rgba(10,10,10,0.6)");
          grad.addColorStop(1, "rgba(10,10,10,0.95)");
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, W, H);
          drawContent(ctx, W, H);
        };
        img.src = sharePhoto;
      } else {
        drawContent(ctx, W, H);
      }
    }, [sharePhoto, completedSession]);

    const drawContent = (ctx, W, H) => {
      // Logo
      ctx.font = `900 36px 'Barlow Condensed', sans-serif`;
      ctx.fillStyle = "#cf0000";
      ctx.textAlign = "center";
      ctx.fillText("MOVES", W / 2 - 50, 80);
      ctx.fillStyle = "#ffffff";
      ctx.fillText("BOOK", W / 2 + 50, 80);

      // Competition label
      ctx.font = "900 40px 'Barlow Condensed', sans-serif";
      ctx.fillText("WINNER", W / 2, 280);

      // Title
      ctx.font = `900 48px 'Barlow Condensed', sans-serif`;
      ctx.fillStyle = "#ffffff";
      ctx.fillText("COMPETITION SIMULATION", W / 2, 370);

      // Stats
      ctx.font = `700 28px 'Barlow Condensed', sans-serif`;
      ctx.fillStyle = "#b3b3b3";
      const cs = completedSession;
      ctx.fillText(
        `${cs.brackets?.length || 0} brackets · ${cs.rounds} rounds · ${fmtDuration(cs.totalDuration)}`,
        W / 2, 430
      );

      // Bracket breakdown
      let y = 520;
      ctx.font = `900 24px 'Barlow Condensed', sans-serif`;
      ctx.fillStyle = "#7a7a7a";
      ctx.fillText("BRACKET BREAKDOWN", W / 2, y);
      y += 50;

      (cs.brackets || []).forEach(b => {
        ctx.font = `700 22px 'Barlow Condensed', sans-serif`;
        ctx.fillStyle = b.color || "#e53935";
        ctx.fillText(`${b.name}  —  ${b.rounds} rounds  ·  avg ${b.avgRoundLength}s`, W / 2, y);
        y += 36;
      });

      // Avg
      y += 20;
      ctx.font = `900 32px 'Barlow Condensed', sans-serif`;
      ctx.fillStyle = "#e53935";
      ctx.fillText(`AVG ROUND: ${cs.avgRoundLength}s`, W / 2, y);

      // Footer
      ctx.font = `700 20px 'Barlow Condensed', sans-serif`;
      ctx.fillStyle = "#7a7a7a";
      const dateStr = new Date().toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
      ctx.fillText(dateStr + "  ·  movesbook.vercel.app", W / 2, H - 60);
    };

    useEffect(() => { generateCard(); }, [generateCard]);

    const handleShare = async () => {
      const canvas = cvRef.current;
      if (!canvas) return;
      try {
        const blob = await new Promise(r => canvas.toBlob(r, "image/png"));
        if (navigator.share && navigator.canShare) {
          const file = new File([blob], "competition-sim.png", { type: "image/png" });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: "MovesBook Competition Simulation" });
            setShowShareCard(false);
            return;
          }
        }
        // Fallback download
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "competition-sim.png";
        document.body.appendChild(a); a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setShowShareCard(false);
      } catch {}
    };

    const handlePhotoInput = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setSharePhoto(await compressImage(file, 1080));
    };

    return (
      <div style={{ position:"fixed", inset:0, zIndex:600, background:"rgba(0,0,0,0.85)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:20 }}>
        <div style={{ flex:1, overflow:"auto", display:"flex", alignItems:"center", justifyContent:"center", width:"100%" }}>
          <canvas ref={cvRef} style={{ maxWidth:360, width:"100%", borderRadius:12 }}/>
        </div>
        <div style={{ display:"flex", gap:10, padding:"16px 0", width:"100%", maxWidth:360 }}>
          <button onClick={() => photoInputRef.current?.click()}
            style={{ flex:1, padding:14, borderRadius:12, border:`1px solid ${C.border}`, background:C.surfaceAlt, color:C.textSec, cursor:"pointer", fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:13, letterSpacing:0.5 }}>
            {t("addPhoto") || "ADD PHOTO"}
          </button>
          <button onClick={handleShare}
            style={{ flex:1, padding:14, borderRadius:12, border:"none", background:C.accent, color:"#fff", cursor:"pointer", fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:13, letterSpacing:1 }}>
            {t("share") || "SHARE"}
          </button>
        </div>
        <button onClick={() => setShowShareCard(false)}
          style={{ padding:"10px 24px", borderRadius:8, border:`1px solid ${C.border}`, background:C.surfaceAlt, color:C.textSec, cursor:"pointer", fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:12, marginBottom:10 }}>
          {t("close")}
        </button>
        <input ref={photoInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoInput}
          style={{ display:"none" }}/>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // ── SETUP SCREEN ──
  // ══════════════════════════════════════════════════════════════════════════════

  if (screen === "setup") {
    const RATIO_OPTIONS = [0.5, 0.75, 1.0, 1.5, 2.0];

    return (
      <div style={{ position:"absolute", inset:0, zIndex:500, background:C.bg, display:"flex", flexDirection:"column" }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"13px 18px", borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
          <span style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:16, letterSpacing:2, color:C.brown }}>
            {t("competitionSetup")}
          </span>
          <button onClick={onClose} style={{ background:C.surfaceAlt, border:`1px solid ${C.border}`, cursor:"pointer", color:C.textSec, padding:5, borderRadius:7, display:"flex" }}>
            <Ic n="x" s={14}/>
          </button>
        </div>

        <div style={{ flex:1, overflow:"auto", padding:18 }}>
          {/* Bracket selection */}
          <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:11, color:C.textMuted, letterSpacing:1.5, marginBottom:10 }}>
            {t("selectBrackets")}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:20 }}>
            {bracketConfig.map((b, i) => {
              const entryCount = (b.entries || []).reduce((n, e) => n + (e.items || []).length, 0);
              return (
                <button key={b.roundId} onClick={() => {
                  setBracketConfig(prev => prev.map((x, j) => j === i ? { ...x, enabled: !x.enabled } : x));
                }}
                  style={{
                    display:"flex", alignItems:"center", gap:12, padding:"12px 16px",
                    background: b.enabled ? `${b.color}14` : C.surface,
                    border: `2px solid ${b.enabled ? b.color : C.border}`,
                    borderRadius:12, cursor:"pointer", textAlign:"left", transition:"all 0.15s",
                  }}>
                  <div style={{ width:12, height:12, borderRadius:"50%", background:b.color, flexShrink:0, opacity: b.enabled ? 1 : 0.3 }}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:14, color: b.enabled ? C.text : C.textMuted, letterSpacing:0.5 }}>
                      {b.name}
                    </div>
                    <div style={{ fontSize:11, color:C.textMuted, marginTop:2 }}>
                      {b.roundCount} {t("totalRounds")} · {entryCount} moves
                    </div>
                  </div>
                  <div style={{
                    width:22, height:22, borderRadius:4, border:`2px solid ${b.enabled ? b.color : C.border}`,
                    background: b.enabled ? b.color : "transparent",
                    display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
                  }}>
                    {b.enabled && <Ic n="check" s={14} c="#fff"/>}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Summary */}
          <div style={{ background:C.surface, borderRadius:10, padding:"10px 14px", marginBottom:20, border:`1px solid ${C.border}` }}>
            <span style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:12, color:C.textSec }}>
              {activeBrackets.length} brackets · {totalRoundsAll} {t("totalRounds")} · ~{estimatedMinutes}min {t("estimatedTime")}
            </span>
          </div>

          {/* Customise button */}
          <button onClick={() => setShowCustomise(!showCustomise)}
            style={{ width:"100%", padding:"12px 16px", borderRadius:10, border:`1px solid ${C.border}`,
              background: showCustomise ? `${C.accent}14` : C.surface, color: showCustomise ? C.accent : C.textSec,
              cursor:"pointer", fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:12, letterSpacing:1.5,
              display:"flex", alignItems:"center", justifyContent:"center", gap:6, marginBottom:16 }}>
            {t("customiseBrackets")}
            <Ic n={showCustomise ? "chevD" : "chevR"} s={12} c={showCustomise ? C.accent : C.textMuted}/>
          </button>

          {/* Customise panel */}
          {showCustomise && (
            <div style={{ marginBottom:20 }}>
              {bracketConfig.filter(b => b.enabled).map((b, i) => (
                <div key={b.roundId} style={{ padding:"14px 16px", marginBottom:8, borderRadius:10, border:`1px solid ${C.border}`, background:C.surface }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                    <div style={{ width:10, height:10, borderRadius:"50%", background:b.color }}/>
                    <span style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:13, color:C.text, flex:1, letterSpacing:0.5 }}>{b.name}</span>
                  </div>

                  {/* Rounds per bracket */}
                  <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, fontFamily:FONT_DISPLAY, letterSpacing:1, marginBottom:6 }}>
                    {t("roundsPerBracket")}
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                    <button onClick={() => setBracketConfig(prev => prev.map(x => x.roundId === b.roundId ? { ...x, roundCount: Math.max(1, x.roundCount - 1) } : x))}
                      style={{ width:36, height:36, borderRadius:8, border:`1px solid ${C.border}`, background:C.bg, cursor:"pointer", fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:18, color:C.text, display:"flex", alignItems:"center", justifyContent:"center" }}>−</button>
                    <span style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:28, color:C.text, minWidth:30, textAlign:"center" }}>{b.roundCount}</span>
                    <button onClick={() => setBracketConfig(prev => prev.map(x => x.roundId === b.roundId ? { ...x, roundCount: Math.min(5, x.roundCount + 1) } : x))}
                      style={{ width:36, height:36, borderRadius:8, border:`1px solid ${C.border}`, background:C.bg, cursor:"pointer", fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:18, color:C.text, display:"flex", alignItems:"center", justifyContent:"center" }}>+</button>
                  </div>

                  {/* Break time */}
                  {i < bracketConfig.filter(x => x.enabled).length - 1 && (
                    <>
                      <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, fontFamily:FONT_DISPLAY, letterSpacing:1, marginBottom:6 }}>
                        {t("breakTimeBetween")}
                      </div>
                      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                        {[5, 10, 15, 20, 30].map(mins => {
                          const active = b.breakTime === mins;
                          return (
                            <button key={mins} onClick={() => setBracketConfig(prev => prev.map(x => x.roundId === b.roundId ? { ...x, breakTime: mins } : x))}
                              style={{ borderRadius:16, padding:"6px 14px", border:`1.5px solid ${active ? C.accent : C.border}`,
                                background: active ? C.accent + "26" : C.surfaceAlt, color: active ? C.accent : C.textSec,
                                fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:12, cursor:"pointer", transition:"all 0.15s" }}>
                              {mins} {t("breakTimeMinutes")}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Rest ratio */}
          <div style={{ marginBottom:16 }}>
            <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:11, color:C.textMuted, letterSpacing:1.5, marginBottom:10 }}>
              {t("restRatio")}
            </div>
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
            <div style={{ fontSize:12, color:C.textMuted, marginTop:8 }}>
              {t("restExplain")} {Math.round(restRatio * 100)}%
            </div>
          </div>
        </div>

        {/* Start button */}
        <div style={{ padding:"14px 18px 24px", flexShrink:0 }}>
          <button onClick={startSimulation} disabled={activeBrackets.length === 0}
            style={{ width:"100%", padding:16, borderRadius:12, border:"none",
              background: activeBrackets.length > 0 ? C.accent : C.surfaceHigh,
              color: activeBrackets.length > 0 ? "#fff" : C.textMuted,
              cursor: activeBrackets.length > 0 ? "pointer" : "default",
              fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:15, letterSpacing:1.5, transition:"background 0.15s" }}>
            {t("startSimulation")}
          </button>
          {activeBrackets.length === 0 && (
            <div style={{ textAlign:"center", fontSize:12, color:C.accent, marginTop:8, fontWeight:700 }}>
              {t("noBracketsSelected")}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ── ACTIVE SESSION SCREEN ──
  // ══════════════════════════════════════════════════════════════════════════════

  if (screen === "active") {
    const bracketLabel = currentBracket ? currentBracket.name : "";
    const bracketColor = currentBracket ? currentBracket.color : C.accent;
    const bracketRoundCount = currentBracket ? currentBracket.roundCount : 0;

    const progressDots = Array.from({ length: bracketRoundCount }, (_, i) => {
      const done = i < currentBracketLog.length;
      const current = i === currentBracketLog.length && (phase === "work" || phase === "rest" || phase === "getReady");
      return (
        <div key={i} style={{ width:8, height:8, borderRadius:"50%",
          background: done ? C.green : current ? bracketColor : C.surfaceHigh,
          transition:"background 0.3s" }}/>
      );
    });

    // ── Bracket Announcement ──
    if (showAnnouncement) {
      return (
        <div style={{ position:"absolute", inset:0, zIndex:500, background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
          <button onClick={handleExitSimulation} style={{ position:"absolute", top:14, right:14, zIndex:10, background:C.surfaceAlt, border:`1px solid ${C.border}`, cursor:"pointer", color:C.textSec, padding:5, borderRadius:7, display:"flex" }}>
            <Ic n="x" s={14}/>
          </button>
          <style>{`@keyframes mb-announce { 0% { transform:scale(0.5); opacity:0; } 100% { transform:scale(1); opacity:1; } }`}</style>
          <div style={{ animation:"mb-announce 0.4s ease-out", textAlign:"center" }}>
            <div style={{ width:60, height:6, borderRadius:3, background:bracketColor, margin:"0 auto 24px" }}/>
            <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:36, color:C.text, letterSpacing:3, marginBottom:8 }}>
              {bracketLabel}
            </div>
            <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:18, color:bracketColor, letterSpacing:1 }}>
              {bracketRoundCount} {t("totalRounds").toUpperCase()}
            </div>
            <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:13, color:C.textMuted, marginTop:16 }}>
              {t("bracketProgress")} {activeBracketIdx + 1} {t("bracketOf")} {activeBrackets.length}
            </div>

            {/* Move references */}
            {currentMoveRefs.length > 0 && (
              <div style={{ marginTop:24, padding:"0 24px" }}>
                <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:10, color:C.textMuted, letterSpacing:1.5, marginBottom:8 }}>
                  {t("currentMoves")}
                </div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", justifyContent:"center" }}>
                  {currentMoveRefs.slice(0, 12).map((m, i) => (
                    <span key={i} style={{ padding:"4px 10px", borderRadius:12, background:`${catColor(m.category)}22`,
                      border:`1px solid ${catColor(m.category)}44`, fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:11,
                      color:catColor(m.category) }}>
                      {m.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          {exitConfirmModal}
        </div>
      );
    }

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
            <div style={{ width:8, height:8, borderRadius:"50%", background:bracketColor }}/>
            <span style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:16, color:C.text }}>{bracketLabel}</span>
            <span style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:12, color:C.textMuted }}>
              R{roundNum}/{bracketRoundCount}
            </span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            {sessionStart && (
              <span style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:12, color:C.textMuted }}>
                {fmtTimeSec(Math.round(sessionElapsed / 1000))}
              </span>
            )}
            <span style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:11, color:bracketColor }}>
              {activeBracketIdx + 1}/{activeBrackets.length}
            </span>
            <button onClick={e => { e.stopPropagation(); handleExitSimulation(); }} style={{ background:C.surfaceAlt, border:`1px solid ${C.border}`, cursor:"pointer", color:C.textSec, padding:5, borderRadius:7, display:"flex" }}>
              <Ic n="x" s={14}/>
            </button>
          </div>
        </div>

        {/* Progress dots */}
        <div style={{ display:"flex", gap:4, justifyContent:"center", padding:"0 18px 8px", flexShrink:0 }}>
          {progressDots}
        </div>

        {/* ── TAP TO START ── */}
        {phase === "ready" && (
          <div onClick={handleTapToStart}
            style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", userSelect:"none", WebkitTapHighlightColor:"transparent" }}>
            <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:56, color:bracketColor, lineHeight:1 }}>
              {t("tapToStart")}
            </div>
            <div style={{ fontSize:16, marginTop:12 }}>
              <span style={{ fontFamily:FONT_DISPLAY, fontWeight:700, color:C.textSec }}>
                {bracketLabel} — {t("totalRounds")} {roundNum || 1}/{bracketRoundCount}
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

            {/* Current bracket's round chips */}
            {currentBracketLog.length > 0 && (
              <div style={{ display:"flex", gap:6, flexWrap:"wrap", justifyContent:"center", marginTop:24, padding:"0 20px" }}>
                {currentBracketLog.map((r, i) => (
                  <div key={i} style={{ padding:"4px 10px", borderRadius:12, background:C.surfaceAlt, border:`1px solid ${C.border}`,
                    fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:11, color:C.textSec }}>
                    R{r.round}:{r.workSecs}s
                  </div>
                ))}
              </div>
            )}

            {/* Move references during work */}
            {currentMoveRefs.length > 0 && (
              <div style={{ position:"absolute", bottom:80, left:0, right:0, padding:"0 20px" }}>
                <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:9, color:C.textMuted, letterSpacing:1.5, textAlign:"center", marginBottom:6 }}>
                  {t("currentMoves")}
                </div>
                <div style={{ display:"flex", gap:4, flexWrap:"wrap", justifyContent:"center" }}>
                  {currentMoveRefs.slice(0, 8).map((m, i) => (
                    <span key={i} style={{ padding:"3px 8px", borderRadius:10, background:`${catColor(m.category)}15`,
                      fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:10, color:`${catColor(m.category)}99` }}>
                      {m.name}
                    </span>
                  ))}
                </div>
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
                <div style={{ position:"relative", marginTop:12 }}>
                  <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:80, color:C.text, lineHeight:1,
                    filter: showRestTimer ? "none" : "blur(24px)", transition:"filter 0.3s" }}>
                    {fmtTimeTenths(restRemaining)}
                  </div>
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

                <div style={{ fontSize:12, color:C.textMuted, marginTop:12 }}>
                  Your round: {Math.round(lastWorkMs / 1000)}s → Rest: {Math.round(restTotal / 1000)}s
                </div>
              </>
            )}

            {/* GET READY countdown */}
            {phase === "getReady" && (
              <div style={{ animation:"mb-pop-in 0.3s ease-out" }}>
                <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:24, color:C.blue, letterSpacing:2, textAlign:"center" }}>
                  {t("getReadyBracket")}
                </div>
                <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:140, color:C.text, lineHeight:1, textAlign:"center", marginTop:8 }}>
                  {Math.ceil(restRemaining / 1000)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* End bracket button */}
        {phase !== "ready" && (
          <div onClick={e => e.stopPropagation()} style={{ padding:"14px 18px 24px", flexShrink:0, zIndex:2 }}>
            <button onClick={handleEndBracketEarly}
              style={{ width:"100%", padding:14, borderRadius:12, border:`2px solid ${C.accent}44`, background:`${C.accent}18`, color:C.accent,
                cursor:"pointer", fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:13, letterSpacing:1 }}>
              {t("endSession")}
            </button>
          </div>
        )}
        {exitConfirmModal}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ── BRACKET DONE SCREEN ──
  // ══════════════════════════════════════════════════════════════════════════════

  if (screen === "bracketDone") {
    const lastBracket = completedBrackets[completedBrackets.length - 1];

    return (
      <div style={{ position:"absolute", inset:0, zIndex:500, background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24 }}>
        <button onClick={handleExitSimulation} style={{ position:"absolute", top:14, right:14, zIndex:10, background:C.surfaceAlt, border:`1px solid ${C.border}`, cursor:"pointer", color:C.textSec, padding:5, borderRadius:7, display:"flex" }}>
          <Ic n="x" s={14}/>
        </button>
        <style>{`@keyframes mb-check { 0% { transform:scale(0); opacity:0; } 50% { transform:scale(1.2); } 100% { transform:scale(1); opacity:1; } }`}</style>
        <div style={{ animation:"mb-check 0.5s ease-out", textAlign:"center", width:"100%", maxWidth:360 }}>
          {/* Bracket color bar */}
          <div style={{ width:60, height:6, borderRadius:3, background:lastBracket?.color || C.accent, margin:"0 auto 16px" }}/>

          <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:22, color:C.green, letterSpacing:1.5, marginBottom:4 }}>
            ✅ {t("bracketComplete")}
          </div>
          <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:18, color:C.text, marginBottom:16 }}>
            {lastBracket?.name}
          </div>

          {/* Round chips */}
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", justifyContent:"center", marginBottom:12 }}>
            {(lastBracket?.roundLog || []).map((r, i) => (
              <div key={i} style={{ padding:"5px 12px", borderRadius:16, background:C.surface, border:`1px solid ${C.border}`,
                fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:12, color:C.textSec }}>
                R{r.round}:{r.workSecs}s
              </div>
            ))}
          </div>

          <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:13, color:C.textMuted, marginBottom:24 }}>
            {t("bracketAvg")}: {lastBracket?.avgRoundLength || 0}s
          </div>

          {/* Next bracket preview */}
          {nextBracket && (
            <div style={{ background:C.surface, borderRadius:12, padding:16, border:`1px solid ${C.border}`, marginBottom:20 }}>
              <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:11, color:C.textMuted, letterSpacing:1, marginBottom:6 }}>
                {t("nextUp")}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:10, height:10, borderRadius:"50%", background:nextBracket.color }}/>
                <span style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:16, color:C.text }}>{nextBracket.name}</span>
                <span style={{ fontSize:12, color:C.textMuted }}>— {nextBracket.roundCount} {t("totalRounds")}</span>
              </div>
            </div>
          )}

          {/* Continue button */}
          <button onClick={startWaitPeriod}
            style={{ width:"100%", padding:14, borderRadius:12, border:"none", background:C.accent, color:"#fff",
              cursor:"pointer", fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:14, letterSpacing:1 }}>
            {nextBracket ? `${t("waitingPeriod")} (${currentBracket?.breakTime || 15}min)` : t("competitionComplete")}
          </button>
        </div>
        {exitConfirmModal}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ── WAITING SCREEN ──
  // ══════════════════════════════════════════════════════════════════════════════

  if (screen === "waiting") {
    const secLeft = Math.ceil(waitRemaining / 1000);
    const minsLeft = Math.ceil(secLeft / 60);
    const isWarning5 = secLeft <= 300 && secLeft > 120;
    const isWarning2 = secLeft <= 120 && secLeft > 30;
    const isBattleMode = secLeft <= 30;

    const waitBg = isBattleMode
      ? (isDark ? "#1a0606" : "#fff0f0")
      : isWarning2
        ? (isDark ? "#1a1200" : "#fff8f0")
        : C.bg;

    const lastBracket = completedBrackets[completedBrackets.length - 1];

    return (
      <div style={{ position:"absolute", inset:0, zIndex:500, background:waitBg, display:"flex", flexDirection:"column", transition:"background 0.5s ease" }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"13px 18px", borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
          <span style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:14, letterSpacing:2, color:C.textMuted }}>
            {t("waitingPeriod")}
          </span>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:12, color:C.textMuted }}>
              {fmtTimeSec(Math.round(sessionElapsed / 1000))} total
            </span>
            <button onClick={handleExitSimulation} style={{ background:C.surfaceAlt, border:`1px solid ${C.border}`, cursor:"pointer", color:C.textSec, padding:5, borderRadius:7, display:"flex" }}>
              <Ic n="x" s={14}/>
            </button>
          </div>
        </div>

        <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24 }}>
          {/* Status message */}
          <div style={{ textAlign:"center", marginBottom:20 }}>
            {isBattleMode && (
              <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:18, color:C.accent, letterSpacing:1.5 }}>
                {t("getReadyBracket").toUpperCase()}
              </div>
            )}
            {isWarning2 && !isBattleMode && (
              <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:16, color:C.yellow, letterSpacing:1 }}>
                2 {t("minutesToGo")} — {t("getReadyBracket")}
              </div>
            )}
            {isWarning5 && !isWarning2 && (
              <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:16, color:C.yellow, letterSpacing:1 }}>
                5 {t("minutesToGo")} — {t("startWarmingUp")}
              </div>
            )}
            {!isWarning5 && !isWarning2 && !isBattleMode && (
              <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:14, color:C.textSec }}>
                {lastBracket?.name} {t("bracketComplete").toLowerCase()}. {t("preparingFor")} {nextBracket?.name}.
              </div>
            )}
          </div>

          {/* Large countdown timer */}
          <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize: isBattleMode ? 100 : 72, color: isBattleMode ? C.accent : C.text, lineHeight:1, marginBottom:8 }}>
            {fmtTimeSec(secLeft)}
          </div>
          <div style={{ fontSize:12, color:C.textMuted, marginBottom:32 }}>
            {t("minutesToGo")}
          </div>

          {/* Next bracket moves for mental rehearsal */}
          {nextMoveRefs.length > 0 && !isBattleMode && (
            <div style={{ width:"100%", maxWidth:360, marginBottom:24 }}>
              <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:10, color:C.textMuted, letterSpacing:1.5, textAlign:"center", marginBottom:8 }}>
                {t("mentalRehearsal")} — {nextBracket?.name}
              </div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap", justifyContent:"center" }}>
                {nextMoveRefs.map((m, i) => (
                  <span key={i} style={{ padding:"5px 12px", borderRadius:14, background:C.surface, border:`1px solid ${C.border}`,
                    fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:12, color:catColor(m.category) }}>
                    {m.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Skip wait */}
          <button onClick={skipWait}
            style={{ padding:"12px 32px", borderRadius:12, border:`2px solid ${C.accent}44`, background:`${C.accent}18`,
              color:C.accent, cursor:"pointer", fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:13, letterSpacing:1 }}>
            {t("skipWait")}
          </button>
        </div>
        {exitConfirmModal}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ── DONE SCREEN ──
  // ══════════════════════════════════════════════════════════════════════════════

  if (screen === "done" && completedSession) {
    const cs = completedSession;
    const trendText = getTrendText();

    return (
      <div style={{ position:"absolute", inset:0, zIndex:500, background:C.bg, display:"flex", flexDirection:"column" }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"13px 18px", borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
          <span style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:16, letterSpacing:2, color:C.green }}>
            {t("competitionComplete")}
          </span>
          <button onClick={handleDiscard} style={{ background:C.surfaceAlt, border:`1px solid ${C.border}`, cursor:"pointer", color:C.textSec, padding:5, borderRadius:7, display:"flex" }}>
            <Ic n="x" s={14}/>
          </button>
        </div>

        <div style={{ flex:1, overflow:"auto", padding:18 }}>
          {/* Stats grid */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
            {[
              { label: t("bracketsCompleted"), value: cs.brackets?.length || 0 },
              { label: t("totalRounds"), value: cs.rounds },
              { label: t("totalCompetitionTime"), value: fmtDuration(cs.totalDuration) },
              { label: t("avgAcrossBrackets"), value: `${cs.avgRoundLength}s` },
            ].map((s, i) => (
              <div key={i} style={{ background:C.surface, borderRadius:10, padding:12, border:`1px solid ${C.border}`, textAlign:"center" }}>
                <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:24, color:C.text }}>{s.value}</div>
                <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:10, color:C.textMuted, letterSpacing:1, marginTop:4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Performance trend */}
          {trendText && (
            <div style={{ background:C.surface, borderRadius:10, padding:"10px 14px", marginBottom:16, border:`1px solid ${C.border}` }}>
              <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:10, color:C.textMuted, letterSpacing:1.5, marginBottom:4 }}>
                {t("performanceTrend")}
              </div>
              <div style={{ fontSize:13, color:C.textSec, fontFamily:FONT_BODY }}>{trendText}</div>
            </div>
          )}

          {/* Per-bracket breakdown */}
          <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:11, color:C.textMuted, letterSpacing:1, marginBottom:8 }}>
            {t("bracketSummary")}
          </div>
          {(cs.brackets || []).map((b, i) => (
            <div key={i} style={{ marginBottom:10, borderRadius:10, border:`1px solid ${C.border}`, overflow:"hidden", background:C.surface }}>
              <div style={{ height:3, background:`linear-gradient(90deg,${b.color},${b.color}55)` }}/>
              <div style={{ padding:"10px 14px" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                  <span style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:14, color:C.text, letterSpacing:0.5 }}>{b.name}</span>
                  <span style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:12, color:b.color }}>avg {b.avgRoundLength}s</span>
                </div>
                <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                  {(b.roundLog || []).map((r, j) => (
                    <span key={j} style={{ padding:"3px 8px", borderRadius:10, background:C.surfaceAlt,
                      fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:10, color:C.textMuted }}>
                      R{r.round}:{r.workSecs}s
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* Body Check-In */}
          <div style={{ marginTop:8 }}>
            <BodyCheckIn
              exertion={exertion}
              onExertionChange={setExertion}
              bodyStatus={bodyStatus}
              onBodyStatusChange={setBodyStatus}
              settings={settings}
              onSettingsChange={onSettingsChange}
            />
          </div>

          {/* Notes */}
          <div style={{ marginBottom:16, marginTop:8 }}>
            <textarea
              value={notes} onChange={e => setNotes(e.target.value)}
              placeholder={t("competitionNotes")}
              rows={3}
              style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:12,
                color:C.text, fontSize:13, fontFamily:FONT_BODY, resize:"vertical", outline:"none", boxSizing:"border-box" }}
            />
          </div>

          {/* Training Log / Reflection */}
          <TrainingLog value={reflection} onChange={setReflection}
            framingKey="reflectionCompetition" reflections={reflections}
            onReflectionsChange={onReflectionsChange} />

          {/* Share card button */}
          <button onClick={() => setShowShareCard(true)}
            style={{ width:"100%", padding:12, borderRadius:10, border:`1px solid ${C.border}`, background:C.surface,
              color:C.textSec, cursor:"pointer", fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:12, letterSpacing:0.5,
              display:"flex", alignItems:"center", justifyContent:"center", gap:6, marginTop:12 }}>
            {t("share")}
          </button>
        </div>

        {/* Save / Discard */}
        <div style={{ padding:"14px 18px 24px", flexShrink:0, display:"flex", gap:10 }}>
          <button onClick={handleDiscard}
            style={{ flex:1, padding:14, borderRadius:12, border:`1px solid ${C.border}`, background:C.surfaceAlt, color:C.textSec,
              cursor:"pointer", fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:13, letterSpacing:1 }}>
            {t("discardCompetition")}
          </button>
          <button onClick={handleSave}
            style={{ flex:2, padding:14, borderRadius:12, border:"none", background:C.green, color:"#fff",
              cursor:"pointer", fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:13, letterSpacing:1 }}>
            {t("saveCompetition")}
          </button>
        </div>

        {/* Share card modal */}
        {showShareCard && <ShareCard/>}
      </div>
    );
  }

  // Fallback
  return null;
};
