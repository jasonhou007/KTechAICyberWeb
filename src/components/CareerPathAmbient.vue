<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useLanguage } from '@/composables/useLanguage'

// ========== TYPES ==========
interface Position {
  id: number
  title: string
  department: string
}

interface CareerStage {
  label: string
  y: number
  color: string
}

interface SkillParticle {
  x: number
  y: number
  targetY: number
  skill: string
  stage: number
  speed: number
  color: string
}

// ========== PROPS ==========
const props = defineProps<{
  positions?: Position[]
}>()

// ========== I18N ==========
const { t } = useLanguage()

// ========== STATE ==========
const canvasRef = ref<HTMLCanvasElement | null>(null)
const isAnimating = ref(false)
let ctx: CanvasRenderingContext2D | null = null
let animationFrameId: number | null = null
let observer: IntersectionObserver | null = null

// ========== CAREER STAGES ==========
const careerStages = ref<CareerStage[]>([
  { label: 'Junior', y: 0.15, color: '#00ffff' },
  { label: 'Mid', y: 0.35, color: '#ff00ff' },
  { label: 'Senior', y: 0.55, color: '#00ff00' },
  { label: 'Lead', y: 0.75, color: '#ffff00' },
  { label: 'Principal', y: 0.90, color: '#ff6600' }
])

const skillParticles = ref<SkillParticle[]>([])
const newHireParticles = ref<Array<{ x: number; y: number; opacity: number }>>([])

// ========== ADAPTIVE SETTINGS ==========
const isMobile = computed(() => {
  return typeof window !== 'undefined' && window.innerWidth < 768
})

const particleCount = computed(() => isMobile.value ? 20 : 50)
const targetFPS = computed(() => isMobile.value ? 30 : 60)

// ========== REDUCED MOTION DETECTION ==========
const prefersReducedMotion = computed(() => {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
})

// ========== ANIMATION LOOP ==========
const lastTime = ref(0)
const frameInterval = computed(() => 1000 / targetFPS.value)

const animate = (timestamp: number) => {
  if (!ctx || !canvasRef.value) return

  const elapsed = timestamp - lastTime.value

  if (elapsed < frameInterval.value) {
    animationFrameId = requestAnimationFrame(animate)
    return
  }

  lastTime.value = timestamp - (elapsed % frameInterval.value)

  // Clear canvas
  ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)

  // Draw animation
  drawFrame()

  animationFrameId = requestAnimationFrame(animate)
}

const drawFrame = () => {
  if (!ctx || !canvasRef.value) return

  const width = canvasRef.value.width
  const height = canvasRef.value.height

  // Draw grid lines
  drawGrid(width, height)

  // Draw career stages
  drawCareerStages(width, height)

  // Draw skill particles
  updateAndDrawSkillParticles(width, height)

  // Draw new hire particles
  updateAndDrawNewHires(width, height)
}

const drawGrid = (width: number, height: number) => {
  if (!ctx) return

  ctx.strokeStyle = 'rgba(0, 255, 255, 0.05)'
  ctx.lineWidth = 1

  const gridSize = 50

  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }

  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }
}

const drawCareerStages = (width: number, height: number) => {
  if (!ctx) return

  careerStages.value.forEach((stage, index) => {
    const y = stage.y * height
    const isLast = index === careerStages.value.length - 1

    // Draw stage line
    ctx.strokeStyle = stage.color
    ctx.lineWidth = 2
    ctx.globalAlpha = 0.3

    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()

    // Draw stage label
    ctx.globalAlpha = 1
    ctx.fillStyle = stage.color
    ctx.font = '14px Orbitron, monospace'
    ctx.fillText(stage.label, 10, y - 5)

    // Draw glow effect
    if (!isLast) {
      ctx.shadowColor = stage.color
      ctx.shadowBlur = 10
      ctx.beginPath()
      ctx.arc(width - 20, y, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
    }
  })
}

const updateAndDrawSkillParticles = (width: number, height: number) => {
  if (!ctx) return

  skillParticles.value.forEach(particle => {
    // Update position
    particle.y += particle.speed

    // Reset if reached bottom
    if (particle.y > height) {
      particle.y = 0
      particle.x = Math.random() * width
    }

    // Draw particle
    ctx.globalAlpha = 0.6
    ctx.fillStyle = particle.color
    ctx.beginPath()
    ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2)
    ctx.fill()

    // Draw skill label
    ctx.globalAlpha = 0.8
    ctx.font = '10px Rajdhani, sans-serif'
    ctx.fillText(particle.skill, particle.x + 5, particle.y)
  })

  ctx.globalAlpha = 1
}

