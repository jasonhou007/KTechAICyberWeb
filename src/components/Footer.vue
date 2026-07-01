<template>
  <footer class="footer">
    <div class="footer-text">{{ t('footer.companyName') }}</div>
    <div class="footer-copyright">{{ t('footer.copyright') }}</div>
  </footer>
</template>

<script setup>
/**
 * @component Footer
 * @description Site footer with company name and copyright
 *
 * @example
 * <Footer />
 */

import { useLanguage } from '../composables/useLanguage'

// Shared i18n — text follows the site-wide language toggle (en/zh).
const { t } = useLanguage()
</script>

<style scoped>
.footer {
  padding: 3rem 8%;
  background: var(--surface-card);
  border-top: 1px solid var(--accent-cyan-alpha-20);
  text-align: center;
}

.footer-text {
  color: var(--text-primary);
  font-size: 1rem;
  font-family: var(--font-display);
}

.footer-copyright {
  margin-top: 1rem;
  color: var(--text-secondary);
  font-size: 0.8rem;
}

@media (max-width: 768px) {
  .footer {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}
</style>
