import { useState } from 'react';
import { PRESET_COLORS } from '../../constants/colors';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { Modal } from '../shared/Modal';
import { Btn } from '../shared/Btn';
import { useT } from '../../hooks/useTranslation';
import { useSettings } from '../../hooks/useSettings';

export const NewRoundModal = ({ onClose, onConfirm }) => {
  const { C } = useSettings();
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[2]);
  const [entryCount, setEntryCount] = useState(1);
  const inputStyle = { width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8,
    padding:"9px 12px", color:C.text, fontSize:14, outline:"none", fontFamily:FONT_BODY, boxSizing:"border-box" };
  const t = useT();
  return (
    <Modal title={t("newRoundTitle")} onClose={onClose}>
      <div style={{ marginBottom:14 }}>
        <label style={{ display:"block", fontSize:11, fontWeight:800, letterSpacing:1.5, color:C.textSec, fontFamily:FONT_DISPLAY, marginBottom:6 }}>{t("roundNameLabel")} *</label>
        <input autoFocus value={name} onChange={e=>setName(e.target.value)}
          onKeyDown={e=>{ if(e.key==="Enter"&&name.trim()) onConfirm({name:name.trim(),color,entries:entryCount}); }}
          placeholder={t("roundPlaceholder")} style={inputStyle}/>
      </div>
      <div style={{ marginBottom:14 }}>
        <label style={{ display:"block", fontSize:11, fontWeight:800, letterSpacing:1.5, color:C.textSec, fontFamily:FONT_DISPLAY, marginBottom:8 }}>{t("colour")}</label>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
          {PRESET_COLORS.map(c=>(
            <button key={c} onClick={()=>setColor(c)}
              style={{ width:28, height:28, borderRadius:6, background:c, cursor:"pointer", outline:"none",
                border: color===c ? `3px solid ${C.brown}` : "2px solid transparent" }}/>
          ))}
        </div>
      </div>
      <div style={{ marginBottom:20 }}>
        <label style={{ display:"block", fontSize:11, fontWeight:800, letterSpacing:1.5, color:C.textSec, fontFamily:FONT_DISPLAY, marginBottom:6 }}>{t("numberOfEntries")}</label>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={()=>setEntryCount(e=>Math.max(1,e-1))}
            style={{ width:32, height:32, borderRadius:8, border:`1px solid ${C.border}`, background:C.surface,
              fontSize:16, cursor:"pointer", color:C.textSec, fontWeight:700 }}>−</button>
          <span style={{ fontSize:18, fontWeight:900, fontFamily:FONT_DISPLAY, color:C.text, minWidth:24, textAlign:"center" }}>{entryCount}</span>
          <button onClick={()=>setEntryCount(e=>Math.min(32,e+1))}
            style={{ width:32, height:32, borderRadius:8, border:`1px solid ${C.accent}`, background:`${C.accent}15`,
              fontSize:16, cursor:"pointer", color:C.accent, fontWeight:700 }}>+</button>
          <span style={{ fontSize:11, color:C.textMuted }}>{entryCount === 1 ? "1 "+t("entrySlot") : entryCount+" "+t("entrySlotsPlural")}</span>
        </div>
      </div>
      <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
        <Btn variant="secondary" onClick={onClose}>{t("cancel")}</Btn>
        <Btn onClick={()=>{ if(name.trim()) onConfirm({name:name.trim(),color,entries:entryCount}); }} disabled={!name.trim()}>{t("createRound")}</Btn>
      </div>
    </Modal>
  );
};
