/**
 * Unit tests for the Pinia preferences store (issue #22).
 * Covers state, getters, actions, and localStorage persistence per the
 * issue's persistence + testing acceptance criteria.
 *
 * #248: the theme surface was removed (the site is locked to dark by App.vue).
 * These tests now cover language only — stale theme values in localStorage
 * are tolerated by loadPersisted() and dropped on the next persist.
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
    it('defaults language to en when storage is empty', () => {
      const prefs = usePreferencesStore()
      expect(prefs.language).toBe('en')
    })

    it('hydrates language from localStorage on store creation', () => {
      localStorage.setItem(
        PREFERENCES_STORAGE_KEY,
        JSON.stringify({ theme: 'dark', language: 'zh' })
      )
      const prefs = usePreferencesStore()
      expect(prefs.language).toBe('zh')
    })

    it('falls back to the default when stored JSON is corrupt', () => {
      localStorage.setItem(PREFERENCES_STORAGE_KEY, 'not-json{')
      const prefs = usePreferencesStore()
      // Corrupt JSON is ignored, so the language default applies.
      expect(prefs.language).toBe('en')
    })
  })

  describe('getters', () => {
    it('currentLanguage exposes the value', () => {
      const prefs = usePreferencesStore()
      expect(prefs.currentLanguage).toBe('en')
    })

    it('isEnglish reflects the language choice', () => {
      const prefs = usePreferencesStore()
      expect(prefs.isEnglish).toBe(true)
      prefs.language = 'zh'
      expect(prefs.isEnglish).toBe(false)
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
    it('re-reads language from localStorage', () => {
      const prefs = usePreferencesStore()
      localStorage.setItem(
        PREFERENCES_STORAGE_KEY,
        JSON.stringify({ theme: 'light', language: 'zh' })
      )
      prefs.hydrate()
      expect(prefs.language).toBe('zh')
    })

    it('ignores invalid persisted values', () => {
      const prefs = usePreferencesStore()
      const beforeLanguage = prefs.language
      localStorage.setItem(
        PREFERENCES_STORAGE_KEY,
        JSON.stringify({ theme: 'hot-pink', language: 'fr' })
      )
      prefs.hydrate()
      // Invalid language is rejected, so the existing value is left untouched.
      expect(prefs.language).toBe(beforeLanguage)
    })
  })

  describe('reset', () => {
    it('restores defaults and persists them', () => {
      const prefs = usePreferencesStore()
      prefs.setLanguage('zh')
      prefs.reset()
      expect(prefs.language).toBe('en')
      const stored = JSON.parse(localStorage.getItem(PREFERENCES_STORAGE_KEY))
      expect(stored).toEqual({ language: 'en' })
    })
  })

  describe('persistence robustness', () => {
    it('persist does not throw when localStorage.setItem fails', () => {
      const prefs = usePreferencesStore()
      const original = localStorage.setItem
      localStorage.setItem = vi.fn(() => {
        throw new Error('quota exceeded')
      })
      expect(() => prefs.setLanguage('zh')).not.toThrow()
      expect(prefs.language).toBe('zh')
      localStorage.setItem = original
    })
  })
})
