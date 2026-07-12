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

describe('useAmbientAnimation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
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
})
