// Phase 2.5 round-2 verification — id-based session↔event echo linkage.
// Inlines findSessionEvent from src/components/home/DaySections.jsx and runs
// it against synthetic fixtures. No browser, no test framework.
//
// Run: node scripts/verify-session-event-linkage.mjs

// ─── findSessionEvent (verbatim logic from DaySections.jsx) ──────────────
function findSessionEvent(dayData, sessionRecord, sourceTag) {
  return (dayData.calendarEvents || []).find(
    e => e.source === sourceTag && e.sessionId === sessionRecord.id
  ) || null;
}

// ─── Fixtures ────────────────────────────────────────────────────────────
const fixtures = {
  day1: {
    label: 'Day 1: two drill sessions on same day, both with echoes',
    repSessions: [
      { id: 'd1', date: '2026-05-10', moveId: 'mvA' },
      { id: 'd2', date: '2026-05-10', moveId: 'mvB' },
    ],
    sparringSessions: [],
    sparringSessions1v1: [],
    musicflowSessions: [],
    calendarEvents: [
      { id: 'e1', source: 'rep_counter', sessionId: 'd1', date: '2026-05-10', type: 'training' },
      { id: 'e2', source: 'rep_counter', sessionId: 'd2', date: '2026-05-10', type: 'training' },
    ],
    expected: {
      d1: 'e1', d2: 'e2',
    },
    unreachableEchoes: [],
  },
  day2: {
    label: 'Day 2: spar solo + spar 1v1 + musicflow, all with echoes',
    repSessions: [],
    sparringSessions: [{ id: 's1', date: '2026-05-11' }],
    sparringSessions1v1: [{ id: 's2', date: '2026-05-11' }],
    musicflowSessions: [{ id: 'm1', date: '2026-05-11' }],
    calendarEvents: [
      { id: 'e3', source: 'sparring',  sessionId: 's1', date: '2026-05-11', type: 'training' },
      { id: 'e4', source: 'spar-1v1',  sessionId: 's2', date: '2026-05-11', type: 'training' },
      { id: 'e5', source: 'musicflow', sessionId: 'm1', date: '2026-05-11', type: 'training' },
    ],
    expected: {
      s1: 'e3', s2: 'e4', m1: 'e5',
    },
    unreachableEchoes: [],
  },
  day3: {
    label: 'Day 3: old data, session without echo',
    repSessions: [{ id: 'd3', date: '2026-05-12' }],
    sparringSessions: [],
    sparringSessions1v1: [],
    musicflowSessions: [],
    calendarEvents: [],
    expected: { d3: null },
    unreachableEchoes: [],
  },
  day4: {
    label: 'Day 4: old echo present but missing sessionId field',
    repSessions: [{ id: 'd4', date: '2026-05-13' }],
    sparringSessions: [],
    sparringSessions1v1: [],
    musicflowSessions: [],
    calendarEvents: [
      { id: 'e6', source: 'rep_counter', date: '2026-05-13', type: 'training' },
    ],
    expected: { d4: null },
    unreachableEchoes: ['e6'],
  },
  day5: {
    label: 'Day 5: orphan echo (sessionId points to deleted session)',
    repSessions: [],
    sparringSessions: [],
    sparringSessions1v1: [],
    musicflowSessions: [],
    calendarEvents: [
      { id: 'e7', source: 'rep_counter', sessionId: 'd99', date: '2026-05-14', type: 'training' },
    ],
    expected: {},
    unreachableEchoes: ['e7'],
  },
};

// ─── Run ─────────────────────────────────────────────────────────────────
let failed = 0;
let passed = 0;

for (const [dayKey, fx] of Object.entries(fixtures)) {
  console.log(`\n── ${dayKey.toUpperCase()}: ${fx.label} ──`);

  // For each session record, run findSessionEvent and compare to expected.
  const all = [
    ...fx.repSessions.map(r => ({ session: r, tag: 'rep_counter' })),
    ...fx.sparringSessions.map(s => ({ session: s, tag: 'sparring' })),
    ...fx.sparringSessions1v1.map(s => ({ session: s, tag: 'spar-1v1' })),
    ...fx.musicflowSessions.map(s => ({ session: s, tag: 'musicflow' })),
  ];

  for (const { session, tag } of all) {
    const result = findSessionEvent(fx, session, tag);
    const expectedEventId = fx.expected[session.id] ?? null;
    const actualEventId = result?.id ?? null;
    const ok = expectedEventId === actualEventId;
    if (ok) passed++; else failed++;
    console.log(
      `  ${ok ? 'PASS' : 'FAIL'}  session=${session.id} (${tag})  ` +
      `expected→${expectedEventId ?? 'null'}  actual→${actualEventId ?? 'null'}`
    );
  }

  // Reachability sweep: which echoes can be reached by tapping any session row?
  const reachable = new Set();
  for (const { session, tag } of all) {
    const r = findSessionEvent(fx, session, tag);
    if (r) reachable.add(r.id);
  }
  const allEchoIds = fx.calendarEvents.map(e => e.id);
  const unreachable = allEchoIds.filter(id => !reachable.has(id));
  const unreachableMatch =
    unreachable.length === fx.unreachableEchoes.length &&
    unreachable.every(id => fx.unreachableEchoes.includes(id));
  if (unreachableMatch) passed++; else failed++;
  console.log(
    `  ${unreachableMatch ? 'PASS' : 'FAIL'}  ` +
    `unreachable echoes  expected→[${fx.unreachableEchoes.join(',')}]  ` +
    `actual→[${unreachable.join(',')}]`
  );
}

// ─── Cross-tool collision check ─────────────────────────────────────────
// Same id value used as session.id across different kinds should not pull a
// wrong-tool echo because source tag is part of the predicate.
console.log(`\n── COLLISION: same id across tools, source tag must disambiguate ──`);
{
  const collisionDay = {
    calendarEvents: [
      { id: 'eA', source: 'rep_counter', sessionId: 'x',   date: '2026-05-15', type: 'training' },
      { id: 'eB', source: 'sparring',    sessionId: 'x',   date: '2026-05-15', type: 'training' },
    ],
  };
  const r1 = findSessionEvent(collisionDay, { id: 'x' }, 'rep_counter');
  const r2 = findSessionEvent(collisionDay, { id: 'x' }, 'sparring');
  const ok1 = r1?.id === 'eA';
  const ok2 = r2?.id === 'eB';
  if (ok1) passed++; else failed++;
  if (ok2) passed++; else failed++;
  console.log(`  ${ok1 ? 'PASS' : 'FAIL'}  id=x tag=rep_counter → ${r1?.id}  (expected eA)`);
  console.log(`  ${ok2 ? 'PASS' : 'FAIL'}  id=x tag=sparring    → ${r2?.id}  (expected eB)`);
}

console.log(`\n── SUMMARY ──`);
console.log(`Passed: ${passed}   Failed: ${failed}`);
process.exit(failed === 0 ? 0 : 1);
