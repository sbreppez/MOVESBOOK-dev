import React from 'react';
import { useSettings } from '../../hooks/useSettings';
import { useT } from '../../hooks/useTranslation';
import { DropdownPill } from '../shared/DropdownPill';
import { Ic } from '../shared/Ic';
import { MoveTile } from './MoveTile';

export const AllMovesView = ({
  allMovesFilters,
  setAllMovesFilters,
  allMovesFiltered,
  cats,
  catColors,
  search,
  selectMode,
  selectedMoveIds,
  onToggleSelect,
  onEditMove,
  onDeleteMove,
  onDuplicateMove,
  onMoveToCat,
  onToggleTrainedToday,
}) => {
  const { C } = useSettings();
  const t = useT();

  const tensionOptions = [
    { key: "flow",  label: t("tensionFlow") },
    { key: "build", label: t("tensionBuild") },
    { key: "hit",   label: t("tensionHit") },
    { key: "peak",  label: t("tensionPeak") },
  ];

  const originOptions = [
    { key: "learned",  label: t("learned") },
    { key: "version",  label: t("myVersion") },
    { key: "creation", label: t("myCreation") },
  ];

  return (
    <>
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 8, padding: "6px 16px",
        borderBottom: `1px solid ${C.borderLight}`,
      }}>
        <DropdownPill
          label={t("categories")}
          value={allMovesFilters.category}
          options={cats.map(c => ({ key: c, label: c, color: catColors[c] || C.accent }))}
          onChange={v => setAllMovesFilters(p => ({ ...p, category: v }))}
          defaultLabel={t("allCategories")}
        />
        <DropdownPill
          label={t("tensionRole")}
          value={allMovesFilters.tensionRole}
          options={tensionOptions}
          onChange={v => setAllMovesFilters(p => ({ ...p, tensionRole: v }))}
          defaultLabel={t("allRoles")}
        />
        <DropdownPill
          label={t("origin")}
          value={allMovesFilters.origin}
          options={originOptions}
          onChange={v => setAllMovesFilters(p => ({ ...p, origin: v }))}
          defaultLabel={t("allOrigins")}
        />
      </div>

      {allMovesFiltered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 30, color: C.textMuted }}>
          <div style={{ marginBottom: 8 }}><Ic n="filter" s={28} c={C.textMuted} /></div>
          <p style={{ fontSize: 13 }}>{t("noMovesMatchFilter")}</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {allMovesFiltered.map(m => (
            <MoveTile
              key={m.id}
              move={m}
              searchQuery={search}
              onClick={() => selectMode ? onToggleSelect(m.id) : onEditMove(m)}
              onEdit={() => onEditMove(m)}
              onDelete={() => onDeleteMove(m)}
              onDuplicate={() => onDuplicateMove(m)}
              onMove={cat => onMoveToCat(m.id, cat)}
              allCats={cats}
              catColors={catColors}
              onToggleTrainedToday={onToggleTrainedToday}
              selectMode={selectMode}
              isSelected={selectedMoveIds.has(m.id)}
            />
          ))}
        </div>
      )}
    </>
  );
};
