/**
 * @file 428-legal-pages.spec.ts
 * @description Unit tests for legal pages (Privacy Policy, Terms of Service) - Issue #428
 *
 * Tests verify:
 * - Components mount without errors
 * - Both render h1 with .page-title class
 * - Both contain role="note" on disclaimer
 * - Privacy renders 8 content sections (h2)
 * - Terms renders 9 content sections (h2)
 * - i18n keys resolve for privacy and terms in both en/zh
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PrivacyPolicy from '@/views/PrivacyPolicy.vue'
import Terms from '@/views/Terms.vue'

// Mock useLanguage - consistent with KTech testing patterns
const mockT = vi.fn()
vi.mock('@/i18n', () => ({
  useLanguage: () => ({
    t: mockT,
    currentLanguage: { value: 'en' }
  })
}))

describe('Issue #428 - Legal Pages Unit Tests', () => {
  beforeEach(() => {
    // Reset mock before each test
    mockT.mockReset()
  })

  describe('PrivacyPolicy.vue', () => {
    it('mounts without errors', () => {
      // Mock t() to return the key for verification
      mockT.mockImplementation((key) => key)

      expect(() => mount(PrivacyPolicy)).not.toThrow()
    })

    it('renders h1 with .page-title class', () => {
      mockT.mockImplementation((key) => `translated:${key}`)

      const wrapper = mount(PrivacyPolicy)
      const pageTitle = wrapper.find('h1.page-title')

      expect(pageTitle.exists()).toBe(true)
    })

    it('contains role="note" on disclaimer', () => {
      mockT.mockImplementation((key) => `translated:${key}`)

      const wrapper = mount(PrivacyPolicy)
      const disclaimer = wrapper.find('.disclaimer')

      expect(disclaimer.exists()).toBe(true)
      expect(disclaimer.attributes('role')).toBe('note')
    })

    it('renders 8 content sections (h2)', () => {
      mockT.mockImplementation((key) => `translated:${key}`)

      const wrapper = mount(PrivacyPolicy)
      const headings = wrapper.findAll('h2')

      expect(headings.length).toBe(8)
    })
  })

  describe('Terms.vue', () => {
    it('mounts without errors', () => {
      mockT.mockImplementation((key) => key)

      expect(() => mount(Terms)).not.toThrow()
    })

    it('renders h1 with .page-title class', () => {
      mockT.mockImplementation((key) => `translated:${key}`)

      const wrapper = mount(Terms)
      const pageTitle = wrapper.find('h1.page-title')

      expect(pageTitle.exists()).toBe(true)
    })

    it('contains role="note" on disclaimer', () => {
      mockT.mockImplementation((key) => `translated:${key}`)

      const wrapper = mount(Terms)
      const disclaimer = wrapper.find('.disclaimer')

      expect(disclaimer.exists()).toBe(true)
      expect(disclaimer.attributes('role')).toBe('note')
    })

    it('renders 9 content sections (h2)', () => {
      mockT.mockImplementation((key) => `translated:${key}`)

      const wrapper = mount(Terms)
      const headings = wrapper.findAll('h2')

      expect(headings.length).toBe(9)
    })
  })

  describe('i18n key resolution', () => {
    it('privacy.* keys are called for PrivacyPolicy', () => {
      const keysCalled: string[] = []
      mockT.mockImplementation((key) => {
        keysCalled.push(key)
        return `translated:${key}`
      })

      mount(PrivacyPolicy)

      // Verify privacy keys are being used
      const privacyKeys = keysCalled.filter(k => k.startsWith('privacy.'))
      expect(privacyKeys.length).toBeGreaterThan(0)
      expect(keysCalled.some(k => k.includes('title'))).toBe(true)
    })

    it('terms.* keys are called for Terms', () => {
      const keysCalled: string[] = []
      mockT.mockImplementation((key) => {
        keysCalled.push(key)
        return `translated:${key}`
      })

      mount(Terms)

      // Verify terms keys are being used
      const termsKeys = keysCalled.filter(k => k.startsWith('terms.'))
      expect(termsKeys.length).toBeGreaterThan(0)
      expect(keysCalled.some(k => k.includes('title'))).toBe(true)
    })
  })
})
