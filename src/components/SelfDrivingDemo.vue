<script setup>
/**
 * @component SelfDrivingDemo
 * @description Enhanced 6-agent adversarial pipeline visualization (#364).
 *
 * Upgrades the original 8-stage demo to a sophisticated 6-agent adversarial system:
 *   PLANNER → CODER → SECURITY → EVALUATOR → REVIEWER → MERGER → (wrap)
 *
 * New features:
 * - 6 specialized agents with distinct cyberpunk visuals
 * - FSM state machine (idle/active/challenging/completed)
 * - Adversarial challenge flow with particle animations
 * - Artifact generation and tracking
 * - Real-time metrics and performance monitoring
 * - 60fps GPU-accelerated transforms
 *
 * Maintains backward compatibility with existing useAutoDemoLoop architecture
 * while adding useAgentPipeline for the new agent system.
 *
 * @ticket #364
 * @enhances #203
 */
import { computed, ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useLanguage } from '../composables/useLanguage'
import { useAutoDemoLoop } from '../composables/useAutoDemoLoop'
import { useAgentPipeline } from '../composables/useAgentPipeline'
import Scanlines from './Scanlines.vue'
import StreamingCode from './selfdriving/StreamingCode.vue'
import StatusReadout from './selfdriving/StatusReadout.vue'
import AgentPipelineTrack from './selfdriving/AgentPipelineTrack.vue'
import AdversarialFlow from './selfdriving/AdversarialFlow.vue'
import ArtifactFlow from './selfdriving/ArtifactFlow.vue'
import MetricsPanel from './selfdriving/MetricsPanel.vue'

const { t } = useLanguage()

// Existing composable for timing and loop control
const {
  phaseId,
  phaseElapsedMs,
  loopIteration,
  isStatic,
  phaseDurationMs,
  depthShift,
  observe,
} = useAutoDemoLoop()

// New composable for 6-agent system
const {
  agents,
  activeAgentId,
  completedCycles,
  getAgentState,
  artifacts,
  challengeCount,
  resolvedChallenges,
  challengeDimensions,
  metrics,
  getAgentMetrics,
  tick,
  setOffscreen,
  setReducedMotion,
  generateArtifact,
  recordChallenge,
  resolveChallenge,
  recordCycleTime,
  recordResult,
  recordAgentDuration,
} = useAgentPipeline()

const rootEl = ref(null)

onMounted(() => {
  // Point both composables' observers at our root
  if (rootEl.value) {
    observe(rootEl.value)
  }
})

// --- GLITCH TRANSITION (enhanced for 6-agent system) -------------------
const GLITCH_DURATION_MS = 600
const glitchFlash = ref(false)
let glitchTimer = null

