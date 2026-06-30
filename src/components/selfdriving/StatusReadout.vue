<script setup>
/**
 * @component StatusReadout
 * @description Cycle counter + decision readout for the Self-Driving demo (#203).
 *
 * Surfaces the loop iteration and the current phase's decision line. The
 * cycling counter interpolates {n} at render (useLanguage.t does not natively
 * interpolate, so we .replace() here, matching the #203 plan).
 *
 * @ticket #203
 */
import { computed } from 'vue'
import { useLanguage } from '../../composables/useLanguage'

const { t } = useLanguage()

const props = defineProps({
  loopIteration: { type: Number, default: 0 },
  phaseId: { type: String, default: 'intake' },
  // Key into selfDriving.readout.* ; parent picks merged/cycling/complete.
  readoutKey: { type: String, default: 'cycling' },
})

const readoutText = computed(() => {
  const raw = t(`selfDriving.readout.${props.readoutKey}`)
  // Interpolate {n} with the current cycle count (1-indexed for display).
  return raw.replace('{n}', String(props.loopIteration + 1))
})

// Map EVERY phase to a narration line so the cycling readout always surfaces
// the live stage (MEDIUM-2 — the dead-reactive-state gate flagged that the
// earlier map only covered 4 of 8 phases, so for intake/triage/merger/resolved
// the phase line silently vanished). For the coder-ish stages we reuse the
// dedicated streaming.* lines (they read like a live console feed); for the
// other four we fall back to that phase's status prose, which already exists
// in both locales and is user-facing. Phase ids not in the map yield '' and
// the v-if below hides the line — the contract stays defensive.
const STREAMING_PHASES = {
  planner: 'plannerLine',
  coder: 'coderLine',
  security: 'securityLine',
  evaluator: 'evalLine',
}
const STATUS_PHASES = ['intake', 'triage', 'merger', 'resolved']
const phaseLine = computed(() => {
  if (STREAMING_PHASES[props.phaseId]) {
    return t(`selfDriving.streaming.${STREAMING_PHASES[props.phaseId]}`)
  }
  if (STATUS_PHASES.includes(props.phaseId)) {
    return t(`selfDriving.phases.${props.phaseId}.status`)
  }
  return ''
})
</script>

<template>
  <div class="status-readout">
    <div class="status-readout-cycle neon-text">{{ readoutText }}</div>
    <div
      v-if="phaseLine"
      class="status-readout-line"
      :data-phase-narration="phaseId"
    >{{ phaseLine }}</div>
  </div>
</template>

<style scoped>
.status-readout {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.status-readout-cycle {
  font-family: var(--font-display);
  font-size: 0.85rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.status-readout-line {
  font-family: 'Fira Code', 'Courier New', monospace;
  font-size: 0.72rem;
  color: var(--text-secondary);
}
</style>
