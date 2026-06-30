<template>
  <main
    id="main-content"
    class="digital-asset-custody"
    :aria-label="t('a11y.mainLabel')"
    role="main"
  >
    <div class="grid-bg"></div>
    <div class="grid-bg grid-bg-2"></div>

    <div v-if="loading" class="dac__skeleton" role="status" :aria-label="t('a11y.loadingLabel')">
      <div class="dac__skeleton-block dac__skeleton-block--lg"></div>
      <div class="dac__skeleton-block dac__skeleton-block--md"></div>
      <div class="dac__skeleton-block dac__skeleton-block--sm"></div>
      <div class="dac__skeleton-block dac__skeleton-block--md"></div>
    </div>

    <div v-else class="dac__content">
      <nav class="dac__breadcrumb" aria-label="Breadcrumb">
        <router-link to="/" class="dac__breadcrumb-link">
          {{ t('nav.home') }}
        </router-link>
        <span class="dac__breadcrumb-separator" aria-hidden="true">/</span>
        <span class="dac__breadcrumb-current">
          {{ t('services.digitalAssetCustody.title') }}
        </span>
      </nav>

      <section class="dac__hero" aria-labelledby="dac-hero-heading">
        <div class="dac__hero-content">
          <div class="dac__hero-icon-wrapper">
            <div class="dac__hero-icon" aria-hidden="true">🔐</div>
          </div>
          <h1 id="dac-hero-heading" class="dac__hero-title neon-text">
            {{ t('services.digitalAssetCustody.hero.heading') }}
          </h1>
          <p class="dac__hero-subtitle">
            {{ t('services.digitalAssetCustody.hero.description') }}
          </p>
          <div class="dac__hero-cta">
            <router-link
              to="/contact"
              class="dac__hero-button neon-border"
              :aria-label="t('services.digitalAssetCustody.cta.ariaLabel')"
            >
              {{ t('services.digitalAssetCustody.cta.button') }}
            </router-link>
          </div>
        </div>
      </section>

      <section class="dac__overview" aria-labelledby="dac-overview-heading">
        <h2 id="dac-overview-heading" class="dac__section-title">
          {{ t('services.digitalAssetCustody.overview.heading') }}
        </h2>
        <p class="dac__overview-text">
          {{ t('services.digitalAssetCustody.overview.description') }}
        </p>
      </section>

      <section class="dac__capabilities" aria-labelledby="dac-capabilities-heading">
        <h2 id="dac-capabilities-heading" class="dac__section-title">
          {{ t('services.digitalAssetCustody.capabilities.heading') }}
        </h2>
        <div class="dac__cards-grid">
          <article class="dac__card">
            <div class="dac__card-icon neon-border" aria-hidden="true">🔑</div>
            <h3 class="dac__card-title">
              {{ t('services.digitalAssetCustody.capabilities.c1.title') }}
            </h3>
            <p class="dac__card-description">
              {{ t('services.digitalAssetCustody.capabilities.c1.description') }}
            </p>
          </article>

          <article class="dac__card">
            <div class="dac__card-icon neon-border" aria-hidden="true">🏛️</div>
            <h3 class="dac__card-title">
              {{ t('services.digitalAssetCustody.capabilities.c2.title') }}
            </h3>
            <p class="dac__card-description">
              {{ t('services.digitalAssetCustody.capabilities.c2.description') }}
            </p>
          </article>

          <article class="dac__card">
            <div class="dac__card-icon neon-border" aria-hidden="true">📡</div>
            <h3 class="dac__card-title">
              {{ t('services.digitalAssetCustody.capabilities.c3.title') }}
            </h3>
            <p class="dac__card-description">
              {{ t('services.digitalAssetCustody.capabilities.c3.description') }}
            </p>
          </article>
        </div>
      </section>

      <!-- Core Features Section -->
      <section class="dac__core-features" aria-labelledby="dac-core-features-heading">
        <h2 id="dac-core-features-heading" class="dac__section-title">
          {{ t('services.digitalAssetCustody.coreFeatures.heading') }}
        </h2>
        <div class="dac__cards-grid">
          <article class="dac__card">
            <div class="dac__card-icon neon-border" aria-hidden="true">📁</div>
            <h3 class="dac__card-title">
              {{ t('services.digitalAssetCustody.coreFeatures.walletArchitecture.title') }}
            </h3>
            <p class="dac__card-description">
              {{ t('services.digitalAssetCustody.coreFeatures.walletArchitecture.description') }}
            </p>
          </article>

          <article class="dac__card">
            <div class="dac__card-icon neon-border" aria-hidden="true">🔐</div>
            <h3 class="dac__card-title">
              {{ t('services.digitalAssetCustody.coreFeatures.keyGovernance.title') }}
            </h3>
            <p class="dac__card-description">
              {{ t('services.digitalAssetCustody.coreFeatures.keyGovernance.description') }}
            </p>
          </article>

          <article class="dac__card">
            <div class="dac__card-icon neon-border" aria-hidden="true">📊</div>
            <h3 class="dac__card-title">
              {{ t('services.digitalAssetCustody.coreFeatures.settlementReporting.title') }}
            </h3>
            <p class="dac__card-description">
              {{ t('services.digitalAssetCustody.coreFeatures.settlementReporting.description') }}
            </p>
          </article>

          <article class="dac__card">
            <div class="dac__card-icon neon-border" aria-hidden="true">🪙</div>
            <h3 class="dac__card-title">
              {{ t('services.digitalAssetCustody.coreFeatures.assetSupport.title') }}
            </h3>
            <p class="dac__card-description">
              {{ t('services.digitalAssetCustody.coreFeatures.assetSupport.description') }}
            </p>
          </article>
        </div>
      </section>

      <!-- Tech Features Section -->
      <section class="dac__tech-features" aria-labelledby="dac-tech-features-heading">
        <h2 id="dac-tech-features-heading" class="dac__section-title">
          {{ t('services.digitalAssetCustody.techFeatures.heading') }}
        </h2>
        <div class="dac__cards-grid">
          <article class="dac__card">
            <div class="dac__card-icon neon-border" aria-hidden="true">🧩</div>
            <h3 class="dac__card-title">
              {{ t('services.digitalAssetCustody.techFeatures.mpcStack.title') }}
            </h3>
            <p class="dac__card-description">
              {{ t('services.digitalAssetCustody.techFeatures.mpcStack.description') }}
            </p>
          </article>

          <article class="dac__card">
            <div class="dac__card-icon neon-border" aria-hidden="true">⚙️</div>
            <h3 class="dac__card-title">
              {{ t('services.digitalAssetCustody.techFeatures.policyEngine.title') }}
            </h3>
            <p class="dac__card-description">
              {{ t('services.digitalAssetCustody.techFeatures.policyEngine.description') }}
            </p>
          </article>

          <article class="dac__card">
            <div class="dac__card-icon neon-border" aria-hidden="true">🔗</div>
            <h3 class="dac__card-title">
              {{ t('services.digitalAssetCustody.techFeatures.integrations.title') }}
            </h3>
            <p class="dac__card-description">
              {{ t('services.digitalAssetCustody.techFeatures.integrations.description') }}
            </p>
          </article>

          <article class="dac__card">
            <div class="dac__card-icon neon-border" aria-hidden="true">📈</div>
            <h3 class="dac__card-title">
              {{ t('services.digitalAssetCustody.techFeatures.observability.title') }}
            </h3>
            <p class="dac__card-description">
              {{ t('services.digitalAssetCustody.techFeatures.observability.description') }}
            </p>
          </article>
        </div>
      </section>

      <section class="dac__cta" aria-labelledby="dac-cta-heading">
        <h2 id="dac-cta-heading" class="dac__cta-title neon-text">
          {{ t('services.digitalAssetCustody.cta.heading') }}
        </h2>
        <p class="dac__cta-description">
          {{ t('services.digitalAssetCustody.cta.description') }}
        </p>
        <router-link
          to="/contact"
          class="dac__cta-button neon-border"
          :aria-label="t('services.digitalAssetCustody.cta.ariaLabel')"
        >
          {{ t('services.digitalAssetCustody.cta.button') }}
        </router-link>
      </section>

      <div class="dac__back">
        <router-link to="/" class="dac__back-link">
          <span class="dac__back-icon" aria-hidden="true">←</span>
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

