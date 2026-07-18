<template>
  <!-- Don't render if no articles -->
  <template v-if="articles.length > 0">
    <div
      ref="tickerRef"
      data-testid="news-ticker"
      class="news-ticker"
      :class="{
        'news-ticker--paused': isPaused,
        'news-ticker--static': isStatic,
        'news-ticker--mobile': isMobile
      }"
      :aria-label="t('news.ticker.label')"
      role="marquee"
      tabindex="0"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
      @click="handleClick"
      @keydown="handleKeydown"
    >
      <!-- Breaking/Latest Label -->
      <div
        data-testid="ticker-label"
        class="news-ticker__label"
        :class="labelClass"
        aria-hidden="true"
      >
        {{ t('news.ticker.breaking') }}
      </div>

      <!-- Scrolling Content -->
      <div
        data-testid="ticker-content"
        class="news-ticker__content"
        :class="{ 'news-ticker__content--paused': isPaused }"
      >
        <div class="news-ticker__track" :style="trackStyle">
          <!-- Articles duplicated for seamless loop -->
          <template v-for="(article, index) in duplicatedArticles" :key="`${article.id}-${index}`">
            <span
              data-testid="ticker-item"
              class="news-ticker__item"
              :class="itemClass"
            >
              {{ article.title }}
            </span>
            <span class="news-ticker__separator" aria-hidden="true">•</span>
          </template>
        </div>
      </div>

      <!-- Pause/Resume Indicator (for screen readers) -->
      <span
        class="news-ticker__status"
        :aria-live="isPaused ? 'polite' : 'off'"
        aria-atomic="true"
      >
        {{ isPaused ? t('news.ticker.pause') : '' }}
      </span>
    </div>
  </template>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useLanguage } from '../i18n'
import { useAmbientAnimation } from '../composables/useAmbientAnimation'

// ========== PROPS ==========
const props = defineProps({
  articles: {
    type: Array,
    default: () => []
  }
})

// ========== I18N ==========
const { t, currentLanguage } = useLanguage()

// ========== ANIMATION STATE ==========
const tickerRef = ref(null)
const manualPause = ref(false)

// Use ambient animation composable
const {
  target: animTarget,
  isPaused: animPaused,
  isStatic: animStatic,
  isPlaying: animPlaying,
  progress: animProgress,
  isMobile,
  startLoop: startAnimLoop,
  stopLoop: stopAnimLoop
} = useAmbientAnimation({
  loopDurationMs: 30000, // 30 seconds for full ticker loop
  mobileLoopDurationMs: 45000, // Slower on mobile
  reducedMotionFallback: true,
  enableThrottling: true
})

// Link tickerRef to animation target
watch(tickerRef, (newVal) => {
  if (newVal) {
    animTarget.value = newVal
  }
})

// Combined pause state (manual or animation-driven)
const isPaused = computed(() => manualPause.value || animPaused.value)
const isStatic = computed(() => animStatic.value)

// ========== COMPUTED ==========

// Duplicate articles for seamless scrolling loop
const duplicatedArticles = computed(() => {
  // Duplicate articles array 3 times for smooth infinite scroll
  return [...props.articles, ...props.articles, ...props.articles]
})

// Label styling based on language (cyan for EN, magenta for ZH)
const labelClass = computed(() => {
  const lang = currentLanguage.value
  return lang === 'zh' ? 'news-ticker__label--zh' : 'news-ticker__label--en'
})

// Item styling based on language
const itemClass = computed(() => {
  const lang = currentLanguage.value
  return lang === 'zh' ? 'news-ticker__item--zh' : 'news-ticker__item--en'
})

// Track position based on animation progress
const trackStyle = computed(() => {
  if (isStatic.value) {
    // Static mode: no scrolling
    return { transform: 'translateX(0)' }
  }

  // Calculate scroll position
  // progress: 0..1, map to 0..-100% (for one full cycle)
  const scrollPercent = animProgress.value * 100
  return {
    transform: `translateX(-${scrollPercent}%)`,
    willChange: 'transform'
  }
})

// ========== METHODS ==========

const handleMouseEnter = () => {
  manualPause.value = true
}

const handleMouseLeave = () => {
  manualPause.value = false
}

const handleClick = () => {
  manualPause.value = !manualPause.value
}

const handleKeydown = (event) => {
  // Space or Enter to toggle pause
  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault()
    manualPause.value = !manualPause.value
  }
}

// ========== LIFECYCLE ==========

onMounted(() => {
  // Start animation loop when component mounts
  if (!isStatic.value && animPlaying.value) {
    startAnimLoop()
  }
})

