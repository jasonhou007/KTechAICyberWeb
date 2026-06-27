/**
 * @file FadeIn.test.ts
 * @description Comprehensive unit tests for FadeIn component
 * @ticket #97 - TEST-027: FadeIn Component Unit Tests - TDD with Vitest
 *
 * Test Categories:
 * - Rendering Tests: Component mount, slot content, CSS classes, initial state
 * - IntersectionObserver Tests: Observer creation, observation, disconnect, threshold
 * - Animation Trigger Tests: Intersection callback, isVisible state, unobserve after trigger
 * - Multiple Children Tests: Slot content, nested FadeIn, styling hooks
 * - Edge Cases Tests: Empty slot, rapid mount/unmount, custom threshold values
 *
 * TDD Approach:
 * 1. Red: Tests written to define expected behavior
 * 2. Green: Component implementation makes tests pass
 * 3. Refactor: Test code optimized for clarity and maintainability
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { h, defineComponent } from 'vue'
import FadeIn from '../FadeIn.vue'

/**
 * Minimal IntersectionObserver mock.
 *
 * Captures the callback and the options (threshold/rootMargin) passed to the
 * constructor, records observed elements, and exposes a `trigger` helper that
 * invokes the callback so tests can deterministically simulate an intersection.
 */
class IntersectionObserverMock {
  static lastInstance: IntersectionObserverMock | null = null
  static instances: IntersectionObserverMock[] = []

  callback: IntersectionObserverCallback
  options: IntersectionObserverInit
  observed: Element[] = []
  unobserved: Element[] = []
  disconnected = false

  constructor(
    callback: IntersectionObserverCallback,
    options: IntersectionObserverInit = {},
  ) {
    this.callback = callback
    this.options = options
    IntersectionObserverMock.instances.push(this)
    IntersectionObserverMock.lastInstance = this
  }

  observe(target: Element) {
    this.observed.push(target)
  }

  unobserve(target: Element) {
    this.unobserved.push(target)
  }

  disconnect() {
    this.disconnected = true
  }

