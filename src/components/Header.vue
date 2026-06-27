<template>
  <nav class="nav" :class="{ 'scrolled': isScrolled }" id="navbar">
    <a href="#" class="nav-logo">
      KAI<span class="accent">TECH</span>
    </a>
    <ul class="nav-links">
      <li><a href="#services">{{ t('nav.services') }}</a></li>
      <li><a href="#honors">{{ t('nav.honors') }}</a></li>
      <li><a href="#contact">{{ t('nav.contact') }}</a></li>
    </ul>
  </nav>
</template>

<script setup>
/**
 * @component Header
 * @description Main navigation header with scroll-aware styling
 *
 * @example
 * <Header />
 */

import { ref, onMounted, onUnmounted } from 'vue'

// State
const isScrolled = ref(false)

// Translations (can be extended for i18n)
const t = (key) => {
  const translations = {
    'nav.services': '服务',
    'nav.honors': '荣誉',
    'nav.contact': '联系'
  }
  return translations[key] || key
}

// Handle scroll event
const handleScroll = () => {
  isScrolled.value = window.scrollY > 50
}

// Lifecycle
onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.nav {
  position: fixed;
  inset: 0 auto auto 0;
  right: 0;
  top: 0;
  z-index: var(--z-nav);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 4rem;
  background: rgba(10, 15, 28, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 255, 204, 0.2);
  transition: all 0.3s ease;
}

.nav.scrolled {
  padding: 1rem 4rem;
  box-shadow: 0 4px 20px rgba(0, 255, 204, 0.1);
}

.nav-logo {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 0.1em;
  text-decoration: none;
  transition: color 0.3s ease;
  text-shadow: 0 0 10px transparent;
}

.nav-logo:hover {
  color: var(--cyan);
  text-shadow: 0 0 20px var(--cyan);
}

.nav-logo .accent {
  color: var(--cyan);
  text-shadow: 0 0 20px var(--cyan);
}

.nav-links {
  display: flex;
  gap: 2rem;
  list-style: none;
}

.nav-links a {
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.3s ease;
  position: relative;
  padding: 0.25rem 0;
}

.nav-links a:hover,
.nav-links a:focus {
  color: var(--cyan);
  outline: none;
}

.nav-links a::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--cyan);
  transition: width 0.3s ease;
}

.nav-links a:hover::after,
.nav-links a:focus::after {
  width: 100%;
}

@media (max-width: 768px) {
  .nav {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .nav-links {
    display: none;
  }
}
</style>
