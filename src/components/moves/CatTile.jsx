import React, { useState, useRef, useEffect, Fragment } from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { Ic } from '../shared/Ic';
import { Btn } from '../shared/Btn';
import { Highlight } from '../shared/Highlight';
import { masteryColor, CARD_BASE, CARD_BODY } from '../../constants/styles';
import { Modal } from '../shared/Modal';
import { useT } from '../../hooks/useTranslation';
import { usePlural } from '../../hooks/useTranslation';
import { useSettings } from '../../hooks/useSettings';
import { computeDecay } from '../../utils/masteryDecay';

const TILE_PREVIEW = 4; // number of moves shown before "show more"
export const CatTile = (props) => {
  const { name, color, total, mastered, moves=[], viewMode="tiles", showMastery=true, showMoveCount=true, onClick, onDelete, onRename, onDuplicate, onChangeColor, draggable, onDragStart, onDragOver, onDrop, isDraggingOver } = props;
  const t = useT();
  const { moveCountStr } = usePlural();
  const settings = useSettings();
  const dm = (m) => computeDecay(m, settings.decaySensitivity).displayMastery;
  const [menu,setMenu]=useState(false);
  const [confirmDel,setConfirmDel]=useState(false);
  const [renaming,setRenaming]=useState(false);
  const [draft,setDraft]=useState(name);
  const [expanded,setExpanded]=useState(false); // tiles: show more; list: expand body
  const menuRef=useRef(null);

  useEffect(()=>{
    if(!menu)return;
    const h=e=>{ if(menuRef.current&&!menuRef.current.contains(e.target))setMenu(false); };
    document.addEventListener("pointerdown",h);
    return()=>document.removeEventListener("pointerdown",h);
  },[menu]);

  const closeMenu=()=>{ setMenu(false); };

  const isTile = viewMode==="tiles";

  // ── TILE VIEW ──────────────────────────────────────────────────────────────
  if(isTile) {
    const shown = expanded ? moves : moves.slice(0, TILE_PREVIEW);
    return (
      <Fragment>
        <div
          draggable={draggable}
          onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop}
          style={{ ...CARD_BASE(), background:C.surface, borderLeft:`4px solid ${color}`, cursor:"default" }}>
          <div style={CARD_BODY()}>

          {/* Header row */}
          <div style={{ display:"flex", alignItems:"flex-start", gap:6, marginBottom:6 }}>
            {/* Title + stats — clicking opens category */}
            <div style={{ flex:1, minWidth:0 }} onClick={onClick}>
              {renaming ? (
                <input autoFocus value={draft} onChange={e=>setDraft(e.target.value)}
                  onClick={e=>e.stopPropagation()}
                  onBlur={()=>{ if(draft.trim()&&draft.trim()!==name)onRename(draft.trim()); setRenaming(false); }}
                  onKeyDown={e=>{ if(e.key==="Enter"&&draft.trim()){if(draft.trim()!==name)onRename(draft.trim());setRenaming(false);} if(e.key==="Escape"){setDraft(name);setRenaming(false);} }}
                  style={{ fontWeight:700, fontSize:16, color:C.brown, letterSpacing:1.1, fontFamily:FONT_DISPLAY,
                    background:"transparent", border:"none", borderBottom:`2px solid ${C.accent}`, outline:"none", width:"90%", padding:"1px 0" }}/>
              ) : (
                <div style={{ fontWeight:700, fontSize:16, color:C.brown, letterSpacing:1.1, fontFamily:FONT_DISPLAY, cursor:"pointer", lineHeight:1.2,
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{name}</div>
              )}
              {showMoveCount&&<div style={{ fontSize:13, color:C.textMuted, marginTop:2 }}><span style={{color:C.textMuted,fontWeight:700}}>{total}</span> {moveCountStr(total).slice(String(total).length+1)}</div>}
              {/* No progress bar on category tile header — by design */}
            </div>
            {/* ··· menu */}
            <div ref={menuRef} style={{ flexShrink:0 }}>
              <button onClick={e=>{e.stopPropagation();setMenu(m=>!m);}}
                style={{ background:"none", border:"none", cursor:"pointer", color:C.textMuted, padding:2 }}>
                <Ic n="more" s={13}/>
              </button>
              {menu&&<div onClick={e=>e.stopPropagation()}
                style={{ position:"absolute", top:30, right:6, background:C.bg, border:`1px solid ${C.border}`, borderRadius:9,
                  overflow:"hidden", zIndex:9999, minWidth:165, boxShadow:"0 8px 28px rgba(0,0,0,0.22)" }}>
                  <button onClick={()=>{setRenaming(true);setDraft(name);closeMenu();}} style={{ width:"100%", padding:"9px 13px", background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:8, color:C.text, fontSize:11, fontFamily:"inherit" }}><Ic n="edit" s={12} c={C.textSec}/>{t("rename")}</button>
                  <button onClick={()=>{onDuplicate();closeMenu();}} style={{ width:"100%", padding:"9px 13px", background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:8, color:C.text, fontSize:11, fontFamily:"inherit", borderTop:`1px solid ${C.borderLight}` }}><Ic n="copy" s={12} c={C.textSec}/>{t("duplicate")}</button>
                  <button onClick={()=>{setConfirmDel(true);closeMenu();}} style={{ width:"100%", padding:"9px 13px", background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:8, color:C.accent, fontSize:11, fontFamily:"inherit", borderTop:`1px solid ${C.border}` }}><Ic n="trash" s={12} c={C.accent}/>{t("delete")}</button>
              </div>}
            </div>
          </div>

          {/* Move list inside tile */}
          {moves.length>0&&(
            <div style={{ flex:1 }}>
              <div style={{ borderTop:`1px solid ${C.borderLight}`, paddingTop:5 }}>
                {shown.map(m=>(
                  <div key={m.id} style={{ display:"flex", alignItems:"center", gap:5, padding:"2px 0" }}>
                    <div style={{ width:5, height:5, borderRadius:"50%", background:masteryColor(dm(m)), flexShrink:0 }}/>
                    <span style={{ fontSize:13, color:C.textSec, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.name}</span>
                    {showMastery&&<span style={{ fontSize:10, color:masteryColor(dm(m)), fontWeight:700, flexShrink:0 }}>{dm(m)}%</span>}
                  </div>
                ))}
              </div>
              {moves.length>TILE_PREVIEW&&(
                <button onClick={e=>{e.stopPropagation();setExpanded(x=>!x);}}
                  style={{ background:"none", border:"none", cursor:"pointer", color:color, fontSize:11, fontWeight:700,
                    padding:"4px 0 6px", fontFamily:FONT_DISPLAY, letterSpacing:0.5, display:"flex", alignItems:"center", gap:3 }}>
                  {expanded
                    ? <Fragment><Ic n="chevD" s={14} c={color}/>{t("showLess")}</Fragment>
                    : <Fragment><Ic n="chevR" s={14} c={color}/>{t("showMore")} ({moves.length-TILE_PREVIEW} more)</Fragment>}
                </button>
              )}
            </div>
          )}
          {moves.length===0&&<div style={{ fontSize:11, color:C.textMuted, fontStyle:"italic", flex:1 }}>{t("emptyMoves")}</div>}
          </div>{/* end CARD_BODY */}
        </div>{/* end CARD_BASE */}

        {confirmDel&&<Modal title={t("deleteCategory")} onClose={()=>setConfirmDel(false)}>
          <p style={{ color:C.textSec, marginBottom:20, lineHeight:1.6 }}>Delete <strong style={{color:C.text}}>{name}</strong>? All moves inside will be deleted too.</p>
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
            <Btn variant="secondary" onClick={()=>setConfirmDel(false)}>{t("keepIt")}</Btn>
            <Btn variant="danger" onClick={()=>{onDelete();setConfirmDel(false);}}>{t("delete")}</Btn>
          </div>
        </Modal>}
      </Fragment>
    );
  }

  // ── LIST VIEW ──────────────────────────────────────────────────────────────
  return (
    <Fragment>
      <div
        draggable={draggable}
        onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop}
        style={{ position:"relative", background:C.surface, borderRadius:8, borderLeft:`4px solid ${color}`,
          cursor:"default", overflow:"visible" }}>

        {/* Header row */}
        <div style={{ display:"flex", alignItems:"center", gap:6, padding:"14px 16px 13px 16px" }}>
          {/* Expand/collapse toggle */}
          <button onClick={e=>{e.stopPropagation();setExpanded(x=>!x);}}
            style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", padding:2, flexShrink:0 }}>
            <Ic n={expanded?"chevD":"chevR"} s={14} c={C.textMuted}/>
          </button>
          {/* Title — clicking opens category */}
          <div style={{ flex:1, minWidth:0 }} onClick={onClick}>
            {renaming ? (
              <input autoFocus value={draft} onChange={e=>setDraft(e.target.value)}
                onClick={e=>e.stopPropagation()}
                onBlur={()=>{ if(draft.trim()&&draft.trim()!==name)onRename(draft.trim()); setRenaming(false); }}
                onKeyDown={e=>{ if(e.key==="Enter"&&draft.trim()){if(draft.trim()!==name)onRename(draft.trim());setRenaming(false);} if(e.key==="Escape"){setDraft(name);setRenaming(false);} }}
                style={{ fontWeight:700, fontSize:16, color:C.brown, letterSpacing:1.2, fontFamily:FONT_DISPLAY,
                  background:"transparent", border:"none", borderBottom:`2px solid ${C.accent}`, outline:"none", width:"90%", padding:"1px 0" }}/>
            ) : (
              <span style={{ fontWeight:700, fontSize:16, color:C.brown, letterSpacing:1.2, fontFamily:FONT_DISPLAY, cursor:"pointer",
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", display:"block" }}>{name}</span>
            )}
          </div>
          {/* Stats */}
          <div style={{ fontSize:13, color:C.textMuted, flexShrink:0 }}><span style={{color:C.textMuted,fontWeight:700}}>{total}</span> {moveCountStr(total).slice(String(total).length+1)}</div>
          {/* ··· menu */}
          <div ref={menuRef} style={{ flexShrink:0 }}>
            <button onClick={e=>{e.stopPropagation();setMenu(m=>!m);}}
              style={{ background:"none", border:"none", cursor:"pointer", color:C.textMuted, padding:3 }}>
              <Ic n="more" s={13}/>
            </button>
            {menu&&<div onClick={e=>e.stopPropagation()}
              style={{ position:"absolute", top:36, right:6, background:C.bg, border:`1px solid ${C.border}`, borderRadius:9,
                overflow:"hidden", zIndex:9999, minWidth:165, boxShadow:"0 8px 28px rgba(0,0,0,0.22)" }}>
                <button onClick={()=>{setRenaming(true);setDraft(name);closeMenu();}} style={{ width:"100%", padding:"9px 13px", background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:8, color:C.text, fontSize:11, fontFamily:"inherit" }}><Ic n="edit" s={12} c={C.textSec}/>{t("rename")}</button>
                <button onClick={()=>{onDuplicate();closeMenu();}} style={{ width:"100%", padding:"9px 13px", background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:8, color:C.text, fontSize:11, fontFamily:"inherit", borderTop:`1px solid ${C.borderLight}` }}><Ic n="copy" s={12} c={C.textSec}/>{t("duplicate")}</button>
                <button onClick={()=>{setConfirmDel(true);closeMenu();}} style={{ width:"100%", padding:"9px 13px", background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:8, color:C.accent, fontSize:11, fontFamily:"inherit", borderTop:`1px solid ${C.border}` }}><Ic n="trash" s={12} c={C.accent}/>{t("delete")}</button>
            </div>}
          </div>
        </div>

        {/* Expanded moves list — only when expanded */}
        {expanded&&moves.length>0&&(
          <div style={{ borderTop:`1px solid ${C.borderLight}`, padding:"4px 0 6px" }}>
            {moves.map(m=>(
              <div key={m.id} style={{ display:"flex", alignItems:"center", gap:7, padding:"5px 16px 5px 34px" }}>
                <div style={{ width:5, height:5, borderRadius:"50%", background:masteryColor(dm(m)), flexShrink:0 }}/>
                <span style={{ fontSize:13, color:C.textSec, flex:1 }}>{m.name}</span>
                {showMastery&&<span style={{ fontSize:10, color:masteryColor(dm(m)), fontWeight:700 }}>{dm(m)}%</span>}
              </div>
            ))}
          </div>
        )}
        {expanded&&moves.length===0&&(
          <div style={{ borderTop:`1px solid ${C.borderLight}`, padding:"8px 14px", fontSize:13, color:C.textMuted, fontStyle:"italic" }}>{t("emptyMovesInCat")}</div>
        )}
      </div>

      {confirmDel&&<Modal title={t("deleteCategory")} onClose={()=>setConfirmDel(false)}>
        <p style={{ color:C.textSec, marginBottom:20, lineHeight:1.6 }}>Delete <strong style={{color:C.text}}>{name}</strong>? All moves inside will be deleted too.</p>
        <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
          <Btn variant="secondary" onClick={()=>setConfirmDel(false)}>{t("keepIt")}</Btn>
          <Btn variant="danger" onClick={()=>{onDelete();setConfirmDel(false);}}>{t("delete")}</Btn>
        </div>
      </Modal>}
    </Fragment>
  );
};
