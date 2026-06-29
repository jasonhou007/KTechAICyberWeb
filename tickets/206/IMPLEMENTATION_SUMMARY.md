# #206 — Ambient "Settlement Stream" — Implementation Summary

An always-on, no-click cinematic background that narrates KTech's fintech
product working: cross-border payment packets flowing China↔ASEAN rails,
blockchain blocks settling, an FX ticker drifting, a liquidity pool breathing.
Auto-plays on load, loops seamlessly forever, zero interaction.

## Coordinator scope decisions (implemented per these)
1. **Placement**: ambient background layer **inside Home.vue**, wired via
   `<LazySection>` + `defineAsyncComponent` (the #224 pattern). The 5 existing
   lazy modules remain the interactive surface; the stream sits as a 6th lazy
   child, positioned absolutely (z-index:0, pointer-events:none) so it reads as
   a backdrop spanning its section.
2. **Glitch transitions DEFERRED** (AC 2.1 → `[~]`): #224 removed glitch-flicker
   as a seizure hazard. NO glitch-flicker implemented. Everything ELSE in AC 2.1
   is done (neon rails, scanline overlay reuse, parallax depth, existing cyber
   palette). Follow-up #235 covers a seizure-safe variant.

## Files
- `src/composables/useSettlementStream.js` — loop brain (PURE fns + rAF + throttle + reduced-motion).
- `src/components/SettlementStream.vue` — thin presentation layer.
- `src/views/Home.vue` — wired `<SettlementStream>` as 6th lazy child.
- `src/locales/{en,zh}.json` — `settlementStream.*` namespace (+10 leaves each).
- `src/composables/__tests__/useSettlementStream.test.ts` — TDD unit tests.
- `src/components/__tests__/SettlementStream.test.ts` — component tests (REAL useLanguage).
- `src/components/__tests__/SettlementStream.visual-ac.test.ts` — CSS-source visual-AC gate.
- `src/__tests__/HomeSettlementStreamWiring.test.ts` — shipped-app wiring regression.
- `tests/e2e/206-settlement-stream.spec.ts` — live-DOM Playwright E2E.
- `src/views/__tests__/Home.test.ts` — updated LazySection count 5→6.

## Mechanic-triple (define-site / call-site / render-site — iter-23 gate)
Every mechanic has all three sites verified by grep:

| Mechanic | define-site | call-site (live path) | render-site (template) |
|---|---|---|---|
| (a) auto-start rAF on mount | `startRAF()` | `onMounted → updateRunning → startRAF` | `tick._lastNow`/packets render |
| (b) rail packets travel + settle | `tickPacket()` | `tick()` rAF loop L320 | `.ss-packet :style=translateX` |
| (c) blocks append + hash chain | `nextBlock()` | `appendBlock()` interval L281 | `.ss-block-height`/`.ss-block-hash` |
| (d) FX drifts | `tickFx()` | `driftFx()` interval L289-290 | `.ss-fx-rate` readout |
| (e) liquidity breathes | `liquidityPulse()` | `tick()` rAF loop L341 | `.ss-liquidity-fill :style=height` |
| (f) throttle offscreen (IO) | `intersectionObs.observe(rootRef.value)` | `onMounted` L468 (accepts `{rootRef}`, mirrors useParallax) | `isVisible→updateRunning→stopRAF/stopInterval` (red-test `useSettlementStream.test.ts:381`) |
| (g) throttle tab-hidden | `onVisibilityChange()` | `visibilitychange` listener | `isVisible` ref |
| (h) reduced-motion static | `snapshotReducedSummary()` | `updateRunning()` reduced branch | `reducedSummary` ref + `@media animation:none` |

Every returned ref (`packets`, `latestBlock`, `recentBlocks`, `settledCount`,
`fxRates`, `liquidity`, `reducedSummary`, `prefersReducedMotion`, `isVisible`,
`isMobile`) has a template consumer (grep-verified, no dead reactive state).

## Verification results (command-derived, pasted verbatim)

### Unit + component tests (vitest)
```
Test Files  91 passed (91)
Tests       2454 passed (2454)
Statements  95.27% (3913/4107)
Branches    84.52% (1852/2191)   [global; pre-existing baseline miss — fails at origin/main too]
Functions   95.65% (705/737)
Lines       96.8%  (3667/3788)
```
Per-file coverage (new files, recomputed from `coverage/coverage-final.json` because the istanbul text table truncates long filenames):
- `components/SettlementStream.vue`: statements 32/32 (100.0%), branches 8/8 (100.0%), functions 9/9 (100.0%)
- `composables/useSettlementStream.js`: statements 189/207 (91.3%), branches 85/119 (71.4%), functions 25/27 (92.6%)
  - The composable's uncovered arms are defensive SSR `typeof`/fallback guards and reduced-motion `else` branches — not core logic. The global 85% branch threshold is a pre-existing baseline miss (the repo is at ~84.5% at origin/main); #206 did not cause it. Optional follow-up: test the SSR/fallback arms to lift this.

### Build (vite)
```
✓ 153 modules transformed.
✓ built in 2.38s
```

### E2E (Playwright, chromium)
```
6 passed (29.4s)
```
All 6 tests green, including:
- AC1.1 auto-start: a packet's translateX advances with ZERO interaction.
- AC4.1 prefers-reduced-motion: reduce — stream serves a static summary.

### i18n parity (jq)
```
en: 1047 leaves
zh: 1047 leaves   (was 1037 each, +10)
```

### Shipped-app grep (iter-23 gate)
```
$ grep -rn "<SettlementStream" src/
src/views/Home.vue:91:        <SettlementStream data-test="settlement-stream" />
```
Hits the rendered view (Home.vue), not just tests.

### Bundle (perf, iter-16/31 — bytes re-derived via `stat -f %z` + `gzip -c | wc -c`, apples-to-apples vs an origin/main worktree build with the same node_modules)
- SettlementStream chunk: **7490 B raw / 3104 B gzip** (lazy-split, NOT in entry).
- Entry chunk (index): **155153 B raw / 56207 B gzip** (baseline 154169/55828 → +984 B raw / +379 B gzip, the async-component stub).
- Total JS: **481050 B raw / 166892 B gzip** (baseline 472576/163421 → +8474 B raw / +3471 B gzip for the new ambient layer).

### Lighthouse desktop (formFactor verified — iter-16; JSON artifact saved)
Artifacts: `tickets/206/evidence/lighthouse-desktop-206.report.json` (+ `.html`).
```
Accessibility: 96/100   (≥90 gate met)   [.categories.accessibility.score = 0.96]
Performance:   85/100                     [.categories.performance.score = 0.85]
configSettings.formFactor: desktop        [iter-16 device-class honesty gate]
configSettings.screenEmulation.mobile: false, width: 1350
```
The single color-contrast failure is a pre-existing Contact nav link
(`data-v-c970699f`, the Footer scoped hash) — NOT from the stream. The stream
introduces ZERO new a11y failures (`aria-hidden-focus: score=1`,
`aria-allowed-attr: score=1`).

## A11y (iter-28/31)
- `aria-hidden="true"` on the rail decoration layer (AC 4.4).
- Real readouts (blocks/FX/liquidity) are semantic + selectable, NOT aria-hidden.
- `<3Hz` animations (longest pulse 2.6s alternate = ~0.38Hz; packet 1.4s = ~0.71Hz).
- No strobe (glitch DEFERRED to #235).
- `prefers-reduced-motion` → `@media animation:none` + composable never starts rAF.
- Component tests mount via the REAL `useLanguage` composable (NOT mocked).

## Evidence
- `tickets/206/evidence/before-stream.png` — Home before stream mounts.
- `tickets/206/evidence/after-stream.png` — stream scrolled into view (rails + readouts visible).
- `tickets/206/evidence/reduced-motion-stream.png` — reduced-motion static summary.
- `tickets/206/evidence/lighthouse-desktop-206.report.json` (+ `.html`) — saved Lighthouse desktop run (a11y 96, perf 85, formFactor=desktop).

## Commits
- `121df89` #206 Add useSettlementStream composable + unit tests (TDD)
- `f61c474` #206 i18n en+zh for settlement stream copy
- `d6f930f` #206 Add SettlementStream.vue component + visual-AC tests
- `52872fd` #206 Wire SettlementStream into Home as ambient background
- `d6644fd` #206 Add Playwright E2E + evidence
- `5f5c195` #206 docs: save Lighthouse desktop artifact + reconcile perf (85 not 54) + total-gzip bytes
- `191f7e2` #206 fix(perf): observe stream root (not body) so offscreen throttle actually fires (AC 3.2, iter-23 gate)
