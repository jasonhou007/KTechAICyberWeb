/**
 * @file useNeuralNet.js
 * @description Reactive brain for the AI Core neural-network visualizer (#179).
 *
 * Owns all neural-net state and logic, mirroring the composable pattern from
 * useTerminal.js (#161): the NeuralCore.vue view is a thin SVG presentation
 * layer over this composable and has no business logic of its own.
 *
 * Responsibilities:
 *  - graph model: layers + nodes + synapses (synapses only between adjacent
 *    layers), deterministic layout coords.
 *  - resolvePath: BFS from an input node to any output node through adjacent
 *    layers (the path a pulse packet travels).
 *  - inference state machine: idle -> running -> done, with one pulse per input
 *    node advanced by a SINGLE shared requestAnimationFrame loop (transform-only
 *    geometry so it stays GPU-cheap). On completion a deterministic benign
 *    readout (APPROVE / REVIEW / FLAG + confidence) is set and the rAF loop is
 *    cancelled.
 *  - drag: beginDrag/dragTo/endDrag reposition a node; synapse geometry is a
 *    computed that tracks the new endpoints live.
 *  - idle breathing: after 2500ms of inactivity isIdle flips true; the SVG root
 *    gets a `breathing` class only when motion is allowed.
 *  - prefers-reduced-motion wiring (mirrors useTerminal): runInference skips the
 *    rAF loop and jumps straight to done with the readout; breathing is never
 *    eligible.
 *
 * The readout is deterministic and benign — pulled from a seeded table, NOT
 * real ML output.
 *
 * @ticket #179
 */

import { ref, computed, readonly, onMounted, onUnmounted } from 'vue'

// ---------------------------------------------------------------------------
// Layer / graph configuration
// ---------------------------------------------------------------------------

// Desktop: 3 layers x {4, 5, 4} = 13 nodes. Mobile degrades to {2, 3, 2} = 7.
// Caps keep the SVG cheap (<=16 nodes) so transforms stay smooth at 60fps.
const DESKTOP_SIZES = [4, 5, 4]
const MOBILE_SIZES = [2, 3, 2]

// Deterministic benign readout pool. Seeded by the input node count so the same
// graph always decodes to the same verdict — tests are stable and it is NOT
// real ML output. Confidence values are fixed per decision.
const READOUT_TABLE = [
  { decisionKey: 'approve', confidence: 98.2 },
  { decisionKey: 'review', confidence: 87.4 },
  { decisionKey: 'flag', confidence: 73.1 },
]

// SVG canvas the layout is plotted against. The view sizes the <svg> to fit;
// these are the coordinate-space extents the composable lays nodes out in.
const VIEW_W = 320
const VIEW_H = 200
const NODE_R = 9
const PULSE_SPEED = 0.06 // progress per frame (~1.0s end-to-end at 60fps)

const IDLE_DELAY_MS = 2500
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

// ---------------------------------------------------------------------------
// Tiny id generator (module-scoped so successive mounts get unique ids)
// ---------------------------------------------------------------------------
let _seq = 0
function nextId(prefix) {
  _seq += 1
  return `${prefix}-${_seq}`
}

// ---------------------------------------------------------------------------
// Graph construction (pure)
// ---------------------------------------------------------------------------

/**
 * Build the layer/node/synapse model for the chosen node counts.
 * Returns plain data (no refs) so it is trivially testable.
 */
function buildGraph(sizes) {
  const layers = sizes.map((count, index) => {
    const kind = index === 0 ? 'input' : index === sizes.length - 1 ? 'output' : 'hidden'
    return { index, kind, count }
  })

  const nodes = []
  layers.forEach((layer) => {
    const x = ((layer.index + 1) / (layers.length + 1)) * VIEW_W
    for (let i = 0; i < layer.count; i++) {
      // Evenly distribute nodes vertically, centered on the canvas midline.
      const span = layer.count + 1
      const y = ((i + 1) / span) * VIEW_H
      nodes.push({
        id: nextId('n'),
        layerIndex: layer.index,
        layerKind: layer.kind,
        x,
        y,
        r: NODE_R,
      })
    }
  })

  // Synapses: fully connect each adjacent layer pair. Geometry is derived from
  // the current node coords via a computed below, so dragging a node updates
  // every touching synapse for free.
  const synapses = []
  for (let li = 0; li < layers.length - 1; li++) {
    const fromNodes = nodes.filter((n) => n.layerIndex === li)
    const toNodes = nodes.filter((n) => n.layerIndex === li + 1)
    for (const a of fromNodes) {
      for (const b of toNodes) {
        synapses.push({
          id: nextId('s'),
          from: a.id,
          to: b.id,
        })
      }
    }
  }

  return { layers, nodes, synapses }
}

