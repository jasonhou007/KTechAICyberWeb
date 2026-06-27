<template>
  <section class="section honors" id="honors">
    <!-- Skeleton State -->
    <SkeletonHonors v-if="isLoading" :count="honors.length" />

    <!-- Actual Content -->
    <Transition name="content-fade">
      <div v-if="!isLoading" class="content-wrapper">
        <div class="fade-in">
          <h2 class="section-title">{{ t('honors.title') }}</h2>
          <p class="section-subtitle">{{ t('honors.subtitle') }}</p>
        </div>

        <div class="grid">
          <div
            v-for="(honor, index) in honors"
            :key="honor.title"
            class="honor-badge fade-in stagger"
          >
            <div class="honor-icon" :aria-hidden="true">{{ honor.icon }}</div>
            <h4>{{ honor.title }}</h4>
            <span>{{ honor.description }}</span>
          </div>
        </div>
      </div>
    </Transition>
  </section>
</template>

<script setup>
/**
 * @component Honors
 * @section Honors and certifications section with skeleton loading
 *
 * @example
 * <Honors />
 */

import SkeletonHonors from './SkeletonHonors.vue'
import { useSkeleton } from '../composables/useSkeleton'
import { useLanguage } from '../composables/useLanguage'

// Shared i18n — text follows the site-wide language toggle (en/zh).
const { t } = useLanguage()

// Skeleton loading state for below-fold content
const { isLoading } = useSkeleton({ immediate: false })

// Honors data
const honors = [
  {
    icon: '🏆',
    title: t('honors.highTech'),
    description: t('honors.highTechDesc')
  },
  {
    icon: '🎖️',
    title: t('honors.hq'),
    description: t('honors.hqDesc')
  },
  {
    icon: '⭐',
    title: t('honors.aaa'),
    description: t('honors.aaaDesc')
  },
  {
    icon: '🛡️',
    title: t('honors.iso9001'),
    description: t('honors.iso9001Desc')
  },
  {
    icon: '🔒',
    title: t('honors.iso27001'),
    description: t('honors.iso27001Desc')
  },
  {
    icon: '⚙️',
    title: t('honors.iso20000'),
    description: t('honors.iso20000Desc')
  },
  {
    icon: '💎',
    title: t('honors.specialized'),
    description: t('honors.specializedDesc')
  },
  {
    icon: '🌐',
    title: t('honors.member'),
    description: t('honors.memberDesc')
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

.section-subtitle {
  text-align: center;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-lg);
  font-size: 1.1rem;
}

.honors {
  background: rgba(13, 26, 45, 0.3);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}

.honor-badge {
  background: rgba(0, 255, 204, 0.05);
  border: 1px solid rgba(0, 255, 204, 0.3);
  padding: 2rem;
  text-align: center;
  transition: all 0.4s ease;
}

.honor-badge:hover {
  background: rgba(0, 255, 204, 0.15);
  border-color: var(--cyan);
  box-shadow: 0 0 40px rgba(0, 255, 204, 0.3);
  transform: translateY(-5px) scale(1.02);
}

.honor-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  transition: transform 0.3s ease;
}

.honor-badge:hover .honor-icon {
  transform: scale(1.2) rotate(10deg);
}

.honor-badge h4 {
  font-family: var(--font-display);
  font-size: 1rem;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.honor-badge span {
  font-size: 0.85rem;
  color: var(--cyan);
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
