/**
 * Intersection Observer composable for lazy loading
 * Provides performant lazy loading for images and components
 * Following the pattern of useTheme.js and useLanguage.js
 */
import { ref, onMounted, onUnmounted } from 'vue'

export function useIntersectionObserver(options = {}) {
  const isVisible = ref(false)
  const target = ref(null)
  let observer = null

  const defaultOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1,
    ...options
  }

  const onIntersect = (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        isVisible.value = true
        // Unobserve after first intersection for lazy loading
        if (observer && target.value) {
          observer.unobserve(target.value)
        }
      }
    })
  }

  const observe = (element) => {
    if (!element) return

    target.value = element

    // Check if IntersectionObserver is supported
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      isVisible.value = true
      return
    }

    observer = new IntersectionObserver(onIntersect, defaultOptions)
    observer.observe(element)
  }

  const unobserve = () => {
    if (observer && target.value) {
      observer.unobserve(target.value)
      observer.disconnect()
      observer = null
    }
  }

  // Cleanup on unmount
  onUnmounted(() => {
    unobserve()
  })

  return {
    isVisible,
    observe,
    unobserve
  }
}

/**
 * Hook for lazy loading multiple items
 * Useful for grids of cards or images
 */
export function useIntersectionObserverList(options = {}) {
  const visibleItems = ref(new Set())
  const observers = new Map()

  const defaultOptions = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  }

  const onIntersect = (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const index = parseInt(entry.target.dataset.index)
        visibleItems.value.add(index)

        // Unobserve after first intersection
        const observer = observers.get(index)
        if (observer) {
          observer.unobserve(entry.target)
          observers.delete(index)
        }
      }
    })
  }

  const observeItem = (element, index) => {
    if (!element) return

    // Check if IntersectionObserver is supported
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      visibleItems.value.add(index)
      return
    }

    const observer = new IntersectionObserver(onIntersect, defaultOptions)
    observer.observe(element)
    observers.set(index, observer)

    // Store index on element for tracking
    element.dataset.index = index
  }

  const unobserveAll = () => {
    observers.forEach((observer) => {
      observer.disconnect()
    })
    observers.clear()
  }

  // Cleanup on unmount
  onUnmounted(() => {
    unobserveAll()
  })

  return {
    visibleItems,
    observeItem,
    unobserveAll
  }
}
