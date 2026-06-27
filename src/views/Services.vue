<template>
  <div class="services">
    <!-- Animated background grid -->
    <div class="grid-bg"></div>
    <div class="grid-bg grid-bg-2"></div>

    <!-- Main content -->
    <div class="content">
      <!-- Header with neon glow -->
      <header class="cyber-header">
        <h1 class="neon-text glitch-text" :data-text="t('services.title')">
          {{ t('services.title') }}
        </h1>
        <p class="subtitle">{{ t('services.subtitle') }}</p>
      </header>

      <!-- Services grid with lazy loading -->
      <section class="services-grid">
        <article
          v-for="(service, index) in services"
          :key="service.id"
          :ref="el => observeServiceCard(el, index)"
          class="service-card"
          :class="{ 'is-visible': isServiceVisible(index) }"
          :aria-label="t(`services.items.${service.key}.title`)"
        >
          <div class="service-icon neon-border">{{ service.icon }}</div>
          <h2 class="service-title">{{ t(`services.items.${service.key}.title`) }}</h2>
          <p class="service-description">{{ t(`services.items.${service.key}.description`) }}</p>
          <ul class="service-features">
            <li v-for="feature in service.features" :key="feature">
              <span class="feature-bullet">›</span>
              {{ t(`services.items.${service.key}.features.${feature}`) }}
            </li>
          </ul>
          <router-link
            v-if="service.link"
            :to="service.link"
            class="service-link neon-border"
            :aria-label="t(`services.items.${service.key}.title`)"
          >
            {{ t('services.relatedServices') }}
          </router-link>
        </article>
      </section>

      <!-- CTA Button -->
      <div class="cta">
        <button class="cyber-button neon-border" @click="scrollToContact">
          <span>{{ t('services.cta') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useLanguage } from '../composables/useLanguage'
import { useIntersectionObserverList } from '../composables/useIntersectionObserver'

const { t } = useLanguage()
const { visibleItems, observeItem } = useIntersectionObserverList({
  rootMargin: '50px',
  threshold: 0.1
})

// Service data structure
const services = [
  {
    id: 1,
    key: 'projectManagement',
    icon: '📋',
    features: ['sprint', 'velocity', 'reporting']
  },
  {
    id: 2,
    key: 'retailCredit',
    icon: '💳',
    features: ['underwriting', 'analytics', 'compliance'],
    link: '/services/retail-lending'
  },
  {
    id: 3,
    key: 'supplyChain',
    icon: '🔗',
    features: ['tracking', 'currency', 'mitigation']
  },
  {
    id: 4,
    key: 'blockchain',
    icon: '⛓️',
    features: ['contracts', 'consensus', 'trails']
  },
  {
    id: 5,
    key: 'bigDataAI',
    icon: '🧠',
    features: ['machineLearning', 'predictiveAnalytics', 'dataGovernance'],
    link: '/services/big-data-ai'
  }
]

// Lazy loading for service cards
const observeServiceCard = (el, index) => {
  if (el) {
    observeItem(el, index)
  }
}

const isServiceVisible = (index) => {
  return visibleItems.value.has(index)
}

// Smooth scroll to contact section
const scrollToContact = () => {
  // For now, navigate to home and scroll to contact
  // This can be updated when contact section is implemented
  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
}

onMounted(() => {
  // Add entrance animations (deferred for performance)
  requestAnimationFrame(() => {
    document.querySelectorAll('.service-card').forEach((card, index) => {
      if (!card.style.animationDelay) {
        card.style.animationDelay = `${index * 0.15}s`
      }
    })
  })
})
</script>

<style scoped>
.services {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6rem 2rem 4rem;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
  color: #00ff88;
  font-family: 'Orbitron', monospace;
  position: relative;
  overflow: hidden;
}

/* Animated grid background */
.grid-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    linear-gradient(rgba(0, 255, 136, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 136, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: gridMove 20s linear infinite;
  pointer-events: none;
}

.grid-bg-2 {
  background-image:
    linear-gradient(rgba(0, 255, 255, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 255, 0.02) 1px, transparent 1px);
  background-size: 100px 100px;
  animation: gridMove 30s linear infinite reverse;
}

@keyframes gridMove {
  0% { transform: perspective(500px) rotateX(60deg) translateY(0); }
  100% { transform: perspective(500px) rotateX(60deg) translateY(50px); }
}

.content {
  position: relative;
  z-index: 1;
  max-width: 1400px;
  width: 100%;
  text-align: center;
}

/* Header styles */
.cyber-header {
  margin-bottom: 4rem;
}

.cyber-header h1 {
  font-size: 4rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.3em;
  margin: 0;
  text-shadow:
    0 0 10px #00ff88,
    0 0 20px #00ff88,
    0 0 30px #00ff88,
    0 0 40px #00ff88;
  animation: neonPulse 2s ease-in-out infinite alternate;
}

.subtitle {
  font-size: 1.5rem;
  color: #00ffff;
  margin-top: 1.5rem;
  font-family: 'Rajdhani', sans-serif;
  text-shadow: 0 0 10px #00ffff;
  letter-spacing: 0.15em;
}

/* Glitch effect */
.glitch-text {
  position: relative;
}

.glitch-text::before,
.glitch-text::after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0.8;
}

.glitch-text::before {
  color: #ff00ff;
  animation: glitch 0.3s infinite;
  clip-path: polygon(0 0, 100% 0, 100% 45%, 0 45%);
}

.glitch-text::after {
  color: #00ffff;
  animation: glitch 0.3s infinite reverse;
  clip-path: polygon(0 55%, 100% 55%, 100% 100%, 0 100%);
}

@keyframes glitch {
  0% { transform: translate(0); }
  20% { transform: translate(-2px, 2px); }
  40% { transform: translate(-2px, -2px); }
  60% { transform: translate(2px, 2px); }
  80% { transform: translate(2px, -2px); }
  100% { transform: translate(0); }
}

/* Neon pulse animation */
@keyframes neonPulse {
  from {
    text-shadow:
      0 0 10px #00ff88,
      0 0 20px #00ff88,
      0 0 30px #00ff88;
  }
  to {
    text-shadow:
      0 0 20px #00ff88,
      0 0 30px #00ff88,
      0 0 40px #00ff88,
      0 0 50px #00ff88,
      0 0 60px #00ff88;
  }
}

/* Services grid */
.services-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2rem;
  margin-bottom: 4rem;
}

