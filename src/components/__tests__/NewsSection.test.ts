/**
 * @file NewsSection.test.ts
 * @description Comprehensive unit tests for NewsSection component
 * @ticket #60 - TEST-013: News Section Component Unit Tests - TDD with Vitest
 *
 * NewsSection pulls `t` from the useLanguage composable and renders two
 * router-link cards (KTech News, KBTG News) pointing at /news/ktech and
 * /news/kbtg. We mock the composable for deterministic translations and stub
 * RouterLink so we can assert on the rendered `to` targets.
 *
 * Test Categories:
 * - Rendering / structure
 * - Section header (title + icon)
 * - News cards (count, content, links, CTA)
 * - i18n (useLanguage().t wiring)
 * - Accessibility (heading hierarchy, semantic section)
 * - Styling (cyberpunk classes)
 * - Edge cases (multiple mounts)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'

// Deterministic translation map mirroring the en.json news.* keys used by
// the component. Unknown keys fall back to the key (matching useLanguage().t).
const dictionary: Record<string, string> = {
  'news.title': 'Latest News',
  'news.ktechNews': 'KTech News',
  'news.kbtgNews': 'KBTG News',
  'news.learnMore': 'Learn More',
}
const t = (key: string) => dictionary[key] ?? key

vi.mock('../../composables/useLanguage', () => ({
  useLanguage: () => ({ t }),
}))

// Stub RouterLink so we can assert on the resolved `to` value without a
// router instance. Exposes `to` as a data attribute for assertions.
const RouterLinkStub = {
  name: 'RouterLink',
  template: '<a :data-to="String(to)" :href="String(to)"><slot /></a>',
  props: ['to'],
}

import NewsSection from '../NewsSection.vue'

function createWrapper() {
  return mount(NewsSection, {
    global: {
      stubs: {
        RouterLink: RouterLinkStub,
      },
    },
  })
}

describe('NewsSection.vue', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    wrapper = createWrapper()
  })

  afterEach(() => {
    wrapper.unmount()
  })

  // ============================================
  // Rendering
  // ============================================
  describe('Rendering', () => {
    it('mounts without errors', () => {
      expect(wrapper.exists()).toBe(true)
    })

    it('renders a semantic <section> root', () => {
      const section = wrapper.find('section.news-section')
      expect(section.exists()).toBe(true)
      expect(section.element.tagName.toLowerCase()).toBe('section')
    })

    it('renders the container wrapper', () => {
      expect(wrapper.find('.container').exists()).toBe(true)
    })

    it('renders the section header block', () => {
      expect(wrapper.find('.section-header').exists()).toBe(true)
    })

    it('renders the news grid', () => {
      expect(wrapper.find('.news-grid').exists()).toBe(true)
    })
  })

  // ============================================
  // Section Header
  // ============================================
  describe('Section Header', () => {
    it('renders the section icon container', () => {
      expect(wrapper.find('.section-icon').exists()).toBe(true)
    })

    it('renders an inline SVG inside the section icon', () => {
      const svg = wrapper.find('.section-icon svg')
      expect(svg.exists()).toBe(true)
    })

    it('renders the section title as an h2', () => {
      const title = wrapper.find('h2.section-title')
      expect(title.exists()).toBe(true)
      expect(title.element.tagName.toLowerCase()).toBe('h2')
    })

    it('renders the translated news.title in the section title', () => {
      expect(wrapper.find('.section-title').text()).toBe('Latest News')
    })

    it('applies the neon-text modifier to the section title', () => {
      const title = wrapper.find('.section-title')
      expect(title.classes()).toContain('neon-text')
    })
  })

  // ============================================
  // News Cards
  // ============================================
  describe('News Cards', () => {
    it('renders exactly two news cards', () => {
      expect(wrapper.findAll('.news-card')).toHaveLength(2)
    })

    it('renders the KTech News card with the translated title', () => {
      const cards = wrapper.findAll('.news-card')
      expect(cards[0].find('.card-title').text()).toBe('KTech News')
    })

    it('renders the KBTG News card with the translated title', () => {
      const cards = wrapper.findAll('.news-card')
      expect(cards[1].find('.card-title').text()).toBe('KBTG News')
    })

    it('renders each card with an image placeholder block', () => {
      const placeholders = wrapper.findAll('.image-placeholder')
      expect(placeholders).toHaveLength(2)
    })

    it('renders the placeholder icon inside each image placeholder', () => {
      const icons = wrapper.findAll('.placeholder-icon')
      expect(icons).toHaveLength(2)
      icons.forEach((icon) => expect(icon.text()).toBe('📰'))
    })

    it('renders a CTA block inside each card', () => {
      const ctas = wrapper.findAll('.card-cta')
      expect(ctas).toHaveLength(2)
    })

    it('renders the translated learnMore CTA label', () => {
      const ctaTexts = wrapper.findAll('.cta-text')
      ctaTexts.forEach((el) => expect(el.text()).toBe('Learn More'))
    })

    it('renders an arrow indicator inside each CTA', () => {
      const arrows = wrapper.findAll('.cta-arrow')
      expect(arrows).toHaveLength(2)
      arrows.forEach((a) => expect(a.text()).toBe('→'))
    })
  })

  // ============================================
  // Routing (router-link `to`)
  // ============================================
  describe('Routing', () => {
    it('renders each card as a router-link', () => {
      // RouterLink stubs render as <a> with the data-to attribute.
      const cards = wrapper.findAll('.news-card')
      expect(cards[0].attributes('data-to')).toBe('/news/ktech')
      expect(cards[1].attributes('data-to')).toBe('/news/kbtg')
    })

    it('uses the correct link target for KTech News', () => {
      const cards = wrapper.findAll('.news-card')
      expect(cards[0].attributes('href')).toBe('/news/ktech')
    })

    it('uses the correct link target for KBTG News', () => {
      const cards = wrapper.findAll('.news-card')
      expect(cards[1].attributes('href')).toBe('/news/kbtg')
    })
  })

  // ============================================
  // i18n (useLanguage().t wiring)
  // ============================================
  describe('Internationalization', () => {
    it('exposes the wired translation function on the instance', () => {
      expect(typeof wrapper.vm.t).toBe('function')
    })

    it('resolves news.title via the composable t()', () => {
      expect(wrapper.vm.t('news.title')).toBe('Latest News')
    })

    it('resolves news.ktechNews via the composable t()', () => {
      expect(wrapper.vm.t('news.ktechNews')).toBe('KTech News')
    })

    it('resolves news.kbtgNews via the composable t()', () => {
      expect(wrapper.vm.t('news.kbtgNews')).toBe('KBTG News')
    })

    it('resolves news.learnMore via the composable t()', () => {
      expect(wrapper.vm.t('news.learnMore')).toBe('Learn More')
    })

    it('falls back to the key for unknown keys', () => {
      expect(wrapper.vm.t('news.unknown')).toBe('news.unknown')
    })
  })

  // ============================================
  // Accessibility
  // ============================================
  describe('Accessibility', () => {
    it('uses a semantic <section> landmark', () => {
      expect(wrapper.find('section').exists()).toBe(true)
    })

    it('uses an h2 for the section title (proper heading hierarchy)', () => {
      expect(wrapper.find('h2.section-title').exists()).toBe(true)
    })

    it('uses h3 for card titles (subordinate to the section h2)', () => {
      const cardTitles = wrapper.findAll('.card-title')
      cardTitles.forEach((title) => {
        expect(title.element.tagName.toLowerCase()).toBe('h3')
      })
    })

    it('renders each card as a focusable anchor (router-link)', () => {
      const cards = wrapper.findAll('.news-card')
      cards.forEach((card) => {
        expect(card.element.tagName.toLowerCase()).toBe('a')
      })
    })
  })

  // ============================================
  // Styling
  // ============================================
  describe('Styling', () => {
    it('applies the cyber-card modifier to each card', () => {
      const cards = wrapper.findAll('.news-card')
      cards.forEach((card) => {
        expect(card.classes()).toContain('cyber-card')
        expect(card.classes()).toContain('hover-glow')
      })
    })

    it('applies the neon-glow modifier to the section icon', () => {
      expect(wrapper.find('.section-icon').classes()).toContain('neon-glow')
    })

    it('applies the neon-border modifier to each image placeholder', () => {
      const placeholders = wrapper.findAll('.image-placeholder')
      placeholders.forEach((p) => {
        expect(p.classes()).toContain('neon-border')
      })
    })

    it('applies expected classes to the CTA sub-elements', () => {
      expect(wrapper.find('.cta-text').exists()).toBe(true)
      expect(wrapper.find('.cta-arrow').exists()).toBe(true)
    })
  })

  // ============================================
  // Component Structure
  // ============================================
  describe('Component Structure', () => {
    it('renders the full expected HTML structure', () => {
      const html = wrapper.html()
      expect(html).toContain('news-section')
      expect(html).toContain('section-header')
      expect(html).toContain('section-title')
      expect(html).toContain('news-grid')
      expect(html).toContain('news-card')
      expect(html).toContain('card-content')
      expect(html).toContain('card-cta')
    })

    it('renders card content inside each card', () => {
      const cards = wrapper.findAll('.news-card')
      cards.forEach((card) => {
        expect(card.find('.card-content').exists()).toBe(true)
      })
    })

    it('renders the card title inside card content', () => {
      const cards = wrapper.findAll('.news-card')
      cards.forEach((card) => {
        expect(card.find('.card-content .card-title').exists()).toBe(true)
      })
    })
  })

  // ============================================
  // Edge cases
  // ============================================
  describe('Edge Cases', () => {
    it('can be mounted and unmounted multiple times', () => {
      const wrappers = [createWrapper(), createWrapper(), createWrapper()]
      wrappers.forEach((w) => {
        expect(w.exists()).toBe(true)
        expect(w.findAll('.news-card')).toHaveLength(2)
      })
      wrappers.forEach((w) => w.unmount())
    })

    it('renders correctly when remounted after unmount', () => {
      wrapper.unmount()
      const fresh = createWrapper()
      expect(fresh.find('.section-title').text()).toBe('Latest News')
      expect(fresh.findAll('.news-card')).toHaveLength(2)
      fresh.unmount()
      // Restore a live wrapper for the shared afterEach cleanup.
      wrapper = createWrapper()
    })

    it('handles rapid mount/unmount cycles without error', () => {
      for (let i = 0; i < 10; i++) {
        const w = createWrapper()
        expect(w.exists()).toBe(true)
        w.unmount()
      }
    })
  })
})
