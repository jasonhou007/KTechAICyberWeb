<script setup>
/**
 * @file RumDashboard.vue
 * @description Opt-in Core Web Vitals metrics viewer (#187).
 * @ticket #187 - CWV: continuous performance monitoring (RUM beacon)
 *
 * Thin presentation layer over the `rum` injected composable (provided by
 * App.vue from useRumBeacon()). The toggle both flips the composable's runtime
 * `enabled` state AND persists the choice to the preferences store so it
 * survives reloads. Default collapsed/hidden until enabled — it does NOT clutter
 * the cyberpunk hero; the toggle sits inline near the footer status dot.
 *
 * WCAG 2.1 AA:
 *  - The toggle is a native <button> with aria-pressed + aria-label.
 *  - Space AND Enter both activate (native button behavior + explicit handler).
 *  - The dashboard region has role="region" + aria-labelledby pointing at the
 *    visible title id.
 *  - An aria-live="polite" status region announces the collection state.
 *  - Reduced-motion (prefersReducedMotion) suppresses the optional pulse.
 */
import { computed, inject } from 'vue'
import { useLanguage } from '../composables/useLanguage'
import { usePreferencesStore } from '../stores/preferences'
import { prefersReducedMotion } from '../utils/accessibility'

const { t } = useLanguage()
const preferences = usePreferencesStore()

// App.vue provides('rum', useRumBeacon()). Default to an inert stub if injected
// out of context so the component never throws when rendered standalone.
const rum = inject('rum', {
  enabled: { value: false },
  history: { value: [] },
  latest: { value: null },
  config: { endpoint: null, sampleRate: 1, enabled: false },
  setEnabled: () => {},
  flushNow: () => {},
  __resetForTests: () => {},
})

const reduced = computed(() => prefersReducedMotion())

// The toggle binds to the composable's reactive `enabled`. Toggling flips the
// composable (runtime observers) AND persists the choice to the store so the
// user's opt-in/out survives a reload.
function toggle() {
  const next = !rum.enabled.value
  rum.setEnabled(next)
  preferences.setRumEnabled(next)
}

// Explicit Space + Enter handler: native <button> already activates on both,
// but pinning it here makes the keyboard AC explicit + testable in isolation.
function onToggleKeydown(e) {
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault()
    toggle()
  }
}

// Flatten the history samples into one row per metric for the table. Each row
// carries data-rating so the dashboard can color it good/needs/poor. Samples
// are shown newest-first (most recent collection at the top); metrics within a
// single sample keep their natural order.
const rows = computed(() => {
  const out = []
  const samples = (rum.history.value || []).slice().reverse()
  for (const sample of samples) {
    for (const m of sample.metrics || []) {
      out.push({ ...m, ts: sample.ts })
    }
  }
  return out
})

const hasHistory = computed(() => rows.value.length > 0)

// Most-recent individual reading (any one of the 5 metrics). Bound to
// rum.latest on the live template path — this is what makes the composable's
// exported `latest` a real consumer (iter-10 dead-reactive-state gate). null
// until the first metric lands.
const latestMetric = computed(() => rum.latest.value || null)

function metricLabel(name) {
  return t(`rum.dashboard.metric.${name}`)
}

function ratingLabel(rating) {
  return t(`rum.rating.${rating}`)
}

function clearHistory() {
  rum.__resetForTests && rum.__resetForTests()
}

function formatTime(ts) {
  try {
    return new Date(ts).toLocaleTimeString()
  } catch {
    return ''
  }
}
</script>

