import React, { useState } from 'react';
import { Modal } from './Modal';
import { Inp } from './Inp';
import { Btn } from './Btn';
import { useT } from '../../hooks/useTranslation';

export const NameModal = ({ title, placeholder, onClose, onConfirm }) => {
  const t = useT();
  const [val,setVal]=useState("");
  return (
    <Modal title={title} onClose={onClose}>
      <Inp label={t("name") + " *"} value={val} onChange={setVal} placeholder={placeholder}/>
      <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:4 }}>
        <Btn variant="secondary" onClick={onClose}>{t("cancel")}</Btn>
        <Btn onClick={()=>val.trim()&&onConfirm(val.trim())} disabled={!val.trim()}>{t("create")}</Btn>
      </div>
    </Modal>
  );
};
