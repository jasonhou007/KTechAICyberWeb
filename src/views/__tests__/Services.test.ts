/**
 * @file Services.test.ts
 * @description Unit tests for the Services index view
 *
 * Test Categories:
 * - Rendering Tests: grid, header, animated backgrounds, card/article counts
 * - Content Tests: title/subtitle, per-service icons, descriptions, feature
 *   bullets, related-links copy
 * - Accessibility Tests: single h1, per-card h2, aria-labels on cards/links,
 *   data-text glitch attribute
 * - Behavior Tests: onMounted sets staggered animation-delay on cards via the
 *   real document (attachTo), is-visible gating, CTA scrollToContact
 * - Edge Cases: only services with a `link` render a detail link
 *
 * useLanguage is mocked to return real English strings so assertions check
 * rendered content rather than bare keys. The IntersectionObserver path in
 * useIntersectionObserverList is inactive under happy-dom (no IO), so cards
 * never receive the `is-visible` class — that gating is asserted explicitly.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import Services from '../Services.vue'
import RouterLinkStub from '../../components/__tests__/RouterLinkStub.vue'

const mockTranslations: Record<string, string> = {
  'services.title': 'Our Services',
  'services.subtitle': 'Comprehensive fintech engineering solutions',
  'services.relatedServices': 'Learn more',
  'services.cta': 'Get in touch',
  // Per-item titles/descriptions/features
  'services.items.projectManagement.title': 'Project Management',
  'services.items.projectManagement.description': 'Agile delivery at scale.',
  'services.items.projectManagement.features.sprint': 'Sprint planning',
  'services.items.projectManagement.features.velocity': 'Velocity tracking',
  'services.items.projectManagement.features.reporting': 'Status reporting',
  'services.items.retailCredit.title': 'Retail Credit',
  'services.items.retailCredit.description': 'Consumer lending platforms.',
  'services.items.retailCredit.features.underwriting': 'Underwriting',
  'services.items.retailCredit.features.analytics': 'Risk analytics',
  'services.items.retailCredit.features.compliance': 'Regulatory compliance',
  'services.items.supplyChain.title': 'Supply Chain Finance',
  'services.items.supplyChain.description': 'Working-capital solutions.',
  'services.items.supplyChain.features.tracking': 'Invoice tracking',
  'services.items.supplyChain.features.currency': 'Multi-currency',
  'services.items.supplyChain.features.mitigation': 'Risk mitigation',
  'services.items.blockchain.title': 'Blockchain',
  'services.items.blockchain.description': 'Distributed ledger engineering.',
  'services.items.blockchain.features.contracts': 'Smart contracts',
  'services.items.blockchain.features.consensus': 'Consensus design',
  'services.items.blockchain.features.trails': 'Audit trails',
  'services.items.bigDataAI.title': 'Big Data & AI',
  'services.items.bigDataAI.description': 'Data-driven intelligence.',
  'services.items.bigDataAI.features.machineLearning': 'Machine learning',
  'services.items.bigDataAI.features.predictiveAnalytics': 'Predictive analytics',
  'services.items.bigDataAI.features.dataGovernance': 'Data governance',
}

vi.mock('../../composables/useLanguage', () => ({
  useLanguage: () => ({
    currentLanguage: { value: 'en' },
    languageDisplay: { value: 'EN' },
    isEnglish: { value: true },
    initLanguage: vi.fn(),
    setLanguage: vi.fn(),
    toggleLanguage: vi.fn(),
    t: (key: string) => mockTranslations[key] || key,
  }),
}))

// vue-router is not imported by Services.vue, but stubbing router-link is
// required so the rendered <router-link> becomes a queryable <a>.

describe('Services.vue', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    wrapper = mount(Services, {
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
    it('renders the root .services container', () => {
      expect(wrapper.find('.services').exists()).toBe(true)
    })

    it('renders two animated background grid layers', () => {
      expect(wrapper.findAll('.grid-bg')).toHaveLength(2)
    })

    it('renders a header with the page title and subtitle', () => {
      expect(wrapper.find('header.cyber-header').exists()).toBe(true)
      expect(wrapper.find('.cyber-header h1').text()).toBe('Our Services')
      expect(wrapper.find('.subtitle').text()).toBe(
        'Comprehensive fintech engineering solutions'
      )
    })

    it('renders a services-grid section with five service cards', () => {
      expect(wrapper.find('section.services-grid').exists()).toBe(true)
      expect(wrapper.findAll('article.service-card')).toHaveLength(5)
    })

    it('renders a CTA button', () => {
      const btn = wrapper.find('.cta .cyber-button')
      expect(btn.exists()).toBe(true)
      expect(btn.element.tagName.toLowerCase()).toBe('button')
      expect(btn.text()).toContain('Get in touch')
    })

    it('renders three feature bullets per service card', () => {
      wrapper.findAll('article.service-card').forEach((card) => {
        expect(card.findAll('.service-features li')).toHaveLength(3)
      })
    })

    it('renders the › bullet glyph before every feature', () => {
      const bullets = wrapper.findAll('.feature-bullet')
      expect(bullets).toHaveLength(15) // 5 cards * 3 features
      bullets.forEach((b) => expect(b.text()).toBe('›'))
    })
  })

  // ============================================
  // Content Tests
  // ============================================
  describe('Content', () => {
    it('renders the correct emoji icon for each service', () => {
      const icons = wrapper.findAll('.service-icon').map((i) => i.text())
      expect(icons).toEqual(['📋', '💳', '🔗', '⛓️', '🧠'])
    })

    it('renders the correct h2 title and description per card', () => {
      const cards = wrapper.findAll('article.service-card')
      expect(cards[0].find('.service-title').text()).toBe('Project Management')
      expect(cards[0].find('.service-description').text()).toBe('Agile delivery at scale.')
      expect(cards[4].find('.service-title').text()).toBe('Big Data & AI')
      expect(cards[4].find('.service-description').text()).toBe('Data-driven intelligence.')
    })

    it('renders the translated feature list for the blockchain card', () => {
      const card = wrapper.findAll('article.service-card')[3]
      const features = card.findAll('.service-features li').map((li) =>
        li.text().replace('›', '').trim()
      )
      expect(features).toEqual(['Smart contracts', 'Consensus design', 'Audit trails'])
    })

    it('renders the data-text attribute for the glitch effect', () => {
      expect(wrapper.find('.cyber-header h1').attributes('data-text')).toBe(
        'Our Services'
      )
    })
  })

  // ============================================
  // Navigation
  // ============================================
  describe('Navigation', () => {
    it('only renders detail links for services that define a link', () => {
      const links = wrapper.findAll('.service-link')
      // retail-credit (link: /services/retail-lending) and big-data-ai
      expect(links).toHaveLength(2)
      const hrefs = links.map((l) => l.attributes('href'))
      expect(hrefs).toEqual(['/services/retail-lending', '/services/big-data-ai'])
    })

    it('does not render a detail link for cards without one', () => {
      const projectManagement = wrapper.findAll('article.service-card')[0]
      expect(projectManagement.find('.service-link').exists()).toBe(false)
    })

    it('labels each card and link with the service title via aria-label', () => {
      const cards = wrapper.findAll('article.service-card')
      expect(cards[0].attributes('aria-label')).toBe('Project Management')
      expect(cards[1].attributes('aria-label')).toBe('Retail Credit')

      const links = wrapper.findAll('.service-link')
      expect(links[0].attributes('aria-label')).toBe('Retail Credit')
      expect(links[1].attributes('aria-label')).toBe('Big Data & AI')
    })
  })

  // ============================================
  // Behavior Tests
  // ============================================
  describe('Behavior', () => {
    const extractDelay = (style: string): number | null => {
      const match = style.match(/animation-delay:\s*([\d.]+)s/)
      return match ? parseFloat(match[1]) : null
    }

    // The view's onMounted uses requestAnimationFrame + document.querySelectorAll
    // to stamp staggered animation-delay on cards. That only works against the
    // real document, so these tests mount with attachTo: document.body.
    it('applies staggered animation-delay to service cards on mount', async () => {
      document.querySelectorAll('.service-card').forEach((el) => el.remove())
      const w = mount(Services, {
        attachTo: document.body,
        global: { stubs: { 'router-link': RouterLinkStub } },
      })
      // requestAnimationFrame is async; wait for it to flush.
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)))
      await w.vm.$nextTick()

      const cards = Array.from(document.querySelectorAll('.service-card'))
      expect(cards).toHaveLength(5)
      const delays = cards.map((el) =>
        extractDelay((el as HTMLElement).getAttribute('style') || '')
      )
      // index * 0.15s for the five cards
      expect(delays[0]).toBeCloseTo(0, 5)
      expect(delays[1]).toBeCloseTo(0.15, 5)
      expect(delays[2]).toBeCloseTo(0.3, 5)
      expect(delays[3]).toBeCloseTo(0.45, 5)
      expect(delays[4]).toBeCloseTo(0.6, 5)
      w.unmount()
    })

    it('gates the is-visible class on the IntersectionObserver (fires via polyfill)', async () => {
      // #224: the global IntersectionObserver polyfill
      // (tests/setup-intersection-observer.js) fires isIntersecting=true on
      // observe(), so — unlike the prior "happy-dom has no IO" assumption —
      // the Services cards DO become visible once the microtask callback flushes.
      // Assert the honest behavior: after the IO fires, every card gains
      // is-visible. (If the polyfill were removed/broken, the cards would stay
      // hidden and this test would fail — still a regression gate on the
      // IO-driven reveal, just inverted to match the polyfilled env.)
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 0))
      await wrapper.vm.$nextTick()
      const cards = wrapper.findAll('article.service-card')
      expect(cards.length).toBeGreaterThan(0)
      cards.forEach((card) => {
        expect(card.classes()).toContain('is-visible')
      })
    })

    it('scrolls to the bottom of the page when the CTA button is clicked', async () => {
      const scrollTo = vi
        .spyOn(window, 'scrollTo')
        .mockImplementation(() => undefined)
      await wrapper.find('.cta .cyber-button').trigger('click')
      expect(scrollTo).toHaveBeenCalledTimes(1)
      const arg = scrollTo.mock.calls[0][0] as ScrollToOptions
      expect(arg.behavior).toBe('smooth')
      // top should be the full document height
      expect(arg.top).toBe(document.body.scrollHeight)
      scrollTo.mockRestore()
    })
  })

  // ============================================
  // Accessibility Tests
  // ============================================
  describe('Accessibility', () => {
    it('uses exactly one h1 for the page title', () => {
      expect(wrapper.findAll('h1')).toHaveLength(1)
    })

    it('uses an h2 for every service card title', () => {
      expect(wrapper.findAll('.service-title')).toHaveLength(5)
      wrapper.findAll('.service-title').forEach((t) => {
        expect(t.element.tagName.toLowerCase()).toBe('h2')
      })
    })
  })

  // ============================================
  // Edge Cases
  // ============================================
  describe('Edge Cases', () => {
    it('renders a consistent structure across repeated mounts', () => {
      const w1 = mount(Services, {
        global: { stubs: { 'router-link': RouterLinkStub } },
      })
      const w2 = mount(Services, {
        global: { stubs: { 'router-link': RouterLinkStub } },
      })
      expect(w1.findAll('article.service-card').length).toBe(
        w2.findAll('article.service-card').length
      )
      expect(w1.findAll('.service-link').length).toBe(w2.findAll('.service-link').length)
      w1.unmount()
      w2.unmount()
    })
  })
})
