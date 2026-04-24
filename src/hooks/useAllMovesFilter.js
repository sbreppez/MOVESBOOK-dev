import { useState, useEffect } from 'react';
import { filterMovesByAttrs } from '../utils/attributeHelpers';

export const useAllMovesFilter = ({
  view,
  wipMoves,
  sortFn,
  hasActiveFilters,
  attrFilters,
  customAttrs,
  search,
  exitMoveSelectMode,
}) => {
  const [allMovesFilters, setAllMovesFilters] = useState({
    category: [],
    tensionRole: [],
    origin: [],
  });

  // Cleanup when leaving ALL MOVES view: clear filters and exit select mode
  useEffect(() => {
    if (view !== "all") {
      setAllMovesFilters({ category: [], tensionRole: [], origin: [] });
      exitMoveSelectMode();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- view-only by intent; exitMoveSelectMode is not memoized in useMoveCrud (adding it would re-fire every render and loop setAllMovesFilters)
  }, [view]);

  const showAllMoves = view === "all";

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

  return { allMovesFilters, setAllMovesFilters, allMovesFiltered };
};
