/**
 * @file SkeletonCard.test.ts
 * @description Comprehensive unit tests for SkeletonCard component
 * @ticket #102 - TEST-030: SkeletonCard Component Unit Tests - TDD with Vitest
 *
 * Test Categories:
 * - Rendering Tests: Component mount and DOM structure
 * - Props Tests: isLoading / index validation, defaults, and effects
 * - Animation Tests: animationDelay calculation and fadeIn animation
 * - Styling Tests: skeleton-card base classes and line variants
 * - Accessibility Tests: Semantic HTML structure
 * - Edge Cases: index = 0, large index, multiple renders
 *
 * TDD Approach:
 * 1. Red: Tests written to define expected behavior
 * 2. Green: Component implementation makes tests pass
 * 3. Refactor: Test code optimized for clarity and maintainability
 *
 * Implementation note:
 * The animationDelay value is bound via an inline :style binding
 * (`animationDelay: `${index * 100}ms``), so it is directly observable on the
 * rendered element's style attribute in the happy-dom environment and is
 * asserted there. The fadeIn / shimmer keyframes and scoped visual styling live
 * in a scoped <style> block which is NOT resolved into getComputedStyle() under
 * happy-dom, so those declarations are verified by parsing the component's own
 * scoped stylesheet source (same approach used by Scanlines.test.ts).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import SkeletonCard from '../SkeletonCard.vue'

/**
 * Read the SkeletonCard SFC source and extract the scoped <style> block contents.
 *
 * This is the authoritative source of the component's visual styling in a
 * unit-test environment where scoped CSS is not applied to computed styles.
 */
function getScopedStyle(): string {
  const componentPath = resolve(__dirname, '..', 'SkeletonCard.vue')
  const source = readFileSync(componentPath, 'utf8')
  const match = source.match(/<style[^>]*>([\s\S]*?)<\/style>/)
  return match ? match[1] : ''
}

