import React from 'react';
import { useSettings } from '../../hooks/useSettings';
import { CatTile } from './CatTile';

export const CategoryGrid = ({
  sortedCats,
  view,
  reorderMode,
  inCat,
  masteredCount,
  catColors,
  showMastery,
  showMoveCount,
  setOpenCat,
  setCats,
  renameCategory,
  dupCategory,
  changeCatColor,
  moveCatUp,
  moveCatDown,
}) => {
  const { C } = useSettings();

  const reorderButtonStyle = (disabled) => ({
    width: 26, height: 26, borderRadius: 6,
    border: `1px solid ${C.border}`, background: C.bg,
    cursor: disabled ? "default" : "pointer",
    color: disabled ? C.border : C.accent,
    fontSize: 14, fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center",
  });

  return (
    <div
      style={view === "tiles"
        ? { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, alignItems: "stretch" }
        : { display: "flex", flexDirection: "column", gap: 6 }}
    >
      {sortedCats.map((cat, idx) => (
        <div
          key={cat}
          style={{ display: "flex", flexDirection: "column", position: "relative" }}
        >
          {reorderMode && (
            <div style={{
              position: "absolute", right: 6, top: "50%",
              transform: "translateY(-50%)", zIndex: 10,
              display: "flex", flexDirection: "column", gap: 2,
            }}>
              <button
                onClick={() => moveCatUp(idx)}
                disabled={idx === 0}
                style={reorderButtonStyle(idx === 0)}
              >▲</button>
              <button
                onClick={() => moveCatDown(idx)}
                disabled={idx === sortedCats.length - 1}
                style={reorderButtonStyle(idx === sortedCats.length - 1)}
              >▼</button>
            </div>
          )}

          <div style={{ marginBottom: view !== "tiles" ? 6 : 0, flex: 1 }}>
            <CatTile
              name={cat}
              color={catColors[cat] || C.accent}
              total={inCat(cat).length}
              mastered={masteredCount(cat)}
              moves={inCat(cat)}
              viewMode={view}
              showMastery={showMastery}
              showMoveCount={showMoveCount}
              onClick={() => { if (!reorderMode) setOpenCat(cat); }}
              onDelete={() => setCats(prev => prev.filter(c => c !== cat))}
              onRename={n => renameCategory(cat, n)}
              onDuplicate={() => dupCategory(cat)}
              onChangeColor={col => changeCatColor(cat, col)}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
