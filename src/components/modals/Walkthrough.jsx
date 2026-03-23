import React, { useState, useEffect } from "react";
import { FONT_DISPLAY, FONT_BODY } from "../../constants/fonts";
import { Ic } from "../shared/Ic";
import { useT } from "../../hooks/useTranslation";

const TOUR_STEPS = [
  { type:"center", skippable:true,
    emoji:"👟", title:"WELCOME TO MOVESBOOK",
    body:"Your Breaking Logbook — to Study and Evolve.",
    sub:"Quick 60-second tour. Skip anytime.",
    cta:"LET'S GO →" },

  { type:"center",
    emoji:"🗺️", title:"THREE SECTIONS",
    body:"Everything in MovesBook lives in one of three places:",
    cards:[
      { emoji:"🎯", label:"TRAIN", desc:"Set goals, develop habits & take notes" },
      { emoji:"📜", label:"MOVES", desc:"Build your vocabulary and track your arsenal" },
      { emoji:"⚔️", label:"BATTLE", desc:"Plan your rounds or freestyle without repeating" },
    ],
    cta:"GOT IT →" },

  { type:"spotlight", target:"tour-tab-ideas",
    emoji:"🎯", title:"TRAIN",
    body:"Set goals, capture training ideas, and build daily habits. Your planning space.",
    cta:"NEXT →" },

  { type:"center",
    emoji:"🎯", title:"TWO TYPES OF GOAL",
    cards:[
      { emoji:"🎯", label:"JOURNEY GOAL", desc:"A long-term goal with a plan and a deadline. e.g. \"Be ready to compete at BOTY by December\"" },
      { emoji:"🏹", label:"TARGET GOAL",  desc:"A number to hit by a deadline. e.g. \"1000 reps of six step by June\"" },
    ],
    sub:"Both goals have a training journal attached.",
    cta:"NEXT →" },

  { type:"center",
    emoji:"🔥", title:"BUILD HABITS",
    body:"Show up every day and let consistency do the work. Track your streak and watch yourself grow over time. Small steps. Long game.",
    cta:"NEXT →" },

  { type:"spotlight", target:"tour-tab-wip",
    emoji:"📜", title:"MOVES",
    body:"Build your vocabulary — organized, rated and fully customizable. See your full arsenal at a glance.",
    cta:"NEXT →" },

  { type:"center",
    emoji:"📈", title:"MASTERY",
    body:"Know where you are. That's where progress begins.",
    cards:[
      { emoji:"🔴", label:"0–30%",  desc:"Still learning it" },
      { emoji:"🟠", label:"30–60%", desc:"Getting consistent" },
      { emoji:"🟡", label:"60–80%", desc:"Solid, can use it" },
      { emoji:"🟢", label:"80%+",   desc:"Battle-ready" },
    ],
    sub:"Each move has a mastery bar — set it to where you honestly stand.",
    cta:"NEXT →" },

  { type:"spotlight", target:"tour-tab-ready",
    emoji:"⚔️", title:"BATTLE",
    body:"Plan every round before you step on the floor, or build a freestyle list and tick off moves as you throw them — stay fresh, no repeats.",
    cta:"NEXT →" },

  { type:"center",
    emoji:"➕", title:"THE + BUTTON",
    body:"The + button does it all — add a move, goal, habit, round, or pick moves for your freestyle list.",
    cta:"NEXT →" },

  { type:"spotlight", target:"tour-manual-btn",
    emoji:"❓", title:"USER MANUAL",
    body:"Tap ? anytime for the full manual. Every feature documented, fully searchable. The whole playbook.",
    cta:"NEXT →" },

  { type:"spotlight", target:"tour-profile",
    emoji:"👤", title:"YOUR PROFILE",
    body:"Set your name and leave a message to your future self — for the hard days.",
    cta:"NEXT →" },

  { type:"center", skippable:false,
    emoji:"🔥", title:"YOU'RE READY",
    body:"Go add your first move. Set your first goal. Elevate your breaking today.",
    cta:"LET'S GET IT 🔥" },
];

