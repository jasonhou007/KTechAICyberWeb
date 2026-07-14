<script setup>
/**
 * @component AdversarialFlow
 * @description Visualization of adversarial interactions between agents (#364).
 *
 * Shows the challenge/response flow when Reviewer challenges other agents:
 * - Animated challenge particles flowing from Reviewer to target agent
 * - Challenge dimension badges (accuracy, testing, security, etc.)
 * - Resolution indicators when challenges are resolved
 * - Challenge metrics and history
 *
 * @props {Array} challenges - Array of active challenges
 * @props {Array} resolvedChallenges - Array of resolved challenges
 * @props {Number} challengeCount - Total number of challenges
 * @props {Array} challengeDimensions - Array of challenge dimensions
 *
 * @ticket #364
 */
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  challenges: {
    type: Array,
    default: () => [],
  },
  resolvedChallenges: {
    type: Array,
    default: () => [],
  },
  challengeCount: {
    type: Number,
    default: 0,
  },
  challengeDimensions: {
    type: Array,
    default: () => [],
  },
})

// Animation state
const animationFrameId = ref(null)
const particles = ref([])

// Challenge dimension colors
const dimensionColors = {
  accuracy: 'var(--neon-cyan)',
  testing: 'var(--neon-green)',
  security: 'var(--neon-yellow)',
  performance: 'var(--neon-pink)',
  accessibility: 'var(--neon-purple)',
  documentation: 'var(--neon-orange)',
}

// Get color for dimension
const getDimensionColor = (dimension) => {
  return dimensionColors[dimension] || 'var(--neon-cyan)'
}

// Create challenge particle animation
const createChallengeParticle = (fromAgent, toAgent, dimension) => {
  const particle = {
    id: Date.now() + Math.random(),
    fromAgent,
    toAgent,
    dimension,
    progress: 0,
    color: getDimensionColor(dimension),
    speed: 0.01 + Math.random() * 0.01, // Random speed for variety
  }
  particles.value.push(particle)
}

// Animation loop
const animate = () => {
  particles.value = particles.value.filter((particle) => {
    particle.progress += particle.speed
    return particle.progress <= 1
  })

  if (particles.value.length > 0) {
    animationFrameId.value = requestAnimationFrame(animate)
  } else {
    animationFrameId.value = null
  }
}

// Start animation when particles exist
const startAnimation = () => {
  if (!animationFrameId.value && particles.value.length > 0) {
    animate()
  }
}

// Watch for new challenges
watch(
  () => props.challenges,
  (newChallenges) => {
    newChallenges.forEach((challenge) => {
      // Create particle from reviewer to challenged agent
      createChallengeParticle('reviewer', challenge.agentId, challenge.dimension)
    })
    startAnimation()
  },
  { deep: true }
)

// Cleanup
onUnmounted(() => {
  if (animationFrameId.value) {
    cancelAnimationFrame(animationFrameId.value)
  }
})

// Computed stats
const challengeStats = computed(() => ({
  total: props.challengeCount,
  resolved: props.resolvedChallenges.length,
  active: props.challenges.length,
  rate: props.challengeCount > 0
    ? Math.round((props.resolvedChallenges.length / props.challengeCount) * 100)
    : 0,
}))
</script>

<template>
  <div class="adversarial-flow">
    <!-- Header -->
    <div class="adversarial-flow__header">
      <h3 class="adversarial-flow__title">Adversarial Review Flow</h3>
      <div class="adversarial-flow__stats">
        <span class="adversarial-flow__stat">
          Challenges: {{ challengeStats.total }}
        </span>
        <span class="adversarial-flow__stat">
          Resolved: {{ challengeStats.resolved }}
        </span>
        <span class="adversarial-flow__stat">
          Rate: {{ challengeStats.rate }}%
        </span>
      </div>
    </div>

    <!-- Dimension badges -->
    <div class="adversarial-flow__dimensions">
      <div
        v-for="dimension in challengeDimensions"
        :key="dimension"
        class="dimension-badge"
        :style="{ borderColor: getDimensionColor(dimension) }"
      >
        <span class="dimension-badge__text">{{ dimension }}</span>
      </div>
    </div>

    <!-- Particle animation container -->
    <div class="adversarial-flow__particles" aria-hidden="true">
      <div
        v-for="particle in particles"
        :key="particle.id"
        class="challenge-particle"
        :style="{
          left: `${particle.progress * 100}%`,
          backgroundColor: particle.color,
          boxShadow: `0 0 6px ${particle.color}`,
        }"
      >
        <div class="challenge-particle__label">{{ particle.dimension }}</div>
      </div>
    </div>

    <!-- Resolved challenges -->
    <div v-if="resolvedChallenges.length > 0" class="adversarial-flow__resolved">
      <h4 class="adversarial-flow__resolved-title">Resolved Challenges</h4>
      <div class="adversarial-flow__resolved-list">
        <div
          v-for="(challenge, index) in resolvedChallenges"
          :key="`${challenge.agentId}-${challenge.dimension}-${index}`"
          class="resolved-challenge"
        >
          <span class="resolved-challenge__agent">{{ challenge.agentId }}</span>
          <span class="resolved-challenge__dimension">{{ challenge.dimension }}</span>
          <span class="resolved-challenge__icon">✓</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.adversarial-flow {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
}

.adversarial-flow__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.adversarial-flow__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--neon-yellow);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-shadow: 0 0 8px var(--neon-yellow);
}

.adversarial-flow__stats {
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
  color: var(--color-text-secondary, rgba(0, 255, 204, 0.7));
}

.adversarial-flow__stat {
  white-space: nowrap;
}

.adversarial-flow__dimensions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.dimension-badge {
  padding: 0.25rem 0.75rem;
  border: 1px solid var(--neon-yellow);
  border-radius: 4px;
  background: rgba(255, 255, 0, 0.05);
  transition: box-shadow 0.3s ease;
}

.dimension-badge:hover {
  box-shadow: 0 0 8px var(--neon-yellow);
}

.dimension-badge__text {
  font-size: 0.625rem;
  font-weight: 600;
  color: var(--neon-yellow);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.adversarial-flow__particles {
  position: relative;
  height: 60px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  overflow: hidden;
}

.challenge-particle {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  transition: left 0.016ms linear;
}

.challenge-particle__label {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.5rem;
  color: var(--neon-yellow);
  white-space: nowrap;
  opacity: 0.8;
}

.adversarial-flow__resolved {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.adversarial-flow__resolved-title {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--neon-green);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.adversarial-flow__resolved-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.resolved-challenge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem;
  background: rgba(0, 255, 0, 0.05);
  border-radius: 4px;
  font-size: 0.625rem;
}

.resolved-challenge__agent {
  color: var(--color-text-primary, var(--neon-cyan));
  font-weight: 600;
}

.resolved-challenge__dimension {
  color: var(--color-text-secondary, rgba(0, 255, 204, 0.7));
}

.resolved-challenge__icon {
  margin-left: auto;
  color: var(--neon-green);
  font-weight: bold;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .adversarial-flow__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .adversarial-flow__stats {
    flex-wrap: wrap;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .challenge-particle,
  .dimension-badge {
    animation: none !important;
    transition: none;
  }
}
</style>
