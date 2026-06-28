<template>
  <main
    id="main-content"
    class="stablecoin"
    :aria-label="t('a11y.mainLabel')"
    role="main"
  >
    <div class="grid-bg"></div>
    <div class="grid-bg grid-bg-2"></div>

    <div v-if="loading" class="sc__skeleton" role="status" :aria-label="t('a11y.loadingLabel')">
      <div class="sc__skeleton-block sc__skeleton-block--lg"></div>
      <div class="sc__skeleton-block sc__skeleton-block--md"></div>
      <div class="sc__skeleton-block sc__skeleton-block--sm"></div>
      <div class="sc__skeleton-block sc__skeleton-block--md"></div>
    </div>

    <div v-else class="sc__content">
      <nav class="sc__breadcrumb" aria-label="Breadcrumb">
        <router-link to="/" class="sc__breadcrumb-link">
          {{ t('nav.home') }}
        </router-link>
        <span class="sc__breadcrumb-separator" aria-hidden="true">/</span>
        <span class="sc__breadcrumb-current">
          {{ t('services.stablecoin.title') }}
        </span>
      </nav>

      <section class="sc__hero" aria-labelledby="sc-hero-heading">
        <div class="sc__hero-content">
          <div class="sc__hero-icon-wrapper">
            <div class="sc__hero-icon" aria-hidden="true">🪙</div>
          </div>
          <h1 id="sc-hero-heading" class="sc__hero-title neon-text">
            {{ t('services.stablecoin.hero.heading') }}
          </h1>
          <p class="sc__hero-subtitle">
            {{ t('services.stablecoin.hero.description') }}
          </p>
          <div class="sc__hero-cta">
            <router-link
              to="/contact"
              class="sc__hero-button neon-border"
              :aria-label="t('services.stablecoin.cta.ariaLabel')"
            >
              {{ t('services.stablecoin.cta.button') }}
            </router-link>
          </div>
        </div>
      </section>

      <section class="sc__overview" aria-labelledby="sc-overview-heading">
        <h2 id="sc-overview-heading" class="sc__section-title">
          {{ t('services.stablecoin.overview.heading') }}
        </h2>
        <p class="sc__overview-text">
          {{ t('services.stablecoin.overview.description') }}
        </p>
      </section>

      <section class="sc__capabilities" aria-labelledby="sc-capabilities-heading">
        <h2 id="sc-capabilities-heading" class="sc__section-title">
          {{ t('services.stablecoin.capabilities.heading') }}
        </h2>
        <div class="sc__cards-grid">
          <article class="sc__card">
            <div class="sc__card-icon neon-border" aria-hidden="true">⚖️</div>
            <h3 class="sc__card-title">
              {{ t('services.stablecoin.capabilities.c1.title') }}
            </h3>
            <p class="sc__card-description">
              {{ t('services.stablecoin.capabilities.c1.description') }}
            </p>
          </article>

          <article class="sc__card">
            <div class="sc__card-icon neon-border" aria-hidden="true">💵</div>
            <h3 class="sc__card-title">
              {{ t('services.stablecoin.capabilities.c2.title') }}
            </h3>
            <p class="sc__card-description">
              {{ t('services.stablecoin.capabilities.c2.description') }}
            </p>
          </article>

          <article class="sc__card">
            <div class="sc__card-icon neon-border" aria-hidden="true">🔗</div>
            <h3 class="sc__card-title">
              {{ t('services.stablecoin.capabilities.c3.title') }}
            </h3>
            <p class="sc__card-description">
              {{ t('services.stablecoin.capabilities.c3.description') }}
            </p>
          </article>
        </div>
      </section>

      <!-- Core Features Section -->
      <section class="sc__core-features" aria-labelledby="sc-core-features-heading">
        <h2 id="sc-core-features-heading" class="sc__section-title">
          {{ t('services.stablecoin.coreFeatures.heading') }}
        </h2>
        <div class="sc__cards-grid">
          <article class="sc__card">
            <div class="sc__card-icon neon-border" aria-hidden="true">🏦</div>
            <h3 class="sc__card-title">
              {{ t('services.stablecoin.coreFeatures.reserveOps.title') }}
            </h3>
            <p class="sc__card-description">
              {{ t('services.stablecoin.coreFeatures.reserveOps.description') }}
            </p>
          </article>

          <article class="sc__card">
            <div class="sc__card-icon neon-border" aria-hidden="true">⚙️</div>
            <h3 class="sc__card-title">
              {{ t('services.stablecoin.coreFeatures.mintBurnRails.title') }}
            </h3>
            <p class="sc__card-description">
              {{ t('services.stablecoin.coreFeatures.mintBurnRails.description') }}
            </p>
          </article>

          <article class="sc__card">
            <div class="sc__card-icon neon-border" aria-hidden="true">💱</div>
            <h3 class="sc__card-title">
              {{ t('services.stablecoin.coreFeatures.redemptionOps.title') }}
            </h3>
            <p class="sc__card-description">
              {{ t('services.stablecoin.coreFeatures.redemptionOps.description') }}
            </p>
          </article>

          <article class="sc__card">
            <div class="sc__card-icon neon-border" aria-hidden="true">🧩</div>
            <h3 class="sc__card-title">
              {{ t('services.stablecoin.coreFeatures.programmability.title') }}
            </h3>
            <p class="sc__card-description">
              {{ t('services.stablecoin.coreFeatures.programmability.description') }}
            </p>
          </article>
        </div>
      </section>

      <!-- Tech Features Section -->
      <section class="sc__tech-features" aria-labelledby="sc-tech-features-heading">
        <h2 id="sc-tech-features-heading" class="sc__section-title">
          {{ t('services.stablecoin.techFeatures.heading') }}
        </h2>
        <div class="sc__cards-grid">
          <article class="sc__card">
            <div class="sc__card-icon neon-border" aria-hidden="true">🏛️</div>
            <h3 class="sc__card-title">
              {{ t('services.stablecoin.techFeatures.issuancePlatform.title') }}
            </h3>
            <p class="sc__card-description">
              {{ t('services.stablecoin.techFeatures.issuancePlatform.description') }}
            </p>
          </article>

          <article class="sc__card">
            <div class="sc__card-icon neon-border" aria-hidden="true">🔍</div>
            <h3 class="sc__card-title">
              {{ t('services.stablecoin.techFeatures.complianceMonitoring.title') }}
            </h3>
            <p class="sc__card-description">
              {{ t('services.stablecoin.techFeatures.complianceMonitoring.description') }}
            </p>
          </article>

          <article class="sc__card">
            <div class="sc__card-icon neon-border" aria-hidden="true">🌐</div>
            <h3 class="sc__card-title">
              {{ t('services.stablecoin.techFeatures.chainInterop.title') }}
            </h3>
            <p class="sc__card-description">
              {{ t('services.stablecoin.techFeatures.chainInterop.description') }}
            </p>
          </article>

          <article class="sc__card">
            <div class="sc__card-icon neon-border" aria-hidden="true">💼</div>
            <h3 class="sc__card-title">
              {{ t('services.stablecoin.techFeatures.treasuryOps.title') }}
            </h3>
            <p class="sc__card-description">
              {{ t('services.stablecoin.techFeatures.treasuryOps.description') }}
            </p>
          </article>
        </div>
      </section>

      <section class="sc__cta" aria-labelledby="sc-cta-heading">
        <h2 id="sc-cta-heading" class="sc__cta-title neon-text">
          {{ t('services.stablecoin.cta.heading') }}
        </h2>
        <p class="sc__cta-description">
          {{ t('services.stablecoin.cta.description') }}
        </p>
        <router-link
          to="/contact"
          class="sc__cta-button neon-border"
          :aria-label="t('services.stablecoin.cta.ariaLabel')"
        >
          {{ t('services.stablecoin.cta.button') }}
        </router-link>
      </section>

      <div class="sc__back">
        <router-link to="/" class="sc__back-link">
          <span class="sc__back-icon" aria-hidden="true">←</span>
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

  document.title = t('services.stablecoin.title')
  const metaName = 'description'
  let descriptionMeta = document.querySelector(`meta[name="${metaName}"]`)
  if (!descriptionMeta) {
    descriptionMeta = document.createElement('meta')
    descriptionMeta.setAttribute('name', metaName)
    document.head.appendChild(descriptionMeta)
  }
  descriptionMeta.setAttribute('content', t('services.stablecoin.subtitle'))

  const cards = document.querySelectorAll('.sc__card')
  for (let i = 0; i < cards.length; i++) {
    cards[i].style.animationDelay = `${i * 0.1}s`
  }

  loading.value = false
})
</script>

