/**
 * @file SelfDrivingDemo.test.ts
 * @description Unit tests for the Self-Driving ambient demo background (#203).
 * @ticket #203 - Add 'Self-Driving' ambient demo background.
 *
 * Drives the REAL component (no composable mocking) with the REAL useLanguage
 * so localized copy actually renders. Asserts user-visible DOM, not internals:
 *  - the root element exists with data-selfdriving-root + aria-hidden="true".
 *  - data-current-phase / data-loop-iteration / data-static are bound.
 *  - the static (reduced-motion) branch renders a key-frame summary.
 *  - no raw dotted key leaks into rendered text.
 *  - real locale strings render in BOTH en and zh.
 *  - <Scanlines /> is present.
 *
 * matchMedia + rAF are stubbed so timing is deterministic and the reduced-
 * motion branch is reachable without real browser settings.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { useLanguage } from '@/composables/useLanguage'

import SelfDrivingDemo from '../SelfDrivingDemo.vue'

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

// Deferred rAF: enqueues callbacks but never fires them automatically, so the
// loop does NOT recurse synchronously on mount. Tests step frames explicitly
// when they need to observe a transition. Returns a controller.
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

// No-op rAF: never invokes the callback (for the static-branch test).
function neverRAF() {
  vi.stubGlobal('requestAnimationFrame', (() => 1) as any)
  vi.stubGlobal('cancelAnimationFrame', (() => {}) as any)
}

// Deferred setTimeout/clearTimeout: enqueues timer callbacks but never fires
// them automatically, so the glitch-flash watcher's 600ms clear does NOT run
// until the test explicitly flushes it. This avoids vi.useFakeTimers(), which
// would clobber the deferredRAF() stubs above (fake timers replace rAF too).
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
    // Fire the oldest non-cleared timer (FIFO).
    flushOne() {
      while (queue.length > 0 && cleared.has(queue[0].id)) queue.shift()
      const entry = queue.shift()
      if (entry) entry.cb()
    },
    pending: () => queue.filter((e) => !cleared.has(e.id)).length,
  }
}

// happy-dom ships a real IntersectionObserver; replace it with a no-op so the
// offscreen throttle doesn't fire spuriously during a unit mount.
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

describe('SelfDrivingDemo', () => {
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

  it('renders the root with data-selfdriving-root + aria-hidden="true" + phase attrs', async () => {
    installMatchMedia({ reduce: false })
    const wrapper = mount(SelfDrivingDemo, { attachTo: document.body })
    await nextTick()
    const root = wrapper.find('[data-selfdriving-root]')
    expect(root.exists()).toBe(true)
    expect(root.attributes('aria-hidden')).toBe('true')
    // data-current-phase is one of the 8 pipeline phases.
    const phase = root.attributes('data-current-phase')
    expect(phase).toBeTruthy()
    expect([
      'intake',
      'triage',
      'planner',
      'coder',
      'security',
      'evaluator',
      'merger',
      'resolved',
    ]).toContain(phase)
    // data-loop-iteration is a numeric string; data-static reflects motion state.
    expect(root.attributes('data-loop-iteration')).toMatch(/^\d+$/)
    expect(root.attributes('data-static')).toBe('false')
    wrapper.unmount()
  })

  it('renders <Scanlines /> as part of the demo', async () => {
    installMatchMedia({ reduce: false })
    const wrapper = mount(SelfDrivingDemo, { attachTo: document.body })
    await nextTick()
    // Scanlines renders a div.scanlines element.
    expect(wrapper.find('.scanlines').exists()).toBe(true)
    wrapper.unmount()
  })

  it('does NOT render any raw dotted i18n key as visible text', async () => {
    installMatchMedia({ reduce: false })
    const wrapper = mount(SelfDrivingDemo, { attachTo: document.body })
    await nextTick()
    const text = wrapper.text()
    // No element text should be a raw key like "selfDriving.phases...".
    expect(text).not.toMatch(/selfDriving\.[a-zA-Z]/)
    wrapper.unmount()
  })

  it('renders real localized EN copy for the current phase title', async () => {
    installMatchMedia({ reduce: false })
    const { setLanguage } = useLanguage()
    setLanguage('en')
    const wrapper = mount(SelfDrivingDemo, { attachTo: document.body })
    await nextTick()
    const text = wrapper.text()
    // The intake phase title is a real English word, not a key.
    expect(text).toContain('Intake')
    wrapper.unmount()
  })

  it('renders real localized ZH copy for the current phase title', async () => {
    installMatchMedia({ reduce: false })
    const { setLanguage } = useLanguage()
    setLanguage('zh')
    const wrapper = mount(SelfDrivingDemo, { attachTo: document.body })
    await nextTick()
    const text = wrapper.text()
    // The zh intake title is CJK, not a key and not English fallback.
    expect(text).toMatch(/议题接入/)
    wrapper.unmount()
  })

  it('reduced-motion: renders the static key-frame summary and data-static="true"', async () => {
    installMatchMedia({ reduce: true })
    neverRAF()
    const wrapper = mount(SelfDrivingDemo, { attachTo: document.body })
    await nextTick()
    const root = wrapper.find('[data-selfdriving-root]')
    expect(root.attributes('data-static')).toBe('true')
    // The static summary surfaces a real readout line (not a key), proving the
    // story is still legible without animation.
    expect(wrapper.text()).toMatch(/MERGED|CYCLE|已合并|循环/)
    wrapper.unmount()
  })

  it('drives phase transitions on rAF: data-current-phase changes over frames', async () => {
    installMatchMedia({ reduce: false })
    const raf = deferredRAF()

    const wrapper = mount(SelfDrivingDemo, { attachTo: document.body })
    await nextTick()
    const root = wrapper.find('[data-selfdriving-root]')
    const first = root.attributes('data-current-phase')

    // Step enough 16ms frames to cross PHASE_DURATION_MS (2500ms).
    let t = 0
    for (let i = 0; i < 200; i++) {
      t += 16
      raf.step(t)
    }
    await nextTick()
    const later = root.attributes('data-current-phase')
    expect(later).toBeTruthy()
    // The phase advanced past the initial intake.
    expect(later).not.toBe(first)
    wrapper.unmount()
  })

  // -------------------------------------------------------------------------
  // AC2 — GLITCH TRANSITION (one-shot, fired on PHASE CHANGE)
  // -------------------------------------------------------------------------

  it('AC2 glitch: fires the one-shot glitch overlay when the phase changes', async () => {
    installMatchMedia({ reduce: false })
    const raf = deferredRAF()
    const timers = deferredTimers()

    const wrapper = mount(SelfDrivingDemo, { attachTo: document.body })
    await nextTick()
    // On mount the glitch must NOT be showing.
    expect(wrapper.find('[data-selfdriving-glitch]').exists()).toBe(false)

    // Step frames to cross PHASE_DURATION_MS -> phase advances -> glitch fires.
    let t = 0
    for (let i = 0; i < 200; i++) {
      t += 16
      raf.step(t)
    }
    await nextTick()
    await nextTick() // flush the async watcher's inner await nextTick()
    // The glitch overlay is mounted during the ~600ms window after a change.
    expect(wrapper.find('[data-selfdriving-glitch]').exists()).toBe(true)

    // The watcher scheduled a setTimeout to clear the overlay. Flush it and the
    // overlay must vanish (proves it is one-shot, not stuck on).
    timers.flushOne()
    await nextTick()
    expect(wrapper.find('[data-selfdriving-glitch]').exists()).toBe(false)

    wrapper.unmount()
  })

  it('AC2 glitch: NEVER fires under reduced motion (seizure-safety AC4)', async () => {
    installMatchMedia({ reduce: true })
    neverRAF()
    const timers = deferredTimers()

    const wrapper = mount(SelfDrivingDemo, { attachTo: document.body })
    await nextTick()
    // Static branch active, so the phase never changes and the glitch never fires.
    expect(wrapper.find('[data-selfdriving-glitch]').exists()).toBe(false)
    // Flushing all pending timers must still leave no glitch (nothing was armed).
    while (timers.pending() > 0) {
      timers.flushOne()
      await nextTick()
    }
    expect(wrapper.find('[data-selfdriving-glitch]').exists()).toBe(false)

    wrapper.unmount()
  })
})
