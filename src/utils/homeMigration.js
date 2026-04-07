/**
 * One-time migration: converts old blocks → routine tiles,
 * habits → goalhabit tiles, pinned goals → goalhabit tiles.
 *
 * Safe to call multiple times — guarded by mb_home_migrated flag.
 */
export function runHomeMigration(blocks, habits, ideas, homeStack, setHomeStack) {
  // Already migrated
  if (localStorage.getItem("mb_home_migrated")) return;

  // User already has tiles — set flag and skip
  if (homeStack?.defaultStack?.length > 0) {
    localStorage.setItem("mb_home_migrated", "1");
    return;
  }

  const defaultStack = [];

  // 1. Blocks → routine tiles
  if (Array.isArray(blocks)) {
    blocks.forEach(b => {
      defaultStack.push({
        id: String(b.id),
        type: "routine",
        emoji: b.emoji || "",
        name: b.name || "",
        duration: b.duration || 0,
        description: b.description || "",
        checkable: b.checkable ?? true,
        repeat: b.repeat || { type: "daily", days: [] },
        timeOfDay: b.timeOfDay || "morning",
      });
    });
  }

  // 2. Habits → goalhabit tiles
  if (Array.isArray(habits)) {
    habits.forEach(h => {
      defaultStack.push({
        id: "gh_" + h.id,
        type: "goalhabit",
        refId: String(h.id),
      });
    });
  }

  // 3. Pinned goals → goalhabit tiles
  if (Array.isArray(ideas)) {
    ideas.forEach(idea => {
      if (idea.pinned && (idea.type === "goal" || idea.type === "target")) {
        defaultStack.push({
          id: "gh_" + idea.id,
          type: "goalhabit",
          refId: String(idea.id),
        });
      }
    });
  }

  if (defaultStack.length > 0) {
    setHomeStack({ defaultStack, overrides: {} });
  }

  localStorage.setItem("mb_home_migrated", "1");
}
