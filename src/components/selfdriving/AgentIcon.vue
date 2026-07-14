<script setup>
/**
 * @component AgentIcon
 * @description Cyberpunk-styled icon for each of the 6 specialized agents (#364).
 *
 * Provides distinct visual identity for each agent:
 * - Planner: Brain/network icon
 * - Coder: Code terminal icon
 * - Security: Shield/lock icon
 * - Evaluator: Check-circle/validation icon
 * - Reviewer: Search/magnifying glass icon
 * - Merger: Merge/git-branch icon
 *
 * Uses inline SVG for crisp rendering at any size and cyberpunk neon styling.
 *
 * @props {string} agentId - The agent identifier (planner, coder, etc.)
 * @props {string} [size='24px'] - Icon size (width/height)
 * @props {boolean} [active=false] - Whether the agent is currently active
 *
 * @ticket #364
 */
import { computed } from 'vue'

const props = defineProps({
  agentId: {
    type: String,
    required: true,
    validator: (value) =>
      ['planner', 'coder', 'security', 'evaluator', 'reviewer', 'merger'].includes(
        value
      ),
  },
  size: {
    type: String,
    default: '24px',
  },
  active: {
    type: Boolean,
    default: false,
  },
})

// SVG icon definitions for each agent
const icons = {
  planner: {
    paths: [
      // Brain/network symbol
      'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
    ],
    viewBox: '0 0 24 24',
  },
  coder: {
    paths: [
      // Code terminal symbol
      'M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z',
    ],
    viewBox: '0 0 24 24',
  },
  security: {
    paths: [
      // Shield symbol
      'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z',
    ],
    viewBox: '0 0 24 24',
  },
  evaluator: {
    paths: [
      // Check circle symbol
      'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
    ],
    viewBox: '0 0 24 24',
  },
  reviewer: {
    paths: [
      // Search/magnifying glass symbol
      'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
    ],
    viewBox: '0 0 24 24',
  },
  merger: {
    paths: [
      // Git merge symbol
      'M6 2v6h.01L6 8.01 10 12l-4 4 .01.01H6V22h2v-5.99h-.01L8 16l4-4-4-4L8.01 7.99H8V2H6zm10 0c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm0 14c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z',
    ],
    viewBox: '0 0 24 24',
  },
}

// Get icon data for the current agent
const iconData = computed(() => icons[props.agentId] || icons.planner)

// Dynamic styling
const iconStyle = computed(() => ({
  width: props.size,
  height: props.size,
}))

const isActiveClass = computed(() => ({
  'agent-icon--active': props.active,
}))
</script>

<template>
  <div
    class="agent-icon"
    :class="isActiveClass"
    :data-agent-id="agentId"
    :data-active="active"
    :style="iconStyle"
  >
    <svg
      :viewBox="iconData.viewBox"
      xmlns="http://www.w3.org/2000/svg"
      class="agent-icon__svg"
    >
      <path
        v-for="(path, index) in iconData.paths"
        :key="`${agentId}-path-${index}`"
        :d="path"
        class="agent-icon__path"
      />
    </svg>
  </div>
</template>

<style scoped>
.agent-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-shrink: 0;
}

.agent-icon__svg {
  width: 100%;
  height: 100%;
  display: block;
}

.agent-icon__path {
  fill: currentColor;
  transition:
    color 0.3s ease,
    filter 0.3s ease;
}

/* Active state - enhanced neon glow */
.agent-icon--active .agent-icon__path {
  color: var(--color-cyber-primary, var(--neon-cyan));
  filter: drop-shadow(0 0 4px var(--color-cyber-primary, var(--neon-cyan)));
}

/* Agent-specific color themes */
.agent-icon[data-agent-id="planner"] .agent-icon__path {
  color: var(--color-cyber-primary, var(--neon-cyan));
}

.agent-icon[data-agent-id="coder"] .agent-icon__path {
  color: var(--color-cyber-secondary, var(--neon-pink));
}

.agent-icon[data-agent-id="security"] .agent-icon__path {
  color: var(--neon-green);
}

.agent-icon[data-agent-id="evaluator"] .agent-icon__path {
  color: var(--neon-cyan);
}

.agent-icon[data-agent-id="reviewer"] .agent-icon__path {
  color: var(--neon-yellow);
}

.agent-icon[data-agent-id="merger"] .agent-icon__path {
  color: var(--neon-pink);
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .agent-icon__path {
    transition: none;
  }

  .agent-icon--active .agent-icon__path {
    filter: none;
  }
}
</style>
