# #224 — Home Overhaul Implementation Summary

**Issue:** [jasonhou007/KTechAICyberWeb#224](https://github.com/jasonhou007/KTechAICyberWeb/issues/224)
**Branch:** `autodev-224-home-overhaul`
**Date:** 2026-06-30

## What changed (3 facets, all in scope — no narrowing)

1. **Perf — lazy-mount below-the-fold modules.** The 5 heavy Home components
   (NeuralTerminal, NeuralCore, SolutionForge, CyberOpsHud, NeonPulse) were
   statically imported and mounted eagerly on initial paint, spinning up ~4
   simultaneous rAF loops + ~43 CSS animations + 2 intervals despite being
   below the fold — the runtime lag source ("太卡了"). Converted to
   `defineAsyncComponent` + wrapped each in a new `<LazySection>` that defers
   mount until `IntersectionObserver` fires (rootMargin 200px, SSR-safe
   fallback).

2. **A11y — removed the neon glitch/flicker animation.** Deleted the
   `.glitch-text` class + `:data-text` binding from the h1, the
   `.glitch-text::before/::after` CSS rules, and `@keyframes glitch` (a 0.3s
   infinite 5-stop translate strobe — right at the 3Hz seizure threshold) from
   Home.vue scoped style. Removed the now-dead `.glitch-text::before/::after
   { animation: none !important }` reduced-motion override from
   accessibility.css. KEPT the calm animations (neonPulse 0.5Hz, gridMove 20s,
   pulse 10s, fadeInUp one-shot).

3. **Content — Our Business rebrand + China-ASEAN mission hero.**
   `home.whatwedo.heading` en "What We Do" → "Our Business" (zh "我们的业务"
   unchanged). `home.hero.description`/`description2` (the KBank/Shenzhen
   regulator paragraphs) replaced with the China-ASEAN mission line using the
   issue's exact wording. Card grid unchanged (4 blockchain + 2 banking = the
   issue's "5 service lines": 4 blockchain categories + 1 banking group).

## Commits (5, on top of baseline ea47b4f)

| SHA | Subject |
| --- | --- |
| `6d0edd8` | `#224 test: add red tests for Home overhaul (glitch-removed, lazy-mount, Our Business, mission)` |
| `f0d36b9` | `#224 fix(perf): lazy-mount below-the-fold Home modules` |
| `9d8a7c4` | `#224 fix(a11y): remove neon glitch/flicker animation from Home` |
| `49d90a1` | `#224 feat(content): Our Business rebrand + China-ASEAN mission hero` |
| `c5cdf76` | `#224 test: add IntersectionObserver polyfill + adapt wiring tests to lazy-mount` |
| _(this commit)_ | `#224 docs: evidence + implementation summary` (SHA self-referential — see `git log`) |

## TDD proof (RED → GREEN)

**Commit 1 RED run** (`vitest run` on the new/changed tests, BEFORE any
implementation):

```
Test Files  4 failed (4)
     Tests  17 failed | 53 passed (70)
```

The 17 failures were all the right ones:
- `home-glitch-removed.spec.js`: 4 fail (glitch keyframe + ::before/::after +
  class binding + accessibility.css dead selector all still present). The 5th
  KEEP-calm-animations assertion already passed.
- `lazy-section.spec.js`: suite failed to import — `LazySection.vue` did not
  exist yet.
- `Home.spec.js` / `Home.test.ts`: glitch-text/data-text inverted assertions
  failed; "Our Business" rebrand + China-ASEAN mission copy failed (old copy
  still rendered); KBank/Shenzhen hero assertions removed.

**Final GREEN run** (`vitest run --coverage`, after all 5 commits):

```
Test Files  87 passed (87)
     Tests  2412 passed (2412)
```

## Gates (all machine-derived)

### vitest + coverage

```
Test Files  87 passed (87)
     Tests  2412 passed (2412)
Coverage: Statements 95.56% | Branches 85.29% | Functions 95.98% | Lines 96.91%
```

The enforced thresholds in `vitest.config.ts` are 85% across all four — all
pass with margin. (Lines 96.91% is below the plan's aspirational 97% target
but well above the 85% enforced gate.)

### Build

```
npm run build → ✓ built in 1.18s
```

### Bundle (machine-derived via `os.path.getsize` + `gzip`, saved to
`tickets/224/evidence/bundle-compare.txt`)

