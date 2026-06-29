<script setup>
// ========== IMPORTS ==========
import { ref, onMounted } from 'vue'
import { useIntersectionObserver } from '../composables/useIntersectionObserver'

// ========== PROPS ==========
// tag: the wrapper element type. Default 'section' (semantic landmark, matches
//   Home's existing module section wrappers).
// rootMargin + threshold: forwarded to useIntersectionObserver. Defaults bias
//   toward early-mount (200px / 0.01) so a fast scroll does not reveal an empty
//   wrapper — the module is pre-loaded just before it enters the viewport.
// dataTest: forwarded to the wrapper so E2E/unit tests can target the lazy
//   boundary deterministically (e.g. [data-test="lazy-neural-core"]).
// tag validator: <component :is="tag"> can instantiate any resolved name, so
//   restrict it to safe native landmark/wrapper tags. Defense-in-depth against
//   a future caller passing 'script', 'img', or an arbitrary component id.
//   NOTE: inlined (not a module const) because <script setup>'s defineProps is
//   hoisted and cannot reference locally declared variables.
const props = defineProps({
  tag: {
    type: String,
    default: 'section',
    validator: (v) =>
      ['section', 'div', 'article', 'aside', 'main'].includes(v),
  },
  rootMargin: { type: String, default: '200px' },
  threshold: { type: Number, default: 0.01 },
  dataTest: { type: String, default: '' },
})

// ========== STATE ==========
// Sentinel <div ref> observed by the composable. The slot renders only after
// the sentinel first intersects the viewport (isVisible -> true), OR after
// focus enters the wrapper (keyboard/AT path — see mountSlot below).
const sentinel = ref(null)
// wrapper: the <component :is="tag"> root. Used to attach the focusin listener
// that backs the keyboard/AT mount path (WCAG 2.1.1).
const wrapper = ref(null)
const { isVisible, observe, unobserve } = useIntersectionObserver({
  rootMargin: props.rootMargin,
  threshold: props.threshold,
})

// ========== METHODS ==========
// Mount the slot and stop observing. Shared by the intersection callback and
// the focusin handler so both paths converge on the same "mount once" outcome.
const mountSlot = () => {
  if (isVisible.value) return
  isVisible.value = true
  unobserve()
}

// ========== LIFECYCLE ==========
onMounted(() => {
  // observe() is SSR-safe: if IntersectionObserver is undefined (jsdom without
  // a polyfill, or a legacy browser), the composable sets isVisible=true
  // immediately, so content never disappears forever.
  if (sentinel.value) {
    observe(sentinel.value)
  }
  // WCAG 2.1.1 (keyboard): a keyboard-only user Tabbing into a below-the-fold
  // lazy section — or an AT virtual cursor landing focus inside it — must cause
  // the slot to mount even when the viewport never intersects the sentinel.
  // focusin bubbles, so one listener on the wrapper covers focus moving to any
  // slotted descendant. Idempotent with the intersection path via mountSlot().
  if (wrapper.value) {
    wrapper.value.addEventListener('focusin', mountSlot)
  }
})
</script>

<template>
  <component
    :is="tag"
    ref="wrapper"
    class="lazy-section"
    :data-test="dataTest || undefined"
  >
    <!-- Sentinel: a zero-height marker observed for intersection. Always in
         the DOM so the wrapper holds its layout slot even before the slot
         renders (CLS guard, iter-16 perf). -->
    <div ref="sentinel" class="lazy-section__sentinel" aria-hidden="true"></div>
    <!-- The slot payload mounts ONLY after first intersection. Once mounted it
         stays mounted (isVisible never flips back to false in the composable
         — it unobserves after the first hit). -->
    <slot v-if="isVisible" />
  </component>
</template>

<style scoped>
/* Reserve a min-height on the wrapper so the page does not jump (CLS) when the
   lazy module mounts below the fold. 200px is a conservative placeholder that
   covers the typical interactive-module footprint; the real module overrides
   it once mounted. */
.lazy-section {
  position: relative;
  min-height: 200px;
}

.lazy-section__sentinel {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 1px;
  pointer-events: none;
}
</style>
