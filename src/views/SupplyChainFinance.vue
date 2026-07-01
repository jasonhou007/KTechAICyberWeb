<template>
  <main id="main-content" class="supply-chain-finance" :aria-label="t('a11y.mainLabel')" role="main">
    <!-- Animated background grid -->
    <div class="grid-bg"></div>
    <div class="grid-bg grid-bg-2"></div>

    <!-- Breadcrumb Navigation -->
    <nav class="scf__breadcrumb" aria-label="Breadcrumb">
      <router-link to="/" class="scf__breadcrumb-link">{{ t('nav.home') }}</router-link>
      <span class="scf__breadcrumb-separator" aria-hidden="true">/</span>
      <span class="scf__breadcrumb-current">{{ t('services.supplyChainFinance.title') }}</span>
    </nav>

    <!-- Hero Section -->
    <section class="scf__hero" aria-labelledby="hero-heading">
      <div class="scf__hero-content">
        <div class="scf__hero-icon-wrapper">
          <div class="scf__hero-icon" aria-hidden="true">🔗</div>
        </div>
        <h1 id="hero-heading" class="scf__hero-title neon-text">
          {{ t('services.supplyChainFinance.hero.heading') }}
        </h1>
        <p class="scf__hero-subtitle">
          {{ t('services.supplyChainFinance.hero.description') }}
        </p>
        <div class="scf__hero-cta">
          <router-link to="/contact" class="scf__hero-button neon-border">
            {{ t('services.supplyChainFinance.cta.button') }}
          </router-link>
        </div>
      </div>
    </section>

    <!-- Overview Section -->
    <section class="scf__overview" aria-labelledby="overview-heading">
      <h2 id="overview-heading" class="scf__section-title">
        {{ t('services.supplyChainFinance.overview.heading') }}
      </h2>
      <p class="scf__overview-text">
        {{ t('services.supplyChainFinance.overview.description') }}
      </p>
    </section>

    <!-- Features Section -->
    <section class="scf__features" aria-labelledby="features-heading">
      <h2 id="features-heading" class="scf__section-title">
        {{ t('services.supplyChainFinance.features.heading') }}
      </h2>
      <div class="scf__features-grid">
        <article class="scf__feature-card">
          <div class="scf__feature-icon neon-border">💰</div>
          <h3 class="scf__feature-title">
            {{ t('services.supplyChainFinance.features.workingCapital.title') }}
          </h3>
          <p class="scf__feature-description">
            {{ t('services.supplyChainFinance.features.workingCapital.description') }}
          </p>
        </article>

        <article class="scf__feature-card">
          <div class="scf__feature-icon neon-border">🛡️</div>
          <h3 class="scf__feature-title">
            {{ t('services.supplyChainFinance.features.riskManagement.title') }}
          </h3>
          <p class="scf__feature-description">
            {{ t('services.supplyChainFinance.features.riskManagement.description') }}
          </p>
        </article>

        <article class="scf__feature-card">
          <div class="scf__feature-icon neon-border">💻</div>
          <h3 class="scf__feature-title">
            {{ t('services.supplyChainFinance.features.digitalPlatform.title') }}
          </h3>
          <p class="scf__feature-description">
            {{ t('services.supplyChainFinance.features.digitalPlatform.description') }}
          </p>
        </article>

        <article class="scf__feature-card">
          <div class="scf__feature-icon neon-border">📊</div>
          <h3 class="scf__feature-title">
            {{ t('services.supplyChainFinance.features.flexibleFinancing.title') }}
          </h3>
          <p class="scf__feature-description">
            {{ t('services.supplyChainFinance.features.flexibleFinancing.description') }}
          </p>
        </article>

        <article class="scf__feature-card">
          <div class="scf__feature-icon neon-border">🤝</div>
          <h3 class="scf__feature-title">
            {{ t('services.supplyChainFinance.features.supplierNetwork.title') }}
          </h3>
          <p class="scf__feature-description">
            {{ t('services.supplyChainFinance.features.supplierNetwork.description') }}
          </p>
        </article>

        <article class="scf__feature-card">
          <div class="scf__feature-icon neon-border">📈</div>
          <h3 class="scf__feature-title">
            {{ t('services.supplyChainFinance.features.analytics.title') }}
          </h3>
          <p class="scf__feature-description">
            {{ t('services.supplyChainFinance.features.analytics.description') }}
          </p>
        </article>
      </div>
    </section>

    <!-- Benefits Section -->
    <section class="scf__benefits" aria-labelledby="benefits-heading">
      <h2 id="benefits-heading" class="scf__section-title">
        {{ t('services.supplyChainFinance.benefits.heading') }}
      </h2>
      <div class="scf__benefits-list">
        <div class="scf__benefit-item">
          <div class="scf__benefit-number neon-text">01</div>
          <h3 class="scf__benefit-title">
            {{ t('services.supplyChainFinance.benefits.cashFlow.title') }}
          </h3>
          <p class="scf__benefit-description">
            {{ t('services.supplyChainFinance.benefits.cashFlow.description') }}
          </p>
        </div>

        <div class="scf__benefit-item">
          <div class="scf__benefit-number neon-text">02</div>
          <h3 class="scf__benefit-title">
            {{ t('services.supplyChainFinance.benefits.riskReduction.title') }}
          </h3>
          <p class="scf__benefit-description">
            {{ t('services.supplyChainFinance.benefits.riskReduction.description') }}
          </p>
        </div>

        <div class="scf__benefit-item">
          <div class="scf__benefit-number neon-text">03</div>
          <h3 class="scf__benefit-title">
            {{ t('services.supplyChainFinance.benefits.efficiency.title') }}
          </h3>
          <p class="scf__benefit-description">
            {{ t('services.supplyChainFinance.benefits.efficiency.description') }}
          </p>
        </div>

        <div class="scf__benefit-item">
          <div class="scf__benefit-number neon-text">04</div>
          <h3 class="scf__benefit-title">
            {{ t('services.supplyChainFinance.benefits.costSavings.title') }}
          </h3>
          <p class="scf__benefit-description">
            {{ t('services.supplyChainFinance.benefits.costSavings.description') }}
          </p>
        </div>
      </div>
    </section>

    <!-- Process Section -->
    <section class="scf__process" aria-labelledby="process-heading">
      <h2 id="process-heading" class="scf__section-title">
        {{ t('services.supplyChainFinance.process.heading') }}
      </h2>
      <div class="scf__process-steps">
        <div class="scf__process-step">
          <div class="scf__step-number neon-border">{{ t('services.supplyChainFinance.process.assessment.step') }}</div>
          <h3 class="scf__step-title">{{ t('services.supplyChainFinance.process.assessment.title') }}</h3>
          <p class="scf__step-description">{{ t('services.supplyChainFinance.process.assessment.description') }}</p>
        </div>

        <div class="scf__process-step">
          <div class="scf__step-number neon-border">{{ t('services.supplyChainFinance.process.solution.step') }}</div>
          <h3 class="scf__step-title">{{ t('services.supplyChainFinance.process.solution.title') }}</h3>
          <p class="scf__step-description">{{ t('services.supplyChainFinance.process.solution.description') }}</p>
        </div>

        <div class="scf__process-step">
          <div class="scf__step-number neon-border">{{ t('services.supplyChainFinance.process.integration.step') }}</div>
          <h3 class="scf__step-title">{{ t('services.supplyChainFinance.process.integration.title') }}</h3>
          <p class="scf__step-description">{{ t('services.supplyChainFinance.process.integration.description') }}</p>
        </div>

        <div class="scf__process-step">
          <div class="scf__step-number neon-border">{{ t('services.supplyChainFinance.process.deployment.step') }}</div>
          <h3 class="scf__step-title">{{ t('services.supplyChainFinance.process.deployment.title') }}</h3>
          <p class="scf__step-description">{{ t('services.supplyChainFinance.process.deployment.description') }}</p>
        </div>

        <div class="scf__process-step">
          <div class="scf__step-number neon-border">{{ t('services.supplyChainFinance.process.optimization.step') }}</div>
          <h3 class="scf__step-title">{{ t('services.supplyChainFinance.process.optimization.title') }}</h3>
          <p class="scf__step-description">{{ t('services.supplyChainFinance.process.optimization.description') }}</p>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="scf__cta" aria-labelledby="cta-heading">
      <h2 id="cta-heading" class="scf__cta-title">
        {{ t('services.supplyChainFinance.cta.heading') }}
      </h2>
      <p class="scf__cta-description">
        {{ t('services.supplyChainFinance.cta.description') }}
      </p>
      <router-link to="/contact" class="scf__cta-button neon-border" :aria-label="t('services.supplyChainFinance.cta.ariaLabel')">
        {{ t('services.supplyChainFinance.cta.button') }}
      </router-link>
    </section>

    <!-- Back to Services -->
    <div class="scf__back">
      <router-link to="/" class="scf__back-link">
        <span class="scf__back-icon" aria-hidden="true">←</span>
        {{ t('services.backToServices') }}
      </router-link>
    </div>
  </main>
