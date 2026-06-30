/**
 * @file preferences.test.ts
 * @description Unit tests for usePreferencesStore (#15 - theme toggle persistence)
 *
 * Covers theme persistence/restore, the toggleTheme action (dark <-> light),
 * language handling, and the system-preference (prefers-color-scheme) seeding
 * of the initial theme.
 *
 * NOTE: This store does NOT write to document.documentElement[data-theme].
 * Mirroring the active theme onto the <html> data-theme attribute is the
 * responsibility of App.vue's theme watcher (see App.test.ts). The store only
 * owns the source-of-truth preference state + localStorage persistence; the
 * DOM wiring lives in the app shell so the same store can be unit-tested in
 * isolation and reused outside a browser.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import {
  usePreferencesStore,
  PREFERENCES_STORAGE_KEY,
} from '../preferences'

describe('usePreferencesStore (theme toggle)', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    // Default: no matchMedia preference installed. Individual tests that
    // exercise system detection install their own mock and restore after.
    setActivePinia(createPinia())
  })

  describe('theme state', () => {
    it('seeds the theme from the system preference with no persisted value (happy-dom default = light)', () => {
      const store = usePreferencesStore()
      expect(store.theme).toBe('light')
      expect(store.currentTheme).toBe('light')
    })

    it('hydrates a persisted dark theme', () => {
      localStorage.setItem(
        PREFERENCES_STORAGE_KEY,
        JSON.stringify({ theme: 'dark', language: 'en' }),
      )
      const store = usePreferencesStore()
      expect(store.theme).toBe('dark')
      expect(store.isDarkTheme).toBe(true)
    })

    it('hydrates a persisted light theme', () => {
      localStorage.setItem(
        PREFERENCES_STORAGE_KEY,
        JSON.stringify({ theme: 'light', language: 'en' }),
      )
      const store = usePreferencesStore()
      expect(store.theme).toBe('light')
      expect(store.isDarkTheme).toBe(false)
    })
  })

  describe('system preference detection (prefers-color-scheme)', () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('seeds the theme from prefers-color-scheme: dark when nothing is saved', () => {
      vi.spyOn(window, 'matchMedia').mockReturnValue({
        matches: true,
        media: '(prefers-color-scheme: dark)',
      } as MediaQueryList)
      setActivePinia(createPinia())

      const store = usePreferencesStore()
      expect(store.theme).toBe('dark')
      expect(window.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)')
    })

    it('seeds the theme from prefers-color-scheme: light when nothing is saved', () => {
      vi.spyOn(window, 'matchMedia').mockReturnValue({
        matches: false,
        media: '(prefers-color-scheme: light)',
      } as MediaQueryList)
      setActivePinia(createPinia())

      const store = usePreferencesStore()
      expect(store.theme).toBe('light')
    })

    it('a saved theme wins over the system preference', () => {
      localStorage.setItem(
        PREFERENCES_STORAGE_KEY,
        JSON.stringify({ theme: 'light', language: 'en' }),
      )
      // System says dark, but the saved preference must take precedence.
      vi.spyOn(window, 'matchMedia').mockReturnValue({
        matches: true,
        media: '(prefers-color-scheme: dark)',
      } as MediaQueryList)
      setActivePinia(createPinia())

      const store = usePreferencesStore()
      expect(store.theme).toBe('light')
    })
  })

  describe('setTheme', () => {
    it('persists the new theme to localStorage', () => {
      const store = usePreferencesStore()
      store.setTheme('light')

      const raw = JSON.parse(localStorage.getItem(PREFERENCES_STORAGE_KEY) || '{}')
      expect(raw.theme).toBe('light')
    })

    it('ignores invalid theme values', () => {
      const store = usePreferencesStore()
      const initial = store.theme
      store.setTheme('neon' as any)
      expect(store.theme).toBe(initial)
    })
  })

  describe('toggleTheme', () => {
    it('switches light -> dark', () => {
      const store = usePreferencesStore()
      store.setTheme('light')
      store.toggleTheme()
      expect(store.theme).toBe('dark')
    })

    it('switches dark -> light', () => {
      const store = usePreferencesStore()
      store.setTheme('dark')
      store.toggleTheme()
      expect(store.theme).toBe('light')
    })

    it('treats the default theme as dark when toggling', () => {
      // From any non-light theme (here 'cyber' set explicitly), toggling lands
      // on light — the toggle always maps non-light -> light.
      const store = usePreferencesStore()
      store.setTheme('cyber')
      store.toggleTheme()
      expect(store.theme).toBe('light')
    })

    it('persists the toggled value', () => {
      const store = usePreferencesStore()
      store.setTheme('dark')
      store.toggleTheme()
      const raw = JSON.parse(localStorage.getItem(PREFERENCES_STORAGE_KEY) || '{}')
      expect(raw.theme).toBe('light')
    })
  })

  describe('language', () => {
    it('switches language and persists', () => {
      const store = usePreferencesStore()
      store.setLanguage('zh')
      expect(store.language).toBe('zh')
      expect(store.isEnglish).toBe(false)

      const raw = JSON.parse(localStorage.getItem(PREFERENCES_STORAGE_KEY) || '{}')
      expect(raw.language).toBe('zh')
    })
  })
})
