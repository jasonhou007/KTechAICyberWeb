/**
 * @file PacketRoute.test.ts
 * @description Component-level DOM tests for PacketRoute.vue (#184).
 * @ticket #184
 *
 * Drives the REAL component (mounted via @vue/test-utils) using the REAL
 * useLanguage composable so i18n keys resolve against the real catalogs. Clicks
 * tiles, presses keyboard, transmits, and asserts user-visible DOM effects.
 * Covers the component's computed properties + event-handler branches that the
 * composable behavior test (stub host) does not reach.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import PacketRoute from '../PacketRoute.vue'

// matchMedia / rAF mocks so mount + transmit are deterministic.
let originalMatchMedia
let originalRAF
let originalCancelRAF

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

function syncRAF() {
  let id = 1
  window.requestAnimationFrame = (cb) => {
    cb(performance.now())
    return id++
  }
  window.cancelAnimationFrame = () => {}
}

describe('PacketRoute.vue — component DOM', () => {
  beforeEach(() => {
    originalMatchMedia = window.matchMedia
    originalRAF = window.requestAnimationFrame
    originalCancelRAF = window.cancelAnimationFrame
    mockMatchMedia({ '(prefers-reduced-motion: reduce)': false })
    syncRAF()
    // localStorage reset between tests.
    window.localStorage.clear()
  })

  afterEach(() => {
    window.matchMedia = originalMatchMedia
    window.requestAnimationFrame = originalRAF
    window.cancelAnimationFrame = originalCancelRAF
    vi.restoreAllMocks()
  })

  const mountRoute = () => mount(PacketRoute, { attachTo: document.body })

  it('renders the title, subtitle, instructions, and a grid of tiles', () => {
    const w = mountRoute()
    expect(w.find('[data-test="packet-route"]').exists()).toBe(true)
    expect(w.find('.packet-title').text()).toContain('Packet Route')
    expect(w.find('.packet-subtitle').text().length).toBeGreaterThan(0)
    expect(w.find('.packet-instructions').text().length).toBeGreaterThan(0)
    // Level 1 is 3x1 -> 3 tile cells (no source/target overlap on level 1).
    expect(w.findAll('[data-test^="packet-tile-"]').length).toBe(3)
    w.unmount()
  })

  it('clicking a tile bumps the move counter + rotates the tile (rotation class)', async () => {
    const w = mountRoute()
    expect(w.find('[data-test="packet-readout"]').text()).toContain('Moves: 0')
    await w.find('[data-test="packet-tile-0-0"]').trigger('click')
    expect(w.find('[data-test="packet-readout"]').text()).toContain('Moves: 1')
    // The rotation class flips from rot-0 to rot-1.
    const tile = w.find('[data-test="packet-tile-0-0"]')
    expect(tile.classes()).toContain('rot-1')
    w.unmount()
  })

  it('Transmit on solved level 1 -> DATA TRANSMITTED + Next Level button appears', async () => {
    const w = mountRoute()
    await w.find('[data-test="packet-transmit"]').trigger('click')
    // Allow sync rAF chain + microtasks to settle.
    await new Promise((r) => setTimeout(r, 0))
    const feedback = w.find('[data-test="packet-feedback"]')
    expect(feedback.exists()).toBe(true)
    expect(feedback.text()).toContain('DATA TRANSMITTED')
    // Next Level offered.
    expect(w.find('[data-test="packet-next"]').exists()).toBe(true)
    w.unmount()
  })

  it('Next Level click advances the level readout', async () => {
    const w = mountRoute()
    await w.find('[data-test="packet-transmit"]').trigger('click')
    await new Promise((r) => setTimeout(r, 0))
    await w.find('[data-test="packet-next"]').trigger('click')
    expect(w.find('[data-test="packet-readout"]').text()).toContain('2/')
    w.unmount()
  })

  it('Reset zeroes the move counter', async () => {
    const w = mountRoute()
    await w.find('[data-test="packet-tile-0-0"]').trigger('click')
    expect(w.find('[data-test="packet-readout"]').text()).toContain('Moves: 1')
    await w.find('[data-test="packet-reset"]').trigger('click')
    expect(w.find('[data-test="packet-readout"]').text()).toContain('Moves: 0')
    w.unmount()
  })

  it('Hint highlights a tile (is-hint class)', async () => {
    const w = mountRoute()
    await w.find('[data-test="packet-hint"]').trigger('click')
    const hinted = w.find('.packet-tile.is-hint')
    expect(hinted.exists()).toBe(true)
    w.unmount()
  })

  it('keyboard: ArrowDown moves cursor (is-cursor class moves)', async () => {
    const w = mountRoute()
    const grid = w.find('[data-test="packet-grid"]')
    await grid.trigger('keydown', { key: 'ArrowDown' })
    expect(w.find('[data-test="packet-tile-1-0"]').classes()).toContain('is-cursor')
    w.unmount()
  })

  it('keyboard: Space rotates the cursor cell', async () => {
    const w = mountRoute()
    const grid = w.find('[data-test="packet-grid"]')
    await grid.trigger('keydown', { key: ' ' })
    expect(w.find('[data-test="packet-readout"]').text()).toContain('Moves: 1')
    w.unmount()
  })

  it('keyboard: T transmits', async () => {
    const w = mountRoute()
    const grid = w.find('[data-test="packet-grid"]')
    await grid.trigger('keydown', { key: 't' })
    await new Promise((r) => setTimeout(r, 0))
    expect(w.find('[data-test="packet-feedback"]').text()).toContain('DATA TRANSMITTED')
    w.unmount()
  })

  it('keyboard: H requests a hint', async () => {
    const w = mountRoute()
    const grid = w.find('[data-test="packet-grid"]')
    await grid.trigger('keydown', { key: 'h' })
    expect(w.find('.packet-tile.is-hint').exists()).toBe(true)
    w.unmount()
  })

  it('reduced-motion class is applied to the root when prefersReducedMotion', async () => {
    mockMatchMedia({ '(prefers-reduced-motion: reduce)': true })
    const w = mountRoute()
    // The class is bound to a ref set in onMounted; await the re-render.
    await new Promise((r) => setTimeout(r, 0))
    expect(w.find('[data-test="packet-route"]').classes()).toContain('reduced-motion')
    expect(w.find('.packet-reduced-note').exists()).toBe(true)
    w.unmount()
  })

  it('Transmit button is disabled once won', async () => {
    const w = mountRoute()
    await w.find('[data-test="packet-transmit"]').trigger('click')
    await new Promise((r) => setTimeout(r, 0))
    const btn = w.find('[data-test="packet-transmit"]')
    expect(btn.attributes('disabled')).toBeDefined()
    w.unmount()
  })

  it('never renders a raw packetRoute.* key', () => {
    const w = mountRoute()
    const text = w.text()
    expect(text.match(/packetRoute\.[a-zA-Z][a-zA-Z0-9.]*/g)).toBeNull()
    w.unmount()
  })

  it('ARIA live region is present and polite', () => {
    const w = mountRoute()
    const live = w.find('[data-test="packet-live"]')
    expect(live.exists()).toBe(true)
    expect(live.attributes('aria-live')).toBe('polite')
    expect(live.attributes('role')).toBe('status')
    w.unmount()
  })

  it('replay button appears after a loss and restarts the level', async () => {
    const w = mountRoute()
    // Break the corridor then transmit -> lost.
    await w.find('[data-test="packet-tile-1-0"]').trigger('click')
    await w.find('[data-test="packet-transmit"]').trigger('click')
    await new Promise((r) => setTimeout(r, 0))
    expect(w.find('[data-test="packet-feedback"]').text()).toContain('LINK SEVERED')
    expect(w.find('[data-test="packet-replay"]').exists()).toBe(true)
    await w.find('[data-test="packet-replay"]').trigger('click')
    expect(w.find('[data-test="packet-readout"]').text()).toContain('Moves: 0')
    w.unmount()
  })
})
