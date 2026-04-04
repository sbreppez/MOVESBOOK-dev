import React, { useState, useMemo } from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { masteryColor } from '../../constants/styles';
import { Ic } from '../shared/Ic';
import { useT } from '../../hooks/useTranslation';

const OriginBadge = ({ origin }) => {
  if (!origin) return null;
  const map = { learned: { label: "L", bg: C.textMuted }, version: { label: "V", bg: C.blue }, creation: { label: "C", bg: C.green } };
  const cfg = map[origin];
  if (!cfg) return null;
  return (
    <span style={{ fontSize: 9, fontWeight: 700, fontFamily: FONT_DISPLAY, borderRadius: 6,
      padding: "1px 6px", background: cfg.bg, color: "#fff", letterSpacing: 0.5, flexShrink: 0 }}>
      {cfg.label}
    </span>
  );
};

const TreeNode = ({ node, depth, catColors, onEdit, collapsed, toggleCollapse, isLast }) => {
  const hasChildren = node.children && node.children.length > 0;
  const isCollapsed = collapsed.has(node.move.id);
  const catCol = catColors[node.move.category] || C.accent;
  const m = node.move;
  const isRoot = depth === 0;

  return (
    <div style={{ position: "relative" }}>
      {/* Connecting lines for children */}
      {depth > 0 && (
        <div style={{ position: "absolute", left: -16, top: 0, bottom: isLast ? "50%" : 0, width: 1, background: C.borderLight }} />
      )}
      {depth > 0 && (
        <div style={{ position: "absolute", left: -16, top: "50%", width: 16, height: 1, background: C.borderLight }} />
      )}

      {/* Node card */}
      <div onClick={() => onEdit(m)}
        style={{ display: "flex", alignItems: "center", gap: 8, background: C.surface,
          borderTop: `1px solid ${C.borderLight}`, borderRight: `1px solid ${C.borderLight}`,
          borderBottom: `1px solid ${C.borderLight}`, borderLeft: `4px solid ${catCol}`,
          borderRadius: 10, padding: "10px 14px", cursor: "pointer", marginBottom: 6 }}>
        {hasChildren && (
          <button onClick={e => { e.stopPropagation(); toggleCollapse(m.id); }}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 8, margin: -6, display: "flex", flexShrink: 0, minWidth: 28, minHeight: 28, alignItems: "center", justifyContent: "center" }}>
            <Ic n={isCollapsed ? "chevR" : "chevD"} s={13} c={catCol} />
          </button>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: isRoot ? 14 : 13, color: C.text, fontFamily: FONT_DISPLAY,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {m.name}
          </div>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: masteryColor(m.mastery || 0), flexShrink: 0 }}>
          {m.mastery || 0}%
        </span>
        <Ic n="edit" s={14} c={C.textMuted} />
      </div>

      {/* Children */}
      {hasChildren && !isCollapsed && (
        <div style={{ marginLeft: 24, position: "relative" }}>
          {node.children.map((child, idx) => (
            <TreeNode key={child.move.id} node={child} depth={depth + 1}
              catColors={catColors} onEdit={onEdit} collapsed={collapsed}
              toggleCollapse={toggleCollapse} isLast={idx === node.children.length - 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const MoveTree = ({ moves, catColors, onEdit, settings = {} }) => {
  const t = useT();
  const [collapsed, setCollapsed] = useState(new Set());

  const toggleCollapse = (id) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const { trees, standalone, stats } = useMemo(() => {
    const moveMap = {};
    const childrenMap = {};
    moves.forEach(m => { moveMap[m.id] = m; });

    // Build children map — only if parent exists
    moves.forEach(m => {
      if (m.parentId && moveMap[m.parentId]) {
        if (!childrenMap[m.parentId]) childrenMap[m.parentId] = [];
        childrenMap[m.parentId].push(m);
      }
    });

    // Find which moves are children of something
    const isChild = new Set();
    moves.forEach(m => {
      if (m.parentId && moveMap[m.parentId]) isChild.add(m.id);
    });

    // Build subtree recursively
    const buildSubtree = (id, depth, visited) => {
      if (visited.has(id) || depth > 6) return { move: moveMap[id], children: [] };
      visited.add(id);
      const children = (childrenMap[id] || []).map(child =>
        buildSubtree(child.id, depth + 1, visited)
      );
      return { move: moveMap[id], children };
    };

    // Compute max depth
    const getMaxDepth = (node, d) => {
      if (!node.children.length) return d;
      return Math.max(...node.children.map(c => getMaxDepth(c, d + 1)));
    };

    // Roots = not a child + has children
    const roots = moves.filter(m => !isChild.has(m.id) && childrenMap[m.id]);
    const trees = roots.map(r => buildSubtree(r.id, 0, new Set()));

    // Standalone = not a child + no children
    const standaloneList = moves.filter(m => !isChild.has(m.id) && !childrenMap[m.id]);

    // Count variations (all moves that ARE children)
    const variationCount = isChild.size;
    const maxDepth = trees.length > 0 ? Math.max(...trees.map(t => getMaxDepth(t, 1))) : 0;

    return {
      trees,
      standalone: standaloneList,
      stats: { roots: roots.length, variations: variationCount, standalone: standaloneList.length, maxDepth }
    };
  }, [moves]);

  return (
    <div>
      {/* Stats banner */}
      {moves.length > 0 && (
        <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 12, color: C.textMuted,
          marginBottom: 12, letterSpacing: 0.5 }}>
          {stats.roots} {t("roots")} · {stats.variations} {t("variations")} · {stats.standalone} {t("standalone").toLowerCase()} · {t("deepest")}: {stats.maxDepth} {t("levels")}
        </div>
      )}

      {/* CONNECTED section */}
      {trees.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 11, color: C.textMuted,
            letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>
            {t("connected")}
          </div>
          {trees.map(tree => (
            <TreeNode key={tree.move.id} node={tree} depth={0} catColors={catColors}
              onEdit={onEdit} collapsed={collapsed} toggleCollapse={toggleCollapse} isLast />
          ))}
        </div>
      )}

      {/* STANDALONE section */}
      <div>
        <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 11, color: C.textMuted,
          letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>
          {t("standalone")} — {standalone.length} {t("moves").toLowerCase()}
        </div>
        {trees.length === 0 && standalone.length > 0 && (
          <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 12, lineHeight: 1.5, fontStyle: "italic" }}>
            {t("noConnectionsYet")}
          </div>
        )}
        {standalone.map(m => {
          const catCol = catColors[m.category] || C.accent;
          return (
            <div key={m.id} onClick={() => onEdit(m)}
              style={{ display: "flex", alignItems: "center", gap: 8, background: C.surface,
                borderTop: `1px solid ${C.borderLight}`, borderRight: `1px solid ${C.borderLight}`,
                borderBottom: `1px solid ${C.borderLight}`, borderLeft: `4px solid ${catCol}`,
                borderRadius: 10, padding: "10px 14px", cursor: "pointer", marginBottom: 6 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: C.text, fontFamily: FONT_DISPLAY,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {m.name}
                </div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: masteryColor(m.mastery || 0), flexShrink: 0 }}>
                {m.mastery || 0}%
              </span>
              <Ic n="edit" s={14} c={C.textMuted} />
            </div>
          );
        })}
        {moves.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: C.textMuted }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🌳</div>
            <p style={{ fontSize: 13 }}>No moves yet</p>
          </div>
        )}
      </div>
    </div>
  );
};
