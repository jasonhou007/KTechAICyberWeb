/**
 * @file JoinUs.vue
 * @description Join Us page - Recruitment and Career Opportunities
 * @ticket FEAT-024
 */

<template>
  <div class="join-us">
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-content">
        <h1 class="page-title">
          {{ t('joinUs.title') }}<span class="accent">{{ t('joinUs.titleAccent') }}</span>
        </h1>
        <p class="subtitle">{{ t('joinUs.subtitle') }}</p>
        <router-link to="/join-us/positions" class="cta-button" :aria-label="t('joinUs.cta.ariaLabel')">
          {{ t('joinUs.cta.button') }}
        </router-link>
      </div>
    </section>

    <!-- Culture Section -->
    <section class="culture" aria-labelledby="culture-heading">
      <div class="container">
        <h2 id="culture-heading" class="section-title">{{ t('joinUs.culture.title') }}</h2>
        <p class="section-description">{{ t('joinUs.culture.description') }}</p>

        <div class="culture-values">
          <div class="culture-card">
            <h3>{{ t('joinUs.culture.innovation.title') }}</h3>
            <p>{{ t('joinUs.culture.innovation.description') }}</p>
          </div>
          <div class="culture-card">
            <h3>{{ t('joinUs.culture.teamwork.title') }}</h3>
            <p>{{ t('joinUs.culture.teamwork.description') }}</p>
          </div>
          <div class="culture-card">
            <h3>{{ t('joinUs.culture.creativity.title') }}</h3>
            <p>{{ t('joinUs.culture.creativity.description') }}</p>
          </div>
          <div class="culture-card">
            <h3>{{ t('joinUs.culture.growth.title') }}</h3>
            <p>{{ t('joinUs.culture.growth.description') }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Benefits Section -->
    <section class="benefits" aria-labelledby="benefits-heading">
      <div class="container">
        <h2 id="benefits-heading" class="section-title">{{ t('joinUs.benefits.title') }}</h2>

        <div class="benefits-grid">
          <div class="benefit-card">
            <h3>{{ t('joinUs.benefits.competitive.title') }}</h3>
            <p>{{ t('joinUs.benefits.competitive.description') }}</p>
          </div>
          <div class="benefit-card">
            <h3>{{ t('joinUs.benefits.development.title') }}</h3>
            <p>{{ t('joinUs.benefits.development.description') }}</p>
          </div>
          <div class="benefit-card">
            <h3>{{ t('joinUs.benefits.balance.title') }}</h3>
            <p>{{ t('joinUs.benefits.balance.description') }}</p>
          </div>
          <div class="benefit-card">
            <h3>{{ t('joinUs.benefits.health.title') }}</h3>
            <p>{{ t('joinUs.benefits.health.description') }}</p>
          </div>
          <div class="benefit-card">
            <h3>{{ t('joinUs.benefits.activities.title') }}</h3>
            <p>{{ t('joinUs.benefits.activities.description') }}</p>
          </div>
          <div class="benefit-card">
            <h3>{{ t('joinUs.benefits.career.title') }}</h3>
            <p>{{ t('joinUs.benefits.career.description') }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Positions Section -->
    <section class="positions" aria-labelledby="positions-heading">
      <div class="container">
        <h2 id="positions-heading" class="section-title">{{ t('joinUs.positions.title') }}</h2>
        <p class="section-description">{{ t('joinUs.positions.subtitle') }}</p>

        <router-link to="/join-us/positions" class="view-all-button">
          {{ t('joinUs.positions.viewAll') }}
        </router-link>
      </div>
    </section>

    <!-- Application Process Section -->
    <section class="process" aria-labelledby="process-heading">
      <div class="container">
        <h2 id="process-heading" class="section-title">{{ t('joinUs.process.title') }}</h2>

        <div class="process-steps">
          <div class="process-step">
            <div class="step-number">1</div>
            <h3>{{ t('joinUs.process.step1.title') }}</h3>
            <p>{{ t('joinUs.process.step1.description') }}</p>
          </div>
          <div class="process-step">
            <div class="step-number">2</div>
            <h3>{{ t('joinUs.process.step2.title') }}</h3>
            <p>{{ t('joinUs.process.step2.description') }}</p>
          </div>
          <div class="process-step">
            <div class="step-number">3</div>
            <h3>{{ t('joinUs.process.step3.title') }}</h3>
            <p>{{ t('joinUs.process.step3.description') }}</p>
          </div>
          <div class="process-step">
            <div class="step-number">4</div>
            <h3>{{ t('joinUs.process.step4.title') }}</h3>
            <p>{{ t('joinUs.process.step4.description') }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Contact Section -->
    <section class="contact" aria-labelledby="contact-heading">
      <div class="container">
        <h2 id="contact-heading" class="section-title">{{ t('joinUs.contact.title') }}</h2>
        <p class="section-description">{{ t('joinUs.contact.description') }}</p>
        <a :href="`mailto:${t('joinUs.contact.email')}`" class="email-link">
          {{ t('joinUs.contact.email') }}
        </a>
      </div>
    </section>
  </div>
</template>

<script setup>
/**
 * JoinUs Component
 * Displays recruitment information, company culture, benefits, and application process
 */
import { onMounted } from 'vue'
import { useLanguage } from '../composables/useLanguage'

// Get translation function
const { t, initLanguage } = useLanguage()

// Initialize language on mount
onMounted(() => {
  initLanguage()
})
</script>

<style scoped>
.join-us {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--surface-card) 0%, rgba(20, 25, 40, 0.95) 100%);
}

/* Hero Section */
.hero {
  padding: 120px 20px 80px;
  background: linear-gradient(180deg, var(--accent-cyan-alpha-05) 0%, transparent 100%);
  text-align: center;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
}

.page-title {
  font-size: 3.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 20px;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.accent {
  color: var(--cyan);
  text-shadow: 0 0 20px var(--accent-cyan-alpha-50);
}

.subtitle {
  font-size: 1.25rem;
  color: var(--text-secondary);
  margin-bottom: 40px;
  line-height: 1.6;
}

.cta-button {
  display: inline-block;
  padding: 16px 40px;
  background: linear-gradient(135deg, var(--cyan) 0%, var(--cyan) 100%);
  color: var(--bg-primary);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  text-decoration: none;
  box-shadow: 0 4px 20px var(--accent-cyan-alpha-30);
  transition: all 0.3s ease;
}

.cta-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 30px var(--accent-cyan-alpha-50);
}

/* Section Styles */
.culture,
.benefits,
.positions,
.process,
.contact {
  padding: 80px 20px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.section-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-primary);
  text-align: center;
  margin-bottom: 20px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.section-description {
  text-align: center;
  color: var(--text-secondary);
  font-size: 1.1rem;
  max-width: 700px;
  margin: 0 auto 50px;
  line-height: 1.6;
}

/* Culture Section */
.culture-values {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 30px;
}

.culture-card {
  background: var(--surface-elevated);
  border: 1px solid var(--accent-cyan-alpha-20);
  border-radius: var(--radius-md);
  padding: 30px;
  transition: all 0.3s ease;
}

.culture-card:hover {
  border-color: var(--cyan);
  box-shadow: 0 0 20px var(--accent-cyan-alpha-20);
  transform: translateY(-5px);
}

.culture-card h3 {
  color: var(--cyan);
  font-size: 1.25rem;
  margin-bottom: 15px;
  font-weight: 600;
}

.culture-card p {
  color: var(--text-secondary);
  line-height: 1.6;
}

/* Benefits Section */
.benefits-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 25px;
}

