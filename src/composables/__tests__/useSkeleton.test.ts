/**
 * @file useSkeleton.test.ts
 * @description Comprehensive unit tests for the useSkeleton & useInitialLoading composables
 * @ticket #110 - TEST-037: useSkeleton Composable Unit Tests - TDD with Vitest
 *
 * Test Categories:
 * - useSkeleton (immediate / above-fold): initial state, 800ms timer load, no observer
 * - useSkeleton (below-fold / intersection): initial state, intersection flip,
 *     600ms load, idempotent re-intersection, threshold honored
 * - useSkeleton defaults: immediate=false, threshold=0.1
 * - useSkeleton cleanup: observer stop() on unmount, no leaked observers/timers
 * - useInitialLoading: initial state, progress increments toward 100, clamp at 100,
 *     completion (isLoading=false, isComplete=true) after 600ms, cleanup fn clears interval
 *
 * TDD Approach:
 * 1. Red: Tests written to define expected behavior
 * 2. Green: Composable implementation makes tests pass
 * 3. Refactor: Test code optimized for clarity and maintainability
 *
 * Lifecycle note:
 *   onMounted / onUnmounted only fire inside a component scope, so each composable
 *   call is wrapped in a tiny test component mounted via @vue/test-utils.
 *
 * Auto-unwrap note:
 *   @vue/test-utils auto-unwraps refs exposed from setup() on `wrapper.vm`, so a
 *   binding like `wrapper.vm.isLoading` is the live primitive (boolean / number),
 *   not a ref. Reading it through `wrapper.vm` on each assertion keeps the value
 *   live across fake-timer advances. Destructuring would snapshot, so we avoid it.
 *
 * Mocking note:
 *   @vueuse/core's useIntersectionObserver is mocked via vi.mock so tests can drive
 *   the intersection callback deterministically. The mock captures the callback and
 *   exposes it through a module-scoped handle so a test can fire intersection events.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'

// Type describing the captured intersection-observer mock instance.
interface ObserverController {
  /** The intersection callback the composable registered. */
  callback: (entries: Array<{ isIntersecting: boolean }>) => void
  /** The options object (incl. threshold) the composable passed in. */
  options: { threshold?: number }
  /** The stop() function the composable stored away. */
  stop: () => void
}

// Module-scoped handle the test uses to assert on the last observer created.
let lastObserver: ObserverController | null = null

// vi.mock is hoisted above imports by Vitest. The factory replaces
// useIntersectionObserver with a spy that records the composable's registration
// and returns the stop() function the composable will later call on unmount.
vi.mock('@vueuse/core', () => {
  const useIntersectionObserver = vi.fn(
    (
      _target: unknown,
      callback: (entries: Array<{ isIntersecting: boolean }>) => void,
      options: { threshold?: number } = {},
    ) => {
      const stop = vi.fn()
      lastObserver = { callback, options, stop }
      return stop
    },
  )
  return { useIntersectionObserver }
})

import { useSkeleton, useInitialLoading } from '../useSkeleton.js'
// Imported AFTER vi.mock is hoisted, so this binding IS the mock spy. The
// composable resolves the same mocked module, ensuring both sides share one
// implementation and we can assert on its call history.
import { useIntersectionObserver } from '@vueuse/core'

/** Convenience accessor over the auto-unwrapped wrapper instance. */
type VM = Record<string, unknown>

/**
 * Build a test wrapper component that invokes a composable factory inside setup()
 * and exposes the returned bindings on the instance. Mounting it via
 * @vue/test-utils ensures onMounted/onUnmounted run exactly as in production.
 *
 * `withTarget`, when provided, is invoked INSIDE setup() right after the
 * composable returns, so it can populate the composable's `target` ref BEFORE
 * onMounted runs (synchronously during mount()). This is required for the
 * below-fold branch, whose onMounted guards on `if (target.value)`.
 */
