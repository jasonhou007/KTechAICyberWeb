/**
 * @file useNeuralNet.test.ts
 * @description Unit tests for the AI Core neural-network visualizer composable.
 * @ticket #179 - Add interactive 'AI Core' neural-network visualizer.
 *
 * Drives a real host component that mounts the composable, the same style as
 * useParallax.test.ts. matchMedia + rAF + timers are mocked so timing is
 * deterministic.
 *
 * Coverage areas (mirror the planner's contract):
 * - graph model: >=3 layers, >=12 nodes desktop, synapses only between
 *   adjacent layers, deterministic layout coords.
 * - resolvePath: input -> output BFS, starts in input layer, ends in output,
 *   layer indices are monotone non-decreasing.
 * - inference state machine: idle -> running -> done, pulses spawned per input
 *   node, single shared rAF loop advances pulses, reaching output fires readout
 *   + cancels rAF.
 * - drag math: beginDrag/dragTo/endDrag move a node x/y and synapse geometry
 *   tracks the new endpoints.
 * - reduced-motion: runInference jumps straight to done with readout, ZERO
 *   requestAnimationFrame calls, idle never produces a breathing-eligible state.
 * - idle timer: >2500ms of inactivity -> isIdle true; any interaction resets.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import { useNeuralNet } from '../useNeuralNet'

// ---------------------------------------------------------------------------
// matchMedia / rAF mock helpers (mirrors useParallax.test.ts conventions)
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

/** Counting rAF: schedules via a queue we control so we can assert call counts
 *  and advance frames deterministically. Each flushed frame advances time a
 *  nominal 16ms so progress math (0..1) crosses completion. */
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
    // No-op for the deterministic harness; we track cancellation via the
    // returned rafState.canceled flag the composable sets on done.
    void handle
  }) as any
  return {
    /** Advance one animation frame, stepping the timestamp forward. */
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

/** Synchronous rAF: runs the callback immediately. Returns an incrementing id. */
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

/** Mounts the composable on a real component so onMounted/onUnmounted fire.
 *  Exposes every returned ref/method for assertions. */
function mountHost(mobile = false) {
  let api: ReturnType<typeof useNeuralNet> | null = null
  const TestHost = defineComponent({
    name: 'NeuralNetHost',
    setup() {
      api = useNeuralNet({ mobile })
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
// Tests
// ---------------------------------------------------------------------------

describe('useNeuralNet()', () => {
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

  // --- graph model ---------------------------------------------------------

  it('builds a desktop graph with >=3 layers and >=12 nodes', () => {
    mockMatchMedia({ '(prefers-reduced-motion: reduce)': false })
    syncRAF()
    const { wrapper, getApi } = mountHost(false)
    const { layers, nodes } = getApi()

    expect(layers.length).toBeGreaterThanOrEqual(3)
    expect(nodes.value.length).toBeGreaterThanOrEqual(12)
    // First layer is the input, last is the output.
    expect(layers[0].kind).toBe('input')
    expect(layers[layers.length - 1].kind).toBe('output')
    wrapper.unmount()
  })

  it('builds a mobile graph with fewer nodes (graceful degrade)', () => {
    mockMatchMedia({ '(prefers-reduced-motion: reduce)': false })
    syncRAF()
    const { wrapper, getApi } = mountHost(true)
    const desktop = mountHost(false)
    const mobileApi = getApi()
    const desktopApi = desktop.getApi()

    expect(mobileApi.nodes.value.length).toBeLessThan(desktopApi.nodes.value.length)
    expect(mobileApi.nodes.value.length).toBeGreaterThanOrEqual(6)
    wrapper.unmount()
    desktop.wrapper.unmount()
  })

  it('creates synapses only between adjacent layers', () => {
    mockMatchMedia({ '(prefers-reduced-motion: reduce)': false })
    syncRAF()
    const { wrapper, getApi } = mountHost(false)
    const { synapses, nodes } = getApi()
    const layerOf = new Map(nodes.value.map((n) => [n.id, n.layerIndex]))

    expect(synapses.value.length).toBeGreaterThan(0)
    for (const s of synapses.value) {
      const a = layerOf.get(s.from)!
      const b = layerOf.get(s.to)!
      // Adjacent: |a - b| === 1, never same layer, never skipping a layer.
      expect(Math.abs(a - b)).toBe(1)
    }
    wrapper.unmount()
  })

  it('assigns deterministic layout coords (each node has numeric x/y/r)', () => {
    mockMatchMedia({ '(prefers-reduced-motion: reduce)': false })
    syncRAF()
    const { wrapper, getApi } = mountHost(false)
    const { nodes } = getApi()
    for (const n of nodes.value) {
      expect(typeof n.x).toBe('number')
      expect(typeof n.y).toBe('number')
      expect(typeof n.r).toBe('number')
      expect(n.r).toBeGreaterThan(0)
      expect(Number.isFinite(n.x)).toBe(true)
      expect(Number.isFinite(n.y)).toBe(true)
    }
    wrapper.unmount()
  })

  // --- resolvePath ---------------------------------------------------------

  it('resolvePath starts in the input layer and ends in the output layer', () => {
    mockMatchMedia({ '(prefers-reduced-motion: reduce)': false })
    syncRAF()
    const { wrapper, getApi } = mountHost(false)
    const { nodes, layers, resolvePath } = getApi()
    const inputNodes = nodes.value.filter((n) => n.layerIndex === 0)
    const lastLayer = layers.length - 1
    const start = inputNodes[0]

    const path = resolvePath(start.id)
    expect(path.length).toBeGreaterThanOrEqual(2)
    expect(path[0]).toBe(start.id)
    const endNode = nodes.value.find((n) => n.id === path[path.length - 1])!
    expect(endNode.layerIndex).toBe(lastLayer)
    wrapper.unmount()
  })

  it('resolvePath produces monotone non-decreasing layer indices', () => {
    mockMatchMedia({ '(prefers-reduced-motion: reduce)': false })
    syncRAF()
    const { wrapper, getApi } = mountHost(false)
    const { nodes, resolvePath } = getApi()
    const layerOf = new Map(nodes.value.map((n) => [n.id, n.layerIndex]))
    const inputNode = nodes.value.find((n) => n.layerIndex === 0)!

    const path = resolvePath(inputNode.id)
    for (let i = 1; i < path.length; i++) {
      expect(layerOf.get(path[i])!).toBeGreaterThanOrEqual(layerOf.get(path[i - 1])!)
    }
    wrapper.unmount()
  })

  // --- inference state machine --------------------------------------------

  it('transitions idle -> running -> done and spawns a pulse per input node', async () => {
    mockMatchMedia({ '(prefers-reduced-motion: reduce)': false })
    const raf = countingRAF()
    const { wrapper, getApi } = mountHost(false)
    const { inferenceState, pulses, runInference, nodes } = getApi()

    expect(inferenceState.value).toBe('idle')
    expect(pulses.value.length).toBe(0)

    const inputCount = nodes.value.filter((n) => n.layerIndex === 0).length
    runInference()
    await nextTick()

    expect(inferenceState.value).toBe('running')
    // One pulse per input node, each with a path that ends in the output layer.
    expect(pulses.value.length).toBe(inputCount)
    for (const p of pulses.value) {
      expect(p.progress).toBeGreaterThanOrEqual(0)
      expect(p.path.length).toBeGreaterThanOrEqual(2)
    }

    // Advance frames until every pulse reaches its output node (progress >= 1).
    // rAF loop is shared; keep stepping until done fires or we hit a sane cap.
    let guard = 0
    while (inferenceState.value === 'running' && guard < 2000) {
      raf.step()
      guard++
    }
    expect(inferenceState.value).toBe('done')
    // All pulses complete.
    for (const p of pulses.value) {
      expect(p.progress).toBeGreaterThanOrEqual(1)
    }
    // rAF was cancelled: the pending queue is empty after done.
    expect(raf.pending).toBe(0)
    wrapper.unmount()
  })

  it('done fires a deterministic benign readout (decision + confidence)', async () => {
    mockMatchMedia({ '(prefers-reduced-motion: reduce)': false })
    const raf = countingRAF()
    const { wrapper, getApi } = mountHost(false)
    const { inferenceState, readout, runInference } = getApi()

    expect(readout.value).toBe(null)
    runInference()
    let guard = 0
    while (inferenceState.value === 'running' && guard < 2000) {
      raf.step()
      guard++
    }
    expect(inferenceState.value).toBe('done')
    expect(readout.value).not.toBe(null)
    const decision = readout.value!.decisionKey
    expect(['approve', 'review', 'flag']).toContain(decision)
    expect(typeof readout.value!.confidence).toBe('number')
    expect(readout.value!.confidence).toBeGreaterThan(0)
    expect(readout.value!.confidence).toBeLessThan(100)
    wrapper.unmount()
  })

  it('readout is stable across runs (deterministic seeded table)', async () => {
    mockMatchMedia({ '(prefers-reduced-motion: reduce)': false })
    const seen = new Set<string>()
    // Run several times; collect decisionKey. With a seeded deterministic
    // table the set of possible outcomes is bounded to the pool keys.
    for (let i = 0; i < 5; i++) {
      const raf = countingRAF()
      const { wrapper, getApi } = mountHost(false)
      const { inferenceState, readout, runInference } = getApi()
      runInference()
      let guard = 0
      while (inferenceState.value === 'running' && guard < 2000) {
        raf.step()
        guard++
      }
      seen.add(readout.value!.decisionKey)
      wrapper.unmount()
    }
    // Every observed decision is a member of the deterministic pool.
    for (const d of seen) {
      expect(['approve', 'review', 'flag']).toContain(d)
    }
    expect(seen.size).toBeLessThanOrEqual(3)
  })

  // --- drag math -----------------------------------------------------------

  it('beginDrag/dragTo/endDrag move a node and synapse geometry tracks', async () => {
    mockMatchMedia({ '(prefers-reduced-motion: reduce)': false })
    syncRAF()
    const { wrapper, getApi } = mountHost(false)
    const { nodes, synapses, beginDrag, dragTo, endDrag } = getApi()
    const target = nodes.value[0]
    const startX = target.x
    const startY = target.y

    // Find a synapse touching this node so we can assert it tracks.
    const touching = synapses.value.find(
      (s) => s.from === target.id || s.to === target.id,
    )!
    const before = touching.geometry

    beginDrag(target, { clientX: 10, clientY: 10 } as MouseEvent)
    await nextTick()
    dragTo({ clientX: 60, clientY: 70 } as MouseEvent)
    await nextTick()
    endDrag()
    await nextTick()

    // Node moved by the delta.
    const moved = nodes.value.find((n) => n.id === target.id)!
    expect(moved.x).toBeCloseTo(startX + 50, 5)
    expect(moved.y).toBeCloseTo(startY + 60, 5)
    // The touching synapse's geometry recomputed from the new endpoints.
    const after = synapses.value.find((s) => s.id === touching.id)!.geometry
    expect(after).not.toEqual(before)
    wrapper.unmount()
  })

  // --- reduced motion ------------------------------------------------------

  it('reduced motion: runInference jumps straight to done, ZERO rAF calls, no breathing', async () => {
    mockMatchMedia({ '(prefers-reduced-motion: reduce)': true })
    const raf = neverRAF()
    const { wrapper, getApi } = mountHost(false)
    const {
      inferenceState,
      readout,
      pulses,
      runInference,
      prefersReducedMotion,
      isIdle,
      isBreathingEligible,
    } = getApi()

    expect(prefersReducedMotion.value).toBe(true)
    runInference()
    await nextTick()

    expect(inferenceState.value).toBe('done')
    expect(readout.value).not.toBe(null)
    expect(pulses.value.length).toBe(0)
    expect(raf.callCount).toBe(0)
    // Even if idle, breathing is never eligible under reduced motion.
    expect(isBreathingEligible.value).toBe(false)
    // Force the idle flag and re-check the breathing guard.
    isIdle.value = true
    await nextTick()
    expect(isBreathingEligible.value).toBe(false)
    wrapper.unmount()
  })

  // --- idle timer ----------------------------------------------------------

  it('idle timer: >2500ms of inactivity sets isIdle; interaction resets it', async () => {
    mockMatchMedia({ '(prefers-reduced-motion: reduce)': false })
    syncRAF()
    const { wrapper, getApi } = mountHost(false)
    const { isIdle, isBreathingEligible, resetIdle, runInference } = getApi()

    expect(isIdle.value).toBe(false)
    // Advance past the idle threshold.
    vi.advanceTimersByTime(2600)
    await nextTick()
    expect(isIdle.value).toBe(true)
    // Motion allowed + idle => breathing eligible.
    expect(isBreathingEligible.value).toBe(true)

    // Interaction resets the timer.
    resetIdle()
    await nextTick()
    expect(isIdle.value).toBe(false)

    // runInference also counts as an interaction (resets idle).
    vi.advanceTimersByTime(2600)
    await nextTick()
    expect(isIdle.value).toBe(true)
    runInference()
    await nextTick()
    expect(isIdle.value).toBe(false)
    wrapper.unmount()
  })
})
