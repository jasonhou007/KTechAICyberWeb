<template>
  <!--
    AI Solution Forge configurator (#180). Thin presentation layer over
    useSolutionForge. Config UI (industry radiogroup, scale slider, priority
    switches) drives a deterministic blueprint forge; an assembly stage plays a
    module fly-in + neon arcs + scramble-decode + glitch reveal, then a result
    blueprint card lists the recommended services, metrics, verdict and a CTA
    router-link into the primary service. Honors prefers-reduced-motion both in
    JS (forge skips the rAF loop) and CSS (the .reduced-motion guard + the
    @media block kill every animation).
  -->
  <section
    class="solution-forge"
    :class="{ 'reduced-motion': prefersReducedMotion }"
    data-test="solution-forge"
    :aria-label="t('forge.aria.regionLabel')"
  >
    <!-- Screen-reader description of the configurator (AC 3.1). -->
    <p class="visually-hidden" data-test="forge-sr-description">
      {{ t('forge.aria.description') }}
    </p>

    <header class="forge-header">
      <h2 class="forge-title neon-text">{{ t('forge.title') }}</h2>
      <p class="forge-subtitle">{{ t('forge.subtitle') }}</p>
    </header>

    <!-- ===================== CONFIG ==================================== -->
    <div class="forge-config" data-test="forge-config">
      <!-- Industry radiogroup. Each chip is a radio so the group is a single
           select; data-key carries the industry id for E2E selectors. -->
      <fieldset class="forge-fieldset">
        <legend class="forge-legend">{{ t('forge.aria.industryGroup') }}</legend>
        <div
          class="forge-chips"
          role="radiogroup"
          :aria-label="t('forge.aria.industryGroup')"
        >
          <button
            v-for="key in industries"
            :key="key"
            type="button"
            role="radio"
            :aria-checked="industry === key"
            class="forge-chip cyber-button"
            :class="{ active: industry === key }"
            :data-key="key"
            data-test="forge-industry"
            @click="setIndustry(key)"
          >{{ t('forge.industries.' + key) }}</button>
        </div>
      </fieldset>

      <!-- Scale slider (1..5). The numeric value is exposed via aria-valuetext
           so AT users hear "3 / 5" not just a number. -->
      <div class="forge-scale">
        <label class="forge-legend" for="forge-scale-input">
          {{ t('forge.scaleLabel') }}: {{ scale }}
        </label>
        <input
          id="forge-scale-input"
          type="range"
          min="1"
          max="5"
          step="1"
          :value="scale"
          class="forge-slider"
          data-test="forge-scale"
          :aria-label="t('forge.aria.scale')"
          :aria-valuetext="`${scale} / 5`"
          @input="setScale($event.target.value)"
        />
      </div>

      <!-- Priority driver switches. data-key carries the priority id. -->
      <fieldset class="forge-fieldset">
        <legend class="forge-legend">{{ t('forge.aria.priorityGroup') }}</legend>
        <div class="forge-priorities">
          <button
            v-for="key in priorityKeys"
            :key="key"
            type="button"
            role="switch"
            :aria-checked="priorities.has(key)"
            class="forge-toggle cyber-button"
            :class="{ active: priorities.has(key) }"
            :data-key="key"
            data-test="forge-priority"
            @click="togglePriority(key)"
          >{{ t('forge.priorities.' + key) }}</button>
        </div>
      </fieldset>
    </div>

    <!-- Forge button -->
    <div class="forge-actions">
      <button
        type="button"
        class="forge-button cyber-button neon-text"
        data-test="forge-button"
        :aria-label="t('forge.forgeButton')"
        :disabled="assemblyState === 'computing'"
        @click="forge"
        @keydown.enter.prevent="forge"
      >⚡ {{ t('forge.forgeButton') }}</button>
    </div>

    <!-- ===================== ASSEMBLY STAGE ============================ -->
    <!--
      The stage is rendered once forge starts. Scanlines + neon arcs SVG +
      module fly-in (one chip per assembly step) + the scramble-decode verdict
      stamp. Under reduced motion the rAF loop is skipped and the stage is
      collapsed to the done state immediately, so the visual animation here is
      the only thing that ever moves.
    -->
    <div
      v-if="assemblyState !== 'idle'"
      class="forge-stage"
      :class="{ 'stage-done': assemblyState === 'done', 'stage-flash': glitchFlash }"
      data-test="forge-stage"
    >
      <Scanlines />

      <!-- Neon arcs: decorative SVG (aria-hidden) that traces while the forge
           computes. Pure CSS animation; suppressed under reduced motion. -->
      <svg
        class="forge-arcs"
        viewBox="0 0 200 120"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <circle class="forge-arc forge-arc-1" cx="100" cy="60" r="50" />
        <circle class="forge-arc forge-arc-2" cx="100" cy="60" r="38" />
        <circle class="forge-arc forge-arc-3" cx="100" cy="60" r="26" />
      </svg>

      <!-- Module fly-in: one chip per assembly timeline step. -->
      <div class="forge-modules" aria-hidden="true">
        <span
          v-for="(step, idx) in assemblyTimeline"
          :key="idx"
          class="forge-module"
          :style="{ '--module-index': idx }"
        >{{ step.label }}</span>
      </div>

      <!-- Scramble-decode verdict stamp. role=status so SR users hear the
           verdict decode; aria-live polite so it announces without
           interrupting. -->
      <div
        class="forge-scramble"
        data-test="forge-scramble"
        role="status"
        aria-live="polite"
        :aria-label="assemblyState === 'done' && recommendation
          ? t('forge.verdicts.' + recommendation.verdictKey)
          : t('forge.forgeButton')"
      >
        <span class="forge-scramble-text glitch-text" :data-text="scrambleText">{{ scrambleText }}</span>
      </div>

      <!-- Progress gauge (decorative; the numeric value is also exposed via
           the ARIA live region above). -->
      <div class="forge-progress" aria-hidden="true">
        <div class="forge-progress-fill" :style="{ width: (computeProgress * 100) + '%' }"></div>
      </div>
    </div>

    <!-- ===================== RESULT BLUEPRINT ========================== -->
    <div
      v-if="assemblyState === 'done' && recommendation"
      class="forge-result cyber-card"
      data-test="forge-result"
      role="status"
      aria-live="polite"
      :aria-label="t('forge.aria.result')"
    >
      <h3 class="forge-result-title neon-text">{{ t('forge.result.title') }}</h3>

      <!-- Services -->
      <ul class="forge-services" data-test="forge-services">
        <li
          v-for="id in recommendation.serviceIds"
          :key="id"
          class="forge-service"
        >{{ t('forge.services.' + id) }}</li>
      </ul>

      <!-- Metrics -->
      <dl class="forge-metrics" data-test="forge-metrics">
        <div class="forge-metric">
          <dt>{{ t('forge.metrics.throughput') }}</dt>
          <dd>{{ recommendation.metrics.throughput }}</dd>
        </div>
        <div class="forge-metric">
          <dt>{{ t('forge.metrics.accuracy') }}</dt>
          <dd>{{ recommendation.metrics.accuracy.toFixed(1) }}%</dd>
        </div>
        <div class="forge-metric">
          <dt>{{ t('forge.metrics.ttv') }}</dt>
          <dd>{{ recommendation.metrics.ttv }}w</dd>
        </div>
      </dl>

      <!-- Verdict -->
      <p class="forge-verdict neon-text" data-test="forge-verdict">
        {{ t('forge.verdicts.' + recommendation.verdictKey) }}
      </p>

      <div class="forge-result-actions">
        <router-link
          :to="'/services/' + recommendation.ctaServiceId"
          class="cyber-button neon-border forge-cta"
          data-test="forge-cta"
        >{{ t('forge.cta') }}</router-link>
        <button
          type="button"
          class="cyber-button forge-reroll"
          data-test="forge-reroll"
          @click="reroll"
        >{{ t('forge.reroll') }}</button>
        <button
          type="button"
          class="cyber-button forge-reset"
          data-test="forge-reset"
          @click="reset"
        >{{ t('forge.reset') }}</button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, watch, ref, nextTick, onUnmounted } from 'vue'
