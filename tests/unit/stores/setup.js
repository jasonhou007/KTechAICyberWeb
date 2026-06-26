/**
 * Test utilities for Pinia store testing
 * Provides helper functions to create fresh pinia instances for testing
 */
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach } from 'vitest'

/**
 * Creates and sets a fresh pinia instance before each test
 * Call this in beforeEach() to ensure test isolation
 */
export function setupPinia() {
  const pinia = createPinia()
  setActivePinia(pinia)
  return pinia
}

/**
 * Clear localStorage before/after tests for state isolation
 */
export function clearLocalStorage() {
  if (typeof localStorage !== 'undefined' && localStorage.clear) {
    localStorage.clear()
  }
}

/**
 * Mock localStorage with spy functionality
 */
export function createLocalStorageMock() {
  let store = {}
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = String(value) },
    removeItem: (key) => { delete store[key] },
    clear: () => { store = {} },
    get length() { return Object.keys(store).length },
    key: (index) => Object.keys(store)[index] || null,
    _store: store
  }
}

/**
 * Setup test environment with fresh pinia and localStorage
 * Combines setupPinia() and clearLocalStorage()
 */
export function setupTestEnv() {
  setupPinia()
  clearLocalStorage()
}

export { beforeEach }
