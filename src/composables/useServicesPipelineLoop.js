/**
 * @file useServicesPipelineLoop.js
 * @description Reactive brain for the Services Self-Driving ambient demo (#475).
 *
 * Extends the useAutoDemoLoop pattern for a service-specific AI pipeline:
 *   DATA_INGESTION -> AI_ANALYSIS -> PIPELINE_VALIDATION -> SERVICE_EXECUTION
 *     -> RESULT_DELIVERY -> SERVICE_COMPLETE -> (wrap) -> DATA_INGESTION ...
 *
 * The ServicesSelfDriving.vue view is a thin presentation layer over this
 * composable. All animation is driven by a SINGLE shared requestAnimationFrame
 * loop using delta-time so it is frame-rate independent; transforms/opacity are
 * the only animated properties (GPU-cheap, ~60fps desktop).
 *
 * Throttling (mirrors useAutoDemoLoop):
 *  - tab hidden (visibilitychange) -> cancel rAF + freeze phase elapsed.
 *  - offscreen (IntersectionObserver) -> throttleLevel 'half'.
 *  - heavy main-thread load (delta>50ms for N consecutive frames) -> 'half'.
 * The loop always recovers back to 'full' when the condition clears.
 *
 * Reduced motion (accessibility):
 *  - prefers-reduced-motion: reduce -> isStatic=true, isActive=false, and we
 *    NEVER schedule requestAnimationFrame (the view renders a static key-frame
 *    summary instead of animating).
 *
 * @ticket #475
 */

import { ref, computed, readonly, onMounted, onUnmounted } from 'vue'

// ---------------------------------------------------------------------------
// Pipeline configuration
// ---------------------------------------------------------------------------

// Linear phase order; the loop wraps SERVICE_COMPLETE -> DATA_INGESTION seamlessly.
// EXPORTED as the single source of truth so PipelineTrack (and any future
// consumer) imports it instead of re-declaring a copy that could desync.
export const SERVICE_PHASES = [
  'dataIngestion',
  'aiAnalysis',
  'pipelineValidation',
  'serviceExecution',
  'resultDelivery',
  'serviceComplete',
]

// How long each phase stays current before advancing. Similar to self-driving
// but tuned for service flow.
const PHASE_DURATION_MS = 1800

// Under 'half' throttle we advance the phase clock at 50% speed.
const HALF_FACTOR = 0.5

// Parallax depth (same pattern as self-driving): the demo shows 2-3 depth planes
// moving at different rates with ZERO interaction. depthAccumMs advances every
// frame on the SAME shared rAF loop; the view derives a slow -1..1 sine from it.
const PARALLAX_PERIOD_MS = 12000

// A frame whose delta exceeds this is considered a jank frame. Sustained jank
// flips throttleLevel to 'half'.
const HEAVY_LOAD_FRAME_MS = 50
const HEAVY_LOAD_CONSECUTIVE = 5

// Frames under the threshold in a row clear the heavy-load state.
const HEAVY_LOAD_RECOVERY_FRAMES = 5

// Neutral single-frame delta (~16.7ms at 60fps) used to clamp absurdly large
// deltas (e.g. a throttled background tab dumping a multi-second gap).
const NEUTRAL_FRAME_MS = 16.7

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
const VISIBILITY_EVENT = 'visibilitychange'

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------

