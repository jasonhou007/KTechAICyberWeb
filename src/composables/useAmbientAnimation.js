import { ref, computed, onUnmounted, watch } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'
import { useMediaQuery } from '@vueuse/core'

export function useAmbientAnimation(options = {}) {
  const {
    loopDurationMs = 45000,
    reducedMotionFallback = true
  } = options

  const target = ref(null)
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

  // Intersection Observer for pause when off-screen
  const isIntersecting = ref(false)
  useIntersectionObserver(
    target,
    (entries) => {
      isIntersecting.value = entries[0]?.isIntersecting || false
    },
    {
      threshold: 0.1,
      rootMargin: '50px'
    }
  )

  // Default to paused (not intersecting) until element is visible
  const isPaused = computed(() => !isIntersecting.value)
  const isStatic = computed(() => reducedMotion.value && reducedMotionFallback)
  const isPlaying = computed(() => !isPaused.value && !isStatic.value)

  // Animation loop state
  const progress = ref(0)
  let rafId = null
  let lastTime = null

  function startLoop() {
    if (rafId || isStatic.value) return
    lastTime = performance.now()
    rafId = requestAnimationFrame(loop)
  }

  function loop(now) {
    if (isPaused.value || isStatic.value) {
      rafId = null
      return
    }

    const delta = now - lastTime
    lastTime = now

    // Update progress (0..1)
    progress.value = (progress.value + delta / loopDurationMs) % 1

    rafId = requestAnimationFrame(loop)
  }

  function stopLoop() {
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }

  // Auto-start when intersecting
  const unwatch = watch(isPlaying, (playing) => {
    if (playing) {
      startLoop()
    } else {
      stopLoop()
    }
  })

  onUnmounted(() => {
    stopLoop()
    unwatch()
  })

  return {
    target,
    isPaused,
    isStatic,
    isPlaying,
    progress,
    startLoop,
    stopLoop
  }
}
