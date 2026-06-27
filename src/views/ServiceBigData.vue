<template>
  <main
    id="main-content"
    class="big-data"
    :aria-label="t('a11y.mainLabel')"
    role="main"
  >
    <!-- Animated background grid -->
    <div class="grid-bg"></div>
    <div class="grid-bg grid-bg-2"></div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="bd__skeleton" role="status" :aria-label="t('a11y.loadingLabel')">
      <div class="bd__skeleton-block bd__skeleton-block--lg"></div>
      <div class="bd__skeleton-block bd__skeleton-block--md"></div>
      <div class="bd__skeleton-block bd__skeleton-block--sm"></div>
      <div class="bd__skeleton-block bd__skeleton-block--md"></div>
    </div>

    <!-- Real content -->
    <div v-else class="bd__content">
      <!-- Breadcrumb Navigation -->
      <nav class="bd__breadcrumb" aria-label="Breadcrumb">
        <router-link to="/" class="bd__breadcrumb-link">
          {{ t('nav.home') }}
        </router-link>
        <span class="bd__breadcrumb-separator" aria-hidden="true">/</span>
        <span class="bd__breadcrumb-current">
          {{ t('services.bigDataAI.title') }}
        </span>
      </nav>

      <!-- Hero Section -->
      <section class="bd__hero" aria-labelledby="bd-hero-heading">
        <div class="bd__hero-content">
          <div class="bd__hero-icon-wrapper">
            <div class="bd__hero-icon" aria-hidden="true">🧠</div>
          </div>
          <h1 id="bd-hero-heading" class="bd__hero-title neon-text">
            {{ t('services.bigDataAI.hero.heading') }}
          </h1>
          <p class="bd__hero-subtitle">
            {{ t('services.bigDataAI.hero.description') }}
          </p>
          <div class="bd__hero-cta">
            <router-link
              to="/contact"
              class="bd__hero-button neon-border"
              :aria-label="t('services.bigDataAI.cta.ariaLabel')"
            >
              {{ t('services.bigDataAI.cta.button') }}
            </router-link>
          </div>
        </div>
      </section>

      <!-- Overview Section -->
      <section class="bd__overview" aria-labelledby="bd-overview-heading">
        <h2 id="bd-overview-heading" class="bd__section-title">
          {{ t('services.bigDataAI.overview.heading') }}
        </h2>
        <p class="bd__overview-text">
          {{ t('services.bigDataAI.overview.description') }}
        </p>
      </section>

      <!-- AI Capabilities Section -->
      <section
        class="bd__ai-capabilities"
        aria-labelledby="bd-ai-capabilities-heading"
      >
        <h2 id="bd-ai-capabilities-heading" class="bd__section-title">
          {{ t('services.bigDataAI.aiCapabilities.heading') }}
        </h2>
        <div class="bd__cards-grid">
          <article class="bd__card">
            <div class="bd__card-icon neon-border" aria-hidden="true">🤖</div>
            <h3 class="bd__card-title">
              {{ t('services.bigDataAI.aiCapabilities.machineLearning.title') }}
            </h3>
            <p class="bd__card-description">
              {{ t('services.bigDataAI.aiCapabilities.machineLearning.description') }}
            </p>
          </article>

          <article class="bd__card">
            <div class="bd__card-icon neon-border" aria-hidden="true">💬</div>
            <h3 class="bd__card-title">
              {{ t('services.bigDataAI.aiCapabilities.nlp.title') }}
            </h3>
            <p class="bd__card-description">
              {{ t('services.bigDataAI.aiCapabilities.nlp.description') }}
            </p>
          </article>

          <article class="bd__card">
            <div class="bd__card-icon neon-border" aria-hidden="true">👁️</div>
            <h3 class="bd__card-title">
              {{ t('services.bigDataAI.aiCapabilities.computerVision.title') }}
            </h3>
            <p class="bd__card-description">
              {{ t('services.bigDataAI.aiCapabilities.computerVision.description') }}
            </p>
          </article>

          <article class="bd__card">
            <div class="bd__card-icon neon-border" aria-hidden="true">📈</div>
            <h3 class="bd__card-title">
              {{ t('services.bigDataAI.aiCapabilities.predictiveAnalytics.title') }}
            </h3>
            <p class="bd__card-description">
              {{ t('services.bigDataAI.aiCapabilities.predictiveAnalytics.description') }}
            </p>
          </article>
        </div>
      </section>

      <!-- Big Data Capabilities Section -->
      <section class="bd__big-data" aria-labelledby="bd-big-data-heading">
        <h2 id="bd-big-data-heading" class="bd__section-title">
          {{ t('services.bigDataAI.bigData.heading') }}
        </h2>
        <div class="bd__cards-grid">
          <article class="bd__card">
            <div class="bd__card-icon neon-border" aria-hidden="true">🔗</div>
            <h3 class="bd__card-title">
              {{ t('services.bigDataAI.bigData.dataPipeline.title') }}
            </h3>
            <p class="bd__card-description">
              {{ t('services.bigDataAI.bigData.dataPipeline.description') }}
            </p>
          </article>

          <article class="bd__card">
            <div class="bd__card-icon neon-border" aria-hidden="true">🗄️</div>
            <h3 class="bd__card-title">
              {{ t('services.bigDataAI.bigData.dataWarehouse.title') }}
            </h3>
            <p class="bd__card-description">
              {{ t('services.bigDataAI.bigData.dataWarehouse.description') }}
            </p>
          </article>

          <article class="bd__card">
            <div class="bd__card-icon neon-border" aria-hidden="true">⚡</div>
            <h3 class="bd__card-title">
              {{ t('services.bigDataAI.bigData.realTimeAnalytics.title') }}
            </h3>
            <p class="bd__card-description">
              {{ t('services.bigDataAI.bigData.realTimeAnalytics.description') }}
            </p>
          </article>

          <article class="bd__card">
            <div class="bd__card-icon neon-border" aria-hidden="true">🛡️</div>
            <h3 class="bd__card-title">
              {{ t('services.bigDataAI.bigData.dataGovernance.title') }}
            </h3>
            <p class="bd__card-description">
              {{ t('services.bigDataAI.bigData.dataGovernance.description') }}
            </p>
          </article>
        </div>
      </section>

      <!-- Use Cases Section -->
      <section class="bd__use-cases" aria-labelledby="bd-use-cases-heading">
        <h2 id="bd-use-cases-heading" class="bd__section-title">
          {{ t('services.bigDataAI.useCases.heading') }}
        </h2>
        <div class="bd__cards-grid">
          <article class="bd__card">
            <div class="bd__card-icon neon-border" aria-hidden="true">💰</div>
            <h3 class="bd__card-title">
              {{ t('services.bigDataAI.useCases.finance.title') }}
            </h3>
            <p class="bd__card-description">
              {{ t('services.bigDataAI.useCases.finance.description') }}
            </p>
          </article>

          <article class="bd__card">
            <div class="bd__card-icon neon-border" aria-hidden="true">🛒</div>
            <h3 class="bd__card-title">
              {{ t('services.bigDataAI.useCases.retail.title') }}
            </h3>
            <p class="bd__card-description">
              {{ t('services.bigDataAI.useCases.retail.description') }}
            </p>
          </article>

          <article class="bd__card">
            <div class="bd__card-icon neon-border" aria-hidden="true">🏥</div>
            <h3 class="bd__card-title">
              {{ t('services.bigDataAI.useCases.healthcare.title') }}
            </h3>
            <p class="bd__card-description">
              {{ t('services.bigDataAI.useCases.healthcare.description') }}
            </p>
          </article>

          <article class="bd__card">
            <div class="bd__card-icon neon-border" aria-hidden="true">🌆</div>
            <h3 class="bd__card-title">
              {{ t('services.bigDataAI.useCases.smartCity.title') }}
            </h3>
            <p class="bd__card-description">
              {{ t('services.bigDataAI.useCases.smartCity.description') }}
            </p>
          </article>
        </div>
      </section>

      <!-- Stats Section -->
      <section class="bd__stats" aria-labelledby="bd-stats-heading">
        <h2 id="bd-stats-heading" class="bd__section-title">
          {{ t('services.bigDataAI.stats.heading') }}
        </h2>
        <div class="bd__stats-grid">
          <div class="bd__stat">
            <div class="bd__stat-value neon-text">
              {{ t('services.bigDataAI.stats.dataVolume.value') }}
            </div>
            <div class="bd__stat-label">
              {{ t('services.bigDataAI.stats.dataVolume.label') }}
            </div>
          </div>

          <div class="bd__stat">
            <div class="bd__stat-value neon-text">
              {{ t('services.bigDataAI.stats.models.value') }}
            </div>
            <div class="bd__stat-label">
              {{ t('services.bigDataAI.stats.models.label') }}
            </div>
          </div>

          <div class="bd__stat">
            <div class="bd__stat-value neon-text">
              {{ t('services.bigDataAI.stats.accuracy.value') }}
            </div>
            <div class="bd__stat-label">
              {{ t('services.bigDataAI.stats.accuracy.label') }}
            </div>
          </div>

          <div class="bd__stat">
            <div class="bd__stat-value neon-text">
              {{ t('services.bigDataAI.stats.uptime.value') }}
            </div>
            <div class="bd__stat-label">
              {{ t('services.bigDataAI.stats.uptime.label') }}
            </div>
          </div>
        </div>
      </section>

      <!-- Process Section -->
      <section class="bd__process" aria-labelledby="bd-process-heading">
        <h2 id="bd-process-heading" class="bd__section-title">
          {{ t('services.bigDataAI.process.heading') }}
        </h2>
        <div class="bd__process-steps">
          <div class="bd__process-step">
            <div class="bd__step-number neon-border">
              {{ t('services.bigDataAI.process.consult.step') }}
            </div>
            <h3 class="bd__step-title">
              {{ t('services.bigDataAI.process.consult.title') }}
            </h3>
            <p class="bd__step-description">
              {{ t('services.bigDataAI.process.consult.description') }}
            </p>
          </div>

          <div class="bd__process-step">
            <div class="bd__step-number neon-border">
              {{ t('services.bigDataAI.process.design.step') }}
            </div>
            <h3 class="bd__step-title">
              {{ t('services.bigDataAI.process.design.title') }}
            </h3>
            <p class="bd__step-description">
              {{ t('services.bigDataAI.process.design.description') }}
            </p>
          </div>

          <div class="bd__process-step">
            <div class="bd__step-number neon-border">
              {{ t('services.bigDataAI.process.deploy.step') }}
            </div>
            <h3 class="bd__step-title">
              {{ t('services.bigDataAI.process.deploy.title') }}
            </h3>
            <p class="bd__step-description">
              {{ t('services.bigDataAI.process.deploy.description') }}
            </p>
          </div>

          <div class="bd__process-step">
            <div class="bd__step-number neon-border">
              {{ t('services.bigDataAI.process.optimize.step') }}
            </div>
            <h3 class="bd__step-title">
              {{ t('services.bigDataAI.process.optimize.title') }}
            </h3>
            <p class="bd__step-description">
              {{ t('services.bigDataAI.process.optimize.description') }}
            </p>
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="bd__cta" aria-labelledby="bd-cta-heading">
        <h2 id="bd-cta-heading" class="bd__cta-title neon-text">
          {{ t('services.bigDataAI.cta.heading') }}
        </h2>
        <p class="bd__cta-description">
          {{ t('services.bigDataAI.cta.description') }}
        </p>
        <router-link
          to="/contact"
          class="bd__cta-button neon-border"
          :aria-label="t('services.bigDataAI.cta.ariaLabel')"
        >
          {{ t('services.bigDataAI.cta.button') }}
        </router-link>
      </section>

      <!-- Back to Services -->
      <div class="bd__back">
        <router-link to="/" class="bd__back-link">
          <span class="bd__back-icon" aria-hidden="true">←</span>
          {{ t('services.backToServices') }}
        </router-link>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useLanguage } from '../composables/useLanguage'

