<script setup>
/**
 * CyberOpsHud.vue — Cyber Ops HUD interactive dashboard (#182).
 *
 * Thin presentation layer over useOpsFeed. Owns the HUD frame (corner-bracket
 * borders), a SCOPED scanline strip (NOT the global Scanlines.vue, which is
 * position:fixed), and the widget grid. Every useOpsFeed ref is bound to a
 * template consumer here (dead-reactive-state gate).
 *
 * Reuses the existing cyber palette via CSS vars (no new colors):
 *   --neon-green / --neon-blue / --neon-pink / --card-bg / --card-border /
 *   --glow-color / --text-secondary.
 *
 * @ticket #182
 */
import { ref } from 'vue'
import { useOpsFeed } from '../composables/useOpsFeed'
import { useLanguage } from '../composables/useLanguage'
import OpsGauge from './ops/OpsGauge.vue'
import OpsSparkline from './ops/OpsSparkline.vue'
import OpsRequestFlow from './ops/OpsRequestFlow.vue'
import OpsEventLog from './ops/OpsEventLog.vue'
import OpsAnomalyToast from './ops/OpsAnomalyToast.vue'
import OpsPulseButton from './ops/OpsPulseButton.vue'

const { t } = useLanguage()

const {
  uptime,
  latencyHistory,
  throughputHistory,
  requestCount,
  anomalyState,
  activeAnomaly,
  activeCategory,
  filteredEvents,
  expandedWidget,
  prefersReducedMotion,
  isMobile,
  categories,
  pulse,
  setCategory,
  expandWidget,
  collapseWidget,
  investigate,
  dismissAnomaly,
} = useOpsFeed()

// Local UI flag: briefly highlight the pulse button after a pulse.
const pulseApplied = ref(false)
let pulseTimer = null
function onPulse() {
  pulse()
  pulseApplied.value = true
  if (pulseTimer) window.clearTimeout(pulseTimer)
  pulseTimer = window.setTimeout(() => {
    pulseApplied.value = false
  }, 2200)
}

const WIDGET_KEYS = ['gauge', 'sparkline', 'requestflow', 'eventlog']
function widgetLabel(key) {
  // sparkline has a single label key; gauge/requestflow/eventlog likewise.
  return t('opsHud.widgets.' + key + '.label')
}
</script>

