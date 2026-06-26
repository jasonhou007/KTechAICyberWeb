/**
 * Theme management composable
 * Following the pattern of useLanguage.js
 * Provides theme state management, persistence, and system preference detection
 */
import { ref, computed, onMounted } from 'vue'

const THEME_KEY = 'ktech-theme'
const DEFAULT_THEME = 'dark'
const THEMES = ['dark', 'light']

const currentTheme = ref(DEFAULT_THEME)

export function useTheme() {
  // Initialize theme from localStorage or system preference
  function initTheme() {
    try {
      const saved = localStorage.getItem(THEME_KEY)
      if (saved && THEMES.includes(saved)) {
        currentTheme.value = saved
      } else {
        // Detect system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        currentTheme.value = prefersDark ? 'dark' : 'light'
      }
      applyTheme(currentTheme.value)
    } catch (error) {
      // Handle localStorage errors gracefully
      console.error('Error initializing theme:', error)
      currentTheme.value = DEFAULT_THEME
      applyTheme(DEFAULT_THEME)
    }
  }

  // Set theme and persist
  function setTheme(theme) {
    if (THEMES.includes(theme)) {
      currentTheme.value = theme
      try {
        localStorage.setItem(THEME_KEY, theme)
      } catch (error) {
        console.error('Error saving theme to localStorage:', error)
      }
      applyTheme(theme)
    }
  }

  // Toggle between themes
  function toggleTheme() {
    const newTheme = currentTheme.value === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
  }

  // Apply theme to document
  function applyTheme(theme) {
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.setAttribute('data-theme', theme)
    }
  }

  // Current theme display
  const themeDisplay = computed(() => {
    return currentTheme.value === 'dark' ? 'Dark' : 'Light'
  })

  // Check if current theme is dark
  const isDark = computed(() => {
    return currentTheme.value === 'dark'
  })

  return {
    currentTheme,
    themeDisplay,
    isDark,
    initTheme,
    setTheme,
    toggleTheme
  }
}
