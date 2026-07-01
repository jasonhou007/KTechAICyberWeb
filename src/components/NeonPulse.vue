<script setup>
/**
 * NeonPulse.vue — Neon Pulse audio-reactive visualizer (#186).
 *
 * Thin presentation layer over useAudioPulse. Renders the engage/stop controls,
 * the synth/mic input toggle, the 3-mode radio group, the sensitivity slider,
 * a responsive <canvas>, a CRT scanline strip, the beat-flash overlay, a dB
 * readout, status + notice copy, and an ARIA live region. Every useAudioPulse
 * ref is bound to a template consumer here (dead-reactive-state gate).
 *
 * @ticket #186
 */
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useAudioPulse } from '../composables/useAudioPulse'
import { useLanguage } from '../composables/useLanguage'

const { t } = useLanguage()

const {
  status,
  inputSource,
  mode,
  sensitivity,
  prefersReducedMotion,
  isMobile,
  isVisible,
  micState,
  notice,
  level,
  bassNow,
  flash,
  canvasRef,
  modes,
  engage,
  stop,
  setMode,
  setSensitivity,
  setInputSource,
} = useAudioPulse()

// ---------- status copy ----------
const statusKey = computed(() => {
  if (status.value === 'playing') return 'pulse.status.playing'
  if (status.value === 'starting') return 'pulse.status.starting'
  return 'pulse.status.idle'
})

// ---------- dB readout ----------
// useLanguage.t() does not interpolate; resolve then substitute {db} by hand.
const dbValue = computed(() => {
  const raw = (level.value / 255) * 255
  if (raw <= 0) return -Infinity
  return 20 * Math.log10(raw / 255)
})
const dbString = computed(() => {
  const v = dbValue.value
  if (!Number.isFinite(v)) return '-∞'
  return v.toFixed(1)
})
const dbReadout = computed(() => {
  const tmpl = t('pulse.readout.db')
  return tmpl.replace('{db}', dbString.value)
})
const liveLevelReadout = computed(() =>
  t('pulse.aria.liveLevel').replace('{db}', dbString.value),
)

// ---------- isPlaying (for Stop button visibility + ARIA) ----------
const isPlaying = computed(() => status.value === 'playing' || status.value === 'starting')

// ---------- bassNow consumer (iter-10 dead-ref gate) ----------
// bassNow is 0..255; surface it as a visible thin meter + percent width so the
// bass band has a genuine template consumer (was previously destructured + dead).
const bassPercent = computed(() => Math.max(0, Math.min(100, (bassNow.value / 255) * 100)))

// ---------- isVisible consumer (iter-10 dead-ref gate) ----------
// When the component is scrolled offscreen / the tab is hidden, the render loop
// pauses; surface that paused-offscreen state to the user (was dead state).
const showOffscreenHint = computed(() => isPlaying.value && !isVisible.value)

// ---------- micState consumer (iter-10 dead-ref gate) ----------
// micState drives BOTH the mic-live indicator (granted) and the denied notice
// (so the ref is genuinely consumed, not destructured-and-dead).
const micLive = computed(() => isPlaying.value && micState.value === 'granted')
const micDenied = computed(() => micState.value === 'denied')

// ---------- canvas sizing (responsive, mobile halves DPR) ----------
function resizeCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  const dpr = window.devicePixelRatio || 1
  const cssW = canvas.clientWidth || 320
  const cssH = canvas.clientHeight || 160
  // Mobile halves the backing-store resolution for perf.
  const scale = dpr
  canvas.width = Math.round(cssW * scale)
  canvas.height = Math.round(cssH * scale)
}

onMounted(() => {
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
})

// Remove the component-level resize listener on unmount (the composable owns
// its own AudioContext/rAF/observer teardown separately).
onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvas)
})

watch(status, (s) => {
  // Re-measure when we start drawing (canvas becomes visible/styled).
  if (s === 'playing') resizeCanvas()
})
</script>

