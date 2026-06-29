/**
 * @file usePacketRoute.test.ts
 * @description Unit tests for the Packet Route cyber puzzle solver (#184).
 * @ticket #184 - [CYBER] Packet Route cyber puzzle mini-game.
 *
 * TDD: this file was written FIRST. It drives the PURE solver functions
 * exported from usePacketRoute.js (tile-connection model, BFS connectivity,
 * path-finding, exhaustive level-solvability, pure grid rotation, scoring)
 * and the LEVELS data (the solvability guarantee).
 *
 * The reactive factory (usePacketRoute) is exercised via mount tests in
 * PacketRoute.visual.test.ts / Home.test.ts; here we lock the BRAIN contract.
 */

import { describe, it, expect } from 'vitest'
import {
  tileOpenSides,
  tilesConnect,
  isConnected,
  findPath,
  isLevelSolvable,
  rotateTileOnGrid,
  computeScore,
  LEVELS,
  type TileType,
} from '../usePacketRoute.js'

// ---------------------------------------------------------------------------
// Helpers to build cells/grids from compact specs.
// ---------------------------------------------------------------------------

type Cell = ReturnType<typeof makeCell>
function makeCell(r: number, c: number, type: TileType, rotation = 0, fixed = false) {
  return { r, c, type, rotation, fixed }
}

/** Build a Map<"r,c", cell> grid from a list of cells. */
function gridOf(cells: Cell[]) {
  const m = new Map<string, Cell>()
  for (const cell of cells) m.set(`${cell.r},${cell.c}`, cell)
  return m
}

// ===========================================================================
// tileOpenSides — the tile-connection model (every type x rotation)
// ===========================================================================
describe('tileOpenSides', () => {
  it('straight: rotation 0 = N+S, 1 = E+W, 2 = N+S, 3 = E+W', () => {
    expect(new Set(tileOpenSides('straight', 0))).toEqual(new Set(['N', 'S']))
    expect(new Set(tileOpenSides('straight', 1))).toEqual(new Set(['E', 'W']))
    expect(new Set(tileOpenSides('straight', 2))).toEqual(new Set(['N', 'S']))
    expect(new Set(tileOpenSides('straight', 3))).toEqual(new Set(['E', 'W']))
  })

  it('elbow: rotation 0 = N+E, 1 = E+S, 2 = S+W, 3 = W+N', () => {
    expect(new Set(tileOpenSides('elbow', 0))).toEqual(new Set(['N', 'E']))
    expect(new Set(tileOpenSides('elbow', 1))).toEqual(new Set(['E', 'S']))
    expect(new Set(tileOpenSides('elbow', 2))).toEqual(new Set(['S', 'W']))
    expect(new Set(tileOpenSides('elbow', 3))).toEqual(new Set(['W', 'N']))
  })

  it('t: three sides, rotating one step each', () => {
    expect(new Set(tileOpenSides('t', 0))).toEqual(new Set(['N', 'E', 'S']))
    expect(new Set(tileOpenSides('t', 1))).toEqual(new Set(['E', 'S', 'W']))
    expect(new Set(tileOpenSides('t', 2))).toEqual(new Set(['S', 'W', 'N']))
    expect(new Set(tileOpenSides('t', 3))).toEqual(new Set(['W', 'N', 'E']))
  })

  it('cross: all four sides, rotation invariant', () => {
    for (let r = 0; r < 4; r++) {
      expect(new Set(tileOpenSides('cross', r))).toEqual(
        new Set(['N', 'E', 'S', 'W']),
      )
    }
  })

  it('empty + firewall: zero open sides', () => {
    for (let r = 0; r < 4; r++) {
      expect(new Set(tileOpenSides('empty', r)).size).toBe(0)
      expect(new Set(tileOpenSides('firewall', r)).size).toBe(0)
    }
  })

  it('returns a fresh set per call (no shared mutable state)', () => {
    const a = tileOpenSides('straight', 0)
    const b = tileOpenSides('straight', 0)
    a.add('X')
    expect(b.has('X')).toBe(false)
  })
})

