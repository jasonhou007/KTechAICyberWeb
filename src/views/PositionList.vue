<template>
  <div class="position-list">
    <!-- Breadcrumb -->
    <nav class="position-list__breadcrumb" aria-label="Breadcrumb">
      <router-link to="/" class="breadcrumb-link">{{ t('nav.home') }}</router-link>
      <span class="breadcrumb-separator">›</span>
      <router-link to="/join-us" class="breadcrumb-link">Join Us</router-link>
      <span class="breadcrumb-separator">›</span>
      <span class="breadcrumb-current">{{ t('positions.title') }}</span>
    </nav>

    <!-- Header -->
    <section class="position-list__header">
      <h1 class="position-list__title">{{ t('positions.title') }}</h1>
      <p class="position-list__title-accent">{{ t('positions.subtitle') }}</p>
    </section>

    <!-- Career Path Ambient Visualization -->
    <CareerPathAmbient :positions="filteredPositions" />

    <!-- Main Content -->
    <div class="position-list__main">
      <!-- Filters Sidebar -->
      <aside class="position-list__filters">
        <div class="filter-section">
          <h2 class="filter-title">{{ t('positions.filters.title') }}</h2>

          <!-- Search -->
          <div class="filter-search">
            <label for="search-input">{{ t('positions.searchPlaceholder') }}</label>
            <input
              id="search-input"
              type="text"
              v-model="searchQuery"
              :placeholder="t('positions.searchPlaceholder')"
            />
          </div>

          <!-- Department Filter -->
          <div class="filter-group">
            <label for="department-select">{{ t('positions.filters.department') }}</label>
            <select id="department-select" v-model="selectedDepartment">
              <option v-for="dept in departments" :key="dept.value" :value="dept.value">
                {{ dept.label }}
              </option>
            </select>
          </div>

          <!-- Location Filter -->
          <div class="filter-group">
            <label for="location-select">{{ t('positions.filters.location') }}</label>
            <select id="location-select" v-model="selectedLocation">
              <option v-for="loc in locations" :key="loc.value" :value="loc.value">
                {{ loc.label }}
              </option>
            </select>
          </div>

          <!-- Type Filter -->
          <div class="filter-group">
            <label for="type-select">{{ t('positions.filters.type') }}</label>
            <select id="type-select" v-model="selectedType">
              <option v-for="type in employmentTypes" :key="type.value" :value="type.value">
                {{ type.label }}
              </option>
            </select>
          </div>

          <!-- Active Filters -->
          <div v-if="hasActiveFilters" class="filter-active">
            <span>{{ filteredPositions.length }} {{ t('positions.filters.activeFilters') }}</span>
            <button class="filter-clear" @click="clearAllFilters">
              {{ t('positions.filters.clearAll') }}
            </button>
          </div>
        </div>
      </aside>

      <!-- Positions Grid -->
      <main class="position-list__content">
        <div v-if="filteredPositions.length > 0" class="position-list__grid" role="list">
          <div
            v-for="position in filteredPositions"
            :key="position.id"
            class="position-card"
            role="listitem"
          >
            <h3 class="position-card__title">{{ displayTitle(position) }}</h3>
            
            <div class="position-card__meta">
              <div class="position-card__meta-item">
                {{ getDepartmentLabel(position.department) }}
              </div>
              <div class="position-card__meta-item">
                <span class="position-card__icon">📍</span>
                {{ getLocationLabel(position.location) }}
              </div>
              <div class="position-card__meta-item">
                {{ t('positions.cards.posted') }} {{ formatDate(position.postedDate) }}
              </div>
            </div>

            <p class="position-card__description">
              {{ truncateDescription(position.description[currentLanguage]) }}
            </p>

            <div class="position-card__footer">
              <div class="position-card__salary">{{ position.salary[currentLanguage] }}</div>
              <span class="position-card__badge">{{ position.type.toUpperCase() }}</span>
            </div>

            <button
              class="position-card__action"
              :aria-label="`${t('positions.cards.viewDetails')} - ${displayTitle(position)}`"
              @click="openPositionDetail(position)"
            >
              {{ t('positions.cards.viewDetails') }}
            </button>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="position-list__empty" role="status" aria-live="polite">
          <div class="empty-icon">🔍</div>
          <h3 class="empty-title">
            {{ positions.length === 0 ? t('positions.empty.noPositions') : t('positions.empty.title') }}
          </h3>
          <p v-if="hasActiveFilters" class="empty-message">
            {{ t('positions.empty.message') }}
          </p>
          <button v-if="hasActiveFilters" class="empty-action" @click="clearAllFilters">
            {{ t('positions.filters.clearAll') }}
          </button>
        </div>
      </main>
    </div>

    <!-- Position Detail Modal -->
    <div v-if="selectedPosition" class="position-modal" role="dialog" aria-modal="true">
      <div class="position-modal__overlay" @click="closePositionDetail"></div>
      <div class="position-modal__container">
        <button
          class="position-modal__close"
          :aria-label="t('positions.detail.backToList')"
          @click="closePositionDetail"
        >
          ✕
        </button>

        <div class="position-modal__content">
          <h2 class="position-modal__title">{{ displayTitle(selectedPosition) }}</h2>

          <div class="position-modal__meta">
            <span>{{ getDepartmentLabel(selectedPosition.department) }}</span>
            <span>•</span>
            <span>{{ getLocationLabel(selectedPosition.location) }}</span>
            <span>•</span>
            <span>{{ selectedPosition.salary[currentLanguage] }}</span>
          </div>

          <section class="position-modal__section">
            <h3>{{ t('positions.detail.description') }}</h3>
            <p>{{ selectedPosition.description[currentLanguage] }}</p>
          </section>

          <section class="position-modal__section">
            <h3>{{ t('positions.detail.responsibilities') }}</h3>
            <ul class="position-modal__list">
              <li v-for="(item, idx) in selectedPosition.responsibilities[currentLanguage]" :key="idx">
                {{ item }}
              </li>
            </ul>
          </section>

          <section class="position-modal__section">
            <h3>{{ t('positions.detail.requirements') }}</h3>
            <ul class="position-modal__list">
              <li v-for="(item, idx) in selectedPosition.requirements[currentLanguage]" :key="idx">
                {{ item }}
              </li>
            </ul>
          </section>

          <section class="position-modal__section">
            <h3>{{ t('positions.detail.benefits') }}</h3>
            <ul class="position-modal__list">
              <li v-for="(item, idx) in selectedPosition.benefits[currentLanguage]" :key="idx">
                {{ item }}
              </li>
            </ul>
          </section>

          <section class="position-modal__section">
            <h3>{{ t('positions.detail.culture') }}</h3>
            <p>{{ selectedPosition.culture[currentLanguage] }}</p>
          </section>

          <div class="position-modal__actions">
            <button class="position-modal__apply">{{ t('positions.detail.applyNow') }}</button>
            <button class="position-modal__share">{{ t('positions.detail.share') }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useLanguage } from '../composables/useLanguage'
