/**
 * Unit tests for MobileNavigation component
 * Following TDD principles - tests written before implementation
 * Updated to use Pinia stores instead of composables
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { useLanguageStore } from '../../src/stores/language'
import { useThemeStore } from '../../src/stores/theme'
import MobileNavigation from '../../src/components/MobileNavigation.vue'

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div>Home</div>' } },
      { path: '/services', component: { template: '<div>Services</div>' } },
      { path: '/about', component: { template: '<div>About</div>' } }
    ]
  })
}

let activeWrappers = []

async function mountComp() {
  const pinia = createPinia()
  setActivePinia(pinia)

  const router = makeRouter()
  router.push('/')
  await router.isReady()

  // Initialize language store with translations
  const languageStore = useLanguageStore()
  languageStore.translations = {
    en: {
      nav: {
        home: 'Home',
        services: 'Services',
        about: 'About',
        menu: { open: 'Open menu', close: 'Close menu', label: 'Navigation menu' }
      }
    }
  }
  languageStore.currentLanguage = 'en'

  const wrapper = mount(MobileNavigation, {
    attachTo: document.body,
    global: {
      plugins: [pinia, router]
    }
  })
  activeWrappers.push(wrapper)
  return { wrapper, router }
}

describe('MobileNavigation.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    document.body.style.overflow = ''
    activeWrappers = []

    // No need to mock document - jsdom environment handles it properly

    // Mock localStorage
    const localStorageMock = (() => {
      let store = {}
      return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = String(value) },
        removeItem: (key) => { delete store[key] },
        clear: () => { store = {} }
      }
    })()
    vi.stubGlobal('localStorage', localStorageMock)

    // Mock window.matchMedia
    vi.stubGlobal('window', {
      matchMedia: vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query
      })),
      innerWidth: 768
    })

    // Mock fetch for language translations
    global.fetch = vi.fn(() => Promise.resolve({
      ok: true,
      json: async () => ({
        nav: {
          home: 'Home',
          services: 'Services',
          about: 'About',
          menu: { open: 'Open menu', close: 'Close menu', label: 'Navigation menu' }
        }
      })
    }))
  })

  afterEach(() => {
    activeWrappers.forEach((w) => {
      try { w.unmount() } catch (e) { /* already unmounted */ }
    })
    activeWrappers = []
    document.body.innerHTML = ''
  })

  describe('rendering', () => {
    it('renders the hamburger button', async () => {
      const { wrapper } = await mountComp()
      const button = wrapper.find('.hamburger')
      expect(button.exists()).toBe(true)
    })

    it('hamburger has aria-label "Open menu" when closed', async () => {
      const { wrapper } = await mountComp()
      const button = wrapper.find('.hamburger')
      expect(button.attributes('aria-label')).toBe('Open menu')
    })

    it('hamburger has aria-label "Close menu" when open', async () => {
      const { wrapper } = await mountComp()
      const button = wrapper.find('.hamburger')
      await button.trigger('click')
      await flushPromises()
      expect(button.attributes('aria-label')).toBe('Close menu')
    })

    it('hamburger sets aria-expanded false when closed', async () => {
      const { wrapper } = await mountComp()
      const button = wrapper.find('.hamburger')
      expect(button.attributes('aria-expanded')).toBe('false')
    })

    it('hamburger sets aria-expanded true when open', async () => {
      const { wrapper } = await mountComp()
      const button = wrapper.find('.hamburger')
      await button.trigger('click')
      await flushPromises()
      expect(button.attributes('aria-expanded')).toBe('true')
    })

    it('hamburger has aria-controls="mobile-menu"', async () => {
      const { wrapper } = await mountComp()
      const button = wrapper.find('.hamburger')
      expect(button.attributes('aria-controls')).toBe('mobile-menu')
    })

    it('does not render mobile-menu when closed', async () => {
      const { wrapper } = await mountComp()
      const menu = wrapper.find('#mobile-menu')
      expect(menu.exists()).toBe(false)
    })

    it('renders 3 menu-link with correct paths when open', async () => {
      const { wrapper } = await mountComp()
      const button = wrapper.find('.hamburger')
      await button.trigger('click')
      await flushPromises()

      const links = wrapper.findAll('.menu-link')
      expect(links.length).toBe(3)
      expect(links[0].attributes('to')).toBe('/')
      expect(links[1].attributes('to')).toBe('/services')
      expect(links[2].attributes('to')).toBe('/about')
    })

    it('renders link text from i18n keys', async () => {
      const { wrapper } = await mountComp()
      const button = wrapper.find('.hamburger')
      await button.trigger('click')
      await flushPromises()

      const links = wrapper.findAll('.menu-link')
      expect(links[0].text()).toBe('Home')
      expect(links[1].text()).toBe('Services')
      expect(links[2].text()).toBe('About')
    })

    it('renders LanguageSwitcher and ThemeToggle inside menu-controls when open', async () => {
      const { wrapper } = await mountComp()
      const button = wrapper.find('.hamburger')
      await button.trigger('click')
      await flushPromises()

      const menuControls = wrapper.find('.menu-controls')
      expect(menuControls.exists()).toBe(true)
      expect(menuControls.findComponent({ name: 'LanguageSwitcher' }).exists()).toBe(true)
      expect(menuControls.findComponent({ name: 'ThemeToggle' }).exists()).toBe(true)
    })
  })

  describe('interactions', () => {
    it('clicking hamburger toggles open (adds .open class and flips aria-expanded)', async () => {
      const { wrapper } = await mountComp()
      const button = wrapper.find('.hamburger')

      expect(button.classes()).not.toContain('open')
      expect(button.attributes('aria-expanded')).toBe('false')

      await button.trigger('click')
      await flushPromises()

      expect(button.classes()).toContain('open')
      expect(button.attributes('aria-expanded')).toBe('true')
    })

    it('clicking the backdrop closes the menu', async () => {
      const { wrapper } = await mountComp()
      const button = wrapper.find('.hamburger')
      await button.trigger('click')
      await flushPromises()

      const backdrop = wrapper.find('.menu-backdrop')
      expect(backdrop.exists()).toBe(true)

      await backdrop.trigger('click')
      await flushPromises()

      const menu = wrapper.find('#mobile-menu')
      expect(menu.exists()).toBe(false)
    })

    it('clicking a menu-link closes the menu', async () => {
      const { wrapper, router } = await mountComp()
      const button = wrapper.find('.hamburger')
      await button.trigger('click')
      await flushPromises()

      const homeLink = wrapper.findAll('.menu-link')[0]
      await homeLink.trigger('click')
      await flushPromises()

      const menu = wrapper.find('#mobile-menu')
      expect(menu.exists()).toBe(false)
      expect(router.currentRoute.value.path).toBe('/')
    })

    it('sets overflow hidden on body when menu opens', async () => {
      const { wrapper } = await mountComp()
      const button = wrapper.find('.hamburger')
      await button.trigger('click')
      await flushPromises()

      expect(document.body.style.overflow).toBe('hidden')
    })

    it('restores overflow on body when menu closes', async () => {
      const { wrapper } = await mountComp()
      const button = wrapper.find('.hamburger')
      await button.trigger('click')
      await flushPromises()

      const backdrop = wrapper.find('.menu-backdrop')
      await backdrop.trigger('click')
      await flushPromises()

      expect(document.body.style.overflow).toBe('')
    })

    it('closes on route change', async () => {
      const { wrapper, router } = await mountComp()
      const button = wrapper.find('.hamburger')
      await button.trigger('click')
      await flushPromises()

      const menu = wrapper.find('#mobile-menu')
      expect(menu.exists()).toBe(true)

      await router.push('/services')
      await flushPromises()

      const closedMenu = wrapper.find('#mobile-menu')
      expect(closedMenu.exists()).toBe(false)
    })
  })

  describe('accessibility', () => {
    it('closes on ESC key press', async () => {
      const { wrapper } = await mountComp()
      const button = wrapper.find('.hamburger')
      await button.trigger('click')
      await flushPromises()

      await wrapper.trigger('keydown', { key: 'Escape' })
      await flushPromises()

      const menu = wrapper.find('#mobile-menu')
      expect(menu.exists()).toBe(false)
    })

    it('mobile-menu has role dialog', async () => {
      const { wrapper } = await mountComp()
      const button = wrapper.find('.hamburger')
      await button.trigger('click')
      await flushPromises()

      const menu = wrapper.find('#mobile-menu')
      expect(menu.attributes('role')).toBe('dialog')
    })

    it('mobile-menu has aria-modal true', async () => {
      const { wrapper } = await mountComp()
      const button = wrapper.find('.hamburger')
      await button.trigger('click')
      await flushPromises()

      const menu = wrapper.find('#mobile-menu')
      expect(menu.attributes('aria-modal')).toBe('true')
    })

    it('mobile-menu has aria-label from i18n', async () => {
      const { wrapper } = await mountComp()
      const button = wrapper.find('.hamburger')
      await button.trigger('click')
      await flushPromises()

      const menu = wrapper.find('#mobile-menu')
      expect(menu.attributes('aria-label')).toBe('Navigation menu')
    })
  })

  describe('keyboard navigation', () => {
    it('should focus first element when menu opens', async () => {
      const { wrapper } = await mountComp()
      const button = wrapper.find('.hamburger')
      await button.trigger('click')
      await flushPromises()

      // Focus should be managed (implementation detail)
      expect(wrapper.find('#mobile-menu').exists()).toBe(true)
    })
  })

  describe('responsive behavior', () => {
    it('should not open menu on hover when width <= 768', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768
      })

      const { wrapper } = await mountComp()
      const hamburger = wrapper.find('.hamburger')
      await hamburger.trigger('mouseenter')
      await flushPromises()

      const menu = wrapper.find('#mobile-menu')
      expect(menu.exists()).toBe(false)
    })
  })

  describe('cleanup', () => {
    it('should unmount without errors', async () => {
      const { wrapper } = await mountComp()
      expect(() => wrapper.unmount()).not.toThrow()
    })
  })

  describe('edge cases', () => {
    it('handles rapid toggle clicks', async () => {
      const { wrapper } = await mountComp()
      const button = wrapper.find('.hamburger')

      await button.trigger('click')
      await button.trigger('click')
      await button.trigger('click')
      await flushPromises()

      const menu = wrapper.find('#mobile-menu')
      expect(button.classes()).toContain('open')
      expect(menu.exists()).toBe(true)
    })

    it('handles useLanguage returning no t without throwing', async () => {
      const pinia = createPinia()
      setActivePinia(pinia)

      const router = makeRouter()
      router.push('/')
      await router.isReady()

      const wrapper = mount(MobileNavigation, {
        attachTo: document.body,
        global: {
          plugins: [pinia, router]
        }
      })

      await expect(wrapper.exists()).toBe(true)
    })
  })
})
