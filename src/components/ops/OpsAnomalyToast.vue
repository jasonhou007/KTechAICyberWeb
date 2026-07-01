<script setup>
// OpsAnomalyToast.vue — anomaly toast -> Investigate drill-down + dismiss.
// aria-live=assertive so the anomaly is announced immediately. The glitch
// animation is applied here (capped, non-strobe) and disabled under
// reduced-motion.
import { useLanguage } from '../../composables/useLanguage'

const props = defineProps({
  state: { type: String, required: true }, // 'idle' | 'active' | 'investigating'
  anomaly: { type: Object, default: null },
  reducedMotion: { type: Boolean, default: false },
  ariaLabel: { type: String, required: true },
  investigateLabel: { type: String, required: true },
  dismissLabel: { type: String, required: true },
  titleKey: { type: String, required: true },
  drilldownKey: { type: String, required: true },
})

defineEmits(['investigate', 'dismiss'])

const { t } = useLanguage()
</script>

<template>
  <transition name="ops-toast">
    <div
      v-if="state !== 'idle' && anomaly"
      class="ops-anomaly-toast"
      :class="{ 'ops-investigating': state === 'investigating' }"
      role="alert"
      aria-live="assertive"
      data-test="ops-anomaly-toast"
      :aria-label="ariaLabel"
    >
      <div class="ops-anomaly-head">
        <!-- Glitch is applied to the TITLE element only (not the container) so
             the action buttons stay stable and clickable — a perpetual transform
             on the container would make Playwright's stability check never
             settle. -->
        <span
          class="ops-anomaly-title"
          :class="{ 'ops-glitch': !reducedMotion }"
          :data-text="t(titleKey)"
        >{{ t(titleKey) }}</span>
        <span class="ops-anomaly-state">{{ state }}</span>
      </div>
      <p class="ops-anomaly-drilldown">{{ t(drilldownKey) }}</p>
      <div class="ops-anomaly-actions">
        <button
          v-if="state === 'active'"
          type="button"
          class="ops-anomaly-btn ops-investigate-btn"
          data-test="ops-investigate"
          :aria-label="investigateLabel"
          @click="$emit('investigate')"
        >{{ investigateLabel }}</button>
        <button
          type="button"
          class="ops-anomaly-btn ops-dismiss-btn"
          data-test="ops-dismiss"
          :aria-label="dismissLabel"
          @click="$emit('dismiss')"
        >{{ dismissLabel }}</button>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.ops-anomaly-toast {
  border: 1px solid var(--neon-pink);
  background: rgba(255, 0, 170, 0.08);
  padding: 0.6rem 0.8rem;
  border-radius: var(--radius-sm);
  box-shadow: 0 0 12px var(--accent-magenta-alpha-30);
}

.ops-anomaly-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0.3rem;
}

.ops-anomaly-title {
  font-family: var(--font-display);
  font-size: 0.9rem;
  color: var(--neon-pink);
  text-shadow: 0 0 6px var(--neon-pink);
  position: relative;
}

.ops-anomaly-state {
  font-family: var(--font-body);
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-secondary);
}

.ops-anomaly-drilldown {
  font-family: var(--font-body);
  font-size: 0.8rem;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
}

.ops-anomaly-actions {
  display: flex;
  gap: 0.4rem;
}

.ops-anomaly-btn {
  background: transparent;
  border: 1px solid var(--neon-pink);
  color: var(--neon-pink);
  font-family: var(--font-body);
  font-size: 0.75rem;
  padding: 0.25rem 0.6rem;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
}

.ops-anomaly-btn:hover,
.ops-anomaly-btn:focus-visible {
  background: var(--accent-magenta-alpha-15);
  box-shadow: 0 0 6px var(--neon-pink);
  outline: none;
}

.ops-investigate-btn {
  border-color: var(--neon-green);
  color: var(--neon-green);
}

.ops-investigate-btn:hover,
.ops-investigate-btn:focus-visible {
  background: var(--accent-cyan-alpha-15);
  box-shadow: 0 0 6px var(--neon-green);
}

/* Glitch-on-anomaly: one-shot reveal tear (#271). Previously `0.3s infinite`
   = 3.33Hz, OVER the <3Hz WCAG 2.3.1 photosensitivity ceiling — a transform-
   based strobe that the #234 steps()+infinite audit missed. Now `forwards`
   fires once on toast mount and holds the final frame (cyber aesthetic without
   a continuous strobe). Disabled under reduced-motion below. (Mirrors the
   SolutionForge forge-glitch one-shot pattern.) */
@keyframes ops-glitch {
  0% { transform: translate(0); }
  20% { transform: translate(-1px, 1px); }
  40% { transform: translate(1px, -1px); }
  60% { transform: translate(-1px, 0); }
  80% { transform: translate(1px, 1px); }
  100% { transform: translate(0); }
}

.ops-glitch {
  animation: ops-glitch 0.45s steps(2) forwards;
}

.ops-investigating {
  border-color: var(--neon-green);
  box-shadow: 0 0 12px var(--accent-cyan-alpha-30);
}

.ops-toast-enter-active,
.ops-toast-leave-active {
  transition: opacity 0.2s ease;
}

.ops-toast-enter-from,
.ops-toast-leave-to {
  opacity: 0;
}

/* ---- REDUCED MOTION GUARD (#271) -----------------------------------------
 * Kill the glitch tear under prefers-reduced-motion so the one-shot reveal
 * never runs for users who opt out of motion. The previous comment claimed
 * "Disabled under reduced-motion" but no guard existed — now it does. */
@media (prefers-reduced-motion: reduce) {
  .ops-glitch {
    animation: none;
  }
}
</style>
