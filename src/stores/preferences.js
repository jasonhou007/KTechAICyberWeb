import { defineStore } from 'pinia'

/**
 * LocalStorage keys. Namespaced under `ktech-` to match the existing
 * `ktech-language` key used by src/composables/useLanguage.js.
 */
const STORAGE_KEY = 'ktech-preferences'
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
 * User-level preferences that MUST persist across sessions: language. State
 * hydrates from localStorage on first access and re-persists on every
 * mutation, satisfying issue #22's persistence + hydration acceptance
 * criteria. UI-only (non-persisted) state belongs in useUIStore.
 *
 * State, getters, and actions are kept clearly separated per issue #22.
 *
 * NOTE (#248): the theme surface that previously lived here (state.theme,
 * setTheme/toggleTheme, detectSystemTheme, currentTheme/isDarkTheme,
 * VALID_THEMES) was removed. The site is locked to the dark theme by
 * App.vue's unconditional <html data-theme="dark"> (see #239), so no shipped
 * code reads a theme from this store. Stale `theme` values in existing users'
 * localStorage are tolerated by loadPersisted() (which returns the whole
 * parsed object) and dropped on the next setLanguage/reset, when persist()
 * rewrites the blob without the `theme` key.
 *
 * @see https://pinia.vuejs.org/
 */
export const usePreferencesStore = defineStore('preferences', {
  state: () => {
    const persisted = loadPersisted()
    return {
      // UI language code. Defaults to 'en'. Mirrors useLanguage.js default.
      language: persisted.language || 'en'
    }
  },

  getters: {
    /** Currently selected language code. */
    currentLanguage: (state) => state.language,
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
          JSON.stringify({
            language: this.language,
          })
        )
      } catch {
        // Storage may be unavailable (private mode, quota). Fail silently —
        // preferences simply won't persist this session.
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
      if (persisted.language && VALID_LANGUAGES.includes(persisted.language)) {
        this.language = persisted.language
      }
    },
    /** Reset preferences to defaults and re-persist. */
    reset() {
      this.language = 'en'
      this.persist()
    }
  }
})

/** Exported for unit tests so they can clear storage by key. */
export const PREFERENCES_STORAGE_KEY = STORAGE_KEY
export const VALID_PREFERENCE_LANGUAGES = VALID_LANGUAGES
