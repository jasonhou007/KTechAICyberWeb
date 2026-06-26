<template>
  <button
    class="theme-toggle"
    @click="handleClick"
    :aria-label="t('theme.toggle')"
    :title="t('theme.toggle')"
  >
    <span class="theme-icon">
      <span v-if="isDark" class="icon-moon">🌙</span>
      <span v-else class="icon-sun">☀️</span>
    </span>
    <span class="theme-text">{{ themeDisplay }}</span>
  </button>
</template>

<script setup>
import { useThemeStore } from '../stores/theme'
import { useLanguageStore } from '../stores/language'

const themeStore = useThemeStore()
const languageStore = useLanguageStore()

const { toggleTheme, isDark, themeDisplay, initTheme } = themeStore
const { t } = languageStore

// Initialize theme on component mount
initTheme()

// Handle click with error handling
function handleClick() {
  try {
    toggleTheme()
  } catch (error) {
    console.error('Error toggling theme:', error)
  }
}
</script>

<style scoped>
.theme-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(0, 240, 255, 0.1);
  border: 1px solid rgba(0, 240, 255, 0.3);
  border-radius: 5px;
  color: #00f0ff;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.theme-toggle:hover {
  background: rgba(0, 240, 255, 0.2);
  box-shadow: 0 0 15px rgba(0, 240, 255, 0.4);
  transform: scale(1.05);
}

.theme-toggle:focus-visible {
  outline: 2px solid #00f0ff;
  outline-offset: 2px;
}

.theme-icon {
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.icon-moon, .icon-sun {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: rotate(-180deg); }
  to { opacity: 1; transform: rotate(0); }
}

.theme-text {
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 600;
}

@media (max-width: 768px) {
  .theme-toggle {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }

  .theme-icon {
    font-size: 1rem;
  }
}
</style>
