import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { useT } from '../../hooks/useTranslation';
import { Ic } from '../shared/Ic';
import { Txtarea } from '../shared/Txtarea';
import { BottomSheet } from '../shared/BottomSheet';
import { createHomeNoteFromLog } from '../../utils/logTodayHomeNote';

const STAMINA_SUBCATS = ['liss', 'miss', 'hiit'];
const STRENGTH_SUBCATS = ['max', 'hypertrophy', 'power', 'endurance'];
const STRENGTH_REGIONS = ['upper', 'mid', 'lower'];
const MOBILITY_SUBCATS = ['cars', 'dynamic', 'static', 'loaded', 'tissue'];
// Grid order: column-by-column visual reading is [neck, wrists, shoulders, hips, spine, ankles].
const MOBILITY_JOINTS = ['neck', 'wrists', 'shoulders', 'hips', 'spine', 'ankles'];

const SUBCAT_KEY = {
  liss: { label: 'logCondLissLabel', info: 'logCondLissInfo' },
  miss: { label: 'logCondMissLabel', info: 'logCondMissInfo' },
  hiit: { label: 'logCondHiitLabel', info: 'logCondHiitInfo' },
  max: { label: 'logCondMaxLabel', info: 'logCondMaxInfo' },
  hypertrophy: { label: 'logCondHypertrophyLabel', info: 'logCondHypertrophyInfo' },
  power: { label: 'logCondPowerLabel', info: 'logCondPowerInfo' },
  endurance: { label: 'logCondEnduranceLabel', info: 'logCondEnduranceInfo' },
  cars: { label: 'logCondCarsLabel', info: 'logCondCarsInfo' },
  dynamic: { label: 'logCondDynamicLabel', info: 'logCondDynamicInfo' },
  static: { label: 'logCondStaticLabel', info: 'logCondStaticInfo' },
  loaded: { label: 'logCondLoadedLabel', info: 'logCondLoadedInfo' },
  tissue: { label: 'logCondTissueLabel', info: 'logCondTissueInfo' },
};

const REGION_KEY = {
  upper: 'logCondRegionUpper',
  mid: 'logCondRegionMid',
  lower: 'logCondRegionLower',
};

const JOINT_KEY = {
  neck: 'logCondJointNeck',
  shoulders: 'logCondJointShoulders',
  spine: 'logCondJointSpine',
  wrists: 'logCondJointWrists',
  hips: 'logCondJointHips',
  ankles: 'logCondJointAnkles',
};

const toggleInArray = (arr, key) =>
  arr.includes(key) ? arr.filter(x => x !== key) : [...arr, key];

