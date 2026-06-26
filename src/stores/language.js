/**
 * Language Store
 * Pinia store for language management
 * Migrated from useLanguage.js composable with same functionality
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const LANGUAGE_KEY = 'ktech-language'
const DEFAULT_LANGUAGE = 'en'
const LANGUAGES = ['en', 'zh']

export const useLanguageStore = defineStore('language', () => {
  // State
  const translations = ref({})
  const currentLanguage = ref(DEFAULT_LANGUAGE)

  // Getters
  const languageDisplay = computed(() => {
    return currentLanguage.value === 'en' ? 'EN' : '中文'
  })

  const isEnglish = computed(() => {
    return currentLanguage.value === 'en'
  })

  const languages = computed(() => LANGUAGES)

  // Actions
  async function loadTranslations(lang) {
    if (translations.value[lang]) {
      return translations.value[lang]
    }

    try {
      const response = await fetch(`/src/locales/${lang}.json`)
      const data = await response.json()
      translations.value[lang] = data
      return data
    } catch (error) {
      console.error(`Failed to load translations for ${lang}:`, error)
      return {}
    }
  }

  function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current?.[key]
    }, obj)
  }

  function initLanguage() {
    try {
      const saved = localStorage.getItem(LANGUAGE_KEY)
      if (saved && LANGUAGES.includes(saved)) {
        currentLanguage.value = saved
      } else {
        currentLanguage.value = DEFAULT_LANGUAGE
      }
      loadTranslations(currentLanguage.value)
    } catch (error) {
      console.error('Error initializing language:', error)
      currentLanguage.value = DEFAULT_LANGUAGE
    }
  }

  function setLanguage(lang) {
    if (LANGUAGES.includes(lang)) {
      currentLanguage.value = lang
      try {
        localStorage.setItem(LANGUAGE_KEY, lang)
      } catch (error) {
        console.error('Error saving language to localStorage:', error)
      }
      loadTranslations(lang)
    }
  }

  function toggleLanguage() {
    const newLang = currentLanguage.value === 'en' ? 'zh' : 'en'
    setLanguage(newLang)
  }

  function t(key) {
    const langTranslations = translations.value[currentLanguage.value] || {}
    const value = getNestedValue(langTranslations, key)
    return value || key
  }

  return {
    translations,
    currentLanguage,
    languageDisplay,
    isEnglish,
    languages,
    initLanguage,
    setLanguage,
    toggleLanguage,
    loadTranslations,
    t,
    getNestedValue
  }
})
