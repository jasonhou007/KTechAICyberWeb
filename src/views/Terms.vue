<template>
  <div class="terms">
    <section class="terms-hero">
      <h1 class="page-title">
        {{ t('terms.title') }}
        <span class="accent">{{ t('terms.titleAccent') }}</span>
      </h1>
      <p class="page-subtitle">{{ t('terms.subtitle') }}</p>
      <p class="page-meta">{{ t('terms.lastUpdated') }}</p>
    </section>

    <section class="terms-content">
      <p class="disclaimer" role="note">{{ t('terms.disclaimer') }}</p>

      <div class="content-block">
        <h2>{{ t('terms.intro.heading') }}</h2>
        <p>{{ t('terms.intro.description') }}</p>
      </div>

      <div class="content-block">
        <h2>{{ t('terms.acceptance.heading') }}</h2>
        <p>{{ t('terms.acceptance.description') }}</p>
        <ul class="item-list">
          <li>
            <strong>{{ t('terms.acceptance.items.byAccess.title') }}</strong>
            <span>{{ t('terms.acceptance.items.byAccess.description') }}</span>
          </li>
          <li>
            <strong>{{ t('terms.acceptance.items.amendments.title') }}</strong>
            <span>{{ t('terms.acceptance.items.amendments.description') }}</span>
          </li>
          <li>
            <strong>{{ t('terms.acceptance.items.rejection.title') }}</strong>
            <span>{{ t('terms.acceptance.items.rejection.description') }}</span>
          </li>
        </ul>
      </div>

      <div class="content-block">
        <h2>{{ t('terms.responsibilities.heading') }}</h2>
        <p>{{ t('terms.responsibilities.description') }}</p>
        <ul class="item-list">
          <li>{{ t('terms.responsibilities.items.accurate') }}</li>
          <li>{{ t('terms.responsibilities.items.compliance') }}</li>
          <li>{{ t('terms.responsibilities.items.security') }}</li>
          <li>{{ t('terms.responsibilities.items.prohibited') }}</li>
          <li>{{ t('terms.responsibilities.items.fees') }}</li>
        </ul>
      </div>

      <div class="content-block">
        <h2>{{ t('terms.liability.heading') }}</h2>
        <p>{{ t('terms.liability.description') }}</p>
        <ul class="item-list">
          <li>
            <strong>{{ t('terms.liability.items.asIs.title') }}</strong>
            <span>{{ t('terms.liability.items.asIs.description') }}</span>
          </li>
          <li>
            <strong>{{ t('terms.liability.items.noIndirect.title') }}</strong>
            <span>{{ t('terms.liability.items.noIndirect.description') }}</span>
          </li>
          <li>
            <strong>{{ t('terms.liability.items.cap.title') }}</strong>
            <span>{{ t('terms.liability.items.cap.description') }}</span>
          </li>
        </ul>
      </div>

      <div class="content-block">
        <h2>{{ t('terms.ip.heading') }}</h2>
        <p>{{ t('terms.ip.description') }}</p>
        <ul class="item-list">
          <li>
            <strong>{{ t('terms.ip.items.platform.title') }}</strong>
            <span>{{ t('terms.ip.items.platform.description') }}</span>
          </li>
          <li>
            <strong>{{ t('terms.ip.items.userContent.title') }}</strong>
            <span>{{ t('terms.ip.items.userContent.description') }}</span>
          </li>
          <li>
            <strong>{{ t('terms.ip.items.license.title') }}</strong>
            <span>{{ t('terms.ip.items.license.description') }}</span>
          </li>
        </ul>
      </div>

      <div class="content-block">
        <h2>{{ t('terms.termination.heading') }}</h2>
        <p>{{ t('terms.termination.description') }}</p>
        <ul class="item-list">
          <li>{{ t('terms.termination.items.byUser') }}</li>
          <li>{{ t('terms.termination.items.byUs') }}</li>
          <li>{{ t('terms.termination.items.effect') }}</li>
        </ul>
        <p class="note">{{ t('terms.termination.note') }}</p>
      </div>

      <div class="content-block">
        <h2>{{ t('terms.dispute.heading') }}</h2>
        <p>{{ t('terms.dispute.description') }}</p>
        <ul class="item-list">
          <li>
            <strong>{{ t('terms.dispute.items.negotiation.title') }}</strong>
            <span>{{ t('terms.dispute.items.negotiation.description') }}</span>
          </li>
          <li>
            <strong>{{ t('terms.dispute.items.mediation.title') }}</strong>
            <span>{{ t('terms.dispute.items.mediation.description') }}</span>
          </li>
          <li>
            <strong>{{ t('terms.dispute.items.arbitration.title') }}</strong>
            <span>{{ t('terms.dispute.items.arbitration.description') }}</span>
          </li>
        </ul>
      </div>

      <div class="content-block">
        <h2>{{ t('terms.governing.heading') }}</h2>
        <p>{{ t('terms.governing.description') }}</p>
      </div>

      <div class="content-block">
        <h2>{{ t('terms.contact.heading') }}</h2>
        <p>{{ t('terms.contact.description') }}</p>
        <p class="contact-line">{{ t('terms.contact.email') }}</p>
        <p class="contact-line">{{ t('terms.contact.address') }}</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { useLanguage } from '../i18n'

