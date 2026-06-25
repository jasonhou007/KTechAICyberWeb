import { ref, computed, watch } from 'vue'

// Language storage key
const LANG_STORAGE_KEY = 'ktech-language'
const DEFAULT_LANG = 'en'

// Reactive language state
const currentLang = ref(DEFAULT_LANG)

// Load translations dynamically
const translations = ref({})

// Available languages
export const availableLanguages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' }
]

// Initialize language from localStorage or browser preference
export function initLanguage() {
  const stored = localStorage.getItem(LANG_STORAGE_KEY)
  if (stored && availableLanguages.find(lang => lang.code === stored)) {
    currentLang.value = stored
  } else {
    // Try to detect from browser
    const browserLang = navigator.language.split('-')[0]
    currentLang.value = availableLanguages.find(lang => lang.code === browserLang)?.code || DEFAULT_LANG
  }
  return currentLang.value
}

// Load translation file for a language
async function loadTranslation(lang) {
  if (translations.value[lang]) {
    return translations.value[lang]
  }

  try {
    const module = await import(`../locales/${lang}.json`)
    translations.value[lang] = module.default
    return module.default
  } catch (error) {
    console.error(`Failed to load translations for ${lang}:`, error)
    return {}
  }
}

// Get current language
export function useLanguage() {
  const lang = computed(() => currentLang.value)

  // Set language and persist
  const setLanguage = async (newLang) => {
    if (!availableLanguages.find(l => l.code === newLang)) {
      console.warn(`Unsupported language: ${newLang}`)
      return
    }

    currentLang.value = newLang
    localStorage.setItem(LANG_STORAGE_KEY, newLang)

    // Load translations if not already loaded
    await loadTranslation(newLang)
  }

  // Get translation for a key (supports nested keys with dot notation)
  const t = (key) => {
    const keys = key.split('.')
    let value = translations.value[currentLang.value]

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k]
      } else {
        return key // Return key if translation not found
      }
    }

    return value || key
  }

  // Toggle between available languages
  const toggleLanguage = () => {
    const currentIndex = availableLanguages.findIndex(l => l.code === currentLang.value)
    const nextIndex = (currentIndex + 1) % availableLanguages.length
    return availableLanguages[nextIndex].code
  }

  // Check if translations are loaded
  const isLoaded = computed(() => !!translations.value[currentLang.value])

  // Load current language translations
  const loadCurrentTranslations = async () => {
    await loadTranslation(currentLang.value)
  }

  // Watch for language changes
  watch(currentLang, async (newLang) => {
    await loadTranslation(newLang)
  })

  return {
    lang,
    setLanguage,
    t,
    toggleLanguage,
    isLoaded,
    loadCurrentTranslations,
    availableLanguages
  }
}
