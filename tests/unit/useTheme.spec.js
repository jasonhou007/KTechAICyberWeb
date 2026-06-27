/**
 * Unit tests for useTheme composable
 * Following TDD principles - tests written before implementation
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useTheme } from '../../src/composables/useTheme'

describe('useTheme', () => {
  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    clear: vi.fn()
  }

  // Mock window.matchMedia
  const matchMediaMock = vi.fn()

  // Mock document
  let documentElementMock

  beforeEach(() => {
    // Setup localStorage mock
    global.localStorage = localStorageMock
    localStorageMock.getItem.mockReturnValue(null)
    localStorageMock.clear.mockClear()

    // Setup matchMedia mock (default to dark mode)
    matchMediaMock.mockReturnValue({
      matches: true,
      media: '(prefers-color-scheme: dark)'
    })
    global.window = { matchMedia: matchMediaMock, ...global.window }

    // Setup document mock
    documentElementMock = {
      setAttribute: vi.fn(),
      getAttribute: vi.fn()
    }
    global.document = {
      documentElement: documentElementMock
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with default dark theme when no saved theme', () => {
      localStorageMock.getItem.mockReturnValue(null)
      const { currentTheme, initTheme } = useTheme()

      initTheme()

      expect(currentTheme.value).toBe('dark')
    })

    it('should read from localStorage on init when valid theme exists', () => {
      localStorageMock.getItem.mockReturnValue('light')
      const { currentTheme, initTheme } = useTheme()

      initTheme()

      expect(currentTheme.value).toBe('light')
      expect(localStorageMock.getItem).toHaveBeenCalledWith('ktech-theme')
    })

    it('should detect system preference when no saved theme (dark mode)', () => {
      localStorageMock.getItem.mockReturnValue(null)
      matchMediaMock.mockReturnValue({ matches: true, media: '(prefers-color-scheme: dark)' })

      const { currentTheme, initTheme } = useTheme()
      initTheme()

      expect(currentTheme.value).toBe('dark')
    })

    it('should detect system preference when no saved theme (light mode)', () => {
      localStorageMock.getItem.mockReturnValue(null)
      matchMediaMock.mockReturnValue({ matches: false, media: '(prefers-color-scheme: light)' })

      const { currentTheme, initTheme } = useTheme()
      initTheme()

      expect(currentTheme.value).toBe('light')
    })

    it('should apply theme to document on initialization', () => {
      const { initTheme } = useTheme()

      initTheme()

      expect(documentElementMock.setAttribute).toHaveBeenCalled()
      expect(documentElementMock.setAttribute).toHaveBeenCalledWith('data-theme', expect.any(String))
    })
  })

  describe('setTheme', () => {
    it('should set theme to dark when valid', () => {
      const { currentTheme, setTheme } = useTheme()

      setTheme('dark')

      expect(currentTheme.value).toBe('dark')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('ktech-theme', 'dark')
      expect(documentElementMock.setAttribute).toHaveBeenCalledWith('data-theme', 'dark')
    })

    it('should set theme to light when valid', () => {
      const { currentTheme, setTheme } = useTheme()

      setTheme('light')

      expect(currentTheme.value).toBe('light')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('ktech-theme', 'light')
      expect(documentElementMock.setAttribute).toHaveBeenCalledWith('data-theme', 'light')
    })

    it('should persist theme to localStorage', () => {
      const { setTheme } = useTheme()

      setTheme('light')

      expect(localStorageMock.setItem).toHaveBeenCalledWith('ktech-theme', 'light')
    })

    it('should reject invalid theme values', () => {
      const { currentTheme, setTheme } = useTheme()
      const initialTheme = currentTheme.value

      setTheme('invalid')

      expect(currentTheme.value).toBe(initialTheme)
      expect(localStorageMock.setItem).not.toHaveBeenCalledWith('ktech-theme', 'invalid')
    })

    it('should apply data-theme attribute to document', () => {
      const { setTheme } = useTheme()

      setTheme('dark')

      expect(documentElementMock.setAttribute).toHaveBeenCalledWith('data-theme', 'dark')
    })
  })

  describe('toggleTheme', () => {
    it('should toggle from dark to light', () => {
      const { currentTheme, toggleTheme, setTheme } = useTheme()

      // Start with dark
      setTheme('dark')
      expect(currentTheme.value).toBe('dark')

      // Toggle to light
      toggleTheme()
      expect(currentTheme.value).toBe('light')
    })

    it('should toggle from light to dark', () => {
      const { currentTheme, toggleTheme, setTheme } = useTheme()

      // Start with light
      setTheme('light')
      expect(currentTheme.value).toBe('light')

      // Toggle to dark
      toggleTheme()
      expect(currentTheme.value).toBe('dark')
    })

    it('should persist toggled theme to localStorage', () => {
      const { setTheme, toggleTheme } = useTheme()

      setTheme('dark')
      toggleTheme()

      expect(localStorageMock.setItem).toHaveBeenCalledWith('ktech-theme', 'light')
    })
  })

  describe('computed properties', () => {
    it('should return correct themeDisplay for dark theme', () => {
      const { themeDisplay, setTheme } = useTheme()

      setTheme('dark')

      expect(themeDisplay.value).toBe('Dark')
    })

    it('should return correct themeDisplay for light theme', () => {
      const { themeDisplay, setTheme } = useTheme()

      setTheme('light')

      expect(themeDisplay.value).toBe('Light')
    })

    it('should return true for isDark when theme is dark', () => {
      const { isDark, setTheme } = useTheme()

      setTheme('dark')

      expect(isDark.value).toBe(true)
    })

    it('should return false for isDark when theme is light', () => {
      const { isDark, setTheme } = useTheme()

      setTheme('light')

      expect(isDark.value).toBe(false)
    })
  })

  describe('error handling', () => {
    it('should handle corrupted localStorage gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage corrupted')
      })

      const { currentTheme, initTheme } = useTheme()

      // Should not throw and should default to dark
      expect(() => initTheme()).not.toThrow()
      expect(currentTheme.value).toBe('dark')
    })

    it('should handle localStorage quota exceeded', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })

      const { setTheme, currentTheme } = useTheme()

      // Should not throw, theme should still be set in memory
      expect(() => setTheme('light')).not.toThrow()
      expect(currentTheme.value).toBe('light')
    })
  })

  describe('theme constants', () => {
    it('should use correct localStorage key', () => {
      const { setTheme } = useTheme()

      setTheme('dark')

      expect(localStorageMock.setItem).toHaveBeenCalledWith('ktech-theme', 'dark')
    })

    it('should have correct default theme', () => {
      localStorageMock.getItem.mockReturnValue(null)
      const { currentTheme, initTheme } = useTheme()

      initTheme()

      expect(currentTheme.value).toBe('dark')
    })
  })
})
