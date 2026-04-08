import { useState, useEffect, useCallback } from 'react';

const CACHE_KEY = 'mb_premium';

const readCache = () => {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || {}; }
  catch { return {}; }
};

export const usePremium = (fbUser) => {
  const [status, setStatus] = useState(() => {
    const c = readCache();
    return {
      isPremium: !!c.isPremium,
      plan: c.plan || null,
      expiresAt: c.expiresAt ? new Date(c.expiresAt) : null,
      loading: true,
    };
  });

  const fetchStatus = useCallback(() => {
    if (!fbUser?.uid || !window.__MB_DB__) {
      setStatus({ isPremium: false, plan: null, expiresAt: null, loading: false });
      return;
    }
    window.__MB_DB__.load(fbUser.uid).then(data => {
      if (!data) {
        const s = { isPremium: false, plan: null, expiresAt: null, loading: false };
        setStatus(s);
        localStorage.setItem(CACHE_KEY, JSON.stringify(s));
        return;
      }
      // Premium fields are raw (set by admin/cloud functions), not JSON-stringified
      let isPremium = !!data.premium;
      const plan = data.premiumPlan || null;
      let expiresAt = null;

      if (data.premiumExpires) {
        // Handle Firestore Timestamp or ISO string
        expiresAt = data.premiumExpires.toDate
          ? data.premiumExpires.toDate()
          : new Date(data.premiumExpires);
        if (expiresAt < new Date()) isPremium = false;
      }

      const s = { isPremium, plan, expiresAt: expiresAt ? expiresAt.toISOString() : null, loading: false };
      setStatus({ ...s, expiresAt });
      localStorage.setItem(CACHE_KEY, JSON.stringify(s));
    }).catch(() => {
      setStatus(prev => ({ ...prev, loading: false }));
    });
  }, [fbUser?.uid]);

  // Fetch on mount / user change
  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  // Re-fetch on app focus
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') fetchStatus(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [fetchStatus]);

  return status;
};
