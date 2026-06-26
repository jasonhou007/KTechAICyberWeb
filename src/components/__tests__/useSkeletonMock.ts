/**
 * @file useSkeletonMock.ts
 * @description Shared mock for useSkeleton composable used across component tests
 */

import { ref, vi } from 'vue'
import { vi as vitestVi } from 'vitest'

// Create shared refs at module level - these persist across all imports and mock calls
const sharedIsLoading = ref(false)
const sharedIsVisible = ref(true)
const sharedTarget = ref(null)
const sharedHasLoaded = ref(true)

// Mock useSkeleton function that returns the shared refs
export const useSkeletonMock = vitestVi.fn(() => {
  return {
    isLoading: sharedIsLoading,
    isVisible: sharedIsVisible,
    target: sharedTarget,
    hasLoaded: sharedHasLoaded
  }
})

// Export helper functions to control the mock state
export const setLoadingState = (isLoading: boolean) => {
  sharedIsLoading.value = isLoading
  sharedIsVisible.value = !isLoading
  sharedHasLoaded.value = !isLoading
}

export const resetLoadingState = () => {
  setLoadingState(false)
}

// Export the shared refs for direct access if needed
export const mockRefs = {
  isLoading: sharedIsLoading,
  isVisible: sharedIsVisible,
  target: sharedTarget,
  hasLoaded: sharedHasLoaded
}