const loading = ref(true)

onMounted(() => {
  window.scrollTo({ top: 0, behavior: 'smooth' })

  document.title = t('services.digitalAssetCustody.title')
  const metaName = 'description'
  let descriptionMeta = document.querySelector(`meta[name="${metaName}"]`)
  if (!descriptionMeta) {
    descriptionMeta = document.createElement('meta')
    descriptionMeta.setAttribute('name', metaName)
    document.head.appendChild(descriptionMeta)
  }
  descriptionMeta.setAttribute('content', t('services.digitalAssetCustody.subtitle'))

  const cards = document.querySelectorAll('.dac__card')
  for (let i = 0; i < cards.length; i++) {
    cards[i].style.animationDelay = `${i * 0.1}s`
  }

  loading.value = false
})
</script>

<style scoped>
.digital-asset-custody {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, var(--bg-gradient-start) 0%, var(--bg-gradient-mid) 50%, var(--bg-gradient-end) 100%);
  color: var(--text-primary);
  font-family: var(--font-body);
  padding: 2rem;
}

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
  animation: dacGridMove 20s linear infinite;
  pointer-events: none;
  z-index: 0;
}

.grid-bg-2 {
  background-image:
    linear-gradient(rgba(0, 255, 204, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 204, 0.02) 1px, transparent 1px);
  background-size: 100px 100px;
  animation: dacGridMove 30s linear infinite reverse;
}