.benefit-card {
  background: var(--surface-elevated);
  border-left: 3px solid var(--cyan);
  border-radius: var(--radius-md);
  padding: 25px;
  transition: all 0.3s ease;
}

.benefit-card:hover {
  background: var(--surface-elevated);
  box-shadow: 0 0 15px var(--accent-cyan-alpha-15);
}

.benefit-card h3 {
  color: var(--text-primary);
  font-size: 1.15rem;
  margin-bottom: 12px;
  font-weight: 600;
}

.benefit-card p {
  color: var(--text-secondary);
  line-height: 1.5;
  font-size: 0.95rem;
}

/* Positions Section */
.view-all-button {
  display: block;
  width: fit-content;
  margin: 0 auto;
  padding: 14px 35px;
  background: transparent;
  color: var(--cyan);
  border: 2px solid var(--cyan);
  border-radius: var(--radius-sm);
  font-weight: 600;
  text-transform: uppercase;
  text-decoration: none;
  transition: all 0.3s ease;
}

.view-all-button:hover {
  background: var(--cyan);
  color: var(--bg-primary);
  box-shadow: 0 0 20px var(--accent-cyan-alpha-40);
}

/* Process Section */
.process-steps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 30px;
}

.process-step {
  text-align: center;
  position: relative;
}

.step-number {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, var(--cyan) 0%, var(--cyan) 100%);
  color: var(--bg-primary);
  font-size: 1.5rem;
  font-weight: 700;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  box-shadow: var(--shadow-glow-cyan);
}

.process-step h3 {
  color: var(--text-primary);
  font-size: 1.1rem;
  margin-bottom: 12px;
  font-weight: 600;
}

.process-step p {
  color: var(--text-secondary);
  line-height: 1.5;
  font-size: 0.95rem;
}

/* Contact Section */
.contact {
  text-align: center;
  background: linear-gradient(180deg, transparent 0%, var(--accent-cyan-alpha-05) 100%);
}

.email-link {
  color: var(--cyan);
  font-size: 1.25rem;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
}

.email-link:hover {
  text-shadow: 0 0 15px var(--accent-cyan-alpha-50);
  text-decoration: underline;
}

/* Responsive Design */
@media (max-width: 768px) {
  .page-title {
    font-size: 2.5rem;
  }

  .hero {
    padding: 80px 20px 60px;
  }

  .culture-values,
  .benefits-grid,
  .process-steps {
    grid-template-columns: 1fr;
  }

  .section-title {
    font-size: 2rem;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 2rem;
  }

  .subtitle {
    font-size: 1rem;
  }

  .culture,
  .benefits,
  .positions,
  .process,
  .contact {
    padding: 60px 15px;
  }
}
</style>
