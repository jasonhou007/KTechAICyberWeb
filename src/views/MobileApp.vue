<template>
  <div class="mobile-app-page">
    <!-- Breadcrumb Navigation -->
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <router-link to="/">{{ t('nav.home') }}</router-link>
      <span class="separator">/</span>
      <span>{{ t('mobileApp.title') }}</span>
    </nav>

    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-background">
        <div class="grid-overlay"></div>
      </div>
      <div class="hero-content">
        <h1 class="hero-title">
          {{ t('mobileApp.hero.title') }}
          <span class="accent">{{ t('mobileApp.hero.accent') }}</span>
        </h1>
        <p class="hero-subtitle">{{ t('mobileApp.hero.subtitle') }}</p>
        <div class="hero-tags">
          <span class="tag">{{ t('mobileApp.hero.tag1') }}</span>
          <span class="tag">{{ t('mobileApp.hero.tag2') }}</span>
          <span class="tag">{{ t('mobileApp.hero.tag3') }}</span>
        </div>
      </div>
    </section>

    <!-- Overview Section -->
    <section class="overview">
      <h2 class="section-title">{{ t('mobileApp.overview.title') }}</h2>
      <p class="section-description">{{ t('mobileApp.overview.description') }}</p>
      <div class="overview-grid">
        <div class="overview-card" v-for="(item, index) in overviewCards" :key="index">
          <div class="card-icon" :aria-hidden="true">{{ item.icon }}</div>
          <h3>{{ item.title }}</h3>
          <p>{{ item.description }}</p>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features">
      <h2 class="section-title">{{ t('mobileApp.features.title') }}</h2>
      <div class="features-grid">
        <div class="feature-item" v-for="(feature, index) in features" :key="index">
          <div class="feature-number" :aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</div>
          <div class="feature-content">
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Benefits Section -->
    <section class="benefits">
      <h2 class="section-title">{{ t('mobileApp.benefits.title') }}</h2>
      <p class="section-description">{{ t('mobileApp.benefits.description') }}</p>
      <div class="benefits-list">
        <div class="benefit-item" v-for="(benefit, index) in benefits" :key="index">
          <div class="benefit-check" aria-hidden="true">✓</div>
          <span>{{ benefit }}</span>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta">
      <div class="cta-content">
        <h2>{{ t('mobileApp.cta.title') }}</h2>
        <p>{{ t('mobileApp.cta.description') }}</p>
        <button class="cta-button" @click="handleCTA">
          {{ t('mobileApp.cta.button') }}
        </button>
      </div>
    </section>

    <!-- Related Services -->
    <section class="related-services">
      <h2 class="section-title">{{ t('mobileApp.related.title') }}</h2>
      <div class="related-grid">
        <router-link to="/services/project-management" class="related-card">
          <div class="card-icon">🏗️</div>
          <h3>{{ t('services.projectManagement') }}</h3>
        </router-link>
        <router-link to="/services/blockchain" class="related-card">
          <div class="card-icon">⛓️</div>
          <h3>{{ t('services.blockchain') }}</h3>
        </router-link>
        <router-link to="/services/big-data" class="related-card">
          <div class="card-icon">☁️</div>
          <h3>{{ t('services.bigData') }}</h3>
        </router-link>
      </div>
    </section>
  </div>
</template>

<script setup>
import { useLanguage } from '../composables/useLanguage'

const { t } = useLanguage()

const overviewCards = [
  {
    icon: '📱',
    title: t('mobileApp.overview.card1Title'),
    description: t('mobileApp.overview.card1Desc')
  },
  {
    icon: '🔒',
    title: t('mobileApp.overview.card2Title'),
    description: t('mobileApp.overview.card2Desc')
  },
  {
    icon: '⚡',
    title: t('mobileApp.overview.card3Title'),
    description: t('mobileApp.overview.card3Desc')
  }
]

const features = [
  {
    title: t('mobileApp.features.feature1Title'),
    description: t('mobileApp.features.feature1Desc')
  },
  {
    title: t('mobileApp.features.feature2Title'),
    description: t('mobileApp.features.feature2Desc')
  },
  {
    title: t('mobileApp.features.feature3Title'),
    description: t('mobileApp.features.feature3Desc')
  },
  {
    title: t('mobileApp.features.feature4Title'),
    description: t('mobileApp.features.feature4Desc')
  },
  {
    title: t('mobileApp.features.feature5Title'),
    description: t('mobileApp.features.feature5Desc')
  },
  {
    title: t('mobileApp.features.feature6Title'),
    description: t('mobileApp.features.feature6Desc')
  }
]

const benefits = [
  t('mobileApp.benefits.benefit1'),
  t('mobileApp.benefits.benefit2'),
  t('mobileApp.benefits.benefit3'),
  t('mobileApp.benefits.benefit4'),
  t('mobileApp.benefits.benefit5'),
  t('mobileApp.benefits.benefit6')
]

const handleCTA = () => {
  window.location.href = '/#contact'
}
</script>

<style scoped>
.mobile-app-page {
  min-height: 100vh;
  background: var(--bg-primary);
}

.breadcrumb {
  padding: 1rem 5%;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--text-caption);
  background: rgba(0, 255, 204, 0.03);
}

.breadcrumb a {
  color: var(--cyan);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.breadcrumb a:hover {
  color: var(--magenta);
}

.separator {
  opacity: 0.5;
}

.hero {
  position: relative;
  padding: 6rem 5%;
  overflow: hidden;
}

.hero-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
}

