import { ref, computed, onUnmounted, watch } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'
import { useMediaQuery } from '@vueuse/core'
import { useDeviceDetection } from './useDeviceDetection'

// Performance mark names for Issue #404
export const PERF_MARKS = {
  RAF_START: 'ambient-raf-start',
  RAF_END: 'ambient-raf-end',
  RAF_DURATION: 'ambient-raf-duration',
  LOOP_START: 'ambient-loop-start',
  LOOP_END: 'ambient-loop-end',
  FRAME_DURATION: 'ambient-frame-duration',
  PAUSED: 'ambient-paused',
  RESUMED: 'ambient-resumed',
  THROTTLED: 'ambient-throttled'
}

export function useAmbientAnimation(options = {}) {
  const {
    loopDurationMs = 45000,
    reducedMotionFallback = true,
    mobileLoopDurationMs = 60000, // Slower animation on mobile
    particles = 50, // Default particle count
    mobileParticles = 20, // Reduced particles on mobile
    updateIntervalMs = 16, // Default ~60fps
    mobileUpdateIntervalMs = 32, // ~30fps on mobile
    enableThrottling = true,
  } = options

  const target = ref(null)
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const { isMobile } = useDeviceDetection()

  // Intersection Observer for pause when off-screen
  const isIntersecting = ref(false)
  useIntersectionObserver(
    target,
    (entries) => {
      const wasIntersecting = isIntersecting.value
      isIntersecting.value = entries[0]?.isIntersecting || false

      // Issue #404: Mark pause/resume events
      if (typeof performance !== 'undefined' && performance.mark) {
        if (wasIntersecting && !isIntersecting.value) {
          performance.mark(PERF_MARKS.PAUSED)
        } else if (!wasIntersecting && isIntersecting.value) {
          performance.mark(PERF_MARKS.RESUMED)
        }
      }
    },
    {
      threshold: 0.1,
      rootMargin: '50px'
    }
  )

  // Adaptive parameters based on device type
  const adaptiveLoopDuration = computed(() => 
    isMobile.value ? mobileLoopDurationMs : loopDurationMs
  )
  
  const adaptiveParticles = computed(() => 
    isMobile.value ? mobileParticles : particles
  )
  
  const adaptiveUpdateInterval = computed(() => 
    isMobile.value ? mobileUpdateIntervalMs : updateIntervalMs
  )

  // Default to paused (not intersecting) until element is visible
  const isPaused = computed(() => !isIntersecting.value)
  const isStatic = computed(() => reducedMotion.value && reducedMotionFallback)
  const isPlaying = computed(() => !isPaused.value && !isStatic.value)

  // Animation loop state
  const progress = ref(0)
  let rafId = null
  let lastTime = null
  let lastUpdateTime = 0

  function startLoop() {
    if (rafId || isStatic.value) return
    lastTime = performance.now()
    lastUpdateTime = lastTime

    // Issue #404: Mark loop start
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(PERF_MARKS.LOOP_START)
    }

    rafId = requestAnimationFrame(loop)
  }

  function loop(now) {
    if (isPaused.value || isStatic.value) {
      rafId = null
      return // Do NOT reschedule rAF when paused/stopped
    }

    // Issue #404: Mark RAF start
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(PERF_MARKS.RAF_START)
    }

    const delta = now - lastTime
    lastTime = now

    // Throttling for mobile: only update progress at adaptive interval
    const shouldUpdate = !enableThrottling || !isMobile.value ||
      (now - lastUpdateTime >= adaptiveUpdateInterval.value)

    if (shouldUpdate) {
      // Update progress (0..1)
      progress.value = (progress.value + delta / adaptiveLoopDuration.value) % 1
      lastUpdateTime = now
    } else {
      // Issue #404: Mark throttling on mobile
      if (typeof performance !== 'undefined' && performance.mark) {
        performance.mark(PERF_MARKS.THROTTLED)
      }
    }

    // Issue #404: Mark RAF end and measure duration
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(PERF_MARKS.RAF_END)
      performance.measure(PERF_MARKS.RAF_DURATION, PERF_MARKS.RAF_START, PERF_MARKS.RAF_END)

      // Also measure full frame duration
      performance.mark(PERF_MARKS.LOOP_END)
      performance.measure(PERF_MARKS.FRAME_DURATION, PERF_MARKS.LOOP_START, PERF_MARKS.LOOP_END)
    }

    // Only reschedule if still playing (Issue #382 fix)
    if (!isPaused.value && !isStatic.value) {
      rafId = requestAnimationFrame(loop)
    } else {
      rafId = null
    }
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
    isMobile,
    adaptiveLoopDuration,
    adaptiveParticles,
    adaptiveUpdateInterval,
    startLoop,
    stopLoop,
    PERF_MARKS // Issue #404: Export performance mark names for testing
  }
}
