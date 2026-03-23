import React, { Fragment, useState, useEffect } from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY } from '../../constants/fonts';
import { Ic } from '../shared/Ic';
import { Modal } from '../shared/Modal';
import { Btn } from '../shared/Btn';
import { useT, usePlural } from '../../hooks/useTranslation';
import { useSettings } from '../../hooks/useSettings';
import { habitStreak, freqDaysPerWeek, habitDoneToday } from './helpers';
import { HabitModal } from './HabitModal';
import { HabitCard } from './HabitCard';

export const HabitsPage = ({ onAddTrigger, habits=[], setHabits=()=>{} }) => {
  const { C } = useSettings();
  const t = useT();
  const { dayCountStr } = usePlural();
  const [reorderMode, setReorderMode] = useState(false);
  const [view, setView] = useState("tiles");
  const moveHabitUp   = (idx) => { if(idx===0) return; setHabits(prev=>{ const n=[...prev]; [n[idx],n[idx-1]]=[n[idx-1],n[idx]]; return n; }); };
  const moveHabitDown = (idx) => { setHabits(prev=>{ if(idx>=prev.length-1) return prev; const n=[...prev]; [n[idx],n[idx+1]]=[n[idx+1],n[idx]]; return n; }); };

  const [editHabit,   setEditHabit]   = useState(null);
  const [openHabit,   setOpenHabit]   = useState(null);
  const [addingHabit, setAddingHabit] = useState(false);
  const [confirmDel,  setConfirmDel]  = useState(null);
  const [habitNudge,  setHabitNudge]  = useState(false);

  const openAddHabit = () => {
    if (habits.length >= 2) { setHabitNudge(true); }
    else { setAddingHabit(true); }
  };

  useEffect(()=>{ if(onAddTrigger) openAddHabit(); },[onAddTrigger]);

  const addHabit = (fields) => setHabits(p=>[...p,{
    id:Date.now(), checkIns:[], createdDate:new Date().toISOString().split("T")[0], ...fields
  }]);
  const updateHabit = (id, fields) => setHabits(p=>p.map(h=>h.id===id?{...h,...fields}:h));
  const deleteHabit = (id) => setHabits(p=>p.filter(h=>h.id!==id));

  const checkIn = (id) => {
    const today = new Date().toISOString().split("T")[0];
    setHabits(p=>p.map(h=>{
      if (h.id!==id) return h;
      const already = (h.checkIns||[]).includes(today);
      return { ...h, checkIns: already
        ? h.checkIns.filter(d=>d!==today)
        : [...(h.checkIns||[]), today]
      };
    }));
  };

  const doneCount = habits.filter(h=>habitDoneToday(h.checkIns)).length;

  return (
    <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"8px 14px", borderBottom:`1px solid ${C.borderLight}`, background:C.surface, flexShrink:0 }}>
        <div>
          <span style={{ fontSize:12, fontWeight:700, letterSpacing:1.5, color:C.textMuted, fontFamily:FONT_DISPLAY }}>
            HABITS · {habits.length}
          </span>
          {habits.length>0&&(
            <span style={{ fontSize:11, color:C.textMuted, marginLeft:8 }}>
              {doneCount}/{habits.length} done today
            </span>
          )}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
          {!reorderMode&&<button onClick={()=>{ setView(v=>v==="list"?"tiles":"list"); setOpenHabit(null); }}
            style={{ background:"none", border:"none", cursor:"pointer", padding:5, borderRadius:5, color:C.textMuted }}>
            <Ic n={view==="list"?"grid":"list"} s={16}/>
          </button>}
          {habits.length>1&&<button onClick={()=>setReorderMode(r=>!r)}
            style={{ background:reorderMode?C.accent:"none", border:"none", cursor:"pointer", padding:"4px 8px", borderRadius:5,
              color:reorderMode?C.bg:C.textMuted, fontSize:13, fontWeight:800, fontFamily:FONT_DISPLAY, letterSpacing:1 }}>
            {reorderMode?"DONE":"⇅"}
          </button>}
        </div>
      </div>

      {/* Today banner */}
      {habits.length>0&&(
        <div style={{ padding:"8px 14px", background: doneCount===habits.length ? `${C.accent}12` : C.surfaceAlt,
          borderBottom:`1px solid ${C.borderLight}`, flexShrink:0, display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ flex:1, height:4, borderRadius:2, background:C.border }}>
            <div style={{ height:"100%", borderRadius:2, background:C.accent,
              width:`${habits.length>0?Math.round(doneCount/habits.length*100):0}%`, transition:"width 0.3s" }}/>
          </div>
          <span style={{ fontSize:11, fontWeight:800, color: doneCount===habits.length?C.accent:C.textMuted,
            fontFamily:FONT_DISPLAY, flexShrink:0 }}>
            {doneCount===habits.length && habits.length>0 ? "🔥 All done!" : `${Math.round(doneCount/habits.length*100||0)}% today`}
          </span>
        </div>
      )}

      {/* List */}
      <div style={{ flex:1, overflow:"auto", padding:"10px 12px", paddingBottom:76 }}>
        {habits.length===0&&(
          <div style={{ textAlign:"center", padding:"40px 20px", color:C.textMuted }}>
            <div style={{ fontSize:32, marginBottom:8 }}>🔥</div>
            <div style={{ fontSize:13, fontWeight:700, fontFamily:FONT_DISPLAY, marginBottom:6 }}>{t("noHabitsYet")}</div>
            <div style={{ fontSize:12 }}>{t("buildRoutine")}</div>
          </div>
        )}
        {view==="tiles" && !reorderMode ? (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {habits.map(h=>{
              const today = new Date().toISOString().split("T")[0];
              const checkIns = h.checkIns||[];
              const doneToday = checkIns.includes(today);
              const color = h.color || C.accent;
              const streak = habitStreak(checkIns, h.frequency);
              const dpw = freqDaysPerWeek(h.frequency);
              const freqLabel = { daily:"Every day","2x":"2×/wk","3x":"3×/wk","4x":"4×/wk","5x":"5×/wk","6x":"6×/wk",weekdays:"Weekdays" }[h.frequency]||"Every day";
              const weekStart = (()=>{ const d=new Date(); d.setDate(d.getDate()-d.getDay()); return d.toISOString().split("T")[0]; })();
              const weekDone = checkIns.filter(d=>d>=weekStart).length;
              const weekTarget = dpw>=7?7:dpw;
              const weekPct = Math.min(weekDone/weekTarget,1);
              const R=44, CIRC=2*Math.PI*R;
              const dash=weekPct*CIRC, gap=CIRC-dash, offset=CIRC*0.25;
              const last7 = Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-(6-i)); return {ds:d.toISOString().split("T")[0],isToday:i===6}; });
              const isOpen = openHabit===h.id;
              return (
                <div key={h.id} onClick={()=>setOpenHabit(isOpen?null:h.id)}
                  style={{ background:C.surface, borderRadius:14, cursor:"pointer",
                    border:`1.5px solid ${doneToday?color+"66":C.border}`,
                    overflow:"hidden", display:"flex", flexDirection:"column", minWidth:0,
                    transition:"border-color 0.2s" }}>
                  <div style={{ height:4, background:`linear-gradient(90deg,${color},${color}44)`, flexShrink:0 }}/>
                  <div style={{ padding:"12px 12px 10px", display:"flex", flexDirection:"column" }}>

                    {/* Ring — centred, prominent */}
                    <div style={{ display:"flex", justifyContent:"center", marginBottom:12 }}>
                      <svg width="110" height="110" viewBox="0 0 110 110">
                        <circle cx="55" cy="55" r={R} fill="none" stroke={C.border} strokeWidth="9"/>
                        {weekPct>0&&<circle cx="55" cy="55" r={R} fill="none" stroke={color} strokeWidth="9"
                          strokeDasharray={`${dash} ${gap}`} strokeDashoffset={offset} strokeLinecap="round"/>}
                        {weekDone>=weekTarget ? (
                          <Fragment>
                            <text x="55" y="46" textAnchor="middle" dominantBaseline="central"
                              fontSize="18" fill={color} fontWeight="800">✓</text>
                            <text x="55" y="64" textAnchor="middle" dominantBaseline="central"
                              fontSize="10" fill={color} fontWeight="700">Week done!</text>
                          </Fragment>
                        ) : (
                          <Fragment>
                            <text x="55" y="48" textAnchor="middle" dominantBaseline="central"
                              fontSize="24" fill={C.text} fontWeight="900">{weekDone}</text>
                            <text x="55" y="68" textAnchor="middle" dominantBaseline="central"
                              fontSize="10" fill={C.textMuted}>of {weekTarget} days</text>
                          </Fragment>
                        )}
                      </svg>
                    </div>

                    {/* Name + why */}
                    <div style={{ marginBottom:6 }}>
                      <div style={{ fontWeight:800, fontSize:13, color:C.text, fontFamily:FONT_DISPLAY,
                        letterSpacing:0.5, lineHeight:1.3,
                        overflow:isOpen?"visible":"hidden", textOverflow:"ellipsis", whiteSpace:isOpen?"normal":"nowrap" }}>
                        {h.emoji||"🎯"} {h.name}
                      </div>
                      {h.why&&<div style={{ fontSize:10, color:C.textSec, fontStyle:"italic", marginTop:2, lineHeight:1.4,
                        overflow:isOpen?"visible":"hidden", textOverflow:"ellipsis", whiteSpace:isOpen?"normal":"nowrap" }}>{h.why}</div>}
                    </div>

                    {/* Freq badge */}
                    <div style={{ marginBottom:10 }}>
                      <span style={{ fontSize:9, fontWeight:800, letterSpacing:1, color, fontFamily:FONT_DISPLAY,
                        background:`${color}18`, borderRadius:4, padding:"2px 8px" }}>{freqLabel}</span>
                    </div>

                    {/* 7-day dots */}
                    <div style={{ marginBottom:10 }}>
                      <div style={{ fontSize:9, color:C.textMuted, fontFamily:FONT_DISPLAY, letterSpacing:1, marginBottom:5 }}>THIS WEEK</div>
                      <div style={{ display:"flex", gap:4 }}>
                        {last7.map(({ds,isToday})=>(
                          <div key={ds} style={{ flex:1, height:8, borderRadius:4,
                            background:checkIns.includes(ds)?color:C.surfaceAlt,
                            outline:isToday?`1.5px solid ${color}`:"none", outlineOffset:1 }}/>
                        ))}
                      </div>
                    </div>

                    {/* Streak + Best side by side */}
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                      <div style={{ fontSize:12, color:streak>0?color:C.textMuted, fontWeight:800, fontFamily:FONT_DISPLAY }}>
                        {streak>0?`🔥 ${dayCountStr(streak)}`:doneToday?`✓ ${t("doneToday")}`:t("noStreakYet")}
                      </div>
                      <div style={{ fontSize:10, color:C.textMuted, fontFamily:FONT_DISPLAY }}>
                        {t("bestColon")} <span style={{ fontWeight:700, color:C.textSec }}>{(()=>{
                          let best=0,cur=0;
                          [...checkIns].sort().forEach((d,i,arr)=>{
                            if(i===0){cur=1;best=1;return;}
                            const diff=(new Date(d)-new Date(arr[i-1]))/(86400000);
                            if(diff<=1.5){cur++;best=Math.max(best,cur);}else cur=1;
                          });
                          const b=Math.max(best,streak);
                          return dayCountStr(b);
                        })()}</span>
                      </div>
                    </div>

                    {/* Expanded: notes */}
                    {isOpen&&h.notes&&(
                      <div style={{ fontSize:11, color:C.textSec, lineHeight:1.5, marginBottom:10,
                        background:C.surfaceAlt, borderRadius:8, padding:"8px 10px",
                        border:`1px solid ${C.border}` }}>
                        {h.notes}
                      </div>
                    )}

                    {/* Edit button */}
                    <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:6 }}>
                      <button onClick={e=>{e.stopPropagation();setEditHabit(h);}}
                        style={{ background:"none", border:"none", cursor:"pointer", padding:2 }}>
                        <Ic n="more" s={13} c={C.textMuted}/>
                      </button>
                    </div>

                    {/* Did it / Undo button */}
                    <button onClick={e=>{e.stopPropagation();checkIn(h.id);}}
                      style={{ width:"100%", padding:"9px 0", borderRadius:10, cursor:"pointer",
                        border:`1.5px solid ${doneToday?"#2e7d32":color}`,
                        background:doneToday?"#1b5e2022":`${color}15`,
                        display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                        transition:"all 0.18s" }}>
                      {doneToday
                        ? <Fragment><span style={{ fontSize:14, color:"#ffffff", fontFamily:FONT_DISPLAY, fontWeight:900, letterSpacing:0.5 }}>DONE</span><span style={{ fontSize:16, marginLeft:6 }}>✅</span><span style={{ fontSize:10, color:"rgba(255,255,255,0.6)", fontFamily:FONT_DISPLAY, marginLeft:6 }}>· undo</span></Fragment>
                        : <Fragment>
                            <span style={{ fontSize:15 }}>✊</span>
                            <span style={{ fontSize:12, color, fontFamily:FONT_DISPLAY, fontWeight:800, letterSpacing:0.5 }}>Did it!</span>
                          </Fragment>
                      }
                    </button>

                    {isOpen&&<div style={{ fontSize:9, color:C.textMuted, textAlign:"center", marginTop:6 }}>tap to collapse</div>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          habits.map((h,idx)=>(
            <div key={h.id} style={{ position:"relative" }}>
              {reorderMode&&(
                <div style={{ position:"absolute", right:6, top:"50%", transform:"translateY(-50%)", zIndex:10,
                  display:"flex", flexDirection:"column", gap:2 }}>
                  <button onClick={()=>moveHabitUp(idx)} disabled={idx===0}
                    style={{ width:26, height:26, borderRadius:6, border:`1px solid ${C.border}`, background:C.bg,
                      cursor:idx===0?"default":"pointer", color:idx===0?C.border:C.accent,
                      fontSize:14, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>▲</button>
                  <button onClick={()=>moveHabitDown(idx)} disabled={idx===habits.length-1}
                    style={{ width:26, height:26, borderRadius:6, border:`1px solid ${C.border}`, background:C.bg,
                      cursor:idx===habits.length-1?"default":"pointer", color:idx===habits.length-1?C.border:C.accent,
                      fontSize:14, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>▼</button>
                </div>
              )}
              <HabitCard habit={h}
                onCheckIn={checkIn}
                onEdit={()=>setEditHabit(h)}
                onDelete={()=>setConfirmDel(h)}/>
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      {habitNudge&&(
        <Modal title={t("headsUp")} onClose={()=>setHabitNudge(false)}>
          <p style={{ color:C.textSec, marginBottom:16, fontSize:13, lineHeight:1.6 }}>
            {t("habitProTip")}
          </p>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={()=>{ setHabitNudge(false); setAddingHabit(true); }}
              style={{ flex:1, padding:"10px 0", borderRadius:8, border:`1px solid ${C.border}`, background:C.surfaceAlt, color:C.textSec, fontSize:13, cursor:"pointer" }}>
              {t("addAnyway")}
            </button>
            <button onClick={()=>setHabitNudge(false)}
              style={{ flex:1, padding:"10px 0", borderRadius:8, border:"none", background:C.accent, color:C.bg, fontSize:13, fontWeight:600, cursor:"pointer" }}>
              {t("goBack")}
            </button>
          </div>
        </Modal>
      )}
      {addingHabit&&<HabitModal onClose={()=>setAddingHabit(false)} onSave={addHabit}/>}
      {editHabit&&<HabitModal onClose={()=>setEditHabit(null)} onSave={f=>updateHabit(editHabit.id,f)} habit={editHabit}/>}
      {confirmDel&&(
        <Modal title={t("deleteHabit")} onClose={()=>setConfirmDel(null)}>
          <p style={{ color:C.textSec, marginBottom:8, fontSize:13, lineHeight:1.6 }}>
            Delete <strong style={{color:C.text}}>{confirmDel.name}</strong>?
          </p>
          <p style={{ color:C.accent, fontSize:12, fontWeight:700, marginBottom:20 }}>
            {t("deleteHabitWarning")}
          </p>
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
            <Btn variant="secondary" onClick={()=>setConfirmDel(null)}>{t("cancel")}</Btn>
            <Btn variant="danger" onClick={()=>{ deleteHabit(confirmDel.id); setConfirmDel(null); }}>{t("delete")}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};
