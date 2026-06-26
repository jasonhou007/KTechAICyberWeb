/**
 * Component Test Helpers
 * Helper functions for testing Vue components with Pinia stores
 */
import { createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { mount } from '@vue/test-utils'

/**
 * Creates a test app with Pinia and Router setup
 * @param {Object} options - Configuration options
 * @returns {Object} Test utilities
 */
export function createTestApp(options = {}) {
  const pinia = createPinia()

  const router = createRouter({
    history: createMemoryHistory(),
    routes: options.routes || [
      { path: '/', component: { template: '<div>Home</div>' } }
    ]
  })

  return {
    pinia,
    router
  }
}

/**
 * Mounts a component with Pinia and Router
 * @param {Component} component - Vue component to mount
 * @param {Object} options - Mount options
 * @returns {Object} Vue test utils wrapper
 */
export function mountWithApp(component, options = {}) {
  const { pinia, router } = createTestApp(options)

  return mount(component, {
    global: {
      plugins: [pinia, router],
      ...options.global
    },
    ...options
  })
}

/**
 * Creates a localized mock translation function
 * @param {Object} translations - Translation key-value pairs
 * @returns {Function} Translation function
 */
export function createMockTranslations(translations = {}) {
  return (key) => translations[key] || key
}

export { createPinia, createRouter, createMemoryHistory }
