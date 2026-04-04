import React, { useState } from 'react';
import { FONT_DISPLAY } from '../../constants/fonts';
import { useSettings } from '../../hooks/useSettings';
import { useT } from '../../hooks/useTranslation';
import { Ic } from '../shared/Ic';
import { Modal } from '../shared/Modal';
import { Btn } from '../shared/Btn';

export const HomeCardsSettingsModal = ({ cardOrder, cardLabels, onSave, onClose }) => {
  const { C } = useSettings();
  const t = useT();
  const [order, setOrder] = useState([...cardOrder]);

  const toggle = (id) => {
    setOrder(prev => prev.map(c => c.id === id ? { ...c, visible: !c.visible } : c));
  };

  const moveUp = (idx) => {
    if (idx <= 0) return;
    setOrder(prev => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  };

  const moveDown = (idx) => {
    if (idx >= order.length - 1) return;
    setOrder(prev => {
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  };

  return (
    <Modal title={t("homeCards")} onClose={onClose}
      footer={
        <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
          <Btn variant="secondary" onClick={onClose}>{t("cancel")}</Btn>
          <Btn variant="primary" onClick={() => onSave(order)}>{t("save")}</Btn>
        </div>
      }>
      <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
        {order.map((card, idx) => (
          <div key={card.id} style={{
            display:"flex", alignItems:"center", gap:8, padding:"10px 8px",
            borderRadius:10, background: card.visible ? `${C.accent}08` : "transparent",
            border:`1px solid ${card.visible ? C.border : C.borderLight}`,
            transition:"all 0.15s",
          }}>
            {/* Reorder arrows */}
            <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
              <button onClick={() => moveUp(idx)} disabled={idx === 0}
                style={{ background:"none", border:"none", cursor: idx === 0 ? "default" : "pointer", padding:2, opacity: idx === 0 ? 0.3 : 1 }}>
                <Ic n="chevU" s={12} c={C.textMuted}/>
              </button>
              <button onClick={() => moveDown(idx)} disabled={idx === order.length - 1}
                style={{ background:"none", border:"none", cursor: idx === order.length - 1 ? "default" : "pointer", padding:2, opacity: idx === order.length - 1 ? 0.3 : 1 }}>
                <Ic n="chevD" s={12} c={C.textMuted}/>
              </button>
            </div>

            {/* Label */}
            <span style={{ flex:1, fontSize:13, fontWeight:700, color:C.text, fontFamily:FONT_DISPLAY }}>
              {t(cardLabels[card.id] || card.id)}
            </span>

            {/* Toggle */}
            <button onClick={() => toggle(card.id)}
              style={{
                width:42, height:24, borderRadius:12, border:"none", cursor:"pointer",
                background: card.visible ? C.accent : C.border, position:"relative", transition:"background 0.2s",
                flexShrink:0,
              }}>
              <div style={{
                position:"absolute", top:3, left: card.visible ? 21 : 3, width:18, height:18, borderRadius:"50%",
                background:"#fff", transition:"left 0.2s", boxShadow:"0 1px 4px rgba(0,0,0,0.3)",
              }}/>
            </button>
          </div>
        ))}
      </div>
    </Modal>
  );
};
