/**
 * @file SkeletonHonors.test.ts
 * @description Comprehensive unit tests for SkeletonHonors component
 * @ticket #108 - TEST-035: SkeletonHonors Component Unit Tests - TDD with Vitest
 *
 * Test Categories:
 * - Rendering Tests: Component mount, root tag, signature CSS class
 * - Props Validation Tests: isLoading/count types, defaults, type guards
 * - Count-Based Rendering Tests: badge count matches `count` prop
 * - Badge Structure Tests: icon + text line hierarchy per badge
 * - CSS Classes Tests: container classes, loading state, badge class
 * - Animation Tests: staggered animationDelay (i * 50ms) per badge
 * - Loading States Tests: visibility under isLoading true/false, transition
 * - Edge Cases Tests: count=0, count=1, large count, isLoading=false
 *
 * TDD Approach:
 * 1. Red: Tests written to define expected behavior
 * 2. Green: Component implementation makes tests pass
 * 3. Refactor: Test code optimized for clarity and maintainability
 *
 * Implementation note:
 * The SkeletonHonors visual effect (shimmer, fade-in, fade-out transition,
 * responsive grid) is delivered through a scoped `<style>` block. In the
 * Vitest happy-dom environment, scoped CSS is NOT resolved into
 * `getComputedStyle()` (style values come back as empty strings), so
 * asserting on `getComputedStyle(el).opacity` would produce permanently
 * failing tests that can never reach GREEN. To honestly verify the CSS
 * contract (responsive breakpoints, shimmer keyframes, fade-out rule), these
 * tests parse the component's own scoped stylesheet source and assert the
 * declared rules. DOM-observable facts (tag, class, animationDelay inline
 * style) are asserted directly on the rendered element.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import SkeletonHonors from '../SkeletonHonors.vue'

/**
 * Read the SkeletonHonors SFC source and extract the scoped <style> block.
 *
 * This is the authoritative source of the component's visual styling in a
 * unit-test environment where scoped CSS is not applied to computed styles.
 */
function getScopedStyle(): string {
  const componentPath = resolve(__dirname, '..', 'SkeletonHonors.vue')
  const source = readFileSync(componentPath, 'utf8')
  const match = source.match(/<style[^>]*>([\s\S]*?)<\/style>/)
  return match ? match[1] : ''
}

