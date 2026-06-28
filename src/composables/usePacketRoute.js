/**
 * @file usePacketRoute.js
 * @description Reactive brain + PURE solver for the Packet Route cyber puzzle (#184).
 * @ticket #184 - [CYBER] Packet Route cyber puzzle mini-game.
 *
 * Mirrors the composable pattern from useOpsFeed.js (#182) / useSolutionForge.js
 * (#180): PacketRoute.vue is a thin presentation layer over this composable and
 * owns no business logic of its own.
 *
 * TWO exports layers:
 *  1. PURE solver functions (unit-tested in usePacketRoute.test.ts):
 *     - tileOpenSides(type, rotation)  -> Set<side>
 *     - tilesConnect(cellA, cellB)     -> bool
 *     - isConnected(grid, src, tgt)    -> bool      (BFS through tile-sides)
 *     - findPath(grid, src, tgt)       -> cell[]|null
 *     - isLevelSolvable(level)         -> bool      (exhaustive 4^k search)
 *     - rotateTileOnGrid(grid, r, c)   -> newGrid   (pure)
 *     - computeScore(moves, elapsedMs) -> number
 *  2. LEVELS — guaranteed-solvable hand-built levels (isLevelSolvable proves it).
 *  3. usePacketRoute() — reactive factory: state + actions + a single rAF loop
 *     driving the packet-travel animation (cancelled on completion/unmount),
 *     IntersectionObserver + document.hidden pause, prefers-reduced-motion skip.
 *
 * Tile-connection model:
 *   Each tile has 4 sides N/E/S/W. TYPE + ROTATION define the open sides:
 *     - straight: 2 opposite sides (r0=N+S, r1=E+W, r2=N+S, r3=E+W)
 *     - elbow:    2 adjacent sides  (r0=N+E, r1=E+S, r2=S+W, r3=W+N)
 *     - t:        3 sides           (r0=N+E+S, r1=E+S+W, r2=S+W+N, r3=W+N+E)
 *     - cross:    all 4 (rotation invariant)
 *     - empty/firewall: 0 open sides (firewall = undestroyable obstacle)
 *   source/target cells are virtual: each has ONE fixed open side given by
 *   `source.side` / `target.side`.
 */

import { ref, computed, readonly, onMounted, onUnmounted } from 'vue'

// ---------------------------------------------------------------------------
// Types (JSDoc)
// ---------------------------------------------------------------------------

/**
 * @typedef {'straight'|'elbow'|'t'|'cross'|'empty'|'firewall'} TileType
 * @typedef {'N'|'E'|'S'|'W'} Side
 * @typedef {{ r: number, c: number, side: Side }} Endpoint  source/target cell
 * @typedef {{ r: number, c: number, type: TileType, rotation: number, fixed?: boolean }} Cell
 * @typedef {{
 *   id: string, nameKey: string,
 *   cols: number, rows: number,
 *   source: Endpoint, target: Endpoint,
 *   cells: Cell[],
 *   firewalls: { r: number, c: number }[],
 * }} Level
 */

// ---------------------------------------------------------------------------
// Tile-connection model
// ---------------------------------------------------------------------------

/** Clockwise side order used for rotation. */
const SIDE_ORDER = ['N', 'E', 'S', 'W']

/** Base open-side set (rotation 0) per tile type, as a side->bitoffset map. */
const BASE_SIDES = {
  // straight: N+S (opposite). Rotation by 1 swaps to E+W.
  straight: ['N', 'S'],
  // elbow: N+E (adjacent). Each rotation shifts +1 around SIDE_ORDER.
  elbow: ['N', 'E'],
  // t: N+E+S (missing W). Each rotation shifts +1.
  t: ['N', 'E', 'S'],
  // cross: all four, rotation invariant.
  cross: ['N', 'E', 'S', 'W'],
  empty: [],
  firewall: [],
}

/** Rotate a single side by `n` clockwise steps around SIDE_ORDER. */
function rotateSide(side, n) {
  const idx = SIDE_ORDER.indexOf(side)
  return SIDE_ORDER[(idx + n + 4) % 4]
}

/**
 * PURE. Returns the set of open sides for a tile of `type` at `rotation`.
 * @param {TileType} type
 * @param {number} rotation  0..3
 * @returns {Set<Side>}
 */
