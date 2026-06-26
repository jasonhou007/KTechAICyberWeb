/**
 * User Store
 * Pinia store for user management
 * Basic structure for future authentication implementation
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const USER_KEY = 'ktech-user'

export const useUserStore = defineStore('user', () => {
  // State
  const user = ref(null)
  const roles = ref([])
  const permissions = ref([])

  // Getters
  const isAuthenticated = computed(() => {
    return user.value !== null
  })

  const userDisplayName = computed(() => {
    if (!user.value) return 'Guest'
    return user.value.name || user.value.email || 'Guest'
  })

  // Actions
  function login(userData, userRoles = ['guest'], userPermissions = []) {
    user.value = userData
    roles.value = userRoles
    permissions.value = userPermissions
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(userData))
    } catch (error) {
      console.error('Error saving user to localStorage:', error)
    }
  }

  function logout() {
    user.value = null
    roles.value = []
    permissions.value = []
    try {
      localStorage.removeItem(USER_KEY)
    } catch (error) {
      console.error('Error removing user from localStorage:', error)
    }
  }

  function updateUser(updates) {
    if (user.value) {
      user.value = { ...user.value, ...updates }
      try {
        localStorage.setItem(USER_KEY, JSON.stringify(user.value))
      } catch (error) {
        console.error('Error updating user in localStorage:', error)
      }
    }
  }

  function hasRole(role) {
    return isAuthenticated.value && roles.value.includes(role)
  }

  function hasPermission(permission) {
    return isAuthenticated.value && permissions.value.includes(permission)
  }

  function initUser() {
    try {
      const saved = localStorage.getItem(USER_KEY)
      if (saved) {
        user.value = JSON.parse(saved)
      }
    } catch (error) {
      console.error('Error initializing user:', error)
    }
  }

  return {
    user,
    roles,
    permissions,
    isAuthenticated,
    userDisplayName,
    login,
    logout,
    updateUser,
    hasRole,
    hasPermission,
    initUser
  }
})
