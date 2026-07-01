<template>
  <main
    id="main-content"
    class="retail-lending"
    :aria-label="t('a11y.mainLabel')"
    role="main"
  >
    <!-- Animated background grid -->
    <div class="grid-bg"></div>
    <div class="grid-bg grid-bg-2"></div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="rl__skeleton" role="status" :aria-label="t('a11y.loadingLabel')">
      <div class="rl__skeleton-block rl__skeleton-block--lg"></div>
      <div class="rl__skeleton-block rl__skeleton-block--md"></div>
      <div class="rl__skeleton-block rl__skeleton-block--sm"></div>
      <div class="rl__skeleton-block rl__skeleton-block--md"></div>
    </div>

    <!-- Real content -->
    <div v-else class="rl__content">
      <!-- Breadcrumb Navigation -->
      <nav class="rl__breadcrumb" aria-label="Breadcrumb">
        <router-link to="/" class="rl__breadcrumb-link">
          {{ t('nav.home') }}
        </router-link>
        <span class="rl__breadcrumb-separator" aria-hidden="true">/</span>
        <span class="rl__breadcrumb-current">
          {{ t('services.retailLending.title') }}
        </span>
      </nav>

      <!-- Hero Section -->
      <section class="rl__hero" aria-labelledby="rl-hero-heading">
        <div class="rl__hero-content">
          <div class="rl__hero-icon-wrapper">
            <div class="rl__hero-icon" aria-hidden="true">💳</div>
          </div>
          <h1 id="rl-hero-heading" class="rl__hero-title neon-text">
            {{ t('services.retailLending.hero.heading') }}
          </h1>
          <p class="rl__hero-subtitle">
            {{ t('services.retailLending.hero.description') }}
          </p>
          <div class="rl__hero-cta">
            <router-link
              to="/contact"
              class="rl__hero-button neon-border"
              :aria-label="t('services.retailLending.cta.ariaLabel')"
            >
              {{ t('services.retailLending.cta.button') }}
            </router-link>
          </div>
        </div>
      </section>

      <!-- Overview Section -->
      <section class="rl__overview" aria-labelledby="rl-overview-heading">
        <h2 id="rl-overview-heading" class="rl__section-title">
          {{ t('services.retailLending.overview.heading') }}
        </h2>
        <p class="rl__overview-text">
          {{ t('services.retailLending.overview.description') }}
        </p>
      </section>

      <!-- Core Features Section -->
      <section
        class="rl__core-features"
        aria-labelledby="rl-core-features-heading"
      >
        <h2 id="rl-core-features-heading" class="rl__section-title">
          {{ t('services.retailLending.coreFeatures.heading') }}
        </h2>
        <div class="rl__cards-grid">
          <article class="rl__card">
            <div class="rl__card-icon neon-border" aria-hidden="true">🛡️</div>
            <h3 class="rl__card-title">
              {{ t('services.retailLending.coreFeatures.riskEngine.title') }}
            </h3>
            <p class="rl__card-description">
              {{ t('services.retailLending.coreFeatures.riskEngine.description') }}
            </p>
          </article>

          <article class="rl__card">
            <div class="rl__card-icon neon-border" aria-hidden="true">⚙️</div>
            <h3 class="rl__card-title">
              {{ t('services.retailLending.coreFeatures.automation.title') }}
            </h3>
            <p class="rl__card-description">
              {{ t('services.retailLending.coreFeatures.automation.description') }}
            </p>
          </article>

          <article class="rl__card">
            <div class="rl__card-icon neon-border" aria-hidden="true">🔍</div>
            <h3 class="rl__card-title">
              {{ t('services.retailLending.coreFeatures.antiFraud.title') }}
            </h3>
            <p class="rl__card-description">
              {{ t('services.retailLending.coreFeatures.antiFraud.description') }}
            </p>
          </article>

          <article class="rl__card">
            <div class="rl__card-icon neon-border" aria-hidden="true">✅</div>
            <h3 class="rl__card-title">
              {{ t('services.retailLending.coreFeatures.creditDecisioning.title') }}
            </h3>
            <p class="rl__card-description">
              {{ t('services.retailLending.coreFeatures.creditDecisioning.description') }}
            </p>
          </article>
        </div>
      </section>

      <!-- Loan Types Section -->
      <section class="rl__loan-types" aria-labelledby="rl-loan-types-heading">
        <h2 id="rl-loan-types-heading" class="rl__section-title">
          {{ t('services.retailLending.loanTypes.heading') }}
        </h2>
        <div class="rl__cards-grid">
          <article class="rl__card">
            <div class="rl__card-icon neon-border" aria-hidden="true">👤</div>
            <h3 class="rl__card-title">
              {{ t('services.retailLending.loanTypes.personal.title') }}
            </h3>
            <p class="rl__card-description">
              {{ t('services.retailLending.loanTypes.personal.description') }}
            </p>
          </article>

          <article class="rl__card">
            <div class="rl__card-icon neon-border" aria-hidden="true">🏢</div>
            <h3 class="rl__card-title">
              {{ t('services.retailLending.loanTypes.sme.title') }}
            </h3>
            <p class="rl__card-description">
              {{ t('services.retailLending.loanTypes.sme.description') }}
            </p>
          </article>

          <article class="rl__card">
            <div class="rl__card-icon neon-border" aria-hidden="true">🤝</div>
            <h3 class="rl__card-title">
              {{ t('services.retailLending.loanTypes.coLending.title') }}
            </h3>
            <p class="rl__card-description">
              {{ t('services.retailLending.loanTypes.coLending.description') }}
            </p>
          </article>
        </div>
      </section>

      <!-- Tech Features Section -->
      <section class="rl__tech-features" aria-labelledby="rl-tech-features-heading">
        <h2 id="rl-tech-features-heading" class="rl__section-title">
          {{ t('services.retailLending.techFeatures.heading') }}
        </h2>
        <div class="rl__cards-grid">
          <article class="rl__card">
            <div class="rl__card-icon neon-border" aria-hidden="true">🏦</div>
            <h3 class="rl__card-title">
              {{ t('services.retailLending.techFeatures.baas.title') }}
            </h3>
            <p class="rl__card-description">
              {{ t('services.retailLending.techFeatures.baas.description') }}
            </p>
          </article>

          <article class="rl__card">
            <div class="rl__card-icon neon-border" aria-hidden="true">📱</div>
            <h3 class="rl__card-title">
              {{ t('services.retailLending.techFeatures.digitalOnboarding.title') }}
            </h3>
            <p class="rl__card-description">
              {{ t('services.retailLending.techFeatures.digitalOnboarding.description') }}
            </p>
          </article>

          <article class="rl__card">
            <div class="rl__card-icon neon-border" aria-hidden="true">🔄</div>
            <h3 class="rl__card-title">
              {{ t('services.retailLending.techFeatures.lifecycle.title') }}
            </h3>
            <p class="rl__card-description">
              {{ t('services.retailLending.techFeatures.lifecycle.description') }}
            </p>
          </article>

          <article class="rl__card">
            <div class="rl__card-icon neon-border" aria-hidden="true">📋</div>
            <h3 class="rl__card-title">
              {{ t('services.retailLending.techFeatures.governance.title') }}
            </h3>
            <p class="rl__card-description">
              {{ t('services.retailLending.techFeatures.governance.description') }}
            </p>
          </article>
        </div>
      </section>

      <!-- Metrics Section -->
      <section class="rl__metrics" aria-labelledby="rl-metrics-heading">
        <h2 id="rl-metrics-heading" class="rl__section-title">
          {{ t('services.retailLending.metrics.heading') }}
        </h2>
        <div class="rl__stats-grid">
          <div class="rl__stat">
            <div class="rl__stat-value neon-text">
              {{ t('services.retailLending.metrics.approvals.value') }}
            </div>
            <div class="rl__stat-label">
              {{ t('services.retailLending.metrics.approvals.label') }}
            </div>
          </div>

          <div class="rl__stat">
            <div class="rl__stat-value neon-text">
              {{ t('services.retailLending.metrics.opsCost.value') }}
            </div>
            <div class="rl__stat-label">
              {{ t('services.retailLending.metrics.opsCost.label') }}
            </div>
          </div>

          <div class="rl__stat">
            <div class="rl__stat-value neon-text">
              {{ t('services.retailLending.metrics.automation.value') }}
            </div>
            <div class="rl__stat-label">
              {{ t('services.retailLending.metrics.automation.label') }}
            </div>
          </div>

          <div class="rl__stat">
            <div class="rl__stat-value neon-text">
              {{ t('services.retailLending.metrics.fraud.value') }}
            </div>
            <div class="rl__stat-label">
              {{ t('services.retailLending.metrics.fraud.label') }}
            </div>
          </div>
        </div>
      </section>

      <!-- Process Section -->
      <section class="rl__process" aria-labelledby="rl-process-heading">
        <h2 id="rl-process-heading" class="rl__section-title">
          {{ t('services.retailLending.process.heading') }}
        </h2>
        <div class="rl__process-steps">
          <div class="rl__process-step">
            <div class="rl__step-number neon-border">
              {{ t('services.retailLending.process.consult.step') }}
            </div>
            <h3 class="rl__step-title">
              {{ t('services.retailLending.process.consult.title') }}
            </h3>
            <p class="rl__step-description">
              {{ t('services.retailLending.process.consult.description') }}
            </p>
          </div>

          <div class="rl__process-step">
            <div class="rl__step-number neon-border">
              {{ t('services.retailLending.process.design.step') }}
            </div>
            <h3 class="rl__step-title">
              {{ t('services.retailLending.process.design.title') }}
            </h3>
            <p class="rl__step-description">
              {{ t('services.retailLending.process.design.description') }}
            </p>
          </div>

          <div class="rl__process-step">
            <div class="rl__step-number neon-border">
              {{ t('services.retailLending.process.deploy.step') }}
            </div>
            <h3 class="rl__step-title">
              {{ t('services.retailLending.process.deploy.title') }}
            </h3>
            <p class="rl__step-description">
              {{ t('services.retailLending.process.deploy.description') }}
            </p>
          </div>

          <div class="rl__process-step">
            <div class="rl__step-number neon-border">
              {{ t('services.retailLending.process.optimize.step') }}
            </div>
            <h3 class="rl__step-title">
              {{ t('services.retailLending.process.optimize.title') }}
            </h3>
            <p class="rl__step-description">
              {{ t('services.retailLending.process.optimize.description') }}
            </p>
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="rl__cta" aria-labelledby="rl-cta-heading">
        <h2 id="rl-cta-heading" class="rl__cta-title neon-text">
          {{ t('services.retailLending.cta.heading') }}
        </h2>
        <p class="rl__cta-description">
          {{ t('services.retailLending.cta.description') }}
        </p>
        <router-link
          to="/contact"
          class="rl__cta-button neon-border"
          :aria-label="t('services.retailLending.cta.ariaLabel')"
        >
          {{ t('services.retailLending.cta.button') }}
        </router-link>
      </section>

      <!-- Back to Services -->
      <div class="rl__back">
        <router-link to="/" class="rl__back-link">
          <span class="rl__back-icon" aria-hidden="true">←</span>
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

  // SEO meta description (the document <title> is owned by App.vue's useHead,
  // driven per-route by getRouteMeta — see #260).
  const metaName = 'description'
  let descriptionMeta = document.querySelector(`meta[name="${metaName}"]`)
  if (!descriptionMeta) {
    descriptionMeta = document.createElement('meta')
    descriptionMeta.setAttribute('name', metaName)
    document.head.appendChild(descriptionMeta)
  }
  descriptionMeta.setAttribute('content', t('services.retailLending.subtitle'))

  // Defer entrance animation timing for the cards.
  const cards = document.querySelectorAll('.rl__card')
  for (let i = 0; i < cards.length; i++) {
    cards[i].style.animationDelay = `${i * 0.1}s`
  }

  const steps = document.querySelectorAll('.rl__process-step')
  for (let j = 0; j < steps.length; j++) {
    steps[j].style.animationDelay = `${j * 0.1}s`
  }

  // Flip the loading skeleton off once the page is ready.
  loading.value = false
})
</script>

