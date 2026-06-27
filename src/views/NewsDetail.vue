<template>
  <main id="main-content" class="news-detail" :aria-label="t('a11y.mainLabel')" role="main">
    <!-- Breadcrumb -->
    <nav class="news-detail__breadcrumb" aria-label="Breadcrumb">
      <router-link to="/" class="news-detail__breadcrumb-link">{{ t('nav.home') }}</router-link>
      <span class="news-detail__breadcrumb-separator" aria-hidden="true">/</span>
      <router-link to="/news" class="news-detail__breadcrumb-link">{{ t('news.title') }}</router-link>
      <span class="news-detail__breadcrumb-separator" aria-hidden="true">/</span>
      <span class="news-detail__breadcrumb-current">{{ article?.title }}</span>
    </nav>

    <!-- Loading State -->
    <div v-if="isLoading" class="news-detail__loading">
      <div class="news-detail__skeleton-title"></div>
      <div class="news-detail__skeleton-meta"></div>
      <div class="news-detail__skeleton-image"></div>
      <div class="news-detail__skeleton-content">
        <div class="news-detail__skeleton-line"></div>
        <div class="news-detail__skeleton-line"></div>
        <div class="news-detail__skeleton-line"></div>
      </div>
    </div>

    <!-- Article Not Found -->
    <article v-else-if="!article" class="news-detail__not-found" role="alert" aria-live="polite">
      <div class="news-detail__not-found-icon" aria-hidden="true">📄</div>
      <h1 class="news-detail__not-found-title">Article Not Found</h1>
      <p class="news-detail__not-found-text">The article you're looking for doesn't exist.</p>
      <router-link to="/news" class="news-detail__not-found-link">
        {{ t('news.backToNews') }}
      </router-link>
    </article>

    <!-- Article Content -->
    <article v-else class="news-detail__article" itemscope itemtype="https://schema.org/NewsArticle">
      <!-- Header -->
      <header class="news-detail__header">
        <div class="news-detail__category">
          {{ categoryLabel }}
        </div>
        <h1 class="news-detail__title" itemprop="headline">{{ article.title }}</h1>
        <div class="news-detail__meta">
          <time class="news-detail__date" :datetime="article.date" itemprop="datePublished">
            {{ t('news.publishedOn') }} {{ formattedDate }}
          </time>
          <span class="news-detail__separator" aria-hidden="true">|</span>
          <span class="news-detail__author" itemprop="author">
            {{ t('news.by') }} {{ article.author }}
          </span>
        </div>
      </header>

      <!-- Featured Image -->
      <figure class="news-detail__figure" itemprop="image" itemscope itemtype="https://schema.org/ImageObject">
        <img
          v-if="article.image"
          :src="article.image"
          :alt="article.title"
          class="news-detail__image"
          itemprop="url"
        />
        <figcaption class="news-detail__caption" itemprop="caption">
          {{ article.title }}
        </figcaption>
      </figure>

      <!-- Article Content -->
      <div class="news-detail__content" itemprop="articleBody">
        <div v-html="renderedContent" class="news-detail__markdown"></div>
      </div>

      <!-- Share Button -->
      <div class="news-detail__share">
        <button
          class="news-detail__share-button"
          :aria-label="t('news.share')"
          @click="handleShare"
        >
          <span class="news-detail__share-icon" aria-hidden="true">🔗</span>
          {{ t('news.share') }}
        </button>
      </div>

      <!-- Back to News -->
      <div class="news-detail__back">
        <router-link to="/news" class="news-detail__back-link">
          <span class="news-detail__back-icon" aria-hidden="true">←</span>
          {{ t('news.backToNews') }}
        </router-link>
      </div>

      <!-- Related Articles -->
      <section v-if="relatedArticles.length > 0" class="news-detail__related" aria-labelledby="related-heading">
        <h2 id="related-heading" class="news-detail__related-title">{{ t('news.relatedArticles') }}</h2>
        <div class="news-detail__related-grid">
          <router-link
            v-for="related in relatedArticles"
            :key="related.id"
            :to="`/news/${related.slug}`"
            class="news-detail__related-card"
          >
            <div class="news-detail__related-image-wrapper">
              <img
                :src="related.image"
                :alt="related.title"
                class="news-detail__related-image"
                loading="lazy"
              />
            </div>
            <div class="news-detail__related-content">
              <h3 class="news-detail__related-title-text">{{ related.title }}</h3>
              <time class="news-detail__related-date">{{ related.date }}</time>
            </div>
          </router-link>
        </div>
      </section>

      <!-- Schema.org Structured Data -->
      <script type="application/ld+json" v-html="articleSchema"></script>
    </article>
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useLanguage } from '../i18n'
import newsData from '../data/news.json'

