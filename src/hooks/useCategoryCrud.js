export const useCategoryCrud = ({
  cats: _cats,
  setCats,
  catColors: _catColors,
  setCatColors,
  setMoves,
  categorySort: _categorySort,
  defaultColor,
}) => {
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

  return {
    addCategory,
    dupCategory,
    moveCatUp,
    moveCatDown,
    changeCatColor,
    renameCategory,
  };
};
