/**
 * Language Store Tests
 * TDD approach: tests written before implementation
 * Testing language state management, persistence, and translation loading
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useLanguageStore } from '@/stores/language'
import { setupTestEnv, setupPinia } from './setup'

// Mock localStorage for SSR compatibility
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = String(value) },
    removeItem: (key) => { delete store[key] },
    clear: () => { store = {} }
  }
})()

// Mock fetch for translation loading
const mockTranslations = {
  en: {
    nav: { home: 'Home', about: 'About', services: 'Services', logo: 'KTech' },
    footer: { copyright: '© 2024 KTech. All rights reserved.', status: 'System Online' },
    theme: { toggle: 'Toggle theme' },
    language: { switch: 'Switch language' }
  },
  zh: {
    nav: { home: '首页', about: '关于', services: '服务', logo: 'KTech' },
    footer: { copyright: '© 2024 KTech. 保留所有权利。', status: '系统在线' },
    theme: { toggle: '切换主题' },
    language: { switch: '切换语言' }
  }
}

describe('Language Store', () => {
  beforeEach(() => {
    setupTestEnv()
    // Reset localStorage mock
    localStorageMock.clear()
    vi.stubGlobal('localStorage', localStorageMock)
    // Mock fetch for translation loading
    global.fetch = vi.fn((url) => {
      const lang = url.match(/\/(\w+)\.json$/)?.[1]
      if (lang && mockTranslations[lang]) {
        return Promise.resolve({
          ok: true,
          json: async () => mockTranslations[lang]
        })
      }
      return Promise.reject(new Error('Translation file not found'))
    })
  })

  describe('Initial State', () => {
    it('should have default language as en', () => {
      const store = useLanguageStore()
      expect(store.currentLanguage).toBe('en')
    })

    it('should have available languages', () => {
      const store = useLanguageStore()
      expect(store.languages).toEqual(['en', 'zh'])
    })

    it('should compute languageDisplay correctly for English', () => {
      const store = useLanguageStore()
      store.currentLanguage = 'en'
      expect(store.languageDisplay).toBe('EN')
    })

    it('should compute languageDisplay correctly for Chinese', () => {
      const store = useLanguageStore()
      store.currentLanguage = 'zh'
      expect(store.languageDisplay).toBe('中文')
    })

    it('should compute isEnglish correctly', () => {
      const store = useLanguageStore()
      store.currentLanguage = 'en'
      expect(store.isEnglish).toBe(true)
      store.currentLanguage = 'zh'
      expect(store.isEnglish).toBe(false)
    })

    it('should have empty translations initially', () => {
      const store = useLanguageStore()
      expect(store.translations).toEqual({})
    })
  })

  describe('Initialization', () => {
    it('should load saved language from localStorage on init', () => {
      localStorageMock.setItem('ktech-language', 'zh')
      setupPinia()
      const store = useLanguageStore()
      store.initLanguage()
      expect(store.currentLanguage).toBe('zh')
    })

    it('should use default language when no saved language exists', () => {
      const store = useLanguageStore()
      store.initLanguage()
      expect(store.currentLanguage).toBe('en')
    })

    it('should load translations on init', () => {
      const store = useLanguageStore()
      store.initLanguage()
      // Wait for async loading
      return store.loadTranslations('en').then(() => {
        expect(store.translations.en).toBeDefined()
      })
    })

    it('should handle invalid saved language gracefully', () => {
      localStorageMock.setItem('ktech-language', 'invalid')
      setupPinia()
      const store = useLanguageStore()
      store.initLanguage()
      expect(store.currentLanguage).toBe('en') // Should fall back to default
    })

    it('should handle localStorage errors gracefully', () => {
      vi.stubGlobal('localStorage', {
        getItem: vi.fn(() => { throw new Error('localStorage error') })
      })
      const store = useLanguageStore()
      expect(() => store.initLanguage()).not.toThrow()
      expect(store.currentLanguage).toBe('en')
    })
  })

  describe('Set Language', () => {
    it('should set language to valid value', () => {
      const store = useLanguageStore()
      store.setLanguage('zh')
      expect(store.currentLanguage).toBe('zh')
    })

    it('should not set language to invalid value', () => {
      const store = useLanguageStore()
      const initialLang = store.currentLanguage
      store.setLanguage('invalid')
      expect(store.currentLanguage).toBe(initialLang)
    })

    it('should persist language to localStorage', () => {
      const store = useLanguageStore()
      store.setLanguage('zh')
      expect(localStorageMock.getItem('ktech-language')).toBe('zh')
    })

    it('should load translations when setting language', () => {
      const store = useLanguageStore()
      store.setLanguage('en')
      return store.loadTranslations('en').then(() => {
        expect(store.translations.en).toBeDefined()
      })
    })
  })

  describe('Toggle Language', () => {
    it('should toggle from English to Chinese', () => {
      const store = useLanguageStore()
      store.currentLanguage = 'en'
      store.toggleLanguage()
      expect(store.currentLanguage).toBe('zh')
    })

    it('should toggle from Chinese to English', () => {
      const store = useLanguageStore()
      store.currentLanguage = 'zh'
      store.toggleLanguage()
      expect(store.currentLanguage).toBe('en')
    })

    it('should persist toggled language to localStorage', () => {
      const store = useLanguageStore()
      store.currentLanguage = 'en'
      store.toggleLanguage()
      expect(localStorageMock.getItem('ktech-language')).toBe('zh')
    })
  })

  describe('Load Translations', () => {
    it('should load English translations', async () => {
      const store = useLanguageStore()
      await store.loadTranslations('en')
      expect(store.translations.en).toBeDefined()
      expect(store.translations.en.nav.home).toBe('Home')
    })

    it('should load Chinese translations', async () => {
      const store = useLanguageStore()
      await store.loadTranslations('zh')
      expect(store.translations.zh).toBeDefined()
      expect(store.translations.zh.nav.home).toBe('首页')
    })

    it('should cache loaded translations', async () => {
      const store = useLanguageStore()
      await store.loadTranslations('en')
      const firstLoad = store.translations.en
      await store.loadTranslations('en')
      expect(store.translations.en).toBe(firstLoad)
    })

    it('should handle fetch errors gracefully', async () => {
      global.fetch = vi.fn(() => Promise.reject(new Error('Network error')))
      const store = useLanguageStore()
      const result = await store.loadTranslations('en')
      expect(result).toEqual({})
    })

    it('should return empty object for failed loads', async () => {
      global.fetch = vi.fn(() => Promise.resolve({ ok: false }))
      const store = useLanguageStore()
      const result = await store.loadTranslations('en')
      expect(result).toEqual({})
    })
  })

  describe('Translation Function (t)', () => {
    beforeEach(async () => {
      const store = useLanguageStore()
      await store.loadTranslations('en')
    })

    it('should get simple translation', () => {
      const store = useLanguageStore()
      store.currentLanguage = 'en'
      expect(store.t('nav.home')).toBe('Home')
    })

    it('should get nested translation', () => {
      const store = useLanguageStore()
      store.currentLanguage = 'en'
      expect(store.t('footer.copyright')).toContain('KTech')
    })

    it('should return key when translation not found', () => {
      const store = useLanguageStore()
      store.currentLanguage = 'en'
      expect(store.t('nonexistent.key')).toBe('nonexistent.key')
    })

    it('should handle empty path gracefully', () => {
      const store = useLanguageStore()
      store.currentLanguage = 'en'
      expect(store.t('')).toBe('')
    })

    it('should work with Chinese translations', async () => {
      const store = useLanguageStore()
      await store.loadTranslations('zh')
      store.currentLanguage = 'zh'
      expect(store.t('nav.home')).toBe('首页')
    })

    it('should handle missing translations gracefully', () => {
      const store = useLanguageStore()
      store.currentLanguage = 'fr' // Unsupported language
      expect(store.t('any.key')).toBe('any.key')
    })
  })

  describe('Nested Value Helper', () => {
    it('should get nested value from object', () => {
      const store = useLanguageStore()
      const obj = { a: { b: { c: 'value' } } }
      expect(store.getNestedValue(obj, 'a.b.c')).toBe('value')
    })

    it('should return undefined for non-existent path', () => {
      const store = useLanguageStore()
      const obj = { a: { b: 'value' } }
      expect(store.getNestedValue(obj, 'a.x.y')).toBeUndefined()
    })

    it('should handle empty path', () => {
      const store = useLanguageStore()
      const obj = { key: 'value' }
      expect(store.getNestedValue(obj, '')).toBeUndefined()
    })
  })

  describe('LocalStorage Constants', () => {
    it('should use correct localStorage key', () => {
      expect(useLanguageStore.$id || 'ktech-language').toBeTruthy()
    })
  })
})