const props = defineProps({
  slug: {
    type: String,
    required: true
  }
})

const route = useRoute()
const { t } = useLanguage()

const article = ref(null)
const isLoading = ref(true)

// Find article by slug
const findArticle = () => {
  const found = newsData.find(item => item.slug === props.slug)
  return found || null
}

// Format date
const formattedDate = computed(() => {
  if (!article.value?.date) return ''
  const date = new Date(article.value.date)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

// Category label
const categoryLabel = computed(() => {
  if (!article.value?.category) return ''
  const categoryMap = {
    'Company News': 'news.categories.company',
    'Industry Insights': 'news.categories.industry',
    'Technology Updates': 'news.categories.technology',
    'Events': 'news.categories.events'
  }
  const key = categoryMap[article.value.category]
  return key ? t(key) : article.value.category
})

// Related articles (same category, excluding current)
const relatedArticles = computed(() => {
  if (!article.value) return []
  return newsData
    .filter(item => item.category === article.value.category && item.id !== article.value.id)
    .slice(0, 3)
})

// Simple markdown renderer
const renderedContent = computed(() => {
  if (!article.value?.content) return ''

  let content = article.value.content

  // Escape HTML to prevent XSS
  content = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Headers
  content = content.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  content = content.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  content = content.replace(/^# (.+)$/gm, '<h1>$1</h1>')

  // Bold and Italic
  content = content.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  content = content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  content = content.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // Links
  content = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')

  // Blockquotes
  content = content.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')

  // Lists (basic support)
  content = content.replace(/^- (.+)$/gm, '<li>$1</li>')
  content = content.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')

  // Paragraphs (wrap text not in other elements)
  content = content.replace(/^(?!<[a-z])(.+)$/gm, '<p>$1</p>')

  // Clean up empty paragraphs
  content = content.replace(/<p><\/p>/g, '')

  return content
})

// Schema.org structured data
const articleSchema = computed(() => {
  if (!article.value) return ''

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.value.title,
    image: [article.value.image || ''],
    datePublished: article.value.date,
    dateModified: article.value.date,
    author: {
      '@type': 'Organization',
      name: article.value.author || 'KTech Team'
    },
    publisher: {
      '@type': 'Organization',
      name: 'KTech AI',
      logo: {
        '@type': 'ImageObject',
        url: 'https://jasonhou007.github.io/KTechAICyberWeb/logo.png'
      }
    },
    description: article.value.excerpt,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://jasonhou007.github.io/KTechAICyberWeb/news/${article.value.slug}`
    }
  }

  return JSON.stringify(schema)
})

// Share functionality
const handleShare = async () => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: article.value.title,
        text: article.value.excerpt,
        url: window.location.href
      })
    } catch (err) {
      // User cancelled or error
      console.log('Share error:', err)
    }
  } else {
    // Fallback: copy URL to clipboard
    navigator.clipboard.writeText(window.location.href)
    alert('Link copied to clipboard!')
  }
}

onMounted(() => {
  // Simulate loading delay
  setTimeout(() => {
    article.value = findArticle()
    isLoading.value = false

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, 200)
})
</script>

<style scoped>
.news-detail {
  max-width: 900px;
  margin: 0 auto;
  padding: 3rem 2rem;
  min-height: 100vh;
}

/* Breadcrumb */
.news-detail__breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.9rem;
  flex-wrap: wrap;
}

.news-detail__breadcrumb-link {
  color: #b0b0b0;
  text-decoration: none;
  transition: color 0.3s ease;
}

.news-detail__breadcrumb-link:hover,
.news-detail__breadcrumb-link:focus {
  color: #00f0ff;
}

.news-detail__breadcrumb-separator {
  color: rgba(0, 240, 255, 0.5);
}

