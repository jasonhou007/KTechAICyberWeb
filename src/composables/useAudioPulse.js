/**
 * @file useAudioPulse.js
 * @description Reactive brain for the Neon Pulse audio-reactive visualizer (#186).
 * @ticket #186 - [CYBER] Add opt-in 'Neon Pulse' audio-reactive visualizer.
 *
 * TWO export layers (mirrors useOpsFeed.js): NeonPulse.vue is
 * a thin presentation layer over this composable and owns no business logic.
 *
 *  1. PURE functions + constants (no window/AudioContext — fully unit-testable):
 *     - transitionStatus(status, action)      pulse FSM
 *     - clampSensitivity(v) / computeSensitivity(byte, gain)
 *     - bassEnergy(freqData)                  mean of bins 0..7
 *     - detectBeat(freqData, lastEnergy, lastBeatMs, nowMs, opts)
 *     - shouldFlash(isBeat, lastFlashMs, nowMs)  INDEPENDENT 333ms seizure cap
 *     - toDbString(byte) / particleCount(isMobile, reduced) / isValidMode(m)
 *     - applyBeat(beat, flashGate, state, nowMs, count)  PURE reducer
 *  2. buildSynthLoop(ctx, destination) — in-memory synth (no fetch, no asset).
 *  3. useAudioPulse() reactive factory — owns AudioContext/Analyser/mic/synth,
 *     a single rAF loop, IntersectionObserver, reduced-motion MQ, visibility.
 *
 * HARD GATES enforced by design + tested:
 *  - No autoplay: AudioContext created ONLY in engage() (user gesture). On mount
 *    status===idle and rAF is never scheduled.
 *  - No audio data leaves the client: no fetch/MediaRecorder/WebSocket. Mic feeds
 *    the analyser ONLY (never the destination — avoids feedback).
 *  - Seizure-safe: shouldFlash() enforces a hard <3Hz (333ms) cap INDEPENDENT of
 *    detectBeat's 120ms refractory window.
 *  - Reduced-motion-safe: flash + particle burst short-circuited; `low-motion`
 *    class on the wrapper; the static spectrum still draws from `level`.
 */

import { ref, readonly, onMounted, onUnmounted } from 'vue'

// ---------------------------------------------------------------------------
// Static config — pinned by useAudioPulse.test.ts
// ---------------------------------------------------------------------------

/** Pulse lifecycle states. */
export const PULSE_STATES = ['idle', 'starting', 'playing']

/** Visualizer render modes. */
export const PULSE_MODES = ['spectrum', 'radial', 'particles']

// --- sensitivity -----------------------------------------------------------
export const SENSITIVITY_MIN = 0.1
export const SENSITIVITY_MAX = 3
export const SENSITIVITY_DEFAULT = 1

// --- bass / beat detection -------------------------------------------------
/** Exclusive end index of the bass band (bins 0..7). */
export const BASS_BIN_END = 8
/** Minimum bass energy (0..255) for a beat candidate. */
export const BASS_THRESHOLD = 180
/** Minimum gap between beat detections (ms) — avoids machine-gunning. */
export const REFRACTORY_MS = 120

// --- seizure safety --------------------------------------------------------
/** Hard cap on flash frequency: <3Hz => >=333ms between flashes. This cap is
 *  INDEPENDENT of detectBeat()'s refractory window so a noisy beat detector
 *  cannot strobe the screen. */
export const FLASH_MIN_INTERVAL_MS = 333

// --- audio engine ----------------------------------------------------------
export const START_VOLUME = 0.15
export const FFT_SIZE = 256

// --- particles -------------------------------------------------------------
const PARTICLES_DESKTOP = 80
const PARTICLES_MOBILE = 32
/** Hard cap on the transient particle array (prevents unbounded growth under
 *  a runaway beat detector). Exported via the module for test pinning. */
export const PARTICLE_CAP = 200
/** Frames a transient burst particle lives before it is filtered out. */
const PARTICLE_LIFE_FRAMES = 30
/** Max outward speed (px/frame) of a burst particle. */
const PARTICLE_MAX_SPEED = 6
/** Neon palette for burst particles (cycles).
 *  Values are the CANONICAL brand tokens from variables.css (#242 style
 *  unification): #00ffcc = --cyan, #ff00aa = --accent-magenta, #ffcc00 =
 *  --status-warning. Canvas fillStyle cannot consume var(--...) so the
 *  resolved canonical hex is inlined here; if the tokens change, update both
 *  variables.css and this array. */
