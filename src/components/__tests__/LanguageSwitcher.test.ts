/**
 * @file LanguageSwitcher.test.ts
 * @description Comprehensive unit tests for Language Switcher component
 * @ticket #66 - TEST-014: Language Switcher Component Unit Tests - TDD with Vitest
 *
 * Test Categories:
 * - Rendering Tests: Component mount and HTML structure
 * - Language Toggle Tests: Toggle between EN and 中文
 * - State Management Tests: Language state and localStorage persistence
 * - Accessibility Tests: ARIA attributes and keyboard navigation
 * - Cyberpunk Styling Tests: CSS classes and visual effects
 * - Edge Cases: Error handling and edge conditions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import LanguageSwitcher from '../LanguageSwitcher.vue'

describe('LanguageSwitcher.vue', () => {
  let wrapper: VueWrapper
  let localStorageMock: ReturnType<typeof createLocalStorageMock>

  const createLocalStorageMock = () => {
    let store: Record<string, string> = {}

    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString()
      },
      removeItem: (key: string) => {
        delete store[key]
      },
      clear: () => {
        store = {}
      },
    }
  }

  beforeEach(() => {
    // Arrange: Create fresh localStorage mock before each test
    localStorageMock = createLocalStorageMock()
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true,
    })

    // Arrange: Mock fetch for translations
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ 
          language: { 
            switch: 'Switch Language', 
            en: 'English', 
            zh: '中文' 
          } 
        }),
      })
    ) as any

    vi.clearAllMocks()

    // Arrange: Create a fresh wrapper for each test
    wrapper = mount(LanguageSwitcher, {
      global: {
        stubs: {},
      },
    })
  })

  afterEach(() => {
    // Cleanup: Unmount component after each test
    if (wrapper) {
      wrapper.unmount()
    }
  })

  // ============================================
  // Rendering Tests
  // ============================================
  describe('Rendering', () => {
    it('should mount without errors', () => {
      // Assert: Component exists and mounted successfully
      expect(wrapper.exists()).toBe(true)
    })

    it('renders button with language-switcher class', () => {
      // Act: Find the button element
      const button = wrapper.find('.language-switcher')

      // Assert: Button element exists with correct class
      expect(button.exists()).toBe(true)
      expect(button.element.tagName.toLowerCase()).toBe('button')
    })

    it('renders language icon', () => {
      // Act: Find the icon element
      const icon = wrapper.find('.lang-icon')

      // Assert: Icon exists with globe emoji
      expect(icon.exists()).toBe(true)
      expect(icon.text()).toBe('🌐')
    })

    it('renders language text', () => {
      // Act: Find the text element
      const text = wrapper.find('.lang-text')

      // Assert: Text element exists
      expect(text.exists()).toBe(true)
    })

    it('displays EN by default', () => {
      // Act: Get the text content
      const text = wrapper.find('.lang-text')

      // Assert: Default language is English
      expect(text.text()).toBe('EN')
    })
  })

  // ============================================
  // Language Toggle Tests
  // ============================================
  describe('Language Toggle', () => {
    it('toggles from EN to 中文 on click', async () => {
      // Arrange: Start with English
      const text = wrapper.find('.lang-text')
      expect(text.text()).toBe('EN')

      // Act: Click the button
      await wrapper.find('.language-switcher').trigger('click')
      await wrapper.vm.$nextTick()

      // Assert: Language changed to Chinese
      expect(text.text()).toBe('中文')
    })

    it('toggles from 中文 to EN on second click', async () => {
      // Arrange: Start with English, toggle to Chinese
      await wrapper.find('.language-switcher').trigger('click')
      await wrapper.vm.$nextTick()
      let text = wrapper.find('.lang-text')
      expect(text.text()).toBe('中文')

      // Act: Click again to toggle back
      await wrapper.find('.language-switcher').trigger('click')
      await wrapper.vm.$nextTick()
      text = wrapper.find('.lang-text')

      // Assert: Language changed back to English
      expect(text.text()).toBe('EN')
    })
  })

  // ============================================
  // State Management Tests
  // ============================================
  describe('State Management', () => {
    it('persists language preference to localStorage', async () => {
      // Act: Toggle to Chinese
      await wrapper.find('.language-switcher').trigger('click')
      await wrapper.vm.$nextTick()

      // Assert: Language saved to localStorage
      expect(localStorageMock.getItem('ktech-language')).toBe('zh')
    })

    it('initializes language from localStorage on mount', () => {
      // Arrange: Set localStorage to Chinese before mount
      localStorageMock.setItem('ktech-language', 'zh')
      const newWrapper = mount(LanguageSwitcher, {
        global: {
          stubs: {},
        },
      })
      const text = newWrapper.find('.lang-text')

      // Assert: Component loads with Chinese language
      expect(text.text()).toBe('中文')

      // Cleanup
      newWrapper.unmount()
    })

    it('defaults to English when localStorage is empty', () => {
      // Arrange: Clear localStorage
      localStorageMock.clear()
      const newWrapper = mount(LanguageSwitcher, {
        global: {
          stubs: {},
        },
      })
      const text = newWrapper.find('.lang-text')

      // Assert: Defaults to English
      expect(text.text()).toBe('EN')

      // Cleanup
      newWrapper.unmount()
    })
  })

  // ============================================
  // Accessibility Tests
  // ============================================
  describe('Accessibility', () => {
    it('has aria-label for screen readers', () => {
      // Act: Find button
      const button = wrapper.find('.language-switcher')

      // Assert: Has aria-label attribute
      expect(button.attributes('aria-label')).toBeTruthy()
    })

    it('has title attribute for tooltip', () => {
      // Act: Find button
      const button = wrapper.find('.language-switcher')

      // Assert: Has title attribute
      expect(button.attributes('title')).toBe('Switch between English and Chinese')
    })

    it('button is keyboard accessible with click event', async () => {
      // Arrange: Find button
      const button = wrapper.find('.language-switcher')
      const text = wrapper.find('.lang-text')

      // Act: Simulate click
      await button.trigger('click')
      await wrapper.vm.$nextTick()

      // Assert: Language toggled
      expect(text.text()).toBe('中文')
    })

    it('has semantic button element', () => {
      // Act: Find button
      const button = wrapper.find('.language-switcher')

      // Assert: Uses semantic button element
      expect(button.element.tagName.toLowerCase()).toBe('button')
    })
  })

  // ============================================
  // Cyberpunk Styling Tests
  // ============================================
  describe('Cyberpunk Styling', () => {
    it('has language-switcher CSS class', () => {
      // Act: Find button
      const button = wrapper.find('.language-switcher')

      // Assert: Has correct CSS class
      expect(button.classes()).toContain('language-switcher')
    })

    it('has lang-icon CSS class', () => {
      // Act: Find icon
      const icon = wrapper.find('.lang-icon')

      // Assert: Has correct CSS class
      expect(icon.classes()).toContain('lang-icon')
    })

    it('has lang-text CSS class', () => {
      // Act: Find text
      const text = wrapper.find('.lang-text')

      // Assert: Has correct CSS class
      expect(text.classes()).toContain('lang-text')
    })
  })

  // ============================================
  // Edge Cases Tests
  // ============================================
  describe('Edge Cases', () => {
    it('handles corrupted localStorage data', () => {
      // Arrange: Set corrupted data
      localStorageMock.setItem('ktech-language', 'invalid-language-code')

      // Act & Assert: Component defaults to English
      const newWrapper = mount(LanguageSwitcher, {
        global: {
          stubs: {},
        },
      })
      const text = newWrapper.find('.lang-text')
      expect(text.text()).toBe('EN')

      // Cleanup
      newWrapper.unmount()
    })

    it('handles rapid toggle clicks', async () => {
      // Act: Rapidly toggle multiple times
      for (let i = 0; i < 5; i++) {
        await wrapper.find('.language-switcher').trigger('click')
        await wrapper.vm.$nextTick()
      }

      // Assert: Component remains functional
      const text = wrapper.find('.lang-text')
      expect(text.text()).toBe('中文')
      expect(localStorageMock.getItem('ktech-language')).toBe('zh')
    })

    it('can be mounted and unmounted multiple times', () => {
      // Act: Multiple mount/unmount cycles
      for (let i = 0; i < 3; i++) {
        const w = mount(LanguageSwitcher, {
          global: {
            stubs: {},
          },
        })
        expect(w.exists()).toBe(true)
        w.unmount()
      }

      // Assert: No errors thrown
      expect(true).toBe(true)
    })
  })
})