<style scoped>
.stablecoin {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
  color: #e0e0e0;
  font-family: 'Rajdhani', sans-serif;
  padding: 2rem;
}

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
  animation: scGridMove 20s linear infinite;
  pointer-events: none;
  z-index: 0;
}

.grid-bg-2 {
  background-image:
    linear-gradient(rgba(0, 255, 136, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 136, 0.02) 1px, transparent 1px);
  background-size: 100px 100px;
  animation: scGridMove 30s linear infinite reverse;
}

@keyframes scGridMove {
  0% { transform: perspective(500px) rotateX(60deg) translateY(0); }
  100% { transform: perspective(500px) rotateX(60deg) translateY(50px); }
}

.sc__skeleton {
  position: relative;
  z-index: 1;
  max-width: 900px;
  margin: 4rem auto;
  padding: 2rem;
}

.sc__skeleton-block {
  background: rgba(26, 26, 46, 0.6);
  border: 1px solid rgba(0, 240, 255, 0.2);
  border-radius: 8px;
  margin-bottom: 1rem;
  animation: scShimmer 1.5s ease-in-out infinite;
}

.sc__skeleton-block--lg { height: 60px; }
.sc__skeleton-block--md { height: 40px; width: 80%; }
.sc__skeleton-block--sm { height: 30px; width: 50%; }