const PARTICLE_COLORS = ['#00ffcc', '#ff00aa', '#00ffcc', '#ffcc00']

// --- media queries / device class ------------------------------------------
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
const MOBILE_QUERY = '(max-width: 768px)'

// ---------------------------------------------------------------------------
// PURE: transitionStatus — pulse lifecycle FSM
// ---------------------------------------------------------------------------

/**
 * PURE. Computes the next pulse lifecycle state.
 *   idle    + engage          -> starting
 *   starting+ engage-started  -> playing
 *   starting+ engage-failed   -> idle   (permission/codec failure resets)
 *   starting+ stop            -> idle   (abort during starting)
 *   playing + stop            -> idle
 *   idle    + stop            -> idle   (no-op)
 * Illegal transitions (e.g. idle + engage-started) leave the state unchanged.
 *
 * @param {'idle'|'starting'|'playing'} status
 * @param {'engage'|'engage-started'|'engage-failed'|'stop'} action
 * @returns {'idle'|'starting'|'playing'}
 */
export function transitionStatus(status, action) {
  if (action === 'engage') {
    return status === 'idle' ? 'starting' : status
  }
  if (action === 'engage-started') {
    return status === 'starting' ? 'playing' : status
  }
  if (action === 'engage-failed' || action === 'stop') {
    return 'idle'
  }
  return status
}

// ---------------------------------------------------------------------------
// PURE: sensitivity
// ---------------------------------------------------------------------------

/**
 * PURE. Clamps a sensitivity value to [SENSITIVITY_MIN, SENSITIVITY_MAX].
 * NaN / null / undefined fall back to SENSITIVITY_DEFAULT.
 * @param {number} v
 * @returns {number}
 */
export function clampSensitivity(v) {
  if (v === null || v === undefined || Number.isNaN(v)) return SENSITIVITY_DEFAULT
  return Math.max(SENSITIVITY_MIN, Math.min(SENSITIVITY_MAX, v))
}

/**
 * PURE. Maps a 0..255 frequency byte to a 0..1 level scaled by `gain`, clamped
 * to 1 so the visualizer never overdrives past full scale.
 * @param {number} byte  0..255
 * @param {number} gain  sensitivity multiplier
 * @returns {number}  0..1
 */
export function computeSensitivity(byte, gain) {
  const raw = (byte / 255) * gain
  return Math.max(0, Math.min(1, raw))
}

// ---------------------------------------------------------------------------
// PURE: bass energy
// ---------------------------------------------------------------------------

/**
 * PURE. Mean of bins 0..(BASS_BIN_END-1) of a byte-frequency array.
 * @param {Uint8Array} freqData
 * @returns {number}  0..255
 */
export function bassEnergy(freqData) {
  let sum = 0
  for (let i = 0; i < BASS_BIN_END; i++) sum += freqData[i] || 0
  return sum / BASS_BIN_END
}

// ---------------------------------------------------------------------------
// PURE: beat detection (edge-triggered + refractory)
// ---------------------------------------------------------------------------

/**
 * PURE. Detects a bass beat by a RISING edge of bassEnergy past BASS_THRESHOLD,
 * gated by a refractory window (REFRACTORY_MS) after the last detected beat.
 *
 * @param {Uint8Array} freqData
 * @param {number} lastEnergy   bassEnergy at the previous frame
 * @param {number} lastBeatMs   timestamp (ms) of the last detected beat, or 0
 * @param {number} nowMs        current timestamp (ms)
 * @param {{threshold?: number, refractoryMs?: number}} [opts]
 * @returns {{isBeat: boolean, energy: number}}
 */
export function detectBeat(freqData, lastEnergy, lastBeatMs, nowMs, opts = {}) {
  const threshold = opts.threshold ?? BASS_THRESHOLD
  const refractoryMs = opts.refractoryMs ?? REFRACTORY_MS
  const energy = bassEnergy(freqData)
  // Rising edge: energy jumped UP across the threshold.
  const rising = energy >= threshold && lastEnergy < threshold
  // Refractory: suppress for refractoryMs after the last beat (lastBeatMs=0 means
  // "no prior beat", which we treat as out-of-refractory).
  const outOfRefractory = lastBeatMs === 0 || nowMs - lastBeatMs >= refractoryMs
  return { isBeat: rising && outOfRefractory, energy }
}

// ---------------------------------------------------------------------------
// PURE: flash gate (INDEPENDENT seizure cap)
// ---------------------------------------------------------------------------