import CareerPathAmbient from '../components/CareerPathAmbient.vue'

// Load positions data
const positions = ref([])

// Composable
const { t, currentLanguage } = useLanguage()

// Filter state
const searchQuery = ref('')
const selectedDepartment = ref('')
const selectedLocation = ref('')
const selectedType = ref('')
const selectedPosition = ref(null)

// Department options
const departments = computed(() => [
  { value: '', label: t('positions.departments.all') },
  { value: 'engineering', label: t('positions.departments.engineering') },
  { value: 'product', label: t('positions.departments.product') },
  { value: 'design', label: t('positions.departments.design') },
  { value: 'marketing', label: t('positions.departments.marketing') },
  { value: 'sales', label: t('positions.departments.sales') }
])

// Location options
const locations = computed(() => [
  { value: '', label: t('positions.locations.all') },
  { value: 'bangkok', label: t('positions.locations.bangkok') },
  { value: 'shanghai', label: t('positions.locations.shanghai') },
  { value: 'beijing', label: t('positions.locations.beijing') },
  { value: 'remote', label: t('positions.locations.remote') }
])

// Employment type options
const employmentTypes = computed(() => [
  { value: '', label: t('positions.types.all') },
  { value: 'fulltime', label: t('positions.types.fulltime') },
  { value: 'parttime', label: t('positions.types.parttime') },
  { value: 'contract', label: t('positions.types.contract') },
  { value: 'internship', label: t('positions.types.internship') }
])

