import { useMemo } from 'react';
import { toYMD } from '../utils/dateUtils';

/**
 * Returns memoized day-keyed data slices for a given date.
 *
 * Consumed by CalendarOverlay (day-detail panel) and Log Today v1
 * (Training sub-tab projection layer).
 *
 * Signature is two-arg because there is no global store to read slices
 * from — they come down as props from App.jsx.
 *
 * @param {string|null} date - YYYY-MM-DD day key
 * @param {object} dataSlices - { moves, reps, sparring, musicflow, habits, ideas, calendar }
 * @returns {object|null} Bucketed day data, or null if date is falsy
 */
export function useDayData(date, { moves, reps, sparring, musicflow, habits, ideas, calendar }) {
  return useMemo(() => {
    if (!date) return null;
    const d = date;
    return {
      movesTrained: (moves || []).filter(m => toYMD(m.date) === d),
      repSessions: (reps || []).filter(r => toYMD(r.date) === d),
      sparringSessions: (sparring?.sessions || []).filter(s => toYMD(s.date) === d),
      sparringSessions1v1: (sparring?.sessions1v1 || []).filter(s => toYMD(s.date) === d),
      musicflowSessions: (musicflow?.sessions || []).filter(s => toYMD(s.date) === d),
      habitsCompleted: (habits || []).filter(h => (h.checkIns || []).includes(d)),
      notesOnDay: (ideas || []).filter(i => (i.journal || []).some(j => toYMD(j.date) === d)),
      calendarEvents: (calendar?.events || []).filter(e => e.date === d),
    };
  }, [date, moves, reps, sparring, musicflow, habits, ideas, calendar]);
}