<template>
  <section
    class="cyber-ops-hud"
    :class="{ 'reduced-motion': prefersReducedMotion }"
    data-test="cyber-ops-hud"
    :aria-label="t('opsHud.aria.regionLabel')"
  >
    <!-- SR description (AC 3.1). -->
    <p class="visually-hidden">{{ t('opsHud.aria.description') }}</p>

    <!-- Scoped scanline strip (NOT the global position:fixed Scanlines.vue). -->
    <div class="ops-scanlines" aria-hidden="true"></div>

    <header class="ops-hud-header">
      <h2 class="ops-hud-title neon-text">{{ t('opsHud.title') }}</h2>
      <p class="ops-hud-subtitle">{{ t('opsHud.subtitle') }}</p>
    </header>

    <!-- ===================== WIDGET GRID ============================ -->
    <div class="ops-widget-grid" data-test="ops-widget-grid">
      <!-- Uptime gauge -->
      <article
        class="ops-widget ops-widget-gauge"
        :class="{ expanded: expandedWidget === 'gauge' }"
        data-test="ops-widget"
        data-key="gauge"
        tabindex="0"
        :aria-label="widgetLabel('gauge')"
        @click="expandWidget('gauge')"
        @keydown.enter.prevent="expandWidget('gauge')"
      >
        <OpsGauge
          :value="uptime"
          :label="t('opsHud.widgets.gauge.label')"
          :unit="t('opsHud.widgets.gauge.unit')"
          :reduced-motion="prefersReducedMotion"
        />
      </article>

      <!-- Latency + Throughput sparklines -->
      <article
        class="ops-widget ops-widget-sparkline"
        :class="{ expanded: expandedWidget === 'sparkline' }"
        data-test="ops-widget"
        data-key="sparkline"
        tabindex="0"
        :aria-label="t('opsHud.widgets.sparkline.label')"
        @click="expandWidget('sparkline')"
        @keydown.enter.prevent="expandWidget('sparkline')"
      >
        <OpsSparkline
          :history="latencyHistory"
          :label="t('opsHud.widgets.sparkline.label')"
          :unit="t('opsHud.widgets.sparkline.unit')"
          color="blue"
        />
        <OpsSparkline
          :history="throughputHistory"
          :label="t('opsHud.widgets.sparkline.labelAlt')"
          :unit="t('opsHud.widgets.sparkline.unitAlt')"
          color="green"
        />
      </article>

      <!-- Request-flow particles (hidden on mobile/reduced-motion). -->
      <article
        v-if="!isMobile && !prefersReducedMotion"
        class="ops-widget ops-widget-requestflow"
        :class="{ expanded: expandedWidget === 'requestflow' }"
        data-test="ops-widget"
        data-key="requestflow"
        tabindex="0"
        :aria-label="t('opsHud.widgets.requestflow.label')"
        @click="expandWidget('requestflow')"
        @keydown.enter.prevent="expandWidget('requestflow')"
      >
        <OpsRequestFlow
          :tick="requestCount"
          :label="t('opsHud.widgets.requestflow.label')"
        />
      </article>

      <!-- Event log -->
      <article
        class="ops-widget ops-widget-eventlog"
        :class="{ expanded: expandedWidget === 'eventlog' }"
        data-test="ops-widget"
        data-key="eventlog"
        tabindex="0"
        :aria-label="t('opsHud.widgets.eventlog.label')"
        @click="expandWidget('eventlog')"
        @keydown.enter.prevent="expandWidget('eventlog')"
      >
        <OpsEventLog
          :events="filteredEvents"
          :categories="categories"
          :active-category="activeCategory"
          :aria-feed-label="t('opsHud.aria.feedLive')"
          @set-category="setCategory"
        />
      </article>
    </div>

    <!-- ===================== CONTROLS =============================== -->
    <div class="ops-controls">
      <OpsPulseButton
        :label="t('opsHud.pulse.label')"
        :aria-label="t('opsHud.aria.pulseButton')"
        :applied="pulseApplied"
        @pulse="onPulse"
      />
    </div>

    <!-- ===================== ANOMALY TOAST ========================= -->
    <OpsAnomalyToast
      :state="anomalyState"
      :anomaly="activeAnomaly"
      :reduced-motion="prefersReducedMotion"
      :aria-label="t('opsHud.aria.anomalyLive')"
      :investigate-label="t('opsHud.aria.investigateButton')"
      :dismiss-label="t('opsHud.aria.dismissButton')"
      title-key="opsHud.anomaly.title"
      drilldown-key="opsHud.anomaly.drilldown"
      @investigate="investigate"
      @dismiss="dismissAnomaly"
    />

    <!-- ===================== DETAIL PANEL ========================== -->
    <transition name="ops-detail">
      <div
        v-if="expandedWidget"
        class="ops-detail-panel"
        data-test="ops-detail-panel"
        :aria-label="t('opsHud.aria.closeDetail')"
      >
        <button
          type="button"
          class="ops-detail-close"
          data-test="ops-detail-close"
          :aria-label="t('opsHud.aria.closeDetail')"
          @click="collapseWidget"
        >✕</button>
        <h3 class="ops-detail-title">{{ widgetLabel(expandedWidget) }}</h3>
        <div class="ops-detail-body">
          <template v-if="expandedWidget === 'gauge'">
            <OpsGauge
              :value="uptime"
              :label="t('opsHud.widgets.gauge.label')"
              :unit="t('opsHud.widgets.gauge.unit')"
              :reduced-motion="prefersReducedMotion"
            />
          </template>
          <template v-else-if="expandedWidget === 'sparkline'">
            <OpsSparkline :history="latencyHistory" :label="t('opsHud.widgets.sparkline.label')" :unit="t('opsHud.widgets.sparkline.unit')" color="blue" />
            <OpsSparkline :history="throughputHistory" :label="t('opsHud.widgets.sparkline.labelAlt')" :unit="t('opsHud.widgets.sparkline.unitAlt')" color="green" />
          </template>
          <template v-else-if="expandedWidget === 'requestflow' && !isMobile && !prefersReducedMotion">
            <OpsRequestFlow :tick="requestCount" :label="t('opsHud.widgets.requestflow.label')" />
          </template>
          <template v-else>
            <OpsEventLog
              :events="filteredEvents"
              :categories="categories"
              :active-category="activeCategory"
              :aria-feed-label="t('opsHud.aria.feedLive')"
              @set-category="setCategory"
            />
          </template>
        </div>
      </div>
    </transition>

    <p v-if="prefersReducedMotion" class="ops-reduced-motion-note">{{ t('opsHud.reducedMotion') }}</p>
  </section>
</template>

