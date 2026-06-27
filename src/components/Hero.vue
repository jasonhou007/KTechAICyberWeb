<template>
  <section class="hero" id="hero">
    <div class="hero-bg" aria-hidden="true"></div>
    <div class="hero-grid" aria-hidden="true"></div>
    <div class="hero-particles" ref="particles" aria-hidden="true"></div>

    <!-- Skeleton State -->
    <SkeletonHero v-if="isLoading" />

    <!-- Actual Content -->
    <Transition name="content-fade">
      <div v-if="!isLoading" class="hero-content">
        <h1 class="hero-title">
          <span class="main">{{ t('hero.title') }}</span>
          <span class="accent">{{ t('hero.subtitle') }}</span>
        </h1>
        <p class="hero-subtitle">{{ t('hero.description') }}</p>

        <div class="hero-stats">
          <div v-for="stat in stats" :key="stat.label" class="stat-item">
            <div class="stat-number">{{ stat.value }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
        </div>
      </div>
    </Transition>
  </section>
</template>

<script setup>
/**
 * @component Hero
 * @description Hero section with animated background particles and company stats
 *
 * @example
 * <Hero />
 */

import { ref, onMounted } from 'vue'
import SkeletonHero from './SkeletonHero.vue'
import { useSkeleton } from '../composables/useSkeleton'
import { useLanguage } from '../composables/useLanguage'

// Shared i18n — text now follows the site-wide language toggle (en/zh).
const { t } = useLanguage()

// Refs
const particles = ref(null)

// Skeleton loading state for above-fold content
const { isLoading } = useSkeleton({ immediate: true })

// Debug: log what we're getting from useSkeleton
if (typeof window !== 'undefined' && window.__DEBUG__) {
  console.log('Hero: isLoading from useSkeleton =', isLoading)
  console.log('Hero: isLoading.value =', isLoading.value)
  console.log('Hero: typeof isLoading =', typeof isLoading)
}

// Stats data
const stats = [
  { value: '2020', label: t('stats.founded') },
  { value: '3亿', label: t('stats.capital') },
  { value: '20+', label: t('stats.projects') }
]

// Create particles
const createParticles = () => {
  if (!particles.value) return

  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div')
    p.className = 'particle'
    p.style.left = Math.random() * 100 + '%'
    p.style.animationDelay = Math.random() * 8 + 's'
    p.style.animationDuration = (5 + Math.random() * 5) + 's'
    particles.value.appendChild(p)
  }
}

onMounted(() => {
  createParticles()
})
</script>

<style scoped>
.hero {
  min-height: 100vh;
  display: flex;
  align-items: center;
  padding: 0 8%;
  position: relative;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 20% 50%, rgba(0, 255, 204, 0.1) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 50%, rgba(255, 0, 170, 0.08) 0%, transparent 50%);
  animation: bgShift 10s ease-in-out infinite alternate;
}

@keyframes bgShift {
  0% { opacity: 0.8; }
  100% { opacity: 1; }
}

.hero-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(0, 255, 204, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 204, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  opacity: 0.5;
}

.hero-particles {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.particle {
  position: absolute;
  width: 2px;
  height: 2px;
  background: var(--cyan);
  border-radius: 50%;
  opacity: 0;
  animation: float 8s ease-in-out infinite;
  box-shadow: 0 0 4px var(--cyan);
}

@keyframes float {
  0% {
    opacity: 0;
    transform: translateY(100vh);
  }
  10% {
    opacity: 0.6;
  }
  90% {
    opacity: 0.6;
  }
  100% {
    opacity: 0;
    transform: translateY(-100px);
  }
}

.hero-content {
  flex: 1;
  z-index: 10;
  position: relative;
}

.hero-title {
  font-family: var(--font-display);
  font-size: clamp(2.5rem, 6vw, 5rem);
  font-weight: 700;
  line-height: 1.1;
  margin-bottom: 2rem;
}

.hero-title .main {
  display: block;
  color: var(--text-primary);
  letter-spacing: 0.15em;
  animation: glitch 3s ease-in-out infinite;
}

@keyframes glitch {
  0%, 90%, 100% { transform: translateX(0); }
  92% { transform: translateX(-2px); }
  94% { transform: translateX(2px); }
  96% { transform: translateX(-1px); }
  98% { transform: translateX(1px); }
}

.hero-title .accent {
  display: block;
  color: var(--cyan);
  text-shadow: 0 0 30px var(--cyan);
  letter-spacing: 0.2em;
}

.hero-subtitle {
  font-size: 1.2rem;
  color: var(--text-secondary);
  margin-bottom: 3rem;
  max-width: 600px;
  line-height: 1.8;
}

.hero-stats {
  display: flex;
  gap: 4rem;
  margin-top: 4rem;
  flex-wrap: wrap;
}

.stat-item {
  text-align: left;
}

.stat-number {
  font-family: var(--font-display);
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--cyan);
  text-shadow: 0 0 20px var(--cyan);
  transition: transform 0.3s ease;
}

.stat-item:hover .stat-number {
  transform: scale(1.05);
}

.stat-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-top: 0.5rem;
}

@media (max-width: 768px) {
  .hero {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .hero-title {
    font-size: 2rem;
  }

  .hero-stats {
    flex-direction: column;
    gap: 2rem;
  }
}

/* Content fade transition */
.content-fade-enter-active {
  transition: opacity 0.6s ease;
}

.content-fade-enter-from {
  opacity: 0;
}

.content-fade-enter-to {
  opacity: 1;
}
</style>
