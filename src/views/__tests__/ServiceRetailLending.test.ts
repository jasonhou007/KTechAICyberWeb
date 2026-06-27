/**
 * @file ServiceRetailLending.test.ts
 * @description Unit tests for the Retail Lending Service detail view
 * @ticket #39 - FEAT-018: Service Detail Page - Retail Lending Solution
 *
 * Test Categories:
 * - Rendering Tests: Component mount and section structure
 * - Content Tests: All required sections present (core features, loan types,
 *   tech features, metrics, process, CTA)
 * - Accessibility Tests: Semantic landmarks, ARIA labels, single h1
 * - i18n Tests: Translation function behavior and key fallback
 * - Edge Cases: loading skeleton state and re-mount consistency
 *
 * Note: useLanguage() returns the key itself as fallback when no translations
 * are loaded in the test environment, so content assertions check for keys.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import ServiceRetailLending from '../ServiceRetailLending.vue'

// Stub router-link so rendered links keep their href attribute and can be
// queried via a[href="..."], mirroring how the rest of the suite stubs the
// router when mounting an isolated view.
const RouterLinkStub = {
  name: 'RouterLinkStub',
  props: { to: { type: [String, Object], default: '' } },
  computed: {
    href() {
      return typeof this.to === 'string' ? this.to : (this.to && this.to.path) || ''
    },
  },
  template: '<a :href="href"><slot /></a>',
}

describe('ServiceRetailLending.vue', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    wrapper = mount(ServiceRetailLending, {
      global: {
        stubs: {
          'router-link': RouterLinkStub,
        },
      },
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

    it('renders the root .retail-lending container', () => {
      expect(wrapper.find('.retail-lending').exists()).toBe(true)
    })

    it('renders a <main> element with role="main"', () => {
      const main = wrapper.find('main')
      expect(main.exists()).toBe(true)
      expect(main.attributes('role')).toBe('main')
    })

    it('renders the hero section', () => {
      expect(wrapper.find('.rl__hero').exists()).toBe(true)
    })

    it('renders the page title as an h1', () => {
      const h1 = wrapper.find('.rl__hero h1')
      expect(h1.exists()).toBe(true)
      expect(h1.element.tagName.toLowerCase()).toBe('h1')
    })

    it('renders the overview section', () => {
      expect(wrapper.find('.rl__overview').exists()).toBe(true)
    })

    it('renders the core features section', () => {
      expect(wrapper.find('.rl__core-features').exists()).toBe(true)
    })

    it('renders the loan types section', () => {
      expect(wrapper.find('.rl__loan-types').exists()).toBe(true)
    })

    it('renders the tech features section', () => {
      expect(wrapper.find('.rl__tech-features').exists()).toBe(true)
    })

    it('renders the metrics section', () => {
      expect(wrapper.find('.rl__metrics').exists()).toBe(true)
    })

    it('renders the process section', () => {
      expect(wrapper.find('.rl__process').exists()).toBe(true)
    })

    it('renders the CTA section with a router-link to /contact', () => {
      const cta = wrapper.find('.rl__cta')
      expect(cta.exists()).toBe(true)
      const link = cta.find('a[href="/contact"]')
      expect(link.exists()).toBe(true)
    })

    it('renders the breadcrumb navigation', () => {
      const breadcrumb = wrapper.find('nav[aria-label="Breadcrumb"]')
      expect(breadcrumb.exists()).toBe(true)
    })
  })

  // ============================================
  // Content Tests (i18n key fallback)
  // ============================================
  describe('Content', () => {
    it('renders the hero heading key', () => {
      expect(wrapper.text()).toContain('Digital Retail Lending Platform')
    })

    it('renders the hero description key', () => {
      expect(wrapper.text()).toContain('Accelerate loan origination')
    })

    it('renders the overview heading and description keys', () => {
      const text = wrapper.text()
      expect(text).toContain('Service Overview')
      expect(text).toContain('Our Retail Lending Solution combines a configurable risk engine')
    })

    it('renders all four core feature keys', () => {
      const text = wrapper.text()
      expect(text).toContain('Risk Engine')
      expect(text).toContain('Process Automation')
      expect(text).toContain('Anti-Fraud')
      expect(text).toContain('Credit Decisioning')
    })

    it('renders all three loan type keys', () => {
      const text = wrapper.text()
      expect(text).toContain('Personal Lending')
      expect(text).toContain('SME Lending')
      expect(text).toContain('Co-Lending')
    })

    it('renders all four tech feature keys', () => {
      const text = wrapper.text()
      expect(text).toContain('Banking-as-a-Service')
      expect(text).toContain('Digital Onboarding')
      expect(text).toContain('Lifecycle Management')
      expect(text).toContain('Governance & Compliance')
    })

    it('renders all four metric labels', () => {
      const text = wrapper.text()
      expect(text).toContain('Auto-Approval Rate')
      expect(text).toContain('Operational Cost Reduction')
      expect(text).toContain('Process Automation')
      expect(text).toContain('Fraud Detection Accuracy')
    })

    it('renders all four process step numbers', () => {
      // The four step-number slots render the bundled "01".."04" copy.
      const stepNumbers = wrapper.findAll('.rl__step-number')
      expect(stepNumbers.map((n) => n.text())).toEqual(['01', '02', '03', '04'])
    })

    it('renders the CTA button label key', () => {
      expect(wrapper.text()).toContain('Request Consultation')
    })
  })

  // ============================================
  // Accessibility Tests
  // ============================================
  describe('Accessibility', () => {
    it('uses exactly one h1 for the page title', () => {
      expect(wrapper.findAll('h1')).toHaveLength(1)
    })

    it('provides an aria-label on the main landmark', () => {
      const main = wrapper.find('main')
      expect(main.attributes('aria-label')).toBeTruthy()
    })

    it('marks sections with aria-labelledby', () => {
      const labelled = wrapper.findAll('section[aria-labelledby]')
      expect(labelled.length).toBeGreaterThanOrEqual(6)
    })

    it('labels the breadcrumb nav region', () => {
      const nav = wrapper.find('nav[aria-label="Breadcrumb"]')
      expect(nav.exists()).toBe(true)
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
      const result = (wrapper.vm as any).t('services.retailLending.this.key.does.not.exist')
      expect(result).toBe('services.retailLending.this.key.does.not.exist')
    })

    it('translates the title key to real English copy', () => {
      expect((wrapper.vm as any).t('services.retailLending.title')).toBe(
        'Retail Lending Solution',
      )
    })
  })

  // ============================================
  // Edge Cases
  // ============================================
  describe('Edge Cases', () => {
    it('renders a loading skeleton initially and content after mount', async () => {
      // First render: loading skeleton present, real content hidden.
      const fresh = mount(ServiceRetailLending)
      expect(fresh.find('.rl__skeleton').exists()).toBe(true)
      expect(fresh.find('.rl__content').exists()).toBe(false)

      // Trigger onMounted lifecycle (flush pending callbacks).
      await fresh.vm.$nextTick()
      // Allow microtask queue to settle for onMounted.
      await Promise.resolve()
      await fresh.vm.$nextTick()

      // After loading flips, skeleton is gone and content is shown.
      expect(fresh.find('.rl__skeleton').exists()).toBe(false)
      expect(fresh.find('.rl__content').exists()).toBe(true)
      fresh.unmount()
    })

    it('renders consistently across multiple mounts', () => {
      const w1 = mount(ServiceRetailLending)
      const w2 = mount(ServiceRetailLending)
      expect(w1.findAll('section').length).toBe(w2.findAll('section').length)
      w1.unmount()
      w2.unmount()
    })

    it('creates a meta description tag when none exists yet', async () => {
      // Remove any pre-existing description meta so the onMounted create branch runs.
      document.querySelectorAll('meta[name="description"]').forEach((el) => el.remove())
      const before = document.querySelectorAll('meta[name="description"]').length
      expect(before).toBe(0)

      const w = mount(ServiceRetailLending, {
        global: { stubs: { 'router-link': RouterLinkStub } },
      })
      await w.vm.$nextTick()
      await Promise.resolve()
      await w.vm.$nextTick()

      const after = document.querySelectorAll('meta[name="description"]').length
      expect(after).toBe(1)
      w.unmount()
    })

    it('reuses the existing meta description tag when one is present', async () => {
      // Ensure a meta description already exists (default happy-dom state).
      let existing = document.querySelector('meta[name="description"]')
      if (!existing) {
        existing = document.createElement('meta')
        existing.setAttribute('name', 'description')
        document.head.appendChild(existing)
      }

      const w = mount(ServiceRetailLending, {
        global: { stubs: { 'router-link': RouterLinkStub } },
      })
      await w.vm.$nextTick()
      await Promise.resolve()
      await w.vm.$nextTick()

      // Exactly one description meta remains (reused, not duplicated).
      const count = document.querySelectorAll('meta[name="description"]').length
      expect(count).toBe(1)
      w.unmount()
    })
  })
})
