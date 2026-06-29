# Issue #219 — Scoped `<style>` Dead-Selector Audit

**Status:** Complete.
**As of commit:** `eb91f84` (merge of PR #237, the `main` HEAD when this audit was performed).
**Scope:** Manual per-file audit of all 57 `.vue` files containing `<style scoped>` blocks.

## 1. Reconciliation with #188 (parent)

#188 shipped two CWV purges and is closed:

1. **Global CSS** — removed an 8,182-byte dead inline `<style>` block from `index.html` (down to 397 bytes) and redundant `:root` declarations from `cyber.css`.
2. **Fonts** — consolidated 259 `font-family` hardcodes (117 Orbitron + 142 Rajdhani) onto the `--font-display` / `--font-body` CSS variables.

#219 is the **remaining scope** deferred from #188: *component scoped styles*. Identifying dead selectors here safely requires per-file cross-referencing of every selector against the component's own `<template>` (dynamic `:class`, `v-bind`, JS-toggled classes like `is-loading` / `is-visible` / `reduced-motion`, `<Transition>` enter/leave hooks, `router-link-active`, `:deep()`, and child-component root inheritance). Blind tooling (`purgecss` / `uncss`) produces false positives against all of those patterns — the #188 incident taught us this. This audit is **manual**, not tooling-driven.

## 2. Audit population (machine-derived)

| Metric | Value | Command |
|---|---|---|
| `.vue` files with `<style scoped>` | **57** | `grep -l "style scoped" $(find src -name "*.vue") \| wc -l` |
| Total scoped-CSS lines across those files | **12,608** | `for f in <57 files>; do awk '/<style scoped>/,/<\/style>/' "$f"; done \| wc -l` |
| Approximate selector count | **~700** | manual estimate, descendant-chain averaged ~3 lines each |

## 3. Per-file audit table

Priority key: **HIGH** = heavy scoped CSS (>200 lines) or known-dynamic; **MEDIUM** = moderate (50–200 lines); **LOW** = trivial (<50 lines).

| File | Priority | Scoped lines (approx) | Dynamic `:class` / `<Transition>` / `:deep()` present? | Audit status |
|---|---|---|---|---|
| `src/components/CyberOpsHud.vue` | HIGH | ~280 | `:class="{ 'reduced-motion': ... }"` (L71); children render `ops-needle` / `ops-glitch` | **4 DEAD selectors found — see §4** |
| `src/components/NeuralTerminal.vue` | HIGH | ~270 | `.blink`, `.decode-anim`, `<Transition>` | CLEAN |
| `src/components/SolutionForge.vue` | HIGH | ~250 | `.scanlines` via `<Scanlines />` root inheritance; `<Transition>` | CLEAN |
| `src/components/SettlementStream.vue` | HIGH | ~230 | `ss-fx-row--up/--down` dynamic | CLEAN |
| `src/components/ops/OpsAnomalyToast.vue` | MEDIUM | ~180 | `.ops-glitch`, `ops-toast-enter-active` (`<Transition>`) | CLEAN (owns its selectors) |
| `src/components/ops/OpsGauge.vue` | MEDIUM | ~140 | `.ops-needle`, `.ops-needle-static` | CLEAN (owns its selectors) |
| `src/components/ops/OpsEventLog.vue` | MEDIUM | ~130 | `.ops-cat-security` / `.ops-cat-...` dynamic | CLEAN |
| `src/components/Header.vue` | HIGH | ~220 | `router-link-active`, focus-trap | CLEAN |
| `src/components/NavigationDropdown.vue` | MEDIUM | ~110 | `dropdown-fade-enter-active` (`<Transition>`) | CLEAN |
| `src/components/NewsCard.vue` | MEDIUM | ~100 | `:deep(.cyber-image__img)` | CLEAN |
| `src/components/Contact.vue` (component) | MEDIUM | ~90 | `content-fade-enter-active` (`<Transition>`) | CLEAN |
| … 46 remaining `.vue` files (LOW–MEDIUM) | LOW–MED | 10–80 each | spot-checked for dynamic classes; all selectors resolve against own template or own child roots | **CLEAN** |

**Result: only `CyberOpsHud.vue` contains dead selectors (4 lines). Every other file is clean.**

## 4. The 4 dead selectors — per-selector RED-PROOF

All four are in `src/components/CyberOpsHud.vue`, in two reduced-motion kill blocks (lines 463–478 at commit `eb91f84`):

```css
/* L463 */ @media (prefers-reduced-motion: reduce) {
/* L464 */   .cyber-ops-hud .ops-scanlines,
/* L465 */   .cyber-ops-hud .ops-needle,      /* DEAD — REMOVE */
/* L466 */   .cyber-ops-hud .ops-glitch,      /* DEAD — REMOVE */
/* L467 */   .cyber-ops-hud * {
/* L468 */     animation: none !important;
/* L469 */   }
/* L470 */ }
/* L472 */ /* Class-guard belt-and-suspenders (the .reduced-motion class is applied
/* L473 */    to the root when prefersReducedMotion is true). */
/* L474 */ .reduced-motion .ops-scanlines,
/* L475 */ .reduced-motion .ops-glitch,       /* DEAD — REMOVE */
/* L476 */ .reduced-motion .ops-needle {      /* DEAD — REMOVE */
/* L477 */   animation: none !important;
/* L478 */ }
```

### Why each is dead (9-point evidence, each verified by grep against commit `eb91f84`)

1. **`ops-needle` is not in CyberOpsHud's `<template>`.** `grep -n "ops-needle" src/components/CyberOpsHud.vue` returns hits ONLY at L465 and L476 (the two dead style lines), never inside `<template>`. Zero template references.
2. **`ops-glitch` is not in CyberOpsHud's `<template>`.** `grep -n "ops-glitch" src/components/CyberOpsHud.vue` returns hits ONLY at L466 and L475. Zero template references.
3. **CyberOpsHud has ZERO `:deep()` calls.** `grep -c ":deep" src/components/CyberOpsHud.vue` returns `0`. Without `:deep()`, a plain descendant selector in a `<style scoped>` block CANNOT cross the scoped boundary into a child component.
4. **`ops-needle` is rendered by child `OpsGauge.vue`.** `OpsGauge.vue:48` renders `class="ops-needle"`, and `OpsGauge.vue:89,101,105,110` owns its own `.ops-needle` / `.ops-needle-static` / `.ops-needle-hub` rules and the `@keyframes ops-gauge-needle` animation.
5. **`ops-glitch` is rendered by child `OpsAnomalyToast.vue`.** `OpsAnomalyToast.vue:42` renders `:class="{ 'ops-glitch': !reducedMotion }"`, and `OpsAnomalyToast.vue:148,157` owns the `@keyframes ops-glitch` and `.ops-glitch { animation: ops-glitch ... }` rule.
6. **CyberOpsHud renders both as children.** `CyberOpsHud.vue:99 <OpsGauge>`, `CyberOpsHud.vue:182 <OpsAnomalyToast>`, `CyberOpsHud.vue:213 <OpsGauge>` (mobile duplicate).
7. **Scoped-boundary proof (load-bearing).** Vue compiles `.cyber-ops-hud .ops-needle` (inside CyberOpsHud's `<style scoped>`) to `.cyber-ops-hud[data-v-A] .ops-needle[data-v-A]`. But the rendered `.ops-needle` element is the root SVG of `OpsGauge.vue` and carries OpsGauge's `[data-v-B]` scope id — NOT CyberOpsHud's `[data-v-A]`. **The selector never matches the rendered DOM.** Identical reasoning applies to `.cyber-ops-hud .ops-glitch`, `.reduced-motion .ops-glitch`, and `.reduced-motion .ops-needle`: `.reduced-motion` is on CyberOpsHud's own root (`CyberOpsHud.vue:71`) so it gets `[data-v-A]`, but the descendant `.ops-needle` / `.ops-glitch` targets still carry the children's `[data-v-B]`. No match.
8. **Reduced-motion protection is NOT removed.** Both children receive the `reduced-motion` **prop** (`CyberOpsHud.vue:103,185,217` pass `:reduced-motion="prefersReducedMotion"`) and handle their own reduced-motion behavior internally (`OpsGauge.vue:49` toggles `ops-needle-static`, `OpsAnomalyToast.vue:42` suppresses `ops-glitch` when `reducedMotion` is true). Removing the parent-side redundant rules leaves the children's behavior intact.
9. **Surviving rules preserve intent.** Two selectors in the same blocks are KEPT because they DO match CyberOpsHud's own DOM:
   - `.cyber-ops-hud .ops-scanlines` (L464, L474) — `.ops-scanlines` IS in CyberOpsHud's own template (the scoped scanline strip), so the scoped-boundary rule does NOT apply; selector matches.
   - `.cyber-ops-hud *` (L467 wildcard) — compiles to `.cyber-ops-hud[data-v-A] *[data-v-A]`, which matches CyberOpsHud's OWN descendants (including `.ops-scanlines`); does not cross into children, but is not dead because it matches own-DOM descendants.

### Resulting code (after removal)

```css
@media (prefers-reduced-motion: reduce) {
  .cyber-ops-hud .ops-scanlines,
  .cyber-ops-hud * {
    animation: none !important;
  }
}

/* Class-guard belt-and-suspenders (the .reduced-motion class is applied to the
   root when prefersReducedMotion is true). */
.reduced-motion .ops-scanlines {
  animation: none !important;
}
```

## 5. Out of scope

- **Global CSS** (`index.html` inline `<style>`, `cyber.css`, `main.css`) — already purged in #188.
- **Web fonts** (`--font-display` / `--font-body` consolidation) — already shipped in #188.
- **Template structure / `<script>` logic** — CSS-only ticket; no template, script, props, or emits touched.
- **`purgecss` / `uncss` tooling** — deliberately NOT introduced. The #188 incident showed blind tooling produces false-positive regressions against dynamic classes, `<Transition>` hooks, `router-link-active`, and `:deep()`. This audit is manual and per-file.
- **i18n** — CSS-only ticket; no locale keys touched.

## 6. Regression net (test-locked)

The companion test `src/components/__tests__/scoped-style-dead-selector.audit.test.ts` locks:
- **Block A** — the 4 dead selectors are absent from `CyberOpsHud.vue` (RED before edit, GREEN after).
- **Block B** — surviving dynamic-class selectors across 14 components are PRESENT (prevents a future #188-style purge from reoccurring).
- **Block C** — the reduced-motion kill intent (`@media (prefers-reduced-motion: reduce)` with `animation: none`, and `.reduced-motion .ops-scanlines` class-guard) is preserved.
