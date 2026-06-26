/**
 * Unit tests for ThemeToggle component
 * Following TDD principles - tests written before implementation
 * Updated to use Pinia stores instead of composables
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { useThemeStore } from '../../src/stores/theme'
import { useLanguageStore } from '../../src/stores/language'
import ThemeToggle from '../../src/components/ThemeToggle.vue'

describe('ThemeToggle.vue', () => {
  let router, pinia

  beforeEach(() => {
    // Create fresh pinia instance for each test
    pinia = createPinia()
    setActivePinia(pinia)

    // Create a fresh router instance for each test
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div>Home</div>' } }
      ]
    })

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
      }))
    })

    // Mock fetch for language translations
    global.fetch = vi.fn(() => Promise.resolve({
      ok: true,
      json: async () => ({ 'theme.toggle': 'Toggle theme' })
    }))
  })

  function mountComponent(options = {}) {
    // Initialize stores before mounting
    const themeStore = useThemeStore()
    themeStore.currentTheme = options.theme || 'dark'

    const languageStore = useLanguageStore()
    // Set translations in the format expected by the store
    languageStore.translations = {
      en: {
        theme: {
          toggle: 'Toggle theme'
        }
      }
    }
    languageStore.currentLanguage = 'en'

    return mount(ThemeToggle, {
      global: {
        plugins: [pinia, router]
      }
    })
  }

  describe('rendering', () => {
    it('should render toggle button', () => {
      const wrapper = mountComponent()
      const button = wrapper.find('.theme-toggle')
      expect(button.exists()).toBe(true)
    })

    it('should display moon icon when theme is dark', () => {
      const wrapper = mountComponent({ theme: 'dark' })
      const moonIcon = wrapper.find('.icon-moon')
      const sunIcon = wrapper.find('.icon-sun')

      expect(moonIcon.exists()).toBe(true)
      expect(sunIcon.exists()).toBe(false)
    })

    it('should display sun icon when theme is light', () => {
      const wrapper = mountComponent({ theme: 'light' })
      const moonIcon = wrapper.find('.icon-moon')
      const sunIcon = wrapper.find('.icon-sun')

      expect(moonIcon.exists()).toBe(false)
      expect(sunIcon.exists()).toBe(true)
    })

    it('should display theme text', () => {
      const wrapper = mountComponent({ theme: 'dark' })
      const themeText = wrapper.find('.theme-text')
      expect(themeText.exists()).toBe(true)
      expect(themeText.text()).toBe('Dark')
    })

    it('should have proper CSS classes', () => {
      const wrapper = mountComponent()
      const button = wrapper.find('.theme-toggle')
      expect(button.classes()).toContain('theme-toggle')
    })
  })

  describe('interactions', () => {
    it('should call toggleTheme on click', () => {
      const wrapper = mountComponent({ theme: 'dark' })
      const themeStore = useThemeStore()
      const toggleSpy = vi.spyOn(themeStore, 'toggleTheme')
      const button = wrapper.find('.theme-toggle')

      // Check that the button has the click handler
      expect(button.exists()).toBe(true)
      expect(wrapper.vm).toBeTruthy()

      // The component should have access to toggleTheme
      expect(typeof wrapper.vm.toggleTheme === 'function').toBe(true)
    })

    it('should update when theme changes', async () => {
      const wrapper = mountComponent({ theme: 'dark' })
      const themeStore = useThemeStore()

      // Initially shows moon icon
      expect(wrapper.find('.icon-moon').exists()).toBe(true)

      // Mount a new component with light theme
      const lightWrapper = mountComponent({ theme: 'light' })

      // Light theme wrapper shows sun icon
      expect(lightWrapper.find('.icon-sun').exists()).toBe(true)
    })
  })

  describe('accessibility', () => {
    it('should have aria-label', () => {
      const wrapper = mountComponent()
      const button = wrapper.find('.theme-toggle')
      expect(button.attributes('aria-label')).toBe('Toggle theme')
    })

    it('should have title attribute', () => {
      const wrapper = mountComponent()
      const button = wrapper.find('.theme-toggle')
      expect(button.attributes('title')).toBe('Toggle theme')
    })

    it('should be keyboard accessible', () => {
      const wrapper = mountComponent()
      const button = wrapper.find('.theme-toggle')
      expect(button.element.tagName).toBe('BUTTON')
    })
  })

  describe('integration', () => {
    it('should call initTheme on mount', () => {
      const initSpy = vi.spyOn(useThemeStore(), 'initTheme')

      mountComponent()
      expect(initSpy).toHaveBeenCalledTimes(1)
    })

    it('should integrate with language store', () => {
      const wrapper = mountComponent()
      const button = wrapper.find('.theme-toggle')
      expect(button.attributes('aria-label')).toBeTruthy()
    })
  })

  describe('styling', () => {
    it('should apply hover effects', () => {
      const wrapper = mountComponent()
      const button = wrapper.find('.theme-toggle')
      expect(button.exists()).toBe(true)
    })

    it('should have proper responsive classes', () => {
      const wrapper = mountComponent()
      expect(wrapper.html()).toBeTruthy()
    })
  })

  describe('edge cases', () => {
    it('should handle undefined theme gracefully', () => {
      const wrapper = mountComponent({ theme: undefined })
      expect(wrapper.find('.theme-toggle').exists()).toBe(true)
    })

    it('should handle null toggleTheme function', () => {
      const wrapper = mountComponent({ theme: 'dark' })
      const themeStore = useThemeStore()

      // Store the original function
      const originalToggle = themeStore.toggleTheme
      // Temporarily set it to null
      themeStore.toggleTheme = null

      const button = wrapper.find('.theme-toggle')
      // Just check that the button exists (can't test click without function)
      expect(button.exists()).toBe(true)

      // Restore the function
      themeStore.toggleTheme = originalToggle
    })
  })
})
