import { ref, computed } from 'vue'
import enLocale from '../locales/en.json'
import zhLocale from '../locales/zh.json'

const LANGUAGE_KEY = 'ktech-language'
const DEFAULT_LANGUAGE = 'en'

// Translations are bundled at build time via static imports, so they resolve in
// dev, preview, AND production regardless of the deploy base path.
// Previously these were fetch()'d from `/src/locales/<lang>.json` at runtime,
// which 404s in the production build (there is no `/src/` in `dist/`) and left
// the UI full of raw i18n keys like "home.title".
const translations = ref({
  en: enLocale,
  zh: zhLocale,
})
const currentLanguage = ref(DEFAULT_LANGUAGE)

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
}

export function useLanguage() {
  // Set language and persist
  function setLanguage(lang) {
    if (lang === 'en' || lang === 'zh') {
      currentLanguage.value = lang
      localStorage.setItem(LANGUAGE_KEY, lang)
    }
  }

  // Toggle between languages
  function toggleLanguage() {
    const newLang = currentLanguage.value === 'en' ? 'zh' : 'en'
    setLanguage(newLang)
  }

  // Get translation by key.
  //
  // #190 R3: optional `params` interpolates {name} placeholders in the resolved
  // string. The original signature was `t(key)` with no params argument, so
  // callers like t('theme.toggleWithState', { state }) passed {state} into a
  // parameter the function never read — the literal "{state}" placeholder
  // survived into the rendered aria-label (Lighthouse evidence). Six source
  // callers depend on this contract (ThemeToggle, LanguageSwitcher, NeuralCore,
  // NeonPulse, PacketRoute x3), so the fix is a general optional-params path.
  // Callers that don't pass params are unaffected.
  function t(key, params) {
    const langTranslations = translations.value[currentLanguage.value] || {}
    const value = getNestedValue(langTranslations, key)
    // Missing key -> return the key string itself as fallback (legacy contract).
    if (value === undefined || value === null) return key
    if (typeof value !== 'string') return value
    if (!params || typeof params !== 'object') return value
    let out = value
    for (const [name, val] of Object.entries(params)) {
      // Replace all occurrences of {name} with the param value. Bound once per
      // name; escaping the name guards against regex metacharacters in the key.
      out = out.split(`{${name}}`).join(String(val))
    }
    return out
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
