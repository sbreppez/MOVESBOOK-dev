import React from 'react';
import { useSettings } from '../../hooks/useSettings';
import { useT } from '../../hooks/useTranslation';
import { FONT_DISPLAY } from '../../constants/fonts';
import { Ic } from '../shared/Ic';

export const WipHeaderActions = ({
  view, setView,
  reorderMode, setReorderMode,
  sortedCats, setCats, onSortChange,
  customAttrs, showFilter, setShowFilter, hasActiveFilters,
  selectMode, setSelectMode, selectedCount, setConfirmBulkDeleteMoves, exitMoveSelectMode,
  showSearch, setShowSearch, setSearch,
  isPremium,
  allMovesFilteredLength,
}) => {
  const { C } = useSettings();
  const t = useT();
  const showAllMoves = view === "all";
  const reorderDisabled = view === "tree" || view === "all";

  return (
    <div style={{ display:"flex", justifyContent:"flex-end", alignItems:"center", padding:"5px 16px 3px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        {showAllMoves && selectMode ? (
          <>
            {selectedCount>0&&(
              <button onClick={()=>setConfirmBulkDeleteMoves(true)}
                style={{ background:"none", border:"none", cursor:"pointer", padding:4, display:"flex", alignItems:"center", gap:4 }}>
                <Ic n="trash" s={16} c={C.accent}/>
                <span style={{ fontSize:11, color:C.accent, fontWeight:700, fontFamily:FONT_DISPLAY }}>{selectedCount}</span>
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
              disabled={reorderDisabled}
              onClick={()=>{ const next=!reorderMode; setReorderMode(next); if(next) setCats(sortedCats); if(!next && onSortChange) onSortChange("categorySort","manual"); }}
              style={{ background:"none", border:"none",
                cursor:reorderDisabled ? "default" : "pointer",
                padding:4,
                color:reorderMode?C.accent:C.textMuted,
                fontSize:13, fontWeight:800, fontFamily:FONT_DISPLAY, letterSpacing:1,
                opacity:reorderDisabled ? 0.35 : 1 }}>
              {reorderMode ? t("done") : "⇅"}
            </button>
            <button onClick={()=>{ setShowSearch(s=>!s); setSearch(""); }}
              style={{ background:"none", border:"none", cursor:"pointer", padding:4, color:C.textSec }}>
              <Ic n="search" s={16}/>
            </button>
            {view==="all" && allMovesFilteredLength>=2 && (
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
  );
};