export function useServicesPipelineLoop() {
  // --- FSM state ----------------------------------------------------------
  const phaseIndex = ref(0)
  const phaseElapsedMs = ref(0)
  const loopIteration = ref(0)
  const isActive = ref(true) // actively animating (false under reduced motion)
  const isStatic = ref(false) // reduced-motion static key-frame branch
  const throttleLevel = ref('full') // 'full' | 'half' | 'paused'

  // phaseId is derived live from phaseIndex so the view tracks the FSM.
  const phaseId = readonly(computed(() => SERVICE_PHASES[phaseIndex.value]))

  // Parallax depth signal: a slow -1..1 sine the view maps to per-layer
  // translate() intensities. Driven by the shared rAF clock below.
  const depthShift = ref(0)

  // --- internal frame state (non-reactive) -------------------------------
  let rafHandle = null
  let lastFrameTime = 0
  let heavyFrames = 0
  let lightFrames = 0
  let depthAccumMs = 0

  // --- reduced-motion wiring ----------------------------------------------
  const prefersReducedMotion = ref(false)
  let motionMq = null
  const onMotionChange = (e) => {
    const reduced = !!(e && e.matches)
    prefersReducedMotion.value = reduced
    if (reduced) {
      enterStatic()
    } else {
      exitStatic()
    }
  }

  function enterStatic() {
    cancelInFlight()
    isStatic.value = true
    isActive.value = false
    depthAccumMs = 0
    depthShift.value = 0
  }

  function exitStatic() {
    isStatic.value = false
    isActive.value = true
    lastFrameTime = 0
    depthAccumMs = 0
    scheduleFrame()
  }

  // --- visibility (tab hidden) -------------------------------------------
  let onVisibility = null

  // --- IntersectionObserver (offscreen) ----------------------------------
  let io = null
  let observedEl = null
  const isOffscreen = ref(false)

  function applyThrottleFromConditions() {
    if (isOffscreen.value || heavyFrames >= HEAVY_LOAD_CONSECUTIVE) {
      throttleLevel.value = 'half'
    } else {
      throttleLevel.value = 'full'
    }
  }

  // --- frame loop ---------------------------------------------------------
  function cancelInFlight() {
    if (rafHandle !== null) {
      window.cancelAnimationFrame(rafHandle)
      rafHandle = null
    }
  }

  function onFrame(timestamp) {
    if (!isActive.value || isStatic.value) {
      rafHandle = null
      return
    }

    if (lastFrameTime === 0) {
      lastFrameTime = timestamp
      rafHandle = window.requestAnimationFrame(onFrame)
      return
    }

    let delta = timestamp - lastFrameTime
    lastFrameTime = timestamp

    if (delta > PHASE_DURATION_MS) delta = NEUTRAL_FRAME_MS

    // Heavy-load detection
    if (delta > HEAVY_LOAD_FRAME_MS) {
      heavyFrames += 1
      lightFrames = 0
    } else {
      lightFrames += 1
      if (lightFrames >= HEAVY_LOAD_RECOVERY_FRAMES) {
        heavyFrames = 0
      }
    }

    const factor = throttleLevel.value === 'half' ? HALF_FACTOR : 1
    phaseElapsedMs.value += delta * factor

    // Parallax depth
    depthAccumMs += delta * factor
    const phase = (depthAccumMs % PARALLAX_PERIOD_MS) / PARALLAX_PERIOD_MS
    depthShift.value = Math.sin(phase * Math.PI * 2)

    applyThrottleFromConditions()

    // Advance phase(s)
    while (phaseElapsedMs.value >= PHASE_DURATION_MS) {
      phaseElapsedMs.value -= PHASE_DURATION_MS
      const next = phaseIndex.value + 1
      if (next >= SERVICE_PHASES.length) {
        phaseIndex.value = 0
        loopIteration.value += 1
      } else {
        phaseIndex.value = next
      }
    }

    rafHandle = window.requestAnimationFrame(onFrame)
  }

  function scheduleFrame() {
    if (isStatic.value || prefersReducedMotion.value) return
    cancelInFlight()
    lastFrameTime = 0
    rafHandle = window.requestAnimationFrame(onFrame)
  }

  // --- public controls ----------------------------------------------------
  function start() {
    if (prefersReducedMotion.value || isStatic.value) return
    isActive.value = true
    scheduleFrame()
  }

  function pause() {
    isActive.value = false
    cancelInFlight()
  }

  // --- IO target wiring ---------------------------------------------------
  function createObserver() {
    if (typeof window === 'undefined' || typeof window.IntersectionObserver !== 'function') {
      return
    }
    io = new window.IntersectionObserver((entries) => {
      const anyOff = entries.some((e) => !e.isIntersecting)
      const anyOn = entries.some((e) => e.isIntersecting)
      if (anyOff && !anyOn) isOffscreen.value = true
      else if (anyOn) isOffscreen.value = false
      applyThrottleFromConditions()
    })
  }

  function observe(el) {
    if (io && observedEl && observedEl !== el) {
      io.unobserve(observedEl)
    }
    if (io && typeof document !== 'undefined' && document.documentElement && document.documentElement !== el) {
      io.unobserve(document.documentElement)
    }
    observedEl = el
    if (!io) createObserver()
    if (io && el) io.observe(el)
  }

  // --- lifecycle ----------------------------------------------------------
  onMounted(() => {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      motionMq = window.matchMedia(REDUCED_MOTION_QUERY)
      prefersReducedMotion.value = !!motionMq.matches
      if (motionMq.addEventListener) {
        motionMq.addEventListener('change', onMotionChange)
      } else if (motionMq.addListener) {
        motionMq.addListener(onMotionChange)
      }
    }

    if (prefersReducedMotion.value) {
      enterStatic()
      return
    }

    onVisibility = () => {
      const hidden = typeof document !== 'undefined' && document.hidden === true
      if (hidden) {
        pause()
      } else if (!isStatic.value) {
        isActive.value = true
        scheduleFrame()
      }
    }
    document.addEventListener(VISIBILITY_EVENT, onVisibility)

    createObserver()
    if (io && typeof document !== 'undefined' && document.documentElement) {
      io.observe(document.documentElement)
    }

    scheduleFrame()
  })

  onUnmounted(() => {
    cancelInFlight()
    if (io) {
      io.disconnect()
      io = null
    }
    if (onVisibility) {
      document.removeEventListener(VISIBILITY_EVENT, onVisibility)
      onVisibility = null
    }
    if (motionMq) {
      if (motionMq.removeEventListener) {
        motionMq.removeEventListener('change', onMotionChange)
      } else if (motionMq.removeListener) {
        motionMq.removeListener(onMotionChange)
      }
      motionMq = null
    }
  })

  return {
    phaseId,
    phaseIndex,
    phaseElapsedMs,
    loopIteration,
    isActive,
    isStatic,
    throttleLevel,
    prefersReducedMotion,
    depthShift,
    start,
    pause,
    observe,
    phases: SERVICE_PHASES,
    phaseDurationMs: PHASE_DURATION_MS,
  }
}