@keyframes dacGridMove {
  0% { transform: perspective(500px) rotateX(60deg) translateY(0); }
  100% { transform: perspective(500px) rotateX(60deg) translateY(50px); }
}

.dac__skeleton {
  position: relative;
  z-index: 1;
  max-width: 900px;
  margin: 4rem auto;
  padding: 2rem;
}

.dac__skeleton-block {
  background: var(--surface-elevated);
  border: 1px solid rgba(0, 255, 204, 0.2);
  border-radius: var(--radius-md);
  margin-bottom: 1rem;
  animation: dacShimmer 1.5s ease-in-out infinite;
}

.dac__skeleton-block--lg { height: 60px; }
.dac__skeleton-block--md { height: 40px; width: 80%; }
.dac__skeleton-block--sm { height: 30px; width: 50%; }

@keyframes dacShimmer {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.dac__content {
  position: relative;
  z-index: 1;
}

.dac__breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
  font-family: var(--font-body);
  font-size: 0.9rem;
  flex-wrap: wrap;
}

.dac__breadcrumb-link {
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.3s ease;
}

.dac__breadcrumb-link:hover,
.dac__breadcrumb-link:focus {
  color: var(--cyan);
}

.dac__breadcrumb-separator {
  color: rgba(0, 255, 204, 0.5);
}

.dac__breadcrumb-current {
  color: var(--cyan);
  font-weight: 500;
}

.dac__hero {
  text-align: center;
  padding: 4rem 2rem;
  background: var(--surface-elevated);
  border: 1px solid rgba(0, 255, 204, 0.2);
  border-radius: var(--radius-lg);
  margin-bottom: 3rem;
  backdrop-filter: blur(10px);
}

.dac__hero-icon-wrapper {
  margin-bottom: 1.5rem;
}

.dac__hero-icon {
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
  animation: dacFloat 3s ease-in-out infinite;
}

@keyframes dacFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.dac__hero-title {
  font-family: var(--font-display);
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  line-height: 1.3;
  letter-spacing: 0.05em;
  color: var(--cyan);
}

.dac__hero-subtitle {
  font-size: 1.2rem;
  color: var(--text-secondary);
  max-width: 800px;
  margin: 0 auto 2rem;
  line-height: 1.6;
}

