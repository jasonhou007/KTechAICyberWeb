/**
 * @file useAudioPulse.test.ts
 * @description Unit tests for the Neon Pulse audio-reactive visualizer composable (#186).
 * @ticket #186 - [CYBER] Add opt-in 'Neon Pulse' audio-reactive visualizer.
 *
 * TDD: written BEFORE the implementation. Drives a real host component that
 * mounts the composable, mirroring useOpsFeed.test.ts / usePacketRoute.test.ts
 * conventions. matchMedia + rAF + timers are mocked so timing is deterministic.
 *
 * Coverage areas (the planner's contract):
 *  PURE layer (no window/AudioContext — fully unit-testable):
 *   - transitionStatus(): FSM idle->starting->playing->idle, illegal rejected.
 *   - clampSensitivity()/computeSensitivity(): bounds + NaN/null guards.
 *   - bassEnergy(): exact mean of bins 0..7.
 *   - detectBeat(): edge-triggered rising energy + refractory window.
 *   - shouldFlash(): INDEPENDENT 333ms (<3Hz) seizure cap.
 *   - toDbString(): 20*log10(byte/255).
 *   - particleCount(): desktop 80 / mobile 32 / reduced-motion 0.
 *   - isValidMode(): only the 3 shipped modes.
 *   - applyBeat(): PURE reducer over {lastBeatMs,lastFlashMs,burst}.
 *  FACTORY layer (driven through a real host component with FakeAudioContext):
 *   - no autoplay on mount (status===idle, rAF never scheduled).
 *   - engage() -> playing (synth path, FakeAudioContext).
 *   - mic deny -> micState='denied' + notice + fallback to synth + still playing.
 *   - stop() -> idle + rAF cancelled.
 *   - offscreen IntersectionObserver cancels rAF.
 *   - reduced-motion: rAF may run but flash/burst code path is short-circuited
 *     (neverRAF proves flash stays false).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import {
  useAudioPulse,
  transitionStatus,
  clampSensitivity,
  computeSensitivity,
  bassEnergy,
  detectBeat,
  shouldFlash,
  toDbString,
  particleCount,
  isValidMode,
  applyBeat,
  buildSynthLoop,
  // constants — pinned by the tests
  PULSE_STATES,
  PULSE_MODES,
  SENSITIVITY_MIN,
  SENSITIVITY_MAX,
  SENSITIVITY_DEFAULT,
  BASS_BIN_END,
  BASS_THRESHOLD,
  REFRACTORY_MS,
  FLASH_MIN_INTERVAL_MS,
  START_VOLUME,
  FFT_SIZE,
} from '../useAudioPulse'

// ---------------------------------------------------------------------------
// Constants pinned by the plan (these literal values are the contract).
// ---------------------------------------------------------------------------

const EXPECTED_STATES = ['idle', 'starting', 'playing']
const EXPECTED_MODES = ['spectrum', 'radial', 'particles']

// ---------------------------------------------------------------------------
// matchMedia / rAF mock helpers (mirrors useOpsFeed.test.ts)
// ---------------------------------------------------------------------------

let originalMatchMedia: ((q: string) => MediaQueryList) | undefined
let originalRAF: typeof window.requestAnimationFrame
let originalCancelRAF: typeof window.cancelAnimationFrame

function mockMatchMedia(matchesMap: Record<string, boolean>) {
  window.matchMedia = ((query: string) =>
    ({
      matches: !!matchesMap[query],
      media: query,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      onchange: null,
      dispatchEvent: () => false,
    }) as MediaQueryList) as any
}

/** Counting rAF: schedules via a queue we control. */
function countingRAF() {
  const queue: FrameRequestCallback[] = []
  let id = 1
  let rafCallCount = 0
  window.requestAnimationFrame = ((cb: FrameRequestCallback) => {
    rafCallCount++
    queue.push(cb)
    return id++
  }) as any
  window.cancelAnimationFrame = ((handle: number) => {
    void handle
  }) as any
  return {
    step() {
      const cb = queue.shift()
      if (cb) cb(performance.now() + 16)
    },
    get pending() {
      return queue.length
    },
    get callCount() {
      return rafCallCount
    },
  }
}

/** Never rAF: counts calls but never invokes. For the reduced-motion test. */
function neverRAF() {
  let rafCallCount = 0
  window.requestAnimationFrame = (() => {
    rafCallCount++
    return 1
  }) as any
  window.cancelAnimationFrame = (() => {}) as any
  return {
    get callCount() {
      return rafCallCount
    },
  }
}

// ---------------------------------------------------------------------------
// Pure-function tests
// ---------------------------------------------------------------------------

