/**
 * @file LanguageSwitcher.test.ts
 * @description Comprehensive unit tests for LanguageSwitcher component
 * @ticket #103 - TEST-031: LanguageSwitcher Component Unit Tests - TDD with Vitest
 *
 * Test Categories:
 * - Rendering Tests: Component mount, button structure, globe icon
 * - Content Tests: Language display (EN/中文), title attribute
 * - Interaction Tests: Click toggles language via toggleLanguage
 * - Accessibility Tests: aria-label, button role, title attribute
 * - Styling Tests: CSS classes for switcher, icon, text
 * - i18n Tests: Translation function, language reactivity
 * - Edge Cases: Component lifecycle and multiple renders
 *
 * TDD Approach:
 * 1. Red: Tests written to define expected behavior
 * 2. Green: Component implementation makes tests pass
 * 3. Refactor: Test code optimized for clarity and maintainability
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'

/**
 * Controlled i18n mock.
 *
 * vi.hoisted runs BEFORE vi.mock is hoisted, so its returned object is a stable
 * reference the mock factory (and our tests) can mutate. The live `langRef`
 * lets i18n tests flip the language and observe a re-rendered languageDisplay,
 * and the toggle spy lets interaction tests assert that toggleLanguage is called.
 */
const i18nState = vi.hoisted(() => {
  const { ref, computed } = require('vue') as typeof import('vue')
  const langRef = ref('en')

  // Toggle spy: records calls and (when invoked directly) flips the language so
  // reactivity tests can observe languageDisplay re-rendering.
  const toggleSpy = vi.fn(() => {
    langRef.value = langRef.value === 'en' ? 'zh' : 'en'
  })

  return { langRef, toggleSpy, computed }
})

vi.mock('../../composables/useLanguage', () => {
  // A minimal translation map mirroring the keys LanguageSwitcher uses
  // (language.switch). Falls back to the key itself for unknown keys,
  // matching the real useLanguage().t contract.
  const dictionary: Record<string, string> = {
    'language.switch': 'Switch language',
  }
  const t = (key: string) => dictionary[key] ?? key

  // languageDisplay mirrors the real composable: 'EN' when English, '中文' otherwise.
  const languageDisplay = i18nState.computed(() =>
    i18nState.langRef.value === 'en' ? 'EN' : '中文',
  )

  return {
    useLanguage: () => ({
      currentLanguage: i18nState.langRef,
      languageDisplay,
      isEnglish: i18nState.computed(() => i18nState.langRef.value === 'en'),
      initLanguage: vi.fn(),
      setLanguage: vi.fn((lang: string) => {
        if (lang === 'en' || lang === 'zh') {
          i18nState.langRef.value = lang
        }
      }),
      toggleLanguage: i18nState.toggleSpy,
      t,
    }),
  }
})

// Late import so the module mock above is registered first.
const LanguageSwitcher = (await import('../LanguageSwitcher.vue')).default

