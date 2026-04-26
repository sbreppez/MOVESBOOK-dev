# Capacitor Compatibility

The plan and standing rules for wrapping MovesBook as a native iOS / Android app via Capacitor. Read this before touching auth, share, download, camera, external URLs, or the Firebase / EmailJS bootstrap.

The codebase is the source of truth. If anything below contradicts the actual code, the code wins — flag it and update this doc.

---

## 1. Status (April 2026)

The app is currently a PWA. Capacitor wrapping is the target once the app is feature-complete. The codebase is **largely Capacitor-compatible** — the bulk of layout, storage, and state management already works in a WebView. Concrete blockers and risks are bounded and listed below.

This document covers three open issues:
- **#14** — Firebase Auth platform-detection wrapper plan
- **#15** — Firebase + EmailJS bundling assessment
- **#16** — Standing rule: don't extend Capacitor-unfriendly patterns

---

## 2. Inventory: blockers and risks

### Blockers (will not work in Capacitor WebView as written)

| # | Pattern | Sites | Impact |
|---|---------|-------|--------|
| B1 | `signInWithPopup` / `signInWithRedirect` | [index.html:64-78](../index.html) (`window.__MB_AUTH__`) | Google OAuth fails in WebView. Email/password works as-is. |
| B2 | `navigator.share({ files })` | [BattleDayView.jsx:534,748](../src/components/train/BattleDayView.jsx), [Sparring.jsx:1109](../src/components/train/Sparring.jsx), [Spar1v1.jsx:373](../src/components/train/Spar1v1.jsx), [CompetitionSimulator.jsx:641](../src/components/battle/CompetitionSimulator.jsx), [ShareCardOverlay.jsx:117](../src/components/shared/ShareCardOverlay.jsx) | Files-with-share has limited WebView support. Falls back gracefully (the code already gates on `navigator.canShare`), but the share itself becomes a download. |
| B3 | `capture="camera"` / `capture="environment"` on `<input type="file">` | [BattleDayView.jsx:560](../src/components/train/BattleDayView.jsx), [Sparring.jsx:1133](../src/components/train/Sparring.jsx), [CompetitionSimulator.jsx:685](../src/components/battle/CompetitionSimulator.jsx), [ShareCardOverlay.jsx:141](../src/components/shared/ShareCardOverlay.jsx) | Inconsistent across iOS / Android WebViews. `@capacitor/camera` is the reliable path. |
| B4 | CDN-loaded Firebase + EmailJS | [index.html:40-42,315](../index.html) | App fails to bootstrap offline; first-launch on metered network is slow. |

### Risks (work today but rely on fragile assumptions)

| # | Pattern | Sites | Impact |
|---|---------|-------|--------|
| R1 | `window.open(url, "_blank")` for external URLs | [BattleDayView.jsx:227](../src/components/train/BattleDayView.jsx), [BattlePrepPage.jsx:536,543](../src/components/train/BattlePrepPage.jsx), [HomeTile.jsx:207](../src/components/home/HomeTile.jsx), [RivalsPage.jsx:188](../src/components/battle/RivalsPage.jsx) | Opens in system browser on iOS, in-WebView on Android by default. `@capacitor/browser` gives consistent in-app browser behavior. |
| R2 | Google Fonts loaded from CDN | [index.html:14-18](../index.html) | App renders without fonts on first offline launch. Tolerable; not a blocker. |
| R3 | `vh` / `dvh` units | grep before adding | Status bar + soft keyboard miscalculate. CORE_PRINCIPLES already calls this out. |
| R4 | `position: fixed` on full-screen overlays | tracked separately in #114 | Status bar overlap. CORE_PRINCIPLES already calls this out. |

### Already Capacitor-friendly
- `localStorage` works (with lower per-origin quotas than browser — keep mb_* keys lean)
- React + Vite build output works inside WebView with no special bundler config beyond what Capacitor's CLI generates
- `position: absolute`, design tokens, theme switching — all WebView-safe
- Email/password Firebase auth path — works via the same Firebase JS SDK

---

## 3. Plan: Firebase Auth wrapper (#14)

