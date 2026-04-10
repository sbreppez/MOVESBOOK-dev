import React, { useState, useRef } from "react";
import { C } from "../../constants/colors";
import { FONT_DISPLAY, FONT_BODY } from "../../constants/fonts";
import { Ic } from "../shared/Ic";
import { useT } from "../../hooks/useTranslation";
import { downloadBackup, restoreBackup } from "./BackupModal";
import { AttributeModal } from "./AttributeModal";

export const SettingsModal = ({ onClose, settings, onSave, onClearMoves, onRestoreRounds, onRestartTour, zoom=1, onZoomChange, customAttrs=[], setCustomAttrs, inline, onOpenManual }) => {
  const t = useT();
  const [s,setS]=useState({
    theme:"light", defaultTab:"home", showMastery:true, decaySensitivity:"normal",
    compactCards:false, sortMoves:"custom", fontSize:"medium",
    showMoveCount:true, confirmDelete:true, practiceReminders:false,
    reminderTime:"18:00", showDeadlineIndicator:true,
    categorySort:"manual", defaultView:"list", language:"en", linkOnCard:"inside", targetAutoLink:false,
    ...settings
  });
  const origSettings = useRef(settings);
  const [confirmClear,setConfirmClear]=useState(false);
  const [confirmRestoreRounds,setConfirmRestoreRounds]=useState(false);
  const [confirmRestore,setConfirmRestore]=useState(null);
  const [editAttr, setEditAttr] = useState(null);
  const [showAddAttr, setShowAddAttr] = useState(false);
  const [confirmDeleteAttr, setConfirmDeleteAttr] = useState(null);
  const restoreFileRef=useRef(null);
  const set=k=>v=>{
    setS(p=>{
      const next={...p,[k]:v};
      onSave(next);
      return next;
    });
  };

  const isDark = s.theme==="dark";
  const panelBg  = isDark ? "#121212" : C.bg;
  const panelSrf = isDark ? "#1e1e1e" : C.surface;
  const panelTxt = isDark ? "#ffffff" : C.text;
  const panelMut = isDark ? "#7a7a7a" : C.textMuted;
  const panelBrd = isDark ? "#3a3a3a" : C.border;

  const row=(label,desc,child,noBorder=false)=>(
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12,
      padding:"13px 0", borderBottom:noBorder?"none":`1px solid ${panelBrd}` }}>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:700, color:panelTxt, fontFamily:FONT_DISPLAY, letterSpacing:0.3 }}>{label}</div>
        {desc&&<div style={{ fontSize:11, color:panelMut, marginTop:2, lineHeight:1.4 }}>{desc}</div>}
      </div>
      <div style={{ flexShrink:0 }}>{child}</div>
    </div>
  );

  const toggle=(key,accentOverride)=>{ const accent=accentOverride||C.accent; return (
    <button onClick={()=>set(key)(!s[key])} aria-label={key}
      style={{ width:46, height:26, borderRadius:13, background:s[key]?accent:panelBrd, border:"none", cursor:"pointer",
        position:"relative", transition:"background 0.2s", flexShrink:0 }}>
      <div style={{ position:"absolute", top:4, left:s[key]?24:4, width:18, height:18, borderRadius:"50%",
        background:"#fff", transition:"left 0.2s", boxShadow:"0 1px 4px rgba(0,0,0,0.3)" }}/>
    </button>
  );};

  const segmented=(key,options)=>{
    const accent=C.accent;
    return (
      <div style={{ display:"flex", background:panelSrf, borderRadius:8, border:`1px solid ${panelBrd}`, overflow:"hidden" }}>
        {options.map((o,i)=>{
          const active=s[key]===(o.value||o);
          return <button key={o.value||o} onClick={()=>set(key)(o.value||o)}
            style={{ padding:"6px 12px", border:"none", borderLeft:i>0?`1px solid ${panelBrd}`:"none",
              background:active?accent:panelSrf, color:active?"#fff":panelMut,
              cursor:"pointer", fontSize:11, fontWeight:700, fontFamily:FONT_DISPLAY, transition:"all 0.15s" }}>
            {o.icon&&<span style={{marginRight:4}}>{o.icon}</span>}{o.label||o}
          </button>;
        })}
      </div>
    );
  };

  const sectionHdr=(label)=>(
    <div style={{ display:"flex", alignItems:"center", gap:7, margin:"22px 0 6px",
      paddingBottom:7, borderBottom:`2px solid ${panelBrd}` }}>
      <span style={{ fontSize:11, fontWeight:800, letterSpacing:2.5, color:panelMut, fontFamily:FONT_DISPLAY, textTransform:"uppercase" }}>{label}</span>
    </div>
  );

  const accent=C.accent;

  return (
    <div style={ inline ? { color:panelTxt } : { position:"absolute", inset:0, zIndex:1000,
      background:panelBg, display:"flex", flexDirection:"column", overflow:"hidden", color:panelTxt }}>

        {/* Sticky header — hidden in inline mode */}
        {!inline && <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"13px 18px", borderBottom:`1px solid ${panelBrd}`, flexShrink:0,
          background:panelBg, zIndex:10 }}>
          <span style={{ fontWeight:800, fontSize:16, letterSpacing:2, color:panelTxt, fontFamily:FONT_DISPLAY }}>{"\u2699\uFE0F"} SETTINGS</span>
          <button onClick={onClose}
            style={{ background:panelSrf, border:`1px solid ${panelBrd}`, cursor:"pointer",
              color:panelMut, padding:5, borderRadius:7, display:"flex" }}>
            <Ic n="x" s={14} c={panelMut}/>
          </button>
        </div>}

        <div style={ inline ? { zoom:zoom, WebkitTextSizeAdjust:"none" } : { flex:1, overflow:"auto", zoom:zoom, WebkitTextSizeAdjust:"none" }}>
        <div style={{ padding:18 }}>

          {/* ── APPEARANCE ──────────────────────────────── */}
          {sectionHdr(t("appearance"))}

          {row(t("theme"), t("themeDesc"),
            segmented("theme",[{value:"light",label:t("light")},{value:"dark",label:t("dark")}])
          )}

          {row(t("textSize"), t("textSizeDesc"),
            segmented("fontSize",[{value:"small",label:"S"},{value:"medium",label:"M"},{value:"large",label:"L"}])
          )}

          {row(t("defaultView"), t("defaultViewDesc"),
            segmented("defaultView",[{value:"list",icon:"☰",label:t("list")},{value:"tiles",icon:"⊞",label:t("tiles")},{value:"tree",icon:"",label:t("treeView")}])
          )}

          {row(t("displayZoom"), t("displayZoomDesc"),
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <button onClick={()=>onZoomChange&&onZoomChange(Math.max(0.6,parseFloat((zoom-0.1).toFixed(1))))}
                disabled={zoom<=0.6}
                style={{ width:28, height:28, borderRadius:7, background:C.surface, border:`1px solid ${C.border}`,
                  cursor:zoom<=0.6?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                  fontWeight:800, fontSize:16, color:C.brown, opacity:zoom<=0.6?0.4:1 }}>−</button>
              <div style={{ minWidth:42, textAlign:"center", fontSize:13, fontWeight:700, color:C.text, fontFamily:FONT_BODY }}>
                {Math.round(zoom*100)}%
              </div>
              <button onClick={()=>onZoomChange&&onZoomChange(Math.min(1.4,parseFloat((zoom+0.1).toFixed(1))))}
                disabled={zoom>=1.4}
                style={{ width:28, height:28, borderRadius:7, background:C.surface, border:`1px solid ${C.border}`,
                  cursor:zoom>=1.4?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                  fontWeight:800, fontSize:16, color:C.brown, opacity:zoom>=1.4?0.4:1 }}>+</button>
              <button onClick={()=>onZoomChange&&onZoomChange(1)}
                style={{ fontSize:11, color:C.textMuted, background:"none", border:"none", cursor:"pointer",
                  fontFamily:FONT_BODY, padding:"2px 4px", textDecoration:"underline" }}>{t("resetZoom")}</button>
            </div>
          )}

          {row(t("language"), t("languageDesc"),
            <select value={s.language||"en"} onChange={e=>set("language")(e.target.value)}
              style={{ background:panelSrf, border:`1px solid ${panelBrd}`, borderRadius:7,
                padding:"7px 10px", color:panelTxt, fontSize:14, fontFamily:FONT_DISPLAY,
                fontWeight:700, outline:"none" }}>
              <option value="en">English</option>
              <option value="it">Italiano</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="pt">Português</option>
              <option value="de">Deutsch</option>
              <option value="ja">日本語</option>
              <option value="zh">简体中文</option>
              <option value="ru">Русский</option>
              <option value="ko">한국어 (Korean)</option>
              <option value="th">ไทย (Thai)</option>
              <option value="vi">Tiếng Việt (Vietnamese)</option>
            </select>
          )}

          {/* ── BEHAVIOUR ───────────────────────────────── */}
          {sectionHdr(t("behaviour"))}

          {row(t("showMastery"),
            t("showMasteryDesc"),
            toggle("showMastery")
          )}

          {row(t("decaySensitivity"),
            t("decaySensitivityDesc"),
            segmented("decaySensitivity",[
              {value:"off",label:t("decayOff")},
              {value:"gentle",label:t("decayGentle")},
              {value:"normal",label:t("decayNormal")},
              {value:"aggressive",label:t("decayAggressive")},
            ])
          )}

          {row(t("showMoveCount"),
            t("showMoveCountDesc"),
            toggle("showMoveCount")
          )}

          {row(t("showDeadlineIndicator"),
            t("showDeadlineIndicatorDesc"),
            toggle("showDeadlineIndicator")
          )}

          {row(t("linkOnCard"),
            t("linkOnCardDesc"),
            <select value={s.linkOnCard||"inside"} onChange={e=>set("linkOnCard")(e.target.value)}
              style={{ background:panelSrf, border:`1px solid ${panelBrd}`, borderRadius:7,
                padding:"7px 10px", color:panelTxt, fontSize:14, fontFamily:FONT_DISPLAY,
                fontWeight:700, outline:"none" }}>
              <option value="inside">{t("linkOnCardInside")}</option>
              <option value="both">{t("linkOnCardBoth")}</option>
            </select>
          )}

          {row(t("trackMovesInSparring"),
            t("trackMovesInSparringDesc"),
            toggle("trackMovesInSparring")
          )}

          {row(t("showSectionDescriptions"),
            t("showSectionDescriptionsSub"),
            toggle("showSectionDescriptions")
          )}

          {row(t("sparringGapThreshold"),
            t("sparringGapThresholdDesc"),
            <input type="number" min={1} max={90} value={s.sparringGapThreshold||14}
              onChange={e => { const v = Math.max(1, Math.min(90, +e.target.value || 14)); set("sparringGapThreshold")(v); }}
              style={{ width:60, background:isDark?"#282828":"#f0f0f0", border:`1px solid ${panelBrd}`, borderRadius:8,
                padding:"6px 10px", color:panelTxt, fontSize:13, fontFamily:FONT_DISPLAY,
                fontWeight:700, outline:"none", textAlign:"center", WebkitAppearance:"none", MozAppearance:"textfield",
                colorScheme:isDark?"dark":"light", boxSizing:"border-box" }}/>
          )}


          {/* ── NAVIGATION ──────────────────────────────── */}
          {sectionHdr(t("navigation"))}

          {row(t("defaultTab"), t("defaultTabDesc"),
            <select value={s.defaultTab} onChange={e=>set("defaultTab")(e.target.value)}
              style={{ background:panelSrf, border:`1px solid ${panelBrd}`, borderRadius:7,
                padding:"7px 10px", color:panelTxt, fontSize:14, fontFamily:FONT_DISPLAY,
                fontWeight:700, outline:"none" }}>
              <option value="home">{t("home")}</option>
              <option value="moves">{t("vocab")}</option>
              <option value="battle">{t("battle")}</option>
              <option value="reflect">{t("reflect")}</option>
            </select>
          )}

          {row(t("sortMoves"), t("sortMovesDesc"),
            <select value={s.sortMoves} onChange={e=>set("sortMoves")(e.target.value)}
              style={{ background:panelSrf, border:`1px solid ${panelBrd}`, borderRadius:7,
                padding:"7px 10px", color:panelTxt, fontSize:14, fontFamily:FONT_DISPLAY,
                fontWeight:700, outline:"none" }}>
              <option value="custom">{t("customSort")}</option>
              <option value="date">{t("dateAdded")}</option>
              <option value="name">{t("alphabetical")}</option>
              <option value="mastery">{t("masteryPct")}</option>
            </select>
          )}

          {row(t("sortCategories"), t("sortCatsDesc"),
            <select value={s.categorySort} onChange={e=>set("categorySort")(e.target.value)}
              style={{ background:panelSrf, border:`1px solid ${panelBrd}`, borderRadius:7,
                padding:"7px 10px", color:panelTxt, fontSize:14, fontFamily:FONT_DISPLAY,
                fontWeight:700, outline:"none" }}>
              <option value="manual">{t("customSort")}</option>
              <option value="name">{t("alphabetical")}</option>
              <option value="progress">{t("mostProgress")}</option>
            </select>
          )}

          {/* ── CUSTOM ATTRIBUTES ──────────────────────── */}
          {sectionHdr(t("customAttributes"))}

          {customAttrs.length===0 ? (
            <div style={{ fontSize:11, color:panelMut, fontStyle:"italic", padding:"8px 0" }}>
              {t("noAttributesDefined")}
            </div>
          ) : customAttrs.map(attr=>(
            <div key={attr.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10,
              padding:"10px 0", borderBottom:`1px solid ${panelBrd}` }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:700, color:panelTxt, fontFamily:FONT_DISPLAY, letterSpacing:0.3, textTransform:"capitalize" }}>{attr.name}</div>
                <div style={{ fontSize:11, color:panelMut, marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {attr.values.join(" · ")}
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:4, flexShrink:0 }}>
                <span style={{ fontSize:10, fontWeight:700, color:panelMut, fontFamily:FONT_DISPLAY,
                  background:panelSrf, border:`1px solid ${panelBrd}`, borderRadius:6, padding:"2px 6px" }}>
                  {attr.multi ? t("multiSelect") : t("singleSelect")}
                </span>
                <button onClick={()=>setEditAttr(attr)}
                  style={{ background:"none", border:"none", cursor:"pointer", padding:4, display:"flex" }}>
                  <Ic n="edit" s={13} c={panelMut}/>
                </button>
                <button onClick={()=>setConfirmDeleteAttr(attr)}
                  style={{ background:"none", border:"none", cursor:"pointer", padding:4, display:"flex" }}>
                  <Ic n="trash" s={13} c={C.accent}/>
                </button>
              </div>
            </div>
          ))}

          <button onClick={()=>setShowAddAttr(true)}
            style={{ width:"100%", padding:"10px", borderRadius:8, marginTop:8,
              border:`1px dashed ${panelBrd}`, background:"none", color:panelMut, cursor:"pointer",
              fontSize:11, fontFamily:FONT_DISPLAY, fontWeight:700, letterSpacing:1 }}>
            + {t("addAttribute")}
          </button>

          {/* ── DATA ────────────────────────────────────── */}
          {sectionHdr(t("dataPrivacy"))}

          {row(t("saveBackup"),
            t("saveBackupSettingsDesc"),
            <button onClick={()=>{ downloadBackup(); }}
              style={{ padding:"7px 14px", borderRadius:7, border:`1px solid ${panelBrd}`,
                background:panelSrf, color:panelTxt, cursor:"pointer", fontSize:11,
                fontWeight:700, fontFamily:FONT_DISPLAY, whiteSpace:"nowrap" }}>
              {"⬇ "+t("saveBackupBtn")}
            </button>
          )}

          {row(t("restoreBackup"),
            t("restoreBackupSettingsDesc"),
            <label style={{ padding:"7px 14px", borderRadius:7, border:`1px solid ${panelBrd}`,
              background:panelSrf, color:panelTxt, cursor:"pointer", fontSize:11,
              fontWeight:700, fontFamily:FONT_DISPLAY, whiteSpace:"nowrap", display:"inline-block" }}>
              {"⬆ "+t("restoreBackupBtn")}
              <input ref={restoreFileRef} type="file" accept=".json" style={{ display:"none" }} onChange={e=>{
                const file=e.target.files?.[0]; if(!file) return;
                const reader=new FileReader();
                reader.onload=ev=>{
                  try {
                    const parsed=JSON.parse(ev.target.result);
                    if(parsed._format!=="movesbook-backup-v1"){ alert(t("invalidBackupFile")); return; }
                    setConfirmRestore(parsed);
                  } catch{ alert(t("invalidBackupFile")); }
                };
                reader.readAsText(file);
                e.target.value="";
              }}/>
            </label>
          )}

          {row(t("clearAllMoves"),
            t("clearAllMovesDesc"),
            confirmClear ? (
              <div style={{ display:"flex", gap:6 }}>
                <button onClick={()=>setConfirmClear(false)}
                  style={{ padding:"6px 10px", borderRadius:7, border:`1px solid ${panelBrd}`,
                    background:panelSrf, color:panelMut, cursor:"pointer", fontSize:11,
                    fontWeight:700, fontFamily:FONT_DISPLAY }}>{t("cancel")}</button>
                <button onClick={()=>{ onClearMoves(); setConfirmClear(false); onClose(); }}
                  style={{ padding:"6px 10px", borderRadius:7, border:`1px solid ${accent}`,
                    background:`${accent}22`, color:accent, cursor:"pointer", fontSize:11,
                    fontWeight:700, fontFamily:FONT_DISPLAY }}>{t("confirm")}</button>
              </div>
            ) : (
              <button onClick={()=>setConfirmClear(true)}
                style={{ padding:"7px 14px", borderRadius:7, border:`1px solid ${accent}44`,
                  background:`${accent}10`, color:accent, cursor:"pointer", fontSize:11,
                  fontWeight:700, fontFamily:FONT_DISPLAY, whiteSpace:"nowrap" }}>
                {t("clearBtn")}
              </button>
            )
          , true)}

          {row(t("restoreDefaultRounds"),
            t("restoreDefaultRoundsDesc"),
            confirmRestoreRounds ? (
              <div style={{ display:"flex", gap:6 }}>
                <button onClick={()=>setConfirmRestoreRounds(false)}
                  style={{ padding:"6px 10px", borderRadius:7, border:`1px solid ${panelBrd}`,
                    background:panelSrf, color:panelMut, cursor:"pointer", fontSize:11,
                    fontWeight:700, fontFamily:FONT_DISPLAY }}>{t("cancel")}</button>
                <button onClick={()=>{ onRestoreRounds(); setConfirmRestoreRounds(false); onClose(); }}
                  style={{ padding:"6px 10px", borderRadius:7, border:`1px solid ${accent}`,
                    background:`${accent}22`, color:accent, cursor:"pointer", fontSize:11,
                    fontWeight:700, fontFamily:FONT_DISPLAY }}>{t("confirm")}</button>
              </div>
            ) : (
              <button onClick={()=>setConfirmRestoreRounds(true)}
                style={{ padding:"7px 14px", borderRadius:7, border:`1px solid ${panelBrd}`,
                  background:panelSrf, color:panelTxt, cursor:"pointer", fontSize:11,
                  fontWeight:700, fontFamily:FONT_DISPLAY, whiteSpace:"nowrap" }}>
                {"↺ "+t("restoreBtn")}
              </button>
            )
          , true)}

          {/* ── ABOUT ───────────────────────────────────── */}
          {sectionHdr(t("aboutSection"))}
          <div style={{ padding:"12px 0", borderBottom:`1px solid ${panelBrd}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
              <span style={{ fontSize:13, color:panelMut }}>{t("version")}</span>
              <span style={{ fontSize:13, color:panelTxt, fontWeight:700 }}>1.0.0-beta</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
              <span style={{ fontSize:13, color:panelMut }}>{t("buildLabel")}</span>
              <span style={{ fontSize:13, color:panelTxt, fontWeight:700 }}>MovesBook Prototype</span>
            </div>
            <div style={{ fontSize:13, color:panelMut, marginTop:8, lineHeight:1.6, fontStyle:"italic" }}>
              {t("builtForBreakers")}
            </div>
          </div>

          {/* User Manual + Restart */}
          <div style={{ marginTop:24, paddingTop:16, borderTop:`1px solid ${C.borderLight}`, display:"flex", flexDirection:"column", gap:8 }}>
        {onOpenManual && <button onClick={onOpenManual}
          style={{ background:"none", border:`1px solid ${C.borderLight}`, borderRadius:8, padding:"9px 14px",
            color:panelTxt, fontSize:11, cursor:"pointer", fontFamily:FONT_DISPLAY, letterSpacing:1, width:"100%" }}>
          {t("userManual")}
        </button>}
        <button onClick={()=>{ onClose(); setTimeout(()=>{ if(typeof onRestartTour==="function") onRestartTour(); },200); }}
          style={{ background:"none", border:`1px solid ${C.borderLight}`, borderRadius:8, padding:"9px 14px",
            color:C.textMuted, fontSize:11, cursor:"pointer", fontFamily:FONT_DISPLAY, letterSpacing:1, width:"100%" }}>
          {"↺ "+t("restartWalkthrough")}
        </button>
      </div>

        </div>
        </div>{/* end zoom+scroll */}

        {/* Footer — outside zoom so always fully visible; hidden when inline (ProfileModal has its own buttons) */}
        {!inline && (
        <div style={{ display:"flex", gap:8, justifyContent:"flex-end",
          padding:"12px 18px", borderTop:`1px solid ${panelBrd}`, flexShrink:0, background:panelBg }}>
          <button onClick={()=>{ onSave(origSettings.current); onClose(); }}
            style={{ padding:"11px 20px", borderRadius:8, border:`1px solid ${panelBrd}`,
              background:panelSrf, color:panelTxt, cursor:"pointer", fontSize:14,
              fontWeight:700, fontFamily:FONT_DISPLAY, letterSpacing:0.8 }}>{t("cancel")}</button>
          <button onClick={onClose}
            style={{ padding:"11px 20px", borderRadius:8, border:"none",
              background:accent, color:C.bg, cursor:"pointer", fontSize:14,
              fontWeight:700, fontFamily:FONT_DISPLAY, letterSpacing:0.8 }}>{t("saveSettings")}</button>
        </div>
        )}
      {(showAddAttr||editAttr)&&(
        <AttributeModal
          attr={editAttr}
          existingNames={customAttrs.filter(a=>a.id!==editAttr?.id).map(a=>a.name)}
          onClose={()=>{ setShowAddAttr(false); setEditAttr(null); }}
          onSave={def=>{
            if(editAttr) setCustomAttrs(prev=>prev.map(a=>a.id===def.id?def:a));
            else setCustomAttrs(prev=>[...prev,def]);
            setShowAddAttr(false); setEditAttr(null);
          }}
        />
      )}
      {confirmDeleteAttr&&(
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:1200, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
          <div style={{ background:C.bg, borderRadius:16, width:"100%", maxWidth:340, padding:20, boxShadow:"0 24px 60px rgba(0,0,0,0.4)" }}>
            <div style={{ fontWeight:900, fontSize:14, letterSpacing:1.5, fontFamily:FONT_DISPLAY, color:C.brown, marginBottom:8 }}>{t("deleteAttribute")}</div>
            <p style={{ fontSize:13, color:C.textSec, marginBottom:16, lineHeight:1.5 }}>
              {t("deleteAttributeConfirm").replace("{name}", confirmDeleteAttr.name)}
            </p>
            <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
              <button onClick={()=>setConfirmDeleteAttr(null)}
                style={{ padding:"8px 16px", borderRadius:8, border:`1px solid ${C.border}`, background:"none", color:C.textSec, fontSize:13, cursor:"pointer", fontFamily:FONT_BODY }}>{t("cancel")}</button>
              <button onClick={()=>{ setCustomAttrs(prev=>prev.filter(a=>a.id!==confirmDeleteAttr.id)); setConfirmDeleteAttr(null); }}
                style={{ padding:"8px 16px", borderRadius:8, border:"none", background:C.accent, color:C.bg, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:FONT_BODY }}>{t("delete")}</button>
            </div>
          </div>
        </div>
      )}
      {confirmRestore&&(
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:1200, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
          <div style={{ background:C.bg, borderRadius:16, width:"100%", maxWidth:340, padding:20, boxShadow:"0 24px 60px rgba(0,0,0,0.4)" }}>
            <div style={{ fontWeight:900, fontSize:14, letterSpacing:1.5, fontFamily:FONT_DISPLAY, color:C.brown, marginBottom:8 }}>{t("restoreConfirmTitle")}</div>
            <p style={{ fontSize:13, color:C.textSec, marginBottom:16, lineHeight:1.6 }}>
              {t("restoreConfirmBody")} <strong style={{ color:C.text }}>{(()=>{ try { return new Date(confirmRestore._exportedAt).toLocaleDateString(undefined,{year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"}); } catch { return confirmRestore._exportedAt; } })()}</strong>{t("restoreConfirmBody2")}
            </p>
            <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
              <button onClick={()=>setConfirmRestore(null)}
                style={{ padding:"8px 16px", borderRadius:8, border:`1px solid ${C.border}`, background:"none", color:C.textSec, fontSize:13, cursor:"pointer", fontFamily:FONT_BODY }}>{t("cancel")}</button>
              <button onClick={()=>restoreBackup(confirmRestore)}
                style={{ padding:"8px 16px", borderRadius:8, border:"none", background:C.accent, color:C.bg, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:FONT_BODY }}>{t("restore")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
