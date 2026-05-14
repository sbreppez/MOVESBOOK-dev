/**
 * Helpers for reading a move's trainingLog — the canonical per-move record
 * of training occurrences. Each entry: { date, count, source, sourceId? }.
 *
 * "Last trained" and "trained on day X" are derived from this log, not
 * stored in a single overwritable slot.
 */

/**
 * Returns the most recent date in a move's trainingLog (YYYY-MM-DD),
 * or null if the move has never been trained.
 */
export function lastTrainedDate(move) {
  const log = move?.trainingLog;
  if (!log || log.length === 0) return null;
  let latest = null;
  for (const entry of log) {
    // trainingLog dates are YYYY-MM-DD strings — lexicographic max is chronological.
    if (entry?.date && (latest === null || entry.date > latest)) {
      latest = entry.date;
    }
  }
  return latest;
}

/**
 * Returns true if a move's trainingLog contains an entry for the given
 * date (YYYY-MM-DD).
 */
export function wasTrainedOn(move, dateStr) {
  const log = move?.trainingLog;
  if (!log || !dateStr) return false;
  return log.some(entry => entry?.date === dateStr);
}

/**
 * Appends one training entry to a move's log. Returns a new moves array.
 * For plain-append sources (Rep Counter, Sparring, GAP quick-mark).
 */
export function appendTrainingEntry(moves, moveId, entry) {
  return moves.map(m =>
    m.id === moveId
      ? { ...m, trainingLog: [...(m.trainingLog || []), entry] }
      : m
  );
}

/**
 * Upserts training entries keyed by a calendar event id. Returns a new
 * moves array. Every move in moveIds gets (or has replaced) its entry for
 * this event; any move previously tagged by this event but no longer in
 * moveIds has its entry dropped. Handles save, edit, and un-tag in one pass.
 * For calendar-event sources (Log Today, SessionJournal).
 */
export function setEventTraining(moves, { eventId, moveIds, date, source, count }) {
  const tagged = new Set(moveIds);
  return moves.map(m => {
    const log = m.trainingLog || [];
    const hadEntry = log.some(e => e.sourceId === eventId);
    const isTagged = tagged.has(m.id);
    if (!hadEntry && !isTagged) return m;
    const rest = log.filter(e => e.sourceId !== eventId);
    return {
      ...m,
      trainingLog: isTagged
        ? [...rest, { sourceId: eventId, date, source, count }]
        : rest,
    };
  });
}

/**
 * Removes every training entry tied to a calendar event id. Returns a new
 * moves array. Used when a calendar event is deleted.
 */
export function removeEventTraining(moves, eventId) {
  return moves.map(m => {
    const log = m.trainingLog || [];
    if (!log.some(e => e.sourceId === eventId)) return m;
    return { ...m, trainingLog: log.filter(e => e.sourceId !== eventId) };
  });
}

/**
 * Removes a move's training entries matching the given date + source.
 * Returns a new moves array. Used to reverse a GAP quick-mark.
 */
export function removeTrainingEntries(moves, moveId, { date, source }) {
  return moves.map(m => {
    if (m.id !== moveId) return m;
    const log = m.trainingLog || [];
    const filtered = log.filter(e => !(e.date === date && e.source === source));
    return filtered.length === log.length ? m : { ...m, trainingLog: filtered };
  });
}
