export const SCHEMA_VERSION = "5";

export function migrateMove(m) {
  return {
    ...m,
    id:          m.id          || Date.now(),
    name:        m.name        || "",
    category:    m.category    || "Footworks",
    mastery:     typeof m.mastery === "number" ? m.mastery : 0,
    status:      "wip",
    description: m.description || "",
    notes:       m.notes       || "",
    link:        m.link        || "",
    date:        m.date        || Date.now(),
    attrs:       m.attrs       || {},
    difficulty:  m.difficulty  || null,
    origin:      m.origin      || "learned",
    musicEnergy: m.musicEnergy || null,
    domains:     Array.isArray(m.domains) ? m.domains : [],
    prevDate:    m.prevDate    || null,
    parentId:    m.parentId    || null,
  };
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
  } catch {}
}

export function debounce(fn, ms) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}
