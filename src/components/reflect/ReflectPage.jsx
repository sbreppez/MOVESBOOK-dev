import React, { useState, useEffect, useRef } from 'react';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { Ic } from '../shared/Ic';
import { Modal } from '../shared/Modal';
import { Btn } from '../shared/Btn';
import { useT, usePlural } from '../../hooks/useTranslation';
import { useSettings } from '../../hooks/useSettings';
import { useTrainModal } from '../../hooks/useTrainContext';
import { CalendarOverlay } from '../calendar/CalendarOverlay';
import { MyStanceSection } from '../stance/MyStanceSection';
import { DevelopmentStory } from '../stance/DevelopmentStory';
import { IdeaTile } from '../train/IdeaTile';
import { PremiumGate } from '../shared/PremiumGate';
import { SectionBrief } from '../shared/SectionBrief';
import { TypeChooserModal } from '../train/TypeChooserModal';
import { ensureHttps } from '../train/helpers';

export const ReflectPage = ({
  ideas, setIdeas, moves, setMoves, reps, sparring, musicflow, habits,
  calendar, setCalendar, cats, catColors, settings, onSettingsChange,
  addToast, stance, battleprep, onToggleBattlePrepTask,
  onOpenStanceAssessment, addCalendarEvent, removeCalendarEvent,
  onSubTabChange, onGoToPrep, initialDay, initialMonth, sets, onAddTrigger, parentSubTab, reports, injuries,
  isPremium
}) => {
  const t = useT();
  const { resultCountStr } = usePlural();
  const { C } = useSettings();
  const { openModal } = useTrainModal();
  const [reflectTab, setReflectTab] = useState(parentSubTab || "calendar");
  const [showStanceConfirm, setShowStanceConfirm] = useState(false);
  const [calendarAddTick, setCalendarAddTick] = useState(0);
  const [showInjuryHistory, setShowInjuryHistory] = useState(false);

  useEffect(() => { if (onSubTabChange) onSubTabChange(reflectTab); }, [reflectTab]);

  // Sync external sub-tab navigation (e.g. from Profile "View Stance" link)
  useEffect(() => {
    if (parentSubTab && ["calendar","stance","goals","notes"].includes(parentSubTab) && parentSubTab !== reflectTab) {
      setReflectTab(parentSubTab);
    }
  }, [parentSubTab]);

  // ── Goals/Notes state (replicated from IdeasPage) ──
  const [view, setView] = useState("list");
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [reorderMode, setReorderMode] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [typeChooser, setTypeChooser] = useState(false);
  const [logEntry, setLogEntry] = useState(null);
  const [logText, setLogText] = useState("");
  const [logLink, setLogLink] = useState("");
  const [hintDismissed, setHintDismissed] = useState(() => {
    try { return localStorage.getItem("mb_hint_goal_journal") === "1"; } catch { return false; }
  });
  const dismissHint = () => { setHintDismissed(true); try { localStorage.setItem("mb_hint_goal_journal", "1"); } catch {} };

  // Add trigger for goals/notes
  const prevAddTrigger = useRef(onAddTrigger);
  useEffect(() => {
    if (onAddTrigger !== prevAddTrigger.current && onAddTrigger > 0) {
      if (reflectTab === "notes") { openModal("note", null, addIdea); }
      else if (reflectTab === "goals") { setTypeChooser(true); }
      else if (reflectTab === "stance") { setShowStanceConfirm(true); }
      else if (reflectTab === "calendar") { setCalendarAddTick(t => t + 1); }
    }
    prevAddTrigger.current = onAddTrigger;
  }, [onAddTrigger]);

  // Auto-link target goals
  const { settings: ideaSettings } = useSettings();
  useEffect(() => {
    if (!ideaSettings.targetAutoLink) return;
    try {
      const m = localStorage.getItem("mb_moves");
      const cnt = m ? JSON.parse(m).length : 0;
      setIdeas(p => p.map(i => (i.type === "target" && i.autoLink) ? { ...i, current: cnt } : i));
    } catch {}
  }, [ideaSettings.targetAutoLink]);

  const addIdea = (fields) => setIdeas(p => [...p, { id: Date.now(), ...fields }]);
  const del = id => setIdeas(p => p.filter(i => i.id !== id));
  const askDelete = (idea) => setConfirmDel(idea);
  const save = (id, fields) => setIdeas(p => p.map(i => i.id === id ? { ...i, ...fields } : i));
  const incrTarget = (id) => setIdeas(p => p.map(i => i.id === id ? { ...i, current: Math.min((i.current || 0) + 1, i.target || 9999) } : i));
  const decrTarget = (id) => setIdeas(p => p.map(i => i.id === id ? { ...i, current: Math.max(0, (i.current || 0) - 1) } : i));
  const confirmLogEntry = (id) => {
    incrTarget(id);
    if (logText.trim()) {
      const entry = { id: Date.now(), date: new Date().toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" }), text: logText.trim(), link: ensureHttps(logLink.trim()) };
      setIdeas(p => p.map(i => i.id === id ? { ...i, journal: [entry, ...(i.journal || [])] } : i));
    }
    setLogEntry(null); setLogText(""); setLogLink("");
  };
  const dup = id => { const orig = ideas.find(i => i.id === id); if (orig) setIdeas(p => [...p, { ...orig, id: Date.now(), title: (orig.title || "") + " (copy)", pinned: false }]); };
  const moveIdeaUp = (idx, list) => {
    if (idx === 0) return;
    setIdeas(prev => {
      const newList = [...list]; [newList[idx], newList[idx - 1]] = [newList[idx - 1], newList[idx]];
      const visibleIds = new Set(list.map(i => i.id));
      const result = []; let vi = 0;
      prev.forEach(item => { if (visibleIds.has(item.id)) result.push(newList[vi++]); else result.push(item); });
      return result;
    });
  };
  const moveIdeaDown = (idx, list) => {
    if (idx === list.length - 1) return;
    setIdeas(prev => {
      const newList = [...list]; [newList[idx], newList[idx + 1]] = [newList[idx + 1], newList[idx]];
      const visibleIds = new Set(list.map(i => i.id));
      const result = []; let vi = 0;
      prev.forEach(item => { if (visibleIds.has(item.id)) result.push(newList[vi++]); else result.push(item); });
      return result;
    });
  };
  const changeColor = (id, color) => setIdeas(p => p.map(i => i.id === id ? { ...i, color } : i));
  const togglePin = (id) => setIdeas(p => p.map(i => i.id === id && i.type !== "goal" ? { ...i, pinned: !i.pinned } : i));

  const q = search.toLowerCase().trim();
  const base = q ? ideas.filter(i => (i.title || "").toLowerCase().includes(q) || (i.text || "").toLowerCase().includes(q)) : ideas;
  const filtered = reorderMode ? base : [
    ...base.filter(i => i.type === "goal"),
    ...base.filter(i => i.type !== "goal" && i.pinned),
    ...base.filter(i => i.type !== "goal" && !i.pinned),
  ];

  const goals = ideas.filter(i => i.type === "goal" || i.type === "target");
  const notes = ideas.filter(i => i.type === "note");

  // Reset search/reorder when switching sub-tabs
  useEffect(() => { setSearch(""); setShowSearch(false); setReorderMode(false); }, [reflectTab]);

  const subTabs = [["calendar", t("calendar")], ["stance", t("stance")], ["goals", t("goals")], ["notes", t("notes")]];

  const renderIdeasList = (tabType) => {
    const visibleIdeas = filtered.filter(i => tabType === "goals" ? (i.type === "goal" || i.type === "target") : i.type === "note");
    const count = tabType === "goals" ? goals.length : notes.length;
    return (
      <>
        {/* Search + view toggle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 16px", flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: C.textMuted, fontFamily: FONT_DISPLAY }}>
            {tabType === "goals" ? t("goals") : t("notes")} · {count}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            {!reorderMode && <button onClick={() => { setShowSearch(s => !s); setSearch(""); }}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: showSearch ? C.accent : C.textSec }}>
              <Ic n="search" s={16} />
            </button>}
            {!reorderMode && <button onClick={() => setView(v => v === "list" ? "tiles" : "list")}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: C.textSec }}>
              <Ic n={view === "list" ? "grid" : "list"} s={16} />
            </button>}
            <button onClick={() => { setReorderMode(r => !r); setSearch(""); setShowSearch(false); }}
              style={{ background: reorderMode ? C.accent : "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: 5,
                color: reorderMode ? C.bg : C.textMuted, fontSize: 13, fontWeight: 800, fontFamily: FONT_DISPLAY, letterSpacing: 1 }}>
              {reorderMode ? "DONE" : "\u21C5"}
            </button>
          </div>
        </div>
        {showSearch && (
          <div style={{ padding: "6px 14px", background: C.surface, borderBottom: `1px solid ${C.borderLight}` }}>
            <div style={{ display: "flex", alignItems: "center", background: C.bg, borderRadius: 7, padding: "5px 10px", gap: 6, border: `1px solid ${search ? C.accent : C.border}` }}>
              <Ic n="search" s={13} c={C.textMuted} />
              <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search\u2026"
                style={{ flex: 1, background: "none", border: "none", outline: "none", color: C.text, fontSize: 13, fontFamily: "inherit" }} />
              {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: 0, display: "flex" }}><Ic n="x" s={13} /></button>}
            </div>
            {search && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>{resultCountStr(visibleIdeas.length)}</div>}
          </div>
        )}
        <div style={{ flex: 1, overflow: "auto", padding: 10, paddingBottom: 76 }}>
          <div style={view === "tiles" ? { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, minWidth: 0 } : { display: "flex", flexDirection: "column", gap: 6 }}>
            {visibleIdeas.map((idea, idx) => (
              <div key={idea.id} style={{ position: "relative", minWidth: 0, overflow: "hidden" }}>
                {reorderMode && (
                  <div style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", zIndex: 10, display: "flex", flexDirection: "column", gap: 2 }}>
                    <button onClick={() => moveIdeaUp(idx, visibleIdeas)} disabled={idx === 0}
                      style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg,
                        cursor: idx === 0 ? "default" : "pointer", color: idx === 0 ? C.border : C.accent,
                        fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{"\u25B2"}</button>
                    <button onClick={() => moveIdeaDown(idx, visibleIdeas)} disabled={idx === visibleIdeas.length - 1}
                      style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg,
                        cursor: idx === visibleIdeas.length - 1 ? "default" : "pointer", color: idx === visibleIdeas.length - 1 ? C.border : C.accent,
                        fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{"\u25BC"}</button>
                  </div>
                )}
                <IdeaTile
                  idea={idea}
                  viewMode={reorderMode ? "list" : view}
                  searchQuery={search}
                  onEdit={() => { if (!reorderMode) openModal(idea.type, idea, fields => save(idea.id, fields)); }}
                  onDelete={() => askDelete(idea)}
                  onDuplicate={() => dup(idea.id)}
                  onChangeColor={col => changeColor(idea.id, col)}
                  onTogglePin={() => togglePin(idea.id)}
                  onIncrTarget={() => incrTarget(idea.id)}
                  onDecrTarget={() => decrTarget(idea.id)}
                  onShowJournalHint={!hintDismissed && !reorderMode && (idea.type === "goal" || idea.type === "target")}
                  onDismissHint={dismissHint}
                  draggable={false} />
              </div>
            ))}
          </div>
          {ideas.length === 0 && <div style={{ textAlign: "center", padding: 50, color: C.textMuted }}><div style={{ fontSize: 32, marginBottom: 10 }}>{"\uD83D\uDCAA"}</div><p style={{ fontSize: 13 }}>{t("emptyGoalsNotes")}</p></div>}
          {visibleIdeas.length === 0 && search && <div style={{ textAlign: "center", padding: 30, color: C.textMuted }}><p style={{ fontSize: 13 }}>{t("noResultsFor")} "{search}"</p></div>}
        </div>
      </>
    );
  };

  return (
    <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Sub-tab nav */}
      <div style={{ display: "flex", background: "transparent", flexShrink: 0 }}>
        {subTabs.map(([id, label]) => {
          const on = reflectTab === id;
          return (
            <button key={id} onClick={() => setReflectTab(id)}
              style={{ flex: 1, padding: "9px 4px", border: "none", cursor: "pointer",
                background: "none", color: on ? C.text : C.textMuted,
                fontSize: 14, fontWeight: 800, letterSpacing: 1.5, fontFamily: FONT_DISPLAY, textTransform: "uppercase" }}>
              <span style={{ borderBottom: `2px solid ${on ? C.accent : "transparent"}`, paddingBottom: 3 }}>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {reflectTab === "calendar" && (
        <><SectionBrief desc={t("calendarBrief")} settings={settings}/>
        <CalendarOverlay inline
          moves={moves} setMoves={setMoves} reps={reps} sparring={sparring} musicflow={musicflow} habits={habits} ideas={ideas} setIdeas={setIdeas}
          calendar={calendar} setCalendar={setCalendar}
          cats={cats} catColors={catColors} settings={settings} onSettingsChange={onSettingsChange}
          addToast={addToast} initialDay={initialDay}
          onGoToPrep={onGoToPrep}
          battleprep={battleprep} initialMonth={initialMonth}
          onToggleBattlePrepTask={onToggleBattlePrepTask}
          onAddTrigger={calendarAddTick} reports={reports} isPremium={isPremium} />
        </>
      )}

      {reflectTab === "stance" && (
        isPremium ? (
          <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
            <SectionBrief desc={t("stanceBrief")} settings={settings}/>
            <MyStanceSection moves={moves || []} stance={stance} sparring={sparring} calendar={calendar} onOpenAssessment={onOpenStanceAssessment} />
            <DevelopmentStory moves={moves || []} sparring={sparring} calendar={calendar} />
          </div>
        ) : <div style={{padding:20}}><PremiumGate feature="myStance" addToast={addToast}/></div>
      )}

      {reflectTab === "goals" && <><SectionBrief desc={t("goalsBrief")} stat={`${goals.length} active goals`} settings={settings}/>{renderIdeasList("goals")}</>}
      {reflectTab === "notes" && (
        <>
          <SectionBrief desc={t("notesBrief")} stat={`${notes.length} notes`} settings={settings}/>
          {/* Injury History accordion */}
          {(() => {
            const resolved = (injuries || []).filter(i => i.resolved).sort((a, b) => (b.resolvedDate || b.date || b.startDate || "").localeCompare(a.resolvedDate || a.date || a.startDate || ""));
            if (resolved.length === 0) return null;
            const sevColors = { 1:C.green, 2:C.yellow, 3:C.accent };
            const sevLabels = { 1:"severityMild", 2:"severityModerate", 3:"severitySevere" };
            const daysBetween = (d1, d2) => { if(!d1||!d2) return null; return Math.max(1, Math.floor((new Date(d2+"T12:00:00") - new Date(d1+"T12:00:00")) / 86400000)); };
            return (
              <div style={{ margin:"0 16px 12px", background:C.surface, borderRadius:10, overflow:"hidden" }}>
                <button onClick={() => setShowInjuryHistory(p => !p)}
                  style={{ display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%",
                    padding:"12px 14px", background:"none", border:"none", cursor:"pointer" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:11, fontWeight:800, letterSpacing:1.5, color:C.textMuted, fontFamily:FONT_DISPLAY }}>
                      {t("injuryHistory")}
                    </span>
                    <span style={{ fontSize:10, fontWeight:800, color:C.accent, background:`${C.accent}18`, borderRadius:10, padding:"2px 7px", fontFamily:FONT_DISPLAY }}>
                      {resolved.length}
                    </span>
                  </div>
                  <Ic n={showInjuryHistory ? "chevU" : "chevD"} s={14} c={C.textMuted}/>
                </button>
                {showInjuryHistory && (
                  <div style={{ padding:"0 14px 12px" }}>
                    {resolved.map(inj => {
                      const dateStart = inj.date || inj.startDate;
                      const dur = daysBetween(dateStart, inj.resolvedDate);
                      return (
                        <div key={inj.id} style={{ padding:"10px 0", borderTop:`1px solid ${C.borderLight}` }}>
                          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                            {inj.severity && <div style={{ width:8, height:8, borderRadius:4, background:sevColors[inj.severity], flexShrink:0 }}/>}
                            <span style={{ fontSize:13, fontWeight:700, color:C.text, fontFamily:FONT_BODY }}>
                              {inj.side ? `${t(inj.side === "left" ? "leftSide" : "rightSide")} ` : ""}{inj.bodyPart}
                            </span>
                            {inj.severity && <span style={{ fontSize:10, fontWeight:700, color:sevColors[inj.severity], fontFamily:FONT_DISPLAY }}>{t(sevLabels[inj.severity])}</span>}
                          </div>
                          <div style={{ fontSize:11, color:C.textMuted, fontFamily:FONT_BODY, marginBottom:4 }}>
                            {dateStart}{inj.resolvedDate ? ` → ${inj.resolvedDate}` : ""}{dur ? ` (${dur} ${t("daysInjured")})` : ""}
                          </div>
                          {inj.preventionNote && (
                            <div style={{ fontSize:13, color:C.yellow, fontFamily:FONT_BODY, fontStyle:"italic", marginBottom:4, lineHeight:1.5 }}>
                              {inj.preventionNote}
                            </div>
                          )}
                          {inj.description && <div style={{ fontSize:11, color:C.textSec, fontFamily:FONT_BODY, lineHeight:1.4 }}>{inj.description}</div>}
                          {inj.cause && <div style={{ fontSize:11, color:C.textMuted, fontFamily:FONT_BODY, marginTop:2 }}>{t("whatCausedIt")}: {inj.cause}</div>}
                          {inj.treatment && <div style={{ fontSize:11, color:C.textMuted, fontFamily:FONT_BODY, marginTop:2 }}>{t("treatmentPlan")}: {inj.treatment}</div>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
          {renderIdeasList("notes")}
        </>
      )}

      {/* Type chooser for adding goals */}
      {typeChooser && <TypeChooserModal onClose={() => setTypeChooser(false)} onChoose={tp => { setTypeChooser(false); openModal(tp, null, addIdea); }} />}

      {/* Delete confirmation */}
      {confirmDel && (
        <Modal onClose={() => setConfirmDel(null)}>
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: C.text }}>{t("confirmDeleteIdea")}</div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <Btn variant="secondary" onClick={() => setConfirmDel(null)}>{t("cancel")}</Btn>
              <Btn variant="danger" onClick={() => { del(confirmDel.id); setConfirmDel(null); }}>{t("delete")}</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Stance assessment confirmation */}
      {showStanceConfirm && (
        <Modal onClose={() => setShowStanceConfirm(false)}>
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, color: C.text, fontFamily: FONT_DISPLAY }}>{t("updateStance")}</div>
            <div style={{ fontSize: 13, color: C.textSec, marginBottom: 18, lineHeight: 1.5 }}>{t("updateStanceConfirm")}</div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <Btn variant="secondary" onClick={() => setShowStanceConfirm(false)}>{t("cancel")}</Btn>
              <Btn style={{ background: C.accent, color: "#fff" }} onClick={() => { setShowStanceConfirm(false); if (onOpenStanceAssessment) onOpenStanceAssessment(); }}>{t("confirm")}</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Log entry modal for target goals */}
      {logEntry && (
        <Modal onClose={() => { setLogEntry(null); setLogText(""); setLogLink(""); }}>
          <div style={{ padding: "6px 0" }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: C.text, fontFamily: FONT_DISPLAY }}>{t("logProgress")}</div>
            <textarea value={logText} onChange={e => setLogText(e.target.value)} rows={3} placeholder={t("whatDidYouDo")}
              style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 10, fontSize: 14, color: C.text, fontFamily: FONT_BODY, resize: "none", outline: "none", boxSizing: "border-box", marginBottom: 8 }} />
            <input value={logLink} onChange={e => setLogLink(e.target.value)} placeholder={t("videoLinkOptional")}
              style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 10px", fontSize: 13, color: C.text, fontFamily: FONT_BODY, outline: "none", boxSizing: "border-box", marginBottom: 12 }} />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Btn variant="secondary" onClick={() => { setLogEntry(null); setLogText(""); setLogLink(""); }}>{t("cancel")}</Btn>
              <Btn onClick={() => confirmLogEntry(logEntry.id)}>{t("save")}</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
