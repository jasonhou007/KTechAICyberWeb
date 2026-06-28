/**
 * @file useOpsFeed.test.ts
 * @description Unit tests for the Cyber Ops HUD metrics/feed composable (#182).
 * @ticket #182 - [CYBER] Cyber Ops HUD interactive dashboard.
 *
 * TDD: written BEFORE the implementation. Drives a real host component that
 * mounts the composable, mirroring useSolutionForge.test.ts conventions.
 * matchMedia + rAF + timers are mocked so timing is deterministic.
 *
 * Coverage areas (the planner's contract):
 *  - tickMetric (PURE): bounded random walk; respects min/max; rng injectable.
 *  - pulseSpikeValue (PURE): THE pinned spike/settle math — exact constants.
 *  - filterEvents (PURE): 'all' returns all; else filters by category.
 *  - nextAnomalyState (PURE): FSM idle->active->investigating->idle.
 *  - composable: exposes every ref with a template consumer; pulse() appends a
 *    "pulse fired" event AND deterministically raises anomaly=active; the idle
 *    interval ticks metrics + appends events; offscreen/hidden throttle cancels
 *    BOTH rAF + interval; reduced-motion NEVER starts rAF.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import {
  useOpsFeed,
  tickMetric,
  pulseSpikeValue,
  filterEvents,
  nextAnomalyState,
} from '../useOpsFeed'
import type { FeedEvent } from '../useOpsFeed'

// ---------------------------------------------------------------------------
// matchMedia / rAF mock helpers (mirrors useSolutionForge.test.ts)
// ---------------------------------------------------------------------------

let originalMatchMedia: ((q: string) => MediaQueryList) | undefined
let originalRAF: typeof window.requestAnimationFrame
let originalCancelRAF: typeof window.cancelAnimationFrame

function mockMatchMedia(matchesMap: Record<string, boolean>) {
  window.matchMedia = ((query: string) =>
    ({
      matches: !!matchesMap[query],
      media: query,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      onchange: null,
      dispatchEvent: () => false,
    }) as MediaQueryList) as any
}

/** Counting rAF: schedules via a queue we control. */
function countingRAF() {
  const queue: FrameRequestCallback[] = []
  let id = 1
  let rafCallCount = 0
  window.requestAnimationFrame = ((cb: FrameRequestCallback) => {
    rafCallCount++
    queue.push(cb)
    return id++
  }) as any
  window.cancelAnimationFrame = ((handle: number) => {
    void handle
  }) as any
  return {
    step() {
      const cb = queue.shift()
      if (cb) cb(performance.now() + 16)
    },
    get pending() {
      return queue.length
    },
    get callCount() {
      return rafCallCount
    },
  }
}

/** Sync rAF: runs the callback immediately. */
function syncRAF() {
  let id = 1
  window.requestAnimationFrame = ((cb: FrameRequestCallback) => {
    cb(performance.now())
    return id++
  }) as any
  window.cancelAnimationFrame = (() => {}) as any
}

/** Never rAF: counts calls but never invokes. For the reduced-motion test. */
function neverRAF() {
  let rafCallCount = 0
  window.requestAnimationFrame = (() => {
    rafCallCount++
    return 1
  }) as any
  window.cancelAnimationFrame = (() => {}) as any
  return {
    get callCount() {
      return rafCallCount
    },
  }
}

// ---------------------------------------------------------------------------
// Stub host component
// ---------------------------------------------------------------------------

function mountHost() {
  let api: ReturnType<typeof useOpsFeed> | null = null
  const TestHost = defineComponent({
    name: 'OpsFeedHost',
    setup() {
      api = useOpsFeed()
      return {}
    },
    render() {
      return h('div', { class: 'host' })
    },
  })
  const wrapper = mount(TestHost, { attachTo: document.body })
  return { wrapper, getApi: () => api! }
}

// ---------------------------------------------------------------------------
// Pure-function tests
// ---------------------------------------------------------------------------