function makeWrapper<T extends Record<string, unknown>>(
  factory: () => T,
  withTarget?: (bindings: T) => void,
) {
  const TestHost = defineComponent({
    name: 'TestHost',
    setup() {
      const result = factory()
      // Populate the target ref now (before onMounted) if the caller asked for it.
      if (withTarget) withTarget(result)
      // Expose every returned binding so tests can read it live via wrapper.vm.
      return { ...result } as Record<string, unknown>
    },
    render() {
      // Minimal render so the component has a real element.
      return h('div', { class: 'test-host' })
    },
  })
  return mount(TestHost)
}

/**
 * Helper for below-fold tests: returns a setup-time callback that assigns a
 * real DOM node to the composable's `target` ref (so onMounted's
 * `if (target.value)` branch is taken).
 */
const assignTarget =
  <T extends { target: { value: Element | null } }>() =>
  (bindings: T) => {
    bindings.target.value = document.createElement('div')
  }

describe('useSkeleton.js', () => {
  beforeEach(() => {
    // Deterministic timers for all 600ms/800ms/20ms assertions.
    vi.useFakeTimers()
    lastObserver = null
    // Reset the mock's call history between tests.
    vi.mocked(useIntersectionObserver).mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
    lastObserver = null
  })

  // ============================================
  // useSkeleton — immediate (above-fold) mode
  // ============================================
  //
  // Implementation reality (verified against useSkeleton.js):
  //   isLoading = ref(!immediate)  -> for immediate=true, starts FALSE
  //   isVisible = ref(immediate)   -> for immediate=true, starts TRUE
  //   hasLoaded = ref(false)       -> flips to TRUE after the 800ms timer
  // The 800ms setTimeout in the immediate branch sets hasLoaded=true (and
  // re-affirms isLoading=false). Above-fold content is never "loading".
  describe('useSkeleton({ immediate: true }) — above-fold', () => {
    it('exposes above-fold initial state (isLoading=false, isVisible=true, hasLoaded=false)', () => {
      // Arrange + Act: mount wrapper invoking the composable with immediate=true
      const wrapper = makeWrapper(() => useSkeleton({ immediate: true }))
      const vm = wrapper.vm as VM

      // Assert: above-fold content is visible immediately and never in a
      // loading state (isLoading is initialized to !immediate === false).
      expect(vm.isLoading).toBe(false)
      expect(vm.isVisible).toBe(true)
      expect(vm.hasLoaded).toBe(false)

      wrapper.unmount()
    })

    it('marks hasLoaded=true after the 800ms immediate timer (isLoading stays false)', () => {
      // Arrange
      const wrapper = makeWrapper(() => useSkeleton({ immediate: true }))
      const vm = wrapper.vm as VM

      // Act: advance just short of the timer — not yet "loaded"
      vi.advanceTimersByTime(799)
      expect(vm.isLoading).toBe(false)
      expect(vm.hasLoaded).toBe(false)

      // Act: cross the 800ms threshold
      vi.advanceTimersByTime(1)

      // Assert: the timer fires at ~800ms, marking the content as loaded
      expect(vm.isLoading).toBe(false)
      expect(vm.hasLoaded).toBe(true)

      wrapper.unmount()
    })

    it('does NOT set up an intersection observer in immediate mode', () => {
      // Arrange + Act
      const wrapper = makeWrapper(() => useSkeleton({ immediate: true }))

      // Assert: the immediate branch uses a setTimeout, never useIntersectionObserver
      expect(useIntersectionObserver).not.toHaveBeenCalled()
      expect(lastObserver).toBeNull()

      wrapper.unmount()
    })
  })

  // ============================================
  // useSkeleton — below-fold (intersection) mode
  // ============================================
  describe('useSkeleton({ immediate: false }) — below-fold', () => {
    it('exposes initial loading state (isLoading=true, isVisible=false, hasLoaded=false)', () => {
      // Arrange + Act: target populated so the observer branch is taken
      const wrapper = makeWrapper(() => useSkeleton({ immediate: false }), assignTarget())
      const vm = wrapper.vm as VM

      // Assert: below-fold content starts hidden & loading
      expect(vm.isLoading).toBe(true)
      expect(vm.isVisible).toBe(false)
      expect(vm.hasLoaded).toBe(false)

      wrapper.unmount()
    })

    it('sets up an intersection observer on the target when not immediate', () => {
      // Arrange + Act
      const wrapper = makeWrapper(() => useSkeleton({ immediate: false }), assignTarget())

      // Assert: observer registered exactly once with the target
      expect(useIntersectionObserver).toHaveBeenCalledTimes(1)
      expect(lastObserver).not.toBeNull()

      wrapper.unmount()
    })

    it('flips isVisible to true as soon as the target intersects', () => {
      // Arrange
      const wrapper = makeWrapper(() => useSkeleton({ immediate: false }), assignTarget())
      const vm = wrapper.vm as VM
      const observer = lastObserver!

      // Act: fire the intersection event (synchronously visible)
      observer.callback([{ isIntersecting: true }])

      // Assert: visibility is set immediately (before the load timer fires)
      expect(vm.isVisible).toBe(true)
      // Still loading until the 600ms fetch timer completes
      expect(vm.isLoading).toBe(true)

      wrapper.unmount()
    })

    it('finishes loading ~600ms after intersection (isLoading=false, hasLoaded=true)', () => {
      // Arrange
      const wrapper = makeWrapper(() => useSkeleton({ immediate: false }), assignTarget())
      const vm = wrapper.vm as VM
      const observer = lastObserver!

      // Act: intersect, then advance just shy of the fetch timer
      observer.callback([{ isIntersecting: true }])
      vi.advanceTimersByTime(599)
      expect(vm.isLoading).toBe(true)
      expect(vm.hasLoaded).toBe(false)

      // Act: cross the 600ms post-intersection threshold
      vi.advanceTimersByTime(1)

      // Assert
      expect(vm.isLoading).toBe(false)
      expect(vm.hasLoaded).toBe(true)

      wrapper.unmount()
    })

    it('does not re-trigger loading when hasLoaded is already true (idempotent)', () => {
      // Arrange: drive one full load to completion
      const wrapper = makeWrapper(() => useSkeleton({ immediate: false }), assignTarget())
      const vm = wrapper.vm as VM
      const observer = lastObserver!
      observer.callback([{ isIntersecting: true }])
      vi.advanceTimersByTime(600)
      // Sanity: loaded once
      expect(vm.hasLoaded).toBe(true)
      expect(vm.isLoading).toBe(false)

      // Act: intersect again — should be a no-op because hasLoaded guards it
      observer.callback([{ isIntersecting: true }])

      // Assert: state unchanged; no new timer queued (advancing time changes nothing)
      expect(vm.hasLoaded).toBe(true)
      expect(vm.isLoading).toBe(false)
      vi.advanceTimersByTime(1000)
      expect(vm.isLoading).toBe(false)

      wrapper.unmount()
    })

    it('honors the threshold option (passes it through to the observer)', () => {
      // Arrange + Act: request a custom threshold
      const wrapper = makeWrapper(
        () => useSkeleton({ immediate: false, threshold: 0.5 }),
        assignTarget(),
      )

      // Assert: the exact threshold value is forwarded to useIntersectionObserver
      expect(lastObserver).not.toBeNull()
      expect(lastObserver!.options).toEqual({ threshold: 0.5 })

      wrapper.unmount()
    })

    it('does NOT set up an observer when target is null at mount time', () => {
      // Arrange + Act: immediate=false but no target attached (default ref(null))
      const wrapper = makeWrapper(() => useSkeleton({ immediate: false }))
      const vm = wrapper.vm as VM

      // Assert: the `else if (target.value)` guard skips observer creation
      expect(useIntersectionObserver).not.toHaveBeenCalled()
      expect(lastObserver).toBeNull()
      // And nothing is loading yet — stays in its initial state
      expect(vm.isLoading).toBe(true)
      vi.advanceTimersByTime(1000)
      expect(vm.hasLoaded).toBe(false)

      wrapper.unmount()
    })
  })

  // ============================================
  // useSkeleton — default options
  // ============================================
  describe('useSkeleton() default options', () => {
    it('defaults to immediate=false and threshold=0.1', () => {
      // Arrange + Act: no options at all
      const wrapper = makeWrapper(() => useSkeleton(), assignTarget())
      const vm = wrapper.vm as VM

      // Assert: below-fold defaults applied — hidden/visible + observer with 0.1
      expect(vm.isVisible).toBe(false)
      expect(vm.isLoading).toBe(true)
      expect(lastObserver).not.toBeNull()
      expect(lastObserver!.options).toEqual({ threshold: 0.1 })

      wrapper.unmount()
    })

    it('behaves like the explicit immediate:false below-fold branch', () => {
      // Arrange + Act
      const wrapper = makeWrapper(() => useSkeleton(), assignTarget())
      const vm = wrapper.vm as VM
      const observer = lastObserver!

      // Act: full intersection lifecycle
      observer.callback([{ isIntersecting: true }])
      vi.advanceTimersByTime(600)

      // Assert: same completion as the explicit below-fold case
      expect(vm.isLoading).toBe(false)
      expect(vm.hasLoaded).toBe(true)

      wrapper.unmount()
    })
  })

  // ============================================
  // useSkeleton — cleanup
  // ============================================
  describe('useSkeleton cleanup', () => {
    it('calls stopObserver (the returned stop fn) on unmount when an observer exists', () => {
      // Arrange
      const wrapper = makeWrapper(() => useSkeleton({ immediate: false }), assignTarget())
      const stopSpy = lastObserver!.stop

      // Act: unmount the component
      wrapper.unmount()

      // Assert: onUnmounted invoked the stop function returned by the mock,
      // preventing a leaked observer.
      expect(stopSpy).toHaveBeenCalledTimes(1)
    })

    it('does not throw when unmounting in immediate mode (no observer to stop)', () => {
      // Arrange: immediate mode never creates an observer -> stopObserver stays null
      const wrapper = makeWrapper(() => useSkeleton({ immediate: true }))

      // Act + Assert: onUnmounted branch with stopObserver===null is a safe no-op
      expect(() => wrapper.unmount()).not.toThrow()
    })

    it('does not throw when unmounting below-fold before any intersection', () => {
      // Arrange: observer created but never fired
      const wrapper = makeWrapper(() => useSkeleton({ immediate: false }), assignTarget())

      // Act + Assert
      expect(() => wrapper.unmount()).not.toThrow()
    })

    it('cleans up the load timer when unmounted before the immediate timer fires', () => {
      // Arrange: immediate mode, advance partway (timer still pending)
      const wrapper = makeWrapper(() => useSkeleton({ immediate: true }))
      const vm = wrapper.vm as VM
      vi.advanceTimersByTime(400)
      expect(vm.hasLoaded).toBe(false)

      // Act: unmount before the 800ms timer fires, then advance past it
      expect(() => {
        wrapper.unmount()
        vi.advanceTimersByTime(1000)
      }).not.toThrow()

      // Assert: no thrown error — unmounting does not leave a failing pending timer.
    })
  })

  // ============================================
  // useInitialLoading
  // ============================================
  describe('useInitialLoading()', () => {
    it('exposes initial state (isLoading=true, progress=0, isComplete=false)', () => {
      // Arrange + Act
      const wrapper = makeWrapper(() => useInitialLoading())
      const vm = wrapper.vm as VM

      // Assert
      expect(vm.isLoading).toBe(true)
      expect(vm.progress).toBe(0)
      expect(vm.isComplete).toBe(false)

      wrapper.unmount()
    })

    it('startLoading() is a function and returns a cleanup function', () => {
      // Arrange
      const wrapper = makeWrapper(() => useInitialLoading())
      const vm = wrapper.vm as VM
      const startLoading = vm.startLoading as () => () => void

      // Assert: contract — startLoading is callable and yields a clearer
      expect(typeof startLoading).toBe('function')
      const cleanup = startLoading()
      expect(typeof cleanup).toBe('function')

      // Cleanup
      cleanup()
      wrapper.unmount()
    })

    it('increments progress toward 100 over the 20ms tick interval', () => {
      // Arrange
      const wrapper = makeWrapper(() => useInitialLoading())
      const vm = wrapper.vm as VM
      ;(vm.startLoading as () => () => void)()

      // Act: advance several ticks
      vi.advanceTimersByTime(60)

      // Assert: progress has increased from 0 but not yet reached 100
      expect(vm.progress as number).toBeGreaterThan(0)
      expect(vm.progress as number).toBeLessThan(100)

      wrapper.unmount()
    })

    it('clamps progress at exactly 100 (never exceeds it)', () => {
      // Arrange
      const wrapper = makeWrapper(() => useInitialLoading())
      const vm = wrapper.vm as VM
      ;(vm.startLoading as () => () => void)()

      // Act: advance well beyond the full 2000ms duration
      vi.advanceTimersByTime(5000)

      // Assert: progress is hard-clamped to 100, no overshoot
      expect(vm.progress as number).toBeLessThanOrEqual(100)
      expect(vm.progress).toBe(100)

      wrapper.unmount()
    })

    it('completes (isLoading=false, isComplete=true) ~600ms after reaching 100', () => {
      // Arrange
      const wrapper = makeWrapper(() => useInitialLoading())
      const vm = wrapper.vm as VM
      ;(vm.startLoading as () => () => void)()

      // Act: run the progress interval to completion (>= 2000ms)
      vi.advanceTimersByTime(2000)
      expect(vm.progress).toBe(100)
      // The 600ms completion timer has NOT fired yet
      expect(vm.isLoading).toBe(true)
      expect(vm.isComplete).toBe(false)

      // Act: advance past the 600ms fade-out wait
      vi.advanceTimersByTime(599)
      expect(vm.isLoading).toBe(true)
      vi.advanceTimersByTime(1)

      // Assert: completion landed exactly after the additional 600ms
      expect(vm.isLoading).toBe(false)
      expect(vm.isComplete).toBe(true)

      wrapper.unmount()
    })

    it('the cleanup function returned by startLoading() stops the interval', () => {
      // Arrange
      const wrapper = makeWrapper(() => useInitialLoading())
      const vm = wrapper.vm as VM
      const cleanup = (vm.startLoading as () => () => void)()

      // Act: a few ticks, then clear the interval, then advance a long time
      vi.advanceTimersByTime(60)
      const progressBefore = vm.progress as number
      cleanup()
      vi.advanceTimersByTime(5000)

      // Assert: progress is frozen at the value captured at cleanup time;
      // no further ticks ever fire.
      expect(vm.progress).toBe(progressBefore)
      expect(vm.progress as number).toBeLessThan(100)

      wrapper.unmount()
    })

    it('does not reset progress when startLoading completes (stays at 100)', () => {
      // Arrange
      const wrapper = makeWrapper(() => useInitialLoading())
      const vm = wrapper.vm as VM
      ;(vm.startLoading as () => () => void)()

      // Act: complete the whole cycle
      vi.advanceTimersByTime(3000)

      // Assert: terminal state is stable — progress stays clamped at 100
      expect(vm.progress).toBe(100)
      vi.advanceTimersByTime(2000)
      expect(vm.progress).toBe(100)

      wrapper.unmount()
    })

    it('can be mounted/unmounted multiple times without errors', () => {
      // Arrange + Act + Assert: repeated lifecycle cycles
      for (let i = 0; i < 5; i++) {
        const w = makeWrapper(() => useInitialLoading())
        const vm = w.vm as VM
        ;(vm.startLoading as () => () => void)()
        vi.advanceTimersByTime(100)
        expect(vm.progress as number).toBeGreaterThan(0)
        expect(() => w.unmount()).not.toThrow()
      }
    })
  })
})
