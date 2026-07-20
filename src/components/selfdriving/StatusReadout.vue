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
  // i18n prefix for services variant (default 'selfDriving')
  i18nPrefix: { type: String, default: 'selfDriving' },
})

const readoutText = computed(() => {
  const raw = t(`${props.i18nPrefix}.readout.${props.readoutKey}`)
  // Interpolate {n} with the current cycle count (1-indexed for display).
  return raw.replace('{n}', String(props.loopIteration + 1))
})

// Map EVERY phase to a narration line so the cycling readout always surfaces
// the live stage. For the coder-ish stages we reuse the dedicated streaming.*
// lines; for other phases we fall back to that phase's status prose.
const STREAMING_PHASES = {
  planner: 'plannerLine',
  coder: 'coderLine',
  security: 'securityLine',
  evaluator: 'evalLine',
  // Services streaming phases
  aiAnalysis: 'analysisLine',
  pipelineValidation: 'validationLine',
  serviceExecution: 'executionLine',
}
const STATUS_PHASES = ['intake', 'triage', 'merger', 'resolved', 'dataIngestion', 'serviceComplete', 'resultDelivery']
const phaseLine = computed(() => {
  const prefix = props.i18nPrefix
  if (STREAMING_PHASES[props.phaseId]) {
    return t(`${prefix}.streaming.${STREAMING_PHASES[props.phaseId]}`)
  }
  if (STATUS_PHASES.includes(props.phaseId)) {
    return t(`${prefix}.phases.${props.phaseId}.status`)
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
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--text-secondary);
}
</style>