const { t } = useLanguage()

// Loading skeleton state (AC #3): show a skeleton until first paint settles.
const loading = ref(true)

onMounted(() => {
  // Scroll to top for a clean entry from the services index.
  window.scrollTo({ top: 0, behavior: 'smooth' })

  // SEO: set document title and meta description.
  document.title = t('services.bigDataAI.title')
  const metaName = 'description'
  let descriptionMeta = document.querySelector(`meta[name="${metaName}"]`)
  if (!descriptionMeta) {
    descriptionMeta = document.createElement('meta')
    descriptionMeta.setAttribute('name', metaName)
    document.head.appendChild(descriptionMeta)
  }
  descriptionMeta.setAttribute('content', t('services.bigDataAI.subtitle'))

  // Defer entrance animation timing for the cards.
  const cards = document.querySelectorAll('.bd__card')
  for (let i = 0; i < cards.length; i++) {
    cards[i].style.animationDelay = `${i * 0.1}s`
  }

  const steps = document.querySelectorAll('.bd__process-step')
  for (let j = 0; j < steps.length; j++) {
    steps[j].style.animationDelay = `${j * 0.1}s`
  }

  // Flip the loading skeleton off once the page is ready.
  loading.value = false
})
</script>

<style scoped>
.big-data {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
  color: #e0e0e0;
  font-family: 'Rajdhani', sans-serif;
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
    linear-gradient(rgba(0, 240, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 240, 255, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: bdGridMove 20s linear infinite;
  pointer-events: none;
  z-index: 0;
}

.grid-bg-2 {
  background-image:
    linear-gradient(rgba(0, 255, 136, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 136, 0.02) 1px, transparent 1px);
  background-size: 100px 100px;
  animation: bdGridMove 30s linear infinite reverse;
}

@keyframes bdGridMove {
  0% { transform: perspective(500px) rotateX(60deg) translateY(0); }
  100% { transform: perspective(500px) rotateX(60deg) translateY(50px); }
}

/* Loading skeleton */
.bd__skeleton {
  position: relative;
  z-index: 1;
  max-width: 900px;
  margin: 4rem auto;
  padding: 2rem;
}

.bd__skeleton-block {
  background: rgba(26, 26, 46, 0.6);
  border: 1px solid rgba(0, 240, 255, 0.2);
  border-radius: 8px;
  margin-bottom: 1rem;
  animation: bdShimmer 1.5s ease-in-out infinite;
}

.bd__skeleton-block--lg { height: 60px; }
.bd__skeleton-block--md { height: 40px; width: 80%; }
.bd__skeleton-block--sm { height: 30px; width: 50%; }

@keyframes bdShimmer {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

/* All content above the background */
.bd__content {
  position: relative;
  z-index: 1;
}

/* Breadcrumb */
.bd__breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.9rem;
  flex-wrap: wrap;
}

.bd__breadcrumb-link {
  color: #b0b0b0;
  text-decoration: none;
  transition: color 0.3s ease;
}

.bd__breadcrumb-link:hover,
.bd__breadcrumb-link:focus {
  color: #00f0ff;
}

.bd__breadcrumb-separator {
  color: rgba(0, 240, 255, 0.5);
}

.bd__breadcrumb-current {
  color: #00f0ff;
  font-weight: 500;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Hero Section */
.bd__hero {
  text-align: center;
  padding: 4rem 2rem;
  background: rgba(26, 26, 46, 0.6);
  border: 1px solid rgba(0, 240, 255, 0.2);
  border-radius: 12px;
  margin-bottom: 3rem;
  backdrop-filter: blur(10px);
}

.bd__hero-icon-wrapper {
  margin-bottom: 1.5rem;
}

.bd__hero-icon {
  font-size: 5rem;
  width: 120px;
  height: 120px;
  line-height: 120px;
  margin: 0 auto;
  border-radius: 50%;
  background: rgba(0, 240, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: bdFloat 3s ease-in-out infinite;
}

@keyframes bdFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.bd__hero-title {
  font-family: 'Orbitron', monospace;
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  line-height: 1.3;
  letter-spacing: 0.05em;
  color: #00f0ff;
}

.bd__hero-subtitle {
  font-size: 1.2rem;
  color: #b0b0b0;
  max-width: 800px;
  margin: 0 auto 2rem;
  line-height: 1.6;
}

.bd__hero-cta {
  margin-top: 2rem;
}

.bd__hero-button {
  display: inline-block;
  padding: 1rem 2.5rem;
  background: rgba(0, 240, 255, 0.1);
  border: 2px solid rgba(0, 240, 255, 0.4);
  border-radius: 6px;
  color: #00f0ff;
  text-decoration: none;
  font-family: 'Rajdhani', sans-serif;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  transition: all 0.3s ease;
}

.bd__hero-button:hover,
.bd__hero-button:focus {
  background: rgba(0, 240, 255, 0.2);
  border-color: rgba(0, 240, 255, 0.6);
  box-shadow: 0 0 20px rgba(0, 240, 255, 0.3);
  transform: translateY(-2px);
}

/* Section Titles */
.bd__section-title {
  font-family: 'Orbitron', monospace;
  font-size: 2rem;
  font-weight: 600;
  color: #e0e0e0;
  margin: 0 0 2rem 0;
  text-align: center;
  letter-spacing: 0.05em;
  position: relative;
}

.bd__section-title::after {
  content: '';
  display: block;
  width: 100px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #00f0ff, transparent);
  margin: 1rem auto 0;
}

/* Overview Section */
.bd__overview {
  max-width: 900px;
  margin: 0 auto 4rem;
  padding: 2rem;
  background: rgba(26, 26, 46, 0.4);
  border: 1px solid rgba(0, 240, 255, 0.2);
  border-radius: 10px;
}

.bd__overview-text {
  font-size: 1.1rem;
  line-height: 1.8;
  color: #b0b0b0;
  text-align: center;
}

/* Cards grid (shared by AI capabilities, big data, use cases) */
.bd__ai-capabilities,
.bd__big-data,
.bd__use-cases {
  margin-bottom: 4rem;
}

.bd__cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}

.bd__card {
  background: rgba(26, 26, 46, 0.6);
  border: 1px solid rgba(0, 240, 255, 0.2);
  border-radius: 10px;
  padding: 2rem;
  text-align: center;
  transition: all 0.3s ease;
  animation: bdFadeInUp 0.6s ease forwards;
  opacity: 0;
}

.bd__card:hover {
  border-color: rgba(0, 240, 255, 0.5);
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 240, 255, 0.15);
}

@keyframes bdFadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.bd__card-icon {
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

.bd__card-title {
  font-family: 'Orbitron', monospace;
  font-size: 1.2rem;
  font-weight: 600;
  color: #00f0ff;
  margin: 0 0 0.75rem 0;
}

.bd__card-description {
  font-size: 0.95rem;
  line-height: 1.6;
  color: #b0b0b0;
}

/* Stats Section */
.bd__stats {
  margin-bottom: 4rem;
  padding: 3rem 2rem;
  background: rgba(26, 26, 46, 0.4);
  border: 1px solid rgba(0, 240, 255, 0.2);
  border-radius: 10px;
}

.bd__stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
}

.bd__stat-value {
  font-family: 'Orbitron', monospace;
  font-size: 2.5rem;
  font-weight: 700;
  color: #00f0ff;
  margin-bottom: 0.5rem;
}

.bd__stat-label {
  font-size: 0.95rem;
  color: #b0b0b0;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

/* Process Section */
.bd__process {
  margin-bottom: 4rem;
}

.bd__process-steps {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.bd__process-step {
  display: flex;
  gap: 2rem;
  background: rgba(26, 26, 46, 0.6);
  border: 1px solid rgba(0, 240, 255, 0.2);
  border-radius: 10px;
  padding: 2rem;
  transition: all 0.3s ease;
  animation: bdFadeInUp 0.6s ease forwards;
  opacity: 0;
}

.bd__process-step:hover {
  border-color: rgba(0, 240, 255, 0.5);
  box-shadow: 0 8px 20px rgba(0, 240, 255, 0.15);
}

.bd__step-number {
  font-family: 'Orbitron', monospace;
  font-size: 1.8rem;
  font-weight: 700;
  color: #00f0ff;
  min-width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(0, 240, 255, 0.1);
  flex-shrink: 0;
}

.bd__step-title {
  font-family: 'Orbitron', monospace;
  font-size: 1.2rem;
  font-weight: 600;
  color: #e0e0e0;
  margin: 0 0 0.5rem 0;
}

.bd__step-description {
  font-size: 0.95rem;
  line-height: 1.6;
  color: #b0b0b0;
  margin: 0;
}

/* CTA Section */
.bd__cta {
  text-align: center;
  padding: 4rem 2rem;
  background: rgba(26, 26, 46, 0.6);
  border: 2px solid rgba(0, 240, 255, 0.3);
  border-radius: 12px;
  margin-bottom: 3rem;
}

.bd__cta-title {
  font-family: 'Orbitron', monospace;
  font-size: 2rem;
  font-weight: 700;
  color: #00f0ff;
  margin: 0 0 1rem 0;
}

.bd__cta-description {
  font-size: 1.1rem;
  color: #b0b0b0;
  margin-bottom: 2rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.bd__cta-button {
  display: inline-block;
  padding: 1rem 2.5rem;
  background: rgba(0, 240, 255, 0.1);
  border: 2px solid rgba(0, 240, 255, 0.4);
  border-radius: 6px;
  color: #00f0ff;
  text-decoration: none;
  font-family: 'Rajdhani', sans-serif;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  transition: all 0.3s ease;
}

.bd__cta-button:hover,
.bd__cta-button:focus {
  background: rgba(0, 240, 255, 0.2);
  border-color: rgba(0, 240, 255, 0.6);
  box-shadow: 0 0 20px rgba(0, 240, 255, 0.3);
  transform: translateY(-2px);
}

/* Back Link */
.bd__back {
  text-align: center;
  margin-bottom: 3rem;
}

.bd__back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #00f0ff;
  text-decoration: none;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.95rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  transition: all 0.3s ease;
}

.bd__back-link:hover,
.bd__back-link:focus {
  color: #e0e0e0;
}

.bd__back-icon {
  font-size: 1.2rem;
  transition: transform 0.3s ease;
}

.bd__back-link:hover .bd__back-icon {
  transform: translateX(-4px);
}

/* Neon border effect */
.neon-border {
  box-shadow:
    0 0 5px rgba(0, 240, 255, 0.5),
    0 0 10px rgba(0, 240, 255, 0.3),
    inset 0 0 5px rgba(0, 240, 255, 0.1);
}

/* Neon text effect */
.neon-text {
  text-shadow:
    0 0 5px rgba(0, 240, 255, 0.5),
    0 0 10px rgba(0, 240, 255, 0.3),
    0 0 15px rgba(0, 240, 255, 0.2);
}

/* Responsive */
@media (max-width: 1024px) {
  .bd__cards-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .big-data {
    padding: 1.5rem 1rem;
  }

  .bd__hero {
    padding: 3rem 1.5rem;
  }

  .bd__hero-title {
    font-size: 1.75rem;
  }

  .bd__hero-subtitle {
    font-size: 1rem;
  }

  .bd__hero-icon {
    font-size: 4rem;
    width: 100px;
    height: 100px;
    line-height: 100px;
  }

  .bd__section-title {
    font-size: 1.5rem;
  }

  .bd__cards-grid {
    grid-template-columns: 1fr;
  }

  .bd__stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .bd__process-step {
    flex-direction: column;
    text-align: center;
  }

  .bd__step-number {
    margin: 0 auto;
  }

  .bd__cta {
    padding: 3rem 1.5rem;
  }

  .bd__cta-title {
    font-size: 1.5rem;
  }

  .bd__breadcrumb-current {
    max-width: 150px;
  }
}

@media (max-width: 480px) {
  .bd__hero-title {
    font-size: 1.5rem;
  }

  .bd__hero-icon {
    font-size: 3rem;
    width: 80px;
    height: 80px;
    line-height: 80px;
  }

  .bd__card,
  .bd__process-step {
    padding: 1.5rem;
  }

  .bd__stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
