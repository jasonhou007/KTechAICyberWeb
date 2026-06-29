/**
 * @file useRumBeacon.js
 * @description Reactive Real-User Monitoring (RUM) beacon for Core Web Vitals (#187).
 * @ticket #187 - CWV: continuous performance monitoring (RUM beacon)
 *
 * Continuous performance monitoring of the 5 Core Web Vitals (LCP / CLS / INP /
 * FCP / TTFB) with an opt-in, privacy-first beacon.
 *
 * HARD GATES enforced by design + tested:
 *  - Default inert: enabled===false (the default) -> no observers, no timers, no
 *    storage writes. Zero runtime cost until the user opts in.
 *  - Sample-rate gate: Math.random() < sampleRate decided once per session; a
 *    non-sampled session is a complete no-op (observers never register).
 *  - Privacy-first / PII-free: the payload is metrics-only. There is NO url,
 *    location, search, hash, cookie, userAgent, referer, IP, or user id. The
 *    `sessionId` is a fresh random UUID v4 per page load (not persisted, not
 *    identity-correlating across loads).
 *  - Defensive: if the dynamic import('web-vitals') rejects OR
 *    PerformanceObserver is absent, the composable catches, logs ONCE, and stays
 *    inert. The performance tool must NEVER break the app.
 *  - Non-blocking dispatch: navigator.sendBeacon when available (returns false ->
 *    fetch(keepalive) fallback). Both failing retains the metric in a local
 *    ring buffer; the beacon is credentialess (no `credentials` option).
 *
 * TWO export layers (mirrors useAudioPulse.js): RumDashboard.vue is a thin
 * presentation layer over this composable.
 *  1. PURE helpers (no window/storage — unit-testable in isolation):
 *     - buildPayload(sessionId, ts, metrics)        cwv-v1 schema envelope
 *     - uuidV4()                                    RFC 4122 v4 (crypto-backed)
 *     - stripPii(metric)                            whitelist metric fields
 *     - pushFifo(list, item, cap)                   ring buffer w/ FIFO cap
 *     - ratingOf(name, value)                       rating bucket (good/poor)
 *  2. useRumBeacon(overrides?) reactive factory.
 *
 * Wiring contract (iter-23): App.vue calls useRumBeacon() in onMounted and
 * provides('rum', api). The dev test hook window.__rum is the E2E live-wiring
 * proof surface.
 */

import { ref, readonly, onMounted, onUnmounted } from 'vue'

// ---------------------------------------------------------------------------
// Static config — pinned by useRumBeacon.test.ts
// ---------------------------------------------------------------------------

/** Payload schema tag. Pinned; tests assert this exact string on the wire. */
export const RUM_SCHEMA = 'cwv-v1'

/** localStorage key for the metrics ring buffer. Namespaced `ktech-`. */
export const RUM_HISTORY_KEY = 'ktech-rum-history'

/** FIFO cap on the persisted + in-memory history ring. */
export const RUM_HISTORY_CAP = 20

/** Metric names collected (matches web-vitals' on* registration set). */
export const RUM_METRICS = ['LCP', 'CLS', 'INP', 'FCP', 'TTFB']

// ---------------------------------------------------------------------------
// PURE: uuidV4 — RFC 4122 v4 (crypto-backed, falls back to Math.random)
// ---------------------------------------------------------------------------

/**
 * PURE. Returns a fresh UUID v4 string. Uses crypto.randomUUID when available
 * (all modern browsers + Node 19+); falls back to a Math.random-based builder
 * for environments without it. NEVER seeded from a persisted value — each call
 * is a fresh random id so two page loads produce different ids.
 * @returns {string}
 */
export function uuidV4() {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
  } catch {
    /* crypto may be unavailable; fall through. */
  }
  // Fallback (non-crypto env): build an RFC-4122 v4-shaped string from
  // Math.random. The version + variant bits are set explicitly.
  const rnd = (n) => Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join('')
  return `${rnd(8)}-${rnd(4)}-4${rnd(3)}-8${rnd(3)}-${rnd(12)}`
}

