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
  const [more,setMore] = useState(false);
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

      <MasterySlider value={f.mastery} onChange={set("mastery")}/>

      <Sel label={t("status")} value={f.status} onChange={set("status")} options={[{value:"wip",label:"📜 Moves"},{value:"ready",label:"⚔ Battle Ready"}]}/>
      <Inp label={t("date")} value={f.date} onChange={set("date")} type="date"/>
      <button onClick={()=>setMore(!more)} style={{ background:"none", border:"none", color:C.brownLight, cursor:"pointer", fontSize:12, padding:"0 0 14px", display:"flex", alignItems:"center", gap:4, fontFamily:"inherit" }}>
        <Ic n={more?"chevD":"chevR"} s={12} c={C.brownLight}/>{more?t("hideDetails"):t("moreDetails")}
      </button>
      {more && <div style={{ background:C.surfaceAlt, borderRadius:10, padding:14, marginBottom:16, border:`1px solid ${C.borderLight}` }}>
        <Sel label={t("direction")} value={f.rotation} onChange={set("rotation")} options={[{value:"",label:"None"},{value:"Clockwise",label:t("clockwise")},{value:"Counterclockwise",label:t("counterclockwise")}]}/>
        <Sel label={t("travelling")} value={f.travelling} onChange={set("travelling")} options={[{value:"",label:"None"},{value:"Forward",label:t("forward")},{value:"Backwards",label:t("backwards")},{value:"Sideways",label:t("sideways")},{value:"Going Around",label:t("goingAround")}]}/>
      </div>}
      <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
        <Btn variant="secondary" onClick={onClose}>{t("cancel")}</Btn>
        <Btn onClick={handleSave} disabled={!f.name}>{t("confirm")}</Btn>
      </div>
    </Modal>
  );
};