import Scanlines from './Scanlines.vue'
import { useLanguage } from '../composables/useLanguage'
import { useSolutionForge, buildAssemblyTimeline } from '../composables/useSolutionForge.js'

const { t } = useLanguage()

const {
  industry,
  scale,
  priorities,
  industries,
  priorityKeys,
  assemblyState,
  computeProgress,
  scrambleText,
  recommendation,
  forge,
  reroll,
  reset,
  setIndustry,
  setScale,
  togglePriority,
  prefersReducedMotion,
} = useSolutionForge()

// --- assembly timeline (module fly-in source) -----------------------------
// Derived off the current recommendation + the reduced-motion flag so the
// stage collapses to a single step under reduced motion (AC + visual-AC gate).
// Uses the composable's PURE buildAssemblyTimeline directly — calling it inside
// computed() tracks the live recommendation reactively, so there is no need to
// reimplement the builder here (Stage-6 review: was duplicated inline).
const assemblyTimeline = computed(() => {
  if (assemblyState.value === 'idle') return []
  // During computing the composable has already seeded recommendation.value.
  const rec = recommendation.value
  return buildAssemblyTimeline(rec, { reducedMotion: prefersReducedMotion.value })
})

// --- one-shot glitch flash on completion -----------------------------------
// Fires a short neon flash when the forge lands (assemblyState -> 'done').
// Suppressed under reduced motion. Period (800ms) is well under the 0.9s
// seizure-risk ceiling and is a single beat (no strobing). Bound to the stage
// as a CSS class so the flash is a real DOM effect, not an orphan ref.
const glitchFlash = ref(false)
// Track the one-shot glitch-flash timer so it can be cleared on unmount
// (Security Low finding: an unguarded setTimeout keeps a closure alive after
// the component is gone). Cleared in onUnmounted below.
let glitchFlashTimer = null
watch(assemblyState, async (state) => {
  if (state === 'done' && !prefersReducedMotion.value) {
    glitchFlash.value = true
    await nextTick()
    if (glitchFlashTimer) clearTimeout(glitchFlashTimer)
    glitchFlashTimer = setTimeout(() => {
      glitchFlash.value = false
      glitchFlashTimer = null
    }, 800)
  }
})