@keyframes scShimmer {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.sc__content {
  position: relative;
  z-index: 1;
}

.sc__breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.9rem;
  flex-wrap: wrap;
}

.sc__breadcrumb-link {
  color: #b0b0b0;
  text-decoration: none;
  transition: color 0.3s ease;
}

.sc__breadcrumb-link:hover,
.sc__breadcrumb-link:focus {
  color: #00f0ff;
}

.sc__breadcrumb-separator {
  color: rgba(0, 240, 255, 0.5);
}

.sc__breadcrumb-current {
  color: #00f0ff;
  font-weight: 500;
}

.sc__hero {
  text-align: center;
  padding: 4rem 2rem;
  background: rgba(26, 26, 46, 0.6);
  border: 1px solid rgba(0, 240, 255, 0.2);
  border-radius: 12px;
  margin-bottom: 3rem;
  backdrop-filter: blur(10px);
}

.sc__hero-icon-wrapper {
  margin-bottom: 1.5rem;
}

.sc__hero-icon {
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
  animation: scFloat 3s ease-in-out infinite;
}

@keyframes scFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.sc__hero-title {
  font-family: 'Orbitron', monospace;
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  line-height: 1.3;
  letter-spacing: 0.05em;
  color: #00f0ff;
}

.sc__hero-subtitle {
  font-size: 1.2rem;
  color: #b0b0b0;
  max-width: 800px;
  margin: 0 auto 2rem;
  line-height: 1.6;
}

.sc__hero-cta {
  margin-top: 2rem;
}

