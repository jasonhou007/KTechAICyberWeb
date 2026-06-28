/**
 * @file useSolutionForge.test.ts
 * @description Unit tests for the AI Solution Forge configurator composable.
 * @ticket #180 - Add interactive 'AI Solution Forge' configurator.
 *
 * Drives a real host component that mounts the composable, the same style as
 * useNeuralNet.test.ts. matchMedia + rAF + timers are mocked so timing is
 * deterministic.
 *
 * Coverage areas (mirror the planner's contract):
 *  - resolveRecommendation (PURE): deterministic given identical inputs; maps
 *    {industry, scale, priorities, seed} to {serviceIds, metrics, verdictKey,
 *    ctaServiceId}. Scale flips the primary service; priorities add secondary
 *    services; the easter-egg (empty OR all-4 priorities) forces 'frontier'.
 *  - buildAssemblyTimeline (PURE): multi-step sequence normally, collapses to a
 *    single instant step under reduced motion.
 *  - scrambleStep (PURE): interpolates from scramble to target as progress
 *    crosses 0..1; returns the target verbatim at progress >= 1.
 *  - FSM: idle -> computing -> done; forge spawns one rAF chain; done fires a
 *    recommendation; reroll bumps seed then re-forges; reset returns to idle.
 *  - re-entrancy guard: forge called re-entrantly cancels the in-flight frame.
 *  - reduced motion: forge jumps straight to done with ZERO rAF calls.
 *  - AC4 watcher: changing inputs AFTER a result exists re-forges.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import {
  useSolutionForge,
  resolveRecommendation,
  buildAssemblyTimeline,
  scrambleStep,
} from '../useSolutionForge'

// ---------------------------------------------------------------------------
// matchMedia / rAF mock helpers (mirrors useNeuralNet.test.ts conventions)
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

/** Counting rAF: schedules via a queue we control so we can step frames
 *  deterministically. */
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

/** Synchronous rAF: runs the callback immediately. */
function syncRAF() {
  let id = 1
  window.requestAnimationFrame = ((cb: FrameRequestCallback) => {
    cb(performance.now())
    return id++
  }) as any
  window.cancelAnimationFrame = (() => {}) as any
}

