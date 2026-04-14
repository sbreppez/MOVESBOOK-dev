import React, { useState } from 'react';
import { C, PRESET_COLORS } from '../../constants/colors';
import { FONT_DISPLAY } from '../../constants/fonts';
import { Modal } from '../shared/Modal';
import { Inp } from '../shared/Inp';
import { Btn } from '../shared/Btn';
import { useT } from '../../hooks/useTranslation';
import { lbl } from '../../constants/styles';

export const AddCategoryModal = ({ onClose, onAdd, existingCats=[], existingColors={} }) => {
  const t = useT();
  const [name,setName]=useState("");
  const [color,setColor]=useState(PRESET_COLORS[0]);
  const [dupWarning,setDupWarning]=useState(false);

  const nameDup = existingCats.some(c=>c.toLowerCase()===name.trim().toLowerCase());
  const colorDup = name.trim() && existingColors[existingCats.find(c=>c.toLowerCase()===name.trim().toLowerCase())]===color;
  const isExactDup = nameDup && colorDup;

  const handleAdd = () => {
    if(!name.trim()) return;
    if(isExactDup) { setDupWarning(true); return; }
    onAdd(name.trim(), color); onClose();
  };

  if(dupWarning) return (
    <Modal title={t("duplicateCategory")} onClose={()=>setDupWarning(false)}>
      <p style={{ color:C.textSec, marginBottom:8, lineHeight:1.6 }}>
        A category named <strong style={{color:C.text}}>{name.trim()}</strong> with this colour already exists.
      </p>
      <p style={{ color:C.textSec, marginBottom:20, lineHeight:1.6 }}>{t("addItAnyway")}</p>
      <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
        <Btn variant="secondary" onClick={()=>setDupWarning(false)}>{t("goBack")}</Btn>
        <Btn variant="danger" onClick={()=>{ onAdd(name.trim(),color); onClose(); }}>{t("addAnyway")}</Btn>
      </div>
    </Modal>
  );

  return (
    <Modal title={t("addCategory")} onClose={onClose}>
      <Inp label={t("categoryNameLabel") + " *"} value={name} onChange={v=>{setName(v);setDupWarning(false);}} placeholder={t("catPlaceholder")}/>
      {nameDup && !isExactDup && <p style={{ color:C.yellow, fontSize:13, marginTop:-10, marginBottom:12 }}>{"\u26a0"} {t("categoryExists")}</p>}

      <div style={{ marginBottom:16 }}>
        <label style={lbl()}>{t("colour")}</label>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:4 }}>
          {PRESET_COLORS.map(c=>(
            <button key={c} onClick={()=>setColor(c)} style={{ width:30, height:30, borderRadius:6, background:c, border:color===c?`3px solid ${C.brown}`:`2px solid transparent`, cursor:"pointer", outline:"none" }}/>
          ))}
        </div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16, padding:"10px 14px", background:C.surfaceAlt, borderRadius:8, borderLeft:`4px solid ${color}` }}>
        <span style={{ fontWeight:800, fontSize:16, color:C.brown, fontFamily:FONT_DISPLAY, letterSpacing:1.5 }}>{name||t("preview")}</span>
      </div>
      <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
        <Btn variant="secondary" onClick={onClose}>{t("cancel")}</Btn>
        <Btn onClick={handleAdd} disabled={!name.trim()}>{t("addCategory")}</Btn>
      </div>
    </Modal>
  );
};
