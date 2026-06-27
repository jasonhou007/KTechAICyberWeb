<template>
  <div class="privacy">
    <section class="privacy-hero">
      <h1 class="page-title">
        {{ t('privacy.title') }}
        <span class="accent">{{ t('privacy.titleAccent') }}</span>
      </h1>
      <p class="page-subtitle">{{ t('privacy.subtitle') }}</p>
      <p class="page-meta">{{ t('privacy.lastUpdated') }}</p>
    </section>

    <section class="privacy-content">
      <p class="disclaimer" role="note">{{ t('privacy.disclaimer') }}</p>

      <div class="content-block">
        <h2>{{ t('privacy.intro.heading') }}</h2>
        <p>{{ t('privacy.intro.description') }}</p>
      </div>

      <div class="content-block">
        <h2>{{ t('privacy.collection.heading') }}</h2>
        <p>{{ t('privacy.collection.description') }}</p>
        <ul class="item-list">
          <li>
            <strong>{{ t('privacy.collection.items.personal.title') }}</strong>
            <span>{{ t('privacy.collection.items.personal.description') }}</span>
          </li>
          <li>
            <strong>{{ t('privacy.collection.items.usage.title') }}</strong>
            <span>{{ t('privacy.collection.items.usage.description') }}</span>
          </li>
          <li>
            <strong>{{ t('privacy.collection.items.cookies.title') }}</strong>
            <span>{{ t('privacy.collection.items.cookies.description') }}</span>
          </li>
          <li>
            <strong>{{ t('privacy.collection.items.financial.title') }}</strong>
            <span>{{ t('privacy.collection.items.financial.description') }}</span>
          </li>
        </ul>
      </div>

      <div class="content-block">
        <h2>{{ t('privacy.cookies.heading') }}</h2>
        <p>{{ t('privacy.cookies.description') }}</p>
        <ul class="item-list">
          <li>
            <strong>{{ t('privacy.cookies.types.essential.title') }}</strong>
            <span>{{ t('privacy.cookies.types.essential.description') }}</span>
          </li>
          <li>
            <strong>{{ t('privacy.cookies.types.analytics.title') }}</strong>
            <span>{{ t('privacy.cookies.types.analytics.description') }}</span>
          </li>
          <li>
            <strong>{{ t('privacy.cookies.types.marketing.title') }}</strong>
            <span>{{ t('privacy.cookies.types.marketing.description') }}</span>
          </li>
        </ul>
      </div>

      <div class="content-block">
        <h2>{{ t('privacy.use.heading') }}</h2>
        <p>{{ t('privacy.use.description') }}</p>
        <ul class="item-list">
          <li>{{ t('privacy.use.items.service') }}</li>
          <li>{{ t('privacy.use.items.improve') }}</li>
          <li>{{ t('privacy.use.items.communicate') }}</li>
          <li>{{ t('privacy.use.items.security') }}</li>
          <li>{{ t('privacy.use.items.compliance') }}</li>
        </ul>
      </div>

      <div class="content-block">
        <h2>{{ t('privacy.rights.heading') }}</h2>
        <p>{{ t('privacy.rights.description') }}</p>
        <ul class="item-list">
          <li>
            <strong>{{ t('privacy.rights.items.access.title') }}</strong>
            <span>{{ t('privacy.rights.items.access.description') }}</span>
          </li>
          <li>
            <strong>{{ t('privacy.rights.items.rectification.title') }}</strong>
            <span>{{ t('privacy.rights.items.rectification.description') }}</span>
          </li>
          <li>
            <strong>{{ t('privacy.rights.items.erasure.title') }}</strong>
            <span>{{ t('privacy.rights.items.erasure.description') }}</span>
          </li>
          <li>
            <strong>{{ t('privacy.rights.items.portability.title') }}</strong>
            <span>{{ t('privacy.rights.items.portability.description') }}</span>
          </li>
          <li>
            <strong>{{ t('privacy.rights.items.object.title') }}</strong>
            <span>{{ t('privacy.rights.items.object.description') }}</span>
          </li>
          <li>
            <strong>{{ t('privacy.rights.items.restrict.title') }}</strong>
            <span>{{ t('privacy.rights.items.restrict.description') }}</span>
          </li>
        </ul>
        <p class="note">{{ t('privacy.rights.exerciseNote') }}</p>
      </div>

      <div class="content-block">
        <h2>{{ t('privacy.retention.heading') }}</h2>
        <p>{{ t('privacy.retention.description') }}</p>
      </div>

      <div class="content-block">
        <h2>{{ t('privacy.thirdParty.heading') }}</h2>
        <p>{{ t('privacy.thirdParty.description') }}</p>
        <ul class="item-list">
          <li>{{ t('privacy.thirdParty.items.hosting') }}</li>
          <li>{{ t('privacy.thirdParty.items.analytics') }}</li>
          <li>{{ t('privacy.thirdParty.items.support') }}</li>
          <li>{{ t('privacy.thirdParty.items.legal') }}</li>
        </ul>
        <p class="note">{{ t('privacy.thirdParty.note') }}</p>
      </div>

      <div class="content-block">
        <h2>{{ t('privacy.contact.heading') }}</h2>
        <p>{{ t('privacy.contact.description') }}</p>
        <p class="contact-line">{{ t('privacy.contact.email') }}</p>
        <p class="contact-line">{{ t('privacy.contact.address') }}</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { useLanguage } from '../i18n'

const { t } = useLanguage()
</script>

<style scoped>
.privacy-hero {
  padding: var(--spacing-lg) 5%;
  text-align: center;
  background: rgba(0, 255, 204, 0.05);
  border-bottom: 1px solid rgba(0, 255, 204, 0.2);
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
.privacy-content {
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
  color: #aaa;
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
  color: #aaa;
  padding: var(--spacing-xs) var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
  background: rgba(0, 255, 204, 0.03);
  border: 1px solid rgba(0, 255, 204, 0.15);
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
  .privacy-hero,
  .privacy-content {
    padding: var(--spacing-md) 5%;
  }
  .content-block h2 {
    font-size: 1.3rem;
  }
}
</style>
