import React, { useState, useRef } from "react";
import { FONT_DISPLAY, FONT_BODY } from "../../constants/fonts";
import { Ic } from "../shared/Ic";
import { Btn } from "../shared/Btn";
import { useT } from "../../hooks/useTranslation";
import { useSettings } from "../../hooks/useSettings";

import { SettingsModal } from "./SettingsModal";
import { FeedbackModal } from "./FeedbackModal";
import { LegalModal } from "./LegalModal";
import { downloadBackup, restoreBackup } from "./BackupModal";
import { ProfileAvatar } from "../shared/ProfileAvatar";
import { compressImage } from "../../utils/imageUtils";

export const ProfileModal = ({ onClose, profile, onSave, reminders, onRemindersChange, addToast, onOpenManageReminders, onNavigateToStance, settings, onSettingsChange, onClearMoves, onRestoreRounds, onRestartTour, zoom, onZoomChange, customAttrs, setCustomAttrs, onOpenManual, profilePhoto, onProfilePhotoChange, fbUser }) => {
  const { C } = useSettings();
  const t = useT();
  const [f,setF]=useState({ nickname:"", age:"", gender:"", goals:"", years:"", startYear:"", startMonth:"", startDay:"", why:"", ...profile });
  const set=k=>v=>setF(p=>({...p,[k]:v}));
  const [showSettingsSection, setShowSettingsSection] = useState(false);
  const [showFeedbackSection, setShowFeedbackSection] = useState(false);
  const [legalPage, setLegalPage] = useState(null);
  const fileInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const [showNoteAdd, setShowNoteAdd] = useState(false);
  const [noteText, setNoteText] = useState("");
  const noteItems = reminders?.items || [];
  const settingsSnapshot = useRef(settings);

  const handleNoteSave = () => {
    const text = noteText.trim();
    if (!text) return;
    const newItem = { id: Date.now().toString(), text, createdAt: new Date().toISOString().split("T")[0] };
    onRemindersChange({ ...reminders, items: [...noteItems, newItem] });
    addToast({ icon: "mapPin", title: t("noteSaved") });
    setNoteText("");
    setShowNoteAdd(false);
  };
  const handleProfilePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await compressImage(file, 200, { crop: true, quality: 0.8 });
    if (onProfilePhotoChange) onProfilePhotoChange(dataUrl);
    if (addToast) addToast({ icon: "camera", title: t("photoUpdated") });
    e.target.value = "";
  };
  const handleRemovePhoto = () => {
    if (onProfilePhotoChange) onProfilePhotoChange(null);
    if (addToast) addToast({ icon: "camera", title: t("photoRemoved") });
  };
  const handleSaveAndClose = () => { onSave(f); onClose(); };
  const handleCancel = () => { onSettingsChange(settingsSnapshot.current); onClose(); };
  const lbl = () => ({ display:"block", fontSize:11, fontWeight:800, letterSpacing:1.5, color:C.textSec, fontFamily:FONT_DISPLAY, marginBottom:6 });
  const sectionHdr = (label, icon) => (
    <div style={{ display:"flex", alignItems:"center", gap:7, margin:"20px 0 10px", paddingBottom:6, borderBottom:`1px solid ${C.borderLight}` }}>
      <Ic n={icon} s={14} c={C.accent}/>
      <span style={{ fontWeight:800, fontSize:13, letterSpacing:1.5, color:C.brown, fontFamily:FONT_DISPLAY }}>{label}</span>
    </div>
  );
  return (
    <div style={{ position:"absolute", inset:0, zIndex:900, background:C.bg, display:"flex", flexDirection:"column", overflow:"hidden" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"13px 18px", borderBottom:`1px solid ${C.border}`, flexShrink:0, background:C.bg, zIndex:10 }}>
        <span style={{ fontWeight:800, fontSize:15, letterSpacing:2, color:C.brown, fontFamily:FONT_DISPLAY }}>{t("myProfile")}</span>
        <button onClick={handleSaveAndClose} style={{ background:C.surfaceAlt, border:`1px solid ${C.border}`, cursor:"pointer", color:C.textSec, padding:5, borderRadius:7, display:"flex" }}><Ic n="x" s={14}/></button>
      </div>
      {/* Scrollable content */}
      <div style={{ flex:1, overflowY:"auto", padding:18 }}>

      {/* ── Profile photo ── */}
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", marginBottom:20 }}>
        <div style={{ position:"relative", cursor:"pointer" }} onClick={()=>photoInputRef.current?.click()}>
          <ProfileAvatar profilePhoto={profilePhoto} fbUser={fbUser} nickname={f.nickname || profile.nickname}
            size={80} C={C} />
          <div style={{ position:"absolute", bottom:0, right:0, width:24, height:24, borderRadius:"50%",
            background:C.accent, display:"flex", alignItems:"center", justifyContent:"center",
            border:`2px solid ${C.bg}` }}>
            <Ic n="camera" s={12} c="#fff"/>
          </div>
        </div>
        {profilePhoto && (
          <button onClick={handleRemovePhoto}
            style={{ background:"none", border:"none", cursor:"pointer", marginTop:8,
              fontSize:11, fontWeight:700, fontFamily:FONT_DISPLAY, letterSpacing:1,
              color:C.accent, textTransform:"uppercase" }}>
            {t("removeProfilePhoto")}
          </button>
        )}
        <input ref={photoInputRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleProfilePhoto}/>
      </div>

      {sectionHdr(t("identity"),"user")}
      <div style={{ marginBottom:14 }}>
        <label style={lbl()}>{t("nickname")}</label>
        <input value={f.nickname} onChange={e=>set("nickname")(e.target.value)} placeholder={t("nicknamePlaceholder")}
          style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 12px", color:C.text, fontSize:14, outline:"none", boxSizing:"border-box", fontFamily:FONT_BODY }}/>
        {f.nickname&&<div style={{ fontSize:11, color:C.textMuted, marginTop:4 }}>{t("headerWillShow")} <span style={{color:C.accent}}>of {f.nickname}</span></div>}
      </div>
      {/* Age + Breaking start date side by side */}
      <div style={{ display:"flex", gap:12, marginBottom:14 }}>
        <div style={{ flex:1 }}>
          <label style={lbl()}>{t("age")}</label>
          <input type="number" value={f.age} onChange={e=>set("age")(e.target.value)} placeholder="—"
            style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 12px", color:C.text, fontSize:14, outline:"none", boxSizing:"border-box", fontFamily:FONT_BODY }}/>
        </div>
        <div style={{ flex:1 }}>
          <label style={lbl()}>{t("whenStartBreaking")}</label>
          <div style={{ display:"flex", gap:4 }}>
            <input type="number" value={f.startYear} onChange={e=>set("startYear")(e.target.value)}
              placeholder="YYYY" min="1970" max={new Date().getFullYear()}
              style={{ flex:1, minWidth:0, background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 6px", color:C.text, fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:FONT_BODY, textAlign:"center" }}/>
            <input type="number" value={f.startMonth} onChange={e=>set("startMonth")(e.target.value)}
              placeholder="MM" min="1" max="12"
              style={{ width:42, background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 4px", color:C.text, fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:FONT_BODY, textAlign:"center" }}/>
            <input type="number" value={f.startDay} onChange={e=>set("startDay")(e.target.value)}
              placeholder="DD" min="1" max="31"
              style={{ width:42, background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 4px", color:C.text, fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:FONT_BODY, textAlign:"center" }}/>
          </div>
        </div>
      </div>

      {/* MyStance link — navigates to REFLECT > STANCE */}
      <button onClick={() => { if (onNavigateToStance) { onSave(f); onNavigateToStance(); } }}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
          padding: "14px 16px", cursor: "pointer", margin: "12px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Ic n="barChart" s={16} c={C.accent} />
          <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 13, color: C.text, letterSpacing: 0.5 }}>
            {t("stance")}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 11, color: C.accent, letterSpacing: 0.5 }}>
            {t("viewFullStance")}
          </span>
          <Ic n="chevR" s={14} c={C.accent} />
        </div>
      </button>

      {sectionHdr(t("breakingGoals"),"target")}
      <div style={{ marginBottom:14 }}>
        <textarea value={f.goals} onChange={e=>set("goals")(e.target.value)} rows={3}
          placeholder={t("goalsPlaceholder")}
          style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 12px", color:C.text, fontSize:14, outline:"none", boxSizing:"border-box", fontFamily:FONT_DISPLAY, letterSpacing:0.3, resize:"vertical" }}/>
      </div>
      {sectionHdr(t("whyBreaking"),"bulb")}
      <div style={{ marginBottom:6 }}>
        <div style={{ position:"relative" }}>
          <textarea value={f.why} onChange={e=>set("why")(e.target.value)} rows={6}
            style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 12px", color:C.text, fontSize:14, outline:"none", boxSizing:"border-box", fontFamily:FONT_DISPLAY, letterSpacing:0.3, resize:"vertical", minHeight:"20vh" }}/>
          {!f.why&&<div style={{ position:"absolute", top:10, left:13, fontSize:13, color:C.textMuted, pointerEvents:"none", fontStyle:"italic", fontFamily:FONT_DISPLAY }}>{t("rememberWhy")}</div>}
        </div>
      </div>

      {/* My Notes card */}
      <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`,
        padding: 16, margin: "12px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <Ic n="mapPin" s={14} c={C.textMuted}/>
          <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 14, color: C.text }}>
            {t("myNotes")}
          </span>
        </div>
        {showNoteAdd ? (
          <div>
            <textarea value={noteText} onChange={e => setNoteText(e.target.value.slice(0, 280))}
              placeholder={t("writeYourselfANote")} rows={2} autoFocus
              style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`,
                borderRadius: 10, padding: 12, fontSize: 14, fontFamily: FONT_BODY,
                color: C.text, resize: "none", outline: "none", boxSizing: "border-box",
                maxHeight: 120, overflow: "auto" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
              <span style={{ fontSize: 10, color: C.textMuted }}>{noteText.length}/280</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { setShowNoteAdd(false); setNoteText(""); }}
                  style={{ background: "none", border: "none", color: C.textMuted, fontSize: 12,
                    fontFamily: FONT_DISPLAY, fontWeight: 700, cursor: "pointer", padding: "6px 10px" }}>
                  {t("cancel") || "CANCEL"}
                </button>
                <button onClick={handleNoteSave} disabled={!noteText.trim()}
                  style={{ background: noteText.trim() ? C.accent : C.border, color: "#fff",
                    border: "none", fontSize: 12, fontFamily: FONT_DISPLAY, fontWeight: 700,
                    borderRadius: 8, padding: "6px 14px", cursor: noteText.trim() ? "pointer" : "default",
                    opacity: noteText.trim() ? 1 : 0.5 }}>
                  {t("save") || "SAVE"}
                </button>
              </div>
            </div>
          </div>
        ) : noteItems.length === 0 ? (
          <div>
            <div style={{ fontSize: 12, color: C.textMuted, fontStyle: "italic", marginBottom: 10 }}>
              {t("stickyNoteHint")}
            </div>
            <button onClick={() => setShowNoteAdd(true)}
              style={{ background: C.surfaceHigh, color: C.textSec, border: "none",
                fontSize: 11, fontFamily: FONT_DISPLAY, fontWeight: 700, borderRadius: 8,
                padding: "6px 14px", cursor: "pointer", letterSpacing: 0.5 }}>
              + {t("addNote")}
            </button>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 10 }}>
              {noteItems.length} {t("xNotes")}
            </div>
            <button onClick={onOpenManageReminders}
              style={{ background: C.surfaceHigh, color: C.textSec, border: "none",
                fontSize: 11, fontFamily: FONT_DISPLAY, fontWeight: 700, borderRadius: 8,
                padding: "6px 14px", cursor: "pointer", letterSpacing: 0.5 }}>
              {t("manageNotes")}
            </button>
          </div>
        )}
      </div>

      {/* ── Settings ── */}
      {sectionHdr(t("settingsLabel") || "SETTINGS", "cog")}
      <button onClick={() => setShowSettingsSection(s => !s)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10,
          padding: "10px 14px", cursor: "pointer", marginBottom: 4 }}>
        <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 12, color: C.text, letterSpacing: 0.5 }}>
          {showSettingsSection ? "Hide settings" : "Show settings"}
        </span>
        <Ic n={showSettingsSection ? "chevD" : "chevR"} s={14} c={C.textMuted} />
      </button>
      {showSettingsSection && (
        <SettingsModal inline settings={settings} onSave={onSettingsChange} onClearMoves={onClearMoves} onRestoreRounds={onRestoreRounds} onRestartTour={onRestartTour} zoom={zoom} onZoomChange={onZoomChange} customAttrs={customAttrs} setCustomAttrs={setCustomAttrs} onOpenManual={onOpenManual} />
      )}

      {/* ── Legal ── */}
      {sectionHdr(t("legalLabel") || "LEGAL", "scroll")}
      {["privacy","terms","disclaimers"].map(pg => (
        <button key={pg} onClick={() => setLegalPage(pg)}
          style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between",
            background:C.surfaceAlt, border:`1px solid ${C.border}`, borderRadius:10,
            padding:"10px 14px", cursor:"pointer", marginBottom:4 }}>
          <span style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:12, color:C.text, letterSpacing:0.5 }}>
            {t(pg === "privacy" ? "privacyPolicy" : pg === "terms" ? "termsOfService" : "disclaimers")}
          </span>
          <Ic n="chevR" s={14} c={C.textMuted} />
        </button>
      ))}

      {/* ── Feedback ── */}
      {sectionHdr(t("feedbackLabel") || "FEEDBACK", "edit")}
      <button onClick={() => setShowFeedbackSection(s => !s)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10,
          padding: "10px 14px", cursor: "pointer", marginBottom: 4 }}>
        <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 12, color: C.text, letterSpacing: 0.5 }}>
          {showFeedbackSection ? "Hide feedback" : "Show feedback form"}
        </span>
        <Ic n={showFeedbackSection ? "chevD" : "chevR"} s={14} c={C.textMuted} />
      </button>
      {showFeedbackSection && <FeedbackModal inline />}

      {/* ── Backup ── */}
      {sectionHdr("BACKUP", "download")}
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <button onClick={downloadBackup}
          style={{ flex: 1, padding: "10px 12px", background: C.surfaceAlt, border: `1px solid ${C.border}`,
            borderRadius: 10, cursor: "pointer", fontFamily: FONT_DISPLAY, fontWeight: 700,
            fontSize: 12, color: C.text, letterSpacing: 0.5 }}>
          {t("saveBackup")}
        </button>
        <button onClick={() => fileInputRef.current?.click()}
          style={{ flex: 1, padding: "10px 12px", background: C.surfaceAlt, border: `1px solid ${C.border}`,
            borderRadius: 10, cursor: "pointer", fontFamily: FONT_DISPLAY, fontWeight: 700,
            fontSize: 12, color: C.text, letterSpacing: 0.5 }}>
          {t("restoreBackup")}
        </button>
        <input ref={fileInputRef} type="file" accept=".json" style={{ display: "none" }}
          onChange={e => { if (e.target.files[0]) restoreBackup(e.target.files[0]); }} />
      </div>

      {/* ── Sign Out ── */}
      <div style={{ marginTop:24, paddingTop:16, borderTop:`1px solid ${C.borderLight}` }}>
        <button onClick={()=>{ if(window.__MB_AUTH__) window.__MB_AUTH__.signOut(); onClose(); }}
          style={{ width:"100%", padding:"11px", background:"none", border:`1px solid ${C.accent}`,
            borderRadius:8, color:C.accent, fontSize:13, fontWeight:700, cursor:"pointer",
            fontFamily:FONT_DISPLAY, letterSpacing:1.5 }}>
          {t("signOut")}
        </button>
      </div>
      <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:12, paddingBottom:16 }}>
        <Btn variant="secondary" onClick={handleCancel}>{t("cancel")}</Btn>
        <Btn onClick={handleSaveAndClose}>{t("saveProfileBtn")}</Btn>
      </div>
      </div>
      {legalPage && <LegalModal page={legalPage} onClose={() => setLegalPage(null)} />}
    </div>
  );
};