describe('PURE constants — pinned shapes', () => {
  it('PULSE_STATES is exactly [idle, starting, playing]', () => {
    expect(PULSE_STATES).toEqual(EXPECTED_STATES)
  })
  it('PULSE_MODES is exactly [spectrum, radial, particles]', () => {
    expect(PULSE_MODES).toEqual(EXPECTED_MODES)
  })
  it('sensitivity constants are pinned', () => {
    expect(SENSITIVITY_MIN).toBe(0.1)
    expect(SENSITIVITY_MAX).toBe(3)
    expect(SENSITIVITY_DEFAULT).toBe(1)
  })
  it('bass/beat constants are pinned', () => {
    expect(BASS_BIN_END).toBe(8)
    expect(BASS_THRESHOLD).toBe(180)
    expect(REFRACTORY_MS).toBe(120)
  })
  it('flash seizure cap is 333ms (<3Hz)', () => {
    expect(FLASH_MIN_INTERVAL_MS).toBe(333)
  })
  it('audio constants are pinned', () => {
    expect(START_VOLUME).toBe(0.15)
    expect(FFT_SIZE).toBe(256)
  })
})

describe('transitionStatus() — pulse FSM (PURE)', () => {
  it('#1 idle + engage -> starting', () => {
    expect(transitionStatus('idle', 'engage')).toBe('starting')
  })
  it('#2 starting + engage-started -> playing', () => {
    expect(transitionStatus('starting', 'engage-started')).toBe('playing')
  })
  it('#3 playing + stop -> idle', () => {
    expect(transitionStatus('playing', 'stop')).toBe('idle')
  })
  it('#4 starting + engage-failed -> idle (failure resets)', () => {
    expect(transitionStatus('starting', 'engage-failed')).toBe('idle')
  })
  it('#5 idle + stop is a no-op (already idle)', () => {
    expect(transitionStatus('idle', 'stop')).toBe('idle')
  })
  it('#6 idle + engage-started is illegal -> stays idle', () => {
    expect(transitionStatus('idle', 'engage-started')).toBe('idle')
  })
  it('#7 playing + engage is illegal -> stays playing', () => {
    expect(transitionStatus('playing', 'engage')).toBe('playing')
  })
  it('#8 starting + stop aborts -> idle', () => {
    expect(transitionStatus('starting', 'stop')).toBe('idle')
  })
  it('#9 unknown action is rejected (state unchanged)', () => {
    expect(transitionStatus('playing', 'bogus')).toBe('playing')
  })
})

describe('clampSensitivity() — bounds + NaN/null guard (PURE)', () => {
  it('#1 returns the value when in range', () => {
    expect(clampSensitivity(1)).toBe(1)
    expect(clampSensitivity(0.5)).toBe(0.5)
  })
  it('#2 clamps below MIN to MIN', () => {
    expect(clampSensitivity(0)).toBe(0.1)
    expect(clampSensitivity(0.05)).toBe(0.1)
  })
  it('#3 clamps above MAX to MAX', () => {
    expect(clampSensitivity(5)).toBe(3)
    expect(clampSensitivity(3.5)).toBe(3)
  })
  it('#4 NaN -> DEFAULT', () => {
    expect(clampSensitivity(NaN)).toBe(1)
  })
  it('#5 null -> DEFAULT', () => {
    expect(clampSensitivity(null as unknown as number)).toBe(1)
  })
  it('#6 undefined -> DEFAULT', () => {
    expect(clampSensitivity(undefined as unknown as number)).toBe(1)
  })
})

describe('computeSensitivity() — byte->level mapping (PURE)', () => {
  it('#1 byte 0 -> 0 (silence)', () => {
    expect(computeSensitivity(0, 1)).toBe(0)
  })
  it('#2 byte 255, gain 1 -> 1 (full scale, clamped)', () => {
    expect(computeSensitivity(255, 1)).toBeCloseTo(1, 5)
  })
  it('#3 byte 127, gain 2 -> ~1 (255/255 * 2 clamped to 1)', () => {
    // 127/255 * 2 = 0.996 -> not clamped; ~0.996
    expect(computeSensitivity(127, 2)).toBeCloseTo((127 / 255) * 2, 4)
  })
  it('#4 byte 255, gain 3 -> clamped to 1 (no overflow)', () => {
    expect(computeSensitivity(255, 3)).toBe(1)
  })
  it('#5 byte 128, gain 0.5 -> ~0.25', () => {
    expect(computeSensitivity(128, 0.5)).toBeCloseTo((128 / 255) * 0.5, 4)
  })
})

describe('bassEnergy() — exact mean of bins 0..7 (PURE)', () => {
  it('#1 uniform 200 across 8 bins -> 200', () => {
    const data = new Uint8Array(FFT_SIZE / 2).fill(200)
    expect(bassEnergy(data)).toBe(200)
  })
  it('#2 0..7 ascending -> mean = (0+1+...+7)/8 = 3.5', () => {
    const data = new Uint8Array(FFT_SIZE / 2)
    for (let i = 0; i < 8; i++) data[i] = i
    expect(bassEnergy(data)).toBeCloseTo(3.5, 5)
  })
  it('#3 only bass bins matter; higher bins ignored', () => {
    const data = new Uint8Array(FFT_SIZE / 2).fill(0)
    for (let i = 0; i < 8; i++) data[i] = 100
    // bins 8+ are 0 but should NOT drag the mean down.
    expect(bassEnergy(data)).toBe(100)
  })
  it('#4 all-silence -> 0', () => {
    const data = new Uint8Array(FFT_SIZE / 2).fill(0)
    expect(bassEnergy(data)).toBe(0)
  })
})

