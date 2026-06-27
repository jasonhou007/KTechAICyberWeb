/**
 * @file SkeletonContact.test.ts
 * @description Comprehensive unit tests for SkeletonContact component
 * @ticket #106 - TEST-033: SkeletonContact Component Unit Tests - TDD with Vitest
 *
 * Test Categories:
 * - Rendering Tests: Component mount and HTML structure
 * - Props Tests: Default values and prop-driven behavior
 * - Animation Tests: Staggered fade-in animationDelay per item
 * - Styling Tests: CSS classes for skeleton placeholders
 * - Loading State Tests: Conditional skeleton-loading class
 * - Edge Cases: count=0, count=1, large count, isLoading=false
 *
 * TDD Approach:
 * 1. Red: Tests written to define expected behavior
 * 2. Green: Component implementation makes tests pass
 * 3. Refactor: Test code optimized for clarity and maintainability
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import SkeletonContact from '../SkeletonContact.vue'

describe('SkeletonContact.vue', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    // Arrange: Create a fresh wrapper for each test using default props
    wrapper = mount(SkeletonContact)
  })

  afterEach(() => {
    // Cleanup: Unmount component after each test
    wrapper.unmount()
  })

  // ============================================
  // Rendering Tests
  // ============================================
  describe('Rendering', () => {
    it('should mount without errors', () => {
      // Assert: Component exists and mounted successfully
      expect(wrapper.exists()).toBe(true)
    })

    it('renders skeleton-contact wrapper', () => {
      // Act: Find the root wrapper element
      const container = wrapper.find('.skeleton-contact')

      // Assert: skeleton-contact wrapper exists
      expect(container.exists()).toBe(true)
    })

    it('renders the default number of items (4)', () => {
      // Act: Find all skeleton items
      const items = wrapper.findAll('.skeleton-item')

      // Assert: Default count renders exactly 4 items
      expect(items).toHaveLength(4)
    })

    it('renders a skeleton-item for each item', () => {
      // Act: Find all skeleton items
      const items = wrapper.findAll('.skeleton-item')

      // Assert: Each item is present and tagged with the correct class
      items.forEach((item) => {
        expect(item.classes()).toContain('skeleton-item')
      })
    })

    it('renders skeleton-item-icon for each item', () => {
      // Act: Find all icons
      const icons = wrapper.findAll('.skeleton-item-icon')

      // Assert: One icon per rendered item
      expect(icons).toHaveLength(4)
    })

    it('renders skeleton-circle within each icon', () => {
      // Act: Find all circular icon placeholders
      const circles = wrapper.findAll('.skeleton-item-icon .skeleton-circle')

      // Assert: One circle per item, nested inside the icon wrapper
      expect(circles).toHaveLength(4)
      circles.forEach((circle) => {
        expect(circle.classes()).toContain('skeleton-circle')
      })
    })

    it('renders skeleton-item-content for each item', () => {
      // Act: Find all content blocks
      const contents = wrapper.findAll('.skeleton-item-content')

      // Assert: One content block per item
      expect(contents).toHaveLength(4)
    })

    it('renders skeleton-line-title and skeleton-line-text', () => {
      // Act: Find title and text lines
      const titles = wrapper.findAll('.skeleton-line-title')
      const texts = wrapper.findAll('.skeleton-line-text')

      // Assert: One title and one text line per item
      expect(titles).toHaveLength(4)
      expect(texts).toHaveLength(4)
    })

    it('renders skeleton-line base class on title and text', () => {
      // Act: Find title and text lines
      const titles = wrapper.findAll('.skeleton-line-title')
      const texts = wrapper.findAll('.skeleton-line-text')

      // Assert: Both share the skeleton-line base class
      titles.forEach((title) => {
        expect(title.classes()).toContain('skeleton-line')
      })
      texts.forEach((text) => {
        expect(text.classes()).toContain('skeleton-line')
      })
    })
  })

  // ============================================
  // Props Tests
  // ============================================
  describe('Props', () => {
    it('accepts isLoading prop with default value true', () => {
      // Assert: Default isLoading is true
      expect(wrapper.props('isLoading')).toBe(true)
    })

    it('accepts count prop with default value 4', () => {
      // Assert: Default count is 4
      expect(wrapper.props('count')).toBe(4)
    })

    it('renders the number of items equal to count prop', () => {
      // Arrange: Mount with a custom count
      const customWrapper = mount(SkeletonContact, {
        props: { count: 6 },
      })

      // Act: Find all skeleton items
      const items = customWrapper.findAll('.skeleton-item')

      // Assert: Item count matches the count prop
      expect(items).toHaveLength(6)

      customWrapper.unmount()
    })

    it('respects isLoading=true explicitly', () => {
      // Arrange: Mount with isLoading set explicitly
      const loadingWrapper = mount(SkeletonContact, {
        props: { isLoading: true },
      })

      // Assert: skeleton-loading class is applied
      expect(loadingWrapper.find('.skeleton-contact').classes()).toContain(
        'skeleton-loading'
      )

      loadingWrapper.unmount()
    })

    it('removes skeleton-loading class when isLoading=false', () => {
      // Arrange: Mount with isLoading disabled
      const idleWrapper = mount(SkeletonContact, {
        props: { isLoading: false },
      })

      // Assert: skeleton-loading class is not applied
      expect(idleWrapper.find('.skeleton-contact').classes()).not.toContain(
        'skeleton-loading'
      )

      idleWrapper.unmount()
    })
  })

  // ============================================
  // Animation Tests
  // ============================================
  describe('Animation', () => {
    it('applies an animationDelay style on each item', () => {
      // Act: Find all skeleton items
      const items = wrapper.findAll('.skeleton-item')

      // Assert: Every item has an inline animationDelay style
      items.forEach((item) => {
        expect(item.attributes('style')).toContain('animation-delay')
      })
    })

    it('calculates delay as `${i * 80}ms` for each item', () => {
      // Act: Find all skeleton items
      const items = wrapper.findAll('.skeleton-item')

      // Assert: Item i (1-indexed) has delay i*80ms
      items.forEach((item, index) => {
        const i = index + 1
        const expectedDelay = `${i * 80}ms`
        expect(item.attributes('style')).toContain(
          `animation-delay: ${expectedDelay}`
        )
      })
    })

    it('applies a 80ms delay to the first item', () => {
      // Act: Get the first skeleton item
      const firstItem = wrapper.findAll('.skeleton-item')[0]

      // Assert: First item (i=1) has delay 80ms
      expect(firstItem.attributes('style')).toContain('animation-delay: 80ms')
    })

    it('applies incrementing delays across items', () => {
      // Act: Get all skeleton items
      const items = wrapper.findAll('.skeleton-item')

      // Assert: Delays increment by 80ms: 80, 160, 240, 320
      const expectedDelays = [80, 160, 240, 320]
      items.forEach((item, index) => {
        expect(item.attributes('style')).toContain(
          `animation-delay: ${expectedDelays[index]}ms`
        )
      })
    })
  })

  // ============================================
  // Styling Tests
  // ============================================
  describe('Styling', () => {
    it('has skeleton-contact base class on the root', () => {
      // Act: Find the root container
      const container = wrapper.find('.skeleton-contact')

      // Assert: Base class is present
      expect(container.classes()).toContain('skeleton-contact')
    })

    it('has skeleton-item class on each item', () => {
      // Act: Find all skeleton items
      const items = wrapper.findAll('.skeleton-item')

      // Assert: Each item carries the skeleton-item class
      items.forEach((item) => {
        expect(item.classes()).toContain('skeleton-item')
      })
    })

    it('has skeleton-circle class for circular icon placeholders', () => {
      // Act: Find all circles
      const circles = wrapper.findAll('.skeleton-circle')

      // Assert: Circle class present for rounded icon placeholder
      circles.forEach((circle) => {
        expect(circle.classes()).toContain('skeleton-circle')
      })
    })

    it('has skeleton-line-title class on title lines', () => {
      // Act: Find all title lines
      const titles = wrapper.findAll('.skeleton-line-title')

      // Assert: Title class present on each title line
      titles.forEach((title) => {
        expect(title.classes()).toContain('skeleton-line-title')
      })
    })

    it('has skeleton-line-text class on text lines', () => {
      // Act: Find all text lines
      const texts = wrapper.findAll('.skeleton-line-text')

      // Assert: Text class present on each text line
      texts.forEach((text) => {
        expect(text.classes()).toContain('skeleton-line-text')
      })
    })

    it('renders DOM hierarchy of icon and content inside each item', () => {
      // Act: Inspect the first skeleton item structure
      const firstItem = wrapper.findAll('.skeleton-item')[0]

      // Assert: Each item contains an icon and a content block
      expect(firstItem.find('.skeleton-item-icon').exists()).toBe(true)
      expect(firstItem.find('.skeleton-item-content').exists()).toBe(true)
      expect(firstItem.find('.skeleton-circle').exists()).toBe(true)
      expect(firstItem.find('.skeleton-line-title').exists()).toBe(true)
      expect(firstItem.find('.skeleton-line-text').exists()).toBe(true)
    })
  })

  // ============================================
  // Loading State Tests
  // ============================================
  describe('Loading State', () => {
    it('applies skeleton-loading class by default', () => {
      // Assert: Default state is loading
      expect(wrapper.find('.skeleton-contact').classes()).toContain(
        'skeleton-loading'
      )
    })

    it('toggles skeleton-loading class when isLoading changes', async () => {
      // Arrange: Start with isLoading=true
      expect(wrapper.find('.skeleton-contact').classes()).toContain(
        'skeleton-loading'
      )

      // Act: Switch isLoading to false
      await wrapper.setProps({ isLoading: false })

      // Assert: skeleton-loading class is removed
      expect(wrapper.find('.skeleton-contact').classes()).not.toContain(
        'skeleton-loading'
      )
    })

    it('still renders items when isLoading=false', () => {
      // Arrange: Mount with loading disabled
      const idleWrapper = mount(SkeletonContact, {
        props: { isLoading: false },
      })

      // Assert: Items remain rendered regardless of loading state
      expect(idleWrapper.findAll('.skeleton-item')).toHaveLength(4)

      idleWrapper.unmount()
    })
  })

  // ============================================
  // Edge Cases
  // ============================================
  describe('Edge Cases', () => {
    it('renders zero items when count=0', () => {
      // Arrange: Mount with count set to zero
      const emptyWrapper = mount(SkeletonContact, {
        props: { count: 0 },
      })

      // Assert: No skeleton items rendered
      expect(emptyWrapper.findAll('.skeleton-item')).toHaveLength(0)
      // Assert: Container still rendered
      expect(emptyWrapper.find('.skeleton-contact').exists()).toBe(true)

      emptyWrapper.unmount()
    })

    it('renders exactly one item when count=1', () => {
      // Arrange: Mount with count set to one
      const singleWrapper = mount(SkeletonContact, {
        props: { count: 1 },
      })

      // Act: Find all skeleton items
      const items = singleWrapper.findAll('.skeleton-item')

      // Assert: Exactly one item rendered with the correct delay
      expect(items).toHaveLength(1)
      expect(items[0].attributes('style')).toContain('animation-delay: 80ms')

      singleWrapper.unmount()
    })

    it('renders a large count of items correctly', () => {
      // Arrange: Mount with a large count
      const largeWrapper = mount(SkeletonContact, {
        props: { count: 20 },
      })

      // Act: Find all skeleton items
      const items = largeWrapper.findAll('.skeleton-item')

      // Assert: All 20 items render with staggered delays
      expect(items).toHaveLength(20)
      expect(items[19].attributes('style')).toContain(
        'animation-delay: 1600ms'
      )

      largeWrapper.unmount()
    })

    it('renders correctly with isLoading=false and custom count', () => {
      // Arrange: Combine non-default props
      const customWrapper = mount(SkeletonContact, {
        props: { isLoading: false, count: 3 },
      })

      // Assert: Items render and skeleton-loading class is absent
      expect(customWrapper.findAll('.skeleton-item')).toHaveLength(3)
      expect(customWrapper.find('.skeleton-contact').classes()).not.toContain(
        'skeleton-loading'
      )

      customWrapper.unmount()
    })

    it('can be mounted and unmounted multiple times', () => {
      // Arrange: Create multiple wrappers
      const wrappers = [
        mount(SkeletonContact),
        mount(SkeletonContact),
        mount(SkeletonContact),
      ]

      // Assert: All wrappers mount with the expected structure
      wrappers.forEach((w) => {
        expect(w.exists()).toBe(true)
        expect(w.findAll('.skeleton-item')).toHaveLength(4)
      })

      // Cleanup: Unmount all
      wrappers.forEach((w) => w.unmount())

      // Assert: No errors thrown
      expect(true).toBe(true)
    })

    it('handles rapid mount/unmount cycles', () => {
      // Act: Rapid mount/unmount
      for (let i = 0; i < 10; i++) {
        const w = mount(SkeletonContact)
        expect(w.exists()).toBe(true)
        expect(w.findAll('.skeleton-item')).toHaveLength(4)
        w.unmount()
      }

      // Assert: No errors
      expect(true).toBe(true)
    })
  })

  // ============================================
  // Integration Tests
  // ============================================
  describe('Integration', () => {
    it('renders complete skeleton structure in the DOM', () => {
      // Act: Get full html
      const html = wrapper.html()

      // Assert: Contains all expected structural pieces
      expect(html).toContain('skeleton-contact')
      expect(html).toContain('skeleton-item')
      expect(html).toContain('skeleton-item-icon')
      expect(html).toContain('skeleton-circle')
      expect(html).toContain('skeleton-item-content')
      expect(html).toContain('skeleton-line-title')
      expect(html).toContain('skeleton-line-text')
    })

    it('component receives props correctly via wrapper', () => {
      // Act: Access props
      const props = wrapper.props()

      // Assert: Both props are accessible with correct defaults
      expect(props).toHaveProperty('isLoading', true)
      expect(props).toHaveProperty('count', 4)
    })
  })
})
