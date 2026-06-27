import { defineStore } from 'pinia'

/**
 * useUIStore
 *
 * Centralized UI state for the KTech AI Cyber Web app: sidebar visibility,
 * the currently open modal, and the active visual theme. This state is
 * intentionally NOT persisted — UI state should reset on each page load so
 * users don't land on a page with a stale open sidebar/modal. User-level
 * preferences that should persist live in usePreferencesStore instead.
 *
 * State, getters, and actions are kept clearly separated per issue #22.
 *
 * @see https://pinia.vuejs.org/
 */
export const useUIStore = defineStore('ui', {
  state: () => ({
    // Whether the navigation sidebar (mobile drawer / desktop rail) is open.
    sidebarOpen: false,
    // Identifier of the modal currently open, or null when none is open.
    // Examples: 'contact', 'menu', 'search'.
    activeModal: null,
    // Visual theme. 'cyber' is the default cyberpunk theme.
    theme: 'cyber'
  }),

  getters: {
    /** True when any modal is currently open. */
    isModalOpen: (state) => state.activeModal !== null,
    /** True when the sidebar drawer is open. */
    isSidebarOpen: (state) => state.sidebarOpen,
    /** Currently active theme name. */
    currentTheme: (state) => state.theme
  },

  actions: {
    /** Open the sidebar drawer. */
    openSidebar() {
      this.sidebarOpen = true
    },
    /** Close the sidebar drawer. */
    closeSidebar() {
      this.sidebarOpen = false
    },
    /** Toggle the sidebar drawer between open and closed. */
    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen
    },
    /**
     * Open a modal by id. Opening a modal closes the sidebar so the two
     * overlays never compete for the viewport.
     * @param {string} modalId
     */
    openModal(modalId) {
      this.activeModal = modalId
      this.sidebarOpen = false
    },
    /** Close whatever modal is currently open. */
    closeModal() {
      this.activeModal = null
    },
    /**
     * Switch the active visual theme.
     * @param {string} theme
     */
    setTheme(theme) {
      if (typeof theme === 'string' && theme.length > 0) {
        this.theme = theme
      }
    },
    /** Reset all ephemeral UI state back to defaults. */
    resetUI() {
      this.sidebarOpen = false
      this.activeModal = null
      this.theme = 'cyber'
    }
  }
})