export const LogTodayConditioning = forwardRef(function LogTodayConditioning({
  date,
  existingEvent,
  addCalendarEvent,
  updateCalendarEvent,
  addToast,
  setIdeas,
  setHomeStack,
  onClose,
}, ref) {
  const t = useT();
  const initial = existingEvent?.conditioning;

  const sectionHeaderStyle = (isFirst) => ({
    fontSize: 10, fontFamily: FONT_DISPLAY, fontWeight: 800,
    color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1.5,
    marginTop: isFirst ? 0 : 21, marginBottom: 8,
  });

  const numberInputStyle = {
    width: 64, background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 8, padding: '10px 8px', color: C.text, fontSize: 14,
    fontFamily: FONT_BODY, outline: 'none', textAlign: 'center', boxSizing: 'border-box',
  };

  const formInputStyle = {
    width: '100%', background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 8, padding: '10px 12px', color: C.text, fontSize: 14,
    fontFamily: FONT_BODY, outline: 'none', boxSizing: 'border-box',
  };

  const chipStyle = (active) => ({
    display: 'inline-flex', alignItems: 'center', gap: 4,
    borderRadius: 20, padding: '5px 13px',
    border: `1.5px solid ${active ? C.accent : C.border}`,
    background: active ? C.accent + '18' : 'transparent',
    color: active ? C.accent : C.text,
    fontSize: 11, fontWeight: 700, fontFamily: FONT_DISPLAY,
    letterSpacing: 0.5, textTransform: 'uppercase',
    cursor: 'pointer', transition: 'all 0.15s',
    userSelect: 'none',
  });

  const [sessionName, setSessionName] = useState(initial?.sessionName || '');
  const [durationH, setDurationH] = useState(
    initial?.durationHours ? String(initial.durationHours) : ''
  );
  const [durationM, setDurationM] = useState(
    initial?.durationMinutes ? String(initial.durationMinutes) : ''
  );
  const [stamina, setStamina] = useState({
    subCategories: initial?.stamina?.subCategories || [],
    details: initial?.stamina?.details || '',
  });
  const [strength, setStrength] = useState({
    subCategories: initial?.strength?.subCategories || [],
    regions: initial?.strength?.regions || [],
    details: initial?.strength?.details || '',
  });
  const [mobility, setMobility] = useState({
    subCategories: initial?.mobility?.subCategories || [],
    joints: initial?.mobility?.joints || [],
    details: initial?.mobility?.details || '',
  });
  const [todayNote, setTodayNote] = useState(initial?.todayNote || '');
  const [addToHome, setAddToHome] = useState(false);
  const [openSection, setOpenSection] = useState(null);
  const [infoKey, setInfoKey] = useState(null);

  const toggleSection = (key) => setOpenSection(prev => (prev === key ? null : key));

  const toggleStaminaSubCat = (key) => {
    setStamina(prev => ({ ...prev, subCategories: toggleInArray(prev.subCategories, key) }));
  };

  const toggleStrengthSubCat = (key) => {
    setStrength(prev => {
      const nextSubs = toggleInArray(prev.subCategories, key);
      return {
        ...prev,
        subCategories: nextSubs,
        regions: nextSubs.length === 0 ? [] : prev.regions,
      };
    });
  };

  const toggleStrengthRegion = (key) => {
    setStrength(prev => ({ ...prev, regions: toggleInArray(prev.regions, key) }));
  };

  const toggleMobilitySubCat = (key) => {
    setMobility(prev => {
      const nextSubs = toggleInArray(prev.subCategories, key);
      return {
        ...prev,
        subCategories: nextSubs,
        joints: nextSubs.length === 0 ? [] : prev.joints,
      };
    });
  };

  const toggleMobilityJoint = (key) => {
    setMobility(prev => ({ ...prev, joints: toggleInArray(prev.joints, key) }));
  };

  const handleSave = () => {
    const hours = parseInt(durationH, 10) || 0;
    const minutes = parseInt(durationM, 10) || 0;
    const name = sessionName.trim();
    const note = todayNote.trim();

    const isEmpty =
      !name &&
      hours === 0 &&
      minutes === 0 &&
      !note &&
      stamina.subCategories.length === 0 && !stamina.details.trim() &&
      strength.subCategories.length === 0 && !strength.details.trim() &&
      mobility.subCategories.length === 0 && !mobility.details.trim();

    if (isEmpty) {
      onClose?.();
      return;
    }

    const conditioning = {
      sessionName: name,
      durationHours: hours,
      durationMinutes: minutes,
      stamina: {
        subCategories: stamina.subCategories,
        details: stamina.details.trim(),
      },
      strength: {
        subCategories: strength.subCategories,
        regions: strength.regions,
        details: strength.details.trim(),
      },
      mobility: {
        subCategories: mobility.subCategories,
        joints: mobility.joints,
        details: mobility.details.trim(),
      },
      todayNote: note,
    };

    const isUpdate = !!existingEvent?.id;
    const record = {
      ...(isUpdate
        ? { id: existingEvent.id, createdAt: existingEvent.createdAt }
        : {}),
      date,
      type: 'conditioning',
      source: 'log_today',
      title: name || t('conditioning'),
      conditioning,
    };

    if (isUpdate) {
      updateCalendarEvent?.(record);
    } else {
      addCalendarEvent?.(record, { silent: true });
    }

    if (addToHome) {
      const subcatLabels = (keys) => keys.map(k => t(SUBCAT_KEY[k].label)).join(', ');
      const regionLabels = (keys) => keys.map(k => t(REGION_KEY[k])).join(', ');
      const jointLabels = (keys) => keys.map(k => t(JOINT_KEY[k])).join(', ');
      const lines = [];
      if (name) lines.push(`${t('logCondSessionName')}\n${name}`);
      if (hours > 0 || minutes > 0) lines.push(`${t('howLong')}\n${hours}h ${minutes}m`);
      if (stamina.subCategories.length || stamina.details.trim()) {
        const parts = [];
        if (stamina.subCategories.length) parts.push(subcatLabels(stamina.subCategories));
        if (stamina.details.trim()) parts.push(stamina.details.trim());
        lines.push(`${t('logCondStamina')}\n${parts.join(' — ')}`);
      }
      if (strength.subCategories.length || strength.details.trim()) {
        const parts = [];
        if (strength.subCategories.length) parts.push(subcatLabels(strength.subCategories));
        if (strength.regions.length) parts.push(regionLabels(strength.regions));
        if (strength.details.trim()) parts.push(strength.details.trim());
        lines.push(`${t('logCondStrength')}\n${parts.join(' — ')}`);
      }
      if (mobility.subCategories.length || mobility.details.trim()) {
        const parts = [];
        if (mobility.subCategories.length) parts.push(subcatLabels(mobility.subCategories));
        if (mobility.joints.length) parts.push(jointLabels(mobility.joints));
        if (mobility.details.trim()) parts.push(mobility.details.trim());
        lines.push(`${t('logCondMobility')}\n${parts.join(' — ')}`);
      }
      if (note) lines.push(`${t('logCondTodayNote')}\n${note}`);
      createHomeNoteFromLog({
        section: t('conditioning'), date, summary: lines.join('\n\n'),
        setIdeas, setHomeStack,
      });
    }

    addToast?.({ icon: 'check', title: t(isUpdate ? 'sessionUpdated' : 'sessionLogged') });
    onClose?.();
  };

  useImperativeHandle(ref, () => ({ save: () => handleSave() }));

  const renderChip = (key, label, active, onToggle) => (
    <div
      key={key}
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); }
      }}
      style={chipStyle(active)}
    >
      <span>{label}</span>
    </div>
  );

  const renderSubCatChip = (key, active, onToggle) => (
    <div
      key={key}
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); }
      }}
      style={chipStyle(active)}
    >
      <span>{t(SUBCAT_KEY[key].label)}</span>
      <button
        onClick={(e) => { e.stopPropagation(); setInfoKey(key); }}
        aria-label={t(SUBCAT_KEY[key].label)}
        style={{
          background: 'none', border: 'none', padding: 0,
          display: 'inline-flex', alignItems: 'center', cursor: 'pointer',
        }}
      >
        <Ic n="info" s={12} c={active ? C.accent : C.textMuted} />
      </button>
    </div>
  );

  const accordionHeader = (key, labelKey) => {
    const open = openSection === key;
    return (
      <button
        onClick={() => toggleSection(key)}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          padding: '13px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <span style={{
          fontSize: 10, fontFamily: FONT_DISPLAY, fontWeight: 800,
          letterSpacing: 1.5, textTransform: 'uppercase',
          color: open ? C.text : C.textMuted,
        }}>
          {t(labelKey)}
        </span>
        <span style={{
          display: 'inline-flex',
          transform: `rotate(${open ? 180 : 0}deg)`,
          transition: 'transform 0.15s',
        }}>
          <Ic n="chevD" s={13} c={open ? C.text : C.textMuted} />
        </span>
      </button>
    );
  };

  return (
    <div style={{ padding: '16px 16px 24px' }}>
      {/* Session name */}
      <div style={sectionHeaderStyle(true)}>{t('logCondSessionName')}</div>
      <input
        type="text"
        value={sessionName}
        onChange={e => setSessionName(e.target.value)}
        placeholder={t('logCondSessionNamePlaceholder')}
        style={formInputStyle}
      />

      {/* Duration — matches Training: one HOW LONG header, HH:MM */}
      <div style={sectionHeaderStyle(false)}>{t('howLong')}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="number" inputMode="numeric" min={0}
          value={durationH}
          onChange={e => setDurationH(e.target.value)}
          placeholder="HH"
          style={numberInputStyle}
        />
        <span style={{ color: C.textMuted, fontSize: 18, fontWeight: 700 }}>:</span>
        <input
          type="number" inputMode="numeric" min={0} max={59}
          value={durationM}
          onChange={e => setDurationM(e.target.value)}
          placeholder="MM"
          style={numberInputStyle}
        />
      </div>

      {/* Divider between session-level fields and accordions */}
      <div style={{ height: 1, background: C.borderLight, margin: '21px 0 0' }} />

      {/* STAMINA accordion */}
      {accordionHeader('stamina', 'logCondStamina')}
      {openSection === 'stamina' && (
        <div style={{ paddingBottom: 13 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {STAMINA_SUBCATS.map(key =>
              renderSubCatChip(key, stamina.subCategories.includes(key),
                () => toggleStaminaSubCat(key))
            )}
          </div>
          <div style={{ marginTop: 13 }}>
            <Txtarea
              value={stamina.details}
              onChange={v => setStamina(prev => ({ ...prev, details: v }))}
              placeholder={t('logCondDetailsPlaceholder')}
              rows={3}
              autoExpand
              minHeight={80}
            />
          </div>
        </div>
      )}
      <div style={{ height: 1, background: C.borderLight }} />

      {/* STRENGTH accordion */}
      {accordionHeader('strength', 'logCondStrength')}
      {openSection === 'strength' && (
        <div style={{ paddingBottom: 13 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {STRENGTH_SUBCATS.map(key =>
              renderSubCatChip(key, strength.subCategories.includes(key),
                () => toggleStrengthSubCat(key))
            )}
          </div>
          {strength.subCategories.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {STRENGTH_REGIONS.map(r =>
                renderChip(r, t(REGION_KEY[r]), strength.regions.includes(r),
                  () => toggleStrengthRegion(r))
              )}
            </div>
          )}
          <div style={{ marginTop: 13 }}>
            <Txtarea
              value={strength.details}
              onChange={v => setStrength(prev => ({ ...prev, details: v }))}
              placeholder={t('logCondDetailsPlaceholder')}
              rows={3}
              autoExpand
              minHeight={80}
            />
          </div>
        </div>
      )}
      <div style={{ height: 1, background: C.borderLight }} />

      {/* MOBILITY accordion */}
      {accordionHeader('mobility', 'logCondMobility')}
      {openSection === 'mobility' && (
        <div style={{ paddingBottom: 13 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {MOBILITY_SUBCATS.map(key =>
              renderSubCatChip(key, mobility.subCategories.includes(key),
                () => toggleMobilitySubCat(key))
            )}
          </div>
          {mobility.subCategories.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 8 }}>
              {MOBILITY_JOINTS.map(j =>
                renderChip(j, t(JOINT_KEY[j]), mobility.joints.includes(j),
                  () => toggleMobilityJoint(j))
              )}
            </div>
          )}
          <div style={{ marginTop: 13 }}>
            <Txtarea
              value={mobility.details}
              onChange={v => setMobility(prev => ({ ...prev, details: v }))}
              placeholder={t('logCondDetailsPlaceholder')}
              rows={3}
              autoExpand
              minHeight={80}
            />
          </div>
        </div>
      )}
      <div style={{ height: 1, background: C.borderLight }} />

      {/* Today's Note */}
      <div style={sectionHeaderStyle(false)}>{t('logCondTodayNote')}</div>
      <Txtarea
        value={todayNote}
        onChange={setTodayNote}
        placeholder={t('logCondTodayNotePlaceholder')}
        rows={3}
        autoExpand
        minHeight={80}
      />

      {/* Add to HOME checkbox */}
      <label style={{
        display: 'flex', alignItems: 'center', gap: 8,
        marginTop: 10, cursor: 'pointer', userSelect: 'none',
      }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 18, height: 18, borderRadius: 4,
          border: `2px solid ${addToHome ? C.green : C.border}`,
          background: addToHome ? C.green : 'transparent',
        }}>
          {addToHome && <Ic n="check" s={12} c="#fff" />}
        </span>
        <input
          type="checkbox"
          checked={addToHome}
          onChange={e => setAddToHome(e.target.checked)}
          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
        />
        <span style={{ fontSize: 13, fontFamily: FONT_BODY, color: C.textSec }}>
          {t('logTodayAddToHome')}
        </span>
      </label>

      {/* Sub-category info sheet */}
      <BottomSheet
        open={!!infoKey}
        onClose={() => setInfoKey(null)}
        title={infoKey ? t(SUBCAT_KEY[infoKey].label) : ''}
      >
        <div style={{
          padding: '8px 4px 16px',
          fontFamily: FONT_BODY, fontSize: 13, color: C.textSec, lineHeight: 1.6,
        }}>
          {infoKey ? t(SUBCAT_KEY[infoKey].info) : ''}
        </div>
      </BottomSheet>
    </div>
  );
});

export default LogTodayConditioning;