/* Service card */
.service-card {
  background: rgba(26, 26, 46, 0.6);
  border: 1px solid rgba(0, 255, 136, 0.3);
  border-radius: 10px;
  padding: 2.5rem 2rem;
  text-align: center;
  transition: all 0.3s ease;
  opacity: 0;
  /* Start with initial state, animation triggers when is-visible */
  transform: translateY(30px);
  cursor: default;
}

.service-card.is-visible {
  animation: fadeInUp 0.6s ease forwards;
}

.service-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 0 40px rgba(0, 255, 136, 0.4);
  border-color: #00ff88;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Service icon */
.service-icon {
  font-size: 3.5rem;
  width: 90px;
  height: 90px;
  line-height: 90px;
  margin: 0 auto 1.5rem;
  border-radius: 50%;
  background: rgba(0, 255, 136, 0.05);
  transition: all 0.3s ease;
}

.service-card:hover .service-icon {
  transform: scale(1.1);
  background: rgba(0, 255, 136, 0.1);
}

/* Service title */
.service-title {
  font-family: 'Orbitron', monospace;
  font-size: 1.3rem;
  font-weight: 700;
  color: #00ff88;
  letter-spacing: 0.15em;
  margin: 0 0 1rem 0;
  text-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
}

/* Service description */
.service-description {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1rem;
  color: #00ffff;
  line-height: 1.6;
  margin-bottom: 1.5rem;
  min-height: 3.2rem;
}

/* Service features list */
.service-features {
  list-style: none;
  padding: 0;
  margin: 0;
  text-align: left;
}

.service-features li {
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.9rem;
  color: #a0a0a0;
  padding: 0.4rem 0;
  display: flex;
  align-items: center;
  transition: color 0.3s ease;
}

.service-card:hover .service-features li {
  color: #c0c0c0;
}

.feature-bullet {
  color: #00ff88;
  font-weight: bold;
  margin-right: 0.5rem;
  font-size: 1.1rem;
}

/* Detail-page link inside a card */
.service-link {
  display: inline-block;
  margin-top: 1rem;
  padding: 0.6rem 1.4rem;
  font-family: 'Orbitron', monospace;
  font-size: 0.8rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  text-decoration: none;
  color: #00ff88;
  border: 1px solid #00ff88;
  border-radius: 5px;
  background: rgba(0, 255, 136, 0.05);
  transition: all 0.3s ease;
}

.service-link:hover,
.service-link:focus {
  background: rgba(0, 255, 136, 0.2);
  box-shadow: 0 0 20px rgba(0, 255, 136, 0.5);
  transform: translateY(-2px);
}

/* CTA Button */
.cyber-button {
  background: rgba(0, 255, 136, 0.1);
  color: #00ff88;
  border: 2px solid #00ff88;
  padding: 1.2rem 3.5rem;
  font-size: 1.2rem;
  font-family: 'Orbitron', monospace;
  letter-spacing: 0.15em;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  border-radius: 5px;
}

.cyber-button:hover {
  background: rgba(0, 255, 136, 0.2);
  box-shadow: 0 0 30px rgba(0, 255, 136, 0.5);
  transform: scale(1.05);
}

.cyber-button:active {
  transform: scale(1.02);
}

/* Neon border effect */
.neon-border {
  box-shadow:
    0 0 5px #00ff88,
    0 0 10px #00ff88,
    inset 0 0 5px rgba(0, 255, 136, 0.2);
}

.neon-text {
  text-shadow:
    0 0 5px currentColor,
    0 0 10px currentColor;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .services-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }
}

@media (max-width: 768px) {
  .services {
    padding: 4rem 1rem 3rem;
  }

  .cyber-header h1 {
    font-size: 2.5rem;
    letter-spacing: 0.2em;
  }

  .subtitle {
    font-size: 1.1rem;
  }

  .services-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .service-card {
    padding: 2rem 1.5rem;
  }

  .service-icon {
    width: 70px;
    height: 70px;
    line-height: 70px;
    font-size: 2.5rem;
  }

  .service-title {
    font-size: 1.1rem;
  }

  .service-description {
    font-size: 0.95rem;
  }

  .cyber-button {
    padding: 1rem 2.5rem;
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .cyber-header h1 {
    font-size: 2rem;
    letter-spacing: 0.15em;
  }

  .service-card {
    padding: 1.5rem 1rem;
  }
}
</style>