  /** Simulate the browser firing an intersection event for a target. */
  trigger(target: Element, isIntersecting = true) {
    this.callback(
      [{ isIntersecting, target } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    )
  }
}

describe('FadeIn.vue', () => {
  let wrapper: VueWrapper
  let savedObserver: typeof global.IntersectionObserver | undefined

  beforeEach(() => {
    // Arrange: Install a fresh global IntersectionObserver mock and reset
    // the recorded instances so each test starts from a clean slate.
    IntersectionObserverMock.instances = []
    IntersectionObserverMock.lastInstance = null
    savedObserver = global.IntersectionObserver
    global.IntersectionObserver =
      IntersectionObserverMock as unknown as typeof global.IntersectionObserver
  })

  afterEach(() => {
    // Cleanup: Restore the original global and unmount the component.
    global.IntersectionObserver = savedObserver
    if (wrapper) {
      wrapper.unmount()
    }
  })

  // ============================================
  // Rendering Tests
  // ============================================
  describe('Rendering', () => {
    it('should mount without errors', () => {
      // Act: Mount the component
      wrapper = mount(FadeIn)

      // Assert: Component exists and mounted successfully
      expect(wrapper.exists()).toBe(true)
    })

    it('renders slot content correctly', () => {
      // Arrange: Provide slot content
      wrapper = mount(FadeIn, {
        slots: {
          default: '<p class="slot-content">Hello FadeIn</p>',
        },
      })

      // Assert: Slot content is rendered
      expect(wrapper.find('.slot-content').exists()).toBe(true)
      expect(wrapper.text()).toContain('Hello FadeIn')
    })

    it('applies the .fade-in CSS class', () => {
      // Act: Mount and locate the root element
      wrapper = mount(FadeIn)
      const root = wrapper.find('.fade-in')

      // Assert: The fade-in class is present
      expect(root.exists()).toBe(true)
      expect(wrapper.classes()).toContain('fade-in')
    })

    it('starts with isVisible set to false (no .visible class)', () => {
      // Act: Mount the component
      wrapper = mount(FadeIn)

      // Assert: Initial state is hidden — no visible class yet
      expect(wrapper.classes()).not.toContain('visible')
    })
  })

  // ============================================
  // IntersectionObserver Tests
  // ============================================
  describe('IntersectionObserver', () => {
    it('creates an observer on mount', () => {
      // Act: Mount the component
      wrapper = mount(FadeIn)

      // Assert: An IntersectionObserver was instantiated
      expect(IntersectionObserverMock.instances.length).toBeGreaterThanOrEqual(1)
    })

    it('observes the target element on mount', () => {
      // Act: Mount the component
      wrapper = mount(FadeIn)
      const observer = IntersectionObserverMock.lastInstance!

      // Assert: The root element was observed
      expect(observer.observed.length).toBe(1)
      expect(observer.observed[0]).toBe(wrapper.element)
    })

    it('disconnects the observer on unmount', async () => {
      // Arrange: Mount the component
      wrapper = mount(FadeIn)
      const observer = IntersectionObserverMock.lastInstance!

      // Act: Unmount the component
      wrapper.unmount()

      // Assert: disconnect() was called
      expect(observer.disconnected).toBe(true)
    })

    it('passes the default threshold (0.1) to the observer', () => {
      // Act: Mount with default props
      wrapper = mount(FadeIn)
      const observer = IntersectionObserverMock.lastInstance!

      // Assert: Default threshold is 0.1
      expect(observer.options.threshold).toBe(0.1)
    })
  })

  // ============================================
  // Animation Trigger Tests
  // ============================================
  describe('Animation Trigger', () => {
    it('triggers animation when the element intersects', async () => {
      // Arrange: Mount the component
      wrapper = mount(FadeIn)
      const observer = IntersectionObserverMock.lastInstance!

      // Act: Simulate intersection
      observer.trigger(wrapper.element, true)
      await wrapper.vm.$nextTick()

      // Assert: The visible class is applied
      expect(wrapper.classes()).toContain('visible')
    })

    it('sets isVisible to true on intersection', async () => {
      // Arrange: Mount the component
      wrapper = mount(FadeIn)

      // Assert: Initial state is false
      expect(wrapper.classes()).not.toContain('visible')

      // Act: Simulate intersection
      IntersectionObserverMock.lastInstance!.trigger(wrapper.element, true)
      await wrapper.vm.$nextTick()

      // Assert: isVisible becomes true (visible class applied)
      expect(wrapper.classes()).toContain('visible')
    })

    it('unobserves the target after the animation triggers', async () => {
      // Arrange: Mount the component
      wrapper = mount(FadeIn)
      const observer = IntersectionObserverMock.lastInstance!

      // Act: Simulate intersection
      observer.trigger(wrapper.element, true)
      await wrapper.vm.$nextTick()

      // Assert: The target was unobserved after triggering
      expect(observer.unobserved).toContain(wrapper.element)
    })

    it('does not trigger when element is not intersecting', async () => {
      // Arrange: Mount the component
      wrapper = mount(FadeIn)
      const observer = IntersectionObserverMock.lastInstance!

      // Act: Simulate a non-intersecting entry
      observer.trigger(wrapper.element, false)
      await wrapper.vm.$nextTick()

      // Assert: Animation does not trigger
      expect(wrapper.classes()).not.toContain('visible')
      expect(observer.unobserved.length).toBe(0)
    })

    it('stays visible after a second intersection event', async () => {
      // Arrange: Mount and trigger once
      wrapper = mount(FadeIn)
      const observer = IntersectionObserverMock.lastInstance!
      observer.trigger(wrapper.element, true)
      await wrapper.vm.$nextTick()

      // Act: Trigger a second intersection event
      observer.trigger(wrapper.element, true)
      await wrapper.vm.$nextTick()

      // Assert: isVisible remains true — once visible, it stays visible
      expect(wrapper.classes()).toContain('visible')
      // The target has been unobserved (at least once) after triggering
      expect(observer.unobserved).toContain(wrapper.element)
    })
  })

  // ============================================
  // Multiple Children Tests
  // ============================================
  describe('Multiple Children', () => {
    it('handles multiple child elements in the slot', () => {
      // Arrange: Provide multiple slot children
      wrapper = mount(FadeIn, {
        slots: {
          default:
            '<h2>Title</h2><p>Paragraph one</p><p>Paragraph two</p>',
        },
      })

      // Act: Find child elements
      const children = wrapper.findAll('.fade-in > *')

      // Assert: All children render inside the fade-in wrapper
      expect(children.length).toBe(3)
      expect(wrapper.text()).toContain('Title')
      expect(wrapper.text()).toContain('Paragraph one')
      expect(wrapper.text()).toContain('Paragraph two')
    })

    it('supports nested FadeIn components', async () => {
      // Arrange: A parent FadeIn wrapping a child FadeIn
      const Parent = defineComponent({
        components: { FadeIn },
        template: '<FadeIn><FadeIn><span>nested</span></FadeIn></FadeIn>',
      })

      // Act: Mount the parent
      const parent = mount(Parent)

      // Assert: Two observers were created (one per FadeIn instance)
      expect(IntersectionObserverMock.instances.length).toBe(2)

      // Act: Trigger both observers
      IntersectionObserverMock.instances.forEach((o) => {
        const target = o.observed[0]
        if (target) o.trigger(target, true)
      })
      await parent.vm.$nextTick()

      // Assert: Both FadeIn wrappers become visible
      const fadeInElements = parent.findAll('.fade-in')
      expect(fadeInElements.length).toBe(2)
      fadeInElements.forEach((el) => {
        expect(el.classes()).toContain('visible')
      })

      parent.unmount()
    })

    it('renders slot content with the wrapper styling hook', () => {
      // Arrange: Slot content inside the fade-in wrapper
      wrapper = mount(FadeIn, {
        slots: { default: '<div class="inner">content</div>' },
      })

      // Assert: Inner content is a child of the fade-in wrapper
      const root = wrapper.find('.fade-in')
      const inner = root.find('.inner')
      expect(inner.exists()).toBe(true)
      expect(inner.text()).toBe('content')
    })
  })

  // ============================================
  // Edge Cases
  // ============================================
  describe('Edge Cases', () => {
    it('handles an empty slot without errors', () => {
      // Act: Mount with no slot content
      wrapper = mount(FadeIn)

      // Assert: Component renders an empty fade-in wrapper
      expect(wrapper.find('.fade-in').exists()).toBe(true)
      expect(wrapper.text()).toBe('')
    })

    it('cleans up on rapid mount/unmount cycles', () => {
      // Act: Rapidly mount and unmount several instances
      const disconnected: boolean[] = []
      for (let i = 0; i < 5; i++) {
        const w = mount(FadeIn)
        const observer = IntersectionObserverMock.instances.at(-1)!
        expect(w.exists()).toBe(true)
        w.unmount()
        disconnected.push(observer.disconnected)
      }

      // Assert: Every instance disconnected on unmount
      expect(disconnected.every((d) => d === true)).toBe(true)
    })

    it('accepts a custom threshold of 0.5', () => {
      // Act: Mount with threshold 0.5
      wrapper = mount(FadeIn, { props: { threshold: 0.5 } })
      const observer = IntersectionObserverMock.lastInstance!

      // Assert: Threshold is forwarded to the observer
      expect(observer.options.threshold).toBe(0.5)
    })

    it('accepts a custom threshold of 1.0', () => {
      // Act: Mount with threshold 1.0
      wrapper = mount(FadeIn, { props: { threshold: 1.0 } })
      const observer = IntersectionObserverMock.lastInstance!

      // Assert: Threshold is forwarded to the observer
      expect(observer.options.threshold).toBe(1.0)
    })

    it('accepts a custom threshold of 0.1', () => {
      // Act: Mount with explicit threshold 0.1
      wrapper = mount(FadeIn, { props: { threshold: 0.1 } })
      const observer = IntersectionObserverMock.lastInstance!

      // Assert: Threshold is forwarded to the observer
      expect(observer.options.threshold).toBe(0.1)
    })

    it('uses rootMargin when creating the observer', () => {
      // Act: Mount the component
      wrapper = mount(FadeIn)
      const observer = IntersectionObserverMock.lastInstance!

      // Assert: A rootMargin is configured (scroll-trigger offset)
      expect(observer.options.rootMargin).toBeDefined()
      expect(typeof observer.options.rootMargin).toBe('string')
    })
  })

  // ============================================
  // Component Structure / Integration
  // ============================================
  describe('Component Structure', () => {
    it('wraps slot content in a single fade-in root element', () => {
      // Arrange: Slot content
      wrapper = mount(FadeIn, {
        slots: { default: '<span>wrapped</span>' },
      })

      // Act: Find the root and its child
      const root = wrapper.find('.fade-in')
      const span = root.find('span')

      // Assert: Single root wraps the slot content
      expect(root.exists()).toBe(true)
      expect(span.exists()).toBe(true)
      expect(span.text()).toBe('wrapped')
    })

    it('renders correctly with a render-function slot', () => {
      // Arrange: Slot provided via render function
      wrapper = mount(FadeIn, {
        slots: {
          default: () => h('div', { class: 'rf-content' }, 'from render fn'),
        },
      })

      // Assert: Render-function slot content renders
      expect(wrapper.find('.rf-content').exists()).toBe(true)
      expect(wrapper.text()).toContain('from render fn')
    })

    it('toggles the .visible class exactly once on intersection', async () => {
      // Arrange: Mount the component
      wrapper = mount(FadeIn)
      const observer = IntersectionObserverMock.lastInstance!

      // Pre-state: no visible class
      expect(wrapper.classes()).not.toContain('visible')

      // Act: Trigger intersection
      observer.trigger(wrapper.element, true)
      await wrapper.vm.$nextTick()

      // Assert: visible class is present
      expect(wrapper.classes()).toContain('visible')
    })
  })
})