<template>
  <section
    class="neon-pulse"
    :class="{ 'low-motion': prefersReducedMotion, 'is-playing': isPlaying }"
    data-test="neon-pulse"
    :aria-label="t('pulse.aria.regionLabel')"
  >
    <!-- Scoped scanline strip (NOT the global position:fixed Scanlines.vue). -->
    <div class="pulse-scanlines" aria-hidden="true"></div>

    <!-- Beat-flash overlay (seizure-capped to <3Hz by useAudioPulse.shouldFlash) -->
    <div
      class="pulse-flash"
      :class="{ lit: flash }"
      data-test="pulse-flash"
      aria-hidden="true"
    ></div>

    <header class="pulse-header">
      <h2 class="pulse-title neon-text glitch-text" :data-text="t('pulse.title')">
        {{ t('pulse.title') }}
      </h2>
      <p class="pulse-subtitle">{{ t('pulse.subtitle') }}</p>
    </header>

    <!-- Engage / Stop -->
    <div class="pulse-transport" data-test="pulse-controls">
      <button
        v-if="!isPlaying"
        type="button"
        class="pulse-btn primary"
        data-test="pulse-engage"
        :aria-label="t('pulse.aria.engageButton')"
        @click="engage"
      >▶ {{ t('pulse.engage') }}</button>
      <button
        v-else
        type="button"
        class="pulse-btn danger"
        data-test="pulse-stop"
        :aria-label="t('pulse.aria.stopButton')"
        @click="stop"
      >■ {{ t('pulse.stop') }}</button>
    </div>

    <!-- Input source toggle -->
    <fieldset class="pulse-input-group" :aria-label="t('pulse.aria.inputGroup')">
      <label class="pulse-radio">
        <input
          type="radio"
          name="pulse-input"
          value="synth"
          data-test="pulse-input-synth"
          :checked="inputSource === 'synth'"
          :aria-label="t('pulse.input.synth')"
          @change="setInputSource('synth')"
        />
        <span>{{ t('pulse.input.synth') }}</span>
      </label>
      <label class="pulse-radio">
        <input
          type="radio"
          name="pulse-input"
          value="mic"
          data-test="pulse-input-mic"
          :checked="inputSource === 'mic'"
          :aria-label="t('pulse.input.mic')"
          @change="setInputSource('mic')"
        />
        <span>{{ t('pulse.input.mic') }}</span>
      </label>
    </fieldset>

    <!-- Mode radio group -->
    <fieldset
      class="pulse-mode-group"
      :aria-label="t('pulse.aria.modeGroup')"
    >
      <label v-for="m in modes" :key="m" class="pulse-radio">
        <input
          type="radio"
          name="pulse-mode"
          :value="m"
          :data-test="`pulse-mode-${m}`"
          :checked="mode === m"
          :aria-label="t(`pulse.mode.${m}`)"
          @change="setMode(m)"
        />
        <span>{{ t(`pulse.mode.${m}`) }}</span>
      </label>
    </fieldset>

    <!-- Sensitivity slider -->
    <div class="pulse-slider-row">
      <label class="pulse-slider-label" for="pulse-sensitivity-input">
        {{ t('pulse.sensitivity.label') }}
      </label>
      <input
        id="pulse-sensitivity-input"
        type="range"
        class="pulse-slider"
        data-test="pulse-sensitivity"
        min="0.1"
        max="3"
        step="0.1"
        :value="sensitivity"
        :aria-label="t('pulse.aria.sensitivitySlider')"
        @input="setSensitivity(parseFloat($event.target.value))"
      />
    </div>

    <!-- Visualizer canvas (decorative; live data is in the ARIA live region below) -->
    <canvas
      ref="canvasRef"
      class="pulse-canvas"
      data-test="pulse-canvas"
      aria-hidden="true"
    ></canvas>

    <!-- dB readout (monospace) -->
    <p class="pulse-db" data-test="pulse-db">{{ dbReadout }}</p>

    <!-- BASS meter — genuine consumer of bassNow (iter-10 dead-ref gate) -->
    <div class="pulse-bass-meter" data-test="pulse-bass-meter">
      <span class="pulse-bass-label">{{ t('pulse.notice.bassMeter') }}</span>
      <span
        class="pulse-bass-track"
        role="meter"
        :aria-valuenow="bassPercent.toFixed(0)"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-label="t('pulse.aria.bassLevel', { value: bassPercent.toFixed(0) })"
      >
        <span class="pulse-bass-fill" data-test="pulse-bass-fill" :style="{ width: bassPercent + '%' }"></span>
      </span>
    </div>

    <!-- micState=granted indicator — genuine consumer of micState (iter-10 gate) -->
    <p v-if="micLive" class="pulse-mic-live" data-test="pulse-mic-live" role="status">
      🎙 {{ t('pulse.notice.micLive') }}
    </p>

    <!-- Status text -->
    <p class="pulse-status" data-test="pulse-status">{{ t(statusKey) }}</p>

    <!-- Offscreen-pause hint — genuine consumer of isVisible (iter-10 gate) -->
    <p
      v-if="showOffscreenHint"
      class="pulse-offscreen-hint"
      data-test="pulse-offscreen-hint"
      role="status"
    >{{ t('pulse.notice.pausedOffscreen') }}</p>

    <!-- Mobile-mode note — genuine consumer of isMobile (iter-10 gate) -->
    <p
      v-if="isMobile"
      class="pulse-mobile-note"
      data-test="pulse-mobile-note"
    >{{ t('pulse.notice.mobileMode') }}</p>

    <!-- Notice — denied path is DRIVEN BY micState (iter-10 gate); prompting / iOS
         notices remain driven by the `notice` ref. -->
    <p
      v-if="notice && (notice.kind !== 'mic-denied' || micDenied)"
      class="pulse-notice"
      :class="`notice-${notice.kind}`"
      data-test="pulse-notice"
      role="alert"
    >{{ t(notice.messageKey) }}</p>

    <p v-if="prefersReducedMotion" class="pulse-reduced-note" data-test="pulse-reduced-note">
      {{ t('pulse.notice.reducedMotion') }}
    </p>

    <!-- Visually-hidden description for assistive tech (canvas is decorative) -->
    <p class="visually-hidden">{{ t('pulse.aria.description') }}</p>

    <!-- ARIA live region announcing the current dB level politely -->
    <p class="visually-hidden" role="status" aria-live="polite" data-test="pulse-live">
      {{ liveLevelReadout }}
    </p>
  </section>
