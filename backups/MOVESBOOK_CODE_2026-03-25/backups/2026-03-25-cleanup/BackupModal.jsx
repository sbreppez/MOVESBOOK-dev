import React, { useState, useRef } from "react";
import { C } from "../../constants/colors";
import { FONT_DISPLAY, FONT_BODY } from "../../constants/fonts";
import { Ic } from "../shared/Ic";
import { useT } from "../../hooks/useTranslation";

const BACKUP_KEYS = {
  moves: "mb_moves", sets: "mb_sets", rounds: "mb_rounds",
  ideas: "mb_ideas", profile: "mb_profile", settings: "mb_settings",
  habits: "mb_habits", templates: "mb_templates",
  categories: "mb_cats", catColors: "mb_cat_colors",
};

export const downloadBackup = () => {
  const data = { _format: "movesbook-backup-v1", _exportedAt: new Date().toISOString() };
  Object.entries(BACKUP_KEYS).forEach(([k, lsKey]) => {
    try { data[k] = JSON.parse(localStorage.getItem(lsKey) || (lsKey.endsWith("colors") || lsKey === "mb_profile" || lsKey === "mb_settings" ? "{}" : "[]")); }
    catch { data[k] = lsKey.endsWith("colors") || lsKey === "mb_profile" || lsKey === "mb_settings" ? {} : []; }
  });
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `MOVESBOOK_DATA_${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const restoreBackup = (data) => {
  Object.entries(BACKUP_KEYS).forEach(([k, lsKey]) => {
    if (data[k] !== undefined) {
      localStorage.setItem(lsKey, JSON.stringify(data[k]));
    }
  });
  window.location.reload();
};

export const BackupModal = ({ onClose }) => {
  const t = useT();
  const fileRef = useRef(null);
  const [restoreData, setRestoreData] = useState(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (parsed._format !== "movesbook-backup-v1") {
          alert(t("invalidBackupFile"));
          return;
        }
        setRestoreData(parsed);
      } catch {
        alert(t("invalidBackupFile"));
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const fmtDate = (iso) => {
    try { return new Date(iso).toLocaleDateString(undefined, { year:"numeric", month:"long", day:"numeric", hour:"2-digit", minute:"2-digit" }); }
    catch { return iso; }
  };

  const rowStyle = (isLast) => ({
    display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
    cursor: "pointer", background: "none", border: "none", width: "100%",
    borderBottom: isLast ? "none" : `1px solid ${C.border}`, textAlign: "left",
    transition: "background 0.12s",
  });

  // Restore confirmation overlay
  if (restoreData) {
    return (
      <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)",
        zIndex:1100, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
        <div onClick={e=>e.stopPropagation()} style={{ background:C.bg, border:`1px solid ${C.border}`,
          borderRadius:14, width:"100%", maxWidth:340, padding:20, boxShadow:"0 24px 60px rgba(0,0,0,0.4)" }}>
          <div style={{ fontWeight:900, fontSize:14, letterSpacing:1.5, fontFamily:FONT_DISPLAY,
            color:C.brown, marginBottom:8 }}>{t("restoreConfirmTitle")}</div>
          <p style={{ fontSize:13, color:C.textSec, marginBottom:16, lineHeight:1.6 }}>
            {t("restoreConfirmBody")} <strong style={{ color:C.text }}>{fmtDate(restoreData._exportedAt)}</strong>{t("restoreConfirmBody2")}
          </p>
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
            <button onClick={()=>setRestoreData(null)}
              style={{ padding:"8px 16px", borderRadius:8, border:`1px solid ${C.border}`,
                background:"none", color:C.textSec, fontSize:13, cursor:"pointer", fontFamily:FONT_BODY }}>
              {t("cancel")}
            </button>
            <button onClick={()=>restoreBackup(restoreData)}
              style={{ padding:"8px 16px", borderRadius:8, border:"none",
                background:C.accent, color:C.bg, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:FONT_BODY }}>
              {t("restore")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)",
      zIndex:1100, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:C.bg, border:`1px solid ${C.border}`,
        borderRadius:14, width:"100%", maxWidth:340, overflow:"hidden",
        boxShadow:"0 24px 60px rgba(0,0,0,0.4)" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"16px 18px 12px", borderBottom:`1px solid ${C.border}` }}>
          <div>
            <div style={{ fontWeight:900, fontSize:14, letterSpacing:2, fontFamily:FONT_DISPLAY,
              color:C.brown }}>{t("backupData")}</div>
            <div style={{ fontSize:12, color:C.textSec, marginTop:2 }}>{t("backupSubtitle")}</div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", padding:4, display:"flex" }}>
            <Ic n="x" s={16} c={C.textMuted}/>
          </button>
        </div>

        {/* Save Backup */}
        <button onClick={()=>{ downloadBackup(); onClose(); }} style={rowStyle(false)}
          onMouseEnter={e=>e.currentTarget.style.background=C.surfaceAlt}
          onMouseLeave={e=>e.currentTarget.style.background="none"}>
          <div style={{ width:36, height:36, borderRadius:8, background:`${C.green}18`,
            display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <Ic n="download" s={18} c={C.green}/>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:700, color:C.text, fontFamily:FONT_DISPLAY, letterSpacing:0.3 }}>
              {t("saveBackup")}
            </div>
            <div style={{ fontSize:11, color:C.textMuted, marginTop:1 }}>
              {t("saveBackupDesc")}
            </div>
          </div>
        </button>

        {/* Restore Backup */}
        <button onClick={()=>fileRef.current?.click()} style={rowStyle(true)}
          onMouseEnter={e=>e.currentTarget.style.background=C.surfaceAlt}
          onMouseLeave={e=>e.currentTarget.style.background="none"}>
          <div style={{ width:36, height:36, borderRadius:8, background:`${C.blue}18`,
            display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <Ic n="upload" s={18} c={C.blue}/>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:700, color:C.text, fontFamily:FONT_DISPLAY, letterSpacing:0.3 }}>
              {t("restoreBackup")}
            </div>
            <div style={{ fontSize:11, color:C.textMuted, marginTop:1 }}>
              {t("restoreBackupDesc")}
            </div>
          </div>
        </button>
        <input ref={fileRef} type="file" accept=".json" style={{ display:"none" }} onChange={handleFile}/>
      </div>
    </div>
  );
};
