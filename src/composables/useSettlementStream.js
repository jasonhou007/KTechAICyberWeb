/**
 * @file useSettlementStream.js
 * @description Reactive brain for the ambient Settlement Stream (#206).
 * @ticket #206 - [CYBER] Ambient 'Settlement Stream'.
 *
 * The Settlement Stream is an ALWAYS-ON, NO-CLICK cinematic background that
 * narrates KTech's fintech product working: cross-border payment packets
 * travelling China <-> ASEAN rails, blockchain blocks settling, an FX ticker
 * drifting, and a liquidity pool breathing. It auto-plays on mount and loops
 * forever; the presentation layer (SettlementStream.vue) is a thin consumer.
 *
 * Architecture (mirrors the GOLD reference useOpsFeed.js #182):
 *  - PURE, TDD-pinned functions: tickPacket, nextBlock, tickFx, liquidityPulse.
 *  - ONE shared rAF loop drives packet translation along the rails + the
 *    liquidity breathing curve (transform/opacity-only render). Single cancel.
 *    Re-entrancy + sync-rAF guards lifted from useOpsFeed.
 *  - Idle setInterval(BLOCK_INTERVAL_MS) appends a settled block + drifts FX
 *    + ticks the "settled" counter. rAF renders; interval mutates state.
 *  - Throttle: IntersectionObserver on the stream root + document
 *    .visibilitychange. When offscreen/hidden BOTH rAF + interval are
 *    cancelled; restart on visible.
 *  - Reduced motion (AC 4.1): NEVER start rAF. The interval runs with
 *    low-motion values (one block per interval, no packet translation, static
 *    liquidity at baseline) so the story stays legible without animation.
 *  - Mobile-degrade (AC 3.1): caps the rail packet count under max-width:768px.
 *
 * All outputs are simulated/illustrative — NO network calls (AC 5 already
 * requires all copy live in locales; no fetch).
 */

import { ref, readonly, computed, onMounted, onUnmounted } from 'vue'

// ---------------------------------------------------------------------------
// Types (JSDoc — consumed by the .ts unit test import)
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} Rail
 * @property {string} id            rail id, e.g. 'china-thailand'
 * @property {string} fromLabel     i18n key under settlementStream.nodes
 * @property {string} toLabel       i18n key under settlementStream.nodes
 * @property {string} fromCurrency  ISO-ish code, e.g. 'CNY'
 * @property {string} toCurrency    e.g. 'THB'
 */

/**
 * @typedef {Object} Packet
 * @property {number} id
 * @property {string} railId
 * @property {number} progress     0..1 along the rail (drives translateX)
 * @property {number} speed        fraction of rail per ms
 * @property {boolean} settled     flips true when progress wraps to 0
 */

/**
 * @typedef {Object} Block
 * @property {number} height
 * @property {string} hash
 * @property {number} txCount
 * @property {number} ts
 */

// ---------------------------------------------------------------------------
// Static config
// ---------------------------------------------------------------------------

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
const MOBILE_QUERY = '(max-width: 768px)'

// Interval cadence — pinned (TDD). The idle interval appends one block + drifts FX.
const BLOCK_INTERVAL_MS = 2500
// Packet spawn cadence along the rails (driven by the rAF loop's frame counter).
const PACKET_SPAWN_FRAMES = 90 // ~1.5s @ 60fps
// Rail packet caps (AC 3.1 perf — capped element count).
const MAX_PACKETS_DESKTOP = 6
const MAX_PACKETS_MOBILE = 3
// Default packet speed (fraction of rail per ms).
const PACKET_SPEED = 0.00045 // ~2.2s end-to-end at 60fps baseline

// FX baseline + bounds (illustrative — NOT a real quote).
const FX_BASELINE_USD_CNY = 7.12
const FX_MIN_USD_CNY = 6.9
const FX_MAX_USD_CNY = 7.35
const FX_STEP_USD_CNY = 0.015
const FX_BASELINE_USD_THB = 35.4
const FX_MIN_USD_THB = 34.8
const FX_MAX_USD_THB = 36.1
const FX_STEP_USD_THB = 0.08

// Liquidity breathing curve (AC 1.3 "liquidity pulse"). Sin over period.
const LIQUIDITY_BASELINE = 62 // %
const LIQUIDITY_AMPLITUDE = 18 // %  (peak 80)
const LIQUIDITY_PERIOD_MS = 5200

