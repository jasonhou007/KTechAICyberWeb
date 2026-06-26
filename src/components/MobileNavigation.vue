<template>
  <div class="mobile-nav">
    <button
      class="hamburger"
      :class="{ open: isOpen }"
      :aria-expanded="isOpen ? 'true' : 'false'"
      :aria-label="isOpen ? t('nav.menu.close') : t('nav.menu.open')"
      aria-controls="mobile-menu"
      @click="toggle"
    >
      <span class="hamburger-box">
        <span class="hamburger-inner"></span>
      </span>
    </button>

    <transition name="fade">
      <div v-if="isOpen" class="menu-backdrop" @click="close"></div>
    </transition>

    <transition name="slide">
      <nav
        v-if="isOpen"
        id="mobile-menu"
        class="mobile-menu"
        :aria-hidden="isOpen ? 'false' : 'true'"
        role="dialog"
        aria-modal="true"
        :aria-label="t('nav.menu.label')"
        @keydown="onMenuKeydown"
      >
        <router-link to="/" class="menu-link" @click="close">{{ t('nav.home') }}</router-link>
        <router-link to="/services" class="menu-link" @click="close">{{ t('nav.services') }}</router-link>
        <router-link to="/about" class="menu-link" @click="close">{{ t('nav.about') }}</router-link>
        <div class="menu-controls">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </nav>
    </transition>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useLanguageStore } from '../stores/language'
import LanguageSwitcher from './LanguageSwitcher.vue'
import ThemeToggle from './ThemeToggle.vue'

const languageStore = useLanguageStore()
const t = languageStore?.t ? languageStore.t : (key) => key

const router = useRouter()
const isOpen = ref(false)

function openMenu() {
  isOpen.value = true
  if (typeof document !== 'undefined') {
    document.body.style.overflow = 'hidden'
  }
}

function close() {
  isOpen.value = false
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
  }
}

function toggle() {
  if (isOpen.value) {
    close()
  } else {
    openMenu()
  }
}

// ESC closes (accessibility AC)
function onKeydown(e) {
  if (e.key === 'Escape' && isOpen.value) {
    close()
  }
}

// Simple focus trap: wrap Tab / Shift+Tab at the boundaries
function onMenuKeydown(e) {
  if (e.key !== 'Tab') return
  const menu = document.getElementById('mobile-menu')
  if (!menu) return
  const focusables = menu.querySelectorAll('a[href], button:not([disabled])')
  if (focusables.length === 0) return
  const first = focusables[0]
  const last = focusables[focusables.length - 1]
  const active = document.activeElement
  if (e.shiftKey) {
    if (active === first || !menu.contains(active)) {
      e.preventDefault()
      last.focus()
    }
  } else {
    if (active === last) {
      e.preventDefault()
      first.focus()
    }
  }
}

onMounted(() => {
  if (typeof document !== 'undefined') {
    document.addEventListener('keydown', onKeydown)
  }
})

// Move focus into the panel on open
watch(isOpen, (open) => {
  if (open) {
    nextTick(() => {
      if (typeof document === 'undefined') return
      const menu = document.getElementById('mobile-menu')
      if (menu) {
        const first = menu.querySelector('a[href], button:not([disabled])')
        if (first && typeof first.focus === 'function') first.focus()
      }
    })
  } else {
    // Return focus to the hamburger toggle when closing
    nextTick(() => {
      if (typeof document === 'undefined') return
      const btn = document.querySelector('.hamburger')
      if (btn && typeof btn.focus === 'function') btn.focus()
    })
  }
})

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.removeEventListener('keydown', onKeydown)
    document.body.style.overflow = ''
  }
})

// Close on route change so a tap navigates and dismisses the panel
if (router) {
  watch(
    () => router.currentRoute.value.path,
    () => {
      if (isOpen.value) close()
    }
  )
}
</script>

<style scoped>
.mobile-nav {
  display: none;
}

.hamburger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
  padding: 0.5rem;
  background: rgba(0, 240, 255, 0.1);
  border: 1px solid rgba(0, 240, 255, 0.3);
  border-radius: 5px;
  color: #00f0ff;
  cursor: pointer;
  position: relative;
  z-index: 200;
  transition: all 0.3s ease;
}

.hamburger:hover {
  background: rgba(0, 240, 255, 0.2);
  box-shadow: 0 0 15px rgba(0, 240, 255, 0.4);
  transform: scale(1.05);
}

.hamburger:focus-visible {
  outline: 2px solid #00f0ff;
  outline-offset: 2px;
}

.hamburger-box {
  width: 30px;
  height: 24px;
  display: inline-block;
  position: relative;
}

.hamburger-inner {
  display: block;
  top: 50%;
  margin-top: -2px;
}

.hamburger-inner,
.hamburger-inner::before,
.hamburger-inner::after {
  width: 30px;
  height: 4px;
  background-color: #00f0ff;
  border-radius: 4px;
  position: absolute;
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.hamburger-inner::before,
.hamburger-inner::after {
  content: "";
  display: block;
}

.hamburger-inner::before {
  top: -10px;
}

.hamburger-inner::after {
  bottom: -10px;
}

.hamburger.open .hamburger-inner {
  background-color: transparent;
}

.hamburger.open .hamburger-inner::before {
  top: 0;
  transform: rotate(45deg);
  background-color: #00f0ff;
}

.hamburger.open .hamburger-inner::after {
  bottom: 0;
  transform: rotate(-45deg);
  background-color: #00f0ff;
}

.menu-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 150;
}

.mobile-menu {
  position: fixed;
  top: 0;
  right: 0;
  height: 100vh;
  width: min(80vw, 300px);
  background: rgba(10, 10, 15, 0.95);
  backdrop-filter: blur(10px);
  border-left: 1px solid rgba(0, 240, 255, 0.3);
  z-index: 160;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 5rem 1.5rem 2rem;
  overflow-y: auto;
}

.menu-link {
  display: block;
  min-height: 44px;
  padding: 0.75rem 1rem;
  font-family: 'Rajdhani', sans-serif;
  font-size: 1.1rem;
  font-weight: 500;
  color: #e0e0e0;
  text-decoration: none;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  border: 1px solid transparent;
  transition: all 0.3s ease;
}

.menu-link:hover {
  color: #00f0ff;
  background: rgba(0, 240, 255, 0.2);
  box-shadow: 0 0 15px rgba(0, 240, 255, 0.4);
  transform: scale(1.05);
}

.menu-link:focus-visible {
  outline: 2px solid #00f0ff;
  outline-offset: 2px;
}

.menu-link.router-link-active {
  color: #00f0ff;
  border-color: rgba(0, 240, 255, 0.5);
}

.menu-controls {
  display: flex;
  gap: 0.75rem;
  margin-top: auto;
  flex-wrap: wrap;
}

/* Slide transition */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (min-width: 768px) {
  .mobile-nav {
    display: none;
  }
}

@media (max-width: 767px) {
  .mobile-nav {
    display: flex;
    align-items: center;
  }
}

/* Respect reduced-motion preference */
@media (prefers-reduced-motion: reduce) {
  .slide-enter-active,
  .slide-leave-active,
  .fade-enter-active,
  .fade-leave-active,
  .hamburger-inner,
  .hamburger-inner::before,
  .hamburger-inner::after,
  .menu-link {
    transition: none;
  }
}
</style>
