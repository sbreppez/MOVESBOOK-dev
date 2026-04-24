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
  catDragOver,
  setCatDragOver,
  catDragItem,
  handleCatDrop,
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
      onDragOver={e => e.preventDefault()}
      onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setCatDragOver(null); }}
    >
      {sortedCats.map((cat, idx) => (
        <div
          key={cat}
          onDragOver={e => {
            e.preventDefault();
            e.stopPropagation();
            if (!reorderMode && catDragItem.current !== null) setCatDragOver(idx);
          }}
          onDragLeave={e => {
            if (!e.currentTarget.contains(e.relatedTarget)) {
              setCatDragOver(d => d === idx ? null : d);
            }
          }}
          onDrop={e => {
            e.preventDefault();
            e.stopPropagation();
            if (!reorderMode) handleCatDrop(idx);
          }}
          style={{ display: "flex", flexDirection: "column", position: "relative" }}
        >
          {catDragOver === idx
            && !reorderMode
            && catDragItem.current !== null
            && catDragItem.current !== idx
            && (
              <div style={{
                height: 2, borderRadius: 1, background: C.accent,
                margin: view === "tiles" ? "0 2px 4px" : "2px 6px 4px",
              }} />
            )}

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
              draggable={false}
              onDragStart={() => {}}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { }}
              isDraggingOver={false}
            />
          </div>
        </div>
      ))}

      {/* End-of-list sentinel — list view only, lets items drop to last spot */}
      {view !== "tiles" && sortedCats.length > 0 && (
        <div
          onDragOver={e => {
            e.preventDefault();
            e.stopPropagation();
            setCatDragOver(sortedCats.length);
          }}
          onDragLeave={e => {
            if (!e.currentTarget.contains(e.relatedTarget)) setCatDragOver(null);
          }}
          onDrop={e => {
            e.stopPropagation();
            handleCatDrop(sortedCats.length);
          }}
          style={{ minHeight: 36, display: "flex", alignItems: "flex-start", paddingTop: 2 }}
        >
          {catDragOver === sortedCats.length && (
            <div style={{
              height: 2, borderRadius: 1, background: C.accent,
              flex: 1, margin: "0 6px",
            }} />
          )}
        </div>
      )}
    </div>
  );
};
