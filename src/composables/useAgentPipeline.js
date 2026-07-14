/**
 * @file useAgentPipeline.js
 * @description Reactive composable for the 6-agent adversarial pipeline visualization (#364).
 *
 * Implements a finite state machine (FSM) orchestrating 6 specialized agents:
 *   PLANNER → CODER → SECURITY → EVALUATOR → REVIEWER → MERGER → (wrap)
 *
 * Features:
 * - Agent state management (idle/active/challenging/completed)
 * - Artifact flow tracking
 * - Adversarial interaction recording
 * - Pipeline metrics (cycle time, success rate, agent performance)
 * - Animation timing for smooth 60fps visualization
 * - Performance optimization (throttling, reduced motion support)
 *
 * @ticket #364
 */

import { ref, computed, readonly } from 'vue'

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

// Agent definitions with cyberpunk styling
export const AGENTS = [
  {
    id: 'planner',
    name: 'Planner',
    color: '--color-cyber-primary', // Primary neon
    icon: 'brain',
    description: 'Analyzes requirements and creates implementation plan',
  },
  {
    id: 'coder',
    name: 'Coder',
    color: '--color-cyber-secondary', // Secondary neon
    icon: 'code',
    description: 'Implements features following TDD discipline',
  },
  {
    id: 'security',
    name: 'Security',
    color: '--neon-green',
    icon: 'shield',
    description: 'Reviews code for security vulnerabilities',
  },
  {
    id: 'evaluator',
    name: 'Evaluator',
    color: '--neon-cyan',
    icon: 'check-circle',
    description: 'Quality assessment and acceptance criteria validation',
  },
  {
    id: 'reviewer',
    name: 'Reviewer',
    color: '--neon-yellow',
    icon: 'search',
    description: 'Adversarial review across 8 dimensions',
  },
  {
    id: 'merger',
    name: 'Merger',
    color: '--neon-pink',
    icon: 'merge',
    description: 'Merges PR and closes issue when all gates pass',
  },
]

// FSM phases
const PHASES = AGENTS.map((a) => a.id)

// Timing configuration
const PHASE_DURATION_MS = 2000 // Time per agent phase
const MAX_ARTIFACTS = 12 // Keep artifact history manageable
const MAX_CYCLE_HISTORY = 10 // For calculating average cycle time

// Agent states
const AGENT_STATE = {
  IDLE: 'idle',
  ACTIVE: 'active',
  CHALLENGING: 'challenging',
  COMPLETED: 'completed',
}

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------

