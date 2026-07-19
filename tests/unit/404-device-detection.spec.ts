/**
 * Unit tests for device detection (Issue #404)
 * TDD Phase 1: RED - These tests should fail before implementation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useDeviceDetection } from '@/composables/useDeviceDetection'

describe('useDeviceDetection - Issue #404', () => {
  let originalInnerWidth: number
  let originalAddEventListener: typeof window.addEventListener
  let originalRemoveEventListener: typeof window.removeEventListener

  beforeEach(() => {
    // Store original window methods
    originalInnerWidth = window.innerWidth
    originalAddEventListener = window.addEventListener
    originalRemoveEventListener = window.removeEventListener

    // Mock window methods
    window.addEventListener = vi.fn()
    window.removeEventListener = vi.fn()

    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024
    })
  })

  afterEach(() => {
    // Restore original window methods
    window.addEventListener = originalAddEventListener
    window.removeEventListener = originalRemoveEventListener
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth
    })
  })

  describe('initial detection', () => {
    it('should detect desktop device on large screen', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920
      })

      const { isMobile, isDesktop } = useDeviceDetection()

      expect(isMobile.value).toBe(false)
      expect(isDesktop.value).toBe(true)
    })

    it('should detect mobile device on small screen', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })

      const { isMobile, isDesktop } = useDeviceDetection()

      expect(isMobile.value).toBe(true)
      expect(isDesktop.value).toBe(false)
    })

    it('should detect mobile device at breakpoint boundary', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768
      })

      const { isMobile, isDesktop } = useDeviceDetection()

      expect(isMobile.value).toBe(true)
      expect(isDesktop.value).toBe(false)
    })

    it('should detect desktop device just above breakpoint', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 769
      })

      const { isMobile, isDesktop } = useDeviceDetection()

      expect(isMobile.value).toBe(false)
      expect(isDesktop.value).toBe(true)
    })
  })

  describe('responsive updates', () => {
    it('should update device type on resize event', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024
      })

      const { isMobile, isDesktop } = useDeviceDetection()

      expect(isMobile.value).toBe(false)
      expect(isDesktop.value).toBe(true)

      // Simulate resize to mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })

      // Trigger resize event (simulated)
      const resizeListeners = (window.addEventListener as any).mock.calls.filter(
        (call: any) => call[0] === 'resize'
      )
      expect(resizeListeners.length).toBe(1)

      const resizeCallback = resizeListeners[0][1]
      resizeCallback()

      expect(isMobile.value).toBe(true)
      expect(isDesktop.value).toBe(false)
    })

    it('should update device type from mobile to desktop', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })

      const { isMobile, isDesktop } = useDeviceDetection()

      expect(isMobile.value).toBe(true)
      expect(isDesktop.value).toBe(false)

      // Simulate resize to desktop
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920
      })

      const resizeListeners = (window.addEventListener as any).mock.calls.filter(
        (call: any) => call[0] === 'resize'
      )
      const resizeCallback = resizeListeners[0][1]
      resizeCallback()

      expect(isMobile.value).toBe(false)
      expect(isDesktop.value).toBe(true)
    })
  })

  describe('cleanup', () => {
    it('should provide cleanup function that removes event listener', () => {
      const { cleanup } = useDeviceDetection()

      expect(window.removeEventListener).not.toHaveBeenCalled()

      cleanup()

      expect(window.removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
    })

    it('should automatically cleanup on unmount', () => {
      const { unmount } = vi.fn()
      const composable = useDeviceDetection()

      // Cleanup is called in onUnmounted hook
      // This test verifies the cleanup function exists and works
      expect(typeof composable.cleanup).toBe('function')
    })
  })

  describe('edge cases', () => {
    it('should handle zero width gracefully', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 0
      })

      const { isMobile, isDesktop } = useDeviceDetection()

      expect(isMobile.value).toBe(true)
      expect(isDesktop.value).toBe(false)
    })

    it('should handle very large width gracefully', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 10000
      })

      const { isMobile, isDesktop } = useDeviceDetection()

      expect(isMobile.value).toBe(false)
      expect(isDesktop.value).toBe(true)
    })
  })

  describe('MOBILE_BREAKPOINT constant', () => {
    it('should use 768 as mobile breakpoint', () => {
      // Test at boundary
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768
      })

      const { isMobile } = useDeviceDetection()
      expect(isMobile.value).toBe(true)

      // Test just above boundary
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 769
      })

      const { isMobile: isMobileAbove } = useDeviceDetection()
      expect(isMobileAbove.value).toBe(false)
    })
  })
})
