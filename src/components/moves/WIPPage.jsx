import React, { useState, useEffect, useRef, Fragment } from 'react';
import { C, PRESET_COLORS } from '../../constants/colors';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { masteryColor } from '../../constants/styles';
import { Ic } from '../shared/Ic';
import { Highlight } from '../shared/Highlight';
import { SectionBanner } from '../shared/SectionBanner';
import { Crumbs } from '../shared/Crumbs';
import { Btn } from '../shared/Btn';
import { useT, usePlural } from '../../hooks/useTranslation';
import { useSettings } from '../../hooks/useSettings';
import { MoveModal } from './MoveModal';
import { BulkModal } from './BulkModal';
import { MoveTile } from './MoveTile';
import { MoveListRow } from './MoveListRow';
import { CatTile } from './CatTile';
import { AddCategoryModal } from './AddCategoryModal';
import { SetDetailModal } from './SetDetailModal';
import { AttributeFilter } from './AttributeFilter';
import { filterMovesByAttrs } from '../../utils/attributeHelpers';
import { ReminderBlock } from './ReminderBlock';
import { GAPTab } from './GAPTab';
import { MoveTree } from './MoveTree';

export const WIPPage = ({ moves, setMoves, cats, setCats, catColors, setCatColors, catDomains={}, setCatDomains, sets=[], setSets=()=>{}, addToast, pendingDesc, clearPendingDesc, settings={}, onSettingsChange, onAddTrigger, onAddTrigger2=0, onSubTabChange, parentSubTab, onSortChange, customAttrs=[], setCustomAttrs, reminders, onRemindersChange, onDrill, onOpenManageReminders, onOpenExplore, onOpenRRR, onOpenCombine, onOpenMap }) => {
  const t = useT();
  const { moveCountStr, resultCountStr } = usePlural();
  const { settings:ctxSettings } = useSettings();
  const st = {...ctxSettings,...settings};
  const [view,setView]=useState(st.defaultView||"list"); const [catView,setCatView]=useState("list");
  const [vocabTab,setVocabTab]=useState("moves"); // "moves" | "sets"
  const setVocabTabAndNotify = (t) => { setVocabTab(t); if(onSubTabChange) onSubTabChange(t); };
  useEffect(()=>{ if(onSubTabChange) onSubTabChange("moves"); },[]);
  useEffect(()=>{ if(parentSubTab==="gap"&&vocabTab!=="gap") { setVocabTab("gap"); setOpenCat(null); } },[parentSubTab]);
  const [openCat,setOpenCat]=useState(null);
  const [showAdd,setShowAdd]=useState(false); const [bulk,setBulk]=useState(false);
  useEffect(()=>{ if(onAddTrigger) { if(vocabTab==="sets") setAddingSet(true); else setShowAdd(true); } },[onAddTrigger]);
  const [editMove,setEditMove]=useState(null);
  // cats/catColors are now lifted to App — received as props
  const [showAddCat,setShowAddCat]=useState(false);
  const [ideaDesc,setIdeaDesc]=useState(null);
  const [search,setSearch]=useState("");
  const [showSearch,setShowSearch]=useState(false);
  const catDragItem=useRef(null);
  const [catDragOver,setCatDragOver]=useState(null);
  const [reorderMode, setReorderMode] = useState(false);
  const [catReorderMode, setCatReorderMode] = useState(false);
  const moveMoveUp   = (idx, list) => { if(idx===0) return; const ids=list.map(m=>m.id); setMoves(prev=>{ const n=[...prev]; const ai=n.findIndex(x=>x.id===ids[idx]); const bi=n.findIndex(x=>x.id===ids[idx-1]); [n[ai],n[bi]]=[n[bi],n[ai]]; return n; }); };
  const moveMoveDown = (idx, list) => { if(idx===list.length-1) return; const ids=list.map(m=>m.id); setMoves(prev=>{ const n=[...prev]; const ai=n.findIndex(x=>x.id===ids[idx]); const bi=n.findIndex(x=>x.id===ids[idx+1]); [n[ai],n[bi]]=[n[bi],n[ai]]; return n; }); };
  const [addingSet,setAddingSet]=useState(false);
  // onAddTrigger2: Add Category (moves tab) or Add Set (sets tab)
  useEffect(()=>{ if(onAddTrigger2) { if(vocabTab==="sets") setAddingSet(true); else setShowAddCat(true); } },[onAddTrigger2]);
  const [editSetModal,setEditSetModal]=useState(null);
  const [setsView,setSetsView]=useState(st.defaultView==="tree"?"list":(st.defaultView||"list"));
  // Sync view states when the defaultView setting changes
  useEffect(()=>{ setView(st.defaultView||"list"); setSetsView(st.defaultView==="tree"?"list":(st.defaultView||"list")); },[st.defaultView]);
  const [expSets,setExpSets]=useState({});
  const [confirmDeleteSet,setConfirmDeleteSet]=useState(null);
  const [confirmDeleteMove,setConfirmDeleteMove]=useState(null);
  const [versionMove, setVersionMove] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [attrFilters, setAttrFilters] = useState({});
  const setDragItem=useRef(null);
  const [setDragOver,setSetDragOver]=useState(null);
  const masteryColorWip = p => p<30?C.red:p<60?C.yellow:p<80?C.blue:C.green;

  // When an idea is pushed in from the Ideas tab, open the add modal with its text
  useEffect(()=>{
    if(pendingDesc){ setIdeaDesc(pendingDesc); setShowAdd(true); clearPendingDesc(); }
  },[pendingDesc]);

  const wipMoves=moves; // show all moves regardless of status
  const sortFn = st.sortMoves==="name" ? (a,b)=>a.name.localeCompare(b.name)
    : st.sortMoves==="mastery" ? (a,b)=>b.mastery-a.mastery
    : (a,b)=>0; // custom/date = insertion order
  const hasActiveFilters = Object.keys(attrFilters).some(k => { const v=attrFilters[k]; return Array.isArray(v)?v.length>0:v!==""&&v!=null; });
  const inCat=cat=>{ let filtered=[...wipMoves.filter(m=>m.category===cat)]; if(hasActiveFilters) filtered=filterMovesByAttrs(filtered,attrFilters,customAttrs); return filtered.sort(sortFn); };
  const masteredCount=cat=>inCat(cat).filter(m=>m.mastery>=80).length;

  const sortedCats = reorderMode ? cats : (
    st.categorySort==="name"
      ? [...cats].sort((a,b)=>a.localeCompare(b))
      : st.categorySort==="progress"
        ? [...cats].sort((a,b)=>{ const pctA=inCat(a).length?masteredCount(a)/inCat(a).length:0; const pctB=inCat(b).length?masteredCount(b)/inCat(b).length:0; return pctB-pctA; })
        : cats // manual = insertion order
  );

  const saveMove=(form,id)=>{
    if(id){
      setMoves(prev=>prev.map(m=>m.id===id?{...m,...form}:m));
    } else {
      setMoves(prev=>[...prev,{...form, id:Date.now(), status:form.status||"wip"}]);
    }
  };
  const handleToggleTrainedToday = (id) => {
    const today = new Date().toISOString().split("T")[0];
    const move = moves.find(m => m.id === id);
    if (!move) return;
    const isToday = move.date === today;
    setMoves(prev => prev.map(m => {
      if (m.id !== id) return m;
      return isToday
        ? { ...m, date: m.prevDate || null, prevDate: null }
        : { ...m, prevDate: m.date, date: today };
    }));
    addToast({ emoji: isToday ? "↩️" : "✅", title: t(isToday ? "unmarkedToday" : "markedTrainedToday") });
  };
  const bulkImport=newMoves=>{ const w=newMoves.map(m=>({...m,id:Date.now()+Math.random(),status:m.status||"wip"})); setMoves(prev=>[...prev,...w]); };
  const delMove=id=>setMoves(prev=>prev.filter(m=>m.id!==id));
  const tryDelMove=m=>{ if(st.confirmDelete!==false) setConfirmDeleteMove(m); else delMove(m.id); };
  const dupMove=m=>setMoves(prev=>[...prev,{...m,id:Date.now(),name:m.name+" (copy)"}]);
  const moveToCat=(id,cat)=>setMoves(prev=>prev.map(m=>m.id===id?{...m,category:cat}:m));
  const addCategory=(name,color)=>{ setCats(prev=>[...prev,name]); setCatColors(prev=>({...prev,[name]:color})); };
  const dupCategory=(name)=>{ const newName=name+" (copy)"; setCats(prev=>[...prev,newName]); setCatColors(prev=>({...prev,[newName]:prev[name]||C.accent})); };
  const moveCatUp   = (idx) => { if(idx===0) return; setCats(prev=>{ const n=[...prev]; [n[idx],n[idx-1]]=[n[idx-1],n[idx]]; return n; }); };
  const moveCatDown = (idx) => { setCats(prev=>{ if(idx>=prev.length-1) return prev; const n=[...prev]; [n[idx],n[idx+1]]=[n[idx+1],n[idx]]; return n; }); };
  const moveSetUp   = (idx) => { if(idx===0) return; setSets(prev=>{ const n=[...prev]; [n[idx],n[idx-1]]=[n[idx-1],n[idx]]; return n; }); };
  const moveSetDown = (idx) => { setSets(prev=>{ if(idx>=prev.length-1) return prev; const n=[...prev]; [n[idx],n[idx+1]]=[n[idx+1],n[idx]]; return n; }); };
  const changeCatColor=(name,color)=>setCatColors(prev=>({...prev,[name]:color}));
  const renameCategory=(oldName,newName)=>{
    if(!newName.trim()||newName===oldName) return;

    setCats(prev=>prev.map(c=>c===oldName?newName:c));
    setCatColors(prev=>{ const next={...prev}; if(next[oldName]!==undefined){ next[newName]=next[oldName]; delete next[oldName]; } return next; });
    setMoves(prev=>{
      const updated = prev.map(m=>m.category===oldName?{...m,category:newName}:m);
      return updated;
    });
  };
  const handleCatDragStart=(idx)=>{ catDragItem.current=idx; };
  const handleCatDragOver=(e,idx)=>{ e.preventDefault(); setCatDragOver(idx); };
  const handleCatDrop=(targetIdx)=>{
    const from=catDragItem.current;
    setCatDragOver(null);
    if(from===null||from===targetIdx) return;
    catDragItem.current=null;
    setCats(prev=>{
      // Recompute sort on latest cats to avoid stale closure
      const sorted = st.categorySort==="name"
        ? [...prev].sort((a,b)=>a.localeCompare(b))
        : prev; // manual or progress — use current order
      const next=[...sorted];
      const [moved]=next.splice(from,1);
      const insertAt = from < targetIdx ? targetIdx-1 : targetIdx;
      next.splice(insertAt,0,moved);
      return next;
    });
  };

  if(openCat){
    const allCatMoves=inCat(openCat);
    const catColor=catColors[openCat]||C.accent;
    const catMoves=search.trim()?allCatMoves.filter(m=>m.name.toLowerCase().includes(search.toLowerCase())):allCatMoves;
    return (
      <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
        <Crumbs items={[t("vocab"),openCat]}/>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"6px 14px", borderBottom:`1px solid ${C.borderLight}`, background:C.surface, flexShrink:0 }}>
          <button onClick={()=>{setOpenCat(null);setSearch("");setShowSearch(false);setCatReorderMode(false);}} style={{ background:"none", border:"none", cursor:"pointer", color:C.accent, fontSize:14, fontFamily:FONT_DISPLAY, fontWeight:700 }}>← Back</button>
          <div style={{ display:"flex", gap:3 }}>
            {!catReorderMode&&customAttrs.length>0&&<button onClick={()=>setShowFilter(s=>!s)}
              style={{ background:showFilter?C.surfaceAlt:"none", border:"none", cursor:"pointer", padding:5, borderRadius:5, color:showFilter?C.accent:C.textMuted, position:"relative" }}>
              <Ic n="filter" s={16}/>
              {hasActiveFilters&&<div style={{ position:"absolute", top:2, right:2, width:6, height:6, borderRadius:"50%", background:C.accent }}/>}
            </button>}
            {!catReorderMode&&<button onClick={()=>{ setShowSearch(s=>!s); setSearch(""); }} style={{ background:showSearch?C.surfaceAlt:"none", border:"none", cursor:"pointer", padding:5, borderRadius:5, color:showSearch?C.accent:C.textMuted }}><Ic n="search" s={16}/></button>}
            {!catReorderMode&&<button onClick={()=>setCatView(v=>v==="tiles"?"list":"tiles")} style={{ background:"none", border:"none", cursor:"pointer", padding:5, borderRadius:5, color:C.textMuted }}><Ic n={catView==="tiles"?"list":"grid"} s={16}/></button>}
            {allCatMoves.length>1&&<button onClick={()=>{ const next=!catReorderMode; setCatReorderMode(next); if(next){ const ids=allCatMoves.map(m=>m.id); setMoves(prev=>{ const rest=prev.filter(m=>!ids.includes(m.id)); const ordered=ids.map(id=>prev.find(m=>m.id===id)).filter(Boolean); return [...ordered,...rest]; }); } if(!next && onSortChange) onSortChange("sortMoves","custom"); }}
              style={{ background:catReorderMode?C.accent:"none", border:"none", cursor:"pointer", padding:"4px 8px", borderRadius:5,
                color:catReorderMode?C.bg:C.textMuted, fontSize:13, fontWeight:800, fontFamily:FONT_DISPLAY, letterSpacing:1 }}>
              {catReorderMode?"DONE":"⇅"}
            </button>}
          </div>
        </div>
        {showSearch&&(
          <div style={{ padding:"6px 14px", background:C.surface, borderBottom:`1px solid ${C.borderLight}` }}>
            <div style={{ display:"flex", alignItems:"center", background:C.bg, borderRadius:7, padding:"5px 10px", gap:6, border:`1px solid ${search?C.accent:C.border}` }}>
              <Ic n="search" s={13} c={C.textMuted}/>
              <input autoFocus value={search} onChange={e=>setSearch(e.target.value)} placeholder={t("searchMoves")}
                style={{ flex:1, background:"none", border:"none", outline:"none", color:C.text, fontSize:13, fontFamily:"inherit" }}/>
              {search&&<button onClick={()=>setSearch("")} style={{ background:"none", border:"none", cursor:"pointer", color:C.textMuted, padding:0, display:"flex" }}><Ic n="x" s={13}/></button>}
            </div>
            {search&&<div style={{ fontSize:11, color:C.textMuted, marginTop:4 }}>{resultCountStr(catMoves.length)}</div>}
          </div>
        )}
        {showFilter&&(
          <AttributeFilter customAttrs={customAttrs} activeFilters={attrFilters} setActiveFilters={setAttrFilters}
            totalCount={allCatMoves.length} filteredCount={catMoves.length} />
        )}
        <div style={{ flex:1, overflow:"auto", padding:10, paddingBottom:76 }}>
          {allCatMoves.length===0 ? (
            <div style={{ textAlign:"center", padding:40, color:C.textMuted }}>
              <div style={{ fontSize:32, marginBottom:8 }}>📭</div>
              <p style={{ fontSize:15, margin:"0 0 4px" }}>No moves yet in {openCat}</p>
              <p style={{ fontSize:13 }}>Tap + to add your first move</p>
            </div>
          ) : catMoves.length===0 ? (
            <div style={{ textAlign:"center", padding:30, color:C.textMuted }}><p style={{fontSize:13}}>No moves match "{search}"</p></div>
          ) : catReorderMode ? (
            /* Reorder mode — always list, ▲▼ on each item */
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {allCatMoves.map((m,idx)=>(
                <div key={m.id} style={{ position:"relative" }}>
                  <div style={{ position:"absolute", right:6, top:"50%", transform:"translateY(-50%)", zIndex:10,
                    display:"flex", flexDirection:"column", gap:2 }}>
                    <button onClick={()=>moveMoveUp(idx,allCatMoves)} disabled={idx===0}
                      style={{ width:26, height:26, borderRadius:6, border:`1px solid ${C.border}`, background:C.bg,
                        cursor:idx===0?"default":"pointer", color:idx===0?C.border:C.accent,
                        fontSize:14, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>▲</button>
                    <button onClick={()=>moveMoveDown(idx,allCatMoves)} disabled={idx===allCatMoves.length-1}
                      style={{ width:26, height:26, borderRadius:6, border:`1px solid ${C.border}`, background:C.bg,
                        cursor:idx===allCatMoves.length-1?"default":"pointer", color:idx===allCatMoves.length-1?C.border:C.accent,
                        fontSize:14, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>▼</button>
                  </div>
                  <MoveListRow move={m} catColor={catColor} onEdit={()=>setEditMove(m)} onDelete={()=>tryDelMove(m)} onMove={cat=>moveToCat(m.id,cat)} allCats={cats} catColors={catColors} onToggleTrainedToday={handleToggleTrainedToday}/>
                </div>
              ))}
            </div>
          ) : catView==="tiles" ? (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {catMoves.map(m=><MoveTile key={m.id} move={m} searchQuery={search} onClick={()=>setEditMove(m)} onEdit={()=>setEditMove(m)} onDelete={()=>tryDelMove(m)} onDuplicate={()=>dupMove(m)} onMove={cat=>moveToCat(m.id,cat)} allCats={cats} catColors={catColors} onToggleTrainedToday={handleToggleTrainedToday}/>)}
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {catMoves.map(m=><MoveListRow key={m.id} move={m} searchQuery={search} catColor={catColor} onEdit={()=>setEditMove(m)} onDelete={()=>tryDelMove(m)} onMove={cat=>moveToCat(m.id,cat)} allCats={cats} catColors={catColors} onToggleTrainedToday={handleToggleTrainedToday}/>)}
            </div>
          )}
        </div>
        {showAdd&&<MoveModal initialCat={openCat} cats={cats} initialDesc={ideaDesc} onClose={()=>{setShowAdd(false);setIdeaDesc(null);}} onSave={f=>saveMove(f)} customAttrs={customAttrs} onAddAttr={def=>setCustomAttrs&&setCustomAttrs(p=>[...p,def])} allMoves={moves} catColors={catColors}/>}
        {editMove&&<MoveModal move={editMove} cats={cats} onClose={()=>setEditMove(null)} onSave={f=>{saveMove(f,editMove.id);setEditMove(null);}} customAttrs={customAttrs} onAddAttr={def=>setCustomAttrs&&setCustomAttrs(p=>[...p,def])} allMoves={moves} catColors={catColors}/>}
        {confirmDeleteMove&&(
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:900, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
            <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:14, width:"100%", maxWidth:320, padding:20, boxShadow:"0 24px 60px rgba(0,0,0,0.4)" }}>
              <div style={{ fontWeight:900, fontSize:14, letterSpacing:1.5, fontFamily:FONT_DISPLAY, color:C.brown, marginBottom:8 }}>{t("deleteMove")}</div>
              <p style={{ fontSize:13, color:C.textSec, marginBottom:16, lineHeight:1.5 }}>
                {t("deleteMoveBody1")}<span style={{ color:C.text, fontWeight:700 }}>{confirmDeleteMove.name}</span>{t("deleteMoveBody2")}
              </p>
              <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                <button onClick={()=>setConfirmDeleteMove(null)}
                  style={{ padding:"8px 16px", borderRadius:8, border:`1px solid ${C.border}`, background:"none", color:C.textSec, fontSize:13, cursor:"pointer", fontFamily:FONT_BODY }}>
                  {t("cancel")}
                </button>
                <button onClick={()=>{ delMove(confirmDeleteMove.id); setConfirmDeleteMove(null); }}
                  style={{ padding:"8px 16px", borderRadius:8, border:"none", background:C.accent, color:C.bg, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:FONT_BODY }}>
                  {t("delete")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // — search across both categories and moves inside them —
  const searchResults = search.trim() ? (() => {
    const q = search.toLowerCase();
    const catHits = cats.filter(c => c.toLowerCase().includes(q));
    const moveHits = cats.flatMap(cat => inCat(cat).filter(m => m.name.toLowerCase().includes(q)).map(m => ({ ...m, _cat: cat })));
    return { catHits, moveHits };
  })() : null;

  // ── Version tracking prompt ──
  const versionShown = st.versionPromptsShown || [];
  const today = new Date();
  const versionEligible = vocabTab === "moves" ? moves.find(m => {
    if ((m.mastery || 0) < 75) return false;
    if (versionShown.includes(m.id)) return false;
    if (!m.date) return false;
    const d = new Date(m.date);
    return (today - d) / (1000*60*60*24) >= 30;
  }) : null;
  const dismissVersion = (id) => {
    if (onSettingsChange) onSettingsChange(p => ({...p, versionPromptsShown: [...(p.versionPromptsShown||[]), id]}));
  };
  const VERSION_CHIPS = [
    { key:"entry", label:"changeEntry" },
    { key:"exit", label:"changeExit" },
    { key:"speed", label:"changeSpeed" },
    { key:"level", label:"changeLevel" },
    { key:"mirror", label:"mirrorIt" },
  ];

  return (
    <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
      <SectionBanner tab="wip"/>
      {reminders?.items?.length > 0 && (
        <ReminderBlock reminders={reminders} onRemindersChange={onRemindersChange} addToast={addToast} onOpenManage={onOpenManageReminders}/>
      )}

      {/* ── Version tracking prompt ── */}
      {versionEligible && !openCat && vocabTab === "moves" && (
        <div style={{ margin:"6px 14px", padding:14, background:C.surfaceAlt, border:`1px solid ${C.border}`, borderRadius:12, position:"relative" }}>
          <button onClick={() => dismissVersion(versionEligible.id)}
            style={{ position:"absolute", top:8, right:8, background:"none", border:"none", cursor:"pointer", padding:2, display:"flex" }}>
            <Ic n="x" s={14} c={C.textMuted}/>
          </button>
          <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:14, color:C.text, marginBottom:8 }}>
            <span style={{ color:C.accent }}>{versionEligible.name}</span> — {t("createVariation")}
          </div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {VERSION_CHIPS.map(ch => (
              <button key={ch.key} onClick={() => {
                dismissVersion(versionEligible.id);
                setVersionMove({ ...versionEligible, _versionChip: ch.key });
              }}
                style={{ border:`1.5px solid ${C.border}`, cursor:"pointer", borderRadius:20, fontFamily:FONT_DISPLAY, fontWeight:700, letterSpacing:0.3, fontSize:11, padding:"4px 10px", whiteSpace:"nowrap", transition:"all 0.15s", background:C.surface, color:C.textSec }}>
                {t(ch.label)}
              </button>
            ))}
            <button onClick={() => {
              dismissVersion(versionEligible.id);
              setVersionMove({ ...versionEligible, _versionChip: null });
            }}
              style={{ border:`1.5px solid ${C.accent}`, cursor:"pointer", borderRadius:20, fontFamily:FONT_DISPLAY, fontWeight:700, letterSpacing:0.3, fontSize:11, padding:"4px 10px", whiteSpace:"nowrap", transition:"all 0.15s", background:C.accent+"18", color:C.accent }}>
              + {t("createOwnVersion")}
            </button>
          </div>
        </div>
      )}

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"6px 14px", borderBottom:`1px solid ${C.borderLight}`, background:C.surface, flexShrink:0 }}>
        {/* MOVES / SETS sub-tabs */}
        <div style={{ display:"flex", gap:0 }}>
          {[["moves",t("library")],["sets","SETS"],["gap","GAP"]].map(([id,label])=>(
            <button key={id} onClick={()=>setVocabTabAndNotify(id)}
              style={{ padding:"4px 10px", background:"none", border:"none", cursor:"pointer",
                fontSize:10, fontWeight:800, letterSpacing:1.5, fontFamily:FONT_DISPLAY,
                color: vocabTab===id ? C.accent : C.textMuted,
                borderBottom: vocabTab===id ? `2px solid ${C.accent}` : "2px solid transparent" }}>
              {label}
            </button>
          ))}
        </div>
        <div style={{ display:"flex", gap:3 }}>
          {vocabTab==="moves"&&<Fragment>
            {customAttrs.length>0&&<button onClick={()=>setShowFilter(s=>!s)}
              style={{ background:showFilter?C.surfaceAlt:"none", border:"none", cursor:"pointer", padding:5, borderRadius:5, color:showFilter?C.accent:C.textMuted, position:"relative" }}>
              <Ic n="filter" s={16}/>
              {hasActiveFilters&&<div style={{ position:"absolute", top:2, right:2, width:6, height:6, borderRadius:"50%", background:C.accent }}/>}
            </button>}
            <button onClick={()=>{ setShowSearch(s=>!s); setSearch(""); }} style={{ background:showSearch?C.surfaceAlt:"none", border:"none", cursor:"pointer", padding:5, borderRadius:5, color:showSearch?C.accent:C.textMuted }}><Ic n="search" s={16}/></button>
            {[{v:"tiles",ic:"grid"},{v:"list",ic:"list"},{v:"tree",ic:"gitFork"}].map(({v,ic})=>(
              <button key={v} onClick={()=>setView(v)} style={{ background:view===v?C.surfaceAlt:"none", border:"none", cursor:"pointer", padding:5, borderRadius:5, color:view===v?C.accent:C.textMuted }}><Ic n={ic} s={16}/></button>
            ))}
            <button onClick={()=>setBulk(true)} style={{ background:"none", border:"none", cursor:"pointer", padding:5, borderRadius:5, color:C.textMuted }}><Ic n="upload" s={16}/></button>
            {view!=="tree"&&<button onClick={()=>{ const next=!reorderMode; setReorderMode(next); if(next) setCats(sortedCats); if(!next && onSortChange) onSortChange("categorySort","manual"); }}
              style={{ background:reorderMode?C.accent:"none", border:"none", cursor:"pointer", padding:"4px 8px", borderRadius:5,
                color:reorderMode?C.bg:C.textMuted, fontSize:13, fontWeight:800, fontFamily:FONT_DISPLAY, letterSpacing:1 }}>
              {reorderMode?"DONE":"⇅"}
            </button>}
          </Fragment>}
          {vocabTab==="sets"&&<Fragment>
            <button onClick={()=>setSetsView(v=>v==="list"?"tiles":"list")} style={{ background:"none", border:"none", cursor:"pointer", padding:5, borderRadius:5, color:C.textMuted }}><Ic n={setsView==="list"?"grid":"list"} s={16}/></button>
            <button onClick={()=>setReorderMode(r=>!r)}
              style={{ background:reorderMode?C.accent:"none", border:"none", cursor:"pointer", padding:"4px 8px", borderRadius:5,
                color:reorderMode?C.bg:C.textMuted, fontSize:13, fontWeight:800, fontFamily:FONT_DISPLAY, letterSpacing:1 }}>
              {reorderMode?"DONE":"⇅"}
            </button>
          </Fragment>}
        </div>
      </div>

      {vocabTab==="moves"&&(
        <div style={{ display:"flex", gap:8, padding:"8px 14px", borderBottom:`1px solid ${C.borderLight}`, background:C.surface }}>
          {[
            { icon:"compass", label:t("explore"), action:onOpenExplore },
            { icon:"sparkles", label:"R/R/R", action:onOpenRRR },
            { icon:"puzzle", label:t("combine"), action:onOpenCombine },
            { icon:"network", label:t("map"), action:onOpenMap },
          ].map(({ icon, label, action })=>(
            <button key={icon} onClick={action}
              style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center",
                gap:6, background:C.surfaceAlt, border:`1px solid ${C.border}`,
                borderRadius:10, padding:"10px 14px", cursor:"pointer" }}>
              <Ic n={icon} s={20} c={C.textMuted}/>
              <span style={{ fontSize:9, fontWeight:800, fontFamily:FONT_DISPLAY,
                letterSpacing:1.2, color:C.textMuted, textTransform:"uppercase" }}>
                {label}
              </span>
            </button>
          ))}
        </div>
      )}

      {showSearch&&(
        <div style={{ padding:"6px 14px", background:C.surface, borderBottom:`1px solid ${C.borderLight}` }}>
          <div style={{ display:"flex", alignItems:"center", background:C.bg, borderRadius:7, padding:"5px 10px", gap:6, border:`1px solid ${search?C.accent:C.border}` }}>
            <Ic n="search" s={13} c={C.textMuted}/>
            <input autoFocus value={search} onChange={e=>setSearch(e.target.value)} placeholder={t("searchCatsMoves")}
              style={{ flex:1, background:"none", border:"none", outline:"none", color:C.text, fontSize:13, fontFamily:"inherit" }}/>
            {search&&<button onClick={()=>setSearch("")} style={{ background:"none", border:"none", cursor:"pointer", color:C.textMuted, padding:0, display:"flex" }}><Ic n="x" s={13}/></button>}
          </div>
          {searchResults&&<div style={{ fontSize:11, color:C.textMuted, marginTop:4 }}>
            {searchResults.catHits.length} {searchResults.catHits.length!==1?"categories":"category"} · {moveCountStr(searchResults.moveHits.length)}
          </div>}
        </div>
      )}

      {showFilter&&vocabTab==="moves"&&(
        <AttributeFilter customAttrs={customAttrs} activeFilters={attrFilters} setActiveFilters={setAttrFilters}
          totalCount={moves.length} filteredCount={cats.reduce((sum,cat)=>sum+inCat(cat).length,0)} />
      )}

      <div style={{ flex:1, overflow:"auto", paddingTop: vocabTab==="gap" ? 0 : 10, paddingLeft: vocabTab==="gap" ? 0 : 10, paddingRight: vocabTab==="gap" ? 0 : 10, paddingBottom:76 }}>
        {vocabTab==="gap" ? (
          <GAPTab moves={moves} catColors={catColors} setMoves={setMoves} onDrill={onDrill} settings={st} onTrainToday={handleToggleTrainedToday}/>
        ) : vocabTab==="sets" ? (
          <div>
            {sets.length===0&&(
              <div style={{ textAlign:"center", padding:40, color:C.textMuted }}>
                <div style={{ fontSize:28, marginBottom:8 }}>📋</div>
                <p style={{ fontSize:13 }}>No sets yet — tap + to create one</p>
                <p style={{ fontSize:11, marginTop:6, fontStyle:"italic" }}>Think of a Set like a Notion database — add your moves to it, then slot it into Battle rounds</p>
              </div>
            )}
            {/* ── Tiles view ── */}
            {setsView==="tiles" ? (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {sets.map(s=>{
                  const sColor=s.color||C.blue;
                  return (
                    <div key={s.id} onClick={()=>setEditSetModal(s)}
                      style={{ borderRadius:10, border:`1.5px solid ${C.border}`, overflow:"hidden", background:C.bg, cursor:"pointer", position:"relative" }}>
                      <div style={{ height:4, background:`linear-gradient(90deg,${sColor},${sColor}44)` }}/>
                      <div style={{ padding:"10px 10px 8px" }}>
                        <div style={{ display:"flex", alignItems:"flex-start", gap:6, marginBottom:4 }}>
                          <div style={{ width:8, height:8, borderRadius:"50%", background:sColor, flexShrink:0, marginTop:3 }}/>
                          <div style={{ fontWeight:800, fontSize:12, color:C.brown, fontFamily:FONT_DISPLAY, flex:1, lineHeight:1.3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", minWidth:0 }}>{s.name}</div>
                          <button onClick={e=>{ e.stopPropagation(); setConfirmDeleteSet(s); }}
                            style={{ background:"none", border:"none", cursor:"pointer", padding:2, flexShrink:0, display:"flex", marginTop:-2, marginRight:-4 }}>
                            <Ic n="x" s={12} c={C.textMuted}/>
                          </button>
                        </div>
                        {s.details&&<div style={{ fontSize:10, color:C.textSec, paddingLeft:14, marginBottom:4, lineHeight:1.4,
                          overflow:"hidden", textOverflow:"ellipsis", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>{s.details}</div>}
                        <div style={{ fontSize:10, color:C.textMuted, paddingLeft:14 }}>{moveCountStr((s.moveIds||[]).length)}</div>
                        {st.showMastery&&<div style={{ paddingLeft:14, marginTop:4 }}>
                          <div style={{ height:2, borderRadius:1, background:C.border, overflow:"hidden" }}>
                            <div style={{ height:"100%", width:`${s.mastery||0}%`, background:masteryColor(s.mastery||0) }}/>
                          </div>
                        </div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* ── List view with reorder ── */
              <div>
                {sets.map((s,idx)=>{
                  const sColor=s.color||C.blue;
                  const isExp=expSets[s.id]!==false;
                  return (
                    <div key={s.id} style={{ position:"relative", marginBottom:6, borderRadius:10,
                      border:`1.5px solid ${C.border}`, overflow:"hidden", background:C.bg }}>
                      <div style={{ height:3, background:`linear-gradient(90deg,${sColor},${sColor}44)` }}/>
                      <div style={{ display:"flex", alignItems:"center", padding:"9px 10px", gap:6 }}>
                        {/* Expand/collapse */}
                        <button onClick={()=>setExpSets(p=>({...p,[s.id]:!isExp}))}
                          style={{ background:"none", border:"none", cursor:"pointer", padding:0, display:"flex", flexShrink:0 }}>
                          <Ic n={isExp?"chevD":"chevR"} s={12} c={sColor}/>
                        </button>
                        <div style={{ width:8, height:8, borderRadius:"50%", background:sColor, flexShrink:0 }}/>
                        {/* Name + subtitle */}
                        <div style={{ flex:1, minWidth:0, cursor:"pointer" }} onClick={()=>{ if(!reorderMode) setEditSetModal(s); }}>
                          <div style={{ fontWeight:800, fontSize:13, color:C.brown, fontFamily:FONT_DISPLAY, letterSpacing:0.5, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.name}</div>
                          <div style={{ fontSize:11, color:C.textMuted, marginTop:1,
                            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                            {moveCountStr((s.moveIds||[]).length)}
                            {s.details ? ` · ${s.details}` : s.notes ? ` · ${s.notes}` : ""}
                          </div>
                        </div>
                        {st.showMastery&&<div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:2, flexShrink:0 }}>
                          <span style={{ fontSize:10, color:masteryColor(s.mastery||0), fontWeight:700 }}>{s.mastery||0}%</span>
                          <div style={{ width:36, height:2, borderRadius:1, background:C.border, overflow:"hidden" }}>
                            <div style={{ height:"100%", width:`${s.mastery||0}%`, background:masteryColor(s.mastery||0) }}/>
                          </div>
                        </div>}
                        {!reorderMode&&<button onClick={e=>{ e.stopPropagation(); setConfirmDeleteSet(s); }}
                          style={{ background:"none", border:"none", cursor:"pointer", padding:3, flexShrink:0 }}>
                          <Ic n="x" s={13} c={C.accent}/>
                        </button>}
                        {reorderMode&&<div style={{ display:"flex", flexDirection:"column", gap:2, flexShrink:0 }}>
                          <button onClick={()=>moveSetUp(idx)} disabled={idx===0}
                            style={{ width:26, height:26, borderRadius:6, border:`1px solid ${C.border}`, background:C.bg,
                              cursor:idx===0?"default":"pointer", color:idx===0?C.border:C.accent,
                              fontSize:14, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>▲</button>
                          <button onClick={()=>moveSetDown(idx)} disabled={idx===sets.length-1}
                            style={{ width:26, height:26, borderRadius:6, border:`1px solid ${C.border}`, background:C.bg,
                              cursor:idx===sets.length-1?"default":"pointer", color:idx===sets.length-1?C.border:C.accent,
                              fontSize:14, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>▼</button>
                        </div>}
                      </div>
                      {isExp&&(
                        <div style={{ borderTop:`1px solid ${C.borderLight}`, padding:"8px 12px 10px 36px" }}>
                          {s.details&&(
                            <div style={{ fontSize:11, color:C.textSec, lineHeight:1.5, marginBottom:8,
                              fontStyle:"italic" }}>{s.details}</div>
                          )}
                          {(s.moveIds||[]).length>0 ? (s.moveIds||[]).map(mid=>{
                            const m=moves.find(mv=>mv.id===mid); if(!m) return null;
                            return (
                              <div key={mid} style={{ display:"flex", alignItems:"center", gap:6, paddingTop:3 }}>
                                <div style={{ width:5, height:5, borderRadius:"50%", background:masteryColor(m.mastery||0), flexShrink:0 }}/>
                                <span style={{ fontSize:11, color:C.textMuted }}>{m.name}</span>
                                <span style={{ fontSize:10, color:masteryColor(m.mastery||0), fontWeight:700, marginLeft:"auto" }}>{m.mastery||0}%</span>
                              </div>
                            );
                          }) : (
                            <div style={{ fontSize:11, color:C.textMuted, fontStyle:"italic" }}>
                              No moves — tap the name to add some
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : searchResults ? <Fragment>
          {/* Category hits */}
          {searchResults.catHits.length>0&&<Fragment>
            <div style={{ fontSize:11, fontWeight:800, letterSpacing:1.5, color:C.textMuted, fontFamily:FONT_DISPLAY, marginBottom:6 }}>{t("categories")}</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
              {searchResults.catHits.map(cat=>(
                <CatTile key={cat} name={cat} color={catColors[cat]||C.accent} total={inCat(cat).length} mastered={masteredCount(cat)}
                  moves={inCat(cat)} viewMode="tiles"
                  showMastery={st.showMastery} showMoveCount={st.showMoveCount}
                  onClick={()=>setOpenCat(cat)}
                  onDelete={()=>setCats(prev=>prev.filter(c=>c!==cat))}
                  onRename={n=>renameCategory(cat,n)}
                  onDuplicate={()=>dupCategory(cat)}
                  onChangeColor={col=>changeCatColor(cat,col)}/>
              ))}
            </div>
          </Fragment>}
          {/* Move hits */}
          {searchResults.moveHits.length>0&&<Fragment>
            <div style={{ fontSize:11, fontWeight:800, letterSpacing:1.5, color:C.textMuted, fontFamily:FONT_DISPLAY, marginBottom:6 }}>{t("moves")}</div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {searchResults.moveHits.map(m=>(
                <div key={m.id} onClick={()=>{ setOpenCat(m._cat); setEditMove(m); }}
                  style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 12px", display:"flex", alignItems:"center", gap:8, cursor:"pointer", borderLeft:`4px solid ${catColors[m._cat]||C.accent}` }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:13, color:C.text, fontFamily:FONT_DISPLAY, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}><Highlight text={m.name} query={search}/></div>
                    <div style={{ fontSize:11, color:C.textMuted, marginTop:1 }}>{m._cat}</div>
                  </div>
                  <span style={{ fontSize:12, color:masteryColor(m.mastery), fontWeight:700 }}>{m.mastery}%</span>
                </div>
              ))}
            </div>
          </Fragment>}
          {searchResults.catHits.length===0&&searchResults.moveHits.length===0&&
            <div style={{ textAlign:"center", padding:30, color:C.textMuted }}><p style={{fontSize:13}}>Nothing matches "{search}"</p></div>}
        </Fragment> : view==="tree" ? (
          <MoveTree moves={hasActiveFilters ? filterMovesByAttrs(wipMoves, attrFilters, customAttrs) : wipMoves} catColors={catColors} onEdit={m=>setEditMove(m)} settings={st}/>
        ) : (
          <div
            style={view==="tiles"
              ? {display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,alignItems:"stretch"}
              : {display:"flex",flexDirection:"column",gap:0}}
            onDragOver={e=>e.preventDefault()}
            onDragLeave={e=>{ if(!e.currentTarget.contains(e.relatedTarget)) setCatDragOver(null); }}
          >
            {sortedCats.map((cat,idx)=>(
              <div key={cat}
                onDragOver={e=>{ e.preventDefault(); e.stopPropagation(); if(!reorderMode&&catDragItem.current!==null) setCatDragOver(idx); }}
                onDragLeave={e=>{ if(!e.currentTarget.contains(e.relatedTarget)) setCatDragOver(d=>d===idx?null:d); }}
                onDrop={e=>{ e.preventDefault(); e.stopPropagation(); if(!reorderMode) handleCatDrop(idx); }}
                style={{ display:"flex", flexDirection:"column", position:"relative" }}>
                {catDragOver===idx && !reorderMode && catDragItem.current!==null && catDragItem.current!==idx &&(
                  <div style={{ height:2, borderRadius:1, background:C.accent,
                    margin: view==="tiles" ? "0 2px 4px" : "2px 6px 4px" }}/>
                )}
                {reorderMode&&(
                  <div style={{ position:"absolute", right:6, top:"50%", transform:"translateY(-50%)", zIndex:10,
                    display:"flex", flexDirection:"column", gap:2 }}>
                    <button onClick={()=>moveCatUp(idx)} disabled={idx===0}
                      style={{ width:26, height:26, borderRadius:6, border:`1px solid ${C.border}`, background:C.bg,
                        cursor:idx===0?"default":"pointer", color:idx===0?C.border:C.accent,
                        fontSize:14, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>▲</button>
                    <button onClick={()=>moveCatDown(idx)} disabled={idx===sortedCats.length-1}
                      style={{ width:26, height:26, borderRadius:6, border:`1px solid ${C.border}`, background:C.bg,
                        cursor:idx===sortedCats.length-1?"default":"pointer", color:idx===sortedCats.length-1?C.border:C.accent,
                        fontSize:14, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>▼</button>
                  </div>
                )}
                <div style={{ marginBottom: view!=="tiles" ? 8 : 0, flex:1 }}>
                  <CatTile name={cat} color={catColors[cat]||C.accent} total={inCat(cat).length} mastered={masteredCount(cat)}
                    moves={inCat(cat)} viewMode={view}
                    showMastery={st.showMastery} showMoveCount={st.showMoveCount}
                    onClick={()=>{ if(!reorderMode) setOpenCat(cat); setCatReorderMode(false); }}
                    onDelete={()=>setCats(prev=>prev.filter(c=>c!==cat))}
                    onRename={n=>renameCategory(cat,n)}
                    onDuplicate={()=>dupCategory(cat)}
                    onChangeColor={col=>changeCatColor(cat,col)}
                    draggable={false}
                    onDragStart={()=>{}}
                    onDragOver={e=>e.preventDefault()}
                    onDrop={e=>{ }}
                    isDraggingOver={false}/>
                </div>
              </div>
            ))}
            {/* End-of-list sentinel — list view only, lets items drop to last spot */}
            {view!=="tiles"&&sortedCats.length>0&&(
              <div
                onDragOver={e=>{ e.preventDefault(); e.stopPropagation(); setCatDragOver(sortedCats.length); }}
                onDragLeave={e=>{ if(!e.currentTarget.contains(e.relatedTarget)) setCatDragOver(null); }}
                onDrop={e=>{ e.stopPropagation(); handleCatDrop(sortedCats.length); }}
                style={{ minHeight:36, display:"flex", alignItems:"flex-start", paddingTop:2 }}>
                {catDragOver===sortedCats.length&&<div style={{ height:2, borderRadius:1, background:C.accent, flex:1, margin:"0 6px" }}/>}
              </div>
            )}
          </div>
        )}
      </div>
      {vocabTab==="sets"&&addingSet&&<SetDetailModal type="set"
        item={{ name:"", color:PRESET_COLORS[1], moveIds:[], notes:"", mastery:0, date:new Date().toISOString().split("T")[0] }}
        onClose={()=>setAddingSet(false)}
        allMoves={moves} allSets={sets}
        onSave={fields=>{ setSets(p=>[...p,{id:Date.now(),...fields}]); setAddingSet(false); }}/>}
      {editSetModal&&<SetDetailModal type="set" item={editSetModal} onClose={()=>setEditSetModal(null)}
        allMoves={moves} allSets={sets}
        onSave={fields=>setSets(p=>p.map(s=>s.id===editSetModal.id?{...s,...fields}:s))}/>}
      {confirmDeleteSet&&(
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:900, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
          <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:14, width:"100%", maxWidth:320, padding:20, boxShadow:"0 24px 60px rgba(0,0,0,0.4)" }}>
            <div style={{ fontWeight:900, fontSize:14, letterSpacing:1.5, fontFamily:FONT_DISPLAY, color:C.brown, marginBottom:8 }}>DELETE SET?</div>
            <p style={{ fontSize:13, color:C.textSec, marginBottom:16, lineHeight:1.5 }}>
              "<span style={{ color:C.text, fontWeight:700 }}>{confirmDeleteSet.name}</span>" will be permanently deleted. This can't be undone.
            </p>
            <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
              <button onClick={()=>setConfirmDeleteSet(null)}
                style={{ padding:"8px 16px", borderRadius:8, border:`1px solid ${C.border}`, background:"none", color:C.textSec, fontSize:13, cursor:"pointer", fontFamily:FONT_BODY }}>
                Cancel
              </button>
              <button onClick={()=>{ setSets(p=>p.filter(x=>x.id!==confirmDeleteSet.id)); setConfirmDeleteSet(null); }}
                style={{ padding:"8px 16px", borderRadius:8, border:"none", background:C.accent, color:C.bg, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:FONT_BODY }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {confirmDeleteMove&&(
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:900, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
          <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:14, width:"100%", maxWidth:320, padding:20, boxShadow:"0 24px 60px rgba(0,0,0,0.4)" }}>
            <div style={{ fontWeight:900, fontSize:14, letterSpacing:1.5, fontFamily:FONT_DISPLAY, color:C.brown, marginBottom:8 }}>{t("deleteMove")}</div>
            <p style={{ fontSize:13, color:C.textSec, marginBottom:16, lineHeight:1.5 }}>
              {t("deleteMoveBody1")}<span style={{ color:C.text, fontWeight:700 }}>{confirmDeleteMove.name}</span>{t("deleteMoveBody2")}
            </p>
            <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
              <button onClick={()=>setConfirmDeleteMove(null)}
                style={{ padding:"8px 16px", borderRadius:8, border:`1px solid ${C.border}`, background:"none", color:C.textSec, fontSize:13, cursor:"pointer", fontFamily:FONT_BODY }}>
                {t("cancel")}
              </button>
              <button onClick={()=>{ delMove(confirmDeleteMove.id); setConfirmDeleteMove(null); }}
                style={{ padding:"8px 16px", borderRadius:8, border:"none", background:C.accent, color:C.bg, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:FONT_BODY }}>
                {t("delete")}
              </button>
            </div>
          </div>
        </div>
      )}
      {showAddCat&&<AddCategoryModal onClose={()=>setShowAddCat(false)} onAdd={addCategory} existingCats={cats} existingColors={catColors}/>}
      {/* MoveModal at root level — for "Add to Move" arriving from Ideas tab */}
      {showAdd&&<MoveModal initialCat={cats[0]||""} cats={cats} initialDesc={ideaDesc} onClose={()=>{setShowAdd(false);setIdeaDesc(null);}} onSave={f=>saveMove(f)} customAttrs={customAttrs} onAddAttr={def=>setCustomAttrs&&setCustomAttrs(p=>[...p,def])} allMoves={moves} catColors={catColors}/>}
      {/* EditMove at root level — for tree/search views where openCat is null */}
      {!openCat&&editMove&&<MoveModal move={editMove} cats={cats} onClose={()=>setEditMove(null)} onSave={f=>{saveMove(f,editMove.id);setEditMove(null);}} customAttrs={customAttrs} onAddAttr={def=>setCustomAttrs&&setCustomAttrs(p=>[...p,def])} allMoves={moves} catColors={catColors}/>}
      {/* Version move modal — triggered by version tracking prompt */}
      {versionMove&&<MoveModal
        initialCat={versionMove.category}
        cats={cats}
        initialDesc={versionMove._versionChip ? t(VERSION_CHIPS.find(c=>c.key===versionMove._versionChip)?.label||"") : ""}
        onClose={()=>setVersionMove(null)}
        onSave={f=>{ saveMove({...f, origin:"version", parentId:versionMove.id}); setVersionMove(null); }}
        customAttrs={customAttrs}
        onAddAttr={def=>setCustomAttrs&&setCustomAttrs(p=>[...p,def])}
        allMoves={moves}
        catColors={catColors}
        move={{ name: `${versionMove.name} (v2)`, category: versionMove.category, origin:"version", parentId: versionMove.id, mastery:0 }}
      />}
      {bulk&&<BulkModal onClose={()=>setBulk(false)} onImport={bulkImport} cats={cats}/>}
    </div>
  );
};
