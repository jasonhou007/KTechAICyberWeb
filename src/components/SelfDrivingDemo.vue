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
 * AC2 visual richness: besides neon + scanlines (reused), this layer also ships
 *   - GLITCH TRANSITIONS: a one-shot chromatic-aberration flash fired on every
 *     PHASE CHANGE (not continuously). Phases advance every 2.5s and the flash
 *     lasts ~0.6s, so the strobe rate is ~0.4Hz — far under the 3Hz seizure-
 *     safety ceiling (AC4). Mirrors the NeuralCore one-shot glitch pattern.
 *
 * Reuses the EXISTING cyber palette + Scanlines.vue — no new palette invented.
 *
 * @ticket #203
 */
import { computed, ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
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
  depthShift,
  observe,
} = useAutoDemoLoop()

const rootEl = ref(null)

onMounted(() => {
  // Point the composable's offscreen IntersectionObserver at our root.
  if (rootEl.value) observe(rootEl.value)
})

// --- AC2: GLITCH TRANSITION (one-shot, fired on PHASE CHANGE) ---------------
// Mirrors NeuralCore.vue's glitchFlash: watch phaseId, flip a ref true, render
// a chromatic-aberration overlay via v-if, clear it after GLITCH_DURATION_MS.
// watch() without `immediate` only fires on an actual phaseId CHANGE (never on
// mount), so every callback is a genuine INTAKE->TRIAGE->... transition and
// deserves a flash. Never fires under reduced motion (AC4).
const GLITCH_DURATION_MS = 600
const glitchFlash = ref(false)
let glitchTimer = null
watch(phaseId, async () => {
  if (isStatic.value) return // AC4 — no flash under reduced motion
  glitchFlash.value = true
  await nextTick()
  if (glitchTimer) clearTimeout(glitchTimer)
  glitchTimer = setTimeout(() => {
    glitchFlash.value = false
    glitchTimer = null
  }, GLITCH_DURATION_MS)
})

onUnmounted(() => {
  if (glitchTimer) {
    clearTimeout(glitchTimer)
    glitchTimer = null
  }
})

// Feed reveal progress 0..1 within the current phase, drives StreamingCode.
const progress = computed(() => {
  if (!phaseDurationMs) return 0
  return Math.min(1, phaseElapsedMs.value / phaseDurationMs)
})

// The streaming lines (pre-translated) shown alongside the coder-ish phases.
// The feed tracks the LIVE phase (MEDIUM-3 — the earlier body was a tautology:
// `if (isStatic) return all; return all` returned the identical array from
// both branches). We promote the line matching the current phaseId to the
// front so StreamingCode — which reveals lines by progress starting at index 0
// — surfaces the live stage first as the feed types in. Under reduced motion
// the full set is shown in its natural order (no promotion needed; the static
// key-frame is already legible).
const STREAMING_PHASE_KEYS = {
  planner: 'plannerLine',
  coder: 'coderLine',
  security: 'securityLine',
  evaluator: 'evalLine',
}
const streamingLines = computed(() => {
  const all = [
    t('selfDriving.streaming.plannerLine'),
    t('selfDriving.streaming.coderLine'),
    t('selfDriving.streaming.securityLine'),
    t('selfDriving.streaming.evalLine'),
  ]
  if (isStatic.value) return all
  const activeKey = STREAMING_PHASE_KEYS[phaseId.value]
  if (!activeKey) return all
  const activeLine = t(`selfDriving.streaming.${activeKey}`)
  // Promote the live-phase line to index 0; keep the rest in their original
  // relative order so the feed reads as a stable console that foregrounds the
  // current stage.
  return [activeLine, ...all.filter((l) => l !== activeLine)]
})

// Which readout key the StatusReadout shows: merged at the resolved phase,
// complete at the wrap, cycling otherwise.
const readoutKey = computed(() => {
  if (phaseId.value === 'resolved') return 'merged'
  return 'cycling'
})

// Static key-frame summary surfaced under reduced motion (still tells the story).
const staticSummary = computed(() => t('selfDriving.readout.merged'))

// --- AC2: PARALLAX DEPTH -----------------------------------------------------
// Map the composable's slow -1..1 `depthShift` sine to per-layer translate()
// intensities. Far plane drifts least (subtle), near plane drifts most — the
// classic parallax depth cue. transform-only (GPU-cheap); the reduced-motion
// CSS rule pins every depth layer's transform to none.
function depthStyle(px) {
  const s = depthShift.value // -1..1
  return { transform: `translate3d(${(s * px).toFixed(2)}px, 0, 0)` }
}
const farStyle = computed(() => depthStyle(8))
const midStyle = computed(() => depthStyle(20))
const nearStyle = computed(() => depthStyle(34))
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
    <!-- Scanlines contained WITHIN this demo's stacking context. The shared
         Scanlines.vue component is `position: fixed; z-index: var(--z-scanlines)`
         (= 1000) so when it was only ever mounted inside scoped sections
         (NeuralCore/NeuralTerminal) it never escaped. But #203 mounts this demo
         GLOBALLY in App.vue, so an uncontained Scanlines would paint ABOVE the
         Header (--z-nav: 100) and all main content across every route. The
         .self-driving-scanlines-scope wrapper + the :deep(.scanlines) override
         below pin the overlay to position:absolute + z-index:0 inside this
         section, so it can never escape to fixed/1000 and stays behind the
         foreground content the way the docstring promises. -->
    <div class="self-driving-scanlines-scope" aria-hidden="true">
      <Scanlines />
    </div>

    <!-- AC2 PARALLAX DEPTH — three planes translated at different intensities by
         the composable's shared-rAF `depthShift` sine (far < mid < near). All
         decorative; the whole region is already aria-hidden above. -->
    <div class="depth-layer depth-far" :style="farStyle" aria-hidden="true">
      <div class="depth-neon-flow"></div>
    </div>

    <div class="self-driving-stage depth-layer depth-mid" :style="midStyle">
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

    <div class="depth-layer depth-near" :style="nearStyle" aria-hidden="true">
      <div class="depth-foreground-grid"></div>
    </div>

    <!-- AC2 GLITCH TRANSITION — one-shot chromatic-aberration flash fired on
         every phase change (v-if glitchFlash). Auto-clears after 0.6s via the
         watcher above; strobe rate ~0.4Hz, well under the 3Hz AC4 ceiling. -->
    <div
      v-if="glitchFlash"
      class="self-driving-glitch"
      aria-hidden="true"
      data-selfdriving-glitch="true"
    ></div>
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