// ===========================================================================
// tilesConnect — adjacency + shared-side-open-on-both logic
// ===========================================================================
describe('tilesConnect', () => {
  it('two adjacent straights N+S aligned vertically connect', () => {
    const top = makeCell(0, 0, 'straight', 0) // N+S
    const bottom = makeCell(1, 0, 'straight', 0) // N+S
    expect(tilesConnect(top, bottom)).toBe(true)
  })

  it('rotated 90 they no longer share the vertical side', () => {
    const top = makeCell(0, 0, 'straight', 1) // E+W
    const bottom = makeCell(1, 0, 'straight', 0) // N+S
    expect(tilesConnect(top, bottom)).toBe(false)
  })

  it('two elbows that meet on a corner connect', () => {
    // top elbow N+E meets right elbow W+N at horizontal adjacency
    const left = makeCell(0, 0, 'elbow', 0) // N+E
    const right = makeCell(0, 1, 'elbow', 3) // W+N
    expect(tilesConnect(left, right)).toBe(true)
  })

  it('firewall never connects', () => {
    const a = makeCell(0, 0, 'straight', 0)
    const fw = makeCell(1, 0, 'firewall', 0)
    expect(tilesConnect(a, fw)).toBe(false)
  })

  it('non-adjacent cells never connect', () => {
    const a = makeCell(0, 0, 'cross', 0)
    const b = makeCell(0, 2, 'cross', 0)
    expect(tilesConnect(a, b)).toBe(false)
  })
})

// ===========================================================================
// isConnected — BFS through connected tile-sides
// ===========================================================================
describe('isConnected', () => {
  it('a solved vertical straight path connects source->target', () => {
    // 3x1: source at (0,0) facing S, straight tiles (1,0),(2,0), target at (3,0) facing N
    const cells = [
      makeCell(0, 0, 'straight', 0),
      makeCell(1, 0, 'straight', 0),
      makeCell(2, 0, 'straight', 0),
    ]
    const grid = gridOf(cells)
    expect(
      isConnected(grid, { r: 0, c: 0, side: 'S' }, { r: 3, c: 0, side: 'N' }),
    ).toBe(true)
  })

  it('a broken path (one tile rotated) does not connect', () => {
    const cells = [
      makeCell(0, 0, 'straight', 0),
      makeCell(1, 0, 'straight', 1), // rotated -> E+W, breaks vertical
      makeCell(2, 0, 'straight', 0),
    ]
    const grid = gridOf(cells)
    expect(
      isConnected(grid, { r: 0, c: 0, side: 'S' }, { r: 3, c: 0, side: 'N' }),
    ).toBe(false)
  })

  it('firewall in the middle blocks connectivity', () => {
    const cells = [
      makeCell(0, 0, 'straight', 0),
      makeCell(1, 0, 'firewall', 0),
      makeCell(2, 0, 'straight', 0),
    ]
    const grid = gridOf(cells)
    expect(
      isConnected(grid, { r: 0, c: 0, side: 'S' }, { r: 3, c: 0, side: 'N' }),
    ).toBe(false)
  })

  it('an elbow path that turns source->target connects', () => {
    // source (0,0) S -> elbow at (1,0) connecting N+E -> elbow at (1,1) W+S -> target (2,1) N
    const cells = [
      makeCell(1, 0, 'elbow', 0), // N+E
      makeCell(1, 1, 'elbow', 2), // S+W
    ]
    const grid = gridOf(cells)
    expect(
      isConnected(grid, { r: 0, c: 0, side: 'S' }, { r: 2, c: 1, side: 'N' }),
    ).toBe(true)
  })
})

// ===========================================================================
// findPath — ordered cell list (drives packet animation + Hint)
// ===========================================================================
describe('findPath', () => {
  it('returns ordered cells for a solved vertical path', () => {
    const cells = [
      makeCell(0, 0, 'straight', 0),
      makeCell(1, 0, 'straight', 0),
      makeCell(2, 0, 'straight', 0),
    ]
    const grid = gridOf(cells)
    const path = findPath(grid, { r: 0, c: 0, side: 'S' }, { r: 3, c: 0, side: 'N' })
    expect(path).not.toBeNull()
    expect(path!.map((p) => `${p.r},${p.c}`)).toEqual(['0,0', '1,0', '2,0'])
  })

  it('returns null for an unsolved grid', () => {
    const cells = [
      makeCell(0, 0, 'straight', 1), // broken
      makeCell(1, 0, 'straight', 0),
    ]
    const grid = gridOf(cells)
    expect(findPath(grid, { r: 0, c: 0, side: 'S' }, { r: 2, c: 0, side: 'N' })).toBeNull()
  })

  it('the last cell of the path neighbours the target side', () => {
    const cells = [
      makeCell(1, 0, 'elbow', 0), // N+E
      makeCell(1, 1, 'elbow', 2), // S+W
    ]
    const grid = gridOf(cells)
    const path = findPath(grid, { r: 0, c: 0, side: 'S' }, { r: 2, c: 1, side: 'N' })
    expect(path).not.toBeNull()
    expect(path!.length).toBe(2)
  })
})