const updateAndDrawNewHires = (width: number, height: number) => {
  if (!ctx) return

  newHireParticles.value.forEach(hire => {
    hire.y += 0.5
    hire.opacity -= 0.005

    if (hire.y > height || hire.opacity <= 0) {
      hire.y = height * 0.1
      hire.opacity = 1
      hire.x = Math.random() * width
    }

    ctx.globalAlpha = hire.opacity
    ctx.fillStyle = '#00ff00'
    ctx.beginPath()
    ctx.arc(hire.x, hire.y, 4, 0, Math.PI * 2)
    ctx.fill()

    // Draw "New Hire" label
    ctx.font = '10px Orbitron, monospace'
    ctx.fillText('New Hire', hire.x + 8, hire.y + 3)
  })

  ctx.globalAlpha = 1
}

// ========== INITIALIZATION ==========
const initCanvas = () => {
  if (!canvasRef.value) return

  const canvas = canvasRef.value
  const dpr = window.devicePixelRatio || 1

  // Set canvas size
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr

  ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.scale(dpr, dpr)
  }

  // Initialize skill particles
  initSkillParticles(rect.width, rect.height)

  // Initialize new hire particles
  initNewHires(rect.width, rect.height)
}

const initSkillParticles = (width: number, height: number) => {
  const skills = ['AI', 'Blockchain', 'Fintech', 'Web', 'Cloud', 'Data']
  const colors = ['#00ffff', '#ff00ff', '#00ff00', '#ffff00', '#ff6600', '#0099ff']

  skillParticles.value = Array.from({ length: particleCount.value }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    targetY: height,
    skill: skills[Math.floor(Math.random() * skills.length)],
    stage: Math.floor(Math.random() * 5),
    speed: 0.5 + Math.random() * 1.5,
    color: colors[Math.floor(Math.random() * colors.length)]
  }))
}

const initNewHires = (width: number, height: number) => {
  newHireParticles.value = Array.from({ length: isMobile.value ? 2 : 5 }, () => ({
    x: Math.random() * width,
    y: height * 0.1,
    opacity: 1
  }))
}

const startAnimation = () => {
  if (isAnimating.value || prefersReducedMotion.value) return

  isAnimating.value = true
  lastTime.value = performance.now()
  animationFrameId = requestAnimationFrame(animate)
}

const stopAnimation = () => {
  isAnimating.value = false
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
}

// ========== INTERSECTION OBSERVER ==========
const initIntersectionObserver = () => {
  if (!canvasRef.value || prefersReducedMotion.value) return

  observer = new IntersectionObserver(
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

  observer.observe(canvasRef.value)
}

// ========== LIFECYCLE ==========
onMounted(() => {
  if (prefersReducedMotion.value) {
    // Render static frame
    initCanvas()
    if (ctx && canvasRef.value) {
      drawFrame()
    }
  } else {
    initCanvas()
    initIntersectionObserver()
  }
})

onUnmounted(() => {
  stopAnimation()

  if (observer) {
    observer.disconnect()
    observer = null
  }
})
</script>

<template>
  <div class="career-path-ambient" role="img" :aria-label="t('ambient.careersAriaLabel')">
    <canvas ref="canvasRef" class="career-path-canvas"></canvas>
  </div>
</template>

<style scoped>
.career-path-ambient {
  position: relative;
  width: 100%;
  height: 400px;
  margin: 2rem 0;
  overflow: hidden;
}

.career-path-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

@media (max-width: 768px) {
  .career-path-ambient {
    height: 300px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .career-path-canvas {
    /* Static fallback for reduced motion */
  }
}
</style>