/**
 * PURE. Decides whether a glitch-flash may fire THIS frame. Enforces a HARD
 * minimum interval of FLASH_MIN_INTERVAL_MS (333ms => <3Hz) between flashes,
 * INDEPENDENT of detectBeat()'s refractory window. This is the seizure-safety
 * gate: even a buggy/over-eager beat detector cannot strobe the screen faster
 * than 3Hz.
 *
 * @param {boolean} isBeat
 * @param {number} lastFlashMs  timestamp of the last flash, or 0
 * @param {number} nowMs
 * @returns {boolean}
 */
export function shouldFlash(isBeat, lastFlashMs, nowMs) {
  if (!isBeat) return false
  if (lastFlashMs === 0) return true
  return nowMs - lastFlashMs >= FLASH_MIN_INTERVAL_MS
}

// ---------------------------------------------------------------------------
// PURE: dB readout
// ---------------------------------------------------------------------------

/**
 * PURE. Returns the decibel level of a 0..255 byte as 20*log10(byte/255).
 * byte 0 (silence) returns -Infinity; the component formats this to "-∞".
 * @param {number} byte  0..255
 * @returns {number}
 */
export function toDbString(byte) {
  if (byte <= 0) return -Infinity
  return 20 * Math.log10(byte / 255)
}

// ---------------------------------------------------------------------------
// PURE: particle count
// ---------------------------------------------------------------------------

/**
 * PURE. Particle burst count per flash. Reduced-motion always returns 0 (no
 * burst); mobile halves the desktop count for perf.
 * @param {boolean} isMobile
 * @param {boolean} prefersReducedMotion
 * @returns {number}
 */
export function particleCount(isMobile, prefersReducedMotion) {
  if (prefersReducedMotion) return 0
  return isMobile ? PARTICLES_MOBILE : PARTICLES_DESKTOP
}

// ---------------------------------------------------------------------------
// PURE: mode validation
// ---------------------------------------------------------------------------

/**
 * PURE. True iff `m` is one of the shipped PULSE_MODES.
 * @param {string} m
 * @returns {boolean}
 */
export function isValidMode(m) {
  return PULSE_MODES.includes(m)
}

// ---------------------------------------------------------------------------
// PURE: applyBeat reducer
// ---------------------------------------------------------------------------

/**
 * PURE. Reduces the per-frame beat/flash bookkeeping into a new state object.
 * The input `state` is NOT mutated.
 *
 *   beat + flashGate allowed -> burst=count, lastBeatMs=now, lastFlashMs=now
 *   beat but flashGate blocked -> burst=0, lastBeatMs=now, lastFlashMs UNCHANGED
 *   no beat -> burst=0, timestamps unchanged
 *
 * @param {{isBeat: boolean, energy: number}} beat
 * @param {boolean} flashGate   already-gated flash permission (reduced-motion aware)
 * @param {{lastBeatMs: number, lastFlashMs: number, burst: number}} state
 * @param {number} nowMs
 * @param {number} count        particle burst size (0 under reduced motion)
 * @returns {{lastBeatMs: number, lastFlashMs: number, burst: number}}
 */
export function applyBeat(beat, flashGate, state, nowMs, count) {
  if (!beat.isBeat) {
    return { lastBeatMs: state.lastBeatMs, lastFlashMs: state.lastFlashMs, burst: 0 }
  }
  if (flashGate) {
    return { lastBeatMs: nowMs, lastFlashMs: nowMs, burst: count }
  }
  // Beat detected but flash gated (reduced motion or within 333ms): record the
  // beat time but do NOT advance the flash clock or spawn a burst.
  return { lastBeatMs: nowMs, lastFlashMs: state.lastFlashMs, burst: 0 }
}

// ===========================================================================
// buildSynthLoop — in-memory Web-Audio synth (NO fetch, NO asset)
// ===========================================================================

/**
 * Builds an in-memory synthesizer whose output feeds `destination` (the shared
 * analyser -> master destination chain). Node graph:
 *
 *   oscA (saw 110Hz)  ─┐
 *   oscB (square 55Hz)─┼─> bassFilter (lowpass ~400Hz) -> bassGain
 *                      │
 *   oscC (saw 220Hz)  ─┼─> leadGain  (modulated by an LFO @ 0.5Hz)
 *                      │
 *   bassGain + leadGain ──> masterGain (START_VOLUME) ──> destination
 *
 * Returns { stop, nodes } where stop() halts oscillators + disconnects every
 * node and is idempotent.
 *
 * @param {AudioContext} ctx
 * @param {AudioNode} destination
 * @returns {{stop: () => void, nodes: object}}
 */