const { t } = useLanguage()
</script>

<style scoped>
.terms-hero {
  padding: var(--spacing-lg) 5%;
  text-align: center;
  background: var(--accent-cyan-alpha-05);
  border-bottom: 1px solid var(--accent-cyan-alpha-20);
}
.page-title {
  font-family: var(--font-display);
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 0.2em;
  margin-bottom: var(--spacing-sm);
}
.page-title .accent {
  color: var(--cyan);
}
.page-subtitle {
  font-family: var(--font-body);
  font-size: 1.2rem;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xs);
}
.page-meta {
  font-family: var(--font-body);
  font-size: 0.95rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.terms-content {
  padding: var(--spacing-lg) 5%;
  max-width: 800px;
  margin: 0 auto;
}
.disclaimer {
  font-family: var(--font-body);
  font-size: 0.9rem;
  color: var(--text-secondary);
  padding: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
  background: rgba(255, 0, 170, 0.05);
  border-left: 3px solid var(--magenta);
}
.content-block {
  margin-bottom: var(--spacing-md);
}
.content-block h2 {
  font-family: var(--font-display);
  font-size: 1.6rem;
  color: var(--cyan);
  letter-spacing: 0.15em;
  margin-bottom: var(--spacing-sm);
}
.content-block p {
  font-family: var(--font-body);
  font-size: 1.05rem;
  line-height: 1.8;
  color: var(--text-secondary);
}
.item-list {
  list-style: none;
  padding: 0;
  margin: var(--spacing-sm) 0;
}
.item-list li {
  font-family: var(--font-body);
  font-size: 1.05rem;
  line-height: 1.7;
  color: var(--text-secondary);
  padding: var(--spacing-xs) var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
  background: rgba(0, 255, 204, 0.03);
  border: 1px solid var(--accent-cyan-alpha-15);
  border-radius: var(--radius-sm);
}
.item-list li strong {
  display: inline-block;
  color: var(--text-primary);
  margin-right: var(--spacing-xs);
}
.note {
  margin-top: var(--spacing-sm);
  font-style: italic;
  color: var(--text-secondary);
}
.contact-line {
  font-family: var(--font-body);
  font-size: 1.05rem;
  color: var(--text-primary);
  margin: var(--spacing-xs) 0;
}

/* Responsive */
@media (max-width: 768px) {
  .page-title {
    font-size: 1.8rem;
  }
  .terms-hero,
  .terms-content {
    padding: var(--spacing-md) 5%;
  }
  .content-block h2 {
    font-size: 1.3rem;
  }
}
</style>