export const Walkthrough = ({ onDone }) => {
  const t = useT();
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState(null);
  const [fade, setFade] = useState(true);
  const current = TOUR_STEPS[step];
  const isLast  = step === TOUR_STEPS.length - 1;
  const progress = Math.round((step / (TOUR_STEPS.length - 1)) * 100);

  const D = {
    bg:"#0e0906", surface:"#1a1208", border:"#3a2a18",
    text:"#ede0cc", muted:"#7a6858", accent:"#cf2020", accentD:"#8b1a1a",
  };

  useEffect(() => {
    if (current.type === "spotlight" && current.target) {
      const tryFind = (n) => {
        const el = document.getElementById(current.target);
        if (el) {
          const r = el.getBoundingClientRect();
          setRect({ top:r.top, left:r.left, width:r.width, height:r.height });
        } else if (n < 10) { setTimeout(() => tryFind(n+1), 80); }
        else { setRect(null); }
      };
      tryFind(0);
    } else { setRect(null); }
  }, [step]);

  const advance = () => {
    setFade(false);
    setTimeout(() => {
      if (isLast) { onDone(); return; }
      setStep(s => s+1);
      setFade(true);
    }, 160);
  };

  const TW = 284;
  const tooltipPos = () => {
    if (!rect) return { top:"50%", left:"50%", transform:"translate(-50%,-50%)", position:"fixed" };
    const vw = window.innerWidth;
    const cx  = rect.left + rect.width / 2;
    const left = Math.max(10, Math.min(cx - TW/2, vw - TW - 10));
    const spaceBelow = window.innerHeight - (rect.top + rect.height);
    if (spaceBelow > 170) {
      return { position:"fixed", top:rect.top + rect.height + 14, left, width:TW, arrowTop:true, arrowLeft: cx - left - 7 };
    } else {
      return { position:"fixed", bottom: window.innerHeight - rect.top + 14, left, width:TW, arrowBottom:true, arrowLeft: cx - left - 7 };
    }
  };

  const Dots = () => (
    <div style={{ display:"flex", gap:4, alignItems:"center" }}>
      {TOUR_STEPS.map((_,i) => (
        <div key={i} style={{
          width:i===step?18:5, height:5, borderRadius:3,
          background:i===step ? D.accent : i<step ? "#5a3020" : D.border,
          transition:"all 0.25s ease"
        }}/>
      ))}
    </div>
  );

  const ProgressBar = () => (
    <div style={{ height:2, background:D.border, borderRadius:1, marginBottom:22 }}>
      <div style={{ height:"100%", width:progress+"%", background:D.accent,
        borderRadius:1, transition:"width 0.35s ease" }}/>
    </div>
  );

  const MiniCards = ({ cards }) => (
    <div style={{ display:"flex", flexDirection:"column", gap:7, margin:"14px 0 18px" }}>
      {cards.map((c,i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", gap:12,
          background:D.bg, border:"1px solid "+D.border,
          borderRadius:10, padding:"9px 14px" }}>
          <span style={{ fontSize:19, flexShrink:0 }}>{c.emoji}</span>
          <div>
            <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:11,
              letterSpacing:1.5, color:D.text }}>{c.label}</div>
            <div style={{ fontSize:11, color:D.muted, marginTop:1, lineHeight:1.4 }}>{c.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );

  const CTABtn = ({ label }) => (
    <button onClick={advance}
      style={{ width:"100%", background:D.accent, border:"none", borderRadius:12,
        padding:"13px 0", color:"#fff", fontFamily:FONT_DISPLAY, fontWeight:900,
        fontSize:13, letterSpacing:2.5, cursor:"pointer",
        boxShadow:"0 4px 24px rgba(207,32,32,0.4)", transition:"transform 0.1s" }}
      onMouseDown={e=>e.currentTarget.style.transform="scale(0.97)"}
      onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}
      onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
      {label}
    </button>
  );

  const CenterCard = () => (
    <div style={{ position:"fixed", inset:0, display:"flex", alignItems:"center",
      justifyContent:"center", padding:"20px 16px", zIndex:10001 }}>
      <div style={{ background:D.surface, border:"1px solid "+D.border, borderRadius:22,
        padding:"26px 22px", maxWidth:340, width:"100%",
        boxShadow:"0 40px 120px rgba(0,0,0,0.85)" }}>
        <ProgressBar/>
        <div style={{ textAlign:"center", marginBottom:current.cards ? 4 : 22 }}>
          <div style={{ fontSize:40, marginBottom:10, lineHeight:1 }}>{current.emoji}</div>
          <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:16,
            letterSpacing:2.5, color:D.text, marginBottom:10 }}>{current.title}</div>
          {current.body && (
            <p style={{ fontSize:13, color:D.muted, lineHeight:1.65, margin:0 }}>{current.body}</p>
          )}
        </div>
        {current.cards && <MiniCards cards={current.cards}/>}
        {current.sub && (
          <p style={{ fontSize:11, color:D.muted, fontStyle:"italic",
            textAlign:"center", margin:"0 0 16px", lineHeight:1.55 }}>{current.sub}</p>
        )}
        <CTABtn label={current.cta}/>
        {current.skippable && (
          <button onClick={onDone}
            style={{ display:"block", margin:"12px auto 0", background:"none", border:"none",
              color:D.muted, fontSize:11, cursor:"pointer", fontFamily:FONT_DISPLAY, letterSpacing:1 }}>
            {t("skipTour")}
          </button>
        )}
        <div style={{ display:"flex", justifyContent:"center", marginTop:18 }}>
          <Dots/>
        </div>
      </div>
    </div>
  );

  const SpotlightCard = () => {
    const pos = tooltipPos();
    const arrowClamp = v => Math.max(10, Math.min(v, TW - 24));
    return (
      <div style={{ position:pos.position, top:pos.top, bottom:pos.bottom,
        left:pos.left, width:pos.width,
        background:D.surface, border:"1px solid "+D.border,
        borderRadius:16, padding:"16px 18px 14px",
        boxShadow:"0 20px 70px rgba(0,0,0,0.9)", zIndex:10001 }}>

        {pos.arrowTop && rect && (
          <div style={{ position:"absolute", top:-7, left:arrowClamp(pos.arrowLeft),
            width:14, height:14, background:D.surface,
            borderTop:"1px solid "+D.border, borderLeft:"1px solid "+D.border,
            transform:"rotate(45deg)" }}/>
        )}
        {pos.arrowBottom && rect && (
          <div style={{ position:"absolute", bottom:-7, left:arrowClamp(pos.arrowLeft),
            width:14, height:14, background:D.surface,
            borderBottom:"1px solid "+D.border, borderRight:"1px solid "+D.border,
            transform:"rotate(45deg)" }}/>
        )}

        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
          <span style={{ fontSize:18 }}>{current.emoji}</span>
          <span style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:14,
            letterSpacing:2, color:D.text }}>{current.title}</span>
          <div style={{ flex:1 }}/>
          <span style={{ fontSize:10, color:D.muted, fontFamily:FONT_DISPLAY }}>
            {step+1}/{TOUR_STEPS.length}
          </span>
        </div>

        <p style={{ fontSize:12.5, color:D.muted, lineHeight:1.6, margin:"0 0 14px" }}>
          {current.body}
        </p>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <Dots/>
          <button onClick={advance}
            style={{ background:D.accent, border:"none", borderRadius:8,
              padding:"8px 18px", color:"#fff", fontFamily:FONT_DISPLAY, fontWeight:900,
              fontSize:11, letterSpacing:2, cursor:"pointer",
              boxShadow:"0 2px 12px rgba(207,32,32,0.35)" }}>
            {isLast ? "DONE 🔥" : current.cta}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:10000,
      opacity:fade?1:0, transition:"opacity 0.16s ease",
      pointerEvents:fade?"auto":"none" }}>

      {current.type === "center" ? (
        <div style={{ position:"fixed", inset:0, background:"rgba(8,4,2,0.95)" }}/>
      ) : (
        <svg style={{ position:"fixed", inset:0, width:"100%", height:"100%", pointerEvents:"none" }}>
          <defs>
            <mask id="tour-mask">
              <rect width="100%" height="100%" fill="white"/>
              {rect && <rect x={rect.left-8} y={rect.top-8}
                width={rect.width+16} height={rect.height+16} rx={12} fill="black"/>}
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(8,4,2,0.9)" mask="url(#tour-mask)"/>
          {rect && (
            <rect x={rect.left-8} y={rect.top-8}
              width={rect.width+16} height={rect.height+16} rx={12}
              fill="none" stroke="#cf2020" strokeWidth="2.5"
              style={{ filter:"drop-shadow(0 0 10px rgba(207,32,32,0.65))" }}/>
          )}
        </svg>
      )}

      {current.type === "center"    && <CenterCard/>}
      {current.type === "spotlight" && <SpotlightCard/>}
    </div>
  );
};
