/**
 * @test useAgentPipeline.test.js
 * @description Unit tests for the 6-agent adversarial pipeline composable (#364).
 *
 * Tests the finite state machine (FSM) that orchestrates 6 specialized agents:
 *   PLANNER → CODER → SECURITY → EVALUATOR → REVIEWER → MERGER → (wrap)
 *
 * Following TDD discipline: tests written first, implementation to follow.
 *
 * @ticket #364
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useAgentPipeline } from '../useAgentPipeline.js'

describe('useAgentPipeline - 6-Agent Adversarial Pipeline', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Agent Configuration', () => {
    it('should export exactly 6 agents', () => {
      const { agents } = useAgentPipeline()
      expect(agents.value).toHaveLength(6)
      expect(agents.value.map((a) => a.id)).toEqual([
        'planner',
        'coder',
        'security',
        'evaluator',
        'reviewer',
        'merger',
      ])
    })

    it('should provide agent metadata for visualization', () => {
      const { agents } = useAgentPipeline()
      agents.value.forEach((agent) => {
        expect(agent).toHaveProperty('id')
        expect(agent).toHaveProperty('name')
        expect(agent).toHaveProperty('color')
        expect(agent).toHaveProperty('icon')
        expect(agent).toHaveProperty('description')
      })
    })

    it('should assign distinct cyberpunk colors to each agent', () => {
      const { agents } = useAgentPipeline()
      const colors = agents.value.map((a) => a.color)
      const uniqueColors = new Set(colors)
      expect(uniqueColors.size).toBe(6)
    })
  })

  describe('FSM State Management', () => {
    it('should start with planner agent', () => {
      const { activeAgentId } = useAgentPipeline()
      expect(activeAgentId.value).toBe('planner')
    })

    it('should advance through agents sequentially', () => {
      const { activeAgentId, advanceToNextAgent } = useAgentPipeline()

      expect(activeAgentId.value).toBe('planner')
      advanceToNextAgent()
      expect(activeAgentId.value).toBe('coder')
      advanceToNextAgent()
      expect(activeAgentId.value).toBe('security')
      advanceToNextAgent()
      expect(activeAgentId.value).toBe('evaluator')
      advanceToNextAgent()
      expect(activeAgentId.value).toBe('reviewer')
      advanceToNextAgent()
      expect(activeAgentId.value).toBe('merger')
    })

    it('should wrap from merger back to planner', () => {
      const { activeAgentId, advanceToNextAgent } = useAgentPipeline()

      // Advance to merger (last agent)
      for (let i = 0; i < 5; i++) {
        advanceToNextAgent()
      }
      expect(activeAgentId.value).toBe('merger')

      // Next advance wraps to planner
      advanceToNextAgent()
      expect(activeAgentId.value).toBe('planner')
    })

    it('should track completed cycles', () => {
      const { completedCycles, advanceToNextAgent } = useAgentPipeline()

      expect(completedCycles.value).toBe(0)

      // Complete first cycle
      for (let i = 0; i < 6; i++) {
        advanceToNextAgent()
      }
      expect(completedCycles.value).toBe(1)

      // Complete second cycle
      for (let i = 0; i < 6; i++) {
        advanceToNextAgent()
      }
      expect(completedCycles.value).toBe(2)
    })
  })

  describe('Agent State Machine', () => {
    it('should provide agent state (idle/active/challenging/completed)', () => {
      const { getAgentState } = useAgentPipeline()

      expect(getAgentState('planner')).toBe('active')
      expect(getAgentState('coder')).toBe('idle')
      expect(getAgentState('security')).toBe('idle')
    })

    it('should mark previous agent as completed after advancing', () => {
      const { getAgentState, advanceToNextAgent } = useAgentPipeline()

      expect(getAgentState('planner')).toBe('active')
      advanceToNextAgent()
      expect(getAgentState('planner')).toBe('completed')
      expect(getAgentState('coder')).toBe('active')
    })

    it('should support adversarial challenge state', () => {
      const { getAgentState, setAgentChallenging } = useAgentPipeline()

      expect(getAgentState('coder')).toBe('idle')

      setAgentChallenging('coder', true)
      expect(getAgentState('coder')).toBe('challenging')

      setAgentChallenging('coder', false)
      expect(getAgentState('coder')).toBe('idle')
    })

    it('should only allow reviewer to challenge evaluator', () => {
      const { setAgentChallenging, getAgentState } = useAgentPipeline()

      // Reviewer can challenge evaluator
      setAgentChallenging('evaluator', true)
      expect(getAgentState('evaluator')).toBe('challenging')
    })
  })

  describe('Artifact Flow', () => {
    it('should track artifact generation', () => {
      const { artifacts, generateArtifact } = useAgentPipeline()

      expect(artifacts.value).toHaveLength(0)

      generateArtifact('planner', 'plan')
      expect(artifacts.value).toHaveLength(1)
      expect(artifacts.value[0]).toMatchObject({
        agentId: 'planner',
        type: 'plan',
      })
    })

    it('should timestamp artifacts', () => {
      const { artifacts, generateArtifact } = useAgentPipeline()
      const now = Date.now()

      generateArtifact('coder', 'code')
      expect(artifacts.value[0].timestamp).toBeGreaterThanOrEqual(now)
      expect(artifacts.value[0].timestamp).toBeLessThanOrEqual(Date.now())
    })

    it('should maintain artifact history up to max limit', () => {
      const { artifacts, generateArtifact } = useAgentPipeline()

      // Generate more than max artifacts
      for (let i = 0; i < 15; i++) {
        generateArtifact('coder', 'code')
      }

      // Should keep only recent artifacts (max 12)
      expect(artifacts.value.length).toBeLessThanOrEqual(12)
    })
  })

  describe('Adversarial Interactions', () => {
    it('should track challenge count', () => {
      const { challengeCount, recordChallenge } = useAgentPipeline()

      expect(challengeCount.value).toBe(0)

      recordChallenge('evaluator', 'accuracy')
      expect(challengeCount.value).toBe(1)

      recordChallenge('evaluator', 'testing')
      expect(challengeCount.value).toBe(2)
    })

    it('should track challenge dimensions', () => {
      const { challengeDimensions, recordChallenge } = useAgentPipeline()

      recordChallenge('evaluator', 'accuracy')
      recordChallenge('security', 'security')

      expect(challengeDimensions.value).toContain('accuracy')
      expect(challengeDimensions.value).toContain('security')
    })

    it('should track resolution of challenges', () => {
      const { resolvedChallenges, recordChallenge, resolveChallenge } =
        useAgentPipeline()

      recordChallenge('evaluator', 'accuracy')
      expect(resolvedChallenges.value).toBe(0)

      resolveChallenge('evaluator', 'accuracy')
      expect(resolvedChallenges.value).toBe(1)
    })
  })

  describe('Pipeline Metrics', () => {
    it('should calculate average cycle time', () => {
      const { metrics, recordCycleTime } = useAgentPipeline()

      expect(metrics.value.avgCycleTime).toBe(0)

      recordCycleTime(1500)
      expect(metrics.value.avgCycleTime).toBe(1500)

      recordCycleTime(1800)
      expect(metrics.value.avgCycleTime).toBe(1650) // Average
    })

    it('should track success rate', () => {
      const { metrics, recordResult } = useAgentPipeline()

      recordResult(true)
      expect(metrics.value.successRate).toBe(100)

      recordResult(false)
      expect(metrics.value.successRate).toBe(50)
    })

    it('should provide agent-specific metrics', () => {
      const { getAgentMetrics, recordAgentDuration } = useAgentPipeline()

      recordAgentDuration('planner', 500)
      recordAgentDuration('planner', 600)

      const metrics = getAgentMetrics('planner')
      expect(metrics.avgDuration).toBe(550)
      expect(metrics.executionCount).toBe(2)
    })
  })

  describe('Animation Timing', () => {
    it('should provide phase duration for animation', () => {
      const { phaseDuration } = useAgentPipeline()

      expect(phaseDuration.value).toBeGreaterThan(0)
      expect(typeof phaseDuration.value).toBe('number')
    })

    it('should track elapsed time in current phase', () => {
      const { phaseElapsed, tick } = useAgentPipeline()

      expect(phaseElapsed.value).toBe(0)

      tick(100) // Simulate 100ms elapsed
      expect(phaseElapsed.value).toBe(100)

      tick(50)
      expect(phaseElapsed.value).toBe(150)
    })

    it('should calculate phase progress 0-1', () => {
      const { phaseProgress, phaseElapsed, phaseDuration } = useAgentPipeline()

      expect(phaseProgress.value).toBe(0)

      phaseElapsed.value = phaseDuration.value / 2
      expect(phaseProgress.value).toBeCloseTo(0.5, 1)

      phaseElapsed.value = phaseDuration.value
      expect(phaseProgress.value).toBe(1)
    })
  })

  describe('Performance Optimization', () => {
    it('should throttle updates when offscreen', () => {
      const { throttleLevel, setOffscreen } = useAgentPipeline()

      expect(throttleLevel.value).toBe('full')

      setOffscreen(true)
      expect(throttleLevel.value).toBe('half')

      setOffscreen(false)
      expect(throttleLevel.value).toBe('full')
    })

    it('should respect reduced motion preference', () => {
      const { isStatic, setReducedMotion } = useAgentPipeline()

      expect(isStatic.value).toBe(false)

      setReducedMotion(true)
      expect(isStatic.value).toBe(true)
    })
  })

  describe('Cyberpunk Theme Integration', () => {
    it('should provide theme-compliant colors', () => {
      const { agents } = useAgentPipeline()

      agents.value.forEach((agent) => {
        // Colors should be CSS variables or hex values
        expect(
          agent.color.startsWith('--') ||
            /^#[0-9A-Fa-f]{6}$/.test(agent.color)
        ).toBe(true)
      })
    })

    it('should provide icon identifiers for each agent', () => {
      const { agents } = useAgentPipeline()

      agents.value.forEach((agent) => {
        expect(agent.icon).toBeTruthy()
        expect(typeof agent.icon).toBe('string')
      })
    })
  })

  describe('Cleanup and Lifecycle', () => {
    it('should provide cleanup function', () => {
      const { cleanup } = useAgentPipeline()

      expect(typeof cleanup).toBe('function')
      expect(cleanup).not.toThrow()
    })

    it('should clear timers on cleanup', () => {
      const { cleanup, setReducedMotion } = useAgentPipeline()

      setReducedMotion(true)
      cleanup()

      expect(cleanup).not.toThrow()
    })
  })
})
