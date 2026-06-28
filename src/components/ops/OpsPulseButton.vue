<script setup>
// OpsPulseButton.vue — "Pulse the network" trigger. Pure presentation; the
// parent composable's pulse() does the spike/settle work.
defineProps({
  label: { type: String, required: true },
  ariaLabel: { type: String, required: true },
  applied: { type: Boolean, default: false },
})

defineEmits(['pulse'])
</script>

<template>
  <button
    type="button"
    class="ops-pulse-btn"
    :class="{ 'ops-pulse-applied': applied }"
    data-test="ops-pulse-button"
    :aria-label="ariaLabel"
    @click="$emit('pulse')"
  >⚡ {{ label }}</button>
</template>

<style scoped>
.ops-pulse-btn {
  background: rgba(0, 255, 136, 0.1);
  color: var(--neon-green);
  border: 1px solid var(--neon-green);
  font-family: 'Orbitron', monospace;
  font-size: 0.85rem;
  padding: 0.5rem 1.2rem;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  border-radius: 2px;
  transition: all 0.2s ease;
  box-shadow: 0 0 6px var(--glow-color);
}

.ops-pulse-btn:hover,
.ops-pulse-btn:focus-visible {
  background: rgba(0, 255, 136, 0.25);
  box-shadow: 0 0 14px var(--neon-green);
  outline: none;
}

.ops-pulse-applied {
  background: rgba(0, 255, 136, 0.3);
  box-shadow: 0 0 20px var(--neon-green);
}
</style>
