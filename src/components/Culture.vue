<template>
  <section class="section">
    <!-- Skeleton State -->
    <div v-if="isLoading" class="skeleton-grid">
      <SkeletonCard
        v-for="(_, index) in culture"
        :key="`skeleton-${index}`"
        :is-loading="isLoading"
        :index="index"
      />
    </div>

    <!-- Actual Content -->
    <Transition name="content-fade">
      <div v-if="!isLoading" class="content-wrapper">
        <div class="fade-in">
          <h2 class="section-title">{{ t('culture.title') }}</h2>
        </div>

        <div class="grid">
          <article
            v-for="(item, index) in culture"
            :key="item.title"
            class="card fade-in stagger"
          >
            <div class="card-icon" :aria-hidden="true">{{ item.icon }}</div>
            <h3>{{ item.title }}</h3>
            <p v-html="item.description"></p>
          </article>
        </div>
      </div>
    </Transition>
  </section>
</template>

<script setup>
/**
 * @component Culture
 * @description Company culture section with skeleton loading
 *
 * @example
 * <Culture />
 */

import SkeletonCard from './SkeletonCard.vue'
import { useSkeleton } from '../composables/useSkeleton'

// Translations - must be defined before use
const t = (key) => {
  const translations = {
    'culture.title': '愿景·使命·文化',
    'culture.vision': '愿景',
    'culture.visionDesc': '成为区域领先的金融科技平台',
    'culture.mission': '使命',
    'culture.missionDesc': '以尖端科技赋能客户',
    'culture.values': '文化',
    'culture.valuesDesc': '客户至上 · 开放协作<br>敏捷创新 · 专业高效'
  }
  return translations[key] || key
}

// Skeleton loading state for below-fold content
const { isLoading } = useSkeleton({ immediate: false })

// Expose isLoading for testing purposes
defineExpose({
  isLoading
})

// Culture data
const culture = [
  {
    icon: '🎯',
    title: t('culture.vision'),
    description: t('culture.visionDesc')
  },
  {
    icon: '🚀',
    title: t('culture.mission'),
    description: t('culture.missionDesc')
  },
  {
    icon: '💡',
    title: t('culture.values'),
    description: t('culture.valuesDesc')
  }
]
</script>

<style scoped>
.section {
  padding: var(--spacing-xl) 8%;
  position: relative;
}

.section-title {
  font-family: var(--font-display);
  font-size: 2.5rem;
  text-align: center;
  color: var(--cyan);
  margin-bottom: 1rem;
  text-shadow: 0 0 30px var(--cyan);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}

.card {
  background: rgba(13, 26, 45, 0.6);
  border: 1px solid rgba(0, 255, 204, 0.2);
  padding: 2.5rem;
  transition: all 0.4s ease;
  position: relative;
  overflow: hidden;
}

.card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(0, 255, 204, 0.1),
    transparent
  );
  transition: left 0.6s ease;
}

.card:hover::before {
  left: 100%;
}

.card:hover {
  border-color: rgba(0, 255, 204, 0.5);
  transform: translateY(-10px);
  box-shadow: 0 20px 40px rgba(0, 255, 204, 0.15);
}

.card-icon {
  font-size: 2.5rem;
  margin-bottom: 1.5rem;
  display: inline-block;
  transition: transform 0.3s ease;
}

.card:hover .card-icon {
  transform: scale(1.1) rotate(5deg);
}

.card h3 {
  font-family: var(--font-display);
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: var(--text-primary);
}

.card p {
  color: var(--text-secondary);
  line-height: 1.7;
}

@media (max-width: 768px) {
  .section {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .grid {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .skeleton-grid {
    grid-template-columns: 1fr;
  }
}

/* Skeleton grid layout */
.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}

/* Content fade transition */
.content-fade-enter-active {
  transition: opacity 0.4s ease;
}

.content-fade-enter-from {
  opacity: 0;
}

.content-fade-enter-to {
  opacity: 1;
}

.content-wrapper {
  /* Prevent layout shift during transition */
  min-height: 400px;
}
</style>