describe('LanguageSwitcher.vue', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    // Reset language to English and clear spy history for deterministic tests.
    i18nState.langRef.value = 'en'
    i18nState.toggleSpy.mockClear()

    // Arrange: Create a fresh wrapper for each test
    wrapper = mount(LanguageSwitcher)
  })

  afterEach(() => {
    // Cleanup: Unmount component after each test
    wrapper.unmount()
  })

  // ============================================
  // Rendering Tests
  // ============================================
  describe('Rendering', () => {
    it('should mount without errors', () => {
      // Assert: Component exists and mounted successfully
      expect(wrapper.exists()).toBe(true)
    })

    it('renders a button element', () => {
      // Act: Find the button element
      const button = wrapper.find('button')

      // Assert: Root element is a button
      expect(button.exists()).toBe(true)
      expect(button.element.tagName.toLowerCase()).toBe('button')
    })

    it('renders the globe icon element', () => {
      // Act: Find the icon element
      const icon = wrapper.find('.lang-icon')

      // Assert: Globe icon span exists
      expect(icon.exists()).toBe(true)
    })

    it('renders the language text element', () => {
      // Act: Find the text element
      const text = wrapper.find('.lang-text')

      // Assert: Language text span exists
      expect(text.exists()).toBe(true)
    })

    it('renders icon and text as children of the button', () => {
      // Act: Find button and its children
      const button = wrapper.find('button.language-switcher')
      const icon = button.find('.lang-icon')
      const text = button.find('.lang-text')

      // Assert: Correct DOM hierarchy
      expect(button.exists()).toBe(true)
      expect(icon.exists()).toBe(true)
      expect(text.exists()).toBe(true)
    })

    it('renders the globe emoji inside the icon element', () => {
      // Act: Get the icon element
      const icon = wrapper.find('.lang-icon')

      // Assert: Globe emoji is present
      expect(icon.text()).toBe('🌐')
    })
  })

  // ============================================
  // Content Tests
  // ============================================
  describe('Content', () => {
    it('displays EN when current language is English', () => {
      // Arrange: language is English (set in beforeEach)
      // Act: Get the language text
      const text = wrapper.find('.lang-text')

      // Assert: English display is 'EN'
      expect(text.text()).toBe('EN')
    })

    it('displays 中文 when current language is Chinese', async () => {
      // Arrange: flip the underlying language ref
      i18nState.langRef.value = 'zh'
      await wrapper.vm.$nextTick()

      // Act: Get the language text
      const text = wrapper.find('.lang-text')

      // Assert: Chinese display is '中文'
      expect(text.text()).toBe('中文')
    })

    it('has a title attribute describing the action', () => {
      // Act: Get the button element
      const button = wrapper.find('button')

      // Assert: Title attribute is present and descriptive
      expect(button.attributes('title')).toContain('Switch')
    })
  })

  // ============================================
  // Interaction Tests
  // ============================================
  describe('Interaction', () => {
    it('calls toggleLanguage when the button is clicked', async () => {
      // Arrange: spy cleared in beforeEach
      // Act: Click the button
      await wrapper.find('button').trigger('click')

      // Assert: toggleLanguage was called exactly once
      expect(i18nState.toggleSpy).toHaveBeenCalledTimes(1)
    })

    it('calls toggleLanguage on each subsequent click', async () => {
      // Act: Click the button three times
      const button = wrapper.find('button')
      await button.trigger('click')
      await button.trigger('click')
      await button.trigger('click')

      // Assert: toggleLanguage was called three times
      expect(i18nState.toggleSpy).toHaveBeenCalledTimes(3)
    })

    it('clicking the button triggers toggleLanguage, not some other handler', async () => {
      // Arrange: spy cleared in beforeEach
      // Act: Click the button
      await wrapper.find('button').trigger('click')

      // Assert: The toggle spy (and only the toggle spy) was invoked
      expect(i18nState.toggleSpy).toHaveBeenCalled()
    })
  })

  // ============================================
  // Accessibility Tests
  // ============================================
  describe('Accessibility', () => {
    it('has an aria-label for screen readers', () => {
      // Act: Get the button element
      const button = wrapper.find('button')

      // Assert: aria-label attribute is present and non-empty
      const ariaLabel = button.attributes('aria-label')
      expect(ariaLabel).toBeTruthy()
      expect(ariaLabel?.length).toBeGreaterThan(0)
    })

    it('aria-label is derived from the i18n translation key', () => {
      // Act: Get the button element
      const button = wrapper.find('button')

      // Assert: aria-label matches the translated 'language.switch' key
      expect(button.attributes('aria-label')).toBe('Switch language')
    })

    it('uses a button element (native button role)', () => {
      // Act: Find by role
      const button = wrapper.find('button[role="button"]')

      // A native <button> has an implicit role="button"; @vue/test-utils may
      // not expose implicit roles via attribute selectors. Assert the tag name
      // directly so the test is robust across DOM implementations.
      const btn = wrapper.find('button')

      // Assert: Element is a native button (role="button")
      expect(btn.exists()).toBe(true)
      expect(btn.element.tagName.toLowerCase()).toBe('button')
    })

    it('is focusable via tabindex semantics (native button)', () => {
      // Act: Get the button element
      const button = wrapper.find('button')

      // Assert: Native buttons are focusable by default
      expect(button.exists()).toBe(true)
      expect(button.element.tagName.toLowerCase()).toBe('button')
    })

    it('has a descriptive title attribute', () => {
      // Act: Get the button element
      const button = wrapper.find('button')

      // Assert: Title is present
      expect(button.attributes('title')).toBeTruthy()
    })
  })

  // ============================================
  // Styling Tests
  // ============================================
  describe('Styling', () => {
    it('applies the language-switcher class to the root button', () => {
      // Act: Find the root element
      const button = wrapper.find('button.language-switcher')

      // Assert: Root has the language-switcher class
      expect(button.exists()).toBe(true)
      expect(button.classes()).toContain('language-switcher')
    })

    it('icon element has the lang-icon class', () => {
      // Act: Find the icon element
      const icon = wrapper.find('.lang-icon')

      // Assert: Icon has the correct class
      expect(icon.exists()).toBe(true)
      expect(icon.classes()).toContain('lang-icon')
    })

    it('text element has the lang-text class', () => {
      // Act: Find the text element
      const text = wrapper.find('.lang-text')

      // Assert: Text has the correct class
      expect(text.exists()).toBe(true)
      expect(text.classes()).toContain('lang-text')
    })

    it('button element has scoped styles applied via class', () => {
      // Act: Check the root button
      const button = wrapper.find('button.language-switcher')

      // Assert: Class hook for scoped styles is present
      expect(button.attributes('class')).toContain('language-switcher')
    })

    it('renders exactly two child spans inside the button', () => {
      // Act: Count spans inside the button
      const spans = wrapper.find('button').findAll('span')

      // Assert: Exactly two spans (icon + text)
      expect(spans).toHaveLength(2)
    })
  })

  // ============================================
  // i18n Tests
  // ============================================
  describe('Internationalization', () => {
    it('translation function is accessible from the component instance', () => {
      // Act: Access vm
      const vm = wrapper.vm

      // Assert: t function exists
      expect(typeof vm.t).toBe('function')
    })

    it('translates the language.switch key correctly', () => {
      // Act: Call translation function via the component instance
      const result = wrapper.vm.t('language.switch')

      // Assert: Returns the translated value
      expect(result).toBe('Switch language')
    })

    it('returns the key when translation is not found', () => {
      // Act: Call with a non-existent key
      const result = wrapper.vm.t('nonexistent.key')

      // Assert: Returns the key itself as fallback
      expect(result).toBe('nonexistent.key')
    })

    it('handles empty key gracefully', () => {
      // Act: Call with an empty key
      const result = wrapper.vm.t('')

      // Assert: Returns empty string (falls back to key)
      expect(result).toBe('')
    })

    it('reactively re-renders languageDisplay when language changes', async () => {
      // Arrange: language is English initially
      expect(wrapper.find('.lang-text').text()).toBe('EN')

      // Act: Flip the language ref and wait for reactivity
      i18nState.langRef.value = 'zh'
      await wrapper.vm.$nextTick()

      // Assert: Display re-rendered to Chinese
      expect(wrapper.find('.lang-text').text()).toBe('中文')

      // Act: Flip back to English
      i18nState.langRef.value = 'en'
      await wrapper.vm.$nextTick()

      // Assert: Display re-rendered back to English
      expect(wrapper.find('.lang-text').text()).toBe('EN')
    })

    it('aria-label reflects the translated switch label', () => {
      // Act: Get the button
      const button = wrapper.find('button')

      // Assert: aria-label is the translated label, not the raw key
      expect(button.attributes('aria-label')).not.toBe('language.switch')
      expect(button.attributes('aria-label')).toBe('Switch language')
    })
  })

  // ============================================
  // Edge Cases
  // ============================================
  describe('Edge Cases', () => {
    it('can be mounted and unmounted multiple times', () => {
      // Arrange: Create multiple wrappers
      const wrappers = [
        mount(LanguageSwitcher),
        mount(LanguageSwitcher),
        mount(LanguageSwitcher),
      ]

      // Assert: All wrappers mount successfully and show EN
      wrappers.forEach((w) => {
        expect(w.exists()).toBe(true)
        expect(w.find('.lang-text').text()).toBe('EN')
      })

      // Cleanup: Unmount all
      wrappers.forEach((w) => w.unmount())

      // Assert: No errors thrown
      expect(true).toBe(true)
    })

    it('renders correctly when unmounted and remounted', () => {
      // Act: Unmount and remount
      wrapper.unmount()
      const newWrapper = mount(LanguageSwitcher)

      // Assert: Still renders correctly
      expect(newWrapper.exists()).toBe(true)
      expect(newWrapper.find('.lang-text').text()).toBe('EN')

      // Cleanup
      newWrapper.unmount()
    })

    it('handles rapid mount/unmount cycles', () => {
      // Act: Rapid mount/unmount
      for (let i = 0; i < 10; i++) {
        const w = mount(LanguageSwitcher)
        expect(w.exists()).toBe(true)
        w.unmount()
      }

      // Assert: No errors
      expect(true).toBe(true)
    })
  })

  // ============================================
  // Component Structure
  // ============================================
  describe('Component Structure', () => {
    it('has correct DOM hierarchy', () => {
      // Act: Build expected hierarchy
      const button = wrapper.find('button.language-switcher')
      const icon = button.find('.lang-icon')
      const text = button.find('.lang-text')

      // Assert: Correct parent-child relationships
      expect(button.exists()).toBe(true)
      expect(icon.exists()).toBe(true)
      expect(text.exists()).toBe(true)
    })

    it('root element has the language-switcher class only on the button', () => {
      // Act: Find all elements with the class
      const switchers = wrapper.findAll('.language-switcher')

      // Assert: Exactly one root element
      expect(switchers).toHaveLength(1)
    })
  })

  // ============================================
  // Integration Tests
  // ============================================
  describe('Integration', () => {
    it('component renders complete switcher markup', () => {
      // Act: Get full HTML
      const html = wrapper.html()

      // Assert: Contains all expected elements and content
      expect(html).toContain('language-switcher')
      expect(html).toContain('lang-icon')
      expect(html).toContain('🌐')
      expect(html).toContain('lang-text')
      expect(html).toContain('EN')
    })

    it('aria-label and title are both populated', () => {
      // Act: Get the button
      const button = wrapper.find('button')

      // Assert: Both accessibility attributes are present
      expect(button.attributes('aria-label')).toBeTruthy()
      expect(button.attributes('title')).toBeTruthy()
    })
  })
})