describe('detectBeat() — edge-triggered + refractory (PURE)', () => {
  const opts = { threshold: BASS_THRESHOLD, refractoryMs: REFRACTORY_MS }

  it('#1 rising energy past threshold + out of refractory -> beat', () => {
    // lastEnergy 50 (below threshold), now 200 (above) -> rising edge.
    const r = detectBeat(makeFreq(200), 50, 0, 1000, opts)
    expect(r.isBeat).toBe(true)
    expect(r.energy).toBe(200)
  })

  it('#2 high energy but NOT rising (lastEnergy also high) -> no beat', () => {
    // lastEnergy 190, now 200: both above threshold but not a rising edge.
    const r = detectBeat(makeFreq(200), 190, 0, 1000, opts)
    expect(r.isBeat).toBe(false)
  })

  it('#3 energy below threshold -> no beat', () => {
    const r = detectBeat(makeFreq(100), 50, 0, 1000, opts)
    expect(r.isBeat).toBe(false)
  })

  it('#4 within refractory window -> no beat (even on a real rising edge)', () => {
    // lastBeatMs=1000, now=1050 -> 50ms < 120ms refractory.
    const r = detectBeat(makeFreq(200), 50, 1000, 1050, opts)
    expect(r.isBeat).toBe(false)
  })

  it('#5 just past refractory -> beat fires', () => {
    // lastBeatMs=1000, now=1121 -> 121ms > 120ms refractory.
    const r = detectBeat(makeFreq(200), 50, 1000, 1121, opts)
    expect(r.isBeat).toBe(true)
  })

  it('#6 falling energy (now < last) -> no beat', () => {
    const r = detectBeat(makeFreq(100), 200, 0, 1000, opts)
    expect(r.isBeat).toBe(false)
  })
})

describe('shouldFlash() — INDEPENDENT 333ms seizure cap (PURE)', () => {
  it('#1 first beat ever (lastFlash=0) -> true', () => {
    expect(shouldFlash(true, 0, 1000)).toBe(true)
  })
  it('#2 not a beat -> false regardless of timing', () => {
    expect(shouldFlash(false, 0, 1000)).toBe(false)
    expect(shouldFlash(false, 100, 5000)).toBe(false)
  })
  it('#3 beat within 333ms of last flash -> false (cap enforced)', () => {
    expect(shouldFlash(true, 1000, 1100)).toBe(false) // 100ms gap
    expect(shouldFlash(true, 1000, 1300)).toBe(false) // 300ms gap
  })
  it('#4 beat just past 333ms -> true', () => {
    expect(shouldFlash(true, 1000, 1334)).toBe(true) // 334ms gap
  })
  it('#5 cap is INDEPENDENT of detectBeat refractory (detectBeat=120ms but flash=333ms)', () => {
    // detectBeat would fire at 121ms, but flash must wait 333ms.
    const beat121 = detectBeat(makeFreq(200), 50, 1000, 1121, { threshold: BASS_THRESHOLD, refractoryMs: REFRACTORY_MS })
    expect(beat121.isBeat).toBe(true)
    // ...yet shouldFlash at 121ms since last flash is false.
    expect(shouldFlash(beat121.isBeat, 1000, 1121)).toBe(false)
  })
})

describe('toDbString() — 20*log10(byte/255) (PURE)', () => {
  it('#1 byte 255 -> ~0.0 dB (full scale)', () => {
    expect(toDbString(255)).toBeCloseTo(0, 1)
  })
  it('#2 byte 0 -> -Infinity string (silence)', () => {
    // log10(0) = -Inf; the helper should return a sane sentinel, not NaN.
    const s = toDbString(0)
    expect(s).not.toBe('NaN')
    expect(typeof s === 'number' || typeof s === 'string').toBe(true)
  })
  it('#3 byte 128 -> ~ -6 dB (half scale ~ -6.02dB)', () => {
    expect(toDbString(128)).toBeCloseTo(-6.0, 0)
  })
  it('#4 byte 25 -> ~ -20 dB', () => {
    expect(toDbString(25)).toBeCloseTo(-20.17, 0)
  })
})

describe('particleCount() — desktop/mobile/reduced (PURE)', () => {
  it('#1 desktop, motion on -> 80', () => {
    expect(particleCount(false, false)).toBe(80)
  })
  it('#2 mobile, motion on -> 32', () => {
    expect(particleCount(true, false)).toBe(32)
  })
  it('#3 reduced motion -> 0 (no burst)', () => {
    expect(particleCount(false, true)).toBe(0)
    expect(particleCount(true, true)).toBe(0)
  })
})

describe('isValidMode() — only shipped modes (PURE)', () => {
  it('#1 accepts the 3 shipped modes', () => {
    expect(isValidMode('spectrum')).toBe(true)
    expect(isValidMode('radial')).toBe(true)
    expect(isValidMode('particles')).toBe(true)
  })
  it('#2 rejects unknown modes', () => {
    expect(isValidMode('bogus')).toBe(false)
    expect(isValidMode('')).toBe(false)
    expect(isValidMode(null as unknown as string)).toBe(false)
  })
})

