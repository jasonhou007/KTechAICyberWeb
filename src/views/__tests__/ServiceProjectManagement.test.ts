/**
 * @file ServiceProjectManagement.test.ts
 * @description Unit tests for the Project Management service detail view
 *
 * Test Categories:
 * - Rendering Tests: Component mount and section structure
 * - Content Tests: All required sections present (hero, overview, capabilities,
 *   process, features, CTA) with their i18n keys; v-for driven lists
 * - Accessibility Tests: single h1, heading hierarchy, hero svg icon
 * - Navigation Tests: CTA router-link to /contact
 * - Computed/Data Tests: capabilities, processSteps, features arrays
 * - i18n Tests: Translation function behavior and key fallback
 * - Edge Cases: re-mount consistency, data-array integrity
 *
 * useLanguage() statically imports the locale bundles, so translations resolve
 * to real English copy in the test environment. Content assertions check for
 * that copy (not raw keys).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import ServiceProjectManagement from '../ServiceProjectManagement.vue'

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

describe('ServiceProjectManagement.vue', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    wrapper = mount(ServiceProjectManagement, {
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

    it('renders the root .service-page container', () => {
      expect(wrapper.find('.service-page').exists()).toBe(true)
    })

    it('renders the hero section', () => {
      expect(wrapper.find('.service-hero').exists()).toBe(true)
    })

    it('renders the page title as an h1 inside the hero', () => {
      const h1 = wrapper.find('.service-hero h1')
      expect(h1.exists()).toBe(true)
      expect(h1.element.tagName.toLowerCase()).toBe('h1')
    })

    it('renders an svg icon inside the hero service-icon', () => {
      expect(wrapper.find('.service-icon svg').exists()).toBe(true)
    })

    it('renders the overview section', () => {
      expect(wrapper.find('.overview').exists()).toBe(true)
    })

    it('renders the capabilities section', () => {
      expect(wrapper.find('.capabilities').exists()).toBe(true)
    })

    it('renders exactly four capability cards', () => {
      expect(wrapper.findAll('.capability-card')).toHaveLength(4)
    })

    it('renders the process section', () => {
      expect(wrapper.find('.process').exists()).toBe(true)
    })

    it('renders exactly five process steps', () => {
      expect(wrapper.findAll('.process-step')).toHaveLength(5)
    })

    it('renders the features section', () => {
      expect(wrapper.find('.features').exists()).toBe(true)
    })

    it('renders exactly six feature items', () => {
      expect(wrapper.findAll('.feature-item')).toHaveLength(6)
    })

    it('renders the CTA section', () => {
      expect(wrapper.find('.cta').exists()).toBe(true)
    })

    it('renders two animated background grid layers', () => {
      expect(wrapper.findAll('.grid-bg')).toHaveLength(2)
    })
  })

  // ============================================
  // Content Tests (real translated copy)
  // ============================================
  describe('Content', () => {
    it('renders the hero title and subtitle copy', () => {
      const text = wrapper.text()
      expect(text).toContain('Project Management')
      expect(text).toContain('Professional fintech program delivery')
    })

    it('renders the overview title and content copy', () => {
      const text = wrapper.text()
      expect(text).toContain('Service Overview')
      expect(text).toContain('end-to-end project management for financial technology')
    })

    it('renders the capabilities title copy', () => {
      expect(wrapper.text()).toContain('Delivery Capabilities')
    })

    it('renders all four capability title copies', () => {
      const text = wrapper.text()
      expect(text).toContain('Agile Delivery')
      expect(text).toContain('Waterfall Delivery')
      expect(text).toContain('Hybrid Model')
      expect(text).toContain('Risk Management')
    })

    it('renders all four capability description copies', () => {
      const text = wrapper.text()
      expect(text).toContain('Scrum, Kanban, and SAFe')
      expect(text).toContain('Phase-gated delivery')
      expect(text).toContain('Blended agile and waterfall')
      expect(text).toContain('Structured risk registers')
    })

    it('renders the process title copy', () => {
      expect(wrapper.text()).toContain('Delivery Process')
    })

    it('renders all five process step title copies', () => {
      const text = wrapper.text()
      expect(text).toContain('Discovery')
      expect(text).toContain('Planning')
      expect(text).toContain('Execution')
      expect(text).toContain('Delivery')
      expect(text).toContain('Support')
    })

    it('renders the features title copy', () => {
      expect(wrapper.text()).toContain("What's Included")
    })

    it('renders all six feature copies', () => {
      const text = wrapper.text()
      expect(text).toContain('Sprint planning and review')
      expect(text).toContain('Velocity and burndown tracking')
      expect(text).toContain('Executive status reporting')
      expect(text).toContain('Cross-team collaboration')
      expect(text).toContain('Budget and timeline tracking')
      expect(text).toContain('Compliance and audit support')
    })

    it('renders the CTA title, subtitle and button copy', () => {
      const text = wrapper.text()
      expect(text).toContain('Deliver Your Next Program with Confidence')
      expect(text).toContain('program delivery tailored to your fintech initiatives')
      expect(text).toContain('Request Consultation')
    })
  })

  // ============================================
  // Computed / Data Tests
  // ============================================
  describe('Data', () => {
    it('renders numeric step labels 1 through 5 for process steps', () => {
      const numbers = wrapper.findAll('.step-number').map((n) => n.text())
      expect(numbers).toEqual(['1', '2', '3', '4', '5'])
    })

    it('renders a check mark glyph on every feature item', () => {
      const checks = wrapper.findAll('.feature-check')
      expect(checks).toHaveLength(6)
      checks.forEach((c) => expect(c.text()).toBe('✓'))
    })

    it('renders the capability icons from the data array', () => {
      const icons = wrapper.findAll('.capability-icon').map((i) => i.text())
      expect(icons).toEqual(['🔄', '📊', '🔀', '⚠️'])
    })

    it('renders the cta arrow glyph inside the CTA button', () => {
      expect(wrapper.find('.cta-arrow').text()).toBe('→')
    })
  })

  // ============================================
  // Accessibility Tests
  // ============================================
  describe('Accessibility', () => {
    it('uses exactly one h1 for the page title', () => {
      expect(wrapper.findAll('h1')).toHaveLength(1)
    })

    it('uses h2 for each section title', () => {
      // overview, capabilities, process, features, cta => 5 section h2s
      expect(wrapper.findAll('h2')).toHaveLength(5)
    })

    it('uses h3 for every capability and process card title', () => {
      // 4 capabilities + 5 process steps = 9 h3s
      expect(wrapper.findAll('h3')).toHaveLength(9)
    })
  })

  // ============================================
  // Navigation Tests
  // ============================================
  describe('Navigation', () => {
    it('renders a CTA router-link to /contact', () => {
      const link = wrapper.find('.cta a[href="/contact"]')
      expect(link.exists()).toBe(true)
    })

    it('renders the CTA button label and arrow inside the link', () => {
      const link = wrapper.find('.cta a[href="/contact"]')
      expect(link.text()).toContain('Request Consultation')
      expect(link.find('.cta-arrow').exists()).toBe(true)
    })
  })

  // ============================================
  // i18n Tests
  // ============================================
  describe('Internationalization', () => {
    it('exposes a translation function on the component instance', () => {
      expect(typeof (wrapper.vm as any).t).toBe('function')
    })

    it('resolves known keys to real copy and falls back to the raw key when missing', () => {
      // Locale bundles are statically imported, so known keys resolve to copy.
      expect((wrapper.vm as any).t('services.pm.title')).toBe('Project Management')
      // Genuinely-unknown keys still fall back to the raw key string.
      expect((wrapper.vm as any).t('services.pm.does.not.exist')).toBe(
        'services.pm.does.not.exist'
      )
    })
  })

  // ============================================
  // Edge Cases
  // ============================================
  describe('Edge Cases', () => {
    it('renders consistently across multiple mounts', () => {
      const w1 = mount(ServiceProjectManagement, { global: { stubs: { 'router-link': RouterLinkStub } } })
      const w2 = mount(ServiceProjectManagement, { global: { stubs: { 'router-link': RouterLinkStub } } })
      expect(w1.findAll('section').length).toBe(w2.findAll('section').length)
      expect(w1.findAll('.capability-card').length).toBe(w2.findAll('.capability-card').length)
      w1.unmount()
      w2.unmount()
    })
  })
})
