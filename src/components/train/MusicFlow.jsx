import React, { useState, useEffect, useRef } from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { Ic } from '../shared/Ic';
import { TrainingLog } from '../shared/TrainingLog';
import { useT } from '../../hooks/useTranslation';
import { todayLocal } from '../../utils/dateUtils';

const PROMPT_KEYS = [
  "mfPrompt1","mfPrompt2","mfPrompt3","mfPrompt4",
  "mfPrompt5","mfPrompt6","mfPrompt7","mfPrompt8",
  "mfPrompt9","mfPrompt10","mfPrompt11","mfPrompt12",
];
const STAGE_KEYS = ["mfStage1","mfStage2","mfStage3"];
const PROMPT_INTERVAL = 75000; // 75 seconds

const getStage = (count) => count < 3 ? 0 : count < 6 ? 1 : 2;

const fmtTime = (ms) => {
  const totalSec = Math.floor(ms / 1000);
  const m = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const s = String(totalSec % 60).padStart(2, "0");
  return `${m}:${s}`;
};

export const MusicFlow = ({ musicflow, onMusicflowChange, onUpdateSession, reflections, onReflectionsChange, addToast, addCalendarEvent, onClose }) => {
  const t = useT();

  const [screen, setScreen] = useState("active");
  const [timerStart] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [promptIdx, setPromptIdx] = useState(0);
  const [promptOpacity, setPromptOpacity] = useState(0);
  const [promptCount, setPromptCount] = useState(0);
  const [savedSession, setSavedSession] = useState(null);
  const [reflection, setReflection] = useState("");
  const [introVisible, setIntroVisible] = useState(true);
  const [introOpacity, setIntroOpacity] = useState(1);

  const fadeInRef = useRef(null);
  const fadeOutRef = useRef(null);
  const advanceRef = useRef(null);
  const introRef = useRef(null);
  const reflectionTimer = useRef(null);

  // ── Count-up timer ──
  useEffect(() => {
    if (screen !== "active") return;
    const iv = setInterval(() => setElapsed(Date.now() - timerStart), 1000);
    return () => clearInterval(iv);
  }, [screen, timerStart]);

  // ── Intro fade-out after 5 seconds ──
  useEffect(() => {
    introRef.current = setTimeout(() => {
      setIntroOpacity(0);
      setTimeout(() => setIntroVisible(false), 500);
    }, 5000);
    return () => clearTimeout(introRef.current);
  }, []);

  // ── Prompt cycling with fade (delayed until intro is gone) ──
  useEffect(() => {
    if (screen !== "active" || introVisible) return;

    setPromptOpacity(0);

    fadeInRef.current = setTimeout(() => setPromptOpacity(1), 50);

    fadeOutRef.current = setTimeout(() => setPromptOpacity(0), PROMPT_INTERVAL);

    advanceRef.current = setTimeout(() => {
      setPromptIdx(prev => (prev + 1) % 12);
      setPromptCount(prev => prev + 1);
    }, PROMPT_INTERVAL + 500);

    return () => {
      clearTimeout(fadeInRef.current);
      clearTimeout(fadeOutRef.current);
      clearTimeout(advanceRef.current);
    };
  }, [screen, promptIdx, introVisible]);

  // Debounced reflection save
  useEffect(() => {
    if (!savedSession || !reflection.trim()) return;
    clearTimeout(reflectionTimer.current);
    reflectionTimer.current = setTimeout(() => {
      onUpdateSession(savedSession.id, { reflection: reflection.trim() });
    }, 800);
    return () => clearTimeout(reflectionTimer.current);
  }, [reflection, savedSession, onUpdateSession]);

  const flushReflection = () => {
    clearTimeout(reflectionTimer.current);
    if (savedSession && reflection.trim()) {
      onUpdateSession(savedSession.id, { reflection: reflection.trim() });
    }
  };

  const handleDone = () => {
    const duration = Math.floor(elapsed / 1000);
    const stageReached = getStage(promptCount) + 1;
    const finalPromptCount = promptCount + 1;
    const today = todayLocal();

    const session = {
      id: Date.now(),
      date: new Date().toISOString(),
      duration,
      promptCount: finalPromptCount,
      stageReached,
    };

    onMusicflowChange(prev => ({
      ...prev,
      sessions: [session, ...(prev.sessions || [])],
    }));

    addCalendarEvent(
      { date: today, type: "training", title: "Music Flow", duration, source: "musicflow" },
      { silent: true }
    );

    addToast({ icon: "check", title: t("sessionLogged") });
    setSavedSession(session);
    setScreen("done");
  };

  // ── Active Screen ──
  if (screen === "active") {
    const stage = getStage(promptCount);
    return (
      <div style={{ position:"absolute", inset:0, zIndex:500, background:C.bg,
        display:"flex", flexDirection:"column", overflow:"hidden" }}>

        {/* Top bar: stage indicator (left) + close button (right) */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start",
          padding:"14px 16px 0" }}>
          <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:10, color:C.textMuted,
            letterSpacing:2, textTransform:"uppercase", paddingTop:8 }}>
            {`STAGE ${stage + 1} · ${t(STAGE_KEYS[stage])}`}
          </div>
          <button onClick={onClose} style={{ background:C.surfaceAlt, border:`1px solid ${C.border}`,
            borderRadius:10, width:36, height:36, display:"flex", alignItems:"center",
            justifyContent:"center", cursor:"pointer", flexShrink:0 }}>
            <Ic n="x" s={14} c={C.textSec}/>
          </button>
        </div>

        {/* Timer */}
        <div style={{ textAlign:"center", paddingTop:32 }}>
          <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:48, color:C.textMuted,
            letterSpacing:2 }}>
            {fmtTime(elapsed)}
          </div>
        </div>

        {/* Prompt area */}
        <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center",
          padding:"0 32px" }}>
          {introVisible ? (
            <div style={{ opacity:introOpacity, transition:"opacity 0.5s ease-in-out",
              textAlign:"center" }}>
              <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:18, color:C.text,
                lineHeight:1.5 }}>
                {t("musicFlowIntro1")}
              </div>
              <div style={{ fontFamily:FONT_BODY, fontSize:13, color:C.textMuted, marginTop:8,
                lineHeight:1.5 }}>
                {t("musicFlowIntro2")}
              </div>
            </div>
          ) : (
            <div style={{ opacity:promptOpacity, transition:"opacity 0.5s ease-in-out",
              fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:22, color:C.text,
              textAlign:"center", lineHeight:1.5, maxWidth:340 }}>
              {t(PROMPT_KEYS[promptIdx])}
            </div>
          )}
        </div>

        {/* Done button */}
        <div style={{ padding:"24px 24px 40px" }}>
          <button onClick={handleDone} style={{ width:"100%", padding:"16px 0",
            background:C.accent, color:"#fff", border:"none", borderRadius:12,
            fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:14, letterSpacing:2,
            cursor:"pointer" }}>
            {t("done")}
          </button>
        </div>
      </div>
    );
  }

  // ── Done Screen ──
  if (screen === "done" && savedSession) {
    const handleClose = () => { flushReflection(); onClose(); };
    return (
      <div style={{ position:"absolute", inset:0, zIndex:500, background:C.bg,
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-start",
        padding:24, paddingTop:48, overflowY:"auto" }}>

        {/* Close button */}
        <button onClick={handleClose} style={{ position:"absolute", top:14, right:16,
          background:C.surfaceAlt, border:`1px solid ${C.border}`, borderRadius:10,
          width:36, height:36, display:"flex", alignItems:"center", justifyContent:"center",
          cursor:"pointer" }}>
          <Ic n="x" s={14} c={C.textSec}/>
        </button>

        {/* Checkmark */}
        <div style={{ width:64, height:64, borderRadius:"50%", background:C.green,
          display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16 }}>
          <Ic n="check" s={32} c="#fff"/>
        </div>

        <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:16, letterSpacing:2,
          color:C.green, marginBottom:24 }}>
          {t("sessionComplete")}
        </div>

        {/* Stats grid */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10,
          width:"100%", maxWidth:340, marginBottom:20 }}>
          {[
            { value: fmtTime(savedSession.duration * 1000), label: t("mfSessionLength") },
            { value: savedSession.promptCount, label: t("mfPromptsCycled") },
            { value: savedSession.stageReached, label: t("mfStageReached") },
          ].map((s, i) => (
            <div key={i} style={{ background:C.surface, borderRadius:10, padding:12,
              border:`1px solid ${C.border}`, textAlign:"center" }}>
              <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:24,
                color:C.text }}>{s.value}</div>
              <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:10,
                color:C.textMuted, letterSpacing:1, marginTop:4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Training Log */}
        <div style={{ width:"100%", maxWidth:340, marginBottom:20 }}>
          <TrainingLog value={reflection} onChange={setReflection}
            framingKey="reflectionMusic" reflections={reflections}
            onReflectionsChange={onReflectionsChange} />
        </div>

        {/* Done button */}
        <button onClick={handleClose} style={{ width:"100%", maxWidth:340, padding:"16px 0",
          background:C.accent, color:"#fff", border:"none", borderRadius:12,
          fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:14, letterSpacing:2,
          cursor:"pointer" }}>
          {t("done")}
        </button>
      </div>
    );
  }

  return null;
};
