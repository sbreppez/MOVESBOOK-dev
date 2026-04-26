import React, { useState, useEffect, Fragment } from 'react';
import { Ic } from '../shared/Ic';
import { useT, usePlural } from '../../hooks/useTranslation';
import { useSettings } from '../../hooks/useSettings';
import { MoveModal } from './MoveModal';
import { BulkModal } from './BulkModal';
import { AddCategoryModal } from './AddCategoryModal';
import { AttributeFilter } from './AttributeFilter';
import { filterMovesByAttrs } from '../../utils/attributeHelpers';
import { ReminderBlock } from './ReminderBlock';
import { GAPTab } from './GAPTab';
import { PremiumGate } from '../shared/PremiumGate';
import { SectionBrief } from '../shared/SectionBrief';
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
import { useResponsive } from '../../hooks/useResponsive';
import { AllMovesView } from './AllMovesView';
import { SearchResultsView } from './SearchResultsView';
import { CategoryGrid } from './CategoryGrid';
import { SetsView } from './SetsView';
import { WipHeaderActions } from './WipHeaderActions';
import { CategoryDetailView } from './CategoryDetailView';

export const WIPPage = ({ moves, setMoves, cats, setCats, catColors, setCatColors, catDomains: _catDomains={}, setCatDomains: _setCatDomains, sets=[], setSets=()=>{}, addToast, pendingDesc, clearPendingDesc, settings={}, onSettingsChange, onAddTrigger, onAddTrigger2=0, onSubTabChange, parentSubTab, onSortChange, customAttrs=[], setCustomAttrs, reminders, onRemindersChange, onDrill, onOpenManageReminders, onOpenExplore: _onOpenExplore, onOpenRRR: _onOpenRRR, onOpenCombine: _onOpenCombine, onOpenMap: _onOpenMap, onOpenFlashCards, onOpenTools, isPremium, staleCount=0, onBulkTrigger }) => {
  const t = useT();
  const { moveCountStr } = usePlural();
  const { C, settings:ctxSettings } = useSettings();
  const st = {...ctxSettings,...settings};
  const [view,setView]=useState(st.defaultView||"list");
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
  const [addingSet,setAddingSet]=useState(false);
  // Sync view state when the defaultView setting changes
  useEffect(()=>{ setView(st.defaultView||"list"); },[st.defaultView]);
  // Fallback for phone: tiles view doesn't ship on phones — drop to list
  const { isPhone } = useResponsive();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- isPhone+view-only by intent; setView is stable
  useEffect(()=>{ if (isPhone && view === "tiles") setView("list"); },[isPhone, view]);
  const [showFilter, setShowFilter] = useState(false);
  const [attrFilters, setAttrFilters] = useState({});

  // When an idea is pushed in from the Ideas tab, open the add modal with its text
  useEffect(()=>{
    if(pendingDesc){ setIdeaDesc(pendingDesc); setShowAdd(true); clearPendingDesc(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- pendingDesc-only by intent; clearPendingDesc called inside is stable
  },[pendingDesc]);

  const wipMoves=moves; // show all moves regardless of status
  const sortFn = st.sortMoves==="name" ? (a,b)=>a.name.localeCompare(b.name)
    : st.sortMoves==="nameDesc" ? (a,b)=>b.name.localeCompare(a.name)
    : st.sortMoves==="mastery" ? (a,b)=>b.mastery-a.mastery
    : st.sortMoves==="masteryLow" ? (a,b)=>a.mastery-b.mastery
    : (_a,_b)=>0; // custom/date = insertion order
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

  const confirmDialogs = (
    <>
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
    </>
  );

  if (openCat) {
    return (
      <>
        <CategoryDetailView
          cat={openCat}
          onBack={() => setOpenCat(null)}
          moves={moves}
          setMoves={setMoves}
          cats={cats}
          catColors={catColors}
          inCat={inCat}
          customAttrs={customAttrs}
          setCustomAttrs={setCustomAttrs}
          isPremium={isPremium}
          onSortChange={onSortChange}
          search={search}
          setSearch={setSearch}
          showSearch={showSearch}
          setShowSearch={setShowSearch}
          showFilter={showFilter}
          setShowFilter={setShowFilter}
          hasActiveFilters={hasActiveFilters}
          attrFilters={attrFilters}
          setAttrFilters={setAttrFilters}
          showAdd={showAdd}
          setShowAdd={setShowAdd}
          editMove={editMove}
          setEditMove={setEditMove}
          ideaDesc={ideaDesc}
          setIdeaDesc={setIdeaDesc}
          selectMode={selectMode}
          setSelectMode={setSelectMode}
          selectedMoveIds={selectedMoveIds}
          setConfirmDeleteMove={setConfirmDeleteMove}
          setConfirmBulkDeleteMoves={setConfirmBulkDeleteMoves}
          saveMove={saveMove}
          tryDelMove={tryDelMove}
          dupMove={dupMove}
          moveToCat={moveToCat}
          handleToggleTrainedToday={handleToggleTrainedToday}
          toggleMoveSelect={toggleMoveSelect}
          exitMoveSelectMode={exitMoveSelectMode}
        />
        {confirmDialogs}
      </>
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
        <WipHeaderActions
          view={view} setView={setView}
          reorderMode={reorderMode} setReorderMode={setReorderMode}
          sortedCats={sortedCats} setCats={setCats} onSortChange={onSortChange}
          customAttrs={customAttrs}
          showFilter={showFilter} setShowFilter={setShowFilter}
          hasActiveFilters={hasActiveFilters}
          selectMode={selectMode} setSelectMode={setSelectMode}
          selectedCount={selectedMoveIds.size}
          setConfirmBulkDeleteMoves={setConfirmBulkDeleteMoves}
          exitMoveSelectMode={exitMoveSelectMode}
          showSearch={showSearch} setShowSearch={setShowSearch} setSearch={setSearch}
          isPremium={isPremium}
          allMovesFilteredLength={allMovesFiltered.length}
        />
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
            renameCategory={renameCategory}
            dupCategory={dupCategory}
            changeCatColor={changeCatColor}
            moveCatUp={moveCatUp}
            moveCatDown={moveCatDown}
          />
        )}
      </div>
      {confirmDialogs}
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