### Recommended plugin
[`@capacitor-firebase/authentication`](https://github.com/capawesome-team/capacitor-firebase) (capawesome team). Maintained, broad provider support (Google, Apple, email/password), official-quality API.

### Abstraction interface (draft — verify at implementation time)
A single module exports the same surface the app calls today, with platform detection picking the implementation:

```js
// src/services/auth.js (proposed)
import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();

export const auth = {
  signIn:        () => isNative ? nativeSignInGoogle() : webSignInPopup(),
  signInEmail:   (e, p) => /* same on both, uses Firebase JS SDK */,
  signUpEmail:   (e, p) => /* same on both */,
  signOut:       () => isNative ? nativeSignOut() : webSignOut(),
  resetPassword: (e)   => /* same on both */,
  onAuthStateChanged: (cb) => /* same on both, JS SDK */,
};
```

The native path delegates to the plugin; the web path keeps the current `signInWithPopup` → `signInWithRedirect` fallback.

### Integration touchpoints
The current code uses `window.__MB_AUTH__` (a global set in [index.html:64-78](../index.html)). Migration:
1. Move auth bootstrap from the inline script in index.html into a new `src/services/auth.js`
2. Replace `window.__MB_AUTH__` references in App.jsx and components with imports from the new module
3. Add the platform-detection branch only inside the new module
4. Once stable, remove the inline script from index.html (also addresses part of #15)

### Why not now
- The implementation requires a Capacitor project to test against. Without it, the native branch is unverifiable.
- The current web-only code is correct and working. No bug to fix.
- Doing the abstraction *just before* the Capacitor wrap (not now) lets the plugin's actual API drive the interface, rather than a draft I'd have to revise.

**Track implementation as a separate ticket when the Capacitor wrap session is scheduled.**

---

## 4. Plan: bundle CDN dependencies (#15)

### Current CDN scripts in index.html
| Source | URL | Approx gzip size |
|--------|-----|------------------|
| Firebase app-compat | `gstatic.com/firebasejs/10.12.0/firebase-app-compat.js` | ~30 KB |
| Firebase auth-compat | `gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js` | ~50 KB |
| Firebase firestore-compat | `gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js` | ~120 KB |
| EmailJS | `cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js` | ~6 KB |
| Google Fonts (×5) | `fonts.googleapis.com/css2?...` | tiny CSS, but blocking |

### Bundling approach

**Firebase: switch from compat to modular SDK.** The compat SDK is a legacy bundle that includes everything; the modular SDK (Firebase v9+) tree-shakes to just what the app uses. With the app calling `auth()`, `firestore()`, basic `signInWith*`, and `onSnapshot`, the modular bundle is meaningfully smaller than compat.

```js
// Estimated modular footprint for what MovesBook uses:
import { initializeApp } from 'firebase/app';            // ~10 KB
import { getAuth, signInWithPopup, ... } from 'firebase/auth';      // ~70 KB
import { getFirestore, doc, onSnapshot, ... } from 'firebase/firestore'; // ~100 KB
// Total: ~180 KB gzipped (vs ~200 KB compat)
```

The size win is modest but the bigger benefit is offline-first bootstrap — the app starts without network. It also unblocks proper bundle splitting if needed later.

**EmailJS: bundle directly.** `npm install @emailjs/browser`. ~6 KB gzipped. Trivial to migrate.

### Estimated total bundle impact
Current main bundle: 2,206 KB / 672 KB gzipped (last build).
Post-bundling estimate: +180 KB gzipped for Firebase, +6 KB for EmailJS = **~860 KB gzipped total**. Worth code-splitting at that point (issue #67-adjacent), but not a blocker.

### Why not now
- The *measurement* must happen at migration time with real `npm install` runs and real bundle output. Estimates above are good enough for go/no-go but not for committing actual numbers.
- Migrating Firebase from compat to modular touches every call site in index.html (the inline script) and App.jsx (the consumer). That's a significant refactor that should happen alongside the auth wrapper (#14) so it's done once, not twice.

**Track migration as a separate ticket. Recommended: bundle in the same session as the #14 auth wrapper, so index.html's inline script is dismantled once.**

---

## 5. Standing rule: do not extend Capacitor-unfriendly patterns (#16)

When adding new code that touches any of these areas, **stop and read this document first**. Then either:
1. **Use the existing wrapper / abstraction** if one exists, or
2. **Add the abstraction** if you're the first to need it (and update this doc), or
3. **Flag the Capacitor risk** in the PR description and the implementing issue.

### Patterns to avoid extending

| Don't introduce | Use instead | Why |
|-----------------|-------------|-----|
| `signInWithPopup`, `signInWithRedirect` | The auth wrapper (once #14 ships); for now, route through `window.__MB_AUTH__` | OAuth popups don't work in WebView |
| `navigator.share({ files })` | The current `canShare`-gated pattern is OK as fallback. Don't add new share-with-files sites without reading this doc. | WebView support is partial |
| `<input capture="...">` | `@capacitor/camera` plugin (when wrapping); for now, accept the limitation | Inconsistent across platforms |
| `window.open(url, "_blank")` | OK for now; mark for migration to `@capacitor/browser` at wrap time | Inconsistent open behavior |
| New CDN scripts in `index.html` | `npm install` + bundle via Vite | Offline bootstrap |
| `vh` units | Pixel values, or `100%` of a known parent | Status bar / keyboard miscalculation |
| `position: fixed` for full-screen overlays | `position: absolute` (see #114) | Status bar overlap |
| New `localStorage` keys without `mb_` prefix | `mb_<feature>_<thing>` | Project convention; also helps quota auditing |

### Patterns that are fine
- Read-only `localStorage`
- `position: absolute`, flex/grid layouts, pixel sizing
- React state, hooks, context
- Firebase modular SDK calls (when migrated) — same JS API on web and Capacitor
- `URL.createObjectURL` for in-memory blobs (used by share-card download paths)

### When in doubt
- Grep this doc's blocker/risk table for the API you're about to use.
- If it's not listed and feels native-y (camera, push, biometrics, file system, deep links, etc.), assume it needs a Capacitor plugin and flag before coding.

---

## 6. How to use this document

- **Before any task touching auth, share, download, camera, external URLs, or `index.html`'s bootstrap:** read sections 2 and 5.
- **When discovering a new blocker or risk:** add it to section 2 in the same PR that surfaces it.
- **When the Capacitor wrap session is scheduled:** sections 3 and 4 are the implementation briefs — verify the plugin APIs are still current, run real bundle measurements, then file implementation tickets.
- **When something here disagrees with the code:** the code wins. Update this doc.

---

## 7. Out of scope of this document
- Native-only feature ideas (push notifications, deep links, biometrics) — file as feature requests when relevant
- Code-splitting / lazy-loading for bundle size — adjacent to #15 but its own concern (issue #67 area)
- The actual Capacitor project setup (`capacitor init`, native shells, store assets) — happens at wrap time
