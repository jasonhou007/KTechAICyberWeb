<script setup>
// OpsGauge.vue — uptime gauge: SVG arc + needle, transform-only animation.
// Reads `value` (0-100) and `label`/`unit`. Pure presentation.
import { computed } from 'vue'

const props = defineProps({
  value: { type: Number, required: true }, // 0-100
  label: { type: String, required: true },
  unit: { type: String, default: '%' },
  reducedMotion: { type: Boolean, default: false },
})

// Needle angle: map 0-100 -> -90deg..90deg (180deg sweep).
const needleRotation = computed(() => -90 + (Math.max(0, Math.min(100, props.value)) / 100) * 180)

// Arc path: a 180deg arc from left (-90) to right (+90), radius 40, centered at (50,50).
const ARC_RADIUS = 40
const arcPath = computed(() => {
  const r = ARC_RADIUS
  const start = { x: 50 - r, y: 50 }
  const end = { x: 50 + r, y: 50 }
  return `M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${end.x} ${end.y}`
})

const displayValue = computed(() => props.value.toFixed(1))
</script>

<template>
  <div class="ops-gauge" data-test="ops-gauge">
    <svg
      class="ops-gauge-svg"
      viewBox="0 0 100 60"
      :aria-label="`${label}: ${displayValue}${unit}`"
      role="img"
    >
      <!-- Track arc -->
      <path :d="arcPath" class="ops-arc-track" fill="none" stroke-width="6" />
      <!-- Value arc: clip via stroke-dasharray to reflect the value fraction. -->
      <path
        :d="arcPath"
        class="ops-arc-value"
        fill="none"
        stroke-width="6"
        :stroke-dasharray="`${(needleRotation + 90) / 180 * Math.PI * ARC_RADIUS} 999`"
      />
      <!-- Needle: transform-only rotation, CSS-animated under motion. -->
      <g
        class="ops-needle"
        :class="{ 'ops-needle-static': reducedMotion }"
        :style="{ transform: `rotate(${needleRotation}deg)` }"
      >
        <line x1="50" y1="50" x2="50" y2="16" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </g>
      <circle cx="50" cy="50" r="3" class="ops-needle-hub" />
    </svg>
    <div class="ops-gauge-readout">
      <span class="ops-gauge-value">{{ displayValue }}<span class="ops-gauge-unit">{{ unit }}</span></span>
      <span class="ops-gauge-label">{{ label }}</span>
    </div>
  </div>
</template>

<style scoped>
.ops-gauge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.ops-gauge-svg {
  width: 100%;
  max-width: 160px;
  height: auto;
  color: var(--neon-green);
}

.ops-arc-track {
  stroke: var(--card-border);
  opacity: 0.5;
}

.ops-arc-value {
  stroke: var(--neon-green);
  filter: drop-shadow(0 0 3px var(--neon-green));
  transition: stroke-dasharray 0.4s ease-out;
}

.ops-needle {
  transform-origin: 50px 50px;
  transition: transform 0.3s ease-out;
}

/* Active needle animation: a subtle oscillation so the gauge "breathes".
   Transform-only (no layout/paint thrash). */
@keyframes ops-gauge-needle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.85; }
}

.ops-needle:not(.ops-needle-static) {
  animation: ops-gauge-needle 1.6s ease-in-out infinite;
}

.ops-needle-static {
  /* No animation under reduced motion. */
  animation: none;
}

.ops-needle-hub {
  fill: var(--neon-green);
  filter: drop-shadow(0 0 2px var(--neon-green));
}

.ops-gauge-readout {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.ops-gauge-value {
  font-family: 'Orbitron', monospace;
  font-size: 1.4rem;
  color: var(--neon-green);
  text-shadow: 0 0 5px var(--neon-green);
}

.ops-gauge-unit {
  font-size: 0.8rem;
  margin-left: 0.15rem;
}

.ops-gauge-label {
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.8rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
</style>
