/**
 * Unit tests for the Pinia UI store (issue #22).
 * Covers state, getters, and actions per the issue's testing acceptance
 * criteria. Uses a fresh pinia instance per test to avoid cross-test state
 * leaks (per #22 "No state leaks between components").
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useUIStore } from '../../src/stores/ui'

describe('useUIStore', () => {
  beforeEach(() => {
    // Each test gets an isolated pinia instance.
    setActivePinia(createPinia())
  })

  describe('initial state', () => {
    it('has sensible defaults', () => {
      const ui = useUIStore()
      expect(ui.sidebarOpen).toBe(false)
      expect(ui.activeModal).toBe(null)
      expect(ui.theme).toBe('cyber')
    })
  })

  describe('getters', () => {
    it('isSidebarOpen reflects sidebarOpen', () => {
      const ui = useUIStore()
      expect(ui.isSidebarOpen).toBe(false)
      ui.sidebarOpen = true
      expect(ui.isSidebarOpen).toBe(true)
    })

    it('isModalOpen is false when no modal is active', () => {
      const ui = useUIStore()
      expect(ui.isModalOpen).toBe(false)
    })

    it('isModalOpen is true when a modal is active', () => {
      const ui = useUIStore()
      ui.activeModal = 'contact'
      expect(ui.isModalOpen).toBe(true)
    })

    it('currentTheme exposes the active theme', () => {
      const ui = useUIStore()
      expect(ui.currentTheme).toBe('cyber')
      ui.theme = 'dark'
      expect(ui.currentTheme).toBe('dark')
    })
  })

  describe('sidebar actions', () => {
    it('openSidebar opens the sidebar', () => {
      const ui = useUIStore()
      ui.openSidebar()
      expect(ui.sidebarOpen).toBe(true)
    })

    it('closeSidebar closes the sidebar', () => {
      const ui = useUIStore()
      ui.openSidebar()
      ui.closeSidebar()
      expect(ui.sidebarOpen).toBe(false)
    })

    it('toggleSidebar flips the state', () => {
      const ui = useUIStore()
      expect(ui.sidebarOpen).toBe(false)
      ui.toggleSidebar()
      expect(ui.sidebarOpen).toBe(true)
      ui.toggleSidebar()
      expect(ui.sidebarOpen).toBe(false)
    })
  })

  describe('modal actions', () => {
    it('openModal sets the active modal id', () => {
      const ui = useUIStore()
      ui.openModal('menu')
      expect(ui.activeModal).toBe('menu')
      expect(ui.isModalOpen).toBe(true)
    })

    it('opening a modal closes the sidebar', () => {
      const ui = useUIStore()
      ui.openSidebar()
      ui.openModal('search')
      expect(ui.sidebarOpen).toBe(false)
      expect(ui.activeModal).toBe('search')
    })

    it('closeModal clears the active modal', () => {
      const ui = useUIStore()
      ui.openModal('contact')
      ui.closeModal()
      expect(ui.activeModal).toBe(null)
      expect(ui.isModalOpen).toBe(false)
    })
  })

  describe('theme action', () => {
    it('setTheme updates the theme', () => {
      const ui = useUIStore()
      ui.setTheme('dark')
      expect(ui.theme).toBe('dark')
    })

    it('setTheme ignores empty / non-string values', () => {
      const ui = useUIStore()
      ui.setTheme('')
      expect(ui.theme).toBe('cyber')
      ui.setTheme(null)
      expect(ui.theme).toBe('cyber')
    })
  })

  describe('resetUI', () => {
    it('restores all UI state to defaults', () => {
      const ui = useUIStore()
      ui.openSidebar()
      ui.openModal('contact')
      ui.setTheme('dark')
      ui.resetUI()
      expect(ui.sidebarOpen).toBe(false)
      expect(ui.activeModal).toBe(null)
      expect(ui.theme).toBe('cyber')
    })
  })

  describe('isolation', () => {
    it('does not leak state between store instances', () => {
      const a = useUIStore()
      a.openSidebar()
      a.openModal('contact')
      // New pinia → fresh store.
      setActivePinia(createPinia())
      const b = useUIStore()
      expect(b.sidebarOpen).toBe(false)
      expect(b.activeModal).toBe(null)
    })
  })
})
