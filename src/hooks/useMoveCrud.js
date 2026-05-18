import { useState } from 'react';
import { todayLocal } from '../utils/dateUtils';

// Move CRUD hook — owns selection + confirm-modal state and pure mutations
// (save / bulk import / category move). Delete-with-cleanup is owned at the
// App level (handleDelMove / handleBulkDeleteMoves) so it can sweep all the
// cross-store move references on every delete (#264).
export const useMoveCrud = ({ moves: _moves, setMoves, addToast: _addToast, t: _t, st: _st }) => {
  const [confirmDeleteMove, setConfirmDeleteMove] = useState(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedMoveIds, setSelectedMoveIds] = useState(new Set());
  const [confirmBulkDeleteMoves, setConfirmBulkDeleteMoves] = useState(false);

  const saveMove = (form, id) => {
    if (id) {
      setMoves(prev => prev.map(m => m.id === id ? { ...m, ...form } : m));
    } else {
      setMoves(prev => [...prev, { ...form, id: Date.now() }]);
    }
  };

  const bulkImport = (newMoves) => {
    const w = newMoves.map(m => ({
      ...m,
      id: Date.now() + Math.random(),
    }));
    setMoves(prev => [...prev, ...w]);
  };

  const moveToCat = (id, cat) => setMoves(prev =>
    prev.map(m => m.id === id ? { ...m, category: cat } : m)
  );

  const toggleMoveSelect = (moveId) => {
    setSelectedMoveIds(prev => {
      const next = new Set(prev);
      if (next.has(moveId)) next.delete(moveId);
      else next.add(moveId);
      return next;
    });
  };

  const exitMoveSelectMode = () => {
    setSelectMode(false);
    setSelectedMoveIds(new Set());
  };

  return {
    confirmDeleteMove,
    selectMode,
    selectedMoveIds,
    confirmBulkDeleteMoves,
    setConfirmDeleteMove,
    setSelectMode,
    setSelectedMoveIds,
    setConfirmBulkDeleteMoves,
    saveMove,
    bulkImport,
    moveToCat,
    toggleMoveSelect,
    exitMoveSelectMode,
  };
};