.news-detail__breadcrumb-current {
  color: #00f0ff;
  font-weight: 500;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Loading State */
.news-detail__loading {
  animation: pulse 1.5s ease-in-out infinite;
}

.news-detail__skeleton-title {
  height: 2.5rem;
  background: linear-gradient(
    90deg,
    rgba(0, 240, 255, 0.1) 0%,
    rgba(0, 240, 255, 0.2) 50%,
    rgba(0, 240, 255, 0.1) 100%
  );
  background-size: 200% 100%;
  border-radius: 8px;
  margin-bottom: 1rem;
  animation: shimmer 1.5s ease-in-out infinite;
}

.news-detail__skeleton-meta {
  height: 1.5rem;
  width: 60%;
  background: linear-gradient(
    90deg,
    rgba(0, 240, 255, 0.1) 0%,
    rgba(0, 240, 255, 0.2) 50%,
    rgba(0, 240, 255, 0.1) 100%
  );
  background-size: 200% 100%;
  border-radius: 4px;
  margin-bottom: 2rem;
  animation: shimmer 1.5s ease-in-out infinite;
}

.news-detail__skeleton-image {
  height: 400px;
  background: linear-gradient(
    90deg,
    rgba(0, 240, 255, 0.1) 0%,
    rgba(0, 240, 255, 0.2) 50%,
    rgba(0, 240, 255, 0.1) 100%
  );
  background-size: 200% 100%;
  border-radius: 10px;
  margin-bottom: 2rem;
  animation: shimmer 1.5s ease-in-out infinite;
}

.news-detail__skeleton-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.news-detail__skeleton-line {
  height: 1rem;
  background: linear-gradient(
    90deg,
    rgba(0, 240, 255, 0.1) 0%,
    rgba(0, 240, 255, 0.2) 50%,
    rgba(0, 240, 255, 0.1) 100%
  );
  background-size: 200% 100%;
  border-radius: 4px;
  animation: shimmer 1.5s ease-in-out infinite;
}

.news-detail__skeleton-line:nth-child(2) {
  width: 80%;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* Not Found State */
.news-detail__not-found {
  text-align: center;
  padding: 4rem 2rem;
  background: rgba(26, 26, 46, 0.4);
  border: 1px solid rgba(0, 240, 255, 0.2);
  border-radius: 10px;
}

.news-detail__not-found-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.news-detail__not-found-title {
  font-family: 'Orbitron', monospace;
  font-size: 1.75rem;
  color: #e0e0e0;
  margin: 0 0 1rem 0;
}

.news-detail__not-found-text {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1.1rem;
  color: #b0b0b0;
  margin: 0 0 2rem 0;
}

.news-detail__not-found-link {
  display: inline-block;
  padding: 0.875rem 2rem;
  background: rgba(0, 240, 255, 0.1);
  border: 2px solid rgba(0, 240, 255, 0.4);
  border-radius: 6px;
  color: #00f0ff;
  text-decoration: none;
  font-family: 'Rajdhani', sans-serif;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  transition: all 0.3s ease;
}

.news-detail__not-found-link:hover,
.news-detail__not-found-link:focus {
  background: rgba(0, 240, 255, 0.2);
  border-color: rgba(0, 240, 255, 0.6);
  box-shadow: 0 0 20px rgba(0, 240, 255, 0.2);
}

/* Article */
.news-detail__article {
  background: rgba(26, 26, 46, 0.4);
  border: 1px solid rgba(0, 240, 255, 0.2);
  border-radius: 10px;
  padding: 2.5rem;
  overflow: hidden;
}

/* Header */
.news-detail__header {
  margin-bottom: 2rem;
}

.news-detail__category {
  display: inline-block;
  background: rgba(0, 240, 255, 0.1);
  border: 1px solid rgba(0, 240, 255, 0.3);
  color: #00f0ff;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.85rem;
  font-weight: 500;
  padding: 0.375rem 0.875rem;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 1rem;
}

.news-detail__title {
  font-family: 'Orbitron', monospace;
  font-size: 2rem;
  font-weight: 700;
  color: #e0e0e0;
  margin: 0 0 1rem 0;
  line-height: 1.3;
  letter-spacing: 0.05em;
}

.news-detail__meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.95rem;
  color: #b0b0b0;
}

.news-detail__date {
  color: #b0b0b0;
}

.news-detail__separator {
  color: rgba(0, 240, 255, 0.5);
}

.news-detail__author {
  color: #00f0ff;
}

/* Image */
.news-detail__figure {
  margin: 0 0 2rem 0;
  position: relative;
}

.news-detail__image {
  width: 100%;
  height: auto;
  max-height: 500px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid rgba(0, 240, 255, 0.2);
}

.news-detail__caption {
  margin-top: 0.75rem;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.9rem;
  color: #b0b0b0;
  text-align: center;
  font-style: italic;
}

/* Content */
.news-detail__content {
  margin-bottom: 2rem;
}

.news-detail__markdown {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1.05rem;
  line-height: 1.8;
  color: #e0e0e0;
}

.news-detail__markdown :deep(h1),
.news-detail__markdown :deep(h2),
.news-detail__markdown :deep(h3) {
  font-family: 'Orbitron', monospace;
  font-weight: 600;
  color: #e0e0e0;
  margin-top: 2rem;
  margin-bottom: 1rem;
}

.news-detail__markdown :deep(h1) {
  font-size: 1.75rem;
  border-bottom: 1px solid rgba(0, 240, 255, 0.3);
  padding-bottom: 0.5rem;
}

.news-detail__markdown :deep(h2) {
  font-size: 1.5rem;
}

.news-detail__markdown :deep(h3) {
  font-size: 1.25rem;
}

.news-detail__markdown :deep(p) {
  margin-bottom: 1rem;
}

.news-detail__markdown :deep(a) {
  color: #00f0ff;
  text-decoration: none;
  border-bottom: 1px solid rgba(0, 240, 255, 0.3);
  transition: all 0.3s ease;
}

.news-detail__markdown :deep(a:hover),
.news-detail__markdown :deep(a:focus) {
  border-bottom-color: #00f0ff;
  box-shadow: 0 2px 0 rgba(0, 240, 255, 0.2);
}

.news-detail__markdown :deep(strong) {
  color: #00f0ff;
  font-weight: 600;
}

.news-detail__markdown :deep(em) {
  font-style: italic;
}

.news-detail__markdown :deep(blockquote) {
  border-left: 4px solid #00f0ff;
  padding-left: 1.5rem;
  margin: 1.5rem 0;
  color: #b0b0b0;
  font-style: italic;
  background: rgba(0, 240, 255, 0.05);
  padding: 1rem 1.5rem;
  border-radius: 0 4px 4px 0;
}

.news-detail__markdown :deep(ul) {
  padding-left: 1.5rem;
  margin-bottom: 1rem;
}

.news-detail__markdown :deep(li) {
  margin-bottom: 0.5rem;
}

.news-detail__markdown :deep(li::marker) {
  color: #00f0ff;
}

/* Share */
.news-detail__share {
  margin-bottom: 2rem;
}

.news-detail__share-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: rgba(26, 26, 46, 0.6);
  border: 1px solid rgba(0, 240, 255, 0.3);
  border-radius: 6px;
  color: #e0e0e0;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.news-detail__share-button:hover,
.news-detail__share-button:focus {
  border-color: rgba(0, 240, 255, 0.6);
  box-shadow: 0 0 15px rgba(0, 240, 255, 0.2);
}

.news-detail__share-icon {
  font-size: 1.1rem;
}

/* Back */
.news-detail__back {
  margin-bottom: 3rem;
}

.news-detail__back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #00f0ff;
  text-decoration: none;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.95rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  transition: all 0.3s ease;
}

