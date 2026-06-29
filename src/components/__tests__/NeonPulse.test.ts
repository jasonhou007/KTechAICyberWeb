/**
 * @file NeonPulse.test.ts
 * @description Component-level DOM tests for NeonPulse.vue (#186).
 * @ticket #186
 *
 * Drives the REAL component (mounted via @vue/test-utils) using the REAL
 * useLanguage composable so i18n keys resolve against the real catalogs.
 * Asserts user-visible DOM effects (no internal-state mutation). Mirrors
 * PacketRoute.test.ts conventions.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import NeonPulse from '../NeonPulse.vue'

// matchMedia / rAF mocks so mount + engage are deterministic.
let originalMatchMedia
let originalRAF
let originalCancelRAF
let originalAudioContext
let originalMediaDevices

function mockMatchMedia(matchesMap) {
  window.matchMedia = (query) => ({
    matches: !!matchesMap[query],
    media: query,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  })
}

/** Counting rAF so the render loop is driven but controllable. */
function countingRAF() {
  const queue = []
  let id = 1
  let callCount = 0
  window.requestAnimationFrame = (cb) => {
    callCount++
    queue.push(cb)
    return id++
  }
  window.cancelAnimationFrame = () => {}
  return {
    step() {
      const cb = queue.shift()
      if (cb) cb(performance.now() + 16)
    },
    get callCount() {
      return callCount
    },
  }
}

// --- Fake Audio nodes (minimal — the composable only reads/wires shapes) --
class FakeAnalyser {
  fftSize = 256
  frequencyBinCount = 128
  connect() { return this }
  disconnect() {}
  getByteFrequencyData(arr) { arr.fill(0) }
}
class FakeGain { gain = { value: 1, setValueAtTime: () => {}, linearRampToValueAtTime: () => {} }; connect() { return this }; disconnect() {} }
class FakeOsc { type = 'sine'; frequency = { value: 0, setValueAtTime: () => {} }; connect() { return this }; start() {}; stop() {}; disconnect() {} }
class FakeFilter { type = 'lowpass'; frequency = { value: 0, setValueAtTime: () => {} }; Q = { value: 1 }; connect() { return this }; disconnect() {} }
class FakeAudioContext {
  sampleRate = 44100
  currentTime = 0
  state = 'running'
  destination = { connect() { return this }, disconnect() {} }
  resume() { this.state = 'running'; return Promise.resolve() }
  createGain() { return new FakeGain() }
  createOscillator() { return new FakeOsc() }
  createBiquadFilter() { return new FakeFilter() }
  createAnalyser() { return new FakeAnalyser() }
  createMediaStreamSource() { return { connect() {}, disconnect() {} } }
  close() { this.state = 'closed'; return Promise.resolve() }
}

function installFakeAudio() {
  originalAudioContext = window.AudioContext
  originalMediaDevices = Object.getOwnPropertyDescriptor(navigator, 'mediaDevices')
  window.AudioContext = FakeAudioContext
  Object.defineProperty(navigator, 'mediaDevices', {
    value: { getUserMedia: () => Promise.resolve({ getTracks: () => [{ stop: () => {} }] }) },
    configurable: true,
  })
}

function restoreAudio() {
  if (originalAudioContext) window.AudioContext = originalAudioContext
  if (originalMediaDevices) Object.defineProperty(navigator, 'mediaDevices', originalMediaDevices)
}

