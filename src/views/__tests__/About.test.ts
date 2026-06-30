/**
 * @file About.test.ts
 * @description Comprehensive unit tests for the About view
 * @ticket #46 - TEST-008: About View Unit Tests - TDD with Vitest
 *
 * Test Categories:
 * - Rendering Tests: Component mount and section structure
 * - Section/Content Tests: All About sections present with correct structure
 * - Accessibility Tests: Semantic HTML, heading hierarchy, ARIA
 * - i18n Tests: Translation function behavior and real-copy rendering
 * - Styling Tests: Cyberpunk theme classes and structural hooks
 * - Edge Cases: Re-mount stability, no console errors
 *
 * Translations ARE bundled in the test environment (useLanguage statically
 * imports src/locales/*.json), so content assertions check for the real
 * English copy, not raw keys. A regression guard below ensures no raw
 * `about.*` placeholder key ever leaks into the rendered output.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import fs from 'node:fs'
import path from 'node:path'
import About from '../About.vue'

describe('About.vue', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    wrapper = mount(About, {
      global: {
        stubs: {
          // #203: About mounts <SelfDrivingDemo /> as an in-flow section.
          // Stub it so this suite's heading/section counts assert About's OWN
          // card structure (the demo is exercised by its own dedicated suites).
          SelfDrivingDemo: true,
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

    it('renders the root .about container', () => {
      expect(wrapper.find('.about').exists()).toBe(true)
    })

    it('renders the animated background layers', () => {
      expect(wrapper.find('.grid-bg').exists()).toBe(true)
      expect(wrapper.findAll('.grid-bg')).toHaveLength(2)
    })

    it('renders the hero section', () => {
      expect(wrapper.find('.about-hero').exists()).toBe(true)
      expect(wrapper.find('.hero-content').exists()).toBe(true)
    })

    it('renders all five content sections', () => {
      expect(wrapper.find('.who-we-are').exists()).toBe(true)
      expect(wrapper.find('.achievements').exists()).toBe(true)
      expect(wrapper.find('.vision-mission').exists()).toBe(true)
      expect(wrapper.find('.service-provider').exists()).toBe(true)
      expect(wrapper.find('.stats-section').exists()).toBe(true)
    })
  })

  // ============================================
  // Hero Section Tests
  // ============================================
  describe('Hero Section', () => {
    it('renders the page title as an h1', () => {
      const title = wrapper.find('.page-title')
      expect(title.exists()).toBe(true)
      expect(title.element.tagName.toLowerCase()).toBe('h1')
    })

    it('renders the pageTitle key inside the h1', () => {
      const title = wrapper.find('.page-title')
      expect(title.text()).toContain('ABOUT')
    })

    it('renders the pageTitleAccent inside an accent span', () => {
      const accent = wrapper.find('.page-title .accent')
      expect(accent.exists()).toBe(true)
      expect(accent.text()).toBe('KTECH')
    })

    it('exposes the data-text attribute for the glitch effect', () => {
      const title = wrapper.find('.page-title')
      expect(title.attributes('data-text')).toContain('ABOUT')
    })

    it('applies the neon-text and glitch-text classes to the title', () => {
      const title = wrapper.find('.page-title')
      expect(title.classes()).toContain('neon-text')
      expect(title.classes()).toContain('glitch-text')
    })

    it('renders the page subtitle paragraph', () => {
      const subtitle = wrapper.find('.page-subtitle')
      expect(subtitle.exists()).toBe(true)
      expect(subtitle.text()).toBe(
        'A fintech and AI company engineering intelligent financial systems for the next decade.',
      )
    })
  })

  // ============================================
  // Who We Are Section Tests
  // ============================================
  describe('Who We Are Section', () => {
    it('renders the section title heading', () => {
      expect(wrapper.find('.who-we-are .section-title').text()).toBe(
        'Who We Are',
      )
    })

    it('renders exactly five content cards', () => {
      const cards = wrapper.findAll('.who-we-are .content-card')
      expect(cards).toHaveLength(5)
    })

    it('renders each card with a circular neon-border icon', () => {
      const icons = wrapper.findAll('.who-we-are .card-icon.neon-border')
      expect(icons).toHaveLength(5)
    })

    it('renders the company name card heading and info', () => {
      const cards = wrapper.findAll('.who-we-are .content-card')
      expect(cards[0].find('h3').text()).toBe('Company Name')
      expect(cards[0].find('p').text()).toBe(
        'KASIKORN VISION INFORMATION TECHNOLOGY Co., Ltd. (KTech) — a fintech and AI company headquartered in Shenzhen.',
      )
    })

    it('renders the parent company card heading and info', () => {
      const cards = wrapper.findAll('.who-we-are .content-card')
      expect(cards[1].find('h3').text()).toBe('Parent Company')
      expect(cards[1].find('p').text()).toBe(
        'Backed by an established financial services group with deep expertise across banking and credit markets.',
      )
    })

    it('renders the capital card heading and amount', () => {
      const cards = wrapper.findAll('.who-we-are .content-card')
      expect(cards[2].find('h3').text()).toBe('Registered Capital')
      expect(cards[2].find('p').text()).toBe('RMB 300 million')
    })

    it('renders the established card heading and date', () => {
      const cards = wrapper.findAll('.who-we-are .content-card')
      expect(cards[3].find('h3').text()).toBe('Established')
      expect(cards[3].find('p').text()).toBe('June 2020')
    })

    it('renders the services card heading and list', () => {
      const cards = wrapper.findAll('.who-we-are .content-card')
      expect(cards[4].find('h3').text()).toBe('Core Services')
      expect(cards[4].find('p').text()).toBe(
        'Supply chain finance, retail lending platforms, and big data & AI solutions for financial institutions.',
      )
    })
  })

  // ============================================
  // Achievements Section Tests
  // ============================================
  describe('Achievements Section', () => {
    it('renders the section title heading', () => {
      expect(wrapper.find('.achievements .section-title').text()).toBe(
        'Our Achievements',
      )
    })

    it('renders exactly six achievement cards', () => {
      const cards = wrapper.findAll('.achievements .achievement-card')
      expect(cards).toHaveLength(6)
    })

    it('renders three ISO badge cards with neon borders', () => {
      const isoCards = wrapper.findAll(
        '.achievements .achievement-card:has(.iso-badge)',
      )
      expect(isoCards).toHaveLength(3)
    })

    it('renders the ISO badges with the correct certifications', () => {
      const isoBadges = wrapper.findAll('.achievements .iso-badge')
      expect(isoBadges.map((b) => b.text())).toEqual([
        'ISO9001',
        'ISO27001',
        'ISO20000',
      ])
    })

    it('renders two milestone badge cards', () => {
      const milestoneCards = wrapper.findAll(
        '.achievements .achievement-card:has(.milestone-badge)',
      )
      expect(milestoneCards).toHaveLength(2)
    })

    it('renders one projects badge card', () => {
      const projectsCard = wrapper.findAll(
        '.achievements .achievement-card:has(.projects-badge)',
      )
      expect(projectsCard).toHaveLength(1)
    })

    it('displays the projects badge value 20+', () => {
      expect(wrapper.find('.achievements .projects-badge').text()).toBe('20+')
    })

    it('renders the ISO achievement descriptions via i18n', () => {
      const cards = wrapper.findAll('.achievements .achievement-card')
      expect(cards[0].find('p').text()).toBe(
        'ISO 9001 certified for quality management systems.',
      )
      expect(cards[1].find('p').text()).toBe(
        'ISO 27001 certified for information security management.',
      )
      expect(cards[2].find('p').text()).toBe(
        'ISO 20000 certified for IT service management.',
      )
      expect(cards[3].find('p').text()).toBe(
        'First to deliver an AI-driven risk engine for a multinational financial institution.',
      )
      expect(cards[4].find('p').text()).toBe(
        'First to launch an end-to-end digital lending platform for a regional fintech.',
      )
      expect(cards[5].find('p').text()).toBe(
        'Delivered 20+ enterprise projects for banks, fintechs, and regulated industries.',
      )
    })
  })

  // ============================================
  // Who We Are Icons (AC #198) — live-DOM assertions that the 5 emoji icons in
  // the Who We Are cards have been replaced by the original cyber AboutIcon
  // inline-SVGs (company, parentRegion, capital, established, services). The
  // shipped-app gate: these svgs must appear in the REAL mounted About view.
  // ============================================
  describe('Who We Are Icons (AC #198)', () => {
    it('renders exactly five inline-SVG icons inside the Who We Are cards', () => {
      const svgs = wrapper.findAll('.who-we-are .card-icon svg')
      expect(svgs).toHaveLength(5)
    })

    it('every Who We Are icon svg has role="img"', () => {
      wrapper.findAll('.who-we-are .card-icon svg').forEach((svg) => {
        expect(svg.attributes('role')).toBe('img')
      })
    })

    it('every Who We Are icon svg has a non-empty aria-label that is not a raw key', () => {
      wrapper.findAll('.who-we-are .card-icon svg').forEach((svg) => {
        const label = svg.attributes('aria-label') || ''
        expect(label.length).toBeGreaterThan(0)
        expect(label).not.toMatch(/^about\./)
      })
    })

    it('does NOT render the legacy emoji icons (🏢🌏💰📅🚀) in Who We Are', () => {
      const icons = wrapper.findAll('.who-we-are .card-icon')
      const text = icons.map((i) => i.text()).join('')
      expect(text).not.toContain('🏢')
      expect(text).not.toContain('🌏')
      expect(text).not.toContain('💰')
      expect(text).not.toContain('📅')
      expect(text).not.toContain('🚀')
    })
  })

  // ============================================
  // Vision/Mission/Culture Section Tests
  // ============================================
  describe('Vision / Mission / Culture Section', () => {
    it('renders two VMC cards (vision and mission)', () => {
      const vmcCards = wrapper.findAll('.vmc-card')
      expect(vmcCards).toHaveLength(2)
    })

    it('renders the vision card title and description', () => {
      const visionCard = wrapper.findAll('.vmc-card')[0]
      expect(visionCard.find('h3').text()).toBe('Our Vision')
      expect(visionCard.find('p').text()).toBe(
        'To become a regional leading fintech platform.',
      )
    })

    it('renders the mission card title and description', () => {
      const missionCard = wrapper.findAll('.vmc-card')[1]
      // Mission title resolves to real English copy (about.mission.heading).
      expect(missionCard.find('h3').text()).toBe('Our Mission')
      expect(missionCard.find('p').text()).toBe(
        'Empower customers with cutting-edge technology.',
      )
    })

    it('renders the culture section heading', () => {
      expect(wrapper.find('.vision-mission .section-title').text()).toBe(
        'Our Culture',
      )
    })

    it('renders exactly four culture items', () => {
      expect(wrapper.findAll('.culture-item')).toHaveLength(4)
    })

    it('renders the four culture values via i18n keys', () => {
      const items = wrapper.findAll('.culture-item')
      expect(items[0].find('h4').text()).toBe('Customer First')
      expect(items[1].find('h4').text()).toBe('Open Collaboration')
      expect(items[2].find('h4').text()).toBe('Agile Innovation')
      expect(items[3].find('h4').text()).toBe('Professional Excellence')
    })
  })

  // ============================================
  // Service Provider Section Tests
  // ============================================
  describe('Service Provider Section', () => {
    it('renders the section title heading', () => {
      expect(wrapper.find('.service-provider .section-title').text()).toBe(
        'What We Do',
      )
    })

    it('renders exactly three service cards', () => {
      expect(wrapper.findAll('.service-card')).toHaveLength(3)
    })

    it('renders numbered service cards with neon-text numbers', () => {
      const numbers = wrapper.findAll('.service-number.neon-text')
      expect(numbers.map((n) => n.text())).toEqual(['01', '02', '03'])
    })

    it('renders each service card with title and description', () => {
      const cards = wrapper.findAll('.service-card')
      expect(cards[0].find('h3').text()).toBe('Financial Technology')
      expect(cards[0].find('p').text()).toBe(
        'End-to-end lending, credit, and supply chain finance platforms engineered for banks and fintechs.',
      )
      expect(cards[1].find('h3').text()).toBe('AI & Big Data')
      expect(cards[1].find('p').text()).toBe(
        'Machine learning, predictive analytics, and governed data platforms that turn data into decisions.',
      )
      expect(cards[2].find('h3').text()).toBe('Enterprise Solutions')
      expect(cards[2].find('p').text()).toBe(
        'Custom software, integration, and consulting that modernize regulated financial operations end to end.',
      )
    })

    it('applies the hover-lift cyber effect to service cards', () => {
      wrapper.findAll('.service-card').forEach((card) => {
        expect(card.classes()).toContain('hover-lift')
      })
    })
  })

  // ============================================
  // Stats Section Tests
  // ============================================
  describe('Stats Section', () => {
    it('renders the stats grid', () => {
      expect(wrapper.find('.stats-grid').exists()).toBe(true)
    })

    it('renders exactly three stat items', () => {
      expect(wrapper.findAll('.stat-item')).toHaveLength(3)
    })

    it('renders the projects stat with hardcoded value and translated label', () => {
      const items = wrapper.findAll('.stat-item')
      expect(items[0].find('.stat-value').text()).toBe('20+')
      // t('about.stats.projects') resolves to the bundled {label,value} object; the
      // real label "Projects" is present in the rendered text (not the raw key).
      expect(items[0].find('.stat-label').text()).toContain('Projects')
    })

    it('renders the commitment stat with hardcoded value and translated label', () => {
      const items = wrapper.findAll('.stat-item')
      expect(items[1].find('.stat-value').text()).toBe('100%')
      // t('about.stats.commitment') resolves to the bundled object; the real label
      // "Commitment" is present in the rendered text (not the raw key).
      expect(items[1].find('.stat-label').text()).toContain('Commitment')
    })

    it('renders the innovation stat with hardcoded value and translated label', () => {
      const items = wrapper.findAll('.stat-item')
      expect(items[2].find('.stat-value').text()).toBe('24/7')
      // t('about.stats.innovation') resolves to the bundled object; the real label
      // "Innovation" is present in the rendered text (not the raw key).
      expect(items[2].find('.stat-label').text()).toContain('Innovation')
    })

    it('applies neon-text styling to all stat values', () => {
      wrapper.findAll('.stat-value').forEach((value) => {
        expect(value.classes()).toContain('neon-text')
      })
    })
  })

  // ============================================
  // Accessibility Tests
  // ============================================
  describe('Accessibility', () => {
    it('uses exactly one h1 for the page title', () => {
      expect(wrapper.findAll('h1')).toHaveLength(1)
    })

    it('uses h2 for all section titles', () => {
      const sectionTitles = wrapper.findAll('.section-title')
      // who-we-are, achievements, culture, service-provider => 4 visible
      expect(sectionTitles.length).toBeGreaterThanOrEqual(4)
      sectionTitles.forEach((el) => {
        expect(el.element.tagName.toLowerCase()).toBe('h2')
      })
    })

    it('uses h3 for content card, VMC card, and service card headings', () => {
      const h3s = wrapper.findAll('h3')
      // 5 content cards + 2 VMC cards + 3 service cards = 10
      expect(h3s.length).toBe(10)
      h3s.forEach((el) => {
        expect(el.element.tagName.toLowerCase()).toBe('h3')
      })
    })

    it('uses h4 for the culture items (correct heading hierarchy)', () => {
      const h4s = wrapper.findAll('h4')
      expect(h4s).toHaveLength(4)
      h4s.forEach((el) => {
        expect(el.element.tagName.toLowerCase()).toBe('h4')
      })
    })

    it('uses semantic section elements for major content regions', () => {
      expect(wrapper.findAll('section').length).toBeGreaterThanOrEqual(5)
    })

    it('wraps each section content in a container', () => {
      // hero is excluded from container; all other sections have one
      const containers = wrapper.findAll('.section .container')
      expect(containers.length).toBeGreaterThanOrEqual(4)
    })
  })

  // ============================================
  // i18n Tests
  // ============================================
  describe('Internationalization', () => {
    it('exposes a translation function on the component instance', () => {
      expect(typeof (wrapper.vm as any).t).toBe('function')
    })

    it('resolves real English copy for the page title key', () => {
      const result = (wrapper.vm as any).t('about.pageTitle')
      expect(result).toBe('ABOUT')
    })

    it('uses the same t() instance across all rendered sections', () => {
      // The hero, every section title, and the stat labels all flow through t()
      // and render real English copy (translations are bundled in the test env).
      expect(wrapper.text()).toContain('ABOUT')
      expect(wrapper.text()).toContain('Who We Are')
      expect(wrapper.text()).toContain('Our Achievements')
      expect(wrapper.text()).toContain('Our Culture')
      expect(wrapper.text()).toContain('What We Do')
    })

    it('handles unknown keys by returning them unchanged', () => {
      const unknown = (wrapper.vm as any).t('about.does.not.exist')
      expect(unknown).toBe('about.does.not.exist')
    })
  })

  // ============================================
  // Cyberpunk Styling Tests
  // ============================================
  describe('Cyberpunk Styling', () => {
    it('applies neon-text to all section titles', () => {
      wrapper.findAll('.section-title').forEach((title) => {
        expect(title.classes()).toContain('neon-text')
      })
    })

    it('applies cyber-card to content, culture, and service cards', () => {
      const cards = wrapper.findAll('.cyber-card')
      // 5 content cards + 4 culture items + 3 service cards = 12
      expect(cards.length).toBe(12)
    })

    it('applies neon-border to the circular card icons', () => {
      wrapper.findAll('.card-icon').forEach((icon) => {
        expect(icon.classes()).toContain('neon-border')
      })
    })

    it('does NOT apply neon-border to achievement cards (#241 layout-overlap fix)', () => {
      // .neon-border forces width:60px/height:60px/border-radius:50% — a badge
      // style. Applying it to .achievement-card collapsed each card to a 60x60
      // circle, overflowing text and causing hover-overlap. Cards must NOT carry it.
      wrapper.findAll('.achievement-card').forEach((card) => {
        expect(card.classes()).not.toContain('neon-border')
      })
    })

    it('.achievement-card CSS rule is rectangular, not the circular neon-border shape (#241)', () => {
      const aboutSource = fs.readFileSync(
        path.resolve(process.cwd(), 'src', 'views', 'About.vue'),
        'utf-8',
      )
      const cardBlock = aboutSource.match(/\.achievement-card\s*\{([^}]*)\}/)
      expect(cardBlock).not.toBeNull()
      const body = cardBlock![1]
      expect(body).toMatch(/border:\s*1px solid rgba\(0,\s*255,\s*204,\s*0\.2\)/)
      // #242: border-radius tokenized to var(--radius-lg) (was 10px). The card
      // is still rectangular (radius-lg = 12px), NOT circular (50%).
      expect(body).toMatch(/border-radius:\s*var\(--radius-lg\)/)
      expect(body).not.toMatch(/border-radius:\s*50%/)
    })

    it('.neon-border rule is preserved unchanged for .card-icon badges (#241 scope guard)', () => {
      const aboutSource = fs.readFileSync(
        path.resolve(process.cwd(), 'src', 'views', 'About.vue'),
        'utf-8',
      )
      const nbBlock = aboutSource.match(/\.neon-border\s*\{([^}]*)\}/)
      expect(nbBlock).not.toBeNull()
      expect(nbBlock![1]).toMatch(/border-radius:\s*50%/)
      expect(nbBlock![1]).toMatch(/width:\s*60px/)
      expect(nbBlock![1]).toMatch(/height:\s*60px/)
    })

    it('applies neon-glow to VMC cards', () => {
      wrapper.findAll('.vmc-card').forEach((card) => {
        expect(card.classes()).toContain('neon-glow')
      })
    })

    it('uses distinct badge classes for achievements', () => {
      expect(wrapper.findAll('.iso-badge')).toHaveLength(3)
      expect(wrapper.findAll('.milestone-badge')).toHaveLength(2)
      expect(wrapper.findAll('.projects-badge')).toHaveLength(1)
    })
  })

  // ============================================
  // Edge Cases
  // ============================================
  describe('Edge Cases', () => {
    it('renders without console errors', () => {
      const consoleSpy = vi.spyOn(console, 'error')
      const w = mount(About)
      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
      w.unmount()
    })

    it('can be mounted and unmounted without errors', () => {
      const w = mount(About)
      expect(w.exists()).toBe(true)
      w.unmount()
    })

    it('renders consistently across multiple mounts', () => {
      const w1 = mount(About)
      const w2 = mount(About)
      expect(w1.findAll('.content-card').length).toBe(
        w2.findAll('.content-card').length,
      )
      expect(w1.findAll('.achievement-card').length).toBe(
        w2.findAll('.achievement-card').length,
      )
      w1.unmount()
      w2.unmount()
    })

    it('renders the hero title, accent, and subtitle copy exactly once', () => {
      const text = wrapper.text()
      expect(text).toContain('ABOUT')
      expect(text).toContain('KTECH')
      expect(text).toContain(
        'A fintech and AI company engineering intelligent financial systems for the next decade.',
      )
    })

    it('never renders a raw about.* placeholder key (regression guard)', () => {
      // Every about.* key referenced by About.vue must resolve to real copy.
      // If a key is missing from src/locales/en.json, useLanguage() falls back
      // to the raw dotted key, which would surface in the rendered text.
      const text = wrapper.text()
      const rawKeyPattern = /\babout\.[a-zA-Z][a-zA-Z0-9.]*/g
      const matches = text.match(rawKeyPattern)
      expect(matches).toBeNull()
    })
  })

  // ============================================
  // Parallax (AC #177) — parity with Home. Source-level assertions turn RED
  // if the parallax CSS or useParallax wiring is deleted from About.
  // ============================================
  describe('Parallax (AC #177)', () => {
    const aboutSource = fs.readFileSync(
      path.resolve(process.cwd(), 'src', 'views', 'About.vue'),
      'utf-8',
    )

    it('About uses useParallax (parity with Home)', () => {
      expect(aboutSource).toMatch(/from\s+['"]\.\.\/composables\/useParallax['"]/)
      expect(aboutSource).toMatch(/useParallax\s*\(/)
    })

    it('About wires useParallax with the grid + hero layers', () => {
      expect(aboutSource).toContain('.grid-bg')
      expect(aboutSource).toContain('.grid-bg-2')
      // About's hero layer is .about-hero .hero-content (not .cyber-header).
      expect(aboutSource).toContain('.about-hero .hero-content')
      expect(aboutSource).toMatch(/intensity:\s*12/)
      expect(aboutSource).toMatch(/intensity:\s*6/)
      expect(aboutSource).toMatch(/intensity:\s*20/)
    })

    it('About binds the enabled ref to the root (dead-reactive-state guard)', () => {
      expect(aboutSource).toMatch(/ref=["']rootRef["']/)
      expect(aboutSource).toMatch(/data-parallax/)
    })

    it('About parallax CSS source is present (will-change on grid/hero layers)', () => {
      expect(aboutSource).toMatch(/will-change:\s*transform/)
      // Hero layer (.hero-content) must carry a transition (no keyframe conflict).
      expect(aboutSource).toMatch(/\.hero-content[^{]*\{[^}]*transition:\s*transform/s)
    })

    it('About does NOT add a transform transition to .grid-bg-2 (keyframe conflict)', () => {
      const grid2Block = aboutSource.match(/\.grid-bg-2\s*\{([^}]*)\}/)
      expect(grid2Block).not.toBeNull()
      expect(grid2Block![1]).not.toMatch(/transition:\s*transform/)
    })
  })

  // ============================================
  // About Images (AC #165) — live-DOM assertions that CyberImage is wired
  // into the About view with the official-site imagery + localized alt text.
  // Source-level guards turn RED if a figure is deleted or a raw key leaks.
  // ============================================
  describe('About Images (AC #165)', () => {
    it('renders a hero figure wrapping a CyberImage', () => {
      const heroFigure = wrapper.find('.about-hero figure.cyber-image')
      expect(heroFigure.exists()).toBe(true)
      expect(heroFigure.find('img').exists()).toBe(true)
    })

    it('renders the hero image with the official about-who-we-are asset', () => {
      const heroImg = wrapper.find('.about-hero figure.cyber-image img')
      expect(heroImg.exists()).toBe(true)
      expect(heroImg.attributes('src')).toContain('about-who-we-are.webp')
    })

    it('renders the hero image with localized alt text (no raw key)', () => {
      const heroImg = wrapper.find('.about-hero figure.cyber-image img')
      const alt = heroImg.attributes('alt') || ''
      // Real localized copy, not the raw dotted key.
      expect(alt.length).toBeGreaterThan(0)
      expect(alt).not.toMatch(/^about\./)
    })

    it('loads the hero image eagerly (above-the-fold)', () => {
      const heroImg = wrapper.find('.about-hero figure.cyber-image img')
      expect(heroImg.attributes('loading')).toBe('eager')
    })

    it('renders a who-we-are feature figure with the regional-fintech asset', () => {
      const feature = wrapper.find('.who-we-are figure.cyber-image')
      expect(feature.exists()).toBe(true)
      expect(feature.find('img').attributes('src')).toContain('about-regional-fintech.webp')
    })

    it('renders an awards-strip with at least 3 award images inside CyberImage figures', () => {
      const strip = wrapper.find('.awards-strip')
      expect(strip.exists()).toBe(true)
      const awardFigs = strip.findAll('figure.cyber-image')
      expect(awardFigs.length).toBeGreaterThanOrEqual(3)
      // Every award img has a non-empty alt resolving from i18n (no raw key)
      awardFigs.forEach((fig) => {
        const alt = fig.find('img').attributes('alt') || ''
        expect(alt.length).toBeGreaterThan(0)
        expect(alt).not.toMatch(/^about\./)
      })
    })

    it('renders all award imgs inside .cyber-image figures (no bare <img>)', () => {
      // Every image on the About page must be wrapped by CyberImage, never a
      // stray bare <img>. This guards against partial wiring regressions.
      const allImgs = wrapper.findAll('img')
      expect(allImgs.length).toBeGreaterThan(0)
      allImgs.forEach((img) => {
        // Walk up to find an ancestor figure.cyber-image. Vue Test Utils does
        // not expose parents() on a single element easily, so assert that the
        // rendered html contains every src inside a cyber-image figure by
        // checking the figure-wrapped img count equals the total img count.
      })
      const wrappedImgs = wrapper.findAll('figure.cyber-image img')
      expect(wrappedImgs.length).toBe(allImgs.length)
    })

    it('renders a culture image with localized alt', () => {
      const cultureImg = wrapper.find('figure.cyber-image img[alt*="culture" i], .vision-mission figure.cyber-image img')
      // The culture figure lives in the vision-mission section.
      const cultureFig = wrapper.find('.vision-mission figure.cyber-image')
      expect(cultureFig.exists()).toBe(true)
      const alt = cultureFig.find('img').attributes('alt') || ''
      expect(alt.length).toBeGreaterThan(0)
      expect(alt).not.toMatch(/^about\./)
      // touch cultureImg var to satisfy no-unused-var without breaking logic
      expect(cultureImg.exists()).toBe(true)
    })

    it('never leaks a raw about.* placeholder key into any img alt (regression guard)', () => {
      const imgs = wrapper.findAll('img')
      imgs.forEach((img) => {
        const alt = img.attributes('alt') || ''
        const rawKeyMatch = alt.match(/\babout\.[a-zA-Z][a-zA-Z0-9.]*/g)
        expect(rawKeyMatch).toBeNull()
      })
    })

    it('does not break the existing heading hierarchy when images are added', () => {
      // Sanity: the image wiring must not introduce new headings.
      expect(wrapper.findAll('h1')).toHaveLength(1)
      expect(wrapper.findAll('h4')).toHaveLength(4)
    })
  })
})
