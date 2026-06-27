<template>
  <div class="service-page">
    <!-- Animated background -->
    <div class="grid-bg"></div>
    <div class="grid-bg grid-bg-2"></div>

    <!-- Hero Section -->
    <section class="service-hero">
      <div class="hero-content">
        <div class="service-icon neon-glow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        <h1 class="hero-title neon-text">{{ t('services.pm.title') }}</h1>
        <p class="hero-subtitle">{{ t('services.pm.subtitle') }}</p>
      </div>
    </section>

    <!-- Overview Section -->
    <section class="section overview">
      <div class="container">
        <h2 class="section-title neon-text">{{ t('services.pm.overview.title') }}</h2>
        <p class="overview-text">{{ t('services.pm.overview.content') }}</p>
      </div>
    </section>

    <!-- Capabilities Section -->
    <section class="section capabilities">
      <div class="container">
        <h2 class="section-title neon-text">{{ t('services.pm.capabilities.title') }}</h2>
        <div class="capabilities-grid">
          <div
            v-for="(capability, index) in capabilities"
            :key="index"
            class="capability-card cyber-card hover-lift"
          >
            <div class="capability-icon neon-border">{{ capability.icon }}</div>
            <h3>{{ t(capability.titleKey) }}</h3>
            <p>{{ t(capability.descKey) }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Process Section -->
    <section class="section process">
      <div class="container">
        <h2 class="section-title neon-text">{{ t('services.pm.process.title') }}</h2>
        <div class="process-timeline">
          <div
            v-for="(step, index) in processSteps"
            :key="index"
            class="process-step"
          >
            <div class="step-number neon-glow">{{ index + 1 }}</div>
            <div class="step-content">
              <h3>{{ t(step.titleKey) }}</h3>
              <p>{{ t(step.descKey) }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="section features">
      <div class="container">
        <h2 class="section-title neon-text">{{ t('services.pm.features.title') }}</h2>
        <div class="features-grid">
          <div
            v-for="(feature, index) in features"
            :key="index"
            class="feature-item neon-border"
          >
            <span class="feature-check">✓</span>
            <span>{{ t(feature) }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="section cta">
      <div class="container">
        <div class="cta-card cyber-card neon-glow">
          <h2>{{ t('services.pm.cta.title') }}</h2>
          <p>{{ t('services.pm.cta.subtitle') }}</p>
          <router-link to="/contact" class="cta-button">
            <span>{{ t('services.pm.cta.button') }}</span>
            <span class="cta-arrow">→</span>
          </router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { useLanguage } from '../composables/useLanguage'

const { t } = useLanguage()

const capabilities = [
  {
    icon: '🔄',
    titleKey: 'services.pm.capabilities.agile.title',
    descKey: 'services.pm.capabilities.agile.description'
  },
  {
    icon: '📊',
    titleKey: 'services.pm.capabilities.waterfall.title',
    descKey: 'services.pm.capabilities.waterfall.description'
  },
  {
    icon: '🔀',
    titleKey: 'services.pm.capabilities.hybrid.title',
    descKey: 'services.pm.capabilities.hybrid.description'
  },
  {
    icon: '⚠️',
    titleKey: 'services.pm.capabilities.risk.title',
    descKey: 'services.pm.capabilities.risk.description'
  }
]

const processSteps = [
  { titleKey: 'services.pm.process.discovery.title', descKey: 'services.pm.process.discovery.description' },
  { titleKey: 'services.pm.process.planning.title', descKey: 'services.pm.process.planning.description' },
  { titleKey: 'services.pm.process.execution.title', descKey: 'services.pm.process.execution.description' },
  { titleKey: 'services.pm.process.delivery.title', descKey: 'services.pm.process.delivery.description' },
  { titleKey: 'services.pm.process.support.title', descKey: 'services.pm.process.support.description' }
]

const features = [
  'services.pm.features.sprint',
  'services.pm.features.velocity',
  'services.pm.features.reporting',
  'services.pm.features.collaboration',
  'services.pm.features.tracking',
  'services.pm.features.compliance'
]
</script>

<style scoped>
.service-page {
  position: relative;
  min-height: 100vh;
  overflow-x: hidden;
}

.grid-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image:
    linear-gradient(rgba(0, 255, 204, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 204, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  pointer-events: none;
  z-index: 0;
}

.grid-bg-2 {
  background-image:
    linear-gradient(rgba(0, 255, 204, 0.01) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 204, 0.01) 1px, transparent 1px);
  background-size: 100px 100px;
  animation: gridMove 20s linear infinite;
}

@keyframes gridMove {
  0% { transform: translate(0, 0); }
  100% { transform: translate(50px, 50px); }
}

.section {
  position: relative;
  padding: 5rem 5%;
  z-index: 1;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

/* Hero Section */
.service-hero {
  min-height: 50vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: rgba(10, 15, 28, 0.95);
  border-bottom: 1px solid rgba(0, 255, 204, 0.2);
}

.hero-content {
  position: relative;
  z-index: 2;
}

.service-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(0, 255, 204, 0.3);
  border-radius: 50%;
}

.service-icon svg {
  width: 40px;
  height: 40px;
  color: #00ffcc;
}

.hero-title {
  font-family: 'Orbitron', monospace;
  font-size: 2.5rem;
  font-weight: 700;
  color: #00ffcc;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  margin-bottom: 1rem;
}

.hero-subtitle {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1.3rem;
  color: #a0a0a0;
}

/* Section Titles */
.section-title {
  font-family: 'Orbitron', monospace;
  font-size: 2rem;
  font-weight: 700;
  color: #00ffcc;
  letter-spacing: 0.15em;
  text-align: center;
  margin-bottom: 3rem;
  text-transform: uppercase;
}

.neon-text {
  text-shadow: 0 0 10px rgba(0, 255, 204, 0.8), 0 0 20px rgba(0, 255, 204, 0.5);
}

.neon-glow {
  filter: drop-shadow(0 0 10px rgba(0, 255, 204, 0.5));
}

/* Overview Section */
.overview {
  background: rgba(10, 15, 28, 0.9);
}

.overview-text {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1.2rem;
  line-height: 1.8;
  color: #a0a0a0;
  text-align: center;
  max-width: 800px;
  margin: 0 auto;
}

/* Capabilities Section */
.capabilities {
  background: rgba(0, 255, 204, 0.02);
}

.capabilities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.capability-card {
  padding: 2rem;
  text-align: center;
}

.capability-icon {
  font-size: 2.5rem;
  width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  border-radius: 50%;
  border: 1px solid rgba(0, 255, 204, 0.3);
}

.capability-card h3 {
  font-family: 'Orbitron', monospace;
  font-size: 1.1rem;
  color: #00ffcc;
  margin-bottom: 0.5rem;
}

.capability-card p {
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.95rem;
  color: #a0a0a0;
  line-height: 1.6;
}

/* Process Section */
.process {
  background: rgba(10, 15, 28, 0.9);
}

.process-timeline {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.process-step {
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
}

.step-number {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 255, 204, 0.1);
  border: 2px solid rgba(0, 255, 204, 0.3);
  border-radius: 50%;
  font-family: 'Orbitron', monospace;
  font-size: 1.2rem;
  font-weight: 700;
  color: #00ffcc;
  flex-shrink: 0;
}

.step-content h3 {
  font-family: 'Orbitron', monospace;
  font-size: 1.1rem;
  color: #00ffcc;
  margin-bottom: 0.5rem;
}

.step-content p {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1rem;
  color: #a0a0a0;
  line-height: 1.6;
}

/* Features Section */
.features {
  background: rgba(0, 255, 204, 0.02);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: rgba(10, 15, 28, 0.8);
  border: 1px solid rgba(0, 255, 204, 0.2);
  border-radius: 5px;
  font-family: 'Rajdhani', sans-serif;
  color: #e0e0e0;
}

.feature-check {
  color: #00ffcc;
  font-weight: bold;
  font-size: 1.2rem;
}

/* CTA Section */
.cta {
  background: rgba(10, 15, 28, 0.95);
}

.cta-card {
  max-width: 600px;
  margin: 0 auto;
  padding: 3rem;
  text-align: center;
  border: 1px solid rgba(0, 255, 204, 0.3);
}

.cta-card h2 {
  font-family: 'Orbitron', monospace;
  font-size: 1.8rem;
  color: #00ffcc;
  margin-bottom: 1rem;
}

.cta-card p {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1.1rem;
  color: #a0a0a0;
  margin-bottom: 2rem;
}

.cta-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  background: rgba(0, 255, 204, 0.1);
  border: 1px solid rgba(0, 255, 204, 0.3);
  border-radius: 5px;
  text-decoration: none;
  transition: all 0.3s ease;
}

.cta-button:hover {
  background: rgba(255, 0, 255, 0.2);
  border-color: rgba(255, 0, 255, 0.5);
  box-shadow: 0 0 15px rgba(255, 0, 255, 0.3);
}

.cta-button span:first-child {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: #00ffcc;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.cta-button:hover span:first-child {
  color: #ff00ff;
}

.cta-arrow {
  font-size: 1.2rem;
  color: #00ffcc;
  transition: transform 0.3s ease;
}

.cta-button:hover .cta-arrow {
  transform: translateX(5px);
  color: #ff00ff;
}

/* Utility Classes */
.cyber-card {
  background: rgba(20, 25, 40, 0.8);
  border: 1px solid rgba(0, 255, 204, 0.2);
  border-radius: 10px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.hover-lift:hover {
  transform: translateY(-5px);
  border-color: rgba(0, 255, 204, 0.5);
  box-shadow: 0 0 30px rgba(0, 255, 204, 0.2);
}

.neon-border {
  transition: all 0.3s ease;
}

.neon-border:hover {
  box-shadow: 0 0 20px rgba(0, 255, 204, 0.5), inset 0 0 20px rgba(0, 255, 204, 0.2);
}

/* Responsive */
@media (max-width: 768px) {
  .hero-title {
    font-size: 1.8rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .capabilities-grid {
    grid-template-columns: 1fr;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .cta-card {
    padding: 2rem 1.5rem;
  }
}
</style>