// Has active filters
const hasActiveFilters = computed(() => {
  return searchQuery.value !== '' ||
         selectedDepartment.value !== '' ||
         selectedLocation.value !== '' ||
         selectedType.value !== ''
})

// Filter positions
const filteredPositions = computed(() => {
  return positions.value.filter(position => {
    const matchesSearch = searchQuery.value === '' ||
      position.title[currentLanguage.value].toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      position.title['en'].toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (position.title['zh'] && position.title['zh'].toLowerCase().includes(searchQuery.value.toLowerCase()))

    const matchesDepartment = selectedDepartment.value === '' || position.department === selectedDepartment.value
    const matchesLocation = selectedLocation.value === '' || position.location === selectedLocation.value
    const matchesType = selectedType.value === '' || position.type === selectedType.value

    return matchesSearch && matchesDepartment && matchesLocation && matchesType
  })
})

// Helper functions
const displayTitle = (position) => position.title[currentLanguage.value]

const getDepartmentLabel = (dept) => {
  const labels = {
    engineering: 'Engineering',
    product: 'Product',
    design: 'Design',
    marketing: 'Marketing',
    sales: 'Sales'
  }
  return labels[dept] || dept
}

const getLocationLabel = (loc) => {
  const labels = {
    bangkok: 'Bangkok',
    shanghai: 'Shanghai',
    beijing: 'Beijing',
    remote: 'Remote'
  }
  return labels[loc] || loc
}

const getTypeLabel = (type) => {
  const labels = {
    fulltime: 'Full-time',
    parttime: 'Part-time',
    contract: 'Contract',
    internship: 'Internship'
  }
  return labels[type] || type
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const truncateDescription = (text) => {
  return text.length > 120 ? text.substring(0, 120) + '...' : text
}

const clearAllFilters = () => {
  searchQuery.value = ''
  selectedDepartment.value = ''
  selectedLocation.value = ''
  selectedType.value = ''
}

const openPositionDetail = (position) => {
  selectedPosition.value = position
  document.body.style.overflow = 'hidden'
}

const closePositionDetail = () => {
  selectedPosition.value = null
  document.body.style.overflow = ''
}

// Load positions on mount
onMounted(async () => {
  try {
    const { default: positionData } = await import('../data/positions.json')
    positions.value = positionData
  } catch (error) {
    console.error('Failed to load positions:', error)
    positions.value = []
  }
})

onUnmounted(() => {
  if (selectedPosition.value) {
    document.body.style.overflow = ''
  }
})
</script>

<style scoped>
.position-list {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--accent-cyan-alpha-05) 0%, rgba(255, 0, 170, 0.05) 100%);
  padding: 2rem 5%;
}

/* Breadcrumb */
.position-list__breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 0;
  margin-bottom: 2rem;
  font-family: var(--font-body);
  font-size: 0.9rem;
}

.breadcrumb-link {
  color: var(--cyan);
  text-decoration: none;
  transition: text-shadow 0.3s ease;
}

.breadcrumb-link:hover {
  text-shadow: 0 0 10px var(--accent-cyan-alpha-80);
}

.breadcrumb-separator {
  color: var(--text-caption);
}

.breadcrumb-current {
  color: var(--text-primary);
}

/* Header */
.position-list__header {
  text-align: center;
  margin-bottom: 3rem;
}

.position-list__title {
  font-family: var(--font-display);
  font-size: 3rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 0.2em;
  margin-bottom: 0.5rem;
}

.position-list__title-accent {
  font-family: var(--font-body);
  font-size: 1.2rem;
  color: var(--cyan);
  text-transform: uppercase;
  letter-spacing: 0.3em;
}

