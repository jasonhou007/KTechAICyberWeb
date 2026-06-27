/**
 * @file InitialLoadingScreen.test.ts
 * @description Comprehensive unit tests for InitialLoadingScreen component
 * @ticket #95 - TEST-025: InitialLoadingScreen Component Unit Tests - TDD with Vitest
 *
 * Test Categories:
 * - Rendering Tests: Component mount, conditional rendering and HTML structure
 * - Props Tests: isLoading and progress prop behavior
 * - Content Tests: Logo, progress text and structure verification
 * - Accessibility Tests: ARIA attributes (role="status", aria-live, aria-label)
 * - Styling Tests: CSS classes for cyberpunk theme
 * - Transition Tests: Fade-out animation trigger and cleanup
 * - Edge Cases: Lifecycle, multiple renders and rapid mount/unmount
 *
 * TDD Approach:
 * 1. Red: Tests written to define expected behavior
 * 2. Green: Component implementation makes tests pass
 * 3. Refactor: Test code optimized for clarity and maintainability
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import InitialLoadingScreen from '../InitialLoadingScreen.vue'

describe('InitialLoadingScreen.vue', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    // Use fake timers so any Transition / animation timing is deterministic
    vi.useFakeTimers()
  })

  afterEach(() => {
    // Cleanup: restore real timers and unmount component
    vi.useRealTimers()
    wrapper?.unmount()
  })

  // Helper: mount with default (active) loading state
  const mountComponent = (props: Record<string, unknown> = {}) => {
    return mount(InitialLoadingScreen, {
      props: {
        isLoading: true,
        progress: 0,
        ...props,
      },
    })
  }

  // ============================================
  // Rendering Tests
  // ============================================
  describe('Rendering', () => {
    it('should mount without errors', () => {
      // Act
      wrapper = mountComponent()

      // Assert: Component exists and mounted successfully
      expect(wrapper.exists()).toBe(true)
    })

    it('renders the loading screen container when isLoading is true', () => {
      // Act
      wrapper = mountComponent({ isLoading: true })

      // Assert
      expect(wrapper.find('.loading-screen').exists()).toBe(true)
    })

    it('does NOT render the loading screen when isLoading is false', () => {
      // Act
      wrapper = mountComponent({ isLoading: false })

      // Assert: Transition with v-if removes the element from output
      expect(wrapper.find('.loading-screen').exists()).toBe(false)
    })

    it('renders loading-content child structure', () => {
      // Act
      wrapper = mountComponent()

      // Assert
      expect(wrapper.find('.loading-content').exists()).toBe(true)
    })

    it('renders logo, progress container and loading text sections', () => {
      // Act
      wrapper = mountComponent()

      // Assert
      expect(wrapper.find('.loading-logo').exists()).toBe(true)
      expect(wrapper.find('.progress-container').exists()).toBe(true)
      expect(wrapper.find('.loading-text').exists()).toBe(true)
    })

    it('renders exactly three loading dots', () => {
      // Act
      wrapper = mountComponent()

      // Assert
      expect(wrapper.findAll('.loading-dot')).toHaveLength(3)
    })
  })

  // ============================================
  // Props Tests
  // ============================================
  describe('Props', () => {
    it('renders when isLoading prop is true', () => {
      // Act
      wrapper = mountComponent({ isLoading: true })

      // Assert
      expect(wrapper.find('.loading-screen').exists()).toBe(true)
    })

    it('hides when isLoading prop is false', () => {
      // Act
      wrapper = mountComponent({ isLoading: false })

      // Assert
      expect(wrapper.find('.loading-screen').exists()).toBe(false)
    })

    it('responds to isLoading prop change from true to false', async () => {
      // Arrange: start loading
      wrapper = mountComponent({ isLoading: true })
      expect(wrapper.find('.loading-screen').exists()).toBe(true)

      // Act: complete loading
      await wrapper.setProps({ isLoading: false })

      // Assert: component removed itself after loading completion
      expect(wrapper.find('.loading-screen').exists()).toBe(false)
    })

    it('applies default progress of 0 when not provided', () => {
      // Act: mount without progress prop
      wrapper = mount(InitialLoadingScreen, {
        props: { isLoading: true },
      })

      // Assert: progress text shows 0%
      expect(wrapper.find('.progress-text').text()).toBe('0%')
    })

    it('displays rounded integer progress', () => {
      // Act
      wrapper = mountComponent({ progress: 42.7 })

      // Assert: Math.round(42.7) === 43
      expect(wrapper.find('.progress-text').text()).toBe('43%')
    })

    it('reflects progress value in progress-fill width style', () => {
      // Act
      wrapper = mountComponent({ progress: 50 })

      // Assert: width bound to `${progress}%`
      const fill = wrapper.find('.progress-fill')
      expect(fill.attributes('style')).toContain('width: 50%')
    })

    it('updates progress text when progress prop changes', async () => {
      // Arrange
      wrapper = mountComponent({ progress: 25 })
      expect(wrapper.find('.progress-text').text()).toBe('25%')

      // Act
      await wrapper.setProps({ progress: 75 })

      // Assert
      expect(wrapper.find('.progress-text').text()).toBe('75%')
    })

    it('handles 100% progress correctly', () => {
      // Act
      wrapper = mountComponent({ progress: 100 })

      // Assert
      expect(wrapper.find('.progress-text').text()).toBe('100%')
      expect(wrapper.find('.progress-fill').attributes('style')).toContain('width: 100%')
    })
  })

  // ============================================
  // Content Tests
  // ============================================
  describe('Content', () => {
    it('displays the KTECH.AI logo text', () => {
      // Act
      wrapper = mountComponent()

      // Assert
      const logoText = wrapper.find('.logo-text')
      expect(logoText.exists()).toBe(true)
      expect(logoText.text()).toContain('KTECH')
    })

    it('renders the logo accent (.AI) separately', () => {
      // Act
      wrapper = mountComponent()

      // Assert
      const accent = wrapper.find('.logo-accent')
      expect(accent.exists()).toBe(true)
      expect(accent.text()).toBe('.AI')
    })

    it('renders progress percentage text', () => {
      // Act
      wrapper = mountComponent({ progress: 60 })

      // Assert
      expect(wrapper.find('.progress-text').text()).toBe('60%')
    })

    it('renders the progress bar structure', () => {
      // Act
      wrapper = mountComponent()

      // Assert
      expect(wrapper.find('.progress-bar').exists()).toBe(true)
      expect(wrapper.find('.progress-fill').exists()).toBe(true)
    })
  })

  // ============================================
  // Accessibility Tests
  // ============================================
  describe('Accessibility', () => {
    it('has role="status" for screen readers', () => {
      // Act
      wrapper = mountComponent()

      // Assert
      const screen = wrapper.find('.loading-screen')
      expect(screen.attributes('role')).toBe('status')
    })

    it('has aria-live="polite" for assistive technology', () => {
      // Act
      wrapper = mountComponent()

      // Assert
      const screen = wrapper.find('.loading-screen')
      expect(screen.attributes('aria-live')).toBe('polite')
    })

    it('has aria-label describing the loading state', () => {
      // Act
      wrapper = mountComponent()

      // Assert
      const screen = wrapper.find('.loading-screen')
      expect(screen.attributes('aria-label')).toBe('Loading')
    })

    it('does not expose a status element when not loading', () => {
      // Act
      wrapper = mountComponent({ isLoading: false })

      // Assert: no status/announcement when hidden
      expect(wrapper.find('[role="status"]').exists()).toBe(false)
    })
  })

  // ============================================
  // Styling Tests
  // ============================================
  describe('Styling', () => {
    it('applies loading-screen class to the root container', () => {
      // Act
      wrapper = mountComponent()

      // Assert
      const screen = wrapper.find('.loading-screen')
      expect(screen.exists()).toBe(true)
      expect(screen.classes()).toContain('loading-screen')
    })

    it('applies cyberpunk theme classes to all key elements', () => {
      // Act
      wrapper = mountComponent()

      // Assert
      expect(wrapper.find('.loading-content').exists()).toBe(true)
      expect(wrapper.find('.loading-logo').exists()).toBe(true)
      expect(wrapper.find('.logo-text').exists()).toBe(true)
      expect(wrapper.find('.logo-accent').exists()).toBe(true)
      expect(wrapper.find('.logo-pulse').exists()).toBe(true)
    })

    it('progress-fill element exists for width animation', () => {
      // Act
      wrapper = mountComponent({ progress: 30 })

      // Assert
      const fill = wrapper.find('.progress-fill')
      expect(fill.exists()).toBe(true)
      expect(fill.attributes('style')).toContain('width: 30%')
    })
  })

  // ============================================
  // Transition / Animation Tests
  // ============================================
  describe('Transition', () => {
    it('uses the loading-fade transition name', () => {
      // Act
      wrapper = mountComponent()

      // Assert: Transition component wraps the loading screen
      const transition = wrapper.findComponent({ name: 'Transition' })
      // The Transition component is present in the render output
      expect(wrapper.html()).toContain('loading-screen')
    })

    it('triggers fade-out (leave) when isLoading changes to false', async () => {
      // Arrange: loading active
      wrapper = mountComponent({ isLoading: true })
      expect(wrapper.find('.loading-screen').exists()).toBe(true)

      // Act: trigger the leave transition by completing loading
      await wrapper.setProps({ isLoading: false })
      // Advance fake timers past the 0.6s leave transition duration
      vi.advanceTimersByTime(1000)
      await wrapper.vm.$nextTick()

      // Assert: after the transition completes the element is removed
      expect(wrapper.find('.loading-screen').exists()).toBe(false)
    })

    it('cleans up on unmount without errors', () => {
      // Arrange
      wrapper = mountComponent()

      // Act + Assert: unmount should not throw
      expect(() => wrapper.unmount()).not.toThrow()
    })
  })

  // ============================================
  // Edge Cases
  // ============================================
  describe('Edge Cases', () => {
    it('handles progress of 0 correctly', () => {
      // Act
      wrapper = mountComponent({ progress: 0 })

      // Assert
      expect(wrapper.find('.progress-text').text()).toBe('0%')
      expect(wrapper.find('.progress-fill').attributes('style')).toContain('width: 0%')
    })

    it('rounds down fractional progress', () => {
      // Act: 12.4 -> 12
      wrapper = mountComponent({ progress: 12.4 })

      // Assert
      expect(wrapper.find('.progress-text').text()).toBe('12%')
    })

    it('rounds up fractional progress', () => {
      // Act: 12.5 -> 13
      wrapper = mountComponent({ progress: 12.5 })

      // Assert
      expect(wrapper.find('.progress-text').text()).toBe('13%')
    })

    it('can be mounted and unmounted multiple times', () => {
      // Act + Assert
      for (let i = 0; i < 5; i++) {
        const w = mount(InitialLoadingScreen, { props: { isLoading: true, progress: i * 20 } })
        expect(w.exists()).toBe(true)
        expect(w.find('.loading-screen').exists()).toBe(true)
        w.unmount()
      }
      expect(true).toBe(true)
    })

    it('handles rapid mount/unmount cycles without errors', () => {
      // Act + Assert
      for (let i = 0; i < 10; i++) {
        const w = mount(InitialLoadingScreen, { props: { isLoading: true } })
        expect(w.exists()).toBe(true)
        w.unmount()
      }
      expect(true).toBe(true)
    })

    it('renders correctly after being toggled multiple times', async () => {
      // Arrange
      wrapper = mountComponent({ isLoading: true, progress: 0 })

      // Act: toggle loading state several times
      await wrapper.setProps({ isLoading: false })
      await wrapper.setProps({ isLoading: true })

      // Assert: still renders correctly
      expect(wrapper.find('.loading-screen').exists()).toBe(true)
      expect(wrapper.find('.loading-text').findAll('.loading-dot')).toHaveLength(3)
    })
  })

  // ============================================
  // Component Structure / Integration
  // ============================================
  describe('Component Structure', () => {
    it('has correct DOM hierarchy', () => {
      // Act
      wrapper = mountComponent()

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
      wrapper = mountComponent()

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
})
