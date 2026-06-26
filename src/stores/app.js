/**
 * App Store
 * Pinia store for global application state
 * Manages loading states, errors, notifications, modals, and UI state
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const SIDEBAR_KEY = 'ktech-sidebar-collapsed'

export const useAppStore = defineStore('app', () => {
  // State
  const isLoading = ref(false)
  const error = ref(null)
  const isSidebarCollapsed = ref(true)
  const notifications = ref([])
  const activeModal = ref(null)

  // Getters
  const hasError = computed(() => error.value !== null)
  const isModalOpen = computed(() => activeModal.value !== null)
  const notificationCount = computed(() => notifications.value.length)

  // Actions
  function setLoading(loading) {
    isLoading.value = loading
  }

  function setError(errorMessage) {
    error.value = errorMessage
  }

  function clearError() {
    error.value = null
  }

  function toggleSidebar() {
    isSidebarCollapsed.value = !isSidebarCollapsed.value
    try {
      localStorage.setItem(SIDEBAR_KEY, String(isSidebarCollapsed.value))
    } catch (error) {
      console.error('Error saving sidebar state to localStorage:', error)
    }
  }

  function setSidebarCollapsed(collapsed) {
    isSidebarCollapsed.value = collapsed
    try {
      localStorage.setItem(SIDEBAR_KEY, String(collapsed))
    } catch (error) {
      console.error('Error saving sidebar state to localStorage:', error)
    }
  }

  function initSidebar() {
    try {
      const saved = localStorage.getItem(SIDEBAR_KEY)
      if (saved !== null) {
        isSidebarCollapsed.value = saved === 'true'
      }
    } catch (error) {
      console.error('Error initializing sidebar state:', error)
    }
  }

  function addNotification(notification) {
    const id = notification.id || Date.now()
    notifications.value.push({ ...notification, id })
  }

  function removeNotification(id) {
    notifications.value = notifications.value.filter(n => n.id !== id)
  }

  function clearNotifications() {
    notifications.value = []
  }

  function openModal(modalName) {
    activeModal.value = modalName
  }

  function closeModal() {
    activeModal.value = null
  }

  return {
    isLoading,
    error,
    isSidebarCollapsed,
    notifications,
    activeModal,
    hasError,
    isModalOpen,
    notificationCount,
    setLoading,
    setError,
    clearError,
    toggleSidebar,
    setSidebarCollapsed,
    initSidebar,
    addNotification,
    removeNotification,
    clearNotifications,
    openModal,
    closeModal
  }
})