/**
 * BFS through adjacent layers from a start node to any node in the final layer.
 * Returns an array of node ids starting at `startId` and ending in an output
 * node, with monotone non-decreasing layer indices. Deterministic (first-found
 * neighbor order).
 */
function resolvePathFor(startId, nodes, synapses, lastLayerIndex) {
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const start = byId.get(startId)
  if (!start) return []

  // Adjacency from synapses (undirected within a layer step, but we only walk
  // forward across adjacent layers).
  const forward = new Map()
  for (const s of synapses) {
    if (!forward.has(s.from)) forward.set(s.from, [])
    forward.get(s.from).push(s.to)
  }

  // BFS keeping parent pointers; stop at the first output node reached.
  const queue = [startId]
  const parents = new Map([[startId, null]])
  const visited = new Set([startId])
  let foundEnd = null

  while (queue.length > 0) {
    const cur = queue.shift()
    const curNode = byId.get(cur)
    if (curNode.layerIndex === lastLayerIndex) {
      foundEnd = cur
      break
    }
    const neighbors = forward.get(cur) || []
    for (const next of neighbors) {
      if (visited.has(next)) continue
      visited.add(next)
      parents.set(next, cur)
      queue.push(next)
    }
  }

  if (foundEnd === null) {
    // Fallback: just the start node.
    return [startId]
  }

  // Reconstruct the path start -> end.
  const path = []
  let cur = foundEnd
  while (cur !== null) {
    path.unshift(cur)
    cur = parents.get(cur)
  }
  return path
}

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------

/**
 * @param {object} [opts]
 * @param {boolean} [opts.mobile=false] Force the mobile (degraded) graph.
 */