<style scoped>
.retail-lending {
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
  animation: rlGridMove 20s linear infinite;
  pointer-events: none;
  z-index: 0;
}

.grid-bg-2 {
  background-image:
    linear-gradient(rgba(0, 255, 204, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 204, 0.02) 1px, transparent 1px);
  background-size: 100px 100px;
  animation: rlGridMove 30s linear infinite reverse;
}

@keyframes rlGridMove {
  0% { transform: perspective(500px) rotateX(60deg) translateY(0); }
  100% { transform: perspective(500px) rotateX(60deg) translateY(50px); }
}

/* Loading skeleton */
.rl__skeleton {
  position: relative;
  z-index: 1;
  max-width: 900px;
  margin: 4rem auto;
  padding: 2rem;
}

.rl__skeleton-block {
  background: var(--surface-elevated);
  border: 1px solid rgba(0, 255, 204, 0.2);
  border-radius: var(--radius-md);
  margin-bottom: 1rem;
  animation: rlShimmer 1.5s ease-in-out infinite;
}

.rl__skeleton-block--lg { height: 60px; }
.rl__skeleton-block--md { height: 40px; width: 80%; }
.rl__skeleton-block--sm { height: 30px; width: 50%; }

@keyframes rlShimmer {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

/* All content above the background */
.rl__content {
  position: relative;
  z-index: 1;
}

/* Breadcrumb */
.rl__breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
  font-family: var(--font-body);
  font-size: 0.9rem;
  flex-wrap: wrap;
}

