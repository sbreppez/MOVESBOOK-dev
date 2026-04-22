import { useRef, useState } from 'react';

export const useCategoryCrud = ({
  cats,
  setCats,
  catColors,
  setCatColors,
  setMoves,
  categorySort,
  defaultColor,
}) => {
  const catDragItem = useRef(null);
  const [catDragOver, setCatDragOver] = useState(null);

  const addCategory = (name, color) => {
    setCats(prev => [...prev, name]);
    setCatColors(prev => ({ ...prev, [name]: color }));
  };

  const dupCategory = (name) => {
    const newName = name + " (copy)";
    setCats(prev => [...prev, newName]);
    setCatColors(prev => ({ ...prev, [newName]: prev[name] || defaultColor }));
  };

  const moveCatUp = (idx) => {
    if (idx === 0) return;
    setCats(prev => {
      const n = [...prev];
      [n[idx], n[idx - 1]] = [n[idx - 1], n[idx]];
      return n;
    });
  };

  const moveCatDown = (idx) => {
    setCats(prev => {
      if (idx >= prev.length - 1) return prev;
      const n = [...prev];
      [n[idx], n[idx + 1]] = [n[idx + 1], n[idx]];
      return n;
    });
  };

  const changeCatColor = (name, color) =>
    setCatColors(prev => ({ ...prev, [name]: color }));

  const renameCategory = (oldName, newName) => {
    if (!newName.trim() || newName === oldName) return;

    setCats(prev => prev.map(c => c === oldName ? newName : c));
    setCatColors(prev => {
      const next = { ...prev };
      if (next[oldName] !== undefined) {
        next[newName] = next[oldName];
        delete next[oldName];
      }
      return next;
    });
    setMoves(prev => prev.map(m => m.category === oldName ? { ...m, category: newName } : m));
  };

  const handleCatDragStart = (idx) => {
    catDragItem.current = idx;
  };

  const handleCatDragOver = (e, idx) => {
    e.preventDefault();
    setCatDragOver(idx);
  };

  const handleCatDrop = (targetIdx) => {
    const from = catDragItem.current;
    setCatDragOver(null);
    if (from === null || from === targetIdx) return;
    catDragItem.current = null;
    setCats(prev => {
      // Recompute sort on latest cats to avoid stale closure
      const sorted = categorySort === "name"
        ? [...prev].sort((a, b) => a.localeCompare(b))
        : prev; // manual or progress — use current order
      const next = [...sorted];
      const [moved] = next.splice(from, 1);
      const insertAt = from < targetIdx ? targetIdx - 1 : targetIdx;
      next.splice(insertAt, 0, moved);
      return next;
    });
  };

  return {
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
  };
};