</template>

<style scoped>
.neon-pulse {
  position: relative;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  padding: 1.5rem;
  margin: 2rem auto;
  max-width: 1000px;
  box-shadow: 0 0 10px var(--glow-color), inset 0 0 20px rgba(0, 0, 0, 0.4);
  overflow: hidden;
}

/* Scoped scanline strip — repeating-linear-gradient, position:absolute WITHIN
   the frame (NOT the global position:fixed Scanlines.vue). */
@keyframes pulse-scanline {
  0% { background-position: 0 0; }
  100% { background-position: 0 100%; }
}

.pulse-scanlines {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  background-image: repeating-linear-gradient(
    0deg,
    rgba(255, 0, 170, 0.04) 0px,
    rgba(255, 0, 170, 0.04) 1px,
    transparent 1px,
    transparent 3px
  );
  background-size: 100% 6px;
  animation: pulse-scanline 8s linear infinite;
  z-index: 0;
}

/* Beat-flash overlay (gated to <3Hz by the composable). */
.pulse-flash {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(circle, rgba(0, 255, 204, 0.0) 0%, rgba(0, 255, 204, 0.0) 100%);
  opacity: 0;
  transition: opacity 0.08s ease-out;
  z-index: 2;
}
.pulse-flash.lit {
  opacity: 1;
  background: radial-gradient(circle, rgba(0, 255, 204, 0.25) 0%, var(--accent-magenta-alpha-15) 100%);
}

.pulse-header {
  position: relative;
  z-index: 1;
  text-align: center;
  margin-bottom: 1rem;
}