/* Main Layout */
.position-list__main {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 3rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* Filters */
.position-list__filters {
  position: sticky;
  top: 2rem;
  height: fit-content;
}

.filter-section {
  background: var(--accent-cyan-alpha-05);
  border: 1px solid var(--accent-cyan-alpha-20);
  padding: 2rem;
  border-radius: var(--radius-md);
}

.filter-title {
  font-family: var(--font-display);
  font-size: 1.2rem;
  color: var(--cyan);
  letter-spacing: 0.15em;
  margin-bottom: 1.5rem;
}

.filter-search {
  margin-bottom: 1.5rem;
}

.filter-search label {
  display: block;
  font-family: var(--font-body);
  color: var(--text-list-label);
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.filter-search input {
  width: 100%;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid var(--accent-cyan-alpha-30);
  color: var(--text-primary);
  font-family: var(--font-body);
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.filter-search input:focus {
  outline: none;
  border-color: var(--cyan);
  box-shadow: 0 0 10px var(--accent-cyan-alpha-50);
}

.filter-group {
  margin-bottom: 1.5rem;
}

.filter-group label {
  display: block;
  font-family: var(--font-body);
  color: var(--text-list-label);
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.filter-group select {
  width: 100%;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid var(--accent-cyan-alpha-30);
  color: var(--text-primary);
  font-family: var(--font-body);
  transition: border-color 0.3s ease;
}

.filter-group select:focus {
  outline: none;
  border-color: var(--cyan);
}

.filter-active {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid var(--accent-cyan-alpha-20);
  font-family: var(--font-body);
  font-size: 0.9rem;
  color: var(--text-list-label);
}

.filter-clear {
  padding: 0.5rem 1rem;
  background: var(--accent-cyan-alpha-10);
  border: 1px solid var(--accent-cyan-alpha-30);
  color: var(--cyan);
  font-family: var(--font-body);
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-clear:hover {
  background: var(--accent-cyan-alpha-20);
  box-shadow: 0 0 10px var(--accent-cyan-alpha-50);
}

/* Positions Grid */
.position-list__content {
  min-height: 500px;
}

.position-list__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 2rem;
}

/* Position Card */
.position-card {
  background: var(--accent-cyan-alpha-05);
  border: 1px solid var(--accent-cyan-alpha-20);
  padding: 2rem;
  border-radius: var(--radius-md);
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
  cursor: pointer;
}

.position-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px var(--accent-cyan-alpha-20);
  border-color: var(--cyan);
}

.position-card__title {
  font-family: var(--font-display);
  font-size: 1.3rem;
  color: var(--text-primary);
  letter-spacing: 0.1em;
  margin-bottom: 1rem;
}

.position-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
}

.position-card__meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-body);
  font-size: 0.9rem;
  color: var(--text-timestamp);
}

.position-card__icon {
  font-size: 0.8rem;
}

.position-card__description {
  font-family: var(--font-body);
  font-size: 1rem;
  line-height: 1.6;
  color: var(--text-card-meta);
  margin-bottom: 1.5rem;
}

.position-card__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.position-card__salary {
  font-family: var(--font-display);
  font-size: 1.1rem;
  color: var(--cyan);
}

.position-card__badge {
  padding: 0.3rem 0.8rem;
  background: var(--bg-primary);   /* #310: was a 20% magenta tint composited over the card, which made the painted bg luminance depend on whatever sat behind it and dropped contrast to ~2.25:1 (magenta-on-magenta) / a CI-flaky 4.12:1 with light text. A fully OPAQUE dark background (--bg-primary #0a0a0a) makes the ratio deterministic: magenta #ff00aa on #0a0a0a = 5.5:1, WCAG AA 4.5:1 with ~1.0 margin. The magenta border keeps the chip's brand accent. */
  border: 1px solid var(--accent-magenta-alpha-40);
  color: var(--accent-magenta);
  font-family: var(--font-body);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.position-card__action {
  width: 100%;
  padding: 0.8rem;
  background: transparent;
  border: 1px solid var(--accent-cyan-alpha-40);
  color: var(--cyan);
  font-family: var(--font-display);
  font-size: 0.9rem;
  letter-spacing: 0.15em;
  cursor: pointer;
  transition: all 0.3s ease;
}

.position-card__action:hover {
  background: var(--accent-cyan-alpha-10);
  box-shadow: 0 0 15px var(--accent-cyan-alpha-50);
}

/* Empty State */
.position-list__empty {
  text-align: center;
  padding: 4rem 2rem;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-title {
  font-family: var(--font-display);
  font-size: 1.5rem;
  color: var(--text-primary);
  letter-spacing: 0.1em;
  margin-bottom: 1rem;
}

.empty-message {
  font-family: var(--font-body);
  font-size: 1rem;
  color: var(--text-caption);
  margin-bottom: 2rem;
}

.empty-action {
  padding: 0.8rem 2rem;
  background: var(--accent-cyan-alpha-10);
  border: 1px solid var(--accent-cyan-alpha-40);
  color: var(--cyan);
  font-family: var(--font-display);
  font-size: 0.9rem;
  letter-spacing: 0.15em;
  cursor: pointer;
  transition: all 0.3s ease;
}

.empty-action:hover {
  background: var(--accent-cyan-alpha-20);
  box-shadow: 0 0 15px var(--accent-cyan-alpha-50);
}

/* Modal */
.position-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.position-modal__overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
}

.position-modal__container {
  position: relative;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  background: rgba(10, 10, 20, 0.95);
  border: 1px solid var(--accent-cyan-alpha-30);
  border-radius: var(--radius-lg);
}

.position-modal__close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 40px;
  height: 40px;
  background: var(--accent-cyan-alpha-10);
  border: 1px solid var(--accent-cyan-alpha-30);
  color: var(--cyan);
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 1;
}

