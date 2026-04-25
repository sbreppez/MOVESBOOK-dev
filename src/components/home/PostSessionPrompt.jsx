import React, { useState } from 'react';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { useSettings } from '../../hooks/useSettings';
import { useT } from '../../hooks/useTranslation';
import { Modal } from '../shared/Modal';
import { Btn } from '../shared/Btn';

export const PostSessionPrompt = ({ presession: _presession, setPresession, onClose }) => {
  const { C } = useSettings();
  const t = useT();
  const [noteNext, setNoteNext] = useState("");
  const [noteFilm, setNoteFilm] = useState("");

  const handleSave = () => {
    const updates = {};
    if (noteNext.trim()) updates.fromLastSession = noteNext.trim();
    if (noteFilm.trim()) updates.fromFootage = noteFilm.trim();
    if (Object.keys(updates).length > 0) {
      setPresession(prev => ({ ...prev, ...updates }));
    }
    onClose();
  };

  const lbl = { display:"block", fontSize:11, fontWeight:800, letterSpacing:1.2, color:C.textSec, fontFamily:FONT_DISPLAY, marginBottom:6, marginTop:14 };
  const inp = {
    width:"100%", background:C.surfaceAlt, border:`1px solid ${C.border}`, borderRadius:8,
    padding:"10px 12px", color:C.text, fontSize:14, outline:"none", resize:"vertical",
    fontFamily:FONT_BODY, boxSizing:"border-box", lineHeight:1.5,
  };

  return (
    <Modal title={t("noteForNextTime")} onClose={onClose}
      footer={
        <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
          <Btn variant="secondary" onClick={onClose}>{t("skip")}</Btn>
          <Btn variant="primary" onClick={handleSave}>{t("save")}</Btn>
        </div>
      }>
      <label style={{ ...lbl, marginTop:0 }}>{t("noteForNextTime")}</label>
      <textarea value={noteNext} onChange={e => setNoteNext(e.target.value)} rows={2}
        placeholder={t("noteForNextTimePlaceholder")} style={inp}/>

      <label style={lbl}>{t("anythingToFilm")}</label>
      <textarea value={noteFilm} onChange={e => setNoteFilm(e.target.value)} rows={2}
        placeholder={t("anythingToFilmPlaceholder")} style={inp}/>
    </Modal>
  );
};
