import React, { useState } from 'react';
import { FONT_DISPLAY, FONT_BODY } from '../../../constants/fonts';
import { useSettings } from '../../../hooks/useSettings';
import { useT } from '../../../hooks/useTranslation';
import { Ic } from '../../shared/Ic';
import { Modal } from '../../shared/Modal';
import { Btn } from '../../shared/Btn';

const SEV_COLORS = (C) => ({ 1:C.green, 2:C.yellow, 3:C.accent });

const InjuryModal = ({ injury, onSave, onClose, C, t }) => {
  const [f, setF] = useState({
    bodyPart: injury?.bodyPart || "",
    side: injury?.side || null,
    date: injury?.date || injury?.startDate || new Date().toISOString().split("T")[0],
    description: injury?.description || injury?.notes || "",
    severity: injury?.severity || null,
    cause: injury?.cause || "",
    treatment: injury?.treatment || "",
  });

  const lbl = { display:"block", fontSize:11, fontWeight:800, letterSpacing:1.5, color:C.textSec, fontFamily:FONT_DISPLAY, marginBottom:6, marginTop:14 };
  const inp = { width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 12px", color:C.text, fontSize:14, outline:"none", boxSizing:"border-box" };
  const pill = (active, color) => ({
    padding:"6px 14px", borderRadius:20, cursor:"pointer", fontSize:12, fontWeight:700,
    fontFamily:FONT_DISPLAY, border:`1.5px solid ${active ? (color||C.accent) : C.border}`,
    background: active ? `${color||C.accent}20` : "transparent", color: active ? (color||C.accent) : C.textMuted,
  });
  const sevColors = SEV_COLORS(C);

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
      <input type="date" value={f.date} onChange={e => setF(p=>({...p, date:e.target.value}))} style={inp}/>

      <label style={lbl}>{t("severity")}</label>
      <div style={{ display:"flex", gap:6 }}>
        {[{v:1,l:"severityMild"},{v:2,l:"severityModerate"},{v:3,l:"severitySevere"}].map(({v,l}) => (
          <button key={v} onClick={() => setF(p=>({...p, severity:v}))} style={pill(f.severity === v, sevColors[v])}>
            {t(l)}
          </button>
        ))}
      </div>

      <label style={lbl}>{t("injuryDescription")}</label>
      <textarea value={f.description} onChange={e => setF(p=>({...p, description:e.target.value}))} rows={2} style={{ ...inp, resize:"vertical", fontFamily:"inherit" }}/>

      <label style={lbl}>{t("whatCausedIt")}</label>
      <input value={f.cause} onChange={e => setF(p=>({...p, cause:e.target.value}))} style={inp}/>

      <label style={lbl}>{t("treatmentPlan")}</label>
      <textarea value={f.treatment} onChange={e => setF(p=>({...p, treatment:e.target.value}))} rows={2} style={{ ...inp, resize:"vertical", fontFamily:"inherit" }}/>
    </Modal>
  );
};

const ResolveInjuryModal = ({ injury, onResolve, onClose, C, t }) => {
  const [resolvedDate, setResolvedDate] = useState(new Date().toISOString().split("T")[0]);
  const [preventionNote, setPreventionNote] = useState("");

  const lbl = { display:"block", fontSize:11, fontWeight:800, letterSpacing:1.5, color:C.textSec, fontFamily:FONT_DISPLAY, marginBottom:6, marginTop:14 };
  const inp = { width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 12px", color:C.text, fontSize:14, outline:"none", boxSizing:"border-box" };

  return (
    <Modal title={t("resolveInjury")} onClose={onClose}
      footer={
        <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
          <Btn variant="secondary" onClick={onClose}>{t("cancel")}</Btn>
          <Btn variant="primary" onClick={() => onResolve({ resolvedDate, preventionNote })}>{t("markResolved")}</Btn>
        </div>
      }>
      <div style={{ fontFamily:FONT_BODY, fontSize:14, color:C.text, marginBottom:8 }}>
        {injury.side ? `${t(injury.side === "left" ? "leftSide" : "rightSide")} ` : ""}{injury.bodyPart}
      </div>

      <label style={lbl}>{t("resolvedDate")}</label>
      <input type="date" value={resolvedDate} onChange={e => setResolvedDate(e.target.value)} style={inp}/>

      <label style={{...lbl, marginTop:18}}>{t("preventionNote")}</label>
      <div style={{ fontSize:12, color:C.textMuted, fontFamily:FONT_BODY, marginBottom:8, lineHeight:1.5 }}>
        {t("preventionNotePrompt")}
      </div>
      <textarea value={preventionNote} onChange={e => setPreventionNote(e.target.value)} rows={3}
        style={{ ...inp, resize:"vertical", fontFamily:"inherit" }}/>
    </Modal>
  );
};

export const ActiveInjuriesCard = ({ injuries, setInjuries }) => {
  const { C } = useSettings();
  const t = useT();
  const [showModal, setShowModal] = useState(false);
  const [editInjury, setEditInjury] = useState(null);
  const [resolveInjury, setResolveInjury] = useState(null);

  const active = (injuries || []).filter(i => !i.resolved);
  if (active.length === 0 && !showModal && !resolveInjury) return null;

  const sevColors = SEV_COLORS(C);

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

  const handleResolve = (id, { resolvedDate, preventionNote }) => {
    setInjuries(prev => prev.map(i => i.id === id ? { ...i, resolved: true, resolvedDate, preventionNote } : i));
    setResolveInjury(null);
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
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              {inj.severity && (
                <div style={{ width:8, height:8, borderRadius:4, background:sevColors[inj.severity], flexShrink:0 }}/>
              )}
              <span style={{ fontSize:13, fontWeight:700, color:C.text, fontFamily:FONT_BODY }}>
                {inj.side ? `${t(inj.side === "left" ? "leftSide" : "rightSide")} ` : ""}{inj.bodyPart}
              </span>
              <span style={{ fontSize:11, color:C.textMuted }}>
                — Day {daysSince(inj.date || inj.startDate)}
              </span>
            </div>
            <div style={{ display:"flex", gap:6 }}>
              <button onClick={() => { setEditInjury(inj); setShowModal(true); }}
                style={{ background:"none", border:"none", cursor:"pointer", padding:4 }}>
                <Ic n="edit" s={13} c={C.textMuted}/>
              </button>
              <button onClick={() => setResolveInjury(inj)}
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
      {resolveInjury && (
        <ResolveInjuryModal injury={resolveInjury}
          onResolve={(data) => handleResolve(resolveInjury.id, data)}
          onClose={() => setResolveInjury(null)} C={C} t={t}/>
      )}
    </>
  );
};