// ===========================================================================
// isLevelSolvable — EVERY shipped level is guaranteed solvable
// ===========================================================================
describe('isLevelSolvable (shipped-level guarantee)', () => {
  it('ships at least 3 levels', () => {
    expect(LEVELS.length).toBeGreaterThanOrEqual(3)
  })

  it('every shipped level is solvable', () => {
    // This is THE solvability guarantee. If you add a broken level, this fails.
    for (const level of LEVELS) {
      expect(isLevelSolvable(level)).toBe(true)
    }
  })

  it('level 1 is the smallest (trivial) level for deterministic E2E', () => {
    const l1 = LEVELS[0]
    expect(l1.rows * l1.cols).toBeLessThanOrEqual(9)
  })

  it('levels increase (or stay) in difficulty by cell count', () => {
    for (let i = 1; i < LEVELS.length; i++) {
      const prev = LEVELS[i - 1].rows * LEVELS[i - 1].cols
      const curr = LEVELS[i].rows * LEVELS[i].cols
      expect(curr).toBeGreaterThanOrEqual(prev)
    }
  })

  it('a deliberately-broken level (no tiles) is NOT solvable', () => {
    const broken = {
      id: 'broken',
      nameKey: 'packetRoute.levels.l1.name',
      cols: 3,
      rows: 1,
      source: { r: 0, c: 0, side: 'E' as const },
      target: { r: 0, c: 2, side: 'W' as const },
      cells: [],
      firewalls: [{ r: 0, c: 1 }],
    }
    expect(isLevelSolvable(broken)).toBe(false)
  })
})

// ===========================================================================
// rotateTileOnGrid — pure, increments mod 4, no input mutation
// ===========================================================================
describe('rotateTileOnGrid', () => {
  it('returns a NEW grid with the tile rotation +1', () => {
    const cells = [makeCell(0, 0, 'elbow', 1)]
    const grid = gridOf(cells)
    const next = rotateTileOnGrid(grid, 0, 0)
    // input untouched
    expect(grid.get('0,0')!.rotation).toBe(1)
    // output rotated
    expect(next.get('0,0')!.rotation).toBe(2)
    // not the same object
    expect(next).not.toBe(grid)
  })

  it('wraps rotation mod 4 (3 -> 0)', () => {
    const cells = [makeCell(0, 0, 'elbow', 3)]
    const next = rotateTileOnGrid(gridOf(cells), 0, 0)
    expect(next.get('0,0')!.rotation).toBe(0)
  })

  it('does NOT rotate a fixed tile (firewall/source/target)', () => {
    const cells = [makeCell(0, 0, 'straight', 2, true)]
    const next = rotateTileOnGrid(gridOf(cells), 0, 0)
    expect(next.get('0,0')!.rotation).toBe(2) // unchanged
  })
})

// ===========================================================================
// computeScore — deterministic, lower is better
// ===========================================================================
describe('computeScore', () => {
  it('is deterministic for the same inputs', () => {
    expect(computeScore(5, 10000)).toBe(computeScore(5, 10000))
  })

  it('fewer moves scores better (lower)', () => {
    const a = computeScore(3, 10000)
    const b = computeScore(10, 10000)
    expect(a).toBeLessThan(b)
  })

  it('less time scores better (lower)', () => {
    const a = computeScore(5, 5000)
    const b = computeScore(5, 20000)
    expect(a).toBeLessThan(b)
  })

  it('produces a positive integer', () => {
    const s = computeScore(5, 10000)
    expect(Number.isInteger(s)).toBe(true)
    expect(s).toBeGreaterThan(0)
  })
})
