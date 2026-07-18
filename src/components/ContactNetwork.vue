<template>
  <div
    ref="networkRef"
    class="contact-network"
    :class="{ 'network-static': isStatic }"
    role="img"
    :aria-label="t('ambient.contactAriaLabel')"
  >
    <canvas
      v-if="!isStatic"
      ref="canvasRef"
      class="network-canvas"
    />
    <div v-else class="network-static nodes-grid">
      <!-- Static fallback nodes for reduced motion -->
      <div
        v-for="(node, index) in staticNodes"
        :key="index"
        class="static-node"
        :style="{
          left: `${node.x}%`,
          top: `${node.y}%`
        }"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAmbientAnimation } from '@/composables/useAmbientAnimation'

const { t } = useI18n()

const props = defineProps({
  nodeCount: {
    type: Number,
    default: null
  },
  maxConnectionDistance: {
    type: Number,
    default: 150
  },
  nodeRadius: {
    type: Number,
    default: 3
  }
})

const emit = defineEmits(['ready'])

const networkRef = ref(null)
const canvasRef = ref(null)
const ctx = ref(null)

const nodes = ref([])
const connections = ref([])
const dataFlowParticles = ref([])

const computedNodeCount = computed(() => {
  if (props.nodeCount !== null) return props.nodeCount
  return typeof window !== 'undefined' && window.innerWidth < 768 ? 6 : 12
})

const staticNodes = computed(() => {
  const count = computedNodeCount.value
  const nodes = []
  for (let i = 0; i < count; i++) {
    nodes.push({
      x: (i % 4) * 25 + 12.5,
      y: Math.floor(i / 4) * 25 + 12.5
    })
  }
  return nodes
})

const { target, isPaused, isStatic, isPlaying, progress, startLoop, stopLoop } = useAmbientAnimation()
target.value = networkRef

function generateNodes() {
  const count = computedNodeCount.value
  const newNodes = []
  const width = canvasRef.value?.width || 1920
  const height = canvasRef.value?.height || 1080
  const gridCols = Math.ceil(Math.sqrt(count * (width / height)))
  const gridRows = Math.ceil(count / gridCols)
  const cellWidth = width / gridCols
  const cellHeight = height / gridRows

  for (let i = 0; i < count; i++) {
    const col = i % gridCols
    const row = Math.floor(i / gridCols)
    let x = (col + 0.5) * cellWidth
    let y = (row + 0.5) * cellHeight
    x += (Math.random() - 0.5) * cellWidth * 0.6
    y += (Math.random() - 0.5) * cellHeight * 0.6
    newNodes.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      phase: Math.random() * Math.PI * 2,
      radius: props.nodeRadius
    })
  }
  nodes.value = newNodes
}

function calculateConnections() {
  const newConnections = []
  const maxDist = props.maxConnectionDistance

  for (let i = 0; i < nodes.value.length; i++) {
    for (let j = i + 1; j < nodes.value.length; j++) {
      const nodeA = nodes.value[i]
      const nodeB = nodes.value[j]
      const dx = nodeB.x - nodeA.x
      const dy = nodeB.y - nodeA.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < maxDist) {
        newConnections.push({
          from: i,
          to: j,
          distance,
          opacity: 1 - (distance / maxDist)
        })
      }
    }
  }
  connections.value = newConnections
}

function initDataFlowParticles() {
  const particles = []
  const particleCount = Math.floor(connections.value.length * 0.5)

  for (let i = 0; i < particleCount; i++) {
    const connectionIndex = Math.floor(Math.random() * connections.value.length)
    particles.push({
      connectionIndex,
      progress: Math.random(),
      speed: 0.002 + Math.random() * 0.003,
      opacity: 0.6 + Math.random() * 0.4
    })
  }
  dataFlowParticles.value = particles
}

let animationFrameId = null
let lastTime = null

function animate(timestamp) {
  if (!ctx.value || isPaused.value || isStatic.value) {
    animationFrameId = null
    return
  }

  if (!lastTime) lastTime = timestamp
  const deltaTime = timestamp - lastTime
  lastTime = timestamp

  const width = canvasRef.value?.width || 1920
  const height = canvasRef.value?.height || 1080
  ctx.value.clearRect(0, 0, width, height)

  updateNodes(deltaTime)
  drawConnections()
  drawNodes()
  drawDataFlow()

  animationFrameId = requestAnimationFrame(animate)
}