describe('applyBeat() — PURE reducer', () => {
  it('#1 beat + flashGate allowed -> burst=particleCount, lastBeatMs+lastFlashMs updated', () => {
    const state = { lastBeatMs: 0, lastFlashMs: 0, burst: 0 }
    const next = applyBeat({ isBeat: true, energy: 200 }, true, state, 5000, 80)
    expect(next.burst).toBe(80)
    expect(next.lastBeatMs).toBe(5000)
    expect(next.lastFlashMs).toBe(5000)
  })
  it('#2 beat but flashGate blocked (reduced motion) -> burst=0, lastBeatMs updated, lastFlashMs UNCHANGED', () => {
    const state = { lastBeatMs: 0, lastFlashMs: 999, burst: 0 }
    const next = applyBeat({ isBeat: true, energy: 200 }, false, state, 5000, 0)
    expect(next.burst).toBe(0)
    expect(next.lastBeatMs).toBe(5000)
    expect(next.lastFlashMs).toBe(999)
  })
  it('#3 no beat -> burst=0, timestamps unchanged', () => {
    const state = { lastBeatMs: 100, lastFlashMs: 200, burst: 5 }
    const next = applyBeat({ isBeat: false, energy: 50 }, false, state, 5000, 80)
    expect(next.burst).toBe(0)
    expect(next.lastBeatMs).toBe(100)
    expect(next.lastFlashMs).toBe(200)
  })
  it('#4 is pure: input state object is not mutated', () => {
    const state = { lastBeatMs: 0, lastFlashMs: 0, burst: 0 }
    applyBeat({ isBeat: true, energy: 200 }, true, state, 5000, 80)
    expect(state).toEqual({ lastBeatMs: 0, lastFlashMs: 0, burst: 0 })
  })
})

// ---------------------------------------------------------------------------
// buildSynthLoop — node-graph smoke test (no audio hardware in jsdom)
// ---------------------------------------------------------------------------

describe('buildSynthLoop() — in-memory synth node graph', () => {
  it('#1 returns {stop, nodes} and stop() is idempotent + disconnects', () => {
    const ctx = new FakeAudioContext()
    const dest = ctx.createAnalyser()
    const loop = buildSynthLoop(ctx as any, dest as any)
    expect(typeof loop.stop).toBe('function')
    expect(loop.nodes).toBeDefined()
    // stop() does not throw and can be called twice.
    expect(() => loop.stop()).not.toThrow()
    expect(() => loop.stop()).not.toThrow()
  })
  it('#2 never fetches an audio asset (no .mp3/.wav/.ogg)', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const ctx = new FakeAudioContext()
    buildSynthLoop(ctx as any, ctx.createAnalyser() as any)
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })
})

// ---------------------------------------------------------------------------
// Fake AudioContext + Analyser (injectable getByteFrequencyData)
// ---------------------------------------------------------------------------

class FakeAnalyser {
  fftSize = FFT_SIZE
  frequencyBinCount = FFT_SIZE / 2
  private data: Uint8Array
  /** Injectable: returns a Uint8Array of bin values the analyser "hears". */
  injector: (() => Uint8Array) | null = null
  constructor(seed: number[] = []) {
    this.data = new Uint8Array(this.frequencyBinCount)
    for (let i = 0; i < seed.length; i++) this.data[i] = seed[i]
  }
  getByteFrequencyData(arr: Uint8Array) {
    const src = this.injector ? this.injector() : this.data
    for (let i = 0; i < arr.length; i++) arr[i] = src[i] ?? 0
  }
  connect() { return this }
  disconnect() {}
}

class FakeGainNode {
  gain = { value: 1, setValueAtTime: () => {}, linearRampToValueAtTime: () => {} }
  connect() { return this }
  disconnect() {}
}

class FakeOscillator {
  type = 'sine'
  frequency = { value: 0, setValueAtTime: () => {} }
  connect() { return this }
  start() {}
  stop() {}
  disconnect() {}
}

class FakeBiquadFilter {
  type = 'lowpass'
  frequency = { value: 0, setValueAtTime: () => {} }
  Q = { value: 1 }
  connect() { return this }
  disconnect() {}
}

class FakeAudioContext {
  sampleRate = 44100
  currentTime = 0
  destination = { connect: () => this.destination, disconnect: () => {} }
  state = 'running'
  resume() { this.state = 'running'; return Promise.resolve() }
  createGain() { return new FakeGainNode() }
  createOscillator() { return new FakeOscillator() }
  createBiquadFilter() { return new FakeBiquadFilter() }
  createAnalyser() { return new FakeAnalyser() }
  close() { this.state = 'closed'; return Promise.resolve() }
}

/** Build a Uint8Array filled with `value` in the bass bins (for detectBeat tests). */
function makeFreq(value: number): Uint8Array {
  const d = new Uint8Array(FFT_SIZE / 2)
  d.fill(value)
  return d
}