.dac__hero-cta {
  margin-top: 2rem;
}

.dac__hero-button {
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

.dac__hero-button:hover,
.dac__hero-button:focus {
  background: rgba(0, 255, 204, 0.2);
  border-color: rgba(0, 255, 204, 0.6);
  box-shadow: 0 0 20px rgba(0, 255, 204, 0.3);
  transform: translateY(-2px);
}

.dac__section-title {
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 2rem 0;
  text-align: center;
  letter-spacing: 0.05em;
  position: relative;
}

.dac__section-title::after {
  content: '';
  display: block;
  width: 100px;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--cyan), transparent);
  margin: 1rem auto 0;
}

.dac__overview {
  max-width: 900px;
  margin: 0 auto 4rem;
  padding: 2rem;
  background: var(--surface-elevated);
  border: 1px solid rgba(0, 255, 204, 0.2);
  border-radius: var(--radius-lg);
}

.dac__overview-text {
  font-size: 1.1rem;
  line-height: 1.8;
  color: var(--text-secondary);
  text-align: center;
}

.dac__capabilities,
.dac__core-features,
.dac__tech-features {
  margin-bottom: 4rem;
}

.dac__cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}

.dac__card {
  background: var(--surface-elevated);
  border: 1px solid rgba(0, 255, 204, 0.2);
  border-radius: var(--radius-lg);
  padding: 2rem;
  text-align: center;
  transition: all 0.3s ease;
  animation: dacFadeInUp 0.6s ease forwards;
  opacity: 0;
}

.dac__card:hover {
  border-color: rgba(0, 255, 204, 0.5);
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 255, 204, 0.15);
}

@keyframes dacFadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.dac__card-icon {
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

.dac__card-title {
  font-family: var(--font-display);
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--cyan);
  margin: 0 0 0.75rem 0;
}

.dac__card-description {
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--text-secondary);
}

.dac__cta {
  text-align: center;
  padding: 4rem 2rem;
  background: var(--surface-elevated);
  border: 2px solid rgba(0, 255, 204, 0.3);
  border-radius: var(--radius-lg);
  margin-bottom: 3rem;
}

.dac__cta-title {
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 700;
  color: var(--cyan);
  margin: 0 0 1rem 0;
}

.dac__cta-description {
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin-bottom: 2rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.dac__cta-button {
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

.dac__cta-button:hover,
.dac__cta-button:focus {
  background: rgba(0, 255, 204, 0.2);
  border-color: rgba(0, 255, 204, 0.6);
  box-shadow: 0 0 20px rgba(0, 255, 204, 0.3);
  transform: translateY(-2px);
}

.dac__back {
  text-align: center;
  margin-bottom: 3rem;
}

.dac__back-link {
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

.dac__back-link:hover,
.dac__back-link:focus {
  color: var(--text-primary);
}

.dac__back-icon {
  font-size: 1.2rem;
  transition: transform 0.3s ease;
}

.dac__back-link:hover .dac__back-icon {
  transform: translateX(-4px);
}

.neon-border {
  box-shadow:
    0 0 5px rgba(0, 255, 204, 0.5),
    0 0 10px rgba(0, 255, 204, 0.3),
    inset 0 0 5px rgba(0, 255, 204, 0.1);
}

.neon-text {
  text-shadow:
    0 0 5px rgba(0, 255, 204, 0.5),
    0 0 10px rgba(0, 255, 204, 0.3),
    0 0 15px rgba(0, 255, 204, 0.2);
}

@media (max-width: 768px) {
  .digital-asset-custody {
    padding: 1.5rem 1rem;
  }

  .dac__hero {
    padding: 3rem 1.5rem;
  }

  .dac__hero-title {
    font-size: 1.75rem;
  }

  .dac__cards-grid {
    grid-template-columns: 1fr;
  }

  .dac__cta {
    padding: 3rem 1.5rem;
  }

  .dac__cta-title {
    font-size: 1.5rem;
  }
}
</style>
