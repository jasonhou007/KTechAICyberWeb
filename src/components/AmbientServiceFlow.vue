<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useServiceFlow } from '../composables/useServiceFlow'
import { useDeviceDetection } from '../composables/useDeviceDetection'

// ========== PROPS ==========
const props = defineProps({
  serviceType: {
    type: String,
    required: true,
    validator: (value) => [
      'supply-chain-finance',
      'big-data-ai',
      'retail-lending',
      'project-management',
      'digital-asset-custody',
      'stablecoin',
      'cross-border-payment'
    ].includes(value)
  }
})

// ========== STATE ==========
const canvasRef = ref(null)
const containerRef = ref(null)

// ========== COMPOSABLES ==========
const { isMobile } = useDeviceDetection()

const {
  animationConfig,
  isAnimating,
  ariaLabel,
  animationStatus,
  startAnimation,
  stopAnimation,
  cleanup
} = useServiceFlow(props.serviceType, canvasRef)

// ========== METHODS ==========
function handleResize() {
  if (!canvasRef.value || !containerRef.value) return

  const container = containerRef.value
  const canvas = canvasRef.value

  // Set canvas size to match container (mobile uses smaller height)
  canvas.width = container.clientWidth
  canvas.height = isMobile.value ? 
    Math.min(250, container.clientWidth * 0.4) : 
    Math.min(400, container.clientWidth * 0.5)
}

// ========== WATCHERS ==========
watch(() => props.serviceType, (newType, oldType) => {
  if (newType !== oldType) {
    // Restart animation with new service type
    stopAnimation()
    cleanup()
    // Wait for next tick before starting new animation
    setTimeout(() => {
      handleResize()
      startAnimation()
    }, 100)
  }
})

// ========== LIFECYCLE ==========
onMounted(() => {
  handleResize()
  startAnimation()

  // Setup resize listener
  window.addEventListener('resize', handleResize)

  // Initial intersection observer setup
  if (typeof IntersectionObserver !== 'undefined') {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            startAnimation()
          } else {
            stopAnimation()
          }
        })
      },
      { threshold: 0.1 }
    )

    if (containerRef.value) {
      observer.observe(containerRef.value)
    }

    onUnmounted(() => {
      observer.disconnect()
    })
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  cleanup()
})
</script>

<template>
  <div
    ref="containerRef"
    class="ambient-service-flow cyber-theme"
    :class="`service-${props.serviceType}`"
  >
    <canvas
      ref="canvasRef"
      :aria-label="ariaLabel"
      role="img"
      :class="{ 'is-animating': isAnimating }"
    />
    <div class="animation-status" aria-live="polite">
      {{ animationStatus }}
    </div>
  </div>
</template>

<style scoped>
.ambient-service-flow {
  position: relative;
  width: 100%;
  height: auto;
  min-height: 300px;
  background: var(--color-bg-primary, #0a0a0a);
  border: 1px solid var(--color-cyber-border, #00ff00);
  border-radius: 8px;
  overflow: hidden;
  margin: 2rem 0;
  box-shadow: 0 0 10px var(--color-cyber-glow, rgba(0, 255, 0, 0.3));
  /* CSS containment for performance optimization */
  content-visibility: auto;
  contain-intrinsic-size: auto 300px;
}

.ambient-service-flow::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 255, 0, 0.03) 2px,
    rgba(0, 255, 0, 0.03) 4px
  );
  pointer-events: none;
  z-index: 1;
}

.ambient-service-flow canvas {
  display: block;
  width: 100%;
  height: auto;
  position: relative;
  z-index: 2;
}

.animation-status {
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
  padding: 0.25rem 0.5rem;
  background: var(--color-bg-secondary, rgba(0, 0, 0, 0.8));
  border: 1px solid var(--color-cyber-border, #00ff00);
  color: var(--color-cyber-primary, #00ff00);
  font-family: var(--font-cyber);
  font-size: 0.75rem;
  border-radius: 4px;
  z-index: 3;
  opacity: 0.7;
  transition: opacity 0.3s ease;
}

.ambient-service-flow:hover .animation-status {
  opacity: 1;
}

/* Service-specific theming */
.service-supply-chain-finance {
  --service-color: #00ff00;
  --service-glow: rgba(0, 255, 0, 0.3);
}

.service-big-data-ai {
  --service-color: var(--color-cyber-secondary);
  --service-glow: var(--color-cyber-secondary-glow);
}

.service-retail-lending {
  --service-color: var(--color-cyber-primary);
  --service-glow: var(--color-cyber-primary-glow);
}

.service-project-management {
  --service-color: #ffff00;
  --service-glow: rgba(255, 255, 0, 0.3);
}

.service-digital-asset-custody {
  --service-color: #ff8800;
  --service-glow: rgba(255, 136, 0, 0.3);
}

.service-stablecoin {
  --service-color: var(--color-cyber-success);
  --service-glow: var(--color-cyber-success-glow);
}

.service-cross-border-payment {
  --service-color: #8800ff;
  --service-glow: rgba(136, 0, 255, 0.3);
}

/* Apply service colors */
.ambient-service-flow {
  border-color: var(--service-color);
  box-shadow: 0 0 10px var(--service-glow);
}

.animation-status {
  border-color: var(--service-color);
  color: var(--service-color);
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .ambient-service-flow canvas {
    animation: none !important;
  }

  .ambient-service-flow::before {
    background: none;
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .ambient-service-flow {
    min-height: 200px;
    margin: 1rem 0;
    contain-intrinsic-size: auto 200px;
  }

  .animation-status {
    font-size: 0.625rem;
  }
}
</style>
