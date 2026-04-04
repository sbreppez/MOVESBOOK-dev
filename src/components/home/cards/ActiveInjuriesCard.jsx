import React, { useState } from 'react';
import { FONT_DISPLAY, FONT_BODY } from '../../../constants/fonts';
import { useSettings } from '../../../hooks/useSettings';
import { useT } from '../../../hooks/useTranslation';
import { Ic } from '../../shared/Ic';
import { Modal } from '../../shared/Modal';
import { Btn } from '../../shared/Btn';

const InjuryModal = ({ injury, onSave, onClose, C, t }) => {
  const [f, setF] = useState({
    bodyPart: injury?.bodyPart || "",
    side: injury?.side || null,
    startDate: injury?.startDate || new Date().toISOString().split("T")[0],
    notes: injury?.notes || "",
  });

  const lbl = { display:"block", fontSize:11, fontWeight:800, letterSpacing:1.5, color:C.textSec, fontFamily:FONT_DISPLAY, marginBottom:6, marginTop:14 };
  const inp = { width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 12px", color:C.text, fontSize:14, outline:"none", boxSizing:"border-box" };
  const pill = (active) => ({
    padding:"6px 14px", borderRadius:20, cursor:"pointer", fontSize:12, fontWeight:700,
    fontFamily:FONT_DISPLAY, border:`1.5px solid ${active ? C.accent : C.border}`,
    background: active ? `${C.accent}20` : "transparent", color: active ? C.accent : C.textMuted,
  });

  return (
    <Modal title={injury ? t("editInjury") : t("addInjury")} onClose={onClose}
      footer={
        <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
          <Btn variant="secondary" onClick={onClose}>{t("cancel")}</Btn>
          <Btn variant="primary" onClick={() => { if(f.bodyPart.trim()) onSave(f); }} disabled={!f.bodyPart.trim()}>{t("save")}</Btn>
        </div>
      }>
      <label style={lbl}>{t("bodyPart")}</label>
      <input value={f.bodyPart} onChange={e => setF(p=>({...p, bodyPart:e.target.value}))} placeholder="Wrist, Knee, Shoulder..." style={inp}/>

      <label style={lbl}>{t("side")}</label>
      <div style={{ display:"flex", gap:6 }}>
        {[null, "left", "right"].map(s => (
          <button key={s||"none"} onClick={() => setF(p=>({...p, side:s}))} style={pill(f.side === s)}>
            {s === null ? "N/A" : t(s === "left" ? "leftSide" : "rightSide")}
          </button>
        ))}
      </div>

      <label style={lbl}>{t("startDate")}</label>
      <input type="date" value={f.startDate} onChange={e => setF(p=>({...p, startDate:e.target.value}))} style={inp}/>

      <label style={lbl}>{t("notes")}</label>
      <textarea value={f.notes} onChange={e => setF(p=>({...p, notes:e.target.value}))} rows={2} style={{ ...inp, resize:"vertical", fontFamily:"inherit" }}/>
    </Modal>
  );
};

export const ActiveInjuriesCard = ({ injuries, setInjuries }) => {
  const { C } = useSettings();
  const t = useT();
  const [showModal, setShowModal] = useState(false);
  const [editInjury, setEditInjury] = useState(null);

  const active = (injuries || []).filter(i => !i.resolved);
  if (active.length === 0 && !showModal) return null;

  const daysSince = (dateStr) => {
    const d = new Date(dateStr + "T12:00:00");
    const now = new Date();
    return Math.max(1, Math.floor((now - d) / 86400000));
  };

  const handleSave = (fields) => {
    if (editInjury) {
      setInjuries(prev => prev.map(i => i.id === editInjury.id ? { ...i, ...fields } : i));
    } else {
      setInjuries(prev => [...prev, { id: Date.now(), ...fields, resolved: false }]);
    }
    setShowModal(false);
    setEditInjury(null);
  };

  const handleResolve = (id) => {
    setInjuries(prev => prev.map(i => i.id === id ? { ...i, resolved: true } : i));
  };

  return (
    <>
      <div style={{
        background:C.surface, borderRadius:14, border:`1.5px solid ${C.border}`,
        borderLeft:`4px solid ${C.yellow}`, padding:"12px 14px", marginBottom:8,
      }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
          <span style={{ fontSize:11, fontWeight:800, letterSpacing:1.5, color:C.textMuted, fontFamily:FONT_DISPLAY }}>
            {t("activeInjuries")}
          </span>
          <button onClick={() => { setEditInjury(null); setShowModal(true); }}
            style={{ background:"none", border:"none", cursor:"pointer", padding:4 }}>
            <Ic n="plus" s={14} c={C.accent}/>
          </button>
        </div>
        {active.map(inj => (
          <div key={inj.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"6px 0", borderTop:`1px solid ${C.borderLight}` }}>
            <div>
              <span style={{ fontSize:13, fontWeight:700, color:C.text, fontFamily:FONT_BODY }}>
                {inj.side ? `${t(inj.side === "left" ? "leftSide" : "rightSide")} ` : ""}{inj.bodyPart}
              </span>
              <span style={{ fontSize:11, color:C.textMuted, marginLeft:8 }}>
                — Day {daysSince(inj.startDate)}
              </span>
            </div>
            <div style={{ display:"flex", gap:6 }}>
              <button onClick={() => { setEditInjury(inj); setShowModal(true); }}
                style={{ background:"none", border:"none", cursor:"pointer", padding:4 }}>
                <Ic n="edit" s={13} c={C.textMuted}/>
              </button>
              <button onClick={() => handleResolve(inj.id)}
                style={{ background:"none", border:"none", cursor:"pointer", padding:4 }}>
                <Ic n="check" s={13} c={C.green}/>
              </button>
            </div>
          </div>
        ))}
      </div>
      {showModal && (
        <InjuryModal injury={editInjury} onSave={handleSave} onClose={() => { setShowModal(false); setEditInjury(null); }} C={C} t={t}/>
      )}
    </>
  );
};
