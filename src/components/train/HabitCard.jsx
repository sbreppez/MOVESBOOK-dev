import React, { Fragment, useState } from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { Ic } from '../shared/Ic';
import { useT } from '../../hooks/useTranslation';
import { useSettings } from '../../hooks/useSettings';
import { freqDaysPerWeek } from './helpers';

export const HabitCard = ({ habit, onCheckIn, onEdit, onDelete }) => {
  const { C } = useSettings();
  const t = useT();
  const [expanded, setExpanded] = useState(false);

  const today    = new Date().toISOString().split("T")[0];
  const checkIns = habit.checkIns || [];
  const doneToday= checkIns.includes(today);
  const color    = habit.color || C.accent;
  const dpw      = freqDaysPerWeek(habit.frequency);
  const freqLabel= { daily:t("everyDay"),"2x":"2×/wk","3x":"3×/wk","4x":"4×/wk","5x":"5×/wk","6x":"6×/wk",weekdays:t("weekdaysLabel") }[habit.frequency]||t("everyDay");

  // 30-day dots
  const dots = [];
  for (let i=29; i>=0; i--) {
    const d = new Date(); d.setDate(d.getDate()-i);
    const ds = d.toISOString().split("T")[0];
    dots.push({ ds, done: checkIns.includes(ds), isToday: i===0 });
  }

  // Weekly ring
  const weekStart = (()=>{ const d=new Date(); d.setDate(d.getDate()-d.getDay()); return d.toISOString().split("T")[0]; })();
  const weekDone  = checkIns.filter(d=>d>=weekStart).length;
  const weekTarget= dpw>=7?7:dpw;
  const weekPct   = Math.min(weekDone/weekTarget,1);
  const R=36, CIRC=2*Math.PI*R;
  const dash=weekPct*CIRC, gap=CIRC-dash, offset=CIRC*0.25;

  // 7-day bar
  const last7 = Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-(6-i)); return {ds:d.toISOString().split("T")[0],isToday:i===6}; });

  return (
    <div style={{ background:C.bg, borderRadius:8, marginBottom:6, overflow:"hidden",
      borderLeft:`4px solid ${color}`,
      transition:"border-color 0.2s" }}>

      {/* Collapsed row */}
      <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 12px" }}>
        {/* Check-in */}
        <button onClick={e=>{e.stopPropagation();onCheckIn(habit.id);}}
          title={doneToday?t("tapToUndo"):t("checkInToday")}
          style={{ width:44, height:44, borderRadius:12, flexShrink:0, cursor:"pointer",
            border:`2.5px solid ${doneToday?color:C.border}`,
            background:doneToday?color:C.surface,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:doneToday?20:18, transition:"all 0.18s",
            boxShadow:doneToday?`0 2px 10px ${color}55`:"none" }}>
          {doneToday?"✓":(habit.emoji||<Ic n="target" s={16}/>)}
        </button>

        {/* Name + info — tap to expand */}
        <div style={{ flex:1, minWidth:0, cursor:"pointer" }} onClick={()=>setExpanded(x=>!x)}>
          <div style={{ fontWeight:800, fontSize:14, color:C.text, fontFamily:FONT_DISPLAY,
            letterSpacing:0.5, lineHeight:1.2,
            overflow:expanded?"visible":"hidden", textOverflow:"ellipsis", whiteSpace:expanded?"normal":"nowrap" }}>
            {habit.name}
          </div>
          {habit.why&&(
            <div style={{ fontSize:11, color:C.textSec, fontStyle:"italic", marginTop:2, lineHeight:1.4,
              overflow:expanded?"visible":"hidden", textOverflow:"ellipsis", whiteSpace:expanded?"normal":"nowrap" }}>
              {habit.why}
            </div>
          )}
          {!expanded&&<div style={{ display:"flex", alignItems:"center", gap:5, marginTop:3, flexWrap:"wrap" }}>
            {doneToday&&(
              <span style={{ fontSize:11, fontWeight:800, color:C.green, fontFamily:FONT_DISPLAY }}>
                ✓ {t("done")}
              </span>
            )}
            <span style={{ fontSize:10, color:C.textMuted, background:C.surfaceAlt,
              borderRadius:6, padding:"1px 6px", fontFamily:FONT_DISPLAY }}>{freqLabel}</span>
            {habit.timeOfDay&&habit.timeOfDay!=="anytime"&&(
              <span style={{ fontSize:10, color:C.textMuted, background:C.surfaceAlt,
                borderRadius:6, padding:"1px 6px", fontFamily:FONT_DISPLAY }}>
                {{"morning":t("morning"),"afternoon":t("afternoon"),"evening":t("evening")}[habit.timeOfDay]}
              </span>
            )}
          </div>}
        </div>

        {/* Right controls */}
        <button onClick={()=>setExpanded(x=>!x)}
          style={{ background:"none", border:"none", cursor:"pointer", padding:4, display:"flex" }}>
          <Ic n={expanded?"chevD":"chevR"} s={13} c={C.textMuted}/>
        </button>
        <button onClick={e=>{e.stopPropagation();onEdit();}}
          style={{ background:"none", border:"none", cursor:"pointer", padding:4, display:"flex" }}>
          <Ic n="edit" s={13} c={C.textMuted}/>
        </button>
        <button onClick={e=>{e.stopPropagation();onDelete();}}
          style={{ background:"none", border:"none", cursor:"pointer", padding:4, display:"flex" }}>
          <Ic n="trash" s={13} c={C.accent}/>
        </button>
      </div>

      {/* ── Expanded ── */}
      {expanded&&(
        <div style={{ borderTop:`1px solid ${C.borderLight}`, background:C.surface, padding:"14px 14px 12px" }}>

          {/* Freq + time badges */}
          <div style={{ display:"flex", gap:6, marginBottom:12, flexWrap:"wrap" }}>
            <span style={{ fontSize:9, fontWeight:800, letterSpacing:1, color, fontFamily:FONT_DISPLAY,
              background:`${color}18`, borderRadius:4, padding:"2px 8px" }}>{freqLabel}</span>
            {habit.timeOfDay&&habit.timeOfDay!=="anytime"&&(
              <span style={{ fontSize:9, fontWeight:800, letterSpacing:1, color:C.textMuted, fontFamily:FONT_DISPLAY,
                background:C.surfaceAlt, borderRadius:4, padding:"2px 8px" }}>
                {{"morning":t("morning"),"afternoon":t("afternoon"),"evening":t("evening")}[habit.timeOfDay]}
              </span>
            )}
          </div>

          {/* Ring + this week + stats */}
          <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:12 }}>
            <svg width="84" height="84" viewBox="0 0 84 84" style={{flexShrink:0}}>
              <circle cx="42" cy="42" r={R} fill="none" stroke={C.border} strokeWidth="7"/>
              {weekPct>0&&<circle cx="42" cy="42" r={R} fill="none" stroke={color} strokeWidth="7"
                strokeDasharray={`${dash} ${gap}`} strokeDashoffset={offset} strokeLinecap="round"/>}
              {weekDone>=weekTarget
                ? <Fragment>
                    <text x="42" y="36" textAnchor="middle" dominantBaseline="central"
                      fontSize="16" fill={color} fontWeight="800">✓</text>
                    <text x="42" y="52" textAnchor="middle" dominantBaseline="central"
                      fontSize="9" fill={color} fontWeight="700">{t("weekDone")}</text>
                  </Fragment>
                : <Fragment>
                    <text x="42" y="38" textAnchor="middle" dominantBaseline="central"
                      fontSize="20" fill={C.text} fontWeight="900">{weekDone}</text>
                    <text x="42" y="54" textAnchor="middle" dominantBaseline="central"
                      fontSize="9" fill={C.textMuted}>{weekTarget} ✓</text>
                  </Fragment>
              }
            </svg>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:9, color:C.textMuted, fontFamily:FONT_DISPLAY, letterSpacing:1, marginBottom:5 }}>{t("thisWeek")}</div>
              <div style={{ display:"flex", gap:3, marginBottom:10 }}>
                {last7.map(({ds,isToday})=>(
                  <div key={ds} style={{ flex:1, height:7, borderRadius:4,
                    background:checkIns.includes(ds)?color:C.surfaceAlt,
                    outline:isToday?`1.5px solid ${color}`:"none", outlineOffset:1 }}/>
                ))}
              </div>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <div style={{ fontSize:12, fontWeight:800, color:doneToday?C.green:C.textMuted, fontFamily:FONT_DISPLAY }}>
                  {doneToday?`✓ ${t("done")}`:weekDone>0?`${weekDone}/${weekTarget}`:t("thisWeek")}
                </div>
              </div>
            </div>
          </div>

          {/* 30-day dot grid */}
          <div style={{ fontSize:9, fontWeight:800, letterSpacing:1.5, color:C.textMuted,
            fontFamily:FONT_DISPLAY, marginBottom:6 }}>{t("last30Days")}</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:12 }}>
            {dots.map(dot=>(
              <div key={dot.ds} title={dot.ds}
                style={{ width:16, height:16, borderRadius:4,
                  background:dot.done?color:C.surfaceAlt,
                  opacity:dot.isToday&&!dot.done?0.4:1,
                  outline:dot.isToday?`2px solid ${color}`:"none", outlineOffset:1 }}/>
            ))}
          </div>

          {/* Notes */}
          {habit.notes&&(
            <div style={{ padding:"8px 10px", background:C.surfaceAlt, borderRadius:8,
              border:`1px solid ${C.border}`, marginBottom:12 }}>
              <div style={{ fontSize:9, fontWeight:800, letterSpacing:1.5, color:C.textMuted,
                fontFamily:FONT_DISPLAY, marginBottom:4 }}>{t("notes")}</div>
              <p style={{ fontSize:12, color:C.textSec, lineHeight:1.6, margin:0, whiteSpace:"pre-wrap" }}>{habit.notes}</p>
            </div>
          )}

          {/* Did it / Undo button */}
          <button onClick={e=>{e.stopPropagation();onCheckIn(habit.id);}}
            style={{ width:"100%", padding:"9px 0", borderRadius:10, cursor:"pointer",
              border:`1.5px solid ${doneToday?"#2e7d32":color}`,
              background:doneToday?"#1b5e2022":`${color}15`,
              display:"flex", alignItems:"center", justifyContent:"center", gap:6,
              transition:"all 0.18s" }}>
            {doneToday
              ? <Fragment><span style={{ fontSize:14, color:"#ffffff", fontFamily:FONT_DISPLAY, fontWeight:900, letterSpacing:0.5 }}>{t("done")}</span><span style={{ fontSize:16, marginLeft:6 }}>✅</span><span style={{ fontSize:10, color:"rgba(255,255,255,0.6)", fontFamily:FONT_DISPLAY, marginLeft:6 }}>· {t("undoLabel")}</span></Fragment>
              : <Fragment>
                  <Ic n="fist" s={15} c={C.textMuted}/>
                  <span style={{ fontSize:12, color, fontFamily:FONT_DISPLAY, fontWeight:800, letterSpacing:0.5 }}>{t("didIt")}</span>
                </Fragment>
            }
          </button>
        </div>
      )}
    </div>
  );
};
