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
 * Detect the OS color-scheme preference via prefers-color-scheme. Returns
 * 'dark' or 'light'; falls back to 'dark' (the cyberpunk default) when
 * matchMedia is unavailable (SSR / very old browsers). Used to seed the
 * initial theme on first load so the site honours the user's OS setting
 * before they explicitly choose a theme (issue #15 AC §3).
 */
function detectSystemTheme() {
  try {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
  } catch {
    // matchMedia may throw in restricted environments; fall through to default.
  }
  return 'dark'
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
    // When the user has explicitly chosen a theme, honour it. Otherwise seed
    // the initial theme from the OS prefers-color-scheme preference (issue
    // #15 AC §3: "System preference detection (prefers-color-scheme)"). The
    // chosen theme is dark-styled unless it is 'light', so a detected 'dark'
    // or 'light' preference maps cleanly onto the dark/light CSS variants.
    const theme = persisted.theme
      || detectSystemTheme()
    return {
      // Visual theme. Either an explicit saved value, the detected system
      // preference, or 'dark' (the cyberpunk default) as a final fallback.
      theme,
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
          JSON.stringify({
            theme: this.theme,
            language: this.language,
          })
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
     * Toggle between the dark and light themes. The default 'cyber' theme is
     * dark-styled, so it is treated as the dark side of the toggle. Any
     * non-'light' value maps to dark and toggles to 'light', and vice-versa.
     * The chosen theme is persisted and applied to the document so the
     * cyber.css `[data-theme]` rules take effect immediately.
     */
    toggleTheme() {
      const next = this.theme === 'light' ? 'dark' : 'light'
      this.setTheme(next)
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
