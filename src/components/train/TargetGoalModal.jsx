import React, { useState } from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { lbl } from '../../constants/styles';
import { IDEA_COLORS } from '../../constants/categories';
import { Modal } from '../shared/Modal';
import { Btn } from '../shared/Btn';
import { Ic } from '../shared/Ic';
import { useT } from '../../hooks/useTranslation';
import { useSettings } from '../../hooks/useSettings';
import { ensureHttps } from './helpers';
import { JournalEntryCard } from './JournalEntryCard';
import { JournalEntryInput } from './JournalEntryInput';

export const TargetGoalModal = ({ onClose, onSave, idea, moves=[] }) => {
  const { C, settings } = useSettings();
  const t = useT();
  const isEdit = !!idea;
  const autoLinkEnabled = settings.targetAutoLink === true;
  const [activeTab, setActiveTab] = useState(isEdit ? "journal" : "target");
  const [title,    setTitle]    = useState(idea?.title    || "");
  const [target,   setTarget]   = useState(idea?.target   || 10);
  const [targetRaw, setTargetRaw] = useState(String(idea?.target || 10));
  const [unit,     setUnit]     = useState(idea?.unit     || "moves");
  const [current,  setCurrent]  = useState(idea?.current  || 0);
  const [byWhen,   setByWhen]   = useState(idea?.byWhen   || "");
  const [link,     setLink]     = useState(idea?.link     || "");
  const [autoLink, setAutoLink] = useState(idea?.autoLink || false);
  const [color,    setColor]    = useState(idea?.color    || IDEA_COLORS[0]);
  const [journal,  setJournal]  = useState(idea?.journal  || []);
  const effectiveCurrent = autoLink && autoLinkEnabled ? moves.length : current;

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({ type:"target", pinned:true, title:title.trim(),
      target, unit:unit.trim()||"items", current:effectiveCurrent,
      byWhen, link: ensureHttps(link.trim()), autoLink, color, journal, text:"",
      createdDate: idea?.createdDate || new Date().toISOString().split("T")[0]
    });
    onClose();
  };

  const deleteJournalEntry = (id) => setJournal(j=>j.filter(e=>e.id!==id));

  const inputStyle = { width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8,
    padding:"9px 12px", color:C.text, fontSize:13, outline:"none", fontFamily:FONT_BODY, boxSizing:"border-box" };

  const tabs = isEdit
    ? [{id:"journal",label:t("journal")},{id:"target",label:t("targetTab")}]
    : [{id:"target",label:t("targetTab")}];

  return (
    <div style={{ width:"100%", maxHeight:"92%", background:C.bg, borderRadius:14, display:"flex", flexDirection:"column", overflow:"hidden", boxShadow:"0 16px 48px rgba(0,0,0,0.5)" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 16px", background:C.surface, borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
        <span style={{ fontWeight:900, fontSize:15, letterSpacing:2, fontFamily:FONT_DISPLAY, color:C.accent }}>{isEdit?t("editTarget"):t("newTarget")}</span>
        <div style={{ display:"flex", gap:8 }}>
          <Btn variant="secondary" onClick={onClose}>{t("cancel")}</Btn>
          <Btn onClick={handleSave} disabled={!title.trim()}>{t("save")}</Btn>
        </div>
      </div>

      {/* Tabs — only when editing */}
      {isEdit&&(
        <div style={{ display:"flex", background:C.surface, borderBottom:`2px solid ${C.border}`, flexShrink:0 }}>
          {tabs.map(tb=>{
            const on = activeTab===tb.id;
            return (
              <button key={tb.id} onClick={()=>setActiveTab(tb.id)}
                style={{ flex:1, padding:"10px 6px", border:"none", cursor:"pointer", background:on?C.bg:"transparent",
                  color:on?C.accent:C.textSec, borderBottom:`3px solid ${on?C.accent:"transparent"}`,
                  fontSize:12, fontWeight:800, letterSpacing:1.5, fontFamily:FONT_DISPLAY }}>
                {tb.label}
              </button>
            );
          })}
        </div>
      )}

      <div style={{ flex:1, overflow:"auto", padding:16 }}>

        {/* ── JOURNAL TAB ── */}
        {activeTab==="journal"&&(
          <div>
            <JournalEntryInput
              onAdd={({text,link})=>{ const entry={id:Date.now(),date:new Date().toLocaleDateString("en-AU",{day:"2-digit",month:"short",year:"numeric"}),text,link}; setJournal(j=>[entry,...j]); }}
              placeholder={t("targetJournalPlaceholder")}
            />
            {journal.length===0 ? (
              <div style={{ textAlign:"center", padding:"40px 20px", color:C.textMuted }}>
                <div style={{ marginBottom:8 }}><Ic n="book" s={28} c={C.textMuted}/></div>
                <div style={{ fontSize:13, fontWeight:700, fontFamily:FONT_DISPLAY, marginBottom:4 }}>{t("noEntriesYet")}</div>
                <div style={{ fontSize:12 }}>{t("noEntriesHint")}</div>
              </div>
            ) : journal.map(entry=>(
              <JournalEntryCard key={entry.id} entry={entry}
                onDelete={()=>deleteJournalEntry(entry.id)}
                onUpdate={(updated)=>setJournal(j=>j.map(e=>e.id===entry.id?{...e,...updated}:e))}
              />
            ))}
          </div>
        )}

        {/* ── TARGET TAB ── */}
        {activeTab==="target"&&(
          <div>
            {!isEdit&&(
              <div style={{ display:"flex", alignItems:"flex-start", gap:8, padding:"10px 12px", background:`${C.accent}12`,
                border:`1px solid ${C.accent}30`, borderRadius:8, marginBottom:18 }}>
                <span style={{ flexShrink:0 }}><Ic n="book" s={16} c={C.textMuted}/></span>
                <span style={{ fontSize:12, color:C.textSec, lineHeight:1.6 }}>
                  {t("targetJournalDesc").split(t("trainingJournal")).map((part,i,arr)=>i<arr.length-1?<React.Fragment key={i}>{part}<strong style={{color:C.text}}>{t("trainingJournal")}</strong></React.Fragment>:part)}
                </span>
              </div>
            )}
            <div style={{ marginBottom:14 }}>
              <label style={lbl()}>{t("title")} *</label>
              <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Learn 20 new moves…"
                style={{ ...inputStyle, fontSize:14, fontWeight:700, border:`1.5px solid ${C.accent}`, fontFamily:FONT_DISPLAY }}/>
            </div>
            <div style={{ display:"flex", gap:10, marginBottom:14 }}>
              <div style={{ flex:1 }}>
                <label style={lbl()}>{t("targetNumberLabel")} *</label>
                <input type="number" min="0" value={targetRaw}
                  onChange={e=>{ setTargetRaw(e.target.value); const n=parseInt(e.target.value); if(!isNaN(n)&&n>=0) setTarget(n); }}
                  onBlur={()=>{ const n=parseInt(targetRaw); const v=isNaN(n)||n<0?0:n; setTarget(v); setTargetRaw(String(v)); }}
                  style={{ ...inputStyle, fontWeight:800, fontSize:18, fontFamily:FONT_DISPLAY, textAlign:"center" }}/>
              </div>
              <div style={{ flex:2 }}>
                <label style={lbl()}>{t("unitLabel")}</label>
                <input value={unit} onChange={e=>setUnit(e.target.value)} placeholder={t("unitPlaceholder")}
                  style={inputStyle}/>
              </div>
            </div>
            {!(autoLink && autoLinkEnabled) && (
              <div style={{ marginBottom:14 }}>
                <label style={lbl()}>{t("currentProgress")}</label>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <button onClick={()=>setCurrent(Math.max(0,current-1))}
                    style={{ width:36, height:36, borderRadius:8, border:`1px solid ${C.border}`, background:C.surface,
                      fontSize:18, cursor:"pointer", color:C.textSec, fontWeight:700 }}>{"−"}</button>
                  <input type="number" min="0" value={current} onChange={e=>setCurrent(Math.max(0,parseInt(e.target.value)||0))}
                    style={{ ...inputStyle, textAlign:"center", fontWeight:800, fontSize:18, fontFamily:FONT_DISPLAY }}/>
                  <button onClick={()=>setCurrent(current+1)}
                    style={{ width:36, height:36, borderRadius:8, border:`1px solid ${C.accent}`, background:`${C.accent}15`,
                      fontSize:18, cursor:"pointer", color:C.accent, fontWeight:700 }}>+</button>
                </div>
              </div>
            )}
            {autoLinkEnabled && (
              <div style={{ marginBottom:14, display:"flex", alignItems:"center", justifyContent:"space-between",
                padding:"10px 12px", background:C.surfaceAlt, borderRadius:8, border:`1px solid ${C.border}` }}>
                <div>
                  <div style={{ fontSize:12, fontWeight:800, color:C.text, fontFamily:FONT_DISPLAY }}>{t("autoLinkMoveLib")}</div>
                  <div style={{ fontSize:11, color:C.textMuted, marginTop:2 }}>Use your actual move count as progress ({moves.length} moves)</div>
                </div>
                <button onClick={()=>setAutoLink(x=>!x)}
                  style={{ width:40, height:22, borderRadius:11, border:"none", cursor:"pointer",
                    background: autoLink ? C.accent : C.border, position:"relative", transition:"background 0.2s" }}>
                  <div style={{ position:"absolute", top:2, left: autoLink?20:2, width:18, height:18,
                    borderRadius:"50%", background:"#fff", transition:"left 0.2s" }}/>
                </button>
              </div>
            )}
            <div style={{ marginBottom:14 }}>
              <label style={lbl()}>{t("deadlineOptional")}</label>
              <input type="date" value={byWhen} onChange={e=>setByWhen(e.target.value)}
                style={{ ...inputStyle, colorScheme: C.bg==="#121212"?"dark":"light" }}/>
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={lbl()}>{t("videoRefOptional")}</label>
              <input value={link} onChange={e=>setLink(e.target.value)}
                placeholder="https://youtube.com/…"
                style={inputStyle}/>
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={lbl()}>{t("colour")}</label>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:6 }}>
                {IDEA_COLORS.map(c=>(
                  <button key={c} onClick={()=>setColor(c)}
                    style={{ width:30, height:30, borderRadius:6, background:c, cursor:"pointer", outline:"none",
                      border: color===c ? `3px solid ${C.brown}` : "2px solid transparent" }}/>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
