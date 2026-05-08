import React, { useState, useMemo, useEffect } from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { Modal } from '../shared/Modal';
import { Inp } from '../shared/Inp';
import { Txtarea } from '../shared/Txtarea';
import { Sel } from '../shared/Sel';
import { Btn } from '../shared/Btn';
import { ExecutionLevelBattery } from '../shared/ExecutionLevelBattery';
import { Ic } from '../shared/Ic';
import { useT } from '../../hooks/useTranslation';
import { CATS, CAT_COLORS } from '../../constants/categories';
import { AttributeChips } from './AttributeChips';
import { AttributeModal } from '../modals/AttributeModal';
import { masteryColor, lbl, inp } from '../../constants/styles';
import { todayLocal } from '../../utils/dateUtils';

const DOMAIN_OPTS = ["musicality","performance","technique","variety","creativity","personality"];
const ORIGIN_KEYS = ["learned","version","creation"];
const ORIGIN_HINTS = { learned:"foundationalHint", version:"myVersionHint", creation:"myCreationHint" };
const ORIGIN_LABELS = { learned:"foundational", version:"myVersion", creation:"myCreation" };

const TENSION_ROLE_OPTS = [
  { key:"flow",  icon:"waves",      label:"tensionFlow", hint:"flowHint" },
  { key:"build", icon:"trendingUp", label:"tensionBuild", hint:"buildHint" },
  { key:"hit",   icon:"zap",        label:"tensionHit", hint:"hitHint" },
  { key:"peak",  icon:"flame",      label:"tensionPeak", hint:"peakHint" },
];

const chipStyle = (active) => ({
  border:`1.5px solid ${active ? C.accent : C.border}`, cursor:"pointer",
  borderRadius:20, fontFamily:FONT_DISPLAY, fontWeight:700, letterSpacing:0.3,
  fontSize:11, padding:"5px 12px", whiteSpace:"nowrap", transition:"all 0.15s",
  background: active ? C.accent : C.surface,
  color: active ? C.bg : C.textSec,
});

const sectionLabel = { fontSize:10, fontWeight:800, letterSpacing:1, color:C.textMuted, fontFamily:FONT_DISPLAY, marginBottom:6 };