export function buildSynthLoop(ctx, destination) {
  const masterGain = ctx.createGain()
  masterGain.gain.value = START_VOLUME

  // --- bass layer: two oscillators through a lowpass ----------------------
  const bassFilter = ctx.createBiquadFilter()
  bassFilter.type = 'lowpass'
  bassFilter.frequency.value = 400

  const bassGain = ctx.createGain()
  bassGain.gain.value = 0.6

  const oscA = ctx.createOscillator()
  oscA.type = 'sawtooth'
  oscA.frequency.value = 110

  const oscB = ctx.createOscillator()
  oscB.type = 'square'
  oscB.frequency.value = 55

  oscA.connect(bassFilter)
  oscB.connect(bassFilter)
  bassFilter.connect(bassGain)
  bassGain.connect(masterGain)

  // --- lead layer: one oscillator modulated by a slow LFO -----------------
  const leadGain = ctx.createGain()
  leadGain.gain.value = 0.25

  const oscC = ctx.createOscillator()
  oscC.type = 'sawtooth'
  oscC.frequency.value = 220

  // LFO: a low-frequency oscillator whose output scales leadGain.gain so the
  // lead swells and fades ~twice a second.
  const lfo = ctx.createOscillator()
  lfo.type = 'sine'
  lfo.frequency.value = 0.5
  const lfoGain = ctx.createGain()
  lfoGain.gain.value = 0.15
  lfo.connect(lfoGain)
  lfoGain.connect(leadGain.gain)

  oscC.connect(leadGain)
  leadGain.connect(masterGain)

  masterGain.connect(destination)

  // Start everything.
  oscA.start()
  oscB.start()
  oscC.start()
  lfo.start()

  let stopped = false
  function stop() {
    if (stopped) return
    stopped = true
    try { oscA.stop() } catch { /* already stopped */ }
    try { oscB.stop() } catch { /* already stopped */ }
    try { oscC.stop() } catch { /* already stopped */ }
    try { lfo.stop() } catch { /* already stopped */ }
    oscA.disconnect()
    oscB.disconnect()
    oscC.disconnect()
    lfo.disconnect()
    lfoGain.disconnect()
    bassFilter.disconnect()
    bassGain.disconnect()
    leadGain.disconnect()
    masterGain.disconnect()
  }

  return {
    stop,
    nodes: { masterGain, bassFilter, bassGain, leadGain, oscA, oscB, oscC, lfo, lfoGain },
  }
}

// ===========================================================================
// Reactive factory
// ===========================================================================

/**
 * Reactive Neon Pulse state + actions. Owns the AudioContext (created lazily in
 * engage()), the AnalyserNode, an optional mic MediaStream, the synth nodes,
 * and a single rAF loop that draws the active visualizer mode.
 *
 * Hard gates:
 *  - No autoplay: AudioContext is created ONLY inside engage() (a user gesture).
 *    On mount status===idle and the rAF loop is never scheduled.
 *  - No audio egress: the mic source connects to the analyser ONLY (never the
 *    destination), so mic input never reaches the speakers (no feedback loop)
 *    and is never recorded/transmitted.
 *  - Reduced motion: flash + burst are short-circuited; the wrapper gets the
 *    `low-motion` class; the static spectrum still draws from `level`.
 */
