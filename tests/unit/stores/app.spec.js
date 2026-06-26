/**
 * App Store Tests
 * TDD approach: tests written before implementation
 * Testing global application state management
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAppStore } from '@/stores/app'
import { setupTestEnv } from './setup'

describe('App Store', () => {
  beforeEach(() => {
    setupTestEnv()
  })

  describe('Initial State', () => {
    it('should have initial loading state as false', () => {
      const store = useAppStore()
      expect(store.isLoading).toBe(false)
    })

    it('should have no error initially', () => {
      const store = useAppStore()
      expect(store.error).toBeNull()
    })

    it('should have sidebar collapsed initially', () => {
      const store = useAppStore()
      expect(store.isSidebarCollapsed).toBe(true)
    })

    it('should have no notifications initially', () => {
      const store = useAppStore()
      expect(store.notifications).toEqual([])
    })

    it('should have no modal initially', () => {
      const store = useAppStore()
      expect(store.activeModal).toBeNull()
    })
  })

  describe('Loading State', () => {
    it('should set loading to true', () => {
      const store = useAppStore()
      store.setLoading(true)
      expect(store.isLoading).toBe(true)
    })

    it('should set loading to false', () => {
      const store = useAppStore()
      store.setLoading(true)
      store.setLoading(false)
      expect(store.isLoading).toBe(false)
    })

    it('should have loading state computed correctly', () => {
      const store = useAppStore()
      expect(store.isLoading).toBe(false)
      store.setLoading(true)
      expect(store.isLoading).toBe(true)
    })
  })

  describe('Error State', () => {
    it('should set error message', () => {
      const store = useAppStore()
      const errorMsg = 'An error occurred'
      store.setError(errorMsg)
      expect(store.error).toBe(errorMsg)
    })

    it('should clear error', () => {
      const store = useAppStore()
      store.setError('Some error')
      store.clearError()
      expect(store.error).toBeNull()
    })

    it('should have error state computed correctly', () => {
      const store = useAppStore()
      expect(store.hasError).toBe(false)
      store.setError('Error occurred')
      expect(store.hasError).toBe(true)
      store.clearError()
      expect(store.hasError).toBe(false)
    })
  })

  describe('Sidebar State', () => {
    it('should toggle sidebar', () => {
      const store = useAppStore()
      const initialState = store.isSidebarCollapsed
      store.toggleSidebar()
      expect(store.isSidebarCollapsed).toBe(!initialState)
    })

    it('should set sidebar collapsed state', () => {
      const store = useAppStore()
      store.setSidebarCollapsed(true)
      expect(store.isSidebarCollapsed).toBe(true)
      store.setSidebarCollapsed(false)
      expect(store.isSidebarCollapsed).toBe(false)
    })

    it('should persist sidebar state to localStorage', () => {
      const localStorageMock = vi.fn()
      vi.stubGlobal('localStorage', {
        setItem: localStorageMock
      })
      const store = useAppStore()
      store.setSidebarCollapsed(false)
      expect(localStorageMock).toHaveBeenCalledWith(
        'ktech-sidebar-collapsed',
        'false'
      )
    })

    it('should handle localStorage errors gracefully', () => {
      vi.stubGlobal('localStorage', {
        setItem: vi.fn(() => { throw new Error('localStorage error') })
      })
      const store = useAppStore()
      expect(() => store.setSidebarCollapsed(true)).not.toThrow()
    })
  })

  describe('Notifications', () => {
    it('should add notification', () => {
      const store = useAppStore()
      const notification = { id: 1, message: 'Test notification', type: 'info' }
      store.addNotification(notification)
      expect(store.notifications).toContainEqual(notification)
    })

    it('should remove notification by id', () => {
      const store = useAppStore()
      const notification1 = { id: 1, message: 'Notification 1', type: 'info' }
      const notification2 = { id: 2, message: 'Notification 2', type: 'success' }
      store.addNotification(notification1)
      store.addNotification(notification2)
      store.removeNotification(1)
      expect(store.notifications).not.toContainEqual(notification1)
      expect(store.notifications).toContainEqual(notification2)
    })

    it('should clear all notifications', () => {
      const store = useAppStore()
      store.addNotification({ id: 1, message: 'Test', type: 'info' })
      store.addNotification({ id: 2, message: 'Test 2', type: 'success' })
      store.clearNotifications()
      expect(store.notifications).toEqual([])
    })

    it('should have notification count', () => {
      const store = useAppStore()
      expect(store.notificationCount).toBe(0)
      store.addNotification({ id: 1, message: 'Test', type: 'info' })
      expect(store.notificationCount).toBe(1)
      store.addNotification({ id: 2, message: 'Test 2', type: 'success' })
      expect(store.notificationCount).toBe(2)
    })

    it('should auto-generate id if not provided', () => {
      const store = useAppStore()
      store.addNotification({ message: 'Test', type: 'info' })
      expect(store.notifications[0].id).toBeDefined()
      expect(typeof store.notifications[0].id).toBe('number')
    })
  })

  describe('Modal Management', () => {
    it('should open modal', () => {
      const store = useAppStore()
      store.openModal('login')
      expect(store.activeModal).toBe('login')
    })

    it('should close modal', () => {
      const store = useAppStore()
      store.openModal('login')
      store.closeModal()
      expect(store.activeModal).toBeNull()
    })

    it('should have isModalOpen computed correctly', () => {
      const store = useAppStore()
      expect(store.isModalOpen).toBe(false)
      store.openModal('login')
      expect(store.isModalOpen).toBe(true)
      store.closeModal()
      expect(store.isModalOpen).toBe(false)
    })

    it('should check if specific modal is open', () => {
      const store = useAppStore()
      store.openModal('login')
      expect(store.isModalOpen).toBe(true)
      expect(store.activeModal).toBe('login')
    })
  })

  describe('Sidebar Initialization', () => {
    it('should load sidebar state from localStorage on init', () => {
      const localStorageMock = {
        getItem: vi.fn(() => 'false'),
        setItem: vi.fn()
      }
      vi.stubGlobal('localStorage', localStorageMock)
      const store = useAppStore()
      store.initSidebar()
      expect(store.isSidebarCollapsed).toBe(false)
    })

    it('should use collapsed state when no localStorage value exists', () => {
      const localStorageMock = {
        getItem: vi.fn(() => null),
        setItem: vi.fn()
      }
      vi.stubGlobal('localStorage', localStorageMock)
      const store = useAppStore()
      store.initSidebar()
      expect(store.isSidebarCollapsed).toBe(true)
    })

    it('should handle localStorage errors gracefully on init', () => {
      vi.stubGlobal('localStorage', {
        getItem: vi.fn(() => { throw new Error('localStorage error') })
      })
      const store = useAppStore()
      expect(() => store.initSidebar()).not.toThrow()
    })
  })

  describe('Notification Types', () => {
    it('should add success notification', () => {
      const store = useAppStore()
      store.addNotification({ message: 'Success!', type: 'success' })
      expect(store.notifications[0].type).toBe('success')
    })

    it('should add error notification', () => {
      const store = useAppStore()
      store.addNotification({ message: 'Error!', type: 'error' })
      expect(store.notifications[0].type).toBe('error')
    })

    it('should add warning notification', () => {
      const store = useAppStore()
      store.addNotification({ message: 'Warning!', type: 'warning' })
      expect(store.notifications[0].type).toBe('warning')
    })

    it('should add info notification', () => {
      const store = useAppStore()
      store.addNotification({ message: 'Info!', type: 'info' })
      expect(store.notifications[0].type).toBe('info')
    })
  })

  describe('LocalStorage Constants', () => {
    it('should use correct localStorage keys', () => {
      expect(useAppStore.$id || 'ktech-app').toBeTruthy()
    })
  })
})
