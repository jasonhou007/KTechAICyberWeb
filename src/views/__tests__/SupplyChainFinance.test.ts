/**
 * @file SupplyChainFinance.test.ts
 * @description Unit tests for the Supply Chain Finance service detail view
 *
 * Test Categories:
 * - Rendering Tests: Component mount and section structure
 * - Content Tests: All required sections present (hero, overview, features,
 *   benefits, process, CTA, back-link) with their i18n keys
 * - Accessibility Tests: main landmark, breadcrumb, aria-labelledby sections,
 *   single h1, aria-hidden decorative separators
 * - Navigation Tests: home breadcrumb link, two /contact CTAs, back-to-services
 * - i18n Tests: Translation function behavior and key fallback
 * - Behavior Tests: onMounted animation-delay side effects
 * - Edge Cases: re-mount consistency
 *
 * Note: useLanguage() returns the key itself as fallback when no translations
 * are loaded in the test environment, so content assertions check for keys.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import SupplyChainFinance from '../SupplyChainFinance.vue'

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

describe('SupplyChainFinance.vue', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    // The view calls window.scrollTo on mount; stub it so happy-dom doesn't
    // throw on the smooth-behavior option.
    vi.stubGlobal('scrollTo', vi.fn())
    wrapper = mount(SupplyChainFinance, {
      global: {
        stubs: {
          'router-link': RouterLinkStub,
        },
      },
    })
  })

  afterEach(() => {
    wrapper.unmount()
    vi.unstubAllGlobals()
  })

  // ============================================
  // Rendering Tests
  // ============================================
  describe('Rendering', () => {
    it('should mount without errors', () => {
      expect(wrapper.exists()).toBe(true)
    })

    it('renders the root .supply-chain-finance main element', () => {
      const root = wrapper.find('.supply-chain-finance')
      expect(root.exists()).toBe(true)
      expect(root.element.tagName.toLowerCase()).toBe('main')
    })

    it('renders a <main> element with role="main"', () => {
      const main = wrapper.find('main')
      expect(main.exists()).toBe(true)
      expect(main.attributes('role')).toBe('main')
    })

    it('provides an aria-label on the main landmark', () => {
      const main = wrapper.find('main')
      // a11y.mainLabel is bundled and resolves to real English copy.
      expect(main.attributes('aria-label')).toBe('Main content')
    })

    it('renders the breadcrumb navigation', () => {
      expect(wrapper.find('nav[aria-label="Breadcrumb"]').exists()).toBe(true)
    })

    it('renders the hero section', () => {
      expect(wrapper.find('.scf__hero').exists()).toBe(true)
    })

    it('renders the page title as an h1 inside the hero', () => {
      const h1 = wrapper.find('.scf__hero h1')
      expect(h1.exists()).toBe(true)
      expect(h1.element.tagName.toLowerCase()).toBe('h1')
    })

    it('renders the overview section', () => {
      expect(wrapper.find('.scf__overview').exists()).toBe(true)
    })

    it('renders the features section', () => {
      expect(wrapper.find('.scf__features').exists()).toBe(true)
    })

    it('renders exactly six feature cards', () => {
      expect(wrapper.findAll('.scf__feature-card')).toHaveLength(6)
    })

    it('renders the benefits section', () => {
      expect(wrapper.find('.scf__benefits').exists()).toBe(true)
    })

    it('renders exactly four benefit items', () => {
      expect(wrapper.findAll('.scf__benefit-item')).toHaveLength(4)
    })

    it('renders the process section', () => {
      expect(wrapper.find('.scf__process').exists()).toBe(true)
    })

    it('renders exactly five process steps', () => {
      expect(wrapper.findAll('.scf__process-step')).toHaveLength(5)
    })

    it('renders the CTA section', () => {
      expect(wrapper.find('.scf__cta').exists()).toBe(true)
    })

    it('renders the back-to-services link region', () => {
      expect(wrapper.find('.scf__back').exists()).toBe(true)
    })

    it('renders two animated background grid layers', () => {
      expect(wrapper.findAll('.grid-bg')).toHaveLength(2)
    })
  })

  // ============================================
  // Content Tests (bundled i18n resolves to real English copy)
  // ============================================
  describe('Content', () => {
    it('renders the breadcrumb current label using the services title key', () => {
      expect(wrapper.text()).toContain('Supply Chain Finance Solution')
    })

    it('renders the hero heading and description keys', () => {
      const text = wrapper.text()
      expect(text).toContain('Supply Chain Finance Solution')
      expect(text).toContain('Empowering businesses with innovative financial solutions')
    })

    it('renders the overview heading and description keys', () => {
      const text = wrapper.text()
      expect(text).toContain('Service Overview')
      expect(text).toContain('Our Supply Chain Finance Solution provides comprehensive')
    })

    it('renders the features heading key', () => {
      expect(wrapper.text()).toContain('Key Features')
    })

    it('renders all six feature title keys', () => {
      const text = wrapper.text()
      expect(text).toContain('Working Capital Optimization')
      expect(text).toContain('Risk Management')
      expect(text).toContain('Digital Platform')
      expect(text).toContain('Flexible Financing')
      expect(text).toContain('Supplier Network')
      expect(text).toContain('Advanced Analytics')
    })

    it('renders the benefits heading key', () => {
      expect(wrapper.text()).toContain('Benefits')
    })

    it('renders all four benefit title keys', () => {
      const text = wrapper.text()
      expect(text).toContain('Improved Cash Flow')
      expect(text).toContain('Reduced Risk')
      expect(text).toContain('Enhanced Efficiency')
      expect(text).toContain('Cost Savings')
    })

    it('renders the numeric labels 01-04 for the benefit items', () => {
      const numbers = wrapper.findAll('.scf__benefit-number').map((n) => n.text())
      expect(numbers).toEqual(['01', '02', '03', '04'])
    })

    it('renders the process heading key', () => {
      expect(wrapper.text()).toContain('Implementation Process')
    })

    it('renders all five process step numbers', () => {
      // The five step-number slots render the bundled "01".."05" copy.
      const stepNumbers = wrapper.findAll('.scf__step-number').map((n) => n.text())
      expect(stepNumbers).toEqual(['01', '02', '03', '04', '05'])
    })

    it('renders the CTA heading, description and button keys', () => {
      const text = wrapper.text()
      expect(text).toContain('Transform Your Supply Chain')
      expect(text).toContain('Ready to optimize your supply chain')
      expect(text).toContain('Request Consultation')
    })

    it('renders the back-to-services label key', () => {
      expect(wrapper.text()).toContain('Back to Services')
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
      // overview, features, benefits, process, cta => 5 section h2s
      expect(wrapper.findAll('h2')).toHaveLength(5)
    })

    it('uses h3 for every feature, benefit and process card title', () => {
      // 6 features + 4 benefits + 5 process steps = 15 h3s
      expect(wrapper.findAll('h3')).toHaveLength(15)
    })

    it('marks feature cards as articles', () => {
      expect(wrapper.findAll('.scf__feature-card').every((c) => c.element.tagName.toLowerCase() === 'article')).toBe(true)
    })

    it('marks every content section with aria-labelledby', () => {
      const labelled = wrapper.findAll('section[aria-labelledby]')
      // hero, overview, features, benefits, process, cta
      expect(labelled.length).toBeGreaterThanOrEqual(6)
    })

    it('labels the breadcrumb nav region', () => {
      expect(wrapper.find('nav[aria-label="Breadcrumb"]').exists()).toBe(true)
    })

    it('hides the decorative breadcrumb separator from screen readers', () => {
      const separator = wrapper.find('.scf__breadcrumb-separator')
      expect(separator.exists()).toBe(true)
      expect(separator.attributes('aria-hidden')).toBe('true')
    })

    it('hides the decorative hero icon from screen readers', () => {
      const icon = wrapper.find('.scf__hero-icon')
      expect(icon.exists()).toBe(true)
      expect(icon.attributes('aria-hidden')).toBe('true')
    })

    it('hides the decorative back arrow icon from screen readers', () => {
      const arrow = wrapper.find('.scf__back-icon')
      expect(arrow.exists()).toBe(true)
      expect(arrow.attributes('aria-hidden')).toBe('true')
    })

    it('provides an aria-label on the CTA button link', () => {
      const cta = wrapper.find('.scf__cta-button')
      expect(cta.exists()).toBe(true)
      // cta.ariaLabel is bundled and resolves to real English copy.
      expect(cta.attributes('aria-label')).toBe(
        'Request a consultation for supply chain finance',
      )
    })
  })

  // ============================================
  // Navigation Tests
  // ============================================
  describe('Navigation', () => {
    it('renders a home link in the breadcrumb', () => {
      const breadcrumb = wrapper.find('nav[aria-label="Breadcrumb"]')
      expect(breadcrumb.find('a[href="/"]').exists()).toBe(true)
    })

    it('renders a hero CTA link to /contact', () => {
      expect(wrapper.find('.scf__hero a[href="/contact"]').exists()).toBe(true)
    })

    it('renders a bottom CTA link to /contact', () => {
      expect(wrapper.find('.scf__cta a[href="/contact"]').exists()).toBe(true)
    })

    it('renders the back-to-services link pointing home', () => {
      const back = wrapper.find('.scf__back a[href="/"]')
      expect(back.exists()).toBe(true)
    })
  })

  // ============================================
  // Behavior Tests (onMounted side effects)
  // ============================================
  describe('Behavior', () => {
    it('scrolls to top on mount', () => {
      expect((globalThis as any).scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
    })

    // The view computes delays as index * 0.1 (cards/process) and index * 0.15
    // (benefits), which produces floating-point artifacts like 0.30000000000000004.
    // Match the animation-delay with a regex and parse the seconds value rather
    // than comparing against a string literal.
    const extractDelay = (style: string): number | null => {
      const match = style.match(/animation-delay:\s*([\d.]+)s/)
      return match ? parseFloat(match[1]) : null
    }

    it('applies staggered animation-delay to feature cards on mount', async () => {
      // The view's onMounted uses document.querySelectorAll to set per-card
      // animation-delay inline styles. That only finds elements attached to the
      // real document, so mount with attachTo: document.body to drive the real
      // lifecycle rather than inspecting wrapper internals. Strip any leftover
      // nodes first so the document only contains this component's cards.
      document.querySelectorAll('.scf__feature-card').forEach((el) => el.remove())
      const w = mount(SupplyChainFinance, {
        attachTo: document.body,
        global: { stubs: { 'router-link': RouterLinkStub } },
      })
      await w.vm.$nextTick()
      // The component's onMounted should have seen exactly its own 6 cards.
      expect(document.querySelectorAll('.scf__feature-card')).toHaveLength(6)
      const delays = Array.from(document.querySelectorAll('.scf__feature-card')).map(
        (el) => extractDelay((el as HTMLElement).getAttribute('style') || '')
      )
      expect(delays[0]).toBeCloseTo(0, 5)
      expect(delays[3]).toBeCloseTo(0.3, 5)
      expect(delays[5]).toBeCloseTo(0.5, 5)
      w.unmount()
    })

    it('applies staggered animation-delay to process steps on mount', async () => {
      document.querySelectorAll('.scf__process-step').forEach((el) => el.remove())
      const w = mount(SupplyChainFinance, {
        attachTo: document.body,
        global: { stubs: { 'router-link': RouterLinkStub } },
      })
      await w.vm.$nextTick()
      expect(document.querySelectorAll('.scf__process-step')).toHaveLength(5)
      const delays = Array.from(document.querySelectorAll('.scf__process-step')).map(
        (el) => extractDelay((el as HTMLElement).getAttribute('style') || '')
      )
      expect(delays[0]).toBeCloseTo(0, 5)
      expect(delays[4]).toBeCloseTo(0.4, 5)
      w.unmount()
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
      const result = (wrapper.vm as any).t('services.supplyChainFinance.this.key.does.not.exist')
      expect(result).toBe('services.supplyChainFinance.this.key.does.not.exist')
    })

    it('translates the title key to real English copy', () => {
      expect((wrapper.vm as any).t('services.supplyChainFinance.title')).toBe(
        'Supply Chain Finance Solution',
      )
    })
  })

  // ============================================
  // Edge Cases
  // ============================================
  describe('Edge Cases', () => {
    it('renders consistently across multiple mounts', () => {
      vi.stubGlobal('scrollTo', vi.fn())
      const w1 = mount(SupplyChainFinance, { global: { stubs: { 'router-link': RouterLinkStub } } })
      const w2 = mount(SupplyChainFinance, { global: { stubs: { 'router-link': RouterLinkStub } } })
      expect(w1.findAll('section').length).toBe(w2.findAll('section').length)
      expect(w1.findAll('.scf__feature-card').length).toBe(w2.findAll('.scf__feature-card').length)
      w1.unmount()
      w2.unmount()
    })
  })
})
