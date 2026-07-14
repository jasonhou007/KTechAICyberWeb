<script setup>
/**
 * @component AgentStateMachine
 * @description Visual representation of the internal FSM state for an agent (#364).
 *
 * Displays the internal state machine transitions:
 * - IDLE → ACTIVE → COMPLETED (normal flow)
 * - IDLE → ACTIVE → CHALLENGING → COMPLETED (adversarial flow)
 *
 * Shows current state highlighted with cyberpunk styling and state history.
 *
 * @props {string} currentState - Current FSM state
 * @props {Array} stateHistory - Array of past states for visualization
 * @props {boolean} showLabels - Whether to show state labels
 *
 * @ticket #364
 */
import { computed } from 'vue'

const props = defineProps({
  currentState: {
    type: String,
    required: true,
    validator: (value) =>
      ['idle', 'active', 'challenging', 'completed'].includes(value),
  },
  stateHistory: {
    type: Array,
    default: () => [],
  },
  showLabels: {
    type: Boolean,
    default: true,
  },
})

// FSM states in order
const states = ['idle', 'active', 'challenging', 'completed']

// State display labels
const stateLabels = {
  idle: 'IDLE',
  active: 'ACTIVE',
  challenging: 'CHALLENGING',
  completed: 'COMPLETED',
}

// Calculate current state index
const currentIndex = computed(() =>
  states.indexOf(props.currentState)
)

// Determine which transition paths are active
const transitionPaths = computed(() => {
  const idx = currentIndex.value
  const paths = []

  // Normal flow: idle → active → completed
  if (idx >= 1) {
    paths.push({ from: 'idle', to: 'active', active: true })
  }
  if (idx === 3 && !props.stateHistory.includes('challenging')) {
    paths.push({ from: 'active', to: 'completed', active: true })
  }

  // Adversarial flow: idle → active → challenging → completed
  if (props.stateHistory.includes('challenging')) {
    paths.push({ from: 'active', to: 'challenging', active: true })
    if (idx === 3) {
      paths.push({ from: 'challenging', to: 'completed', active: true })
    }
  }

  return paths
})
</script>

<template>
  <div class="state-machine">
    <!-- State nodes -->
    <div class="state-machine__nodes">
      <div
        v-for="state in states"
        :key="state"
        class="state-node"
        :class="{
          'state-node--current': state === currentState,
          'state-node--visited': stateHistory.includes(state),
        }"
        :data-state="state"
      >
        <div class="state-node__circle">
          <span class="state-node__label">{{ stateLabels[state] }}</span>
        </div>
      </div>
    </div>

    <!-- Transition paths -->
    <svg class="state-machine__transitions" aria-hidden="true">
      <line
        v-for="(path, index) in transitionPaths"
        :key="`path-${index}`"
        class="transition-path"
        :class="{ 'transition-path--active': path.active }"
        :x1="`${(states.indexOf(path.from) / (states.length - 1)) * 100}%`"
        :y1="50"
        :x2="`${(states.indexOf(path.to) / (states.length - 1)) * 100}%`"
        :y2="50"
      />
    </svg>

    <!-- Labels if enabled -->
    <div v-if="showLabels" class="state-machine__labels">
      <div class="state-machine__current-label">
        Current: <span>{{ stateLabels[currentState] }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.state-machine {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 255, 204, 0.15);
  border-radius: 8px;
  overflow: hidden;
}

.state-machine__nodes {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 0.5rem;
  z-index: 1;
}

.state-node {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.state-node__circle {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  border: 2px solid rgba(0, 255, 204, 0.3);
  transition:
    border-color 0.3s ease,
    box-shadow 0.3s ease,
    transform 0.3s ease;
}

.state-node--current .state-node__circle {
  border-color: var(--neon-cyan);
  box-shadow: 0 0 12px var(--neon-cyan);
  transform: scale(1.1);
}

.state-node--visited .state-node__circle {
  border-color: var(--neon-green);
  opacity: 0.7;
}

.state-node__label {
  font-size: 0.625rem;
  font-weight: 600;
  color: var(--color-text-secondary, rgba(0, 255, 204, 0.7));
  text-align: center;
  letter-spacing: 0.05em;
}

.state-node--current .state-node__label {
  color: var(--neon-cyan);
  text-shadow: 0 0 4px var(--neon-cyan);
}

.state-machine__transitions {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  width: 100%;
  height: 100%;
  transform: translateY(-50%);
  pointer-events: none;
  z-index: 0;
}

.transition-path {
  stroke: rgba(0, 255, 204, 0.15);
  stroke-width: 2;
  stroke-dasharray: 4 4;
  transition: stroke 0.3s ease;
}

.transition-path--active {
  stroke: var(--neon-cyan);
  stroke-width: 3;
  stroke-dasharray: none;
  animation: flow-animation 1s linear infinite;
}

@keyframes flow-animation {
  0% {
    stroke-dashoffset: 0;
  }
  100% {
    stroke-dashoffset: -10;
  }
}

.state-machine__labels {
  display: flex;
  justify-content: center;
  gap: 1rem;
  font-size: 0.75rem;
  color: var(--color-text-secondary, rgba(0, 255, 204, 0.7));
}

.state-machine__current-label {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.state-machine__current-label span {
  color: var(--neon-cyan);
  font-weight: 600;
  text-shadow: 0 0 4px var(--neon-cyan);
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .state-node__circle,
  .transition-path {
    animation: none !important;
    transition: none;
  }

  .state-node--current .state-node__circle {
    transform: none;
  }

  .transition-path--active {
    stroke-dasharray: 4 4;
  }
}
</style>
