/**
 * @file Header.test.ts
 * @description Comprehensive unit tests for Header component
 * @ticket #44 - TEST-006: Header Component Unit Tests - TDD with Vitest
 *
 * The Header renders a fixed <nav> with a "KAITECH" logo and three anchor
 * links (服务 / 荣誉 / 联系). It also binds a scroll listener that toggles a
 * `scrolled` class once `window.scrollY > 50`. Translation is handled by an
 * internal `t()` function (no vue-i18n dependency), so we exercise it through
 * `wrapper.vm.t(...)`.
 *
 * Test Categories:
 * - Rendering / structure
 * - Logo content
 * - Navigation links (i18n output + href anchors)
 * - Scroll behavior (scrolled class toggle + lifecycle cleanup)
 * - Accessibility (semantic <nav>, id, focusable anchors)
 * - Styling classes
 * - Internal translation function (t)
 * - Edge cases (multiple mounts, rapid cycles)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import Header from '../Header.vue'

describe('Header.vue', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    // happy-dom starts window.scrollY at 0; make each test deterministic.
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      writable: true,
      value: 0,
    })
    wrapper = mount(Header)
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

    it('renders a semantic <nav> element', () => {
      const nav = wrapper.find('nav')
      expect(nav.exists()).toBe(true)
      expect(nav.element.tagName.toLowerCase()).toBe('nav')
    })

    it('applies the `nav` class to the root nav', () => {
      const nav = wrapper.find('nav.nav')
      expect(nav.exists()).toBe(true)
      expect(nav.classes()).toContain('nav')
    })

    it('exposes the navbar via id="navbar"', () => {
      const nav = wrapper.find('#navbar')
      expect(nav.exists()).toBe(true)
    })

    it('does not apply the scrolled class on initial mount', () => {
      const nav = wrapper.find('nav')
      expect(nav.classes()).not.toContain('scrolled')
    })

    it('renders the logo link and the unordered link list', () => {
      expect(wrapper.find('.nav-logo').exists()).toBe(true)
      expect(wrapper.find('ul.nav-links').exists()).toBe(true)
    })
  })

  // ============================================
  // Logo
  // ============================================
  describe('Logo', () => {
    it('renders the "KAI" base text in the logo', () => {
      const logo = wrapper.find('.nav-logo')
      expect(logo.text()).toContain('KAI')
    })

    it('renders the "TECH" accent text inside a span.accent', () => {
      const accent = wrapper.find('.nav-logo .accent')
      expect(accent.exists()).toBe(true)
      expect(accent.text()).toBe('TECH')
    })

    it('renders the full logo text as "KAITECH"', () => {
      expect(wrapper.find('.nav-logo').text()).toBe('KAITECH')
    })

    it('points the logo anchor at the top of the page', () => {
      const logo = wrapper.find('.nav-logo')
      expect(logo.attributes('href')).toBe('#')
    })
  })

  // ============================================
  // Navigation Links
  // ============================================
  describe('Navigation Links', () => {
    it('renders exactly three <li> entries inside the link list', () => {
      const items = wrapper.findAll('ul.nav-links li')
      expect(items).toHaveLength(3)
    })

    it('renders exactly three anchor links', () => {
      const links = wrapper.findAll('ul.nav-links a')
      expect(links).toHaveLength(3)
    })

    it('renders the services link with the translated label and href', () => {
      const services = wrapper.find('ul.nav-links li:nth-child(1) a')
      expect(services.exists()).toBe(true)
      expect(services.text()).toBe('服务')
      expect(services.attributes('href')).toBe('#services')
    })

    it('renders the honors link with the translated label and href', () => {
      const honors = wrapper.find('ul.nav-links li:nth-child(2) a')
      expect(honors.exists()).toBe(true)
      expect(honors.text()).toBe('荣誉')
      expect(honors.attributes('href')).toBe('#honors')
    })

    it('renders the contact link with the translated label and href', () => {
      const contact = wrapper.find('ul.nav-links li:nth-child(3) a')
      expect(contact.exists()).toBe(true)
      expect(contact.text()).toBe('联系')
      expect(contact.attributes('href')).toBe('#contact')
    })

    it('uses the internal t() to render nav.services', () => {
      // The link text is the output of t('nav.services').
      expect(wrapper.find('a[href="#services"]').text()).toBe(
        wrapper.vm.t('nav.services'),
      )
    })

    it('uses the internal t() to render nav.honors', () => {
      expect(wrapper.find('a[href="#honors"]').text()).toBe(
        wrapper.vm.t('nav.honors'),
      )
    })

    it('uses the internal t() to render nav.contact', () => {
      expect(wrapper.find('a[href="#contact"]').text()).toBe(
        wrapper.vm.t('nav.contact'),
      )
    })
  })

  // ============================================
  // Scroll behavior
  // ============================================
  describe('Scroll Behavior', () => {
    it('adds the scrolled class once scrollY exceeds 50', async () => {
      const nav = wrapper.find('nav')
      Object.defineProperty(window, 'scrollY', {
        configurable: true,
        writable: true,
        value: 51,
      })
      window.dispatchEvent(new Event('scroll'))
      await wrapper.vm.$nextTick()
      expect(nav.classes()).toContain('scrolled')
    })

    it('does not add the scrolled class when scrollY is exactly 50', async () => {
      const nav = wrapper.find('nav')
      Object.defineProperty(window, 'scrollY', {
        configurable: true,
        writable: true,
        value: 50,
      })
      window.dispatchEvent(new Event('scroll'))
      await wrapper.vm.$nextTick()
      expect(nav.classes()).not.toContain('scrolled')
    })

    it('removes the scrolled class when scrolling back above the threshold', async () => {
      const nav = wrapper.find('nav')

      // Scroll down past threshold.
      Object.defineProperty(window, 'scrollY', {
        configurable: true,
        writable: true,
        value: 200,
      })
      window.dispatchEvent(new Event('scroll'))
      await wrapper.vm.$nextTick()
      expect(nav.classes()).toContain('scrolled')

      // Scroll back up.
      Object.defineProperty(window, 'scrollY', {
        configurable: true,
        writable: true,
        value: 0,
      })
      window.dispatchEvent(new Event('scroll'))
      await wrapper.vm.$nextTick()
      expect(nav.classes()).not.toContain('scrolled')
    })

    it('removes the scroll listener on unmount', async () => {
      const removeSpy = vi.spyOn(window, 'removeEventListener')
      wrapper.unmount()
      expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
      removeSpy.mockRestore()
      // Re-mount so the shared afterEach cleanup does not double-unmount.
      wrapper = mount(Header)
    })
  })

  // ============================================
  // Accessibility
  // ============================================
  describe('Accessibility', () => {
    it('uses a semantic <nav> landmark element', () => {
      expect(wrapper.find('nav').exists()).toBe(true)
    })

    it('exposes a stable id (navbar) for skip-link targeting', () => {
      expect(wrapper.find('#navbar').exists()).toBe(true)
    })

    it('renders all navigation links as focusable anchors', () => {
      const links = wrapper.findAll('nav a')
      // 3 nav links + 1 logo link.
      expect(links).toHaveLength(4)
      links.forEach((link) => {
        expect(link.element.tagName.toLowerCase()).toBe('a')
      })
    })

    it('logo link and nav links have href attributes', () => {
      const links = wrapper.findAll('nav a')
      links.forEach((link) => {
        expect(link.attributes('href')).toBeTruthy()
      })
    })
  })

  // ============================================
  // Styling
  // ============================================
  describe('Styling', () => {
    it('applies cyberpunk classes for the logo and accent', () => {
      expect(wrapper.find('.nav-logo').exists()).toBe(true)
      expect(wrapper.find('.nav-logo .accent').exists()).toBe(true)
    })

    it('applies the nav-links list class', () => {
      expect(wrapper.find('ul.nav-links').exists()).toBe(true)
    })

    it('toggles the scrolled modifier class on the root nav', async () => {
      const nav = wrapper.find('nav')
      expect(nav.classes()).not.toContain('scrolled')

      Object.defineProperty(window, 'scrollY', {
        configurable: true,
        writable: true,
        value: 100,
      })
      window.dispatchEvent(new Event('scroll'))
      await wrapper.vm.$nextTick()
      expect(wrapper.find('nav').classes()).toContain('scrolled')
    })
  })

  // ============================================
  // Internal translation function
  // ============================================
  describe('Internationalization (internal t())', () => {
    it('exposes a translation function on the component instance', () => {
      expect(typeof wrapper.vm.t).toBe('function')
    })

    it('translates nav.services to Chinese label', () => {
      expect(wrapper.vm.t('nav.services')).toBe('服务')
    })

    it('translates nav.honors to Chinese label', () => {
      expect(wrapper.vm.t('nav.honors')).toBe('荣誉')
    })

    it('translates nav.contact to Chinese label', () => {
      expect(wrapper.vm.t('nav.contact')).toBe('联系')
    })

    it('returns the key as fallback for unknown keys', () => {
      expect(wrapper.vm.t('nav.unknown')).toBe('nav.unknown')
    })

    it('returns the key for unrelated namespaces', () => {
      expect(wrapper.vm.t('footer.copyright')).toBe('footer.copyright')
    })

    it('returns empty string for an empty key', () => {
      expect(wrapper.vm.t('')).toBe('')
    })
  })

  // ============================================
  // Edge cases
  // ============================================
  describe('Edge Cases', () => {
    it('can be mounted and unmounted multiple times', () => {
      const wrappers = [mount(Header), mount(Header), mount(Header)]
      wrappers.forEach((w) => {
        expect(w.exists()).toBe(true)
        expect(w.text()).toContain('KAITECH')
      })
      wrappers.forEach((w) => w.unmount())
    })

    it('renders correctly when remounted after unmount', () => {
      wrapper.unmount()
      const fresh = mount(Header)
      expect(fresh.find('.nav-logo').text()).toBe('KAITECH')
      expect(fresh.findAll('ul.nav-links a')).toHaveLength(3)
      fresh.unmount()
      // Restore a live wrapper for the shared afterEach.
      wrapper = mount(Header)
    })

    it('handles rapid mount/unmount cycles without error', () => {
      for (let i = 0; i < 10; i++) {
        const w = mount(Header)
        expect(w.exists()).toBe(true)
        w.unmount()
      }
    })
  })

  // ============================================
  // Component Structure
  // ============================================
  describe('Component Structure', () => {
    it('renders the expected DOM hierarchy', () => {
      const nav = wrapper.find('nav.nav')
      expect(nav.find('.nav-logo').exists()).toBe(true)
      expect(nav.find('ul.nav-links').exists()).toBe(true)
    })

    it('renders the full expected HTML structure', () => {
      const html = wrapper.html()
      expect(html).toContain('nav')
      expect(html).toContain('nav-logo')
      expect(html).toContain('accent')
      expect(html).toContain('nav-links')
      expect(html).toContain('href="#services"')
      expect(html).toContain('href="#honors"')
      expect(html).toContain('href="#contact"')
    })
  })
})
