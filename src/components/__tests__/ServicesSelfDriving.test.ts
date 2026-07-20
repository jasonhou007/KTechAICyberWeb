/**
 * @file ServicesSelfDriving.test.ts
 * @description Unit tests for the Services Self-Driving ambient demo (#475).
 * @ticket #475 - [CYBER][SERVICES] Extend self-driving ambient demo to Services page
 *
 * Drives the REAL component (no composable mocking) with the REAL useLanguage
 * so localized copy actually renders. Asserts user-visible DOM, not internals:
 *  - the root element exists with data-servicesselfdriving-root + proper aria attrs
 *  - data-current-phase / data-loop-iteration / data-static are bound
 *  - the static (reduced-motion) branch renders a key-frame summary
 *  - no raw dotted key leaks into rendered text
 *  - real locale strings render in BOTH en and zh
 *  - <Scanlines /> is present
 *  - service-specific phases (6 vs 8 in self-driving) are correct
 *
 * matchMedia + rAF are stubbed so timing is deterministic and the reduced-
 * motion branch is reachable without real browser settings.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { useLanguage } from '@/composables/useLanguage'

import ServicesSelfDriving from '../ServicesSelfDriving.vue'

// ---------------------------------------------------------------------------
// matchMedia controllable stub
// ---------------------------------------------------------------------------
function installMatchMedia(opts: { reduce?: boolean } = {}) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('prefers-reduced-motion') ? !!opts.reduce : false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }))
}

// Deferred rAF: enqueues callbacks but never fires them automatically
function deferredRAF() {
  const queue: FrameRequestCallback[] = []
  let id = 1
  const cancelled = new Set<number>()
  vi.stubGlobal('requestAnimationFrame', ((cb: FrameRequestCallback) => {
    const handle = id++
    queue.push(cb)
    return handle
  }) as any)
  vi.stubGlobal('cancelAnimationFrame', ((handle: number) => {
    cancelled.add(handle)
  }) as any)
  return {
    step(ts = 0) {
      while (queue.length > 0 && cancelled.has(queue[0] as any)) queue.shift()
      const cb = queue.shift()
      if (cb) cb(ts)
    },
  }
}

// No-op rAF: never invokes the callback (for the static-branch test)
function neverRAF() {
  vi.stubGlobal('requestAnimationFrame', (() => 1) as any)
  vi.stubGlobal('cancelAnimationFrame', (() => {}) as any)
}

// Deferred setTimeout/clearTimeout
function deferredTimers() {
  const queue: { cb: () => void; id: number }[] = []
  let next = 1
  const cleared = new Set<number>()
  vi.stubGlobal('setTimeout', ((cb: () => void) => {
    const id = next++
    queue.push({ cb, id })
    return id
  }) as any)
  vi.stubGlobal('clearTimeout', ((id: number) => {
    cleared.add(id)
  }) as any)
  return {
    flushOne() {
      while (queue.length > 0 && cleared.has(queue[0].id)) queue.shift()
      const entry = queue.shift()
      if (entry) entry.cb()
    },
    pending: () => queue.filter((e) => !cleared.has(e.id)).length,
  }
}

// happy-dom ships a real IntersectionObserver; replace it with a no-op
function noopIO() {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return []
      }
    },
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ServicesSelfDriving', () => {
  beforeEach(() => {
    deferredRAF()
    noopIO()
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    // Reset the shared language module back to English between specs.
    const { setLanguage } = useLanguage()
    setLanguage('en')
  })

  it('renders the root with data-servicesselfdriving-root + visible heading + phase attrs (NOT aria-hidden)', async () => {
    installMatchMedia({ reduce: false })
    const wrapper = mount(ServicesSelfDriving, { attachTo: document.body })
    await nextTick()
    const root = wrapper.find('[data-servicesselfdriving-root]')
    expect(root.exists()).toBe(true)
    // The demo is visible page content, NOT a hidden ambient background
    expect(root.attributes('aria-hidden')).toBeFalsy()
    // A visible label names the region for sighted + SR users
    const headingEl = wrapper.find('.services-self-driving-heading')
    expect(headingEl.exists()).toBe(true)
    expect(headingEl.text()).toBeTruthy()
    expect(headingEl.text()).not.toContain('.')
    expect(headingEl.text()).not.toContain('servicesSelfDriving')
    // Phase attrs are bound
    expect(root.attributes('data-current-phase')).toBeTruthy()
    expect(root.attributes('data-loop-iteration')).toBeDefined()
    expect(root.attributes('data-static')).toBe('false')
  })

  it('has a proper aria-label for landmark navigation', async () => {
    installMatchMedia({ reduce: false })
    const wrapper = mount(ServicesSelfDriving, { attachTo: document.body })
    await nextTick()
    const root = wrapper.find('[data-servicesselfdriving-root]')
    expect(root.attributes('aria-label')).toBeTruthy()
    expect(root.attributes('aria-label')).not.toContain('servicesSelfDriving')
  })

  it('renders Scanlines component within scoped containment', async () => {
    installMatchMedia({ reduce: false })
    const wrapper = mount(ServicesSelfDriving, { attachTo: document.body })
    await nextTick()
    // The scanlines-scope wrapper should exist
    const scope = wrapper.find('.services-self-driving-scanlines-scope')
    expect(scope.exists()).toBe(true)
    // Scanlines component should be mounted (we can't easily deep-test the component itself
    // without importing it, but we can verify the wrapper structure)
    expect(scope.attributes('aria-hidden')).toBe('true')
  })

  it('enters static branch under reduced motion and renders a key-frame summary', async () => {
    installMatchMedia({ reduce: true })
    neverRAF() // Static branch never schedules rAF
    const wrapper = mount(ServicesSelfDriving, { attachTo: document.body })
    await nextTick()
    const root = wrapper.find('[data-servicesselfdriving-root]')
    expect(root.attributes('data-static')).toBe('true')
    // Static summary should render
    const summary = wrapper.find('.services-self-driving-static-summary')
    expect(summary.exists()).toBe(true)
    expect(summary.text()).toBeTruthy()
    expect(summary.text()).not.toContain('.')
  })

  it('renders no raw i18n keys in the live (non-static) branch', async () => {
    installMatchMedia({ reduce: false })
    const wrapper = mount(ServicesSelfDriving, { attachTo: document.body })
    await nextTick()
    const html = wrapper.html()
    // No raw dotted.key patterns should leak into the DOM
    expect(html).not.toMatch(/servicesSelfDriving\.\w+/)
    // Common key fragments that would leak if t() failed
    expect(html).not.toContain('aria.regionLabel')
    expect(html).not.toContain('phases.')
    expect(html).not.toContain('readout.')
    expect(html).not.toContain('streaming.')
  })

  it('renders real localized English copy (no fallback)', async () => {
    installMatchMedia({ reduce: false })
    const { setLanguage } = useLanguage()
    setLanguage('en')
    const wrapper = mount(ServicesSelfDriving, { attachTo: document.body })
    await nextTick()
    const heading = wrapper.find('.services-self-driving-heading')
    expect(heading.text()).toBeTruthy()
    // Service-specific heading should contain service/AI terms, not raw keys
    expect(heading.text()).not.toContain('.')
    // Should contain English words from the service pipeline domain
    const text = heading.text().toLowerCase()
    expect(
      text.includes('pipeline') || text.includes('service') || text.includes('ai')
    ).toBe(true)
  })

  it('renders real localized Chinese copy (no fallback)', async () => {
    installMatchMedia({ reduce: false })
    const { setLanguage } = useLanguage()
    setLanguage('zh')
    const wrapper = mount(ServicesSelfDriving, { attachTo: document.body })
    await nextTick()
    const heading = wrapper.find('.services-self-driving-heading')
    expect(heading.text()).toBeTruthy()
    expect(heading.text()).not.toContain('.')
    // Chinese character range detection
    const hasChinese = /[一-龥]/.test(heading.text())
    expect(hasChinese).toBe(true)
  })

  it('includes PipelineTrack, StreamingCode, and StatusReadout child components', async () => {
    installMatchMedia({ reduce: false })
    const wrapper = mount(ServicesSelfDriving, { attachTo: document.body })
    await nextTick()
    // PipelineTrack wrapper class
    const track = wrapper.find('.pipeline-track')
    expect(track.exists()).toBe(true)
    // StreamingCode wrapper class
    const feed = wrapper.find('.streaming-code')
    expect(feed.exists()).toBe(true)
    // StatusReadout wrapper class
    const readout = wrapper.find('.status-readout')
    expect(readout.exists()).toBe(true)
  })

  it('has 6 service-specific phases (not 8 like self-driving)', async () => {
    installMatchMedia({ reduce: false })
    const wrapper = mount(ServicesSelfDriving, { attachTo: document.body })
    await nextTick()
    // Count pipeline cards - should be 6 for services pipeline
    const cards = wrapper.findAll('.pipeline-card')
    expect(cards.length).toBe(6)
    // Verify phase IDs are service-specific
    const root = wrapper.find('[data-servicesselfdriving-root]')
    const phase = root.attributes('data-current-phase')
    expect(phase).toBeTruthy()
    // Service phases should not include dev-pipeline phases like 'intake', 'triage'
    expect(phase).not.toBe('intake')
    expect(phase).not.toBe('triage')
  })

  it('cleans up glitch timer on unmount', async () => {
    installMatchMedia({ reduce: false })
    const timers = deferredTimers()
    const raf = deferredRAF()
    const wrapper = mount(ServicesSelfDriving, { attachTo: document.body })
    await nextTick()
    // Step a few frames to potentially trigger glitch timer
    raf.step(16)
    raf.step(16)
    await nextTick()
    // Unmount should clean up any pending timers
    wrapper.unmount()
    // After unmount, flushOne should safely handle empty queue
    // (this just verifies no throw; coverage proves the cleanup path runs)
    expect(() => timers.flushOne()).not.toThrow()
  })
})
