import React, { useState, useRef } from "react";
import { C } from "../../constants/colors";
import { FONT_DISPLAY, FONT_BODY } from "../../constants/fonts";
import { Ic } from "../shared/Ic";
import { useT } from "../../hooks/useTranslation";
import { downloadBackup, restoreBackup } from "./BackupModal";

export const SettingsModal = ({ onClose, settings, onSave, onClearMoves, onRestoreRounds, onRestartTour, zoom=1, onZoomChange }) => {
  const t = useT();
  const [s,setS]=useState({
    theme:"light", defaultTab:"wip", showMastery:false,
    compactCards:false, sortMoves:"custom", fontSize:"medium",
    showMoveCount:false, confirmDelete:true, practiceReminders:false,
    reminderTime:"18:00", streakTracking:true, showDeadlineIndicator:true,
    categorySort:"manual", showMoveCount:true, defaultView:"list", language:"en", linkOnCard:"inside", targetAutoLink:false, trainTabOrder:["goals","habits","notes"],
    ...settings
  });
  const origSettings = useRef(settings);
  const [confirmClear,setConfirmClear]=useState(false);
  const [confirmRestoreRounds,setConfirmRestoreRounds]=useState(false);
  const [confirmRestore,setConfirmRestore]=useState(null);
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
              cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:FONT_DISPLAY, transition:"all 0.15s" }}>
            {o.icon&&<span style={{marginRight:4}}>{o.icon}</span>}{o.label||o}
          </button>;
        })}
      </div>
    );
  };

  const sectionHdr=(label,emoji)=>(
    <div style={{ display:"flex", alignItems:"center", gap:7, margin:"22px 0 6px",
      paddingBottom:7, borderBottom:`2px solid ${panelBrd}` }}>
      {emoji&&<span style={{fontSize:14}}>{emoji}</span>}
      <span style={{ fontSize:11, fontWeight:800, letterSpacing:2.5, color:panelMut, fontFamily:FONT_DISPLAY }}>{label}</span>
    </div>
  );

  const accent=C.accent;

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(10,5,2,0.8)", zIndex:1000,
      display:"flex", alignItems:"flex-end", justifyContent:"center", padding:"0 0 0 0" }}>
      <div style={{ background:panelBg, border:`2px solid ${panelBrd}`, borderRadius:"14px 14px 0 0", width:"100%",
        maxWidth:480, height:"90dvh", display:"flex", flexDirection:"column", overflow:"hidden",
        boxShadow:"0 -8px 40px rgba(0,0,0,0.6)", color:panelTxt }}>

        {/* Sticky header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"13px 18px", borderBottom:`1px solid ${panelBrd}`, flexShrink:0,
          background:panelBg, zIndex:10 }}>
          <span style={{ fontWeight:800, fontSize:15, letterSpacing:2, color:panelTxt, fontFamily:FONT_DISPLAY }}>⚙️ SETTINGS</span>
          <button onClick={onClose}
            style={{ background:panelSrf, border:`1px solid ${panelBrd}`, cursor:"pointer",
              color:panelMut, padding:5, borderRadius:7, display:"flex" }}>
            <Ic n="x" s={14} c={panelMut}/>
          </button>
        </div>

        <div style={{ flex:1, overflow:"auto", zoom:zoom, WebkitTextSizeAdjust:"none" }}>
        <div style={{ padding:18 }}>

          {/* ── APPEARANCE ──────────────────────────────── */}
          {sectionHdr(t("appearance"),"🎨")}

          {row(t("theme"), t("themeDesc"),
            segmented("theme",[{value:"light",icon:"☀️",label:t("light")},{value:"dark",icon:"🌙",label:t("dark")}])
          )}

          {row(t("textSize"), t("textSizeDesc"),
            segmented("fontSize",[{value:"small",label:"S"},{value:"medium",label:"M"},{value:"large",label:"L"}])
          )}

          {row(t("defaultView"), t("defaultViewDesc"),
            segmented("defaultView",[{value:"list",icon:"☰",label:t("list")},{value:"tiles",icon:"⊞",label:t("tiles")}])
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
                padding:"7px 10px", color:panelTxt, fontSize:12, fontFamily:FONT_DISPLAY,
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
            </select>
          )}

          {/* ── BEHAVIOUR ───────────────────────────────── */}
          {sectionHdr(t("behaviour"),"⚡")}

          {row(t("showMastery"),
            t("showMasteryDesc"),
            toggle("showMastery")
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
                padding:"7px 10px", color:panelTxt, fontSize:12, fontFamily:FONT_DISPLAY,
                fontWeight:700, outline:"none" }}>
              <option value="inside">🔒 {t("linkOnCardInside")}</option>
              <option value="both">🔗 {t("linkOnCardBoth")}</option>
            </select>
          )}

          {(()=>{
            const order = s.trainTabOrder||["goals","habits","notes"];
            const labels = { goals:"🎯 "+t("trainTabGoals"), habits:"🔥 "+t("trainTabHabits"), notes:"📝 "+t("trainTabNotes") };
            const move = (from, to) => {
              const next = [...order];
              const [item] = next.splice(from,1);
              next.splice(to,0,item);
              set("trainTabOrder")(next);
            };
            return row(t("trainTabOrder"),
              t("trainTabOrderDesc"),
              <div style={{ display:"flex", flexDirection:"column", gap:4, minWidth:140 }}>
                {order.map((id,i)=>(
                  <div key={id} style={{ display:"flex", alignItems:"center", gap:6,
                    background:C.surfaceAlt, borderRadius:6, padding:"5px 8px",
                    border:`1px solid ${C.border}` }}>
                    <span style={{ fontSize:11, fontWeight:800, color:C.text, fontFamily:FONT_DISPLAY, flex:1 }}>{labels[id]||id}</span>
                    <button onClick={()=>i>0&&move(i,i-1)} disabled={i===0}
                      style={{ background:"none", border:"none", cursor:i>0?"pointer":"default",
                        color:i>0?C.textSec:C.border, padding:"0 2px", fontSize:12 }}>▲</button>
                    <button onClick={()=>i<order.length-1&&move(i,i+1)} disabled={i===order.length-1}
                      style={{ background:"none", border:"none", cursor:i<order.length-1?"pointer":"default",
                        color:i<order.length-1?C.textSec:C.border, padding:"0 2px", fontSize:12 }}>▼</button>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* ── NAVIGATION ──────────────────────────────── */}
          {sectionHdr(t("navigation"),"🧭")}

          {row(t("defaultTab"), t("defaultTabDesc"),
            <select value={s.defaultTab} onChange={e=>set("defaultTab")(e.target.value)}
              style={{ background:panelSrf, border:`1px solid ${panelBrd}`, borderRadius:7,
                padding:"7px 10px", color:panelTxt, fontSize:12, fontFamily:FONT_DISPLAY,
                fontWeight:700, outline:"none" }}>
              <option value="ideas">🎯 {t("train")}</option>
              <option value="wip">📜 {t("vocab")}</option>
              <option value="ready">⚔️ {t("battle")}</option>
            </select>
          )}

          {row(t("sortMoves"), t("sortMovesDesc"),
            <select value={s.sortMoves} onChange={e=>set("sortMoves")(e.target.value)}
              style={{ background:panelSrf, border:`1px solid ${panelBrd}`, borderRadius:7,
                padding:"7px 10px", color:panelTxt, fontSize:12, fontFamily:FONT_DISPLAY,
                fontWeight:700, outline:"none" }}>
              <option value="custom">✋ {t("customSort")}</option>
              <option value="date">{`📅 ${t("dateAdded")}`}</option>
              <option value="name">{`🔤 ${t("alphabetical")}`}</option>
              <option value="mastery">{`💪 ${t("masteryPct")}`}</option>
            </select>
          )}

          {row(t("sortCategories"), t("sortCatsDesc"),
            <select value={s.categorySort} onChange={e=>set("categorySort")(e.target.value)}
              style={{ background:panelSrf, border:`1px solid ${panelBrd}`, borderRadius:7,
                padding:"7px 10px", color:panelTxt, fontSize:12, fontFamily:FONT_DISPLAY,
                fontWeight:700, outline:"none" }}>
              <option value="manual">✋ {t("customSort")}</option>
              <option value="name">{`🔤 ${t("alphabetical")}`}</option>
              <option value="progress">{`📈 ${t("mostProgress")}`}</option>
            </select>
          )}

          {/* ── PRACTICE ────────────────────────────────── */}
          {sectionHdr(t("practiceTracking"),"🏆")}
          <div style={{ position:"relative", pointerEvents:"none" }}>
            <div style={{ opacity:0.38, userSelect:"none" }}>
              {row(t("streakTracking"),
                t("streakDesc"),
                toggle("streakTracking")
              )}
              {row(t("practiceReminders"),
                t("remindersDesc"),
                toggle("practiceReminders")
              )}
            </div>
            <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ background:panelSrf, border:`1px solid ${panelBrd}`, borderRadius:8,
                padding:"5px 12px", fontSize:11, fontWeight:800, letterSpacing:1.5,
                color:panelMut, fontFamily:FONT_DISPLAY }}>{t("comingSoon")}</span>
            </div>
          </div>

          {/* ── DATA ────────────────────────────────────── */}
          {sectionHdr(t("dataPrivacy"),"🔒")}

          {row(t("saveBackup"),
            t("saveBackupSettingsDesc"),
            <button onClick={()=>{ downloadBackup(); }}
              style={{ padding:"7px 14px", borderRadius:7, border:`1px solid ${panelBrd}`,
                background:panelSrf, color:panelTxt, cursor:"pointer", fontSize:12,
                fontWeight:700, fontFamily:FONT_DISPLAY, whiteSpace:"nowrap" }}>
              {"⬇ "+t("saveBackupBtn")}
            </button>
          )}

          {row(t("restoreBackup"),
            t("restoreBackupSettingsDesc"),
            <label style={{ padding:"7px 14px", borderRadius:7, border:`1px solid ${panelBrd}`,
              background:panelSrf, color:panelTxt, cursor:"pointer", fontSize:12,
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

          {row(t("exportAllData"),
            t("exportAllDataDesc"),
            <button onClick={()=>{
              try {
                const escape = v => {
                  if (v===undefined||v===null) return "";
                  const str = String(v).replace(/"/g,'""');
                  return str.includes(",") || str.includes('"') || str.includes("\n") ? `"${str}"` : str;
                };
                const row2 = arr => arr.map(escape).join(",");
                const sections = [];

                // MOVES
                const moves = JSON.parse(localStorage.getItem("mb_moves")||"[]");
                if (moves.length) {
                  sections.push("TYPE,Name,Category,Mastery (%),Description,Notes,Link,Date Added");
                  moves.forEach(m => sections.push(row2(["move",m.name,m.category,m.mastery||0,m.description||"",m.notes||"",m.link||"",m.date||""])));
                  sections.push("");
                }

                // HABITS
                const habits = JSON.parse(localStorage.getItem("mb_habits")||"[]");
                if (habits.length) {
                  sections.push("TYPE,Name,Frequency,Color,Notes,Check-ins");
                  habits.forEach(h => sections.push(row2(["habit",h.name,h.frequency||"daily",h.color||"",h.notes||"",(h.checkIns||[]).join("|")])));
                  sections.push("");
                }

                // GOALS & NOTES (ideas)
                const ideas = JSON.parse(localStorage.getItem("mb_ideas")||"[]");
                const goals = ideas.filter(i=>i.type==="goal");
                const targets = ideas.filter(i=>i.type==="target");
                const notes = ideas.filter(i=>i.type==="note");
                if (goals.length) {
                  sections.push("TYPE,Title,Why,Deadline,Steps,Commitments,Obstacles");
                  goals.forEach(g => sections.push(row2(["goal",g.title||"",g.why||"",g.byWhen||"",(g.steps||[]).filter(Boolean).join(" | "),[g.daysPerWeek,g.sessionLength,g.trainWhere].filter(Boolean).join(" · "),g.obstacles||""])));
                  sections.push("");
                }
                if (targets.length) {
                  sections.push("TYPE,Title,Current,Target,Unit,Deadline");
                  targets.forEach(g => sections.push(row2(["target",g.title||"",g.current||0,g.target||0,g.unit||"",g.byWhen||""])));
                  sections.push("");
                }
                if (notes.length) {
                  sections.push("TYPE,Title,Text,Link");
                  notes.forEach(n => sections.push(row2(["note",n.title||"",n.text||"",n.link||""])));
                  sections.push("");
                }

                // SETS
                const sets = JSON.parse(localStorage.getItem("mb_sets")||"[]");
                if (sets.length) {
                  sections.push("TYPE,Name,Details,Color,Mastery (%)");
                  sets.forEach(s => sections.push(row2(["set",s.name,s.details||"",s.color||"",s.mastery||0])));
                  sections.push("");
                }

                if (!sections.length) { alert(t("noDataToExport")); return; }
                const csv = sections.join("\n");
                const blob = new Blob([csv], {type:"text/csv;charset=utf-8;"});
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href=url; a.download=`movesbook-export-${new Date().toISOString().split("T")[0]}.csv`; a.click();
                URL.revokeObjectURL(url);
              } catch(e) { alert(t("exportFailed")); }
            }}
              style={{ padding:"7px 14px", borderRadius:7, border:`1px solid ${panelBrd}`,
                background:panelSrf, color:panelTxt, cursor:"pointer", fontSize:12,
                fontWeight:700, fontFamily:FONT_DISPLAY, whiteSpace:"nowrap" }}>
              {"⬇ "+t("exportCsvBtn")}
            </button>
          )}

          {row(t("importMovesFromCsv"),
            t("importMovesFromCsvDesc"),
            <label style={{ padding:"7px 14px", borderRadius:7, border:`1px solid ${panelBrd}`,
              background:panelSrf, color:panelTxt, cursor:"pointer", fontSize:12,
              fontWeight:700, fontFamily:FONT_DISPLAY, whiteSpace:"nowrap", display:"inline-block" }}>
              {"⬆ "+t("importCsvBtn")}
              <input type="file" accept=".csv" style={{ display:"none" }} onChange={e=>{
                const file = e.target.files?.[0]; if(!file) return;
                const reader = new FileReader();
                reader.onload = ev => {
                  try {
                    const lines = ev.target.result.split("\n").map(l=>l.trim()).filter(Boolean);
                    const parseRow = line => {
                      const cols = []; let cur="", inQ=false;
                      for (let i=0; i<line.length; i++) {
                        const ch = line[i];
                        if (ch==='"' && !inQ) { inQ=true; }
                        else if (ch==='"' && inQ && line[i+1]==='"') { cur+='"'; i++; }
                        else if (ch==='"' && inQ) { inQ=false; }
                        else if (ch===',' && !inQ) { cols.push(cur); cur=""; }
                        else { cur+=ch; }
                      }
                      cols.push(cur);
                      return cols;
                    };
                    const existing = JSON.parse(localStorage.getItem("mb_moves")||"[]");
                    const existingKeys = new Set(existing.map(m=>(m.name+"|"+m.category).toLowerCase()));
                    const toAdd = [];
                    let skipped = 0, headerSeen = false;
                    for (const line of lines) {
                      const cols = parseRow(line);
                      if (!cols[0]) continue;
                      if (cols[0].toLowerCase()==="type" || cols[0].toLowerCase()==="name") { headerSeen=true; continue; }
                      if (cols[0].toLowerCase()!=="move") continue;
                      const [,name,category,mastery,description,notes,link,date] = cols;
                      if (!name?.trim()) continue;
                      const key = (name.trim()+"|"+(category?.trim()||"Footworks")).toLowerCase();
                      if (existingKeys.has(key)) { skipped++; continue; }
                      existingKeys.add(key);
                      toAdd.push({ id:Date.now()+Math.random(), name:name.trim(),
                        category:category?.trim()||"Footworks", mastery:parseInt(mastery)||0,
                        description:description?.trim()||"", notes:notes?.trim()||"",
                        link:link?.trim()||"", date:date?.trim()||new Date().toISOString().split("T")[0],
                        status:"wip" });
                    }
                    if (!toAdd.length && !skipped) { alert(t("noMoveRowsFound")); return; }
                    if (toAdd.length) {
                      const updated = [...existing, ...toAdd];
                      localStorage.setItem("mb_moves", JSON.stringify(updated));
                    }
                    const msg = `Import complete.\n✅ ${toAdd.length} move${toAdd.length!==1?"s":""} added${skipped?`\n⏭ ${skipped} duplicate${skipped!==1?"s":""} skipped`:""}.`;
                    alert(msg);
                    if (toAdd.length) window.location.reload();
                    e.target.value="";
                  } catch(err) { alert(t("importFailedCheck")); }
                };
                reader.readAsText(file);
              }}/>
            </label>
          )}

          {row(t("clearAllMoves"),
            t("clearAllMovesDesc"),
            confirmClear ? (
              <div style={{ display:"flex", gap:6 }}>
                <button onClick={()=>setConfirmClear(false)}
                  style={{ padding:"6px 10px", borderRadius:7, border:`1px solid ${panelBrd}`,
                    background:panelSrf, color:panelMut, cursor:"pointer", fontSize:12,
                    fontWeight:700, fontFamily:FONT_DISPLAY }}>{t("cancel")}</button>
                <button onClick={()=>{ onClearMoves(); setConfirmClear(false); onClose(); }}
                  style={{ padding:"6px 10px", borderRadius:7, border:`1px solid ${accent}`,
                    background:`${accent}22`, color:accent, cursor:"pointer", fontSize:12,
                    fontWeight:700, fontFamily:FONT_DISPLAY }}>{t("confirm")}</button>
              </div>
            ) : (
              <button onClick={()=>setConfirmClear(true)}
                style={{ padding:"7px 14px", borderRadius:7, border:`1px solid ${accent}44`,
                  background:`${accent}10`, color:accent, cursor:"pointer", fontSize:12,
                  fontWeight:700, fontFamily:FONT_DISPLAY, whiteSpace:"nowrap" }}>
                {"🗑 "+t("clearBtn")}
              </button>
            )
          , true)}

          {row(t("restoreDefaultRounds"),
            t("restoreDefaultRoundsDesc"),
            confirmRestoreRounds ? (
              <div style={{ display:"flex", gap:6 }}>
                <button onClick={()=>setConfirmRestoreRounds(false)}
                  style={{ padding:"6px 10px", borderRadius:7, border:`1px solid ${panelBrd}`,
                    background:panelSrf, color:panelMut, cursor:"pointer", fontSize:12,
                    fontWeight:700, fontFamily:FONT_DISPLAY }}>{t("cancel")}</button>
                <button onClick={()=>{ onRestoreRounds(); setConfirmRestoreRounds(false); onClose(); }}
                  style={{ padding:"6px 10px", borderRadius:7, border:`1px solid ${accent}`,
                    background:`${accent}22`, color:accent, cursor:"pointer", fontSize:12,
                    fontWeight:700, fontFamily:FONT_DISPLAY }}>{t("confirm")}</button>
              </div>
            ) : (
              <button onClick={()=>setConfirmRestoreRounds(true)}
                style={{ padding:"7px 14px", borderRadius:7, border:`1px solid ${panelBrd}`,
                  background:panelSrf, color:panelTxt, cursor:"pointer", fontSize:12,
                  fontWeight:700, fontFamily:FONT_DISPLAY, whiteSpace:"nowrap" }}>
                {"↺ "+t("restoreBtn")}
              </button>
            )
          , true)}

          {/* ── ABOUT ───────────────────────────────────── */}
          {sectionHdr(t("aboutSection"),"📱")}
          <div style={{ padding:"12px 0", borderBottom:`1px solid ${panelBrd}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
              <span style={{ fontSize:13, color:panelMut }}>{t("version")}</span>
              <span style={{ fontSize:13, color:panelTxt, fontWeight:700 }}>1.0.0-beta</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
              <span style={{ fontSize:13, color:panelMut }}>{t("buildLabel")}</span>
              <span style={{ fontSize:13, color:panelTxt, fontWeight:700 }}>MovesBook Prototype</span>
            </div>
            <div style={{ fontSize:12, color:panelMut, marginTop:8, lineHeight:1.6, fontStyle:"italic" }}>
              {t("builtForBreakers")+" 🕺"}
            </div>
          </div>

          {/* Save button */}
          <div style={{ marginTop:24, paddingTop:16, borderTop:`1px solid ${C.borderLight}` }}>
        <button onClick={()=>{ onClose(); setTimeout(()=>{ if(typeof onRestartTour==="function") onRestartTour(); },200); }}
          style={{ background:"none", border:`1px solid ${C.borderLight}`, borderRadius:8, padding:"9px 14px",
            color:C.textMuted, fontSize:12, cursor:"pointer", fontFamily:FONT_DISPLAY, letterSpacing:1, width:"100%" }}>
          {"↺ "+t("restartWalkthrough")}
        </button>
      </div>

        </div>
        </div>{/* end zoom+scroll */}

        {/* Footer — outside zoom so always fully visible */}
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
      </div>
      {confirmRestore&&(
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:1200, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
          <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:14, width:"100%", maxWidth:340, padding:20, boxShadow:"0 24px 60px rgba(0,0,0,0.4)" }}>
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
