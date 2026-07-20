<script setup>
/**
 * @component ServicesSelfDriving
 * @description Always-on, looping, NO-CLICK-REQUIRED in-flow section for the
 * Services page (#475) that auto-demonstrates the AI service pipeline.
 *
 *   DATA_INGESTION -> AI_ANALYSIS -> PIPELINE_VALIDATION -> SERVICE_EXECUTION
 *     -> RESULT_DELIVERY -> SERVICE_COMPLETE -> (wrap) -> DATA_INGESTION ...
 *
 * Thin presentation layer over useServicesPipelineLoop (the FSM owns all state +
 * the single shared rAF loop). Mounted as an IN-FLOW <section> on the services
 * route, so the pipeline rail, streaming code feed, and status readout are real,
 * visible page content.
 *
 * Reduced motion: the composable flips isStatic=true and never schedules rAF;
 * we render a static key-frame summary so the story stays legible without animation.
 *
 * Reuses the EXISTING cyber palette + child components (Scanlines, PipelineTrack,
 * StreamingCode, StatusReadout) from SelfDrivingDemo.
 *
 * @ticket #475
 */
import { computed, ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useLanguage } from '../composables/useLanguage'
import { useServicesPipelineLoop, SERVICE_PHASES } from '../composables/useServicesPipelineLoop'
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
} = useServicesPipelineLoop()

const rootEl = ref(null)

onMounted(() => {
  if (rootEl.value) observe(rootEl.value)
})

// --- AC2: GLITCH TRANSITION (one-shot, fired on PHASE CHANGE) ---------------
const GLITCH_DURATION_MS = 600
const glitchFlash = ref(false)
let glitchTimer = null
watch(phaseId, async () => {
  if (isStatic.value) return
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

// Feed reveal progress 0..1 within the current phase
const progress = computed(() => {
  if (!phaseDurationMs) return 0
  return Math.min(1, phaseElapsedMs.value / phaseDurationMs)
})

// The streaming lines (pre-translated) shown alongside the coder-ish phases.
const STREAMING_PHASE_KEYS = {
  aiAnalysis: 'analysisLine',
  pipelineValidation: 'validationLine',
  serviceExecution: 'executionLine',
}
const streamingLines = computed(() => {
  const all = [
    t('servicesSelfDriving.streaming.dataLine'),
    t('servicesSelfDriving.streaming.analysisLine'),
    t('servicesSelfDriving.streaming.validationLine'),
    t('servicesSelfDriving.streaming.executionLine'),
  ]
  if (isStatic.value) return all
  const activeKey = STREAMING_PHASE_KEYS[phaseId.value]
  if (!activeKey) return all
  const activeLine = t(`servicesSelfDriving.streaming.${activeKey}`)
  return [activeLine, ...all.filter((l) => l !== activeLine)]
})

// Which readout key the StatusReadout shows
const readoutKey = computed(() => {
  if (phaseId.value === 'serviceComplete') return 'delivered'
  return 'cycling'
})

// Static key-frame summary surfaced under reduced motion
const staticSummary = computed(() => t('servicesSelfDriving.readout.delivered', { n: loopIteration.value }))

// --- AC2: PARALLAX DEPTH -----------------------------------------------------
function depthStyle(px) {
  const s = depthShift.value
  return { transform: `translate3d(${(s * px).toFixed(2)}px, 0, 0)` }
}
const farStyle = computed(() => depthStyle(8))
const midStyle = computed(() => depthStyle(20))
const nearStyle = computed(() => depthStyle(34))
</script>

<template>
  <section
    ref="rootEl"
    class="services-self-driving-demo"
    :class="{ static: isStatic }"
    data-servicesselfdriving-root="true"
    :data-current-phase="phaseId"
    :data-loop-iteration="loopIteration"
    :data-static="isStatic ? 'true' : 'false'"
    :aria-label="t('servicesSelfDriving.aria.regionLabel')"
  >
    <p class="services-self-driving-heading neon-text">{{ t('servicesSelfDriving.heading') }}</p>

    <div class="services-self-driving-scanlines-scope" aria-hidden="true">
      <Scanlines />
    </div>

    <div class="depth-layer depth-far" :style="farStyle" aria-hidden="true">
      <div class="depth-neon-flow"></div>
    </div>

    <div class="services-self-driving-stage depth-layer depth-mid" :style="midStyle">
      <header class="services-self-driving-header">
        <StatusReadout
          :loop-iteration="loopIteration"
          :phase-id="phaseId"
          :readout-key="readoutKey"
          i18n-prefix="servicesSelfDriving"
        />
      </header>

      <PipelineTrack :phase-id="phaseId" :phases="SERVICE_PHASES" i18n-prefix="servicesSelfDriving" />

      <StreamingCode :lines="streamingLines" :progress="progress" />

      <p v-if="isStatic" class="services-self-driving-static-summary">
        {{ staticSummary }}
      </p>
    </div>

    <div class="depth-layer depth-near" :style="nearStyle" aria-hidden="true">
      <div class="depth-foreground-grid"></div>
    </div>

    <div
      v-if="glitchFlash"
      class="services-self-driving-glitch"
      aria-hidden="true"
      data-servicesselfdriving-glitch="true"
    ></div>
  </section>
</template>

<style scoped>
.services-self-driving-demo {
  position: relative;
  z-index: 0;
  overflow: hidden;
  min-height: clamp(280px, 38vh, 360px);
  margin: 0 auto;
  padding: clamp(1rem, 2.5vh, 2rem) clamp(1rem, 3vw, 2rem);
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
    var(--bg-primary, var(--bg-primary));
}

.services-self-driving-heading {
  position: relative;
  z-index: 2;
  margin: 0 0 clamp(0.5rem, 1.5vh, 1rem);
  text-align: center;
  font-family: var(--font-display);
  font-size: var(--home-section-title);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.services-self-driving-scanlines-scope {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}
.services-self-driving-demo :deep(.scanlines) {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.services-self-driving-stage {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: clamp(0.5rem, 1.2vh, 1rem);
}
.services-self-driving-header {
  display: flex;
  justify-content: center;
}
.services-self-driving-static-summary {
  margin: 0;
  text-align: center;
  font-family: var(--font-display);
  letter-spacing: 0.1em;
  color: var(--neon-green, var(--cyan));
  text-shadow: 0 0 6px var(--neon-green, var(--cyan));
}

.depth-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  will-change: transform;
}
.depth-far {
  z-index: 0;
  opacity: 0.5;
}
.depth-mid {
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
      rgba(255, 0, 170, 0.04) 0,
      rgba(0, 255, 204, 0.04) 1px,
      transparent 1px,
      transparent 48px
    );
}

.services-self-driving-glitch {
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
  animation: services-self-driving-glitch-tear 0.6s steps(2, end) forwards;
}
@keyframes services-self-driving-glitch-tear {
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

@media (max-width: 768px) {
  .services-self-driving-demo {
    padding: 1.25rem 0.75rem;
  }
  .services-self-driving-stage {
    gap: 0.9rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .services-self-driving-demo,
  .services-self-driving-demo * {
    animation: none !important;
    transition: none !important;
  }
  .depth-layer,
  .services-self-driving-glitch {
    transform: none !important;
  }
}
</style>
