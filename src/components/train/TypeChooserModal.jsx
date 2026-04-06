import React from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY } from '../../constants/fonts';
import { Ic } from '../shared/Ic';
import { Modal } from '../shared/Modal';
import { useT } from '../../hooks/useTranslation';

export const TypeChooserModal = ({ onClose, onChoose }) => {
  const t = useT();
  return (
  <Modal title={t("newGoal")} onClose={onClose}>
    <div style={{ display:"flex", flexDirection:"column", gap:12, padding:"8px 0" }}>
      <button onClick={()=>onChoose("goal")}
        style={{ padding:"18px 16px", background:C.surface, border:`2px solid ${C.accent}`, borderRadius:12,
          cursor:"pointer", textAlign:"left", display:"flex", alignItems:"center", gap:14 }}>
        <Ic n="target" s={28} c={C.accent}/>
        <div>
          <div style={{ fontWeight:800, fontSize:14, color:C.accent, fontFamily:FONT_DISPLAY, letterSpacing:1 }}>GOAL</div>
          <div style={{ fontSize:12, color:C.textMuted, marginTop:3 }}>{t("goalDesc")}</div>
        </div>
      </button>
      <button onClick={()=>onChoose("target")}
        style={{ padding:"18px 16px", background:C.surface, border:`2px solid ${C.accent}55`, borderRadius:12,
          cursor:"pointer", textAlign:"left", display:"flex", alignItems:"center", gap:14 }}>
        <Ic n="crosshair" s={28} c={C.accent}/>
        <div>
          <div style={{ fontWeight:800, fontSize:14, color:C.accent, fontFamily:FONT_DISPLAY, letterSpacing:1 }}>TARGET</div>
          <div style={{ fontSize:12, color:C.textMuted, marginTop:3 }}>{t("targetDesc")}</div>
        </div>
      </button>
    </div>
  </Modal>
  );
};
