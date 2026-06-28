/**
 * @file ServiceStablecoin.test.ts
 * @description Unit tests for the Stablecoin Service detail (stub) view
 * @ticket #164 - Navigation overhaul: 3 new solution stub views
 *
 * Stub view shape (trimmed from ServiceRetailLending): hero + breadcrumb +
 * ONE overview section + 3 capability cards + CTA + back-link. NO metrics or
 * process sections, NO fabricated stats.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import ServiceStablecoin from '../ServiceStablecoin.vue'

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

describe('ServiceStablecoin.vue', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    wrapper = mount(ServiceStablecoin, {
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
      expect(wrapper.find('.sc__hero').exists()).toBe(true)
    })

    it('renders the page title as an h1', () => {
      const h1 = wrapper.find('.sc__hero h1')
      expect(h1.exists()).toBe(true)
      expect(h1.element.tagName.toLowerCase()).toBe('h1')
    })

    it('renders the overview section', () => {
      expect(wrapper.find('.sc__overview').exists()).toBe(true)
    })

    it('renders the capabilities section', () => {
      expect(wrapper.find('.sc__capabilities').exists()).toBe(true)
    })

    it('renders the core features section', () => {
      expect(wrapper.find('.sc__core-features').exists()).toBe(true)
    })

    it('renders the tech features section', () => {
      expect(wrapper.find('.sc__tech-features').exists()).toBe(true)
    })

    it('renders the CTA section with a router-link to /contact', () => {
      const cta = wrapper.find('.sc__cta')
      expect(cta.exists()).toBe(true)
      const link = cta.find('a[href="/contact"]')
      expect(link.exists()).toBe(true)
    })

    it('renders the breadcrumb navigation', () => {
      const breadcrumb = wrapper.find('nav[aria-label="Breadcrumb"]')
      expect(breadcrumb.exists()).toBe(true)
    })

    it('renders a breadcrumb link back to home', () => {
      const home = wrapper.find('.sc__breadcrumb a[href="/"]')
      expect(home.exists()).toBe(true)
    })
  })

  describe('Content', () => {
    it('renders the hero heading via t()', () => {
      expect(wrapper.text()).toContain(
        (wrapper.vm as any).t('services.stablecoin.hero.heading'),
      )
    })

    it('renders the overview heading and description via t()', () => {
      const vm = wrapper.vm as any
      const text = wrapper.text()
      expect(text).toContain(vm.t('services.stablecoin.overview.heading'))
      expect(text).toContain(vm.t('services.stablecoin.overview.description'))
    })

    it('renders exactly three capability cards', () => {
      const cards = wrapper.findAll('.sc__capabilities .sc__card')
      expect(cards).toHaveLength(3)
    })

    it('renders the core features heading via t()', () => {
      expect(wrapper.text()).toContain(
        (wrapper.vm as any).t('services.stablecoin.coreFeatures.heading'),
      )
    })

    it('renders exactly four core feature cards', () => {
      expect(wrapper.findAll('.sc__core-features .sc__card')).toHaveLength(4)
    })

    it('renders the tech features heading via t()', () => {
      expect(wrapper.text()).toContain(
        (wrapper.vm as any).t('services.stablecoin.techFeatures.heading'),
      )
    })

    it('renders exactly four tech feature cards', () => {
      expect(wrapper.findAll('.sc__tech-features .sc__card')).toHaveLength(4)
    })

    it('renders the CTA button label via t()', () => {
      expect(wrapper.text()).toContain(
        (wrapper.vm as any).t('services.stablecoin.cta.button'),
      )
    })

    it('does NOT render a metrics section (stub view)', () => {
      expect(wrapper.find('.sc__metrics').exists()).toBe(false)
    })

    it('does NOT render a process section (stub view)', () => {
      expect(wrapper.find('.sc__process').exists()).toBe(false)
    })
  })

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

  describe('Internationalization', () => {
    it('does not leak raw services.stablecoin.* keys into rendered text', () => {
      const text = wrapper.text()
      const rawKeyPattern = /services\.stablecoin\.[a-zA-Z]+\.[a-zA-Z]+/g
      expect(text.match(rawKeyPattern)).toBeNull()
    })

    it('exposes a translation function on the component instance', () => {
      expect(typeof (wrapper.vm as any).t).toBe('function')
    })

    it('returns the key as fallback for a genuinely-missing key', () => {
      const result = (wrapper.vm as any).t('services.stablecoin.this.key.does.not.exist')
      expect(result).toBe('services.stablecoin.this.key.does.not.exist')
    })
  })

  describe('Edge Cases', () => {
    it('renders a loading skeleton initially and content after mount', async () => {
      const fresh = mount(ServiceStablecoin)
      expect(fresh.find('.sc__skeleton').exists()).toBe(true)
      expect(fresh.find('.sc__content').exists()).toBe(false)

      await fresh.vm.$nextTick()
      await Promise.resolve()
      await fresh.vm.$nextTick()

      expect(fresh.find('.sc__skeleton').exists()).toBe(false)
      expect(fresh.find('.sc__content').exists()).toBe(true)
      fresh.unmount()
    })

    it('renders consistently across multiple mounts', () => {
      const w1 = mount(ServiceStablecoin, {
        global: { stubs: { 'router-link': RouterLinkStub } },
      })
      const w2 = mount(ServiceStablecoin, {
        global: { stubs: { 'router-link': RouterLinkStub } },
      })
      expect(w1.findAll('section').length).toBe(w2.findAll('section').length)
      w1.unmount()
      w2.unmount()
    })
  })
})
