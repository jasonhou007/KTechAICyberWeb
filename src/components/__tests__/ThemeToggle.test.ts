/**
 * @file ThemeToggle.test.ts
 * @description Unit tests for the ThemeToggle component (#15 - FEAT-005)
 *
 * Covers: renders a button, exposes an accessible aria-label + aria-pressed,
 * shows the correct icon/label for each theme, calls toggleTheme on the
 * preferences store on click, and re-renders when the store theme changes.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { usePreferencesStore } from '../../stores/preferences'

// Deterministic i18n mock mirroring the theme.* keys.
const dictionary: Record<string, string> = {
  'theme.toggle': 'Toggle theme',
  // #190: aria-label now interpolates the visible state word.
  'theme.toggleWithState': 'Switch theme: {state}',
  'theme.dark': 'Dark theme',
  'theme.light': 'Light theme',
  'theme.darkLabel': 'Dark',
  'theme.lightLabel': 'Light',
}

vi.mock('../../composables/useLanguage', () => ({
  useLanguage: () => ({
    t: (key: string, params?: Record<string, string>) => {
      let v = dictionary[key] ?? key
      if (params) {
        for (const [k, val] of Object.entries(params)) {
          v = v.replace(`{${k}}`, val)
        }
      }
      return v
    },
  }),
}))

const ThemeToggle = (await import('../ThemeToggle.vue')).default

describe('ThemeToggle.vue (FEAT-005)', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    setActivePinia(createPinia())
    wrapper = mount(ThemeToggle)
  })

  afterEach(() => {
    wrapper.unmount()
  })

  describe('Structure', () => {
    it('mounts and renders a button', () => {
      const button = wrapper.find('button.theme-toggle')
      expect(button.exists()).toBe(true)
    })
  })

  describe('Accessibility', () => {
    it('exposes an aria-label describing the toggle action', () => {
      // #190: aria-label now interpolates the visible state word. Default theme
      // is light (happy-dom prefers-color-scheme seed), so the label shows
      // "Dark" (the theme you'll switch TO) and the aria-label is
      // "Switch theme: Dark".
      expect(wrapper.find('button.theme-toggle').attributes('aria-label')).toBe(
        'Switch theme: Dark',
      )
    })

    it('reflects the current theme via aria-pressed (light => true)', async () => {
      const store = usePreferencesStore()
      store.setTheme('light')
      await wrapper.vm.$nextTick()
      expect(wrapper.find('button.theme-toggle').attributes('aria-pressed')).toBe(
        'true',
      )
    })

    it('reflects the current theme via aria-pressed (dark => false)', async () => {
      const store = usePreferencesStore()
      store.setTheme('dark')
      await wrapper.vm.$nextTick()
      expect(wrapper.find('button.theme-toggle').attributes('aria-pressed')).toBe(
        'false',
      )
    })
  })

  describe('Theme-aware content', () => {
    it('shows the light label/icon when the active theme is dark', async () => {
      const store = usePreferencesStore()
      store.setTheme('dark')
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.theme-label').text()).toBe('Light')
      expect(wrapper.find('.theme-icon').text()).toBe('☀')
    })

    it('shows the dark label/icon when the active theme is light', async () => {
      const store = usePreferencesStore()
      store.setTheme('light')
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.theme-label').text()).toBe('Dark')
      expect(wrapper.find('.theme-icon').text()).toBe('☾')
    })
  })

  describe('Interaction', () => {
    it('calls store.toggleTheme on click and flips the theme', async () => {
      const store = usePreferencesStore()
      // Pin the start theme explicitly so the assertion is independent of the
      // system-preference seed (issue #15 now seeds from prefers-color-scheme).
      store.setTheme('dark')
      await wrapper.vm.$nextTick()

      await wrapper.find('button.theme-toggle').trigger('click')

      expect(store.theme).toBe('light')
    })

    it('re-renders the icon + aria-pressed after a real click (end-to-end)', async () => {
      const store = usePreferencesStore()
      store.setTheme('dark')
      await wrapper.vm.$nextTick()
      // Dark active => shows the light affordance (sun) + aria-pressed false.
      expect(wrapper.find('.theme-icon').text()).toBe('☀')
      expect(wrapper.find('button.theme-toggle').attributes('aria-pressed')).toBe('false')

      await wrapper.find('button.theme-toggle').trigger('click')
      await wrapper.vm.$nextTick()

      // Now light active => shows the dark affordance (moon) + aria-pressed true.
      expect(store.theme).toBe('light')
      expect(wrapper.find('.theme-icon').text()).toBe('☾')
      expect(wrapper.find('.theme-label').text()).toBe('Dark')
      expect(wrapper.find('button.theme-toggle').attributes('aria-pressed')).toBe('true')
    })
  })

  // ============================================
  // #190 a11y: label-content-name-mismatch — the accessible name (aria-label)
  // must be a superstring of the visible text. The visible text is the state
  // label (Dark / Light); the old aria-label "Toggle theme" did NOT contain it.
  // These tests FAIL on the old theme.toggle binding and PASS once the binding
  // uses theme.toggleWithState with {state}.
  // ============================================
  describe('#190 a11y: accessible name contains the visible state', () => {
    const nameContainsVisible = (w: VueWrapper) => {
      const button = w.find('button.theme-toggle')
      const name = button.attributes('aria-label') ?? ''
      const visible = button.find('.theme-label').text()
      return { name, visible, ok: name.includes(visible) }
    }

    it('dark-active state: aria-label contains the visible "Light"', async () => {
      const store = usePreferencesStore()
      store.setTheme('dark')
      await wrapper.vm.$nextTick()
      const { name, visible, ok } = nameContainsVisible(wrapper)
      expect(visible).toBe('Light')
      expect(ok, `aria-label "${name}" must contain visible "${visible}"`).toBe(true)
    })

    it('light-active state: aria-label contains the visible "Dark"', async () => {
      const store = usePreferencesStore()
      store.setTheme('light')
      await wrapper.vm.$nextTick()
      const { name, visible, ok } = nameContainsVisible(wrapper)
      expect(visible).toBe('Dark')
      expect(ok, `aria-label "${name}" must contain visible "${visible}"`).toBe(true)
    })
  })
})