/* Scanlines containment (MEDIUM-1 z-index inversion fix). The wrapper
   establishes a local stacking context at z-index 0 and clips to itself, and
   the :deep(.scanlines) override re-pins the shared Scanlines.vue overlay
   (otherwise `position: fixed; z-index: var(--z-scanlines)` = 1000) to
   position:absolute + z-index:0 inside this section. Net effect: the scanline
   overlay paints as a backdrop of THIS demo layer only, never above the
   Header (--z-nav: 100) or any foreground content. */
.self-driving-scanlines-scope {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}
.self-driving-demo :deep(.scanlines) {
  position: absolute;
  inset: 0;
  z-index: 0;
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

/* ---- AC2 PARALLAX DEPTH ------------------------------------------------
 * Three depth planes. Each is positioned absolutely and translated ONLY via
 * the inline `depthStyle()` transform the composable drives (different px
 * intensities per layer create the parallax cue). The decorative far/near
 * planes paint faint neon tokens so depth is visible without new colors. */
.depth-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  /* transform is set inline by depthStyle(); will-change keeps it GPU-cheap. */
  will-change: transform;
}
.depth-far {
  z-index: 0;
  opacity: 0.5;
}
.depth-mid {
  /* The mid plane carries the real content (track + readout + feed). */
  z-index: 1;
}
.depth-near {
  z-index: 2;
  opacity: 0.35;
}
.depth-neon-flow {
  position: absolute;
  inset: -10% -20%;
  background: radial-gradient(
      ellipse at 30% 40%,
      rgba(0, 255, 204, 0.08) 0%,
      transparent 60%
    ),
    radial-gradient(
      ellipse at 70% 60%,
      rgba(255, 0, 170, 0.07) 0%,
      transparent 60%
    );
}
.depth-foreground-grid {
  position: absolute;
  inset: -5%;
  background-image: repeating-linear-gradient(
      90deg,
      rgba(0, 255, 255, 0.05) 0,
      rgba(0, 255, 255, 0.05) 1px,
      transparent 1px,
      transparent 48px
    ),
    repeating-linear-gradient(
      0deg,
      rgba(255, 0, 255, 0.04) 0,
      rgba(0, 255, 136, 0.04) 1px,
      transparent 1px,
      transparent 48px
    );
}

/* ---- AC2 GLITCH TRANSITION (one-shot, phase-change) -------------------
 * Chromatic-aberration scan-tear using the existing cyber palette tokens
 * (--magenta / --cyan). Fires via v-if on phase change; the 0.6s animation
 * period keeps the strobe rate ~0.4Hz (<< 3Hz AC4 ceiling). */
.self-driving-glitch {
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
  background: linear-gradient(
    90deg,
    rgba(255, 0, 170, 0.12) 0%,
    transparent 20%,
    transparent 80%,
    rgba(0, 255, 255, 0.12) 100%
  );
  mix-blend-mode: screen;
  animation: self-driving-glitch-tear 0.6s steps(2, end) forwards;
}
@keyframes self-driving-glitch-tear {
  0% {
    opacity: 0;
    transform: translateX(0);
    clip-path: inset(0 0 0 0);
  }
  20% {
    opacity: 0.9;
    transform: translateX(-3px);
    clip-path: inset(20% 0 60% 0);
  }
  50% {
    opacity: 0.7;
    transform: translateX(4px);
    clip-path: inset(55% 0 20% 0);
  }
  100% {
    opacity: 0;
    transform: translateX(0);
    clip-path: inset(0 0 0 0);
  }
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
   summary + the (color-only) current-card highlight still convey the story.
   Defense-in-depth: the composable pins depthShift=0 and the watcher skips
   glitchFlash under reduced motion, but this CSS also locks any transform a
   prior frame may have written before the guard ran (mirrors the
   accessibility.css [data-parallax="on"] neutralizer pattern). */
@media (prefers-reduced-motion: reduce) {
  .self-driving-demo,
  .self-driving-demo * {
    animation: none !important;
    transition: none !important;
  }
  .depth-layer,
  .self-driving-glitch {
    transform: none !important;
  }
}
</style>
