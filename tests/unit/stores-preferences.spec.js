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
    it('defaults to cyber theme and English when storage is empty', () => {
      const prefs = usePreferencesStore()
      expect(prefs.theme).toBe('cyber')
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

    it('falls back to defaults when stored JSON is corrupt', () => {
      localStorage.setItem(PREFERENCES_STORAGE_KEY, 'not-json{')
      const prefs = usePreferencesStore()
      expect(prefs.theme).toBe('cyber')
      expect(prefs.language).toBe('en')
    })
  })

  describe('getters', () => {
    it('currentTheme and currentLanguage expose the values', () => {
      const prefs = usePreferencesStore()
      expect(prefs.currentTheme).toBe('cyber')
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
      prefs.setTheme('hot-pink')
      expect(prefs.theme).toBe('cyber')
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
      localStorage.setItem(
        PREFERENCES_STORAGE_KEY,
        JSON.stringify({ theme: 'hot-pink', language: 'fr' })
      )
      prefs.hydrate()
      expect(prefs.theme).toBe('cyber')
      expect(prefs.language).toBe('en')
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
