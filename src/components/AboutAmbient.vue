<template>
  <section
    ref="ambientRef"
    class="about-ambient"
    :class="{ 'ambient-static': isStatic }"
    role="img"
    :aria-label="t('ambient.aboutAriaLabel')"
  >
    <canvas
      v-if="!isStatic"
      ref="canvasRef"
      class="ambient-canvas"
      :width="canvasSize.width"
      :height="canvasSize.height"
    />
    <div v-else class="ambient-static particles-grid">
      <!-- Static fallback particles -->
      <div
        v-for="i in 20"
        :key="i"
        class="static-particle"
        :style="{ left: `${i * 5}%`, top: `${20 + (i % 3) * 20}%` }"
      />
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useLanguage } from '@/composables/useLanguage'
import { useAmbientAnimation } from '@/composables/useAmbientAnimation'

const { t } = useLanguage()

// Props
const props = defineProps({
  particleCount: {
    type: Number,
    default: 50
  }
})

// Expose particleCount for tests
defineExpose({
  particleCount: computed(() => props.particleCount)
})

// Ambient animation state
const ambientRef = ref(null)
const canvasRef = ref(null)
const canvasSize = ref({ width: 1920, height: 600 })

const { 
  target, 
  isPaused, 
  isStatic, 
  isPlaying, 
  progress, 
  startLoop, 
  stopLoop,
  isMobile,
  adaptiveParticles
} = useAmbientAnimation({
  particles: props.particleCount,
  mobileParticles: 20, // Reduced particles on mobile
  enableThrottling: true
})

target.value = ambientRef

// Particle system
const particles = ref([])

// Vision, Mission, Culture anchor points (percent)
const anchors = [
  { x: 20, y: 50, label: 'vision' },
  { x: 50, y: 50, label: 'mission' },
  { x: 80, y: 50, label: 'culture' }
]

function initParticles() {
  // Use adaptive particle count based on device
  const count = adaptiveParticles.value
  particles.value = []
  
  for (let i = 0; i < count; i++) {
    particles.value.push({
      x: anchors[0].x, // Start at vision
      y: anchors[0].y,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      opacity: Math.random() * 0.5 + 0.3,
      phase: Math.random() * Math.PI * 2,
      targetIndex: Math.floor(Math.random() * anchors.length)
    })
  }
}

function updateParticles(deltaTime) {
  particles.value.forEach(p => {
    // Move toward target anchor
    const target = anchors[p.targetIndex]
    const dx = (target.x - p.x) * 0.001
    const dy = (target.y - p.y) * 0.001

    p.x += p.vx + dx
    p.y += p.vy + dy

    // Pulse opacity
    p.phase += deltaTime * 0.001
    p.opacity = 0.3 + Math.sin(p.phase) * 0.2

    // Cycle targets on phase change (less frequent on mobile)
    const cycleChance = isMobile.value ? 0.0005 : 0.001
    if (Math.random() < cycleChance) {
      p.targetIndex = (p.targetIndex + 1) % anchors.length
    }
  })
}

function drawCanvas() {
  if (!canvasRef.value || isStatic.value) return

  const ctx = canvasRef.value.getContext('2d')
  const { width, height } = canvasSize.value

  ctx.clearRect(0, 0, width, height)

  // Draw particles
  particles.value.forEach(p => {
    const x = (p.x / 100) * width
    const y = (p.y / 100) * height

    ctx.beginPath()
    ctx.arc(x, y, 2, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(0, 255, 204, ${p.opacity})` // Cyan neon
    ctx.fill()

    // Glow effect (reduced on mobile)
    if (!isMobile.value) {
      ctx.shadowColor = '#00ffcc'
      ctx.shadowBlur = 10
    }
  })

  // Reset shadow
  ctx.shadowBlur = 0
}

let lastFrameTime = null

function animationLoop(now) {
  if (!isPlaying.value) return

  const deltaTime = lastFrameTime ? now - lastFrameTime : 0
  lastFrameTime = now

  updateParticles(deltaTime)
  drawCanvas()

  requestAnimationFrame(animationLoop)
}

onMounted(() => {
  initParticles()
  startLoop()
  requestAnimationFrame(animationLoop)
})

onUnmounted(() => {
  stopLoop()
})

// Responsive canvas size
function resizeCanvas() {
  if (canvasRef.value) {
    canvasSize.value = {
      width: canvasRef.value.offsetWidth,
      height: canvasRef.value.offsetHeight
    }
  }
}
</script>

<style scoped>
.about-ambient {
  position: relative;
  width: 100%;
  height: 600px;
  overflow: hidden;
  /* CSS containment for performance optimization */
  content-visibility: auto;
  contain-intrinsic-size: auto 600px;
}

.ambient-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0.6;
  pointer-events: none;
}

.ambient-static.particles-grid {
  position: relative;
  width: 100%;
  height: 100%;
}

.static-particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: var(--color-cyber-secondary, #00ffcc);
  border-radius: 50%;
  opacity: 0.5;
  box-shadow: 0 0 10px var(--color-cyber-secondary, #00ffcc);
}

@media (max-width: 768px) {
  .about-ambient {
    height: 400px;
    contain-intrinsic-size: auto 400px;
  }
}
</style>
