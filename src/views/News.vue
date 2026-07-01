<template>
  <main id="main-content" class="news-page" :aria-label="t('a11y.mainLabel')" role="main">
    <!-- Breadcrumb -->
    <nav class="news-page__breadcrumb" aria-label="Breadcrumb">
      <router-link to="/" class="news-page__breadcrumb-link">{{ t('nav.home') }}</router-link>
      <span class="news-page__breadcrumb-separator" aria-hidden="true">/</span>
      <span class="news-page__breadcrumb-current">{{ t('news.title') }}</span>
    </nav>

    <!-- Header -->
    <header class="news-page__header">
      <h1 class="news-page__title">{{ t('news.title') }}</h1>
      <p class="news-page__subtitle">{{ t('news.subtitle') }}</p>
    </header>

    <!-- Filter -->
    <NewsFilter
      :selected-category="selectedCategory"
      @filter-change="handleFilterChange"
    />

    <!-- News List -->
    <NewsList
      :articles="filteredArticles"
      :visible-count="visibleCount"
      :is-loading="isLoading"
      @load-more="handleLoadMore"
    />
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import NewsFilter from '../components/NewsFilter.vue'
import NewsList from '../components/NewsList.vue'
import { useLanguage } from '../i18n'
import newsData from '../data/news.json'

const { t } = useLanguage()

const articles = ref([])
const selectedCategory = ref('All')
const visibleCount = ref(6)
const isLoading = ref(true)

const filteredArticles = computed(() => {
  if (selectedCategory.value === 'All') {
    return articles.value
  }
  return articles.value.filter(
    article => article.category === selectedCategory.value
  )
})

const handleFilterChange = (category) => {
  selectedCategory.value = category
  visibleCount.value = 6 // Reset visible count when filter changes
  // Scroll to top of list
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

const handleLoadMore = () => {
  visibleCount.value += 6
}

onMounted(() => {
  // Simulate loading delay for better UX
  setTimeout(() => {
    articles.value = newsData
    isLoading.value = false
  }, 300)
})
</script>

<style scoped>
.news-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 3rem 2rem;
  min-height: 100vh;
}

/* Breadcrumb */
.news-page__breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
  font-family: var(--font-body);
  font-size: 0.9rem;
}

.news-page__breadcrumb-link {
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.3s ease;
}

.news-page__breadcrumb-link:hover,
.news-page__breadcrumb-link:focus {
  color: var(--cyan);
}

.news-page__breadcrumb-separator {
  color: var(--accent-cyan-alpha-50);
}

.news-page__breadcrumb-current {
  color: var(--cyan);
  font-weight: 500;
}

/* Header */
.news-page__header {
  text-align: center;
  margin-bottom: 3rem;
}

.news-page__title {
  font-family: var(--font-display);
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 1rem 0;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  position: relative;
  display: inline-block;
}

.news-page__title::after {
  content: '';
  position: absolute;
  bottom: -0.5rem;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--cyan) 50%,
    transparent 100%
  );
}

.news-page__subtitle {
  font-family: var(--font-body);
  font-size: 1.2rem;
  color: var(--text-secondary);
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .news-page {
    padding: 2rem 1.5rem;
  }

  .news-page__title {
    font-size: 2rem;
  }

  .news-page__subtitle {
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .news-page {
    padding: 1.5rem 1rem;
  }

  .news-page__title {
    font-size: 1.75rem;
  }
}
</style>