</template>

<script setup>
import { onMounted } from 'vue'
import { useLanguage } from '../composables/useLanguage'

const { t } = useLanguage()

onMounted(() => {
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' })

  // Add entrance animations
  document.querySelectorAll('.scf__feature-card').forEach((card, index) => {
    card.style.animationDelay = `${index * 0.1}s`
  })

  document.querySelectorAll('.scf__benefit-item').forEach((item, index) => {
    item.style.animationDelay = `${index * 0.15}s`
  })

  document.querySelectorAll('.scf__process-step').forEach((step, index) => {
    step.style.animationDelay = `${index * 0.1}s`
  })
})
</script>

<style scoped>
.supply-chain-finance {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, var(--bg-gradient-start) 0%, var(--bg-gradient-mid) 50%, var(--bg-gradient-end) 100%);
  color: var(--text-primary);
  font-family: var(--font-body);
  padding: 2rem;
}

/* Animated grid background */
.grid-bg {
  position: fixed;
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
  z-index: 0;
}

.grid-bg-2 {
  background-image:
    linear-gradient(rgba(0, 255, 204, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 204, 0.02) 1px, transparent 1px);
  background-size: 100px 100px;
  animation: gridMove 30s linear infinite reverse;
}

@keyframes gridMove {
  0% { transform: perspective(500px) rotateX(60deg) translateY(0); }
  100% { transform: perspective(500px) rotateX(60deg) translateY(50px); }
}

