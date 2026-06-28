<template>
  <!--
    AI Core neural-network visualizer (#179). Thin SVG presentation layer over
    useNeuralNet. Nodes/synapses are real DOM elements so hover/focus + a11y are
    declarative. Honors prefers-reduced-motion both in JS (runInference skips
    the rAF loop) and CSS (the .reduced-motion guard + @media block kill the
    breathing + glitch animations).
  -->
  <section
    class="neural-core"
    :class="{ 'reduced-motion': prefersReducedMotion }"
    data-test="neural-core"
    :aria-label="t('neural.aria.regionLabel')"
  >
    <!-- Screen-reader description of the visualization (AC 3.1). -->
    <p class="visually-hidden" data-test="neural-sr-description">
      {{ t('neural.aria.description') }}
    </p>

    <header class="neural-core-header">
      <h2 class="neural-core-title neon-text">{{ t('neural.title') }}</h2>
      <p class="neural-core-subtitle">{{ t('neural.subtitle') }}</p>
    </header>

    <!-- One-shot glitch flash fired when an inference run completes. Decorative
         (aria-hidden); suppressed under reduced motion. -->
    <div
      v-if="glitchFlash"
      class="neural-glitch-flash"
      :class="{ 'reduced-motion': prefersReducedMotion }"
      aria-hidden="true"
      data-test="neural-glitch-flash"
    >
      <span class="neural-glitch-text">{{ t('neural.glitch.complete') }}</span>
    </div>

    <div class="neural-core-stage">
      <Scanlines />

      <!-- SVG viewBox matches the composable's coordinate space (VIEW_W x VIEW_H).
           The breathing class on the root drives the idle animation; it is only
           applied when isBreathingEligible (idle + motion allowed). -->
      <svg
        class="neural-svg"
        :class="{ breathing: isBreathingEligible }"
        viewBox="0 0 320 200"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        :aria-label="t('neural.aria.regionLabel')"
      >
        <!-- Synapses first so nodes render on top. -->
        <line
          v-for="s in synapses"
          :key="s.id"
          data-test="neural-synapse"
          class="neural-synapse"
          :class="{ highlighted: isSynapseHighlighted(s) }"
          :x1="s.geometry.x1"
          :y1="s.geometry.y1"
          :x2="s.geometry.x2"
          :y2="s.geometry.y2"
          :aria-label="t('neural.aria.synapseHighlighted', { count: highlightedCount })"
        />

        <!-- Inference pulse packets: a circle traveling along its path. The
             pulse position is interpolated from the path node coords. -->
        <circle
          v-for="p in visiblePulses"
          :key="p.id"
          class="neural-pulse"
          :cx="p.x"
          :cy="p.y"
          :r="3.5"
          aria-hidden="true"
        />

        <!-- Nodes. role=button + tabindex=0 so they are keyboard-operable; the
             aria-label names the layer + function for AT users. -->
        <g
          v-for="node in nodes"
          :key="node.id"
          data-test="neural-node"
          class="neural-node"
          :class="{
            breathing: isBreathingEligible,
            hovered: hoveredNodeId === node.id,
          }"
          :tabindex="0"
          role="button"
          :aria-label="t('neural.aria.nodeLabel', {
            layer: t('neural.layers.' + node.layerKind + '.label'),
            function: t('neural.layers.' + node.layerKind + '.function'),
          })"
          :transform="`translate(${node.x}, ${node.y})`"
          @mouseenter="onNodeEnter(node)"
          @mouseleave="onNodeLeave"
          @focus="onNodeEnter(node)"
          @blur="onNodeLeave"
          @keydown="onNodeKeydown($event, node)"
          @pointerdown="onPointerDown(node, $event)"
        >
          <circle :r="node.r" class="neural-node-circle" />
          <circle :r="node.r + 4" class="neural-node-halo" />
        </g>
      </svg>

      <!-- Tooltip: shows the focused/hovered node's layer + function. -->
      <div
        v-if="hoveredNode"
        class="neural-tooltip"
        data-test="neural-tooltip"
        role="tooltip"
      >
        <span class="neural-tooltip-row">
          <span class="neural-tooltip-key">{{ t('neural.tooltip.layer') }}</span>
          <span class="neural-tooltip-val">{{ t('neural.layers.' + hoveredNode.layerKind + '.label') }}</span>
        </span>
        <span class="neural-tooltip-row">
          <span class="neural-tooltip-key">{{ t('neural.tooltip.function') }}</span>
          <span class="neural-tooltip-val">{{ t('neural.layers.' + hoveredNode.layerKind + '.function') }}</span>
        </span>
      </div>
    </div>

    <!-- Controls + readout. The readout is a polite live region so SR users
         hear the decoded verdict when an inference run completes. -->
    <div class="neural-core-controls">
      <button
        type="button"
        class="neural-run-button cyber-button neon-text"
        data-test="neural-run-inference"
        :aria-label="t('neural.aria.runInferenceButton')"
        :disabled="inferenceState === 'running'"
        @click="runInference"
        @keydown="onButtonKeydown"
      >
        {{ t('neural.runInference') }}
      </button>

      <div
        class="neural-state neon-text"
        :data-state="inferenceState"
        aria-hidden="true"
      >
        {{ stateLabel }}
      </div>

      <div
        v-if="readout"
        class="neural-readout"
        data-test="neural-readout"
        role="status"
        aria-live="polite"
        :aria-label="t('neural.aria.readout')"
      >
        <span class="neural-readout-label">{{ t('neural.readout.label') }}:</span>
        <span class="neural-readout-decision">{{ t('neural.readout.' + readout.decisionKey) }}</span>
        <span class="neural-readout-confidence">· {{ readout.confidence }}{{ t('neural.readout.confidenceSuffix') }}</span>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import Scanlines from './Scanlines.vue'
