import { computeDayMap } from '../components/train/battlePrepHelpers';
import { todayLocal } from './dateUtils';

// Returns YYYY-MM-DD of the next future training day in the active battle plan,
// or "" if none. Used by AddToHome entry points to prefill NoteModal's showDate
// so a thought captured during reflection lands on the next training day's HOME.
export const getNextTrainingDay = (battleprep) => {
  try {
    const today = todayLocal();
    const plans = battleprep?.plans || [];
    const activePlan = plans.find(p => {
      if (p?.archived) return false;
      const battles = p?.battles || [];
      return battles.some(b => b?.date >= today);
    });
    if (!activePlan) return "";
    const { dayMap } = computeDayMap(activePlan);
    if (!dayMap) return "";
    const futureTrainingDays = Object.keys(dayMap)
      .filter(d => d >= today && dayMap[d]?.type === "training")
      .sort();
    return futureTrainingDays[0] || "";
  } catch (e) {
    console.warn("[MB] getNextTrainingDay lookup failed:", e);
    return "";
  }
};
