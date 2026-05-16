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

const ymdFromYMD = (y, m, d) =>
  `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

// True if the day has any logged content the user would care about at a glance.
const hasContent = (ymd, { calendar, homeChecks, habits }) => {
  if ((calendar?.events || []).some(e => e.date === ymd)) return true;
  if (homeChecks?.[ymd] && Object.keys(homeChecks[ymd]).length > 0) return true;
  if ((habits || []).some(h => (h.checkIns || []).includes(ymd))) return true;
  return false;
};

export const HomeMonthSheet = ({
  open, onClose, selectedDate, onSelectDate,
  calendar, homeChecks, habits,
}) => {
  const { C } = useSettings();
  const t = useT();
  const todayStr = todayLocal();

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
          const showDot = hasContent(ymd, { calendar, homeChecks, habits });
          return (
            <button
              key={ymd}
              onClick={() => { onSelectDate(ymd); onClose?.(); }}
              style={{
                aspectRatio: '1 / 1',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 2,
                background: isToday ? C.accent : isSelected ? `${C.accent}18` : 'transparent',
                outline: isSelected && !isToday ? `1.5px solid ${C.accent}` : 'none',
                border: 'none', borderRadius: 8, cursor: 'pointer',
                opacity: inMonth ? 1 : 0.35,
                transition: 'all 0.15s',
              }}
            >
              <span style={{
                fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 14,
                color: isToday ? '#fff' : isSelected ? C.accent : C.text,
              }}>
                {dayNum}
              </span>
              <div style={{
                width: 4, height: 4, borderRadius: '50%',
                background: showDot
                  ? (isToday ? '#fff' : C.accent)
                  : 'transparent',
              }}/>
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
};

export default HomeMonthSheet;
