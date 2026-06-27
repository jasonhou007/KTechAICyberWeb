<template>
  <div class="blockchain">
    <!-- Animated background grid -->
    <div class="grid-bg"></div>
    <div class="grid-bg grid-bg-2"></div>

    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-content">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <router-link to="/">{{ t('nav.home') }}</router-link>
          <span class="separator">></span>
          <span>{{ t('blockchain.breadcrumb') }}</span>
        </nav>
        <h1 class="page-title">
          {{ t('blockchain.hero.title') }}
          <span class="accent">{{ t('blockchain.hero.accent') }}</span>
        </h1>
        <p class="page-subtitle">{{ t('blockchain.hero.subtitle') }}</p>
      </div>
    </section>

    <!-- Overview Section -->
    <section class="overview">
      <div class="content-wrapper">
        <h2 class="section-title">{{ t('blockchain.overview.title') }}</h2>
        <p class="overview-text">{{ t('blockchain.overview.description') }}</p>
        <div class="overview-card">
          <div class="card-icon neon-border">⟡</div>
          <p>{{ t('blockchain.overview.detail') }}</p>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features">
      <h2 class="section-title">{{ t('blockchain.features.title') }}</h2>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon neon-border">⛓</div>
          <h3>{{ t('blockchain.features.distributed.title') }}</h3>
          <p>{{ t('blockchain.features.distributed.description') }}</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon neon-border">🔐</div>
          <h3>{{ t('blockchain.features.security.title') }}</h3>
          <p>{{ t('blockchain.features.security.description') }}</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon neon-border">⚡</div>
          <h3>{{ t('blockchain.features.efficiency.title') }}</h3>
          <p>{{ t('blockchain.features.efficiency.description') }}</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon neon-border">📊</div>
          <h3>{{ t('blockchain.features.traceability.title') }}</h3>
          <p>{{ t('blockchain.features.traceability.description') }}</p>
        </div>
      </div>
    </section>

    <!-- Benefits Section -->
    <section class="benefits">
      <h2 class="section-title">{{ t('blockchain.benefits.title') }}</h2>
      <div class="benefits-grid">
        <div class="benefit-item">
          <div class="benefit-number neon-text">01</div>
          <h3>{{ t('blockchain.benefits.trust.title') }}</h3>
          <p>{{ t('blockchain.benefits.trust.description') }}</p>
        </div>
        <div class="benefit-item">
          <div class="benefit-number neon-text">02</div>
          <h3>{{ t('blockchain.benefits.cost.title') }}</h3>
          <p>{{ t('blockchain.benefits.cost.description') }}</p>
        </div>
        <div class="benefit-item">
          <div class="benefit-number neon-text">03</div>
          <h3>{{ t('blockchain.benefits.speed.title') }}</h3>
          <p>{{ t('blockchain.benefits.speed.description') }}</p>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta">
      <div class="cta-content">
        <h2>{{ t('blockchain.cta.title') }}</h2>
        <p>{{ t('blockchain.cta.description') }}</p>
        <button class="cyber-button neon-border" :aria-label="t('blockchain.cta.ariaLabel')">
          {{ t('blockchain.cta.button') }}
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useLanguage } from '../composables/useLanguage'

const { t } = useLanguage()

onMounted(() => {
  // Add entrance animations for feature cards
  document.querySelectorAll('.feature-card').forEach((card, index) => {
    card.style.animationDelay = `${index * 0.1}s`
  })

  // Add entrance animations for benefit items
  document.querySelectorAll('.benefit-item').forEach((item, index) => {
    item.style.animationDelay = `${index * 0.15}s`
  })
})
</script>

<style scoped>
.blockchain {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
}

/* Animated grid background */
.grid-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    linear-gradient(rgba(0, 240, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 240, 255, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: gridMove 20s linear infinite;
  pointer-events: none;
  z-index: 0;
}

.grid-bg-2 {
  background-image:
    linear-gradient(rgba(0, 255, 136, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 136, 0.02) 1px, transparent 1px);
  background-size: 100px 100px;
  animation: gridMove 30s linear infinite reverse;
}

@keyframes gridMove {
  0% { transform: perspective(500px) rotateX(60deg) translateY(0); }
  100% { transform: perspective(500px) rotateX(60deg) translateY(50px); }
}

/* Hero Section */
.hero {
  position: relative;
  padding: 6rem 5% 4rem;
  background: rgba(0, 240, 255, 0.03);
  border-bottom: 1px solid rgba(0, 240, 255, 0.2);
  z-index: 1;
}

.hero-content {
  max-width: 1200px;
  margin: 0 auto;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.9rem;
  color: #888;
}

.breadcrumb a {
  color: #00f0ff;
  text-decoration: none;
  transition: color 0.3s ease;
}

.breadcrumb a:hover {
  color: #00ff88;
}

.breadcrumb .separator {
  color: #666;
}

.page-title {
  font-family: 'Orbitron', monospace;
  font-size: 3.5rem;
  font-weight: 700;
  color: #e0e0e0;
  letter-spacing: 0.2em;
  margin-bottom: 1rem;
  text-shadow: 0 0 20px rgba(0, 240, 255, 0.3);
}

.page-title .accent {
  color: #00f0ff;
  text-shadow:
    0 0 10px #00f0ff,
    0 0 20px #00f0ff,
    0 0 30px #00f0ff;
}

.page-subtitle {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1.5rem;
  color: #888;
  max-width: 800px;
  line-height: 1.6;
}

/* Overview Section */
.overview {
  position: relative;
  padding: 5rem 5%;
  z-index: 1;
}

.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
}

.section-title {
  font-family: 'Orbitron', monospace;
  font-size: 2.2rem;
  font-weight: 600;
  color: #00f0ff;
  letter-spacing: 0.15em;
  text-align: center;
  margin-bottom: 3rem;
  text-shadow: 0 0 15px rgba(0, 240, 255, 0.4);
}

