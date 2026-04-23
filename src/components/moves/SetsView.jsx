import React, { useState, useEffect } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { useT, usePlural } from '../../hooks/useTranslation';
import { FONT_DISPLAY } from '../../constants/fonts';
import { PRESET_COLORS } from '../../constants/colors';
import { masteryColor } from '../../constants/styles';
import { todayLocal } from '../../utils/dateUtils';
import { SectionBrief } from '../shared/SectionBrief';
import { Ic } from '../shared/Ic';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { SetDetailModal } from './SetDetailModal';

export const SetsView = ({
  sets,
  setSets,
  moves,
  addingSet,
  setAddingSet,
  reorderMode,
  setReorderMode,
  showMastery,
  showSectionDescriptions,
  defaultView,
  onOpenFlashCards,
}) => {
  const { C } = useSettings();
  const t = useT();
  const { moveCountStr } = usePlural();

  const initialSetsView = defaultView === "tree" ? "list" : (defaultView || "list");
  const [setsView, setSetsView] = useState(initialSetsView);
  useEffect(() => { setSetsView(defaultView === "tree" ? "list" : (defaultView || "list")); }, [defaultView]);
  const [expSets, setExpSets] = useState({});
  const [editSetModal, setEditSetModal] = useState(null);
  const [confirmDeleteSet, setConfirmDeleteSet] = useState(null);

  const moveSetUp = (idx) => {
    if (idx === 0) return;
    setSets(prev => {
      const n = [...prev];
      [n[idx], n[idx - 1]] = [n[idx - 1], n[idx]];
      return n;
    });
  };

  const moveSetDown = (idx) => {
    setSets(prev => {
      if (idx >= prev.length - 1) return prev;
      const n = [...prev];
      [n[idx], n[idx + 1]] = [n[idx + 1], n[idx]];
      return n;
    });
  };

  return (
    <div>
      <SectionBrief
        desc={t("setsBrief")}
        stat={t("setsCount").replace("{count}", sets.length)}
        settings={{ showSectionDescriptions }}
      />

      {sets.filter(s => (s.moveIds?.length || 0) >= 2).length >= 1 && onOpenFlashCards && (
        <div style={{ padding: "8px 0 0", flexShrink: 0 }}>
          <button
            onClick={onOpenFlashCards}
            style={{
              width: "100%", padding: 14, borderRadius: 12,
              border: `1px solid ${C.accent}`, background: "transparent",
              color: C.accent, cursor: "pointer",
              fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 13,
              letterSpacing: 1, textTransform: "uppercase",
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 8, minHeight: 44,
            }}
          >
            {t("flashCards")}
          </button>
        </div>
      )}

      <div style={{
        display: "flex", justifyContent: "flex-end", alignItems: "center",
        gap: 8, padding: "5px 16px 3px",
      }}>
        <button
          onClick={() => setSetsView(v => v === "list" ? "tiles" : "list")}
          style={{
            background: "none", border: "none", cursor: "pointer",
            padding: 4, color: C.textMuted,
          }}
        >
          <Ic n={setsView === "list" ? "grid" : "list"} s={16} />
        </button>
        <button
          onClick={() => setReorderMode(r => !r)}
          style={{
            background: "none", border: "none", cursor: "pointer", padding: 4,
            color: reorderMode ? C.accent : C.textMuted,
            fontSize: 13, fontWeight: 800, fontFamily: FONT_DISPLAY, letterSpacing: 1,
          }}
        >
          {reorderMode ? t("done") : "⇅"}
        </button>
      </div>

      {sets.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: C.textMuted }}>
          <div style={{ marginBottom: 8 }}><Ic n="cards" s={28} c={C.textMuted} /></div>
          <p style={{ fontSize: 13 }}>{t("emptyHintSets")}</p>
        </div>
      )}

      {/* ── Tiles view ── */}
      {setsView === "tiles" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {sets.map(s => {
            const sColor = s.color || C.blue;
            return (
              <div
                key={s.id}
                onClick={() => setEditSetModal(s)}
                style={{
                  borderRadius: 8, overflow: "hidden", background: C.surface,
                  cursor: "pointer", position: "relative",
                  borderLeft: `4px solid ${sColor}`,
                }}
              >
                <div style={{ padding: "14px 16px 13px 16px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 4 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: sColor, flexShrink: 0, marginTop: 3,
                    }} />
                    <div style={{
                      fontWeight: 700, fontSize: 16, color: C.brown,
                      fontFamily: FONT_DISPLAY, flex: 1, lineHeight: 1.3,
                      overflow: "hidden", textOverflow: "ellipsis",
                      whiteSpace: "nowrap", minWidth: 0,
                    }}>{s.name}</div>
                    <button
                      onClick={e => { e.stopPropagation(); setConfirmDeleteSet(s); }}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        padding: 2, flexShrink: 0, display: "flex",
                        marginTop: -2, marginRight: -4,
                      }}
                    >
                      <Ic n="x" s={12} c={C.textMuted} />
                    </button>
                  </div>
                  {s.details && (
                    <div style={{
                      fontSize: 10, color: C.textSec, paddingLeft: 14,
                      marginBottom: 4, lineHeight: 1.4,
                      overflow: "hidden", textOverflow: "ellipsis",
                      display: "-webkit-box", WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}>{s.details}</div>
                  )}
                  <div style={{ fontSize: 10, color: C.textMuted, paddingLeft: 14 }}>
                    {moveCountStr((s.moveIds || []).length)}
                  </div>
                  {showMastery && (
                    <div style={{ paddingLeft: 14, marginTop: 4 }}>
                      <div style={{ height: 2, borderRadius: 1, background: C.border, overflow: "hidden" }}>
                        <div style={{
                          height: "100%",
                          width: `${s.mastery || 0}%`,
                          background: masteryColor(s.mastery || 0),
                        }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── List view with reorder ── */
        <div>
          {sets.map((s, idx) => {
            const sColor = s.color || C.blue;
            const isExp = expSets[s.id] !== false;
            return (
              <div
                key={s.id}
                style={{
                  position: "relative", marginBottom: 6, borderRadius: 8,
                  overflow: "hidden", background: C.surface,
                  borderLeft: `4px solid ${sColor}`,
                }}
              >
                <div style={{
                  display: "flex", alignItems: "center",
                  padding: "14px 16px 13px 16px", gap: 6,
                }}>
                  <button
                    onClick={() => setExpSets(p => ({ ...p, [s.id]: !isExp }))}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      padding: 0, display: "flex", flexShrink: 0,
                    }}
                  >
                    <Ic n={isExp ? "chevD" : "chevR"} s={14} c={sColor} />
                  </button>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: sColor, flexShrink: 0,
                  }} />
                  <div
                    style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
                    onClick={() => { if (!reorderMode) setEditSetModal(s); }}
                  >
                    <div style={{
                      fontWeight: 700, fontSize: 16, color: C.brown,
                      fontFamily: FONT_DISPLAY, letterSpacing: 0.5,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>{s.name}</div>
                    <div style={{
                      fontSize: 11, color: C.textMuted, marginTop: 1,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {moveCountStr((s.moveIds || []).length)}
                      {s.details ? ` · ${s.details}` : s.notes ? ` · ${s.notes}` : ""}
                    </div>
                  </div>
                  {showMastery && (
                    <div style={{
                      display: "flex", flexDirection: "column",
                      alignItems: "flex-end", gap: 2, flexShrink: 0,
                    }}>
                      <span style={{
                        fontSize: 10, color: masteryColor(s.mastery || 0), fontWeight: 700,
                      }}>{s.mastery || 0}%</span>
                      <div style={{
                        width: 36, height: 2, borderRadius: 1,
                        background: C.border, overflow: "hidden",
                      }}>
                        <div style={{
                          height: "100%",
                          width: `${s.mastery || 0}%`,
                          background: masteryColor(s.mastery || 0),
                        }} />
                      </div>
                    </div>
                  )}
                  {!reorderMode && (
                    <button
                      onClick={e => { e.stopPropagation(); setConfirmDeleteSet(s); }}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        padding: 3, flexShrink: 0,
                      }}
                    >
                      <Ic n="x" s={13} c={C.accent} />
                    </button>
                  )}
                  {reorderMode && (
                    <div style={{
                      display: "flex", flexDirection: "column", gap: 2, flexShrink: 0,
                    }}>
                      <button
                        onClick={() => moveSetUp(idx)}
                        disabled={idx === 0}
                        style={{
                          width: 26, height: 26, borderRadius: 6,
                          border: `1px solid ${C.border}`, background: C.bg,
                          cursor: idx === 0 ? "default" : "pointer",
                          color: idx === 0 ? C.border : C.accent,
                          fontSize: 14, fontWeight: 700,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >▲</button>
                      <button
                        onClick={() => moveSetDown(idx)}
                        disabled={idx === sets.length - 1}
                        style={{
                          width: 26, height: 26, borderRadius: 6,
                          border: `1px solid ${C.border}`, background: C.bg,
                          cursor: idx === sets.length - 1 ? "default" : "pointer",
                          color: idx === sets.length - 1 ? C.border : C.accent,
                          fontSize: 14, fontWeight: 700,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >▼</button>
                    </div>
                  )}
                </div>
                {isExp && (
                  <div style={{
                    borderTop: `1px solid ${C.borderLight}`,
                    padding: "8px 12px 10px 36px",
                  }}>
                    {s.details && (
                      <div style={{
                        fontSize: 11, color: C.textSec, lineHeight: 1.5,
                        marginBottom: 8, fontStyle: "italic",
                      }}>{s.details}</div>
                    )}
                    {(s.moveIds || []).length > 0 ? (s.moveIds || []).map(mid => {
                      const m = moves.find(mv => mv.id === mid);
                      if (!m) return null;
                      return (
                        <div key={mid} style={{
                          display: "flex", alignItems: "center", gap: 6, paddingTop: 3,
                        }}>
                          <div style={{
                            width: 5, height: 5, borderRadius: "50%",
                            background: masteryColor(m.mastery || 0), flexShrink: 0,
                          }} />
                          <span style={{ fontSize: 11, color: C.textMuted }}>{m.name}</span>
                          <span style={{
                            fontSize: 10, color: masteryColor(m.mastery || 0),
                            fontWeight: 700, marginLeft: "auto",
                          }}>{m.mastery || 0}%</span>
                        </div>
                      );
                    }) : (
                      <div style={{ fontSize: 11, color: C.textMuted, fontStyle: "italic" }}>
                        {t("emptySetHint")}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {addingSet && (
        <SetDetailModal
          type="set"
          item={{
            name: "",
            color: PRESET_COLORS[1],
            moveIds: [],
            notes: "",
            mastery: 0,
            date: todayLocal(),
          }}
          onClose={() => setAddingSet(false)}
          allMoves={moves}
          allSets={sets}
          onSave={fields => {
            setSets(p => [...p, { id: Date.now(), ...fields }]);
            setAddingSet(false);
          }}
        />
      )}

      {editSetModal && (
        <SetDetailModal
          type="set"
          item={editSetModal}
          onClose={() => setEditSetModal(null)}
          allMoves={moves}
          allSets={sets}
          onSave={fields =>
            setSets(p => p.map(s => s.id === editSetModal.id ? { ...s, ...fields } : s))
          }
        />
      )}

      {confirmDeleteSet && (
        <ConfirmDialog
          title={t("deleteSet")}
          body={
            <>
              &quot;<span style={{ color: C.text, fontWeight: 700 }}>{confirmDeleteSet.name}</span>&quot;{" "}
              {t("deleteSetBody")}
            </>
          }
          onCancel={() => setConfirmDeleteSet(null)}
          onConfirm={() => {
            setSets(p => p.filter(x => x.id !== confirmDeleteSet.id));
            setConfirmDeleteSet(null);
          }}
        />
      )}
    </div>
  );
};
