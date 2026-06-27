/**
 * @file Footer.test.ts
 * @description Comprehensive unit tests for Footer component
 * @ticket #89 - TEST-022: Footer Component Unit Tests - TDD with Vitest
 *
 * Test Categories:
 * - Rendering Tests: Component mount and HTML structure
 * - Content Tests: Text content verification
 * - Accessibility Tests: Semantic HTML and ARIA
 * - Styling Tests: CSS classes and responsive design
 * - i18n Tests: Translation function behavior
 * - Edge Cases: Component lifecycle and multiple renders
 *
 * TDD Approach:
 * 1. Red: Tests written to define expected behavior
 * 2. Green: Component implementation makes tests pass
 * 3. Refactor: Test code optimized for clarity and maintainability
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import Footer from '../Footer.vue'

describe('Footer.vue', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    // Arrange: Create a fresh wrapper for each test
    wrapper = mount(Footer, {
      global: {
        // Provide globals if needed
      },
    })
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

    it('renders footer tag with correct class', () => {
      // Act: Find the footer element
      const footer = wrapper.find('footer.footer')

      // Assert: Semantic footer element exists with correct class
      expect(footer.exists()).toBe(true)
    })

    it('renders two child div elements', () => {
      // Act: Get all div elements in footer
      const footer = wrapper.find('footer')
      const divs = footer.findAll('div')

      // Assert: Should have exactly 2 divs (company name + copyright)
      expect(divs).toHaveLength(2)
    })

    it('renders component structure correctly', () => {
      // Act: Find footer and its children
      const footer = wrapper.find('footer.footer')
      const footerText = footer.find('.footer-text')
      const footerCopyright = footer.find('.footer-copyright')

      // Assert: Structure is correct
      expect(footer.exists()).toBe(true)
      expect(footerText.exists()).toBe(true)
      expect(footerCopyright.exists()).toBe(true)
    })
  })

  // ============================================
  // Content Tests
  // ============================================
  describe('Content', () => {
    it('displays company name correctly', () => {
      // Act: Get the full text content
      const text = wrapper.text()

      // Assert: Company name is present
      expect(text).toContain('开泰远景信息科技有限公司')
    })

    it('displays copyright information correctly', () => {
      // Act: Get the full text content
      const text = wrapper.text()

      // Assert: Copyright text is present
      expect(text).toContain('© 2026 KTech Fintech. All rights reserved.')
    })

    it('renders company name in footer-text div', () => {
      // Act: Find the company name element
      const companyNameEl = wrapper.find('.footer-text')

      // Assert: Element exists and contains correct text
      expect(companyNameEl.exists()).toBe(true)
      expect(companyNameEl.text()).toBe('开泰远景信息科技有限公司')
    })

    it('renders copyright in footer-copyright div', () => {
      // Act: Find the copyright element
      const copyrightEl = wrapper.find('.footer-copyright')

      // Assert: Element exists and contains correct text
      expect(copyrightEl.exists()).toBe(true)
      expect(copyrightEl.text()).toBe('© 2026 KTech Fintech. All rights reserved.')
    })

    it('has no leading or trailing whitespace in text content', () => {
      // Act: Get text elements
      const companyNameEl = wrapper.find('.footer-text')
      const copyrightEl = wrapper.find('.footer-copyright')

      // Assert: No extra whitespace
      expect(companyNameEl.text()).toBe('开泰远景信息科技有限公司')
      expect(copyrightEl.text()).toBe('© 2026 KTech Fintech. All rights reserved.')
    })
  })

  // ============================================
  // Accessibility Tests
  // ============================================
  describe('Accessibility', () => {
    it('uses semantic footer HTML5 tag', () => {
      // Act: Find footer element
      const footer = wrapper.find('footer')

      // Assert: Semantic HTML5 footer tag is used
      expect(footer.exists()).toBe(true)
      expect(footer.element.tagName.toLowerCase()).toBe('footer')
    })

    it('has descriptive CSS class for styling hooks', () => {
      // Act: Check for footer class
      const footer = wrapper.find('footer.footer')

      // Assert: Footer has class for CSS targeting
      expect(footer.exists()).toBe(true)
      expect(footer.classes()).toContain('footer')
    })

    it('maintains readable text structure', () => {
      // Act: Get text content
      const text = wrapper.text()

      // Assert: Text is readable and structured
      expect(text.length).toBeGreaterThan(0)
      expect(text).not.toBe('\n')
    })
  })

  // ============================================
  // Styling Tests
  // ============================================
  describe('Styling', () => {
    it('applies correct CSS classes to all elements', () => {
      // Act: Find elements by class
      const footer = wrapper.find('.footer')
      const footerText = wrapper.find('.footer-text')
      const footerCopyright = wrapper.find('.footer-copyright')

      // Assert: All CSS classes are present
      expect(footer.exists()).toBe(true)
      expect(footerText.exists()).toBe(true)
      expect(footerCopyright.exists()).toBe(true)
    })

    it('has text class for company name', () => {
      // Act: Find footer-text element
      const footerText = wrapper.find('.footer-text')

      // Assert: Element has correct class
      expect(footerText.exists()).toBe(true)
      expect(footerText.classes()).toContain('footer-text')
    })

    it('has copyright class for copyright text', () => {
      // Act: Find footer-copyright element
      const footerCopyright = wrapper.find('.footer-copyright')

      // Assert: Element has correct class
      expect(footerCopyright.exists()).toBe(true)
      expect(footerCopyright.classes()).toContain('footer-copyright')
    })

    it('footer element has scoped styles applied', () => {
      // Act: Check footer element
      const footer = wrapper.find('footer.footer')

      // Assert: Footer has class for scoped styles
      expect(footer.attributes('class')).toContain('footer')
    })
  })

  // ============================================
  // i18n Tests
  // ============================================
  describe('Internationalization', () => {
    it('translates company name key correctly', () => {
      // Act: Call translation function
      const result = wrapper.vm.t('footer.companyName')

      // Assert: Returns correct Chinese text
      expect(result).toBe('开泰远景信息科技有限公司')
    })

    it('translates copyright key correctly', () => {
      // Act: Call translation function
      const result = wrapper.vm.t('footer.copyright')

      // Assert: Returns correct copyright text
      expect(result).toBe('© 2026 KTech Fintech. All rights reserved.')
    })

    it('returns key when translation is not found', () => {
      // Act: Call with non-existent key
      const result = wrapper.vm.t('nonexistent.key')

      // Assert: Returns the key itself as fallback
      expect(result).toBe('nonexistent.key')
    })

    it('handles empty key gracefully', () => {
      // Act: Call with empty key
      const result = wrapper.vm.t('')

      // Assert: Returns empty string
      expect(result).toBe('')
    })

    it('handles special characters in keys', () => {
      // Act: Call with special character key
      const result = wrapper.vm.t('key.with.dots')

      // Assert: Returns the key when not found
      expect(result).toBe('key.with.dots')
    })

    it('handles numeric-like keys', () => {
      // Act: Call with numeric key
      const result = wrapper.vm.t('footer.123')

      // Assert: Returns the key when not found
      expect(result).toBe('footer.123')
    })
  })

  // ============================================
  // Edge Cases
  // ============================================
  describe('Edge Cases', () => {
    it('can be mounted and unmounted multiple times', () => {
      // Arrange: Create multiple wrappers
      const wrappers = [
        mount(Footer),
        mount(Footer),
        mount(Footer),
      ]

      // Assert: All wrappers mount successfully
      wrappers.forEach((w) => {
        expect(w.exists()).toBe(true)
        expect(w.text()).toContain('开泰远景信息科技有限公司')
      })

      // Cleanup: Unmount all
      wrappers.forEach((w) => w.unmount())

      // Assert: No errors thrown
      expect(true).toBe(true)
    })

    it('renders correctly when rendered multiple times', () => {
      // Act: Unmount and remount
      wrapper.unmount()
      const newWrapper = mount(Footer)

      // Assert: Still renders correctly
      expect(newWrapper.text()).toContain('开泰远景信息科技有限公司')
      expect(newWrapper.text()).toContain('© 2026 KTech Fintech')

      // Cleanup
      newWrapper.unmount()
    })

    it('handles rapid mount/unmount cycles', () => {
      // Act: Rapid mount/unmount
      for (let i = 0; i < 10; i++) {
        const w = mount(Footer)
        expect(w.exists()).toBe(true)
        w.unmount()
      }

      // Assert: No errors
      expect(true).toBe(true)
    })
  })

  // ============================================
  // Component Structure
  // ============================================
  describe('Component Structure', () => {
    it('has correct DOM hierarchy', () => {
      // Act: Build expected hierarchy
      const footer = wrapper.find('footer.footer')
      const footerText = footer.find('.footer-text')
      const footerCopyright = footer.find('.footer-copyright')

      // Assert: Correct parent-child relationships
      expect(footer.exists()).toBe(true)
      expect(footerText.exists()).toBe(true)
      expect(footerCopyright.exists()).toBe(true)
    })

    it('footer-text element contains company name', () => {
      // Act: Get element
      const footerText = wrapper.find('.footer-text')

      // Assert: Contains only company name
      expect(footerText.text()).toBe('开泰远景信息科技有限公司')
    })

    it('footer-copyright element contains copyright', () => {
      // Act: Get element
      const footerCopyright = wrapper.find('.footer-copyright')

      // Assert: Contains only copyright text
      expect(footerCopyright.text()).toBe('© 2026 KTech Fintech. All rights reserved.')
    })

    it('has correct number of child elements', () => {
      // Act: Count direct children
      const footer = wrapper.find('footer')
      const children = footer.findAll('div')

      // Assert: Exactly 2 div children
      expect(children.length).toBe(2)
    })
  })

  // ============================================
  // Integration Tests
  // ============================================
  describe('Integration', () => {
    it('translation function is accessible from component instance', () => {
      // Act: Access vm
      const vm = wrapper.vm

      // Assert: t function exists
      expect(typeof vm.t).toBe('function')
    })

    it('component renders complete footer content', () => {
      // Act: Get full content
      const html = wrapper.html()

      // Assert: Contains all expected elements
      expect(html).toContain('footer')
      expect(html).toContain('footer-text')
      expect(html).toContain('footer-copyright')
      expect(html).toContain('开泰远景信息科技有限公司')
      expect(html).toContain('© 2026 KTech Fintech')
    })
  })
})