.rl__breadcrumb-link {
  color: var(--text-caption);
  text-decoration: none;
  transition: color 0.3s ease;
}

.rl__breadcrumb-link:hover,
.rl__breadcrumb-link:focus {
  color: var(--cyan);
}

.rl__breadcrumb-separator {
  color: rgba(0, 255, 204, 0.5);
}

.rl__breadcrumb-current {
  color: var(--cyan);
  font-weight: 500;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Hero Section */
.rl__hero {
  text-align: center;
  padding: 4rem 2rem;
  background: var(--surface-elevated);
  border: 1px solid rgba(0, 255, 204, 0.2);
  border-radius: var(--radius-lg);
  margin-bottom: 3rem;
  backdrop-filter: blur(10px);
}

.rl__hero-icon-wrapper {
  margin-bottom: 1.5rem;
}

.rl__hero-icon {
  font-size: 5rem;
  width: 120px;
  height: 120px;
  line-height: 120px;
  margin: 0 auto;
  border-radius: 50%;
  background: rgba(0, 255, 204, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: rlFloat 3s ease-in-out infinite;
}

@keyframes rlFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.rl__hero-title {
  font-family: var(--font-display);
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  line-height: 1.3;
  letter-spacing: 0.05em;
  color: var(--cyan);
}

.rl__hero-subtitle {
  font-size: 1.2rem;
  color: var(--text-section-subtitle);
  max-width: 800px;
  margin: 0 auto 2rem;
  line-height: 1.6;
}

.rl__hero-cta {
  margin-top: 2rem;
}

.rl__hero-button {
  display: inline-block;
  padding: 1rem 2.5rem;
  background: rgba(0, 255, 204, 0.1);
  border: 2px solid rgba(0, 255, 204, 0.4);
  border-radius: var(--radius-md);
  color: var(--cyan);
  text-decoration: none;
  font-family: var(--font-body);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  transition: all 0.3s ease;
}

.rl__hero-button:hover,
.rl__hero-button:focus {
  background: rgba(0, 255, 204, 0.2);
  border-color: rgba(0, 255, 204, 0.6);
  box-shadow: 0 0 20px rgba(0, 255, 204, 0.3);
  transform: translateY(-2px);
}

/* Section Titles */
.rl__section-title {
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 2rem 0;
  text-align: center;
  letter-spacing: 0.05em;
  position: relative;
}

.rl__section-title::after {
  content: '';
  display: block;
  width: 100px;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--cyan), transparent);
  margin: 1rem auto 0;
}