watch(activeAgentId, async () => {
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

// --- AGENT PIPELINE TICK -----------------------------------------------
// Drive the agent pipeline FSM using the same rAF timing as the original loop
watch(phaseElapsedMs, (newElapsed, oldElapsed) => {
  if (!oldElapsed || newElapsed < oldElapsed) {
    // Phase reset - new agent cycle
    return
  }

  // Calculate delta
  const delta = newElapsed - (oldElapsed || 0)

  // Tick the agent pipeline
  tick(delta)

  // Simulate artifact generation for active agents
  if (Math.random() < 0.02) { // 2% chance per tick
    const agentId = activeAgentId.value
    const artifactTypes = {
      planner: 'plan',
      coder: 'code',
      security: 'security-report',
      evaluator: 'quality-assessment',
      reviewer: 'review-report',
      merger: 'merge-commit',
    }
    generateArtifact(agentId, artifactTypes[agentId] || 'artifact')
  }
})

// --- STREAMING CODE FEED (enhanced for 6 agents) -----------------------
const STREAMING_PHASE_KEYS = {
  planner: 'plannerLine',
  coder: 'coderLine',
  security: 'securityLine',
  evaluator: 'evalLine',
  reviewer: 'reviewerLine',
  merger: 'mergerLine',
}

const streamingLines = computed(() => {
  const all = [
    t('selfDriving.streaming.plannerLine'),
    t('selfDriving.streaming.coderLine'),
    t('selfDriving.streaming.securityLine'),
    t('selfDriving.streaming.evalLine'),
    t('selfDriving.streaming.reviewerLine'),
    t('selfDriving.streaming.mergerLine'),
  ]
  if (isStatic.value) return all

  const activeKey = STREAMING_PHASE_KEYS[activeAgentId.value]
  if (!activeKey) return all

  const activeLine = t(`selfDriving.streaming.${activeKey}`)
  return [activeLine, ...all.filter((l) => l !== activeLine)]
})

// Feed progress
const progress = computed(() => {
  if (!phaseDurationMs) return 0
  return Math.min(1, phaseElapsedMs.value / phaseDurationMs)
})

// --- STATUS READOUT -----------------------------------------------------
const readoutKey = computed(() => {
  if (activeAgentId.value === 'merger' && completedCycles.value > 0) {
    return 'merged'
  }
  return 'cycling'
})

// Static summary
const staticSummary = computed(() => t('selfDriving.readout.merged'))

// --- PARALLAX DEPTH (same as original) ---------------------------------
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
    class="self-driving-demo"
    :class="{ static: isStatic }"
    data-selfdriving-root="true"
    :data-current-agent="activeAgentId"
    :data-loop-iteration="loopIteration"
    :data-static="isStatic ? 'true' : 'false'"
    :aria-label="t('selfDriving.aria.regionLabel6Agent')"
  >
    <!-- Demo heading -->
    <p class="self-driving-heading neon-text">
      {{ t('selfDriving.heading6Agent') }}
    </p>

    <!-- Scanlines -->
    <div class="self-driving-scanlines-scope" aria-hidden="true">
      <Scanlines />
    </div>

    <!-- Parallax depth planes -->
    <div class="depth-layer depth-far" :style="farStyle" aria-hidden="true">
      <div class="depth-neon-flow"></div>
    </div>

    <div class="self-driving-stage depth-layer depth-mid" :style="midStyle">
      <header class="self-driving-header">
        <StatusReadout
          :loop-iteration="completedCycles"
          :phase-id="activeAgentId"
          :readout-key="readoutKey"
        />
      </header>

      <!-- NEW: 6-Agent Pipeline Track -->
      <AgentPipelineTrack />

      <!-- Advanced Features Grid -->
      <div class="self-driving-advanced">
        <!-- Adversarial Challenge Flow -->
        <AdversarialFlow
          :challenges="[]"
          :resolved-challenges="[]"
          :challenge-count="challengeCount"
          :challenge-dimensions="challengeDimensions"
        />

        <!-- Artifact Pipeline -->
        <ArtifactFlow :artifacts="artifacts" />

        <!-- Metrics Panel -->
        <MetricsPanel
          :metrics="metrics"
          :agent-metrics="{
            planner: getAgentMetrics('planner'),
            coder: getAgentMetrics('coder'),
            security: getAgentMetrics('security'),
            evaluator: getAgentMetrics('evaluator'),
            reviewer: getAgentMetrics('reviewer'),
            merger: getAgentMetrics('merger'),
          }"
          :completed-cycles="completedCycles"
        />
      </div>

      <!-- Streaming code feed -->
      <StreamingCode :lines="streamingLines" :progress="progress" />

      <!-- Static summary for reduced motion -->
      <p v-if="isStatic" class="self-driving-static-summary">
        {{ staticSummary }}
      </p>
    </div>

    <div class="depth-layer depth-near" :style="nearStyle" aria-hidden="true">
      <div class="depth-foreground-grid"></div>
    </div>

    <!-- Glitch transition -->
    <div
      v-if="glitchFlash"
      class="self-driving-glitch"
      aria-hidden="true"
      data-selfdriving-glitch="true"
    ></div>
  </section>
</template>

<style scoped>
/* Base demo styles (same as original) */
.self-driving-demo {
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

.self-driving-heading {
  position: relative;
  z-index: 2;
  margin: 0 0 clamp(0.5rem, 1.5vh, 1rem);
  text-align: center;
  font-family: var(--font-display);
  font-size: var(--home-section-title);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

/* Scanlines containment */
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
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: clamp(0.5rem, 1.2vh, 1rem);
}

.self-driving-header {
  display: flex;
  justify-content: center;
  width: 100%;
}

.self-driving-static-summary {
  margin: 0;
  text-align: center;
  font-family: var(--font-display);
  letter-spacing: 0.1em;
  color: var(--neon-green, var(--cyan));
  text-shadow: 0 0 6px var(--neon-green, var(--cyan));
}

/* NEW: Advanced Features Grid */
.self-driving-advanced {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  width: 100%;
  margin-top: 1rem;
}

/* Depth planes (same as original) */
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

/* Glitch transition (same as original) */
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

/* Mobile responsive */
@media (max-width: 768px) {
  .self-driving-demo {
    padding: 1.25rem 0.75rem;
  }

  .self-driving-stage {
    gap: 0.9rem;
  }

  .self-driving-advanced {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
}

/* Tablet responsive */
@media (min-width: 769px) and (max-width: 1024px) {
  .self-driving-advanced {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Reduced motion */
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
