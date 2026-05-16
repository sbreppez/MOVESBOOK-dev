import React, { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback } from 'react';
import { FONT_DISPLAY } from '../../constants/fonts';
import { useSettings } from '../../hooks/useSettings';
import { todayLocal, toLocalYMD } from '../../utils/dateUtils';

const DAY_LETTERS = ['S','M','T','W','T','F','S'];
const CELL_WIDTH = 56;
const GAP = 4;
const STRIDE = CELL_WIDTH + GAP;
const WINDOW_HALF = 30;        // initial half-range in days
const EXTEND_STEP = 30;        // cells added when edge is reached
const EDGE_TRIGGER_CELLS = 7;  // extend when within this many cells of either edge

export const WeekStrip = ({ selectedDate, onSelectDate }) => {
  const { C } = useSettings();
  const todayStr = todayLocal();
  const containerRef = useRef(null);
  const didInitialScroll = useRef(false);
  const prevRangeStart = useRef(-WINDOW_HALF);

  // Range expressed as integer day offsets from today (inclusive).
  const [range, setRange] = useState({ start: -WINDOW_HALF, end: WINDOW_HALF });

  const days = useMemo(() => {
    const arr = [];
    const base = new Date();
    base.setHours(12, 0, 0, 0);
    for (let i = range.start; i <= range.end; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      arr.push({
        dateStr: toLocalYMD(d),
        dayNum: d.getDate(),
        dow: d.getDay(),
      });
    }
    return arr;
  }, [range]);

  // Compensate scroll position when we prepend cells, so the viewport doesn't jump.
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const delta = prevRangeStart.current - range.start;
    if (delta > 0) {
      containerRef.current.scrollLeft += delta * STRIDE;
    }
    prevRangeStart.current = range.start;
  }, [range.start]);

  // Bring the selected cell into center on mount and whenever selectedDate
  // changes from outside (Today chip, month dropdown). Wrapped in RAF because
  // the WeekStrip mounts inside a flex parent whose width is determined after
  // commit on first paint.
  useEffect(() => {
    let raf = 0;
    const center = () => {
      const container = containerRef.current;
      if (!container) return;
      if (container.clientWidth === 0) { raf = requestAnimationFrame(center); return; }
      const cell = container.querySelector(`[data-date="${selectedDate}"]`);
      if (!cell) return;
      const target = cell.offsetLeft - (container.clientWidth - cell.offsetWidth) / 2;
      container.scrollTo({
        left: target,
        behavior: didInitialScroll.current ? 'smooth' : 'auto',
      });
      didInitialScroll.current = true;
    };
    raf = requestAnimationFrame(center);
    return () => cancelAnimationFrame(raf);
  }, [selectedDate, range.start, range.end]);

  const handleScroll = useCallback((e) => {
    const el = e.currentTarget;
    const fromLeft = el.scrollLeft;
    const fromRight = el.scrollWidth - el.scrollLeft - el.clientWidth;
    if (fromLeft < STRIDE * EDGE_TRIGGER_CELLS) {
      setRange(r => ({ ...r, start: r.start - EXTEND_STEP }));
    } else if (fromRight < STRIDE * EDGE_TRIGGER_CELLS) {
      setRange(r => ({ ...r, end: r.end + EXTEND_STEP }));
    }
  }, []);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{
        display: "flex", gap: GAP, padding: "8px 16px",
        background: "transparent", flexShrink: 0,
        overflowX: "auto", overflowY: "hidden",
        scrollSnapType: "x mandatory",
        WebkitOverflowScrolling: "touch",
        scrollbarWidth: "none",
      }}
    >
      {days.map(({ dateStr, dayNum, dow }) => {
        const isToday = dateStr === todayStr;
        const isSelected = dateStr === selectedDate;
        return (
          <button
            key={dateStr}
            data-date={dateStr}
            onClick={() => onSelectDate(dateStr)}
            style={{
              flex: "0 0 auto", width: CELL_WIDTH,
              scrollSnapAlign: "center",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
              padding: "6px 0", borderRadius: 8, border: "none", cursor: "pointer",
              background: isToday ? C.accent : isSelected ? `${C.accent}18` : "transparent",
              outline: isSelected && !isToday ? `1.5px solid ${C.accent}` : "none",
              transition: "all 0.15s",
            }}>
            <span style={{
              fontSize: 10, fontWeight: 800, letterSpacing: 1, fontFamily: FONT_DISPLAY,
              color: isToday ? "#fff" : isSelected ? C.accent : C.textMuted,
            }}>
              {DAY_LETTERS[dow]}
            </span>
            <span style={{
              fontSize: 16, fontWeight: 900, fontFamily: FONT_DISPLAY,
              color: isToday ? "#fff" : isSelected ? C.accent : C.text,
            }}>
              {dayNum}
            </span>
            {isToday && (
              <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#fff", marginTop: -1 }}/>
            )}
          </button>
        );
      })}
    </div>
  );
};