export function tileOpenSides(type, rotation) {
  const base = BASE_SIDES[type] || []
  const out = new Set()
  for (const side of base) {
    out.add(rotateSide(side, rotation))
  }
  return out
}

// ---------------------------------------------------------------------------
// Adjacency / connection
// ---------------------------------------------------------------------------

/** The side opposite to `side` (N<->S, E<->W). */
function opposite(side) {
  return { N: 'S', S: 'N', E: 'W', W: 'E' }[side]
}

/** The shared side between two adjacent cells, or null if not orthogonally adjacent. */
function sharedSide(from, to) {
  if (to.r === from.r - 1 && to.c === from.c) return 'N' // to is North of from
  if (to.r === from.r + 1 && to.c === from.c) return 'S' // to is South of from
  if (to.r === from.r && to.c === from.c + 1) return 'E' // to is East of from
  if (to.r === from.r && to.c === from.c - 1) return 'W' // to is West of from
  return null
}

/**
 * Open sides for a cell, treating source/target virtual endpoints as having
 * exactly one open side (their `side`).
 * @param {{ type: TileType, rotation: number } | Endpoint} cell
 * @param {boolean} isEndpoint  when true, `cell` is an Endpoint with a `side`
 */
function openSidesOf(cell, isEndpoint) {
  if (isEndpoint) return new Set([cell.side])
  return tileOpenSides(cell.type, cell.rotation)
}

/**
 * PURE. Two cells connect iff they are orthogonally adjacent AND the shared
 * side is open on BOTH. Source/target endpoints are virtual cells with one
 * fixed open side.
 * @param {Cell} a
 * @param {Cell} b
 * @param {object} [opts]  { aIsEndpoint?: bool, bIsEndpoint?: bool }
 * @returns {boolean}
 */
export function tilesConnect(a, b, opts = {}) {
  const shared = sharedSide(a, b)
  if (shared === null) return false
  const aOpen = openSidesOf(a, !!opts.aIsEndpoint)
  const bOpen = openSidesOf(b, !!opts.bIsEndpoint)
  // `a` must open toward `b` (the shared side), and `b` must open back toward
  // `a` (the opposite side, i.e. its side facing `a`).
  if (!aOpen.has(shared)) return false
  if (!bOpen.has(opposite(shared))) return false
  return true
}

// ---------------------------------------------------------------------------
// Connectivity (BFS through connected tile-sides, source -> target)
// ---------------------------------------------------------------------------

/** Key for a grid cell. */
const key = (r, c) => `${r},${c}`

/**
 * PURE. True iff a connected chain exists source -> target through the grid.
 * Source/target are virtual cells; we start BFS from the source's neighbour
 * (the cell the source opens into) and reach when a cell connects to target.
 * @param {Map<string, Cell>} grid
 * @param {Endpoint} source
 * @param {Endpoint} target
 * @returns {boolean}
 */
export function isConnected(grid, source, target) {
  return findPath(grid, source, target) !== null
}

/** Neighbour offset for a side. */
function neighbourOf(r, c, side) {
  if (side === 'N') return { r: r - 1, c }
  if (side === 'S') return { r: r + 1, c }
  if (side === 'E') return { r, c: c + 1 }
  return { r, c: c - 1 } // W
}

/**
 * PURE. Returns the ordered cell list (source-side entry -> target-side exit)
 * or null if no connected path exists. Drives the packet-travel animation and
 * the Hint highlight.
 *
 * Endpoint model: source/target `{r,c,side}` are the packet ORIGIN/DEST.
 *   - If (r,c) is a REAL grid cell, that cell is the path endpoint and the
 *     packet enters/exits the grid THROUGH it via `side` (the cell must have
 *     `side` open).
 *   - If (r,c) is OFF-GRID, the packet enters/exits the grid through the
 *     neighbour cell at `side` (that neighbour must open back toward the
 *     endpoint, i.e. have `opposite(side)` open).
 *
 * BFS from the source cell, expanding through mutually-connecting tiles,
 * tracking parents so we can reconstruct the ordered cell list. Reaches the
 * target cell when a connected neighbour is the target endpoint.
 *
 * @param {Map<string, Cell>} grid
 * @param {Endpoint} source
 * @param {Endpoint} target
 * @returns {Cell[] | null}
 */
