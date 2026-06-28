/**
 * @file useParallax.js
 * @description Reduced-motion-safe mouse-move parallax composable (AC #177).
 *
 * Adds a subtle translate transform to selected layers based on the cursor's
 * normalized position within the viewport. Two guards keep it accessible:
 *
 *   AC4 — prefers-reduced-motion: if the user has requested reduced motion the
 *         composable never attaches a listener and `enabled` is false. A global
 *         CSS rule in src/styles/accessibility.css also neutralizes any transform
 *         a prior frame may have written before the guard ran.
 *   AC6 — touch / coarse pointer: the same short-circuit fires on touch devices
 *         where a mouse cursor is absent.
 *
 * The mousemove handler only stores the latest normalized position and schedules
 * ONE requestAnimationFrame (AC5 coalescing); the rAF callback applies the
 * transforms. transform is the only property mutated (no layout thrash).
 *
 * @example
 *   const rootRef = ref(null)
 *   const { enabled } = useParallax({
 *     rootRef,
 *     layers: [
 *       { selector: '.grid-bg', intensity: 12 },
 *       { selector: '.cyber-header', intensity: 20 },
 *     ],
 *   })
 */

import { onMounted, onUnmounted, ref } from 'vue'
import { prefersReducedMotion } from '../utils/accessibility.js'

/**
 * @typedef {Object} ParallaxLayer
 * @property {string} selector   CSS selector (resolved against the root element)
 * @property {number} intensity  Max translate distance in px at the viewport edge
 */

/**
 * Wire up reduced-motion-safe mouse-move parallax for the layers inside `rootRef`.
 *
 * @param {Object} opts
 * @param {import('vue').Ref<HTMLElement|null>} opts.rootRef  Ref to the root element
 *   that scopes both the mousemove listener and the layer queries.
 * @param {ParallaxLayer[]} opts.layers  Layers to translate, each with its own intensity.
 * @returns {{ enabled: import('vue').Ref<boolean>, cleanup: () => void }}
 */
export function useParallax({ rootRef, layers }) {
  const enabled = ref(false)

  /** @type {ParallaxLayer[]} */
  const resolved = layers.map((layer) => ({
    selector: layer.selector,
    intensity: layer.intensity,
    el: null,
  }))

  let latestX = 0
  let latestY = 0
  let pendingFrame = null

  const applyTransforms = () => {
    pendingFrame = null
    const nx = latestX
    const ny = latestY
    for (const layer of resolved) {
      // Re-query if the element vanished (e.g. dynamic content). Cache for perf.
      if (!layer.el && rootRef.value) {
        layer.el = rootRef.value.querySelector(layer.selector)
      }
      const el = layer.el
      if (!el) continue
      el.style.transform = `translate(${nx * layer.intensity}px, ${ny * layer.intensity}px)`
      el.dataset.parallax = 'on'
    }
  }

  const onMouseMove = (event) => {
    const vw = window.innerWidth || 1
    const vh = window.innerHeight || 1
    latestX = (event.clientX / vw) * 2 - 1
    latestY = (event.clientY / vh) * 2 - 1
    if (pendingFrame === null) {
      pendingFrame = window.requestAnimationFrame(applyTransforms)
    }
  }

  const cleanup = () => {
    if (rootRef.value) {
      rootRef.value.removeEventListener('mousemove', onMouseMove)
    }
    if (pendingFrame !== null) {
      window.cancelAnimationFrame(pendingFrame)
      pendingFrame = null
    }
  }

  onMounted(() => {
    // AC4 — per-handler reduced-motion guard. Reuses the shared helper so the
    // detection contract stays in one place.
    if (prefersReducedMotion()) {
      enabled.value = false
      return
    }

    // AC6 — touch / coarse-pointer no-op. Either signal disables parallax.
    const coarsePointer =
      (window.matchMedia &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(pointer: coarse)').matches) ||
      'ontouchstart' in window
    if (coarsePointer) {
      enabled.value = false
      return
    }

    if (!rootRef.value) return
    enabled.value = true

    // Cache layer elements once for perf; the rAF re-queries if one is missing.
    for (const layer of resolved) {
      layer.el = rootRef.value.querySelector(layer.selector)
    }

    rootRef.value.addEventListener('mousemove', onMouseMove)
  })

  onUnmounted(cleanup)

  return { enabled, cleanup }
}

export default useParallax