<style scoped>
.cyber-ops-hud {
  position: relative;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  padding: 1.5rem;
  margin: 2rem auto;
  max-width: 1000px;
  /* Corner-bracket HUD frame via layered box-shadows (no new colors). */
  box-shadow:
    0 0 10px var(--glow-color),
    inset 0 0 20px rgba(0, 0, 0, 0.4);
}

/* Corner brackets — four ::before/::after-free accents using background-image
   linear-gradients in the neon color, scoped to this component only. */
.cyber-ops-hud::before,
.cyber-ops-hud::after {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  border: 2px solid var(--neon-green);
  pointer-events: none;
}

.cyber-ops-hud::before {
  top: -1px;
  left: -1px;
  border-right: none;
  border-bottom: none;
}

.cyber-ops-hud::after {
  bottom: -1px;
  right: -1px;
  border-left: none;
  border-top: none;
}

/* SCOPED scanline strip — repeating-linear-gradient, position:absolute WITHIN
   the frame (NOT the global position:fixed Scanlines.vue). */
@keyframes ops-scanline {
  0% { background-position: 0 0; }
  100% { background-position: 0 100%; }
}

.ops-scanlines {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  background-image: repeating-linear-gradient(
    0deg,
    rgba(0, 255, 136, 0.03) 0px,
    rgba(0, 255, 136, 0.03) 1px,
    transparent 1px,
    transparent 3px
  );
  background-size: 100% 6px;
  animation: ops-scanline 8s linear infinite;
  z-index: 0;
}

/* Header */
.ops-hud-header {
  position: relative;
  z-index: 1;
  text-align: center;
  margin-bottom: 1.2rem;
}

.ops-hud-title {
  font-family: var(--font-display);
  font-size: 1.6rem;
  color: var(--neon-green);
  margin: 0;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.ops-hud-subtitle {
  font-family: var(--font-body);
  font-size: 0.95rem;
  color: var(--text-secondary);
  margin: 0.3rem 0 0 0;
  letter-spacing: 0.06em;
}

/* Widget grid */
.ops-widget-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.ops-widget {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--card-border);
  padding: 0.8rem;
  border-radius: 3px;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 120px;
}

.ops-widget:hover,
.ops-widget:focus-visible {
  border-color: var(--neon-green);
  box-shadow: 0 0 8px var(--glow-color);
  outline: none;
}

.ops-widget.expanded {
  border-color: var(--neon-green);
  box-shadow: 0 0 12px var(--neon-green);
}

/* Controls */
.ops-controls {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}

/* Detail panel */
.ops-detail-panel {
  position: relative;
  z-index: 1;
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--neon-green);
  border-radius: 3px;
}

.ops-detail-close {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: transparent;
  border: 1px solid var(--card-border);
  color: var(--text-secondary);
  cursor: pointer;
  width: 24px;
  height: 24px;
  border-radius: 2px;
  font-size: 0.8rem;
  line-height: 1;
}

.ops-detail-close:hover,
.ops-detail-close:focus-visible {
  border-color: var(--neon-green);
  color: var(--neon-green);
  outline: none;
}

.ops-detail-title {
  font-family: var(--font-display);
  font-size: 1rem;
  color: var(--neon-green);
  margin: 0 0 0.8rem 0;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.ops-detail-body {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  align-items: center;
}

.ops-detail-enter-active,
.ops-detail-leave-active {
  transition: opacity 0.2s ease;
}

.ops-detail-enter-from,
.ops-detail-leave-to {
  opacity: 0;
}

.ops-reduced-motion-note {
  position: relative;
  z-index: 1;
  text-align: center;
  font-family: var(--font-body);
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin: 0.8rem 0 0 0;
  opacity: 0.7;
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

/* ---- reduced motion: kill every animation (AC 3.2, seizure-safe) -------- */
@media (prefers-reduced-motion: reduce) {
  .cyber-ops-hud .ops-scanlines,
  .cyber-ops-hud .ops-needle,
  .cyber-ops-hud .ops-glitch,
  .cyber-ops-hud * {
    animation: none !important;
  }
}

/* Class-guard belt-and-suspenders (the .reduced-motion class is applied to the
   root when prefersReducedMotion is true). */
.reduced-motion .ops-scanlines,
.reduced-motion .ops-glitch,
.reduced-motion .ops-needle {
  animation: none !important;
}

/* ---- mobile ------------------------------------------------------------- */
@media (max-width: 768px) {
  .ops-widget-grid {
    grid-template-columns: 1fr;
  }

  .ops-hud-title {
    font-size: 1.3rem;
  }
}
</style>
