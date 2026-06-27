/**
 * @file Terms.test.ts
 * @description Unit tests for the Terms of Service view
 * @ticket #88 - FEAT-030: Terms of Service Page
 *
 * Test Categories:
 * - Rendering Tests: Component mount and section structure
 * - Content Tests: All legal sections present
 * - Accessibility Tests: Semantic HTML and ARIA
 * - i18n Tests: Translation function behavior
 * - Styling Tests: CSS classes and cyberpunk theme hooks
 *
 * Note: useLanguage() returns the key itself as fallback when no translations
 * are loaded in the test environment, so content assertions check for keys.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import Terms from '../Terms.vue'

describe('Terms.vue', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    wrapper = mount(Terms, {
      global: {},
    })
  })

  afterEach(() => {
    wrapper.unmount()
  })

  // ============================================
  // Rendering Tests
  // ============================================
  describe('Rendering', () => {
    it('should mount without errors', () => {
      expect(wrapper.exists()).toBe(true)
    })

    it('renders the root .terms container', () => {
      expect(wrapper.find('.terms').exists()).toBe(true)
    })

    it('renders a hero section', () => {
      expect(wrapper.find('.terms-hero').exists()).toBe(true)
    })

    it('renders a content section', () => {
      expect(wrapper.find('.terms-content').exists()).toBe(true)
    })

    it('renders the page title as h1', () => {
      const h1 = wrapper.find('.page-title')
      expect(h1.exists()).toBe(true)
      expect(h1.element.tagName.toLowerCase()).toBe('h1')
    })
  })

  // ============================================
  // Section Structure (legal coverage)
  // ============================================
  describe('Section Structure', () => {
    it('renders all required content sections', () => {
      // intro, acceptance, responsibilities, liability, ip, termination,
      // dispute, governing, contact => 9
      expect(wrapper.findAll('.content-block').length).toBeGreaterThanOrEqual(8)
    })

    it('renders an introduction section', () => {
      expect(wrapper.text()).toContain('terms.intro.heading')
    })

    it('renders an acceptance of terms section', () => {
      expect(wrapper.text()).toContain('terms.acceptance.heading')
    })

    it('renders a user responsibilities section', () => {
      expect(wrapper.text()).toContain('terms.responsibilities.heading')
    })

    it('renders a limitation of liability section', () => {
      expect(wrapper.text()).toContain('terms.liability.heading')
    })

    it('renders an intellectual property section', () => {
      expect(wrapper.text()).toContain('terms.ip.heading')
    })

    it('renders a termination section', () => {
      expect(wrapper.text()).toContain('terms.termination.heading')
    })

    it('renders a dispute resolution section', () => {
      expect(wrapper.text()).toContain('terms.dispute.heading')
    })

    it('renders a governing law section', () => {
      expect(wrapper.text()).toContain('terms.governing.heading')
    })

    it('renders a contact section', () => {
      expect(wrapper.text()).toContain('terms.contact.heading')
    })

    it('renders a last-updated meta line', () => {
      expect(wrapper.find('.page-meta').exists()).toBe(true)
      expect(wrapper.text()).toContain('terms.lastUpdated')
    })
  })

  // ============================================
  // Content Lists Coverage
  // ============================================
  describe('Content Lists', () => {
    it('renders item lists for sectioned blocks', () => {
      const itemLists = wrapper.findAll('.item-list')
      expect(itemLists.length).toBeGreaterThanOrEqual(3)
    })

    it('renders at least one note where applicable', () => {
      const notes = wrapper.findAll('.note')
      expect(notes.length).toBeGreaterThanOrEqual(1)
    })
  })

  // ============================================
  // Accessibility Tests
  // ============================================
  describe('Accessibility', () => {
    it('uses exactly one h1 for the page title', () => {
      expect(wrapper.findAll('h1')).toHaveLength(1)
    })

    it('uses h2 for section headings', () => {
      const h2s = wrapper.findAll('.content-block h2')
      expect(h2s.length).toBeGreaterThanOrEqual(8)
      h2s.forEach((h2) => {
        expect(h2.element.tagName.toLowerCase()).toBe('h2')
      })
    })

    it('marks the disclaimer with a note role', () => {
      const disclaimer = wrapper.find('.disclaimer')
      expect(disclaimer.exists()).toBe(true)
      expect(disclaimer.attributes('role')).toBe('note')
    })

    it('uses unordered lists for grouped items', () => {
      const lists = wrapper.findAll('ul.item-list')
      expect(lists.length).toBeGreaterThanOrEqual(3)
    })
  })

  // ============================================
  // Styling / Theme Tests
  // ============================================
  describe('Styling', () => {
    it('applies accent class for the badge', () => {
      expect(wrapper.find('.page-title .accent').exists()).toBe(true)
    })

    it('applies contact-line class for contact details', () => {
      expect(wrapper.findAll('.contact-line').length).toBeGreaterThanOrEqual(2)
    })

    it('renders item list items with strong titles where applicable', () => {
      const items = wrapper.findAll('.item-list li strong')
      expect(items.length).toBeGreaterThan(0)
    })
  })

  // ============================================
  // i18n Tests
  // ============================================
  describe('Internationalization', () => {
    it('exposes a translation function on the component instance', () => {
      expect(typeof (wrapper.vm as any).t).toBe('function')
    })

    it('returns the key as fallback when translation is not loaded', () => {
      const result = (wrapper.vm as any).t('terms.title')
      expect(result).toBe('terms.title')
    })

    it('translates the accent key', () => {
      const result = (wrapper.vm as any).t('terms.titleAccent')
      expect(result).toBe('terms.titleAccent')
    })
  })

  // ============================================
  // Edge Cases
  // ============================================
  describe('Edge Cases', () => {
    it('can be mounted and unmounted without errors', () => {
      const w = mount(Terms)
      expect(w.exists()).toBe(true)
      w.unmount()
      expect(true).toBe(true)
    })

    it('renders consistently across multiple mounts', () => {
      const w1 = mount(Terms)
      const w2 = mount(Terms)
      expect(w1.findAll('.content-block').length).toBe(
        w2.findAll('.content-block').length,
      )
      w1.unmount()
      w2.unmount()
    })
  })
})
