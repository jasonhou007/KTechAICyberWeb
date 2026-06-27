<template>
  <section class="section" id="services">
    <!-- Skeleton State -->
    <div v-if="isLoading" class="skeleton-grid">
      <SkeletonCard
        v-for="(_, index) in services"
        :key="`skeleton-${index}`"
        :is-loading="isLoading"
        :index="index"
      />
    </div>

    <!-- Actual Content -->
    <Transition name="content-fade">
      <div v-if="!isLoading" class="content-wrapper">
        <div class="fade-in">
          <h2 class="section-title">{{ t('services.title') }}</h2>
          <p class="section-subtitle">{{ t('services.subtitle') }}</p>
        </div>

        <div class="grid">
          <article
            v-for="(service, index) in services"
            :key="service.title"
            class="card fade-in stagger"
          >
            <div class="card-icon" :aria-hidden="true">{{ service.icon }}</div>
            <h3>{{ service.title }}</h3>
            <p>{{ service.description }}</p>
          </article>
        </div>
      </div>
    </Transition>
  </section>
</template>

<script setup>
/**
 * @component Services
 * @description Core services section with skeleton loading
 *
 * @example
 * <Services />
 */

import SkeletonCard from './SkeletonCard.vue'
import { useSkeleton } from '../composables/useSkeleton'
import { computed } from 'vue'

// Skeleton loading state for below-fold content
const { isLoading } = useSkeleton({ immediate: false })

// Translations - must be defined before services
const t = (key) => {
  const translations = {
    'services.title': '核心服务',
    'services.subtitle': '以尖端科技赋能金融创新',
    'services.projectManagement': '项目管理',
    'services.projectManagementDesc': '专业的金融科技项目管理服务',
    'services.retailCredit': '零售信贷',
    'services.retailCreditDesc': '端到端的零售信贷系统解决方案',
    'services.supplyChain': '供应链金融',
    'services.supplyChainDesc': '基于区块链的供应链金融平台',
    'services.blockchain': '区块链技术',
    'services.blockchainDesc': '企业级区块链解决方案',
    'services.fintechApp': '金融科技应用',
    'services.fintechAppDesc': '移动端金融应用开发',
    'services.bigData': '大数据与AI',
    'services.bigDataDesc': '人工智能与大数据分析'
  }
  return translations[key] || key
}

// Services data - computed to avoid reference error
const services = computed(() => [
  {
    icon: '🏗️',
    title: t('services.projectManagement'),
    description: t('services.projectManagementDesc')
  },
  {
    icon: '💳',
    title: t('services.retailCredit'),
    description: t('services.retailCreditDesc')
  },
  {
    icon: '🔗',
    title: t('services.supplyChain'),
    description: t('services.supplyChainDesc')
  },
  {
    icon: '⛓️',
    title: t('services.blockchain'),
    description: t('services.blockchainDesc')
  },
  {
    icon: '📱',
    title: t('services.fintechApp'),
    description: t('services.fintechAppDesc')
  },
  {
    icon: '☁️',
    title: t('services.bigData'),
    description: t('services.bigDataDesc')
  }
])
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
  min-height: 500px;
}
</style>
