import React, { useState, Fragment } from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { Modal } from '../shared/Modal';
import { Btn } from '../shared/Btn';
import { Txtarea } from '../shared/Txtarea';
import { Sel } from '../shared/Sel';
import { MasterySlider } from '../shared/MasterySlider';
import { Ic } from '../shared/Ic';
import { useT } from '../../hooks/useTranslation';
import { useSettings } from '../../hooks/useSettings';
import { CATS } from '../../constants/categories';

export const BulkModal = ({ onClose, onImport, cats }) => {
  const t = useT();
  const [txt,setTxt]=useState(""); const [step,setStep]=useState(1);
  const [parsed,setParsed]=useState([]); const [sel,setSel]=useState([]);
  const [cat,setCat]=useState(cats?.[0]||"Footworks"); const [mastery,setMastery]=useState(50);
  const parse=()=>{ const names=txt.split(/[\n,]+/).map(s=>s.trim()).filter(Boolean); setParsed(names.map((n,i)=>({id:i,name:n}))); setSel(names.map((_,i)=>i)); setStep(2); };
  const tog=id=>setSel(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);
  const imp=()=>{ onImport(parsed.filter(p=>sel.includes(p.id)).map(p=>({name:p.name,category:cat,mastery,description:"",link:"",date:new Date().toISOString().split("T")[0],status:"wip"}))); onClose(); };
  const footerEl = step===1
    ? <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
        <Btn variant="secondary" onClick={onClose}>{t("cancel")}</Btn>
        <Btn onClick={parse} disabled={!txt.trim()}>{t("findMoves")}</Btn>
      </div>
    : <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
        <Btn variant="secondary" onClick={()=>setStep(1)}>{t("back")}</Btn>
        <Btn onClick={imp} disabled={!sel.length}>Import {sel.length} Moves</Btn>
      </div>;
  return (
    <Modal title={t("bulkImport")} onClose={onClose} footer={footerEl}>
      {step===1 ? <Fragment>
        <p style={{ color:C.textSec, fontSize:13, marginBottom:16, lineHeight:1.6 }}>Paste your list — one move per line or comma-separated.</p>
        <Sel label={t("importToCategory")} value={cat} onChange={setCat} options={cats||CATS}/>
        <Txtarea value={txt} onChange={setTxt} placeholder={"Sixstep\nTwostep, Pretzels\nBabylon\n..."} rows={8}/>
      </Fragment> : <Fragment>
        <MasterySlider value={mastery} onChange={setMastery}/>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <span style={{ fontSize:13, color:C.textSec, fontWeight:700, letterSpacing:1 }}>{parsed.length} MOVES FOUND</span>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={()=>setSel(parsed.map(p=>p.id))} style={{ background:"none", border:"none", color:C.brownLight, cursor:"pointer", fontSize:13, fontFamily:"inherit" }}>All</button>
            <button onClick={()=>setSel([])} style={{ background:"none", border:"none", color:C.textMuted, cursor:"pointer", fontSize:13, fontFamily:"inherit" }}>None</button>
          </div>
        </div>
        <div style={{ background:C.surfaceAlt, borderRadius:10, padding:10, maxHeight:200, overflow:"auto", border:`1px solid ${C.borderLight}` }}>
          {parsed.map(p=>(
            <div key={p.id} onClick={()=>tog(p.id)} style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 6px", cursor:"pointer", borderRadius:6 }}>
              <div style={{ width:16, height:16, borderRadius:4, border:`2px solid ${sel.includes(p.id)?C.green:C.border}`, background:sel.includes(p.id)?C.green:"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                {sel.includes(p.id)&&<Ic n="check" s={13} c="#fff"/>}
              </div>
              <span style={{ color:C.text, fontSize:13 }}>{p.name}</span>
            </div>
          ))}
        </div>
      </Fragment>}
    </Modal>
  );
};