onUnmounted(() => {
  // Cleanup animation
  stopAnimLoop()
})
</script>

<style scoped>
.news-ticker {
  position: relative;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: var(--surface-elevated);
  border: 1px solid var(--accent-cyan-alpha-20);
  border-radius: var(--radius-md);
  margin-bottom: 2rem;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
}

.news-ticker:hover,
.news-ticker:focus-within {
  border-color: var(--accent-cyan-alpha-40);
  box-shadow: 0 0 15px var(--accent-cyan-alpha-15);
  outline: none;
}

.news-ticker:focus-visible {
  border-color: var(--cyan);
  box-shadow: 0 0 20px var(--accent-cyan-alpha-30);
  outline: 2px solid var(--cyan);
  outline-offset: 2px;
}

/* Label styling with neon glow */
.news-ticker__label {
  flex-shrink: 0;
  padding: 0.375rem 0.875rem;
  font-family: var(--font-display);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  border-radius: var(--radius-sm);
  animation: labelPulse 2s ease-in-out infinite;
}

.news-ticker__label--en {
  color: var(--cyan);
  background: var(--accent-cyan-alpha-10);
  border: 1px solid var(--accent-cyan-alpha-30);
  text-shadow: 0 0 10px var(--accent-cyan-alpha-50);
}

.news-ticker__label--zh {
  color: var(--magenta);
  background: var(--accent-magenta-alpha-10);
  border: 1px solid var(--accent-magenta-alpha-30);
  text-shadow: 0 0 10px var(--accent-magenta-alpha-50);
}

/* Scrolling content area */
.news-ticker__content {
  flex: 1;
  overflow: hidden;
  position: relative;
  height: 1.5rem;
  mask-image: linear-gradient(
    to right,
    transparent 0%,
    black 5%,
    black 95%,
    transparent 100%
  );
  -webkit-mask-image: linear-gradient(
    to right,
    transparent 0%,
    black 5%,
    black 95%,
    transparent 100%
  );
}

/* Track with GPU-accelerated transform */
.news-ticker__track {
  display: flex;
  align-items: center;
  white-space: nowrap;
  will-change: transform;
  transition: transform 0.1s linear;
}

/* Pause state */
.news-ticker__content--paused .news-ticker__track {
  transition: transform 0.3s ease-out;
}

/* Static state (reduced motion) */
.news-ticker--static .news-ticker__track {
  transform: translateX(0) !important;
  transition: none;
}

/* Individual news items */
.news-ticker__item {
  display: inline-block;
  font-family: var(--font-body);
  font-size: 0.9rem;
  font-weight: 500;
  padding: 0 1rem;
  color: var(--text-primary);
  transition: color 0.3s ease;
}

.news-ticker__item--en {
  color: var(--text-primary);
}

.news-ticker__item--zh {
  color: var(--text-primary);
}

.news-ticker:hover .news-ticker__item {
  color: var(--cyan);
}

.news-ticker--paused .news-ticker__item {
  color: var(--text-caption);
}

/* Separator */
.news-ticker__separator {
  color: var(--accent-cyan-alpha-40);
  font-size: 1rem;
  margin: 0 0.5rem;
}

/* Status announcement for screen readers */
.news-ticker__status {
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

/* Label pulse animation */
@keyframes labelPulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

/* Glitch effect on label transitions (subtle, < 3Hz) */
.news-ticker__label--en::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(0, 255, 255, 0.1) 50%,
    transparent 100%
  );
  animation: glitchScan 3s ease-in-out infinite;
  pointer-events: none;
}

@keyframes glitchScan {
  0%, 100% {
    opacity: 0;
    transform: translateX(-100%);
  }
  50% {
    opacity: 1;
    transform: translateX(100%);
  }
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .news-ticker {
    padding: 0.625rem 0.75rem;
    margin-bottom: 1.5rem;
  }

  .news-ticker__label {
    font-size: 0.65rem;
    padding: 0.3rem 0.6rem;
  }

  .news-ticker__item {
    font-size: 0.8rem;
    padding: 0 0.75rem;
  }

  .news-ticker__content {
    height: 1.25rem;
  }
}

/* Prefers reduced motion */
@media (prefers-reduced-motion: reduce) {
  .news-ticker__label {
    animation: none;
  }

  .news-ticker__label--en::before {
    display: none;
  }

  .news-ticker__track {
    transition: none;
  }

  .news-ticker:hover .news-ticker__item {
    transition: none;
  }
}
</style>
