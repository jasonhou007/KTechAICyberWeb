<script setup>
/**
 * @component AgentPipelineTrack
 * @description Main layout container for the 6-agent pipeline visualization (#364).
 *
 * Displays all 6 agents in a horizontal track with:
 * - Agent cards for each specialized agent
 * - Real-time state updates from useAgentPipeline
 * - Smooth transitions and animations
 * - Responsive layout (horizontal on desktop, vertical on mobile)
 * - Performance-optimized rendering (60fps target)
 *
 * Replaces the old 8-stage PipelineTrack.vue with the new 6-agent adversarial system.
 *
 * @ticket #364
 */
import { computed } from 'vue'
import { useAgentPipeline } from '../../composables/useAgentPipeline.js'
import AgentCard from './AgentCard.vue'

const {
  agents,
  activeAgentId,
  getAgentState,
  phaseProgress,
  phaseElapsed,
  phaseDuration,
} = useAgentPipeline()

// Calculate progress for the active agent
const activeProgress = computed(() => {
  if (activeAgentId.value) {
    return phaseProgress.value
  }
  return 0
})

// Get state for each agent
const getAgentStateForDisplay = (agentId) => {
  return getAgentState(agentId)
}

// ARIA label for accessibility
const pipelineLabel = computed(() => {
  const activeName = agents.value.find((a) => a.id === activeAgentId.value)?.name || 'Unknown'
  return `6-Agent Pipeline - Currently active: ${activeName}`
})
</script>

<template>
  <div
    class="agent-pipeline-track"
    :aria-label="pipelineLabel"
    role="region"
    aria-live="polite"
  >
    <!-- Pipeline track background -->
    <div class="agent-pipeline-track__background" aria-hidden="true">
      <div class="agent-pipeline-track__line"></div>
    </div>

    <!-- Agent cards container -->
    <div class="agent-pipeline-track__agents">
      <AgentCard
        v-for="agent in agents"
        :key="agent.id"
        :agent-id="agent.id"
        :agent="agent"
        :state="getAgentStateForDisplay(agent.id)"
        :progress="agent.id === activeAgentId ? activeProgress : 0"
      />
    </div>

    <!-- Phase indicator -->
    <div class="agent-pipeline-track__phase-info">
      <span class="agent-pipeline-track__phase-text">
        Phase: {{ Math.round(activeProgress * 100) }}%
      </span>
    </div>
  </div>
</template>

<style scoped>
.agent-pipeline-track {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 2rem 1rem;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(0, 255, 204, 0.1);
  border-radius: 12px;
  overflow: hidden;
}

.agent-pipeline-track__background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 0;
}

.agent-pipeline-track__line {
  position: absolute;
  top: 50%;
  left: 10%;
  right: 10%;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(0, 255, 204, 0.3) 20%,
    rgba(0, 255, 204, 0.5) 50%,
    rgba(0, 255, 204, 0.3) 80%,
    transparent 100%
  );
  transform: translateY(-50%);
}

.agent-pipeline-track__agents {
  position: relative;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 1rem;
  z-index: 1;
  align-items: stretch;
}

.agent-pipeline-track__phase-info {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1;
}

.agent-pipeline-track__phase-text {
  font-family: var(--font-display);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-secondary, rgba(0, 255, 204, 0.7));
  letter-spacing: 0.1em;
  text-transform: uppercase;
  text-shadow: 0 0 4px var(--neon-cyan);
}

/* Mobile responsive - stack vertically */
@media (max-width: 768px) {
  .agent-pipeline-track__agents {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .agent-pipeline-track__line {
    display: none;
  }

  .agent-pipeline-track {
    padding: 1rem 0.75rem;
  }
}

/* Tablet responsive - 3x2 grid */
@media (min-width: 769px) and (max-width: 1024px) {
  .agent-pipeline-track__agents {
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }

  .agent-pipeline-track__line {
    display: none;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .agent-pipeline-track,
  .agent-pipeline-track__agents,
  .agent-pipeline-track__background {
    transition: none;
  }

  .agent-pipeline-track__line {
    background: rgba(0, 255, 204, 0.3);
  }
}
</style>
