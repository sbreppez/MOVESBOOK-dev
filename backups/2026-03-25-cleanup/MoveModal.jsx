import React, { useState } from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { Modal } from '../shared/Modal';
import { Inp } from '../shared/Inp';
import { Txtarea } from '../shared/Txtarea';
import { Sel } from '../shared/Sel';
import { Btn } from '../shared/Btn';
import { MasterySlider } from '../shared/MasterySlider';
import { Ic } from '../shared/Ic';
import { useT } from '../../hooks/useTranslation';
import { CATS } from '../../constants/categories';

export const MoveModal = ({ onClose, onSave, move, initialCat="Footworks", initialDesc="", cats=CATS }) => {
  const t = useT();
  const [f,setF] = useState({ name:"", category:initialCat, description:initialDesc||"", link:"", mastery:50, date:new Date().toISOString().split("T")[0], status:"wip", rotation:"", travelling:"", custom:"", ...move });
  const set = k => v => setF(p=>({...p,[k]:v}));
  const handleSave = () => { if (f.name) { onSave(f); onClose(); } };
  return (
    <Modal title={move?t("editMove"):t("addMove")} onClose={onClose}>
      <Sel label={t("categories")} value={f.category} onChange={set("category")} options={cats.map(c=>({value:c,label:c}))}/>
      <Inp label={t("name") + " *"} value={f.name} onChange={set("name")} placeholder={t("moveNamePlaceholder")}/>
      <Txtarea label={t("description")} value={f.description} onChange={set("description")} placeholder={t("describeMove")}/>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <div style={{ flex:1 }}><Inp label={t("videoLinkOptional")} value={f.link} onChange={set("link")} placeholder="https://youtube.com/…"/></div>
        {f.link&&<a href={f.link.startsWith("http")?f.link:"https://"+f.link} target="_blank" rel="noopener noreferrer"
          style={{ flexShrink:0, marginTop:18, display:"flex", alignItems:"center", justifyContent:"center",
            width:34, height:34, borderRadius:8, background:C.accent, color:C.bg, border:"none", textDecoration:"none" }}
          title={t("openLink")}>
          <Ic n="extLink" s={15} c="#fff"/>
        </a>}
      </div>
      {!f.link && <div style={{ fontSize:11, color:C.textMuted, fontStyle:"italic", marginTop:4 }}>{t("videoLinkHint")}</div>}

      <MasterySlider value={f.mastery} onChange={set("mastery")}/>

      <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
        <Btn variant="secondary" onClick={onClose}>{t("cancel")}</Btn>
        <Btn onClick={handleSave} disabled={!f.name}>{t("confirm")}</Btn>
      </div>
    </Modal>
  );
};