describe('SkeletonHonors.vue', () => {
  let wrapper: VueWrapper
  let style: string

  beforeEach(() => {
    // Arrange: Create a fresh wrapper with default props and snapshot the
    // scoped style source for CSS-contract assertions
    wrapper = mount(SkeletonHonors)
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

    it('renders a div as the root element', () => {
      // Act: Find the root element
      const root = wrapper.find('div')

      // Assert: Root element is a div
      expect(root.exists()).toBe(true)
      expect(root.element.tagName.toLowerCase()).toBe('div')
    })

    it('has skeleton-honors CSS class on the root container', () => {
      // Act: Find by the signature class
      const container = wrapper.find('.skeleton-honors')

      // Assert: The container CSS class is applied
      expect(container.exists()).toBe(true)
      expect(container.classes()).toContain('skeleton-honors')
    })

    it('renders exactly one root element', () => {
      // Act: Find the root by its signature class
      const root = wrapper.find('.skeleton-honors')

      // Assert: Exactly one root container exists
      expect(root.exists()).toBe(true)
      expect(wrapper.findAll('.skeleton-honors')).toHaveLength(1)
    })

    it('has no text content (pure skeleton placeholder)', () => {
      // Act: Read text content
      const text = wrapper.text()

      // Assert: A skeleton renders no real text — it is a placeholder
      expect(text).toBe('')
    })

    it('renders the expected root HTML contract', () => {
      // Act: Capture the rendered HTML
      const html = wrapper.html()

      // Assert: Root is a div with the skeleton-honors class and loading state
      expect(html).toContain('<div')
      expect(html).toContain('class="skeleton-honors')
    })
  })

  // ============================================
  // Props Validation Tests
  // ============================================
  describe('Props Validation', () => {
    it('has isLoading prop with default value true', () => {
      // Act: Inspect resolved props of a default-mounted component
      const props = wrapper.props()

      // Assert: isLoading defaults to true (skeleton visible by default)
      expect(props.isLoading).toBe(true)
    })

    it('has count prop with default value 6', () => {
      // Act: Inspect resolved props of a default-mounted component
      const props = wrapper.props()

      // Assert: count defaults to 6 skeleton badges
      expect(props.count).toBe(6)
    })

    it('accepts isLoading as a Boolean', () => {
      // Act: Mount with explicit isLoading=false
      const w = mount(SkeletonHonors, { props: { isLoading: false } })

      // Assert: The Boolean prop is honored
      expect(w.props('isLoading')).toBe(false)
      w.unmount()
    })

    it('accepts count as a Number', () => {
      // Act: Mount with an explicit count
      const w = mount(SkeletonHonors, { props: { count: 3 } })

      // Assert: The Number prop is honored
      expect(w.props('count')).toBe(3)
      w.unmount()
    })

    it('isLoading prop type is Boolean', () => {
      // Act: Inspect the component's declared prop options
      // Assert: isLoading is declared as a Boolean prop
      expect(typeof wrapper.props('isLoading')).toBe('boolean')
    })

    it('count prop type is Number', () => {
      // Act: Inspect the resolved prop value
      // Assert: count resolves to a number type
      expect(typeof wrapper.props('count')).toBe('number')
    })

    it('props can be updated reactively', async () => {
      // Act: Update the count prop
      await wrapper.setProps({ count: 4 })

      // Assert: The prop reflects the new value
      expect(wrapper.props('count')).toBe(4)
    })
  })

  // ============================================
  // Count-Based Rendering Tests
  // ============================================
  describe('Count-Based Rendering', () => {
    it('renders 6 badges by default (count=6)', () => {
      // Act: Find all badges
      const badges = wrapper.findAll('.skeleton-badge')

      // Assert: Default count produces 6 badges
      expect(badges).toHaveLength(6)
    })

    it('renders the number of badges specified by count', () => {
      // Act: Mount with a custom count
      const w = mount(SkeletonHonors, { props: { count: 4 } })
      const badges = w.findAll('.skeleton-badge')

      // Assert: Badge count matches the count prop
      expect(badges).toHaveLength(4)
      w.unmount()
    })

    it('renders badges in sequential order keyed by index', () => {
      // Act: Collect each badge's animationDelay (1-based i * 50ms)
      const badges = wrapper.findAll('.skeleton-badge')
      const delays = badges.map((b) => b.attributes('style'))

      // Assert: Each badge carries a distinct, increasing animation delay
      expect(delays[0]).toContain('50ms')
      expect(delays[1]).toContain('100ms')
      expect(delays[5]).toContain('300ms')
    })

    it('re-renders the correct badge count when count changes', async () => {
      // Arrange: Start with default 6
      expect(wrapper.findAll('.skeleton-badge')).toHaveLength(6)

      // Act: Change the count
      await wrapper.setProps({ count: 3 })

      // Assert: The DOM reflects the new badge count
      expect(wrapper.findAll('.skeleton-badge')).toHaveLength(3)
    })
  })

  // ============================================
  // Badge Structure Tests
  // ============================================
  describe('Badge Structure', () => {
    it('each badge has the skeleton-badge CSS class', () => {
      // Act: Find all badges
      const badges = wrapper.findAll('.skeleton-badge')

      // Assert: Every rendered badge carries the badge class
      expect(badges.length).toBeGreaterThan(0)
      badges.forEach((badge) => {
        expect(badge.classes()).toContain('skeleton-badge')
      })
    })

    it('each badge contains a skeleton-badge-inner wrapper', () => {
      // Act: Find inner wrappers within badges
      const inners = wrapper.findAll('.skeleton-badge .skeleton-badge-inner')

      // Assert: One inner wrapper per badge
      expect(inners).toHaveLength(6)
    })

    it('each badge contains a skeleton-icon element', () => {
      // Act: Find icons within badges
      const icons = wrapper.findAll('.skeleton-badge .skeleton-icon')

      // Assert: One icon per badge (50px circle placeholder)
      expect(icons).toHaveLength(6)
    })

    it('each badge contains a skeleton-line text placeholder', () => {
      // Act: Find lines within badges
      const lines = wrapper.findAll('.skeleton-badge .skeleton-line')

      // Assert: One text line per badge
      expect(lines).toHaveLength(6)
    })

    it('icon is nested inside the badge-inner wrapper', () => {
      // Act: Find icon scoped under the inner wrapper
      const icons = wrapper.findAll('.skeleton-badge-inner .skeleton-icon')

      // Assert: Icons are children of the inner wrapper
      expect(icons.length).toBeGreaterThan(0)
    })

    it('line is nested inside the skeleton-text wrapper', () => {
      // Act: Find line scoped under skeleton-text
      const lines = wrapper.findAll('.skeleton-text .skeleton-line')

      // Assert: Each text wrapper contains exactly one line
      expect(lines).toHaveLength(6)
    })

    it('has the complete badge DOM hierarchy', () => {
      // Act: Walk the full hierarchy for the first badge
      const badge = wrapper.find('.skeleton-badge')
      const inner = badge.find('.skeleton-badge-inner')
      const icon = inner.find('.skeleton-icon')
      const text = inner.find('.skeleton-text')
      const line = text.find('.skeleton-line')

      // Assert: badge > inner > (icon + text > line)
      expect(badge.exists()).toBe(true)
      expect(inner.exists()).toBe(true)
      expect(icon.exists()).toBe(true)
      expect(text.exists()).toBe(true)
      expect(line.exists()).toBe(true)
    })
  })

  // ============================================
  // CSS Classes Tests
  // ============================================
  describe('CSS Classes', () => {
    it('applies skeleton-honors class to the container', () => {
      // Act: Find the container
      const container = wrapper.find('.skeleton-honors')

      // Assert: Signature container class is present
      expect(container.classes()).toContain('skeleton-honors')
    })

    it('applies skeleton-loading class when isLoading is true', () => {
      // Act: Mount with isLoading=true (default)
      const w = mount(SkeletonHonors, { props: { isLoading: true } })
      const container = w.find('.skeleton-honors')

      // Assert: Loading state class is applied
      expect(container.classes()).toContain('skeleton-loading')
      w.unmount()
    })

    it('does NOT apply skeleton-loading class when isLoading is false', () => {
      // Act: Mount with isLoading=false
      const w = mount(SkeletonHonors, { props: { isLoading: false } })
      const container = w.find('.skeleton-honors')

      // Assert: Loading state class is absent when not loading
      expect(container.classes()).not.toContain('skeleton-loading')
      w.unmount()
    })

    it('applies skeleton-badge class to each rendered badge', () => {
      // Act: Find all badges
      const badges = wrapper.findAll('.skeleton-badge')

      // Assert: Every badge element has the badge class
      badges.forEach((badge) => {
        expect(badge.classes()).toContain('skeleton-badge')
      })
    })

    it('declares the skeleton-honors rule in the scoped style', () => {
      // Assert: The style block targets the container class
      expect(style).toMatch(/\.skeleton-honors\s*\{/)
    })

    it('declares the fade-out rule for the not-loading state', () => {
      // Assert: The fade-out transition targets :not(.skeleton-loading)
      expect(style).toMatch(/\.skeleton-honors:not\(\.skeleton-loading\)/)
    })
  })

  // ============================================
  // Animation Tests
  // ============================================
  describe('Animation', () => {
    it('each badge has an inline animationDelay style', () => {
      // Act: Find all badges and read their style attribute
      const badges = wrapper.findAll('.skeleton-badge')

      // Assert: Every badge carries an animationDelay declaration
      badges.forEach((badge) => {
        expect(badge.attributes('style')).toContain('animation-delay')
      })
    })

    it('first badge has animationDelay of 50ms (1 * 50ms)', () => {
      // Act: Read the first badge's inline style
      const firstBadge = wrapper.findAll('.skeleton-badge')[0]

      // Assert: Badge at i=1 receives a 50ms delay
      expect(firstBadge.attributes('style')).toContain('animation-delay: 50ms')
    })

    it('second badge has animationDelay of 100ms (2 * 50ms)', () => {
      // Act: Read the second badge's inline style
      const secondBadge = wrapper.findAll('.skeleton-badge')[1]

      // Assert: Badge at i=2 receives a 100ms delay
      expect(secondBadge.attributes('style')).toContain('animation-delay: 100ms')
    })

    it('sixth badge has animationDelay of 300ms (6 * 50ms)', () => {
      // Act: Read the sixth badge's inline style
      const sixthBadge = wrapper.findAll('.skeleton-badge')[5]

      // Assert: Badge at i=6 receives a 300ms delay
      expect(sixthBadge.attributes('style')).toContain('animation-delay: 300ms')
    })

    it('animation delays are strictly increasing across badges', () => {
      // Act: Extract the numeric delay from each badge's style
      const badges = wrapper.findAll('.skeleton-badge')
      const delays = badges.map((b) => {
        const match = b.attributes('style')?.match(/animation-delay:\s*(\d+)ms/)
        return match ? parseInt(match[1], 10) : -1
      })

      // Assert: Each subsequent badge delays 50ms more than the previous
      for (let i = 0; i < delays.length - 1; i++) {
        expect(delays[i + 1]).toBeGreaterThan(delays[i])
        expect(delays[i + 1] - delays[i]).toBe(50)
      }
    })

    it('declares a fadeIn keyframe in the scoped style', () => {
      // Assert: The fade-in animation is defined for the staggered reveal
      expect(style).toMatch(/@keyframes\s+fadeIn/)
    })

    it('declares a shimmer keyframe in the scoped style', () => {
      // Assert: The shimmer animation is defined for the skeleton effect
      expect(style).toMatch(/@keyframes\s+shimmer/)
    })
  })

  // ============================================
  // Loading States Tests
  // ============================================
  describe('Loading States', () => {
    it('is in loading state by default', () => {
      // Act: Inspect the container classes
      const container = wrapper.find('.skeleton-honors')

      // Assert: Default mount shows the loading state
      expect(container.classes()).toContain('skeleton-loading')
    })

    it('removes loading state when isLoading becomes false', async () => {
      // Arrange: Default isLoading=true
      const container = wrapper.find('.skeleton-honors')
      expect(container.classes()).toContain('skeleton-loading')

      // Act: Toggle isLoading off
      await wrapper.setProps({ isLoading: false })

      // Assert: The loading class is removed reactively
      expect(wrapper.find('.skeleton-honors').classes()).not.toContain('skeleton-loading')
    })

    it('adds loading state when isLoading becomes true', async () => {
      // Arrange: Start with isLoading=false
      const w = mount(SkeletonHonors, { props: { isLoading: false } })
      expect(w.find('.skeleton-honors').classes()).not.toContain('skeleton-loading')

      // Act: Toggle isLoading on
      await w.setProps({ isLoading: true })

      // Assert: The loading class is added reactively
      expect(w.find('.skeleton-honors').classes()).toContain('skeleton-loading')
      w.unmount()
    })

    it('declares a 0.3s fade-out transition for the not-loading state', () => {
      // Assert: The transition rule uses a 0.3s ease opacity fade
      expect(style).toMatch(/transition:\s*opacity\s+0\.3s\s+ease/)
    })

    it('declares pointer-events: none for the not-loading state', () => {
      // Assert: Hidden skeleton does not intercept pointer interaction
      expect(style).toMatch(/pointer-events:\s*none/)
    })
  })

  // ============================================
  // Edge Cases Tests
  // ============================================
  describe('Edge Cases', () => {
    it('renders no badges when count is 0', () => {
      // Act: Mount with count=0
      const w = mount(SkeletonHonors, { props: { count: 0 } })

      // Assert: No badges are rendered
      expect(w.findAll('.skeleton-badge')).toHaveLength(0)
      w.unmount()
    })

    it('renders a single badge when count is 1', () => {
      // Act: Mount with count=1
      const w = mount(SkeletonHonors, { props: { count: 1 } })
      const badges = w.findAll('.skeleton-badge')

      // Assert: Exactly one badge is rendered
      expect(badges).toHaveLength(1)
      // And the single badge has the 50ms (1 * 50ms) delay
      expect(badges[0].attributes('style')).toContain('animation-delay: 50ms')
      w.unmount()
    })

    it('renders a large number of badges (count=20)', () => {
      // Act: Mount with count=20
      const w = mount(SkeletonHonors, { props: { count: 20 } })
      const badges = w.findAll('.skeleton-badge')

      // Assert: All 20 badges render with the correct structure
      expect(badges).toHaveLength(20)
      expect(w.findAll('.skeleton-icon')).toHaveLength(20)
      expect(w.findAll('.skeleton-line')).toHaveLength(20)
      // Last badge (i=20) receives a 1000ms delay
      expect(badges[19].attributes('style')).toContain('animation-delay: 1000ms')
      w.unmount()
    })

    it('renders correctly when isLoading is false', () => {
      // Act: Mount with isLoading=false
      const w = mount(SkeletonHonors, { props: { isLoading: false } })
      const container = w.find('.skeleton-honors')

      // Assert: Container still renders but without the loading class
      expect(container.exists()).toBe(true)
      expect(container.classes()).not.toContain('skeleton-loading')
      // Badges still render (fade-out is a CSS concern, not DOM removal)
      expect(w.findAll('.skeleton-badge').length).toBeGreaterThan(0)
      w.unmount()
    })

    it('maintains correct animation delays for a custom count', () => {
      // Act: Mount with count=4
      const w = mount(SkeletonHonors, { props: { count: 4 } })
      const badges = w.findAll('.skeleton-badge')

      // Assert: Delays follow the i * 50ms formula for 1..4
      expect(badges[0].attributes('style')).toContain('animation-delay: 50ms')
      expect(badges[1].attributes('style')).toContain('animation-delay: 100ms')
      expect(badges[2].attributes('style')).toContain('animation-delay: 150ms')
      expect(badges[3].attributes('style')).toContain('animation-delay: 200ms')
      w.unmount()
    })

    it('survives a rapid mount/unmount cycle without errors', () => {
      // Act: Rapidly mount and unmount the component
      for (let i = 0; i < 10; i++) {
        const w = mount(SkeletonHonors)
        expect(w.find('.skeleton-honors').exists()).toBe(true)
        w.unmount()
      }

      // Assert: No errors thrown across the cycle
      expect(true).toBe(true)
    })

    it('renders consistently on repeated mounts with custom props', () => {
      // Act: Mount several independent instances with the same props
      const instances = [
        mount(SkeletonHonors, { props: { count: 3 } }),
        mount(SkeletonHonors, { props: { count: 3 } }),
        mount(SkeletonHonors, { props: { count: 3 } }),
      ]

      // Assert: Every instance renders the same badge count and contract
      instances.forEach((w) => {
        expect(w.findAll('.skeleton-badge')).toHaveLength(3)
        expect(w.find('.skeleton-honors').classes()).toContain('skeleton-loading')
      })

      // Cleanup
      instances.forEach((w) => w.unmount())
    })
  })

  // ============================================
  // Responsive Design Tests (via scoped style source)
  // ============================================
  describe('Responsive Design', () => {
    it('declares a 3-column layout for desktop', () => {
      // Assert: Each badge occupies ~1/3 width (calc(33.333% ...))
      expect(style).toMatch(/calc\(33\.333%/)
    })

    it('declares a 2-column responsive breakpoint at 768px', () => {
      // Assert: A @media (max-width: 768px) rule collapses to 2 columns
      expect(style).toMatch(/@media\s*\(max-width:\s*768px\)/)
      expect(style).toMatch(/calc\(50%/)
    })

    it('uses flex layout for the badge container', () => {
      // Assert: The container is a wrapping flex layout
      expect(style).toMatch(/\.skeleton-honors\s*\{[\s\S]*?display:\s*flex/)
      expect(style).toMatch(/flex-wrap:\s*wrap/)
    })
  })

  // ============================================
  // Component Structure / Integration
  // ============================================
  describe('Component Structure', () => {
    it('has exactly two declared props', () => {
      // Act: Inspect the resolved props
      const props = wrapper.props()

      // Assert: Only isLoading and count are declared
      expect(Object.keys(props)).toEqual(expect.arrayContaining(['isLoading', 'count']))
      expect(Object.keys(props)).toHaveLength(2)
    })

    it('does not consume arbitrary attributes as props', () => {
      // Act: Mount with an undeclared attribute
      const w = mount(SkeletonHonors, {
        attrs: { 'data-test': 'value' },
      })

      // Assert: data-test falls through as an attribute, not a prop
      expect(w.props('data-test')).toBeUndefined()
      expect(w.find('.skeleton-honors').attributes('data-test')).toBe('value')
      w.unmount()
    })

    it('renders the complete HTML structure contract', () => {
      // Act: Capture the rendered HTML
      const html = wrapper.html()

      // Assert: All signature classes appear in the rendered output
      expect(html).toContain('skeleton-honors')
      expect(html).toContain('skeleton-loading')
      expect(html).toContain('skeleton-badge')
      expect(html).toContain('skeleton-badge-inner')
      expect(html).toContain('skeleton-icon')
      expect(html).toContain('skeleton-text')
      expect(html).toContain('skeleton-line')
      expect(html).toContain('animation-delay')
    })
  })
})
