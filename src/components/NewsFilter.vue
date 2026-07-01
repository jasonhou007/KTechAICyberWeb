<template>
  <div class="news-filter" role="region" :aria-label="t('news.filter')">
    <h2 id="filter-heading" class="sr-only">{{ t('news.filter') }}</h2>
    <div class="news-filter__buttons" role="group" aria-labelledby="filter-heading">
      <button
        v-for="category in categories"
        :key="category.key"
        class="news-filter__button"
        :class="{ 'news-filter__button--active': isSelected(category.key) }"
        :aria-label="`Filter by ${category.label}`"
        :aria-pressed="isSelected(category.key)"
        @click="selectCategory(category.key)"
      >
        {{ category.label }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useLanguage } from '../i18n'

const props = defineProps({
  selectedCategory: {
    type: String,
    default: 'All'
  }
})

const emit = defineEmits(['filter-change'])

const { t } = useLanguage()

const categories = computed(() => [
  { key: 'All', label: t('news.categories.all') },
  { key: 'Company News', label: t('news.categories.company') },
  { key: 'Industry Insights', label: t('news.categories.industry') },
  { key: 'Technology Updates', label: t('news.categories.technology') },
  { key: 'Events', label: t('news.categories.events') }
])

const isSelected = (category) => props.selectedCategory === category

const selectCategory = (category) => {
  emit('filter-change', category)
}
</script>

<style scoped>
.news-filter {
  margin-bottom: 2rem;
}

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

.news-filter__buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: center;
}

.news-filter__button {
  font-family: var(--font-body);
  font-size: 0.95rem;
  font-weight: 500;
  padding: 0.625rem 1.25rem;
  background: var(--surface-elevated);
  border: 1px solid var(--accent-cyan-alpha-30);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.news-filter__button:hover,
.news-filter__button:focus {
  border-color: var(--accent-cyan-alpha-60);
  box-shadow: 0 0 15px var(--accent-cyan-alpha-20);
  transform: translateY(-2px);
}

.news-filter__button:focus {
  outline: 2px solid var(--accent-cyan-alpha-50);
  outline-offset: 2px;
}

.news-filter__button--active {
  background: var(--accent-cyan-alpha-20);
  border-color: var(--accent-cyan-alpha-60);
  color: var(--cyan);
  box-shadow: var(--shadow-glow-cyan);
}

.news-filter__button--active::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    var(--accent-cyan-alpha-10) 0%,
    transparent 100%
  );
  pointer-events: none;
}

/* Responsive */
@media (max-width: 768px) {
  .news-filter__buttons {
    gap: 0.5rem;
  }

  .news-filter__button {
    font-size: 0.85rem;
    padding: 0.5rem 1rem;
  }
}

@media (max-width: 480px) {
  .news-filter__buttons {
    justify-content: flex-start;
  }

  .news-filter__button {
    flex: 1 1 calc(50% - 0.25rem);
    min-width: 0;
  }
}
</style>
