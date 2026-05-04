/**
 * Returns today's date as YYYY-MM-DD in the device's local timezone.
 * NEVER use new Date().toISOString().split("T")[0] — that's UTC and wrong for half the world.
 */
export function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Converts any Date object (or date string) to YYYY-MM-DD in local timezone.
 */
export function toLocalYMD(date) {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Converts a date input to YYYY-MM-DD with short-circuit for already-formatted strings.
 * Returns null for falsy/invalid inputs.
 */
export function toYMD(d) {
  if (!d) return null;
  if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  try { return toLocalYMD(d); } catch { return null; }
}
