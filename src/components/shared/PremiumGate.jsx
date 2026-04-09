import React, { useState } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { useT } from '../../hooks/useTranslation';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { Ic } from './Ic';
import { Btn } from './Btn';

const HEADLINES = {
  explore: 'premiumExplore',
  rrr: 'premiumRRR',
  combine: 'premiumCombine',
  map: 'premiumMap',
  flashCards: 'premiumFlashCards',
  spar: 'premiumSpar',
  flow: 'premiumFlow',
  compSim: 'premiumCompSim',
  gap: 'premiumGap',
  battlePrep: 'premiumBattlePrep',
  rivals: 'premiumRivals',
  myStance: 'premiumStance',
  devStory: 'premiumStance',
  reports: 'premiumReports',
  shareCards: 'premiumShare',
  reflection: 'premiumFlow',
  injuries: 'premiumReports',
  sparGap: 'premiumGap',
  moveLineage: 'premiumTreeView',
  originField: 'premiumTreeView',
};

export const PremiumGate = ({ feature, addToast }) => {
  const { C } = useSettings();
  const t = useT();
  const [showCode, setShowCode] = useState(false);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  const headline = t(HEADLINES[feature] || 'premiumUnlock');

  const onChipTap = () => {
    if (addToast) addToast({ icon: 'star', title: t('premiumUpgradeSoon'), msg: '' });
  };

  const onRedeem = async () => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setCodeError('');
    setRedeeming(true);
    try {
      const db = window.__MB_DB__;
      const user = window.__MB_USER__;
      if (!db || !user) { setCodeError(t('premiumCodeInvalid')); setRedeeming(false); return; }

      const promo = await db.loadDoc('promo_codes', trimmed);
      if (!promo) { setCodeError(t('premiumCodeInvalid')); setRedeeming(false); return; }

      // Check expiry
      if (promo.expiresAt) {
        const exp = promo.expiresAt.toDate ? promo.expiresAt.toDate() : new Date(promo.expiresAt);
        if (exp < new Date()) { setCodeError(t('premiumCodeInvalid')); setRedeeming(false); return; }
      }
      // Check max uses
      if (promo.maxUses && (promo.usedBy || []).length >= promo.maxUses) {
        setCodeError(t('premiumCodeInvalid')); setRedeeming(false); return;
      }
      // Check already used by this user
      if ((promo.usedBy || []).includes(user.uid)) {
        setCodeError(t('premiumCodeInvalid')); setRedeeming(false); return;
      }

      await db.redeemPromo(user.uid, trimmed);
      // Update localStorage cache immediately
      localStorage.setItem('mb_premium', JSON.stringify({ isPremium: true, plan: 'promo', expiresAt: null }));
      if (addToast) addToast({ icon: 'check', title: t('premiumCodeSuccess'), msg: '' });
      // Force reload to pick up new premium status
      setTimeout(() => window.location.reload(), 800);
    } catch {
      setCodeError(t('premiumCodeInvalid'));
    }
    setRedeeming(false);
  };

  const chipStyle = {
    background: C.surfaceAlt, border: `1.5px solid ${C.border}`, borderRadius: 20,
    padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700,
    fontFamily: FONT_DISPLAY, color: C.text, letterSpacing: 0.5,
    transition: 'border-color 0.15s',
  };

  return (
    <div style={{
      background: C.surface, borderRadius: 8, padding: 24,
      textAlign: 'center',
    }}>
      <div style={{ marginBottom: 14, opacity: 0.5 }}>
        <Ic n="lock" s={32} c={C.textMuted}/>
      </div>

      <div style={{
        fontSize: 17, fontWeight: 800, fontFamily: FONT_DISPLAY,
        color: C.text, letterSpacing: 1.2, marginBottom: 6,
        textTransform: 'uppercase',
      }}>
        {headline}
      </div>

      <div style={{
        fontSize: 13, color: C.textMuted, fontFamily: FONT_BODY,
        marginBottom: 20,
      }}>
        {t('premiumFeature')}
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
        <button onClick={onChipTap} style={chipStyle}>{t('premiumPerMonth')}</button>
        <button onClick={onChipTap} style={chipStyle}>{t('premiumPerYear')}</button>
        <button onClick={onChipTap} style={chipStyle}>{t('premiumForever')}</button>
      </div>

      {!showCode ? (
        <button onClick={() => setShowCode(true)} style={{
          background: 'none', border: 'none', color: C.textMuted,
          fontSize: 12, fontFamily: FONT_BODY, cursor: 'pointer',
          textDecoration: 'underline',
        }}>
          {t('premiumHaveCode')}
        </button>
      ) : (
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center' }}>
            <input
              value={code} onChange={e => { setCode(e.target.value); setCodeError(''); }}
              placeholder={t('premiumCodePlaceholder')}
              style={{
                background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8,
                padding: '9px 12px', color: C.text, fontSize: 13, fontFamily: FONT_BODY,
                outline: 'none', width: 160, boxSizing: 'border-box',
              }}
              onKeyDown={e => { if (e.key === 'Enter') onRedeem(); }}
            />
            <Btn onClick={onRedeem} disabled={redeeming || !code.trim()} small>
              {t('premiumRedeem')}
            </Btn>
          </div>
          {codeError && (
            <div style={{ color: C.red, fontSize: 12, marginTop: 6, fontFamily: FONT_BODY }}>
              {codeError}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
