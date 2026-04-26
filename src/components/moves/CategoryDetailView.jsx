import React, { useState } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { useT, usePlural } from '../../hooks/useTranslation';
import { FONT_DISPLAY } from '../../constants/fonts';
import { Crumbs } from '../shared/Crumbs';
import { Ic } from '../shared/Ic';
import { MoveModal } from './MoveModal';
import { MoveListRow } from './MoveListRow';
import { AttributeFilter } from './AttributeFilter';

export const CategoryDetailView = ({
  cat,
  onBack,
  moves, setMoves, cats, catColors, inCat,
  customAttrs, setCustomAttrs,
  isPremium, onSortChange,
  search, setSearch, showSearch, setShowSearch,
  showFilter, setShowFilter, hasActiveFilters,
  attrFilters, setAttrFilters,
  showAdd, setShowAdd,
  editMove, setEditMove,
  ideaDesc, setIdeaDesc,
  selectMode, setSelectMode,
  selectedMoveIds,
  setConfirmDeleteMove: _setConfirmDeleteMove, setConfirmBulkDeleteMoves,
  saveMove, tryDelMove, dupMove, moveToCat,
  handleToggleTrainedToday, toggleMoveSelect,
  exitMoveSelectMode,
}) => {
  const { C } = useSettings();
  const t = useT();
  const { resultCountStr } = usePlural();

  const [catReorderMode, setCatReorderMode] = useState(false);

  const allCatMoves = inCat(cat);
  const catColor = catColors[cat] || C.accent;
  const catMoves = search.trim()
    ? allCatMoves.filter(m => m.name.toLowerCase().includes(search.toLowerCase()))
    : allCatMoves;

  const moveMoveUp = (idx, list) => {
    if (idx === 0) return;
    const ids = list.map(m => m.id);
    setMoves(prev => {
      const n = [...prev];
      const ai = n.findIndex(x => x.id === ids[idx]);
      const bi = n.findIndex(x => x.id === ids[idx - 1]);
      [n[ai], n[bi]] = [n[bi], n[ai]];
      return n;
    });
  };
  const moveMoveDown = (idx, list) => {
    if (idx === list.length - 1) return;
    const ids = list.map(m => m.id);
    setMoves(prev => {
      const n = [...prev];
      const ai = n.findIndex(x => x.id === ids[idx]);
      const bi = n.findIndex(x => x.id === ids[idx + 1]);
      [n[ai], n[bi]] = [n[bi], n[ai]];
      return n;
    });
  };

  const handleBack = () => {
    exitMoveSelectMode();
    setSearch("");
    setShowSearch(false);
    setCatReorderMode(false);
    onBack();
  };

  return (
    <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
      <Crumbs items={[t("vocab"),cat]}/>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"6px 14px", borderBottom:`1px solid ${C.borderLight}`, background:C.surface, flexShrink:0 }}>
        <button onClick={handleBack} style={{ background:"none", border:"none", cursor:"pointer", color:C.accent, fontSize:14, fontFamily:FONT_DISPLAY, fontWeight:700 }}>← {t("back")}</button>
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
              {allCatMoves.length>1&&<button onClick={()=>{ const next=!catReorderMode; setCatReorderMode(next); if(next){ const ids=allCatMoves.map(m=>m.id); setMoves(prev=>{ const rest=prev.filter(m=>!ids.includes(m.id)); const ordered=ids.map(id=>prev.find(m=>m.id===id)).filter(Boolean); return [...ordered,...rest]; }); } if(!next && onSortChange) onSortChange("sortMoves","custom"); }}
                style={{ background:"none", border:"none", cursor:"pointer", padding:4,
                  color:catReorderMode?C.accent:C.textMuted, fontSize:13, fontWeight:800, fontFamily:FONT_DISPLAY, letterSpacing:1 }}>
                {catReorderMode ? t("done") : "⇅"}
              </button>}
              {!catReorderMode&&<button onClick={()=>{ setShowSearch(s=>!s); setSearch(""); }} style={{ background:"none", border:"none", cursor:"pointer", padding:4, color:showSearch?C.accent:C.textSec }}><Ic n="search" s={16}/></button>}
              {!catReorderMode&&allCatMoves.length>=2&&<button onClick={()=>setSelectMode(true)}
                style={{ background:"none", border:"none", cursor:"pointer", padding:4 }}>
                <Ic n="checkCircle" s={16} c={C.textMuted}/>
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
          <div style={{ textAlign:"center", padding:30, color:C.textMuted }}><p style={{fontSize:13}}>{t("noMovesMatchSearch")} &quot;{search}&quot;</p></div>
        ) : catReorderMode ? (
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
                <MoveListRow move={m} catColor={catColor} onEdit={()=>setEditMove(m)} onDelete={()=>tryDelMove(m)} onMove={c=>moveToCat(m.id,c)} allCats={cats} catColors={catColors} onToggleTrainedToday={handleToggleTrainedToday}/>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {catMoves.map(m=><MoveListRow key={m.id} move={m} searchQuery={search} catColor={catColor} onEdit={()=>selectMode?toggleMoveSelect(m.id):setEditMove(m)} onDelete={()=>tryDelMove(m)} onMove={c=>moveToCat(m.id,c)} allCats={cats} catColors={catColors} onToggleTrainedToday={handleToggleTrainedToday} selectMode={selectMode} isSelected={selectedMoveIds.has(m.id)}/>)}
          </div>
        )}
      </div>
      {showAdd&&<MoveModal initialCat={cat} cats={cats} initialDesc={ideaDesc} onClose={()=>{setShowAdd(false);setIdeaDesc(null);}} onSave={f=>saveMove(f)} customAttrs={customAttrs} onAddAttr={def=>setCustomAttrs&&setCustomAttrs(p=>[...p,def])} allMoves={moves} catColors={catColors} isPremium={isPremium}/>}
      {editMove&&<MoveModal move={editMove} cats={cats} onClose={()=>setEditMove(null)} onSave={f=>{saveMove(f,editMove.id);setEditMove(null);}} customAttrs={customAttrs} onAddAttr={def=>setCustomAttrs&&setCustomAttrs(p=>[...p,def])} allMoves={moves} catColors={catColors} isPremium={isPremium}/>}
    </div>
  );
};
