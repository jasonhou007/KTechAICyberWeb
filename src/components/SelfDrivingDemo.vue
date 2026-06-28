<script setup>
/**
 * @component SelfDrivingDemo
 * @description Always-on, looping, NO-CLICK-REQUIRED ambient background that
 * auto-demonstrates the autonomous dev pipeline (#203).
 *
 *   INTAKE -> TRIAGE -> PLANNER -> CODER -> SECURITY -> EVALUATOR -> MERGER
 *          -> RESOLVED -> (seamless wrap) -> INTAKE ...
 *
 * Thin presentation layer over useAutoDemoLoop (the FSM owns all state + the
 * single shared rAF loop). Fixed full-viewport layer at z-index: 0 so it paints
 * BEHIND main content (SkipLink/Header/main/footer all sit above). The whole
 * region is aria-hidden="true" because it is pure decoration — the real,
 * selectable page content lives in the foreground.
 *
 * Reduced motion (AC4): the composable flips isStatic=true and never schedules
 * rAF; here we render a static key-frame summary (the full pipeline + a MERGED
 * readout) so the product story stays legible without any animation.
 *
 * Performance (AC3): transform/opacity/canvas only; element count is capped
 * (8 cards + a handful of feed/readout nodes ≈ 40 desktop, fewer on mobile
 * where the track stacks). Throttling/offscreen/handled in the composable.
 *
 * Reuses the EXISTING cyber palette + Scanlines.vue — no new palette invented.
 *
 * @ticket #203
 */
import { computed, ref, onMounted } from 'vue'
import { useLanguage } from '../composables/useLanguage'
import { useAutoDemoLoop } from '../composables/useAutoDemoLoop'
import Scanlines from './Scanlines.vue'
import PipelineTrack from './selfdriving/PipelineTrack.vue'
import StreamingCode from './selfdriving/StreamingCode.vue'
import StatusReadout from './selfdriving/StatusReadout.vue'

const { t } = useLanguage()

const {
  phaseId,
  phaseElapsedMs,
  loopIteration,
  isStatic,
  phaseDurationMs,
  observe,
} = useAutoDemoLoop()

const rootEl = ref(null)

onMounted(() => {
  // Point the composable's offscreen IntersectionObserver at our root.
  if (rootEl.value) observe(rootEl.value)
})

// Feed reveal progress 0..1 within the current phase, drives StreamingCode.
const progress = computed(() => {
  if (!phaseDurationMs) return 0
  return Math.min(1, phaseElapsedMs.value / phaseDurationMs)
})

// The streaming lines (pre-translated) shown alongside the coder-ish phases.
// Rotate the visible set based on the current phase so the feed narrates the
// live stage; under reduced motion the full set is shown statically.
const streamingLines = computed(() => {
  const all = [
    t('selfDriving.streaming.plannerLine'),
    t('selfDriving.streaming.coderLine'),
    t('selfDriving.streaming.securityLine'),
    t('selfDriving.streaming.evalLine'),
  ]
  if (isStatic.value) return all
  return all
})

// Which readout key the StatusReadout shows: merged at the resolved phase,
// complete at the wrap, cycling otherwise.
const readoutKey = computed(() => {
  if (phaseId.value === 'resolved') return 'merged'
  return 'cycling'
})

// Static key-frame summary surfaced under reduced motion (still tells the story).
const staticSummary = computed(() => t('selfDriving.readout.merged'))
</script>

<template>
  <section
    ref="rootEl"
    class="self-driving-demo"
    :class="{ static: isStatic }"
    data-selfdriving-root="true"
    :data-current-phase="phaseId"
    :data-loop-iteration="loopIteration"
    :data-static="isStatic ? 'true' : 'false'"
    :aria-label="t('selfDriving.aria.regionLabel')"
    aria-hidden="true"
  >
    <Scanlines />

    <div class="self-driving-stage">
      <header class="self-driving-header">
        <StatusReadout
          :loop-iteration="loopIteration"
          :phase-id="phaseId"
          :readout-key="readoutKey"
        />
      </header>

      <PipelineTrack :phase-id="phaseId" />

      <!-- Streaming code feed (decorative; aria-hidden on the inner component). -->
      <StreamingCode :lines="streamingLines" :progress="progress" />

      <!-- Static key-frame summary, only rendered under reduced motion so the
           product story stays legible without animation. -->
      <p v-if="isStatic" class="self-driving-static-summary">
        {{ staticSummary }}
      </p>
    </div>
  </section>
</template>

<style scoped>
.self-driving-demo {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
  background:
    radial-gradient(
      ellipse at 20% 0%,
      rgba(0, 255, 204, 0.06) 0%,
      transparent 55%
    ),
    radial-gradient(
      ellipse at 80% 100%,
      rgba(255, 0, 170, 0.05) 0%,
      transparent 55%
    ),
    var(--bg-primary, #0a0f1c);
  /* Sit behind foreground content (Header/main/footer all live above z=0). */
}
.self-driving-stage {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1.2rem;
  padding: 6rem 2rem 4rem;
  /* Soften so foreground text stays readable on top (AC2 legibility). */
  opacity: 0.5;
}
.self-driving-header {
  display: flex;
  justify-content: center;
}
.self-driving-static-summary {
  margin: 0;
  text-align: center;
  font-family: 'Orbitron', sans-serif;
  letter-spacing: 0.1em;
  color: var(--neon-green, #00ff88);
  text-shadow: 0 0 6px var(--neon-green, #00ff88);
}

/* Mobile: shrink padding + drop opacity slightly so the track fits a narrow
   viewport (the track also stacks vertically below 768px). */
@media (max-width: 768px) {
  .self-driving-stage {
    padding: 5rem 1rem 3rem;
    gap: 0.9rem;
    opacity: 0.4;
  }
}

/* Reduced motion: kill every transition/animation on this layer; the static
   summary + the (color-only) current-card highlight still convey the story. */
@media (prefers-reduced-motion: reduce) {
  .self-driving-demo,
  .self-driving-demo * {
    animation: none !important;
    transition: none !important;
  }
}
</style>
