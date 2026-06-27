<template>
  <section class="news-section">
    <div class="container">
      <div class="section-header">
        <div class="section-icon neon-glow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 4v16h16V4H4zm8 2h2v4h-2V6zm0 6h2v4h-2v-4z" />
          </svg>
        </div>
        <h2 class="section-title neon-text">{{ t('news.title') }}</h2>
      </div>

      <div class="news-grid">
        <router-link
          v-for="item in newsItems"
          :key="item.id"
          :to="item.link"
          class="news-card cyber-card hover-glow"
        >
          <div class="card-image">
            <div class="image-placeholder neon-border">
              <span class="placeholder-icon">📰</span>
            </div>
          </div>
          <div class="card-content">
            <h3 class="card-title">{{ t(item.titleKey) }}</h3>
            <div class="card-cta">
              <span class="cta-text">{{ t('news.learnMore') }}</span>
              <span class="cta-arrow">→</span>
            </div>
          </div>
        </router-link>
      </div>
    </div>
  </section>
</template>

<script setup>
import { useLanguage } from '../composables/useLanguage'

const { t } = useLanguage()

const newsItems = [
  {
    id: 'ktech-news',
    titleKey: 'news.ktechNews',
    link: '/news/ktech',
    alt: 'KTech News thumbnail'
  },
  {
    id: 'kbtg-news',
    titleKey: 'news.kbtgNews',
    link: '/news/kbtg',
    alt: 'KBTG News thumbnail'
  }
]
</script>

<style scoped>
.news-section {
  position: relative;
  padding: 5rem 5%;
  background: rgba(10, 15, 28, 0.95);
  border-top: 1px solid rgba(0, 255, 204, 0.2);
  border-bottom: 1px solid rgba(0, 255, 204, 0.2);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 3rem;
}

.section-icon {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.section-icon svg {
  width: 32px;
  height: 32px;
  color: #00ffcc;
}

.neon-glow {
  filter: drop-shadow(0 0 10px rgba(0, 255, 204, 0.5));
}

.section-title {
  font-family: 'Orbitron', monospace;
  font-size: 2.5rem;
  font-weight: 700;
  color: #00ffcc;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  margin: 0;
}

.neon-text {
  text-shadow: 0 0 10px rgba(0, 255, 204, 0.8), 0 0 20px rgba(0, 255, 204, 0.5);
}

.news-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.news-card {
  display: block;
  text-decoration: none;
  background: rgba(20, 25, 40, 0.8);
  border: 1px solid rgba(0, 255, 204, 0.2);
  border-radius: 10px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
}

.cyber-card {
  backdrop-filter: blur(10px);
}

.news-card:hover {
  transform: translateY(-5px);
}

.hover-glow:hover {
  border-color: rgba(0, 255, 204, 0.5);
  box-shadow: 0 0 30px rgba(0, 255, 204, 0.3), 0 0 60px rgba(255, 0, 255, 0.1);
}

.card-image {
  width: 100%;
  height: 200px;
  overflow: hidden;
  position: relative;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(0, 255, 204, 0.1) 0%, rgba(255, 0, 255, 0.05) 100%);
}

.neon-border {
  border: 1px solid rgba(0, 255, 204, 0.3);
  border-radius: 10px;
}

.placeholder-icon {
  font-size: 3rem;
}

.card-content {
  padding: 1.5rem;
}

.card-title {
  font-family: 'Orbitron', monospace;
  font-size: 1.3rem;
  font-weight: 600;
  color: #e0e0e0;
  margin: 0 0 1rem 0;
  letter-spacing: 0.1em;
}

.card-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: rgba(0, 255, 204, 0.1);
  border: 1px solid rgba(0, 255, 204, 0.3);
  border-radius: 5px;
  transition: all 0.3s ease;
}

.news-card:hover .card-cta {
  background: rgba(255, 0, 255, 0.2);
  border-color: rgba(255, 0, 255, 0.5);
  box-shadow: 0 0 15px rgba(255, 0, 255, 0.3);
}

.cta-text {
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  color: #00ffcc;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.news-card:hover .cta-text {
  color: #ff00ff;
}

.cta-arrow {
  font-size: 1.2rem;
  color: #00ffcc;
  transition: transform 0.3s ease;
}

.news-card:hover .cta-arrow {
  transform: translateX(5px);
  color: #ff00ff;
}

@media (max-width: 768px) {
  .news-section {
    padding: 3rem 5%;
  }

  .section-title {
    font-size: 1.8rem;
  }

  .news-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .card-image {
    height: 160px;
  }
}

@media (max-width: 480px) {
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .section-icon {
    width: 40px;
    height: 40px;
  }

  .section-icon svg {
    width: 24px;
    height: 24px;
  }
}
</style>