/* All content should be above the background */
.supply-chain-finance > * {
  position: relative;
  z-index: 1;
}

/* Breadcrumb */
.scf__breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
  font-family: var(--font-body);
  font-size: 0.9rem;
  flex-wrap: wrap;
}

.scf__breadcrumb-link {
  color: var(--text-caption);
  text-decoration: none;
  transition: color 0.3s ease;
}

.scf__breadcrumb-link:hover,
.scf__breadcrumb-link:focus {
  color: var(--cyan);
}

.scf__breadcrumb-separator {
  color: var(--accent-cyan-alpha-50);
}

.scf__breadcrumb-current {
  color: var(--cyan);
  font-weight: 500;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Hero Section */
.scf__hero {
  text-align: center;
  padding: 4rem 2rem;
  background: var(--surface-elevated);
  border: 1px solid var(--accent-cyan-alpha-20);
  border-radius: var(--radius-lg);
  margin-bottom: 3rem;
  backdrop-filter: blur(10px);
}

.scf__hero-icon-wrapper {
  margin-bottom: 1.5rem;
}

.scf__hero-icon {
  font-size: 5rem;
  width: 120px;
  height: 120px;
  line-height: 120px;
  margin: 0 auto;
  border-radius: 50%;
  background: var(--accent-cyan-alpha-10);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.scf__hero-title {
  font-family: var(--font-display);
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  line-height: 1.3;
  letter-spacing: 0.05em;
  color: var(--cyan);
}

.scf__hero-subtitle {
  font-size: 1.2rem;
  color: var(--text-section-subtitle);
  max-width: 800px;
  margin: 0 auto 2rem;
  line-height: 1.6;
}

.scf__hero-cta {
  margin-top: 2rem;
}

.scf__hero-button {
  display: inline-block;
  padding: 1rem 2.5rem;
  background: var(--accent-cyan-alpha-10);
  border: 2px solid var(--accent-cyan-alpha-40);
  border-radius: var(--radius-md);
  color: var(--cyan);
  text-decoration: none;
  font-family: var(--font-body);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  transition: all 0.3s ease;
}

.scf__hero-button:hover,
.scf__hero-button:focus {
  background: var(--accent-cyan-alpha-20);
  border-color: var(--accent-cyan-alpha-60);
  box-shadow: var(--shadow-glow-cyan);
  transform: translateY(-2px);
}

/* Section Titles */
.scf__section-title {
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 2rem 0;
  text-align: center;
  letter-spacing: 0.05em;
  position: relative;
}

.scf__section-title::after {
  content: '';
  display: block;
  width: 100px;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--cyan), transparent);
  margin: 1rem auto 0;
}

