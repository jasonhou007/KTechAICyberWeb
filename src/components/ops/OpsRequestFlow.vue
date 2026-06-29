<script setup>
// OpsRequestFlow.vue — request particle mini-viz.
// Particles translateX across the flow (transform-only animation). Hidden on
// mobile/reduced-motion (parent decides; this component just renders when
// mounted). `tick` advances the particle phase deterministically.
import { computed } from 'vue'

const props = defineProps({
  tick: { type: Number, default: 0 },
  label: { type: String, required: true },
})

const PARTICLE_COUNT = 6
const particles = computed(() =>
  Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    // Stagger each particle's position by a phase offset so they don't overlap.
    phase: ((i / PARTICLE_COUNT) + (props.tick % 60) / 60) % 1,
  })),
)

// Map phase 0..1 to a left% position across the flow.
function positionFor(phase) {
  return (phase * 100).toFixed(1)
}
</script>

<template>
  <div class="ops-request-flow" data-test="ops-request-flow" :aria-label="label" role="img">
    <span class="ops-request-flow-label">{{ label }}</span>
    <div class="ops-request-flow-track">
      <span
        v-for="p in particles"
        :key="p.id"
        class="ops-request-particle"
        :style="{ transform: `translateX(${positionFor(p.phase)}vw)` }"
      />
    </div>
  </div>
</template>

<style scoped>
.ops-request-flow {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  width: 100%;
}

.ops-request-flow-label {
  font-family: var(--font-body);
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.ops-request-flow-track {
  position: relative;
  height: 24px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--card-border);
  border-radius: 3px;
  overflow: hidden;
}

.ops-request-particle {
  position: absolute;
  top: 50%;
  left: 0;
  width: 8px;
  height: 8px;
  margin-top: -4px;
  border-radius: 50%;
  background: var(--neon-green);
  box-shadow: 0 0 6px var(--neon-green);
  /* Transform-only motion: translateX driven by the inline style. */
  will-change: transform;
}
</style>
