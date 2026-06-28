/**
 * @file useOpsFeed.js
 * @description Reactive brain for the Cyber Ops HUD (#182).
 * @ticket #182 - [CYBER] Cyber Ops HUD interactive dashboard.
 *
 * Owns all HUD state and logic, mirroring the composable pattern from
 * useSolutionForge.js (#180) / useNeuralNet.js (#179): CyberOpsHud.vue is a
 * thin presentation layer over this composable and has no business logic of
 * its own.
 *
 * Responsibilities:
 *  - tickMetric (PURE): bounded random walk for a metric value.
 *  - pulseSpikeValue (PURE): THE pinned spike/settle math (uptime rises to
 *    baseline+SPIKE_DELTA over SPIKE_RISE_MS then exponentially decays back).
 *  - filterEvents (PURE): category filter for the event feed.
 *  - nextAnomalyState (PURE): anomaly FSM idle->active->investigating->idle.
 *  - ONE shared rAF loop drives all animation (gauge needle, sparkline point
 *    push, request-flow particle translateX). Single cancel point. Re-entrancy
 *    guard (mirror useSolutionForge/useNeuralNet).
 *  - Idle setInterval(1500ms) drifts metrics + appends feed events + rarely
 *    raises anomaly via seedAnomaly. rAF renders; interval mutates state.
 *  - Throttle: IntersectionObserver on HUD root + document.visibilitychange —
 *    when offscreen/hidden BOTH rAF + interval are cancelled; restart on
 *    visible. Unit-tested.
 *  - Reduced motion (AC 3.2): NEVER start rAF. Interval runs but values are
 *    static/low-motion. Anomaly toast still appears (informational) but no
 *    animation loop runs.
 *
 * All outputs are simulated/illustrative — NO network calls (AC4).
 */

import { ref, computed, readonly, onMounted, onUnmounted } from 'vue'

// ---------------------------------------------------------------------------
// Types (JSDoc — consumed by the .ts unit test import)
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} FeedEvent
 * @property {number} id
 * @property {'ai'|'security'|'performance'} category
 * @property {string} message       i18n key (resolved by the view via t())
 * @property {number} ts
 * @property {boolean} [pulse]      marker: this event is the "pulse fired" event
 * @property {boolean} [anomaly]    marker: this event raises an anomaly
 * @property {boolean} [investigate] marker: drives nextAnomalyState active->investigating
 * @property {boolean} [dismiss]    marker: drives nextAnomalyState investigating->idle
 */

// ---------------------------------------------------------------------------
// Static config
// ---------------------------------------------------------------------------

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
const MOBILE_QUERY = '(max-width: 768px)'

const IDLE_INTERVAL_MS = 1500
const HISTORY_LENGTH = 24

// Pulse spike/settle math — TDD-pinned EXACT constants (see useOpsFeed.test.ts).
const BASELINE_UPTIME = 99.2
const BASELINE_LATENCY = 42 // ms
const BASELINE_THROUGHPUT = 1200 // req/s
const SPIKE_DELTA = 0.8
const SPIKE_RISE_MS = 400
const SETTLE_MS = 1800
const DECAY = 0.004 // per ms

// Categories exposed for the event-feed filter tabs.
const CATEGORIES = ['all', 'ai', 'security', 'performance']

// Deterministic idle feed-event templates (category + i18n key under opsHud.events).
// Kept small + deterministic so the feed is reproducible; the random scheduler
// cycles through these.
const IDLE_TEMPLATES = [
  { category: 'ai', message: 'opsHud.events.ai_1' },
  { category: 'security', message: 'opsHud.events.sec_1' },
  { category: 'performance', message: 'opsHud.events.perf_1' },
  { category: 'ai', message: 'opsHud.events.ai_2' },
  { category: 'security', message: 'opsHud.events.sec_2' },
  { category: 'performance', message: 'opsHud.events.perf_2' },
]

// ---------------------------------------------------------------------------
// PURE: easeOut (used by pulseSpikeValue rise phase)
// ---------------------------------------------------------------------------

function easeOut(t) {
  // Clamp 0..1 then apply a standard ease-out curve.
  const x = Math.max(0, Math.min(1, t))
  return 1 - Math.pow(1 - x, 3)
}

