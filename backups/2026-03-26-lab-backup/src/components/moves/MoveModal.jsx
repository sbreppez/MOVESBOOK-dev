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
import { AttributeChips } from './AttributeChips';
import { AttributeModal } from '../modals/AttributeModal';

export const MoveModal = ({ onClose, onSave, move, initialCat="Footworks", initialDesc="", cats=CATS, customAttrs=[], onAddAttr }) => {
  const t = useT();
  const [f,setF] = useState({ name:"", category:initialCat, description:initialDesc||"", link:"", mastery:50, date:new Date().toISOString().split("T")[0], status:"wip", rotation:"", travelling:"", custom:"", attrs:{}, ...move });
  const set = k => v => setF(p=>({...p,[k]:v}));
  const handleSave = () => { if (f.name) { onSave(f); onClose(); } };
  const [showMore, setShowMore] = useState(false);
  const [showAttrModal, setShowAttrModal] = useState(false);

  const setAttr = (attrId, val) => {
    setF(p => ({ ...p, attrs: { ...(p.attrs || {}), [attrId]: val } }));
  };

  const sortedAttrs = [...customAttrs].sort((a,b) => (a.order||0) - (b.order||0));

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

      {/* ── More Details (Custom Attributes) ── */}
      <button onClick={() => setShowMore(s => !s)}
        style={{ background:"none", border:"none", cursor:"pointer", display:"flex",
          alignItems:"center", gap:6, color:C.textMuted, fontSize:12, fontFamily:FONT_DISPLAY,
          fontWeight:700, letterSpacing:0.5, padding:"8px 0", marginBottom:4 }}>
        <Ic n={showMore ? "chevD" : "chevR"} s={12} c={C.textMuted} />
        {showMore ? t("hideDetails") : t("moreDetails")}
      </button>

      {showMore && (
        <div style={{ background:C.surfaceAlt, borderRadius:10, padding:12, marginBottom:12,
          border:`1px solid ${C.borderLight}` }}>
          {sortedAttrs.length > 0 ? (
            sortedAttrs.map(attr => (
              <div key={attr.id} style={{ marginBottom:10 }}>
                <div style={{ fontSize:10, fontWeight:800, letterSpacing:1, color:C.textMuted,
                  fontFamily:FONT_DISPLAY, marginBottom:4 }}>
                  {attr.name.toUpperCase()}{attr.multi ? " (multi)" : ""}
                </div>
                <AttributeChips
                  attr={attr}
                  selected={f.attrs?.[attr.id] || (attr.multi ? [] : "")}
                  onChange={val => setAttr(attr.id, val)}
                />
              </div>
            ))
          ) : (
            <div style={{ fontSize:12, color:C.textMuted, fontStyle:"italic", marginBottom:6 }}>
              {t("noAttributesDefined")}
            </div>
          )}
          <button onClick={() => setShowAttrModal(true)}
            style={{ background:"none", border:"none", cursor:"pointer", fontSize:12,
              color:C.accent, fontWeight:700, fontFamily:FONT_DISPLAY, padding:"4px 0" }}>
            + {t("addNewAttribute")}
          </button>
        </div>
      )}

      <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
        <Btn variant="secondary" onClick={onClose}>{t("cancel")}</Btn>
        <Btn onClick={handleSave} disabled={!f.name}>{t("confirm")}</Btn>
      </div>

      {showAttrModal && (
        <AttributeModal
          attr={null}
          existingNames={customAttrs.map(a => a.name)}
          onClose={() => setShowAttrModal(false)}
          onSave={def => {
            if (onAddAttr) onAddAttr(def);
            setShowAttrModal(false);
          }}
        />
      )}
    </Modal>
  );
};