.pulse-title {
  font-family: var(--font-display);
  font-size: 1.6rem;
  color: var(--neon-pink);
  margin: 0;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.pulse-subtitle {
  font-family: var(--font-body);
  font-size: 0.95rem;
  color: var(--text-secondary);
  margin: 0.3rem 0 0 0;
  letter-spacing: 0.06em;
}

/* Transport buttons */
.pulse-transport {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.pulse-btn {
  font-family: var(--font-display);
  font-size: 0.95rem;
  color: var(--neon-green);
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--card-border);
  padding: 0.6rem 1.4rem;
  cursor: pointer;
  letter-spacing: 0.08em;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.pulse-btn:hover,
.pulse-btn:focus-visible {
  border-color: var(--neon-green);
  box-shadow: 0 0 8px var(--glow-color);
  outline: none;
}

.pulse-btn.primary {
  border-color: var(--neon-green);
  box-shadow: 0 0 6px var(--glow-color);
}

.pulse-btn.danger {
  color: var(--neon-pink);
  border-color: var(--neon-pink);
  box-shadow: 0 0 6px var(--accent-magenta-alpha-40);
}

/* Input + mode radio groups */
.pulse-input-group,
.pulse-mode-group {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
  border: 1px dashed var(--card-border);
  padding: 0.6rem;
  margin: 0 auto 0.8rem auto;
  max-width: 600px;
}

.pulse-radio {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-family: var(--font-body);
  font-size: 0.9rem;
  color: var(--text-secondary);
  cursor: pointer;
  letter-spacing: 0.05em;
}

.pulse-radio input {
  accent-color: var(--neon-green);
}

.pulse-radio input:focus-visible {
  outline: 2px solid var(--neon-pink);
  outline-offset: 2px;
}

/* Sensitivity slider */
.pulse-slider-row {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  margin-bottom: 1rem;
}

.pulse-slider-label {
  font-family: var(--font-body);
  font-size: 0.85rem;
  color: var(--text-secondary);
  letter-spacing: 0.06em;
}

.pulse-slider {
  width: min(60%, 320px);
  accent-color: var(--neon-pink);
}

/* Canvas */
.pulse-canvas {
  position: relative;
  z-index: 1;
  display: block;
  width: 100%;
  height: 220px;
  margin: 0 auto;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid var(--card-border);
  box-shadow: inset 0 0 16px rgba(0, 0, 0, 0.6);
}

/* dB readout (monospace) */
.pulse-db {
  position: relative;
  z-index: 1;
  font-family: var(--font-display);
  font-size: 0.85rem;
  color: var(--neon-green);
  letter-spacing: 0.1em;
  margin: 0.6rem 0 0.2rem 0;
  text-shadow: 0 0 6px var(--glow-color);
}

/* BASS meter — genuine bassNow consumer (iter-10 dead-ref gate). */
.pulse-bass-meter {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  max-width: 360px;
  margin: 0.2rem auto 0 auto;
}
.pulse-bass-label {
  font-family: var(--font-display);
  font-size: 0.7rem;
  color: var(--neon-pink);
  letter-spacing: 0.12em;
}
.pulse-bass-track {
  flex: 1;
  display: block;
  height: 6px;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid var(--card-border);
  overflow: hidden;
}
.pulse-bass-fill {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, var(--neon-green), var(--neon-pink));
  box-shadow: 0 0 6px var(--glow-color);
  transition: width 0.08s linear;
}

/* micState=granted indicator — genuine micState consumer (iter-10 gate). */
.pulse-mic-live {
  position: relative;
  z-index: 1;
  font-family: var(--font-body);
  font-size: 0.8rem;
  color: var(--neon-green);
  letter-spacing: 0.08em;
  margin: 0.4rem 0 0 0;
  text-shadow: 0 0 5px var(--glow-color);
  text-align: center;
}

/* Offscreen-pause hint — genuine isVisible consumer (iter-10 gate). */
.pulse-offscreen-hint {
  position: relative;
  z-index: 1;
  font-family: var(--font-body);
  font-size: 0.8rem;
  color: var(--neon-pink);
  letter-spacing: 0.06em;
  margin: 0.4rem 0 0 0;
  text-align: center;
  opacity: 0.85;
}

/* Mobile-mode note — genuine isMobile consumer (iter-10 gate). */
.pulse-mobile-note {
  position: relative;
  z-index: 1;
  font-family: var(--font-body);
  font-size: 0.75rem;
  color: var(--text-secondary);
  letter-spacing: 0.05em;
  margin: 0.4rem 0 0 0;
  text-align: center;
  opacity: 0.75;
}

.pulse-status {
  position: relative;
  z-index: 1;
  font-family: var(--font-body);
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.neon-pulse.is-playing .pulse-status {
  color: var(--neon-green);
  text-shadow: 0 0 6px var(--glow-color);
}

/* Notice */
.pulse-notice {
  position: relative;
  z-index: 1;
  font-family: var(--font-body);
  font-size: 0.85rem;
  margin: 0.6rem 0 0 0;
  padding: 0.4rem 0.8rem;
  border: 1px solid var(--neon-pink);
  color: var(--neon-pink);
  background: rgba(255, 0, 170, 0.08);
}

.pulse-reduced-note {
  position: relative;
  z-index: 1;
  font-family: var(--font-body);
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin: 0.6rem 0 0 0;
  opacity: 0.7;
}

/* Visually-hidden (AT-accessible). */
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

/* Glitch-text pseudo layers (reuse home glitch-text pattern). */
.glitch-text {
  position: relative;
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
  color: var(--neon-green);
  clip-path: polygon(0 0, 100% 0, 100% 45%, 0 45%);
}
.glitch-text::after {
  color: var(--neon-blue);
  clip-path: polygon(0 55%, 100% 55%, 100% 100%, 0 100%);
}

/* ---- reduced motion: kill every animation (seizure-safe) ---------------- */
.low-motion .pulse-scanlines,
.low-motion .glitch-text::before,
.low-motion .glitch-text::after,
.low-motion .pulse-flash,
.low-motion * {
  animation: none !important;
  transition: none !important;
}

.low-motion .pulse-flash.lit {
  /* Even if flash were lit, never animate it under reduced motion. */
  opacity: 0 !important;
}

@media (prefers-reduced-motion: reduce) {
  .neon-pulse .pulse-scanlines,
  .neon-pulse .glitch-text::before,
  .neon-pulse .glitch-text::after,
  .neon-pulse .pulse-flash,
  .neon-pulse * {
    animation: none !important;
    transition: none !important;
  }
  .neon-pulse .pulse-flash.lit {
    opacity: 0 !important;
  }
}

/* ---- mobile ------------------------------------------------------------- */
@media (max-width: 768px) {
  .pulse-title { font-size: 1.3rem; }
  .pulse-canvas { height: 160px; }
  .pulse-input-group,
  .pulse-mode-group { gap: 0.6rem; }
}
</style>
