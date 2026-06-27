import { ref, computed } from 'vue'

const LANGUAGE_KEY = 'ktech-language'
const DEFAULT_LANGUAGE = 'en'

// Translation cache
const translations = ref({})
const currentLanguage = ref(DEFAULT_LANGUAGE)

// Load translations from JSON files
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

// Get nested value from object using dot notation
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current?.[key]
  }, obj)
}

// Initialize language from localStorage or default.
// Exported at module scope so it can be called directly (e.g. App.vue onMounted)
// without first invoking useLanguage().
export function initLanguage() {
  const saved = localStorage.getItem(LANGUAGE_KEY)
  if (saved && (saved === 'en' || saved === 'zh')) {
    currentLanguage.value = saved
  } else {
    currentLanguage.value = DEFAULT_LANGUAGE
  }
  loadTranslations(currentLanguage.value)
}

export function useLanguage() {
  // Set language and persist
  function setLanguage(lang) {
    if (lang === 'en' || lang === 'zh') {
      currentLanguage.value = lang
      localStorage.setItem(LANGUAGE_KEY, lang)
      loadTranslations(lang)
    }
  }

  // Toggle between languages
  function toggleLanguage() {
    const newLang = currentLanguage.value === 'en' ? 'zh' : 'en'
    setLanguage(newLang)
  }

  // Get translation by key
  function t(key) {
    const langTranslations = translations.value[currentLanguage.value] || {}
    const value = getNestedValue(langTranslations, key)
    return value || key
  }

  // Current language display
  const languageDisplay = computed(() => {
    return currentLanguage.value === 'en' ? 'EN' : '中文'
  })

  // Check if current language is English
  const isEnglish = computed(() => {
    return currentLanguage.value === 'en'
  })

  return {
    currentLanguage,
    languageDisplay,
    isEnglish,
    initLanguage,
    setLanguage,
    toggleLanguage,
    t
  }
}
