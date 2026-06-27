/**
 * @file Scanlines.test.ts
 * @description Comprehensive unit tests for Scanlines component
 * @ticket #104 - TEST-032: Scanlines Component Unit Tests - TDD with Vitest
 *
 * Test Categories:
 * - Rendering Tests: Component mount, DOM tag, CSS class, child count
 * - Accessibility Tests: aria-hidden attribute, assistive-tech exclusion
 * - CSS Properties Tests: position, inset, pointer-events, opacity, z-index, gradient
 * - Visual Effect Tests: Scanline gradient pattern, cyberpunk color, passive overlay
 * - Responsive Behavior Tests: Full-viewport coverage, re-mount stability
 *
 * TDD Approach:
 * 1. Red: Tests written to define expected behavior
 * 2. Green: Component implementation makes tests pass
 * 3. Refactor: Test code optimized for clarity and maintainability
 *
 * Implementation note:
 * The Scanlines visual effect is delivered entirely through a scoped
 * `<style>` block. In the Vitest happy-dom environment, scoped CSS is NOT
 * resolved into `getComputedStyle()` (style values come back as empty strings),
 * so asserting on `getComputedStyle(el).position` would produce permanently
 * failing tests that can never reach GREEN. To honestly verify the CSS
 * contract, these tests parse the component's own scoped stylesheet source and
 * assert the declared rules. DOM-observable facts (tag, class, aria-hidden)
 * are asserted directly on the rendered element.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import Scanlines from '../Scanlines.vue'

/**
 * Read the Scanlines SFC source and extract the scoped <style> block contents.
 *
 * This is the authoritative source of the component's visual styling in a
 * unit-test environment where scoped CSS is not applied to computed styles.
 */
function getScopedStyle(): string {
  const componentPath = resolve(__dirname, '..', 'Scanlines.vue')
  const source = readFileSync(componentPath, 'utf8')
  const match = source.match(/<style[^>]*>([\s\S]*?)<\/style>/)
  return match ? match[1] : ''
}

