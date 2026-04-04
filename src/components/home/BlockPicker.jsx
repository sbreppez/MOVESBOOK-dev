import React from 'react';
import { FONT_DISPLAY } from '../../constants/fonts';
import { useSettings } from '../../hooks/useSettings';
import { useT } from '../../hooks/useTranslation';
import { Ic } from '../shared/Ic';

export const BlockPicker = ({ blocks, scheduledIds, onPick, onClose }) => {
  const { C } = useSettings();
  const t = useT();

  const available = blocks.filter(b => !scheduledIds.includes(b.id));

  return (
    <div onClick={onClose}
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:1000,
        display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div onClick={e => e.stopPropagation()}
        style={{
          width:"100%", maxWidth:420, maxHeight:"60vh", background:C.bg,
          borderRadius:"18px 18px 0 0", border:`1px solid ${C.border}`, borderBottom:"none",
          display:"flex", flexDirection:"column", overflow:"hidden",
          boxShadow:"0 -8px 40px rgba(0,0,0,0.3)",
        }}>
        {/* Header */}
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"14px 18px", borderBottom:`1px solid ${C.borderLight}`, flexShrink:0,
        }}>
          <span style={{ fontWeight:800, fontSize:14, letterSpacing:1.5, color:C.text, fontFamily:FONT_DISPLAY }}>
            {t("addBlock")}
          </span>
          <button onClick={onClose}
            style={{ background:"none", border:"none", cursor:"pointer", color:C.textMuted, padding:4 }}>
            <Ic n="x" s={16}/>
          </button>
        </div>

        {/* List */}
        <div style={{ flex:1, overflowY:"auto", padding:"8px 14px" }}>
          {available.length === 0 && (
            <div style={{ textAlign:"center", padding:"24px 16px", color:C.textMuted, fontSize:13 }}>
              {t("allBlocksScheduled")}
            </div>
          )}
          {available.map(b => (
            <button key={b.id} onClick={() => { onPick(b.id); onClose(); }}
              style={{
                display:"flex", alignItems:"center", gap:12, width:"100%", textAlign:"left",
                padding:"12px 14px", marginBottom:4, borderRadius:10, cursor:"pointer",
                background:C.surface, border:`1px solid ${C.border}`, transition:"background 0.15s",
              }}>
              <span style={{ fontSize:18, flexShrink:0 }}>{b.emoji || "📦"}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:800, fontSize:13, fontFamily:FONT_DISPLAY, color:C.text,
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {b.name}
                </div>
                {b.duration > 0 && (
                  <div style={{ fontSize:11, color:C.textMuted, marginTop:1 }}>{b.duration} min</div>
                )}
              </div>
              <Ic n="plus" s={16} c={C.accent}/>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