describe('tickMetric() — bounded random walk (PURE)', () => {
  it('#1 returns a value within [min, max] for any rng output', () => {
    // Force rng to its extremes; clamp keeps us in bounds.
    expect(tickMetric(50, { min: 0, max: 100, step: 10, rng: () => 1 })).toBeLessThanOrEqual(100)
    expect(tickMetric(50, { min: 0, max: 100, step: 10, rng: () => 0 })).toBeGreaterThanOrEqual(0)
    expect(tickMetric(0, { min: 0, max: 100, step: 10, rng: () => 0 })).toBe(0)
    expect(tickMetric(100, { min: 0, max: 100, step: 10, rng: () => 1 })).toBe(100)
  })

  it('#2 moves up by up to +step when rng=1, down by up to -step when rng=0', () => {
    expect(tickMetric(50, { min: 0, max: 100, step: 5, rng: () => 1 })).toBe(55)
    expect(tickMetric(50, { min: 0, max: 100, step: 5, rng: () => 0 })).toBe(45)
  })

  it('#3 does not move beyond min/max (clamp)', () => {
    expect(tickMetric(98, { min: 0, max: 100, step: 10, rng: () => 1 })).toBe(100)
    expect(tickMetric(2, { min: 0, max: 100, step: 10, rng: () => 0 })).toBe(0)
  })
})

describe('pulseSpikeValue() — pinned spike/settle math (PURE)', () => {
  // THE pinned constants from the plan.
  const BASELINE = 99.2

  it('#1 at t=0 returns baseline', () => {
    expect(pulseSpikeValue(BASELINE, 0)).toBeCloseTo(BASELINE, 2)
  })

  it('#2 at t<0 returns baseline', () => {
    expect(pulseSpikeValue(BASELINE, -100)).toBeCloseTo(BASELINE, 2)
  })

  it('#3 at t=SPIKE_RISE_MS (400) reaches peak = min(100, baseline+0.8) = 100', () => {
    expect(pulseSpikeValue(BASELINE, 400)).toBeCloseTo(100.0, 2)
  })

  it('#4 at t=2200 (past rise+settle) returns baseline (settled)', () => {
    expect(pulseSpikeValue(BASELINE, 2200)).toBeCloseTo(BASELINE, 2)
  })

  it('#5 is monotonic non-decreasing during the rise phase', () => {
    const a = pulseSpikeValue(BASELINE, 100)
    const b = pulseSpikeValue(BASELINE, 200)
    const c = pulseSpikeValue(BASELINE, 400)
    expect(b).toBeGreaterThanOrEqual(a)
    expect(c).toBeGreaterThanOrEqual(b)
  })

  it('#6 during settle decays toward baseline but never dips below it', () => {
    // peak (t=400) > decay midpoint (t=1000) > baseline, and never below.
    const peak = pulseSpikeValue(BASELINE, 400)
    const mid = pulseSpikeValue(BASELINE, 1000)
    expect(mid).toBeLessThan(peak)
    expect(mid).toBeGreaterThanOrEqual(BASELINE)
  })

  it('#7 baseline already at 100 caps peak at 100 (no overflow)', () => {
    expect(pulseSpikeValue(100, 400)).toBeLessThanOrEqual(100)
    expect(pulseSpikeValue(100, 400)).toBeGreaterThanOrEqual(99.0)
  })
})

describe('filterEvents() — category filter (PURE)', () => {
  const events: FeedEvent[] = [
    { id: 1, category: 'ai', message: 'a1', ts: 1 },
    { id: 2, category: 'security', message: 's1', ts: 2 },
    { id: 3, category: 'performance', message: 'p1', ts: 3 },
    { id: 4, category: 'ai', message: 'a2', ts: 4 },
  ]

  it("#1 'all' returns every event unchanged", () => {
    expect(filterEvents(events, 'all')).toHaveLength(4)
  })

  it("#2 'ai' returns only ai events", () => {
    const out = filterEvents(events, 'ai')
    expect(out).toHaveLength(2)
    expect(out.every((e) => e.category === 'ai')).toBe(true)
  })

  it("#3 'security' returns only security events", () => {
    expect(filterEvents(events, 'security')).toHaveLength(1)
  })

  it('#4 empty list returns empty for any category', () => {
    expect(filterEvents([], 'all')).toHaveLength(0)
    expect(filterEvents([], 'ai')).toHaveLength(0)
  })
})

describe('nextAnomalyState() — anomaly FSM (PURE)', () => {
  it('#1 idle + anomaly event -> active', () => {
    expect(
      nextAnomalyState('idle', { id: 1, category: 'security', message: 'x', ts: 1, anomaly: true }),
    ).toBe('active')
  })

  it('#2 active + investigate event -> investigating', () => {
    expect(
      nextAnomalyState('active', { id: 1, category: 'security', message: 'x', ts: 1, investigate: true }),
    ).toBe('investigating')
  })

  it('#3 investigating + dismiss event -> idle', () => {
    expect(
      nextAnomalyState('investigating', { id: 1, category: 'security', message: 'x', ts: 1, dismiss: true }),
    ).toBe('idle')
  })

  it('#4 a neutral event leaves state unchanged', () => {
    expect(
      nextAnomalyState('active', { id: 1, category: 'ai', message: 'x', ts: 1 }),
    ).toBe('active')
  })
})

