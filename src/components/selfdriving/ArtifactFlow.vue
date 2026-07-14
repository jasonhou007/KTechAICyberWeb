<script setup>
/**
 * @component ArtifactFlow
 * @description Visualization of artifact flow through the 6-agent pipeline (#364).
 *
 * Shows artifacts being generated and passed between agents:
 * - Plan artifacts from Planner
 * - Code artifacts from Coder
 * - Security reports from Security
 * - Quality assessments from Evaluator
 * - Review reports from Reviewer
 * - Merge commits from Merger
 *
 * @props {Array} artifacts - Array of artifacts from useAgentPipeline
 *
 * @ticket #364
 */
import { computed } from 'vue'

const props = defineProps({
  artifacts: {
    type: Array,
    default: () => [],
  },
})

// Artifact type icons and colors
const artifactTypes = {
  plan: {
    icon: '📋',
    color: 'var(--color-cyber-primary, var(--neon-cyan))',
    label: 'Plan',
  },
  code: {
    icon: '💻',
    color: 'var(--color-cyber-secondary, var(--neon-pink))',
    label: 'Code',
  },
  'security-report': {
    icon: '🛡️',
    color: 'var(--neon-green)',
    label: 'Security',
  },
  'quality-assessment': {
    icon: '✓',
    color: 'var(--neon-cyan)',
    label: 'Quality',
  },
  'review-report': {
    icon: '🔍',
    color: 'var(--neon-yellow)',
    label: 'Review',
  },
  'merge-commit': {
    icon: '🔀',
    color: 'var(--neon-pink)',
    label: 'Merge',
  },
}

// Get artifact metadata
const getArtifactMeta = (type) => {
  return artifactTypes[type] || { icon: '📄', color: 'var(--neon-cyan)', label: 'Artifact' }
}

// Group artifacts by type for display
const artifactsByType = computed(() => {
  const grouped = {}
  props.artifacts.forEach((artifact) => {
    if (!grouped[artifact.type]) {
      grouped[artifact.type] = []
    }
    grouped[artifact.type].push(artifact)
  })
  return grouped
})

// Artifact type statistics
const artifactStats = computed(() => {
  const stats = {}
  Object.keys(artifactTypes).forEach((type) => {
    stats[type] = (artifactsByType.value[type] || []).length
  })
  return stats
})

// Total artifact count
const totalArtifacts = computed(() => props.artifacts.length)

// Most recent artifacts (limit to 6 for display)
const recentArtifacts = computed(() => {
  return [...props.artifacts].reverse().slice(0, 6)
})
</script>

<template>
  <div class="artifact-flow">
    <!-- Header -->
    <div class="artifact-flow__header">
      <h3 class="artifact-flow__title">Artifact Pipeline</h3>
      <span class="artifact-flow__count">{{ totalArtifacts }} artifacts</span>
    </div>

    <!-- Artifact statistics -->
    <div class="artifact-flow__stats">
      <div
        v-for="(count, type) in artifactStats"
        :key="type"
        class="artifact-stat"
        :style="{ borderColor: getArtifactMeta(type).color }"
      >
        <span class="artifact-stat__icon">{{ getArtifactMeta(type).icon }}</span>
        <span class="artifact-stat__label">{{ getArtifactMeta(type).label }}</span>
        <span class="artifact-stat__count">{{ count }}</span>
      </div>
    </div>

    <!-- Recent artifacts timeline -->
    <div class="artifact-flow__timeline">
      <h4 class="artifact-flow__timeline-title">Recent Artifacts</h4>
      <div class="artifact-flow__timeline-items">
        <div
          v-for="artifact in recentArtifacts"
          :key="`${artifact.agentId}-${artifact.timestamp}`"
          class="artifact-timeline-item"
          :style="{
            borderLeftColor: getArtifactMeta(artifact.type).color,
          }"
        >
          <div class="artifact-timeline-item__icon">
            {{ getArtifactMeta(artifact.type).icon }}
          </div>
          <div class="artifact-timeline-item__content">
            <span class="artifact-timeline-item__type">
              {{ getArtifactMeta(artifact.type).label }}
            </span>
            <span class="artifact-timeline-item__agent">
              by {{ artifact.agentId }}
            </span>
          </div>
          <span class="artifact-timeline-item__time">
            {{ new Date(artifact.timestamp).toLocaleTimeString() }}
          </span>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="totalArtifacts === 0" class="artifact-flow__empty">
      <span class="artifact-flow__empty-text">No artifacts generated yet</span>
    </div>
  </div>
</template>

<style scoped>
.artifact-flow {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 255, 204, 0.1);
  border-radius: 8px;
  overflow: hidden;
}

.artifact-flow__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.artifact-flow__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary, var(--neon-cyan));
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-shadow: 0 0 8px var(--neon-cyan);
}

.artifact-flow__count {
  font-size: 0.75rem;
  color: var(--color-text-secondary, rgba(0, 255, 204, 0.7));
  font-weight: 600;
}

.artifact-flow__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.75rem;
}

.artifact-stat {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.2);
  border-left: 3px solid;
  border-radius: 4px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.artifact-stat:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.artifact-stat__icon {
  font-size: 1.25rem;
}

.artifact-stat__label {
  flex: 1;
  font-size: 0.625rem;
  font-weight: 600;
  color: var(--color-text-secondary, rgba(0, 255, 204, 0.7));
  text-transform: uppercase;
}

.artifact-stat__count {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-text-primary, var(--neon-cyan));
}

.artifact-flow__timeline {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.artifact-flow__timeline-title {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-secondary, rgba(0, 255, 204, 0.7));
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.artifact-flow__timeline-items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.artifact-timeline-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.2);
  border-left: 3px solid;
  border-radius: 4px;
  transition: transform 0.2s ease;
}

.artifact-timeline-item:hover {
  transform: translateX(4px);
}

.artifact-timeline-item__icon {
  font-size: 1rem;
}

.artifact-timeline-item__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.artifact-timeline-item__type {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-primary, var(--neon-cyan));
}

.artifact-timeline-item__agent {
  font-size: 0.625rem;
  color: var(--color-text-secondary, rgba(0, 255, 204, 0.7));
}

.artifact-timeline-item__time {
  font-size: 0.625rem;
  color: var(--color-text-secondary, rgba(0, 255, 204, 0.7));
  font-family: monospace;
}

.artifact-flow__empty {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.artifact-flow__empty-text {
  font-size: 0.875rem;
  color: var(--color-text-secondary, rgba(0, 255, 204, 0.5));
  font-style: italic;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .artifact-flow__stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .artifact-timeline-item {
    flex-wrap: wrap;
  }

  .artifact-timeline-item__time {
    width: 100%;
    margin-left: auto;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .artifact-stat,
  .artifact-timeline-item {
    transition: none;
  }

  .artifact-stat:hover {
    transform: none;
  }

  .artifact-timeline-item:hover {
    transform: none;
  }
}
</style>
