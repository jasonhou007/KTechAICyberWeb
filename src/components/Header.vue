<template>
  <nav class="nav" :class="{ 'scrolled': isScrolled }" id="navbar">
    <router-link to="/" class="nav-logo">
      KAI<span class="accent">TECH</span>
    </router-link>

    <!-- Mobile hamburger toggle (off-canvas nav). Hidden on desktop via CSS. -->
    <button
      class="nav-toggle"
      :aria-label="mobileOpen ? t('nav.menu.close') : t('nav.menu.open')"
      :aria-expanded="mobileOpen"
      aria-controls="navbar"
      @click="toggleMobile"
    >
      <span class="nav-toggle-bar" aria-hidden="true"></span>
      <span class="nav-toggle-bar" aria-hidden="true"></span>
      <span class="nav-toggle-bar" aria-hidden="true"></span>
    </button>

    <ul class="nav-links" :class="{ 'mobile-open': mobileOpen }">
      <li>
        <router-link to="/">{{ t('nav.home') }}</router-link>
      </li>
      <li>
        <NavigationDropdown :label="t('nav.aboutUs')" :items="aboutItems" />
      </li>
      <li>
        <NavigationDropdown :label="t('nav.news')" :items="newsItems" />
      </li>
      <li>
        <NavigationDropdown
          :label="t('nav.ourSolutions')"
          :groups="solutionsGroups"
        />
      </li>
      <li>
        <NavigationDropdown :label="t('nav.joinUs')" :items="joinItems" />
      </li>
      <li>
        <router-link to="/contact">{{ t('nav.contact') }}</router-link>
      </li>
    </ul>
  </nav>
</template>

<script setup>
/**
 * @component Header
 * @description Main navigation header (#164 nav overhaul).
 *
 * Mirrors the official kaitai.tech top-level structure: Home, About Us,
 * News, Our Solutions (grouped mega-menu), Join Us, Contact. The logo is a
 * router-link to "/" (no # anchors). A mobile hamburger toggles an off-canvas
 * .nav-links panel. Scroll-aware styling toggles a `scrolled` class once
 * `window.scrollY > 50`. Translation flows through the shared `useLanguage()`
 * composable.
 */

import { ref, onMounted, onUnmounted } from 'vue'
import { useLanguage } from '../composables/useLanguage'
import NavigationDropdown from './NavigationDropdown.vue'

// Shared i18n — text follows the site-wide language toggle (en/zh).
const { t } = useLanguage()

// State
const isScrolled = ref(false)
const mobileOpen = ref(false)

// Submenu definitions. Routes point at real routed pages so the nav never
// produces a 404. Each submenu item renders via t(item.label).
const aboutItems = [
  { key: 'aboutKTech', label: 'nav.submenu.aboutKTech', route: '/about' },
  { key: 'ourGroup', label: 'nav.submenu.ourGroup', route: '/about' },
]

const newsItems = [
  { key: 'ktechNews', label: 'nav.submenu.ktechNews', route: '/news' },
  { key: 'bbtgNews', label: 'nav.submenu.bbtgNews', route: '/news' },
]

const joinItems = [
  { key: 'joinUs', label: 'nav.submenu.joinUs', route: '/join-us' },
  { key: 'positionList', label: 'nav.submenu.positionList', route: '/careers' },
]

// Grouped mega-menu for Our Solutions. Two groups: Banking Solution +
// Blockchain & Web3. The Blockchain group includes the 3 new solution pages
// added in this ticket (cross-border-payment, digital-asset-custody, stablecoin).
const solutionsGroups = [
  {
    groupLabel: 'nav.groups.banking',
    items: [
      { key: 'retailLending', label: 'nav.submenu.retailLending', route: '/services/retail-lending' },
      { key: 'supplyChainFinance', label: 'nav.submenu.supplyChainFinance', route: '/services/supply-chain-finance' },
    ],
  },
  {
    groupLabel: 'nav.groups.blockchainWeb3',
    items: [
      { key: 'blockchain', label: 'nav.submenu.blockchain', route: '/services/blockchain' },
      { key: 'crossBorderPayment', label: 'nav.submenu.crossBorderPayment', route: '/services/cross-border-payment' },
      { key: 'digitalAssetCustody', label: 'nav.submenu.digitalAssetCustody', route: '/services/digital-asset-custody' },
      { key: 'stablecoin', label: 'nav.submenu.stablecoin', route: '/services/stablecoin' },
    ],
  },
]

const toggleMobile = () => {
  mobileOpen.value = !mobileOpen.value
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
  align-items: center;
  margin: 0;
  padding: 0;
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
.nav-links a:focus::after,
.nav-links a.router-link-active::after {
  width: 100%;
}

.nav-links a.router-link-active {
  color: var(--cyan);
}

/* Mobile hamburger toggle: hidden on desktop, flex on mobile. */
.nav-toggle {
  display: none;
  flex-direction: column;
  justify-content: space-between;
  width: 28px;
  height: 22px;
  padding: 0;
  background: transparent;
  border: none;
  cursor: pointer;
}

.nav-toggle-bar {
  display: block;
  width: 100%;
  height: 3px;
  background: var(--cyan, #00f0ff);
  border-radius: 2px;
  transition: all 0.3s ease;
}

.nav-toggle:focus {
  outline: 2px solid var(--cyan, #00f0ff);
  outline-offset: 4px;
}

@media (max-width: 768px) {
  .nav {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  /* Off-canvas nav: replaced the previous display:none with a slide-in panel. */
  .nav-links {
    position: absolute;
    top: 100%;
    right: 0;
    left: 0;
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
    padding: 1.5rem;
    background: rgba(10, 15, 28, 0.98);
    border-bottom: 1px solid rgba(0, 255, 204, 0.2);
    transform: translateX(110%);
    transition: transform 0.3s ease;
    backdrop-filter: blur(20px);
  }

  .nav-links.mobile-open {
    transform: translateX(0);
  }

  .nav-toggle {
    display: flex;
  }
}
</style>