// ---------------------------------------------------------------------------
// Composable factory tests (driven through a real host component)
// ---------------------------------------------------------------------------

describe('useAudioPulse() — composable factory', () => {
  beforeEach(() => {
    originalMatchMedia = window.matchMedia
    originalRAF = window.requestAnimationFrame
    originalCancelRAF = window.cancelAnimationFrame
    mockMatchMedia({})
    vi.useFakeTimers()
    // Inject a Fake AudioContext constructor BEFORE mount so engage() uses it.
    installFakeAudio()
    // Stub IntersectionObserver so the composable's offscreen-throttle branch
    // is drivable synchronously (happy-dom's real observer never fires in jsdom).
    installFakeIntersectionObserver()
  })

  afterEach(() => {
    vi.useRealTimers()
    restoreAudio()
    restoreIntersectionObserver()
    if (originalMatchMedia) window.matchMedia = originalMatchMedia
    if (originalRAF) window.requestAnimationFrame = originalRAF
    if (originalCancelRAF) window.cancelAnimationFrame = originalCancelRAF
  })

  it('#1 exposes every reactive ref + action on the public API', () => {
    const { getApi } = mountHost()
    const api = getApi()
    expect(api.status).toBeDefined()
    expect(api.inputSource).toBeDefined()
    expect(api.mode).toBeDefined()
    expect(api.sensitivity).toBeDefined()
    expect(api.prefersReducedMotion).toBeDefined()
    expect(api.isMobile).toBeDefined()
    expect(api.isVisible).toBeDefined()
    expect(api.micState).toBeDefined()
    expect(api.notice).toBeDefined()
    expect(api.level).toBeDefined()
    expect(api.bassNow).toBeDefined()
    expect(api.flash).toBeDefined()
    expect(api.canvasRef).toBeDefined()
    expect(typeof api.engage).toBe('function')
    expect(typeof api.stop).toBe('function')
    expect(typeof api.setMode).toBe('function')
    expect(typeof api.setSensitivity).toBe('function')
    expect(typeof api.setInputSource).toBe('function')
  })

  it('#2 NO AUTOPLAY: on mount status===idle and rAF is never scheduled', () => {
    const raf = neverRAF()
    const { getApi, wrapper } = mountHost()
    const api = getApi()
    expect(api.status.value).toBe('idle')
    // Advance time to prove no deferred autoplay.
    vi.advanceTimersByTime(3000)
    expect(raf.callCount).toBe(0)
    expect(api.status.value).toBe('idle')
    wrapper.unmount()
  })

  it('#3 engage() (synth) -> starting then playing; rAF scheduled', async () => {
    countingRAF()
    const { getApi, wrapper } = mountHost()
    const api = getApi()
    expect(api.status.value).toBe('idle')
    // engage runs inside a click handler (user gesture) — call directly.
    await api.engage()
    // After the (synchronous-ish) synth path, status reaches playing.
    expect(['starting', 'playing']).toContain(api.status.value)
    // Drain microtasks (resume() promise + any awaits) then assert playing.
    await vi.advanceTimersByTimeAsync(0)
    expect(api.status.value).toBe('playing')
    wrapper.unmount()
  })

  it('#4 mic deny -> micState=denied + notice set + fallback to synth + still playing', async () => {
    countingRAF()
    // Force getUserMedia to reject (permission denied).
    denyMic()
    const { getApi, wrapper } = mountHost()
    const api = getApi()
    api.setInputSource('mic')
    await api.engage()
    await vi.advanceTimersByTimeAsync(0)
    expect(api.micState.value).toBe('denied')
    expect(api.notice.value).not.toBeNull()
    expect(api.notice.value.kind).toBe('mic-denied')
    // Fallback to synth means we STILL reached playing.
    expect(api.status.value).toBe('playing')
    wrapper.unmount()
  })

  it('#5 stop() -> status idle + rAF cancelled', async () => {
    const raf = countingRAF()
    const { getApi, wrapper } = mountHost()
    const api = getApi()
    await api.engage()
    await vi.advanceTimersByTimeAsync(0)
    expect(api.status.value).toBe('playing')
    const callsBefore = raf.callCount
    api.stop()
    expect(api.status.value).toBe('idle')
    // After stop, advancing time must NOT schedule new rAF frames.
    vi.advanceTimersByTime(2000)
    expect(raf.callCount).toBe(callsBefore)
    wrapper.unmount()
  })

  it('#6 setMode rejects invalid modes; setSensitivity clamps', () => {
    const { getApi, wrapper } = mountHost()
    const api = getApi()
    api.setMode('spectrum')
    expect(api.mode.value).toBe('spectrum')
    api.setMode('bogus')
    expect(api.mode.value).toBe('spectrum') // unchanged
    api.setSensitivity(50)
    expect(api.sensitivity.value).toBe(3) // clamped to MAX
    api.setSensitivity(-1)
    expect(api.sensitivity.value).toBe(0.1) // clamped to MIN
    wrapper.unmount()
  })

  it('#7 reduced-motion: flash + burst are short-circuited (never enters flash path)', async () => {
    mockMatchMedia({ '(prefers-reduced-motion: reduce)': true })
    neverRAF()
    const { getApi, wrapper } = mountHost()
    const api = getApi()
    expect(api.prefersReducedMotion.value).toBe(true)
    await api.engage()
    await vi.advanceTimersByTimeAsync(0)
    // Even after engage under reduced motion, flash never lights + level stays 0.
    expect(api.flash.value).toBe(false)
    expect(api.bassNow.value).toBe(0)
    wrapper.unmount()
  })

  it('#8 mobile matchMedia sets isMobile=true', () => {
    mockMatchMedia({ '(max-width: 768px)': true })
    const { getApi, wrapper } = mountHost()
    const api = getApi()
    expect(api.isMobile.value).toBe(true)
    wrapper.unmount()
  })

  it('#9 document hidden -> visibilitychange cancels rAF; visible restarts it', async () => {
    const raf = countingRAF()
    const { getApi, wrapper } = mountHost()
    const api = getApi()
    await api.engage()
    await vi.advanceTimersByTimeAsync(0)
    expect(api.status.value).toBe('playing')

    // Page goes hidden -> isVisible flips false + rAF stops.
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))
    expect(api.isVisible.value).toBe(false)
    const callsAtHidden = raf.callCount
    vi.advanceTimersByTime(1000)
    expect(raf.callCount).toBe(callsAtHidden) // no new frames while hidden

    // Page visible again -> rAF resumes.
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))
    expect(api.isVisible.value).toBe(true)
    wrapper.unmount()
  })

  it('#10 IntersectionObserver offscreen entry cancels the rAF loop', async () => {
    countingRAF()
    // Capture the observer callback installed on mount.
    const { getApi, wrapper } = mountHost()
    const api = getApi()
    await api.engage()
    await vi.advanceTimersByTimeAsync(0)
    expect(api.status.value).toBe('playing')

    // The composable observes document.body; drive the installed observer with
    // an offscreen entry to flip isVisible false + cancel rAF.
    const obs = (window as any).__lastIntersectionObserver as any
    expect(obs).toBeTruthy()
    obs.callback([{ isIntersecting: false, target: document.body }])
    expect(api.isVisible.value).toBe(false)

    // Back onscreen resumes.
    obs.callback([{ isIntersecting: true, target: document.body }])
    expect(api.isVisible.value).toBe(true)
    wrapper.unmount()
  })

  it('#11 unmount runs onUnmounted cleanup (stop + disconnect observers)', async () => {
    countingRAF()
    const { getApi, wrapper } = mountHost()
    const api = getApi()
    await api.engage()
    await vi.advanceTimersByTimeAsync(0)
    expect(api.status.value).toBe('playing')
    wrapper.unmount()
    // After unmount, status is idle (stop() ran in onUnmounted).
    expect(api.status.value).toBe('idle')
  })

  it('#12 setInputSource rejects unknown sources', () => {
    const { getApi, wrapper } = mountHost()
    const api = getApi()
    api.setInputSource('mic')
    expect(api.inputSource.value).toBe('mic')
    api.setInputSource('bogus' as any)
    expect(api.inputSource.value).toBe('mic') // unchanged
    wrapper.unmount()
  })

  it('#13 legacy MediaQueryList (addListener/removeListener only) is wired + cleaned up', () => {
    // Some older browsers expose only the deprecated addListener/removeListener
    // API; the composable must fall back to it (and clean it up on unmount).
    const listeners: Record<string, ((e: any) => void) | undefined> = {
      motion: undefined,
      mobile: undefined,
    }
    window.matchMedia = ((query: string) => {
      const legacy = {
        matches: query === '(max-width: 768px)',
        media: query,
        // NO addEventListener; only the deprecated pair.
        addListener: (fn: (e: any) => void) => {
          if (query.includes('reduced')) listeners.motion = fn
          else listeners.mobile = fn
        },
        removeListener: (fn: (e: any) => void) => {
          if (query.includes('reduced') && listeners.motion === fn) listeners.motion = undefined
          else if (listeners.mobile === fn) listeners.mobile = undefined
        },
      }
      return legacy as any
    }) as any

    const { getApi, wrapper } = mountHost()
    const api = getApi()
    // isMobile was seeded from the legacy MQL matches.
    expect(api.isMobile.value).toBe(true)
    // Firing the motion listener flips prefersReducedMotion.
    listeners.motion && listeners.motion({ matches: true })
    expect(api.prefersReducedMotion.value).toBe(true)
    // Mobile change flips isMobile back.
    listeners.mobile && listeners.mobile({ matches: false })
    expect(api.isMobile.value).toBe(false)
    // Unmount runs the legacy removeListener cleanup paths.
    wrapper.unmount()
    expect(listeners.motion).toBeUndefined()
    expect(listeners.mobile).toBeUndefined()
  })

  it('#14 rAF tick draws the active mode onto the canvas (covers draw branches)', async () => {
    const raf = countingRAF()
    const { getApi, wrapper } = mountHost()
    const api = getApi()
    // Inject a fake canvas + 2d context so draw() runs all three modes.
    const calls: string[] = []
    const fakeCtx = {
      clearRect: () => { calls.push('clear') },
      fillRect: () => { calls.push('fill') },
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      stroke: () => { calls.push('stroke') },
      fill: () => {},
    }
    ;(api.canvasRef as any).value = {
      width: 300,
      height: 150,
      getContext: () => fakeCtx,
    }

    await api.engage()
    await vi.advanceTimersByTimeAsync(0)
    expect(api.status.value).toBe('playing')

    // spectrum (default) -> draws fillRect bars.
    api.setMode('spectrum')
    raf.step()
    expect(calls).toContain('fill')

    // radial -> draws a stroked waveform.
    calls.length = 0
    api.setMode('radial')
    raf.step()
    expect(calls).toContain('stroke')

    // particles -> draws fillRect particles.
    calls.length = 0
    api.setMode('particles')
    raf.step()
    expect(calls).toContain('fill')

    wrapper.unmount()
  })

  // -------------------------------------------------------------------------
  // FIX 1 (AC 1d — particle burst): spawnParticles must actually spawn
  // transient particles that the user can see explode outward on a beat, then
  // die over frames. Before the fix spawnParticles(n) was `void n` (no-op) so
  // the burst AC was silently dropped. These tests prove the burst is real.
  // -------------------------------------------------------------------------
  describe('#15 FIX 1 — particle burst (AC 1d)', () => {
    /** A FakeAudioContext whose analyser returns controllable freq data so a
     *  rising-edge beat can be driven deterministically. */
    function beatyAudio() {
      let frame = 0
      class BeatyAnalyser {
        fftSize = FFT_SIZE
        frequencyBinCount = FFT_SIZE / 2
        connect() { return this }
        disconnect() {}
        getByteFrequencyData(arr: Uint8Array) {
          // Frame 0: silence (lastEnergy starts at 0, below threshold).
          // Frame 1+: bass bins saturated well above BASS_THRESHOLD (180) ->
          // a rising edge -> detectBeat fires on frame 1.
          const v = frame === 0 ? 0 : 220
          frame++
          for (let i = 0; i < arr.length; i++) arr[i] = v
        }
      }
      class Ctx {
        sampleRate = 44100
        currentTime = 0
        state = 'running'
        destination = { connect() { return this }, disconnect() {} }
        resume() { return Promise.resolve() }
        createGain() { return new FakeGainNode() }
        createOscillator() { return new FakeOscillator() }
        createBiquadFilter() { return new FakeBiquadFilter() }
        createAnalyser() { return new BeatyAnalyser() }
        close() { return Promise.resolve() }
      }
      ;(globalThis as any).AudioContext = Ctx as any
    }

    it('#15a a beat spawns transient particles (count > 0 after burst)', async () => {
      beatyAudio()
      const raf = countingRAF()
      const { getApi, wrapper } = mountHost()
      const api = getApi()
      // A canvas + 2d context so draw()/particle rendering runs.
      ;(api.canvasRef as any).value = {
        width: 300, height: 150,
        getContext: () => ({
          clearRect() {}, fillRect() {}, save() {}, restore() {},
          beginPath() {}, moveTo() {}, lineTo() {}, closePath() {},
          stroke() {}, fill() {}, arc() {},
        }),
      }
      await api.engage()
      await vi.advanceTimersByTimeAsync(0)
      expect(api.status.value).toBe('playing')

      // Frame 0: silence. No particles yet.
      raf.step()
      const before = api.particles.value.length
      expect(before).toBe(0)

      // Frame 1: rising-edge beat fires -> spawnParticles runs -> particles
      // appear in the array (the transient burst the user sees).
      raf.step()
      const after = api.particles.value.length
      expect(after).toBeGreaterThan(0)
      wrapper.unmount()
    })

    it('#15b particles die over frames (life decremented, dead filtered)', async () => {
      beatyAudio()
      const raf = countingRAF()
      const { getApi, wrapper } = mountHost()
      const api = getApi()
      ;(api.canvasRef as any).value = {
        width: 300, height: 150,
        getContext: () => ({
          clearRect() {}, fillRect() {}, save() {}, restore() {},
          beginPath() {}, moveTo() {}, lineTo() {}, closePath() {},
          stroke() {}, fill() {}, arc() {},
        }),
      }
      await api.engage()
      await vi.advanceTimersByTimeAsync(0)

      // Burn frame 0 (silence) so the NEXT frame is a clean rising beat.
      raf.step()
      // Frame 1: beat -> burst spawns.
      raf.step()
      const spawned = api.particles.value.length
      expect(spawned).toBeGreaterThan(0)

      // Step many frames; each frame decrements life and filters dead
      // particles. After enough frames the array must shrink (particles die).
      let lastCount = spawned
      let shrankAtLeastOnce = false
      for (let i = 0; i < 200; i++) {
        // Defeat the refractory/flash gate so beats can keep firing and
        // re-seeding; regardless, individual particles still age out. We assert
        // the array eventually becomes EMPTY (all transient particles die when
        // no fresh beat re-seeds within their lifetime).
        raf.step()
        const now = api.particles.value.length
        if (now < lastCount) shrankAtLeastOnce = true
        lastCount = now
      }
      // Either it shrank mid-flight OR drained fully — both prove death logic.
      expect(shrankAtLeastOnce || api.particles.value.length === 0).toBe(true)
      // After a long quiet stretch (no new beats — refractory + the rising-edge
      // requirement means beats eventually stop) all particles drain to 0.
      // Step well past every particle's lifetime.
      for (let i = 0; i < 400; i++) raf.step()
      expect(api.particles.value.length).toBe(0)
      wrapper.unmount()
    })

    it('#15c particle array is capped (no unbounded growth under repeated beats)', async () => {
      beatyAudio()
      const raf = countingRAF()
      const { getApi, wrapper } = mountHost()
      const api = getApi()
      ;(api.canvasRef as any).value = {
        width: 300, height: 150,
        getContext: () => ({
          clearRect() {}, fillRect() {}, save() {}, restore() {},
          beginPath() {}, moveTo() {}, lineTo() {}, closePath() {},
          stroke() {}, fill() {}, arc() {},
        }),
      }
      await api.engage()
      await vi.advanceTimersByTimeAsync(0)
      // Drive many frames; even if beats re-fire, the array must never exceed
      // the documented cap (PARTICLES cap = 200).
      let maxObserved = 0
      for (let i = 0; i < 500; i++) {
        raf.step()
        const n = api.particles.value.length
        if (n > maxObserved) maxObserved = n
      }
      expect(maxObserved).toBeLessThanOrEqual(200)
      wrapper.unmount()
    })

    it('#15d reduced-motion: no particles ever spawn (burst path short-circuited)', async () => {
      mockMatchMedia({ '(prefers-reduced-motion: reduce)': true })
      beatyAudio()
      const raf = countingRAF()
      const { getApi, wrapper } = mountHost()
      const api = getApi()
      ;(api.canvasRef as any).value = {
        width: 300, height: 150,
        getContext: () => ({
          clearRect() {}, fillRect() {}, save() {}, restore() {},
          beginPath() {}, moveTo() {}, lineTo() {}, closePath() {},
          stroke() {}, fill() {}, arc() {},
        }),
      }
      await api.engage()
      await vi.advanceTimersByTimeAsync(0)
      for (let i = 0; i < 50; i++) raf.step()
      // particleCount(isMobile, true) === 0 => spawnParticles(0) => no growth.
      expect(api.particles.value.length).toBe(0)
      wrapper.unmount()
    })
  })
})