import { useLanguage } from '../composables/useLanguage'
import { useNeuralNet } from '../composables/useNeuralNet.js'

const { t } = useLanguage()

const {
  layers,
  nodes,
  synapses,
  inferenceState,
  pulses,
  readout,
  runInference,
  beginDrag,
  dragTo,
  endDrag,
  prefersReducedMotion,
  isBreathingEligible,
} = useNeuralNet()

// --- hover/focus highlight -------------------------------------------------
// Tracking the hovered/focused node id lets us mark its connected synapses
// `highlighted` and render the tooltip. Any interaction resets the idle timer
// via the composable.
const hoveredNodeId = ref(null)
const hoveredNode = computed(() =>
  hoveredNodeId.value ? nodes.value.find((n) => n.id === hoveredNodeId.value) : null,
)

function onNodeEnter(node) {
  hoveredNodeId.value = node.id
}
function onNodeLeave() {
  hoveredNodeId.value = null
}

// A synapse is highlighted when it touches the hovered/focused node.
function isSynapseHighlighted(s) {
  if (!hoveredNodeId.value) return false
  return s.from === hoveredNodeId.value || s.to === hoveredNodeId.value
}
const highlightedCount = computed(
  () => synapses.value.filter(isSynapseHighlighted).length,
)

// --- keyboard on nodes -----------------------------------------------------
// Enter/Space on a node toggles its highlight (focus already does this via
// @focus). We prevent default for Space to avoid page scroll.
function onNodeKeydown(e, node) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    onNodeEnter(node)
  }
}

// --- keyboard on the run button -------------------------------------------
function onButtonKeydown(e) {
  if (e.key === 'Enter') {
    // Native click already fires on Enter for <button>, but keep a guard so a
    // synthetic keydown test that doesn't synthesize a click still triggers
    // inference.
    e.preventDefault()
    runInference()
  }
}

// --- drag (pointer) --------------------------------------------------------
// Drag repositions a node; the composable recomputes synapse geometry live.
// We attach the move/up listeners on pointermove/pointerup (window-level) only
// while dragging so we don't pay for them otherwise.
let dragging = false
function onPointerDown(node, event) {
  // Only respond to primary button / touch.
  if (event && event.button !== undefined && event.button !== 0) return
  dragging = true
  beginDrag(node, event)
  const onMove = (ev) => dragTo(ev)
  const onUp = () => {
    if (!dragging) return
    dragging = false
    endDrag()
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
  }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
}

// --- inference pulses -> SVG coords ----------------------------------------
// Each pulse has a path (array of node ids) and a progress (0..1). We map
// progress to a position along the path by linearly interpolating between
// consecutive node coords. Pulses are hidden once inference is done (the
// readout takes over).
const visiblePulses = computed(() => {
  if (inferenceState.value !== 'running') return []
  const byId = new Map(nodes.value.map((n) => [n.id, n]))
  const out = []
  for (const p of pulses.value) {
    const path = p.path
    if (!path || path.length === 0) continue
    if (path.length === 1) {
      const n = byId.get(path[0])
      if (n) out.push({ id: p.id, x: n.x, y: n.y })
      continue
    }
    const seg = 1 / (path.length - 1)
    const idx = Math.min(path.length - 2, Math.floor(p.progress / seg))
    const frac = (p.progress - idx * seg) / seg
    const a = byId.get(path[idx])
    const b = byId.get(path[idx + 1])
    if (a && b) {
      out.push({
        id: p.id,
        x: a.x + (b.x - a.x) * frac,
        y: a.y + (b.y - a.y) * frac,
      })
    }
  }
  return out
})

