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

      <!-- Self-driving AI pipeline demo (#475). Auto-playing service pipeline
           visualization with 6 phases from data ingestion to delivery. -->
      <ServicesSelfDriving />

      <!-- Service flow ambient animation (#361). Cycles through 5 KTech services
           with data particle effects. Self-driving demo synchronized with
           intersection observer and reduced-motion preferences. -->
      <section class="ambient-section">
        <ServicesAmbient />
      </section>

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
import { onMounted, defineAsyncComponent } from 'vue'
import { useLanguage } from '../composables/useLanguage'
import { useIntersectionObserverList } from '../composables/useIntersectionObserver'
// #475: ServicesSelfDriving ambient animation - AI pipeline visualization
import ServicesSelfDriving from '../components/ServicesSelfDriving.vue'
// #361: ServicesAmbient ambient animation - service flow cycling through 5 services
const ServicesAmbient = defineAsyncComponent(() => import('../components/ServicesAmbient.vue'))

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
  background: linear-gradient(135deg, var(--bg-gradient-start) 0%, var(--bg-gradient-mid) 50%, var(--bg-gradient-end) 100%);
  color: var(--cyan);
  font-family: var(--font-display);
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
    linear-gradient(rgba(0, 255, 204, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 204, 0.03) 1px, transparent 1px);
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
    0 0 10px var(--cyan),
    0 0 20px var(--cyan),
    0 0 30px var(--cyan),
    0 0 40px var(--cyan);
  animation: neonPulse 2s ease-in-out infinite alternate;
}

.subtitle {
  font-size: 1.5rem;
  color: var(--cyan);
  margin-top: 1.5rem;
  font-family: var(--font-body);
  text-shadow: 0 0 10px var(--cyan);
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
  color: var(--accent-magenta);
  /* #271: one-shot reveal glitch (forwards), NOT infinite. The previous
     `glitch 0.3s infinite` strobed at 3.33Hz — OVER the <3Hz WCAG 2.3.1
     photosensitivity ceiling — on the page H1, which auto-mounts on every
     Services page load. `forwards` fires the chromatic tear once on render
     and holds the final frame: the cyber aesthetic lands without a continuous
     strobe. (Mirrors the SolutionForge forge-glitch one-shot pattern; the
     repo-wide strobe-audit.test.ts gate now prevents any regression.) */
  animation: glitch 0.45s steps(2) forwards;
  clip-path: polygon(0 0, 100% 0, 100% 45%, 0 45%);
}

.glitch-text::after {
  color: var(--cyan);
  animation: glitch 0.45s steps(2) forwards reverse;
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
      0 0 10px var(--cyan),
      0 0 20px var(--cyan),
      0 0 30px var(--cyan);
  }
  to {
    text-shadow:
      0 0 20px var(--cyan),
      0 0 30px var(--cyan),
      0 0 40px var(--cyan),
      0 0 50px var(--cyan),
      0 0 60px var(--cyan);
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
  background: var(--surface-elevated);
  border: 1px solid var(--accent-cyan-alpha-30);
  border-radius: var(--radius-lg);
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
  box-shadow: 0 0 40px var(--accent-cyan-alpha-40);
  border-color: var(--cyan);
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
  background: var(--accent-cyan-alpha-05);
  transition: all 0.3s ease;
}

.service-card:hover .service-icon {
  transform: scale(1.1);
  background: var(--accent-cyan-alpha-10);
}

/* Service title */
.service-title {
  font-family: var(--font-display);
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--cyan);
  letter-spacing: 0.15em;
  margin: 0 0 1rem 0;
  text-shadow: 0 0 10px var(--accent-cyan-alpha-50);
}

/* Service description */
.service-description {
  font-family: var(--font-body);
  font-size: 1rem;
  color: var(--cyan);
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
  font-family: var(--font-body);
  font-size: 0.9rem;
  color: var(--text-card-meta);
  padding: 0.4rem 0;
  display: flex;
  align-items: center;
  transition: color 0.3s ease;
}

.service-card:hover .service-features li {
  color: var(--text-card-meta);
}

.feature-bullet {
  color: var(--cyan);
  font-weight: bold;
  margin-right: 0.5rem;
  font-size: 1.1rem;
}

/* Detail-page link inside a card */
.service-link {
  display: inline-block;
  margin-top: 1rem;
  padding: 0.6rem 1.4rem;
  font-family: var(--font-display);
  font-size: 0.8rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  text-decoration: none;
  color: var(--cyan);
  border: 1px solid var(--cyan);
  border-radius: var(--radius-sm);
  background: var(--accent-cyan-alpha-05);
  transition: all 0.3s ease;
}

.service-link:hover,
.service-link:focus {
  background: var(--accent-cyan-alpha-20);
  box-shadow: 0 0 20px var(--accent-cyan-alpha-50);
  transform: translateY(-2px);
}

/* CTA Button */
.cyber-button {
  background: var(--accent-cyan-alpha-10);
  color: var(--cyan);
  border: 2px solid var(--cyan);
  padding: 1.2rem 3.5rem;
  font-size: 1.2rem;
  font-family: var(--font-display);
  letter-spacing: 0.15em;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  border-radius: var(--radius-sm);
}

.cyber-button:hover {
  background: var(--accent-cyan-alpha-20);
  box-shadow: 0 0 30px var(--accent-cyan-alpha-50);
  transform: scale(1.05);
}

.cyber-button:active {
  transform: scale(1.02);
}

/* Neon border effect */
.neon-border {
  box-shadow:
    0 0 5px var(--cyan),
    0 0 10px var(--cyan),
    inset 0 0 5px var(--accent-cyan-alpha-20);
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

/* ---- REDUCED MOTION GUARD (#271) -----------------------------------------
 * Belt-and-suspenders photosafety: kill the glitch-text tear under
 * prefers-reduced-motion so even the one-shot reveal cannot run for users who
 * opt out of motion. The base rule is already seizure-safe (one-shot), but
 * this guard ensures no animation reaches a reduced-motion user. */
@media (prefers-reduced-motion: reduce) {
  .glitch-text::before,
  .glitch-text::after {
    animation: none;
  }
}
</style>
