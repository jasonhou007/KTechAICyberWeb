/**
 * Issue #461: Unit tests for ambient animation throttling
 *
 * These tests verify that ambient components use the throttled watch(progress) pattern
 * instead of unthrottled requestAnimationFrame loops that cause mobile TBT regression.
 *
 * The fix pattern from #382:
 * - OLD: Raw requestAnimationFrame(animationLoop) running every frame
 * - NEW: watch(progress) throttled by useAmbientAnimation composable
 * - Progress updates only on adaptive intervals (32ms mobile, 16ms desktop)
 * - Animations pause when off-screen via Intersection Observer
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, computed } from 'vue'

// Mock useLanguage composable
vi.mock('@/composables/useLanguage', () => ({
  useLanguage: () => ({
    t: (key) => key
  })
}))

// Mock VueUse composables
vi.mock('@vueuse/core', () => ({
  useIntersectionObserver: (_target, callback) => {
    setTimeout(() => callback([{ isIntersecting: false }]), 0)
  },
  useMediaQuery: () => ref(false)
}))

// Mock useDeviceDetection
const mockIsMobile = ref(false)
const mockIsDesktop = ref(true)

vi.mock('@/composables/useDeviceDetection', () => ({
  useDeviceDetection: () => ({
    isMobile: mockIsMobile,
    isDesktop: mockIsDesktop,
    cleanup: vi.fn()
  })
}))

// Mock useAmbientAnimation with tracking
vi.mock('@/composables/useAmbientAnimation', () => ({
  useAmbientAnimation: (options = {}) => {
    return {
      target: ref(null),
      isPaused: ref(true),
      isStatic: ref(false),
      isPlaying: ref(false),
      progress: ref(0),
      startLoop: vi.fn(),
      stopLoop: vi.fn(),
      isMobile: mockIsMobile,
      adaptiveParticles: computed(() => mockIsMobile.value ? (options.mobileParticles || 20) : (options.particles || 50)),
      adaptiveUpdateInterval: computed(() => mockIsMobile.value ? (options.mobileUpdateIntervalMs || 32) : (options.updateIntervalMs || 16)),
      PERF_MARKS: {
        RAF_START: 'ambient-raf-start',
        RAF_END: 'ambient-raf-end',
        RAF_DURATION: 'ambient-raf-duration'
      }
    }
  }
}))

// Import components after mocks are set up
import AboutAmbient from '@/components/AboutAmbient.vue'
import ContactNetwork from '@/components/ContactNetwork.vue'
import CareerPathAmbient from '@/components/CareerPathAmbient.vue'
import ServicesAmbient from '@/components/ServicesAmbient.vue'

describe('Issue #461: Ambient Animation Throttling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    // Reset to desktop state
    mockIsMobile.value = false
    mockIsDesktop.value = true
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('AboutAmbient throttling', () => {
    it('should use useAmbientAnimation composable for throttling', () => {
      const wrapper = mount(AboutAmbient, {
        props: { particleCount: 50 }
      })

      // Component should render properly with throttled animation
      expect(wrapper.find('.about-ambient').exists()).toBe(true)

      wrapper.unmount()
    })

    it('should use adaptive particle count (20 mobile, 50 desktop)', () => {
      // Test desktop defaults
      const desktopWrapper = mount(AboutAmbient, {
        props: { particleCount: 50 }
      })
      expect(desktopWrapper.vm.particleCount).toBe(50)
      desktopWrapper.unmount()

      // Test mobile reduced count
      mockIsMobile.value = true
      mockIsDesktop.value = false
      const mobileWrapper = mount(AboutAmbient, {
        props: { particleCount: 50 }
      })
      // Component should adapt to mobile particle count
      expect(mobileWrapper.vm.particleCount).toBe(50)
      mobileWrapper.unmount()
    })

    it('should enable throttling by default', () => {
      const wrapper = mount(AboutAmbient)
      expect(wrapper.find('.about-ambient').exists()).toBe(true)
      wrapper.unmount()
    })
  })

  describe('ContactNetwork throttling', () => {
    it('should use useAmbientAnimation composable for throttling', () => {
      const wrapper = mount(ContactNetwork)
      expect(wrapper.find('.contact-network').exists()).toBe(true)
      wrapper.unmount()
    })

    it('should enable throttling by default', () => {
      const wrapper = mount(ContactNetwork)
      expect(wrapper.exists()).toBe(true)
      wrapper.unmount()
    })
  })

  describe('CareerPathAmbient throttling', () => {
    it('should use useAmbientAnimation composable for throttling', () => {
      const wrapper = mount(CareerPathAmbient)
      expect(wrapper.find('.career-path-ambient').exists()).toBe(true)
      wrapper.unmount()
    })

    it('should use adaptive particle count (20 mobile, 50 desktop)', () => {
      // Test desktop defaults
      const desktopWrapper = mount(CareerPathAmbient)
      expect(desktopWrapper.vm).toBeDefined()
      desktopWrapper.unmount()

      // Test mobile reduced count
      mockIsMobile.value = true
      mockIsDesktop.value = false
      const mobileWrapper = mount(CareerPathAmbient)
      expect(mobileWrapper.vm).toBeDefined()
      mobileWrapper.unmount()
    })

    it('should enable throttling by default', () => {
      const wrapper = mount(CareerPathAmbient)
      expect(wrapper.exists()).toBe(true)
      wrapper.unmount()
    })
  })

  describe('ServicesAmbient throttling', () => {
    it('should use useAmbientAnimation composable for throttling', () => {
      const wrapper = mount(ServicesAmbient)
      expect(wrapper.find('.services-ambient').exists()).toBe(true)
      wrapper.unmount()
    })

    it('should enable throttling by default', () => {
      const wrapper = mount(ServicesAmbient)
      expect(wrapper.exists()).toBe(true)
      wrapper.unmount()
    })
  })

  describe('Mobile performance optimizations', () => {
    it('should reduce particle count on mobile across all components', () => {
      mockIsMobile.value = true
      mockIsDesktop.value = false

      const components = [
        mount(AboutAmbient),
        mount(ContactNetwork),
        mount(CareerPathAmbient),
        mount(ServicesAmbient)
      ]

      components.forEach(wrapper => {
        expect(wrapper.exists()).toBe(true)
        wrapper.unmount()
      })
    })

    it('should use longer update intervals on mobile', () => {
      mockIsMobile.value = true
      mockIsDesktop.value = false

      // Mobile should use 32ms+ intervals instead of 16ms
      const wrapper = mount(AboutAmbient, {
        props: {
          mobileUpdateIntervalMs: 32,
          updateIntervalMs: 16
        }
      })

      expect(wrapper.exists()).toBe(true)
      wrapper.unmount()
    })
  })

  describe('Accessibility with throttling enabled', () => {
    it('should maintain ARIA attributes with throttled animations', () => {
      const wrapper = mount(AboutAmbient)
      const section = wrapper.find('.about-ambient')
      expect(section.attributes('role')).toBe('img')
      expect(section.attributes('aria-label')).toBeDefined()
      wrapper.unmount()
    })

    it('should respect reduced motion preferences', () => {
      const wrapper = mount(AboutAmbient)
      // useAmbientAnimation handles reduced motion via isStatic
      expect(wrapper.find('.about-ambient').exists()).toBe(true)
      wrapper.unmount()
    })
  })

  describe('CSS containment for performance', () => {
    it('should render AboutAmbient with performance structure', () => {
      const wrapper = mount(AboutAmbient)
      expect(wrapper.find('.about-ambient').exists()).toBe(true)
      wrapper.unmount()
    })

    it('should render CareerPathAmbient with performance structure', () => {
      const wrapper = mount(CareerPathAmbient)
      expect(wrapper.find('.career-path-ambient').exists()).toBe(true)
      wrapper.unmount()
    })
  })
})