// Initial genesis block height (looks like a live chain mid-flight).
const GENESIS_HEIGHT = 148800
const GENESIS_TX_COUNT = 142

// ---------------------------------------------------------------------------
// PURE: tickPacket — packet rail travel
// ---------------------------------------------------------------------------

/**
 * PURE. Advances a packet's progress along its rail.
 *   progress += speed * deltaMs
 * When progress >= 1 the packet has reached the far node and loops back to 0
 * (the rail is a perpetual stream). A deltaMs <= 0 is a no-op (no NaN).
 *
 * @param {number} progress   0..1 current position
 * @param {{speed: number, deltaMs: number}} opts
 * @returns {number}
 */
export function tickPacket(progress, opts) {
  const { speed, deltaMs } = opts
  if (!deltaMs || deltaMs <= 0) return progress
  const next = progress + speed * deltaMs
  if (next >= 1) return 0 // wrap -> settled (the caller flips a counter)
  return next
}

// ---------------------------------------------------------------------------
// PURE: nextBlock — append + hash-chain a settled block
// ---------------------------------------------------------------------------

/** tiny stable hash — deterministic given its inputs (NOT cryptographic). */
function shortHash(input) {
  // FNV-1a 32-bit, hex-formatted. Deterministic + dependency-free.
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  // Force positive 32-bit + hex.
  return (h >>> 0).toString(16).padStart(8, '0')
}

/**
 * PURE. Returns the next settled block given the previous block (or null for
 * the genesis). Height increments by 1; hash is derived from prev.hash + the
 * new height + txCount + ts so the chain is linked (changing ANY input changes
 * the hash).
 *
 * @param {Block|null} prev
 * @param {{txCount: number, now: number}} opts
 * @returns {Block}
 */
export function nextBlock(prev, opts) {
  const { txCount, now } = opts
  const height = prev ? prev.height + 1 : 1
  const prevHash = prev ? prev.hash : 'genesis'
  const hash = shortHash(`${prevHash}:${height}:${txCount}:${now}`)
  return { height, hash, txCount, ts: now }
}

// ---------------------------------------------------------------------------
// PURE: tickFx — bounded random walk for an FX rate
// ---------------------------------------------------------------------------

/**
 * PURE. Bounded random walk for an FX rate, mirroring tickMetric in
 * useOpsFeed. rng<0.5 -> down, >=0.5 -> up; clamped to [min,max].
 *
 * @param {number} current
 * @param {{min: number, max: number, step: number, rng?: () => number}} opts
 * @returns {number}
 */
export function tickFx(current, opts) {
  const { min, max, step } = opts
  const rng = opts.rng || Math.random
  const delta = (rng() - 0.5) * 2 * step
  return Math.max(min, Math.min(max, current + delta))
}

// ---------------------------------------------------------------------------
// PURE: liquidityPulse — the breathing curve
// ---------------------------------------------------------------------------

/**
 * PURE. The liquidity pool breathing value at `elapsedMs`. Sin curve centred
 * on baseline, peaking at baseline+amplitude at quarter-period.
 *   v = baseline + amplitude * sin(2*pi*elapsedMs/periodMs)  mapped to [0,1]
 * using (1 - cos)/2 so the curve starts at baseline (t=0), rises to peak at
 * half-period, and returns to baseline at full-period — never going BELOW
 * baseline (a pool does not go negative).
 *
 * @param {number} baseline
 * @param {number} amplitude
 * @param {number} periodMs
 * @param {number} elapsedMs
 * @returns {number}
 */
export function liquidityPulse(baseline, amplitude, periodMs, elapsedMs) {
  if (periodMs <= 0) return baseline
  const phase = (elapsedMs % periodMs) / periodMs // 0..1
  const wave = (1 - Math.cos(2 * Math.PI * phase)) / 2 // 0..1, starts at 0
  return baseline + amplitude * wave
}

// ---------------------------------------------------------------------------
// Rail catalog (China <-> ASEAN arcs). Keys map to settlementStream.nodes.*.
// ---------------------------------------------------------------------------

/**
 * The China-ASEAN rail catalog. Each rail is a directional arc; the stream
 * renders packets travelling along them. `id` is also the data-test hook.
 * @type {Rail[]}
 */