/* Overview Section */
.scf__overview {
  max-width: 900px;
  margin: 0 auto 4rem;
  padding: 2rem;
  background: var(--surface-elevated);
  border: 1px solid var(--accent-cyan-alpha-20);
  border-radius: var(--radius-lg);
}

.scf__overview-text {
  font-size: 1.1rem;
  line-height: 1.8;
  color: var(--text-section-subtitle);
  text-align: center;
}

/* Features Section */
.scf__features {
  margin-bottom: 4rem;
}

.scf__features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.scf__feature-card {
  background: var(--surface-elevated);
  border: 1px solid var(--accent-cyan-alpha-20);
  border-radius: var(--radius-lg);
  padding: 2rem;
  transition: all 0.3s ease;
  animation: fadeInUp 0.6s ease forwards;
  opacity: 0;
}

.scf__feature-card:hover {
  border-color: var(--accent-cyan-alpha-50);
  transform: translateY(-5px);
  box-shadow: 0 8px 20px var(--accent-cyan-alpha-15);
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

.scf__feature-icon {
  font-size: 3rem;
  width: 80px;
  height: 80px;
  line-height: 80px;
  margin: 0 auto 1rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.scf__feature-title {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--cyan);
  margin: 0 0 0.75rem 0;
  text-align: center;
}

.scf__feature-description {
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--text-card-meta);
  text-align: center;
}

/* Benefits Section */
.scf__benefits {
  margin-bottom: 4rem;
  padding: 3rem 2rem;
  background: var(--surface-elevated);
  border: 1px solid var(--accent-cyan-alpha-20);
  border-radius: var(--radius-lg);
}

.scf__benefits-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.scf__benefit-item {
  text-align: center;
  animation: fadeInUp 0.6s ease forwards;
  opacity: 0;
}

.scf__benefit-number {
  font-family: var(--font-display);
  font-size: 3rem;
  font-weight: 700;
  color: var(--cyan);
  margin-bottom: 0.5rem;
}

.scf__benefit-title {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.75rem 0;
}

.scf__benefit-description {
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--text-card-meta);
}

/* Process Section */
.scf__process {
  margin-bottom: 4rem;
}

.scf__process-steps {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.scf__process-step {
  display: flex;
  gap: 2rem;
  background: var(--surface-elevated);
  border: 1px solid var(--accent-cyan-alpha-20);
  border-radius: var(--radius-lg);
  padding: 2rem;
  transition: all 0.3s ease;
  animation: fadeInUp 0.6s ease forwards;
  opacity: 0;
}

.scf__process-step:hover {
  border-color: var(--accent-cyan-alpha-50);
  box-shadow: 0 8px 20px var(--accent-cyan-alpha-15);
}

.scf__step-number {
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 700;
  color: var(--cyan);
  min-width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--accent-cyan-alpha-10);
  flex-shrink: 0;
}

