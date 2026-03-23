import React, { useState } from "react";
import { FONT_DISPLAY, FONT_BODY } from "../../constants/fonts";
import { Ic } from "../shared/Ic";
import { Modal } from "../shared/Modal";
import { Btn } from "../shared/Btn";
import { useT } from "../../hooks/useTranslation";
import { useSettings } from "../../hooks/useSettings";

export const ProfileModal = ({ onClose, profile, onSave }) => {
  const { C } = useSettings();
  const t = useT();
  const [f,setF]=useState({ nickname:"", age:"", gender:"", goals:"", years:"", startYear:"", startMonth:"", startDay:"", why:"", ...profile });
  const set=k=>v=>setF(p=>({...p,[k]:v}));
  const lbl = () => ({ display:"block", fontSize:11, fontWeight:800, letterSpacing:1.5, color:C.textSec, fontFamily:FONT_DISPLAY, marginBottom:6 });
  const sectionHdr = (label, icon) => (
    <div style={{ display:"flex", alignItems:"center", gap:7, margin:"20px 0 10px", paddingBottom:6, borderBottom:`1px solid ${C.borderLight}` }}>
      <Ic n={icon} s={14} c={C.accent}/>
      <span style={{ fontWeight:800, fontSize:13, letterSpacing:1.5, color:C.brown, fontFamily:FONT_DISPLAY }}>{label}</span>
    </div>
  );
  return (
    <Modal title={t("myProfile")} onClose={()=>{ onSave(f); onClose(); }}>
      {sectionHdr(t("identity"),"user")}
      <div style={{ marginBottom:14 }}>
        <label style={lbl()}>{t("nickname")}</label>
        <input value={f.nickname} onChange={e=>set("nickname")(e.target.value)} placeholder="e.g. Shadow…"
          style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 12px", color:C.text, fontSize:14, outline:"none", boxSizing:"border-box", fontFamily:FONT_BODY }}/>
        {f.nickname&&<div style={{ fontSize:11, color:C.textMuted, marginTop:4 }}>Header will show: MOVESBOOK <span style={{color:C.accent}}>of {f.nickname}</span></div>}
      </div>
      <div style={{ display:"flex", gap:10 }}>
        <div style={{ flex:1, marginBottom:14 }}>
          <label style={lbl()}>{t("age")}</label>
          <input type="number" value={f.age} onChange={e=>set("age")(e.target.value)} placeholder="—"
            style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 12px", color:C.text, fontSize:14, outline:"none", boxSizing:"border-box", fontFamily:FONT_BODY }}/>
        </div>
        <div style={{ flex:2, marginBottom:14 }}>
          <label style={lbl()}>{t("gender")}</label>
          <select value={f.gender} onChange={e=>set("gender")(e.target.value)}
            style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 12px", color:f.gender?C.text:C.textMuted, fontSize:14, outline:"none", boxSizing:"border-box", fontFamily:FONT_BODY }}>
            <option value="">{t("preferNotToSay")}</option>
            <option value="male">{t("male")}</option>
            <option value="female">{t("female")}</option>
            <option value="non-binary">{t("nonBinary")}</option>
            <option value="other">{t("otherGender")}</option>
          </select>
        </div>
      </div>
      <div style={{ marginBottom:14 }}>
        <label style={lbl()}>{t("whenStartBreaking")}</label>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <div style={{ flex:"0 0 90px" }}>
            <input type="number" value={f.startYear} onChange={e=>set("startYear")(e.target.value)}
              placeholder="YYYY" min="1970" max={new Date().getFullYear()}
              style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 10px", color:C.text, fontSize:14, outline:"none", boxSizing:"border-box", fontFamily:FONT_BODY, textAlign:"center" }}/>
          </div>
          <div style={{ flex:"0 0 62px" }}>
            <input type="number" value={f.startMonth} onChange={e=>set("startMonth")(e.target.value)}
              placeholder="MM" min="1" max="12"
              style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 10px", color:C.text, fontSize:14, outline:"none", boxSizing:"border-box", fontFamily:FONT_BODY, textAlign:"center" }}/>
          </div>
          <div style={{ flex:"0 0 62px" }}>
            <input type="number" value={f.startDay} onChange={e=>set("startDay")(e.target.value)}
              placeholder="DD" min="1" max="31"
              style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 10px", color:C.text, fontSize:14, outline:"none", boxSizing:"border-box", fontFamily:FONT_BODY, textAlign:"center" }}/>
          </div>
          <div style={{ fontSize:11, color:C.textMuted, lineHeight:1.3, flex:1 }}>Year required.<br/>Month &amp; day optional.</div>
        </div>
      </div>
      {sectionHdr(t("breakingGoals"),"target")}
      <div style={{ marginBottom:14 }}>
        <textarea value={f.goals} onChange={e=>set("goals")(e.target.value)} rows={3}
          placeholder="What do you want to achieve? Competitions, style, specific moves…"
          style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 12px", color:C.text, fontSize:14, outline:"none", boxSizing:"border-box", fontFamily:FONT_DISPLAY, letterSpacing:0.3, resize:"vertical" }}/>
      </div>
      {sectionHdr(t("whyBreaking"),"bulb")}
      <div style={{ marginBottom:6 }}>
        <div style={{ position:"relative" }}>
          <textarea value={f.why} onChange={e=>set("why")(e.target.value)} rows={6}
            style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 12px", color:C.text, fontSize:14, outline:"none", boxSizing:"border-box", fontFamily:FONT_DISPLAY, letterSpacing:0.3, resize:"vertical", minHeight:"20vh" }}/>
          {!f.why&&<div style={{ position:"absolute", top:10, left:13, fontSize:13, color:C.textMuted, pointerEvents:"none", fontStyle:"italic", fontFamily:FONT_DISPLAY }}>Remember why you're doing it…</div>}
        </div>
      </div>
      <div style={{ marginTop:24, paddingTop:16, borderTop:`1px solid ${C.borderLight}` }}>
        <button onClick={()=>{ if(window.__MB_AUTH__) window.__MB_AUTH__.signOut(); onClose(); }}
          style={{ width:"100%", padding:"11px", background:"none", border:`1px solid ${C.accent}`,
            borderRadius:8, color:C.accent, fontSize:13, fontWeight:700, cursor:"pointer",
            fontFamily:FONT_DISPLAY, letterSpacing:1.5 }}>
          {t("signOut")}
        </button>
      </div>
      <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:12 }}>
        <Btn variant="secondary" onClick={onClose}>{t("cancel")}</Btn>
        <Btn onClick={()=>{ onSave(f); onClose(); }}>{t("saveProfileBtn")}</Btn>
      </div>
    </Modal>
  );
};
