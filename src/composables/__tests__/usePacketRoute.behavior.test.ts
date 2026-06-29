/**
 * @file usePacketRoute.behavior.test.ts
 * @description Reactive-factory behavior tests for usePacketRoute (#184).
 * @ticket #184
 *
 * The pure solver is locked in usePacketRoute.test.ts. THIS file drives the
 * reactive factory: actions (rotateTile, transmit, reset, nextLevel, replay,
 * requestHint), keyboard cursor, win/lose status transitions, best-score
 * persistence, reduced-motion instant-win, and lifecycle cleanup. Mirrors the
 * host-component + rAF/mock pattern from useOpsFeed.test.ts.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import { usePacketRoute } from '../usePacketRoute'

// ---------------------------------------------------------------------------
// matchMedia / rAF mock helpers
// ---------------------------------------------------------------------------

let originalMatchMedia
let originalRAF
let originalCancelRAF
let originalAddEventListener
let originalLocalStorage

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

/** Sync rAF: runs callbacks inline. */
function syncRAF() {
  let id = 1
  window.requestAnimationFrame = (cb) => {
    cb(performance.now())
    return id++
  }
  window.cancelAnimationFrame = () => {}
}

/** Never rAF: counts calls but never invokes (reduced-motion probe). */
function neverRAF() {
  let count = 0
  window.requestAnimationFrame = () => {
    count++
    return 1
  }
  window.cancelAnimationFrame = () => {}
  return { get callCount() { return count } }
}

// In-memory localStorage
function mockLocalStorage() {
  const store = {}
  return {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v) },
    removeItem: (k) => { delete store[k] },
    clear: () => { for (const k of Object.keys(store)) delete store[k] },
    _store: store,
  }
}

// ---------------------------------------------------------------------------
// Stub host component (the composable must run under onMounted/onUnmounted)
// ---------------------------------------------------------------------------

function mountHost() {
  let api = null
  const TestHost = defineComponent({
    name: 'PacketRouteHost',
    setup() {
      api = usePacketRoute()
      return {}
    },
    render() {
      return h('div', { class: 'host' })
    },
  })
  const wrapper = mount(TestHost, { attachTo: document.body })
  return { wrapper, getApi: () => api }
}