export const RAIL_IDS = [
  { id: 'china-thailand', fromLabel: 'settlementStream.nodes.china', toLabel: 'settlementStream.nodes.thailand', fromCurrency: 'CNY', toCurrency: 'THB' },
  { id: 'china-singapore', fromLabel: 'settlementStream.nodes.china', toLabel: 'settlementStream.nodes.singapore', fromCurrency: 'CNY', toCurrency: 'SGD' },
  { id: 'china-malaysia', fromLabel: 'settlementStream.nodes.china', toLabel: 'settlementStream.nodes.malaysia', fromCurrency: 'CNY', toCurrency: 'MYR' },
]

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------

export function useSettlementStream(opts = {}) {
  // --- observe target -----------------------------------------------------
  // AC 3.2 offscreen throttle: observe the stream's ROOT element (passed by
  // SettlementStream.vue), NOT document.body. document.body is always
  // intersecting the viewport while the page is rendered, so observing it made
  // the IO offscreen half of AC 3.2 a no-op in production (iter-23
  // wired-not-just-tested gap). Mirrors the useParallax({ rootRef }) pattern.
  // If rootRef is absent OR null at mount time (SSR / test / not yet bound),
  // we fall back to isVisible=true (never disappear forever) — same defensive
  // pattern as useIntersectionObserver.js.
  const rootRef = opts && opts.rootRef ? opts.rootRef : null
  // --- live state ---------------------------------------------------------
  const packets = ref([]) // Packet[]
  const latestBlock = ref(
    nextBlock(null, { txCount: GENESIS_TX_COUNT, now: 0 }),
  )
  // Seed the height up to the genesis baseline so the chain looks live.
  latestBlock.value = {
    height: GENESIS_HEIGHT,
    hash: latestBlock.value.hash,
    txCount: GENESIS_TX_COUNT,
    ts: Date.now(),
  }
  const blockHistory = ref([latestBlock.value]) // Block[] (capped)
  const settledCount = ref(0)
  const fxRates = ref([
    { pair: 'USD/CNY', rate: FX_BASELINE_USD_CNY, dir: 'up' },
    { pair: 'USD/THB', rate: FX_BASELINE_USD_THB, dir: 'down' },
  ])
  const liquidity = ref(LIQUIDITY_BASELINE)
  const reducedSummary = ref(null) // {blocks, fx, liquidity} snapshot under reduced motion

  // --- loop handles -------------------------------------------------------
  let rafHandle = null
  let intervalHandle = null
  let intersectionObs = null

  // --- visibility + motion flags -----------------------------------------
  const prefersReducedMotion = ref(false)
  const isMobile = ref(false)
  let isVisible = ref(true)
  let motionMq = null
  let mobileMq = null

  let packetIdSeq = 1
  let frameCounter = 0
  let loopStart = 0

  // =========================================================================
  // Helpers
  // =========================================================================

  function maxPackets() {
    return isMobile.value ? MAX_PACKETS_MOBILE : MAX_PACKETS_DESKTOP
  }

  function spawnPacket() {
    if (packets.value.length >= maxPackets()) return
    const rail = RAIL_IDS[Math.floor(Math.random() * RAIL_IDS.length)]
    packets.value = [
      ...packets.value,
      {
        id: packetIdSeq++,
        railId: rail.id,
        progress: 0,
        speed: PACKET_SPEED,
        settled: false,
      },
    ]
  }

  function appendBlock() {
    const txCount = 100 + Math.floor(Math.random() * 90) // 100..189 tx
    const blk = nextBlock(latestBlock.value, { txCount, now: Date.now() })
    latestBlock.value = blk
    blockHistory.value = [blk, ...blockHistory.value].slice(0, 6)
    settledCount.value += txCount
  }

  function driftFx() {
    const [cny, thb] = fxRates.value
    const cnyNext = tickFx(cny.rate, { min: FX_MIN_USD_CNY, max: FX_MAX_USD_CNY, step: FX_STEP_USD_CNY })
    const thbNext = tickFx(thb.rate, { min: FX_MIN_USD_THB, max: FX_MAX_USD_THB, step: FX_STEP_USD_THB })
    fxRates.value = [
      { pair: 'USD/CNY', rate: cnyNext, dir: cnyNext >= cny.rate ? 'up' : 'down' },
      { pair: 'USD/THB', rate: thbNext, dir: thbNext >= thb.rate ? 'up' : 'down' },
    ]
  }

  // =========================================================================
  // rAF loop — single shared animation driver (packets + liquidity)
  // =========================================================================

  // Re-entrancy + sync-rAF guards (mirror useOpsFeed).
  let inTick = false
  let scheduling = false
  let running = false

  function tick(now) {
    if (inTick) return
    inTick = true
    try {
      if (loopStart === 0) loopStart = now
      const last = tick._lastNow || now
      const deltaMs = Math.max(0, now - last)
      tick._lastNow = now

      // 1. Advance every packet along its rail (drives translateX render).
      if (!prefersReducedMotion.value) {
        let settledThisFrame = 0
        const next = packets.value.map((p) => {
          const wasBelow = p.progress < 1
          const np = tickPacket(p.progress, { speed: p.speed, deltaMs })
          // A wrap to 0 from a non-zero progress == a packet settled.
          if (wasBelow && np === 0 && p.progress > 0) settledThisFrame++
          return { ...p, progress: np }
        })
        packets.value = next
        if (settledThisFrame > 0) {
          // settledCount ticks per settled packet (the rail readout).
          settledCount.value += settledThisFrame
        }

        // 2. Spawn a new packet on the cadence (capped).
        frameCounter++
        if (frameCounter >= PACKET_SPAWN_FRAMES) {
          frameCounter = 0
          spawnPacket()
        }
      }

      // 3. Liquidity breathing (drives the pulse render).
      if (!prefersReducedMotion.value) {
        liquidity.value = liquidityPulse(LIQUIDITY_BASELINE, LIQUIDITY_AMPLITUDE, LIQUIDITY_PERIOD_MS, now - loopStart)
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
    loopStart = 0
    tick._lastNow = 0
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
  // Idle interval — append block + drift FX (low-motion under reduced motion)
  // =========================================================================

  function onInterval() {
    if (!isVisible.value) return
    appendBlock()
    driftFx()
  }

  function startInterval() {
    if (intervalHandle !== null) return
    intervalHandle = window.setInterval(onInterval, BLOCK_INTERVAL_MS)
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

  function snapshotReducedSummary() {
    reducedSummary.value = {
      blockHeight: latestBlock.value.height,
      blockHash: latestBlock.value.hash,
      fx: fxRates.value.map((f) => ({ pair: f.pair, rate: f.rate.toFixed(2) })),
      liquidity: liquidity.value.toFixed(0),
    }
  }

  function updateRunning() {
    const should = isVisible.value && !prefersReducedMotion.value
    if (should) {
      startRAF()
      startInterval()
    } else {
      stopRAF()
      // Under reduced motion KEEP the interval (story stays legible); under
      // hidden/offscreen stop EVERYTHING.
      if (!isVisible.value) stopInterval()
      if (prefersReducedMotion.value) {
        // Liquidity rests at baseline; render a static summary snapshot.
        liquidity.value = LIQUIDITY_BASELINE
        snapshotReducedSummary()
      }
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
  // Lifecycle
  // =========================================================================

  onMounted(() => {
    // Seed an initial packet so the stream is alive on first paint.
    spawnPacket()

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

      if (typeof window.IntersectionObserver !== 'undefined') {
        intersectionObs = new window.IntersectionObserver((entries) => {
          for (const entry of entries) {
            isVisible.value = entry.isIntersecting && (typeof document === 'undefined' || document.visibilityState !== 'hidden')
          }
          updateRunning()
        })
        // AC 3.2: observe the stream ROOT element (not document.body). If the
        // root ref is not yet bound, fall back to isVisible=true so the stream
        // never disappears forever (SSR / not-yet-mounted safety).
        const observeTarget = rootRef && rootRef.value ? rootRef.value : null
        if (observeTarget) {
          intersectionObs.observe(observeTarget)
        } else {
          isVisible.value = true
        }
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

  // =========================================================================
  // Computed (template consumers)
  // =========================================================================

  // The latest 6 blocks for the block-settlement column (drives the render).
  const recentBlocks = computed(() => blockHistory.value.slice(0, 6))

  return {
    // live state (every ref has a template consumer in SettlementStream.vue)
    packets,
    latestBlock,
    recentBlocks,
    settledCount,
    fxRates,
    liquidity,
    reducedSummary,
    prefersReducedMotion,
    isVisible,
    isMobile,
    // constants (also rendered: rail catalog + node labels)
    rails: RAIL_IDS,
  }
}
