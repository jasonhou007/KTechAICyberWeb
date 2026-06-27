/**
 * @file SkipLink.test.ts
 * @description Comprehensive unit tests for the SkipLink component
 * @ticket #91 - TEST-023: SkipLink Component Unit Tests - TDD with Vitest
 *
 * Test Categories:
 * - Rendering Tests: Component mount, tag, attributes and structure
 * - Content Tests: Translated link text verification
 * - Accessibility Tests: Focus management, ARIA semantics, keyboard access
 * - Behavior Tests: Click handler, focus jumping, tabindex lifecycle
 * - Styling Tests: skip-link class presence and focus hooks
 * - i18n Tests: Translation function behavior and language switching
 * - Edge Cases: Missing main-content element and lifecycle cycles
 *
 * Note on the i18n mock:
 * SkipLink imports `useLanguage` from '../i18n' (resolves to src/i18n). The real
 * composable now bundles locales via static imports (no runtime fetch), so it
 * would resolve real translations in tests too. We still mock the '../../i18n'
 * module (the path from this test file) with a synchronous translation function
 * backed by a small in-memory dictionary. This isolates the component's own
 * logic (rendering, click handling, focus management) from the shared language
 * singleton and gives deterministic, language-switchable assertions.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'

// --- i18n mock -------------------------------------------------------------
// In-memory translation dictionary covering both supported languages so the
// component renders real text and we can assert language switching behavior.
const mockTranslations: Record<string, Record<string, string>> = {
  en: {
    'a11y.skipLink': 'Skip to main content',
  },
  zh: {
    'a11y.skipLink': '跳转到主要内容',
  },
}

// vi.hoisted runs BEFORE vi.mock is hoisted, so its returned object is a stable
// reference the mock factory (and our tests) can mutate. The live `langRef`
// lets i18n tests flip the language and observe a re-rendered translation.
const i18nState = vi.hoisted(() => {
  const { ref } = require('vue') as typeof import('vue')
  return { langRef: ref('en') }
})

vi.mock('../../i18n', () => ({
  useLanguage: () => ({
    currentLanguage: i18nState.langRef,
    setLanguage(lang: string) {
      if (lang in mockTranslations) {
        i18nState.langRef.value = lang
      }
    },
    t(key: string): string {
      const dict = mockTranslations[i18nState.langRef.value] || {}
      return key in dict ? dict[key] : key
    },
  }),
}))

// Late import so the module mock above is registered first.
const SkipLink = (await import('../SkipLink.vue')).default

describe('SkipLink.vue', () => {
  let wrapper: VueWrapper
  let mainContent: HTMLElement

  beforeEach(() => {
    // Reset language to English for deterministic tests.
    i18nState.langRef.value = 'en'

    // Provide a real #main-content target so the click handler has something
    // to focus. happy-dom supports focus() and tabIndex on elements.
    mainContent = document.createElement('main')
    mainContent.id = 'main-content'
    document.body.appendChild(mainContent)

    // Spy on the focus primitives so we can assert the handler drives focus.
    vi.spyOn(mainContent, 'focus').mockImplementation(() => {})
    vi.spyOn(mainContent, 'removeAttribute')

    wrapper = mount(SkipLink)
  })

  afterEach(() => {
    wrapper.unmount()
    if (mainContent.parentNode) {
      mainContent.parentNode.removeChild(mainContent)
    }
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  // ============================================
  // Rendering Tests
  // ============================================
  describe('Rendering', () => {
    it('should mount without errors', () => {
      expect(wrapper.exists()).toBe(true)
    })

    it('renders an anchor (<a>) element', () => {
      const link = wrapper.find('a')
      expect(link.exists()).toBe(true)
      expect(link.element.tagName.toLowerCase()).toBe('a')
    })

    it('applies the skip-link class', () => {
      const link = wrapper.find('a.skip-link')
      expect(link.exists()).toBe(true)
      expect(link.classes()).toContain('skip-link')
    })

    it('has href pointing to #main-content by default', () => {
      const link = wrapper.find('a')
      expect(link.attributes('href')).toBe('#main-content')
    })

    it('renders exactly one anchor element', () => {
      const links = wrapper.findAll('a')
      expect(links).toHaveLength(1)
    })
  })

  // ============================================
  // Content Tests
  // ============================================
  describe('Content', () => {
    it('renders the translated skip-link text', () => {
      const link = wrapper.find('a.skip-link')
      expect(link.text()).toBe('Skip to main content')
    })

    it('renders non-empty text content', () => {
      expect(wrapper.text().length).toBeGreaterThan(0)
    })

    it('renders text without leading or trailing whitespace', () => {
      const link = wrapper.find('a')
      expect(link.text()).toBe(link.text().trim())
    })
  })

  // ============================================
  // Accessibility Tests
  // ============================================
  describe('Accessibility', () => {
    it('exposes implicit role="link" via the anchor element', () => {
      // <a href> has an implicit ARIA role of "link".
      const link = wrapper.find('a')
      expect(link.exists()).toBe(true)
      expect(link.element.tagName.toLowerCase()).toBe('a')
    })

    it('is focusable because it has an href attribute', () => {
      const link = wrapper.find('a')
      expect(link.attributes('href')).toBeTruthy()
    })

    it('is keyboard accessible (anchor with href receives focus via Tab)', async () => {
      const link = wrapper.find('a')
      // An <a href> is naturally keyboard-focusable; verify href is set.
      expect(link.attributes('href')).toBe('#main-content')
      // Focus events propagate to handlers without throwing.
      await expect(link.trigger('focus')).resolves.toBeUndefined()
    })

    it('does not use an inaccessible placeholder href (e.g. javascript: or #)', () => {
      const href = wrapper.find('a').attributes('href')
      expect(href).not.toBe('#')
      expect(href).not.toContain('javascript:')
    })

    it('renders text content that is meaningful to screen readers', () => {
      const text = wrapper.find('a').text()
      expect(text.length).toBeGreaterThan(0)
      expect(text).not.toBe('a11y.skipLink') // not an unresolved key
    })
  })

  // ============================================
  // Behavior Tests
  // ============================================
  describe('Behavior', () => {
    it('calls preventDefault on click', async () => {
      const link = wrapper.find('a')
      const evt = new MouseEvent('click', { bubbles: true, cancelable: true })
      const spy = vi.spyOn(evt, 'preventDefault')
      link.element.dispatchEvent(evt)
      expect(spy).toHaveBeenCalled()
    })

    it('focuses the main-content element on click', async () => {
      const link = wrapper.find('a')
      await link.trigger('click')
      expect(mainContent.focus).toHaveBeenCalled()
    })

    it('sets main-content tabindex to -1 before focusing', async () => {
      const link = wrapper.find('a')
      await link.trigger('click')
      expect(mainContent.tabIndex).toBe(-1)
    })

    it('removes the temporary tabindex after the timeout', async () => {
      vi.useFakeTimers()
      const link = wrapper.find('a')
      await link.trigger('click')
      // Immediately after click, tabindex is still set.
      expect(mainContent.tabIndex).toBe(-1)
      // After the 100ms timer fires, the attribute should be removed.
      vi.advanceTimersByTime(100)
      expect(mainContent.removeAttribute).toHaveBeenCalledWith('tabindex')
    })

    it('does not focus when main-content element is missing', async () => {
      // Remove the target so the handler's guard branch runs.
      mainContent.parentNode!.removeChild(mainContent)
      const link = wrapper.find('a')
      // Should not throw.
      await expect(link.trigger('click')).resolves.toBeUndefined()
    })

    it('does not throw when clicking multiple times in succession', async () => {
      const link = wrapper.find('a')
      await link.trigger('click')
      await link.trigger('click')
      await link.trigger('click')
      expect(mainContent.focus).toHaveBeenCalledTimes(3)
    })
  })

  // ============================================
  // Styling Tests
  // ============================================
  describe('Styling', () => {
    it('has the skip-link class that drives visually-hidden-by-default CSS', () => {
      // The component's CSS positions .skip-link off-screen (top: -100px) and
      // reveals it on :focus/:focus-visible. The presence of this class is the
      // DOM contract the styles rely on.
      const link = wrapper.find('a.skip-link')
      expect(link.exists()).toBe(true)
    })

    it('exposes focus hooks via the skip-link class (no inline style override)', () => {
      const link = wrapper.find('a')
      // No inline styles should clobber the stylesheet's focus behavior.
      expect(link.attributes('style')).toBeFalsy()
    })

    it('uses a CSS class rather than hardcoded inline display for visibility', () => {
      const link = wrapper.find('a')
      expect(link.classes()).toContain('skip-link')
      // Visibility is controlled by :focus in scoped CSS, not inline attributes.
      expect(link.attributes('hidden')).toBeFalsy()
    })
  })

  // ============================================
  // i18n Tests
  // ============================================
  describe('Internationalization', () => {
    it('exposes the translation function on the component instance', () => {
      expect(typeof wrapper.vm.t).toBe('function')
    })

    it('translates the a11y.skipLink key to English by default', () => {
      expect(wrapper.vm.t('a11y.skipLink')).toBe('Skip to main content')
    })

    it('re-renders translated text when language switches to Chinese', async () => {
      // Flip the live language ref and remount to observe the new text.
      i18nState.langRef.value = 'zh'
      const zhWrapper = mount(SkipLink)
      expect(zhWrapper.find('a').text()).toBe('跳转到主要内容')
      zhWrapper.unmount()
      i18nState.langRef.value = 'en'
    })

    it('returns the key when translation is missing', () => {
      expect(wrapper.vm.t('nonexistent.key')).toBe('nonexistent.key')
    })

    it('handles empty key gracefully', () => {
      expect(wrapper.vm.t('')).toBe('')
    })
  })

  // ============================================
  // Edge Cases
  // ============================================
  describe('Edge Cases', () => {
    it('can be mounted and unmounted multiple times', () => {
      const wrappers = [mount(SkipLink), mount(SkipLink), mount(SkipLink)]
      wrappers.forEach((w) => {
        expect(w.exists()).toBe(true)
        expect(w.find('a.skip-link').exists()).toBe(true)
      })
      wrappers.forEach((w) => w.unmount())
    })

    it('survives rapid mount/unmount cycles', () => {
      for (let i = 0; i < 10; i++) {
        const w = mount(SkipLink)
        expect(w.exists()).toBe(true)
        w.unmount()
      }
    })

    it('handles click when document has no main-content', async () => {
      mainContent.parentNode!.removeChild(mainContent)
      const link = wrapper.find('a')
      await expect(link.trigger('click')).resolves.toBeUndefined()
      // Re-add for afterEach cleanup safety.
      document.body.appendChild(mainContent)
    })
  })

  // ============================================
  // Component Structure / Integration
  // ============================================
  describe('Structure', () => {
    it('renders the expected HTML snapshot structure', () => {
      const html = wrapper.html()
      expect(html).toContain('<a')
      expect(html).toContain('skip-link')
      expect(html).toContain('href="#main-content"')
      expect(html).toContain('Skip to main content')
    })

    it('has a single root anchor element', () => {
      // Vue mount wraps the root; the component's own root is one <a>.
      expect(wrapper.findAll('a')).toHaveLength(1)
    })
  })
})