// --- state label + one-shot glitch flash -----------------------------------
const STATE_KEY = {
  idle: 'neural.inferenceState.idle',
  running: 'neural.inferenceState.running',
  done: 'neural.inferenceState.done',
}
const stateLabel = computed(() => t(STATE_KEY[inferenceState.value] || STATE_KEY.idle))

const glitchFlash = ref(false)
watch(inferenceState, async (state) => {
  if (state === 'done' && !prefersReducedMotion.value) {
    glitchFlash.value = true
    // One-shot: clear after ~0.8s (well under the 0.9s seizure-risk ceiling).
    await nextTick()
    setTimeout(() => {
      glitchFlash.value = false
    }, 800)
  }
})
</script>

<style scoped>
.neural-core {
  position: relative;
  font-family: 'Courier New', 'Consolas', monospace;
  background: rgba(5, 8, 14, 0.92);
  border: 1px solid rgba(0, 255, 255, 0.3);
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow:
    0 0 24px rgba(0, 255, 255, 0.18),
    0 0 60px rgba(255, 0, 255, 0.08);
  overflow: hidden;
}

.neural-core-header {
  text-align: center;
  margin-bottom: 1rem;
}

.neural-core-title {
  font-family: 'Orbitron', monospace;
  font-size: 1.4rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #00ffff;
  margin: 0;
}

.neural-core-subtitle {
  font-size: 0.85rem;
  color: #8be9ff;
  margin: 0.4rem 0 0;
  letter-spacing: 0.08em;
}

.neural-core-stage {
  position: relative;
  border: 1px solid rgba(0, 255, 255, 0.18);
  border-radius: 6px;
  background: radial-gradient(
    ellipse at center,
    rgba(0, 40, 60, 0.5) 0%,
    rgba(2, 4, 10, 0.85) 70%
  );
  padding: 0.5rem;
  overflow: hidden;
}

.neural-svg {
  display: block;
  width: 100%;
  height: auto;
  max-height: 320px;
}

/* ---- synapses ------------------------------------------------------------ */
.neural-synapse {
  stroke: rgba(0, 255, 255, 0.22);
  stroke-width: 1;
  transition: stroke 0.2s ease, stroke-width 0.2s ease;
}

.neural-synapse.highlighted {
  stroke: #00ffff;
  stroke-width: 1.8;
  filter: drop-shadow(0 0 4px #00ffff);
}

/* ---- nodes --------------------------------------------------------------- */
.neural-node {
  cursor: pointer;
  outline: none;
}

.neural-node-circle {
  fill: #0a1a2a;
  stroke: #00ffff;
  stroke-width: 1.5;
  filter: drop-shadow(0 0 3px rgba(0, 255, 255, 0.7));
  transition: fill 0.2s ease, stroke-width 0.2s ease;
}

.neural-node-halo {
  fill: rgba(255, 0, 255, 0.08);
  stroke: rgba(255, 0, 255, 0.35);
  stroke-width: 0.5;
  opacity: 0.5;
}

.neural-node.hovered .neural-node-circle,
.neural-node:focus .neural-node-circle {
  fill: #00ffff;
  stroke-width: 2.5;
}

/*
 * ACTIVE breathing animation — the idle "alive" pulse (AC 1.5). This rule
 * applies the @keyframes neural-breathing to every node when the SVG root (or
 * the node itself) wears the `breathing` class. The class is only bound when
 * isBreathingEligible (idle + motion allowed), so under reduced motion this
 * animation never runs. The reduced-motion guard below is the second line of
 * defense (CSS-level), belt-and-suspenders with the JS skip.
 */
.neural-svg.breathing .neural-node.breathing .neural-node-circle,
.neural-node.breathing .neural-node-circle {
  animation: neural-breathing 4s ease-in-out infinite;
}

@keyframes neural-breathing {
  0%, 100% {
    opacity: 0.7;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.18);
  }
}