<template>
  <section
    class="rum-dashboard"
    :class="{ 'is-collapsed': !rum.enabled.value, 'rum-pulse': rum.enabled.value && !reduced }"
  >
    <button
      type="button"
      class="rum-toggle"
      data-test="rum-toggle"
      :aria-pressed="rum.enabled.value ? 'true' : 'false'"
      :aria-label="t('rum.toggle.label')"
      @click="toggle"
      @keydown="onToggleKeydown"
    >
      <span class="rum-dot" aria-hidden="true"></span>
      <span>{{ rum.enabled.value ? t('rum.toggle.enabled') : t('rum.toggle.disabled') }}</span>
    </button>

    <div
      v-show="rum.enabled.value"
      data-test="rum-region"
      class="rum-region"
      :class="{ 'is-collapsed': !rum.enabled.value }"
      role="region"
      aria-labelledby="rum-region-title"
    >
      <h3 id="rum-region-title" class="rum-region-title">
        {{ t('rum.dashboard.title') }}
      </h3>
      <p class="rum-description">{{ t('rum.dashboard.description') }}</p>

      <!-- Latest-reading readout: at-a-glance current status, distinct from the
           historical table below. Bound to rum.latest (the most-recent single
           metric reported) so the composable's exported `latest` has a live
           template consumer (iter-10 dead-reactive-state gate). -->
      <p
        v-if="latestMetric"
        class="rum-latest"
        data-test="rum-latest"
        :data-rating="latestMetric.rating"
      >
        <span class="rum-latest-label">{{ t('rum.dashboard.latestTitle') }}:</span>
        <span class="rum-latest-metric">{{ metricLabel(latestMetric.name) }}</span>
        <span class="rum-latest-value">{{ latestMetric.value }}</span>
        <span class="rum-latest-rating">{{ ratingLabel(latestMetric.rating) }}</span>
      </p>
      <p v-else class="rum-latest rum-latest-empty" data-test="rum-latest">
        <span class="rum-latest-label">{{ t('rum.dashboard.latestTitle') }}:</span>
        {{ t('rum.dashboard.noLatest') }}
      </p>

      <div
        class="rum-status"
        data-test="rum-status"
        role="status"
        aria-live="polite"
      >
        {{ rum.enabled.value ? t('rum.status.collecting') : t('rum.status.disabled') }}
      </div>

      <table v-if="hasHistory" class="rum-table">
        <thead>
          <tr>
            <th scope="col">{{ t('rum.dashboard.column.time') }}</th>
            <th scope="col">{{ t('rum.dashboard.column.metric') }}</th>
            <th scope="col">{{ t('rum.dashboard.column.value') }}</th>
            <th scope="col">{{ t('rum.dashboard.column.rating') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, i) in rows"
            :key="i"
            data-test="rum-metric-row"
            :data-rating="row.rating"
          >
            <td>{{ formatTime(row.ts) }}</td>
            <td>{{ metricLabel(row.name) }}</td>
            <td>{{ row.value }}</td>
            <td>{{ ratingLabel(row.rating) }}</td>
          </tr>
        </tbody>
      </table>
      <p v-else class="rum-empty" data-test="rum-empty">{{ t('rum.status.collecting') }}</p>

      <button
        v-if="hasHistory"
        type="button"
        class="rum-clear"
        data-test="rum-clear"
        :aria-label="t('rum.clear.label')"
        @click="clearHistory"
      >
        {{ t('rum.clear.label') }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.rum-dashboard {
  font-family: 'Rajdhani', sans-serif;
  color: var(--color-text-secondary, #b0b0b0);
}
.rum-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: transparent;
  border: 1px solid rgba(0, 240, 255, 0.3);
  color: var(--color-text-secondary, #b0b0b0);
  padding: 0.25rem 0.6rem;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  cursor: pointer;
  border-radius: 2px;
}
.rum-toggle:focus-visible {
  outline: 2px solid #00f0ff;
  outline-offset: 2px;
}
.rum-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #555;
}
.rum-toggle[aria-pressed='true'] .rum-dot {
  background: #00ff88;
  box-shadow: 0 0 8px #00ff88;
}
.rum-region {
  margin-top: 0.5rem;
  padding: 0.75rem;
  border: 1px solid rgba(0, 240, 255, 0.2);
  border-radius: 2px;
  background: rgba(10, 10, 15, 0.6);
}
.rum-region.is-collapsed {
  display: none;
}
.rum-region-title {
  margin: 0 0 0.25rem;
  font-size: 0.95rem;
  color: #00f0ff;
}
.rum-description {
  margin: 0 0 0.5rem;
  font-size: 0.8rem;
  color: #b0b0b0;
}
.rum-status {
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
}
.rum-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.78rem;
}
.rum-table th,
.rum-table td {
  text-align: left;
  padding: 0.2rem 0.4rem;
  border-bottom: 1px solid rgba(0, 240, 255, 0.1);
}
.rum-latest {
  font-size: 0.78rem;
  margin: 0 0 0.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: baseline;
  padding: 0.25rem 0.4rem;
  border-left: 2px solid rgba(0, 240, 255, 0.4);
  background: rgba(0, 240, 255, 0.04);
}
.rum-latest-label {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #00f0ff;
  font-size: 0.7rem;
}
.rum-latest-metric {
  color: var(--color-text-secondary, #b0b0b0);
}
.rum-latest-value {
  font-weight: 600;
  color: #e0e0e0;
}
.rum-latest-rating {
  font-size: 0.72rem;
}
.rum-latest[data-rating='good'] .rum-latest-rating { color: #00ff88; }
.rum-latest[data-rating='needs-improvement'] .rum-latest-rating { color: #ffaa00; }
.rum-latest[data-rating='poor'] .rum-latest-rating { color: #ff4444; }
.rum-latest-empty {
  color: #888;
  font-style: italic;
}
.rum-table tr[data-rating='good'] td:last-child {
  color: #00ff88;
}
.rum-table tr[data-rating='needs-improvement'] td:last-child {
  color: #ffaa00;
}
.rum-table tr[data-rating='poor'] td:last-child {
  color: #ff4444;
}
.rum-empty {
  font-size: 0.8rem;
  color: #888;
  margin: 0.5rem 0;
}
.rum-clear {
  margin-top: 0.4rem;
  background: transparent;
  border: 1px solid rgba(255, 68, 68, 0.4);
  color: #ff8888;
  padding: 0.2rem 0.5rem;
  font-size: 0.75rem;
  cursor: pointer;
  border-radius: 2px;
}
.rum-clear:focus-visible {
  outline: 2px solid #ff4444;
  outline-offset: 2px;
}
/* Optional pulse on the wrapper when actively collecting. Suppressed under
   prefers-reduced-motion (reduced-motion users' perf matters too, but the
   animation is decorative). */
@keyframes rum-pulse {
  0%, 100% { box-shadow: 0 0 0 rgba(0, 255, 136, 0); }
  50% { box-shadow: 0 0 8px rgba(0, 255, 136, 0.25); }
}
.rum-pulse {
  animation: rum-pulse 2.4s ease-in-out infinite;
}
@media (prefers-reduced-motion: reduce) {
  .rum-pulse { animation: none; }
}
</style>
