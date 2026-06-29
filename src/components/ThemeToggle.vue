<template>
  <button
    type="button"
    class="theme-toggle"
    :aria-label="t('theme.toggle')"
    :aria-pressed="isLight ? 'true' : 'false'"
    :title="isLight ? t('theme.light') : t('theme.dark')"
    @click="handleToggle"
  >
    <span class="theme-icon" aria-hidden="true">{{ icon }}</span>
    <span class="theme-label">{{ label }}</span>
  </button>
</template>

<script setup>
/**
 * @component ThemeToggle
 * @description Dark/light theme toggle button (#15 - FEAT-005).
 *
 * Reads the active theme from usePreferencesStore and calls toggleTheme on
 * click. The preference persists across sessions (the store writes to
 * localStorage). aria-pressed announces the current theme to assistive tech,
 * and the icon/label indicate the theme the user will switch TO.
 */

import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useLanguage } from '../composables/useLanguage'
import { usePreferencesStore } from '../stores/preferences'

const { t } = useLanguage()
const preferences = usePreferencesStore()
const { theme } = storeToRefs(preferences)

// The toggle reflects what the user will switch TO: in dark mode it shows the
// light affordance, and vice-versa.
const isLight = computed(() => theme.value === 'light')
const icon = computed(() => (isLight.value ? '☾' : '☀'))
const label = computed(() =>
  isLight.value ? t('theme.darkLabel') : t('theme.lightLabel'),
)

const handleToggle = () => {
  preferences.toggleTheme()
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
  color: var(--neon-blue, #00f0ff);
  font-family: var(--font-body);
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
  outline: 2px solid var(--neon-blue, #00f0ff);
  outline-offset: 2px;
}

.theme-icon {
  font-size: 1.2rem;
}

.theme-label {
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