// ---------------------------------------------------------------------------
// PURE: tickMetric — bounded random walk
// ---------------------------------------------------------------------------

/**
 * PURE. Bounded random walk. Given a current value, walks it by up to +/- step
 * (sign chosen by rng in [0,1]: rng<0.5 down, >=0.5 up), then clamps to
 * [min, max]. Deterministic given (current, opts, rng).
 *
 * @param {number} current
 * @param {{min: number, max: number, step: number, rng?: () => number}} opts
 * @returns {number}
 */
export function tickMetric(current, opts) {
  const { min, max, step } = opts
  const rng = opts.rng || Math.random
  const r = rng()
  // Map rng [0,1) to a signed delta in [-step, +step].
  const delta = (r - 0.5) * 2 * step
  const next = current + delta
  return Math.max(min, Math.min(max, next))
}

// ---------------------------------------------------------------------------
// PURE: pulseSpikeValue — THE pinned spike/settle math
// ---------------------------------------------------------------------------

/**
 * PURE. Returns the uptime value at `elapsed` ms after a pulse, following the
 * pinned curve:
 *   elapsed < 0                       -> baseline
 *   elapsed < SPIKE_RISE_MS           -> baseline + SPIKE_DELTA*easeOut(elapsed/rise)
 *   elapsed < SPIKE_RISE_MS+SETTLE_MS -> peak*exp(-DECAY*(elapsed-rise)), floored at baseline
 *   else                              -> baseline
 * where peak = min(100, baseline + SPIKE_DELTA).
 *
 * @param {number} baseline
 * @param {number} elapsedMs
 * @returns {number}
 */
export function pulseSpikeValue(baseline, elapsedMs) {
  if (elapsedMs < 0) return baseline
  const peak = Math.min(100, baseline + SPIKE_DELTA)
  if (elapsedMs < SPIKE_RISE_MS) {
    return baseline + SPIKE_DELTA * easeOut(elapsedMs / SPIKE_RISE_MS)
  }
  if (elapsedMs < SPIKE_RISE_MS + SETTLE_MS) {
    const decayed = peak * Math.exp(-DECAY * (elapsedMs - SPIKE_RISE_MS))
    return Math.max(baseline, decayed)
  }
  return baseline
}

// ---------------------------------------------------------------------------
// PURE: filterEvents — category filter
// ---------------------------------------------------------------------------

/**
 * PURE. Returns the subset of `events` matching `category`, or all events when
 * category === 'all'.
 *
 * @param {FeedEvent[]} events
 * @param {string} category  one of CATEGORIES
 * @returns {FeedEvent[]}
 */
export function filterEvents(events, category) {
  if (!category || category === 'all') return events.slice()
  return events.filter((e) => e.category === category)
}

// ---------------------------------------------------------------------------
// PURE: nextAnomalyState — anomaly FSM
// ---------------------------------------------------------------------------

/**
 * PURE. Computes the next anomaly state given the current state and an event.
 *   idle         + anomaly event     -> active
 *   active       + investigate event -> investigating
 *   investigating+ dismiss event     -> idle
 *   (otherwise the state is unchanged)
 *
 * @param {'idle'|'active'|'investigating'} current
 * @param {FeedEvent} event
 * @returns {'idle'|'active'|'investigating'}
 */
export function nextAnomalyState(current, event) {
  if (!event) return current
  if (event.anomaly && current === 'idle') return 'active'
  if (event.investigate && current === 'active') return 'investigating'
  if (event.dismiss && current === 'investigating') return 'idle'
  return current
}

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------

