import { defineStore } from 'pinia'

/**
 * LocalStorage keys. Namespaced under `ktech-` to match the existing
 * `ktech-language` key used by src/composables/useLanguage.js.
 */
const STORAGE_KEY = 'ktech-preferences'
const VALID_THEMES = ['cyber', 'light', 'dark']
const VALID_LANGUAGES = ['en', 'zh']

/**
 * Read persisted preferences from localStorage. Returns {} when storage is
 * empty or unreadable (e.g. disabled / corrupted JSON) so callers can safely
 * merge with defaults.
 */
function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

/**
 * usePreferencesStore
 *
 * User-level preferences that MUST persist across sessions: theme and
 * language. State hydrates from localStorage on first access and re-persists
 * on every mutation, satisfying issue #22's persistence + hydration
 * acceptance criteria. UI-only (non-persisted) state belongs in useUIStore.
 *
 * State, getters, and actions are kept clearly separated per issue #22.
 *
 * @see https://pinia.vuejs.org/
 */
export const usePreferencesStore = defineStore('preferences', {
  state: () => {
    const persisted = loadPersisted()
    return {
      // Visual theme. Defaults to 'cyber' (the cyberpunk theme).
      theme: persisted.theme || 'cyber',
      // UI language code. Defaults to 'en'. Mirrors useLanguage.js default.
      language: persisted.language || 'en'
    }
  },

  getters: {
    /** Currently selected theme name. */
    currentTheme: (state) => state.theme,
    /** Currently selected language code. */
    currentLanguage: (state) => state.language,
    /** True when the user has explicitly chosen the dark theme. */
    isDarkTheme: (state) => state.theme === 'dark',
    /** True when the user has explicitly chosen English. */
    isEnglish: (state) => state.language === 'en'
  },

  actions: {
    /**
     * Persist the current state to localStorage. Called after every mutation
     * so preferences always survive a page reload.
     */
    persist() {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ theme: this.theme, language: this.language })
        )
      } catch {
        // Storage may be unavailable (private mode, quota). Fail silently —
        // preferences simply won't persist this session.
      }
    },
    /**
     * Set the active theme. Ignored if the theme is not in the allow-list.
     * @param {string} theme
     */
    setTheme(theme) {
      if (VALID_THEMES.includes(theme)) {
        this.theme = theme
        this.persist()
      }
    },
    /**
     * Set the active language. Ignored if the language is not in the allow-list.
     * @param {string} language
     */
    setLanguage(language) {
      if (VALID_LANGUAGES.includes(language)) {
        this.language = language
        this.persist()
      }
    },
    /**
     * Re-hydrate state from localStorage. Useful after clearing storage or
     * when the user logs out and back in within a long-lived session.
     */
    hydrate() {
      const persisted = loadPersisted()
      if (persisted.theme && VALID_THEMES.includes(persisted.theme)) {
        this.theme = persisted.theme
      }
      if (persisted.language && VALID_LANGUAGES.includes(persisted.language)) {
        this.language = persisted.language
      }
    },
    /** Reset preferences to defaults and re-persist. */
    reset() {
      this.theme = 'cyber'
      this.language = 'en'
      this.persist()
    }
  }
})

/** Exported for unit tests so they can clear storage by key. */
export const PREFERENCES_STORAGE_KEY = STORAGE_KEY
export const VALID_PREFERENCE_THEMES = VALID_THEMES
export const VALID_PREFERENCE_LANGUAGES = VALID_LANGUAGES
