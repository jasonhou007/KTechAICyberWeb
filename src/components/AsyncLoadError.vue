<script setup>
/**
 * @file AsyncLoadError.vue
 * @description Shared chunk-load error affordance (#232).
 *
 * Rendered as the `errorComponent` of a `defineAsyncComponent` when a lazy
 * chunk fails to fetch (deploy skew / CDN drop / ad-blocker on a hashed asset).
 * Gives the user a localized, screen-reader-announced message and a focusable
 * Reload button that, via the parent's `:key`-bump on the LazySection, forces a
 * remount of the async boundary — which re-runs the loader (resetting the
 * attempt counter).
 *
 * Copy is section-agnostic in this iteration (Approach A). The optional
 * `sectionKey` prop is reserved for future per-section labeling.
 *
 * WCAG: role=alert + aria-live=assertive (4.1.3 Status Messages), a native
 * <button> that is focusable + Enter/Space activatable (2.1.1 Keyboard), and a
 * :focus-visible outline (2.4.7 Focus Visible). No animations — implicitly
 * respects reduced-motion and keeps the affordance cheap.
 *
 * @ticket #232
 */

import { useLanguage } from '../composables/useLanguage'

defineProps({
  // Optional, for future per-section labeling. Copy is section-agnostic today.
  sectionKey: { type: String, default: '' },
  // Reserved for parity with the retry policy; the parent owns the actual
  // re-load via :key-bump, so this is informational only.
  maxAttempts: { type: Number, default: 2 },
})

defineEmits(['retry'])

const { t } = useLanguage()
</script>

<template>
  <div
    class="async-load-error"
    role="alert"
    aria-live="assertive"
    data-test="async-load-error"
  >
    <p class="async-load-error__title">{{ t('asyncLoadError.title') }}</p>
    <p class="async-load-error__message">{{ t('asyncLoadError.message') }}</p>
    <button
      type="button"
      class="async-load-error__retry"
      data-test="async-load-error-retry"
      @click="$emit('retry')"
    >
      {{ t('asyncLoadError.retry') }}
    </button>
  </div>
</template>

<style scoped>
.async-load-error {
  /* Surface card + subtle cyber border; no hardcoded magic numbers. */
  background: var(--surface-card);
  border: 1px solid rgba(0, 255, 204, 0.35);
  border-radius: var(--radius-md);
  padding: 1.5rem;
  margin: 1rem 0;
  text-align: center;
  font-family: var(--font-body);
  color: var(--text-secondary);
}

.async-load-error__title {
  font-family: var(--font-display);
  color: var(--accent-magenta);
  font-size: 1.1rem;
  margin: 0 0 0.5rem 0;
  letter-spacing: 0.05em;
}

.async-load-error__message {
  margin: 0 0 1rem 0;
  line-height: 1.5;
}

.async-load-error__retry {
  background: var(--accent-cyan-alpha-10);
  color: var(--cyan);
  border: 2px solid var(--cyan);
  border-radius: var(--radius-sm);
  padding: 0.5rem 1.25rem;
  font-family: var(--font-display);
  font-size: 0.95rem;
  cursor: pointer;
  transition: background 0.2s ease;
}

.async-load-error__retry:hover {
  background: var(--accent-cyan-alpha-20);
}

.async-load-error__retry:focus-visible {
  /* WCAG 2.4.7 Focus Visible — keyboard focus is unambiguous. */
  outline: 2px solid var(--accent-magenta);
  outline-offset: 2px;
}
</style>
