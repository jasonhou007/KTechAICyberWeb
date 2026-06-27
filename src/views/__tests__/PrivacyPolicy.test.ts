/**
 * @file PrivacyPolicy.test.ts
 * @description Unit tests for the Privacy Policy view
 * @ticket #87 - FEAT-029: Privacy Policy Page with GDPR Compliance
 *
 * Test Categories:
 * - Rendering Tests: Component mount and section structure
 * - Content Tests: All GDPR sections present
 * - Accessibility Tests: Semantic HTML and ARIA
 * - i18n Tests: Translation function behavior
 * - Styling Tests: CSS classes and cyberpunk theme hooks
 *
 * Note: useLanguage() returns the key itself as fallback when no translations
 * are loaded in the test environment, so content assertions check for keys.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import PrivacyPolicy from '../PrivacyPolicy.vue'

describe('PrivacyPolicy.vue', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    wrapper = mount(PrivacyPolicy, {
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

    it('renders the root .privacy container', () => {
      expect(wrapper.find('.privacy').exists()).toBe(true)
    })

    it('renders a hero section', () => {
      expect(wrapper.find('.privacy-hero').exists()).toBe(true)
    })

    it('renders a content section', () => {
      expect(wrapper.find('.privacy-content').exists()).toBe(true)
    })

    it('renders the page title as h1', () => {
      const h1 = wrapper.find('.page-title')
      expect(h1.exists()).toBe(true)
      expect(h1.element.tagName.toLowerCase()).toBe('h1')
    })
  })

  // ============================================
  // Section Structure (GDPR coverage)
  // ============================================
  describe('Section Structure', () => {
    it('renders all eight required content sections', () => {
      // intro, collection, cookies, use, rights, retention, thirdParty, contact
      expect(wrapper.findAll('.content-block').length).toBeGreaterThanOrEqual(8)
    })

    it('renders an introduction section', () => {
      expect(wrapper.text()).toContain('Introduction')
    })

    it('renders an information collection section', () => {
      expect(wrapper.text()).toContain('Information We Collect')
    })

    it('renders a cookie policy section', () => {
      expect(wrapper.text()).toContain('Cookie Policy')
    })

    it('renders a data use section', () => {
      expect(wrapper.text()).toContain('How We Use Your Data')
    })

    it('renders a GDPR user rights section', () => {
      expect(wrapper.text()).toContain('Your Rights (GDPR / CCPA)')
    })

    it('renders a data retention section', () => {
      expect(wrapper.text()).toContain('Data Retention')
    })

    it('renders a third-party services section', () => {
      expect(wrapper.text()).toContain('Third-Party Services')
    })

    it('renders a contact section', () => {
      expect(wrapper.text()).toContain('Contact Us')
    })

    it('renders a last-updated meta line', () => {
      expect(wrapper.find('.page-meta').exists()).toBe(true)
      expect(wrapper.text()).toContain('Last updated:')
    })
  })

  // ============================================
  // GDPR Rights Coverage
  // ============================================
  describe('GDPR Rights', () => {
    it('lists all six GDPR rights', () => {
      const text = wrapper.text()
      expect(text).toContain('Right of Access')
      expect(text).toContain('Right to Rectification')
      expect(text).toContain('Right to Erasure')
      expect(text).toContain('Right to Data Portability')
      expect(text).toContain('Right to Object')
      expect(text).toContain('Right to Restrict Processing')
    })

    it('includes a note on how to exercise rights', () => {
      expect(wrapper.find('.note').exists()).toBe(true)
      // The bundled exerciseNote resolves to real copy mentioning the contact email.
      expect(wrapper.text()).toContain('privacy@ktech.fintech')
    })

    it('renders item lists for each sectioned block', () => {
      const itemLists = wrapper.findAll('.item-list')
      // collection, cookies, use, rights, thirdParty => 5 item lists
      expect(itemLists.length).toBeGreaterThanOrEqual(5)
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
      expect(lists.length).toBeGreaterThanOrEqual(5)
    })
  })

  // ============================================
  // Styling / Theme Tests
  // ============================================
  describe('Styling', () => {
    it('applies accent class for the GDPR badge', () => {
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

    it('returns the key as fallback for a genuinely-missing key', () => {
      const result = (wrapper.vm as any).t('privacy.this.key.does.not.exist')
      expect(result).toBe('privacy.this.key.does.not.exist')
    })

    it('translates the title and GDPR accent keys to real English copy', () => {
      expect((wrapper.vm as any).t('privacy.title')).toBe('Privacy Policy')
      expect((wrapper.vm as any).t('privacy.titleAccent')).toBe('GDPR Compliant')
    })
  })

  // ============================================
  // Edge Cases
  // ============================================
  describe('Edge Cases', () => {
    it('can be mounted and unmounted without errors', () => {
      const w = mount(PrivacyPolicy)
      expect(w.exists()).toBe(true)
      w.unmount()
      expect(true).toBe(true)
    })

    it('renders consistently across multiple mounts', () => {
      const w1 = mount(PrivacyPolicy)
      const w2 = mount(PrivacyPolicy)
      expect(w1.findAll('.content-block').length).toBe(
        w2.findAll('.content-block').length,
      )
      w1.unmount()
      w2.unmount()
    })
  })
})
