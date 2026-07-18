import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { useAmbientAnimation } from '../useAmbientAnimation'

// Mock VueUse composables at top level
vi.mock('@vueuse/core', () => ({
  useIntersectionObserver: (_target, callback) => {
    // Simulate initial non-intersecting state
    setTimeout(() => callback([{ isIntersecting: false }]), 0)
  },
  useMediaQuery: () => ref(false)
}))

// Mock useDeviceDetection - desktop by default
const mockIsMobile = ref(false)
const mockIsDesktop = ref(true)
const mockCleanup = vi.fn()

vi.mock('../useDeviceDetection', () => ({
  useDeviceDetection: () => ({
    isMobile: mockIsMobile,
    isDesktop: mockIsDesktop,
    cleanup: mockCleanup
  })
}))

describe('useAmbientAnimation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    // Reset to desktop state
    mockIsMobile.value = false
    mockIsDesktop.value = true
  })

  it('should initialize with paused state', () => {
    const { isPaused, isPlaying } = useAmbientAnimation()
    expect(isPaused.value).toBe(true)
    expect(isPlaying.value).toBe(false)
  })

  it('should have progress tracking', () => {
    const { progress } = useAmbientAnimation()
    expect(progress.value).toBe(0)
  })

  it('should detect reduced motion preference', () => {
    vi.doUnmock('@vueuse/core')
    vi.mock('@vueuse/core', () => ({
      useIntersectionObserver: (_target, callback) => {
        setTimeout(() => callback([{ isIntersecting: false }]), 0)
      },
      useMediaQuery: () => ref(true)
    }))

    const { isStatic } = useAmbientAnimation()
    expect(isStatic.value).toBe(true)
  })

  it('should track target element', () => {
    const { target } = useAmbientAnimation()
    expect(target).toBeDefined()
    expect(target.value).toBe(null)
  })

  it('should provide loop control functions', () => {
    const { startLoop, stopLoop } = useAmbientAnimation()
    expect(typeof startLoop).toBe('function')
    expect(typeof stopLoop).toBe('function')
  })

  it('should handle startLoop safely when static', () => {
    vi.doUnmock('@vueuse/core')
    vi.mock('@vueuse/core', () => ({
      useIntersectionObserver: (_target, callback) => {
        setTimeout(() => callback([{ isIntersecting: false }]), 0)
      },
      useMediaQuery: () => ref(true) // reduced motion enabled
    }))

    const { startLoop } = useAmbientAnimation()
    expect(() => startLoop()).not.toThrow()
  })

  describe('mobile adaptive parameters', () => {
    it('should use desktop defaults when isMobile is false', () => {
      const { adaptiveLoopDuration, adaptiveParticles, adaptiveUpdateInterval, isMobile } = useAmbientAnimation()
      
      expect(isMobile.value).toBe(false)
      expect(adaptiveLoopDuration.value).toBe(45000)
      expect(adaptiveParticles.value).toBe(50)
      expect(adaptiveUpdateInterval.value).toBe(16)
    })

    it('should use mobile-specific parameters when isMobile is true', () => {
      // Switch to mobile mode
      mockIsMobile.value = true
      mockIsDesktop.value = false

      const { adaptiveLoopDuration, adaptiveParticles, adaptiveUpdateInterval, isMobile } = useAmbientAnimation({
        mobileLoopDurationMs: 60000,
        mobileParticles: 20,
        mobileUpdateIntervalMs: 32
      })
      
      expect(isMobile.value).toBe(true)
      expect(adaptiveLoopDuration.value).toBe(60000)
      expect(adaptiveParticles.value).toBe(20)
      expect(adaptiveUpdateInterval.value).toBe(32)
    })

    it('should expose isMobile from device detection', () => {
      const { isMobile } = useAmbientAnimation()
      expect(isMobile).toBeDefined()
      expect(typeof isMobile.value).toBe('boolean')
    })

    it('should have custom mobile parameters override defaults', () => {
      // Switch to mobile mode
      mockIsMobile.value = true
      mockIsDesktop.value = false

      const { adaptiveParticles } = useAmbientAnimation({
        particles: 100,
        mobileParticles: 30
      })

      expect(adaptiveParticles.value).toBe(30)
    })
  })

  describe('throttling behavior', () => {
    it('should support throttling configuration', () => {
      const { startLoop, stopLoop } = useAmbientAnimation({
        enableThrottling: true
      })

      expect(() => startLoop()).not.toThrow()
      stopLoop()
    })

    it('should allow disabling throttling', () => {
      const { startLoop, stopLoop } = useAmbientAnimation({
        enableThrottling: false
      })

      expect(() => startLoop()).not.toThrow()
      stopLoop()
    })
  })
})
