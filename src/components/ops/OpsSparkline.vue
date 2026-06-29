<script setup>
// OpsSparkline.vue — latency/throughput history as an SVG polyline.
// Pure presentation: renders `history` (number[]) scaled into a viewBox.
import { computed } from 'vue'

const props = defineProps({
  history: { type: Array, required: true }, // number[]
  label: { type: String, required: true },
  unit: { type: String, default: '' },
  color: { type: String, default: 'green' }, // 'green' | 'blue'
  width: { type: Number, default: 120 },
  height: { type: Number, default: 40 },
})

const W = 120
const H = 40
const PAD = 4

const points = computed(() => {
  const data = props.history && props.history.length ? props.history : [0]
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const n = data.length
  return data
    .map((v, i) => {
      const x = PAD + (i / Math.max(1, n - 1)) * (W - 2 * PAD)
      const y = H - PAD - ((v - min) / range) * (H - 2 * PAD)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
})

const lastValue = computed(() => {
  const data = props.history && props.history.length ? props.history : [0]
  return data[data.length - 1]
})

const strokeVar = computed(() => (props.color === 'blue' ? 'var(--neon-blue)' : 'var(--neon-green)'))
</script>

<template>
  <div class="ops-sparkline" data-test="ops-sparkline">
    <div class="ops-sparkline-head">
      <span class="ops-sparkline-label">{{ label }}</span>
      <span class="ops-sparkline-value">{{ lastValue }}<span class="ops-sparkline-unit">{{ unit }}</span></span>
    </div>
    <svg
      class="ops-sparkline-svg"
      :viewBox="`0 0 ${W} ${H}`"
      preserveAspectRatio="none"
      :aria-label="`${label}: ${lastValue}${unit}`"
      role="img"
    >
      <polyline
        :points="points"
        fill="none"
        :stroke="strokeVar"
        stroke-width="1.5"
        stroke-linejoin="round"
        stroke-linecap="round"
      />
    </svg>
  </div>
</template>

<style scoped>
.ops-sparkline {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  width: 100%;
}

.ops-sparkline-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.ops-sparkline-label {
  font-family: var(--font-body);
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.ops-sparkline-value {
  font-family: var(--font-display);
  font-size: 0.95rem;
  color: var(--text-primary);
}

.ops-sparkline-unit {
  font-size: 0.65rem;
  margin-left: 0.1rem;
  color: var(--text-secondary);
}

.ops-sparkline-svg {
  width: 100%;
  height: 40px;
  filter: drop-shadow(0 0 2px currentColor);
}
</style>
