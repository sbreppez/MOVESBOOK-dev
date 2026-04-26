import React, { useState } from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { lbl } from '../../constants/styles';
import { IDEA_COLORS } from '../../constants/categories';
import { Btn } from '../shared/Btn';
import { Ic } from '../shared/Ic';
import { useT } from '../../hooks/useTranslation';
import { ensureHttps } from './helpers';
import { todayLocal } from '../../utils/dateUtils';
import { GoalField } from './GoalField';
import { JournalEntryCard } from './JournalEntryCard';
import { JournalEntryInput } from './JournalEntryInput';

export const GoalModal = ({ onClose, onSave, idea }) => {
  const t = useT();
  const isEdit = !!idea;
  const [activeTab,    setActiveTab]    = useState(isEdit ? "journal" : "goal");
  const [title,        setTitle]        = useState(idea?.title        || "");
  const [why,          setWhy]          = useState(idea?.why          || "");
  const [byWhen,       setByWhen]       = useState(idea?.byWhen       || "");
  const [steps,        setSteps]        = useState(idea?.steps        || ["","",""]);
  const [daysPerWeek,  setDaysPerWeek]  = useState(idea?.daysPerWeek  || "");
  const [sessionLen,   setSessionLen]   = useState(idea?.sessionLength || "");
  const [trainWhere,   setTrainWhere]   = useState(idea?.trainWhere   || "");
  const [obstacles,    setObstacles]    = useState(idea?.obstacles    || "");
  const [color]                         = useState(idea?.color        || IDEA_COLORS[0]);
  const [journal,      setJournal]      = useState(idea?.journal      || []);
  const [link,         setLink]         = useState(idea?.link         || "");
  const handleSave = () => {
    if (!title.trim()) return;
    onSave({ type:"goal", pinned:true, title:title.trim(), why, byWhen,
      steps, daysPerWeek, sessionLength:sessionLen, trainWhere,
      obstacles, color, journal, link:ensureHttps(link.trim()), text:"",
      createdDate: idea?.createdDate || todayLocal() });
    onClose();
  };

  const deleteJournalEntry = (id) => setJournal(j=>j.filter(e=>e.id!==id));

  const inputStyle = { width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8,
    padding:"9px 12px", color:C.text, fontSize:13, outline:"none", fontFamily:FONT_BODY, boxSizing:"border-box" };

  const tabs = isEdit
    ? [{id:"journal",label:t("journal")},{id:"goal",label:t("goal")}]
    : [{id:"goal",label:t("goal")}];

  return (
    <div style={{ width:"100%", maxHeight:"92%", background:C.surface, borderRadius:16, display:"flex", flexDirection:"column", overflow:"hidden", boxShadow:"0 16px 48px rgba(0,0,0,0.5)" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 16px", background:C.surface, borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
        <span style={{ fontWeight:900, fontSize:16, letterSpacing:2, fontFamily:FONT_DISPLAY, color:C.text }}>{isEdit?t("editGoal"):t("newGoal")}</span>
        <div style={{ display:"flex", gap:8 }}>
          <Btn variant="secondary" onClick={onClose}>{t("cancel")}</Btn>
          <Btn onClick={handleSave} disabled={!title.trim()}>{t("save")}</Btn>
        </div>
      </div>

      {/* Tab switcher — only show when editing */}
      {isEdit&&(
        <div style={{ display:"flex", background:C.surface, borderBottom:`2px solid ${C.border}`, flexShrink:0 }}>
          {tabs.map(t=>{
            const on = activeTab===t.id;
            return (
              <button key={t.id} onClick={()=>setActiveTab(t.id)}
                style={{ flex:1, padding:"10px 6px", border:"none", cursor:"pointer", background:on?C.bg:"transparent",
                  color:on?C.text:C.textMuted, borderBottom:`3px solid ${on?C.accent:"transparent"}`,
                  fontSize:11, fontWeight:800, letterSpacing:1.5, fontFamily:FONT_DISPLAY }}>
                {t.label}
              </button>
            );
          })}
        </div>
      )}

      <div style={{ flex:1, overflow:"auto", padding:16 }}>

        {/* ── JOURNAL TAB ── */}
        {activeTab==="journal"&&(
          <div>
            {/* New entry input */}
            <JournalEntryInput
              onAdd={({text,link})=>{ const entry={id:Date.now(),date:new Date().toLocaleDateString("en-AU",{day:"2-digit",month:"short",year:"numeric"}),text,link}; setJournal(j=>[entry,...j]); }}
            />
            {/* Entries */}
            {journal.length===0 ? (
              <div style={{ textAlign:"center", padding:"40px 20px", color:C.textMuted }}>
                <div style={{ marginBottom:8 }}><Ic n="book" s={28} c={C.textMuted}/></div>
                <div style={{ fontSize:13 }}>{t("emptyEntries")}</div>
              </div>
            ) : journal.map(entry=>(
              <JournalEntryCard key={entry.id} entry={entry}
                onDelete={()=>deleteJournalEntry(entry.id)}
                onUpdate={(updated)=>setJournal(j=>j.map(e=>e.id===entry.id?{...e,...updated}:e))}
              />
            ))}
          </div>
        )}

        {/* ── GOAL TAB ── */}
        {activeTab==="goal"&&(
          <div>
            {!isEdit && (
              <div style={{
                fontSize: 11, color: C.textMuted, fontFamily: FONT_BODY,
                lineHeight: 1.5, marginBottom: 14, fontStyle: "italic",
              }}>
                {t("goalDesc")}
              </div>
            )}
            {!isEdit && (
              <div style={{
                fontSize: 11, color: C.textMuted, fontFamily: FONT_BODY,
                lineHeight: 1.5, marginBottom: 14, fontStyle: "italic",
              }}>
                {t("goalHint")}
              </div>
            )}
            {/* Goal title */}
            <div style={{ marginBottom:18 }}>
              <label style={{ ...lbl(), fontSize:11, letterSpacing:1.5 }}>{t("whatAchieve")}</label>
              <input value={title} onChange={e=>setTitle(e.target.value)} placeholder={t("goalPlaceholder")}
                style={{ ...inputStyle, border:`1.5px solid ${C.accent}`, fontSize:14, fontWeight:700, fontFamily:FONT_DISPLAY, letterSpacing:0.5 }}/>
            </div>

            <GoalField label={t("whyQuestion")} hint="How will it benefit your current situation?" minHeight="20vh"
              value={why} onChange={setWhy} placeholder="This goal matters because…"/>

            {/* BY WHEN — date picker */}
            <div style={{ marginBottom:18 }}>
              <label style={{ ...lbl(), fontSize:11, letterSpacing:1.5 }}>{t("byWhen")}</label>
              <div style={{ fontSize:11, color:C.textMuted, marginBottom:5, fontStyle:"italic" }}>{t("setDeadline")}</div>
              <input type="date" value={byWhen} onChange={e=>setByWhen(e.target.value)}
                style={{ ...inputStyle, colorScheme: C.bg==="#121212"?"dark":"light" }}/>
            </div>

            {/* 3 Main Steps */}
            <div style={{ marginBottom:18 }}>
              <label style={{ ...lbl(), fontSize:11, letterSpacing:1.5 }}>{t("threeMainSteps")}</label>
              <div style={{ fontSize:11, color:C.textMuted, marginBottom:8, fontStyle:"italic" }}>Write the 3 main steps to achieve your goal</div>
              {steps.map((s,i)=>(
                <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                  <div style={{ width:22, height:22, borderRadius:"50%", background:C.accent, color:C.bg, display:"flex", alignItems:"center",
                    justifyContent:"center", fontSize:11, fontWeight:900, flexShrink:0, fontFamily:FONT_DISPLAY }}>{i+1}</div>
                  <input value={s} onChange={e=>{ const n=[...steps]; n[i]=e.target.value; setSteps(n); }}
                    placeholder={t("stepPlaceholder")+" "+(i+1)+"…"} style={inputStyle}/>
                </div>
              ))}
            </div>

            {/* COMMITMENTS — 3 separate fields */}
            <div style={{ marginBottom:18 }}>
              <label style={{ ...lbl(), fontSize:11, letterSpacing:1.5 }}>{t("commitments")}</label>
              <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:6 }}>
                <div>
                  <div style={{ fontSize:11, color:C.textMuted, marginBottom:4 }}>{t("daysPerWeek")}</div>
                  <input value={daysPerWeek} onChange={e=>setDaysPerWeek(e.target.value)}
                    placeholder={t("daysPlaceholder")} style={inputStyle}/>
                </div>
                <div>
                  <div style={{ fontSize:11, color:C.textMuted, marginBottom:4 }}>{t("sessionLength")}</div>
                  <input value={sessionLen} onChange={e=>setSessionLen(e.target.value)}
                    placeholder={t("sessionPlaceholder")} style={inputStyle}/>
                </div>
                <div>
                  <div style={{ fontSize:11, color:C.textMuted, marginBottom:4 }}>{t("whereTrain")}</div>
                  <input value={trainWhere} onChange={e=>setTrainWhere(e.target.value)}
                    placeholder={t("locationPlaceholder")} style={inputStyle}/>
                </div>
              </div>
            </div>

            <GoalField label={t("obstaclesAnticipate")} hint="Write all possible hurdles and setbacks you might face on the journey"
              value={obstacles} onChange={setObstacles} rows={3} placeholder={t("obstaclesPlaceholder")}/>

            {/* Link */}
            <div style={{ marginBottom:14 }}>
              <label style={{ ...lbl(), fontSize:11, letterSpacing:1.5 }}>{t("videoRefLinkOptional")}</label>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <input value={link} onChange={e=>setLink(e.target.value)} placeholder="https://youtube.com/…"
                  style={{ flex:1, ...inputStyle }}/>
                {link&&<a href={link.startsWith("http")?link:"https://"+link} target="_blank" rel="noopener noreferrer"
                  style={{ flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center",
                    width:34, height:34, borderRadius:8, background:C.accent, color:C.bg, textDecoration:"none" }}
                  title="Open link"><Ic n="extLink" s={15} c="#fff"/></a>}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
