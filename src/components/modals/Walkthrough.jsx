import React, { useState, useEffect } from "react";
import { FONT_DISPLAY, FONT_BODY } from "../../constants/fonts";
import { Ic } from "../shared/Ic";
import { useT } from "../../hooks/useTranslation";

const getTourSteps = (t) => [
  { type:"center", skippable:true,
    icon:"dumbbell", title:t("tourWelcomeTitle"),
    body:t("tourWelcomeBody"),
    sub:t("tourWelcomeSub"),
    cta:t("tourWelcomeCta")+" →" },

  { type:"center",
    icon:"compass", title:t("tourSectionsTitle"),
    body:t("tourSectionsBody"),
    cards:[
      { icon:"target", label:"TRAIN", desc:t("tourTrainCardDesc") },
      { icon:"scroll", label:"MOVES", desc:t("tourMovesCardDesc") },
      { icon:"swords", label:"BATTLE", desc:t("tourBattleCardDesc") },
    ],
    cta:t("tourGotItCta")+" →" },

  { type:"spotlight", target:"tour-tab-ideas",
    icon:"target", title:"TRAIN",
    body:t("tourTrainBody"),
    cta:t("tourNextCta")+" →" },

  { type:"spotlight", target:"tour-tab-wip",
    icon:"scroll", title:"MOVES",
    body:t("tourMovesBody"),
    cta:t("tourNextCta")+" →" },

  { type:"spotlight", target:"tour-tab-ready",
    icon:"swords", title:"BATTLE",
    body:t("tourBattleBody"),
    cta:t("tourNextCta")+" →" },

  { type:"center", skippable:false,
    icon:"plus", title:t("tourAddMoveTitle"),
    body:t("tourAddMoveBody"),
    cta:t("tourAddMoveCta") },
];

export const Walkthrough = ({ onDone }) => {
  const t = useT();
  const TOUR_STEPS = getTourSteps(t);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState(null);
  const [fade, setFade] = useState(true);
  const current = TOUR_STEPS[step];
  const isLast  = step === TOUR_STEPS.length - 1;
  const progress = Math.round((step / (TOUR_STEPS.length - 1)) * 100);

  const D = {
    bg:"#0e0906", surface:"#1a1208", border:"#3a2a18",
    text:"#ede0cc", muted:"#7a6858", accent:"#cf2020", accentD:"#C4453E",
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
          <span style={{ flexShrink:0, display:"flex", alignItems:"center" }}><Ic n={c.icon} s={19} c={D.accent}/></span>
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
          <div style={{ marginBottom:10, lineHeight:1, display:"flex", justifyContent:"center" }}><Ic n={current.icon} s={40} c={D.accent}/></div>
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
          <span style={{ display:"flex", alignItems:"center" }}><Ic n={current.icon} s={18} c={D.accent}/></span>
          <span style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:14,
            letterSpacing:2, color:D.text }}>{current.title}</span>
          <div style={{ flex:1 }}/>
          <span style={{ fontSize:10, color:D.muted, fontFamily:FONT_DISPLAY }}>
            {step+1}/{TOUR_STEPS.length}
          </span>
        </div>

        <p style={{ fontSize:13, color:D.muted, lineHeight:1.6, margin:"0 0 14px" }}>
          {current.body}
        </p>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <Dots/>
          <button onClick={advance}
            style={{ background:D.accent, border:"none", borderRadius:8,
              padding:"8px 18px", color:"#fff", fontFamily:FONT_DISPLAY, fontWeight:900,
              fontSize:11, letterSpacing:2, cursor:"pointer",
              boxShadow:"0 2px 12px rgba(207,32,32,0.35)" }}>
            {isLast ? t("tourDone") : current.cta}
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