describe('SkeletonCard.vue', () => {
  let wrapper: VueWrapper
  let style: string

  beforeEach(() => {
    // Arrange: Create a fresh wrapper and snapshot the scoped style source
    wrapper = mount(SkeletonCard, {
      props: {
        isLoading: true,
        index: 0,
      },
    })
    style = getScopedStyle()
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

    it('renders the skeleton-card wrapper', () => {
      // Act: Find the root wrapper
      const card = wrapper.find('.skeleton-card')

      // Assert: The signature wrapper class is rendered
      expect(card.exists()).toBe(true)
    })

    it('renders a div as the root element', () => {
      // Act: Find the root element
      const root = wrapper.find('.skeleton-card')

      // Assert: Root element is a div
      expect(root.element.tagName.toLowerCase()).toBe('div')
    })

    it('renders the skeleton-icon container', () => {
      // Act: Find the icon container
      const icon = wrapper.find('.skeleton-icon')

      // Assert: The icon container exists
      expect(icon.exists()).toBe(true)
    })

    it('renders the skeleton-circle inside skeleton-icon', () => {
      // Act: Find the circle nested inside the icon container
      const circle = wrapper.find('.skeleton-icon .skeleton-circle')

      // Assert: The circle placeholder is rendered within the icon block
      expect(circle.exists()).toBe(true)
    })

    it('renders the skeleton-heading container', () => {
      // Act: Find the heading container
      const heading = wrapper.find('.skeleton-heading')

      // Assert: The heading container exists
      expect(heading.exists()).toBe(true)
    })

    it('renders the skeleton-content container', () => {
      // Act: Find the content container
      const content = wrapper.find('.skeleton-content')

      // Assert: The content container exists
      expect(content.exists()).toBe(true)
    })

    it('renders skeleton-content with exactly 3 lines', () => {
      // Act: Find all skeleton-line elements inside skeleton-content
      const lines = wrapper.findAll('.skeleton-content .skeleton-line')

      // Assert: The content block renders exactly three placeholder lines
      expect(lines).toHaveLength(3)
    })
  })

  // ============================================
  // Props Tests
  // ============================================
  describe('Props', () => {
    it('accepts the isLoading prop with a default of true', () => {
      // Assert: Default mount (no props beyond defaults) is in loading state
      const defaultWrapper = mount(SkeletonCard)
      expect(defaultWrapper.find('.skeleton-loading').exists()).toBe(true)
      defaultWrapper.unmount()
    })

    it('accepts the index prop with a default of 0', () => {
      // Assert: Default mount computes animationDelay from index = 0
      const defaultWrapper = mount(SkeletonCard)
      const card = defaultWrapper.find('.skeleton-card')
      // index * 100 = 0 * 100 = 0ms
      expect(card.attributes('style')).toContain('animation-delay: 0ms')
      defaultWrapper.unmount()
    })

    it('applies the skeleton-loading class when isLoading is true', () => {
      // Act: Re-mount with isLoading explicitly true
      const card = wrapper.find('.skeleton-card')

      // Assert: The loading modifier class is applied
      expect(card.classes()).toContain('skeleton-loading')
    })

    it('does NOT apply skeleton-loading class when isLoading is false', () => {
      // Act: Mount with isLoading = false
      const local = mount(SkeletonCard, { props: { isLoading: false, index: 0 } })
      const card = local.find('.skeleton-card')

      // Assert: The loading modifier class is absent
      expect(card.classes()).not.toContain('skeleton-loading')

      local.unmount()
    })

    it('sets the animationDelay inline style based on the index prop', () => {
      // Act: Mount with a known index
      const local = mount(SkeletonCard, { props: { isLoading: true, index: 3 } })
      const card = local.find('.skeleton-card')

      // Assert: animationDelay equals index * 100 ms (3 * 100 = 300ms)
      expect(card.attributes('style')).toContain('animation-delay: 300ms')

      local.unmount()
    })

    it('reflects isLoading prop changes reactively', async () => {
      // Arrange: Start in loading state
      const local = mount(SkeletonCard, { props: { isLoading: true, index: 0 } })
      expect(local.find('.skeleton-card').classes()).toContain('skeleton-loading')

      // Act: Toggle isLoading to false
      await local.setProps({ isLoading: false })

      // Assert: The modifier class is removed reactively
      expect(local.find('.skeleton-card').classes()).not.toContain('skeleton-loading')

      local.unmount()
    })
  })

  // ============================================
  // Animation Tests
  // ============================================
  describe('Animation', () => {
    it('always sets an animationDelay style on the card', () => {
      // Act: Read the inline style of the root card
      const card = wrapper.find('.skeleton-card')

      // Assert: animation-delay is present as an inline style
      expect(card.attributes('style')).toMatch(/animation-delay/)
    })

    it('calculates the delay as `${index * 100}ms`', () => {
      // Act: Mount across several indices and read back the computed delay
      const cases = [0, 1, 2, 5, 10]
      cases.forEach((index) => {
        const local = mount(SkeletonCard, { props: { isLoading: true, index } })
        const card = local.find('.skeleton-card')
        const expected = `animation-delay: ${index * 100}ms`
        expect(card.attributes('style')).toContain(expected)
        local.unmount()
      })
    })

    it('declares a fadeIn keyframe animation in scoped styles', () => {
      // Assert: The scoped style defines a fadeIn @keyframes block
      expect(style).toMatch(/@keyframes\s+fadeIn/)
    })

    it('declares a shimmer keyframe animation in scoped styles', () => {
      // Assert: The scoped style defines a shimmer @keyframes block
      expect(style).toMatch(/@keyframes\s+shimmer/)
    })

    it('applies the fadeIn animation to the skeleton-card', () => {
      // Assert: The .skeleton-card rule uses the fadeIn animation
      expect(style).toMatch(/\.skeleton-card\s*\{[^}]*animation:\s*fadeIn/)
    })
  })

  // ============================================
  // Styling Classes Tests
  // ============================================
  describe('Styling Classes', () => {
    it('has the skeleton-card base class', () => {
      // Act: Find the root by base class
      const card = wrapper.find('.skeleton-card')

      // Assert: Base class is applied
      expect(card.classes()).toContain('skeleton-card')
    })

    it('has the skeleton-icon class', () => {
      // Act: Find the icon container
      const icon = wrapper.find('.skeleton-icon')

      // Assert: The icon container carries its class
      expect(icon.classes()).toContain('skeleton-icon')
    })

    it('has the skeleton-circle class', () => {
      // Act: Find the circle element
      const circle = wrapper.find('.skeleton-circle')

      // Assert: The circle placeholder carries its class
      expect(circle.classes()).toContain('skeleton-circle')
    })

    it('has the skeleton-heading class', () => {
      // Act: Find the heading container
      const heading = wrapper.find('.skeleton-heading')

      // Assert: The heading container carries its class
      expect(heading.classes()).toContain('skeleton-heading')
    })

    it('has the skeleton-content class', () => {
      // Act: Find the content container
      const content = wrapper.find('.skeleton-content')

      // Assert: The content container carries its class
      expect(content.classes()).toContain('skeleton-content')
    })

    it('renders skeleton-line classes including variants', () => {
      // Act: Find line elements and their variant classes
      const lines = wrapper.findAll('.skeleton-line')
      const hasShort = wrapper.find('.skeleton-line-short').exists()
      const hasMedium = wrapper.find('.skeleton-line-medium').exists()

      // Assert: Base skeleton-line class is present along with both variants
      expect(lines.length).toBeGreaterThan(0)
      expect(hasShort).toBe(true)
      expect(hasMedium).toBe(true)
    })

    it('renders the skeleton-line-short variant inside skeleton-content', () => {
      // Act: Locate the short variant scoped to the content block
      const short = wrapper.find('.skeleton-content .skeleton-line-short')

      // Assert: The first content line uses the short width variant
      expect(short.exists()).toBe(true)
    })

    it('renders the skeleton-line-medium variant inside skeleton-content', () => {
      // Act: Locate the medium variant scoped to the content block
      const medium = wrapper.find('.skeleton-content .skeleton-line-medium')

      // Assert: The last content line uses the medium width variant
      expect(medium.exists()).toBe(true)
    })

    it('renders a skeleton-line inside skeleton-heading', () => {
      // Act: Find a line nested inside the heading block
      const headingLine = wrapper.find('.skeleton-heading .skeleton-line')

      // Assert: The heading block contains a placeholder line
      expect(headingLine.exists()).toBe(true)
    })
  })

  // ============================================
  // Accessibility Tests
  // ============================================
  describe('Accessibility', () => {
    it('uses a div as the root semantic element', () => {
      // Act: Inspect the root element's tag name
      const card = wrapper.find('.skeleton-card')

      // Assert: Root is a generic container div
      expect(card.element.tagName.toLowerCase()).toBe('div')
    })

    it('maintains a readable nested structure (icon, heading, content)', () => {
      // Act: Query each top-level structural block
      const card = wrapper.find('.skeleton-card')
      const icon = card.find('.skeleton-icon')
      const heading = card.find('.skeleton-heading')
      const content = card.find('.skeleton-content')

      // Assert: All three structural blocks are present as descendants
      expect(icon.exists()).toBe(true)
      expect(heading.exists()).toBe(true)
      expect(content.exists()).toBe(true)
    })

    it('renders skeleton placeholder elements with no textual content', () => {
      // Act: Read the full text content of the card
      const text = wrapper.find('.skeleton-card').text()

      // Assert: A skeleton placeholder renders no readable text
      expect(text).toBe('')
    })
  })

  // ============================================
  // Edge Cases
  // ============================================
  describe('Edge Cases', () => {
    it('computes animationDelay of 0ms when index is 0', () => {
      // Act: Mount with index = 0
      const local = mount(SkeletonCard, { props: { isLoading: true, index: 0 } })
      const card = local.find('.skeleton-card')

      // Assert: 0 * 100 = 0ms
      expect(card.attributes('style')).toContain('animation-delay: 0ms')

      local.unmount()
    })

    it('computes animationDelay correctly for a large index', () => {
      // Act: Mount with a large index value
      const local = mount(SkeletonCard, { props: { isLoading: true, index: 1000 } })
      const card = local.find('.skeleton-card')

      // Assert: 1000 * 100 = 100000ms
      expect(card.attributes('style')).toContain('animation-delay: 100000ms')

      local.unmount()
    })

    it('computes animationDelay proportionally across a stagger of indices', () => {
      // Act: Mount a stagger of 5 cards and read each delay
      const stagger = [0, 1, 2, 3, 4]
      const wrappers = stagger.map((index) =>
        mount(SkeletonCard, { props: { isLoading: true, index } }),
      )

      // Assert: Each card's delay increments by 100ms per index step
      wrappers.forEach((w, i) => {
        const delay = w.find('.skeleton-card').attributes('style')
        expect(delay).toContain(`animation-delay: ${i * 100}ms`)
      })

      // Cleanup
      wrappers.forEach((w) => w.unmount())
    })

    it('renders the full structure when isLoading is false', () => {
      // Act: Mount in the non-loading state
      const local = mount(SkeletonCard, { props: { isLoading: false, index: 0 } })

      // Assert: The placeholder structure is still fully rendered
      expect(local.find('.skeleton-card').exists()).toBe(true)
      expect(local.find('.skeleton-icon').exists()).toBe(true)
      expect(local.find('.skeleton-circle').exists()).toBe(true)
      expect(local.find('.skeleton-heading').exists()).toBe(true)
      expect(local.find('.skeleton-content').exists()).toBe(true)
      expect(local.findAll('.skeleton-line')).toHaveLength(4)

      local.unmount()
    })

    it('can be mounted and unmounted multiple times without errors', () => {
      // Act: Mount several independent instances
      const wrappers = [
        mount(SkeletonCard, { props: { isLoading: true, index: 0 } }),
        mount(SkeletonCard, { props: { isLoading: true, index: 1 } }),
        mount(SkeletonCard, { props: { isLoading: true, index: 2 } }),
      ]

      // Assert: Each instance renders its wrapper and delay correctly
      wrappers.forEach((w, i) => {
        expect(w.find('.skeleton-card').exists()).toBe(true)
        expect(w.find('.skeleton-card').attributes('style')).toContain(
          `animation-delay: ${i * 100}ms`,
        )
      })

      // Cleanup
      wrappers.forEach((w) => w.unmount())

      // Assert: No errors thrown
      expect(true).toBe(true)
    })

    it('survives a rapid mount/unmount cycle without errors', () => {
      // Act: Rapidly mount and unmount the component
      for (let i = 0; i < 10; i++) {
        const w = mount(SkeletonCard, { props: { isLoading: true, index: i } })
        expect(w.find('.skeleton-card').exists()).toBe(true)
        w.unmount()
      }

      // Assert: No errors thrown across the cycle
      expect(true).toBe(true)
    })
  })

  // ============================================
  // Component Structure / Integration
  // ============================================
  describe('Component Structure', () => {
    it('has the correct DOM hierarchy', () => {
      // Act: Build the expected hierarchy from the root
      const card = wrapper.find('.skeleton-card')
      const icon = card.find('.skeleton-icon')
      const circle = icon.find('.skeleton-circle')
      const heading = card.find('.skeleton-heading')
      const content = card.find('.skeleton-content')

      // Assert: Parent-child relationships match the component contract
      expect(card.exists()).toBe(true)
      expect(icon.exists()).toBe(true)
      expect(circle.exists()).toBe(true)
      expect(heading.exists()).toBe(true)
      expect(content.exists()).toBe(true)
    })

    it('renders exactly one skeleton-circle element', () => {
      // Act: Count all circle placeholders
      const circles = wrapper.findAll('.skeleton-circle')

      // Assert: A single icon circle is rendered
      expect(circles).toHaveLength(1)
    })

    it('renders exactly four skeleton-line elements total', () => {
      // Act: Count all line placeholders across heading + content
      const lines = wrapper.findAll('.skeleton-line')

      // Assert: One heading line + three content lines = four total
      expect(lines).toHaveLength(4)
    })

    it('renders the expected HTML snapshot contract', () => {
      // Act: Capture the rendered HTML
      const html = wrapper.html()

      // Assert: The contract classes and inline animationDelay are present
      expect(html).toContain('class="skeleton-card skeleton-loading"')
      expect(html).toContain('skeleton-icon')
      expect(html).toContain('skeleton-circle')
      expect(html).toContain('skeleton-heading')
      expect(html).toContain('skeleton-content')
      expect(html).toContain('animation-delay: 0ms')
    })
  })
})