/* Overview Section */
.rl__overview {
  max-width: 900px;
  margin: 0 auto 4rem;
  padding: 2rem;
  background: var(--surface-elevated);
  border: 1px solid rgba(0, 255, 204, 0.2);
  border-radius: var(--radius-lg);
}

.rl__overview-text {
  font-size: 1.1rem;
  line-height: 1.8;
  color: var(--text-section-subtitle);
  text-align: center;
}

/* Cards grid (shared by core features, loan types, tech features) */
.rl__core-features,
.rl__loan-types,
.rl__tech-features {
  margin-bottom: 4rem;
}

.rl__cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}

.rl__card {
  background: var(--surface-elevated);
  border: 1px solid rgba(0, 255, 204, 0.2);
  border-radius: var(--radius-lg);
  padding: 2rem;
  text-align: center;
  transition: all 0.3s ease;
  animation: rlFadeInUp 0.6s ease forwards;
  opacity: 0;
}

.rl__card:hover {
  border-color: rgba(0, 255, 204, 0.5);
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 255, 204, 0.15);
}

@keyframes rlFadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.rl__card-icon {
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

.rl__card-title {
  font-family: var(--font-display);
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--cyan);
  margin: 0 0 0.75rem 0;
}

.rl__card-description {
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--text-card-meta);
}

/* Metrics Section */
.rl__metrics {
  margin-bottom: 4rem;
  padding: 3rem 2rem;
  background: var(--surface-elevated);
  border: 1px solid rgba(0, 255, 204, 0.2);
  border-radius: var(--radius-lg);
}

.rl__stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
}

.rl__stat-value {
  font-family: var(--font-display);
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--cyan);
  margin-bottom: 0.5rem;
}

