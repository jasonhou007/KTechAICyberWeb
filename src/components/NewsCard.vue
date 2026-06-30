<template>
  <article class="news-card" :class="{ 'news-card--loading': isLoading }">
    <!-- Date Badge -->
    <div class="news-card__badge" aria-hidden="true">
      {{ formattedDate }}
    </div>

    <!-- Featured Image -->
    <div class="news-card__image-wrapper">
      <CyberImage
        v-if="!isLoading && article.image"
        :src="article.image"
        :alt="t(article.altKey) || article.title"
        className="news-card__image"
        :srcset="imageSrcset"
        :sizes="imageSizes"
      />
      <div v-else class="news-card__image-skeleton"></div>
      <div class="news-card__image-overlay" aria-hidden="true"></div>
    </div>

    <!-- Category Badge -->
    <div class="news-card__category">
      {{ categoryLabel }}
    </div>

    <!-- Content -->
    <div class="news-card__content">
      <h3 class="news-card__title">
        {{ isLoading ? 'Loading article...' : article.title }}
      </h3>
      <p class="news-card__excerpt">
        {{ isLoading ? 'Loading excerpt...' : article.excerpt }}
      </p>
    </div>

    <!-- Read More Link -->
    <router-link
      v-if="!isLoading"
      :to="`/news/${article.slug}`"
      class="news-card__link"
      :aria-label="`${t('news.readMore')}: ${article.title}`"
    >
      {{ t('news.readMore') }}
      <span class="news-card__arrow" aria-hidden="true">→</span>
    </router-link>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { useLanguage } from '../i18n'
import CyberImage from './CyberImage.vue'

const props = defineProps({
  article: {
    type: Object,
    required: true
  },
  isLoading: {
    type: Boolean,
    default: false
  }
})

const { t } = useLanguage()

// Responsive image variants (#199). Most News images are SVGs mislabeled .webp
// (intrinsic width 800) and only one is a real raster (news-iso27001-official,
// 258x258). Rather than rasterize/upscale the SVGs (anti-pattern), emit a
// single-descriptor srcset at each image's intrinsic/native width: this tells
// the browser the source is good up to that display width and lets it skip the
// src vs. currentSrc round-trip. NO new image files are generated for News.
const NATIVE_WIDTH_MAP = {
  '/images/news/news-iso27001-official.webp': 258,
}
const DEFAULT_NEWS_WIDTH = 800 // SVGs declare width="800"

const imageNativeWidth = computed(() => {
  const img = props.article.image
  if (!img) return DEFAULT_NEWS_WIDTH
  return NATIVE_WIDTH_MAP[img] || DEFAULT_NEWS_WIDTH
})

const imageSrcset = computed(() =>
  props.article.image ? `${props.article.image} ${imageNativeWidth.value}w` : '',
)

const imageSizes = computed(() => `(max-width: 600px) 100vw, ${imageNativeWidth.value}px`)

const formattedDate = computed(() => {
  if (!props.article.date) return ''
  const date = new Date(props.article.date)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
})

const categoryLabel = computed(() => {
  const categoryMap = {
    'Company News': 'news.categories.company',
    'Industry Insights': 'news.categories.industry',
    'Technology Updates': 'news.categories.technology',
    'Events': 'news.categories.events'
  }
  const key = categoryMap[props.article.category]
  return key ? t(key) : props.article.category
})
</script>

<style scoped>
.news-card {
  position: relative;
  background: var(--surface-elevated);
  border: 1px solid rgba(0, 255, 204, 0.2);
  border-radius: var(--radius-lg);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  min-height: 400px;
}

.news-card:hover {
  transform: translateY(-5px);
  border-color: rgba(0, 255, 204, 0.5);
  box-shadow: 0 10px 30px rgba(0, 255, 204, 0.2);
}

.news-card:focus-within {
  border-color: rgba(0, 255, 204, 0.6);
  outline: 2px solid rgba(0, 255, 204, 0.3);
  outline-offset: 2px;
}

/* Date Badge */
.news-card__badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(0, 255, 204, 0.9);
  color: var(--bg-primary);
  font-family: var(--font-body);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-sm);
  z-index: 10;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

/* Image */
.news-card__image-wrapper {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
}

/* The featured image is now rendered by CyberImage (figure.news-card__image).
   Size the figure to fill the wrapper and let the inner img cover it. */
.news-card__image {
  width: 100%;
  height: 100%;
  border-radius: 0;
  border: none;
  box-shadow: none;
  background: transparent;
}

.news-card__image :deep(.cyber-image__img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.news-card:hover .news-card__image :deep(.cyber-image__img) {
  transform: scale(1.05);
}

.news-card__image-skeleton {
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    rgba(0, 255, 204, 0.1) 0%,
    rgba(0, 255, 204, 0.2) 50%,
    rgba(0, 255, 204, 0.1) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

.news-card__image-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    var(--surface-elevated) 100%
  );
  pointer-events: none;
}

/* Category */
.news-card__category {
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  background: rgba(10, 10, 15, 0.8);
  border: 1px solid rgba(0, 255, 204, 0.3);
  color: var(--cyan);
  font-family: var(--font-body);
  font-size: 0.7rem;
  font-weight: 500;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-sm);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  z-index: 10;
}

/* Content */
.news-card__content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.news-card__title {
  font-family: var(--font-body);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.75rem 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.news-card__excerpt {
  font-family: var(--font-body);
  font-size: 0.95rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Read More Link */
.news-card__link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: auto;
  padding: 1rem 1.5rem;
  font-family: var(--font-body);
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--cyan);
  text-decoration: none;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  border-top: 1px solid rgba(0, 255, 204, 0.2);
  transition: all 0.3s ease;
}

.news-card__link:hover,
.news-card__link:focus {
  background: rgba(0, 255, 204, 0.1);
  color: var(--text-primary);
}

.news-card__arrow {
  font-size: 1.2rem;
  transition: transform 0.3s ease;
}

.news-card__link:hover .news-card__arrow,
.news-card__link:focus .news-card__arrow {
  transform: translateX(4px);
}

/* Loading State */
.news-card--loading {
  pointer-events: none;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .news-card {
    min-height: 350px;
  }

  .news-card__image-wrapper {
    height: 180px;
  }

  .news-card__title {
    font-size: 1.1rem;
  }

  .news-card__excerpt {
    font-size: 0.9rem;
  }
}
</style>
