/**
 * @file useAutoDemoLoop.js
 * @description Reactive brain for the Self-Driving ambient demo background (#203).
 *
 * Owns the always-on, no-click-required pipeline loop that auto-demonstrates
 * the autonomous dev pipeline:
 *   INTAKE -> TRIAGE -> PLANNER -> CODER -> SECURITY -> EVALUATOR -> MERGER
 *          -> RESOLVED -> (wrap) -> INTAKE ...
 *
 * The SelfDrivingDemo.vue view is a thin presentation layer over this
 * composable (mirrors the useNeuralNet/useTerminal split). All animation is
 * driven by a SINGLE shared requestAnimationFrame loop using delta-time so it
 * is frame-rate independent; transforms/opacity are the only animated
 * properties (GPU-cheap, ~60fps desktop).
 *
 * Throttling (AC3 — cheap to run forever):
 *  - tab hidden (visibilitychange)  -> cancel rAF + freeze phase elapsed.
 *  - offscreen (IntersectionObserver) -> throttleLevel 'half'.
 *  - heavy main-thread load (delta>50ms for N consecutive frames) -> 'half'.
 * The loop always recovers back to 'full' when the condition clears.
 *
 * Reduced motion (AC4 — accessibility):
 *  - prefers-reduced-motion: reduce -> isStatic=true, isActive=false, and we
 *    NEVER schedule requestAnimationFrame (the view renders a static key-frame
 *    summary instead of animating).
 *
 * Cleanup mirrors the battle-tested useNeuralNet pattern (lines ~417-446):
 * cancelAnimationFrame + IO.disconnect() + removeEventListener for both
 * visibilitychange and the matchMedia change listener. The re-entrancy guard
 * cancels any in-flight rAF before re-arming so we never have two loops alive.
 *
 * @ticket #203
 */

import { ref, computed, readonly, onMounted, onUnmounted } from 'vue'

// ---------------------------------------------------------------------------
// Pipeline configuration
// ---------------------------------------------------------------------------

// Linear phase order; the loop wraps RESOLVED -> INTAKE seamlessly.
const PHASES = [
  'intake',
  'triage',
  'planner',
  'coder',
  'security',
  'evaluator',
  'merger',
  'resolved',
]

// How long each phase stays current before advancing. Tuned so a full cycle
// is long enough to read each stage but short enough that (a) the loop is
// visibly "alive" within a few seconds of load and (b) the seamless wrap
// (RESOLVED->INTAKE, the strongest "alive" signal) is reached within a ~30s
// observation window even under the half-speed heavy-load throttle. At 1500ms
// a full-speed cycle is ~12s and a half-throttle cycle ~24s, both with margin.
const PHASE_DURATION_MS = 1500

// Under 'half' throttle we advance the phase clock at 50% speed so the demo
// visibly slows (the AC asks for slow-mo under load), but never freezes.
const HALF_FACTOR = 0.5

// Parallax depth (AC2 — "parallax depth"): the demo must show 2-3 depth planes
// moving at different rates with ZERO interaction (it is an always-on ambient
// layer, not a mouse-driven widget). depthAccumMs advances every frame on the
// SAME shared rAF loop (no second timer); the view derives a slow -1..1 sine
// from it (PARALLAX_PERIOD_MS) and translates its depth layers at different
// intensities. transform-only, GPU-cheap, cancelled on unmount with the loop.
const PARALLAX_PERIOD_MS = 12000

// A frame whose delta exceeds this is considered a jank frame. Sustained jank
// (HEAVY_LOAD_CONSECUTIVE frames in a row) flips throttleLevel to 'half'.
const HEAVY_LOAD_FRAME_MS = 50
const HEAVY_LOAD_CONSECUTIVE = 5

// Frames under the threshold in a row clear the heavy-load state.
const HEAVY_LOAD_RECOVERY_FRAMES = 5

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
const VISIBILITY_EVENT = 'visibilitychange'

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------