export function findPath(grid, source, target) {
  // Resolve the source's first real cell on the path.
  const srcCell = grid.get(key(source.r, source.c))
  let startCell
  if (srcCell) {
    // Source IS this cell; the packet exits via `source.side`, so the cell must
    // have that side open.
    if (!tileOpenSides(srcCell.type, srcCell.rotation).has(source.side)) return null
    startCell = srcCell
  } else {
    // Source is off-grid; the packet enters the neighbour cell at `source.side`,
    // which must open back toward the source (opposite side).
    const nb = neighbourOf(source.r, source.c, source.side)
    const nbCell = grid.get(key(nb.r, nb.c))
    if (!nbCell) return null
    if (!tileOpenSides(nbCell.type, nbCell.rotation).has(opposite(source.side))) return null
    startCell = nbCell
  }

  // Resolve the target's last real cell on the path.
  const tgtCell = grid.get(key(target.r, target.c))
  /** Returns true when `cell` connects to the target endpoint. */
  const reachesTarget = (cell, cellOpen) => {
    if (tgtCell) {
      // Target IS this cell: the path reaches it when `cell === tgtCell` (the
      // BFS only walks into cells, so reaching tgtCell is sufficient; the cell
      // must have `target.side` open to confirm arrival).
      return cell.r === tgtCell.r && cell.c === tgtCell.c && cellOpen.has(target.side)
    }
    // Target is off-grid: cell reaches it iff cell opens `opposite(target.side)`
    // (the side facing the target) AND cell sits at the target's neighbour
    // position in that direction.
    const need = opposite(target.side)
    if (!cellOpen.has(need)) return false
    const tn = neighbourOf(target.r, target.c, target.side)
    return cell.r === tn.r && cell.c === tn.c
  }

  // Immediate win: start cell already reaches the target.
  const startOpen = tileOpenSides(startCell.type, startCell.rotation)
  if (reachesTarget(startCell, startOpen)) return [startCell]

  // BFS.
  const visited = new Set([key(startCell.r, startCell.c)])
  /** @type {Map<string, Cell|null>} parent cell per visited key */
  const parent = new Map([[key(startCell.r, startCell.c), null]])
  const queue = [startCell]
  while (queue.length > 0) {
    const cell = queue.shift()
    const cellOpen = tileOpenSides(cell.type, cell.rotation)
    for (const side of SIDE_ORDER) {
      if (!cellOpen.has(side)) continue
      const nb = neighbourOf(cell.r, cell.c, side)
      const nk = key(nb.r, nb.c)
      const nextCell = grid.get(nk)
      if (!nextCell) continue
      if (visited.has(nk)) continue
      // Mutual connection required: cell opens `side` (checked) AND nextCell
      // opens the opposite side back.
      const nextOpen = tileOpenSides(nextCell.type, nextCell.rotation)
      if (!nextOpen.has(opposite(side))) continue
      visited.add(nk)
      parent.set(nk, cell)
      // Does nextCell reach the target?
      if (reachesTarget(nextCell, nextOpen)) {
        const path = [nextCell]
        let cur = parent.get(nk)
        while (cur !== null && cur !== undefined) {
          path.unshift(cur)
          cur = parent.get(key(cur.r, cur.c))
        }
        return path
      }
      queue.push(nextCell)
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// Level solvability (exhaustive search over rotatable tiles)
// ---------------------------------------------------------------------------

/**
 * Build the runtime grid Map for a level (cells + firewall cells). The source/
 * target endpoints are kept separate (they are virtual).
 * @param {Level} level
 * @returns {Map<string, Cell>}
 */
export function buildGrid(level) {
  const m = new Map()
  for (const cell of level.cells) {
    m.set(key(cell.r, cell.c), { ...cell })
  }
  for (const fw of level.firewalls || []) {
    m.set(key(fw.r, fw.c), { r: fw.r, c: fw.c, type: 'firewall', rotation: 0, fixed: true })
  }
  return m
}

/**
 * PURE. True iff there EXISTS an assignment of rotations to the level's
 * non-fixed, non-cross tiles such that source connects to target. Cross tiles
 * are rotation-invariant, so we only permute straight/elbow/t tiles.
 *
 * Exhaustive: 4^k where k = number of rotatable tiles. Capped reasonable by
 * level design (every shipped level has k <= 8, so 4^8 = 65536 max — fast).
 *
 * @param {Level} level
 * @returns {boolean}
 */
export function isLevelSolvable(level) {
  const rotatable = level.cells.filter(
    (c) => !c.fixed && c.type !== 'cross' && c.type !== 'empty' && c.type !== 'firewall',
  )
  const k = rotatable.length
  // Cap to keep exhaustive search tractable. Level design keeps k <= 8.
  if (k > 12) {
    // Too many rotatable tiles to brute-force; fall back to a single random
    // probe (should not happen for shipped levels).
    return isConnected(buildGrid(level), level.source, level.target)
  }
  const total = Math.pow(4, k)
  for (let mask = 0; mask < total; mask++) {
    // Build a fresh grid with this rotation assignment.
    const grid = new Map()
    for (const cell of level.cells) {
      let rotation = cell.rotation
      if (!cell.fixed && cell.type !== 'cross' && cell.type !== 'empty' && cell.type !== 'firewall') {
        // Find this cell's index among rotatable to read its 2 bits.
        const idx = rotatable.indexOf(cell)
        rotation = (mask >> (idx * 2)) & 0b11
      }
      grid.set(key(cell.r, cell.c), { ...cell, rotation })
    }
    for (const fw of level.firewalls || []) {
      grid.set(key(fw.r, fw.c), { r: fw.r, c: fw.c, type: 'firewall', rotation: 0, fixed: true })
    }
    if (findPath(grid, level.source, level.target) !== null) return true
  }
  return false
}

// ---------------------------------------------------------------------------
// Pure grid rotation
// ---------------------------------------------------------------------------

/**
 * PURE. Returns a NEW grid with the tile at (r,c) rotated +1 (mod 4). Fixed
 * tiles (source/target/firewall) are never rotated. The input grid is not
 * mutated.
 * @param {Map<string, Cell>} grid
 * @param {number} r
 * @param {number} c
 * @returns {Map<string, Cell>}
 */
export function rotateTileOnGrid(grid, r, c) {
  const k = key(r, c)
  const cell = grid.get(k)
  const next = new Map(grid)
  if (cell && !cell.fixed && cell.type !== 'firewall' && cell.type !== 'empty') {
    next.set(k, { ...cell, rotation: (cell.rotation + 1) % 4 })
  }
  return next
}

// ---------------------------------------------------------------------------
// Scoring (lower is better)
// ---------------------------------------------------------------------------

/**
 * PURE. Deterministic score: lower is better. Combines move count and elapsed
 * time into a single positive integer. Moves dominate (each move ~ 100 points),
 * time contributes 1 point per second.
 *
 * Formula: floor(moves * 100 + elapsedMs / 1000). Deterministic for the same
 * inputs; fewer moves AND less time both strictly decrease the score.
 * @param {number} moves
 * @param {number} elapsedMs
 * @returns {number}
 */
export function computeScore(moves, elapsedMs) {
  const movePart = Math.max(0, Math.floor(moves)) * 100
  const timePart = Math.floor(Math.max(0, elapsedMs) / 1000)
  return movePart + timePart
}

// ---------------------------------------------------------------------------
// LEVELS — hand-built, guaranteed solvable (isLevelSolvable proves it).
// ---------------------------------------------------------------------------
// Each level's `cells` are placed at their SOLUTION rotation but NOT marked
// `fixed`, so the player can rotate them away and back. Source/target are
// virtual endpoints outside the rotatable grid (or pinned at edges). The
// shipped initial rotation for each cell is the SOLVED rotation, so a level
// loads solved — the player can still scramble+solve it, and the solver
// guarantees a solution exists from ANY scramble of the rotatable tiles.
//
// Coordinate system: r grows DOWN (South), c grows RIGHT (East). A side "S"
// on the source means the source's packet exits to the South.

/** @type {Level[]} */
export const LEVELS = [
  // ----- Level 1: trivial 3x1 straight corridor ---------------------------
  // Source (0,0) S -> straight (1,0) -> target (2,0) N.
  // Wait: 3 rows so source/target sit at the row-0 and row-2 cells; the one
  // rotatable straight tile sits between them at (1,0). Initial rotation 0
  // (N+S) is the solution.
  {
    id: 'l1',
    nameKey: 'packetRoute.levels.l1.name',
    cols: 1,
    rows: 3,
    source: { r: -1, c: 0, side: 'S' }, // above the grid, opens South into (0,0)
    target: { r: 3, c: 0, side: 'N' }, // below the grid, opens North out of (2,0)
    cells: [
      { r: 0, c: 0, type: 'straight', rotation: 0 },
      { r: 1, c: 0, type: 'straight', rotation: 0 },
      { r: 2, c: 0, type: 'straight', rotation: 0 },
    ],
    firewalls: [],
  },

  // ----- Level 2: 3x3 with an elbow turn ----------------------------------
  // Source (0,1) S -> straight (1,1) -> elbow (2,1) N+E -> elbow (2,2) W+S
  // -> target (3,2)? No: keep target on-grid edge. Let target = virtual below
  // (2,2). Actually source above (0,1) and target below (2,2): path turns.
  // Path: (0,1)S down to (1,1) straight, (2,1) elbow N+E turns east, (2,2)
  // elbow W+S turns south to target below it.
  {
    id: 'l2',
    nameKey: 'packetRoute.levels.l2.name',
    cols: 3,
    rows: 3,
    source: { r: -1, c: 1, side: 'S' },
    target: { r: 3, c: 2, side: 'N' },
    cells: [
      { r: 0, c: 1, type: 'straight', rotation: 0 }, // N+S
      { r: 1, c: 1, type: 'straight', rotation: 0 }, // N+S
      { r: 2, c: 1, type: 'elbow', rotation: 0 }, // N+E
      { r: 2, c: 2, type: 'elbow', rotation: 2 }, // S+W
      // decoy tiles (solvable path ignores them; rotating them can break)
      { r: 0, c: 0, type: 'elbow', rotation: 1 },
      { r: 0, c: 2, type: 'elbow', rotation: 3 },
    ],
    firewalls: [{ r: 1, c: 0 }, { r: 1, c: 2 }],
  },

  // ----- Level 3: 4x4 with a T-junction and more firewalls ---------------
  // Source (0,0) S -> straight (1,0) -> elbow (2,0) N+E -> straight (2,1) E+W
  // -> elbow (2,2) W+S -> straight (3,2) N+S -> target (4,2) N. With decoys
  // and firewalls forming obstacles.
  {
    id: 'l3',
    nameKey: 'packetRoute.levels.l3.name',
    cols: 4,
    rows: 4,
    source: { r: -1, c: 0, side: 'S' },
    target: { r: 4, c: 2, side: 'N' },
    cells: [
      { r: 0, c: 0, type: 'straight', rotation: 0 }, // N+S
      { r: 1, c: 0, type: 'straight', rotation: 0 }, // N+S
      { r: 2, c: 0, type: 'elbow', rotation: 0 }, // N+E
      { r: 2, c: 1, type: 'straight', rotation: 1 }, // E+W
      { r: 2, c: 2, type: 'elbow', rotation: 2 }, // S+W
      { r: 3, c: 2, type: 'straight', rotation: 0 }, // N+S
      // decoys
      { r: 0, c: 2, type: 't', rotation: 1 },
      { r: 3, c: 0, type: 'elbow', rotation: 2 },
      { r: 1, c: 3, type: 'cross', rotation: 0 },
    ],
    firewalls: [
      { r: 1, c: 1 },
      { r: 3, c: 1 },
      { r: 0, c: 3 },
    ],
  },
]

// ===========================================================================
// Reactive factory
// ===========================================================================

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
const BEST_SCORES_KEY = 'packetRoute.bestScores'

/** Read persisted best scores (per level id) from localStorage. */
function loadBestScores() {
  try {
    const raw = localStorage.getItem(BEST_SCORES_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function saveBestScores(scores) {
  try {
    localStorage.setItem(BEST_SCORES_KEY, JSON.stringify(scores))
  } catch {
    /* ignore quota / private-mode failures */
  }
}

/**
 * Reactive Packet Route state + actions. Single rAF loop drives ONLY the
 * packet-travel animation (transform/opacity); cancelled on completion/unmount.
 * Pauses on IntersectionObserver-hidden + document.hidden. Reduced-motion
 * skips animation entirely (instant `won`).
 */
export function usePacketRoute() {
  const levelIndex = ref(0)
  /** @type {import('vue').Ref<Map<string, Cell>>} */
  const grid = ref(buildGrid(LEVELS[0]))
  const moves = ref(0)
  const elapsedMs = ref(0)
  const status = ref('idle') // 'idle' | 'transmitting' | 'won' | 'lost'
  const hintCell = ref(null) // { r, c } | null
  const prefersReducedMotion = ref(false)
  const packetPath = ref([]) // ordered cells the packet travels along
  const packetProgress = ref(0) // 0..path.length (cell index the orb sits at)

  const bestScores = ref(loadBestScores())
  const currentLevel = computed(() => LEVELS[levelIndex.value])
  const bestScore = computed(() => bestScores.value[currentLevel.value.id] ?? null)

  // --- timer ---------------------------------------------------------------
  let timerHandle = null
  let startTime = null
  let visibilityHandler = null
  let intersectionObs = null
  let isVisible = ref(true)

  function startTimer() {
    stopTimer()
    startTime = Date.now()
    elapsedMs.value = 0
    timerHandle = window.setInterval(() => {
      if (isVisible.value && startTime !== null) {
        elapsedMs.value = Date.now() - startTime
      }
    }, 250)
  }

  function stopTimer() {
    if (timerHandle !== null) {
      window.clearInterval(timerHandle)
      timerHandle = null
    }
  }

  // --- keyboard cursor -----------------------------------------------------
  const cursor = ref({ r: 0, c: 0 })

  function moveCursor(dir) {
    const { rows, cols } = currentLevel.value
    if (dir === 'up') cursor.value = { r: Math.max(0, cursor.value.r - 1), c: cursor.value.c }
    if (dir === 'down') cursor.value = { r: Math.min(rows - 1, cursor.value.r + 1), c: cursor.value.c }
    if (dir === 'left') cursor.value = { r: cursor.value.r, c: Math.max(0, cursor.value.c - 1) }
    if (dir === 'right') cursor.value = { r: cursor.value.r, c: Math.min(cols - 1, cursor.value.c + 1) }
  }

  // --- actions -------------------------------------------------------------

  function rotateTile(r, c) {
    if (status.value === 'transmitting') return
    if (status.value === 'won' || status.value === 'lost') return
    const cell = grid.value.get(key(r, c))
    if (!cell || cell.fixed || cell.type === 'firewall' || cell.type === 'empty') return
    grid.value = rotateTileOnGrid(grid.value, r, c)
    moves.value += 1
    // Start the timer on first interaction.
    if (timerHandle === null) startTimer()
    // Clear any stale hint once the player moves.
    hintCell.value = null
  }

  function cursorRotate() {
    rotateTile(cursor.value.r, cursor.value.c)
  }

  // --- packet-travel animation (single rAF) --------------------------------
  let rafHandle = null
  let animStart = null
  const ANIM_STEP_MS = 220 // per-cell travel time

  function stopRAF() {
    if (rafHandle !== null) {
      window.cancelAnimationFrame(rafHandle)
      rafHandle = null
    }
  }

  function animatePacket() {
    const path = packetPath.value
    if (path.length === 0) {
      finishWin()
      return
    }
    animStart = performance.now()
    const step = (now) => {
      const elapsed = now - animStart
      const idx = elapsed / ANIM_STEP_MS
      if (idx >= path.length) {
        packetProgress.value = path.length - 1
        finishWin()
        return
      }
      packetProgress.value = idx
      rafHandle = window.requestAnimationFrame(step)
    }
    rafHandle = window.requestAnimationFrame(step)
  }

  function finishWin() {
    stopRAF()
    status.value = 'won'
    stopTimer()
    // Persist best score (lower is better).
    const score = computeScore(moves.value, elapsedMs.value)
    const id = currentLevel.value.id
    const prev = bestScores.value[id]
    if (prev === undefined || score < prev) {
      bestScores.value = { ...bestScores.value, [id]: score }
      saveBestScores(bestScores.value)
    }
  }

  function transmit() {
    if (status.value === 'transmitting' || status.value === 'won') return
    const path = findPath(grid.value, currentLevel.value.source, currentLevel.value.target)
    if (!path) {
      status.value = 'lost'
      return
    }
    status.value = 'transmitting'
    packetPath.value = path
    packetProgress.value = 0
    if (prefersReducedMotion.value || !isVisible.value) {
      // Reduced motion OR offscreen -> instant result, no animation.
      packetProgress.value = Math.max(0, path.length - 1)
      finishWin()
      return
    }
    animatePacket()
  }

  function reset() {
    stopRAF()
    stopTimer()
    grid.value = buildGrid(currentLevel.value)
    moves.value = 0
    elapsedMs.value = 0
    status.value = 'idle'
    hintCell.value = null
    packetPath.value = []
    packetProgress.value = 0
    cursor.value = { r: 0, c: 0 }
  }

  function loadLevel(idx) {
    stopRAF()
    stopTimer()
    levelIndex.value = idx
    grid.value = buildGrid(LEVELS[idx])
    moves.value = 0
    elapsedMs.value = 0
    status.value = 'idle'
    hintCell.value = null
    packetPath.value = []
    packetProgress.value = 0
    cursor.value = { r: 0, c: 0 }
  }

  function nextLevel() {
    const next = (levelIndex.value + 1) % LEVELS.length
    loadLevel(next)
  }

  function replay() {
    reset()
  }

  function requestHint() {
    // Highlight one correct tile using findPath of the CURRENT grid (only
    // useful if the player is mid-solve). If not currently connected, fall
    // back to highlighting a tile on a known solution (the level's initial
    // solved grid).
    let path = findPath(grid.value, currentLevel.value.source, currentLevel.value.target)
    if (!path) {
      // Use the shipped solved grid to point at a tile that BELONGS to a
      // solution, so the hint is always informative.
      const solved = buildGrid(currentLevel.value)
      path = findPath(solved, currentLevel.value.source, currentLevel.value.target)
    }
    if (path && path.length > 0) {
      // Pick the first non-fixed tile on the path.
      const target = path.find((c) => !c.fixed) || path[0]
      hintCell.value = { r: target.r, c: target.c }
    }
  }

  // --- visibility / offscreen throttle -------------------------------------
  function updateVisibility() {
    isVisible.value =
      (typeof document === 'undefined' || document.visibilityState !== 'hidden')
  }

  // --- lifecycle -----------------------------------------------------------
  let motionMq = null
  function onMotionChange(e) {
    prefersReducedMotion.value = !!(e && e.matches)
  }

  onMounted(() => {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      motionMq = window.matchMedia(REDUCED_MOTION_QUERY)
      prefersReducedMotion.value = !!motionMq.matches
      if (motionMq.addEventListener) motionMq.addEventListener('change', onMotionChange)
      else if (motionMq.addListener) motionMq.addListener(onMotionChange)
    }
    if (typeof document !== 'undefined') {
      visibilityHandler = () => {
        updateVisibility()
        // If we just became hidden mid-animation, pause it (instant finish on
        // return is acceptable; for simplicity we cancel and let the next
        // transmit re-run).
        if (!isVisible.value && status.value === 'transmitting') {
          stopRAF()
          finishWin()
        }
      }
      document.addEventListener('visibilitychange', visibilityHandler)
    }
    // IntersectionObserver on the document body as a fallback root (the host
    // component may pass its own root; this keeps the composable usable bare).
    if (typeof window !== 'undefined' && typeof window.IntersectionObserver !== 'undefined') {
      intersectionObs = new window.IntersectionObserver((entries) => {
        for (const entry of entries) {
          isVisible.value = entry.isIntersecting
            && (typeof document === 'undefined' || document.visibilityState !== 'hidden')
        }
      })
      if (typeof document !== 'undefined' && document.body) {
        intersectionObs.observe(document.body)
      }
    }
  })

  onUnmounted(() => {
    stopRAF()
    stopTimer()
    if (motionMq) {
      if (motionMq.removeEventListener) motionMq.removeEventListener('change', onMotionChange)
      else if (motionMq.removeListener) motionMq.removeListener(onMotionChange)
    }
    if (visibilityHandler && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', visibilityHandler)
    }
    if (intersectionObs) {
      intersectionObs.disconnect()
      intersectionObs = null
    }
  })

  return {
    // state (every ref has a template consumer in PacketRoute.vue)
    levelIndex,
    grid,
    moves,
    elapsedMs,
    status: readonly(status),
    hintCell: readonly(hintCell),
    prefersReducedMotion,
    packetPath: readonly(packetPath),
    packetProgress: readonly(packetProgress),
    cursor,
    bestScores: readonly(bestScores),
    // computed
    currentLevel,
    bestScore,
    levels: LEVELS,
    // actions
    rotateTile,
    cursorRotate,
    moveCursor,
    transmit,
    reset,
    nextLevel,
    replay,
    requestHint,
  }
}