.position-modal__close:hover {
  background: var(--accent-cyan-alpha-20);
  box-shadow: 0 0 10px var(--accent-cyan-alpha-50);
}

.position-modal__content {
  padding: 3rem;
}

.position-modal__title {
  font-family: var(--font-display);
  font-size: 2rem;
  color: var(--text-primary);
  letter-spacing: 0.15em;
  margin-bottom: 1rem;
}

.position-modal__meta {
  display: flex;
  gap: 1rem;
  font-family: var(--font-body);
  font-size: 0.9rem;
  color: var(--text-timestamp);
  margin-bottom: 2rem;
}

.position-modal__section {
  margin-bottom: 2rem;
}

.position-modal__section h3 {
  font-family: var(--font-display);
  font-size: 1.2rem;
  color: var(--cyan);
  letter-spacing: 0.1em;
  margin-bottom: 1rem;
}

.position-modal__section p {
  font-family: var(--font-body);
  font-size: 1rem;
  line-height: 1.8;
  color: var(--text-card-meta);
}

.position-modal__list {
  list-style: none;
  padding: 0;
}

.position-modal__list li {
  position: relative;
  padding-left: 1.5rem;
  margin-bottom: 0.5rem;
  font-family: var(--font-body);
  font-size: 1rem;
  line-height: 1.6;
  color: var(--text-caption);
}

.position-modal__list li::before {
  content: '▸';
  position: absolute;
  left: 0;
  color: var(--cyan);
}

.position-modal__actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.position-modal__apply,
.position-modal__share {
  flex: 1;
  padding: 1rem;
  font-family: var(--font-display);
  font-size: 0.9rem;
  letter-spacing: 0.15em;
  cursor: pointer;
  transition: all 0.3s ease;
}

.position-modal__apply {
  background: var(--accent-cyan-alpha-10);
  border: 1px solid var(--accent-cyan-alpha-40);
  color: var(--cyan);
}

.position-modal__apply:hover {
  background: var(--accent-cyan-alpha-20);
  box-shadow: 0 0 15px var(--accent-cyan-alpha-50);
}

.position-modal__share {
  background: transparent;
  border: 1px solid var(--accent-magenta-alpha-40);
  color: var(--accent-magenta);
}

.position-modal__share:hover {
  background: var(--accent-magenta-alpha-10);
  box-shadow: 0 0 15px var(--accent-magenta-alpha-50);
}

/* Responsive */
@media (max-width: 1024px) {
  .position-list__main {
    grid-template-columns: 1fr;
  }

  .position-list__filters {
    position: static;
  }

  .position-list__grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}

@media (max-width: 768px) {
  .position-list {
    padding: 1rem 5%;
  }

  .position-list__title {
    font-size: 2rem;
  }

  .position-list__grid {
    grid-template-columns: 1fr;
  }

  .position-modal__content {
    padding: 2rem 1.5rem;
  }
}
</style>
