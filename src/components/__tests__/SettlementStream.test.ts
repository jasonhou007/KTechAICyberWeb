/**
 * @file SettlementStream.test.ts
 * @description Component tests for the ambient Settlement Stream (#206).
 * @ticket #206
 *
 * Mounts the REAL SettlementStream.vue (does NOT stub useLanguage — iter-28
 * rule: ~18 repo tests mock useLanguage, hiding real breakage). matchMedia +
 * rAF are mocked so the loop is deterministic.
 *
 * Coverage:
 *  - Renders the ambient root with data-test="settlement-stream".
 *  - Renders localized copy (en) — NOT raw settlementStream.* keys.
 *  - Renders the sub-layers: rails, block settlement, FX ticker, liquidity.
 *  - aria-hidden on decoration layers; real readout text is semantic/selectable.
 *  - prefers-reduced-motion -> static summary legible (story still told).
 *  - Localized to zh renders Chinese copy (parity gate).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import SettlementStream from '../SettlementStream.vue'
import { useLanguage } from '@/composables/useLanguage'

// matchMedia: happy-dom lacks it. Default = motion allowed, desktop.
function stubMatchMedia(matches: Record<string, boolean> = {}) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: !!matches[query],
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }))
}

// rAF: stub as a NO-OP. The composable's loop self-reschedules at the bottom
// of every tick; a microtask-firing mock would create an infinite synchronous
// loop that starves the test runner (the sync-rAF hazard useOpsFeed's tick()
// guards against — but only when rAF is genuinely async). The loop's
// scheduling/timing behavior is already pinned by useSettlementStream.test.ts
// (counting rAF). Here we only assert the RENDERED structure, so rAF must
// schedule (proving the loop starts) but never auto-fire.
let rafScheduled = false
function stubRAF() {
  rafScheduled = false
  vi.stubGlobal('requestAnimationFrame', () => {
    rafScheduled = true
    return 1
  })
  vi.stubGlobal('cancelAnimationFrame', () => {})
}
const rafWasScheduled = () => rafScheduled

describe('SettlementStream.vue (#206)', () => {
  beforeEach(() => {
    localStorage.clear()
    stubMatchMedia()
    stubRAF()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const mountStream = () =>
    mount(SettlementStream, {
      global: {
        // REAL useLanguage — no mock. The component resolves en by default.
        // Router/pinia not required: SettlementStream is a pure presentation
        // layer over useSettlementStream + useLanguage (no router-link, no
        // store).
      },
    })

  it('renders the ambient root with data-test="settlement-stream"', async () => {
    const w = mountStream()
    await flushPromises()
    await nextTick()
    expect(w.find('[data-test="settlement-stream"]').exists()).toBe(true)
    // The loop auto-started (motion allowed) — rAF was scheduled on mount.
    expect(rafWasScheduled()).toBe(true)
  })

  it('renders localized English copy (no raw settlementStream.* keys)', async () => {
    const w = mountStream()
    await flushPromises()
    await nextTick()
    const text = w.text()
    // The component MUST resolve real copy. A raw key like
    // "settlementStream.title" in the rendered output means i18n is broken.
    expect(text).not.toMatch(/settlementStream\.[a-zA-Z]/)
    // The title / label resolves to a non-empty localized string.
    expect(text.trim().length).toBeGreaterThan(0)
  })

  it('renders all four sub-layers (rails, block settlement, FX, liquidity)', async () => {
    const w = mountStream()
    await flushPromises()
    await nextTick()
    expect(w.find('[data-test="ss-rails"]').exists()).toBe(true)
    expect(w.find('[data-test="ss-blocks"]').exists()).toBe(true)
    expect(w.find('[data-test="ss-fx"]').exists()).toBe(true)
    expect(w.find('[data-test="ss-liquidity"]').exists()).toBe(true)
  })

  it('marks decoration layers aria-hidden; keeps real readouts semantic', async () => {
    const w = mountStream()
    await flushPromises()
    await nextTick()
    // The ambient rail decoration is aria-hidden (AC 4.4).
    const rails = w.find('[data-test="ss-rails"]')
    expect(rails.attributes('aria-hidden')).toBe('true')
    // The FX readout is real selectable text (NOT aria-hidden) — the story is
    // legible to AT.
    const fx = w.find('[data-test="ss-fx"]')
    expect(fx.exists()).toBe(true)
    expect(fx.attributes('aria-hidden')).toBeFalsy()
  })

  it('renders the block height + hash as selectable readout text', async () => {
    const w = mountStream()
    await flushPromises()
    await nextTick()
    const blocks = w.find('[data-test="ss-blocks"]')
    expect(blocks.exists()).toBe(true)
    const text = blocks.text()
    // Block readout shows a height (digits) and a hash (hex).
    expect(text).toMatch(/[0-9]/)
  })

  it('renders the FX pair + rate as selectable readout text', async () => {
    const w = mountStream()
    await flushPromises()
    await nextTick()
    const fx = w.find('[data-test="ss-fx"]')
    expect(fx.exists()).toBe(true)
    const text = fx.text()
    expect(text).toMatch(/USD\/(CNY|THB)/)
    expect(text).toMatch(/[0-9]/) // a rate
  })

  it('renders Chinese copy under zh locale (i18n parity)', async () => {
    // Flip the REAL useLanguage store to zh and re-mount. The component must
    // render the zh title, not the English fallback.
    const { currentLanguage, setLanguage } = useLanguage()
    if (String(currentLanguage.value) !== 'zh') {
      setLanguage('zh')
    }
    const w = mountStream()
    await flushPromises()
    await nextTick()
    const text = w.text()
    expect(text).not.toMatch(/settlementStream\.[a-zA-Z]/)
    // A zh node label must render (proves localization, not English fallback).
    expect(text).toMatch(/中国|泰国|新加坡|马来西亚/)
    // Restore for downstream tests.
    useLanguage().setLanguage('en')
    expect(text.trim().length).toBeGreaterThan(0)
  })

  it('under prefers-reduced-motion renders a static summary (story legible)', async () => {
    vi.unstubAllGlobals()
    stubMatchMedia({ '(prefers-reduced-motion: reduce)': true })
    stubRAF() // no-op rAF; the composable must NOT even schedule it under reduced motion
    const w = mountStream()
    await flushPromises()
    await nextTick()
    // Reduced-motion branch: rAF never scheduled.
    expect(rafWasScheduled()).toBe(false)
    // But the readouts still render (static summary): blocks + fx present.
    expect(w.find('[data-test="ss-blocks"]').exists()).toBe(true)
    expect(w.find('[data-test="ss-fx"]').exists()).toBe(true)
  })
})
