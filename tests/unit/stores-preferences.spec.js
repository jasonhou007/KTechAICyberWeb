/**
 * Unit tests for the Pinia preferences store (issue #22).
 * Covers state, getters, actions, and localStorage persistence per the
 * issue's persistence + testing acceptance criteria.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import {
  usePreferencesStore,
  PREFERENCES_STORAGE_KEY
} from '../../src/stores/preferences'

describe('usePreferencesStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  describe('initial state', () => {
    it('seeds the theme from the system preference when storage is empty (happy-dom default = light)', () => {
      const prefs = usePreferencesStore()
      // No saved preference: the store honours prefers-color-scheme (#15 AC3).
      // happy-dom reports light by default, so the seed is 'light'.
      expect(prefs.theme).toBe('light')
      expect(prefs.language).toBe('en')
    })

    it('hydrates theme from localStorage on store creation', () => {
      localStorage.setItem(
        PREFERENCES_STORAGE_KEY,
        JSON.stringify({ theme: 'dark', language: 'zh' })
      )
      const prefs = usePreferencesStore()
      expect(prefs.theme).toBe('dark')
      expect(prefs.language).toBe('zh')
    })

    it('falls back to the system seed when stored JSON is corrupt', () => {
      localStorage.setItem(PREFERENCES_STORAGE_KEY, 'not-json{')
      const prefs = usePreferencesStore()
      // Corrupt JSON is ignored, so the seed comes from prefers-color-scheme.
      expect(prefs.theme).toBe('light')
      expect(prefs.language).toBe('en')
    })
  })

  describe('getters', () => {
    it('currentTheme and currentLanguage expose the values', () => {
      const prefs = usePreferencesStore()
      // System-seeded (light) in this environment.
      expect(prefs.currentTheme).toBe('light')
      expect(prefs.currentLanguage).toBe('en')
    })

    it('isDarkTheme reflects the dark theme choice', () => {
      const prefs = usePreferencesStore()
      expect(prefs.isDarkTheme).toBe(false)
      prefs.theme = 'dark'
      expect(prefs.isDarkTheme).toBe(true)
    })

    it('isEnglish reflects the language choice', () => {
      const prefs = usePreferencesStore()
      expect(prefs.isEnglish).toBe(true)
      prefs.language = 'zh'
      expect(prefs.isEnglish).toBe(false)
    })
  })

  describe('setTheme', () => {
    it('updates and persists a valid theme', () => {
      const prefs = usePreferencesStore()
      prefs.setTheme('dark')
      expect(prefs.theme).toBe('dark')
      const stored = JSON.parse(localStorage.getItem(PREFERENCES_STORAGE_KEY))
      expect(stored.theme).toBe('dark')
    })

    it('ignores an invalid theme', () => {
      const prefs = usePreferencesStore()
      const initial = prefs.theme
      prefs.setTheme('hot-pink')
      // Rejected: theme is unchanged and nothing is persisted.
      expect(prefs.theme).toBe(initial)
      expect(localStorage.getItem(PREFERENCES_STORAGE_KEY)).toBe(null)
    })
  })

  describe('setLanguage', () => {
    it('updates and persists a valid language', () => {
      const prefs = usePreferencesStore()
      prefs.setLanguage('zh')
      expect(prefs.language).toBe('zh')
      const stored = JSON.parse(localStorage.getItem(PREFERENCES_STORAGE_KEY))
      expect(stored.language).toBe('zh')
    })

    it('ignores an invalid language', () => {
      const prefs = usePreferencesStore()
      prefs.setLanguage('fr')
      expect(prefs.language).toBe('en')
    })
  })

  describe('hydrate', () => {
    it('re-reads values from localStorage', () => {
      const prefs = usePreferencesStore()
      localStorage.setItem(
        PREFERENCES_STORAGE_KEY,
        JSON.stringify({ theme: 'light', language: 'zh' })
      )
      prefs.hydrate()
      expect(prefs.theme).toBe('light')
      expect(prefs.language).toBe('zh')
    })

    it('ignores invalid persisted values', () => {
      const prefs = usePreferencesStore()
      const before = { theme: prefs.theme, language: prefs.language }
      localStorage.setItem(
        PREFERENCES_STORAGE_KEY,
        JSON.stringify({ theme: 'hot-pink', language: 'fr' })
      )
      prefs.hydrate()
      // Invalid values are rejected, so the existing (system-seeded) values
      // are left untouched.
      expect(prefs.theme).toBe(before.theme)
      expect(prefs.language).toBe(before.language)
    })
  })

  describe('reset', () => {
    it('restores defaults and persists them', () => {
      const prefs = usePreferencesStore()
      prefs.setTheme('dark')
      prefs.setLanguage('zh')
      prefs.reset()
      expect(prefs.theme).toBe('cyber')
      expect(prefs.language).toBe('en')
      const stored = JSON.parse(localStorage.getItem(PREFERENCES_STORAGE_KEY))
      expect(stored).toEqual({ theme: 'cyber', language: 'en' })
    })
  })

  describe('persistence robustness', () => {
    it('persist does not throw when localStorage.setItem fails', () => {
      const prefs = usePreferencesStore()
      const original = localStorage.setItem
      localStorage.setItem = vi.fn(() => {
        throw new Error('quota exceeded')
      })
      expect(() => prefs.setTheme('dark')).not.toThrow()
      expect(prefs.theme).toBe('dark')
      localStorage.setItem = original
    })
  })
})
