/**
 * Mastery Decay — computed display mastery (non-destructive)
 *
 * The stored mastery value is never mutated.  These pure functions
 * derive display mastery from move.mastery, move.date, move.difficulty,
 * and the user's decaySensitivity setting.
 */

const RATES = { off: 0, gentle: 0.5, normal: 1, aggressive: 1.5 };
const GRACE_DAYS = 30;
const DIFF_MULT = { easy: 0.7, advanced: 1.5 };   // mirrors GAPTab pattern
const ARROW_THRESHOLD = 15;                         // show ▼ after 15%+ cumulative

/**
 * @param {{ mastery:number, date:string|null, difficulty:string|null }} move
 * @param {string} decaySetting  "off"|"gentle"|"normal"|"aggressive"
 * @returns {{ displayMastery:number, decayAmount:number }}
 */
export function computeDecay(move, decaySetting = "normal") {
  const base = typeof move.mastery === "number" ? move.mastery : 0;
  const rate = RATES[decaySetting] ?? 0;

  if (rate === 0 || base === 0 || !move.date) {
    return { displayMastery: base, decayAmount: 0 };
  }

  const lastMs = new Date(move.date).getTime();
  if (isNaN(lastMs)) return { displayMastery: base, decayAmount: 0 };

  const daysSince = Math.floor((Date.now() - lastMs) / 86400000);
  const diffMult = DIFF_MULT[move.difficulty] || 1;
  const grace = Math.round(GRACE_DAYS * diffMult);

  if (daysSince <= grace) return { displayMastery: base, decayAmount: 0 };

  const periods = Math.floor((daysSince - grace) / 2);
  const decay = Math.min(base, Math.round(periods * rate));
  return { displayMastery: Math.max(0, base - decay), decayAmount: decay };
}

/**
 * Show the red ▼ indicator?  Only after 15%+ cumulative decrease.
 */
export function showDecayArrow(move, decaySetting = "normal") {
  return computeDecay(move, decaySetting).decayAmount >= ARROW_THRESHOLD;
}
