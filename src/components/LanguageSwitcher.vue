<template>
  <button
    class="language-switcher"
    @click="handleToggle"
    :aria-label="t('language.switch')"
    :title="currentLanguageName"
  >
    <span class="lang-icon">🌐</span>
    <span class="lang-text">{{ currentLangDisplay }}</span>
    <span class="lang-arrow">▼</span>
  </button>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useLanguage, initLanguage } from '../i18n'

// Initialize language on mount
onMounted(() => {
  initLanguage()
})

const { lang, setLanguage, toggleLanguage, t, availableLanguages, isLoaded, loadCurrentTranslations } = useLanguage()

// Load translations on component mount
onMounted(async () => {
  await loadCurrentTranslations()
})

// Get current language display name
const currentLangDisplay = computed(() => {
  const currentLangObj = availableLanguages.find(l => l.code === lang.value)
  return currentLangObj ? currentLangObj.code.toUpperCase() : 'EN'
})

// Get full language name for title
const currentLanguageName = computed(() => {
  const currentLangObj = availableLanguages.find(l => l.code === lang.value)
  return currentLangObj ? `${t('language.switch')}: ${currentLangObj.nativeName}` : t('language.switch')
})

// Handle language toggle
const handleToggle = async () => {
  const nextLang = toggleLanguage()
  await setLanguage(nextLang)
}
</script>

<style scoped>
.language-switcher {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(0, 240, 255, 0.1);
  border: 1px solid rgba(0, 240, 255, 0.3);
  border-radius: 4px;
  color: #00f0ff;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.language-switcher:hover {
  background: rgba(0, 240, 255, 0.2);
  border-color: rgba(0, 240, 255, 0.5);
  box-shadow: 0 0 15px rgba(0, 240, 255, 0.3);
  transform: translateY(-1px);
}

.language-switcher:active {
  transform: translateY(0);
}

.lang-icon {
  font-size: 1rem;
  animation: rotate 10s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.lang-text {
  min-width: 2rem;
  text-align: center;
}

.lang-arrow {
  font-size: 0.6rem;
  opacity: 0.7;
  transition: transform 0.3s ease;
}

.language-switcher:hover .lang-arrow {
  transform: rotate(180deg);
  opacity: 1;
}

/* Cyberpunk glow effect */
.language-switcher::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent,
    rgba(0, 240, 255, 0.1),
    transparent
  );
  transform: rotate(45deg);
  animation: shine 3s ease-in-out infinite;
}

@keyframes shine {
  0% { transform: translateX(-100%) rotate(45deg); }
  100% { transform: translateX(100%) rotate(45deg); }
}

/* Focus styles for accessibility */
.language-switcher:focus-visible {
  outline: 2px solid #00f0ff;
  outline-offset: 2px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .language-switcher {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }

  .lang-text {
    min-width: 1.5rem;
  }
}
</style>