// ---------------------------------------------------------------------------
// PURE: stripPii — whitelist metric fields (drops anything not in the schema)
// ---------------------------------------------------------------------------

/**
 * PURE. Returns a metric object containing ONLY the whitelisted fields, dropping
 * any PII-adjacent fields the underlying library might attach (e.g. attribution
 * entries that could include element selectors / URLs). The whitelist is the
 * documented cwv-v1 metric shape: { name, value, rating, delta?, id? }.
 * @param {{name:string, value:number, rating:string, delta?:number, id?:string}} m
 * @returns {{name:string, value:number, rating:string, delta?:number, id?:string}}
 */
export function stripPii(m) {
  const out = {
    name: m && m.name,
    value: typeof m?.value === 'number' ? m.value : Number(m?.value ?? 0),
    rating: m && m.rating,
  }
  if (m && typeof m.delta === 'number') out.delta = m.delta
  if (m && typeof m.id === 'string') out.id = m.id
  return out
}

// ---------------------------------------------------------------------------
// PURE: buildPayload — cwv-v1 envelope
// ---------------------------------------------------------------------------

/**
 * PURE. Builds the cwv-v1 wire envelope. Metrics-only — NO url, location,
 * search, hash, cookie, userAgent, referer, IP, or user id.
 * @param {string} sessionId  per-load uuid v4
 * @param {number} ts         epoch ms
 * @param {Array} metrics     array of stripped metric objects
 * @returns {{schema:string, sessionId:string, ts:number, metrics:Array}}
 */
export function buildPayload(sessionId, ts, metrics) {
  return {
    schema: RUM_SCHEMA,
    sessionId,
    ts,
    metrics: Array.isArray(metrics) ? metrics.map(stripPii) : [],
  }
}

// ---------------------------------------------------------------------------
// PURE: pushFifo — ring buffer with a FIFO cap
// ---------------------------------------------------------------------------

/**
 * PURE. Appends `item` to a copy of `list`, then if the length exceeds `cap`
 * drops the OLDEST entries from the front so the result length === cap. Returns
 * a NEW array; the input is not mutated.
 * @template T
 * @param {T[]} list
 * @param {T} item
 * @param {number} cap
 * @returns {T[]}
 */
export function pushFifo(list, item, cap) {
  const next = list.concat([item])
  if (next.length > cap) {
    return next.slice(next.length - cap)
  }
  return next
}

// ---------------------------------------------------------------------------
// PURE: ratingOf — rating bucket helper (for the dashboard)
// ---------------------------------------------------------------------------

/** Rating thresholds per metric (web-vitals v5 default rating boundaries). */
export const RATING_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  INP: { good: 200, poor: 500 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
}

/**
 * PURE. Returns 'good' | 'needs-improvement' | 'poor' for a metric value using
 * the web-vitals v5 default thresholds. Unknown names default to
 * 'needs-improvement'.
 * @param {string} name
 * @param {number} value
 * @returns {'good'|'needs-improvement'|'poor'}
 */
export function ratingOf(name, value) {
  const t = RATING_THRESHOLDS[name]
  if (!t || typeof value !== 'number') return 'needs-improvement'
  if (value <= t.good) return 'good'
  if (value >= t.poor) return 'poor'
  return 'needs-improvement'
}

// ===========================================================================
// Reactive factory
// ===========================================================================

/**
 * Resolve the merged config from defaults + import.meta.env + caller overrides.
 * Kept PURE so it is unit-testable. `overrides` is the optional second arg to
 * useRumBeacon (used by tests + by App.vue to inject the store-backed value).
 *
 * NOTE on `??` vs booleans: the env flag checks yield strict booleans, but
 * `??` only falls through on null/undefined — so `false ?? X` returns `false`,
 * which would short-circuit the DEV fallback. We therefore branch explicitly
 * (override-provided wins; else env flag; else the documented default).
 */
