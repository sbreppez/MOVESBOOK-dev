import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { useT, usePlural } from '../../hooks/useTranslation';
import { useSettings } from '../../hooks/useSettings';
import { useTextStream } from '../../hooks/useTextStream';
import { Ic } from '../shared/Ic';
import { CATEGORIES, getSourceCategory } from '../../constants/textStreamCategories';

function ResultTile({ entry, categoryLabel, C, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${entry.source_label} — ${categoryLabel}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (onClick) onClick();
        }
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? C.surfaceAlt : C.surface,
        borderRadius: 8, padding: '14px 16px',
        cursor: 'pointer', transition: 'background 0.15s',
      }}>
      <div style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        gap: 8, marginBottom: 6,
      }}>
        <span style={{
          fontSize: 14, fontWeight: 800, fontFamily: FONT_DISPLAY,
          color: C.text, textTransform: 'uppercase', letterSpacing: 1.2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          minWidth: 0,
        }}>
          {entry.source_label}
        </span>
        <span style={{
          fontSize: 11, fontWeight: 700, fontFamily: FONT_DISPLAY,
          color: C.textMuted, letterSpacing: 0.5, textTransform: 'uppercase',
          flexShrink: 0,
        }}>
          {categoryLabel}
        </span>
      </div>
      <div style={{
        fontSize: 13, fontFamily: FONT_BODY, color: C.textSec, lineHeight: 1.5,
        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
        overflow: 'hidden', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
      }}>
        {entry.text}
      </div>
    </div>
  );
}

export const SearchOverlay = ({ uid, onClose, onJumpToSource }) => {
  const t = useT();
  const { resultCountStr } = usePlural();
  const { C } = useSettings();
  const { entries, loading } = useTextStream(uid, { includeSuperseded: false });

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState(() => new Set());
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(id);
  }, [query]);

  const filteredEntries = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    return entries.filter(e => {
      if (selectedCategories.size > 0) {
        if (!selectedCategories.has(getSourceCategory(e.source_type))) return false;
      }
      if (q && !(e.text || '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [entries, debouncedQuery, selectedCategories]);

  const toggleCategory = (key) => {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const hasFilters = debouncedQuery.trim().length > 0 || selectedCategories.size > 0;
  const showEmptyAll = !loading && entries.length === 0;
  const showEmptyFiltered = !loading && entries.length > 0 && filteredEntries.length === 0 && hasFilters;
  const showResults = !loading && filteredEntries.length > 0;

  const categoryLabelByKey = useMemo(() => {
    const map = {};
    CATEGORIES.forEach(c => { map[c.key] = t(c.labelKey); });
    return map;
  }, [t]);

  return (
    <div style={{
      position: 'absolute', inset: 0, background: C.bg, zIndex: 50,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px', borderBottom: `1px solid ${C.borderLight}`,
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 16,
          letterSpacing: 1.5, color: C.text, textTransform: 'uppercase',
        }}>
          {t('searchTitle')}
        </span>
        <button onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          title={t('close')}>
          <Ic n="x" s={18} c={C.textMuted}/>
        </button>
      </div>

      {/* Input */}
      <div style={{ padding: '13px 16px 0', flexShrink: 0 }}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
          style={{
            width: '100%', background: C.surface,
            border: `1px solid ${C.border}`, borderRadius: 8,
            padding: '9px 12px', color: C.text, fontSize: 14,
            fontFamily: FONT_BODY, outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Result count */}
      <div style={{
        padding: '5px 16px 0', fontSize: 11, color: C.textMuted,
        fontFamily: FONT_BODY, flexShrink: 0,
      }}>
        {loading ? t('searchLoading') : resultCountStr(filteredEntries.length)}
      </div>

      {/* Category chips */}
      <div style={{
        display: 'flex', gap: 6, overflowX: 'auto', padding: '8px 16px',
        flexShrink: 0,
      }}>
        {CATEGORIES.map(cat => {
          const active = selectedCategories.has(cat.key);
          return (
            <button key={cat.key} onClick={() => toggleCategory(cat.key)}
              style={{
                borderRadius: 20, padding: '5px 13px',
                border: `1.5px solid ${active ? C.accent : C.border}`,
                background: active ? C.accent + '18' : 'transparent',
                color: active ? C.accent : C.text,
                fontSize: 11, fontWeight: 700, fontFamily: FONT_DISPLAY,
                letterSpacing: 0.5, textTransform: 'uppercase',
                whiteSpace: 'nowrap', cursor: 'pointer', flexShrink: 0,
                transition: 'all 0.15s',
              }}>
              {t(cat.labelKey)}
            </button>
          );
        })}
      </div>

      {/* Results / empty states */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '8px 16px 76px',
      }}>
        {showEmptyAll && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ marginBottom: 8 }}>
              <Ic n="search" s={32} c={C.textMuted}/>
            </div>
            <div style={{
              fontSize: 13, color: C.textMuted, fontFamily: FONT_BODY,
              lineHeight: 1.5,
            }}>
              {t('searchEmptyAll')}
            </div>
          </div>
        )}
        {showEmptyFiltered && (
          <div style={{
            textAlign: 'center', padding: '30px 20px',
            fontSize: 13, color: C.textMuted, fontFamily: FONT_BODY,
          }}>
            {t('searchNoResults')}
          </div>
        )}
        {showResults && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filteredEntries.map(entry => (
              <ResultTile key={entry.id}
                entry={entry}
                categoryLabel={categoryLabelByKey[getSourceCategory(entry.source_type)] || ''}
                C={C}
                onClick={() => onJumpToSource && onJumpToSource(entry.source_type, entry.source_id)}/>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
