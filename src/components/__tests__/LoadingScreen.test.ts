/**
 * @file LoadingScreen.test.ts
 * @description Comprehensive unit tests for LoadingScreen component
 * @ticket #96 - TEST-026: LoadingScreen Component Unit Tests - TDD with Vitest
 *
 * Test Categories:
 * - Rendering Tests: Component mount, conditional rendering and HTML structure
 * - Progress Bar Tests: Initial state, incremental updates, width binding and text
 * - Animation Tests: Logo pulse, loading dots and fade-out transition trigger
 * - Accessibility Tests: ARIA attributes (role="status", aria-live, aria-label)
 * - State Management Tests: isLoading ref lifecycle driven by internal timers
 * - Edge Cases: Lifecycle, cleanup on unmount and rapid mount/unmount cycles
 *
 * Component Notes:
 * LoadingScreen manages its OWN state (isLoading + progress refs) and drives the
 * progress bar via setInterval inside onMounted. There are no props. The progress
 * runs 0% -> 100% over ~2s (20ms interval, 100 ticks), then a 600ms setTimeout
 * flips isLoading to false, triggering the loading-fade leave transition.
 *
 * TDD Approach:
 * 1. Red: Tests written to define expected behavior
 * 2. Green: Component implementation makes tests pass
 * 3. Refactor: Test code optimized for clarity and maintainability
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper, flushPromises } from '@vue/test-utils'
import LoadingScreen from '../LoadingScreen.vue'

describe('LoadingScreen.vue', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    // Use fake timers so the internal setInterval / setTimeout progress logic is deterministic
    vi.useFakeTimers()
  })

  afterEach(() => {
    // Cleanup: restore real timers and unmount component
    vi.useRealTimers()
    wrapper?.unmount()
  })

  // Helper: advance timers and flush the Vue render queue
  const advance = async (ms: number) => {
    vi.advanceTimersByTime(ms)
    await flushPromises()
  }

  // ============================================
  // Rendering Tests
  // ============================================
  describe('Rendering', () => {
    it('should mount without errors', () => {
      // Act
      wrapper = mount(LoadingScreen)

      // Assert: Component exists and mounted successfully
      expect(wrapper.exists()).toBe(true)
    })

    it('renders the loading screen container on mount', () => {
      // Act
      wrapper = mount(LoadingScreen)

      // Assert: isLoading is true initially so the container is rendered
      expect(wrapper.find('.loading-screen').exists()).toBe(true)
    })

    it('renders the loading-content child structure', () => {
      // Act
      wrapper = mount(LoadingScreen)

      // Assert
      expect(wrapper.find('.loading-content').exists()).toBe(true)
    })

    it('renders logo, progress container and loading text sections', () => {
      // Act
      wrapper = mount(LoadingScreen)

      // Assert
      expect(wrapper.find('.loading-logo').exists()).toBe(true)
      expect(wrapper.find('.progress-container').exists()).toBe(true)
      expect(wrapper.find('.loading-text').exists()).toBe(true)
    })

    it('renders exactly three loading dots', () => {
      // Act
      wrapper = mount(LoadingScreen)

      // Assert
      expect(wrapper.findAll('.loading-dot')).toHaveLength(3)
    })

    it('progress container is visible on initial render', () => {
      // Act
      wrapper = mount(LoadingScreen)

      // Assert: progress-container is present and rendered in the DOM
      const container = wrapper.find('.progress-container')
      expect(container.exists()).toBe(true)
    })
  })

  // ============================================
  // Progress Bar Tests
  // ============================================
  describe('Progress Bar', () => {
    it('starts at 0% progress', () => {
      // Act: mount and immediately inspect before any tick fires
      wrapper = mount(LoadingScreen)

      // Assert: progress text and fill width both reflect 0%
      expect(wrapper.find('.progress-text').text()).toBe('0%')
      expect(wrapper.find('.progress-fill').attributes('style')).toContain('width: 0%')
    })

    it('binds progress value to the progress-fill width style', () => {
      // Act
      wrapper = mount(LoadingScreen)

      // Assert: the inline style template is `${progress}%`
      const fill = wrapper.find('.progress-fill')
      expect(fill.exists()).toBe(true)
      expect(fill.attributes('style')).toMatch(/width:\s*0%/)
    })

    it('updates progress during loading (advances past 0%)', async () => {
      // Act
      wrapper = mount(LoadingScreen)
      // Advance several 20ms ticks so progress increments
      await advance(100)

      // Assert: progress is no longer 0% — it has advanced through the interval
      const text = wrapper.find('.progress-text').text()
      const width = wrapper.find('.progress-fill').attributes('style') || ''
      expect(text).not.toBe('0%')
      expect(width).not.toContain('width: 0%')
    })

    it('reaches 100% after the full duration elapses', async () => {
      // Act: 100 intervals of 20ms = 2000ms completes the progress run
      wrapper = mount(LoadingScreen)
      await advance(2000)

      // Assert: progress clamps to 100% and the text reflects it
      expect(wrapper.find('.progress-text').text()).toBe('100%')
      expect(wrapper.find('.progress-fill').attributes('style')).toContain('width: 100%')
    })

    it('rounds the progress percentage for display', async () => {
      // Act: one 20ms tick -> increment = 100 / (2000 / 20) = 1 -> 1%
      wrapper = mount(LoadingScreen)
      await advance(20)

      // Assert: text uses Math.round() producing an integer percentage
      const text = wrapper.find('.progress-text').text()
      expect(text).toMatch(/^\d+%$/)
      expect(text).toBe('1%')
    })

    it('clamps progress to 100% and does not overshoot', async () => {
      // Act: advance past the 2000ms run but before the 600ms fade removes the element.
      // Each interval adds increment = 1, so by 2100ms the running total (105) is
      // clamped by the component's `if (progress >= 100)` guard to exactly 100.
      wrapper = mount(LoadingScreen)
      await advance(2100)

      // Assert: progress never exceeds 100%
      expect(wrapper.find('.progress-text').text()).toBe('100%')
      expect(wrapper.find('.progress-fill').attributes('style')).toContain('width: 100%')
    })
  })

  // ============================================
  // Animation Tests
  // ============================================
  describe('Animation', () => {
    it('renders the logo pulse element', () => {
      // Act
      wrapper = mount(LoadingScreen)

      // Assert: logo-pulse ring is present (drives the pulse animation)
      expect(wrapper.find('.logo-pulse').exists()).toBe(true)
    })

    it('renders the logo accent with neon pulse styling class', () => {
      // Act
      wrapper = mount(LoadingScreen)

      // Assert: .logo-accent carries the neonPulse animation class
      const accent = wrapper.find('.logo-accent')
      expect(accent.exists()).toBe(true)
      expect(accent.classes()).toContain('logo-accent')
    })

    it('renders three loading-dot elements for the dots animation', () => {
      // Act
      wrapper = mount(LoadingScreen)

      // Assert: the loading-text group contains exactly 3 animated dots
      const dots = wrapper.find('.loading-text').findAll('.loading-dot')
      expect(dots).toHaveLength(3)
    })

    it('triggers the fade-out transition after progress completes', async () => {
      // Arrange: loading screen is visible
      wrapper = mount(LoadingScreen)
      expect(wrapper.find('.loading-screen').exists()).toBe(true)

      // Act: run the full progress (2000ms) then the 600ms post-completion delay
      await advance(2000)
      await advance(600)

      // Assert: isLoading flipped to false, the element is removed via the leave transition
      expect(wrapper.find('.loading-screen').exists()).toBe(false)
    })

    it('cleans up on unmount without errors', () => {
      // Arrange
      wrapper = mount(LoadingScreen)

      // Act + Assert: unmount should not throw even though timers are running
      expect(() => wrapper.unmount()).not.toThrow()
    })
  })

  // ============================================
  // Accessibility Tests
  // ============================================
  describe('Accessibility', () => {
    it('sets role="status" on the loading screen', () => {
      // Act
      wrapper = mount(LoadingScreen)

      // Assert
      expect(wrapper.find('.loading-screen').attributes('role')).toBe('status')
    })

    it('sets aria-live="polite" for assistive technology', () => {
      // Act
      wrapper = mount(LoadingScreen)

      // Assert
      expect(wrapper.find('.loading-screen').attributes('aria-live')).toBe('polite')
    })

    it('sets aria-label="Loading"', () => {
      // Act
      wrapper = mount(LoadingScreen)

      // Assert
      expect(wrapper.find('.loading-screen').attributes('aria-label')).toBe('Loading')
    })

    it('does not expose a status element after loading completes', async () => {
      // Act
      wrapper = mount(LoadingScreen)
      await advance(2600)

      // Assert: once loading is done, no status announcement element remains
      expect(wrapper.find('[role="status"]').exists()).toBe(false)
    })
  })

  // ============================================
  // State Management Tests
  // ============================================
  describe('State Management', () => {
    it('isLoading is true on initial render', () => {
      // Act
      wrapper = mount(LoadingScreen)

      // Assert: the v-if container is rendered, so isLoading is true
      expect(wrapper.find('.loading-screen').exists()).toBe(true)
    })

    it('isLoading transitions to false after the loading duration', async () => {
      // Arrange
      wrapper = mount(LoadingScreen)

      // Act: progress completes (2000ms) + 600ms fade delay
      await advance(2000)
      await advance(600)

      // Assert: isLoading is false and the component has disappeared
      expect(wrapper.find('.loading-screen').exists()).toBe(false)
    })

    it('keeps the component visible while progress runs', async () => {
      // Act
      wrapper = mount(LoadingScreen)
      // Halfway through the progress run
      await advance(1000)

      // Assert: still loading, still visible
      expect(wrapper.find('.loading-screen').exists()).toBe(true)
    })

    it('component disappears when isLoading becomes false', async () => {
      // Arrange
      wrapper = mount(LoadingScreen)
      expect(wrapper.find('.loading-screen').exists()).toBe(true)

      // Act: complete the full loading lifecycle
      await advance(2600)

      // Assert: the loading screen is gone from the DOM
      expect(wrapper.find('.loading-screen').exists()).toBe(false)
    })
  })

  // ============================================
  // Content Tests
  // ============================================
  describe('Content', () => {
    it('displays the KTECH.AI logo text', () => {
      // Act
      wrapper = mount(LoadingScreen)

      // Assert
      const logoText = wrapper.find('.logo-text')
      expect(logoText.exists()).toBe(true)
      expect(logoText.text()).toContain('KTECH')
    })

    it('renders the logo accent (.AI) separately', () => {
      // Act
      wrapper = mount(LoadingScreen)

      // Assert
      const accent = wrapper.find('.logo-accent')
      expect(accent.exists()).toBe(true)
      expect(accent.text()).toBe('.AI')
    })

    it('renders the progress bar structure', () => {
      // Act
      wrapper = mount(LoadingScreen)

      // Assert
      expect(wrapper.find('.progress-bar').exists()).toBe(true)
      expect(wrapper.find('.progress-fill').exists()).toBe(true)
    })
  })

  // ============================================
  // Component Structure / Integration
  // ============================================
  describe('Component Structure', () => {
    it('has correct DOM hierarchy', () => {
      // Act
      wrapper = mount(LoadingScreen)

      // Assert: loading-content is a child of loading-screen
      const screen = wrapper.find('.loading-screen')
      const content = screen.find('.loading-content')
      expect(content.exists()).toBe(true)

      // And loading-content contains the three sections
      expect(content.find('.loading-logo').exists()).toBe(true)
      expect(content.find('.progress-container').exists()).toBe(true)
      expect(content.find('.loading-text').exists()).toBe(true)
    })

    it('renders complete loading screen HTML', () => {
      // Act
      wrapper = mount(LoadingScreen)

      // Assert: all key elements present in output
      const html = wrapper.html()
      expect(html).toContain('loading-screen')
      expect(html).toContain('KTECH')
      expect(html).toContain('.AI')
      expect(html).toContain('progress-bar')
      expect(html).toContain('progress-text')
      expect(html).toContain('loading-dot')
    })
  })

  // ============================================
  // Edge Cases
  // ============================================
  describe('Edge Cases', () => {
    it('can be mounted and unmounted multiple times', () => {
      // Act + Assert
      for (let i = 0; i < 5; i++) {
        const w = mount(LoadingScreen)
        expect(w.exists()).toBe(true)
        expect(w.find('.loading-screen').exists()).toBe(true)
        w.unmount()
      }
      expect(true).toBe(true)
    })

    it('handles rapid mount/unmount cycles without errors', () => {
      // Act + Assert
      for (let i = 0; i < 10; i++) {
        const w = mount(LoadingScreen)
        expect(w.exists()).toBe(true)
        w.unmount()
      }
      expect(true).toBe(true)
    })

    it('unmounts cleanly before the loading duration completes', async () => {
      // Arrange: start loading and advance partway
      wrapper = mount(LoadingScreen)
      await advance(500)

      // Act + Assert: unmount mid-progress must not throw
      expect(() => wrapper.unmount()).not.toThrow()
    })
  })
})