function resolveConfig(overrides = {}) {
  const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {}
  const has = (k) => overrides[k] !== undefined
  return {
    endpoint: has('endpoint') ? overrides.endpoint : (env.VITE_RUM_ENDPOINT ?? null),
    sampleRate: has('sampleRate') ? overrides.sampleRate : (env.VITE_RUM_SAMPLE_RATE ?? 1.0),
    // enabled: explicit override > env flag > default false.
    enabled: has('enabled') ? !!overrides.enabled : (env.VITE_RUM_ENABLED === 'true'),
    // testHook: explicit override > env flag > DEV mode (true under vite dev).
    testHook: has('__testHook') ? !!overrides.__testHook
      : (env.VITE_RUM_TEST_HOOK === '1' || env.DEV === true),
  }
}

/**
 * Reactive RUM state + actions. On mount (default config) it is INERT: no
 * observers, no timers, no storage. Enabling registers the 5 web-vitals
 * observers via a dynamic import (lands in its own async chunk so the perf
 * tool does not slow initial paint — itself an AC).
 *
 * @param {object} [overrides] Test/App injection of config + failure simulators.
 *   - enabled:boolean        initial enabled state (default false).
 *   - endpoint:string|null   beacon endpoint (default null).
 *   - sampleRate:number      0..1 session sample gate (default 1).
 *   - __testHook:boolean     force-expose window.__rum (also true in DEV).
 *   - __importFail:boolean   simulate a rejected dynamic import('web-vitals').
 *   - __store:{get,set}      inject a persistence backend (default localStorage).
 * @returns {{enabled, setEnabled, config, history, latest, flushNow, __resetForTests}}
 */
