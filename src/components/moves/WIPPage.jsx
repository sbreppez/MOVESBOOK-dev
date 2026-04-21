import React, { useState, useEffect, useRef, Fragment } from 'react';
import { PRESET_COLORS } from '../../constants/colors';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { masteryColor } from '../../constants/styles';
import { Ic } from '../shared/Ic';
import { todayLocal } from '../../utils/dateUtils';
import { Highlight } from '../shared/Highlight';
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
import { PremiumGate } from '../shared/PremiumGate';
import { SectionBrief } from '../shared/SectionBrief';
import { BottomSheet } from '../shared/BottomSheet';
import { MoveTree } from './MoveTree';
import { DropdownPill } from '../shared/DropdownPill';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { VocabTabBar } from './VocabTabBar';

export const WIPPage = ({ moves, setMoves, cats, setCats, catColors, setCatColors, catDomains={}, setCatDomains, sets=[], setSets=()=>{}, addToast, pendingDesc, clearPendingDesc, settings={}, onSettingsChange, onAddTrigger, onAddTrigger2=0, onSubTabChange, parentSubTab, onSortChange, customAttrs=[], setCustomAttrs, reminders, onRemindersChange, onDrill, onOpenManageReminders, onOpenExplore, onOpenRRR, onOpenCombine, onOpenMap, onOpenFlashCards, onOpenTools, isPremium, staleCount=0, onBulkTrigger }) => {
  const t = useT();
  const { moveCountStr, resultCountStr } = usePlural();
  const { C, settings:ctxSettings } = useSettings();
  const st = {...ctxSettings,...settings};
  const [view,setView]=useState(st.defaultView||"list"); const [catView,setCatView]=useState("list");
  const showAllMoves = view === "all";
  const [vocabTab,setVocabTab]=useState("moves"); // "moves" | "sets"
  const setVocabTabAndNotify = (t) => { setVocabTab(t); if(onSubTabChange) onSubTabChange(t); };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- fire-once mount notify
  useEffect(()=>{ if(onSubTabChange) onSubTabChange("moves"); },[]);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- parentSubTab-only by intent; vocabTab read fresh on parentSubTab change
  useEffect(()=>{ if(parentSubTab==="gap"&&vocabTab!=="gap") { setVocabTab("gap"); setOpenCat(null); } },[parentSubTab]);
  const [openCat,setOpenCat]=useState(null);
  const [showAdd,setShowAdd]=useState(false); const [bulk,setBulk]=useState(false);
  const [showLibraryMenu,setShowLibraryMenu]=useState(false);
  const lastAddTrigger = useRef(onAddTrigger);
  useEffect(()=>{
    if(onAddTrigger===lastAddTrigger.current) return;
    lastAddTrigger.current=onAddTrigger;
    if(!onAddTrigger) return;
    if(openCat) { setShowAdd(true); return; }
    if(vocabTab==="sets") setAddingSet(true);
    else if(vocabTab==="gap") { if(onDrill) onDrill(null); }
    else setShowLibraryMenu(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- ref-compare guard prevents re-fire; vocabTab/openCat read fresh from closure
  },[onAddTrigger]);
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
  const lastAddTrigger2 = useRef(onAddTrigger2);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- ref-compare guard prevents re-fire
  useEffect(()=>{ if(onAddTrigger2===lastAddTrigger2.current) return; lastAddTrigger2.current=onAddTrigger2; if(onAddTrigger2) { if(vocabTab==="sets") setAddingSet(true); else setShowAddCat(true); } },[onAddTrigger2]);
  const lastBulkTrigger = useRef(onBulkTrigger);
  useEffect(()=>{ if(onBulkTrigger===lastBulkTrigger.current) return; lastBulkTrigger.current=onBulkTrigger; if(onBulkTrigger) setBulk(true); },[onBulkTrigger]);
  const [editSetModal,setEditSetModal]=useState(null);
  const [setsView,setSetsView]=useState(st.defaultView==="tree"?"list":(st.defaultView||"list"));
  // Sync view states when the defaultView setting changes
  useEffect(()=>{ setView(st.defaultView||"list"); setSetsView(st.defaultView==="tree"?"list":(st.defaultView||"list")); },[st.defaultView]);
  // Cleanup when leaving ALL MOVES view: clear filters and exit select mode
  useEffect(()=>{
    if (view !== "all") {
      setAllMovesFilters({ category: [], tensionRole: [], origin: [] });
      exitMoveSelectMode();
    }
  },[view]);
  const [expSets,setExpSets]=useState({});
  const [confirmDeleteSet,setConfirmDeleteSet]=useState(null);
  const [confirmDeleteMove,setConfirmDeleteMove]=useState(null);
  const [selectMode,setSelectMode]=useState(false);
  const [selectedMoveIds,setSelectedMoveIds]=useState(new Set());
  const [confirmBulkDeleteMoves,setConfirmBulkDeleteMoves]=useState(false);
  const [versionMove, setVersionMove] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [attrFilters, setAttrFilters] = useState({});
  const [allMovesFilters, setAllMovesFilters] = useState({ category: [], tensionRole: [], origin: [] });
  const setDragItem=useRef(null);
  const [setDragOver,setSetDragOver]=useState(null);
  const masteryColorWip = p => p<30?C.red:p<60?C.yellow:p<80?C.blue:C.green;

  // When an idea is pushed in from the Ideas tab, open the add modal with its text
  useEffect(()=>{
    if(pendingDesc){ setIdeaDesc(pendingDesc); setShowAdd(true); clearPendingDesc(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- pendingDesc-only by intent; clearPendingDesc called inside is stable
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

  // ── ALL MOVES filtered list ──
  const allMovesFiltered = (() => {
    if (!showAllMoves) return [];
    let result = [...wipMoves];
    const f = allMovesFilters;
    if (f.category.length > 0) result = result.filter(m => f.category.includes(m.category));
    if (f.tensionRole.length > 0) result = result.filter(m => f.tensionRole.includes(m.tensionRole));
    if (f.origin.length > 0) result = result.filter(m => f.origin.includes(m.origin));
    if (hasActiveFilters) result = filterMovesByAttrs(result, attrFilters, customAttrs);
    if (search.trim()) result = result.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));
    return result.sort(sortFn);
  })();

  const saveMove=(form,id)=>{
    if(id){
      setMoves(prev=>prev.map(m=>m.id===id?{...m,...form}:m));
    } else {
      setMoves(prev=>[...prev,{...form, id:Date.now(), status:form.status||"wip"}]);
    }
  };
  const handleToggleTrainedToday = (id) => {
    const today = todayLocal();
    const move = moves.find(m => m.id === id);
    if (!move) return;
    const isToday = move.date === today;
    setMoves(prev => prev.map(m => {
      if (m.id !== id) return m;
      return isToday
        ? { ...m, date: m.prevDate || null, prevDate: null }
        : { ...m, prevDate: m.date, date: today };
    }));
    addToast({ icon: isToday ? "refresh" : "check", title: t(isToday ? "unmarkedToday" : "markedTrainedToday") });
  };
  const bulkImport=newMoves=>{ const w=newMoves.map(m=>({...m,id:Date.now()+Math.random(),status:m.status||"wip"})); setMoves(prev=>[...prev,...w]); };
  const delMove=id=>setMoves(prev=>prev.filter(m=>m.id!==id));
  const tryDelMove=m=>{ if(st.confirmDelete!==false) setConfirmDeleteMove(m); else delMove(m.id); };
  const toggleMoveSelect=(moveId)=>{ setSelectedMoveIds(prev=>{ const next=new Set(prev); if(next.has(moveId)) next.delete(moveId); else next.add(moveId); return next; }); };
  const exitMoveSelectMode=()=>{ setSelectMode(false); setSelectedMoveIds(new Set()); };
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
          <button onClick={()=>{exitMoveSelectMode();setOpenCat(null);setSearch("");setShowSearch(false);setCatReorderMode(false);}} style={{ background:"none", border:"none", cursor:"pointer", color:C.accent, fontSize:14, fontFamily:FONT_DISPLAY, fontWeight:700 }}>← Back</button>
          <div style={{ display:"flex", gap:3 }}>
            {selectMode ? (
              <>
                {selectedMoveIds.size>0&&(
                  <button onClick={()=>setConfirmBulkDeleteMoves(true)}
                    style={{ background:"none", border:"none", cursor:"pointer", padding:4, display:"flex", alignItems:"center", gap:4 }}>
                    <Ic n="trash" s={16} c={C.accent}/>
                    <span style={{ fontSize:11, color:C.accent, fontWeight:700, fontFamily:FONT_DISPLAY }}>{selectedMoveIds.size}</span>
                  </button>
                )}
                <button onClick={exitMoveSelectMode}
                  style={{ background:"none", border:"none", cursor:"pointer", padding:4 }}>
                  <Ic n="x" s={16} c={C.textMuted}/>
                </button>
              </>
            ) : (
              <>
                {!catReorderMode&&customAttrs.length>0&&<button onClick={()=>setShowFilter(s=>!s)}
                  style={{ background:"none", border:"none", cursor:"pointer", padding:4, color:showFilter?C.accent:C.textSec, position:"relative" }}>
                  <Ic n="filter" s={16}/>
                  {hasActiveFilters&&<div style={{ position:"absolute", top:2, right:2, width:6, height:6, borderRadius:"50%", background:C.accent }}/>}
                </button>}
                {!catReorderMode&&<button onClick={()=>{ setShowSearch(s=>!s); setSearch(""); }} style={{ background:"none", border:"none", cursor:"pointer", padding:4, color:showSearch?C.accent:C.textSec }}><Ic n="search" s={16}/></button>}
                {!catReorderMode&&<button onClick={()=>setCatView(v=>v==="tiles"?"list":"tiles")} style={{ background:"none", border:"none", cursor:"pointer", padding:4, color:C.textSec }}><Ic n={catView==="tiles"?"list":"grid"} s={16}/></button>}
                {!catReorderMode&&allCatMoves.length>=2&&<button onClick={()=>setSelectMode(true)}
                  style={{ background:"none", border:"none", cursor:"pointer", padding:4 }}>
                  <Ic n="checkCircle" s={16} c={C.textMuted}/>
                </button>}
                {allCatMoves.length>1&&<button onClick={()=>{ const next=!catReorderMode; setCatReorderMode(next); if(next){ const ids=allCatMoves.map(m=>m.id); setMoves(prev=>{ const rest=prev.filter(m=>!ids.includes(m.id)); const ordered=ids.map(id=>prev.find(m=>m.id===id)).filter(Boolean); return [...ordered,...rest]; }); } if(!next && onSortChange) onSortChange("sortMoves","custom"); }}
                  style={{ background:"none", border:"none", cursor:"pointer", padding:4,
                    color:catReorderMode?C.accent:C.textMuted, fontSize:13, fontWeight:800, fontFamily:FONT_DISPLAY, letterSpacing:1 }}>
                  {catReorderMode?"DONE":"⇅"}
                </button>}
              </>
            )}
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
              <div style={{ marginBottom:8 }}><Ic n="notebookPen" s={28} c={C.textMuted}/></div>
              <p style={{ fontSize:13 }}>{t("emptyHintMoves")}</p>
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
              {catMoves.map(m=><MoveTile key={m.id} move={m} searchQuery={search} onClick={()=>selectMode?toggleMoveSelect(m.id):setEditMove(m)} onEdit={()=>setEditMove(m)} onDelete={()=>tryDelMove(m)} onDuplicate={()=>dupMove(m)} onMove={cat=>moveToCat(m.id,cat)} allCats={cats} catColors={catColors} onToggleTrainedToday={handleToggleTrainedToday} selectMode={selectMode} isSelected={selectedMoveIds.has(m.id)}/>)}
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {catMoves.map(m=><MoveListRow key={m.id} move={m} searchQuery={search} catColor={catColor} onEdit={()=>selectMode?toggleMoveSelect(m.id):setEditMove(m)} onDelete={()=>tryDelMove(m)} onMove={cat=>moveToCat(m.id,cat)} allCats={cats} catColors={catColors} onToggleTrainedToday={handleToggleTrainedToday} selectMode={selectMode} isSelected={selectedMoveIds.has(m.id)}/>)}
            </div>
          )}
        </div>
        {showAdd&&<MoveModal initialCat={openCat} cats={cats} initialDesc={ideaDesc} onClose={()=>{setShowAdd(false);setIdeaDesc(null);}} onSave={f=>saveMove(f)} customAttrs={customAttrs} onAddAttr={def=>setCustomAttrs&&setCustomAttrs(p=>[...p,def])} allMoves={moves} catColors={catColors} isPremium={isPremium}/>}
        {editMove&&<MoveModal move={editMove} cats={cats} onClose={()=>setEditMove(null)} onSave={f=>{saveMove(f,editMove.id);setEditMove(null);}} customAttrs={customAttrs} onAddAttr={def=>setCustomAttrs&&setCustomAttrs(p=>[...p,def])} allMoves={moves} catColors={catColors} isPremium={isPremium}/>}
        {confirmDeleteMove && (
          <ConfirmDialog
            title={t("deleteMove")}
            body={<>{t("deleteMoveBody1")}<span style={{ color:C.text, fontWeight:700 }}>{confirmDeleteMove.name}</span>{t("deleteMoveBody2")}</>}
            onCancel={() => setConfirmDeleteMove(null)}
            onConfirm={() => { delMove(confirmDeleteMove.id); setConfirmDeleteMove(null); }}
          />
        )}
        {confirmBulkDeleteMoves && (
          <ConfirmDialog
            title={t("deleteSelected")}
            icon="trash"
            body={<>{selectedMoveIds.size} {t("itemsWillBeDeleted")}</>}
            onCancel={() => setConfirmBulkDeleteMoves(false)}
            onConfirm={() => {
              setMoves(prev => prev.filter(m => !selectedMoveIds.has(m.id)));
              setConfirmBulkDeleteMoves(false);
              exitMoveSelectMode();
              addToast({ icon: "trash", title: t("deleted") });
            }}
          />
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
      {reminders?.items?.length > 0 && (
        <ReminderBlock reminders={reminders} onRemindersChange={onRemindersChange} addToast={addToast} onOpenManage={onOpenManageReminders}/>
      )}

      {/* ── Version tracking prompt ── */}
      {versionEligible && !openCat && vocabTab === "moves" && (
        <div style={{ margin:"6px 14px", padding:14, background:C.surfaceAlt, borderRadius:8, position:"relative" }}>
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

      <VocabTabBar
        vocabTab={vocabTab}
        onChange={setVocabTabAndNotify}
        staleCount={staleCount}
        isPremium={isPremium}
      />

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

      {vocabTab==="moves"&&(
        <div style={{ display:"flex", justifyContent:"flex-end", alignItems:"center", padding:"5px 16px 3px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            {showAllMoves && selectMode ? (
              <>
                {selectedMoveIds.size>0&&(
                  <button onClick={()=>setConfirmBulkDeleteMoves(true)}
                    style={{ background:"none", border:"none", cursor:"pointer", padding:4, display:"flex", alignItems:"center", gap:4 }}>
                    <Ic n="trash" s={16} c={C.accent}/>
                    <span style={{ fontSize:11, color:C.accent, fontWeight:700, fontFamily:FONT_DISPLAY }}>{selectedMoveIds.size}</span>
                  </button>
                )}
                <button onClick={exitMoveSelectMode}
                  style={{ background:"none", border:"none", cursor:"pointer", padding:4 }}>
                  <Ic n="x" s={16} c={C.textMuted}/>
                </button>
              </>
            ) : (
              <>
                {customAttrs.length>0&&<button onClick={()=>setShowFilter(s=>!s)}
                  style={{ background:"none", border:"none", cursor:"pointer", padding:4, position:"relative", color:C.textSec }}>
                  <Ic n="filter" s={16}/>
                  {hasActiveFilters&&<div style={{ position:"absolute", top:2, right:2, width:6, height:6, borderRadius:"50%", background:C.accent }}/>}
                </button>}
                <button
                  disabled={view==="tree"||view==="all"}
                  onClick={()=>{ const next=!reorderMode; setReorderMode(next); if(next) setCats(sortedCats); if(!next && onSortChange) onSortChange("categorySort","manual"); }}
                  style={{ background:"none", border:"none",
                    cursor:(view==="tree"||view==="all") ? "default" : "pointer",
                    padding:4,
                    color:reorderMode?C.accent:C.textMuted,
                    fontSize:13, fontWeight:800, fontFamily:FONT_DISPLAY, letterSpacing:1,
                    opacity:(view==="tree"||view==="all") ? 0.35 : 1 }}>
                  {reorderMode?"DONE":"⇅"}
                </button>
                <button onClick={()=>{ setShowSearch(s=>!s); setSearch(""); }}
                  style={{ background:"none", border:"none", cursor:"pointer", padding:4, color:C.textSec }}>
                  <Ic n="search" s={16}/>
                </button>
                {view==="all" && allMovesFiltered.length>=2 && (
                  <button onClick={()=>setSelectMode(true)}
                    style={{ background:"none", border:"none", cursor:"pointer", padding:4 }}>
                    <Ic n="checkCircle" s={16} c={C.textMuted}/>
                  </button>
                )}
                {(()=>{
                  const modes = ["list","tiles",...(isPremium?["tree"]:[]),"all"];
                  const icons = { list:"list", tiles:"grid", tree:"gitFork", all:"cards" };
                  return <button onClick={()=>setView(modes[(modes.indexOf(view)+1)%modes.length])} style={{ background:"none", border:"none", cursor:"pointer", padding:4, color:C.textSec }}><Ic n={icons[view]||"list"} s={16}/></button>;
                })()}
              </>
            )}
          </div>
        </div>
      )}

      {showAllMoves && vocabTab==="moves" && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, padding:"6px 16px",
          borderBottom:`1px solid ${C.borderLight}` }}>
          <DropdownPill
            label={t("categories")}
            value={allMovesFilters.category}
            options={cats.map(c => ({ key: c, label: c, color: catColors[c] || C.accent }))}
            onChange={v => setAllMovesFilters(p => ({...p, category: v}))}
            defaultLabel={t("allCategories")}
          />
          <DropdownPill
            label={t("tensionRole")}
            value={allMovesFilters.tensionRole}
            options={[
              { key:"flow",  label: t("tensionFlow") },
              { key:"build", label: t("tensionBuild") },
              { key:"hit",   label: t("tensionHit") },
              { key:"peak",  label: t("tensionPeak") },
            ]}
            onChange={v => setAllMovesFilters(p => ({...p, tensionRole: v}))}
            defaultLabel={t("allRoles")}
          />
          <DropdownPill
            label={t("origin")}
            value={allMovesFilters.origin}
            options={[
              { key:"learned",  label: t("learned") },
              { key:"version",  label: t("myVersion") },
              { key:"creation", label: t("myCreation") },
            ]}
            onChange={v => setAllMovesFilters(p => ({...p, origin: v}))}
            defaultLabel={t("allOrigins")}
          />
        </div>
      )}

      <div style={{ flex:1, overflow:"auto", paddingTop: vocabTab==="gap" ? 0 : 10, paddingLeft: vocabTab==="gap" ? 0 : 16, paddingRight: vocabTab==="gap" ? 0 : 16, paddingBottom:76 }}>
        {vocabTab==="moves"&&<SectionBrief desc={t("libraryBrief")} stat={`${moves.length} moves across ${cats.length} categories`} settings={st}/>}
        {vocabTab==="moves"&&showAllMoves ? (
          /* ── ALL MOVES flat list ── */
          allMovesFiltered.length === 0 ? (
            <div style={{ textAlign:"center", padding:30, color:C.textMuted }}>
              <div style={{ marginBottom:8 }}><Ic n="filter" s={28} c={C.textMuted}/></div>
              <p style={{ fontSize:13 }}>{t("noMovesMatchFilter")}</p>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {allMovesFiltered.map(m => (
                <MoveTile
                  key={m.id}
                  move={m}
                  searchQuery={search}
                  onClick={() => selectMode ? toggleMoveSelect(m.id) : setEditMove(m)}
                  onEdit={() => setEditMove(m)}
                  onDelete={() => tryDelMove(m)}
                  onDuplicate={() => dupMove(m)}
                  onMove={cat => moveToCat(m.id, cat)}
                  allCats={cats}
                  catColors={catColors}
                  onToggleTrainedToday={handleToggleTrainedToday}
                  selectMode={selectMode}
                  isSelected={selectedMoveIds.has(m.id)}
                />
              ))}
            </div>
          )
        ) : vocabTab==="gap" ? (
          isPremium ? <><SectionBrief desc={t("gapBrief")} settings={st}/><GAPTab moves={moves} catColors={catColors} setMoves={setMoves} onDrill={onDrill} settings={st} onTrainToday={handleToggleTrainedToday}/></> : <div style={{padding:20}}><PremiumGate feature="gap" addToast={addToast}/></div>
        ) : vocabTab==="sets" ? (
          <div>
            <SectionBrief desc={t("setsBrief")} stat={`${sets.length} sets`} settings={st}/>
            {sets.filter(s=>(s.moveIds?.length||0)>=2).length>=1&&onOpenFlashCards&&(
              <div style={{ padding:"8px 0 0", flexShrink:0 }}>
                <button onClick={onOpenFlashCards}
                  style={{
                    width:"100%", padding:14, borderRadius:12,
                    border:`1px solid ${C.accent}`, background:"transparent",
                    color:C.accent, cursor:"pointer",
                    fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:13,
                    letterSpacing:1,
                    textTransform:"uppercase",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    gap:8, minHeight:44,
                  }}>
                  {t("flashCards")}
                </button>
              </div>
            )}
            <div style={{ display:"flex", justifyContent:"flex-end", alignItems:"center", gap:8, padding:"5px 16px 3px" }}>
              <button onClick={()=>setSetsView(v=>v==="list"?"tiles":"list")} style={{ background:"none", border:"none", cursor:"pointer", padding:4, color:C.textMuted }}><Ic n={setsView==="list"?"grid":"list"} s={16}/></button>
              <button onClick={()=>setReorderMode(r=>!r)}
                style={{ background:"none", border:"none", cursor:"pointer", padding:4,
                  color:reorderMode?C.accent:C.textMuted, fontSize:13, fontWeight:800, fontFamily:FONT_DISPLAY, letterSpacing:1 }}>
                {reorderMode?"DONE":"⇅"}
              </button>
            </div>
            {sets.length===0&&(
              <div style={{ textAlign:"center", padding:40, color:C.textMuted }}>
                <div style={{ marginBottom:8 }}><Ic n="cards" s={28} c={C.textMuted}/></div>
                <p style={{ fontSize:13 }}>{t("emptyHintSets")}</p>
              </div>
            )}
            {/* ── Tiles view ── */}
            {setsView==="tiles" ? (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                {sets.map(s=>{
                  const sColor=s.color||C.blue;
                  return (
                    <div key={s.id} onClick={()=>setEditSetModal(s)}
                      style={{ borderRadius:8, overflow:"hidden", background:C.surface, cursor:"pointer", position:"relative", borderLeft:`4px solid ${sColor}` }}>
                      <div style={{ padding:"14px 16px 13px 16px" }}>
                        <div style={{ display:"flex", alignItems:"flex-start", gap:6, marginBottom:4 }}>
                          <div style={{ width:8, height:8, borderRadius:"50%", background:sColor, flexShrink:0, marginTop:3 }}/>
                          <div style={{ fontWeight:700, fontSize:16, color:C.brown, fontFamily:FONT_DISPLAY, flex:1, lineHeight:1.3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", minWidth:0 }}>{s.name}</div>
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
                    <div key={s.id} style={{ position:"relative", marginBottom:6, borderRadius:8,
                      overflow:"hidden", background:C.surface, borderLeft:`4px solid ${sColor}` }}>
                      <div style={{ display:"flex", alignItems:"center", padding:"14px 16px 13px 16px", gap:6 }}>
                        {/* Expand/collapse */}
                        <button onClick={()=>setExpSets(p=>({...p,[s.id]:!isExp}))}
                          style={{ background:"none", border:"none", cursor:"pointer", padding:0, display:"flex", flexShrink:0 }}>
                          <Ic n={isExp?"chevD":"chevR"} s={14} c={sColor}/>
                        </button>
                        <div style={{ width:8, height:8, borderRadius:"50%", background:sColor, flexShrink:0 }}/>
                        {/* Name + subtitle */}
                        <div style={{ flex:1, minWidth:0, cursor:"pointer" }} onClick={()=>{ if(!reorderMode) setEditSetModal(s); }}>
                          <div style={{ fontWeight:700, fontSize:16, color:C.brown, fontFamily:FONT_DISPLAY, letterSpacing:0.5, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.name}</div>
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
                  <span style={{ fontSize:11, color:masteryColor(m.mastery), fontWeight:700 }}>{m.mastery}%</span>
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
              ? {display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,alignItems:"stretch"}
              : {display:"flex",flexDirection:"column",gap:6}}
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
                <div style={{ marginBottom: view!=="tiles" ? 6 : 0, flex:1 }}>
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
        item={{ name:"", color:PRESET_COLORS[1], moveIds:[], notes:"", mastery:0, date:todayLocal() }}
        onClose={()=>setAddingSet(false)}
        allMoves={moves} allSets={sets}
        onSave={fields=>{ setSets(p=>[...p,{id:Date.now(),...fields}]); setAddingSet(false); }}/>}
      {editSetModal&&<SetDetailModal type="set" item={editSetModal} onClose={()=>setEditSetModal(null)}
        allMoves={moves} allSets={sets}
        onSave={fields=>setSets(p=>p.map(s=>s.id===editSetModal.id?{...s,...fields}:s))}/>}
      {confirmDeleteSet && (
        <ConfirmDialog
          title={t("deleteSet")}
          body={<>&quot;<span style={{ color:C.text, fontWeight:700 }}>{confirmDeleteSet.name}</span>&quot; {t("deleteSetBody")}</>}
          onCancel={() => setConfirmDeleteSet(null)}
          onConfirm={() => {
            setSets(p => p.filter(x => x.id !== confirmDeleteSet.id));
            setConfirmDeleteSet(null);
          }}
        />
      )}
      {confirmDeleteMove && (
        <ConfirmDialog
          title={t("deleteMove")}
          body={<>{t("deleteMoveBody1")}<span style={{ color:C.text, fontWeight:700 }}>{confirmDeleteMove.name}</span>{t("deleteMoveBody2")}</>}
          onCancel={() => setConfirmDeleteMove(null)}
          onConfirm={() => { delMove(confirmDeleteMove.id); setConfirmDeleteMove(null); }}
        />
      )}
      {confirmBulkDeleteMoves && !openCat && (
        <ConfirmDialog
          title={t("deleteSelected")}
          icon="trash"
          body={<>{selectedMoveIds.size} {t("itemsWillBeDeleted")}</>}
          onCancel={() => setConfirmBulkDeleteMoves(false)}
          onConfirm={() => {
            setMoves(prev => prev.filter(m => !selectedMoveIds.has(m.id)));
            setConfirmBulkDeleteMoves(false);
            exitMoveSelectMode();
            addToast({ icon: "trash", title: t("deleted") });
          }}
        />
      )}
      {showAddCat&&<AddCategoryModal onClose={()=>setShowAddCat(false)} onAdd={addCategory} existingCats={cats} existingColors={catColors}/>}
      {/* MoveModal at root level — for "Add to Move" arriving from Ideas tab */}
      {showAdd&&<MoveModal initialCat={cats[0]||""} cats={cats} initialDesc={ideaDesc} onClose={()=>{setShowAdd(false);setIdeaDesc(null);}} onSave={f=>saveMove(f)} customAttrs={customAttrs} onAddAttr={def=>setCustomAttrs&&setCustomAttrs(p=>[...p,def])} allMoves={moves} catColors={catColors} isPremium={isPremium}/>}
      {/* EditMove at root level — for tree/search views where openCat is null */}
      {!openCat&&editMove&&<MoveModal move={editMove} cats={cats} onClose={()=>setEditMove(null)} onSave={f=>{saveMove(f,editMove.id);setEditMove(null);}} customAttrs={customAttrs} onAddAttr={def=>setCustomAttrs&&setCustomAttrs(p=>[...p,def])} allMoves={moves} catColors={catColors} isPremium={isPremium}/>}
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
      <BottomSheet open={showLibraryMenu} onClose={()=>setShowLibraryMenu(false)} title={t("addToLibraryTitle")}>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {[
            {icon:"plus",label:t("addMoveMenu"),action:()=>{setShowLibraryMenu(false);setShowAdd(true);}},
            {icon:"cards",label:t("bulkImportMenu"),action:()=>{setShowLibraryMenu(false);setBulk(true);}},
            {icon:"folderPlus",label:t("addCategoryMenu"),action:()=>{setShowLibraryMenu(false);setShowAddCat(true);}},
            {icon:"compass",label:t("creativeTools"),action:()=>{setShowLibraryMenu(false);if(onOpenTools)onOpenTools();}},
          ].map(opt=>(
            <button key={opt.icon} onClick={opt.action}
              style={{display:"flex",alignItems:"center",gap:12,width:"100%",
                padding:"14px 16px",borderRadius:8,cursor:"pointer",
                background:C.surfaceAlt,border:"none",textAlign:"left"}}>
              <Ic n={opt.icon} s={18} c={C.textSec}/>
              <span style={{fontSize:14,fontFamily:FONT_DISPLAY,fontWeight:700,color:C.text}}>
                {opt.label}
              </span>
            </button>
          ))}
        </div>
      </BottomSheet>
    </div>
  );
};