.grid-overlay {
  width: 100%;
  height: 100%;
  background-image:
    linear-gradient(rgba(0, 255, 204, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 204, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: gridMove 20s linear infinite;
}

@keyframes gridMove {
  0% { transform: perspective(500px) rotateX(60deg) translateY(0); }
  100% { transform: perspective(500px) rotateX(60deg) translateY(50px); }
}

.hero-content {
  position: relative;
  z-index: 1;
  max-width: 900px;
  margin: 0 auto;
  text-align: center;
}

.hero-title {
  font-family: var(--font-display);
  font-size: 3.5rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
  margin-bottom: 1.5rem;
  text-shadow: 0 0 60px var(--accent-cyan-alpha-30);
}

.hero-title .accent {
  color: var(--cyan);
  display: block;
  margin-top: 0.5rem;
}

.hero-subtitle {
  font-size: 1.2rem;
  color: var(--text-section-subtitle);
  margin-bottom: 2rem;
  line-height: 1.7;
}

.hero-tags {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.tag {
  padding: 0.5rem 1rem;
  background: var(--accent-cyan-alpha-10);
  border: 1px solid var(--accent-cyan-alpha-30);
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  color: var(--cyan);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

section {
  padding: 4rem 5%;
}

.section-title {
  font-family: var(--font-display);
  font-size: 2.5rem;
  color: var(--cyan);
  text-align: center;
  margin-bottom: 1rem;
  text-shadow: 0 0 30px var(--accent-cyan-alpha-20);
}

.section-description {
  text-align: center;
  color: var(--text-section-subtitle);
  max-width: 700px;
  margin: 0 auto 3rem;
  line-height: 1.7;
}

.overview {
  background: rgba(0, 255, 204, 0.02);
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.overview-card {
  background: rgba(13, 26, 45, 0.6);
  border: 1px solid var(--accent-cyan-alpha-20);
  padding: 2rem;
  border-radius: var(--radius-md);
  transition: all var(--transition-normal);
}

.overview-card:hover {
  border-color: var(--cyan);
  box-shadow: var(--shadow-glow-cyan);
  transform: translateY(-5px);
}

.card-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.overview-card h3 {
  font-family: var(--font-display);
  font-size: 1.2rem;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.overview-card p {
  color: var(--text-card-meta);
  line-height: 1.6;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.feature-item {
  display: flex;
  gap: 1.5rem;
  padding: 1.5rem;
  background: rgba(13, 26, 45, 0.4);
  border-left: 3px solid var(--accent-cyan-alpha-30);
  transition: all var(--transition-normal);
}

.feature-item:hover {
  border-left-color: var(--cyan);
  background: rgba(13, 26, 45, 0.6);
}

.feature-number {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--cyan);
  opacity: 0.5;
  min-width: 50px;
}

.feature-content h3 {
  font-family: var(--font-display);
  font-size: 1.1rem;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.feature-content p {
  color: var(--text-card-meta);
  line-height: 1.6;
  font-size: 0.95rem;
}

.benefits {
  background: rgba(0, 255, 204, 0.02);
}

.benefits-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  max-width: 1000px;
  margin: 0 auto;
}

.benefit-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(13, 26, 45, 0.4);
  border-radius: var(--radius-sm);
}

.benefit-check {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--cyan);
  color: var(--bg-primary);
  border-radius: 50%;
  font-weight: 700;
  flex-shrink: 0;
}

.benefit-item span {
  color: var(--text-caption);
}

.cta {
  background: linear-gradient(135deg, var(--accent-cyan-alpha-10) 0%, rgba(255, 0, 170, 0.05) 100%);
  border-top: 1px solid var(--accent-cyan-alpha-20);
  border-bottom: 1px solid var(--accent-cyan-alpha-20);
}

.cta-content {
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
}

.cta-content h2 {
  font-family: var(--font-display);
  font-size: 2rem;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.cta-content p {
  color: var(--text-caption);
  margin-bottom: 2rem;
  line-height: 1.7;
}

.cta-button {
  padding: 1rem 2.5rem;
  background: transparent;
  border: 2px solid var(--cyan);
  color: var(--cyan);
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: all var(--transition-normal);
  border-radius: var(--radius-sm);
}

.cta-button:hover {
  background: var(--cyan);
  color: var(--bg-primary);
  box-shadow: var(--shadow-glow-cyan);
  transform: translateY(-2px);
}

.cta-button:focus-visible {
  outline: 2px solid var(--cyan);
  outline-offset: 4px;
}

.related-services {
  background: rgba(0, 255, 204, 0.02);
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  max-width: 900px;
  margin: 0 auto;
}

.related-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  background: rgba(13, 26, 45, 0.4);
  border: 1px solid var(--accent-cyan-alpha-20);
  border-radius: var(--radius-md);
  text-decoration: none;
  transition: all var(--transition-normal);
}

.related-card:hover {
  border-color: var(--cyan);
  box-shadow: var(--shadow-glow-cyan);
  transform: translateY(-5px);
}

.related-card .card-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.related-card h3 {
  font-family: var(--font-display);
  font-size: 1rem;
  color: var(--text-primary);
  text-align: center;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2.2rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .section-title {
    font-size: 1.8rem;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .benefits-list {
    grid-template-columns: 1fr;
  }

  .overview-grid {
    grid-template-columns: 1fr;
  }

  .hero-tags {
    flex-direction: column;
    align-items: center;
  }
}

@media (prefers-reduced-motion: reduce) {
  .grid-overlay {
    animation: none;
  }

  .overview-card,
  .feature-item,
  .related-card,
  .cta-button {
    transition: none;
  }
}
</style>
