import { useState } from 'react';
import { todayLocal } from '../utils/dateUtils';

export const useMoveCrud = ({ moves, setMoves, addToast, t, st }) => {
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

  const handleToggleTrainedToday = (id, { silent = false } = {}) => {
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
    if (!silent) {
      addToast({
        icon: isToday ? "refresh" : "check",
        title: t(isToday ? "unmarkedToday" : "markedTrainedToday"),
      });
    }
  };

  const bulkImport = (newMoves) => {
    const w = newMoves.map(m => ({
      ...m,
      id: Date.now() + Math.random(),
    }));
    setMoves(prev => [...prev, ...w]);
  };

  const delMove = (id) => setMoves(prev => prev.filter(m => m.id !== id));

  const tryDelMove = (m) => {
    if (st.confirmDelete !== false) setConfirmDeleteMove(m);
    else delMove(m.id);
  };

  const dupMove = (m) => setMoves(prev => [
    ...prev,
    { ...m, id: Date.now(), name: m.name + " (copy)" },
  ]);

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

  const bulkDeleteSelected = () => {
    setMoves(prev => prev.filter(m => !selectedMoveIds.has(m.id)));
    setConfirmBulkDeleteMoves(false);
    exitMoveSelectMode();
    addToast({ icon: "trash", title: t("deleted") });
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
    handleToggleTrainedToday,
    bulkImport,
    delMove,
    tryDelMove,
    dupMove,
    moveToCat,
    toggleMoveSelect,
    exitMoveSelectMode,
    bulkDeleteSelected,
  };
};