export function useAutoDemoLoop() {
  // --- FSM state ----------------------------------------------------------
  const phaseIndex = ref(0)
  const phaseElapsedMs = ref(0)
  const loopIteration = ref(0)
  const isActive = ref(true) // actively animating (false under reduced motion)
  const isStatic = ref(false) // reduced-motion static key-frame branch
  const throttleLevel = ref('full') // 'full' | 'half' | 'paused'

  // phaseId is derived live from phaseIndex so the view tracks the FSM.
  const phaseId = readonly(computed(() => PHASES[phaseIndex.value]))

  // Parallax depth signal (AC2). A slow -1..1 sine the view maps to per-layer
  // translate() intensities (far < mid < near) to create depth. Driven by the
  // shared rAF clock below — no second timer. Under reduced motion this stays 0.
  const depthShift = ref(0)

  // --- internal frame state (non-reactive) -------------------------------
  let rafHandle = null
  let lastFrameTime = 0
  let heavyFrames = 0
  let lightFrames = 0
  // Continuously-advancing accumulator for the parallax depth signal. It is
  // independent of phase duration so depth keeps flowing mid-phase, not just
  // on phase boundaries. Reset to 0 on (re)start alongside lastFrameTime.
  let depthAccumMs = 0

  // --- reduced-motion wiring (mirrors useNeuralNet) ----------------------
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
    // Cancel any in-flight rAF first (re-entrancy guard) so we never leave a
    // leaked frame scheduled after we have committed to the static branch.
    cancelInFlight()
    isStatic.value = true
    isActive.value = false
    // Pin the parallax depth signal at 0 so reduced-motion renders a flat,
    // static key-frame (AC4 — no animation of any kind in this branch).
    depthAccumMs = 0
    depthShift.value = 0
  }

  function exitStatic() {
    isStatic.value = false
    isActive.value = true
    // Reset frame timing so the first resumed frame does not jump.
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
    // Offscreen OR heavy load -> 'half'. Tab-hidden is handled separately
    // (it cancels rAF entirely). If neither, 'full'.
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
    // Re-entrancy: if the loop was paused/cancelled between scheduling and
    // firing (e.g. tab hidden), bail without rescheduling.
    if (!isActive.value || isStatic.value) {
      rafHandle = null
      return
    }

    if (lastFrameTime === 0) {
      // First frame after (re)start: establish a baseline without advancing
      // the phase clock, so there is never a delta-jump on resume.
      lastFrameTime = timestamp
      rafHandle = window.requestAnimationFrame(onFrame)
      return
    }

    let delta = timestamp - lastFrameTime
    lastFrameTime = timestamp

    // Heavy-load detection. A janky frame (>50ms) bumps the counter; a smooth
    // frame clears it. Sustained jank flips throttleLevel to 'half'; sustained
    // smooth frames recover to 'full'.
    if (delta > HEAVY_LOAD_FRAME_MS) {
      heavyFrames += 1
      lightFrames = 0
    } else {
      lightFrames += 1
      if (lightFrames >= HEAVY_LOAD_RECOVERY_FRAMES) {
        heavyFrames = 0
      }
    }

    // Tab was hidden then visible again: when we cancelled on hide, lastFrameTime
    // was frozen. On resume we reset it to 0, so the first resume frame took the
    // early-return branch above and we only land here with a small delta. But
    // defend against any path that yields a huge delta (e.g. throttled tabs)
    // by clamping so we never fast-forward multiple phases in one frame.
    if (delta > PHASE_DURATION_MS) delta = HEAVY_LOAD_FRAME_MS

    const factor = throttleLevel.value === 'half' ? HALF_FACTOR : 1
    phaseElapsedMs.value += delta * factor

    // Parallax depth (AC2): advance the continuous accumulator on the same tick
    // as the phase clock (slowed by the same throttle factor so depth slow-mos
    // in lockstep with the pipeline under load). Mapped to a slow -1..1 sine so
    // the view's depth planes drift back and forth, not march off-screen.
    depthAccumMs += delta * factor
    const phase =
      (depthAccumMs % PARALLAX_PERIOD_MS) / PARALLAX_PERIOD_MS // 0..1
    depthShift.value = Math.sin(phase * Math.PI * 2) // -1..1

    applyThrottleFromConditions()

    // Advance phase(s). Loop in case a long clamp still crosses a boundary,
    // but each iteration subtracts a full PHASE_DURATION_MS so we keep the
    // remainder and the loop stays seamless.
    while (phaseElapsedMs.value >= PHASE_DURATION_MS) {
      phaseElapsedMs.value -= PHASE_DURATION_MS
      const next = phaseIndex.value + 1
      if (next >= PHASES.length) {
        // Seamless wrap: RESOLVED -> INTAKE, bump the cycle counter.
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
    // Re-entrancy guard: cancel any leaked frame before re-arming.
    cancelInFlight()
    lastFrameTime = 0
    rafHandle = window.requestAnimationFrame(onFrame)
  }

  // --- public controls ----------------------------------------------------
  /** Begin/resume the loop. No-op under reduced motion. */
  function start() {
    if (prefersReducedMotion.value || isStatic.value) return
    isActive.value = true
    scheduleFrame()
  }

  /** Pause the loop (used by the visibility handler). */
  function pause() {
    isActive.value = false
    cancelInFlight()
  }

  // --- IO target wiring ---------------------------------------------------
  // The composable owns a single IntersectionObserver so the demo self-throttles
  // when its root scrolls offscreen, even before the view calls observe(el).
  // The view passes its root element via observe() so we track the right node.
  function createObserver() {
    if (
      typeof window === 'undefined' ||
      typeof window.IntersectionObserver !== 'function'
    ) {
      return
    }
    io = new window.IntersectionObserver((entries) => {
      // Any entry not intersecting => consider the demo offscreen.
      const anyOff = entries.some((e) => !e.isIntersecting)
      const anyOn = entries.some((e) => e.isIntersecting)
      if (anyOff && !anyOn) isOffscreen.value = true
      else if (anyOn) isOffscreen.value = false
      applyThrottleFromConditions()
    })
  }

  function observe(el) {
    observedEl = el
    if (!io) createObserver()
    if (io && el) io.observe(el)
  }

  // --- lifecycle ----------------------------------------------------------
  onMounted(() => {
    // Reduced-motion probe (mirrors useNeuralNet). Under reduced motion we
    // enter the static branch WITHOUT ever scheduling rAF (the AC demands
    // zero requestAnimationFrame calls in that mode).
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

    // Visibility: pause when the tab is hidden, resume (no delta-jump) on
    // return. We attach to document because that is where visibilitychange
    // fires.
    onVisibility = () => {
      const hidden =
        typeof document !== 'undefined' && document.hidden === true
      if (hidden) {
        pause()
      } else if (!isStatic.value) {
        isActive.value = true
        // lastFrameTime=0 inside scheduleFrame ensures the first resumed frame
        // only establishes a baseline (no delta-jump from the paused interval).
        scheduleFrame()
      }
    }
    document.addEventListener(VISIBILITY_EVENT, onVisibility)

    // Create the offscreen IntersectionObserver up front (observing the
    // document element by default) so the demo self-throttles even before the
    // view calls observe(el). The view re-points it at its own root.
    createObserver()
    if (io && typeof document !== 'undefined' && document.documentElement) {
      io.observe(document.documentElement)
    }

    // Kick off the loop.
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
    // phase clock
    phaseId,
    phaseIndex,
    phaseElapsedMs,
    loopIteration,
    // motion state
    isActive,
    isStatic,
    throttleLevel,
    prefersReducedMotion,
    // parallax depth signal (AC2) — slow -1..1 sine for the view's depth planes
    depthShift,
    // controls / wiring
    start,
    pause,
    observe,
    // config exposed for the view/tests
    phases: PHASES,
    phaseDurationMs: PHASE_DURATION_MS,
  }
}
