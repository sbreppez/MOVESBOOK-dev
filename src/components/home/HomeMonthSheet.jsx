import React, { useMemo, useState } from 'react';
import { FONT_DISPLAY } from '../../constants/fonts';
import { useSettings } from '../../hooks/useSettings';
import { useT } from '../../hooks/useTranslation';
import { Ic } from '../shared/Ic';
import { BottomSheet } from '../shared/BottomSheet';
import { todayLocal, toLocalYMD } from '../../utils/dateUtils';

const DAY_LETTERS = ['S','M','T','W','T','F','S'];
const MONTH_KEYS = ['january','february','march','april','may','june',
                    'july','august','september','october','november','december'];

// Fixed legend/dot order — present buckets render in this sequence; absent skip.
const BUCKET_ORDER = ['rest', 'training', 'battle', 'conditioning', 'notes'];

// Event types that map onto each bucket (routine logs as training).
const EVENT_TYPE_TO_BUCKET = {
  rest: 'rest',
  training: 'training',
  routine: 'training',
  battle: 'battle',
  conditioning: 'conditioning',
  journal: 'notes',
};

// Returns the ordered subset of BUCKET_ORDER that has content on this ymd.
const bucketsForDay = (ymd, { calendar, homeChecks, habits, restLog }) => {
  const present = new Set();
  for (const e of (calendar?.events || [])) {
    if (e.date !== ymd) continue;
    const b = EVENT_TYPE_TO_BUCKET[e.type];
    if (b) present.add(b);
  }
  if (homeChecks?.[ymd] && Object.keys(homeChecks[ymd]).length > 0) present.add('training');
  if ((habits || []).some(h => (h.checkIns || []).includes(ymd))) present.add('training');
  if (restLog?.[ymd]) present.add('rest');
  return BUCKET_ORDER.filter(b => present.has(b));
};

export const HomeMonthSheet = ({
  open, onClose, selectedDate, onSelectDate,
  calendar, homeChecks, habits, restLog,
}) => {
  const { C } = useSettings();
  const t = useT();
  const todayStr = todayLocal();

  const BUCKET_COLORS = {
    rest:         C.green,
    training:     C.accent,
    battle:       C.purple,
    conditioning: C.blue,
    notes:        C.yellow,
  };

  const LEGEND_LABELS = {
    rest:         t('calendarLegendRest'),
    training:     t('calendarLegendTraining'),
    battle:       t('calendarLegendBattle'),
    conditioning: t('calendarLegendConditioning'),
    notes:        t('calendarLegendNotes'),
  };

  // Month being displayed in the grid. Independent from selectedDate: user
  // can scrub months via prev/next without selecting until they tap a day.
  const initialMonth = useMemo(() => {
    const d = selectedDate
      ? new Date(selectedDate + 'T12:00:00')
      : new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  }, [selectedDate]);

  const [view, setView] = useState(initialMonth);

  // Re-sync view to selectedDate's month each time the sheet opens.
  React.useEffect(() => {
    if (open) setView(initialMonth);
  }, [open, initialMonth]);

  const grid = useMemo(() => {
    // 6 rows × 7 cols, starting from the Sunday on/before the 1st of the month.
    const firstDayDow = new Date(view.year, view.month, 1).getDay();
    const startDate = new Date(view.year, view.month, 1 - firstDayDow);
    const cells = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      cells.push({
        date: d,
        dayNum: d.getDate(),
        ymd: toLocalYMD(d),
        inMonth: d.getMonth() === view.month,
      });
    }
    return cells;
  }, [view.year, view.month]);

  const monthLabel = `${t(MONTH_KEYS[view.month]).toUpperCase()} ${view.year}`;

  const stepMonth = (delta) => setView(prev => {
    const m = prev.month + delta;
    return {
      year: prev.year + Math.floor(m / 12),
      month: ((m % 12) + 12) % 12,
    };
  });

  return (
    <BottomSheet open={open} onClose={onClose} title={monthLabel}>
      {/* Month nav */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '4px 0 12px',
      }}>
        <button
          onClick={() => stepMonth(-1)}
          aria-label="prev month"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 6, display: 'flex',
          }}
        >
          <Ic n="chevL" s={18} c={C.text} />
        </button>
        <span style={{
          fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 14,
          letterSpacing: 1.5, color: C.text, textTransform: 'uppercase',
        }}>
          {monthLabel}
        </span>
        <button
          onClick={() => stepMonth(1)}
          aria-label="next month"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 6, display: 'flex',
          }}
        >
          <Ic n="chevR" s={18} c={C.text} />
        </button>
      </div>

      {/* DOW header row */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4,
        marginBottom: 6,
      }}>
        {DAY_LETTERS.map((l, i) => (
          <div key={i} style={{
            textAlign: 'center', fontSize: 10, fontFamily: FONT_DISPLAY,
            fontWeight: 800, letterSpacing: 1, color: C.textMuted,
          }}>
            {l}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4,
        paddingBottom: 12,
      }}>
        {grid.map(({ ymd, dayNum, inMonth }) => {
          const isToday = ymd === todayStr;
          const isSelected = ymd === selectedDate;
          const buckets = bucketsForDay(ymd, { calendar, homeChecks, habits, restLog });
          return (
            <button
              key={ymd}
              onClick={() => { onSelectDate(ymd); onClose?.(); }}
              style={{
                aspectRatio: '1 / 1',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 2,
                background: isSelected && !isToday ? `${C.accent}18` : 'transparent',
                outline: isToday
                  ? `2px solid ${C.accent}`
                  : isSelected ? `1.5px solid ${C.accent}` : 'none',
                border: 'none', borderRadius: 8, cursor: 'pointer',
                opacity: inMonth ? 1 : 0.35,
                transition: 'all 0.15s',
              }}
            >
              <span style={{
                fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 14,
                color: isToday || isSelected ? C.accent : C.text,
              }}>
                {dayNum}
              </span>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 2, height: 3,
              }}>
                {buckets.map(b => (
                  <div key={b} style={{
                    width: 3, height: 3, borderRadius: '50%',
                    background: BUCKET_COLORS[b],
                  }}/>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginTop: 12, paddingBottom: 4,
      }}>
        {BUCKET_ORDER.map(b => (
          <div key={b} style={{
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: BUCKET_COLORS[b],
            }}/>
            <span style={{
              fontFamily: FONT_DISPLAY, fontSize: 10, fontWeight: 800,
              letterSpacing: 1.2, textTransform: 'uppercase', color: C.textSec,
            }}>
              {LEGEND_LABELS[b]}
            </span>
          </div>
        ))}
      </div>
    </BottomSheet>
  );
};

export default HomeMonthSheet;