function updateNodes(deltaTime) {
  for (const node of nodes.value) {
    node.x += node.vx
    node.y += node.vy
    const width = canvasRef.value?.width || 1920
    const height = canvasRef.value?.height || 1080

    if (node.x < 0 || node.x > width) node.vx *= -1
    if (node.y < 0 || node.y > height) node.vy *= -1

    node.x = Math.max(0, Math.min(width, node.x))
    node.y = Math.max(0, Math.min(height, node.y))
  }
  calculateConnections()
}

function drawConnections() {
  if (!ctx.value) return

  ctx.value.save()
  ctx.value.strokeStyle = 'rgba(0, 255, 204, 0.3)'
  ctx.value.lineWidth = 1

  for (const connection of connections.value) {
    const nodeA = nodes.value[connection.from]
    const nodeB = nodes.value[connection.to]
    ctx.value.globalAlpha = connection.opacity * 0.3
    ctx.value.beginPath()
    ctx.value.moveTo(nodeA.x, nodeA.y)
    ctx.value.lineTo(nodeB.x, nodeB.y)
    ctx.value.stroke()
  }
  ctx.value.restore()
}

function drawNodes() {
  if (!ctx.value) return

  const time = Date.now() / 1000

  for (const node of nodes.value) {
    const pulse = Math.sin(time * 2 + node.phase) * 0.3 + 0.7
    const opacity = pulse * 0.8
    ctx.value.save()
    ctx.value.shadowColor = '#00ffcc'
    ctx.value.shadowBlur = 15
    ctx.value.fillStyle = `rgba(0, 255, 204, \${opacity})`
    ctx.value.beginPath()
    ctx.value.arc(node.x, node.y, node.radius, 0, Math.PI * 2)
    ctx.value.fill()
    ctx.value.restore()
  }
}

function drawDataFlow() {
  if (!ctx.value) return

  for (const particle of dataFlowParticles.value) {
    particle.progress += particle.speed
    if (particle.progress > 1) {
      particle.progress = 0
    }

    const connection = connections.value[particle.connectionIndex]
    if (!connection) continue

    const nodeA = nodes.value[connection.from]
    const nodeB = nodes.value[connection.to]
    const x = nodeA.x + (nodeB.x - nodeA.x) * particle.progress
    const y = nodeA.y + (nodeB.y - nodeA.y) * particle.progress

    ctx.value.save()
    ctx.value.shadowColor = '#ff00aa'
    ctx.value.shadowBlur = 8
    ctx.value.fillStyle = `rgba(255, 0, 170, \${particle.opacity})`
    ctx.value.beginPath()
    ctx.value.arc(x, y, 1.5, 0, Math.PI * 2)
    ctx.value.fill()
    ctx.value.restore()
  }
}

function setupCanvas() {
  if (!canvasRef.value) return

  const canvas = canvasRef.value

  // Set canvas size to window size immediately for fixed positioning
  // This prevents layout shift from canvas resizing
  canvas.width = window.innerWidth || 1920
  canvas.height = window.innerHeight || 1080

  ctx.value = canvas.getContext('2d')
  generateNodes()
  calculateConnections()
  initDataFlowParticles()
}

function handleResize() {
  if (!canvasRef.value) return
  setupCanvas()
}

onMounted(() => {
  // Set up canvas immediately to prevent layout shift
  setupCanvas()
  if (isPlaying.value) {
    lastTime = null
    animationFrameId = requestAnimationFrame(animate)
  }
  emit('ready')
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
  window.removeEventListener('resize', handleResize)
})

watch(isPlaying, (playing) => {
  if (playing && !animationFrameId) {
    lastTime = null
    animationFrameId = requestAnimationFrame(animate)
  } else if (!playing && animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
})
</script>

<style scoped>
.contact-network {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
  opacity: 0.4;
  /* GPU acceleration and prevent layout shift */
  will-change: opacity;
  contain: layout style paint;
}

.network-canvas {
  width: 100%;
  height: 100%;
  display: block;
  /* Prevent canvas from causing layout shift */
  contain: strict;
}

.network-static.nodes-grid {
  width: 100%;
  height: 100%;
  position: relative;
  background-image:
    linear-gradient(rgba(0, 255, 204, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 204, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  contain: layout style paint;
}

.static-node {
  position: absolute;
  width: 6px;
  height: 6px;
  background-color: rgba(0, 255, 204, 0.5);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 8px rgba(0, 255, 204, 0.3);
}

.network-static {
  opacity: 0.6;
}
</style>
