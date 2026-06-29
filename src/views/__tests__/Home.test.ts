/**
 * @file Home.test.ts
 * @description Unit tests for Home view — KTech official-site content parity.
 *
 * Drives the REAL useLanguage composable (translations are statically bundled
 * in src/locales/{en,zh}.json, so no fetch / no mock is needed). All assertions
 * pin the actual KTech copy and the cyberpunk visual language. A raw-key
 * regression guard and a zh-locale toggle test ensure no `home.*` placeholder
 * ever leaks to the DOM and that the Chinese catalog is exercised.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import fs from 'node:fs'
import path from 'node:path'
import { useLanguage } from '../../composables/useLanguage.js'
import Home from '../Home.vue'

// A minimal in-memory router so <router-link to="/about"> resolves into a real
// <a href="/about"> anchor we can assert against (matches the production setup).
const buildRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: Home },
      { path: '/about', component: { template: '<div>About</div>' } },
    ],
  })

describe('Home.vue', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    // Pin the default language for deterministic content assertions.
    useLanguage().setLanguage('en')
  })

  afterEach(() => {
    if (wrapper) wrapper.unmount()
    useLanguage().setLanguage('en')
  })

  // Mount with a real in-memory router so <router-link to="/about"> resolves
  // to a real <a href="/about"> anchor.
  const mountHome = () => {
    wrapper = mount(Home, { global: { plugins: [buildRouter()] } })
    return wrapper
  }

  describe('Cyberpunk structure', () => {
    beforeEach(() => {
      wrapper = mountHome()
    })

    it('renders the .home root', () => {
      expect(wrapper.find('.home').exists()).toBe(true)
    })

    it('renders exactly two layered grid backgrounds', () => {
      expect(wrapper.findAll('.grid-bg').length).toBe(2)
      expect(wrapper.find('.grid-bg-2').exists()).toBe(true)
    })

    it('renders the cyber header as the radial-pulse carrier inside .home', () => {
      // The hero ::before radial-gradient pulse (About's pattern) needs a real
      // structural carrier element. header.cyber-header is that carrier.
      const header = wrapper.find('.home header.cyber-header')
      expect(header.exists()).toBe(true)
    })

    it('renders the cyber header with neon + glitch title', () => {
      const header = wrapper.find('header.cyber-header')
      expect(header.exists()).toBe(true)
      const h1 = header.find('h1.neon-text.glitch-text')
      expect(h1.exists()).toBe(true)
    })

    it('keeps the data-text attribute powering the glitch effect', () => {
      const title = wrapper.find('.glitch-text')
      expect(title.attributes('data-text')).toBeTruthy()
    })

    it('renders a subtitle eyebrow', () => {
      expect(wrapper.find('.subtitle').exists()).toBe(true)
    })

    it('reuses .cyber-card for the hero intro', () => {
      expect(wrapper.find('.cyber-card').exists()).toBe(true)
    })

    it('wraps the What We Do block in a .section with .section-title.neon-text', () => {
      const whatwedo = wrapper.find('.whatwedo')
      expect(whatwedo.exists()).toBe(true)
      expect(whatwedo.classes()).toContain('section')
      const heading = whatwedo.find('h2.section-title.neon-text')
      expect(heading.exists()).toBe(true)
    })

    it('applies cyber-card + hover-lift to every solution card', () => {
      const cards = wrapper.findAll('.solution-card')
      expect(cards.length).toBe(6)
      cards.forEach((card) => {
        expect(card.classes()).toContain('cyber-card')
        expect(card.classes()).toContain('hover-lift')
      })
    })

    it('keeps the neon-border CTA control', () => {
      const cta = wrapper.find('.cta')
      expect(cta.exists()).toBe(true)
      expect(cta.find('.cyber-button.neon-border').exists()).toBe(true)
    })

    it('uses a single semantic h1', () => {
      expect(wrapper.findAll('h1').length).toBe(1)
    })

    it('uses semantic <header> and <section> landmarks', () => {
      expect(wrapper.find('header').exists()).toBe(true)
      expect(wrapper.findAll('section').length).toBeGreaterThan(0)
    })
  })

  describe('Hero content (en)', () => {
    beforeEach(() => {
      wrapper = mountHome()
    })

    it('H1 contains the official KTech mission title', () => {
      expect(wrapper.find('h1').text()).toContain(
        'Leading Fintech Company in China ASEAN Region',
      )
    })

    it('glitch data-text mirrors the title', () => {
      expect(wrapper.find('.glitch-text').attributes('data-text')).toContain(
        'Leading Fintech Company in China ASEAN Region',
      )
    })

    it('subtitle is the official eyebrow', () => {
      expect(wrapper.find('.subtitle').text()).toBe('Better fintech for customers')
    })

    it('first hero paragraph names KBank + the Shenzhen regulator', () => {
      const firstP = wrapper.find('.cyber-card p.hero-description')
      const text = firstP.exists() ? firstP.text() : wrapper.find('.cyber-card p').text()
      expect(text).toContain('KASIKORNBANK')
      expect(text).toContain('KBank')
      expect(text).toContain('Shenzhen Municipal Financial Regulatory Bureau')
    })

    it('second hero paragraph lists the service pillars', () => {
      const paragraphs = wrapper.findAll('.cyber-card p')
      expect(paragraphs.length).toBeGreaterThanOrEqual(2)
      const second = paragraphs[1].text()
      expect(second).toContain('blockchain')
      expect(second).toContain('big data')
      expect(second).toContain('artificial intelligence')
    })

    it('CTA reads "Learn more" and links to /about', () => {
      const cta = wrapper.find('.cta')
      expect(cta.text()).toContain('Learn more')
      const link = cta.find('a[href="/about"]')
      expect(link.exists()).toBe(true)
    })
  })

  describe('What We Do section (en)', () => {
    beforeEach(() => {
      wrapper = mountHome()
    })

    it('renders the section heading "What We Do"', () => {
      expect(wrapper.text()).toContain('What We Do')
    })

    it('renders both group labels', () => {
      const text = wrapper.text()
      expect(text).toContain('Blockchain & Web3')
      expect(text).toContain('Banking Solution')
    })

    it('renders exactly six solution cards', () => {
      expect(wrapper.findAll('.solution-card').length).toBe(6)
    })

    it('Group 1: Regulated Public Blockchain', () => {
      const text = wrapper.text()
      expect(text).toContain('Regulated Public Blockchain')
      expect(text).toContain('Regulation-friendly blockchain infrastructure')
    })

    it('Group 1: Cross Border Payment', () => {
      const text = wrapper.text()
      expect(text).toContain('Cross Border Payment')
      expect(text).toContain('Multi-rail cross-border payment solution')
    })

    it('Group 1: Digital Asset Custody', () => {
      const text = wrapper.text()
      expect(text).toContain('Digital Asset Custody')
      expect(text).toContain('Bank-grade secure digital asset custody solution')
    })

    it('Group 1: Stablecoin', () => {
      const text = wrapper.text()
      expect(text).toContain('Stablecoin')
      expect(text).toContain('Compliance-ready stablecoin solution')
    })

    it('Group 2: Retail Lending', () => {
      const text = wrapper.text()
      expect(text).toContain('Retail Lending')
      expect(text).toContain('Unified IT solution provider for retail lending')
    })

    it('Group 2: Supply Chain Finance', () => {
      const text = wrapper.text()
      expect(text).toContain('Supply Chain Finance')
      expect(text).toContain('Advanced online supply chain financial solutions')
    })

    it('every solution card exposes a title and description', () => {
      wrapper.findAll('.solution-card').forEach((card) => {
        expect(card.find('h4').exists()).toBe(true)
        expect(card.find('p').exists()).toBe(true)
        expect(card.find('h4').text().length).toBeGreaterThan(0)
        expect(card.find('p').text().length).toBeGreaterThan(0)
      })
    })
  })

  describe('Stats block removed', () => {
    beforeEach(() => {
      wrapper = mountHome()
    })

    it('does not render the fabricated stats container', () => {
      expect(wrapper.find('.stats').exists()).toBe(false)
    })

    it('does not render any stat items', () => {
      expect(wrapper.findAll('.stat').length).toBe(0)
      expect(wrapper.findAll('.stat-value').length).toBe(0)
    })

    it('does not surface the fabricated SaaS numbers', () => {
      const text = wrapper.text()
      expect(text).not.toContain('99.9%')
      expect(text).not.toContain('1M+')
      expect(text).not.toContain('50ms')
    })
  })

  describe('i18n regression guards', () => {
    it('never renders a raw home.* placeholder key', () => {
      wrapper = mountHome()
      const text = wrapper.text()
      // Keys render glued to other text, so do NOT use \b here — match the
      // literal "home." prefix followed by at least one segment char.
      const rawKeyPattern = /home\.[a-zA-Z][a-zA-Z0-9.]*/g
      expect(text.match(rawKeyPattern)).toBeNull()
    })

    it('renders the zh catalog when the language is toggled', () => {
      const { setLanguage } = useLanguage()
      setLanguage('zh')
      wrapper = mountHome()
      const text = wrapper.text()
      expect(text).toContain('致力于成为中国—东盟地区领先的金融科技公司')
      expect(text).toContain('受监管的公共区块链')
      expect(text).toContain('了解更多')
    })
  })

  // ============================================
  // Parallax (AC #177) — visual gate. These source-level assertions make the
  // test RED if the parallax CSS or the useParallax wiring is deleted. They
  // complement the composable unit tests by pinning that Home actually opts in.
  // ============================================
  describe('Parallax (AC #177)', () => {
    const homeSource = fs.readFileSync(
      path.resolve(process.cwd(), 'src', 'views', 'Home.vue'),
      'utf-8',
    )

    it('Home uses useParallax (parity with About)', () => {
      expect(homeSource).toMatch(/from\s+['"]\.\.\/composables\/useParallax['"]/)
      expect(homeSource).toMatch(/useParallax\s*\(/)
    })

    it('Home wires useParallax with the grid + hero layers', () => {
      // The three Home parallax layers per the approved plan.
      expect(homeSource).toContain('.grid-bg')
      expect(homeSource).toContain('.grid-bg-2')
      expect(homeSource).toContain('.cyber-header')
      // Intensity numbers must be present (grid 12, overlay 6, hero 20).
      expect(homeSource).toMatch(/intensity:\s*12/)
      expect(homeSource).toMatch(/intensity:\s*6/)
      expect(homeSource).toMatch(/intensity:\s*20/)
    })

    it('Home binds the enabled ref to the root (dead-reactive-state guard)', () => {
      // rootRef on the root + enabled consumed via a data-attr binding.
      expect(homeSource).toMatch(/ref=["']rootRef["']/)
      expect(homeSource).toMatch(/data-parallax/)
    })

    it('Home parallax CSS source is present (will-change on grid/hero layers)', () => {
      // Deleting the parallax-targeted will-change rule makes this RED.
      expect(homeSource).toMatch(/will-change:\s*transform/)
      // Hero layer must carry a transition (no keyframe conflict there).
      expect(homeSource).toMatch(/\.cyber-header[^{]*\{[^}]*transition:\s*transform/s)
    })

    it('Home does NOT add a transform transition to .grid-bg-2 (keyframe conflict)', () => {
      // The gridMove keyframe already drives .grid-bg-2's transform; a transition
      // would fight it. Assert the scoped style keeps transition OUT of that rule.
      const grid2Block = homeSource.match(/\.grid-bg-2\s*\{([^}]*)\}/)
      expect(grid2Block).not.toBeNull()
      expect(grid2Block![1]).not.toMatch(/transition:\s*transform/)
    })
  })

  // ============================================
  // Packet Route (#184) — shipped-app gate.
  // Mounts the REAL Home view with the REAL useLanguage and asserts the Packet
  // Route mini-game renders inside it. This FAILS if PacketRoute is unwired
  // from Home (the shipped-app gate: a component that exists in src/ but isn't
  // mounted into the live app is dead code). Mirrors the CyberOpsHud gate.
  // ============================================
  describe('Packet Route shipped-app gate (#184)', () => {
    const homeSource = fs.readFileSync(
      path.resolve(process.cwd(), 'src', 'views', 'Home.vue'),
      'utf-8',
    )

    it('Home imports PacketRoute', () => {
      expect(homeSource).toMatch(/from\s+['"]\.\.\/components\/PacketRoute\.vue['"]/)
    })

    it('Home wires PacketRoute inside a .packet-route-section', () => {
      expect(homeSource).toMatch(/packet-route-section/)
      expect(homeSource).toMatch(/<PacketRoute\b/)
    })

    it('renders [data-test="packet-route"] inside the mounted Home view', () => {
      wrapper = mountHome()
      const pr = wrapper.find('[data-test="packet-route"]')
      expect(pr.exists()).toBe(true)
    })

    it('renders real localized title copy (not a raw key)', () => {
      wrapper = mountHome()
      // The component renders the packetRoute.title heading inside Home.
      expect(wrapper.text()).toContain('Packet Route')
      // No raw key leakage.
      expect(wrapper.text()).not.toMatch(/packetRoute\.[a-zA-Z]/)
    })

    it('renders the PacketRoute grid inside the mounted Home view', () => {
      wrapper = mountHome()
      // The puzzle grid is the playable surface — must be present in the live app.
      expect(wrapper.find('[data-test="packet-grid"]').exists()).toBe(true)
    })

    it('renders the zh localized title when language toggled', () => {
      useLanguage().setLanguage('zh')
      wrapper = mountHome()
      expect(wrapper.text()).toContain('数据包路由')
    })
  })
})