export const MoveModal = ({ onClose, onSave, move, initialCat="Footworks", initialDesc="", cats=CATS, customAttrs=[], onAddAttr, allMoves=[], catColors=CAT_COLORS, isPremium }) => {
  const t = useT();
  const [f,setF] = useState({ name:"", category:initialCat, description:initialDesc||"", link:"", mastery:10, date:todayLocal(), rotation:"", travelling:"", custom:"", attrs:{}, origin:"learned", musicEnergy:null, tensionRole:null, parentId:null, repsHistory:[], ...move });
  const set = k => v => setF(p=>({...p,[k]:v}));
  const [journalEntries, setJournalEntries] = useState(move?.journal || []);
  const [newJournalText, setNewJournalText] = useState("");
  const [showJournal, setShowJournal] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('mb_editmove_journal') === 'true';
  });
  useEffect(() => {
    localStorage.setItem('mb_editmove_journal', String(showJournal));
  }, [showJournal]);
  const handleSave = () => {
    if (!f.name) return;
    const newRepsHistory = manualDelta > 0
      ? [...(f.repsHistory || []), { date: todayLocal(), count: manualDelta, source: 'manual' }]
      : (f.repsHistory || []);
    onSave({ ...f, journal: journalEntries, repsHistory: newRepsHistory });
    onClose();
  };
  const [showAttrModal, setShowAttrModal] = useState(false);
  const [showBasedOn, setShowBasedOn] = useState(!!f.parentId);
  const [basedOnFilter, setBasedOnFilter] = useState(f.category || "");
  const [basedOnSearch, setBasedOnSearch] = useState("");

  const [showDepth, setShowDepth] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('mb_editmove_depth') === 'true';
  });
  useEffect(() => {
    localStorage.setItem('mb_editmove_depth', String(showDepth));
  }, [showDepth]);

  const [showTensionExplainer, setShowTensionExplainer] = useState(false);
  const [showAttributesExplainer, setShowAttributesExplainer] = useState(false);

  const [manualDelta, setManualDelta] = useState(0);
  const [showRepsBreakdown, setShowRepsBreakdown] = useState(false);
  const repsBySource = useMemo(() => {
    const sums = { manual: 0, drill: 0, sparring: 0, flashcards: 0 };
    for (const entry of (f.repsHistory || [])) {
      if (sums[entry.source] !== undefined) {
        sums[entry.source] += entry.count;
      }
    }
    return sums;
  }, [f.repsHistory]);
  const totalReps =
    repsBySource.manual + repsBySource.drill + repsBySource.sparring + repsBySource.flashcards + manualDelta;

  const setAttr = (attrId, val) => {
    setF(p => ({ ...p, attrs: { ...(p.attrs || {}), [attrId]: val } }));
  };

  const sortedAttrs = [...customAttrs].sort((a,b) => (a.order||0) - (b.order||0));

  // ── Based On: filtered move list ──
  const basedOnMoves = useMemo(() => {
    let pool = allMoves.filter(m => m.id !== (move?.id || f.id));
    if (basedOnFilter) pool = pool.filter(m => m.category === basedOnFilter);
    if (basedOnSearch.trim()) {
      const q = basedOnSearch.toLowerCase();
      pool = pool.filter(m => m.name.toLowerCase().includes(q));
    }
    return pool.slice(0, 50);
  }, [allMoves, move, f.id, basedOnFilter, basedOnSearch]);

  const parentMove = f.parentId ? allMoves.find(m => m.id === f.parentId) : null;

  const SectionHeader = ({ label, expanded, onToggle, showDot = false }) => (
    <button
      onClick={onToggle}
      style={{
        display:'flex', alignItems:'center', gap:6, width:'100%',
        background:'none', border:'none', cursor:'pointer',
        padding:'12px 0 8px', borderTop:`1px solid ${C.borderLight}`,
        marginTop:12,
      }}
    >
      <Ic n={expanded ? 'chevD' : 'chevR'} s={12} c={C.textMuted}/>
      <span style={{
        fontSize:11, fontWeight:800, letterSpacing:1.5,
        color:C.text, fontFamily:FONT_DISPLAY,
        textTransform:'uppercase',
      }}>
        {label}
      </span>
      {showDot && (
        <span style={{
          width:6, height:6, borderRadius:'50%',
          background:C.accent, marginLeft:4,
        }}/>
      )}
    </button>
  );

  return (
    <Modal title={move?t("editMove"):t("addMove")} onClose={onClose}
      footer={
        <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
          <Btn variant="secondary" onClick={onClose}>{t("cancel")}</Btn>
          <Btn onClick={handleSave} disabled={!f.name}>{t("confirm")}</Btn>
        </div>
      }>
      <Sel label={t("categories")} value={f.category} onChange={set("category")} options={cats.map(c=>({value:c,label:c}))}/>
      <Inp label={t("name") + " *"} value={f.name} onChange={set("name")} placeholder={t("moveNamePlaceholder")}/>

      <Txtarea label={t("description")} value={f.description} onChange={set("description")} placeholder={t("describeMove")} autoExpand/>
      <div style={{ marginBottom:14 }}>
        <label style={lbl()}>{t("videoLink")}</label>
        {!f.link && <div style={{ fontSize:11, color:C.textMuted, fontStyle:"italic", marginTop:-2, marginBottom:5 }}>{t("videoLinkHint")}</div>}
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <input value={f.link} onChange={e=>set("link")(e.target.value)} placeholder="https://youtube.com/\u2026" style={{...inp(), flex:1}}/>
          {f.link&&<a href={f.link.startsWith("http")?f.link:"https://"+f.link} target="_blank" rel="noopener noreferrer"
            style={{ flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center",
              width:34, height:34, borderRadius:8, background:C.accent, color:C.bg, border:"none", textDecoration:"none" }}
            title={t("openLink")}>
            <Ic n="extLink" s={15} c="#fff"/>
          </a>}
        </div>
      </div>

      {/* ── STATE ── */}
      <ExecutionLevelBattery value={f.mastery} onChange={set("mastery")}/>

      {/* ── Total Reps ── */}
      <div style={{ marginBottom: 16 }}>
        <label style={lbl()}>{t('totalReps')}</label>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          marginTop: 6,
        }}>
          {/* Total + chevron (left) */}
          <button
            onClick={() => setShowRepsBreakdown(p => !p)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 0,
            }}
          >
            <span style={{
              fontSize: 28, fontWeight: 800, color: C.text,
              fontFamily: FONT_DISPLAY, lineHeight: 1,
            }}>
              {totalReps}
            </span>
            <Ic n={showRepsBreakdown ? 'chevD' : 'chevR'} s={12} c={C.textMuted}/>
          </button>
          {/* +/- buttons (right) */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            <button
              onClick={() => setManualDelta(d => Math.max(0, d - 1))}
              disabled={manualDelta === 0}
              style={{
                width: 32, height: 32, borderRadius: 4,
                background: C.surfaceAlt, border: 'none',
                cursor: manualDelta === 0 ? 'default' : 'pointer',
                opacity: manualDelta === 0 ? 0.4 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Ic n="minus" s={16} c={C.text}/>
            </button>
            <button
              onClick={() => setManualDelta(d => d + 1)}
              style={{
                width: 32, height: 32, borderRadius: 4,
                background: C.surfaceAlt, border: 'none',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Ic n="plus" s={16} c={C.text}/>
            </button>
          </div>
        </div>
        {/* Breakdown */}
        {showRepsBreakdown && (
          <div style={{
            marginTop: 10, padding: 10,
            background: C.surfaceAlt, borderRadius: 8,
          }}>
            {[
              { label: t('repSourceManual'), count: repsBySource.manual + manualDelta },
              { label: t('repSourceDrill'), count: repsBySource.drill },
              { label: t('repSourceSparring'), count: repsBySource.sparring },
              { label: t('repSourceSets'), count: repsBySource.flashcards },
            ].map(row => (
              <div key={row.label} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '4px 0', fontSize: 12, fontFamily: FONT_BODY,
              }}>
                <span style={{ color: C.textSec }}>{row.label}</span>
                <span style={{ color: C.text, fontWeight: 700 }}>{row.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Difficulty ── */}
      <div style={{ marginTop:8, marginBottom:4 }}>
        <div style={sectionLabel}>{t("difficulty")}</div>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {["easy","intermediate","advanced"].map(d => {
            const active = f.difficulty === d;
            return (
              <button key={d} onClick={() => setF(p => ({...p, difficulty: active ? null : d}))}
                style={chipStyle(active)}>
                {t("difficulty_"+d)}
              </button>
            );
          })}
        </div>
        <div style={{
          fontSize: 11, color: C.textMuted, fontStyle: 'italic',
          marginTop: 6,
        }}>
          {t("difficultyBrief")}
        </div>
      </div>

      {/* ── DEPTH (collapsible) ── */}
      <SectionHeader
        label={t("depthSection")}
        expanded={showDepth}
        onToggle={() => setShowDepth(p => !p)}
        showDot={!showDepth && !f.tensionRole}
      />

      {showDepth && (
        <div>
          {/* ── Tension Role ── */}
          <div style={{ marginTop:8, marginBottom:4 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 4 }}>
              <div style={sectionLabel}>{t("tensionRole")}</div>
              <button
                onClick={() => setShowTensionExplainer(p => !p)}
                aria-label="Tension Role info"
                style={{
                  background:'none', border:'none', cursor:'pointer',
                  padding: 4, display:'flex', alignItems:'center', justifyContent:'center',
                }}
              >
                <Ic n="info" s={14} c={showTensionExplainer ? C.accent : C.textMuted} />
              </button>
            </div>
            {!f.tensionRole && !showTensionExplainer && (
              <div style={{ fontSize:11, color:C.textMuted, fontStyle:"italic", marginBottom:6 }}>
                ↳ {t("tensionRoleNudge")}
              </div>
            )}
            {showTensionExplainer && (
              <div style={{
                background: C.surfaceAlt, borderRadius: 8,
                padding: 12, marginBottom: 8, position: 'relative',
              }}>
                <button
                  onClick={() => setShowTensionExplainer(false)}
                  aria-label="Close explainer"
                  style={{
                    position: 'absolute', top: 8, right: 8,
                    background:'none', border:'none', cursor:'pointer', padding: 4,
                  }}
                >
                  <Ic n="x" s={12} c={C.textMuted} />
                </button>
                <div style={{
                  fontSize: 12, color: C.text, fontFamily: FONT_BODY,
                  lineHeight: 1.5, paddingRight: 24,
                }}>
                  {t("tensionExplainerP1")}
                </div>
                <div style={{
                  fontSize: 12, color: C.text, fontFamily: FONT_BODY,
                  lineHeight: 1.5, paddingRight: 24, marginTop: 8,
                }}>
                  {t("tensionExplainerP2")}
                </div>
              </div>
            )}
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {TENSION_ROLE_OPTS.map(r => {
                const active = f.tensionRole === r.key;
                return (
                  <button
                    key={r.key}
                    onClick={() => setF(p => ({...p, tensionRole: active ? null : r.key}))}
                    style={{
                      ...chipStyle(active),
                      display:'inline-flex', alignItems:'center', gap:6,
                    }}
                  >
                    <Ic n={r.icon} s={14} c={active ? C.bg : C.textSec} />
                    <span>{t(r.label)}</span>
                  </button>
                );
              })}
            </div>
            {f.tensionRole && (
              <div style={{ fontSize:11, color:C.textMuted, fontStyle:"italic", marginTop:5 }}>
                {t(TENSION_ROLE_OPTS.find(r => r.key === f.tensionRole)?.hint || "")}
              </div>
            )}
          </div>

          {/* ── Lineage subgroup (premium) ── */}
          {isPremium && (
            <div style={{ marginTop:16, marginBottom:8 }}>
              <div style={{ fontSize:10, fontWeight:800, letterSpacing:1.2, color:C.textMuted, fontFamily:FONT_DISPLAY, textTransform:"uppercase", marginBottom:8 }}>
                {t("lineage")}
              </div>

              {/* ── Origin ── */}
              <div style={{ marginTop:8, marginBottom:4 }}>
                <div style={sectionLabel}>{t("origin")}</div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {ORIGIN_KEYS.map(o => {
                    const active = f.origin === o;
                    return (
                      <button key={o} onClick={() => setF(p => ({...p, origin: o}))}
                        style={chipStyle(active)}>
                        {t(ORIGIN_LABELS[o])}
                      </button>
                    );
                  })}
                </div>
                <div style={{ fontSize:11, color:C.textMuted, fontStyle:"italic", marginTop:5 }}>
                  {t(ORIGIN_HINTS[f.origin || "learned"])}
                </div>
              </div>

              {/* ── Based On (parent move) ── */}
              <div style={{ marginTop:12, marginBottom:8 }}>
                <label style={lbl()}>{t("basedOn")}</label>
                <div style={{ fontSize:11, color:C.textMuted, fontStyle:"italic", marginTop:-2, marginBottom:5 }}>{t("basedOnHint")}</div>
                {!showBasedOn && !f.parentId ? (
                  <button onClick={() => setShowBasedOn(true)}
                    style={{ background:"none", border:"none", cursor:"pointer", padding:0,
                      fontSize:11, color:C.textMuted, fontStyle:"italic" }}>
                    + {t("linkToParent")}
                  </button>
                ) : parentMove ? (
                  <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:C.surfaceAlt, borderRadius:20, padding:"4px 10px 4px 12px", border:`1px solid ${C.border}` }}>
                    <span style={{ fontSize:11, fontWeight:700, color:C.text, fontFamily:FONT_DISPLAY }}>{parentMove.name}</span>
                    <button onClick={() => setF(p=>({...p, parentId:null}))}
                      style={{ background:"none", border:"none", cursor:"pointer", padding:2, display:"flex" }}>
                      <Ic n="x" s={12} c={C.textMuted}/>
                    </button>
                  </div>
                ) : (
                  <div style={{ background:C.surfaceAlt, borderRadius:10, padding:10, border:`1px solid ${C.borderLight}`, position:"relative" }}>
                    <button
                      onClick={() => { setShowBasedOn(false); setBasedOnFilter(""); setBasedOnSearch(""); }}
                      aria-label="Close picker"
                      style={{
                        position:"absolute", top:6, right:6,
                        background:"none", border:"none", cursor:"pointer", padding:4,
                        display:"flex", alignItems:"center", justifyContent:"center",
                      }}
                    >
                      <Ic n="x" s={12} c={C.textMuted}/>
                    </button>
                    {/* Category filter chips */}
                    <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:8, paddingRight:24 }}>
                      <button onClick={() => setBasedOnFilter("")}
                        style={chipStyle(!basedOnFilter)}>
                        {t("all") || "All"}
                      </button>
                      {cats.map(c => (
                        <button key={c} onClick={() => setBasedOnFilter(basedOnFilter === c ? "" : c)}
                          style={chipStyle(basedOnFilter === c)}>
                          {c}
                        </button>
                      ))}
                    </div>
                    {/* Search */}
                    <div style={{ display:"flex", alignItems:"center", background:C.bg, borderRadius:7, padding:"5px 10px", gap:6, border:`1px solid ${C.border}`, marginBottom:8 }}>
                      <Ic n="search" s={13} c={C.textMuted}/>
                      <input value={basedOnSearch} onChange={e=>setBasedOnSearch(e.target.value)} placeholder={t("searchMoves")}
                        style={{ flex:1, background:"none", border:"none", outline:"none", color:C.text, fontSize:13, fontFamily:FONT_BODY }}/>
                      {basedOnSearch&&<button onClick={()=>setBasedOnSearch("")} style={{ background:"none", border:"none", cursor:"pointer", color:C.textMuted, padding:0, display:"flex" }}><Ic n="x" s={13}/></button>}
                    </div>
                    {/* Move list */}
                    <div style={{ maxHeight:180, overflowY:"auto" }}>
                      {basedOnMoves.length === 0 ? (
                        <div style={{ fontSize:11, color:C.textMuted, textAlign:"center", padding:12 }}>No moves found</div>
                      ) : basedOnMoves.map(m => {
                        const col = masteryColor(m.mastery || 0);
                        const catCol = catColors[m.category] || C.accent;
                        return (
                          <button key={m.id} onClick={() => setF(p=>({...p, parentId: m.id}))}
                            style={{ display:"flex", alignItems:"center", gap:8, width:"100%", padding:"7px 8px", background:"none", border:"none", borderBottom:`1px solid ${C.borderLight}`, cursor:"pointer", textAlign:"left" }}>
                            <div style={{ width:6, height:6, borderRadius:"50%", background:catCol, flexShrink:0 }}/>
                            <span style={{ flex:1, fontSize:13, color:C.text, fontFamily:FONT_BODY, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.name}</span>
                            <span style={{ fontSize:11, color:col, fontWeight:700, flexShrink:0 }}>{m.mastery||0}%</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Domains (multi-select) ── */}
          <div style={{ marginTop:8, marginBottom:4 }}>
            <div style={sectionLabel}>{t("domains")}</div>
            <div style={{ fontSize:11, color:C.textMuted, marginBottom:6 }}>{t("whatDoesThisMoveDevelop")}</div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {DOMAIN_OPTS.map(d => {
                const domains = Array.isArray(f.domains) ? f.domains : [];
                const active = domains.includes(d);
                return (
                  <button key={d} onClick={() => setF(p => {
                    const prev = Array.isArray(p.domains) ? p.domains : [];
                    return {...p, domains: active ? prev.filter(x => x !== d) : [...prev, d]};
                  })} style={chipStyle(active)}>
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Custom Attributes ── */}
          <div style={{ marginTop:8, marginBottom:4 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 4 }}>
              <div style={sectionLabel}>{t("attributes")}</div>
              <button
                onClick={() => setShowAttributesExplainer(p => !p)}
                aria-label="Custom Attributes info"
                style={{
                  background:'none', border:'none', cursor:'pointer',
                  padding: 4, display:'flex', alignItems:'center', justifyContent:'center',
                }}
              >
                <Ic n="info" s={14} c={showAttributesExplainer ? C.accent : C.textMuted} />
              </button>
            </div>
            <div style={{ fontSize:11, color:C.textMuted, fontStyle:"italic", marginBottom:6 }}>{t("attributesHint")}</div>
            {showAttributesExplainer && (
              <div style={{
                background: C.surfaceAlt, borderRadius: 8,
                padding: 12, marginBottom: 8, position: 'relative',
              }}>
                <button
                  onClick={() => setShowAttributesExplainer(false)}
                  aria-label="Close explainer"
                  style={{
                    position: 'absolute', top: 8, right: 8,
                    background:'none', border:'none', cursor:'pointer', padding: 4,
                  }}
                >
                  <Ic n="x" s={12} c={C.textMuted} />
                </button>
                <div style={{
                  fontSize: 12, color: C.text, fontFamily: FONT_BODY,
                  lineHeight: 1.5, paddingRight: 24,
                }}>
                  {t("attributesExplainerP1")}
                </div>
                <div style={{
                  fontSize: 12, color: C.text, fontFamily: FONT_BODY,
                  lineHeight: 1.5, paddingRight: 24, marginTop: 8,
                }}>
                  {t("attributesExplainerP2")}
                </div>
              </div>
            )}
            <div style={{ background:C.surfaceAlt, borderRadius:10, padding:12, marginBottom:12,
              border:`1px solid ${C.borderLight}` }}>
              {sortedAttrs.length > 0 ? (
                sortedAttrs.map(attr => (
                  <div key={attr.id} style={{ marginBottom:10 }}>
                    <div style={{ fontSize:10, fontWeight:800, letterSpacing:1, color:C.textMuted,
                      fontFamily:FONT_DISPLAY, marginBottom:4 }}>
                      {attr.name}{attr.multi ? " (multi)" : ""}
                    </div>
                    <AttributeChips
                      attr={attr}
                      selected={f.attrs?.[attr.id] || (attr.multi ? [] : "")}
                      onChange={val => setAttr(attr.id, val)}
                    />
                  </div>
                ))
              ) : (
                <div style={{ fontSize:11, color:C.textMuted, fontStyle:"italic", marginBottom:6 }}>
                  {t("noAttributesDefined")}
                </div>
              )}
              <button onClick={() => setShowAttrModal(true)}
                style={{ background:"none", border:"none", cursor:"pointer", fontSize:11,
                  color:C.accent, fontWeight:700, fontFamily:FONT_DISPLAY, padding:"4px 0" }}>
                + {t("addNewAttribute")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Move Journal ── */}
      {move && (
        <>
          <SectionHeader
            label={`${t("moveJournal")} (${journalEntries.length})`}
            expanded={showJournal}
            onToggle={() => setShowJournal(p => !p)}
          />

          {showJournal && (
            <div style={{ marginTop: 6 }}>
              {/* Add entry */}
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                <textarea
                  value={newJournalText}
                  onChange={e => setNewJournalText(e.target.value)}
                  placeholder={t("journalEntryPlaceholder")}
                  rows={2}
                  style={{ flex: 1, background: C.surfaceAlt, border: `1px solid ${C.border}`,
                    borderRadius: 8, padding: "8px 10px", color: C.text, fontSize: 12,
                    fontFamily: FONT_BODY, outline: "none", resize: "none", lineHeight: 1.4 }}
                />
                <button
                  onClick={() => {
                    if (!newJournalText.trim()) return;
                    const entry = {
                      id: Date.now(),
                      date: todayLocal(),
                      text: newJournalText.trim(),
                    };
                    setJournalEntries(prev => [entry, ...prev]);
                    setNewJournalText("");
                  }}
                  disabled={!newJournalText.trim()}
                  style={{ alignSelf: "flex-end", width: 36, height: 36, borderRadius: 8,
                    background: newJournalText.trim() ? C.accent : C.surfaceAlt,
                    border: "none", cursor: newJournalText.trim() ? "pointer" : "default",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Ic n="plus" s={16} c={newJournalText.trim() ? "#fff" : C.textMuted} />
                </button>
              </div>

              {/* Entries list */}
              {journalEntries.length === 0 ? (
                <div style={{ fontSize: 11, color: C.textMuted, fontStyle: "italic", padding: "6px 0" }}>
                  {t("noJournalEntries")}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 200, overflow: "auto" }}>
                  {journalEntries.map(entry => (
                    <div key={entry.id} style={{ background: C.surfaceAlt, borderRadius: 8, padding: "8px 10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                        <span style={{ fontSize: 10, color: C.textMuted, fontFamily: FONT_DISPLAY, fontWeight: 700 }}>
                          {entry.date}
                        </span>
                        <button onClick={() => setJournalEntries(prev => prev.filter(e => e.id !== entry.id))}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                          <Ic n="x" s={10} c={C.textMuted} />
                        </button>
                      </div>
                      <div style={{ fontSize: 12, color: C.text, fontFamily: FONT_BODY, lineHeight: 1.4 }}>
                        {entry.text}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

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
