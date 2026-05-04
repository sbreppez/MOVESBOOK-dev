import { useMemo } from 'react';
import { useDayData } from './useDayData';

// Source strings emitted by the 6 auto-capture sources that produce
// calendar events. Manual SessionJournal events have type === "training"
// but a missing or non-matching source — they bypass this list and
// surface in the manualSessions bucket (tier 8).
const DEDUP_SOURCE_BLOCKLIST = [
  'rep_counter',
  'sparring',
  'spar-1v1',
  'combo_machine',
  'flashcards',
  'musicflow',
];

/**
 * Projection layer for the Log Today Training sub-tab.
 *
 * Consumes useDayData(date, dataSlices) and produces 8 deduplicated,
 * exclusion-aware buckets. Each bucket holds raw records — D2's tile
 * renderers read native fields per source.
 *
 * Implements:
 *   - Addendum §2.1: 7-tier dedup priority (auth records over derived)
 *   - Addendum §4.3: mb_log_exclusions filter (per-day soft-remove)
 *
 * Does NOT consume mb_sets. The B-Supplement added inline moveIds to
 * the FlashCards calendar event, matching Combine's pattern, so all
 * dedup-against arrays are inline on the records D1 already sees.
 *
 * @param {string|null} date - YYYY-MM-DD day key
 * @param {object} dataSlices - { moves, reps, sparring, musicflow,
 *                               habits, ideas, calendar, log_exclusions }
 * @returns {object|null} 8-bucket shape, or null if date is falsy
 */
export function useLogTodayTraining(date, dataSlices) {
  const dayData = useDayData(date, dataSlices);
  const log_exclusions = dataSlices?.log_exclusions;

  return useMemo(() => {
    if (!date || !dayData) return null;

    const excludedForDay = log_exclusions?.[date] || [];
    const isExcluded = (source, id) =>
      excludedForDay.some(e => e.source === source && e.sourceId === id);

    // ── Tiers 1–3, 6: raw session records, exclusion-filtered ──
    const drillSessions = dayData.repSessions
      .filter(s => !isExcluded('rep_counter', s.id));

    const sparSoloSessions = dayData.sparringSessions
      .filter(s => !isExcluded('sparring', s.id));

    const sparOneVoneSessions = dayData.sparringSessions1v1
      .filter(s => !isExcluded('spar-1v1', s.id));

    const flowSessions = dayData.musicflowSessions
      .filter(s => !isExcluded('musicflow', s.id));

    // ── Tiers 4, 5: calendar events, source-filtered, exclusion-filtered ──
    const savedCombos = dayData.calendarEvents
      .filter(e => e.source === 'combo_machine')
      .filter(e => !isExcluded('combo_machine', e.id));

    const setsPracticed = dayData.calendarEvents
      .filter(e => e.source === 'flashcards')
      .filter(e => !isExcluded('flashcards', e.id));

    // ── Tier 7: movesTrained, dedup-filtered against tiers 1, 2, 4, 5 ──
    // 1v1 Spar has no movesTrained field — not in dedup-against. Flow
    // does not mutate mb_moves — not in dedup-against. Manual
    // SessionJournal events not in dedup-against per addendum §2.1
    // (intentional — SessionJournal is being deprecated in Prompt L).
    const dedupAgainstMoveIds = new Set();
    drillSessions.forEach(s => {
      if (s.moveId) dedupAgainstMoveIds.add(s.moveId);
    });
    sparSoloSessions.forEach(s => {
      (s.movesTrained || []).forEach(id => dedupAgainstMoveIds.add(id));
    });
    savedCombos.forEach(e => {
      (e.moveIds || []).forEach(id => dedupAgainstMoveIds.add(id));
    });
    setsPracticed.forEach(e => {
      // moveIds added by B-Supplement; legacy events default to [].
      (e.moveIds || []).forEach(id => dedupAgainstMoveIds.add(id));
    });

    const movesTrained = dayData.movesTrained
      .filter(m => !dedupAgainstMoveIds.has(m.id))
      .filter(m => !isExcluded('movesTrained', m.id));

    // ── Tier 8: manual SessionJournal events ──
    // type === "training" AND source missing or not in blocklist.
    // Surfaces legacy manual logs that should still appear despite
    // SessionJournal removal in Prompt L.
    const manualSessions = dayData.calendarEvents
      .filter(e =>
        e.type === 'training' &&
        !DEDUP_SOURCE_BLOCKLIST.includes(e.source)
      )
      .filter(e => !isExcluded('manual', e.id));

    return {
      drillSessions,
      sparSoloSessions,
      sparOneVoneSessions,
      savedCombos,
      setsPracticed,
      flowSessions,
      movesTrained,
      manualSessions,
    };
  }, [date, dayData, log_exclusions]);
}