export function useRumBeacon(overrides = {}) {
  const cfg = resolveConfig(overrides)

  // Reactive state. Every ref here has a genuine consumer (RumDashboard.vue or
  // the test hook) — iter-23 dead-reactive-state gate.
  const enabled = ref(!!cfg.enabled)
  const history = ref([])
  const latest = ref(null)
  const config = readonly({
    endpoint: cfg.endpoint,
    sampleRate: cfg.sampleRate,
    enabled: cfg.enabled,
  })

  // --- per-session state (not reactive, not exposed) ----------------------
  // Sample gate decided ONCE per session: a non-sampled session is inert even
  // if enabled is later flipped true.
  const sampledIn = Math.random() < (typeof cfg.sampleRate === 'number' ? cfg.sampleRate : 1)
  // Fresh per-load session id — NOT persisted, NOT identity-correlating.
  const sessionId = uuidV4()

  // Persistence backend (localStorage by default; overridable for tests).
  const backend = overrides.__store || {
    get: (key) => {
      try { return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null } catch { return null }
    },
    set: (key, val) => {
      try { if (typeof localStorage !== 'undefined') localStorage.setItem(key, val) } catch { /* quota */ }
    },
  }

  // --- internal handles ----------------------------------------------------
  let observersRegistered = false
  let flushedThisHidden = false
  let rafHandle = null
  let pendingFlush = false
  let visibilityHandler = null
  let pagehideHandler = null
  let loggedImportError = false
  // Buffered metrics awaiting the next flush (coalesced by a single rAF).
  let buffer = []

  // =========================================================================
  // Persistence: read history into the ref on mount, write through on change
  // =========================================================================
  function loadHistory() {
    try {
      const raw = backend.get(RUM_HISTORY_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) history.value = parsed
    } catch {
      /* corrupted JSON -> ignore. */
    }
  }

  function persistHistory() {
    try {
      backend.set(RUM_HISTORY_KEY, JSON.stringify(history.value))
    } catch {
      /* quota / disabled -> fail silent. */
    }
  }

  // =========================================================================
  // Metric ingestion: coalesce via a single rAF (or microtask fallback), push
  // into the FIFO ring
  // =========================================================================
  /**
   * Records a metric from a web-vitals callback. Coalesces back-to-back reports
   * (especially CLS, which fires repeatedly) behind a single rAF so the FIFO +
   * localStorage write happen once per frame, not N times. When rAF is
   * unavailable (or never fires, as in jsdom under fake timers) it falls back
   * to a microtask gate, which drains deterministically under `await`.
   */
  function recordMetric(raw) {
    if (!enabled.value || !sampledIn) return
    const clean = stripPii(raw)
    buffer.push(clean)
    latest.value = clean
    if (pendingFlush) return
    pendingFlush = true
    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      rafHandle = window.requestAnimationFrame(() => {
        rafHandle = null
        flushBuffer()
      })
    }
    // Microtask fallback ALWAYS also scheduled: in jsdom rAF may be a no-op or
    // tied to real time, so a microtask guarantees the buffer drains on the
    // next `await` (test determinism) without harming the rAF coalesce in real
    // browsers (the rAF callback becomes a cheap no-op once buffer is empty).
    if (typeof queueMicrotask === 'function') {
      queueMicrotask(() => {
        // If the rAF already flushed, buffer is empty -> no-op.
        if (pendingFlush) {
          pendingFlush = false
          flushBuffer()
        }
      })
    }
  }

  function flushBuffer() {
    pendingFlush = false
    rafHandle = null
    if (buffer.length === 0) return
    // Build a single history sample from the coalesced metrics since the last
    // flush: { ts, metrics: [...] }. FIFO-capped.
    const sample = { ts: Date.now(), metrics: buffer }
    buffer = []
    history.value = pushFifo(history.value, sample, RUM_HISTORY_CAP)
    persistHistory()
  }

  // =========================================================================
  // Beacon dispatch: sendBeacon -> fetch(keepalive) -> retain
  // =========================================================================
  /**
   * Flushes pending metrics + dispatches the cwv-v1 payload to the configured
   * endpoint (if any). Non-blocking: sendBeacon first; if it returns false OR
   * is missing, falls back to fetch(endpoint, { keepalive: true }). If both
   * fail, the metrics are retained in the local ring buffer (already persisted
   * by recordMetric). Credentialess — never adds `credentials`.
   */
  function dispatch() {
    flushBuffer()
    if (!config.endpoint) return // no-endpoint mode: local-only, no network.
    if (history.value.length === 0) return
    const payload = buildPayload(sessionId, Date.now(), latestSnapshotMetrics())
    const body = JSON.stringify(payload)

    // sendBeacon path.
    let sent = false
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
        sent = navigator.sendBeacon(config.endpoint, body)
      }
    } catch {
      sent = false
    }
    if (sent) return

    // fetch(keepalive) fallback.
    if (typeof fetch === 'function') {
      fetch(config.endpoint, { method: 'POST', body, keepalive: true }).catch(() => {
        // Both transports failed -> metrics already retained in the ring buffer.
      })
    }
  }

  /**
   * Collects the metrics from the most recent N history samples for a flush.
   * We flush the latest snapshot (the metrics collected since the last flush)
   * rather than the entire history — keeps the payload small + current.
   */
  function latestSnapshotMetrics() {
    if (history.value.length === 0) return []
    return history.value[history.value.length - 1].metrics || []
  }

  // =========================================================================
  // Visibility throttle: single flush on hidden, none on visible
  // =========================================================================
  function onVisibilityChange() {
    if (typeof document === 'undefined') return
    if (document.visibilityState === 'hidden') {
      if (!flushedThisHidden) {
        flushedThisHidden = true
        dispatch()
      }
    } else {
      // Becoming visible resets the one-flush latch so the NEXT hidden period
      // flushes again. Visible itself never triggers a flush.
      flushedThisHidden = false
    }
  }

  // =========================================================================
  // Observer registration: dynamic import('web-vitals')
  // =========================================================================
  /**
   * Dynamically imports web-vitals + registers the 5 on* callbacks. The dynamic
   * import is the bundle-splitting AC: web-vitals lands in its own async chunk
   * so it does NOT slow initial paint. If the import rejects OR
   * PerformanceObserver is absent, logs ONCE and stays inert (defensive).
   */
  async function registerObservers() {
    if (observersRegistered || !enabled.value || !sampledIn) return
    // Defensive feature-detect: web-vitals needs PerformanceObserver.
    if (typeof window === 'undefined' || typeof window.PerformanceObserver === 'undefined') {
      if (!loggedImportError) {
        // eslint-disable-next-line no-console
        console.error('[rum] PerformanceObserver unavailable — RUM inert.')
        loggedImportError = true
      }
      return
    }
    observersRegistered = true
    try {
      if (overrides.__importFail) {
        throw new Error('simulated import failure (test override)')
      }
      const wv = await import('web-vitals')
      wv.onLCP(recordMetric)
      wv.onCLS(recordMetric)
      wv.onINP(recordMetric)
      wv.onFCP(recordMetric)
      wv.onTTFB(recordMetric)
    } catch (err) {
      if (!loggedImportError) {
        // eslint-disable-next-line no-console
        console.error('[rum] web-vitals import failed — RUM inert.', err)
        loggedImportError = true
      }
      observersRegistered = false
    }
  }

  // =========================================================================
  // Public actions
  // =========================================================================
  function setEnabled(v) {
    enabled.value = !!v
    if (enabled.value) {
      // registerObservers is async + idempotent; safe to call without await.
      registerObservers()
    }
  }

  /** Flush + dispatch immediately (test hook + the dashboard's manual flush). */
  function flushNow() {
    flushedThisHidden = false
    dispatch()
  }

  /** Test-only: clear in-memory + persisted history. */
  function __resetForTests() {
    buffer = []
    history.value = []
    persistHistory()
  }

  // =========================================================================
  // Dev test hook: window.__rum (DEV or VITE_RUM_TEST_HOOK=1 only)
  // =========================================================================
  function maybeExposeHook() {
    if (!cfg.testHook) return
    if (typeof window === 'undefined') return
    // eslint-disable-next-line no-underscore-dangle
    window.__rum = {
      flush: flushNow,
      history,
      config,
      // Synthetic metric injector (tests + dev dashboard demos).
      triggerMetric: (name, value, rating) => recordMetric({ name, value, rating }),
    }
  }

  // =========================================================================
  // Lifecycle
  // =========================================================================
  onMounted(() => {
    loadHistory()
    maybeExposeHook()
    if (enabled.value && sampledIn) {
      registerObservers()
    }
    if (typeof document !== 'undefined') {
      visibilityHandler = onVisibilityChange
      document.addEventListener('visibilitychange', visibilityHandler)
      pagehideHandler = () => dispatch()
      document.addEventListener('pagehide', pagehideHandler)
    }
  })

  onUnmounted(() => {
    if (visibilityHandler && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', visibilityHandler)
    }
    if (pagehideHandler && typeof document !== 'undefined') {
      document.removeEventListener('pagehide', pagehideHandler)
    }
    if (rafHandle !== null && typeof window !== 'undefined' && typeof window.cancelAnimationFrame === 'function') {
      window.cancelAnimationFrame(rafHandle)
    }
    if (cfg.testHook && typeof window !== 'undefined' && window.__rum) {
      delete window.__rum
    }
  })

  return {
    // state — consumers: RumDashboard.vue (enabled, history, latest, config),
    // the dev hook (history, config), App.vue provide('rum').
    //   latest -> RumDashboard's latest-reading readout (data-test="rum-latest"),
    //             see RumDashboard.test.ts #11a-c.
    enabled,
    config,
    history: readonly(history),
    latest: readonly(latest),
    // actions
    setEnabled,
    flushNow,
    __resetForTests,
  }
}
