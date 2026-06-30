<template>
  <a
    href="#main-content"
    class="skip-link"
    @click="handleClick"
  >
    {{ t('a11y.skipLink') }}
  </a>
</template>

<script setup>
import { useLanguage } from '../i18n'

const { t } = useLanguage()

const handleClick = (event) => {
  // Prevent default jump behavior
  event.preventDefault()

  // Find the main content element
  const mainContent = document.getElementById('main-content')
  if (mainContent) {
    // Set focus to the main content
    mainContent.tabIndex = -1
    mainContent.focus()

    // Remove tabindex after focus to avoid affecting normal tab order
    setTimeout(() => {
      mainContent.removeAttribute('tabindex')
    }, 100)
  }
}
</script>

<style scoped>
.skip-link {
  position: absolute;
  top: -100px;
  left: 0;
  padding: 1rem 2rem;
  background: var(--skip-link-bg, var(--bg-primary));
  color: var(--skip-link-text, var(--cyan));
  text-decoration: none;
  font-family: var(--font-body);
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  border: 2px solid var(--skip-link-border, var(--cyan));
  border-radius: 0 0 4px 0;
  z-index: 10000;
  transition: top 0.3s ease, box-shadow 0.3s ease;
  text-transform: uppercase;
}

.skip-link:hover {
  background: var(--skip-link-hover-bg, rgba(0, 255, 204, 0.1));
  box-shadow: 0 0 20px var(--skip-link-glow, rgba(0, 255, 204, 0.5));
}

.skip-link:focus {
  top: 0;
  outline: none;
  box-shadow: 0 0 20px var(--skip-link-glow, rgba(0, 255, 204, 0.5));
}

.skip-link:focus-visible {
  top: 0;
  outline: 2px solid var(--skip-link-outline, var(--cyan));
  outline-offset: -2px;
  box-shadow: 0 0 20px var(--skip-link-glow, rgba(0, 255, 204, 0.5));
}

/* Ensure high contrast for accessibility */
@media (prefers-contrast: high) {
  .skip-link {
    border-width: 3px;
    font-weight: 700;
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .skip-link {
    padding: 0.8rem 1.5rem;
    font-size: 0.9rem;
  }
}
</style>
