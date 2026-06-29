<template>
  <div class="news-list">
    <!-- News Grid -->
    <div class="news-list__grid" role="list">
      <NewsCard
        v-for="article in visibleArticles"
        :key="article.id"
        :article="article"
        :is-loading="isLoading"
        class="news-list__item"
        role="listitem"
      />
    </div>

    <!-- Empty State -->
    <div
      v-if="!isLoading && articles.length === 0"
      class="news-list__empty"
      role="status"
      aria-live="polite"
    >
      <div class="news-list__empty-icon" aria-hidden="true">📭</div>
      <p class="news-list__empty-text">{{ t('news.noNews') }}</p>
    </div>

    <!-- No Results State -->
    <div
      v-else-if="!isLoading && visibleArticles.length === 0 && articles.length > 0"
      class="news-list__empty"
      role="status"
      aria-live="polite"
    >
      <div class="news-list__empty-icon" aria-hidden="true">🔍</div>
      <p class="news-list__empty-text">No articles match your filter.</p>
    </div>

    <!-- Load More Button -->
    <div
      v-if="!isLoading && hasMore"
      class="news-list__load-more"
    >
      <button
        class="news-list__button"
        :aria-label="t('news.loadMore')"
        @click="handleLoadMore"
      >
        {{ t('news.loadMore') }}
        <span class="news-list__button-icon" aria-hidden="true">↓</span>
      </button>
    </div>

    <!-- Loading Skeleton -->
    <div
      v-if="isLoading"
      class="news-list__skeletons"
    >
      <NewsCard
        v-for="i in 6"
        :key="`skeleton-${i}`"
        :article="{}"
        :is-loading="true"
        class="news-list__item"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import NewsCard from './NewsCard.vue'
import { useLanguage } from '../i18n'

const props = defineProps({
  articles: {
    type: Array,
    default: () => []
  },
  visibleCount: {
    type: Number,
    default: 6
  },
  isLoading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['load-more'])

const { t } = useLanguage()

const visibleArticles = computed(() => {
  return props.articles.slice(0, props.visibleCount)
})

const hasMore = computed(() => {
  return props.articles.length > props.visibleCount
})

const handleLoadMore = () => {
  emit('load-more')
  // Smooth scroll to show newly loaded items
  setTimeout(() => {
    window.scrollTo({
      top: document.documentElement.scrollHeight - 200,
      behavior: 'smooth'
    })
  }, 100)
}
</script>

<style scoped>
.news-list {
  width: 100%;
}

/* Grid Layout */
.news-list__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

.news-list__item {
  height: 100%;
}

/* Responsive Grid */
@media (min-width: 640px) {
  .news-list__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .news-list__grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Empty State */
.news-list__empty {
  text-align: center;
  padding: 4rem 2rem;
  background: rgba(26, 26, 46, 0.4);
  border: 1px dashed rgba(0, 240, 255, 0.3);
  border-radius: 10px;
}

.news-list__empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.news-list__empty-text {
  font-family: var(--font-body);
  font-size: 1.1rem;
  color: #b0b0b0;
  margin: 0;
}

/* Load More Button */
.news-list__load-more {
  text-align: center;
  margin-top: 2rem;
}

.news-list__button {
  font-family: var(--font-body);
  font-size: 1rem;
  font-weight: 600;
  padding: 0.875rem 2rem;
  background: rgba(26, 26, 46, 0.6);
  border: 2px solid rgba(0, 240, 255, 0.4);
  border-radius: 6px;
  color: #00f0ff;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
}

.news-list__button:hover,
.news-list__button:focus {
  background: rgba(0, 240, 255, 0.1);
  border-color: rgba(0, 240, 255, 0.8);
  box-shadow: 0 0 25px rgba(0, 240, 255, 0.3);
  transform: translateY(-2px);
}

.news-list__button:focus {
  outline: none;
  box-shadow: 0 0 25px rgba(0, 240, 255, 0.3), 0 0 0 3px rgba(0, 240, 255, 0.2);
}

.news-list__button:active {
  transform: translateY(0);
}

.news-list__button-icon {
  font-size: 1.2rem;
  transition: transform 0.3s ease;
  display: inline-block;
}

.news-list__button:hover .news-list__button-icon {
  transform: translateY(2px);
}

/* Skeleton Loading */
.news-list__skeletons {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

@media (min-width: 640px) {
  .news-list__skeletons {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .news-list__skeletons {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .news-list__grid,
  .news-list__skeletons {
    gap: 1.5rem;
  }

  .news-list__empty {
    padding: 3rem 1.5rem;
  }
}
</style>