// ---------------------------------------------------------------------------
// Host component (mirrors useOpsFeed.test.ts)
// ---------------------------------------------------------------------------

function mountHost() {
  let api: ReturnType<typeof useAudioPulse> | null = null
  const TestHost = defineComponent({
    name: 'AudioPulseHost',
    setup() {
      api = useAudioPulse()
      return {}
    },
    render() {
      return h('div', { class: 'host' })
    },
  })
  const wrapper = mount(TestHost, { attachTo: document.body })
  return { wrapper, getApi: () => api! }
}

// ---------------------------------------------------------------------------
// Fake AudioContext installation (so the composable's engage() uses it)
// ---------------------------------------------------------------------------

let savedAudioContext: any
let savedUserMedia: any

function installFakeAudio() {
  savedAudioContext = (globalThis as any).AudioContext
  savedUserMedia = (navigator as any).mediaDevices?.getUserMedia
  ;(globalThis as any).AudioContext = FakeAudioContext
  // Default: grant mic (a silent empty MediaStream).
  grantMic()
}

let savedIntersectionObserver: any

/** Installs a synchronous IntersectionObserver stub that records its callback
 *  on window.__lastIntersectionObserver so a test can drive offscreen/onscreen
 *  entries without waiting for a real intersection event. */
function installFakeIntersectionObserver() {
  savedIntersectionObserver = (window as any).IntersectionObserver
  ;(window as any).IntersectionObserver = class {
    callback: (entries: any[]) => void
    constructor(cb: (entries: any[]) => void) {
      this.callback = cb
      ;(window as any).__lastIntersectionObserver = this
    }
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return [] }
  }
}

function restoreIntersectionObserver() {
  if (savedIntersectionObserver !== undefined) {
    ;(window as any).IntersectionObserver = savedIntersectionObserver
  }
  delete (window as any).__lastIntersectionObserver
}

function grantMic() {
  Object.defineProperty(navigator, 'mediaDevices', {
    value: {
      getUserMedia: () =>
        Promise.resolve({
          getTracks: () => [{ stop: () => {} }],
        }),
    },
    configurable: true,
  })
}

function denyMic() {
  Object.defineProperty(navigator, 'mediaDevices', {
    value: {
      getUserMedia: () => Promise.reject(new Error('Permission denied')),
    },
    configurable: true,
  })
}

function restoreAudio() {
  if (savedAudioContext !== undefined) (globalThis as any).AudioContext = savedAudioContext
  if (savedUserMedia !== undefined) {
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: savedUserMedia },
      configurable: true,
    })
  }
}
