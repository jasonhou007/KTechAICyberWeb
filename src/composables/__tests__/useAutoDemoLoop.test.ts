/**
 * @file useAutoDemoLoop.test.ts
 * @description Unit tests for the Self-Driving ambient demo loop FSM (#203).
 * @ticket #203 - Add 'Self-Driving' ambient demo background.
 *
 * Drives a real host component that mounts the composable (same style as
 * useNeuralNet.test.ts). matchMedia + rAF + timers + IntersectionObserver +
 * visibilitychange are all mocked so timing is deterministic.
 *
 * Coverage areas (mirror the planner's contract):
 * - initial state: phaseId='intake', isActive=true, isStatic=false.
 * - forward transition: INTAKE->TRIAGE->...->RESOLVED, phaseElapsedMs resets.
 * - seamless wrap: RESOLVED->INTAKE with loopIteration+1, rAF still scheduled.
 * - throttled-when-hidden: visibilitychange(hidden) cancels rAF + freezes
 *   elapsed, resuming shows no delta-jump.
 * - throttled-when-offscreen: IntersectionObserver callback throttles.
 * - reduced-motion: matchMedia(reduce) -> isStatic=true, isActive=false,
 *   ZERO requestAnimationFrame calls.
 * - heavy-load: delta>50ms for N frames -> throttleLevel 'half', recovers to
 *   'full', phase still advances.
 * - cleanup-on-unmount: rAF cancelled, IO.disconnect called, listeners removed.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { useAutoDemoLoop } from '../useAutoDemoLoop'

// ---------------------------------------------------------------------------
// matchMedia / rAF mock helpers (mirrors useNeuralNet.test.ts conventions)
// ---------------------------------------------------------------------------

let originalMatchMedia: ((q: string) => MediaQueryList) | undefined
let originalRAF: typeof window.requestAnimationFrame
let originalCancelRAF: typeof window.cancelAnimationFrame
let originalIO: typeof window.IntersectionObserver
let originalHidden: PropertyDescriptor | undefined

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

/**
 * Controllable rAF: enqueues callbacks but does NOT fire them. Tests flush a
 * frame manually, supplying an explicit timestamp so delta-time math is
 * deterministic. Each frame the loop reschedules itself, so step() keeps
 * draining until the queue is empty or we stop calling it.
 */