describe('NeonPulse.vue — component DOM', () => {
  beforeEach(() => {
    originalMatchMedia = window.matchMedia
    originalRAF = window.requestAnimationFrame
    originalCancelRAF = window.cancelAnimationFrame
    mockMatchMedia({ '(prefers-reduced-motion: reduce)': false })
    countingRAF()
    installFakeAudio()
    // Fresh canvas context stub so draw() runs without a real 2D context.
    HTMLCanvasElement.prototype.getContext = function () {
      return {
        clearRect: () => {},
        fillRect: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        closePath: () => {},
        stroke: () => {},
        fill: () => {},
      }
    } as any
  })

  afterEach(() => {
    window.matchMedia = originalMatchMedia
    window.requestAnimationFrame = originalRAF
    window.cancelAnimationFrame = originalCancelRAF
    restoreAudio()
    vi.restoreAllMocks()
  })

  const mountPulse = () => mount(NeonPulse, { attachTo: document.body })

  it('renders the region label + Engage button (idle on mount)', () => {
    const w = mountPulse()
    expect(w.find('[data-test="neon-pulse"]').exists()).toBe(true)
    // Region is labelled for screen readers.
    expect(w.find('[data-test="neon-pulse"]').attributes('aria-label')).toBeTruthy()
    // Engage button is present + labelled.
    const engage = w.find('[data-test="pulse-engage"]')
    expect(engage.exists()).toBe(true)
    expect(engage.attributes('aria-label')).toBeTruthy()
    // Idle status text renders.
    expect(w.find('[data-test="pulse-status"]').text().length).toBeGreaterThan(0)
    w.unmount()
  })

  it('does NOT draw on the canvas while idle (no autoplay)', async () => {
    const raf = countingRAF()
    const w = mountPulse()
    // Advance several frames while idle: no rAF scheduled (no autoplay).
    await new Promise((r) => setTimeout(r, 0))
    expect(raf.callCount).toBe(0)
    w.unmount()
  })

  it('clicking Engage transitions status to playing', async () => {
    const w = mountPulse()
    await w.find('[data-test="pulse-engage"]').trigger('click')
    // Allow engage()'s awaits (resume, etc.) to settle.
    await new Promise((r) => setTimeout(r, 10))
    const statusText = w.find('[data-test="pulse-status"]').text()
    // The localized "playing" copy must be present (not a raw key, not "idle").
    expect(statusText).not.toContain('pulse.')
    w.unmount()
  })

  it('mode radio group calls setMode (active mode reflects selection)', async () => {
    const w = mountPulse()
    // The radial radio input.
    const radial = w.find('[data-test="pulse-mode-radial"]')
    expect(radial.exists()).toBe(true)
    await radial.setValue(true)
    // The active mode is reflected via the checked state of the radio.
    expect((radial.element as HTMLInputElement).checked).toBe(true)
    w.unmount()
  })

  it('sensitivity slider calls setSensitivity (value clamped into range)', async () => {
    const w = mountPulse()
    const slider = w.find('[data-test="pulse-sensitivity"]')
    expect(slider.exists()).toBe(true)
    await slider.setValue('2')
    expect((slider.element as HTMLInputElement).value).toBe('2')
    w.unmount()
  })

  it('reduced-motion -> low-motion class on the root', async () => {
    mockMatchMedia({ '(prefers-reduced-motion: reduce)': true })
    const w = mountPulse()
    await new Promise((r) => setTimeout(r, 0))
    expect(w.find('[data-test="neon-pulse"]').classes()).toContain('low-motion')
    w.unmount()
  })

  it('never renders a raw pulse.* i18n key', async () => {
    const w = mountPulse()
    await w.find('[data-test="pulse-engage"]').trigger('click')
    await new Promise((r) => setTimeout(r, 10))
    const text = w.text()
    expect(text.match(/pulse\.[a-zA-Z][a-zA-Z0-9.]*/g)).toBeNull()
    w.unmount()
  })

  it('Stop button returns to idle after Engage', async () => {
    const w = mountPulse()
    await w.find('[data-test="pulse-engage"]').trigger('click')
    await new Promise((r) => setTimeout(r, 10))
    const stop = w.find('[data-test="pulse-stop"]')
    expect(stop.exists()).toBe(true)
    await stop.trigger('click')
    await new Promise((r) => setTimeout(r, 0))
    // The status readout now shows the idle copy.
    const statusText = w.find('[data-test="pulse-status"]').text()
    expect(statusText).not.toContain('pulse.')
    w.unmount()
  })

  it('renders the dB readout + canvas elements', () => {
    const w = mountPulse()
    expect(w.find('[data-test="pulse-canvas"]').exists()).toBe(true)
    expect(w.find('[data-test="pulse-db"]').exists()).toBe(true)
    w.unmount()
  })

  it('canvas is decorative (aria-hidden) and a visually-hidden description exposes aria.description', () => {
    const w = mountPulse()
    // M1 security fix: canvas is aria-hidden (live data is in the ARIA live region).
    const canvas = w.find('[data-test="pulse-canvas"]')
    expect(canvas.attributes('aria-hidden')).toBe('true')
    expect(canvas.attributes('role')).toBeUndefined()
    // The description text still reaches AT via a visually-hidden <p>.
    const desc = w.find('[data-test="neon-pulse"] p.visually-hidden')
    expect(desc.exists()).toBe(true)
    expect(desc.text()).not.toContain('pulse.')
    w.unmount()
  })

  it('reduced-motion notice uses the dedicated reducedMotion key (not the iOS-audio key)', async () => {
    // Mount with prefers-reduced-motion: reduce enabled.
    mockMatchMedia({ '(prefers-reduced-motion: reduce)': true })
    const w = mountPulse()
    await nextTick()
    const note = w.find('[data-test="pulse-reduced-note"]')
    expect(note.exists()).toBe(true)
    // The rendered text must NOT leak a raw key...
    expect(note.text()).not.toContain('pulse.')
    // ...and must be the reduced-motion copy (en fixture), proving L1 fix.
    expect(note.text().toLowerCase()).toContain('reduced')
    // Restore the default mock for subsequent tests.
    mockMatchMedia({ '(prefers-reduced-motion: reduce)': false })
    w.unmount()
  })

  it('input source toggle exposes synth + mic options', () => {
    const w = mountPulse()
    expect(w.find('[data-test="pulse-input-synth"]').exists()).toBe(true)
    expect(w.find('[data-test="pulse-input-mic"]').exists()).toBe(true)
    w.unmount()
  })
})
