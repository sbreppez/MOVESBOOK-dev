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