export function useNeuralNet(opts = {}) {
  const mobile = !!opts.mobile

  // --- graph ---------------------------------------------------------------
  const sizes = mobile ? MOBILE_SIZES : DESKTOP_SIZES
  const graph = buildGraph(sizes)

  // Nodes live in a ref so drag can mutate coordinates reactively. We keep a
  // stable array reference and mutate item fields (drag updates x/y in place
  // then bump a revision counter to trigger computed recompute).
  const nodes = ref(graph.nodes.map((n) => ({ ...n })))
  const synapseSeed = graph.synapses
  const layers = graph.layers

  // Revision counter so the synapse-geometry computed observes node moves
  // without us rebuilding the node array each drag frame.
  const geometryRevision = ref(0)

  const synapses = computed(() => {
    void geometryRevision.value // track
    const byId = new Map(nodes.value.map((n) => [n.id, n]))
    return synapseSeed.map((s) => {
      const a = byId.get(s.from)
      const b = byId.get(s.to)
      return {
        ...s,
        geometry: {
          x1: a ? a.x : 0,
          y1: a ? a.y : 0,
          x2: b ? b.x : 0,
          y2: b ? b.y : 0,
        },
      }
    })
  })

  // --- resolvePath ---------------------------------------------------------
  const lastLayerIndex = layers.length - 1
  function resolvePath(startId) {
    return resolvePathFor(startId, nodes.value, synapseSeed, lastLayerIndex)
  }

  // --- inference state machine --------------------------------------------
  const inferenceState = ref('idle') // 'idle' | 'running' | 'done'
  const pulses = ref([])
  const readout = ref(null)
  let rafHandle = null

  function pickReadout() {
    // Deterministic pick from the seeded table, keyed off the input-node count
    // so the same graph always decodes the same verdict.
    const inputCount = nodes.value.filter((n) => n.layerIndex === 0).length
    const entry = READOUT_TABLE[inputCount % READOUT_TABLE.length]
    return { ...entry }
  }

  function spawnPulses() {
    const inputNodes = nodes.value.filter((n) => n.layerIndex === 0)
    pulses.value = inputNodes.map((n) => ({
      id: nextId('p'),
      path: resolvePath(n.id),
      progress: 0,
    }))
  }

  function tickPulses() {
    if (inferenceState.value !== 'running') return
    let allDone = true
    for (const p of pulses.value) {
      if (p.progress < 1) {
        p.progress = Math.min(1, p.progress + PULSE_SPEED)
        if (p.progress < 1) allDone = false
      }
    }
    // Trigger reactivity on the pulses array (item mutation isn't enough).
    pulses.value = [...pulses.value]

    if (allDone) {
      finishInference()
      return
    }
    rafHandle = window.requestAnimationFrame(tickPulses)
  }

  function finishInference() {
    if (rafHandle !== null) {
      window.cancelAnimationFrame(rafHandle)
      rafHandle = null
    }
    inferenceState.value = 'done'
    readout.value = pickReadout()
    // The view owns the one-shot glitch flash + readout rendering; we just
    // surface the state.
  }

  function runInference() {
    // Any interaction resets the idle timer.
    resetIdle()
    if (prefersReducedMotion.value) {
      // Reduced motion: skip the rAF loop entirely, jump straight to done with
      // the readout. No pulses, no glitch-eligible state.
      inferenceState.value = 'done'
      pulses.value = []
      readout.value = pickReadout()
      return
    }
    inferenceState.value = 'running'
    readout.value = null
    spawnPulses()
    rafHandle = window.requestAnimationFrame(tickPulses)
  }

  function resetInference() {
    if (rafHandle !== null) {
      window.cancelAnimationFrame(rafHandle)
      rafHandle = null
    }
    inferenceState.value = 'idle'
    pulses.value = []
    readout.value = null
  }

  // --- drag ----------------------------------------------------------------
  // beginDrag captures the node + the pointer origin; dragTo moves the node by
  // the pointer delta (mutating node x/y in place + bumping the geometry
  // revision so synapses recompute); endDrag clears the drag session.
  let dragNode = null
  let dragOrigin = null

  function beginDrag(node, event) {
    resetIdle()
    dragNode = node
    dragOrigin = {
      clientX: event ? event.clientX : 0,
      clientY: event ? event.clientY : 0,
      nodeX: node.x,
      nodeY: node.y,
    }
  }

  function dragTo(event) {
    if (!dragNode || !dragOrigin || !event) return
    const dx = (event.clientX || 0) - dragOrigin.clientX
    const dy = (event.clientY || 0) - dragOrigin.clientY
    dragNode.x = dragOrigin.nodeX + dx
    dragNode.y = dragOrigin.nodeY + dy
    geometryRevision.value++
  }

  function endDrag() {
    dragNode = null
    dragOrigin = null
    resetIdle()
  }

  // --- prefers-reduced-motion (mirrors useTerminal) ------------------------
  const prefersReducedMotion = ref(false)
  let motionMq = null
  const onMotionChange = (e) => {
    prefersReducedMotion.value = !!(e && e.matches)
  }

  // --- idle breathing ------------------------------------------------------
  const isIdle = ref(false)
  let idleTimer = null

  function resetIdle() {
    isIdle.value = false
    if (idleTimer !== null) {
      clearTimeout(idleTimer)
      idleTimer = null
    }
    if (prefersReducedMotion.value) return // never schedule under reduced motion
    idleTimer = setTimeout(() => {
      isIdle.value = true
    }, IDLE_DELAY_MS)
  }

  // Breathing is eligible only when the user has left the viz alone AND motion
  // is allowed. The SVG root binds this to decide whether to wear the
  // `breathing` class.
  const isBreathingEligible = computed(
    () => isIdle.value && !prefersReducedMotion.value,
  )

  // --- lifecycle -----------------------------------------------------------
  onMounted(() => {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      motionMq = window.matchMedia(REDUCED_MOTION_QUERY)
      prefersReducedMotion.value = !!motionMq.matches
      if (motionMq.addEventListener) {
        motionMq.addEventListener('change', onMotionChange)
      } else if (motionMq.addListener) {
        motionMq.addListener(onMotionChange)
      }
    }
    resetIdle()
  })

  onUnmounted(() => {
    if (rafHandle !== null) {
      window.cancelAnimationFrame(rafHandle)
      rafHandle = null
    }
    if (idleTimer !== null) {
      clearTimeout(idleTimer)
      idleTimer = null
    }
    if (motionMq) {
      if (motionMq.removeEventListener) {
        motionMq.removeEventListener('change', onMotionChange)
      } else if (motionMq.removeListener) {
        motionMq.removeListener(onMotionChange)
      }
    }
  })

  return {
    // graph (read-only views; nodes are reactive so drag updates flow through)
    layers,
    nodes,
    synapses,
    // path resolution
    resolvePath,
    // inference
    inferenceState: readonly(inferenceState),
    pulses,
    readout,
    runInference,
    resetInference,
    // drag
    beginDrag,
    dragTo,
    endDrag,
    // motion
    prefersReducedMotion,
    isIdle,
    isBreathingEligible,
    resetIdle,
  }
}