onUnmounted(() => {
  if (glitchFlashTimer) {
    clearTimeout(glitchFlashTimer)
    glitchFlashTimer = null
  }
})
</script>

<style scoped>
.solution-forge {
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

/* ---- header ------------------------------------------------------------- */
.forge-header {
  text-align: center;
  margin-bottom: 1rem;
}
.forge-title {
  font-family: 'Orbitron', monospace;
  font-size: 1.4rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #00ffff;
  margin: 0;
}
.forge-subtitle {
  font-size: 0.85rem;
  color: #8be9ff;
  margin: 0.4rem 0 0;
  letter-spacing: 0.08em;
}

/* ---- config ------------------------------------------------------------- */
.forge-config {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
}
.forge-fieldset {
  border: 1px solid rgba(0, 255, 255, 0.18);
  border-radius: 6px;
  padding: 0.6rem 0.8rem;
  margin: 0;
}
.forge-legend {
  font-family: 'Orbitron', monospace;
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #00ffff;
  padding: 0 0.4rem;
}
.forge-chips,
.forge-priorities {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.4rem;
}
.forge-chip,
.forge-toggle {
  padding: 0.3rem 0.7rem;
  font-family: inherit;
  font-size: 0.75rem;
  letter-spacing: 0.06em;
  color: #8be9ff;
  background: rgba(0, 255, 255, 0.06);
  border: 1px solid rgba(0, 255, 255, 0.35);
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s ease, box-shadow 0.2s ease, color 0.2s ease;
}
.forge-chip:hover,
.forge-toggle:hover {
  background: rgba(0, 255, 255, 0.16);
}
.forge-chip.active,
.forge-toggle.active {
  color: #0a0a0a;
  background: #00ffff;
  border-color: #00ffff;
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.6);
}
.forge-chip:focus-visible,
.forge-toggle:focus-visible,
.forge-button:focus-visible,
.forge-cta:focus-visible,
.forge-reroll:focus-visible,
.forge-reset:focus-visible {
  outline: 2px solid #ff00ff;
  outline-offset: 2px;
}

/* ---- scale slider ------------------------------------------------------- */
.forge-scale {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.forge-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  background: rgba(0, 255, 255, 0.18);
  border-radius: 3px;
  outline: none;
}
.forge-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #ff00ff;
  border: 2px solid #00ffff;
  box-shadow: 0 0 8px rgba(255, 0, 255, 0.7);
  cursor: pointer;
}
.forge-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #ff00ff;
  border: 2px solid #00ffff;
  box-shadow: 0 0 8px rgba(255, 0, 255, 0.7);
  cursor: pointer;
}

