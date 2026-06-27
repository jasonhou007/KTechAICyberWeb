/**
 * @file Honors.test.ts
 * @description Unit tests for the Honors section component
 *
 * Test Categories:
 * - Rendering Tests: section container, skeleton-vs-content states, honor count
 * - Content Tests: title/subtitle, per-honor emoji icon, title, description
 *   (Honors now resolves copy through the shared useLanguage() composable, so
 *   in the default English locale these assertions check real en.json copy)
 * - Accessibility Tests: section id, aria-hidden on decorative icons, h2/h4
 *   heading hierarchy
 * - Behavior Tests: skeleton shows while loading, content shows once loaded,
 *   skeleton honors the passed count
 * - Edge Cases: re-mount consistency
 *
 * Honors uses useSkeleton({ immediate: false }). isLoading starts true and the
 * component never sets the observer target, so under real semantics the
 * skeleton persists forever. To exercise BOTH branches deterministically we
 * mock the resolved useSkeleton module and toggle isLoading between tests.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { ref } from 'vue'
import Honors from '../Honors.vue'
import SkeletonHonors from '../SkeletonHonors.vue'

// Shared, controllable loading state. Tests flip this between skeleton and
// content render paths.
const mockIsLoading = ref(true)

// From src/components/__tests__/, the composable lives at ../../composables.
vi.mock('../../composables/useSkeleton', () => ({
  useSkeleton: vi.fn(() => ({
    isLoading: mockIsLoading,
    isVisible: ref(false),
    target: ref(null),
    hasLoaded: ref(false),
  })),
}))

describe('Honors.vue', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    mockIsLoading.value = true
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  // ============================================
  // Skeleton (loading) state
  // ============================================
  describe('Skeleton State', () => {
    it('renders the section root with id="honors"', () => {
      wrapper = mount(Honors)
      expect(wrapper.find('section.honors').exists()).toBe(true)
      expect(wrapper.find('section#honors').exists()).toBe(true)
    })

    it('renders the SkeletonHonors child while loading', () => {
      wrapper = mount(Honors)
      expect(wrapper.findComponent(SkeletonHonors).exists()).toBe(true)
      expect(wrapper.find('.skeleton-honors').exists()).toBe(true)
    })

    it('does not render the content wrapper while loading', () => {
      wrapper = mount(Honors)
      expect(wrapper.find('.content-wrapper').exists()).toBe(false)
    })

    it('passes the honors count to the skeleton for placeholder rendering', () => {
      wrapper = mount(Honors)
      const skeleton = wrapper.findComponent(SkeletonHonors)
      expect(skeleton.props('count')).toBe(8)
      // The skeleton renders one placeholder per count.
      expect(wrapper.findAll('.skeleton-badge')).toHaveLength(8)
    })
  })

  // ============================================
  // Content (loaded) state
  // ============================================
  describe('Content State', () => {
    beforeEach(() => {
      mockIsLoading.value = false
      wrapper = mount(Honors)
    })

    it('renders the content wrapper once loading completes', () => {
      expect(wrapper.find('.content-wrapper').exists()).toBe(true)
      expect(wrapper.findComponent(SkeletonHonors).exists()).toBe(false)
    })

    it('renders the section title and subtitle', () => {
      expect(wrapper.find('.section-title').text()).toBe('Honors & Qualifications')
      expect(wrapper.find('.section-subtitle').text()).toBe('Professional certifications · Trusted partner')
    })

    it('renders exactly eight honor badges', () => {
      expect(wrapper.findAll('.honor-badge')).toHaveLength(8)
    })

    it('renders the correct emoji icon for each honor in order', () => {
      const icons = wrapper.findAll('.honor-icon').map((i) => i.text())
      expect(icons).toEqual([
        '🏆',
        '🎖️',
        '⭐',
        '🛡️',
        '🔒',
        '⚙️',
        '💎',
        '🌐',
      ])
    })

    it('renders the correct h4 title for each honor', () => {
      const titles = wrapper.findAll('.honor-badge h4').map((h) => h.text())
      expect(titles).toContain('National High-Tech Enterprise')
      expect(titles).toContain('ISO 9001 Certified')
      expect(titles).toContain('Shenzhen FinTech Association')
    })

    it('renders the description span for each honor', () => {
      const descs = wrapper.findAll('.honor-badge span').map((s) => s.text())
      expect(descs).toContain('High-Tech Enterprise Certification')
      expect(descs).toContain('Quality Management System')
      expect(descs).toContain('Member Unit')
    })

    it('renders each honor title with an h4 element', () => {
      wrapper.findAll('.honor-badge h4').forEach((h) => {
        expect(h.element.tagName.toLowerCase()).toBe('h4')
      })
    })
  })

  // ============================================
  // Accessibility
  // ============================================
  describe('Accessibility', () => {
    beforeEach(() => {
      mockIsLoading.value = false
      wrapper = mount(Honors)
    })

    it('uses a single h2 for the section title', () => {
      expect(wrapper.findAll('h2')).toHaveLength(1)
    })

    it('hides the decorative honor icons from assistive technology', () => {
      wrapper.findAll('.honor-icon').forEach((icon) => {
        expect(icon.attributes('aria-hidden')).toBe('true')
      })
    })
  })

  // ============================================
  // Edge Cases
  // ============================================
  describe('Edge Cases', () => {
    it('renders a consistent number of badges across repeated mounts', () => {
      mockIsLoading.value = false
      const w1 = mount(Honors)
      const w2 = mount(Honors)
      expect(w1.findAll('.honor-badge').length).toBe(w2.findAll('.honor-badge').length)
      expect(w1.findAll('.honor-icon').length).toBe(w2.findAll('.honor-icon').length)
      w1.unmount()
      w2.unmount()
    })
  })
})