.scf__step-title {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.scf__step-description {
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--text-card-meta);
  margin: 0;
}

/* CTA Section */
.scf__cta {
  text-align: center;
  padding: 4rem 2rem;
  background: var(--surface-elevated);
  border: 2px solid var(--accent-cyan-alpha-30);
  border-radius: var(--radius-lg);
  margin-bottom: 3rem;
}

.scf__cta-title {
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 700;
  color: var(--cyan);
  margin: 0 0 1rem 0;
}

.scf__cta-description {
  font-size: 1.1rem;
  color: var(--text-caption);
  margin-bottom: 2rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.scf__cta-button {
  display: inline-block;
  padding: 1rem 2.5rem;
  background: var(--accent-cyan-alpha-10);
  border: 2px solid var(--accent-cyan-alpha-40);
  border-radius: var(--radius-md);
  color: var(--cyan);
  text-decoration: none;
  font-family: var(--font-body);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  transition: all 0.3s ease;
}

.scf__cta-button:hover,
.scf__cta-button:focus {
  background: var(--accent-cyan-alpha-20);
  border-color: var(--accent-cyan-alpha-60);
  box-shadow: var(--shadow-glow-cyan);
  transform: translateY(-2px);
}

/* Back Link */
.scf__back {
  text-align: center;
  margin-bottom: 3rem;
}

.scf__back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--cyan);
  text-decoration: none;
  font-family: var(--font-body);
  font-size: 0.95rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  transition: all 0.3s ease;
}

.scf__back-link:hover,
.scf__back-link:focus {
  color: var(--text-primary);
}

.scf__back-icon {
  font-size: 1.2rem;
  transition: transform 0.3s ease;
}

.scf__back-link:hover .scf__back-icon {
  transform: translateX(-4px);
}

/* Neon border effect */
.neon-border {
  box-shadow:
    0 0 5px var(--accent-cyan-alpha-50),
    0 0 10px var(--accent-cyan-alpha-30),
    inset 0 0 5px var(--accent-cyan-alpha-10);
}

/* Neon text effect */
.neon-text {
  text-shadow:
    0 0 5px var(--accent-cyan-alpha-50),
    0 0 10px var(--accent-cyan-alpha-30),
    0 0 15px var(--accent-cyan-alpha-20);
}

/* Responsive */
@media (max-width: 768px) {
  .supply-chain-finance {
    padding: 1.5rem 1rem;
  }

  .scf__hero {
    padding: 3rem 1.5rem;
  }

  .scf__hero-title {
    font-size: 1.75rem;
  }

  .scf__hero-subtitle {
    font-size: 1rem;
  }

  .scf__hero-icon {
    font-size: 4rem;
    width: 100px;
    height: 100px;
    line-height: 100px;
  }

  .scf__section-title {
    font-size: 1.5rem;
  }

  .scf__features-grid {
    grid-template-columns: 1fr;
  }

  .scf__benefits-list {
    grid-template-columns: 1fr;
  }

  .scf__process-step {
    flex-direction: column;
    text-align: center;
  }

  .scf__step-number {
    margin: 0 auto;
  }

  .scf__cta {
    padding: 3rem 1.5rem;
  }

  .scf__cta-title {
    font-size: 1.5rem;
  }

  .scf__breadcrumb-current {
    max-width: 150px;
  }
}

@media (max-width: 480px) {
  .scf__hero-title {
    font-size: 1.5rem;
  }

  .scf__hero-icon {
    font-size: 3rem;
    width: 80px;
    height: 80px;
    line-height: 80px;
  }

  .scf__feature-card,
  .scf__benefit-item,
  .scf__process-step {
    padding: 1.5rem;
  }
}
</style>