.overview-text {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1.2rem;
  color: #aaa;
  text-align: center;
  max-width: 800px;
  margin: 0 auto 3rem;
  line-height: 1.8;
}

.overview-card {
  display: flex;
  align-items: center;
  gap: 2rem;
  background: rgba(26, 26, 46, 0.6);
  border: 1px solid rgba(0, 240, 255, 0.3);
  border-radius: 10px;
  padding: 2rem;
  max-width: 900px;
  margin: 0 auto;
}

.card-icon {
  font-size: 3rem;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(0, 240, 255, 0.1);
  flex-shrink: 0;
}

.overview-card p {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1.1rem;
  color: #ccc;
  line-height: 1.6;
}

/* Features Section */
.features {
  position: relative;
  padding: 5rem 5%;
  background: rgba(0, 255, 136, 0.02);
  z-index: 1;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.feature-card {
  background: rgba(26, 26, 46, 0.6);
  border: 1px solid rgba(0, 240, 255, 0.2);
  border-radius: 10px;
  padding: 2rem;
  text-align: center;
  transition: all 0.3s ease;
  animation: fadeInUp 0.6s ease forwards;
  opacity: 0;
}

.feature-card:hover {
  transform: translateY(-5px);
  border-color: rgba(0, 240, 255, 0.5);
  box-shadow: 0 0 30px rgba(0, 240, 255, 0.3);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.feature-icon {
  font-size: 2.5rem;
  width: 70px;
  height: 70px;
  line-height: 70px;
  margin: 0 auto 1.5rem;
  border-radius: 50%;
  background: rgba(0, 240, 255, 0.1);
}

.feature-card h3 {
  font-family: 'Orbitron', monospace;
  font-size: 1.3rem;
  color: #00f0ff;
  margin-bottom: 1rem;
  letter-spacing: 0.1em;
}

.feature-card p {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1rem;
  color: #999;
  line-height: 1.6;
}

/* Benefits Section */
.benefits {
  position: relative;
  padding: 5rem 5%;
  z-index: 1;
}

.benefits-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.benefit-item {
  background: linear-gradient(135deg, rgba(26, 26, 46, 0.8) 0%, rgba(22, 33, 62, 0.6) 100%);
  border-left: 3px solid #00f0ff;
  border-radius: 8px;
  padding: 2rem;
  position: relative;
  animation: fadeInUp 0.6s ease forwards;
  opacity: 0;
}

.benefit-item:hover {
  border-left-color: #00ff88;
  box-shadow: 0 0 20px rgba(0, 240, 255, 0.2);
}

.benefit-number {
  font-family: 'Orbitron', monospace;
  font-size: 2.5rem;
  font-weight: 700;
  color: #00f0ff;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.benefit-item h3 {
  font-family: 'Orbitron', monospace;
  font-size: 1.2rem;
  color: #e0e0e0;
  margin-bottom: 0.8rem;
  letter-spacing: 0.1em;
}

.benefit-item p {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1rem;
  color: #999;
  line-height: 1.6;
}

/* CTA Section */
.cta {
  position: relative;
  padding: 5rem 5%;
  background: linear-gradient(135deg, rgba(0, 240, 255, 0.05) 0%, rgba(0, 255, 136, 0.03) 100%);
  border-top: 1px solid rgba(0, 240, 255, 0.2);
  border-bottom: 1px solid rgba(0, 240, 255, 0.2);
  z-index: 1;
}

.cta-content {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
}

.cta h2 {
  font-family: 'Orbitron', monospace;
  font-size: 2rem;
  color: #00f0ff;
  margin-bottom: 1.5rem;
  letter-spacing: 0.15em;
  text-shadow: 0 0 15px rgba(0, 240, 255, 0.4);
}

.cta p {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1.1rem;
  color: #aaa;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.cyber-button {
  background: rgba(0, 240, 255, 0.1);
  color: #00f0ff;
  border: 2px solid #00f0ff;
  padding: 1rem 3rem;
  font-size: 1.1rem;
  font-family: 'Rajdhani', sans-serif;
  font-weight: 600;
  letter-spacing: 0.1em;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  text-transform: uppercase;
}

.cyber-button:hover {
  background: rgba(0, 240, 255, 0.2);
  box-shadow: 0 0 30px rgba(0, 240, 255, 0.5);
  transform: scale(1.05);
}

/* Neon effects */
.neon-border {
  box-shadow:
    0 0 5px #00f0ff,
    0 0 10px rgba(0, 240, 255, 0.5),
    inset 0 0 5px rgba(0, 240, 255, 0.2);
}

.neon-text {
  text-shadow:
    0 0 5px currentColor,
    0 0 10px currentColor,
    0 0 15px currentColor;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .page-title {
    font-size: 2.8rem;
  }

  .features-grid,
  .benefits-grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }
}

@media (max-width: 768px) {
  .hero {
    padding: 4rem 5% 3rem;
  }

  .page-title {
    font-size: 2rem;
    letter-spacing: 0.1em;
  }

  .page-subtitle {
    font-size: 1.1rem;
  }

  .section-title {
    font-size: 1.5rem;
  }

  .overview-card {
    flex-direction: column;
    text-align: center;
  }

  .features-grid,
  .benefits-grid {
    grid-template-columns: 1fr;
  }

  .cta {
    padding: 3rem 5%;
  }

  .cyber-button {
    padding: 0.8rem 2rem;
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 1.5rem;
  }

  .feature-icon,
  .card-icon {
    width: 60px;
    height: 60px;
    font-size: 2rem;
  }

  .feature-icon {
    line-height: 60px;
  }
}
</style>
