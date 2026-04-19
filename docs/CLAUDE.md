# CLAUDE.md

Before starting any task, read these files:
- docs/CORE_PRINCIPLES.md
- docs/MovesBook_NavigationArch_v5_4.md
- docs/MovesBook_DesignSystem_v2_0.md

## Rules
- Always ultrathink before making changes. Plan first, then implement. Never skip reasoning steps.
- Never modify files without understanding the current state first (grep/view before editing)
- Verify changes with a build check after every modification: `npx vite build --mode development 2>&1 | tail -5`
- All new UI strings require translation keys in ALL 12 languages: en, it, es, fr, pt, de, ja, zh, ru, ko, vi
- Only use icon names that exist in `src/components/shared/Ic.jsx` — check before adding any icon