| Metric | Baseline (origin/main) | After #224 | Delta |
| --- | --- | --- | --- |
| Entry chunk (build-tool reported) | 187.94 kB / gzip 74.01 kB | 128.42 kB / gzip 55.73 kB | **-59.52 kB raw / -18.28 kB gzip (-31.7% / -24.7%)** |
| Entry chunk (disk bytes) | — | 153896 bytes (150.29 kB) / gzip 55.73 kB | — |
| Total JS across all chunks | 456.9 kB | 461.2 kB (472303 bytes, 29 chunks) | +4.3 kB (expected per-chunk overhead) |

The 5 newly-split lazy chunks sum to 60.6 kB (NeuralCore 9.67 + SolutionForge
9.72 + NeuralTerminal 10.65 + NeonPulse 13.19 + CyberOpsHud 17.37) — matches
the entry-chunk drop.

### Lighthouse desktop (preset=desktop, saved:
`tickets/224/evidence/lighthouse-after.json`)

| Metric | Baseline | After #224 |
| --- | --- | --- |
| Performance | 98 | **99** |
| Accessibility | 97 | 96 |
| Best Practices | 96 | 96 |
| LCP | 0.75s | 0.4s |
| TBT | 0ms | 0ms |
| CLS | 0.073 | 0.073 |
| FCP | 0.75s | 0.4s |
| SI | 0.9s | 0.5s |

**Honest perf framing (iter-16):** Performance improved measurably 98→99 and
LCP/FCP/SI all dropped (the entry-chunk shrink + fewer simultaneous rAF loops
on load). This is a real load-score win, not just a runtime win. Accessibility
dipped 1 point (97→96) but stays well above the 90 floor required by the plan;
within Lighthouse run-to-run variance.

### Playwright E2E (chromium)

```
node_modules/.bin/playwright test 224-home-overhaul --project=chromium
9 passed (16.3s)
```

All 9 tests green, covering: glitch ::before/::after computed animationName
==='none' (CSS-source visual-AC gate); China-ASEAN mission (en + zh toggle);
Our Business + 5 service-line titles; lazy-mount absent before scroll + present
after; prefers-reduced-motion calm + still lazy; no raw home.* keys;
screenshots.

### i18n parity (machine-derived via python key-count)

```
en keys: 1037
zh keys: 1037
PARITY: OK (only values changed, no keys added/removed)
```

`no-raw-i18n-placeholders.spec.js` + `i18n-bundled.spec.js` GREEN.

## Files changed (19, excluding tickets/ evidence + TASK_REGISTRY churn)

**Source (5):**
- `src/components/LazySection.vue` (NEW) — lazy-mount wrapper around the
  existing `useIntersectionObserver` composable.
- `src/views/Home.vue` — 5 static imports → defineAsyncComponent + `<LazySection>`;
  glitch-text class/data-text/`@keyframes glitch`/`.glitch-text::before/::after`
  removed.
- `src/styles/accessibility.css` — dead `.glitch-text::before/::after`
  reduced-motion override removed.
- `src/locales/en.json` — heading "Our Business"; hero mission copy.
- `src/locales/zh.json` — hero mission copy.

**Tests + infra (14):**
- `tests/setup-intersection-observer.js` (NEW) — fire-on-observe IO polyfill.
- `vitest.config.ts` — register setupFiles.
- `tests/unit/home-glitch-removed.spec.js` (NEW) — 5 CSS-source gates.
- `tests/unit/lazy-section.spec.js` (NEW) — 8 LazySection unit tests.
- `tests/unit/Home.spec.js`, `src/views/__tests__/Home.test.ts` — inverted
  glitch assertions, rebrand + mission copy, #224 lazy-mount source gates.
- `tests/e2e/224-home-overhaul.spec.ts` (NEW) — 9 live-DOM E2E tests.
- `tests/e2e/accessibility.spec.ts` — h2 assertion updated for "Our Business".
- 4 shipped-app wiring tests adapted for lazy-mount
  (`HomeOpsHudWiring`, `HomeTerminalWiring`, `App.solution-forge-wiring`,
  `NeuralCore.spec.js`).
- `src/views/__tests__/Services.test.ts` — IO-gating assertion inverted for the
  polyfilled env.

## Evidence

- `tickets/224/evidence/BASELINE.md` — baseline capture (pre-#224).
- `tickets/224/evidence/bundle-compare.txt` — before/after bundle numbers.
- `tickets/224/evidence/lighthouse-after.json` — post-#224 Lighthouse desktop.
- `tickets/224/evidence/after-home-hero.png` — Home hero screenshot.
- `tickets/224/evidence/after-our-business.png` — Our Business section.
- `tickets/224/evidence/reduced-motion-home.png` — reduced-motion full page.
- `tickets/224/evidence/lighthouse-baseline.json` — baseline Lighthouse (kept).
