<script setup>
/**
 * @component AgentCard
 * @description Visual card component for a single agent in the 6-agent pipeline (#364).
 *
 * Displays agent state (idle/active/challenging/completed) with:
 * - Agent icon with cyberpunk styling
 * - Agent name and description
 * - State-specific visual indicators
 * - Smooth transitions between states
 * - Artifact preview (for completed agents)
 *
 * @props {string} agentId - The agent identifier
 * @props {string} state - Current FSM state (idle/active/challenging/completed)
 * @props {object} agent - Agent metadata from useAgentPipeline()
 * @props {number} progress - Phase progress (0-1) for active agents
 *
 * @ticket #364
 */
import { computed } from 'vue'
import AgentIcon from './AgentIcon.vue'

const props = defineProps({
  agentId: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
    validator: (value) =>
      ['idle', 'active', 'challenging', 'completed'].includes(value),
  },
  agent: {
    type: Object,
    required: true,
  },
  progress: {
    type: Number,
    default: 0,
  },
})

// State-specific classes
const stateClasses = computed(() => ({
  'agent-card--idle': props.state === 'idle',
  'agent-card--active': props.state === 'active',
  'agent-card--challenging': props.state === 'challenging',
  'agent-card--completed': props.state === 'completed',
}))

// Progress percentage
const progressPercent = computed(() => `${Math.round(props.progress * 100)}%`)

// ARIA label for accessibility
const ariaLabel = computed(() => {
  const stateLabels = {
    idle: 'Idle',
    active: 'Active',
    challenging: 'Under review',
    completed: 'Completed',
  }
  return `${props.agent.name} - ${stateLabels[props.state]}`
})
</script>

<template>
  <div
    class="agent-card"
    :class="stateClasses"
    :data-agent-id="agentId"
    :data-state="state"
    :aria-label="ariaLabel"
  >
    <!-- Icon with active state glow -->
    <div class="agent-card__icon-wrapper">
      <AgentIcon
        :agent-id="agentId"
        :active="state === 'active' || state === 'challenging'"
        size="32px"
      />
      <!-- State indicator dot -->
      <div class="agent-card__state-dot" :data-state="state"></div>
    </div>

    <!-- Agent info -->
    <div class="agent-card__info">
      <h3 class="agent-card__name">{{ agent.name }}</h3>
      <p class="agent-card__description">{{ agent.description }}</p>
    </div>

    <!-- Progress bar for active agents -->
    <div
      v-if="state === 'active'"
      class="agent-card__progress-bar"
      role="progressbar"
      :aria-valuenow="Math.round(progress * 100)"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div
        class="agent-card__progress-fill"
        :style="{ width: progressPercent }"
      ></div>
    </div>

    <!-- Challenge badge for challenging state -->
    <div v-if="state === 'challenging'" class="agent-card__challenge-badge">
      <span class="agent-card__challenge-text">Under Review</span>
    </div>

    <!-- Completion badge for completed state -->
    <div v-if="state === 'completed'" class="agent-card__completion-badge">
      <span class="agent-card__completion-icon">✓</span>
    </div>
  </div>
</template>

<style scoped>
.agent-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem 1rem;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--color-border, rgba(0, 255, 204, 0.2));
  border-radius: 8px;
  transition:
    border-color 0.3s ease,
    box-shadow 0.3s ease,
    transform 0.3s ease;
  overflow: hidden;
}

/* State-specific styling */

/* Idle - dimmed, minimal border */
.agent-card--idle {
  opacity: 0.5;
  border-color: rgba(0, 255, 204, 0.1);
}

/* Active - bright glow, progress animation */
.agent-card--active {
  opacity: 1;
  border-color: v-bind('agent.color');
  box-shadow: 0 0 12px v-bind('agent.color');
  transform: scale(1.02);
}

/* Challenging - yellow warning glow */
.agent-card--challenging {
  opacity: 1;
  border-color: var(--neon-yellow);
  box-shadow: 0 0 12px var(--neon-yellow);
  animation: challenge-pulse 1.5s ease-in-out infinite;
}

@keyframes challenge-pulse {
  0%,
  100% {
    box-shadow: 0 0 12px var(--neon-yellow);
  }
  50% {
    box-shadow: 0 0 20px var(--neon-yellow);
  }
}

/* Completed - green success glow */
.agent-card--completed {
  opacity: 1;
  border-color: var(--neon-green);
  box-shadow: 0 0 8px var(--neon-green);
}

.agent-card__icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.agent-card__state-dot {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid var(--bg-primary, #000);
  transition: background-color 0.3s ease;
}

.agent-card__state-dot[data-state="idle"] {
  background-color: rgba(0, 255, 204, 0.3);
}

.agent-card__state-dot[data-state="active"] {
  background-color: var(--neon-cyan);
  animation: dot-pulse 1.5s ease-in-out infinite;
}

.agent-card__state-dot[data-state="challenging"] {
  background-color: var(--neon-yellow);
  animation: dot-pulse 1.5s ease-in-out infinite;
}

.agent-card__state-dot[data-state="completed"] {
  background-color: var(--neon-green);
}

@keyframes dot-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.agent-card__info {
  text-align: center;
}

.agent-card__name {
  margin: 0;
  font-family: var(--font-display);
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-text-primary, var(--neon-cyan));
  text-shadow: 0 0 8px v-bind('agent.color');
}

.agent-card__description {
  margin: 0.25rem 0 0;
  font-size: 0.75rem;
  color: var(--color-text-secondary, rgba(0, 255, 204, 0.7));
  line-height: 1.3;
}

.agent-card__progress-bar {
  width: 100%;
  height: 4px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 0.5rem;
}

.agent-card__progress-fill {
  height: 100%;
  background: linear-gradient(
    90deg,
    v-bind('agent.color') 0%,
    var(--neon-cyan) 100%
  );
  transition: width 0.1s linear;
  box-shadow: 0 0 4px v-bind('agent.color');
}

.agent-card__challenge-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 0.25rem 0.5rem;
  background: rgba(255, 255, 0, 0.15);
  border: 1px solid var(--neon-yellow);
  border-radius: 4px;
  animation: badge-pulse 1.5s ease-in-out infinite;
}

.agent-card__challenge-text {
  font-size: 0.625rem;
  font-weight: 600;
  color: var(--neon-yellow);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

@keyframes badge-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.agent-card__completion-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 255, 0, 0.15);
  border: 1px solid var(--neon-green);
  border-radius: 50%;
}

.agent-card__completion-icon {
  font-size: 1rem;
  font-weight: bold;
  color: var(--neon-green);
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .agent-card,
  .agent-card__state-dot,
  .agent-card__progress-fill,
  .agent-card__challenge-badge {
    animation: none !important;
    transition: none;
  }

  .agent-card--active {
    transform: none;
  }
}
</style>
