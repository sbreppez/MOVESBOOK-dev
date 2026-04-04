import React from 'react';
import { FONT_DISPLAY } from '../../constants/fonts';
import { useSettings } from '../../hooks/useSettings';
import { Ic } from '../shared/Ic';

export const BlockCard = ({ block, isChecked, onCheck, onDismiss, onEdit }) => {
  const { C } = useSettings();

  return (
    <div
      onClick={onEdit}
      style={{
        display:"flex", alignItems:"center", gap:10,
        padding:"10px 12px", marginBottom:6, borderRadius:10, cursor:"pointer",
        background: isChecked ? `${C.green}0a` : C.surface,
        borderTop: `1px solid ${isChecked ? `${C.green}30` : C.border}`,
        borderRight: `1px solid ${isChecked ? `${C.green}30` : C.border}`,
        borderBottom: `1px solid ${isChecked ? `${C.green}30` : C.border}`,
        borderLeft: `3px solid ${isChecked ? C.green : C.border}`,
        opacity: isChecked ? 0.65 : 1,
        transition:"all 0.2s",
      }}>
      {/* Emoji */}
      <span style={{ fontSize:20, flexShrink:0, width:28, textAlign:"center" }}>
        {block.emoji || "📦"}
      </span>

      {/* Name + duration */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{
          fontWeight:800, fontSize:13, fontFamily:FONT_DISPLAY, letterSpacing:0.3,
          color: isChecked ? C.textMuted : C.text,
          textDecoration: isChecked ? "line-through" : "none",
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
        }}>
          {block.name}
          {block.duration > 0 && (
            <span style={{ fontWeight:600, fontSize:11, color:C.textMuted, marginLeft:6 }}>
              · {block.duration} min
            </span>
          )}
        </div>
        {block.description && (
          <div style={{
            fontSize:11, color:C.textMuted, marginTop:2, lineHeight:1.3,
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
          }}>
            {block.description}
          </div>
        )}
      </div>

      {/* Checkbox (if checkable) */}
      {block.checkable && (
        <button onClick={e => { e.stopPropagation(); onCheck(); }}
          style={{
            width:32, height:32, borderRadius:8, flexShrink:0, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
            background: isChecked ? C.green : "transparent",
            border: `2px solid ${isChecked ? C.green : C.border}`,
            transition:"all 0.15s",
          }}>
          {isChecked && <Ic n="check" s={16} c="#fff"/>}
        </button>
      )}

      {/* Dismiss X */}
      <button onClick={e => { e.stopPropagation(); onDismiss(); }}
        style={{
          width:28, height:28, borderRadius:6, flexShrink:0, cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center",
          background:"transparent", border:"none", color:C.textMuted,
          opacity:0.5,
        }}>
        <Ic n="x" s={14} c={C.textMuted}/>
      </button>
    </div>
  );
};
