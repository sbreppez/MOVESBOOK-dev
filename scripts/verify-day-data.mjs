// Phase 2 QA — data-shape verification.
// No test framework. Inlines useDayData filter logic + constructs fixtures,
// then verifies the schema fields DaySections.jsx actually reads.

// ── Inlined copies (kept verbatim from source so this script doesn't depend
// on ESM/JSX transforms). If the source diverges, this script will lie —
// see comments at bottom.

// src/utils/dateUtils.js: toYMD
function toYMD(d) {
  if (!d) return null;
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  try {
    const dt = d instanceof Date ? d : new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  } catch { return null; }
}

// src/utils/trainingLog.js: wasTrainedOn
function wasTrainedOn(move, dateStr) {
  const log = move?.trainingLog;
  if (!log || !dateStr) return false;
  return log.some(entry => entry?.date === dateStr);
}

// src/hooks/useDayData.js: computation (sans useMemo wrapper)
function computeDayData(date, { moves, reps, sparring, musicflow, habits, ideas, calendar }) {
  if (!date) return null;
  const d = date;
  return {
    movesTrained: (moves || []).filter(m => wasTrainedOn(m, d)),
    repSessions: (reps || []).filter(r => toYMD(r.date) === d),
    sparringSessions: (sparring?.sessions || []).filter(s => toYMD(s.date) === d),
    sparringSessions1v1: (sparring?.sessions1v1 || []).filter(s => toYMD(s.date) === d),
    musicflowSessions: (musicflow?.sessions || []).filter(s => toYMD(s.date) === d),
    habitsCompleted: (habits || []).filter(h => (h.checkIns || []).includes(d)),
    notesOnDay: (ideas || []).filter(i => (i.journal || []).some(j => toYMD(j.date) === d)),
    calendarEvents: (calendar?.events || []).filter(e => e.date === d),
  };
}

// ── Fixtures ──────────────────────────────────────────────────────────────

const DAY_A = '2026-05-10'; // past
const DAY_B = '2026-05-16'; // today
const DAY_C = '2026-05-24'; // future

const moves = [
  {
    id: 'm1', name: 'Six Step', category: 'Footworks',
    trainingLog: [
      { date: DAY_A, count: 12, source: 'drill' },
    ],
  },
  { id: 'm2', name: 'Windmill', category: 'Power Moves', trainingLog: [] },
];

const reps = [
  // Day A drill on m1
  { id: 'r1', moveId: 'm1', moveName: 'Six Step', date: DAY_A, reps: 12, duration: 45,
    reflection: 'felt good' },
];

const sparring = {
  sessions: [
    // Day A solo spar
    { id: 's1', date: DAY_A, roundLog: [{}, {}], reflection: 'tight', notes: '' },
  ],
  sessions1v1: [],
};

const musicflow = {
  sessions: [],
};

const habits = [
  // Two habits with check-ins on Day A
  { id: 'h1', name: 'Mobility', checkIns: [DAY_A, '2026-05-09'] },
  { id: 'h2', name: 'Stretch',  checkIns: [DAY_A] },
];

const ideas = [
  // Note pinned on Day A via home-idea calendar event (see calendar.events below)
  { id: 'i1', type: 'note', title: 'Watch BC One footage', text: '…', showDate: DAY_A, pinnedHome: false },
];

const calendar = {
  events: [
    // Day A: home-idea note + log_today training
    { id: 'e1', date: DAY_A, type: 'journal', source: 'home-idea',
      ideaId: 'i1', title: 'Watch BC One footage', text: 'Mid-session breakdowns', },
    { id: 'e2', date: DAY_A, type: 'training', source: 'log_today',
      title: 'Footwork basics', duration: 60, categories: ['Footworks'],
      moveIds: ['m1'], notes: 'Worked CC variants' },

    // Day B (today): log_today training
    { id: 'e3', date: DAY_B, type: 'training', source: 'log_today',
      title: 'Power loop', duration: 45, notes: 'Threw 6 windmill attempts' },

    // Day C (future): planned battle + conditioning
    { id: 'e4', date: DAY_C, type: 'battle', source: 'log_today',
      title: 'Local Jam', },
    { id: 'e5', date: DAY_C, type: 'conditioning', source: 'log_today',
      title: 'Conditioning', conditioning: { type: 'cardio' } },
  ],
};

// ── Schema alignment check ────────────────────────────────────────────────

// Fields DaySections.jsx actually destructures from dayData (grep target).
const DAY_DATA_FIELDS_READ_BY_DAYSECTIONS = [
  'calendarEvents',
  'repSessions',
  'sparringSessions',
  'sparringSessions1v1',
  'musicflowSessions',
  'movesTrained',
];