// ---------------------------------------------------------------------------
// Composable tests (driven through a real host component)
// ---------------------------------------------------------------------------

describe('useOpsFeed() — composable', () => {
  beforeEach(() => {
    originalMatchMedia = window.matchMedia
    originalRAF = window.requestAnimationFrame
    originalCancelRAF = window.cancelAnimationFrame
    mockMatchMedia({})
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    if (originalMatchMedia) window.matchMedia = originalMatchMedia
    if (originalRAF) window.requestAnimationFrame = originalRAF
    if (originalCancelRAF) window.cancelAnimationFrame = originalCancelRAF
  })

  it('#1 exposes every reactive ref on the public API (dead-reactive-state gate)', () => {
    const { getApi } = mountHost()
    const api = getApi()
    // Every one of these must be a defined reactive handle with a template
    // consumer (the CyberOpsHud view binds each). seedAnomaly is the only
    // internal exception (test+internal-only, not rendered).
    expect(api.uptime).toBeDefined()
    expect(api.latencyHistory).toBeDefined()
    expect(api.throughputHistory).toBeDefined()
    expect(api.requestCount).toBeDefined()
    expect(api.events).toBeDefined()
    expect(api.anomalyState).toBeDefined()
    expect(api.activeAnomaly).toBeDefined()
    expect(api.activeCategory).toBeDefined()
    expect(api.filteredEvents).toBeDefined()
    expect(api.expandedWidget).toBeDefined()
    expect(api.prefersReducedMotion).toBeDefined()
    expect(api.isMobile).toBeDefined()
    expect(api.categories).toBeDefined()
    expect(typeof api.pulse).toBe('function')
    expect(typeof api.setCategory).toBe('function')
    expect(typeof api.expandWidget).toBe('function')
    expect(typeof api.collapseWidget).toBe('function')
    expect(typeof api.investigate).toBe('function')
    expect(typeof api.dismissAnomaly).toBe('function')
    // seedAnomaly is the test+internal-only helper (NOT rendered) — still
    // callable so the random scheduler + unit tests can drive it.
    expect(typeof api.seedAnomaly).toBe('function')
  })

  it('#2 uptime starts in a sane range near the 99.2 baseline', () => {
    const { getApi } = mountHost()
    const api = getApi()
    expect(api.uptime.value).toBeGreaterThanOrEqual(90)
    expect(api.uptime.value).toBeLessThanOrEqual(100)
  })

  it('#3 history refs are seeded with initial arrays (non-empty)', () => {
    const { getApi } = mountHost()
    const api = getApi()
    expect(api.latencyHistory.value.length).toBeGreaterThan(0)
    expect(api.throughputHistory.value.length).toBeGreaterThan(0)
  })

  it('#4 setCategory updates activeCategory and filteredEvents updates accordingly', () => {
    const { getApi } = mountHost()
    const api = getApi()
    // Seed an event so the filter is observable.
    api.events.value = [
      { id: 1, category: 'ai', message: 'a', ts: 1 },
      { id: 2, category: 'security', message: 's', ts: 2 },
    ]
    api.setCategory('security')
    expect(api.activeCategory.value).toBe('security')
    expect(api.filteredEvents.value.every((e) => e.category === 'security')).toBe(true)
    api.setCategory('all')
    expect(api.filteredEvents.value.length).toBe(2)
  })

  it('#5 expandWidget/collapseWidget toggle the detail panel key', () => {
    const { getApi } = mountHost()
    const api = getApi()
    expect(api.expandedWidget.value).toBeNull()
    api.expandWidget('gauge')
    expect(api.expandedWidget.value).toBe('gauge')
    api.collapseWidget()
    expect(api.expandedWidget.value).toBeNull()
  })

  it('#6 pulse() appends a "pulse fired" event to the feed', () => {
    const { getApi } = mountHost()
    const api = getApi()
    const before = api.events.value.length
    api.pulse()
    expect(api.events.value.length).toBe(before + 1)
    // Feed is newest-first, so the just-appended event is at index 0.
    const last = api.events.value[0]
    // The pulse event carries a category (filterable) + the pulse marker so the
    // event log + E2E can assert it fired.
    expect(last.category).toBeTruthy()
    expect(last.pulse).toBe(true)
  })

  it('#7 pulse() deterministically raises anomalyState to "active" (no waiting for random scheduler)', () => {
    const { getApi } = mountHost()
    const api = getApi()
    expect(api.anomalyState.value).toBe('idle')
    api.pulse()
    // After the rise the anomaly is deterministically active so the
    // Investigate drill-down is reachable in E2E without waiting on the random
    // scheduler.
    expect(['active', 'investigating']).toContain(api.anomalyState.value)
    expect(api.activeAnomaly.value).not.toBeNull()
  })

  it('#8 investigate() moves anomalyState active->investigating and sets drilldown', () => {
    const { getApi } = mountHost()
    const api = getApi()
    api.pulse()
    expect(api.anomalyState.value).toBe('active')
    api.investigate()
    expect(api.anomalyState.value).toBe('investigating')
  })

  it('#9 dismissAnomaly() returns anomalyState to idle and clears activeAnomaly', () => {
    const { getApi } = mountHost()
    const api = getApi()
    api.pulse()
    api.investigate()
    api.dismissAnomaly()
    expect(api.anomalyState.value).toBe('idle')
    expect(api.activeAnomaly.value).toBeNull()
  })

  it('#10 the idle interval ticks metrics + appends feed events over time', () => {
    const raf = countingRAF()
    const { getApi, wrapper } = mountHost()
    const api = getApi()
    const uptimeBefore = api.uptime.value
    const eventsBefore = api.events.value.length

    // Advance past several idle intervals (1500ms each).
    vi.advanceTimersByTime(5000)
    // Drain a few rAF frames so the render loop has had a chance to run.
    for (let i = 0; i < 5; i++) raf.step()

    expect(api.events.value.length).toBeGreaterThan(eventsBefore)
    // Uptime may drift in either direction but must stay in range.
    expect(api.uptime.value).toBeGreaterThanOrEqual(90)
    expect(api.uptime.value).toBeLessThanOrEqual(100)
    void uptimeBefore
    wrapper.unmount()
  })

  it('#11 throttles: when document becomes hidden BOTH rAF and the interval are cancelled', () => {
    const raf = countingRAF()
    const { getApi, wrapper } = mountHost()
    const api = getApi()
    const eventsBefore = api.events.value.length

    // Simulate the page going hidden.
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))

    const rafCallsAtHidden = raf.callCount
    // Advance a long time while hidden: no new events, no new rAF calls.
    vi.advanceTimersByTime(8000)
    expect(api.events.value.length).toBe(eventsBefore)
    expect(raf.callCount).toBe(rafCallsAtHidden)

    // Coming back visible restarts the loop.
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))
    vi.advanceTimersByTime(2000)
    // Visible again -> feed resumes appending.
    expect(api.events.value.length).toBeGreaterThan(eventsBefore)
    wrapper.unmount()
  })

  it('#12 reduced motion: rAF is NEVER requested (no animation loop)', () => {
    mockMatchMedia({ '(prefers-reduced-motion: reduce)': true })
    const raf = neverRAF()
    const { getApi, wrapper } = mountHost()
    const api = getApi()
    expect(api.prefersReducedMotion.value).toBe(true)
    vi.advanceTimersByTime(3000)
    // ZERO rAF calls under reduced motion.
    expect(raf.callCount).toBe(0)
    wrapper.unmount()
  })

  it('#13 reduced motion: pulse still raises anomaly (informational), no rAF', () => {
    mockMatchMedia({ '(prefers-reduced-motion: reduce)': true })
    const raf = neverRAF()
    const { getApi, wrapper } = mountHost()
    const api = getApi()
    api.pulse()
    expect(['active', 'investigating']).toContain(api.anomalyState.value)
    expect(raf.callCount).toBe(0)
    wrapper.unmount()
  })

  it('#14 unmount cancels the rAF loop + interval (no leak)', () => {
    countingRAF()
    const { getApi, wrapper } = mountHost()
    const api = getApi()
    const eventsBefore = api.events.value.length
    wrapper.unmount()
    // After unmount the idle interval is gone: advancing time appends nothing.
    vi.advanceTimersByTime(6000)
    expect(api.events.value.length).toBe(eventsBefore)
  })

  it('#15 seedAnomaly() raises an anomaly (test+internal-only driver)', () => {
    const { getApi, wrapper } = mountHost()
    const api = getApi()
    expect(api.anomalyState.value).toBe('idle')
    api.seedAnomaly()
    expect(['active', 'investigating']).toContain(api.anomalyState.value)
    expect(api.activeAnomaly.value).not.toBeNull()
    wrapper.unmount()
  })
})