export function useAgentPipeline() {
  // --- Agent state ----------------------------------------------------------
  const agentStates = ref(
    Object.fromEntries(
      AGENTS.map((agent) => [agent.id, AGENT_STATE.IDLE])
    )
  )

  const activeAgentId = ref(PHASES[0])
  const completedCycles = ref(0)

  // Initialize planner as active
  agentStates.value[PHASES[0]] = AGENT_STATE.ACTIVE

  // --- Artifact flow --------------------------------------------------------
  const artifacts = ref([])

  // --- Adversarial interactions ---------------------------------------------
  const challengeCount = ref(0)
  const resolvedChallenges = ref(0)
  const challengeDimensions = ref([])

  // --- Metrics ---------------------------------------------------------------
  const metrics = ref({
    avgCycleTime: 0,
    successRate: 100,
    totalCycles: 0,
    successCount: 0,
  })

  const agentMetrics = ref(
    Object.fromEntries(
      AGENTS.map((agent) => [
        agent.id,
        { avgDuration: 0, executionCount: 0, totalTime: 0 },
      ])
    )
  )

  const cycleTimeHistory = ref([])

  // --- Animation timing ------------------------------------------------------
  const phaseElapsed = ref(0)
  const phaseDuration = ref(PHASE_DURATION_MS)

  // --- Performance state ------------------------------------------------------
  const throttleLevel = ref('full') // 'full' | 'half' | 'paused'
  const isStatic = ref(false) // Reduced motion

  // --- Computed --------------------------------------------------------------
  const agents = computed(() => AGENTS)

  const phaseProgress = computed(() => {
    if (phaseDuration.value === 0) return 0
    return Math.min(1, phaseElapsed.value / phaseDuration.value)
  })

  // --- FSM control methods --------------------------------------------------
  function advanceToNextAgent() {
    const currentIndex = PHASES.indexOf(activeAgentId.value)
    const currentAgentId = activeAgentId.value

    // Mark current agent as completed
    agentStates.value[currentAgentId] = AGENT_STATE.COMPLETED

    // Calculate next agent
    const nextIndex = (currentIndex + 1) % PHASES.length
    const nextAgentId = PHASES[nextIndex]

    // Check if we completed a full cycle
    if (nextIndex === 0) {
      completedCycles.value += 1
      metrics.value.totalCycles = completedCycles.value
      // Reset all agent states for new cycle
      AGENTS.forEach((agent) => {
        agentStates.value[agent.id] = AGENT_STATE.IDLE
      })
    }

    // Set next agent as active
    activeAgentId.value = nextAgentId
    agentStates.value[nextAgentId] = AGENT_STATE.ACTIVE

    // Reset phase elapsed time
    phaseElapsed.value = 0
  }

  function getAgentState(agentId) {
    return agentStates.value[agentId] || AGENT_STATE.IDLE
  }

  function setAgentChallenging(agentId, isChallenging) {
    if (isChallenging) {
      // Allow any agent to be marked as challenging for visualization
      // In the real system, only reviewer challenges evaluator
      agentStates.value[agentId] = AGENT_STATE.CHALLENGING
    } else {
      agentStates.value[agentId] = AGENT_STATE.IDLE
    }
  }

  // --- Artifact methods ------------------------------------------------------
  function generateArtifact(agentId, type) {
    const artifact = {
      agentId,
      type,
      timestamp: Date.now(),
    }

    artifacts.value.push(artifact)

    // Keep only recent artifacts
    if (artifacts.value.length > MAX_ARTIFACTS) {
      artifacts.value.shift()
    }
  }

  // --- Challenge methods -----------------------------------------------------
  function recordChallenge(agentId, dimension) {
    challengeCount.value += 1

    if (!challengeDimensions.value.includes(dimension)) {
      challengeDimensions.value.push(dimension)
    }
  }

  function resolveChallenge(agentId, dimension) {
    resolvedChallenges.value += 1
  }

  // --- Metrics methods -------------------------------------------------------
  function recordCycleTime(duration) {
    cycleTimeHistory.value.push(duration)

    // Keep only recent history
    if (cycleTimeHistory.value.length > MAX_CYCLE_HISTORY) {
      cycleTimeHistory.value.shift()
    }

    // Calculate average
    const total = cycleTimeHistory.value.reduce((a, b) => a + b, 0)
    metrics.value.avgCycleTime = total / cycleTimeHistory.value.length
  }

  function recordResult(success) {
    metrics.value.totalCycles += 1
    if (success) {
      metrics.value.successCount += 1
    }
    metrics.value.successRate =
      (metrics.value.successCount / metrics.value.totalCycles) * 100
  }

  function recordAgentDuration(agentId, duration) {
    const metrics = agentMetrics.value[agentId]
    metrics.executionCount += 1
    metrics.totalTime += duration
    metrics.avgDuration = metrics.totalTime / metrics.executionCount
  }

  function getAgentMetrics(agentId) {
    return agentMetrics.value[agentId] || { avgDuration: 0, executionCount: 0 }
  }

  // --- Animation timing methods ----------------------------------------------
  function tick(deltaMs) {
    const factor = throttleLevel.value === 'half' ? 0.5 : 1
    phaseElapsed.value += deltaMs * factor

    // Auto-advance phase when complete
    if (phaseElapsed.value >= phaseDuration.value) {
      const duration = phaseElapsed.value
      recordCycleTime(duration)
      advanceToNextAgent()
    }
  }

  // --- Performance methods ---------------------------------------------------
  function setOffscreen(offscreen) {
    throttleLevel.value = offscreen ? 'half' : 'full'
  }

  function setReducedMotion(reduced) {
    isStatic.value = reduced
  }

  // --- Cleanup --------------------------------------------------------------
  let cleanupTimer = null

  function cleanup() {
    if (cleanupTimer) {
      clearTimeout(cleanupTimer)
      cleanupTimer = null
    }
    // Reset all state
    agentStates.value = Object.fromEntries(
      AGENTS.map((agent) => [agent.id, AGENT_STATE.IDLE])
    )
    artifacts.value = []
    challengeCount.value = 0
    resolvedChallenges.value = 0
    challengeDimensions.value = []
    phaseElapsed.value = 0
  }

  return {
    // Agent configuration
    agents,

    // FSM state
    activeAgentId,
    completedCycles,
    getAgentState,
    setAgentChallenging,
    advanceToNextAgent,

    // Artifact flow
    artifacts,
    generateArtifact,

    // Adversarial interactions
    challengeCount,
    resolvedChallenges,
    challengeDimensions,
    recordChallenge,
    resolveChallenge,

    // Metrics
    metrics,
    getAgentMetrics,
    recordCycleTime,
    recordResult,
    recordAgentDuration,

    // Animation timing
    phaseDuration,
    phaseElapsed,
    phaseProgress,
    tick,

    // Performance
    throttleLevel,
    isStatic,
    setOffscreen,
    setReducedMotion,

    // Cleanup
    cleanup,
  }
}
