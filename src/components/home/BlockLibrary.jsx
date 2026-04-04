import React, { useState } from 'react';
import { FONT_DISPLAY } from '../../constants/fonts';
import { useSettings } from '../../hooks/useSettings';
import { useT } from '../../hooks/useTranslation';
import { Ic } from '../shared/Ic';
import { Btn } from '../shared/Btn';
import { BlockModal } from './BlockModal';

const REPEAT_LABEL = {
  daily: "repeatEveryDay",
  specificDays: "repeatSpecificDays",
  workdays: "repeatWorkdays",
  none: "repeatNone",
};
const TOD_LABEL = {
  morning: "todMorning",
  midday: "todMidday",
  afternoon: "todAfternoon",
  evening: "todEvening",
};

export const BlockLibrary = ({ blocks, setBlocks, onClose }) => {
  const { C } = useSettings();
  const t = useT();
  const [editBlock, setEditBlock] = useState(null);
  const [addMode, setAddMode] = useState(false);

  const handleSave = (fields) => {
    if (editBlock) {
      setBlocks(prev => prev.map(b => b.id === editBlock.id ? { ...b, ...fields } : b));
    } else {
      setBlocks(prev => [...prev, { id: Date.now(), ...fields }]);
    }
  };

  const handleDelete = () => {
    if (editBlock) {
      setBlocks(prev => prev.filter(b => b.id !== editBlock.id));
    }
  };

  return (
    <div style={{ position:"absolute", inset:0, zIndex:900, background:C.bg, display:"flex", flexDirection:"column", overflow:"hidden" }}>
      {/* Header */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"13px 18px", borderBottom:`1px solid ${C.border}`, flexShrink:0, background:C.bg, zIndex:10,
      }}>
        <span style={{ fontWeight:800, fontSize:15, letterSpacing:2, color:C.brown, fontFamily:FONT_DISPLAY }}>
          {t("blockLibrary")}
        </span>
        <button onClick={onClose}
          style={{ background:C.surfaceAlt, border:`1px solid ${C.border}`, cursor:"pointer", color:C.textSec, padding:5, borderRadius:7, display:"flex" }}>
          <Ic n="x" s={14}/>
        </button>
      </div>

      {/* List */}
      <div style={{ flex:1, overflowY:"auto", padding:"10px 14px" }}>
        {blocks.length === 0 && (
          <div style={{ textAlign:"center", padding:"40px 20px", color:C.textMuted }}>
            <div style={{ fontSize:32, marginBottom:8 }}>📦</div>
            <div style={{ fontSize:13, fontWeight:700, fontFamily:FONT_DISPLAY, marginBottom:6 }}>{t("noBlocksYet")}</div>
            <div style={{ fontSize:12 }}>{t("noBlocksHint")}</div>
          </div>
        )}
        {blocks.map(b => (
          <button key={b.id} onClick={() => setEditBlock(b)}
            style={{
              display:"flex", alignItems:"center", gap:12, width:"100%", textAlign:"left",
              padding:"12px 14px", marginBottom:6, borderRadius:10, cursor:"pointer",
              background:C.surface, border:`1px solid ${C.border}`, transition:"background 0.15s",
            }}>
            <span style={{ fontSize:20, flexShrink:0 }}>{b.emoji || "📦"}</span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:800, fontSize:13, fontFamily:FONT_DISPLAY, letterSpacing:0.3, color:C.text,
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {b.name}
                {b.duration > 0 && <span style={{ fontWeight:600, fontSize:11, color:C.textMuted, marginLeft:6 }}>· {b.duration} min</span>}
              </div>
              <div style={{ fontSize:11, color:C.textMuted, marginTop:2 }}>
                {t(REPEAT_LABEL[b.repeat?.type] || "repeatEveryDay")} · {t(TOD_LABEL[b.timeOfDay] || "todMorning")}
              </div>
            </div>
            <Ic n="chevR" s={14} c={C.textMuted}/>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding:"12px 18px", borderTop:`1px solid ${C.border}`, flexShrink:0 }}>
        <Btn variant="primary" onClick={() => setAddMode(true)} style={{ width:"100%" }}>
          {t("addBlock")}
        </Btn>
      </div>

      {/* Modals */}
      {editBlock && (
        <BlockModal block={editBlock} onClose={() => setEditBlock(null)} onSave={handleSave} onDelete={handleDelete}/>
      )}
      {addMode && (
        <BlockModal onClose={() => setAddMode(false)} onSave={handleSave}/>
      )}
    </div>
  );
};