.rl__stat-label {
  font-size: 0.95rem;
  color: var(--text-list-label);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

/* Process Section */
.rl__process {
  margin-bottom: 4rem;
}

.rl__process-steps {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.rl__process-step {
  display: flex;
  gap: 2rem;
  background: var(--surface-elevated);
  border: 1px solid rgba(0, 255, 204, 0.2);
  border-radius: var(--radius-lg);
  padding: 2rem;
  transition: all 0.3s ease;
  animation: rlFadeInUp 0.6s ease forwards;
  opacity: 0;
}

.rl__process-step:hover {
  border-color: rgba(0, 255, 204, 0.5);
  box-shadow: 0 8px 20px rgba(0, 255, 204, 0.15);
}

.rl__step-number {
  font-family: var(--font-display);
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--cyan);
  min-width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(0, 255, 204, 0.1);
  flex-shrink: 0;
}

.rl__step-title {
  font-family: var(--font-display);
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.rl__step-description {
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--text-card-meta);
  margin: 0;
}

/* CTA Section */
.rl__cta {
  text-align: center;
  padding: 4rem 2rem;
  background: var(--surface-elevated);
  border: 2px solid rgba(0, 255, 204, 0.3);
  border-radius: var(--radius-lg);
  margin-bottom: 3rem;
}

.rl__cta-title {
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 700;
  color: var(--cyan);
  margin: 0 0 1rem 0;
}

.rl__cta-description {
  font-size: 1.1rem;
  color: var(--text-caption);
  margin-bottom: 2rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.rl__cta-button {
  display: inline-block;
  padding: 1rem 2.5rem;
  background: rgba(0, 255, 204, 0.1);
  border: 2px solid rgba(0, 255, 204, 0.4);
  border-radius: var(--radius-md);
  color: var(--cyan);
  text-decoration: none;
  font-family: var(--font-body);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  transition: all 0.3s ease;
}

.rl__cta-button:hover,
.rl__cta-button:focus {
  background: rgba(0, 255, 204, 0.2);
  border-color: rgba(0, 255, 204, 0.6);
  box-shadow: 0 0 20px rgba(0, 255, 204, 0.3);
  transform: translateY(-2px);
}

/* Back Link */
.rl__back {
  text-align: center;
  margin-bottom: 3rem;
}

.rl__back-link {
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

.rl__back-link:hover,
.rl__back-link:focus {
  color: var(--text-primary);
}

.rl__back-icon {
  font-size: 1.2rem;
  transition: transform 0.3s ease;
}

.rl__back-link:hover .rl__back-icon {
  transform: translateX(-4px);
}

/* Neon border effect */
.neon-border {
  box-shadow:
    0 0 5px rgba(0, 255, 204, 0.5),
    0 0 10px rgba(0, 255, 204, 0.3),
    inset 0 0 5px rgba(0, 255, 204, 0.1);
}

/* Neon text effect */
.neon-text {
  text-shadow:
    0 0 5px rgba(0, 255, 204, 0.5),
    0 0 10px rgba(0, 255, 204, 0.3),
    0 0 15px rgba(0, 255, 204, 0.2);
}

/* Responsive */
@media (max-width: 1024px) {
  .rl__cards-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .retail-lending {
    padding: 1.5rem 1rem;
  }

  .rl__hero {
    padding: 3rem 1.5rem;
  }

  .rl__hero-title {
    font-size: 1.75rem;
  }

  .rl__hero-subtitle {
    font-size: 1rem;
  }

  .rl__hero-icon {
    font-size: 4rem;
    width: 100px;
    height: 100px;
    line-height: 100px;
  }

  .rl__section-title {
    font-size: 1.5rem;
  }

  .rl__cards-grid {
    grid-template-columns: 1fr;
  }

  .rl__stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .rl__process-step {
    flex-direction: column;
    text-align: center;
  }

  .rl__step-number {
    margin: 0 auto;
  }

  .rl__cta {
    padding: 3rem 1.5rem;
  }

  .rl__cta-title {
    font-size: 1.5rem;
  }

  .rl__breadcrumb-current {
    max-width: 150px;
  }
}

@media (max-width: 480px) {
  .rl__hero-title {
    font-size: 1.5rem;
  }

  .rl__hero-icon {
    font-size: 3rem;
    width: 80px;
    height: 80px;
    line-height: 80px;
  }

  .rl__card,
  .rl__process-step {
    padding: 1.5rem;
  }

  .rl__stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