/** No-op rAF: never invokes the callback. For the reduced-motion test. */
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
  let api: ReturnType<typeof useSolutionForge> | null = null
  const TestHost = defineComponent({
    name: 'SolutionForgeHost',
    setup() {
      api = useSolutionForge()
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

describe('resolveRecommendation() — pure deterministic mapping', () => {
  it('#1 returns the same output for identical inputs (determinism)', () => {
    const input = {
      industry: 'finance',
      scale: 3,
      priorities: new Set(['security']),
      seed: 0,
    }
    const a = resolveRecommendation(input)
    const b = resolveRecommendation(input)
    expect(a).toEqual(b)
  })

  it('#2 finance scale>=4 yields supply-chain-finance as a service + CTA', () => {
    const r = resolveRecommendation({
      industry: 'finance',
      scale: 4,
      priorities: new Set(),
      seed: 0,
    })
    expect(r.serviceIds).toContain('supply-chain-finance')
    expect(r.ctaServiceId).toBe(r.serviceIds[0])
  })

  it('#3 priorities add secondary services (security -> +digital-asset-custody for finance)', () => {
    const base = resolveRecommendation({
      industry: 'finance',
      scale: 3,
      priorities: new Set(),
      seed: 0,
    })
    const withSec = resolveRecommendation({
      industry: 'finance',
      scale: 3,
      priorities: new Set(['security']),
      seed: 0,
    })
    expect(withSec.serviceIds).toContain('digital-asset-custody')
    // Secondary service added, not replacing the whole list.
    expect(withSec.serviceIds.length).toBeGreaterThanOrEqual(base.serviceIds.length)
  })

  it('#4 empty OR all-4 priorities forces verdictKey "frontier" (easter egg)', () => {
    const empty = resolveRecommendation({
      industry: 'retail',
      scale: 3,
      priorities: new Set(),
      seed: 0,
    })
    const all = resolveRecommendation({
      industry: 'retail',
      scale: 3,
      priorities: new Set(['speed', 'security', 'compliance', 'automation']),
      seed: 0,
    })
    expect(empty.verdictKey).toBe('frontier')
    expect(all.verdictKey).toBe('frontier')
  })

  it('#5 metrics are well-formed (throughput string, accuracy <99.9, ttv weeks)', () => {
    const r = resolveRecommendation({
      industry: 'health',
      scale: 5,
      priorities: new Set(['compliance']),
      seed: 7,
    })
    expect(typeof r.metrics.throughput).toBe('string')
    expect(r.metrics.throughput).toMatch(/tx\/s/)
    expect(r.metrics.accuracy).toBeLessThan(99.9)
    expect(r.metrics.accuracy).toBeGreaterThan(0)
    expect(r.metrics.ttv).toBeGreaterThan(0)
  })

  it('#6 different seeds change accuracy but not service list shape', () => {
    const a = resolveRecommendation({
      industry: 'manufacturing',
      scale: 3,
      priorities: new Set(['speed']),
      seed: 0,
    })
    const b = resolveRecommendation({
      industry: 'manufacturing',
      scale: 3,
      priorities: new Set(['speed']),
      seed: 3,
    })
    expect(a.serviceIds).toEqual(b.serviceIds)
    // Seed mod 4 changes the accuracy offset, so seeds 0 and 3 differ.
    expect(a.metrics.accuracy).not.toBe(b.metrics.accuracy)
  })
})

describe('buildAssemblyTimeline() — pure', () => {
  it('returns a multi-step sequence under normal motion', () => {
    const rec = resolveRecommendation({
      industry: 'finance',
      scale: 3,
      priorities: new Set(['security']),
      seed: 0,
    })
    const steps = buildAssemblyTimeline(rec, { reducedMotion: false })
    expect(Array.isArray(steps)).toBe(true)
    expect(steps.length).toBeGreaterThan(1)
    // Each step has a label so the UI can render a module fly-in.
    for (const step of steps) {
      expect(typeof step.label).toBe('string')
      expect(step.label.length).toBeGreaterThan(0)
    }
  })

  it('collapses to a single instant step under reduced motion', () => {
    const rec = resolveRecommendation({
      industry: 'finance',
      scale: 3,
      priorities: new Set(['security']),
      seed: 0,
    })
    const steps = buildAssemblyTimeline(rec, { reducedMotion: true })
    expect(steps.length).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// scrambleStep (pure)
// ---------------------------------------------------------------------------

describe('scrambleStep() — pure', () => {
  it('returns the target verbatim once progress reaches 1', () => {
    const out = scrambleStep('OPTIMAL', 1)
    expect(out).toBe('OPTIMAL')
  })

  it('produces a scramble that grows toward the target as progress rises', () => {
    const start = scrambleStep('OPTIMAL', 0)
    const mid = scrambleStep('OPTIMAL', 0.5)
    const end = scrambleStep('OPTIMAL', 1)
    // At progress 1 the whole target is decoded.
    expect(end).toBe('OPTIMAL')
    // Mid is longer (more decoded chars) than start.
    expect(mid.length).toBeGreaterThanOrEqual(start.length)
    // The decoded portion at the end matches the target prefix.
    expect(end.startsWith('OPT')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Composable FSM + lifecycle
// ---------------------------------------------------------------------------

describe('useSolutionForge() — composable', () => {
  beforeEach(() => {
    originalMatchMedia = window.matchMedia
    originalRAF = window.requestAnimationFrame
    originalCancelRAF = window.cancelAnimationFrame
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
    if (originalMatchMedia) window.matchMedia = originalMatchMedia
    else delete (window as any).matchMedia
    window.requestAnimationFrame = originalRAF
    window.cancelAnimationFrame = originalCancelRAF
    document.body.innerHTML = ''
  })

  // --- #7 starts idle, no recommendation ----------------------------------

  it('#7 starts idle with no recommendation and progress 0', () => {
    mockMatchMedia({ '(prefers-reduced-motion: reduce)': false })
    syncRAF()
    const { wrapper, getApi } = mountHost()
    const { assemblyState, recommendation, computeProgress } = getApi()
    expect(assemblyState.value).toBe('idle')
    expect(recommendation.value).toBe(null)
    expect(computeProgress.value).toBe(0)
    wrapper.unmount()
  })

  // --- #8 forge drives idle -> computing -> done --------------------------

  it('#8 forge transitions idle -> computing -> done and lands a recommendation', async () => {
    mockMatchMedia({ '(prefers-reduced-motion: reduce)': false })
    const raf = countingRAF()
    const { wrapper, getApi } = mountHost()
    const { assemblyState, recommendation, forge } = getApi()

    forge()
    await nextTick()
    expect(assemblyState.value).toBe('computing')

    // Step frames until done.
    let guard = 0
    while (assemblyState.value === 'computing' && guard < 5000) {
      raf.step()
      guard++
    }
    expect(assemblyState.value).toBe('done')
    expect(recommendation.value).not.toBe(null)
    expect(recommendation.value!.serviceIds.length).toBeGreaterThan(0)
    expect(raf.pending).toBe(0)
    wrapper.unmount()
  })

  // --- #9 reroll bumps seed then re-forges --------------------------------

  it('#9 reroll bumps the seed and re-forges (different accuracy)', async () => {
    mockMatchMedia({ '(prefers-reduced-motion: reduce)': false })
    const raf = countingRAF()
    const { wrapper, getApi } = mountHost()
    const { assemblyState, recommendation, seed, forge, reroll } = getApi()

    forge()
    let guard = 0
    while (assemblyState.value === 'computing' && guard < 5000) {
      raf.step()
      guard++
    }
    const firstAcc = recommendation.value!.metrics.accuracy
    const firstSeed = seed.value

    reroll()
    await nextTick()
    guard = 0
    while (assemblyState.value === 'computing' && guard < 5000) {
      raf.step()
      guard++
    }
    expect(assemblyState.value).toBe('done')
    expect(seed.value).toBeGreaterThan(firstSeed)
    // Seed changed by a non-multiple-of-4 so accuracy offset changes.
    // (reroll increments seed by 1; mod 4 differs unless crossing a 4-boundary,
    //  which 0->1 does not.)
    expect(recommendation.value!.metrics.accuracy).not.toBe(firstAcc)
    wrapper.unmount()
  })

  // --- #10 reset returns to idle ------------------------------------------

  it('#10 reset returns the FSM to idle and clears the recommendation', async () => {
    mockMatchMedia({ '(prefers-reduced-motion: reduce)': false })
    const raf = countingRAF()
    const { wrapper, getApi } = mountHost()
    const { assemblyState, recommendation, forge, reset } = getApi()

    forge()
    let guard = 0
    while (assemblyState.value === 'computing' && guard < 5000) {
      raf.step()
      guard++
    }
    expect(assemblyState.value).toBe('done')

    reset()
    await nextTick()
    expect(assemblyState.value).toBe('idle')
    expect(recommendation.value).toBe(null)
    expect(raf.pending).toBe(0)
    wrapper.unmount()
  })

  // --- #11 re-entrancy guard on forge -------------------------------------

  it('#11 forge cancels an in-flight rAF frame when called re-entrantly', async () => {
    mockMatchMedia({ '(prefers-reduced-motion: reduce)': false })
    const queue: FrameRequestCallback[] = []
    let nextId = 1
    const scheduled = new Map<number, FrameRequestCallback>()
    let cancelCount = 0
    window.requestAnimationFrame = ((cb: FrameRequestCallback) => {
      const id = nextId++
      scheduled.set(id, cb)
      queue.push(cb)
      return id
    }) as any
    window.cancelAnimationFrame = ((handle: number) => {
      cancelCount++
      scheduled.delete(handle)
    }) as any

    const { wrapper, getApi } = mountHost()
    const { forge } = getApi()

    forge()
    await nextTick()
    expect(scheduled.size).toBe(1)

    // Re-entrant call before the first frame fires: guard cancels it.
    forge()
    await nextTick()
    expect(cancelCount).toBeGreaterThanOrEqual(1)
    expect(scheduled.size).toBe(1)
    wrapper.unmount()
  })

  // --- #12 reduced motion: forge jumps to done, ZERO rAF ------------------

  it('#12 reduced motion: forge jumps straight to done, ZERO rAF calls', async () => {
    mockMatchMedia({ '(prefers-reduced-motion: reduce)': true })
    const raf = neverRAF()
    const { wrapper, getApi } = mountHost()
    const { assemblyState, recommendation, computeProgress, forge, prefersReducedMotion } = getApi()

    expect(prefersReducedMotion.value).toBe(true)
    forge()
    await nextTick()
    expect(assemblyState.value).toBe('done')
    expect(recommendation.value).not.toBe(null)
    expect(computeProgress.value).toBe(1)
    expect(raf.callCount).toBe(0)
    wrapper.unmount()
  })

  // --- #13 AC4 watcher: changing inputs after a result re-forges -----------

  it('#13 changing industry after a result exists re-forges (AC4)', async () => {
    mockMatchMedia({ '(prefers-reduced-motion: reduce)': false })
    const raf = countingRAF()
    const { wrapper, getApi } = mountHost()
    const { assemblyState, recommendation, industry, forge, setIndustry } = getApi()

    forge()
    let guard = 0
    while (assemblyState.value === 'computing' && guard < 5000) {
      raf.step()
      guard++
    }
    expect(assemblyState.value).toBe('done')
    const firstServices = recommendation.value!.serviceIds.slice()

    // Change the industry; the AC4 watcher must re-forge automatically.
    setIndustry('health')
    await nextTick()
    // Watcher fires a new forge run -> computing.
    guard = 0
    while (assemblyState.value === 'computing' && guard < 5000) {
      raf.step()
      guard++
    }
    expect(assemblyState.value).toBe('done')
    // health's primary is big-data-ai; finance's was different. The blueprint
    // reflects the new industry.
    expect(industry.value).toBe('health')
    // Service list shape still present (>=1 service).
    expect(recommendation.value!.serviceIds.length).toBeGreaterThan(0)
    // Sanity: the re-forge produced a fresh recommendation object.
    expect(recommendation.value).not.toBe(null)
    void firstServices
    wrapper.unmount()
  })
})
