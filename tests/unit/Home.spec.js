import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Home from '../../src/views/Home.vue'
import { useLanguage } from '../../src/composables/useLanguage'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia } from 'pinia'

// Drives the REAL useLanguage composable (translations are statically bundled
// in src/locales/{en,zh}.json). No module mock, no useIntersectionObserver mock —
// Home.vue does not use the intersection observer.

describe('Home.vue', () => {
  let router
  let pinia
  let wrapper

  beforeEach(() => {
    router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: Home }, { path: '/about', component: { template: '<div>About</div>' } }],
    })
    pinia = createPinia()
    useLanguage().setLanguage('en')
  })

  afterEach(() => {
    if (wrapper) wrapper.unmount()
    useLanguage().setLanguage('en')
  })

  const mountHome = () => {
    wrapper = mount(Home, { global: { plugins: [router, pinia] } })
    return wrapper
  }

  describe('Cyberpunk structure', () => {
    it('renders the .home root with exactly two layered grid backgrounds', () => {
      const w = mountHome()
      expect(w.find('.home').exists()).toBe(true)
      expect(w.findAll('.grid-bg').length).toBe(2)
      expect(w.find('.grid-bg-2').exists()).toBe(true)
    })

    it('renders the cyber header as the radial-pulse carrier inside .home', () => {
      const w = mountHome()
      // The hero ::before radial-gradient pulse (About's pattern) needs a real
      // structural carrier. header.cyber-header is that carrier.
      expect(w.find('.home header.cyber-header').exists()).toBe(true)
    })

    it('keeps neon-text + glitch-text + data-text on the title', () => {
      const w = mountHome()
      const title = w.find('h1.neon-text.glitch-text')
      expect(title.exists()).toBe(true)
      expect(title.attributes('data-text')).toContain(
        'Leading Fintech Company in China ASEAN Region',
      )
    })

    it('keeps the .cyber-card hero container and the neon-border CTA', () => {
      const w = mountHome()
      expect(w.find('.cyber-card').exists()).toBe(true)
      const cta = w.find('.cta')
      expect(cta.exists()).toBe(true)
      expect(cta.find('.cyber-button.neon-border').exists()).toBe(true)
    })

    it('wraps What We Do in a .section with .section-title.neon-text', () => {
      const w = mountHome()
      const whatwedo = w.find('.whatwedo')
      expect(whatwedo.exists()).toBe(true)
      expect(whatwedo.classes()).toContain('section')
      expect(whatwedo.find('h2.section-title.neon-text').exists()).toBe(true)
    })

    it('applies cyber-card + hover-lift to all six solution cards', () => {
      const w = mountHome()
      const cards = w.findAll('.solution-card')
      expect(cards.length).toBe(6)
      cards.forEach((card) => {
        expect(card.classes()).toContain('cyber-card')
        expect(card.classes()).toContain('hover-lift')
      })
    })

    it('uses a single semantic h1 and at least one section', () => {
      const w = mountHome()
      expect(w.findAll('h1').length).toBe(1)
      expect(w.findAll('section').length).toBeGreaterThan(0)
    })
  })

  describe('Hero content (en)', () => {
    it('H1 + subtitle carry the official KTech copy', () => {
      const w = mountHome()
      expect(w.find('h1').text()).toContain(
        'Leading Fintech Company in China ASEAN Region',
      )
      expect(w.find('.subtitle').text()).toBe('Better fintech for customers')
    })

    it('first hero paragraph names KBank and the Shenzhen regulator', () => {
      const w = mountHome()
      const firstP = w.findAll('.cyber-card p')[0].text()
      expect(firstP).toContain('KASIKORNBANK')
      expect(firstP).toContain('KBank')
      expect(firstP).toContain('Shenzhen Municipal Financial Regulatory Bureau')
    })

    it('second hero paragraph lists blockchain, big data, AI', () => {
      const w = mountHome()
      const paragraphs = w.findAll('.cyber-card p')
      const second = paragraphs[1].text()
      expect(second).toContain('blockchain')
      expect(second).toContain('big data')
      expect(second).toContain('artificial intelligence')
    })

    it('CTA reads "Learn more" and points to /about', () => {
      const w = mountHome()
      const cta = w.find('.cta')
      expect(cta.text()).toContain('Learn more')
      expect(cta.find('a[href="/about"]').exists()).toBe(true)
    })
  })

  describe('What We Do section (en)', () => {
    it('renders the heading + both group labels', () => {
      const w = mountHome()
      const text = w.text()
      expect(text).toContain('What We Do')
      expect(text).toContain('Blockchain & Web3')
      expect(text).toContain('Banking Solution')
    })

    it('renders exactly six solution cards', () => {
      const w = mountHome()
      expect(w.findAll('.solution-card').length).toBe(6)
    })

    it('renders every card title and description', () => {
      const w = mountHome()
      const text = w.text()
      // Blockchain & Web3 group
      expect(text).toContain('Regulated Public Blockchain')
      expect(text).toContain('Regulation-friendly blockchain infrastructure')
      expect(text).toContain('Cross Border Payment')
      expect(text).toContain('Multi-rail cross-border payment solution')
      expect(text).toContain('Digital Asset Custody')
      expect(text).toContain('Bank-grade secure digital asset custody solution')
      expect(text).toContain('Stablecoin')
      expect(text).toContain('Compliance-ready stablecoin solution')
      // Banking Solution group
      expect(text).toContain('Retail Lending')
      expect(text).toContain('Unified IT solution provider for retail lending')
      expect(text).toContain('Supply Chain Finance')
      expect(text).toContain('Advanced online supply chain financial solutions')
    })
  })

  describe('Stats block removed', () => {
    it('does not render fabricated stats markup or numbers', () => {
      const w = mountHome()
      expect(w.find('.stats').exists()).toBe(false)
      expect(w.findAll('.stat-value').length).toBe(0)
      const text = w.text()
      expect(text).not.toContain('99.9%')
      expect(text).not.toContain('1M+')
      expect(text).not.toContain('50ms')
    })
  })

  describe('Accessibility', () => {
    it('has a sensible heading hierarchy (1x h1, section h2, 2 group h3, 6 card h4)', () => {
      const w = mountHome()
      expect(w.findAll('h1').length).toBe(1)
      expect(w.findAll('h2').length).toBeGreaterThan(0)
      // 2 What-We-Do group labels.
      expect(w.findAll('h3').length).toBe(2)
      // 6 solution-card titles.
      expect(w.findAll('h4').length).toBe(6)
    })

    it('uses semantic <header> and <section> landmarks', () => {
      const w = mountHome()
      expect(w.find('header').exists()).toBe(true)
      expect(w.findAll('section').length).toBeGreaterThan(0)
    })
  })

  describe('i18n regression guards', () => {
    it('never renders a raw home.* placeholder key', () => {
      const w = mountHome()
      const text = w.text()
      // Keys render glued to neighbouring text — do NOT use \b.
      const rawKeyPattern = /home\.[a-zA-Z][a-zA-Z0-9.]*/g
      expect(text.match(rawKeyPattern)).toBeNull()
    })

    it('renders the zh catalog when toggled', () => {
      useLanguage().setLanguage('zh')
      const w = mountHome()
      const text = w.text()
      expect(text).toContain('致力于成为中国—东盟地区领先的金融科技公司')
      expect(text).toContain('受监管的公共区块链')
      expect(text).toContain('了解更多')
    })
  })
})