.news-detail__back-link:hover,
.news-detail__back-link:focus {
  color: #e0e0e0;
}

.news-detail__back-icon {
  font-size: 1.2rem;
  transition: transform 0.3s ease;
}

.news-detail__back-link:hover .news-detail__back-icon {
  transform: translateX(-4px);
}

/* Related Articles */
.news-detail__related {
  border-top: 1px solid rgba(0, 240, 255, 0.2);
  padding-top: 2rem;
}

.news-detail__related-title {
  font-family: 'Orbitron', monospace;
  font-size: 1.5rem;
  font-weight: 600;
  color: #e0e0e0;
  margin: 0 0 1.5rem 0;
  letter-spacing: 0.05em;
}

.news-detail__related-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.news-detail__related-card {
  display: flex;
  flex-direction: column;
  background: rgba(26, 26, 46, 0.6);
  border: 1px solid rgba(0, 240, 255, 0.2);
  border-radius: 8px;
  overflow: hidden;
  text-decoration: none;
  transition: all 0.3s ease;
}

.news-detail__related-card:hover,
.news-detail__related-card:focus {
  border-color: rgba(0, 240, 255, 0.5);
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 240, 255, 0.15);
}

.news-detail__related-image-wrapper {
  position: relative;
  height: 150px;
  overflow: hidden;
}

.news-detail__related-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.news-detail__related-card:hover .news-detail__related-image {
  transform: scale(1.05);
}

.news-detail__related-content {
  padding: 1rem;
}

.news-detail__related-title-text {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: #e0e0e0;
  margin: 0 0 0.5rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.news-detail__related-date {
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.85rem;
  color: #b0b0b0;
}

/* Responsive */
@media (max-width: 768px) {
  .news-detail {
    padding: 2rem 1.5rem;
  }

  .news-detail__article {
    padding: 1.5rem;
  }

  .news-detail__title {
    font-size: 1.5rem;
  }

  .news-detail__breadcrumb-current {
    max-width: 150px;
  }

  .news-detail__related-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .news-detail {
    padding: 1.5rem 1rem;
  }

  .news-detail__article {
    padding: 1rem;
  }

  .news-detail__title {
    font-size: 1.25rem;
  }

  .news-detail__markdown {
    font-size: 1rem;
  }
}
</style>
