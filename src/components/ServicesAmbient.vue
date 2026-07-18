<template>
  <section
    ref="ambientRef"
    class="services-ambient"
    :class="{ 'ambient-static': isStatic }"
    data-ambient-root="services"
    role="img"
    :aria-label="t('ambient.servicesAriaLabel')"
  >
    <svg
      v-if="!isStatic"
      ref="svgRef"
      class="ambient-svg"
      viewBox="0 0 100 50"
      preserveAspectRatio="xMidYMid meet"
    >
      <!-- Service icons cycling -->
      <g v-for="(service, i) in services" :key="service.key">
        <text
          :x="service.x"
          :y="service.y"
          :font-size="currentServiceIndex === i ? 4 : 2"
          :opacity="calculateOpacity(i)"
          fill="var(--color-cyber-secondary, #00ffcc)"
          text-anchor="middle"
        >
          {{ service.icon }}
        </text>

        <!-- Data flow particles for current service -->
        <circle
          v-for="p in getServiceParticles(i)"
          :key="p.id"
          :cx="p.x"
          :cy="p.y"
          :r="0.5"
          :opacity="p.opacity"
          fill="var(--color-cyber-primary, #ff00ff)"
        />
      </g>
    </svg>

    <div v-else class="ambient-static services-grid">
      <div
        v-for="service in services"
        :key="service.key"
        class="static-service"
        :style="{ left: `${service.x}%`, top: `${service.y}%` }"
      >
        {{ service.icon }}
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useLanguage } from '@/composables/useLanguage'
import { useAmbientAnimation } from '@/composables/useAmbientAnimation'

const { t } = useLanguage()

// Services data
const services = ref([
  { key: 'projectManagement', icon: '📋', x: 20, y: 25 },
  { key: 'retailCredit', icon: '💳', x: 40, y: 25 },
  { key: 'supplyChain', icon: '🔗', x: 60, y: 25 },
  { key: 'blockchain', icon: '⛓️', x: 80, y: 25 },
  { key: 'bigDataAI', icon: '🧠', x: 50, y: 75 }
])

// Ambient animation state
const ambientRef = ref(null)
const svgRef = ref(null)

const { target, isPaused, isStatic, isPlaying, progress } = useAmbientAnimation()
target.value = ambientRef

// Current service based on progress (0..1)
const currentServiceIndex = computed(() => {
  return Math.floor(progress.value * services.value.length) % services.value.length
})

// Calculate opacity based on distance from current service
function calculateOpacity(index) {
  const current = currentServiceIndex.value
  const distance = Math.abs(index - current)
  if (distance === 0) return 1
  if (distance === 1) return 0.5
  return 0.2
}

// Service particles
function getServiceParticles(serviceIndex) {
  // Only show particles for current/nearby services
  if (Math.abs(serviceIndex - currentServiceIndex.value) > 1) return []

  const service = services.value[serviceIndex]
  const baseParticles = 5

  return Array.from({ length: baseParticles }, (_, i) => ({
    id: `${serviceIndex}-${i}`,
    x: service.x + Math.sin(Date.now() * 0.001 + i) * 5,
    y: service.y + Math.cos(Date.now() * 0.001 + i) * 5,
    opacity: 0.6
  }))
}
</script>

<style scoped>
.services-ambient {
  position: relative;
  width: 100%;
  height: 500px;
  overflow: hidden;
}

.ambient-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0.6;
  pointer-events: none;
}

.ambient-static.services-grid {
  position: relative;
  width: 100%;
  height: 100%;
}

.static-service {
  position: absolute;
  font-size: 2rem;
  opacity: 0.6;
  transform: translate(-50%, -50%);
}

@media (max-width: 768px) {
  .services-ambient {
    height: 400px;
  }
}
</style>
