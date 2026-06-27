/**
 * @file ServiceBigData.test.ts
 * @description Unit tests for the Big Data & AI Service detail view
 * @ticket #84 - FEAT-027: Service Detail Page - Big Data & AI
 *
 * Test Categories:
 * - Rendering Tests: Component mount and section structure
 * - Content Tests: All required sections present (AI capabilities, big data,
 *   use cases, stats, process, CTA)
 * - Accessibility Tests: Semantic landmarks, ARIA labels, single h1
 * - i18n Tests: Translation function behavior and key fallback
 * - Edge Cases: loading skeleton state and re-mount consistency
 *
 * Note: useLanguage() returns the key itself as fallback when no translations
 * are loaded in the test environment, so content assertions check for keys.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import ServiceBigData from '../ServiceBigData.vue'

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

describe('ServiceBigData.vue', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    wrapper = mount(ServiceBigData, {
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

    it('renders the root .big-data container', () => {
      expect(wrapper.find('.big-data').exists()).toBe(true)
    })

    it('renders a <main> element with role="main"', () => {
      const main = wrapper.find('main')
      expect(main.exists()).toBe(true)
      expect(main.attributes('role')).toBe('main')
    })

    it('renders the hero section', () => {
      expect(wrapper.find('.bd__hero').exists()).toBe(true)
    })

    it('renders the page title as an h1', () => {
      const h1 = wrapper.find('.bd__hero h1')
      expect(h1.exists()).toBe(true)
      expect(h1.element.tagName.toLowerCase()).toBe('h1')
    })

    it('renders the overview section', () => {
      expect(wrapper.find('.bd__overview').exists()).toBe(true)
    })

    it('renders the AI capabilities section', () => {
      expect(wrapper.find('.bd__ai-capabilities').exists()).toBe(true)
    })

    it('renders the big data section', () => {
      expect(wrapper.find('.bd__big-data').exists()).toBe(true)
    })

    it('renders the use cases section', () => {
      expect(wrapper.find('.bd__use-cases').exists()).toBe(true)
    })

    it('renders the stats section', () => {
      expect(wrapper.find('.bd__stats').exists()).toBe(true)
    })

    it('renders the process section', () => {
      expect(wrapper.find('.bd__process').exists()).toBe(true)
    })

    it('renders the CTA section with a router-link to /contact', () => {
      const cta = wrapper.find('.bd__cta')
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
      expect(wrapper.text()).toContain('services.bigDataAI.hero.heading')
    })

    it('renders the hero description key', () => {
      expect(wrapper.text()).toContain('services.bigDataAI.hero.description')
    })

    it('renders the overview heading and description keys', () => {
      const text = wrapper.text()
      expect(text).toContain('services.bigDataAI.overview.heading')
      expect(text).toContain('services.bigDataAI.overview.description')
    })

    it('renders all four AI capability keys', () => {
      const text = wrapper.text()
      expect(text).toContain('services.bigDataAI.aiCapabilities.machineLearning.title')
      expect(text).toContain('services.bigDataAI.aiCapabilities.nlp.title')
      expect(text).toContain('services.bigDataAI.aiCapabilities.computerVision.title')
      expect(text).toContain('services.bigDataAI.aiCapabilities.predictiveAnalytics.title')
    })

    it('renders all four big data capability keys', () => {
      const text = wrapper.text()
      expect(text).toContain('services.bigDataAI.bigData.dataPipeline.title')
      expect(text).toContain('services.bigDataAI.bigData.dataWarehouse.title')
      expect(text).toContain('services.bigDataAI.bigData.realTimeAnalytics.title')
      expect(text).toContain('services.bigDataAI.bigData.dataGovernance.title')
    })

    it('renders all four use case keys', () => {
      const text = wrapper.text()
      expect(text).toContain('services.bigDataAI.useCases.finance.title')
      expect(text).toContain('services.bigDataAI.useCases.retail.title')
      expect(text).toContain('services.bigDataAI.useCases.healthcare.title')
      expect(text).toContain('services.bigDataAI.useCases.smartCity.title')
    })

    it('renders all four stat labels', () => {
      const text = wrapper.text()
      expect(text).toContain('services.bigDataAI.stats.dataVolume.label')
      expect(text).toContain('services.bigDataAI.stats.models.label')
      expect(text).toContain('services.bigDataAI.stats.accuracy.label')
      expect(text).toContain('services.bigDataAI.stats.uptime.label')
    })

    it('renders all four process step numbers', () => {
      const text = wrapper.text()
      expect(text).toContain('services.bigDataAI.process.consult.step')
      expect(text).toContain('services.bigDataAI.process.design.step')
      expect(text).toContain('services.bigDataAI.process.deploy.step')
      expect(text).toContain('services.bigDataAI.process.optimize.step')
    })

    it('renders the CTA button label key', () => {
      expect(wrapper.text()).toContain('services.bigDataAI.cta.button')
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

    it('returns the key as fallback when translation is not loaded', () => {
      const result = (wrapper.vm as any).t('services.bigDataAI.title')
      expect(result).toBe('services.bigDataAI.title')
    })
  })

  // ============================================
  // Edge Cases
  // ============================================
  describe('Edge Cases', () => {
    it('renders a loading skeleton initially and content after mount', async () => {
      // First render: loading skeleton present, real content hidden.
      const fresh = mount(ServiceBigData)
      expect(fresh.find('.bd__skeleton').exists()).toBe(true)
      expect(fresh.find('.bd__content').exists()).toBe(false)

      // Trigger onMounted lifecycle (flush pending callbacks).
      await fresh.vm.$nextTick()
      // Allow microtask queue to settle for onMounted.
      await Promise.resolve()
      await fresh.vm.$nextTick()

      // After loading flips, skeleton is gone and content is shown.
      expect(fresh.find('.bd__skeleton').exists()).toBe(false)
      expect(fresh.find('.bd__content').exists()).toBe(true)
      fresh.unmount()
    })

    it('renders consistently across multiple mounts', () => {
      const w1 = mount(ServiceBigData)
      const w2 = mount(ServiceBigData)
      expect(w1.findAll('section').length).toBe(w2.findAll('section').length)
      w1.unmount()
      w2.unmount()
    })

    it('creates a meta description tag when none exists yet', async () => {
      // Remove any pre-existing description meta so the onMounted create branch runs.
      document.querySelectorAll('meta[name="description"]').forEach((el) => el.remove())
      const before = document.querySelectorAll('meta[name="description"]').length
      expect(before).toBe(0)

      const w = mount(ServiceBigData, {
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

      const w = mount(ServiceBigData, {
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
