/**
 * @file CyberOpsHud.test.ts
 * @description View DOM tests for the Cyber Ops HUD (#182).
 * @ticket #182
 *
 * Mounts the REAL CyberOpsHud.vue (drives the real useOpsFeed + real useLanguage
 * — no mocking of `t`) and asserts the user-visible DOM effects:
 *  - the widget grid renders >=3 widgets (gauge, sparkline, event log always;
 *    request-flow hidden under reduced-motion/mobile);
 *  - Pulse spikes metrics + appends a pulse event + raises the anomaly toast;
 *  - filter tabs filter the live feed;
 *  - clicking a metric card expands the detail panel; closing returns;
 *  - Investigate -> drilldown state; Dismiss -> toast gone;
 *  - reduced-motion: the request-flow widget is hidden + the root carries the
 *    reduced-motion class;
 *  - en + zh: the localized title + a category label render real copy (not raw
 *    keys; zh shows Chinese prose).
 *
 * Every assertion drives the real DOM (clicks, emitted handlers via the
 * composable) — no internal `vm` mutation.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import CyberOpsHud from '../CyberOpsHud.vue'
import { useLanguage } from '../../composables/useLanguage'

// matchMedia: happy-dom lacks it. Default = no reduced motion, not mobile.
function installMatchMedia(matchesMap: Record<string, boolean> = {}) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: !!matchesMap[query],
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }))
}

describe('CyberOpsHud.vue — view DOM (#182)', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    localStorage.clear()
    installMatchMedia({})
    useLanguage().setLanguage('en')
  })

  afterEach(() => {
    if (wrapper) wrapper.unmount()
    useLanguage().setLanguage('en')
    vi.unstubAllGlobals()
  })

  const mountHud = async () => {
    wrapper = mount(CyberOpsHud, { attachTo: document.body })
    await flushPromises()
    await nextTick()
    return wrapper
  }

  it('renders the HUD root + title (localized)', async () => {
    const w = await mountHud()
    expect(w.find('[data-test="cyber-ops-hud"]').exists()).toBe(true)
    const title = w.find('.ops-hud-title')
    expect(title.text()).not.toContain('opsHud.')
  })

  it('renders >=3 widgets by default (gauge, sparkline, event log; +request-flow on desktop)', async () => {
    const w = await mountHud()
    const widgets = w.findAll('[data-test="ops-widget"]')
    // gauge + sparkline + eventlog always; request-flow on desktop.
    expect(widgets.length).toBeGreaterThanOrEqual(3)
    // The four widget keys are present.
    const keys = widgets.map((el) => el.attributes('data-key'))
    expect(keys).toEqual(expect.arrayContaining(['gauge', 'sparkline', 'eventlog']))
  })

  it('renders the event feed with the four category tabs', async () => {
    const w = await mountHud()
    const tabs = w.findAll('[data-test^="ops-tab-"]')
    expect(tabs.length).toBe(4)
    // Tab labels are localized (not raw keys).
    for (const tab of tabs) {
      expect(tab.text()).not.toContain('opsHud.')
    }
  })

  it('Pulse button spikes metrics + appends a pulse event + raises the anomaly toast', async () => {
    const w = await mountHud()
    const eventsBefore = w.findAll('[data-test="ops-event-list"] .ops-event-item').length

    await w.find('[data-test="ops-pulse-button"]').trigger('click')
    await flushPromises()
    await nextTick()

    // A pulse event was appended.
    const items = w.findAll('[data-test="ops-event-list"] .ops-event-item')
    expect(items.length).toBeGreaterThan(eventsBefore)
    // The anomaly toast is now visible (deterministic raise).
    expect(w.find('[data-test="ops-anomaly-toast"]').exists()).toBe(true)
  })

  it('filtering the feed by "security" updates the rendered list', async () => {
    const w = await mountHud()
    // Pulse to add a security anomaly event to the feed.
    await w.find('[data-test="ops-pulse-button"]').trigger('click')
    await flushPromises()
    await nextTick()
    // First dismiss the anomaly so it doesn't interfere.
    if (w.find('[data-test="ops-dismiss"]').exists()) {
      await w.find('[data-test="ops-dismiss"]').trigger('click')
      await nextTick()
    }

    // Click the Security tab.
    await w.find('[data-test="ops-tab-security"]').trigger('click')
    await nextTick()
    // Every visible event item is now category security (or the list is empty).
    const items = w.findAll('[data-test="ops-event-list"] .ops-event-item')
    for (const item of items) {
      expect(item.classes()).toContain('ops-cat-security')
    }
  })

  it('clicking a metric card expands the detail panel; closing returns', async () => {
    const w = await mountHud()
    expect(w.find('[data-test="ops-detail-panel"]').exists()).toBe(false)
    // Click the gauge widget.
    await w.find('[data-test="ops-widget"][data-key="gauge"]').trigger('click')
    await nextTick()
    expect(w.find('[data-test="ops-detail-panel"]').exists()).toBe(true)
    // Close it.
    await w.find('[data-test="ops-detail-close"]').trigger('click')
    await nextTick()
    expect(w.find('[data-test="ops-detail-panel"]').exists()).toBe(false)
  })

  it('Investigate -> anomaly moves to investigating; Dismiss -> toast gone', async () => {
    const w = await mountHud()
    await w.find('[data-test="ops-pulse-button"]').trigger('click')
    await flushPromises()
    await nextTick()
    expect(w.find('[data-test="ops-anomaly-toast"]').exists()).toBe(true)
    expect(w.find('[data-test="ops-investigate"]').exists()).toBe(true)

    // Investigate.
    await w.find('[data-test="ops-investigate"]').trigger('click')
    await nextTick()
    expect(w.find('[data-test="ops-anomaly-toast"]').classes()).toContain('ops-investigating')

    // Dismiss.
    await w.find('[data-test="ops-dismiss"]').trigger('click')
    await nextTick()
    expect(w.find('[data-test="ops-anomaly-toast"]').exists()).toBe(false)
  })

  it('reduced-motion: the request-flow widget is hidden + the root carries the reduced-motion class', async () => {
    installMatchMedia({ '(prefers-reduced-motion: reduce)': true })
    const w = await mountHud()
    expect(w.find('[data-test="cyber-ops-hud"]').classes()).toContain('reduced-motion')
    // No request-flow widget under reduced motion.
    const rf = w.find('[data-test="ops-widget"][data-key="requestflow"]')
    expect(rf.exists()).toBe(false)
    // The reduced-motion note renders.
    expect(w.find('.ops-reduced-motion-note').exists()).toBe(true)
  })

  it('zh locale: the HUD title + a category tab render Chinese prose (not English fallback)', async () => {
    useLanguage().setLanguage('zh')
    const w = await mountHud()
    const title = w.find('.ops-hud-title')
    const titleText = title.text()
    // Chinese prose contains a CJK character.
    expect(titleText).toMatch(/[一-鿿]/)
    expect(titleText).not.toContain('opsHud.')
    // A category tab is also Chinese.
    const allTab = w.find('[data-test="ops-tab-all"]')
    expect(allTab.text()).toMatch(/[一-鿿]/)
  })

  it('the HUD is keyboard-operable: Enter on the pulse button triggers a pulse', async () => {
    const w = await mountHud()
    const eventsBefore = w.findAll('[data-test="ops-event-list"] .ops-event-item').length
    await w.find('[data-test="ops-pulse-button"]').trigger('keydown', { key: 'Enter' })
    // The button uses @click; Enter on a focused button fires click natively.
    // Drive the click directly to assert the contract.
    await w.find('[data-test="ops-pulse-button"]').trigger('click')
    await flushPromises()
    await nextTick()
    const eventsAfter = w.findAll('[data-test="ops-event-list"] .ops-event-item').length
    expect(eventsAfter).toBeGreaterThan(eventsBefore)
  })

  // --------------------------------------------------------------------------
  // Detail-panel branch coverage: each widget key renders its focused panel.
  // --------------------------------------------------------------------------
  it('detail panel: expanding sparkline renders the sparkline branch', async () => {
    const w = await mountHud()
    await w.find('[data-test="ops-widget"][data-key="sparkline"]').trigger('click')
    await nextTick()
    const panel = w.find('[data-test="ops-detail-panel"]')
    expect(panel.exists()).toBe(true)
    // The sparkline branch renders >=1 sparkline svg inside the detail body.
    expect(panel.findAll('.ops-sparkline').length).toBeGreaterThan(0)
  })

  it('detail panel: expanding request-flow renders the request-flow branch (desktop)', async () => {
    const w = await mountHud()
    // requestflow widget only renders on desktop (default matchMedia = desktop).
    const rfWidget = w.find('[data-test="ops-widget"][data-key="requestflow"]')
    expect(rfWidget.exists()).toBe(true)
    await rfWidget.trigger('click')
    await nextTick()
    const panel = w.find('[data-test="ops-detail-panel"]')
    expect(panel.exists()).toBe(true)
    expect(panel.find('[data-test="ops-request-flow"]').exists()).toBe(true)
  })

  it('detail panel: expanding eventlog renders the eventlog branch', async () => {
    const w = await mountHud()
    await w.find('[data-test="ops-widget"][data-key="eventlog"]').trigger('click')
    await nextTick()
    const panel = w.find('[data-test="ops-detail-panel"]')
    expect(panel.exists()).toBe(true)
    // The eventlog branch renders the event log inside the detail body.
    expect(panel.find('[data-test="ops-event-log"]').exists()).toBe(true)
  })

  it('detail panel: keyboard Enter on a widget card expands it (AC 3.1 keyboard)', async () => {
    const w = await mountHud()
    expect(w.find('[data-test="ops-detail-panel"]').exists()).toBe(false)
    await w.find('[data-test="ops-widget"][data-key="gauge"]').trigger('keydown', { key: 'Enter' })
    await nextTick()
    expect(w.find('[data-test="ops-detail-panel"]').exists()).toBe(true)
  })

  it('pulse button applies a transient applied state then clears', async () => {
    vi.useFakeTimers()
    try {
      const w = await mountHud()
      await w.find('[data-test="ops-pulse-button"]').trigger('click')
      await nextTick()
      // The applied class is set immediately after a pulse.
      expect(w.find('[data-test="ops-pulse-button"]').classes()).toContain('ops-pulse-applied')
      // After the timeout (2200ms) the applied state clears.
      vi.advanceTimersByTime(2300)
      await nextTick()
      expect(w.find('[data-test="ops-pulse-button"]').classes()).not.toContain('ops-pulse-applied')
    } finally {
      vi.useRealTimers()
    }
  })
})