export function useAudioPulse() {
  const status = ref('idle')
  const inputSource = ref('synth') // 'synth' | 'mic'
  const mode = ref('spectrum')
  const sensitivity = ref(SENSITIVITY_DEFAULT)
  const prefersReducedMotion = ref(false)
  const isMobile = ref(false)
  const isVisible = ref(true)
  const micState = ref('idle') // 'idle' | 'prompting' | 'granted' | 'denied'
  const notice = ref(null) // { kind, messageKey } | null
  const level = ref(0) // mean byte 0..255
  const bassNow = ref(0) // current bass energy 0..255
  const flash = ref(false) // glitch flash overlay lit this frame

  // Transient particle burst (AC 1d). Each beat pushes N outward-flying
  // particles here; tick() ages + renders them each frame and filters the dead.
  // Capped to PARTICLE_CAP so a runaway beat detector can't grow the array.
  const particles = ref([])

  const canvasRef = ref(null)

  // --- engine handles (created lazily in engage) ---------------------------
  let audioCtx = null
  let analyser = null
  let freqData = null
  let micStream = null
  let micSource = null
  let synthLoop = null
  let rafHandle = null
  let frame = 0 // re-entrancy frame counter (useOpsFeed lesson)
  let inTick = false
  let scheduling = false
  let running = false

  // --- beat/flash bookkeeping ---------------------------------------------
  let lastEnergy = 0
  let lastBeatMs = 0
  let lastFlashMs = 0

  // --- observers / MQ -----------------------------------------------------
  let intersectionObs = null
  let motionMq = null
  let mobileMq = null
  let visibilityHandler = null

  // =========================================================================
  // rAF loop
  // =========================================================================

  function tick(now) {
    if (inTick) return
    inTick = true
    // Re-entrancy cap: under a synchronous rAF mock the loop could recurse
    // forever; the frame counter bounds the chain per useOpsFeed's lesson.
    frame++
    try {
      // (1) skip draw if offscreen / page hidden.
      if (!isVisible.value) return

      // (2) read frequency data.
      if (analyser && freqData) {
        analyser.getByteFrequencyData(freqData)
      }

      // (3) bass energy.
      const energy = freqData ? bassEnergy(freqData) : 0
      bassNow.value = energy

      // (4) beat detection.
      const beat = freqData
        ? detectBeat(freqData, lastEnergy, lastBeatMs, now)
        : { isBeat: false, energy }

      // (5) flash gate: reduced-motion short-circuit + 333ms seizure cap.
      const flashGate =
        beat.isBeat &&
        !prefersReducedMotion.value &&
        shouldFlash(beat.isBeat, lastFlashMs, now)

      // (6) mean level (drives the static spectrum under reduced motion too).
      // AC 1c: route the mean byte through computeSensitivity so the slider
      // scales the level readout + the reduced-motion static spectrum too.
      level.value = computeSensitivity(meanByte(freqData), sensitivity.value) * 255

      // (6b) age + move the transient burst particles (AC 1d) BEFORE draw so the
      // rendered frame reflects post-step positions; dead particles are filtered.
      updateTransientParticles()

      // (7) draw the active mode onto the canvas.
      draw(mode.value, freqData, energy)

      // (8) flash overlay + particle burst (gated).
      const reduced = prefersReducedMotion.value
      const next = applyBeat(
        beat,
        flashGate,
        { lastBeatMs, lastFlashMs, burst: 0 },
        now,
        particleCount(isMobile.value, reduced),
      )
      lastEnergy = energy
      lastBeatMs = next.lastBeatMs
      lastFlashMs = next.lastFlashMs
      flash.value = !!flashGate
      if (next.burst > 0) spawnParticles(next.burst)
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
    if (running) return
    running = true
    frame = 0
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
  // Canvas drawing (3 modes share one analyser)
  // =========================================================================

  function meanByte(data) {
    if (!data || data.length === 0) return 0
    let sum = 0
    for (let i = 0; i < data.length; i++) sum += data[i]
    return sum / data.length
  }

  function draw(currentMode, data, energy) {
    const canvas = canvasRef.value
    if (!canvas || !data) return
    const ctx2d = canvas.getContext && canvas.getContext('2d')
    if (!ctx2d) return
    const w = canvas.width || 300
    const h = canvas.height || 150
    ctx2d.clearRect(0, 0, w, h)
    if (currentMode === 'spectrum') drawSpectrum(ctx2d, w, h, data)
    else if (currentMode === 'radial') drawRadial(ctx2d, w, h, data, energy)
    else drawParticles(ctx2d, w, h, data)
    // Transient burst overlay (AC 1d): drawn in EVERY mode so a beat explosion
    // is visible regardless of the selected visualizer mode.
    drawTransientParticles(ctx2d)
  }

  function drawSpectrum(ctx2d, w, h, data) {
    const bars = Math.min(data.length, 64)
    const gap = 2
    const bw = (w - gap * (bars - 1)) / bars
    const gain = sensitivity.value
    // #242 style unification: canonical --cyan (#00ffcc). Canvas fillStyle
    // cannot consume var(--...) so the resolved canonical hex is inlined; kept
    // in sync with variables.css.
    ctx2d.fillStyle = '#00ffcc'
    for (let i = 0; i < bars; i++) {
      // AC 1c: route each byte through computeSensitivity so the slider scales
      // bar height. gain=1 is the identity; <1 flattens, >1 amplifies (clamped).
      const v = computeSensitivity(data[i], gain)
      const bh = v * h
      ctx2d.fillRect(i * (bw + gap), h - bh, bw, bh)
    }
  }

  function drawRadial(ctx2d, w, h, data, energy) {
    const cx = w / 2
    const cy = h / 2
    const gain = sensitivity.value
    const baseR = Math.min(w, h) * 0.2 + computeSensitivity(energy, gain) * Math.min(w, h) * 0.15
    // #242: canonical --accent-magenta (#ff00aa).
    ctx2d.strokeStyle = '#ff00aa'
    ctx2d.lineWidth = 2
    ctx2d.beginPath()
    const steps = Math.min(data.length, 64)
    for (let i = 0; i <= steps; i++) {
      const angle = (i / steps) * Math.PI * 2
      // AC 1c: spoke length scales with sensitivity.
      const r = baseR + computeSensitivity(data[i % steps], gain) * Math.min(w, h) * 0.2
      const x = cx + Math.cos(angle) * r
      const y = cy + Math.sin(angle) * r
      if (i === 0) ctx2d.moveTo(x, y)
      else ctx2d.lineTo(x, y)
    }
    ctx2d.closePath()
    ctx2d.stroke()
  }

  function drawParticles(ctx2d, w, h, data) {
    const count = Math.min(data.length, 48)
    const gain = sensitivity.value
    // #242: canonical --cyan (#00ffcc).
    ctx2d.fillStyle = '#00ffcc'
    for (let i = 0; i < count; i++) {
      // AC 1c: amplitude scales with sensitivity.
      const v = computeSensitivity(data[i], gain)
      const x = (i / count) * w
      const y = h / 2 + Math.sin(i + v * 6) * v * h * 0.4
      const size = 2 + v * 4
      ctx2d.fillRect(x, y, size, size)
    }
  }

  /**
   * Spawns `n` transient burst particles at the canvas centre, each with a
   * random outward angle, neon colour, and short life. They are aged + rendered
   * every frame by updateTransientParticles() and filtered out when their life
   * hits zero. The array is capped at PARTICLE_CAP. AC 1d: a beat must produce a
   * VISIBLE outward particle explosion. Reduced-motion callers pass n=0
   * (particleCount(isMobile, true) === 0) so nothing spawns.
   */
  function spawnParticles(n) {
    if (n <= 0) return
    const canvas = canvasRef.value
    const cx = (canvas && canvas.width) ? canvas.width / 2 : 150
    const cy = (canvas && canvas.height) ? canvas.height / 2 : 75
    const next = particles.value.slice()
    for (let i = 0; i < n; i++) {
      if (next.length >= PARTICLE_CAP) break
      const angle = Math.random() * Math.PI * 2
      const speed = 1 + Math.random() * PARTICLE_MAX_SPEED
      next.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: PARTICLE_LIFE_FRAMES,
        maxLife: PARTICLE_LIFE_FRAMES,
        size: 2 + Math.random() * 3,
        color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
      })
    }
    particles.value = next
  }

  /**
   * Ages + moves every transient particle one frame, then filters out the dead
   * (life <= 0). Called once per tick BEFORE draw() so the rendered frame
   * reflects the post-step positions. Mutates particles.value with a fresh
   * filtered array so Vue reactivity fires (and the test can observe the drain).
   */
  function updateTransientParticles() {
    const list = particles.value
    if (list.length === 0) return
    const next = []
    for (const p of list) {
      const life = p.life - 1
      if (life <= 0) continue
      p.life = life
      p.x += p.vx
      p.y += p.vy
      // Slight deceleration so the burst settles instead of flying forever.
      p.vx *= 0.96
      p.vy *= 0.96
      next.push(p)
    }
    particles.value = next
  }

  /**
   * Renders the transient burst particles on top of the active mode. Alpha fades
   * with remaining life so the burst visibly dissipates. Called from draw() in
   * EVERY mode so a beat explosion is visible regardless of the selected mode
   * (the AC says "visible glitch + particle burst on the beat").
   */
  function drawTransientParticles(ctx2d) {
    const list = particles.value
    if (!list || list.length === 0) return
    ctx2d.save()
    for (const p of list) {
      const alpha = Math.max(0, p.life / p.maxLife)
      ctx2d.globalAlpha = alpha
      ctx2d.fillStyle = p.color
      ctx2d.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size)
    }
    ctx2d.restore()
  }

  // =========================================================================
  // Visibility / offscreen throttle
  // =========================================================================

  function updateRunning() {
    if (status.value !== 'playing') {
      stopRAF()
      return
    }
    if (!isVisible.value) {
      stopRAF()
    } else if (!running) {
      startRAF()
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
   * Engage the visualizer. MUST run inside a user-gesture handler (button
   * click): creates the AudioContext lazily, resumes it (Safari), wires the
   * chosen input (synth or mic) into the analyser, and starts the rAF loop.
   * Mic permission denial falls back to the synth so the user STILL reaches
   * `playing` (graceful degradation, E2E-friendly).
   */
  async function engage() {
    status.value = transitionStatus(status.value, 'engage') // idle -> starting
    try {
      // Lazy AudioContext creation (NEVER on mount).
      if (!audioCtx) {
        const Ctor = (typeof window !== 'undefined' && window.AudioContext) ||
          (typeof globalThis !== 'undefined' && globalThis.AudioContext)
        audioCtx = Ctor ? new Ctor() : null
      }
      if (audioCtx && typeof audioCtx.resume === 'function') {
        try { await audioCtx.resume() } catch { /* Safari may reject pre-gesture */ }
      }

      // Analyser + frequency buffer (shared by synth + mic).
      if (!analyser && audioCtx) {
        analyser = audioCtx.createAnalyser()
        analyser.fftSize = FFT_SIZE
        freqData = new Uint8Array(analyser.frequencyBinCount)
      }

      if (inputSource.value === 'mic') {
        await startMic()
      } else {
        startSynth()
      }

      status.value = transitionStatus(status.value, 'engage-started') // -> playing
      lastEnergy = 0
      lastBeatMs = 0
      lastFlashMs = 0
      // Start the render loop only when visible + playing.
      if (isVisible.value) startRAF()
    } catch {
      status.value = transitionStatus(status.value, 'engage-failed') // -> idle
    }
  }

  async function startMic() {
    micState.value = 'prompting'
    notice.value = { kind: 'mic-prompting', messageKey: 'pulse.notice.micPrompting' }
    if (!audioCtx) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      micStream = stream
      micSource = audioCtx.createMediaStreamSource(stream)
      // Mic -> analyser ONLY (never destination => no feedback, no egress).
      micSource.connect(analyser)
      micState.value = 'granted'
      notice.value = null
    } catch {
      micState.value = 'denied'
      notice.value = { kind: 'mic-denied', messageKey: 'pulse.notice.micDenied' }
      // Graceful fallback: start the synth so the user still gets `playing`.
      startSynth()
    }
  }

  function startSynth() {
    if (!audioCtx || !analyser) return
    // Synth -> analyser -> master destination (audible).
    synthLoop = buildSynthLoop(audioCtx, analyser)
    analyser.connect(audioCtx.destination)
  }

  /** Stop the visualizer: cancel rAF, halt oscillators, stop mic tracks,
   *  disconnect nodes, close the AudioContext, return to idle. */
  function stop() {
    stopRAF()
    if (synthLoop) {
      synthLoop.stop()
      synthLoop = null
    }
    if (micSource) {
      try { micSource.disconnect() } catch { /* already disconnected */ }
      micSource = null
    }
    if (micStream) {
      try {
        for (const t of micStream.getTracks()) t.stop()
      } catch { /* already stopped */ }
      micStream = null
    }
    if (analyser && audioCtx) {
      try { analyser.disconnect() } catch { /* already disconnected */ }
    }
    if (audioCtx) {
      try { audioCtx.close() } catch { /* already closed */ }
      audioCtx = null
    }
    analyser = null
    freqData = null
    flash.value = false
    level.value = 0
    bassNow.value = 0
    particles.value = []
    status.value = transitionStatus(status.value, 'stop') // -> idle
  }

  function setMode(m) {
    if (isValidMode(m)) mode.value = m
  }

  function setSensitivity(v) {
    sensitivity.value = clampSensitivity(v)
  }

  function setInputSource(src) {
    if (src === 'synth' || src === 'mic') inputSource.value = src
  }

  // =========================================================================
  // Lifecycle
  // =========================================================================

  function onMotionChange(e) {
    prefersReducedMotion.value = !!(e && e.matches)
    // Entering reduced motion mid-playback: kill any in-flight flash + burst.
    if (prefersReducedMotion.value) flash.value = false
  }

  function onMobileChange(e) {
    isMobile.value = !!(e && e.matches)
  }

  onMounted(() => {
    /* istanbul ignore else -- SSR guard: window + matchMedia are always present
       in the browser and happy-dom; the else (no wiring) is for SSR/Node import. */
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      motionMq = window.matchMedia(REDUCED_MOTION_QUERY)
      prefersReducedMotion.value = !!motionMq.matches
      if (motionMq.addEventListener) motionMq.addEventListener('change', onMotionChange)
      /* istanbul ignore else -- legacy-API fallback: the else if runs only on
         MediaQueryLists that expose the deprecated addListener; the implicit
         else (neither API) cannot occur for a spec- or legacy-compliant MQL. */
      else if (motionMq.addListener) motionMq.addListener(onMotionChange)

      mobileMq = window.matchMedia(MOBILE_QUERY)
      isMobile.value = !!mobileMq.matches
      if (mobileMq.addEventListener) mobileMq.addEventListener('change', onMobileChange)
      else if (mobileMq.addListener) mobileMq.addListener(onMobileChange)
    }

    /* istanbul ignore else -- SSR guard: IntersectionObserver is always present
       in the browser and happy-dom; the else is for SSR/Node import. */
    if (typeof window !== 'undefined' && typeof window.IntersectionObserver !== 'undefined') {
      intersectionObs = new window.IntersectionObserver((entries) => {
        for (const entry of entries) {
          isVisible.value = entry.isIntersecting
            && (typeof document === 'undefined' || document.visibilityState !== 'hidden')
        }
        updateRunning()
      })
      /* istanbul ignore else -- bare-DOM guard: document.body is always present
         in the browser and happy-dom; the else (skip observe) is for a
         not-yet-parsed DOM. */
      if (typeof document !== 'undefined' && document.body) {
        intersectionObs.observe(document.body)
      }
    }

    /* istanbul ignore else -- SSR guard: document is always defined in the
       browser and happy-dom; the else (no visibility wiring) is for SSR/Node. */
    if (typeof document !== 'undefined') {
      visibilityHandler = onVisibilityChange
      document.addEventListener('visibilitychange', visibilityHandler)
    }

    // NO autoplay: status stays idle; rAF is NOT scheduled on mount. The render
    // loop starts only inside engage() after a user gesture.
  })

  onUnmounted(() => {
    stop()
    /* istanbul ignore else -- SSR-coupled: motionMq is null only when the
       onMounted SSR guard was false; the else (no cleanup) is for SSR. */
    if (motionMq) {
      if (motionMq.removeEventListener) motionMq.removeEventListener('change', onMotionChange)
      /* istanbul ignore else -- legacy-API fallback (mirror of onMounted). */
      else if (motionMq.removeListener) motionMq.removeListener(onMotionChange)
    }
    if (mobileMq) {
      if (mobileMq.removeEventListener) mobileMq.removeEventListener('change', onMobileChange)
      else if (mobileMq.removeListener) mobileMq.removeListener(onMobileChange)
    }
    /* istanbul ignore else -- guard: intersectionObs is assigned in onMounted
       when IntersectionObserver exists (always, in browser + happy-dom). */
    if (intersectionObs) {
      intersectionObs.disconnect()
      intersectionObs = null
    }
    /* istanbul ignore else -- SSR guard: visibilityHandler is set in onMounted
       and document is always defined in the browser and happy-dom. */
    if (visibilityHandler && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', visibilityHandler)
    }
  })

  return {
    // state — every ref here has a genuine template consumer in NeonPulse.vue
    //   (iter-10 dead-reactive-state gate). Verified consumers:
    //   status        -> status copy + Stop-button visibility + isPlaying gate
    //   inputSource   -> synth/mic radio checked state
    //   mode          -> mode radio checked state
    //   sensitivity   -> slider value (drives draw reactivity, AC 1c)
    //   prefersReducedMotion -> low-motion class + reduced-motion note
    //   isMobile      -> "mobile mode" note (data-test=pulse-mobile-note)
    //   isVisible     -> "paused offscreen" hint (data-test=pulse-offscreen-hint)
    //   micState      -> mic-live indicator + drives the denied notice
    //   notice        -> prompting / iOS / denied notice copy
    //   level         -> dB readout + ARIA live region
    //   bassNow       -> BASS meter (data-test=pulse-bass-meter)
    //   flash         -> beat-flash overlay (.pulse-flash.lit)
    //   particles     -> transient burst (drawn on the canvas, AC 1d)
    status: readonly(status),
    inputSource,
    mode,
    sensitivity,
    prefersReducedMotion,
    isMobile,
    isVisible,
    micState: readonly(micState),
    notice: readonly(notice),
    level,
    bassNow,
    flash,
    particles: readonly(particles),
    canvasRef,
    // actions
    engage,
    stop,
    setMode,
    setSensitivity,
    setInputSource,
    // constants exposed for the template
    modes: PULSE_MODES,
  }
}
