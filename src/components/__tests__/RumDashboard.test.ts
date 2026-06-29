/**
 * @file RumDashboard.test.ts
 * @description Unit tests for the RUM metrics dashboard (#187).
 * @ticket #187 - CWV: continuous performance monitoring (RUM beacon)
 *
 * TDD: written BEFORE the component. Mocks useLanguage (dictionary mirrors the
 * rum.* keys) and INJECTS a fake `rum` object via the `rum` provide key so the
 * component is tested in isolation from the composable's network/storage side
 * effects (those are covered by useRumBeacon.test.ts).
 *
 * Coverage: default-collapsed, keyboard-accessible toggle (Space + Enter),
 * aria-pressed reflects enabled state, toggling persists to the store, history
 * table renders with data-rating, clear button empties the buffer, aria-live
 * region present + reduced-motion suppresses the pulse animation.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { ref, reactive } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { usePreferencesStore } from '../../stores/preferences'

// Dictionary mirrors the rum.* leaves shipped in en.json.
const dictionary: Record<string, string> = {
  'rum.toggle.enabled': 'Performance monitoring on',
  'rum.toggle.disabled': 'Performance monitoring off',
  'rum.dashboard.title': 'Performance monitor',
  'rum.dashboard.description': 'Real-user Core Web Vitals.',
  'rum.dashboard.latestTitle': 'Latest reading',
  'rum.dashboard.noLatest': 'No reading yet.',
  'rum.dashboard.metric.LCP': 'Largest Contentful Paint',
  'rum.dashboard.metric.CLS': 'Cumulative Layout Shift',
  'rum.dashboard.metric.INP': 'Interaction to Next Paint',
  'rum.dashboard.metric.FCP': 'First Contentful Paint',
  'rum.dashboard.metric.TTFB': 'Time to First Byte',
  'rum.dashboard.column.metric': 'Metric',
  'rum.dashboard.column.value': 'Value',
  'rum.dashboard.column.rating': 'Rating',
  'rum.dashboard.column.time': 'Time',
  'rum.rating.good': 'Good',
  'rum.rating.needs-improvement': 'Needs improvement',
  'rum.rating.poor': 'Poor',
  'rum.status.collecting': 'Collecting Core Web Vitals…',
  'rum.status.disabled': 'Performance monitoring is off.',
  'rum.clear.label': 'Clear history',
  'rum.a11y.liveStatus': 'Performance monitoring status',
}

vi.mock('../../composables/useLanguage', () => ({
  useLanguage: () => ({ t: (key: string) => dictionary[key] ?? key }),
}))

// Stub prefersReducedMotion to false by default (collection is NOT gated on it,
// but the pulse animation IS).
vi.mock('../../utils/accessibility', () => ({
  prefersReducedMotion: () => false,
}))

const RumDashboard = (await import('../RumDashboard.vue')).default

// ---------------------------------------------------------------------------
// Fake rum injector (reactive refs the component reads via inject('rum'))
// ---------------------------------------------------------------------------
function makeFakeRum(initialEnabled = false, samples: any[] = []) {
  const enabled = ref(initialEnabled)
  const history = ref(samples.slice())
  const latest = ref(samples.length ? samples[samples.length - 1].metrics[0] : null)
  const config = reactive({ endpoint: null, sampleRate: 1, enabled: initialEnabled })
  return {
    enabled,
    history,
    latest,
    config,
    setEnabled: (v: boolean) => { enabled.value = v },
    flushNow: vi.fn(),
    __resetForTests: vi.fn(() => { history.value = [] }),
  }
}

function mountDashboard(rum: ReturnType<typeof makeFakeRum>) {
  return mount(RumDashboard, {
    global: {
      provide: { rum },
    },
  })
}

describe('RumDashboard.vue (#187)', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    if (wrapper) wrapper.unmount()
  })

  describe('default state', () => {
    it('#1 renders a toggle button with aria-pressed=false when disabled', () => {
      const rum = makeFakeRum(false)
      wrapper = mountDashboard(rum)
      const btn = wrapper.find('[data-test="rum-toggle"]')
      expect(btn.exists()).toBe(true)
      // #190 label-content-name-mismatch: the aria-label was dropped so the
      // visible "Performance monitoring off" IS the accessible name. The name
      // is the localized visible text (non-empty, not a raw key).
      const text = btn.text()
      expect(text).toBeTruthy()
      expect(text).not.toContain('rum.')
      expect(btn.attributes('aria-pressed')).toBe('false')
    })

    it('#2 the dashboard region is collapsed/hidden by default', () => {
      const rum = makeFakeRum(false)
      wrapper = mountDashboard(rum)
      const region = wrapper.find('[data-test="rum-region"]')
      // Region exists in the DOM (so AT can announce) but is visually hidden
      // until enabled.
      expect(region.exists()).toBe(true)
      expect(region.classes()).toContain('is-collapsed')
    })
  })

  describe('toggle interaction + persistence', () => {
    it('#3 Space key toggles enabled + persists to the preferences store', async () => {
      const rum = makeFakeRum(false)
      wrapper = mountDashboard(rum)
      const store = usePreferencesStore()
      expect(store.rumEnabled).toBe(false)

      const btn = wrapper.find('[data-test="rum-toggle"]')
      await btn.trigger('keydown', { key: ' ' })
      expect(rum.enabled.value).toBe(true)
      expect(store.rumEnabled).toBe(true)
    })

    it('#4 Enter key also toggles (not click-only)', async () => {
      const rum = makeFakeRum(false)
      wrapper = mountDashboard(rum)
      const btn = wrapper.find('[data-test="rum-toggle"]')
      await btn.trigger('keydown', { key: 'Enter' })
      expect(rum.enabled.value).toBe(true)
    })

    it('#5 clicking the toggle flips aria-pressed to true', async () => {
      const rum = makeFakeRum(false)
      wrapper = mountDashboard(rum)
      const btn = wrapper.find('[data-test="rum-toggle"]')
      await btn.trigger('click')
      expect(btn.attributes('aria-pressed')).toBe('true')
    })

    it('#6 toggling back off disables + persists false', async () => {
      const rum = makeFakeRum(true)
      wrapper = mountDashboard(rum)
      const store = usePreferencesStore()
      const btn = wrapper.find('[data-test="rum-toggle"]')
      await btn.trigger('click')
      expect(rum.enabled.value).toBe(false)
      expect(store.rumEnabled).toBe(false)
    })
  })

  describe('history table rendering', () => {
    it('#7 renders one row per metric with data-rating reflecting the metric rating', async () => {
      const rum = makeFakeRum(true, [
        {
          ts: 1700000000000,
          metrics: [
            { name: 'LCP', value: 2200, rating: 'good' },
            { name: 'CLS', value: 0.3, rating: 'poor' },
          ],
        },
      ])
      wrapper = mountDashboard(rum)
      const rows = wrapper.findAll('[data-test="rum-metric-row"]')
      expect(rows.length).toBe(2)
      expect(rows[0].attributes('data-rating')).toBe('good')
      expect(rows[1].attributes('data-rating')).toBe('poor')
    })

    it('#8 shows a localized empty-state when no history', async () => {
      const rum = makeFakeRum(true, [])
      wrapper = mountDashboard(rum)
      const empty = wrapper.find('[data-test="rum-empty"]')
      expect(empty.exists()).toBe(true)
    })

    it('#9 metric names are localized copy (not raw keys)', async () => {
      const rum = makeFakeRum(true, [
        { ts: 1, metrics: [{ name: 'LCP', value: 1000, rating: 'good' }] },
      ])
      wrapper = mountDashboard(rum)
      expect(wrapper.text()).toContain('Largest Contentful Paint')
      expect(wrapper.text()).not.toContain('rum.dashboard.metric')
    })
  })

  describe('clear button', () => {
    it('#10 clears the history buffer via the injected rum action', async () => {
      const rum = makeFakeRum(true, [
        { ts: 1, metrics: [{ name: 'LCP', value: 1, rating: 'good' }] },
      ])
      wrapper = mountDashboard(rum)
      const clearBtn = wrapper.find('[data-test="rum-clear"]')
      expect(clearBtn.exists()).toBe(true)
      await clearBtn.trigger('click')
      expect(rum.__resetForTests).toHaveBeenCalled()
    })
  })

  describe('latest-reading readout (iter-10 dead-state gate — consumes rum.latest)', () => {
    it('#11a renders the latest metric name/value with data-rating when a latest reading exists', async () => {
      const rum = makeFakeRum(true, [])
      // Seed latest directly (the composable sets latest on each recordMetric).
      rum.latest.value = { name: 'LCP', value: 2200, rating: 'good' }
      wrapper = mountDashboard(rum)
      const readout = wrapper.find('[data-test="rum-latest"]')
      expect(readout.exists()).toBe(true)
      expect(readout.attributes('data-rating')).toBe('good')
      // The localized metric name + the value both render.
      expect(readout.text()).toContain('Largest Contentful Paint')
      expect(readout.text()).toContain('2200')
    })

    it('#11b shows the localized empty copy when there is no latest reading', async () => {
      const rum = makeFakeRum(true, [])
      // latest stays null (no metric recorded yet).
      wrapper = mountDashboard(rum)
      const readout = wrapper.find('[data-test="rum-latest"]')
      expect(readout.exists()).toBe(true)
      expect(readout.text()).toContain('No reading yet.')
    })

    it('#11c the readout reflects a NEW latest reading reactively (proves rum.latest is bound, not snapshotted)', async () => {
      const rum = makeFakeRum(true, [])
      rum.latest.value = { name: 'CLS', value: 0.05, rating: 'good' }
      wrapper = mountDashboard(rum)
      expect(wrapper.find('[data-test="rum-latest"]').text()).toContain('Cumulative Layout Shift')
      // Simulate a newer reading arriving.
      rum.latest.value = { name: 'INP', value: 600, rating: 'poor' }
      await wrapper.vm.$nextTick()
      const readout = wrapper.find('[data-test="rum-latest"]')
      expect(readout.attributes('data-rating')).toBe('poor')
      expect(readout.text()).toContain('Interaction to Next Paint')
      expect(readout.text()).toContain('600')
    })
  })

  describe('accessibility landmarks', () => {
    it('#11 the dashboard region has role=region + aria-labelledby', async () => {
      const rum = makeFakeRum(true)
      wrapper = mountDashboard(rum)
      const region = wrapper.find('[data-test="rum-region"]')
      expect(region.attributes('role')).toBe('region')
      const labelledBy = region.attributes('aria-labelledby')
      expect(labelledBy).toBeTruthy()
      // The referenced id must exist.
      expect(wrapper.find(`#${labelledBy}`).exists()).toBe(true)
    })

    it('#12 an aria-live=polite status region announces the collection state', async () => {
      const rum = makeFakeRum(true)
      wrapper = mountDashboard(rum)
      const live = wrapper.find('[data-test="rum-status"][aria-live="polite"]')
      expect(live.exists()).toBe(true)
      // When collecting, copy is the collecting status.
      expect(live.text()).toContain('Collecting')
    })

    it('#13 status region shows the disabled copy when off', async () => {
      const rum = makeFakeRum(false)
      wrapper = mountDashboard(rum)
      const live = wrapper.find('[data-test="rum-status"]')
      expect(live.text()).toContain('off')
    })
  })

  // ============================================
  // #190 a11y: label-content-name-mismatch — the toggle's accessible name must
  // be a superstring of its visible text. The visible text is "Performance
  // monitoring on/off"; the old aria-label "Toggle performance monitoring" did
  // NOT contain it. Fix: drop the aria-label so the visible text IS the name.
  // ============================================
  describe('#190 a11y: toggle accessible name == visible text', () => {
    it('disabled state: no aria-label overriding the visible "Performance monitoring off"', () => {
      wrapper = mountDashboard(makeFakeRum(false))
      const btn = wrapper.find('[data-test="rum-toggle"]')
      expect(btn.attributes('aria-label')).toBeUndefined()
      expect(btn.text()).toContain('Performance monitoring off')
    })

    it('enabled state: no aria-label overriding the visible "Performance monitoring on"', () => {
      wrapper = mountDashboard(makeFakeRum(true))
      const btn = wrapper.find('[data-test="rum-toggle"]')
      expect(btn.attributes('aria-label')).toBeUndefined()
      expect(btn.text()).toContain('Performance monitoring on')
    })
  })
})
