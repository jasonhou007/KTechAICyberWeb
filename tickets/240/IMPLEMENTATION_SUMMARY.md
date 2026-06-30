# #240 — Remove the performance-monitoring (RUM) beacon

**Branch:** `autodev-240-remove-rum` (base `origin/main` `d8a3f90`)
**Type:** Deletion archetype (iter-14/30)
**Decision:** Full removal (ticket default — "Default: remove the panel")

## Problem
The #187 RUM feature rendered a performance-monitoring debug panel on the live
page (性能监控 / Performance monitor / Real-user Core Web Vitals / metrics table /
Clear history) — dev/debug tooling leaking into production.

## What was removed (one atomic deletion)

| Removed | What it was |
|---|---|
| `src/composables/useRumBeacon.js` (526 LOC) | The RUM beacon composable (web-vitals observers, sendBeacon dispatch, localStorage ring buffer) |
| `src/composables/__tests__/useRumBeacon.test.ts` (525 LOC) | Its 15-case unit suite |
| `src/components/RumDashboard.vue` (346 LOC) | The visible dashboard panel component |
| `src/components/__tests__/RumDashboard.test.ts` (302 LOC) | Its unit suite |
| `tests/e2e/187-rum-beacon.spec.ts` (187 LOC) | The Playwright live-wiring E2E spec |
| `web-vitals` npm dependency | Was ONLY used by `useRumBeacon`'s dynamic import |
| `rumEnabled` preference + `setRumEnabled` action | state, persist, hydrate, reset entries |
| `rum.*` i18n keys (22 leaf keys × 2) | en.json + zh.json `rum` block |
| App.vue wiring | `RumDashboard` import/registration, `useRumBeacon()` call-site, `provide('rum', ...)`, `rumMounted` ref+gate, `<RumDashboard class="footer-rum">` template node |

The footer (`status-dot` + status text + copyright + links) is intentionally
kept intact — only the RUM child was removed.

## Files changed
**Deleted (5):** `useRumBeacon.js`, `useRumBeacon.test.ts`, `RumDashboard.vue`, `RumDashboard.test.ts`, `187-rum-beacon.spec.ts`
**Modified (8):** `src/App.vue`, `src/stores/preferences.js`, `src/stores/__tests__/preferences.test.ts`, `tests/unit/stores-preferences.spec.js`, `src/locales/en.json`, `src/locales/zh.json`, `package.json`, `package-lock.json`
**Added (1):** `src/__tests__/App.no-rum.test.ts` (deletion-honesty gate)
**Extended (1):** `src/__tests__/App.nav-wiring.test.ts` (live-DOM shipped-app proof)
**Comment-only (2):** `tests/unit/bundle-size.spec.js`, `tests/e2e/188-css-purge.spec.ts`

**Net:** 13 files changed, +70 / −2100 in the deletion commit; +187 / −1 in the proof-tests commit.

## Commits
1. `4ee2c3f` `#240 remove RUM beacon + performance-monitoring panel from production` — the deletion + dependent test updates.
2. `7d1d44a` `#240 add deletion-honesty + shipped-app proof tests for RUM removal` — the structural proof + evidence.

## Gates

### Deletion honesty (iter-14/30)
- **Removed suites = exact failure-delta:** baseline 96 files / 2527 tests → after deletion 95 files / 2477 tests (−2 files: RumDashboard.test.ts + useRumBeacon.test.ts; −50 tests). The e2e spec is not counted by vitest. No collateral failures.
- **No dangling references:** `grep -rnE '\b(useRumBeacon|RumDashboard|setRumEnabled|rumEnabled|footer-rum|VITE_RUM|window\.__rum|ktech-rum-history|cwv-v1|web-vitals)\b' src/` → matches ONLY inside the new `App.no-rum.test.ts` (which asserts their absence) + one RED-proof comment. Zero in shipped source.
- **Bundle shrinks:** web-vitals async chunk (2,556 gzip) gone; index entry −3,148 gzip (RumDashboard wiring removed). Total **170,305 → 164,141 gzip (−5,730 / −3.4%, 31 → 30 chunks)**.

### Shipped-app verification (iter-23 wired-not-just-tested)
`src/__tests__/App.nav-wiring.test.ts` mounts the REAL App (no child mocked) and
asserts `footer.cyber-footer` renders WITHOUT `.rum-dashboard` /
`[data-test="rum-toggle"]` / `.footer-rum`, while `.status-dot` survives.
Against the production `vite preview` build, Playwright confirmed:
`rumDashboard=0, rumToggle=0, footerRum=0, footerPresent=1, statusDot=1, consoleErrors=[]`.

### Visual evidence (iter-13/15 visual gate)
- `tickets/240/evidence/before-footer.png` — RUM panel visible (Performance
  monitor / Latest Reading: TTFB / metrics table / Clear history).
- `tickets/240/evidence/after-footer.png` — clean footer, no RUM UI.

### i18n parity (en/zh)
Both locales: 27 top-level keys (was 28), `rum` block removed, no key drift
(only-in-en ∅, only-in-zh ∅).

### Build / vitest / coverage
- `npm run build`: green.
- `npx vitest run`: **96 files / 2493 tests pass**, 0 fail.
- Coverage: **Statements 95.18%, Branches 85.03%, Functions 96.02%, Lines 96.54%** (gates ≥80% / branch 85%).

### Reconciliation (iter-27)
- **#187** (CWV RUM beacon): already CLOSED (Done) — the feature this ticket removes. No state change needed.
- **#217** (remote RUM aggregation dashboard, #187 follow-up): its premise ("#187 ships client-side RUM + local dashboard") is now obsolete. Closed as obsolete in the PR cycle with a pointer to #240.

## Risk
Low. Pure deletion of an opt-in, self-contained feature. No API contract, no
backend, no other component imported RumDashboard or useRumBeacon. The footer
shell + all other features are visually + functionally unchanged (proven by the
full vitest suite + the live-DOM gate).
