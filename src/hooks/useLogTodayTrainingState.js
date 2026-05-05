import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLogTodayTraining } from './useLogTodayTraining';

/**
 * Owns the Training sub-tab working state for soft-remove.
 *
 * Working state [pending exclusions the user has toggled but not saved yet]
 * lives in component state. On mount and on date change, it initializes from
 * the persisted log_exclusions slice for the current date. Toggle mutates
 * working state only; commit writes working state to the persisted slice via
 * onLogExclusionsChange; reset discards working state.
 *
 * D1 receives the unmodified dataSlices and filters only on persisted
 * exclusions. Working state surfaces via isPending() so the rendering layer
 * can dim pending tiles in-place (tile stays visible until the user commits).
 *
 * @param {object} args
 * @param {string|null} args.date - YYYY-MM-DD day key
 * @param {object} args.dataSlices - { moves, reps, sparring, musicflow,
 *                                     habits, ideas, calendar, log_exclusions }
 * @param {function|null} args.onLogExclusionsChange - setter that persists
 *   the entire log_exclusions object (setState-style: accepts (prev) => next).
 *   Called on commit only. May be null in dev/test contexts; commit becomes
 *   a no-op.
 */
export function useLogTodayTrainingState({ date, dataSlices, onLogExclusionsChange }) {
  const persistedForDate = useMemo(
    () => (date ? dataSlices?.log_exclusions?.[date] || [] : []),
    [date, dataSlices?.log_exclusions]
  );

  // Working state — array of { source, sourceId }, initialized from persisted.
  const [workingExclusions, setWorkingExclusions] = useState(persistedForDate);

  // Reset working state when the date changes. Intentionally depends only on
  // [date] — depending on persistedForDate would discard the user's in-flight
  // pending changes whenever any other date's exclusions mutated externally.
  useEffect(() => {
    setWorkingExclusions(persistedForDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const buckets = useLogTodayTraining(date, dataSlices);

  const isPending = useCallback(
    (source, sourceId) =>
      workingExclusions.some(e => e.source === source && e.sourceId === sourceId),
    [workingExclusions]
  );

  const toggleExclusion = useCallback((source, sourceId) => {
    setWorkingExclusions(prev => {
      const exists = prev.some(e => e.source === source && e.sourceId === sourceId);
      if (exists) {
        return prev.filter(e => !(e.source === source && e.sourceId === sourceId));
      }
      return [...prev, { source, sourceId }];
    });
  }, []);

  const hasUnsavedChanges = useMemo(() => {
    if (workingExclusions.length !== persistedForDate.length) return true;
    return JSON.stringify(workingExclusions) !== JSON.stringify(persistedForDate);
  }, [workingExclusions, persistedForDate]);

  const commit = useCallback(() => {
    if (!date || !onLogExclusionsChange) return;
    onLogExclusionsChange(prev => {
      const next = { ...(prev || {}) };
      if (workingExclusions.length === 0) {
        delete next[date];
      } else {
        next[date] = workingExclusions;
      }
      return next;
    });
  }, [date, workingExclusions, onLogExclusionsChange]);

  const reset = useCallback(() => {
    setWorkingExclusions(persistedForDate);
  }, [persistedForDate]);

  return {
    buckets,
    isPending,
    toggleExclusion,
    hasUnsavedChanges,
    commit,
    reset,
  };
}
