/**
 * Theme Store
 * Pinia store for theme management
 * Migrated from useTheme.js composable with same functionality
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const THEME_KEY = 'ktech-theme'
const DEFAULT_THEME = 'dark'
const THEMES = ['dark', 'light']

export const useThemeStore = defineStore('theme', () => {
  // State
  const currentTheme = ref(DEFAULT_THEME)

  // Getters
  const themeDisplay = computed(() => {
    return currentTheme.value === 'dark' ? 'Dark' : 'Light'
  })

  const isDark = computed(() => {
    return currentTheme.value === 'dark'
  })

  const themes = computed(() => THEMES)

  // Actions
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

  function toggleTheme() {
    const newTheme = currentTheme.value === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
  }

  function applyTheme(theme) {
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.setAttribute('data-theme', theme)
    }
  }

  return {
    currentTheme,
    themeDisplay,
    isDark,
    themes,
    initTheme,
    setTheme,
    toggleTheme,
    applyTheme
  }
})
