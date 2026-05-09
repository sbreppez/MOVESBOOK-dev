export const SCHEMA_VERSION = "5";

export function migrateMove(m) {
  return {
    ...m,
    id:          m.id          || Date.now(),
    name:        m.name        || "",
    category:    m.category    || "Footworks",
    mastery:     typeof m.mastery === "number" ? m.mastery : 0,
    description: m.description || "",
    notes:       m.notes       || "",
    link:        m.link        || "",
    date:        m.date        || Date.now(),
    attrs:       m.attrs       || {},
    difficulty:  m.difficulty  || null,
    origin:      m.origin      || "learned",
    musicEnergy: m.musicEnergy || null,
    tensionRole: m.tensionRole || null,
    domains:     Array.isArray(m.domains) ? m.domains : [],
    prevDate:    m.prevDate    || null,
    parentId:    m.parentId    || null,
    journal:     Array.isArray(m.journal) ? m.journal : [],
  };
}

export function migrateIdea(i) {
  if (!i) return i;
  const journal = Array.isArray(i.journal) ? i.journal.map(entry => {
    if (!entry || typeof entry.date !== 'string') return entry;
    if (/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) return entry;
    const parsed = new Date(entry.date);
    if (Number.isNaN(parsed.getTime())) return entry;
    const yyyy = parsed.getFullYear();
    const mm = String(parsed.getMonth() + 1).padStart(2, '0');
    const dd = String(parsed.getDate()).padStart(2, '0');
    return { ...entry, date: `${yyyy}-${mm}-${dd}` };
  }) : i.journal;
  return { ...i, journal };
}

export function loadLocal(key, fallback) {
  try {
    const v = localStorage.getItem("mb_data_version");
    if (v !== SCHEMA_VERSION) return fallback;
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : fallback;
  } catch { return fallback; }
}

export function saveLocal(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
    localStorage.setItem("mb_data_version", SCHEMA_VERSION);
  } catch(e) {
    console.warn("[MB] localStorage write failed (likely quota):", key, e);
  }
}

export function debounce(fn, ms) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}

export function unwrapPhoto(raw) {
  if (!raw || raw === "null" || raw === '"null"') return null;
  let val = raw;
  while (typeof val === 'string' && val.startsWith('"') && val.endsWith('"')) {
    try { const parsed = JSON.parse(val); if (parsed === val) break; val = parsed; } catch { break; }
  }
  return (typeof val === 'string' && val.startsWith('data:')) ? val : null;
}
