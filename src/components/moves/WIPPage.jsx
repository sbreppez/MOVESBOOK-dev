import React, { useState, useEffect, useRef, Fragment } from 'react';
import { FONT_DISPLAY } from '../../constants/fonts';
import { Ic } from '../shared/Ic';
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
import { AttributeFilter } from './AttributeFilter';
import { filterMovesByAttrs } from '../../utils/attributeHelpers';
import { ReminderBlock } from './ReminderBlock';
import { GAPTab } from './GAPTab';
import { PremiumGate } from '../shared/PremiumGate';
import { SectionBrief } from '../shared/SectionBrief';
import { BottomSheet } from '../shared/BottomSheet';
import { MoveTree } from './MoveTree';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { VocabTabBar } from './VocabTabBar';
import { LibraryMenuSheet } from './LibraryMenuSheet';
import { VersionTrackingPrompt } from './VersionTrackingPrompt';
import { useVersionPrompt } from '../../hooks/useVersionPrompt';
import { useAllMovesFilter } from '../../hooks/useAllMovesFilter';
import { useWipTriggers } from '../../hooks/useWipTriggers';
import { useSearchFilter } from '../../hooks/useSearchFilter';
import { useMoveCrud } from '../../hooks/useMoveCrud';
import { useCategoryCrud } from '../../hooks/useCategoryCrud';
import { AllMovesView } from './AllMovesView';
import { SearchResultsView } from './SearchResultsView';
import { CategoryGrid } from './CategoryGrid';
import { SetsView } from './SetsView';

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
  const [editMove,setEditMove]=useState(null);
  // cats/catColors are now lifted to App — received as props
  const [showAddCat,setShowAddCat]=useState(false);
  const [ideaDesc,setIdeaDesc]=useState(null);
  const [reorderMode, setReorderMode] = useState(false);
  const [catReorderMode, setCatReorderMode] = useState(false);
  const moveMoveUp   = (idx, list) => { if(idx===0) return; const ids=list.map(m=>m.id); setMoves(prev=>{ const n=[...prev]; const ai=n.findIndex(x=>x.id===ids[idx]); const bi=n.findIndex(x=>x.id===ids[idx-1]); [n[ai],n[bi]]=[n[bi],n[ai]]; return n; }); };
  const moveMoveDown = (idx, list) => { if(idx===list.length-1) return; const ids=list.map(m=>m.id); setMoves(prev=>{ const n=[...prev]; const ai=n.findIndex(x=>x.id===ids[idx]); const bi=n.findIndex(x=>x.id===ids[idx+1]); [n[ai],n[bi]]=[n[bi],n[ai]]; return n; }); };
  const [addingSet,setAddingSet]=useState(false);
  // Sync view state when the defaultView setting changes
  useEffect(()=>{ setView(st.defaultView||"list"); },[st.defaultView]);
  const [showFilter, setShowFilter] = useState(false);
  const [attrFilters, setAttrFilters] = useState({});
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

  const { search, setSearch, showSearch, setShowSearch, searchResults } = useSearchFilter({
    cats,
    inCat,
  });

  const sortedCats = reorderMode ? cats : (
    st.categorySort==="name"
      ? [...cats].sort((a,b)=>a.localeCompare(b))
      : st.categorySort==="progress"
        ? [...cats].sort((a,b)=>{ const pctA=inCat(a).length?masteredCount(a)/inCat(a).length:0; const pctB=inCat(b).length?masteredCount(b)/inCat(b).length:0; return pctB-pctA; })
        : cats // manual = insertion order
  );

  const {
    confirmDeleteMove,
    selectMode,
    selectedMoveIds,
    confirmBulkDeleteMoves,
    setConfirmDeleteMove,
    setSelectMode,
    setConfirmBulkDeleteMoves,
    saveMove,
    handleToggleTrainedToday,
    bulkImport,
    delMove,
    tryDelMove,
    dupMove,
    moveToCat,
    toggleMoveSelect,
    exitMoveSelectMode,
    bulkDeleteSelected,
  } = useMoveCrud({ moves, setMoves, addToast, t, st });

  const { allMovesFilters, setAllMovesFilters, allMovesFiltered } = useAllMovesFilter({
    view,
    wipMoves,
    sortFn,
    hasActiveFilters,
    attrFilters,
    customAttrs,
    search,
    exitMoveSelectMode,
  });

  const {
    addCategory,
    dupCategory,
    moveCatUp,
    moveCatDown,
    changeCatColor,
    renameCategory,
    catDragItem,
    catDragOver,
    setCatDragOver,
    handleCatDragStart,
    handleCatDragOver,
    handleCatDrop,
  } = useCategoryCrud({
    cats,
    setCats,
    catColors,
    setCatColors,
    setMoves,
    categorySort: st.categorySort,
    defaultColor: C.accent,
  });

  const {
    versionEligible,
    versionMove,
    openVersion,
    closeVersion,
    dismissVersion,
    VERSION_CHIPS,
  } = useVersionPrompt({
    moves,
    vocabTab,
    versionPromptsShown: st.versionPromptsShown,
    onSettingsChange,
  });

  useWipTriggers({
    onAddTrigger,
    onAddTrigger2,
    onBulkTrigger,
    openCat,
    vocabTab,
    setShowAdd,
    setAddingSet,
    setShowLibraryMenu,
    setShowAddCat,
    setBulk,
    onDrill,
  });

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
            onConfirm={bulkDeleteSelected}
          />
        )}
      </div>
    );
  }

  return (
    <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
      {reminders?.items?.length > 0 && (
        <ReminderBlock reminders={reminders} onRemindersChange={onRemindersChange} addToast={addToast} onOpenManage={onOpenManageReminders}/>
      )}

      {versionEligible && !openCat && vocabTab === "moves" && (
        <VersionTrackingPrompt
          move={versionEligible}
          onDismiss={dismissVersion}
          onCreateVariation={openVersion}
        />
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

      <div style={{ flex:1, overflow:"auto", paddingTop: vocabTab==="gap" ? 0 : 10, paddingLeft: vocabTab==="gap" ? 0 : 16, paddingRight: vocabTab==="gap" ? 0 : 16, paddingBottom:76 }}>
        {vocabTab==="moves"&&<SectionBrief desc={t("libraryBrief")} stat={`${moves.length} moves across ${cats.length} categories`} settings={st}/>}
        {vocabTab==="moves"&&showAllMoves ? (
          <AllMovesView
            allMovesFilters={allMovesFilters}
            setAllMovesFilters={setAllMovesFilters}
            allMovesFiltered={allMovesFiltered}
            cats={cats}
            catColors={catColors}
            search={search}
            selectMode={selectMode}
            selectedMoveIds={selectedMoveIds}
            onToggleSelect={toggleMoveSelect}
            onEditMove={setEditMove}
            onDeleteMove={tryDelMove}
            onDuplicateMove={dupMove}
            onMoveToCat={moveToCat}
            onToggleTrainedToday={handleToggleTrainedToday}
          />
        ) : vocabTab==="gap" ? (
          isPremium ? <><SectionBrief desc={t("gapBrief")} settings={st}/><GAPTab moves={moves} catColors={catColors} setMoves={setMoves} onDrill={onDrill} settings={st} onTrainToday={handleToggleTrainedToday}/></> : <div style={{padding:20}}><PremiumGate feature="gap" addToast={addToast}/></div>
        ) : vocabTab==="sets" ? (
          <SetsView
            sets={sets}
            setSets={setSets}
            moves={moves}
            addingSet={addingSet}
            setAddingSet={setAddingSet}
            reorderMode={reorderMode}
            setReorderMode={setReorderMode}
            showMastery={st.showMastery}
            showSectionDescriptions={st.showSectionDescriptions}
            defaultView={st.defaultView}
            onOpenFlashCards={onOpenFlashCards}
          />
        ) : searchResults ? (
          <SearchResultsView
            searchResults={searchResults}
            search={search}
            catColors={catColors}
            setCats={setCats}
            renameCategory={renameCategory}
            dupCategory={dupCategory}
            changeCatColor={changeCatColor}
            inCat={inCat}
            masteredCount={masteredCount}
            setOpenCat={setOpenCat}
            setEditMove={setEditMove}
            showMastery={st.showMastery}
            showMoveCount={st.showMoveCount}
          />
        ) : view==="tree" ? (
          <MoveTree moves={hasActiveFilters ? filterMovesByAttrs(wipMoves, attrFilters, customAttrs) : wipMoves} catColors={catColors} onEdit={m=>setEditMove(m)} settings={st}/>
        ) : (
          <CategoryGrid
            sortedCats={sortedCats}
            view={view}
            reorderMode={reorderMode}
            inCat={inCat}
            masteredCount={masteredCount}
            catColors={catColors}
            showMastery={st.showMastery}
            showMoveCount={st.showMoveCount}
            setOpenCat={setOpenCat}
            setCats={setCats}
            setCatReorderMode={setCatReorderMode}
            renameCategory={renameCategory}
            dupCategory={dupCategory}
            changeCatColor={changeCatColor}
            moveCatUp={moveCatUp}
            moveCatDown={moveCatDown}
            catDragOver={catDragOver}
            setCatDragOver={setCatDragOver}
            catDragItem={catDragItem}
            handleCatDrop={handleCatDrop}
          />
        )}
      </div>
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
          onConfirm={bulkDeleteSelected}
        />
      )}
      {showAddCat&&<AddCategoryModal onClose={()=>setShowAddCat(false)} onAdd={addCategory} existingCats={cats} existingColors={catColors}/>}
      {/* MoveModal at root level — for "Add to Move" arriving from Ideas tab */}
      {showAdd&&<MoveModal initialCat={cats[0]||""} cats={cats} initialDesc={ideaDesc} onClose={()=>{setShowAdd(false);setIdeaDesc(null);}} onSave={f=>saveMove(f)} customAttrs={customAttrs} onAddAttr={def=>setCustomAttrs&&setCustomAttrs(p=>[...p,def])} allMoves={moves} catColors={catColors} isPremium={isPremium}/>}
      {/* EditMove at root level — for tree/search views where openCat is null */}
      {!openCat&&editMove&&<MoveModal move={editMove} cats={cats} onClose={()=>setEditMove(null)} onSave={f=>{saveMove(f,editMove.id);setEditMove(null);}} customAttrs={customAttrs} onAddAttr={def=>setCustomAttrs&&setCustomAttrs(p=>[...p,def])} allMoves={moves} catColors={catColors} isPremium={isPremium}/>}
      {/* Version move modal — triggered by version tracking prompt */}
      {versionMove && (
        <MoveModal
          initialCat={versionMove.category}
          cats={cats}
          initialDesc={versionMove._versionChip
            ? t(VERSION_CHIPS.find(c => c.key === versionMove._versionChip)?.label || "")
            : ""}
          onSave={f => {
            saveMove({ ...f, origin: "version", parentId: versionMove.id });
            closeVersion();
          }}
          onClose={closeVersion}
          customAttrs={customAttrs}
          onAddAttr={def => setCustomAttrs && setCustomAttrs(p => [...p, def])}
          allMoves={moves}
          catColors={catColors}
          move={{
            name: `${versionMove.name} (v2)`,
            category: versionMove.category,
            origin: "version",
            parentId: versionMove.id,
            mastery: 0,
          }}
        />
      )}
      {bulk&&<BulkModal onClose={()=>setBulk(false)} onImport={bulkImport} cats={cats}/>}
      <LibraryMenuSheet
        open={showLibraryMenu}
        onClose={() => setShowLibraryMenu(false)}
        onAddMove={() => setShowAdd(true)}
        onBulkImport={() => setBulk(true)}
        onAddCategory={() => setShowAddCat(true)}
        onOpenTools={onOpenTools}
      />
    </div>
  );
};