/* ---- forge button ------------------------------------------------------- */
.forge-actions {
  text-align: center;
  margin-bottom: 1rem;
}
.forge-button {
  padding: 0.6rem 1.4rem;
  background: rgba(0, 255, 255, 0.08);
  color: #00ffff;
  border: 1px solid #00ffff;
  border-radius: 4px;
  font-family: inherit;
  font-size: 0.95rem;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: background 0.2s ease, box-shadow 0.2s ease;
}
.forge-button:hover:not(:disabled) {
  background: rgba(0, 255, 255, 0.18);
  box-shadow: 0 0 12px rgba(0, 255, 255, 0.5);
}
.forge-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ---- assembly stage ----------------------------------------------------- */
.forge-stage {
  position: relative;
  border: 1px solid rgba(0, 255, 255, 0.18);
  border-radius: 6px;
  background: radial-gradient(
    ellipse at center,
    rgba(0, 40, 60, 0.5) 0%,
    rgba(2, 4, 10, 0.85) 70%
  );
  padding: 1rem;
  margin-bottom: 1rem;
  overflow: hidden;
  min-height: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
}
.forge-stage .scanlines {
  /* Scanlines is position:fixed globally; scope it to the stage only. */
  position: absolute;
  opacity: 0.15;
}

/* Neon arcs (decorative SVG that traces while computing). */
.forge-arcs {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.forge-arc {
  fill: none;
  stroke: rgba(0, 255, 255, 0.25);
  stroke-width: 1;
  stroke-dasharray: 6 10;
  transform-origin: 100px 60px;
}
.forge-arc-1 { animation: forge-arc-spin 6s linear infinite; stroke: rgba(0, 255, 255, 0.3); }
.forge-arc-2 { animation: forge-arc-spin 4s linear infinite reverse; stroke: rgba(255, 0, 255, 0.3); }
.forge-arc-3 { animation: forge-arc-spin 3s linear infinite; stroke: rgba(0, 255, 204, 0.3); }

@keyframes forge-arc-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Module fly-in: staggered chips, one per assembly phase. */
.forge-modules {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  justify-content: center;
  z-index: 2;
}
.forge-module {
  font-family: 'Orbitron', monospace;
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #00ffcc;
  background: rgba(0, 255, 204, 0.08);
  border: 1px solid rgba(0, 255, 204, 0.45);
  border-radius: 3px;
  padding: 0.2rem 0.5rem;
  animation: forge-module-flyin 0.5s ease-out forwards;
  animation-delay: calc(var(--module-index, 0) * 0.25s);
  opacity: 0;
}
@keyframes forge-module-flyin {
  from { opacity: 0; transform: translateY(12px) scale(0.9); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* Scramble-decode verdict stamp. */
.forge-scramble {
  position: relative;
  z-index: 2;
  text-align: center;
}
.forge-scramble-text {
  font-family: 'Orbitron', monospace;
  font-size: 1.1rem;
  letter-spacing: 0.2em;
  color: #00ffff;
  text-shadow:
    0 0 8px #00ffff,
    0 0 16px #ff00ff;
}

/* Glitch reveal — the data-text pseudo-elements tear the stamp while it
   decodes (cyberpunk aesthetic). */
.glitch-text {
  position: relative;
  display: inline-block;
}
.glitch-text::before,
.glitch-text::after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0.8;
}
.glitch-text::before {
  color: #ff00ff;
  animation: forge-glitch 0.3s infinite;
  clip-path: polygon(0 0, 100% 0, 100% 45%, 0 45%);
}
.glitch-text::after {
  color: #00ffcc;
  animation: forge-glitch 0.3s infinite reverse;
  clip-path: polygon(0 55%, 100% 55%, 100% 100%, 0 100%);
}
@keyframes forge-glitch {
  0% { transform: translate(0); }
  20% { transform: translate(-2px, 2px); }
  40% { transform: translate(-2px, -2px); }
  60% { transform: translate(2px, 2px); }
  80% { transform: translate(2px, -2px); }
  100% { transform: translate(0); }
}

/* Progress gauge. */
.forge-progress {
  position: relative;
  z-index: 2;
  width: 80%;
  height: 4px;
  background: rgba(0, 255, 255, 0.15);
  border-radius: 2px;
  overflow: hidden;
}
.forge-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #00ffff, #ff00ff);
  box-shadow: 0 0 8px rgba(255, 0, 255, 0.6);
  transition: width 0.1s linear;
}

/* One-shot glitch flash when the stage lands (single beat, <0.9s). */
.forge-stage.stage-done {
  animation: forge-stage-flash 0.8s ease-out forwards;
}
@keyframes forge-stage-flash {
  0% { box-shadow: 0 0 0 rgba(255, 0, 255, 0); }
  15% { box-shadow: 0 0 30px rgba(255, 0, 255, 0.5); }
  100% { box-shadow: 0 0 0 rgba(255, 0, 255, 0); }
}

/* ---- result blueprint --------------------------------------------------- */
.forge-result {
  padding: 1.2rem;
  border: 1px solid rgba(255, 0, 255, 0.35);
  border-radius: 8px;
  background: rgba(10, 15, 28, 0.85);
}
.forge-result-title {
  font-family: 'Orbitron', monospace;
  font-size: 1rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #00ffcc;
  margin: 0 0 0.8rem;
}
.forge-services {
  list-style: none;
  padding: 0;
  margin: 0 0 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.forge-service {
  font-size: 0.85rem;
  color: #c8ffe8;
  padding-left: 1rem;
  position: relative;
}
.forge-service::before {
  content: '▸';
  position: absolute;
  left: 0;
  color: #00ffff;
}
.forge-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  margin: 0 0 0.8rem;
}
.forge-metric {
  text-align: center;
  padding: 0.4rem;
  border: 1px solid rgba(0, 255, 255, 0.2);
  border-radius: 4px;
  background: rgba(0, 255, 255, 0.05);
}
.forge-metric dt {
  font-size: 0.65rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #00ffff;
}
.forge-metric dd {
  margin: 0.2rem 0 0;
  font-size: 0.95rem;
  color: #ff66ff;
  text-shadow: 0 0 6px rgba(255, 0, 255, 0.5);
}
.forge-verdict {
  font-family: 'Orbitron', monospace;
  font-size: 0.9rem;
  letter-spacing: 0.1em;
  text-align: center;
  color: #00ffcc;
  margin: 0 0 0.8rem;
  padding: 0.5rem;
  border: 1px dashed rgba(0, 255, 204, 0.5);
  border-radius: 4px;
}
.forge-result-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
}
.forge-cta,
.forge-reroll,
.forge-reset {
  padding: 0.5rem 1rem;
  font-family: 'Orbitron', monospace;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  color: #00ffff;
  background: rgba(0, 255, 255, 0.08);
  border: 1px solid #00ffff;
  border-radius: 4px;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.2s ease, box-shadow 0.2s ease;
}
.forge-reroll { color: #ff00ff; border-color: #ff00ff; }
.forge-reset { color: #8be9ff; border-color: rgba(0, 255, 255, 0.5); }
.forge-cta:hover,
.forge-reroll:hover,
.forge-reset:hover {
  background: rgba(0, 255, 255, 0.18);
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.4);
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

/* ---- mobile ------------------------------------------------------------- */
@media (max-width: 768px) {
  .solution-forge { padding: 1rem; }
  .forge-title { font-size: 1.1rem; }
  .forge-metrics { grid-template-columns: 1fr; }
  .forge-result-actions { flex-direction: column; }
  .forge-cta, .forge-reroll, .forge-reset { width: 100%; }
}

/* ---- REDUCED MOTION GUARD ------------------------------------------------
 * (AC 3.2 + visual-AC gate). Two layers of defense: the .reduced-motion class
 * (bound from the composable's prefersReducedMotion) AND the
 * prefers-reduced-motion media query. Both set animation: none so no arc spin,
 * module fly-in, glitch tear, or stage flash can run — even if the JS skip in
 * forge() were somehow bypassed. This is the second half of the visual-AC
 * gate: deleting it fails the reduced-motion assertion. */
.solution-forge.reduced-motion .forge-arc,
.solution-forge.reduced-motion .forge-module,
.solution-forge.reduced-motion .forge-stage.stage-done,
.solution-forge.reduced-motion .glitch-text::before,
.solution-forge.reduced-motion .glitch-text::after,
.solution-forge.reduced-motion .forge-progress-fill {
  animation: none;
}

@media (prefers-reduced-motion: reduce) {
  .forge-arc,
  .forge-module,
  .forge-stage.stage-done,
  .glitch-text::before,
  .glitch-text::after,
  .forge-progress-fill {
    animation: none;
  }
}
</style>
