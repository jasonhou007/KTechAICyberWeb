import { ref, computed, onUnmounted, watch } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'
import { useMediaQuery } from '@vueuse/core'
import { useDeviceDetection } from './useDeviceDetection'

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
      isIntersecting.value = entries[0]?.isIntersecting || false
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
    rafId = requestAnimationFrame(loop)
  }

  function loop(now) {
    if (isPaused.value || isStatic.value) {
      rafId = null
      return
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
    }

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
    isMobile,
    adaptiveLoopDuration,
    adaptiveParticles,
    adaptiveUpdateInterval,
    startLoop,
    stopLoop
  }
}
