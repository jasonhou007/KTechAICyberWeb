/**
 * @file ServiceCrossBorderPayment.test.ts
 * @description Unit tests for the Cross-Border Payment Service detail (stub) view
 * @ticket #164 - Navigation overhaul: 3 new solution stub views
 *
 * Stub view shape (trimmed from ServiceRetailLending): hero + breadcrumb +
 * ONE overview section + 3 capability cards + CTA + back-link. NO metrics or
 * process sections, NO fabricated stats.
 *
 * Test Categories:
 * - Rendering Tests: Component mount, role="main", id="main-content"
 * - Content Tests: hero h1 via t(), breadcrumb / link, 3 capability cards,
 *   CTA router-link to /contact
 * - Accessibility Tests: semantic landmarks, single h1
 * - i18n Tests: no raw dotted keys leaked into rendered text
 * - Edge Cases: loading skeleton state and re-mount consistency
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import ServiceCrossBorderPayment from '../ServiceCrossBorderPayment.vue'

// Stub router-link so rendered links keep their href attribute and can be
// queried via a[href="..."], mirroring how the rest of the suite stubs the
// router when mounting an isolated view.
const RouterLinkStub = {
  name: 'RouterLinkStub',
  props: { to: { type: [String, Object], default: '' } },
  computed: {
    href() {
      return typeof this.to === 'string'
        ? this.to
        : (this.to && this.to.path) || ''
    },
  },
  template: '<a :href="href"><slot /></a>',
}

describe('ServiceCrossBorderPayment.vue', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    wrapper = mount(ServiceCrossBorderPayment, {
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

    it('renders a <main> element with role="main"', () => {
      const main = wrapper.find('main')
      expect(main.exists()).toBe(true)
      expect(main.attributes('role')).toBe('main')
    })

    it('exposes id="main-content" on the main landmark', () => {
      expect(wrapper.find('#main-content').exists()).toBe(true)
    })

    it('renders the hero section', () => {
      expect(wrapper.find('.cbp__hero').exists()).toBe(true)
    })

    it('renders the page title as an h1', () => {
      const h1 = wrapper.find('.cbp__hero h1')
      expect(h1.exists()).toBe(true)
      expect(h1.element.tagName.toLowerCase()).toBe('h1')
    })

    it('renders the overview section', () => {
      expect(wrapper.find('.cbp__overview').exists()).toBe(true)
    })

    it('renders the capabilities section', () => {
      expect(wrapper.find('.cbp__capabilities').exists()).toBe(true)
    })

    it('renders the core features section', () => {
      expect(wrapper.find('.cbp__core-features').exists()).toBe(true)
    })

    it('renders the tech features section', () => {
      expect(wrapper.find('.cbp__tech-features').exists()).toBe(true)
    })

    it('renders the CTA section with a router-link to /contact', () => {
      const cta = wrapper.find('.cbp__cta')
      expect(cta.exists()).toBe(true)
      const link = cta.find('a[href="/contact"]')
      expect(link.exists()).toBe(true)
    })

    it('renders the breadcrumb navigation', () => {
      const breadcrumb = wrapper.find('nav[aria-label="Breadcrumb"]')
      expect(breadcrumb.exists()).toBe(true)
    })

    it('renders a breadcrumb link back to home', () => {
      const home = wrapper.find('.cbp__breadcrumb a[href="/"]')
      expect(home.exists()).toBe(true)
    })
  })

  // ============================================
  // Content Tests (real English copy from en.json)
  // ============================================
  describe('Content', () => {
    it('renders the hero heading via t()', () => {
      expect(wrapper.text()).toContain(
        (wrapper.vm as any).t('services.crossBorderPayment.hero.heading'),
      )
    })

    it('renders the overview heading and description via t()', () => {
      const vm = wrapper.vm as any
      const text = wrapper.text()
      expect(text).toContain(vm.t('services.crossBorderPayment.overview.heading'))
      expect(text).toContain(vm.t('services.crossBorderPayment.overview.description'))
    })

    it('renders exactly three capability cards', () => {
      const cards = wrapper.findAll('.cbp__capabilities .cbp__card')
      expect(cards).toHaveLength(3)
    })

    it('renders the core features heading via t()', () => {
      expect(wrapper.text()).toContain(
        (wrapper.vm as any).t('services.crossBorderPayment.coreFeatures.heading'),
      )
    })

    it('renders exactly four core feature cards', () => {
      expect(wrapper.findAll('.cbp__core-features .cbp__card')).toHaveLength(4)
    })

    it('renders the tech features heading via t()', () => {
      expect(wrapper.text()).toContain(
        (wrapper.vm as any).t('services.crossBorderPayment.techFeatures.heading'),
      )
    })

    it('renders exactly four tech feature cards', () => {
      expect(wrapper.findAll('.cbp__tech-features .cbp__card')).toHaveLength(4)
    })

    it('renders the CTA button label via t()', () => {
      expect(wrapper.text()).toContain(
        (wrapper.vm as any).t('services.crossBorderPayment.cta.button'),
      )
    })

    it('does NOT render a metrics section (stub view)', () => {
      expect(wrapper.find('.cbp__metrics').exists()).toBe(false)
    })

    it('does NOT render a process section (stub view)', () => {
      expect(wrapper.find('.cbp__process').exists()).toBe(false)
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

    it('labels the breadcrumb nav region', () => {
      const nav = wrapper.find('nav[aria-label="Breadcrumb"]')
      expect(nav.exists()).toBe(true)
    })

    it('marks capability + CTA sections with aria-labelledby', () => {
      const labelled = wrapper.findAll('section[aria-labelledby]')
      expect(labelled.length).toBeGreaterThanOrEqual(3)
    })
  })

  // ============================================
  // i18n Tests — no raw dotted keys leak into the DOM
  // ============================================
  describe('Internationalization', () => {
    it('does not leak raw services.crossBorderPayment.* keys into rendered text', () => {
      const text = wrapper.text()
      // Any 3+ segment dotted key that slipped through t() unresolved.
      const rawKeyPattern = /services\.crossBorderPayment\.[a-zA-Z]+\.[a-zA-Z]+/g
      expect(text.match(rawKeyPattern)).toBeNull()
    })

    it('exposes a translation function on the component instance', () => {
      expect(typeof (wrapper.vm as any).t).toBe('function')
    })

    it('returns the key as fallback for a genuinely-missing key', () => {
      const result = (wrapper.vm as any).t('services.crossBorderPayment.this.key.does.not.exist')
      expect(result).toBe('services.crossBorderPayment.this.key.does.not.exist')
    })
  })

  // ============================================
  // Edge Cases
  // ============================================
  describe('Edge Cases', () => {
    it('renders a loading skeleton initially and content after mount', async () => {
      const fresh = mount(ServiceCrossBorderPayment)
      expect(fresh.find('.cbp__skeleton').exists()).toBe(true)
      expect(fresh.find('.cbp__content').exists()).toBe(false)

      await fresh.vm.$nextTick()
      await Promise.resolve()
      await fresh.vm.$nextTick()

      expect(fresh.find('.cbp__skeleton').exists()).toBe(false)
      expect(fresh.find('.cbp__content').exists()).toBe(true)
      fresh.unmount()
    })

    it('renders consistently across multiple mounts', () => {
      const w1 = mount(ServiceCrossBorderPayment, {
        global: { stubs: { 'router-link': RouterLinkStub } },
      })
      const w2 = mount(ServiceCrossBorderPayment, {
        global: { stubs: { 'router-link': RouterLinkStub } },
      })
      expect(w1.findAll('section').length).toBe(w2.findAll('section').length)
      w1.unmount()
      w2.unmount()
    })
  })
})
