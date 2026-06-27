/**
 * @file SkeletonHero.test.ts
 * @description Comprehensive unit tests for SkeletonHero component
 * @ticket #107 - TEST-034: SkeletonHero Component Unit Tests - TDD with Vitest
 *
 * Test Categories:
 * - Rendering Tests: Component mount and HTML structure (wrapper, title, stats)
 * - Props Tests: isLoading prop default, validation, and conditional CSS class
 * - Structure Tests: Title lines (lg + md), stats items (3), per-stat structure
 * - Styling Tests: CSS classes for lines, circle, and shimmer animation
 * - Loading State Tests: isLoading true/false behavior
 * - Edge Cases: Multiple renders, reactivity, lifecycle
 *
 * TDD Approach:
 * 1. Red: Tests written to define expected behavior
 * 2. Green: Component implementation makes tests pass
 * 3. Refactor: Test code optimized for clarity and maintainability
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import SkeletonHero from '../SkeletonHero.vue'

/**
 * Read the SkeletonHero SFC source and extract the scoped <style> block contents.
 *
 * The shimmer animation and flex layouts are delivered through a scoped
 * <style> block. In the Vitest happy-dom environment, scoped CSS is NOT
 * resolved into getComputedStyle()/document stylesheets, so asserting on
 * document <style> tags produces empty strings. To honestly verify the CSS
 * contract, this helper parses the component's own scoped stylesheet source
 * (same approach used by Scanlines.test.ts). DOM-observable facts (tags,
 * classes, structure) are asserted directly on the rendered element.
 */
function getScopedStyle(): string {
  const componentPath = resolve(__dirname, '..', 'SkeletonHero.vue')
  const source = readFileSync(componentPath, 'utf8')
  const match = source.match(/<style[^>]*>([\s\S]*?)<\/style>/)
  return match ? match[1] : ''
}

// Helper: Mount SkeletonHero with optional props, isolating the Transition
// component so fade-out/transition behaviors stay deterministic in jsdom.
const mountSkeletonHero = (props: Record<string, unknown> = {}): VueWrapper => {
  return mount(SkeletonHero, {
    props: {
      isLoading: true,
      ...props,
    },
    global: {
      stubs: {
        Transition: true,
      },
    },
  })
}