.sc__hero-button {
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

.sc__hero-button:hover,
.sc__hero-button:focus {
  background: rgba(0, 240, 255, 0.2);
  border-color: rgba(0, 240, 255, 0.6);
  box-shadow: 0 0 20px rgba(0, 240, 255, 0.3);
  transform: translateY(-2px);
}

.sc__section-title {
  font-family: 'Orbitron', monospace;
  font-size: 2rem;
  font-weight: 600;
  color: #e0e0e0;
  margin: 0 0 2rem 0;
  text-align: center;
  letter-spacing: 0.05em;
  position: relative;
}

.sc__section-title::after {
  content: '';
  display: block;
  width: 100px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #00f0ff, transparent);
  margin: 1rem auto 0;
}

.sc__overview {
  max-width: 900px;
  margin: 0 auto 4rem;
  padding: 2rem;
  background: rgba(26, 26, 46, 0.4);
  border: 1px solid rgba(0, 240, 255, 0.2);
  border-radius: 10px;
}

.sc__overview-text {
  font-size: 1.1rem;
  line-height: 1.8;
  color: #b0b0b0;
  text-align: center;
}

.sc__capabilities,
.sc__core-features,
.sc__tech-features {
  margin-bottom: 4rem;
}

.sc__cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}

.sc__card {
  background: rgba(26, 26, 46, 0.6);
  border: 1px solid rgba(0, 240, 255, 0.2);
  border-radius: 10px;
  padding: 2rem;
  text-align: center;
  transition: all 0.3s ease;
  animation: scFadeInUp 0.6s ease forwards;
  opacity: 0;
}

.sc__card:hover {
  border-color: rgba(0, 240, 255, 0.5);
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 240, 255, 0.15);
}

@keyframes scFadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.sc__card-icon {
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

.sc__card-title {
  font-family: 'Orbitron', monospace;
  font-size: 1.2rem;
  font-weight: 600;
  color: #00f0ff;
  margin: 0 0 0.75rem 0;
}

.sc__card-description {
  font-size: 0.95rem;
  line-height: 1.6;
  color: #b0b0b0;
}

.sc__cta {
  text-align: center;
  padding: 4rem 2rem;
  background: rgba(26, 26, 46, 0.6);
  border: 2px solid rgba(0, 240, 255, 0.3);
  border-radius: 12px;
  margin-bottom: 3rem;
}

.sc__cta-title {
  font-family: 'Orbitron', monospace;
  font-size: 2rem;
  font-weight: 700;
  color: #00f0ff;
  margin: 0 0 1rem 0;
}

.sc__cta-description {
  font-size: 1.1rem;
  color: #b0b0b0;
  margin-bottom: 2rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.sc__cta-button {
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

.sc__cta-button:hover,
.sc__cta-button:focus {
  background: rgba(0, 240, 255, 0.2);
  border-color: rgba(0, 240, 255, 0.6);
  box-shadow: 0 0 20px rgba(0, 240, 255, 0.3);
  transform: translateY(-2px);
}

.sc__back {
  text-align: center;
  margin-bottom: 3rem;
}

.sc__back-link {
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

.sc__back-link:hover,
.sc__back-link:focus {
  color: #e0e0e0;
}

.sc__back-icon {
  font-size: 1.2rem;
  transition: transform 0.3s ease;
}

.sc__back-link:hover .sc__back-icon {
  transform: translateX(-4px);
}

.neon-border {
  box-shadow:
    0 0 5px rgba(0, 240, 255, 0.5),
    0 0 10px rgba(0, 240, 255, 0.3),
    inset 0 0 5px rgba(0, 240, 255, 0.1);
}

.neon-text {
  text-shadow:
    0 0 5px rgba(0, 240, 255, 0.5),
    0 0 10px rgba(0, 240, 255, 0.3),
    0 0 15px rgba(0, 240, 255, 0.2);
}

@media (max-width: 768px) {
  .stablecoin {
    padding: 1.5rem 1rem;
  }

  .sc__hero {
    padding: 3rem 1.5rem;
  }

  .sc__hero-title {
    font-size: 1.75rem;
  }

  .sc__cards-grid {
    grid-template-columns: 1fr;
  }

  .sc__cta {
    padding: 3rem 1.5rem;
  }

  .sc__cta-title {
    font-size: 1.5rem;
  }
}
</style>