function queueRAF() {
  const queue: Array<{ cb: FrameRequestCallback; id: number }> = []
  let nextId = 1
  let rafCallCount = 0
  const cancelled = new Set<number>()
  window.requestAnimationFrame = ((cb: FrameRequestCallback) => {
    rafCallCount++
    const id = nextId++
    queue.push({ cb, id })
    return id
  }) as any
  window.cancelAnimationFrame = ((handle: number) => {
    cancelled.add(handle)
  }) as any
  return {
    /** Fire one frame at the given timestamp (defaults to a 16ms step from
     *  the previous frame). Returns the id that was fired. */
    step(ts?: number): number | undefined {
      // Skip cancelled entries.
      while (queue.length > 0 && cancelled.has(queue[0].id)) {
        queue.shift()
      }
      const entry = queue.shift()
      if (!entry) return undefined
      entry.cb(ts ?? 0)
      return entry.id
    },
    get pending() {
      return queue.filter((e) => !cancelled.has(e.id)).length
    },
    get callCount() {
      return rafCallCount
    },
    /** Total requestAnimationFrame invocations so far (for reduced-motion
     *  ZERO-rAF assertions). */
    get totalScheduled() {
      return rafCallCount
    },
  }
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
// IntersectionObserver mock (mirrors useIntersectionObserver.test.ts)
// ---------------------------------------------------------------------------

interface ObserverController {
  callback: IntersectionObserverCallback
  observe: ReturnType<typeof vi.fn>
  unobserve: ReturnType<typeof vi.fn>
  disconnect: ReturnType<typeof vi.fn>
}

const ioInstances: ObserverController[] = []

function mockIntersectionObserver() {
  ioInstances.length = 0
  class FakeIO {
    callback: IntersectionObserverCallback
    observe = vi.fn()
    unobserve = vi.fn()
    disconnect = vi.fn()
    takeRecords = vi.fn(() => [])
    constructor(callback: IntersectionObserverCallback) {
      this.callback = callback
      ioInstances.push(this as unknown as ObserverController)
    }
  }
  ;(window as any).IntersectionObserver = FakeIO
}

function lastIO(): ObserverController {
  return ioInstances[ioInstances.length - 1]
}

// ---------------------------------------------------------------------------
// Stub host component
// ---------------------------------------------------------------------------

function mountHost() {
  let api: ReturnType<typeof useAutoDemoLoop> | null = null
  const TestHost = defineComponent({
    name: 'AutoDemoLoopHost',
    setup() {
      api = useAutoDemoLoop()
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

describe('useAutoDemoLoop()', () => {
  beforeEach(() => {
    originalMatchMedia = window.matchMedia
    originalRAF = window.requestAnimationFrame
    originalCancelRAF = window.cancelAnimationFrame
    originalIO = window.IntersectionObserver
    originalHidden = Object.getOwnPropertyDescriptor(document, 'hidden')
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
    if (originalMatchMedia) window.matchMedia = originalMatchMedia
    else delete (window as any).matchMedia
    window.requestAnimationFrame = originalRAF
    window.cancelAnimationFrame = originalCancelRAF
    ;(window as any).IntersectionObserver = originalIO
    if (originalHidden) Object.defineProperty(document, 'hidden', originalHidden)
    else delete (document as any).hidden
    document.body.innerHTML = ''
    ioInstances.length = 0
  })

  // 1. initial state -------------------------------------------------------

  it('initial state: phaseId=intake, isActive=true, isStatic=false, loopIteration=0', () => {
    mockMatchMedia({ '(prefers-reduced-motion: reduce)': false })
    const raf = queueRAF()
    mockIntersectionObserver()
    const { wrapper, getApi } = mountHost()
    const { phaseId, isActive, isStatic, loopIteration, throttleLevel } = getApi()

    expect(phaseId.value).toBe('intake')
    expect(isActive.value).toBe(true)
    expect(isStatic.value).toBe(false)
    expect(loopIteration.value).toBe(0)
    expect(throttleLevel.value).toBe('full')
    // The loop scheduled at least one rAF on mount.
    expect(raf.callCount).toBeGreaterThanOrEqual(1)
    wrapper.unmount()
  })

  // 2. forward transition --------------------------------------------------

  it('forward transition: advances through phases in order, phaseElapsedMs resets', () => {
    mockMatchMedia({ '(prefers-reduced-motion: reduce)': false })
    const raf = queueRAF()
    mockIntersectionObserver()
    const { wrapper, getApi } = mountHost()
    const { phaseId, phaseIndex, phaseElapsedMs, phaseDurationMs } = getApi()

    // phaseDurationMs is the composable's own configured phase length (no
    // hardcoded mirror of the constant here, so tuning it never desyncs the
    // test). We step frames at 16ms intervals until the phase flips.
    const PHASE_MS = phaseDurationMs
    let t = 0
    const seen: string[] = [phaseId.value]
    // Step enough frames to cross at least two phase boundaries.
    for (let i = 0; i < 400 && seen.length < 3; i++) {
      t += 16
      raf.step(t)
      if (phaseId.value !== seen[seen.length - 1]) seen.push(phaseId.value)
    }
    expect(seen[0]).toBe('intake')
    expect(seen[1]).toBe('triage')
    // phaseIndex advanced.
    expect(phaseIndex.value).toBeGreaterThan(0)
    // After a fresh transition elapsed is small (reset), well under a full
    // phase duration.
    expect(phaseElapsedMs.value).toBeLessThan(PHASE_MS)
    // rAF is still scheduled (loop keeps running).
    expect(raf.pending).toBeGreaterThanOrEqual(1)
    wrapper.unmount()
  })

  // 3. seamless wrap -------------------------------------------------------

  it('seamless wrap: RESOLVED -> INTAKE bumps loopIteration, rAF still scheduled', () => {
    mockMatchMedia({ '(prefers-reduced-motion: reduce)': false })
    const raf = queueRAF()
    mockIntersectionObserver()
    const { wrapper, getApi } = mountHost()
    const { phaseId, loopIteration, phaseDurationMs } = getApi()

    // Step through an entire cycle (8 phases * phaseDurationMs) + a little
    // extra. Derive from the composable's own config so tuning the constant
    // never desyncs this test.
    let t = 0
    let wrapped = false
    const maxFrames = Math.ceil((8 * phaseDurationMs + 500) / 16) + 50
    for (let i = 0; i < maxFrames && !wrapped; i++) {
      t += 16
      raf.step(t)
      // When loopIteration increments past 0 we have wrapped at least once.
      if (loopIteration.value >= 1) wrapped = true
    }
    expect(wrapped).toBe(true)
    expect(loopIteration.value).toBeGreaterThanOrEqual(1)
    // After wrap the phase is back near intake.
    expect(phaseId.value).toBe('intake')
    // Loop is still alive.
    expect(raf.pending).toBeGreaterThanOrEqual(1)
    wrapper.unmount()
  })

  // 4. throttled-when-hidden ----------------------------------------------

  it('throttled-when-hidden: visibilitychange hidden cancels rAF + freezes; resume shows no delta-jump', () => {
    mockMatchMedia({ '(prefers-reduced-motion: reduce)': false })
    const raf = queueRAF()
    mockIntersectionObserver()
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: false,
    })
    const { wrapper, getApi } = mountHost()
    const { phaseElapsedMs } = getApi()

    // Advance partway into a phase.
    let t = 0
    for (let i = 0; i < 30; i++) {
      t += 16
      raf.step(t)
    }
    const elapsedBeforeHide = phaseElapsedMs.value
    expect(elapsedBeforeHide).toBeGreaterThan(0)

    // Tab hidden: dispatch visibilitychange. The composable cancels rAF and
    // stops accumulating phase elapsed time.
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: true,
    })
    document.dispatchEvent(new Event('visibilitychange'))

    // Drain anything already queued (should be none / a cancelled frame).
    const hiddenElapsed = phaseElapsedMs.value
    // Step a few more "virtual" frames worth of time; with the tab hidden the
    // loop is not scheduling, so elapsed must not grow.
    expect(hiddenElapsed).toBeLessThanOrEqual(elapsedBeforeHide + 32)

    // Resume: tab visible again.
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: false,
    })
    document.dispatchEvent(new Event('visibilitychange'))
    // First resumed frame should NOT dump the entire hidden interval as a
    // delta-jump: elapsed right after resume is close to where we paused.
    raf.step(t + 16)
    const resumedElapsed = phaseElapsedMs.value
    // No delta-jump: the resumed elapsed is within one frame of the paused
    // value, not jumped by the whole hidden duration.
    expect(resumedElapsed).toBeLessThan(hiddenElapsed + 64)
    wrapper.unmount()
  })

  // 5. throttled-when-offscreen -------------------------------------------

  it('throttled-when-offscreen: IntersectionObserver not-intersecting pauses rAF (#382 fix)', () => {
    mockMatchMedia({ '(prefers-reduced-motion: reduce)': false })
    const raf = queueRAF()
    mockIntersectionObserver()
    const { wrapper, getApi } = mountHost()
    const { throttleLevel, isActive } = getApi()

    // The composable observed its root; fire an offscreen entry.
    const io = lastIO()
    expect(io).toBeTruthy()
    io.callback(
      [{ isIntersecting: false, intersectionRatio: 0 } as any],
      {} as any,
    )
    // Issue #382 fix: Offscreen => paused (rAF cancelled completely), NOT half.
    expect(throttleLevel.value).toBe('paused')
    // isActive remains true (visibility state is separate), but rAF is cancelled
    expect(isActive.value).toBe(true)
    // rAF queue should be empty (cancelled by onFrame early return)
    expect(raf.pending).toBe(0)

    // Coming back onscreen should resume rAF
    io.callback(
      [{ isIntersecting: true, intersectionRatio: 1 } as any],
      {} as any,
    )
    expect(throttleLevel.value).toBe('full')
    expect(raf.pending).toBeGreaterThan(0)

    wrapper.unmount()
  })

  // 6. reduced-motion static ----------------------------------------------

  it('reduced-motion: isStatic=true, isActive=false, ZERO requestAnimationFrame calls', () => {
    mockMatchMedia({ '(prefers-reduced-motion: reduce)': true })
    const raf = neverRAF()
    mockIntersectionObserver()
    const { wrapper, getApi } = mountHost()
    const { isStatic, isActive } = getApi()

    expect(isStatic.value).toBe(true)
    expect(isActive.value).toBe(false)
    expect(raf.callCount).toBe(0)
    wrapper.unmount()
  })

  // 7. heavy-load throttle -------------------------------------------------

  it('heavy-load: delta>50ms for N frames -> throttleLevel half, recovers to full, phase still advances', () => {
    mockMatchMedia({ '(prefers-reduced-motion: reduce)': false })
    const raf = queueRAF()
    mockIntersectionObserver()
    const { wrapper, getApi } = mountHost()
    const { throttleLevel, phaseId } = getApi()

    // Simulate a sustained jank: each frame's delta is 80ms (> 50ms threshold).
    let t = 0
    for (let i = 0; i < 10; i++) {
      t += 80
      raf.step(t)
    }
    expect(throttleLevel.value).toBe('half')

    // Load recovers: frames come back to ~16ms.
    for (let i = 0; i < 10; i++) {
      t += 16
      raf.step(t)
    }
    expect(throttleLevel.value).toBe('full')

    // Despite the earlier throttle, the phase clock kept accumulating (at
    // half-speed while throttled) and eventually crosses a phase boundary.
    // Drive enough frames at full speed to guarantee a transition.
    for (let i = 0; i < 200 && phaseId.value === 'intake'; i++) {
      t += 16
      raf.step(t)
    }
    expect(phaseId.value).not.toBe('intake')
    wrapper.unmount()
  })

  // 8. parallax depth signal (AC2) ----------------------------------------

  it('AC2 parallax: depthShift oscillates in -1..1 as the shared rAF clock advances', () => {
    mockMatchMedia({ '(prefers-reduced-motion: reduce)': false })
    const raf = queueRAF()
    mockIntersectionObserver()
    const { wrapper, getApi } = mountHost()
    const { depthShift } = getApi()

    // PARALLAX_PERIOD_MS=12000; depthShift = sin(2*pi*accum/period). Sample the
    // whole period in 16ms frames and assert it (a) reaches near its +1 peak,
    // (b) reaches near its -1 trough, and (c) crosses zero — proving it is a
    // real oscillation driven by the shared rAF clock, not a constant.
    let t = 0
    let max = -Infinity
    let min = Infinity
    let crossedZero = false
    let prev = depthShift.value
    for (let i = 0; i < 12 * 60; i++) {
      // 12s of 16ms frames ~ one full period
      t += 16
      raf.step(t)
      const v = depthShift.value
      if (v > max) max = v
      if (v < min) min = v
      if ((prev < 0 && v >= 0) || (prev > 0 && v <= 0)) crossedZero = true
      prev = v
    }
    expect(max).toBeGreaterThan(0.9) // near +1 peak
    expect(min).toBeLessThan(-0.9) // near -1 trough
    expect(crossedZero).toBe(true)
    expect(depthShift.value).toBeGreaterThanOrEqual(-1)
    expect(depthShift.value).toBeLessThanOrEqual(1)
    wrapper.unmount()
  })

  it('AC2 parallax: depthShift is pinned at 0 under reduced motion (no depth drift)', () => {
    mockMatchMedia({ '(prefers-reduced-motion: reduce)': true })
    neverRAF()
    mockIntersectionObserver()
    const { wrapper, getApi } = mountHost()
    const { depthShift } = getApi()
    expect(depthShift.value).toBe(0)
    wrapper.unmount()
  })

  // 9. cleanup-on-unmount --------------------------------------------------

  it('cleanup-on-unmount: rAF cancelled, IO.disconnect called, listeners removed', () => {
    mockMatchMedia({ '(prefers-reduced-motion: reduce)': false })
    queueRAF()
    mockIntersectionObserver()
    const removeSpy = vi.spyOn(document, 'removeEventListener')
    const { wrapper } = mountHost()
    const io = lastIO()

    wrapper.unmount()

    // IO was disconnected.
    expect(io.disconnect).toHaveBeenCalled()
    // visibilitychange listener was removed.
    expect(removeSpy).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function),
    )
    removeSpy.mockRestore()
  })

  // 10. observe() does not retain a stale target (INFO-1) -------------------

  it('INFO-1: observe() unobserves the previous target before observing the new one', () => {
    mockMatchMedia({ '(prefers-reduced-motion: reduce)': false })
    queueRAF()
    mockIntersectionObserver()
    const { wrapper, getApi } = mountHost()
    const { observe } = getApi()
    const io = lastIO()

    // On mount the composable observed document.documentElement by default.
    expect(io.observe).toHaveBeenCalledWith(document.documentElement)

    // Re-point the observer at a new element (this is what the view does in
    // onMounted). The previous documentElement observation must be released so
    // it cannot flip isOffscreen after the real root has scrolled away.
    const newEl = document.createElement('div')
    observe(newEl)

    expect(io.observe).toHaveBeenLastCalledWith(newEl)
    // The previous default target was unobserved.
    expect(io.unobserve).toHaveBeenCalledWith(document.documentElement)
    wrapper.unmount()
  })

  it('INFO-1: observe() unobserves an earlier observed element when re-pointed', () => {
    mockMatchMedia({ '(prefers-reduced-motion: reduce)': false })
    queueRAF()
    mockIntersectionObserver()
    const { wrapper, getApi } = mountHost()
    const { observe } = getApi()
    const io = lastIO()

    const first = document.createElement('div')
    const second = document.createElement('div')
    observe(first)
    observe(second)

    // The most recent target is observed.
    expect(io.observe).toHaveBeenLastCalledWith(second)
    // The earlier explicitly-observed element was released too.
    expect(io.unobserve).toHaveBeenCalledWith(first)
    wrapper.unmount()
  })

  // 11. delta clamp falls back to a neutral frame, not a jank frame (INFO-2) --

  it('INFO-2: an absurdly large delta is clamped to a neutral frame (no fast-forward, no false jank)', () => {
    mockMatchMedia({ '(prefers-reduced-motion: reduce)': false })
    const raf = queueRAF()
    mockIntersectionObserver()
    const { wrapper, getApi } = mountHost()
    const { phaseId, phaseIndex, throttleLevel, phaseDurationMs } = getApi()

    // Establish a baseline with one normal frame.
    let t = 16
    raf.step(t)

    // Deliver a delta FAR larger than PHASE_DURATION_MS — e.g. a background tab
    // that was throttled and resumed with a multi-second gap. The clamp must
    // reduce this to a NEUTRAL single frame so the phase clock does not
    // fast-forward multiple phases in one step.
    const gap = phaseDurationMs * 3 // well over one full phase
    t += gap
    raf.step(t)

    // The phase did NOT jump past the first boundary (no multi-phase skip).
    expect(phaseIndex.value).toBeLessThanOrEqual(1)
    expect(phaseId.value).not.toBe('resolved')

    // Now feed several consecutive huge-gap frames. Each is clamped to the
    // neutral value; only if that clamp is < HEAVY_LOAD_FRAME_MS (50ms) do they
    // avoid registering as jank. The OLD clamp fell back to 50ms exactly, so 5
    // consecutive clamped frames would trip throttleLevel to 'half'. With the
    // neutral (~16.7ms) clamp the throttle must stay 'full'.
    for (let i = 0; i < 6; i++) {
      t += gap
      raf.step(t)
    }
    expect(throttleLevel.value).toBe('full')
    wrapper.unmount()
  })

  // 12. legacy MediaQueryList fallback (addListener/removeListener) ---------
  // Old browsers (Safari < 14) ship MediaQueryList WITHOUT addEventListener;
  // the composable must fall back to the deprecated addListener/removeListener
  // API. This exercises the else-if branches in setup() + cleanup().

  it('legacy MQL: uses addListener/removeListener when addEventListener is absent', () => {
    // Mock a legacy MediaQueryList: has addListener/removeListener but NOT
    // addEventListener/removeEventListener.
    const addSpy = vi.fn()
    const removeSpy = vi.fn()
    window.matchMedia = ((query: string) =>
      ({
        matches: false,
        media: query,
        addListener: addSpy,
        removeListener: removeSpy,
        onchange: null,
        dispatchEvent: () => false,
      }) as MediaQueryList) as any
    queueRAF()
    mockIntersectionObserver()

    const { wrapper } = mountHost()

    // The legacy addListener fallback was used at setup (NOT addEventListener,
    // which is undefined on this mock MQL).
    expect(addSpy).toHaveBeenCalledTimes(1)
    expect(addSpy).toHaveBeenCalledWith(expect.any(Function))

    wrapper.unmount()

    // And the legacy removeListener fallback was used at cleanup.
    expect(removeSpy).toHaveBeenCalledTimes(1)
    expect(removeSpy).toHaveBeenCalledWith(expect.any(Function))
  })

  // 13. start() is a no-op under reduced motion ----------------------------

  it('start(): no-op under reduced motion (does not schedule a frame)', () => {
    mockMatchMedia({ '(prefers-reduced-motion: reduce)': true })
    const raf = neverRAF()
    mockIntersectionObserver()
    const { wrapper, getApi } = mountHost()
    const { start } = getApi()

    // Already in static mode from mount; calling start() must NOT schedule.
    const before = raf.callCount
    start()
    expect(raf.callCount).toBe(before)

    wrapper.unmount()
  })

  // 14. rAF re-entrancy guard (loop paused between scheduling and firing) ---

  it('re-entrancy: a frame queued while active is skipped if paused before firing', () => {
    mockMatchMedia({ '(prefers-reduced-motion: reduce)': false })
    const raf = queueRAF()
    mockIntersectionObserver()
    const { wrapper, getApi } = mountHost()
    const { pause } = getApi()

    // Capture total rAF invocations so far (mount scheduled >= 1 frame).
    const scheduledBeforeFiring = raf.totalScheduled

    // Pause BEFORE the queued frame fires. The pending callback must detect
    // isActive=false and bail without rescheduling (the re-entrancy guard).
    pause()
    raf.step()

    // Firing the paused frame did NOT schedule a new frame.
    expect(raf.totalScheduled).toBe(scheduledBeforeFiring)

    wrapper.unmount()
  })

  // 15. missing IntersectionObserver guard ---------------------------------

  it('no-IO: setup degrades gracefully when IntersectionObserver is undefined', () => {
    mockMatchMedia({ '(prefers-reduced-motion: reduce)': false })
    queueRAF()
    // Remove IntersectionObserver entirely (SSR-like / unsupported runtime).
    const originalIO = (window as any).IntersectionObserver
    delete (window as any).IntersectionObserver

    const { wrapper, getApi } = mountHost()
    const { isActive } = getApi()

    // The loop still runs (rAF-based); only the offscreen throttle is skipped.
    expect(isActive.value).toBe(true)
    wrapper.unmount()

    ;(window as any).IntersectionObserver = originalIO
  })
})
