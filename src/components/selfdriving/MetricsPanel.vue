<script setup>
/**
 * @component MetricsPanel
 * @description Aggregate metrics display for the 6-agent pipeline (#364).
 *
 * Shows comprehensive pipeline performance metrics:
 * - Cycle time statistics (average, min, max)
 * - Success rate and completion percentage
 * - Agent-specific performance metrics
 * - Challenge and resolution statistics
 * - Real-time throughput measurement
 *
 * @props {Object} metrics - Pipeline metrics from useAgentPipeline
 * @props {Object} agentMetrics - Individual agent performance metrics
 * @props {Number} completedCycles - Number of completed cycles
 *
 * @ticket #364
 */
import { computed } from 'vue'

const props = defineProps({
  metrics: {
    type: Object,
    required: true,
  },
  agentMetrics: {
    type: Object,
    default: () => ({}),
  },
  completedCycles: {
    type: Number,
    default: 0,
  },
})

// Format time (ms to readable format)
const formatTime = (ms) => {
  if (ms < 1000) return `${Math.round(ms)}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}m`
}

// Calculate throughput (cycles per minute)
const throughput = computed(() => {
  if (props.metrics.avgCycleTime === 0) return 0
  return Math.round(60000 / props.metrics.avgCycleTime)
})

// Overall health score (0-100)
const healthScore = computed(() => {
  const successWeight = 0.4
  const speedWeight = 0.3
  const consistencyWeight = 0.3

  const successScore = props.metrics.successRate || 0
  const speedScore = Math.min(100, (15000 / Math.max(props.metrics.avgCycleTime, 1)) * 100)
  const consistencyScore = 100 // Could add variance calculation later

  return Math.round(
    successScore * successWeight +
    speedScore * speedWeight +
    consistencyScore * consistencyWeight
  )
})

// Health score color
const healthColor = computed(() => {
  if (healthScore.value >= 80) return 'var(--neon-green)'
  if (healthScore.value >= 60) return 'var(--neon-yellow)'
  return 'var(--neon-pink)'
})

// Agent with best performance
const topAgent = computed(() => {
  const agents = Object.entries(props.agentMetrics || {})
    .filter(([_, metrics]) => metrics.executionCount > 0)
    .map(([id, metrics]) => ({
      id,
      ...metrics,
      efficiency: metrics.totalTime / Math.max(metrics.executionCount, 1),
    }))
    .sort((a, b) => a.efficiency - b.efficiency)

  return agents[0] || null
})
</script>

<template>
  <div class="metrics-panel">
    <!-- Header -->
    <div class="metrics-panel__header">
      <h3 class="metrics-panel__title">Pipeline Metrics</h3>
      <div class="metrics-panel__cycles">
        <span class="metrics-panel__cycles-count">{{ completedCycles }}</span>
        <span class="metrics-panel__cycles-label">cycles</span>
      </div>
    </div>

    <!-- Health score -->
    <div class="metrics-panel__health">
      <div class="metrics-panel__health-score" :style="{ color: healthColor }">
        {{ healthScore }}%
      </div>
      <div class="metrics-panel__health-label">Health Score</div>
    </div>

    <!-- Key metrics grid -->
    <div class="metrics-panel__grid">
      <!-- Success rate -->
      <div class="metric-card">
        <div class="metric-card__label">Success Rate</div>
        <div class="metric-card__value">
          {{ Math.round(metrics.successRate || 0) }}%
        </div>
        <div class="metric-card__bar">
          <div
            class="metric-card__bar-fill"
            :style="{
              width: `${metrics.successRate || 0}%`,
              backgroundColor: 'var(--neon-green)',
            }"
          ></div>
        </div>
      </div>

      <!-- Average cycle time -->
      <div class="metric-card">
        <div class="metric-card__label">Avg Cycle Time</div>
        <div class="metric-card__value">
          {{ formatTime(metrics.avgCycleTime || 0) }}
        </div>
        <div class="metric-card__bar">
          <div
            class="metric-card__bar-fill"
            :style="{
              width: `${Math.min(100, (15000 / Math.max(metrics.avgCycleTime, 1)) * 100)}%`,
              backgroundColor: 'var(--neon-cyan)',
            }"
          ></div>
        </div>
      </div>

      <!-- Throughput -->
      <div class="metric-card">
        <div class="metric-card__label">Throughput</div>
        <div class="metric-card__value">
          {{ throughput }}/min
        </div>
        <div class="metric-card__bar">
          <div
            class="metric-card__bar-fill"
            :style="{
              width: `${Math.min(100, throughput * 10)}%`,
              backgroundColor: 'var(--neon-yellow)',
            }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Top performer -->
    <div v-if="topAgent" class="metrics-panel__top-performer">
      <span class="metrics-panel__top-label">Top Agent:</span>
      <span class="metrics-panel__top-agent">{{ topAgent.id }}</span>
      <span class="metrics-panel__top-time">
        {{ formatTime(topAgent.avgDuration) }}/op
      </span>
    </div>

    <!-- Detailed metrics breakdown -->
    <div class="metrics-panel__breakdown">
      <h4 class="metrics-panel__breakdown-title">Agent Performance</h4>
      <div class="metrics-panel__agents">
        <div
          v-for="(metrics, agentId) in agentMetrics"
          :key="agentId"
          class="agent-metrics"
        >
          <div class="agent-metrics__header">
            <span class="agent-metrics__name">{{ agentId }}</span>
            <span class="agent-metrics__count">{{ metrics.executionCount }} ops</span>
          </div>
          <div class="agent-metrics__stats">
            <div class="agent-metrics__stat">
              <span class="agent-metrics__stat-label">Avg:</span>
              <span class="agent-metrics__stat-value">
                {{ formatTime(metrics.avgDuration) }}
              </span>
            </div>
            <div class="agent-metrics__stat">
              <span class="agent-metrics__stat-label">Total:</span>
              <span class="agent-metrics__stat-value">
                {{ formatTime(metrics.totalTime) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.metrics-panel {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 255, 204, 0.1);
  border-radius: 8px;
}

.metrics-panel__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.metrics-panel__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary, var(--neon-cyan));
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-shadow: 0 0 8px var(--neon-cyan);
}