export function useOpsFeed() {
  // --- live metric state --------------------------------------------------
  const uptime = ref(BASELINE_UPTIME)
  const latency = ref(BASELINE_LATENCY)
  const throughput = ref(BASELINE_THROUGHPUT)
  const latencyHistory = ref(seedHistory(BASELINE_LATENCY, 8))
  const throughputHistory = ref(seedHistory(BASELINE_THROUGHPUT, 200))
  const requestCount = ref(0)

  // --- feed + anomaly state ----------------------------------------------
  const events = ref([])
  const anomalyState = ref('idle') // 'idle' | 'active' | 'investigating'
  const activeAnomaly = ref(null)
  const activeCategory = ref('all')
  const expandedWidget = ref(null) // null | 'gauge' | 'sparkline' | 'requestflow' | 'eventlog'

  // --- pulse bookkeeping --------------------------------------------------
  let pulseStart = null // performance.now() at last pulse(), or null
  let pulseActive = false

  // --- loop handles -------------------------------------------------------
  let rafHandle = null
  let intervalHandle = null
  let intersectionObs = null

  // --- visibility + motion flags -----------------------------------------
  const prefersReducedMotion = ref(false)
  const isMobile = ref(false)
  let isVisible = ref(true) // HUD onscreen + page visible
  let motionMq = null
  let mobileMq = null

  let eventIdSeq = 1
  let templateIdx = 0

  // =========================================================================
  // Helpers
  // =========================================================================

  function seedHistory(base, variance) {
    const out = []
    for (let i = 0; i < HISTORY_LENGTH; i++) {
      out.push(Math.round(base + (Math.random() - 0.5) * variance))
    }
    return out
  }

  function pushHistory(arrRef, value) {
    const next = arrRef.value.slice(1)
    next.push(value)
    arrRef.value = next
  }

  function appendEvent(partial) {
    const evt = {
      id: eventIdSeq++,
      ts: Date.now(),
      ...partial,
    }
    events.value = [evt, ...events.value].slice(0, 50)
    return evt
  }

  // =========================================================================
  // rAF loop — single shared animation driver (gauge + sparkline + requestflow)
  // =========================================================================

  // Re-entrancy + sync-rAF guards:
  //  - `inTick`: a tick must NOT re-enter itself within the same frame.
  //  - `scheduling`: guards the bottom-of-tick re-schedule. Under a SYNCHRONOUS
  //    rAF mock (e.g. NeuralCore.spec.js, which fires the callback inline),
  //    `requestAnimationFrame(tick)` would synchronously call `tick` again and
  //    an idle loop recurses forever. By marking `scheduling` around the rAF
  //    call, a synchronously-re-entered tick sees it set and bails out of the
  //    chain — the next REAL frame (or interval) resumes the loop. Under
  //    async rAF the callback fires later, after `scheduling` is cleared, so
  //    normal animation proceeds.
  let inTick = false
  let scheduling = false
  let running = false

  function tick(now) {
    if (inTick) return
    inTick = true
    try {
      // 1. Gauge: if a pulse is active, uptime follows pulseSpikeValue; otherwise
      //    it idles at baseline with a tiny breathing drift so the needle feels
      //    alive (still bounded, transform-only render).
      if (pulseActive && pulseStart !== null) {
        uptime.value = pulseSpikeValue(BASELINE_UPTIME, now - pulseStart)
        // Latency spikes INVERSELY (stress): rises then decays.
        const phase = now - pulseStart
        if (phase < SPIKE_RISE_MS + SETTLE_MS) {
          const stress = Math.max(0, 1 - phase / (SPIKE_RISE_MS + SETTLE_MS))
          latency.value = BASELINE_LATENCY * (1 + 2 * stress) // up to 3x baseline
        } else {
          latency.value = BASELINE_LATENCY
        }
        // Throughput spikes UP then settles.
        if (phase < SPIKE_RISE_MS + SETTLE_MS) {
          const boost = Math.max(0, 1 - phase / (SPIKE_RISE_MS + SETTLE_MS))
          throughput.value = BASELINE_THROUGHPUT * (1 + 1.5 * boost)
        } else {
          throughput.value = BASELINE_THROUGHPUT
        }
        // Pulse settled — clear the flag so the gauge returns to breathing.
        if (now - pulseStart >= SPIKE_RISE_MS + SETTLE_MS) {
          pulseActive = false
        }
      } else if (!prefersReducedMotion.value) {
        // Tiny breathing drift around baseline (no rAF under reduced motion — but
        // we only get here when rAF is running, i.e. motion is allowed).
        uptime.value = Math.max(95, Math.min(100, BASELINE_UPTIME + (Math.random() - 0.5) * 0.1))
      }

      // 2. Request-flow: increment the particle counter (view renders translateX).
      if (!prefersReducedMotion.value && !isMobile.value) {
        requestCount.value = (requestCount.value + 1) % 1000
      }
    } finally {
      inTick = false
    }

    if (running && !scheduling) {
      scheduling = true
      try {
        rafHandle = window.requestAnimationFrame(tick)
      } finally {
        scheduling = false
      }
    }
  }

  function startRAF() {
    if (prefersReducedMotion.value) return // NEVER under reduced motion
    if (running) return
    running = true
    rafHandle = window.requestAnimationFrame(tick)
  }

  function stopRAF() {
    running = false
    if (rafHandle !== null) {
      window.cancelAnimationFrame(rafHandle)
      rafHandle = null
    }
  }

  // =========================================================================
  // Idle interval — drift metrics + append feed events + rarely raise anomaly
  // =========================================================================

  function onInterval() {
    if (!isVisible.value) return
    // Drift latency/throughput around their baselines (bounded).
    latency.value = Math.max(20, Math.min(200, tickMetric(latency.value, { min: 20, max: 200, step: 3 })))
    throughput.value = Math.max(500, Math.min(2000, tickMetric(throughput.value, { min: 500, max: 2000, step: 60 })))
    // Push the latest into the history windows (drives the sparkline render).
    pushHistory(latencyHistory, Math.round(latency.value))
    pushHistory(throughputHistory, Math.round(throughput.value))

    // Append a deterministic feed event (cycle through templates).
    const tpl = IDLE_TEMPLATES[templateIdx % IDLE_TEMPLATES.length]
    templateIdx++
    appendEvent({ category: tpl.category, message: tpl.message })

    // Rarely raise a random anomaly via seedAnomaly (~6% of ticks).
    if (Math.random() < 0.06 && anomalyState.value === 'idle') {
      seedAnomaly()
    }
  }

  function startInterval() {
    if (intervalHandle !== null) return
    intervalHandle = window.setInterval(onInterval, IDLE_INTERVAL_MS)
  }

  function stopInterval() {
    if (intervalHandle !== null) {
      window.clearInterval(intervalHandle)
      intervalHandle = null
    }
  }

  // =========================================================================
  // Visibility / offscreen throttle
  // =========================================================================

  function updateRunning() {
    const should = isVisible.value && !prefersReducedMotion.value
    if (should) {
      startRAF()
      startInterval()
    } else {
      // Cancel BOTH rAF + interval when offscreen/hidden/reduced-motion.
      stopRAF()
      // Under reduced motion we KEEP the interval (values stay low-motion but
      // the feed still ticks so the dashboard isn't dead). Under hidden we stop
      // everything.
      if (!isVisible.value) stopInterval()
    }
  }

  function onVisibilityChange() {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      isVisible.value = false
    } else {
      isVisible.value = true
    }
    updateRunning()
  }

  // =========================================================================
  // Public actions
  // =========================================================================

  /**
   * Pulse the network: spikes uptime/throughput up + latency up, appends a
   * "pulse fired" event, and deterministically raises an anomaly so the
   * Investigate drill-down is reachable without waiting on the random
   * scheduler (E2E-friendly).
   */
  function pulse() {
    pulseStart = (typeof performance !== 'undefined' ? performance.now() : Date.now())
    pulseActive = true
    appendEvent({
      category: 'performance',
      message: 'opsHud.events.pulse',
      pulse: true,
    })
    // Deterministic anomaly raise WITHOUT a second feed append: pulse() already
    // appends its "pulse fired" event above, so raising the anomaly state here
    // directly keeps the feed delta at +1 (the contract the test pins). The
    // random idle scheduler uses seedAnomaly() instead, which DOES append.
    if (anomalyState.value === 'idle') {
      anomalyState.value = 'active'
      activeAnomaly.value = {
        id: eventIdSeq,
        ts: Date.now(),
        message: 'opsHud.anomaly.title',
      }
    }
    // If reduced motion, immediately compute the peak value once (no rAF).
    if (prefersReducedMotion.value) {
      uptime.value = pulseSpikeValue(BASELINE_UPTIME, 0)
    }
  }

  /**
   * Test + internal-only anomaly driver. Raises an anomaly event which flips
   * anomalyState idle->active via the pure FSM. NOT rendered directly — the
   * view reads anomalyState/activeAnomaly.
   */
  function seedAnomaly() {
    if (anomalyState.value !== 'idle') return
    const evt = appendEvent({
      category: 'security',
      message: 'opsHud.events.anomaly',
      anomaly: true,
    })
    anomalyState.value = nextAnomalyState(anomalyState.value, evt)
    activeAnomaly.value = {
      id: evt.id,
      ts: evt.ts,
      message: 'opsHud.anomaly.title',
    }
  }

  function setCategory(c) {
    if (CATEGORIES.includes(c)) activeCategory.value = c
  }

  function expandWidget(key) {
    expandedWidget.value = key
  }

  function collapseWidget() {
    expandedWidget.value = null
  }

  function investigate() {
    // active -> investigating via the pure FSM.
    const evt = { id: eventIdSeq++, investigate: true, category: 'security', message: '', ts: Date.now() }
    anomalyState.value = nextAnomalyState(anomalyState.value, evt)
  }

  function dismissAnomaly() {
    // investigating -> idle via the pure FSM.
    const evt = { id: eventIdSeq++, dismiss: true, category: 'security', message: '', ts: Date.now() }
    anomalyState.value = nextAnomalyState(anomalyState.value, evt)
    activeAnomaly.value = null
  }

  // =========================================================================
  // Computed
  // =========================================================================

  const filteredEvents = computed(() => filterEvents(events.value, activeCategory.value))

  // =========================================================================
  // Lifecycle
  // =========================================================================

  onMounted(() => {
    // Seed the initial feed so the log isn't empty on mount.
    for (let i = 0; i < 4; i++) {
      const tpl = IDLE_TEMPLATES[i % IDLE_TEMPLATES.length]
      appendEvent({ category: tpl.category, message: tpl.message })
    }

    if (typeof window !== 'undefined') {
      if (typeof window.matchMedia === 'function') {
        motionMq = window.matchMedia(REDUCED_MOTION_QUERY)
        prefersReducedMotion.value = !!motionMq.matches
        if (motionMq.addEventListener) motionMq.addEventListener('change', onMotionChange)
        else if (motionMq.addListener) motionMq.addListener(onMotionChange)

        mobileMq = window.matchMedia(MOBILE_QUERY)
        isMobile.value = !!mobileMq.matches
        if (mobileMq.addEventListener) mobileMq.addEventListener('change', onMobileChange)
        else if (mobileMq.addListener) mobileMq.addListener(onMobileChange)
      }

      // Offscreen throttle via IntersectionObserver on the HUD root (mounted
      // into document.body by the host test; the real view passes its own root).
      if (typeof window.IntersectionObserver !== 'undefined') {
        intersectionObs = new window.IntersectionObserver((entries) => {
          for (const entry of entries) {
            // Offscreen -> not visible (page-visible still true; this is the
            // scroll-out throttle). We union with document visibility below.
            isVisible.value = entry.isIntersecting && (typeof document === 'undefined' || document.visibilityState !== 'hidden')
          }
          updateRunning()
        })
        // Observe document.body as a fallback root when no explicit root is set.
        intersectionObs.observe(document.body)
      }

      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', onVisibilityChange)
      }
    }

    updateRunning()
  })

  function onMotionChange(e) {
    prefersReducedMotion.value = !!(e && e.matches)
    updateRunning()
  }

  function onMobileChange(e) {
    isMobile.value = !!(e && e.matches)
  }

  onUnmounted(() => {
    stopRAF()
    stopInterval()
    if (motionMq) {
      if (motionMq.removeEventListener) motionMq.removeEventListener('change', onMotionChange)
      else if (motionMq.removeListener) motionMq.removeListener(onMotionChange)
    }
    if (mobileMq) {
      if (mobileMq.removeEventListener) mobileMq.removeEventListener('change', onMobileChange)
      else if (mobileMq.removeListener) mobileMq.removeListener(onMobileChange)
    }
    if (intersectionObs) {
      intersectionObs.disconnect()
      intersectionObs = null
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  })

  return {
    // live metric state (every ref has a template consumer)
    uptime,
    latencyHistory,
    throughputHistory,
    requestCount,
    events,
    anomalyState: readonly(anomalyState),
    activeAnomaly: readonly(activeAnomaly),
    activeCategory,
    filteredEvents,
    expandedWidget,
    prefersReducedMotion,
    isMobile,
    // constants
    categories: CATEGORIES,
    // actions
    pulse,
    setCategory,
    expandWidget,
    collapseWidget,
    investigate,
    dismissAnomaly,
    // test + internal only (NOT rendered)
    seedAnomaly,
  }
}
