import React, { Fragment, useState, useEffect, useRef } from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY } from '../../constants/fonts';
import { IDEA_COLORS } from '../../constants/categories';
import { Ic } from '../shared/Ic';
import { useT } from '../../hooks/useTranslation';
import { menuBtnStyle } from './helpers';

export const IdeaMenu = ({ menu, onClose }) => {
  const [subColor, setSubColor] = useState(false);
  const t = useT();
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menu) return;
    setSubColor(false);
    const h = e => { if (menuRef.current && !menuRef.current.contains(e.target)) onClose(); };
    document.addEventListener("pointerdown", h);
    return () => document.removeEventListener("pointerdown", h);
  }, [menu]);

  if (!menu) return null;

  const { rect, idea, color, isGoal, isPinned, typeEmoji, typeLabel, text, title,
    onEdit, onDelete, onDuplicate, onAddToMove, onTogglePin, onChangeColor } = menu;

  // Position below the button, aligned to right edge — no transform math needed
  // rect is in real viewport coords; we use fixed positioning from viewport
  const style = {
    position: "fixed",
    top: rect.bottom + 6,
    right: window.innerWidth - rect.right - 4,
    background: C.bg,
    border: `1px solid ${C.border}`,
    borderRadius: 9,
    overflow: "hidden",
    zIndex: 9999,
    minWidth: 175,
    boxShadow: "0 8px 28px rgba(0,0,0,0.28)",
  };

  return (
    <div ref={menuRef} onClick={e=>e.stopPropagation()} style={style}>
      {!subColor ? <Fragment>
        <button onClick={()=>{ onEdit(); onClose(); }} style={menuBtnStyle(C.text,false)}>
          <span style={{fontSize:11}}>{typeEmoji}</span>{t("edit")} {typeLabel.toLowerCase()}
        </button>
        {!isGoal&&<button onClick={()=>{ onTogglePin&&onTogglePin(); onClose(); }} style={menuBtnStyle(C.text,true)}>
          <Ic n="pin" s={11} c={C.textSec}/>{isPinned?t("unpinBtn"):t("pinToTop")}
        </button>}
        <button onClick={()=>setSubColor(true)} style={{ ...menuBtnStyle(C.text,true), justifyContent:"space-between" }}>
          <span style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ width:12, height:12, borderRadius:3, background:color, display:"inline-block", flexShrink:0 }}/>
            {t("changeColour")}
          </span>
          <Ic n="chevR" s={11} c={C.textMuted}/>
        </button>
        {onAddToMove&&<button onClick={()=>{ onAddToMove(text||title); onClose(); }} style={menuBtnStyle(C.brownMid,true)}>
          <Ic n="plus" s={12} c={C.brownMid}/>{t("addToMove")}
        </button>}
        <button onClick={()=>{ onDuplicate(); onClose(); }} style={menuBtnStyle(C.text,true)}>
          <Ic n="copy" s={12} c={C.textSec}/>{t("duplicate")}
        </button>
        <button onClick={()=>{ onClose(); onDelete(); }} style={menuBtnStyle(C.accent,true)}>
          <Ic n="trash" s={12} c={C.accent}/>{t("delete")}
        </button>
      </Fragment> : <Fragment>
        <button onClick={()=>setSubColor(false)} style={{ width:"100%", padding:"8px 13px", background:C.surfaceAlt, border:"none", cursor:"pointer",
          display:"flex", alignItems:"center", gap:6, color:C.textSec, fontSize:11, fontFamily:"inherit", borderBottom:`1px solid ${C.border}` }}>← {t("back")}</button>
        <div style={{ padding:"10px 12px", display:"flex", flexWrap:"wrap", gap:7 }}>
          {IDEA_COLORS.map(pc=>(
            <button key={pc} onClick={()=>{ onChangeColor(pc); onClose(); }}
              style={{ width:24, height:24, borderRadius:5, background:pc, cursor:"pointer", outline:"none",
                border: pc===color ? `2.5px solid ${C.brown}` : `1.5px solid transparent` }}/>
          ))}
        </div>
      </Fragment>}
    </div>
  );
};
