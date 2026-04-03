/**
 * Custom Attributes — filter logic + migration from old rotation/travelling fields
 */

/**
 * Filter moves by attribute values.
 * Logic: AND across attributes, OR within an attribute.
 * @param {Array} moves
 * @param {Object} filterState - { ca_id: "value" | ["v1","v2"], ... }
 * @param {Array} customAttrs - attribute definitions
 * @returns {Array} filtered moves
 */
export function filterMovesByAttrs(moves, filterState, customAttrs) {
  const activeKeys = Object.keys(filterState).filter(k => {
    const v = filterState[k];
    if (Array.isArray(v)) return v.length > 0;
    return v !== "" && v !== null && v !== undefined;
  });
  if (activeKeys.length === 0) return moves;

  return moves.filter(move => {
    const attrs = move.attrs || {};
    return activeKeys.every(key => {
      const filterVal = filterState[key];
      const moveVal = attrs[key];

      // Find the attribute definition to know if it's multi-select
      const def = customAttrs.find(a => a.id === key);
      if (!def) return true; // unknown attribute, don't filter

      if (Array.isArray(filterVal)) {
        // Filter has multiple values selected — OR logic
        if (def.multi && Array.isArray(moveVal)) {
          return filterVal.some(fv => moveVal.includes(fv));
        }
        return filterVal.includes(moveVal);
      } else {
        // Filter has single value
        if (def.multi && Array.isArray(moveVal)) {
          return moveVal.includes(filterVal);
        }
        return moveVal === filterVal;
      }
    });
  });
}

/**
 * Migrate old boolean rotation/travelling fields to custom attributes.
 * Creates attribute definitions and maps move values.
 * @param {Array} moves
 * @param {Array} existingAttrs
 * @returns {{ moves: Array, customAttrs: Array }}
 */
export function migrateOldAttributes(moves, existingAttrs) {
  const now = Date.now();
  const newAttrs = [...existingAttrs];
  const hasRotation = moves.some(m => m.rotation === true);
  const hasTravelling = moves.some(m => m.travelling === true);

  let rotId = null;
  let travId = null;

  if (hasRotation && !existingAttrs.find(a => a.name === "Rotation")) {
    rotId = "ca_mig_rotation";
    newAttrs.push({
      id: rotId,
      name: "Rotation",
      multi: false,
      values: ["Clockwise", "Counterclockwise"],
      order: now,
    });
  }

  if (hasTravelling && !existingAttrs.find(a => a.name === "Travelling")) {
    travId = "ca_mig_travelling";
    newAttrs.push({
      id: travId,
      name: "Travelling",
      multi: false,
      values: ["Forward", "Backwards", "Sideways", "Going Around"],
      order: now + 1,
    });
  }

  if (!rotId && !travId) return { moves, customAttrs: existingAttrs };

  const migratedMoves = moves.map(m => {
    const attrs = { ...(m.attrs || {}) };
    if (rotId && m.rotation === true) {
      attrs[rotId] = "Clockwise"; // best-guess default for boolean true
    }
    if (travId && m.travelling === true) {
      attrs[travId] = "Forward"; // best-guess default for boolean true
    }
    return { ...m, attrs };
  });

  return { moves: migratedMoves, customAttrs: newAttrs };
}
