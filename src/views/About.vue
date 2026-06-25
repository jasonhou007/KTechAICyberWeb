<template>
  <div class="about">
    <section class="about-hero" aria-labelledby="about-heading">
      <h1 id="about-heading" class="page-title">{{ t('about.title') }}</h1>
      <p class="page-subtitle">{{ t('about.subtitle') }}</p>
    </section>
    <main class="about-content" aria-labelledby="mission-heading">
      <article class="content-block">
        <h2 id="mission-heading">{{ t('about.mission.heading') }}</h2>
        <p>{{ t('about.mission.description') }}</p>
      </article>
      <dl class="stats-grid">
        <div class="stat-item">
          <dt class="sr-only">{{ t('about.stats.projects.label') }}</dt>
          <dd>
            <div class="stat-value">{{ t('about.stats.projects.value') }}</div>
            <div class="stat-label">{{ t('about.stats.projects.label') }}</div>
          </dd>
        </div>
        <div class="stat-item">
          <dt class="sr-only">{{ t('about.stats.commitment.label') }}</dt>
          <dd>
            <div class="stat-value">{{ t('about.stats.commitment.value') }}</div>
            <div class="stat-label">{{ t('about.stats.commitment.label') }}</div>
          </dd>
        </div>
        <div class="stat-item">
          <dt class="sr-only">{{ t('about.stats.innovation.label') }}</dt>
          <dd>
            <div class="stat-value">{{ t('about.stats.innovation.value') }}</div>
            <div class="stat-label">{{ t('about.stats.innovation.label') }}</div>
          </dd>
        </div>
      </dl>
    </main>
  </div>
</template>

<script>
import { onMounted } from 'vue'
import { useLanguage, initLanguage } from '../i18n'

export default {
  name: 'About',
  setup() {
    // Initialize language on component mount
    onMounted(() => {
      initLanguage()
    })

    const { t, loadCurrentTranslations } = useLanguage()

    // Load translations
    onMounted(async () => {
      await loadCurrentTranslations()
    })

    return {
      t
    }
  }
}
</script>

<style scoped>
.about-hero {
  padding: 5rem 5%; text-align: center;
  background: rgba(0, 240, 255, 0.05);
  border-bottom: 1px solid rgba(0, 240, 255, 0.2);
}

/* Screen reader only content */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
.page-title {
  font-family: 'Orbitron', monospace; font-size: 3rem; font-weight: 700;
  color: #e0e0e0; letter-spacing: 0.2em; margin-bottom: 1rem;
}
.page-title .accent { color: #00f0ff; }
.page-subtitle {
  font-family: 'Rajdhani', sans-serif; font-size: 1.2rem; color: #888;
}
.about-content { padding: 5rem 5%; max-width: 800px; margin: 0 auto; }
.content-block { margin-bottom: 4rem; }
.content-block h2 {
  font-family: 'Orbitron', monospace; font-size: 1.8rem;
  color: #00f0ff; letter-spacing: 0.15em; margin-bottom: 1.5rem;
}
.content-block p {
  font-family: 'Rajdhani', sans-serif; font-size: 1.1rem;
  line-height: 1.8; color: #aaa;
}
.stats-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem;
}
.stat-item {
  text-align: center; padding: 2rem;
  background: rgba(0, 240, 255, 0.05);
  border: 1px solid rgba(0, 240, 255, 0.2);
}
.stat-value {
  font-family: 'Orbitron', monospace; font-size: 2.5rem; font-weight: 700;
  color: #00f0ff; margin-bottom: 0.5rem;
}
.stat-label {
  font-family: 'Rajdhani', sans-serif; font-size: 1rem; color: #888;
  text-transform: uppercase; letter-spacing: 0.15em;
}
</style>