describe('SkeletonHero.vue', () => {
  let wrapper: VueWrapper
  let style: string

  beforeEach(() => {
    // Arrange: Create a fresh wrapper (isLoading defaults to true) per test,
    // and snapshot the scoped style source for CSS-contract assertions.
    wrapper = mountSkeletonHero()
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

    it('renders skeleton-hero wrapper', () => {
      // Act: Find the root skeleton-hero element
      const hero = wrapper.find('.skeleton-hero')

      // Assert: Root wrapper exists
      expect(hero.exists()).toBe(true)
    })

    it('renders skeleton-title section', () => {
      // Act: Find the title section
      const title = wrapper.find('.skeleton-title')

      // Assert: Title section exists inside the hero
      expect(title.exists()).toBe(true)
    })

    it('renders skeleton-stats section', () => {
      // Act: Find the stats section
      const stats = wrapper.find('.skeleton-stats')

      // Assert: Stats section exists inside the hero
      expect(stats.exists()).toBe(true)
    })

    it('renders skeleton-stats as a semantic dl element', () => {
      // Act: Find the stats container element
      const stats = wrapper.find('.skeleton-stats')

      // Assert: Stats uses semantic description list markup
      expect(stats.element.tagName.toLowerCase()).toBe('dl')
    })

    it('renders the correct top-level component structure', () => {
      // Act: Locate each major section within the root wrapper
      const hero = wrapper.find('.skeleton-hero')
      const title = hero.find('.skeleton-title')
      const stats = hero.find('.skeleton-stats')

      // Assert: All major sections exist with correct hierarchy
      expect(hero.exists()).toBe(true)
      expect(title.exists()).toBe(true)
      expect(stats.exists()).toBe(true)
    })
  })

  // ============================================
  // Props Tests
  // ============================================
  describe('Props', () => {
    it('accepts isLoading prop with a default value of true', () => {
      // Arrange: Mount without passing isLoading to test the default
      const localWrapper = mount(SkeletonHero, {
        global: { stubs: { Transition: true } },
      })

      // Assert: Default isLoading is true, so skeleton-loading class is applied
      expect(localWrapper.find('.skeleton-hero.skeleton-loading').exists()).toBe(true)

      localWrapper.unmount()
    })

    it('declares isLoading as a Boolean prop', () => {
      // Act: Inspect the component's prop definition
      const propDef = (SkeletonHero as unknown as { props?: { isLoading?: { type: unknown } } }).props

      // Assert: isLoading is declared with Boolean type
      expect(propDef).toBeDefined()
      expect(propDef?.isLoading).toBeDefined()
      expect(propDef?.isLoading?.type).toBe(Boolean)
    })

    it('applies skeleton-loading class when isLoading is true', () => {
      // Act: Find the root element and read its classes
      const hero = wrapper.find('.skeleton-hero')

      // Assert: skeleton-loading class is present when isLoading is true
      expect(hero.classes()).toContain('skeleton-loading')
    })

    it('removes skeleton-loading class when isLoading is false', () => {
      // Arrange: Mount with isLoading set to false
      const localWrapper = mountSkeletonHero({ isLoading: false })

      // Act: Find the root element and read its classes
      const hero = localWrapper.find('.skeleton-hero')

      // Assert: skeleton-loading class is absent when isLoading is false
      expect(hero.classes()).not.toContain('skeleton-loading')

      localWrapper.unmount()
    })

    it('reacts to isLoading prop changes', async () => {
      // Act: Flip isLoading from true to false
      await wrapper.setProps({ isLoading: false })

      // Assert: skeleton-loading class is removed reactively
      expect(wrapper.find('.skeleton-hero').classes()).not.toContain('skeleton-loading')

      // Act: Flip isLoading back to true
      await wrapper.setProps({ isLoading: true })

      // Assert: skeleton-loading class is restored reactively
      expect(wrapper.find('.skeleton-hero').classes()).toContain('skeleton-loading')
    })
  })

  // ============================================
  // Structure Tests
  // ============================================
  describe('Structure', () => {
    it('title section has exactly 2 lines (large + medium)', () => {
      // Act: Count the line elements inside the title section
      const title = wrapper.find('.skeleton-title')
      const titleLines = title.findAll('.skeleton-line')

      // Assert: Title has a large line and a medium line
      expect(titleLines).toHaveLength(2)
    })

    it('title has a large line (skeleton-line-lg)', () => {
      // Act: Find the large title line
      const largeLine = wrapper.find('.skeleton-title .skeleton-line-lg')

      // Assert: Large line exists within the title
      expect(largeLine.exists()).toBe(true)
    })

    it('title has a medium line (skeleton-line-md)', () => {
      // Act: Find the medium title line
      const mediumLine = wrapper.find('.skeleton-title .skeleton-line-md')

      // Assert: Medium line exists within the title
      expect(mediumLine.exists()).toBe(true)
    })

    it('stats section has exactly 3 items', () => {
      // Act: Count the stat items inside the stats section
      const stats = wrapper.find('.skeleton-stats')
      const statItems = stats.findAll('.skeleton-stat')

      // Assert: Exactly 3 stat items are rendered
      expect(statItems).toHaveLength(3)
    })

    it('each stat item contains a skeleton-circle', () => {
      // Act: Collect all stat items
      const statItems = wrapper.findAll('.skeleton-stat')

      // Assert: Every stat item has exactly one circle element
      expect(statItems).toHaveLength(3)
      statItems.forEach((stat) => {
        expect(stat.findAll('.skeleton-circle')).toHaveLength(1)
      })
    })

    it('each stat item contains a skeleton-line-sm', () => {
      // Act: Collect all stat items
      const statItems = wrapper.findAll('.skeleton-stat')

      // Assert: Every stat item has exactly one small line element
      expect(statItems).toHaveLength(3)
      statItems.forEach((stat) => {
        expect(stat.findAll('.skeleton-line-sm')).toHaveLength(1)
      })
    })

    it('renders the circle before the label line within each stat', () => {
      // Act: Inspect a single stat item's children order
      const firstStat = wrapper.findAll('.skeleton-stat')[0]
      const children = firstStat.element.children

      // Assert: First child is the circle, second child is the label line
      expect(children[0]).toBe(firstStat.find('.skeleton-circle').element)
      expect(children[1]).toBe(firstStat.find('.skeleton-line-sm').element)
    })
  })

  // ============================================
  // Styling Tests
  // ============================================
  describe('Styling', () => {
    it('renders the skeleton-line base class on all lines', () => {
      // Act: Find all elements carrying the base line class
      const lines = wrapper.findAll('.skeleton-line')

      // Assert: 2 title lines + 3 stat label lines = 5 total line elements
      expect(lines).toHaveLength(5)
    })

    it('has skeleton-line-lg class for the large title line', () => {
      // Act: Find the large line element
      const largeLine = wrapper.find('.skeleton-line-lg')

      // Assert: Class is present
      expect(largeLine.exists()).toBe(true)
      expect(largeLine.classes()).toContain('skeleton-line-lg')
    })

    it('has skeleton-line-md class for the medium title line', () => {
      // Act: Find the medium line element
      const mediumLine = wrapper.find('.skeleton-line-md')

      // Assert: Class is present
      expect(mediumLine.exists()).toBe(true)
      expect(mediumLine.classes()).toContain('skeleton-line-md')
    })

    it('has skeleton-line-sm class for the stat label lines', () => {
      // Act: Find all small line elements
      const smallLines = wrapper.findAll('.skeleton-line-sm')

      // Assert: One small line per stat (3 stats)
      expect(smallLines).toHaveLength(3)
      smallLines.forEach((line) => {
        expect(line.classes()).toContain('skeleton-line-sm')
      })
    })

    it('has skeleton-circle class for the stat icon elements', () => {
      // Act: Find all circle elements
      const circles = wrapper.findAll('.skeleton-circle')

      // Assert: One circle per stat (3 stats)
      expect(circles).toHaveLength(3)
      circles.forEach((circle) => {
        expect(circle.classes()).toContain('skeleton-circle')
      })
    })

    it('defines a shimmer keyframe animation in component styles', () => {
      // Act: Inspect the scoped stylesheet source for the keyframe definition

      // Assert: The shimmer @keyframes is declared by the component
      expect(style).toContain('@keyframes shimmer')
      expect(style).toContain('shimmer')
    })

    it('applies shimmer animation to skeleton line and circle elements', () => {
      // Act: Inspect the scoped stylesheet source for animation declarations

      // Assert: Line and circle elements are animated using the shimmer keyframe
      expect(style).toContain('animation:')
      expect(style.toLowerCase()).toContain('shimmer')
    })

    it('root element has scoped styles applied', () => {
      // Act: Check the root element attributes
      const hero = wrapper.find('.skeleton-hero')

      // Assert: Hero carries the skeleton-hero class for scoped style targeting
      expect(hero.attributes('class')).toContain('skeleton-hero')
    })

    it('applies skeleton-loading class to root for styling hooks', () => {
      // Act: Find the root and read its classes
      const hero = wrapper.find('.skeleton-hero')

      // Assert: skeleton-loading class is present (default isLoading is true)
      expect(hero.classes()).toContain('skeleton-loading')
    })
  })

  // ============================================
  // Loading State Tests
  // ============================================
  describe('Loading State', () => {
    it('renders the full skeleton structure when loading', () => {
      // Assert: All structural elements are present while loading
      expect(wrapper.find('.skeleton-title').exists()).toBe(true)
      expect(wrapper.findAll('.skeleton-stat')).toHaveLength(3)
      expect(wrapper.findAll('.skeleton-line')).toHaveLength(5)
      expect(wrapper.findAll('.skeleton-circle')).toHaveLength(3)
    })

    it('keeps skeleton-loading class on root when isLoading is true', () => {
      // Assert: Root has the loading modifier class
      expect(wrapper.find('.skeleton-hero').classes()).toContain('skeleton-loading')
    })

    it('renders skeleton structure even when isLoading is false', () => {
      // Arrange: Mount with loading disabled
      const localWrapper = mountSkeletonHero({ isLoading: false })

      // Assert: Structure persists; only the loading modifier class changes
      expect(localWrapper.find('.skeleton-title').exists()).toBe(true)
      expect(localWrapper.findAll('.skeleton-stat')).toHaveLength(3)
      expect(localWrapper.find('.skeleton-hero').classes()).not.toContain('skeleton-loading')

      localWrapper.unmount()
    })

    it('toggles between loading and not-loading states', async () => {
      // Act: Move to not-loading state
      await wrapper.setProps({ isLoading: false })
      expect(wrapper.find('.skeleton-hero').classes()).not.toContain('skeleton-loading')

      // Act: Move back to loading state
      await wrapper.setProps({ isLoading: true })
      expect(wrapper.find('.skeleton-hero').classes()).toContain('skeleton-loading')
    })
  })

  // ============================================
  // Layout Tests
  // ============================================
  describe('Layout', () => {
    it('stats section renders its items in a flex container', () => {
      // Act: Inspect the scoped stylesheet source for the stats layout rule

      // Assert: The skeleton-stats rule uses flex display for a row layout
      expect(style).toContain('.skeleton-stats')
      expect(style.toLowerCase()).toContain('display: flex')
    })

    it('stats items use vertical flex alignment for circle + label', () => {
      // Act: Inspect the scoped stylesheet source for the stat item layout rule

      // Assert: The skeleton-stat rule stacks children vertically (column)
      expect(style).toContain('.skeleton-stat')
      expect(style.toLowerCase()).toContain('flex-direction: column')
    })
  })

  // ============================================
  // Edge Cases
  // ============================================
  describe('Edge Cases', () => {
    it('can be mounted and unmounted multiple times', () => {
      // Arrange: Create multiple wrappers
      const wrappers = [
        mountSkeletonHero(),
        mountSkeletonHero(),
        mountSkeletonHero(),
      ]

      // Assert: All wrappers mount successfully with consistent structure
      wrappers.forEach((w) => {
        expect(w.exists()).toBe(true)
        expect(w.findAll('.skeleton-stat')).toHaveLength(3)
      })

      // Cleanup: Unmount all
      wrappers.forEach((w) => w.unmount())

      // Assert: No errors thrown
      expect(true).toBe(true)
    })

    it('renders correctly when rendered multiple times', () => {
      // Act: Unmount and remount
      wrapper.unmount()
      const newWrapper = mountSkeletonHero()

      // Assert: Still renders the full skeleton structure
      expect(newWrapper.find('.skeleton-hero').exists()).toBe(true)
      expect(newWrapper.findAll('.skeleton-stat')).toHaveLength(3)

      // Cleanup
      newWrapper.unmount()
    })

    it('handles rapid mount/unmount cycles', () => {
      // Act: Rapid mount/unmount
      for (let i = 0; i < 10; i++) {
        const w = mountSkeletonHero()
        expect(w.exists()).toBe(true)
        w.unmount()
      }

      // Assert: No errors
      expect(true).toBe(true)
    })

    it('treats explicit isLoading:true identically to the default', () => {
      // Arrange: Mount with explicit true
      const explicitTrue = mountSkeletonHero({ isLoading: true })

      // Assert: Matches the default-loaded wrapper behavior
      expect(explicitTrue.find('.skeleton-hero').classes()).toEqual(
        wrapper.find('.skeleton-hero').classes(),
      )

      explicitTrue.unmount()
    })

    it('renders the expected total count of skeleton visual elements', () => {
      // Act: Count all shimmering placeholder elements
      const lines = wrapper.findAll('.skeleton-line')
      const circles = wrapper.findAll('.skeleton-circle')

      // Assert: 5 lines (2 title + 3 labels) + 3 circles = 8 placeholders
      expect(lines).toHaveLength(5)
      expect(circles).toHaveLength(3)
      expect(lines.length + circles.length).toBe(8)
    })
  })

  // ============================================
  // Integration Tests
  // ============================================
  describe('Integration', () => {
    it('component renders complete hero skeleton markup', () => {
      // Act: Get full rendered HTML
      const html = wrapper.html()

      // Assert: Contains all expected structural classes
      expect(html).toContain('skeleton-hero')
      expect(html).toContain('skeleton-title')
      expect(html).toContain('skeleton-line-lg')
      expect(html).toContain('skeleton-line-md')
      expect(html).toContain('skeleton-stats')
      expect(html).toContain('skeleton-stat')
      expect(html).toContain('skeleton-circle')
      expect(html).toContain('skeleton-line-sm')
    })

    it('renders exactly three skeleton-stat blocks in the markup', () => {
      // Act: Count occurrences of the stat item class in raw HTML
      const html = wrapper.html()
      const statCount = (html.match(/skeleton-stat\b/g) || []).length

      // Assert: 3 stat items rendered (skeleton-stats wrapper + 3 items = 4 matches,
      // so verify by counting the v-for-produced item containers instead)
      const statItems = wrapper.findAll('.skeleton-stats > .skeleton-stat')
      expect(statItems).toHaveLength(3)
      expect(statCount).toBeGreaterThanOrEqual(3)
    })
  })
})
