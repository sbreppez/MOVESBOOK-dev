import React, { useState } from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { lbl } from '../../constants/styles';
import { Btn } from '../shared/Btn';
import { Ic } from '../shared/Ic';
import { useT } from '../../hooks/useTranslation';
import { ensureHttps } from './helpers';
import { todayLocal } from '../../utils/dateUtils';
import { Txtarea } from '../shared/Txtarea';
import { JournalEntryCard } from './JournalEntryCard';
import { JournalEntryInput } from './JournalEntryInput';

const buildLegacyDump = (idea, t) => {
  const sections = [];
  if (idea?.why?.trim()) sections.push(`${t("legacyDumpWhy")}\n${idea.why.trim()}`);
  const steps = (idea?.steps || []).filter(s => s && s.trim());
  if (steps.length) {
    const numbered = steps.map((s, i) => `${i + 1}. ${s.trim()}`).join("\n");
    sections.push(`${t("legacyDumpSteps")}\n${numbered}`);
  }
  if (idea?.obstacles?.trim()) sections.push(`${t("legacyDumpObstacles")}\n${idea.obstacles.trim()}`);
  return sections.join("\n\n");
};

export const GoalModal = ({ onClose, onSave, idea, prefill }) => {
  const t = useT();
  const isEdit = !!idea;
  const isLegacy = isEdit && !idea.legacyMigrated && !idea.description &&
    (idea.why?.trim() || idea.steps?.some(s => s && s.trim()) || idea.obstacles?.trim());
  const initialDescription = idea?.description ?? (isLegacy ? buildLegacyDump(idea, t) : "");

  const [activeTab,    setActiveTab]    = useState(isEdit ? "journal" : "goal");
  const [title,        setTitle]        = useState(idea?.title || prefill?.title || "");
  const [description,  setDescription]  = useState(initialDescription);
  const [byWhen,       setByWhen]       = useState(idea?.byWhen || "");
  const [journal,      setJournal]      = useState(idea?.journal || []);
  const [link,         setLink]         = useState(idea?.link || "");

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      type: "goal",
      pinned: true,
      title: title.trim(),
      description,
      byWhen,
      link: ensureHttps(link.trim()),
      journal,
      text: "",
      createdDate: idea?.createdDate || todayLocal(),
      legacyMigrated: true,
    });
    onClose();
  };

  const deleteJournalEntry = (id) => setJournal(j => j.filter(e => e.id !== id));

  const inputStyle = { width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8,
    padding:"9px 12px", color:C.text, fontSize:13, outline:"none", fontFamily:FONT_BODY, boxSizing:"border-box" };

  const tabs = isEdit
    ? [{id:"journal",label:t("journal")},{id:"goal",label:t("goal")}]
    : [{id:"goal",label:t("goal")}];

  return (
    <div style={{ width:"100%", maxHeight:"92%", background:C.bg, borderRadius:16, display:"flex", flexDirection:"column", overflow:"hidden", boxShadow:"0 16px 48px rgba(0,0,0,0.5)" }}>
      {/* Header — title + helper, no buttons */}
      <div style={{ padding:"16px 20px 12px", flexShrink:0 }}>
        <div style={{ fontWeight:900, fontSize:16, letterSpacing:1.5, fontFamily:FONT_DISPLAY, color:C.text }}>
          {isEdit ? t("editGoal") : t("newGoal")}
        </div>
        <div style={{ fontSize:12, color:C.textMuted, fontFamily:FONT_BODY, fontStyle:"italic", lineHeight:1.5, marginTop:4 }}>
          {t("goalModalHelper")}
        </div>
      </div>

      {/* Tab switcher — only when editing */}
      {isEdit && (
        <div style={{ display:"flex", background:C.bg, borderBottom:`2px solid ${C.border}`, flexShrink:0 }}>
          {tabs.map(tb => {
            const on = activeTab === tb.id;
            return (
              <button key={tb.id} onClick={() => setActiveTab(tb.id)}
                style={{ flex:1, padding:"10px 6px", border:"none", cursor:"pointer", background:on ? C.surface : "transparent",
                  color:on ? C.text : C.textMuted, borderBottom:`3px solid ${on ? C.accent : "transparent"}`,
                  fontSize:11, fontWeight:800, letterSpacing:1.5, fontFamily:FONT_DISPLAY }}>
                {tb.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Body */}
      <div style={{ flex:1, overflow:"auto", padding:"16px 20px" }}>

        {/* ── JOURNAL TAB ── */}
        {activeTab === "journal" && (
          <div>
            <JournalEntryInput
              onAdd={({text,link}) => { const entry = {id:Date.now(), date:new Date().toLocaleDateString("en-AU",{day:"2-digit",month:"short",year:"numeric"}), text, link}; setJournal(j => [entry, ...j]); }}
            />
            {journal.length === 0 ? (
              <div style={{ textAlign:"center", padding:"40px 20px", color:C.textMuted }}>
                <div style={{ marginBottom:8 }}><Ic n="book" s={28} c={C.textMuted}/></div>
                <div style={{ fontSize:13 }}>{t("emptyEntries")}</div>
              </div>
            ) : journal.map(entry => (
              <JournalEntryCard key={entry.id} entry={entry}
                onDelete={() => deleteJournalEntry(entry.id)}
                onUpdate={(updated) => setJournal(j => j.map(e => e.id === entry.id ? {...e, ...updated} : e))}
              />
            ))}
          </div>
        )}

        {/* ── GOAL TAB — 4 fields: Title, Description, Deadline, Video reference ── */}
        {activeTab === "goal" && (
          <div>
            <div style={{ marginBottom:16 }}>
              <label style={lbl()}>{t("goalTitleLabel")}</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder={t("goalTitlePlaceholder")}
                style={{ ...inputStyle, border:`1.5px solid ${C.accent}`, fontSize:14, fontWeight:700, fontFamily:FONT_DISPLAY, letterSpacing:0.5 }}/>
            </div>

            <Txtarea label={t("goalDescriptionLabel")} value={description} onChange={setDescription}
              placeholder={t("goalDescriptionPlaceholder")} rows={4} autoExpand/>

            <div style={{ marginBottom:16 }}>
              <label style={lbl()}>{t("goalDeadlineLabel")}</label>
              <input type="date" value={byWhen} onChange={e => setByWhen(e.target.value)}
                style={{ ...inputStyle, colorScheme: C.bg === "#0A0A0A" ? "dark" : "light" }}/>
            </div>

            <div>
              <label style={lbl()}>{t("goalVideoRefLabel")}</label>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <input value={link} onChange={e => setLink(e.target.value)} placeholder="https://youtube.com/…"
                  style={{ flex:1, ...inputStyle }}/>
                {link && <a href={link.startsWith("http") ? link : "https://" + link} target="_blank" rel="noopener noreferrer"
                  style={{ flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center",
                    width:34, height:34, borderRadius:8, background:C.accent, color:C.bg, textDecoration:"none" }}
                  title="Open link"><Ic n="extLink" s={15} c="#fff"/></a>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer — Save/Cancel always visible */}
      <div style={{ display:"flex", gap:8, justifyContent:"flex-end", padding:"16px 20px",
        borderTop:`1px solid ${C.borderLight}`, flexShrink:0 }}>
        <Btn variant="ghost" onClick={onClose}>{t("cancel")}</Btn>
        <Btn onClick={handleSave} disabled={!title.trim()}>{t("save")}</Btn>
      </div>
    </div>
  );
};
