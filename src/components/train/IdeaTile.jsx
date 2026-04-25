import React, { Fragment, useState, useRef, useEffect } from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { CARD_BASE, CARD_BODY } from '../../constants/styles';
import { IDEA_COLORS } from '../../constants/categories';
import { Ic } from '../shared/Ic';
import { Highlight } from '../shared/Highlight';
import { useT } from '../../hooks/useTranslation';
import { useSettings } from '../../hooks/useSettings';
import { targetProgress, goalTimeProgress } from './helpers';

export const IdeaTile = (props) => {
  const { idea, viewMode="list", onEdit, onDelete, onDuplicate, onAddToMove, onChangeColor, onTogglePin, draggable, onDragStart, onDragOver, onDrop, searchQuery="", onIncrTarget, onDecrTarget, onShowJournalHint, onDismissHint } = props;
  const t = useT();
  const { settings } = useSettings();
  const [expanded,   setExpanded]   = useState(false);
  const [menu, setMenu] = useState(false);
  const [subColor, setSubColor] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menu) return;
    const h = e => { if (menuRef.current && !menuRef.current.contains(e.target)) { setMenu(false); setSubColor(false); } };
    document.addEventListener("pointerdown", h);
    return () => document.removeEventListener("pointerdown", h);
  }, [menu]);
  const color  = idea.color || IDEA_COLORS[0];
  const title  = idea.title || "Untitled";
  const text   = idea.text  || "";
  const isGoal   = idea.type === "goal";
  const isTarget = idea.type === "target";
  const isPinned = idea.pinnedNotes || isGoal || isTarget;
  const isTile   = viewMode === "tiles";
  const typeIcon = isGoal ? "target" : isTarget ? "crosshair" : "fileText";
  const typeLabel = isGoal ? "GOAL" : isTarget ? "TARGET" : "NOTE";

  const renderMenu = (posStyle={right:0}) => (
    <div onClick={e=>e.stopPropagation()}
      style={{
        position:"absolute", top:24, ...posStyle, background:C.bg,
        border:`1px solid ${C.border}`, borderRadius:9, overflow:"hidden",
        zIndex:9999, minWidth:175, boxShadow:"0 8px 28px rgba(0,0,0,0.22)",
      }}>
      {!subColor ? (<>
        <button onClick={()=>{ setMenu(false); onEdit(); }}
          style={{ width:"100%", padding:"9px 13px", background:"none", border:"none",
            cursor:"pointer", display:"flex", alignItems:"center", gap:8,
            color:C.text, fontSize:12, fontFamily:"inherit" }}>
          <Ic n="edit" s={12} c={C.textSec}/>{t("edit")} {typeLabel.toLowerCase()}
        </button>
        {!isGoal&&!isTarget&&(
          <button onClick={()=>{ setMenu(false); onTogglePin&&onTogglePin(); }}
            style={{ width:"100%", padding:"9px 13px", background:"none", border:"none",
              cursor:"pointer", display:"flex", alignItems:"center", gap:8,
              color:C.text, fontSize:12, fontFamily:"inherit", borderTop:`1px solid ${C.border}` }}>
            <Ic n="pin" s={12} c={C.textSec}/>{isPinned?t("unpinBtn"):t("pinToTop")}
          </button>
        )}
        <button onClick={()=>setSubColor(true)}
          style={{ width:"100%", padding:"9px 13px", background:"none", border:"none",
            cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between",
            color:C.text, fontSize:12, fontFamily:"inherit", borderTop:`1px solid ${C.border}` }}>
          <span style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ width:12, height:12, borderRadius:3, background:color, display:"inline-block", flexShrink:0 }}/>
            {t("changeColour")}
          </span>
          <Ic n="chevR" s={11} c={C.textMuted}/>
        </button>
        {onAddToMove&&(
          <button onClick={()=>{ setMenu(false); onAddToMove(text||title); }}
            style={{ width:"100%", padding:"9px 13px", background:"none", border:"none",
              cursor:"pointer", display:"flex", alignItems:"center", gap:8,
              color:C.text, fontSize:12, fontFamily:"inherit", borderTop:`1px solid ${C.border}` }}>
            <Ic n="plus" s={12} c={C.textSec}/>{t("addToMove")}
          </button>
        )}
        <button onClick={()=>{ setMenu(false); onDuplicate(); }}
          style={{ width:"100%", padding:"9px 13px", background:"none", border:"none",
            cursor:"pointer", display:"flex", alignItems:"center", gap:8,
            color:C.text, fontSize:12, fontFamily:"inherit", borderTop:`1px solid ${C.border}` }}>
          <Ic n="copy" s={12} c={C.textSec}/>{t("duplicate")}
        </button>
        <button onClick={()=>{ setMenu(false); onDelete(); }}
          style={{ width:"100%", padding:"9px 13px", background:"none", border:"none",
            cursor:"pointer", display:"flex", alignItems:"center", gap:8,
            color:C.accent, fontSize:12, fontFamily:"inherit", borderTop:`1px solid ${C.border}` }}>
          <Ic n="trash" s={12} c={C.accent}/>{t("delete")}
        </button>
      </>) : (<>
        <button onClick={()=>setSubColor(false)}
          style={{ width:"100%", padding:"8px 13px", background:C.surfaceAlt, border:"none", cursor:"pointer",
            display:"flex", alignItems:"center", gap:6, color:C.textSec, fontSize:11, fontFamily:"inherit",
            borderBottom:`1px solid ${C.border}` }}>
          ← {t("back")}
        </button>
        <div style={{ padding:"10px 12px", display:"flex", flexWrap:"wrap", gap:7 }}>
          {IDEA_COLORS.map(pc=>(
            <button key={pc} onClick={()=>{ onChangeColor(pc); setMenu(false); setSubColor(false); }}
              style={{ width:24, height:24, borderRadius:5, background:pc, cursor:"pointer", outline:"none",
                border: pc===color ? `2.5px solid ${C.brown}` : `1.5px solid transparent` }}/>
          ))}
        </div>
      </>)}
    </div>
  );

  if (isTile) {
    return (
      <div draggable={draggable} onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop}
        onClick={isGoal ? ()=>setExpanded(x=>!x) : undefined}
        style={{ ...CARD_BASE(), background:C.surface, borderLeft:`4px solid ${color}`, cursor:isGoal?"pointer":"default", overflow:"visible" }}>
        <div style={{...CARD_BODY(), overflow:"visible"}}>
          {/* Title row */}
          <div style={{ display:"flex", alignItems:"flex-start", gap:6, marginBottom:6 }}>
            {/* Type icon */}
            <span style={{ flexShrink:0, paddingTop:1 }} title={typeLabel}><Ic n={typeIcon} s={14}/></span>
            <div style={{ flex:1, minWidth:0, display:"flex", alignItems:"center", gap:4 }} onClick={onEdit}>
              <div style={{ fontWeight:800, fontSize:13, color: isGoal ? C.accent : C.brown, letterSpacing:1.1, fontFamily:FONT_DISPLAY, cursor:"pointer", lineHeight:1.3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                <Highlight text={title.toUpperCase()} query={searchQuery}/>
              </div>
              {isPinned && !isGoal && !isTarget && <Ic n="pin" s={10} c={C.accent} style={{flexShrink:0}}/>}
            </div>
            <div style={{ flexShrink:0, display:"flex", alignItems:"center", gap:2 }}>
              {idea.link&&settings.linkOnCard==="both"&&(
                <a href={idea.link.startsWith("http")?idea.link:"https://"+idea.link} target="_blank" rel="noopener noreferrer"
                  onClick={e=>e.stopPropagation()}
                  style={{ display:"flex", alignItems:"center", justifyContent:"center",
                    width:22, height:22, color:C.textMuted, textDecoration:"none" }}
                  title="Open link"><Ic n="extLink" s={13} c={C.textMuted}/></a>
              )}
              <div ref={menuRef} style={{ position:"relative" }}>
                <button onClick={e=>{ e.stopPropagation(); setMenu(m=>!m); setSubColor(false); }}
                  style={{ background:"none", border:"none", cursor:"pointer", color:C.textMuted, padding:2 }}>
                  <Ic n="more" s={13}/>
                </button>
                {menu && renderMenu(menuRef.current?.getBoundingClientRect().right > window.innerWidth / 2 ? {right:0} : {left:0})}
              </div>
            </div>
          </div>
          {/* Content preview */}
          {isTarget ? (
            <div style={{ flex:1 }}>
              {/* Big counter */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                <div style={{ fontFamily:FONT_DISPLAY }}>
                  <span style={{ fontSize:22, fontWeight:900, color }}>{onIncrTarget ? idea.current||0 : idea.current||0}</span>
                  <span style={{ fontSize:11, color:C.textMuted, marginLeft:3 }}>/ {idea.target} {idea.unit}</span>
                </div>
                <div style={{ display:"flex", gap:4 }}>
                  <button onClick={e=>{ e.stopPropagation(); onDecrTarget&&onDecrTarget(); }}
                    style={{ width:26, height:26, borderRadius:6, border:`1px solid ${C.border}`, background:C.surface,
                      fontSize:14, cursor:"pointer", color:C.textSec, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>{"−"}</button>
                  <button onClick={e=>{ e.stopPropagation(); onIncrTarget&&onIncrTarget(); }}
                    style={{ width:26, height:26, borderRadius:6, border:`1px solid ${color}`, background:`${color}20`,
                      fontSize:14, cursor:"pointer", color, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>+</button>
                </div>
              </div>
              {/* Progress bar — red→green */}
              {(()=>{ const tp=targetProgress(idea.current||0, idea.target); return (
                <div>
                  <div style={{ height:4, borderRadius:2, background:C.border }}>
                    <div style={{ height:"100%", width:`${tp.pct}%`, borderRadius:2, background:tp.color, transition:"width 0.3s" }}/>
                  </div>
                  <div style={{ fontSize:10, color:tp.color, fontWeight:700, fontFamily:FONT_DISPLAY, letterSpacing:0.5, marginTop:2 }}>{tp.label}</div>
                </div>
              );})()}
              {idea.byWhen&&<div style={{ fontSize:10, color:C.textMuted, marginTop:4 }}><Ic n="calendar" s={10}/> {idea.byWhen}</div>}
            </div>
          ) : isGoal ? (
            <div style={{ flex:1 }}>
              <div style={{ fontSize:11, color:C.textMuted, fontFamily:FONT_BODY }}>
                {idea.byWhen ? <span><Ic n="calendar" s={10}/> <strong style={{color:C.textSec}}>{idea.byWhen}</strong></span> : <span style={{fontStyle:"italic"}}>{t("noDeadline")}</span>}
              {idea.byWhen&&settings.showDeadlineIndicator!==false&&(()=>{ const tp=goalTimeProgress(idea.createdDate||idea.date, idea.byWhen); if(!tp) return null; return (
                <span style={{ fontSize:10, color:tp.color, fontWeight:700, fontFamily:FONT_DISPLAY, letterSpacing:0.5, marginLeft:6 }}>{tp.label}</span>
              );})()}
              </div>
              {idea.steps&&idea.steps.filter(s=>s).length>0&&(
                <div style={{ marginTop:6 }}>
                  {(expanded ? idea.steps.filter(s=>s) : idea.steps.filter(s=>s).slice(0,2)).map((s,i)=>(
                    <div key={i} style={{ fontSize:11, color:C.textSec, display:"flex", gap:5, marginTop:3 }}>
                      <span style={{ color:color, fontWeight:800, fontFamily:FONT_DISPLAY, flexShrink:0 }}>{i+1}.</span>
                      <span style={{ overflow:expanded?"visible":"hidden", textOverflow:"ellipsis", whiteSpace:expanded?"normal":"nowrap" }}>{s}</span>
                    </div>
                  ))}
                </div>
              )}
              {!expanded&&idea.steps&&idea.steps.filter(s=>s).length>2&&(
                <div style={{ fontSize:10, color:C.textMuted, marginTop:4, fontStyle:"italic" }}>tap to see all · {idea.steps.filter(s=>s).length} steps</div>
              )}
              {expanded&&(
                <div style={{ marginTop:10, borderTop:`1px solid ${C.borderLight}`, paddingTop:8, display:"flex", flexDirection:"column", gap:8 }}>
                  {idea.why&&(
                    <div>
                      <div style={{ fontSize:10, fontWeight:800, letterSpacing:1.5, color:C.textMuted, fontFamily:FONT_DISPLAY, marginBottom:3 }}>WHY</div>
                      <p style={{ fontSize:11, color:C.textSec, margin:0, lineHeight:1.5 }}>{idea.why}</p>
                    </div>
                  )}
                  {(idea.daysPerWeek||idea.sessionLength||idea.trainWhere)&&(
                    <div>
                      <div style={{ fontSize:10, fontWeight:800, letterSpacing:1.5, color:C.textMuted, fontFamily:FONT_DISPLAY, marginBottom:4 }}>COMMITMENTS</div>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                        {idea.daysPerWeek&&<span style={{ fontSize:10, color, background:`${color}18`, borderRadius:4, padding:"2px 7px", fontFamily:FONT_DISPLAY, fontWeight:700 }}><Ic n="calendar" s={10}/> {idea.daysPerWeek}</span>}
                        {idea.sessionLength&&<span style={{ fontSize:10, color:C.textSec, background:C.surfaceAlt, borderRadius:4, padding:"2px 7px", fontFamily:FONT_DISPLAY }}><Ic n="timer" s={10}/> {idea.sessionLength}</span>}
                        {idea.trainWhere&&<span style={{ fontSize:10, color:C.textSec, background:C.surfaceAlt, borderRadius:4, padding:"2px 7px", fontFamily:FONT_DISPLAY }}><Ic n="mapPin" s={10}/> {idea.trainWhere}</span>}
                      </div>
                    </div>
                  )}
                  {idea.obstacles&&(
                    <div>
                      <div style={{ fontSize:10, fontWeight:800, letterSpacing:1.5, color:C.textMuted, fontFamily:FONT_DISPLAY, marginBottom:3 }}>OBSTACLES</div>
                      <p style={{ fontSize:11, color:C.textSec, margin:0, lineHeight:1.5 }}>{idea.obstacles}</p>
                    </div>
                  )}
                  <div style={{ fontSize:10, color:C.textMuted, textAlign:"center", marginTop:2 }}>tap to collapse</div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ fontSize:13, color:C.textSec, lineHeight:1.5, flex:1,
              overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
              <Highlight text={text||""} query={searchQuery}/>
            </div>
          )}
          {(isGoal||isTarget)&&onShowJournalHint&&(
            <div onClick={e=>{e.stopPropagation(); onDismissHint&&onDismissHint();}}
              style={{ marginTop:6, padding:"5px 8px", background:`${color}18`, borderRadius:6,
                display:"flex", alignItems:"center", gap:5, cursor:"pointer", minWidth:0 }}>
              <Ic n="book" s={11} c={C.textSec}/>
              <span style={{ fontSize:10, color, fontWeight:700, fontFamily:FONT_DISPLAY, letterSpacing:0.3,
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>
                {t("journalHint")}
              </span>
              <Ic n="x" s={10} c={color}/>
            </div>
          )}
          <button onClick={e=>{e.stopPropagation();onEdit();}}
            style={{ background:"none", border:"none", cursor:"pointer", color:color, fontSize:11, fontWeight:700,
              padding:"5px 0 0", fontFamily:FONT_DISPLAY, display:"flex", alignItems:"center", gap:3, alignSelf:"flex-start" }}>
            <Ic n="chevR" s={10} c={color}/>{t("openBtn")}
          </button>
        </div>
      </div>
    );
  }

  // ── LIST VIEW ──────────────────────────────────────────────────────────────
  return (
    <div style={{ display:"contents" }}>
      <div
        draggable={draggable}
        onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop}
        style={{ position:"relative", background:C.surface, border:"none", borderRadius:8,
          borderLeft:`4px solid ${color}`, cursor:"default", overflow:"visible" }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 8px 10px 8px" }}>
          <button onClick={e=>{e.stopPropagation();setExpanded(x=>!x);}}
            style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", padding:2, flexShrink:0 }}>
            <Ic n={expanded?"chevD":"chevR"} s={13} c={C.textMuted}/>
          </button>
          {/* Type icon */}
          <span style={{ flexShrink:0 }} title={typeLabel}><Ic n={typeIcon} s={13}/></span>
          <div style={{ flex:1, minWidth:0 }} onClick={onEdit}>
            <span style={{ fontWeight:800, fontSize:14, color: isGoal ? C.accent : C.brown, letterSpacing:1.2, fontFamily:FONT_DISPLAY, cursor:"pointer", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", display:"flex", alignItems:"center" }}>
              <Highlight text={title.toUpperCase()} query={searchQuery}/>
              {isPinned && !isGoal && !isTarget && <Ic n="pin" s={10} c={C.accent} style={{flexShrink:0, marginLeft:4}}/>}
            </span>
            {/* Journey Goal: date + days to go */}
            {isGoal&&(()=>{
              const tp = goalTimeProgress(idea.createdDate||idea.date, idea.byWhen);
              return (
                <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:2, flexWrap:"wrap" }}>
                  {idea.byWhen&&<span style={{ fontSize:11, color:C.textMuted }}><Ic n="calendar" s={10}/> {idea.byWhen}</span>}
                  {tp&&settings.showDeadlineIndicator!==false&&<span style={{ fontSize:11, fontWeight:800, color:tp.color, fontFamily:FONT_DISPLAY }}>{tp.label}</span>}
                </div>
              );
            })()}
            {/* Target Goal: X to go */}
            {isTarget&&(()=>{
              const remaining = (idea.target||0) - (idea.current||0);
              const tp = targetProgress(idea.current||0, idea.target||0);
              return (
                <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:2, flexWrap:"wrap" }}>
                  <span style={{ fontSize:11, fontWeight:800, color:tp.color, fontFamily:FONT_DISPLAY }}>
                    {idea.current||0} / {idea.target} {idea.unit}
                  </span>
                  {remaining > 0
                    ? <span style={{ fontSize:11, color:C.textMuted }}>{"·"} {remaining} {t("toGo")}</span>
                    : <span style={{ fontSize:11, fontWeight:800, color:tp.color, fontFamily:FONT_DISPLAY }}>{"·"} {tp.label}</span>
                  }
                </div>
              );
            })()}
          </div>
          <div style={{ flexShrink:0, display:"flex", alignItems:"center", gap:2 }}>
            {idea.link&&settings.linkOnCard==="both"&&(
              <a href={idea.link.startsWith("http")?idea.link:"https://"+idea.link} target="_blank" rel="noopener noreferrer"
                onClick={e=>e.stopPropagation()}
                style={{ display:"flex", alignItems:"center", justifyContent:"center",
                  width:22, height:22, color:C.textMuted, textDecoration:"none" }}
                title="Open link"><Ic n="extLink" s={13} c={C.textMuted}/></a>
            )}
            <div ref={menuRef} style={{ position:"relative" }}>
              <button onClick={e=>{ e.stopPropagation(); setMenu(m=>!m); setSubColor(false); }}
                style={{ background:"none", border:"none", cursor:"pointer", color:C.textMuted, padding:3 }}>
                <Ic n="more" s={13}/>
              </button>
              {menu && renderMenu()}
            </div>
          </div>
        </div>
        {expanded&&(
          <div style={{ borderTop:`1px solid ${C.borderLight}`, padding:"8px 12px 12px 30px" }}>
            {isTarget ? (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {/* Counter row */}
                <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                  <div style={{ fontFamily:FONT_DISPLAY }}>
                    <span style={{ fontSize:28, fontWeight:900, color }}>{idea.current||0}</span>
                    <span style={{ fontSize:13, color:C.textMuted, marginLeft:4 }}>/ {idea.target} {idea.unit}</span>
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    <button onClick={e=>{ e.stopPropagation(); onDecrTarget&&onDecrTarget(); }}
                      style={{ width:32, height:32, borderRadius:8, border:`1px solid ${C.border}`, background:C.surface,
                        fontSize:16, cursor:"pointer", color:C.textSec, fontWeight:700 }}>{"−"}</button>
                    <button onClick={e=>{ e.stopPropagation(); onIncrTarget&&onIncrTarget(); }}
                      style={{ width:32, height:32, borderRadius:8, border:`1px solid ${color}`, background:`${color}20`,
                        fontSize:16, cursor:"pointer", color, fontWeight:700 }}>+</button>
                  </div>
                </div>
                {/* Progress bar */}
                {(()=>{ const tp=targetProgress(idea.current||0,idea.target); return (
                  <div>
                    <div style={{ height:6, borderRadius:3, background:C.border }}>
                      <div style={{ height:"100%", width:`${tp.pct}%`, borderRadius:3, background:tp.color, transition:"width 0.4s" }}/>
                    </div>
                    <div style={{ fontSize:10, color:tp.color, fontWeight:800, fontFamily:FONT_DISPLAY, letterSpacing:0.5, marginTop:3 }}>{tp.label}</div>
                  </div>
                );})()}
                {idea.byWhen&&<div style={{ fontSize:11, color:C.textMuted }}><Ic n="calendar" s={10}/> {t("deadlineColon")} {idea.byWhen}</div>}
                {idea.autoLink&&<div style={{ fontSize:10, color:C.textMuted, fontStyle:"italic" }}>{t("autoLinkedMoveLib")}</div>}
              </div>
            ) : isGoal ? (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {idea.why&&<div><span style={{ fontSize:10, fontWeight:800, color:C.textMuted, letterSpacing:1, fontFamily:FONT_DISPLAY }}>{t("whyGoal")}</span><p style={{ fontSize:13, color:C.textSec, marginTop:2 }}>{idea.why}</p></div>}
                {idea.steps&&idea.steps.filter(s=>s).length>0&&(
                  <div><span style={{ fontSize:10, fontWeight:800, color:C.textMuted, letterSpacing:1, fontFamily:FONT_DISPLAY }}>{t("threeMainSteps")}</span>
                    {idea.steps.filter(s=>s).map((s,i)=>(
                      <div key={i} style={{ fontSize:13, color:C.textSec, display:"flex", gap:5, marginTop:3 }}>
                        <span style={{ color, fontWeight:800, fontFamily:FONT_DISPLAY, flexShrink:0 }}>{i+1}.</span><span>{s}</span>
                      </div>
                    ))}
                  </div>
                )}
                {(idea.daysPerWeek||idea.sessionLength||idea.trainWhere)&&<div><span style={{ fontSize:10, fontWeight:800, color:C.textMuted, letterSpacing:1, fontFamily:FONT_DISPLAY }}>{t("commitments")}</span><p style={{ fontSize:13, color:C.textSec, marginTop:2 }}>{[idea.daysPerWeek,idea.sessionLength,idea.trainWhere].filter(Boolean).join(" · ")}</p></div>}
                {idea.obstacles&&<div><span style={{ fontSize:10, fontWeight:800, color:C.textMuted, letterSpacing:1, fontFamily:FONT_DISPLAY }}>{t("obstacles")}</span><p style={{ fontSize:13, color:C.textSec, marginTop:2 }}>{idea.obstacles}</p></div>}
              </div>
            ) : (
              <Fragment>
                <span style={{ fontSize:13, color:C.textSec, lineHeight:1.5, whiteSpace:"pre-wrap", wordBreak:"break-word" }}>
                  <Highlight text={text} query={searchQuery}/>
                </span>
              </Fragment>
            )}
          </div>
        )}
      </div>

    </div>
  );
};
