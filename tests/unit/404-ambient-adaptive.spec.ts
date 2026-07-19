/**
 * Unit tests for adaptive ambient animation behavior (Issue #404)
 * TDD Phase 1: RED - These tests should fail before implementation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useAmbientAnimation } from '@/composables/useAmbientAnimation'
import { mount } from '@vue/test-utils'
import { computed, ref } from 'vue'

describe('useAmbientAnimation - Issue #404', () => {
  let originalPerformance: Performance
  let originalRAF: typeof requestAnimationFrame
  let originalCAF: typeof cancelAnimationFrame
  let rafCallbacks: Array<FrameRequestCallback> = []
  let rafId = 0

  beforeEach(() => {
    // Store original performance API
    originalPerformance = global.performance
    originalRAF = global.requestAnimationFrame
    originalCAF = global.cancelAnimationFrame
    rafCallbacks = []
    rafId = 0

    // Mock performance API with mark and measure support
    global.performance = {
      ...originalPerformance,
      mark: vi.fn(),
      measure: vi.fn(),
      getEntriesByName: vi.fn(() => []),
      clearMarks: vi.fn(),
      clearMeasures: vi.fn(),
      now: vi.fn(() => Date.now())
    } as any

    // Mock requestAnimationFrame
    global.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
      const id = ++rafId
      rafCallbacks.push(callback)
      return id
    }) as any

    // Mock cancelAnimationFrame
    global.cancelAnimationFrame = vi.fn((id: number) => {
      const index = rafCallbacks.findIndex(cb => cb.toString().includes(id.toString()))
      if (index !== -1) {
        rafCallbacks.splice(index, 1)
      }
    }) as any

    // Mock window.innerWidth for device detection
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024
    })

    // Mock IntersectionObserver
    global.IntersectionObserver = vi.fn(() => ({
      observe: vi.fn(),
      disconnect: vi.fn(),
      unobserve: vi.fn()
    })) as any

    // Mock matchMedia for reduced motion
    global.matchMedia = vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    })) as any
  })

  afterEach(() => {
    global.performance = originalPerformance
    global.requestAnimationFrame = originalRAF
    global.cancelAnimationFrame = originalCAF
    rafCallbacks = []

    // Restore window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024
    })
  })

  describe('performance marks infrastructure', () => {
    it('should export PERF_MARKS constant', () => {
      // Import the PERF_MARKS constant
      const { PERF_MARKS } = useAmbientAnimation()

      expect(PERF_MARKS).toBeDefined()
      expect(PERF_MARKS.RAF_START).toBe('ambient-raf-start')
      expect(PERF_MARKS.RAF_END).toBe('ambient-raf-end')
      expect(PERF_MARKS.RAF_DURATION).toBe('ambient-raf-duration')
      expect(PERF_MARKS.LOOP_START).toBe('ambient-loop-start')
      expect(PERF_MARKS.LOOP_END).toBe('ambient-loop-end')
      expect(PERF_MARKS.FRAME_DURATION).toBe('ambient-frame-duration')
      expect(PERF_MARKS.PAUSED).toBe('ambient-paused')
      expect(PERF_MARKS.RESUMED).toBe('ambient-resumed')
      expect(PERF_MARKS.THROTTLED).toBe('ambient-throttled')
    })

    it('should have performance.mark available', () => {
      expect(typeof performance.mark).toBe('function')
    })

    it('should have performance.measure available', () => {
      expect(typeof performance.measure).toBe('function')
    })
  })

  describe('adaptive particle counts', () => {
    it('should use default particle count on desktop', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920
      })

      const { adaptiveParticles } = useAmbientAnimation({
        particles: 50,
        mobileParticles: 20
      })

      expect(adaptiveParticles.value).toBe(50)
    })

    it('should use reduced particle count on mobile', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })

      const { adaptiveParticles } = useAmbientAnimation({
        particles: 50,
        mobileParticles: 20
      })

      expect(adaptiveParticles.value).toBe(20)
    })

    it('should adapt particle count when device type changes', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920
      })

      const { adaptiveParticles } = useAmbientAnimation({
        particles: 50,
        mobileParticles: 20
      })

      expect(adaptiveParticles.value).toBe(50)

      // Simulate resize to mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })

      // Trigger resize event
      window.dispatchEvent(new Event('resize'))

      // Adaptive particles should update
      expect(adaptiveParticles.value).toBe(20)
    })
  })

  describe('adaptive update intervals', () => {
    it('should use faster update interval on desktop', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920
      })

      const { adaptiveUpdateInterval } = useAmbientAnimation({
        updateIntervalMs: 16,
        mobileUpdateIntervalMs: 32
      })

      expect(adaptiveUpdateInterval.value).toBe(16) // ~60fps
    })

    it('should use slower update interval on mobile', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })

      const { adaptiveUpdateInterval } = useAmbientAnimation({
        updateIntervalMs: 16,
        mobileUpdateIntervalMs: 32
      })

      expect(adaptiveUpdateInterval.value).toBe(32) // ~30fps
    })

    it('should adapt update interval when device type changes', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920
      })

      const { adaptiveUpdateInterval } = useAmbientAnimation({
        updateIntervalMs: 16,
        mobileUpdateIntervalMs: 32
      })

      expect(adaptiveUpdateInterval.value).toBe(16)

      // Simulate resize to mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })

      window.dispatchEvent(new Event('resize'))

      expect(adaptiveUpdateInterval.value).toBe(32)
    })
  })

  describe('adaptive loop duration', () => {
    it('should use standard loop duration on desktop', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920
      })

      const { adaptiveLoopDuration } = useAmbientAnimation({
        loopDurationMs: 45000,
        mobileLoopDurationMs: 60000
      })

      expect(adaptiveLoopDuration.value).toBe(45000)
    })

    it('should use longer loop duration on mobile', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })

      const { adaptiveLoopDuration } = useAmbientAnimation({
        loopDurationMs: 45000,
        mobileLoopDurationMs: 60000
      })

      expect(adaptiveLoopDuration.value).toBe(60000)
    })

    it('should adapt loop duration when device type changes', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920
      })

      const { adaptiveLoopDuration } = useAmbientAnimation({
        loopDurationMs: 45000,
        mobileLoopDurationMs: 60000
      })

      expect(adaptiveLoopDuration.value).toBe(45000)

      // Simulate resize to mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })

      window.dispatchEvent(new Event('resize'))

      expect(adaptiveLoopDuration.value).toBe(60000)
    })
  })

  describe('prefers-reduced-motion fallback', () => {
    it('should detect reduced motion preference', () => {
      global.matchMedia = vi.fn(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      })) as any

      const { isStatic } = useAmbientAnimation({
        reducedMotionFallback: true
      })

      expect(isStatic.value).toBe(true)
    })

    it('should not detect reduced motion when not preferred', () => {
      global.matchMedia = vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      })) as any

      const { isStatic } = useAmbientAnimation({
        reducedMotionFallback: true
      })

      expect(isStatic.value).toBe(false)
    })

    it('should not start animation when reduced motion preferred', () => {
      global.matchMedia = vi.fn(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      })) as any

      const { startLoop } = useAmbientAnimation({
        reducedMotionFallback: true
      })

      startLoop()

      // Should not schedule RAF
      expect(global.requestAnimationFrame).not.toHaveBeenCalled()
    })
  })

  describe('performance mark naming convention', () => {
    it('should export performance mark names with ambient- prefix', () => {
      const { PERF_MARKS } = useAmbientAnimation()

      Object.values(PERF_MARKS).forEach(markName => {
        expect(markName).toMatch(/^ambient-/)
      })
    })
  })
})
