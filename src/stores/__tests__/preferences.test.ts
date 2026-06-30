/**
 * @file preferences.test.ts
 * @description Unit tests for usePreferencesStore (#22 - language persistence)
 *
 * Covers language handling and localStorage persistence. The theme surface
 * (state.theme, setTheme/toggleTheme, detectSystemTheme, currentTheme,
 * isDarkTheme) was removed in #248 — the site is locked to the dark theme by
 * App.vue's unconditional <html data-theme="dark">, so the store owns only
 * language now.
 *
 * NOTE: This store does NOT write to document.documentElement[data-theme].
 * Mirroring the active theme onto the <html> data-theme attribute is the
 * responsibility of App.vue's unconditional setAttribute (see App.test.ts).
 * The store only owns the source-of-truth language state + localStorage
 * persistence; the DOM wiring lives in the app shell so the same store can be
 * unit-tested in isolation and reused outside a browser.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import {
  usePreferencesStore,
  PREFERENCES_STORAGE_KEY,
} from '../preferences'

describe('usePreferencesStore (language)', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    setActivePinia(createPinia())
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

  describe('theme field removal (#248)', () => {
    it('persist() does not write a theme key after a language mutation', () => {
      // Seed a stale theme blob as an existing user would carry; setLanguage
      // must rewrite localStorage WITHOUT the theme key (the migration that
      // drops stale theme values).
      localStorage.setItem(
        PREFERENCES_STORAGE_KEY,
        JSON.stringify({ theme: 'light', language: 'en' }),
      )
      const store = usePreferencesStore()
      store.setLanguage('zh')

      const raw = JSON.parse(localStorage.getItem(PREFERENCES_STORAGE_KEY) || '{}')
      expect(raw.language).toBe('zh')
      expect('theme' in raw).toBe(false)
    })

    it('reset() writes a blob with no theme key', () => {
      localStorage.setItem(
        PREFERENCES_STORAGE_KEY,
        JSON.stringify({ theme: 'dark', language: 'zh' }),
      )
      const store = usePreferencesStore()
      store.reset()

      const raw = JSON.parse(localStorage.getItem(PREFERENCES_STORAGE_KEY) || '{}')
      expect(raw).toEqual({ language: 'en' })
      expect('theme' in raw).toBe(false)
    })
  })
})