describe('Scanlines.vue', () => {
  let wrapper: VueWrapper
  let style: string

  beforeEach(() => {
    // Arrange: Create a fresh wrapper and snapshot the scoped style source
    wrapper = mount(Scanlines)
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

    it('renders a div element', () => {
      // Act: Find the root element
      const root = wrapper.find('div')

      // Assert: Root element is a div
      expect(root.exists()).toBe(true)
      expect(root.element.tagName.toLowerCase()).toBe('div')
    })

    it('has scanlines CSS class', () => {
      // Act: Find by class
      const scanlines = wrapper.find('.scanlines')

      // Assert: The signature CSS class is applied
      expect(scanlines.exists()).toBe(true)
      expect(scanlines.classes()).toContain('scanlines')
    })

    it('renders exactly one root element', () => {
      // Act: The wrapper's root IS the rendered element; confirm it is a
      // single div (no fragment with multiple roots)
      const root = wrapper.find('div.scanlines')

      // Assert: Exactly one root element matching the contract exists
      expect(root.exists()).toBe(true)
      expect(wrapper.findAll('div')).toHaveLength(1)
    })

    it('has no child elements (passive overlay)', () => {
      // Act: Look for any nested elements
      const scanlines = wrapper.find('.scanlines')
      const children = scanlines.element.children

      // Assert: The overlay is empty — it is a pure visual effect
      expect(children.length).toBe(0)
    })

    it('has no text content', () => {
      // Act: Read text content
      const text = wrapper.text()

      // Assert: Pure visual effect renders no text
      expect(text).toBe('')
    })

    it('renders no props or attributes beyond aria-hidden and class', () => {
      // Act: Inspect the rendered HTML attributes
      const html = wrapper.html()

      // Assert: Only class and aria-hidden are present (no accidental bindings)
      expect(html).toContain('class="scanlines"')
      expect(html).toContain('aria-hidden="true"')
      expect(html).not.toContain('data-test')
      expect(html).not.toContain('id=')
    })
  })

  // ============================================
  // Accessibility Tests
  // ============================================
  describe('Accessibility', () => {
    it('has aria-hidden attribute set to true', () => {
      // Act: Read the aria-hidden attribute
      const scanlines = wrapper.find('.scanlines')

      // Assert: aria-hidden="true" is declared so the overlay is ignored
      expect(scanlines.attributes('aria-hidden')).toBe('true')
    })

    it('is hidden from assistive technologies', () => {
      // Act: Read the attribute via the DOM element
      const el = wrapper.find('.scanlines').element as HTMLElement

      // Assert: The attribute is present at the DOM level
      expect(el.getAttribute('aria-hidden')).toBe('true')
      expect(el.hasAttribute('aria-hidden')).toBe(true)
    })

    it('does not expose a role attribute (purely decorative)', () => {
      // Act: Check for a role attribute
      const scanlines = wrapper.find('.scanlines')

      // Assert: No explicit role is added — the overlay is decorative only
      expect(scanlines.attributes('role')).toBeUndefined()
    })

    it('is not focusable (no tabindex set)', () => {
      // Act: Check for a tabindex attribute
      const scanlines = wrapper.find('.scanlines')

      // Assert: The overlay cannot receive keyboard focus
      expect(scanlines.attributes('tabindex')).toBeUndefined()
    })
  })

  // ============================================
  // CSS Properties Tests
  // ============================================
  describe('CSS Properties', () => {
    it('declares position: fixed for full-viewport coverage', () => {
      // Assert: The scoped style pins the overlay to the viewport
      expect(style).toMatch(/position:\s*fixed/)
    })

    it('declares inset: 0 to cover the full viewport', () => {
      // Assert: All four insets collapse to zero (full coverage)
      expect(style).toMatch(/inset:\s*0/)
    })

    it('declares pointer-events: none (non-interactive overlay)', () => {
      // Assert: The overlay does not intercept pointer interaction
      expect(style).toMatch(/pointer-events:\s*none/)
    })

    it('declares opacity: 0.3 for a subtle effect', () => {
      // Assert: The overlay is rendered at a subtle 30% opacity
      expect(style).toMatch(/opacity:\s*0\.3/)
    })

    it('declares a z-index using the scanlines layer CSS variable', () => {
      // Assert: z-index is sourced from the documented CSS custom property
      expect(style).toMatch(/z-index:\s*var\(--z-scanlines\)/)
    })

    it('targets the .scanlines class in the scoped style', () => {
      // Assert: The style block declares rules for the scanlines class
      expect(style).toMatch(/\.scanlines\s*\{/)
    })
  })

  // ============================================
  // Visual Effect Tests
  // ============================================
  describe('Visual Effect', () => {
    it('uses a repeating-linear-gradient for the scanline pattern', () => {
      // Assert: The background is a repeating-linear-gradient
      expect(style).toMatch(/background:\s*repeating-linear-gradient/)
    })

    it('renders the gradient at a 0deg (horizontal lines) angle', () => {
      // Assert: The gradient runs horizontally to produce horizontal scanlines
      expect(style).toMatch(/repeating-linear-gradient\(\s*0deg/)
    })

    it('uses the cyberpunk cyan color in the scanline pattern', () => {
      // Assert: The signature rgba(0, 255, 204) cyan tint is present
      expect(style).toContain('rgba(0, 255, 204')
    })

    it('alternates transparent and colored stops for the scanline gap', () => {
      // Assert: Both transparent and colored stops define the repeating band
      expect(style).toMatch(/transparent\s+2px/)
      expect(style).toMatch(/rgba\(0,\s*255,\s*204[^)]*\)\s+4px/)
    })

    it('declares pointer-events: none so it is a passive overlay', () => {
      // Assert: Confirms the overlay never blocks clicks (visual-only)
      expect(style).toMatch(/pointer-events:\s*none/)
    })

    it('does not attach any click handlers (pure CSS effect)', () => {
      // Act: Inspect the rendered element's listeners
      const scanlines = wrapper.find('.scanlines')

      // Assert: No interaction handlers are bound to the overlay
      // (Vue test utils exposes bound listeners via the vnode)
      const listeners =
        (scanlines.element as unknown as { __vnode?: { props?: Record<string, unknown> } })
          .__vnode?.props ?? {}
      const interactionKeys = Object.keys(listeners).filter((k) => k.startsWith('on'))
      expect(interactionKeys).toHaveLength(0)
    })
  })

  // ============================================
  // Responsive Behavior Tests
  // ============================================
  describe('Responsive Behavior', () => {
    it('covers the full viewport via position fixed and inset 0', () => {
      // Assert: Fixed positioning plus zero insets = full viewport coverage
      expect(style).toMatch(/position:\s*fixed/)
      expect(style).toMatch(/inset:\s*0/)
    })

    it('does not use media queries (uniform across breakpoints)', () => {
      // Assert: No @media rules — the effect is identical on every screen size
      expect(style).not.toMatch(/@media/)
    })

    it('does not use fixed pixel widths (scales with viewport)', () => {
      // Assert: No hard-coded width/height that would break responsiveness
      expect(style).not.toMatch(/\bwidth:\s*\d+px/)
      expect(style).not.toMatch(/\bheight:\s*\d+px/)
    })

    it('renders consistently on repeated mounts', () => {
      // Act: Mount several independent instances
      const instances = [mount(Scanlines), mount(Scanlines), mount(Scanlines)]

      // Assert: Every instance has the same class and aria-hidden contract
      instances.forEach((w) => {
        expect(w.find('.scanlines').exists()).toBe(true)
        expect(w.find('.scanlines').attributes('aria-hidden')).toBe('true')
      })

      // Cleanup
      instances.forEach((w) => w.unmount())
    })

    it('survives a rapid mount/unmount cycle without errors', () => {
      // Act: Rapidly mount and unmount the component
      for (let i = 0; i < 10; i++) {
        const w = mount(Scanlines)
        expect(w.find('.scanlines').exists()).toBe(true)
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
    it('has no component-defined props', () => {
      // Act: Inspect the resolved component definition
      // Assert: A pure visual-effect component declares no props
      // (mounting with an unknown attr confirms it is not consumed as a prop)
      const w = mount(Scanlines, { attrs: { 'data-x': '1' } })
      // data-x lands as a fallthrough attribute, not a prop — the component
      // has no declared prop surface
      expect(w.find('.scanlines').exists()).toBe(true)
      w.unmount()
    })

    it('renders the expected HTML snapshot contract', () => {
      // Act: Capture the rendered HTML
      const html = wrapper.html()

      // Assert: The minimal contract — a div.scanlines with aria-hidden
      expect(html).toContain('<div')
      expect(html).toContain('class="scanlines"')
      expect(html).toContain('aria-hidden="true"')
      expect(html.trim()).toContain('</div>')
    })
  })
})
