/* global firebase */
import { useEffect, useState, useMemo } from 'react';

/**
 * Subscribe to TextStream entries matching a filter.
 *
 * Filter shape (all optional):
 *   - sourceType: string | string[]   filter by source_type (array max 10 items per Firestore 'in' limit)
 *   - sourceId: string                filter by source_id
 *   - includeSuperseded: boolean      default false (current entries only)
 *   - sortDir: 'asc' | 'desc'         default 'desc' (newest first)
 *
 * Returns: { entries, loading, error }
 *
 * Subscription is created on mount and cleaned up on unmount or filter change.
 * Empty filter ({}) returns all current entries — use sparingly.
 *
 * Note: filterKey is JSON.stringify(filter), so callers should pass a stable
 * filter shape (or wrap in their own useMemo) to avoid resubscribe churn.
 */
export function useTextStream(uid, filter = {}) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Stabilize filter for dep array.
  const filterKey = useMemo(() => JSON.stringify(filter), [filter]);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    let q = firebase.firestore()
      .collection('users').doc(uid)
      .collection('textstream');

    if (filter.sourceType) {
      if (Array.isArray(filter.sourceType)) {
        // Firestore 'in' query limit is 10 items; guard against runtime crash.
        // Callers needing >10 source types should split into multiple hook calls.
        q = q.where('source_type', 'in', filter.sourceType.slice(0, 10));
      } else {
        q = q.where('source_type', '==', filter.sourceType);
      }
    }
    if (filter.sourceId) {
      q = q.where('source_id', '==', filter.sourceId);
    }
    if (!filter.includeSuperseded) {
      q = q.where('superseded_at', '==', null);
    }
    q = q.orderBy('created_at', filter.sortDir === 'asc' ? 'asc' : 'desc');

    const unsub = q.onSnapshot(
      snap => {
        const list = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() }));
        setEntries(list);
        setLoading(false);
      },
      err => {
        console.error('[textStream] subscription error:', err);
        setError(err);
        setLoading(false);
      }
    );
    return () => unsub();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- filterKey already encodes filter; listing filter directly would resubscribe on every render
  }, [uid, filterKey]);

  return { entries, loading, error };
}