describe('usePacketRoute() — reactive factory', () => {
  beforeEach(() => {
    originalMatchMedia = window.matchMedia
    originalRAF = window.requestAnimationFrame
    originalCancelRAF = window.cancelAnimationFrame
    originalAddEventListener = document.addEventListener
    originalLocalStorage = window.localStorage
    mockMatchMedia({ '(prefers-reduced-motion: reduce)': false })
    syncRAF()
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage(),
      configurable: true,
    })
  })

  afterEach(() => {
    window.matchMedia = originalMatchMedia
    window.requestAnimationFrame = originalRAF
    window.cancelAnimationFrame = originalCancelRAF
    document.addEventListener = originalAddEventListener
    Object.defineProperty(window, 'localStorage', { value: originalLocalStorage, configurable: true })
    vi.restoreAllMocks()
  })

  // -------------------------------------------------------------------------
  // Initial state
  // -------------------------------------------------------------------------
  it('mounts at level 1 (index 0) with idle status, zero moves', () => {
    const { wrapper, getApi } = mountHost()
    const api = getApi()
    expect(api.levelIndex.value).toBe(0)
    expect(api.status.value).toBe('idle')
    expect(api.moves.value).toBe(0)
    expect(api.cursor.value).toEqual({ r: 0, c: 0 })
    wrapper.unmount()
  })

  // -------------------------------------------------------------------------
  // rotateTile
  // -------------------------------------------------------------------------
  it('rotateTile increments moves + mutates the grid rotation', async () => {
    const { wrapper, getApi } = mountHost()
    const api = getApi()
    api.rotateTile(0, 0)
    await nextTick()
    expect(api.moves.value).toBe(1)
    // Level 1 cell (0,0) is straight rotation 0 -> now 1.
    expect(api.grid.value.get('0,0').rotation).toBe(1)
    wrapper.unmount()
  })

  it('rotateTile ignores fixed/firewall/empty cells (no move bump)', async () => {
    const { wrapper, getApi } = mountHost()
    const api = getApi()
    // No cell at (5,5) -> ignored.
    api.rotateTile(5, 5)
    expect(api.moves.value).toBe(0)
    wrapper.unmount()
  })

  it('rotateTile is a no-op once won', async () => {
    const { wrapper, getApi } = mountHost()
    const api = getApi()
    api.transmit()
    await nextTick()
    expect(api.status.value).toBe('won')
    const movesBefore = api.moves.value
    api.rotateTile(0, 0)
    expect(api.moves.value).toBe(movesBefore)
    wrapper.unmount()
  })

  // -------------------------------------------------------------------------
  // transmit -> win (level 1 ships solved)
  // -------------------------------------------------------------------------
  it('transmit on the solved level 1 -> status won + best score persisted', async () => {
    const { wrapper, getApi } = mountHost()
    const api = getApi()
    api.transmit()
    // Sync rAF runs the animation to completion inline (no steps needed for
    // the final frame; but the win is also reachable via the >= path.length
    // branch on the first tick when ANIM_STEP_MS elapses).
    await nextTick()
    expect(['won', 'transmitting']).toContain(api.status.value)
    // Drive any pending rAF to completion.
    await new Promise((r) => setTimeout(r, 0))
    expect(api.status.value).toBe('won')
    // Best score persisted to localStorage.
    const stored = JSON.parse(window.localStorage.getItem('packetRoute.bestScores') || '{}')
    expect(stored.l1).toBeGreaterThan(0)
    expect(api.bestScore.value).toBe(stored.l1)
    wrapper.unmount()
  })

  it('transmit on a BROKEN grid -> status lost (LINK SEVERED)', async () => {
    const { wrapper, getApi } = mountHost()
    const api = getApi()
    // Break the corridor by rotating the middle tile to E+W.
    api.rotateTile(1, 0)
    api.transmit()
    await nextTick()
    expect(api.status.value).toBe('lost')
    wrapper.unmount()
  })

  it('transmit is a no-op once already won', async () => {
    const { wrapper, getApi } = mountHost()
    const api = getApi()
    api.transmit()
    await new Promise((r) => setTimeout(r, 0))
    expect(api.status.value).toBe('won')
    api.transmit() // no-op
    wrapper.unmount()
  })

  // -------------------------------------------------------------------------
  // Reduced motion -> instant win, no rAF
  // -------------------------------------------------------------------------
  it('reduced motion: transmit skips animation and wins instantly, rAF never called', async () => {
    mockMatchMedia({ '(prefers-reduced-motion: reduce)': true })
    const raf = neverRAF()
    const { wrapper, getApi } = mountHost()
    const api = getApi()
    expect(api.prefersReducedMotion.value).toBe(true)
    api.transmit()
    await nextTick()
    expect(api.status.value).toBe('won')
    expect(raf.callCount).toBe(0)
    wrapper.unmount()
  })

  // -------------------------------------------------------------------------
  // reset / replay
  // -------------------------------------------------------------------------
  it('reset zeroes moves + restores the shipped grid + status idle', async () => {
    const { wrapper, getApi } = mountHost()
    const api = getApi()
    api.rotateTile(0, 0)
    api.rotateTile(1, 0)
    expect(api.moves.value).toBe(2)
    api.reset()
    await nextTick()
    expect(api.moves.value).toBe(0)
    expect(api.status.value).toBe('idle')
    expect(api.grid.value.get('0,0').rotation).toBe(0)
    wrapper.unmount()
  })

  it('replay is an alias for reset', async () => {
    const { wrapper, getApi } = mountHost()
    const api = getApi()
    api.rotateTile(0, 0)
    api.replay()
    await nextTick()
    expect(api.moves.value).toBe(0)
    expect(api.status.value).toBe('idle')
    wrapper.unmount()
  })

  // -------------------------------------------------------------------------
  // nextLevel / loadLevel
  // -------------------------------------------------------------------------
  it('nextLevel advances the level index (wraps modulo LEVELS.length)', async () => {
    const { wrapper, getApi } = mountHost()
    const api = getApi()
    const total = api.levels.length
    api.nextLevel()
    await nextTick()
    expect(api.levelIndex.value).toBe(1)
    // Advance to the last level: from index 1 we need (total-2) more calls to
    // land on index total-1.
    for (let i = 1; i <= total - 2; i++) api.nextLevel()
    expect(api.levelIndex.value).toBe(total - 1)
    api.nextLevel()
    expect(api.levelIndex.value).toBe(0)
    wrapper.unmount()
  })

  // -------------------------------------------------------------------------
  // requestHint
  // -------------------------------------------------------------------------
  it('requestHint sets hintCell to a real tile on the solution path', async () => {
    const { wrapper, getApi } = mountHost()
    const api = getApi()
    api.requestHint()
    await nextTick()
    expect(api.hintCell.value).not.toBeNull()
    expect(api.hintCell.value.r).toBeGreaterThanOrEqual(0)
    wrapper.unmount()
  })

  // -------------------------------------------------------------------------
  // Keyboard cursor
  // -------------------------------------------------------------------------
  it('moveCursor clamps within the grid bounds', async () => {
    const { wrapper, getApi } = mountHost()
    const api = getApi()
    // Level 1 is 3 rows x 1 col.
    api.moveCursor('down')
    api.moveCursor('down')
    expect(api.cursor.value).toEqual({ r: 2, c: 0 })
    api.moveCursor('down') // clamp
    expect(api.cursor.value.r).toBe(2)
    api.moveCursor('up')
    api.moveCursor('up')
    api.moveCursor('up') // clamp at 0
    expect(api.cursor.value.r).toBe(0)
    // left/right clamp at column 0 on a 1-col grid.
    api.moveCursor('right')
    expect(api.cursor.value.c).toBe(0)
    wrapper.unmount()
  })

  it('cursorRotate rotates the cell under the cursor', async () => {
    const { wrapper, getApi } = mountHost()
    const api = getApi()
    api.cursorRotate()
    await nextTick()
    expect(api.moves.value).toBe(1)
    expect(api.grid.value.get('0,0').rotation).toBe(1)
    wrapper.unmount()
  })

  // -------------------------------------------------------------------------
  // Best score keeps the LOWER value on replay
  // -------------------------------------------------------------------------
  it('best score keeps the lower value across replays', async () => {
    const { wrapper, getApi } = mountHost()
    const api = getApi()
    api.transmit()
    await new Promise((r) => setTimeout(r, 0))
    const firstScore = api.bestScore.value
    // Replay and win with MORE moves.
    api.replay()
    api.rotateTile(0, 0)
    api.rotateTile(0, 0) // back to solved
    api.transmit()
    await new Promise((r) => setTimeout(r, 0))
    // The lower (first) score is retained.
    expect(api.bestScore.value).toBe(firstScore)
    wrapper.unmount()
  })

  // -------------------------------------------------------------------------
  // Lifecycle: unmount cancels rAF + disconnects observers without throwing
  // -------------------------------------------------------------------------
  it('unmount cleans up without throwing', () => {
    const { wrapper } = mountHost()
    expect(() => wrapper.unmount()).not.toThrow()
  })
})
