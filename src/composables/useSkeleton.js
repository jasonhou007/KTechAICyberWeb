import { ref, onMounted, onUnmounted } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'

/**
 * Composable for managing skeleton loading states with intersection observer
 * @param {Object} options - Configuration options
 * @param {boolean} options.immediate - Whether to load immediately (above-fold content)
 * @param {number} options.threshold - Intersection threshold (0-1)
 * @returns {Object} Skeleton state and loading control methods
 */
export function useSkeleton(options = {}) {
  const {
    immediate = false,
    threshold = 0.1
  } = options

  const isLoading = ref(!immediate)
  const isVisible = ref(immediate)
  const target = ref(null)
  const hasLoaded = ref(false)

  let stopObserver = null

  onMounted(() => {
    if (immediate) {
      // Simulate loading for above-fold content
      setTimeout(() => {
        isLoading.value = false
        hasLoaded.value = true
      }, 800)
    } else if (target.value) {
      // Use intersection observer for below-fold content
      stopObserver = useIntersectionObserver(
        target,
        ([{ isIntersecting }]) => {
          if (isIntersecting && !hasLoaded.value) {
            isVisible.value = true
            // Simulate data fetching
            setTimeout(() => {
              isLoading.value = false
              hasLoaded.value = true
            }, 600)
          }
        },
        { threshold }
      )
    }
  })

  onUnmounted(() => {
    if (stopObserver) {
      stopObserver()
    }
  })

  return {
    isLoading,
    isVisible,
    target,
    hasLoaded
  }
}

/**
 * Composable for managing the initial loading screen with progress
 * @returns {Object} Loading state and progress control
 */
export function useInitialLoading() {
  const isLoading = ref(true)
  const progress = ref(0)
  const isComplete = ref(false)

  const startLoading = () => {
    const duration = 2000 // 2 seconds total loading time
    const interval = 20 // Update every 20ms
    const increment = 100 / (duration / interval)

    const timer = setInterval(() => {
      progress.value += increment

      if (progress.value >= 100) {
        progress.value = 100
        clearInterval(timer)

        // Wait for fade out animation
        setTimeout(() => {
          isLoading.value = false
          isComplete.value = true
        }, 600)
      }
    }, interval)

    return () => clearInterval(timer)
  }

  return {
    isLoading,
    progress,
    isComplete,
    startLoading
  }
}
