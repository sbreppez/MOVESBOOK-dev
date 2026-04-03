import React, { useState } from "react";
import { FONT_DISPLAY, FONT_BODY } from "../../constants/fonts";
import { Ic } from "../shared/Ic";
import { useT } from "../../hooks/useTranslation";
import { useSettings } from "../../hooks/useSettings";

export const FeedbackModal = ({ onClose, inline }) => {
  const { C } = useSettings();
  const t = useT();

  const [overall,    setOverall]    = useState("");
  const [rating,     setRating]     = useState(null);
  const [trainLikes, setTrainLikes] = useState([]);
  const [trainOther, setTrainOther] = useState("");
  const [trainImp,   setTrainImp]   = useState("");
  const [movesLikes, setMovesLikes] = useState([]);
  const [movesOther, setMovesOther] = useState("");
  const [movesImp,   setMovesImp]   = useState("");
  const [battleLikes,setBattleLikes]= useState([]);
  const [battleOther,setBattleOther]= useState("");
  const [battleImp,  setBattleImp]  = useState("");
  const [feeling,    setFeeling]    = useState("");
  const [status,     setStatus]     = useState("idle");

  const EMAILJS_PUBLIC  = "0ooV7LLWpYQPKlY6d";
  const EMAILJS_SERVICE = "service_3bmzxw4";
  const EMAILJS_TEMPLATE= "template_skmmjbi";

  const toggleCheck = (val, list, setList) => {
    setList(p => p.includes(val) ? p.filter(x=>x!==val) : [...p, val]);
  };

  const TRAIN_OPTIONS  = [t("fbTrainOpt1"),t("fbTrainOpt2"),t("fbTrainOpt3")];
  const MOVES_OPTIONS  = [t("fbVocabOpt1"),t("fbVocabOpt2"),t("fbVocabOpt3")];
  const BATTLE_OPTIONS = [t("fbBattleOpt1"),t("fbBattleOpt2"),t("fbBattleOpt3")];
  const FEELINGS       = [t("veryDisappointed"),t("somewhatDisappointed"),t("notDisappointed")];

  const canSubmit = overall.trim() && rating && feeling;

  const buildSection = (label, likes, other, imp) => {
    const parts = [];
    if (likes.length) parts.push("Liked: " + likes.join(", ") + (other ? ", " + other : ""));
    else if (other) parts.push("Liked: " + other);
    if (imp.trim()) parts.push("Improvements: " + imp.trim());
    return parts.length ? label + "\n" + parts.join("\n") : label + "\n(no response)";
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setStatus("sending");
    const body = [
      "=== MOVESBOOK FEEDBACK ===",
      "",
      "OVERALL THOUGHTS:",
      overall.trim(),
      "",
      "RATING: " + rating + "/10",
      "",
      buildSection("TRAIN SECTION:",  trainLikes,  trainOther,  trainImp),
      "",
      buildSection("MOVES SECTION:",  movesLikes,  movesOther,  movesImp),
      "",
      buildSection("BATTLE SECTION:", battleLikes, battleOther, battleImp),
      "",
      "FEELING IF APP GONE: " + feeling,
    ].join("\n");

    try {
      await window.emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, {
        user_name:    "MovesBook User",
        user_email:   "feedback@movesbook.app",
        type:         "User Feedback",
        program_name: "MovesBook Feedback Form",
        program_html: body.replace(/\n/g, "<br>"),
        message:      body,
      }, EMAILJS_PUBLIC);
      setStatus("sent");
    } catch(e) {
      console.error("EmailJS error:", e);
      setStatus("error");
    }
  };

  const isDark = useSettings().settings?.theme === "dark";

  const textareaStyle = {
    width:"100%", background:C.surfaceAlt, border:`1px solid ${C.border}`, borderRadius:8,
    padding:"10px 12px", color:C.text, fontSize:13, fontFamily:FONT_BODY, resize:"vertical",
    outline:"none", minHeight:80, lineHeight:1.5,
  };

  const inputStyle = {
    width:"100%", background:C.surfaceAlt, border:`1px solid ${C.border}`, borderRadius:8,
    padding:"10px 12px", color:C.text, fontSize:13, fontFamily:FONT_BODY,
    outline:"none",
  };

  if (status === "sent") return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)",
      zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:"28px 16px" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:C.surface, borderRadius:16,
        padding:"40px 28px", textAlign:"center", maxWidth:340, width:"100%",
        border:`1px solid ${C.border}` }}>
        <div style={{ fontSize:48, marginBottom:16 }}>🙏</div>
        <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:18, letterSpacing:1,
          color:C.text, marginBottom:8 }}>{t("thankYou")}</div>
        <div style={{ fontSize:13, color:C.textSec, lineHeight:1.6, marginBottom:24 }}>
          {t("feedbackThankYouMsg")}
        </div>
        <button onClick={onClose} style={{ background:C.accent, color:C.bg, border:"none",
          borderRadius:8, padding:"11px 28px", fontSize:13, fontWeight:800,
          fontFamily:FONT_DISPLAY, letterSpacing:1, cursor:"pointer" }}>{t("close")}</button>
      </div>
    </div>
  );

  return (
    <div style={ inline ? { background:C.bg } : { position:"absolute", inset:0, zIndex:1000, background:C.bg,
      display:"flex", flexDirection:"column", overflow:"hidden" }}>

        {/* Header — hidden in inline mode */}
        {!inline && <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"14px 18px", borderBottom:`1px solid ${C.border}`, flexShrink:0,
          background:C.surface }}>
          <div>
            <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:14, letterSpacing:2,
              color:C.text }}>{"💬 "+t("feedbackTitle")}</div>
            <div style={{ fontSize:11, color:C.textMuted, marginTop:1 }}>
              {t("feedbackSubtitle")+" 🔥"}
            </div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer",
            padding:4, display:"flex" }}>
            <Ic n="x" s={18} c={C.textMuted}/>
          </button>
        </div>}

        {/* Scrollable body */}
        <div style={{ flex:1, overflow:"auto", padding:"18px 18px 4px" }}>

          {/* Overall thoughts */}
          <div style={{ marginBottom:22 }}>
            <div style={{ fontSize:11, fontWeight:800, letterSpacing:2, color:C.accent, fontFamily:FONT_DISPLAY, marginBottom:10 }}>{t("overallThoughts")+" *"}</div>
            <div style={{ fontSize:12, color:C.textMuted, marginBottom:8 }}>{t("overallThoughtsHint")}</div>
            <textarea value={overall} onChange={e=>setOverall(e.target.value)} placeholder={t("sharePlaceholder")} style={textareaStyle}/>
          </div>

          {/* Rating */}
          <div style={{ marginBottom:22 }}>
            <div style={{ fontSize:11, fontWeight:800, letterSpacing:2, color:C.accent, fontFamily:FONT_DISPLAY, marginBottom:10 }}>{t("overallRating")+" *"}</div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {[1,2,3,4,5,6,7,8,9,10].map(n=>(
                <button key={n} onClick={()=>setRating(n)}
                  style={{ width:40, height:40, borderRadius:8, border:`1.5px solid ${rating===n?C.accent:C.border}`,
                    background:rating===n?C.accent:C.surfaceAlt, color:rating===n?C.bg:C.textSec,
                    fontWeight:800, fontSize:13, fontFamily:FONT_DISPLAY, cursor:"pointer", transition:"all 0.15s" }}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Train */}
          <div style={{ marginBottom:22 }}>
            <div style={{ fontSize:11, fontWeight:800, letterSpacing:2, color:C.accent, fontFamily:FONT_DISPLAY, marginBottom:10 }}>{"🎯 "+t("trainSectionLabel")}</div>
            <div style={{ fontSize:12, color:C.textMuted, marginBottom:6 }}>{t("whatDidYouLike")}</div>
            {TRAIN_OPTIONS.map(o=>(
              <button key={o} onClick={()=>toggleCheck(o,trainLikes,setTrainLikes)}
                style={{ display:"flex", alignItems:"center", gap:10, width:"100%", background:"none", border:"none", cursor:"pointer", padding:"7px 0", textAlign:"left" }}>
                <div style={{ width:18, height:18, borderRadius:4, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center",
                  border:`2px solid ${trainLikes.includes(o)?C.accent:C.border}`, background:trainLikes.includes(o)?C.accent:"transparent", transition:"all 0.15s" }}>
                  {trainLikes.includes(o)&&<Ic n="check" s={11} c={C.bg}/>}
                </div>
                <span style={{ fontSize:13, color:C.textSec, fontFamily:FONT_BODY }}>{o}</span>
              </button>
            ))}
            <input value={trainOther} onChange={e=>setTrainOther(e.target.value)} placeholder={t("otherPlaceholder")} style={{...inputStyle, marginTop:6}}/>
            <div style={{ fontSize:12, color:C.textMuted, margin:"10px 0 6px" }}>{t("whatCanBeImproved")}</div>
            <textarea value={trainImp} onChange={e=>setTrainImp(e.target.value)} placeholder={t("confusingOrMissing")} style={{...textareaStyle, minHeight:60}}/>
          </div>

          {/* Vocab */}
          <div style={{ marginBottom:22 }}>
            <div style={{ fontSize:11, fontWeight:800, letterSpacing:2, color:C.accent, fontFamily:FONT_DISPLAY, marginBottom:10 }}>{"📚 "+t("movesSectionLabel")}</div>
            <div style={{ fontSize:12, color:C.textMuted, marginBottom:6 }}>{t("whatDidYouLike")}</div>
            {MOVES_OPTIONS.map(o=>(
              <button key={o} onClick={()=>toggleCheck(o,movesLikes,setMovesLikes)}
                style={{ display:"flex", alignItems:"center", gap:10, width:"100%", background:"none", border:"none", cursor:"pointer", padding:"7px 0", textAlign:"left" }}>
                <div style={{ width:18, height:18, borderRadius:4, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center",
                  border:`2px solid ${movesLikes.includes(o)?C.accent:C.border}`, background:movesLikes.includes(o)?C.accent:"transparent", transition:"all 0.15s" }}>
                  {movesLikes.includes(o)&&<Ic n="check" s={11} c={C.bg}/>}
                </div>
                <span style={{ fontSize:13, color:C.textSec, fontFamily:FONT_BODY }}>{o}</span>
              </button>
            ))}
            <input value={movesOther} onChange={e=>setMovesOther(e.target.value)} placeholder={t("otherPlaceholder")} style={{...inputStyle, marginTop:6}}/>
            <div style={{ fontSize:12, color:C.textMuted, margin:"10px 0 6px" }}>{t("whatCanBeImproved")}</div>
            <textarea value={movesImp} onChange={e=>setMovesImp(e.target.value)} placeholder={t("confusingOrMissing")} style={{...textareaStyle, minHeight:60}}/>
          </div>

          {/* Battle */}
          <div style={{ marginBottom:22 }}>
            <div style={{ fontSize:11, fontWeight:800, letterSpacing:2, color:C.accent, fontFamily:FONT_DISPLAY, marginBottom:10 }}>{"⚔️ "+t("battleSectionLabel")}</div>
            <div style={{ fontSize:12, color:C.textMuted, marginBottom:6 }}>{t("whatDidYouLike")}</div>
            {BATTLE_OPTIONS.map(o=>(
              <button key={o} onClick={()=>toggleCheck(o,battleLikes,setBattleLikes)}
                style={{ display:"flex", alignItems:"center", gap:10, width:"100%", background:"none", border:"none", cursor:"pointer", padding:"7px 0", textAlign:"left" }}>
                <div style={{ width:18, height:18, borderRadius:4, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center",
                  border:`2px solid ${battleLikes.includes(o)?C.accent:C.border}`, background:battleLikes.includes(o)?C.accent:"transparent", transition:"all 0.15s" }}>
                  {battleLikes.includes(o)&&<Ic n="check" s={11} c={C.bg}/>}
                </div>
                <span style={{ fontSize:13, color:C.textSec, fontFamily:FONT_BODY }}>{o}</span>
              </button>
            ))}
            <input value={battleOther} onChange={e=>setBattleOther(e.target.value)} placeholder={t("otherPlaceholder")} style={{...inputStyle, marginTop:6}}/>
            <div style={{ fontSize:12, color:C.textMuted, margin:"10px 0 6px" }}>{t("whatCanBeImproved")}</div>
            <textarea value={battleImp} onChange={e=>setBattleImp(e.target.value)} placeholder={t("confusingOrMissing")} style={{...textareaStyle, minHeight:60}}/>
          </div>

          {/* Feeling */}
          <div style={{ marginBottom:22 }}>
            <div style={{ fontSize:11, fontWeight:800, letterSpacing:2, color:C.accent, fontFamily:FONT_DISPLAY, marginBottom:10 }}>{t("ifAppDisappeared")+" *"}</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {FEELINGS.map(f=>(
                <button key={f} onClick={()=>setFeeling(f)}
                  style={{ display:"flex", alignItems:"center", gap:10,
                    border:`1.5px solid ${feeling===f?C.accent:C.border}`, borderRadius:8,
                    padding:"10px 14px", cursor:"pointer",
                    background:feeling===f?`${C.accent}18`:C.surfaceAlt, transition:"all 0.15s" }}>
                  <div style={{ width:16, height:16, borderRadius:"50%", flexShrink:0,
                    border:`2px solid ${feeling===f?C.accent:C.border}`,
                    background:feeling===f?C.accent:"transparent", transition:"all 0.15s" }}/>
                  <span style={{ fontSize:13, color:feeling===f?C.text:C.textSec,
                    fontFamily:FONT_BODY, fontWeight:feeling===f?600:400 }}>{f}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ height:8 }}/>
        </div>

        {/* Footer */}
        <div style={{ padding:"12px 18px", borderTop:`1px solid ${C.border}`,
          flexShrink:0, background:C.surface }}>
          {status === "error" && (
            <div style={{ fontSize:12, color:C.red, marginBottom:8, textAlign:"center" }}>
              {t("somethingWentWrong")}
            </div>
          )}
          {!canSubmit && (
            <div style={{ fontSize:11, color:C.textMuted, marginBottom:6, textAlign:"center" }}>
              {"* "+t("requiredFields")}
            </div>
          )}
          <button onClick={handleSubmit} disabled={!canSubmit || status==="sending"}
            style={{ width:"100%", padding:"13px", borderRadius:10, border:"none",
              background: canSubmit ? C.accent : C.border,
              color: canSubmit ? C.bg : C.textMuted,
              fontSize:14, fontWeight:900, fontFamily:FONT_DISPLAY, letterSpacing:1.5,
              cursor: canSubmit ? "pointer" : "not-allowed",
              opacity: status==="sending" ? 0.7 : 1, transition:"all 0.2s" }}>
            {status === "sending" ? t("sendingBtn") : t("submitFeedback")}
          </button>
        </div>
    </div>
  );
};