/* The pulse packet itself: a bright neon dot. Only rendered during running. */
.neural-pulse {
  fill: #ff00ff;
  filter: drop-shadow(0 0 6px #ff00ff);
}

/* ---- tooltip ------------------------------------------------------------- */
.neural-tooltip {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: rgba(0, 10, 20, 0.92);
  border: 1px solid rgba(0, 255, 255, 0.5);
  border-radius: 4px;
  padding: 0.4rem 0.6rem;
  font-size: 0.75rem;
  color: #c8ffe8;
  pointer-events: none;
  z-index: 3;
}

.neural-tooltip-row {
  display: flex;
  gap: 0.4rem;
}

.neural-tooltip-key {
  color: #00ffff;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

/* ---- controls + readout -------------------------------------------------- */
.neural-core-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1rem;
}

.neural-run-button {
  padding: 0.5rem 1.1rem;
  background: rgba(0, 255, 255, 0.08);
  color: #00ffff;
  border: 1px solid #00ffff;
  border-radius: 4px;
  font-family: inherit;
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: background 0.2s ease, box-shadow 0.2s ease;
}

.neural-run-button:hover:not(:disabled) {
  background: rgba(0, 255, 255, 0.18);
  box-shadow: 0 0 12px rgba(0, 255, 255, 0.5);
}

.neural-run-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.neural-state {
  font-size: 0.8rem;
  color: #00ff88;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.neural-readout {
  margin-left: auto;
  padding: 0.4rem 0.7rem;
  background: rgba(255, 0, 255, 0.08);
  border: 1px solid rgba(255, 0, 255, 0.45);
  border-radius: 4px;
  font-size: 0.95rem;
  letter-spacing: 0.08em;
  color: #ff66ff;
  text-shadow: 0 0 6px rgba(255, 0, 255, 0.6);
}

.neural-readout-label {
  color: #00ffff;
  margin-right: 0.4rem;
}

.neural-readout-confidence {
  color: #c8ffe8;
  margin-left: 0.3rem;
}

/* Shared neon-text convention. */
.neon-text {
  text-shadow:
    0 0 5px currentColor,
    0 0 10px currentColor;
}

/* Visually-hidden but available to AT (AC 3.1 SR description). */
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* ---- one-shot glitch flash on completion --------------------------------- */
/* A short neon scan-tear + "INFERENCE COMPLETE" stamp. Auto-clears via v-if
   (glitchFlash resets after 800ms). Period well under the 0.9s strobe ceiling. */
.neural-glitch-flash {
  position: absolute;
  inset: 0;
  z-index: 4;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 0, 255, 0.12);
  animation: neural-glitch-flash 0.8s ease-out forwards;
}

.neural-glitch-text {
  font-family: 'Orbitron', monospace;
  font-size: 1.2rem;
  letter-spacing: 0.2em;
  color: #00ffff;
  text-shadow:
    0 0 8px #00ffff,
    0 0 16px #ff00ff;
  animation: neural-glitch-stamp 0.8s ease-out forwards;
}

@keyframes neural-glitch-flash {
  0% { background: rgba(255, 0, 255, 0); }
  15% { background: rgba(255, 0, 255, 0.25); }
  100% { background: rgba(0, 255, 255, 0); }
}

@keyframes neural-glitch-stamp {
  0% { opacity: 0; transform: scale(0.9); }
  20% { opacity: 1; transform: scale(1.05); }
  100% { opacity: 0; transform: scale(1.1); }
}

/* ---- mobile degrade ------------------------------------------------------ */
@media (max-width: 768px) {
  .neural-core {
    padding: 1rem;
  }
  .neural-core-title {
    font-size: 1.1rem;
  }
  .neural-readout {
    margin-left: 0;
    width: 100%;
    text-align: center;
  }
}

/* ---- REDUCED MOTION GUARD ------------------------------------------------
 * (AC 3.2). Two layers of defense: the .reduced-motion class (bound from the
 * composable's prefersReducedMotion) AND the prefers-reduced-motion media
 * query. Both set animation: none so no rapid flash / breathing can run, even
 * if the breathing class were somehow bound. This is the second half of the
 * visual-AC gate: deleting it fails the reduced-motion assertion. */
.neural-core.reduced-motion .neural-svg.breathing .neural-node.breathing .neural-node-circle,
.neural-core.reduced-motion .neural-node.breathing .neural-node-circle,
.neural-core.reduced-motion .neural-glitch-flash,
.neural-core.reduced-motion .neural-glitch-text {
  animation: none;
}

@media (prefers-reduced-motion: reduce) {
  .neural-svg.breathing .neural-node.breathing .neural-node-circle,
  .neural-node.breathing .neural-node-circle,
  .neural-glitch-flash,
  .neural-glitch-text {
    animation: none;
  }
}
</style>