// Per-record fields DaySections reads inside the renderers.
const PER_RECORD_FIELDS = {
  calendarEvent_common: ['id', 'date', 'source', 'type', 'title'],
  calendarEvent_extras: ['duration', 'categories', 'notes', 'text', 'ideaId'],
  repSession:          ['id', 'moveName', 'reps', 'duration', 'reflection'],
  sparringSession:     ['id', 'roundLog', 'notes', 'reflection'],
  sparringSession1v1:  ['id', 'roundLog', 'opponent', 'notes', 'reflection'],
  musicflowSession:    ['id', 'duration', 'stageReached', 'reflection'],
  moveTrained:         ['id', 'category', 'name'],
};

function fmt(o) { return JSON.stringify(o); }

function summarize(label, day, data) {
  const events = data.calendarEvents.length;
  const sessions =
    data.repSessions.length +
    data.sparringSessions.length +
    data.sparringSessions1v1.length +
    data.musicflowSessions.length;
  const movesT = data.movesTrained.length;
  const habits = data.habitsCompleted.length;
  const notes = data.notesOnDay.length;
  console.log(
    `${label} (${day}): calendarEvents=${events}, ` +
    `sessions=${data.repSessions.length}+${data.sparringSessions.length}+${data.sparringSessions1v1.length}+${data.musicflowSessions.length} (total ${sessions}), ` +
    `habits=${habits}, movesTrained=${movesT}, notesOnDay=${notes}`
  );
}

console.log('── Per-day summary ──');
const da = computeDayData(DAY_A, { moves, reps, sparring, musicflow, habits, ideas, calendar });
const db = computeDayData(DAY_B, { moves, reps, sparring, musicflow, habits, ideas, calendar });
const dc = computeDayData(DAY_C, { moves, reps, sparring, musicflow, habits, ideas, calendar });
summarize('Day A', DAY_A, da);
summarize('Day B', DAY_B, db);
summarize('Day C', DAY_C, dc);

console.log('\n── Schema alignment ──');
const missingTop = DAY_DATA_FIELDS_READ_BY_DAYSECTIONS.filter(k => !(k in da));
if (missingTop.length === 0) {
  console.log('OK: every top-level field DaySections reads is present in useDayData output.');
} else {
  console.log('FAIL: top-level fields missing from useDayData output:', missingTop);
}

// Per-record presence — sample one record from each non-empty bucket on Day A.
console.log('\n── Per-record field presence (Day A samples) ──');

function checkFields(label, record, expected) {
  if (!record) { console.log(`  ${label}: no sample available`); return; }
  const missing = expected.filter(k => !(k in record));
  const optional = label.endsWith('_extras');
  const tag = missing.length === 0 ? 'OK' : (optional ? 'OPTIONAL-MISSING' : 'MISSING');
  console.log(`  ${label}: ${tag}${missing.length ? ' missing=' + fmt(missing) : ''}`);
}

const homeIdeaEvt = da.calendarEvents.find(e => e.source === 'home-idea');
const logTodayEvt = da.calendarEvents.find(e => e.source === 'log_today');
const battleEvt   = dc.calendarEvents.find(e => e.type === 'battle');
const condEvt     = dc.calendarEvents.find(e => e.type === 'conditioning');
checkFields('calendarEvent (home-idea) common', homeIdeaEvt, PER_RECORD_FIELDS.calendarEvent_common);
checkFields('calendarEvent (home-idea) extras', homeIdeaEvt, ['text', 'ideaId']);
checkFields('calendarEvent (log_today training) common', logTodayEvt, PER_RECORD_FIELDS.calendarEvent_common);
checkFields('calendarEvent (log_today training) extras', logTodayEvt, ['duration', 'categories', 'notes']);
checkFields('calendarEvent (battle) common', battleEvt, PER_RECORD_FIELDS.calendarEvent_common);
checkFields('calendarEvent (conditioning) common', condEvt, PER_RECORD_FIELDS.calendarEvent_common);

checkFields('repSession', da.repSessions[0], PER_RECORD_FIELDS.repSession);
checkFields('sparringSession (solo)', da.sparringSessions[0], PER_RECORD_FIELDS.sparringSession);
checkFields('moveTrained', da.movesTrained[0], PER_RECORD_FIELDS.moveTrained);

console.log('\n── Drift guard ──');
console.log('This script inlines computeDayData. If src/hooks/useDayData.js changes shape,');
console.log('this script will lie. Re-grep DaySections.jsx for `dayData\\.` to update.');
