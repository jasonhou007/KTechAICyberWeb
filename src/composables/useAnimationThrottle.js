/**
 * @file useAnimationThrottle.js
 * @description Pause always-on view-level timers/loops when nobody is looking
 * at the element (Issue #253 perf — eliminate visible lag).
 * @ticket #253
 *
 * Returns a reactive `isPaused` computed that is true when EITHER:
 *   - the document is hidden (user switched tabs / minimized), OR
 *   - the target element is outside the viewport (scrolled away).
 *
 * Built on @vueuse/core's useDocumentVisibility (reads document.visibilityState
 * and re-evaluates on the visibilitychange event) and useIntersectionObserver
 * (wraps the native IO). VueUse v14's useIntersectionObserver does NOT return
 * an isOutside flag — it forwards IO entries to the callback — so this composable
 * tracks the latest intersection state in a local ref and derives isOutside from
 * it. VueUse owns the onUnmounted cleanup (tryOnScopeDispose -> stop ->
 * observer.disconnect); this composable adds no manual teardown of its own.
 *
 * The consumer watches `isPaused` and pauses/resumes its own timer/loop
 * accordingly — see NeuralTerminal.vue's activityDecayTimer wiring.
 *
 * Why a generic composable (not bespoke NeuralTerminal logic): the same
 * hidden/offscreen pause is the correct behavior for ANY always-on view-level
 * timer. Centralizing it keeps the contract (one source of truth for "is this
 * element worth animating right now") reusable and testable in isolation.
 *
 * @param {import('vue').Ref<HTMLElement|null>} target - the element whose
 *   visibility gates the animation. Pass a template ref.
 * @param {Object} [options]
 * @param {number} [options.threshold] - IO threshold (default 0).
 * @param {string} [options.rootMargin] - IO rootMargin (default '0px'); callers
 *   that want early-mount/late-unmount headroom can pass e.g. '200px'.
 * @returns {{ isPaused: import('vue').ComputedRef<boolean> }}
 *   - isPaused: true when the document is hidden OR the target is offscreen.
 */
import { computed, ref } from 'vue'
import { useDocumentVisibility, useIntersectionObserver } from '@vueuse/core'

export function useAnimationThrottle(target, options = {}) {
  const { threshold = 0, rootMargin = '0px' } = options

  // useDocumentVisibility returns a ref tracking document.visibilityState
  // ('visible' | 'hidden' | ...). It is reactive across visibilitychange.
  const visibility = useDocumentVisibility()
  const documentHidden = computed(() => visibility.value !== 'visible')

  // VueUse v14's useIntersectionObserver forwards entries to the callback but
  // does not expose an isOutside flag, so we track the latest intersection
  // ratio ourselves. Initial value: 0 (treated as offscreen) until the first IO
  // callback fires. The global test setup fires isIntersecting=true on observe,
  // so an in-DOM target settles to intersecting on the microtask after mount —
  // matching real-browser behavior.
  const intersectionRatio = ref(0)
  useIntersectionObserver(
    target,
    (entries) => {
      const entry = entries[0]
      if (entry) {
        intersectionRatio.value =
          entry.intersectionRatio !== undefined
            ? entry.intersectionRatio
            : entry.isIntersecting
              ? 1
              : 0
      }
    },
    { threshold, rootMargin },
  )
  const isOutside = computed(() => intersectionRatio.value <= 0)

  const isPaused = computed(() => documentHidden.value || isOutside.value)

  return { isPaused }
}
