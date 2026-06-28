# #182 — Cyber Ops HUD (SELF-REVIEW / HAND-OFF NOTES)

This is the implementing agent's honest self-review for Stage 6 adversarial
review. It lists what was verified, what is weak, and what a reviewer should
probe.

## What is solid

- **TDD honored**: `useOpsFeed.test.ts` was written first and confirmed RED
  (module-not-found) before `useOpsFeed.js` existed, then driven to GREEN.
- **Pulse math is pinned**: `pulseSpikeValue` is asserted at t=0, t=400 (peak
  100.0), t=2200 (settled to baseline) ±0.01, plus monotonicity + never-below-
  baseline. Changing any of the EXACT constants (SPIKE_DELTA=0.8,
  SPIKE_RISE_MS=400, SETTLE_MS=1800, DECAY=0.004) flips these red.
- **Shipped-app gate is real**: HomeOpsHudWiring.test.ts mounts the REAL
  Home.vue (CyberOpsHud NOT stubbed) and asserts the HUD root inside `.home`.
  Removing the `<CyberOpsHud />` render fails it. The NeuralCore shipped-app
  gate also still passes (it mounts Home, which now mounts the HUD).
- **Visual-AC is CSS-source, not DOM-structure**: it strips comments and
  asserts each keyframe is DECLARED AND APPLIED, with red-test proof comments.
  A color/animation revert cannot sneak through.
- **Sync-rAF recursion was a real regression I caused and fixed**: wiring the
  always-on HUD into Home blew the stack under NeuralCore.spec.js's synchronous
  rAF mock. The `inTick` + `scheduling` guards in `useOpsFeed.tick` are the
  honest fix; full suite went 76/2172 green after it. This is documented in
  commit `a667653`.

## What a reviewer should probe (honest weaknesses)

1. **IntersectionObserver root is `document.body`** in the test host (no
   explicit HUD root). In the shipped app the body observer is a reasonable
   proxy for scroll-out, but it is not the HUD section element. If a reviewer
   wants the throttle keyed to the HUD's own visibility, `useOpsFeed` should
   accept the HUD root ref. I did not do this because the composable is created
   inside `CyberOpsHud`'s `<script setup>` and the root ref is not available
   until after mount; passing it would need a small refactor.
2. **`pulse()` raises the anomaly deterministically** (no event append for the
   raise — it flips state directly so the feed delta stays +1). This is a
   deliberate contract choice pinned by the test; a reviewer who wants the
   anomaly to ALSO appear as a feed row would need to revisit this.
3. **The glitch is on the title element, not the toast container.** The
   original plan said "glitch-on-anomaly applied to the anomaly toast." I moved
   it to the title because a perpetual transform on the container made the
   Investigate/Dismiss buttons unclickable under Playwright's stability check
   (and would be janky for real users). The visual-AC test asserts the keyframe
   is declared + applied to `.ops-glitch` (now on the title), so the AC still
   holds, but the semantics shifted slightly. Flagging for reviewer awareness.
4. **`requestCount` modulo 1000** drives the particle phase; under heavy load
   this is fine, but the particle positions are recomputed each tick (not
   transitioned). It's transform-only (perf-safe) but not a smooth CSS
   transition — acceptable for a "mini-viz", worth noting.
5. **Coverage branches at 85.78%** are above the 85% gate but the new
   CyberOpsHud.vue template branches are compiler-tracked (some `v-if`/`v-else`
   markers register as uncovered branches even though the runtime paths are
   exercised). I added dedicated detail-panel tests for every widget branch;
   if a reviewer wants the file itself >90% branches, more template-branch
   assertions would be needed.

## What I did NOT fake

- I did not lower the coverage threshold.
- I did not skip or `.todo` any test.
- I did not stub CyberOpsHud in the wiring test.
- I did not commit the broken sync-rAF state; it is a separate fix commit with
  a full explanation.
- The 7 Playwright E2E tests all pass against the real preview build on
  chromium; the 3 evidence screenshots are non-empty and show the HUD with the
  anomaly toast (after-pulse) and the investigate drill-down state.

## Recommendation

Ready for Stage 6 adversarial review. The five weaknesses above are all
documented and either deliberate contract choices or minor follow-ups; none
block the ACs.