.metrics-panel__cycles {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.metrics-panel__cycles-count {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--neon-cyan);
  text-shadow: 0 0 8px var(--neon-cyan);
}

.metrics-panel__cycles-label {
  font-size: 0.625rem;
  color: var(--color-text-secondary, rgba(0, 255, 204, 0.7));
  text-transform: uppercase;
}

.metrics-panel__health {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 8px;
  border: 1px solid rgba(0, 255, 204, 0.1);
}

.metrics-panel__health-score {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
  text-shadow: 0 0 12px currentColor;
}

.metrics-panel__health-label {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: var(--color-text-secondary, rgba(0, 255, 204, 0.7));
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.metrics-panel__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.metric-card {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
}

.metric-card__label {
  font-size: 0.625rem;
  color: var(--color-text-secondary, rgba(0, 255, 204, 0.7));
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.metric-card__value {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary, var(--neon-cyan));
}

.metric-card__bar {
  height: 4px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 2px;
  overflow: hidden;
}

.metric-card__bar-fill {
  height: 100%;
  transition: width 0.3s ease;
  box-shadow: 0 0 4px currentColor;
}

.metrics-panel__top-performer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(0, 255, 0, 0.05);
  border: 1px solid rgba(0, 255, 0, 0.2);
  border-radius: 4px;
  font-size: 0.75rem;
}

.metrics-panel__top-label {
  color: var(--color-text-secondary, rgba(0, 255, 204, 0.7));
}

.metrics-panel__top-agent {
  font-weight: 600;
  color: var(--neon-green);
  text-transform: uppercase;
}

.metrics-panel__top-time {
  margin-left: auto;
  font-family: monospace;
  color: var(--neon-green);
}

.metrics-panel__breakdown {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.metrics-panel__breakdown-title {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-secondary, rgba(0, 255, 204, 0.7));
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.metrics-panel__agents {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.agent-metrics {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.agent-metrics__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.agent-metrics__name {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-primary, var(--neon-cyan));
  text-transform: uppercase;
}

.agent-metrics__count {
  font-size: 0.625rem;
  color: var(--color-text-secondary, rgba(0, 255, 204, 0.7));
}

.agent-metrics__stats {
  display: flex;
  gap: 1rem;
}

.agent-metrics__stat {
  display: flex;
  gap: 0.25rem;
  font-size: 0.625rem;
}

.agent-metrics__stat-label {
  color: var(--color-text-secondary, rgba(0, 255, 204, 0.7));
}

.agent-metrics__stat-value {
  font-family: monospace;
  color: var(--color-text-primary, var(--neon-cyan));
  font-weight: 600;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .metrics-panel__grid {
    grid-template-columns: 1fr;
  }

  .metrics-panel__header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .metrics-panel__cycles {
    align-items: flex-start;
  }

  .agent-metrics__stats {
    flex-direction: column;
    gap: 0.25rem;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .metric-card__bar-fill {
    transition: none;
  }
}
</style>
