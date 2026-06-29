<template>
  <button
    class="language-switcher"
    @click="toggleLanguage"
    :aria-label="t('language.switch')"
    title="Switch between English and Chinese"
  >
    <span class="lang-icon">🌐</span>
    <span class="lang-text">{{ languageDisplay }}</span>
  </button>
</template>

<script setup>
import { useLanguage } from '../composables/useLanguage'

const { languageDisplay, toggleLanguage, t, initLanguage } = useLanguage()

// Initialize language on component mount
initLanguage()
</script>

<style scoped>
.language-switcher {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(0, 240, 255, 0.1);
  border: 1px solid rgba(0, 240, 255, 0.3);
  border-radius: 5px;
  color: #00f0ff;
  font-family: var(--font-body);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.language-switcher:hover {
  background: rgba(0, 240, 255, 0.2);
  box-shadow: 0 0 15px rgba(0, 240, 255, 0.4);
  transform: scale(1.05);
}

.language-switcher:focus-visible {
  outline: 2px solid #00f0ff;
  outline-offset: 2px;
}

.lang-icon {
  font-size: 1.2rem;
  animation: rotate 20s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.lang-text {
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 600;
}

@media (max-width: 768px) {
  .language-switcher {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }

  .lang-icon {
    font-size: 1rem;
  }
}
</style>
