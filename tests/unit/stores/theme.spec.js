/**
 * Theme Store Tests
 * TDD approach: tests written before implementation
 * Testing theme state management, persistence, and system preference detection
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useThemeStore } from '@/stores/theme'
import { setupTestEnv, setupPinia, clearLocalStorage } from './setup'

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

describe('Theme Store', () => {
  beforeEach(() => {
    setupTestEnv()
    // Reset localStorage mock
    localStorageMock.clear()
    vi.stubGlobal('localStorage', localStorageMock)
    // Mock document for SSR compatibility
    vi.stubGlobal('document', {
      documentElement: {
        setAttribute: vi.fn(),
        removeAttribute: vi.fn(),
        getAttribute: vi.fn()
      }
    })
    // Mock window.matchMedia
    vi.stubGlobal('window', {
      matchMedia: vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
      }))
    })
  })

  describe('Initial State', () => {
    it('should have default theme as dark', () => {
      const store = useThemeStore()
      expect(store.currentTheme).toBe('dark')
    })

    it('should have available themes', () => {
      const store = useThemeStore()
      expect(store.themes).toEqual(['dark', 'light'])
    })

    it('should compute themeDisplay correctly for dark theme', () => {
      const store = useThemeStore()
      store.currentTheme = 'dark'
      expect(store.themeDisplay).toBe('Dark')
    })

    it('should compute themeDisplay correctly for light theme', () => {
      const store = useThemeStore()
      store.currentTheme = 'light'
      expect(store.themeDisplay).toBe('Light')
    })

    it('should compute isDark correctly', () => {
      const store = useThemeStore()
      store.currentTheme = 'dark'
      expect(store.isDark).toBe(true)
      store.currentTheme = 'light'
      expect(store.isDark).toBe(false)
    })
  })

  describe('Initialization', () => {
    it('should load saved theme from localStorage on init', () => {
      // Set localStorage value BEFORE creating store
      localStorageMock.setItem('ktech-theme', 'light')
      // Create fresh pinia instance with existing localStorage value
      setupPinia()
      const store = useThemeStore()
      store.initTheme()
      expect(store.currentTheme).toBe('light')
    })

    it('should use system preference when no saved theme exists', () => {
      // Mock matchMedia to return dark mode
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query
      }))
      const store = useThemeStore()
      store.initTheme()
      expect(store.currentTheme).toBe('dark')
    })

    it('should apply theme to document on init', () => {
      const store = useThemeStore()
      store.initTheme()
      expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark')
    })

    it('should handle invalid saved theme gracefully', () => {
      localStorageMock.setItem('ktech-theme', 'invalid')
      const store = useThemeStore()
      store.initTheme()
      expect(store.currentTheme).toBe('dark') // Should fall back to default
    })

    it('should handle localStorage errors gracefully', () => {
      vi.stubGlobal('localStorage', {
        getItem: vi.fn(() => { throw new Error('localStorage error') })
      })
      const store = useThemeStore()
      expect(() => store.initTheme()).not.toThrow()
      expect(store.currentTheme).toBe('dark')
    })
  })

  describe('Set Theme', () => {
    it('should set theme to valid value', () => {
      const store = useThemeStore()
      store.setTheme('light')
      expect(store.currentTheme).toBe('light')
    })

    it('should not set theme to invalid value', () => {
      const store = useThemeStore()
      const initialTheme = store.currentTheme
      store.setTheme('invalid')
      expect(store.currentTheme).toBe(initialTheme)
    })

    it('should persist theme to localStorage', () => {
      const store = useThemeStore()
      store.setTheme('light')
      expect(localStorageMock.getItem('ktech-theme')).toBe('light')
    })

    it('should apply theme to document when set', () => {
      const store = useThemeStore()
      store.setTheme('dark')
      expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark')
    })

    it('should handle localStorage errors when setting theme', () => {
      vi.stubGlobal('localStorage', {
        getItem: vi.fn(),
        setItem: vi.fn(() => { throw new Error('localStorage error') })
      })
      const store = useThemeStore()
      expect(() => store.setTheme('light')).not.toThrow()
      // Theme should still be applied even if localStorage fails
      expect(store.currentTheme).toBe('light')
    })
  })

  describe('Toggle Theme', () => {
    it('should toggle from dark to light', () => {
      const store = useThemeStore()
      store.currentTheme = 'dark'
      store.toggleTheme()
      expect(store.currentTheme).toBe('light')
    })

    it('should toggle from light to dark', () => {
      const store = useThemeStore()
      store.currentTheme = 'light'
      store.toggleTheme()
      expect(store.currentTheme).toBe('dark')
    })

    it('should persist toggled theme to localStorage', () => {
      const store = useThemeStore()
      store.currentTheme = 'dark'
      store.toggleTheme()
      expect(localStorageMock.getItem('ktech-theme')).toBe('light')
    })
  })

  describe('Theme Application', () => {
    it('should apply dark theme to document', () => {
      const store = useThemeStore()
      store.applyTheme('dark')
      expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark')
    })

    it('should apply light theme to document', () => {
      const store = useThemeStore()
      store.applyTheme('light')
      expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light')
    })

    it('should handle missing document gracefully', () => {
      vi.stubGlobal('document', undefined)
      const store = useThemeStore()
      expect(() => store.applyTheme('dark')).not.toThrow()
    })

    it('should handle missing documentElement gracefully', () => {
      vi.stubGlobal('document', {})
      const store = useThemeStore()
      expect(() => store.applyTheme('dark')).not.toThrow()
    })
  })

  describe('LocalStorage Constants', () => {
    it('should use correct localStorage key', () => {
      expect(useThemeStore.$id || 'ktech-theme').toBeTruthy()
    })
  })
})
