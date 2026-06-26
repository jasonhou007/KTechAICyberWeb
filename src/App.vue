<template>
  <div class="app">
    <nav class="cyber-nav">
      <div class="nav-logo">KAI<span class="accent">TECH</span></div>
      <div class="nav-links">
        <router-link to="/">{{ t('nav.home') }}</router-link>

        <NavigationDropdown
          :label="t('nav.aboutUs')"
          :items="aboutUsItems"
        />

        <NavigationDropdown
          :label="t('nav.news')"
          :items="newsItems"
        />

        <NavigationDropdown
          :label="t('nav.ourBusiness')"
          :items="businessItems"
        />

        <NavigationDropdown
          :label="t('nav.joinUs')"
          :items="careersItems"
        />

        <router-link to="/contact">{{ t('nav.contact') }}</router-link>

        <LanguageSwitcher />
        <ThemeToggle />
      </div>
      <MobileNavigation />
    </nav>
    <main class="main-content">
      <router-view />
    </main>
    <footer class="cyber-footer">
      <div class="footer-content">
        <div class="footer-text">{{ t('footer.copyright') }}</div>
        <div class="footer-status">
          <span class="status-dot"></span>
          <span>{{ t('footer.status') }}</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useLanguageStore } from './stores/language'
import { useThemeStore } from './stores/theme'
import NavigationDropdown from './components/NavigationDropdown.vue'
import LanguageSwitcher from './components/LanguageSwitcher.vue'
import ThemeToggle from './components/ThemeToggle.vue'
import MobileNavigation from './components/MobileNavigation.vue'

const languageStore = useLanguageStore()
const themeStore = useThemeStore()

const { t } = languageStore

// Navigation dropdown items structure
const aboutUsItems = [
  { key: 'about-ktech', label: 'nav.aboutKTech', route: '/about' },
  { key: 'our-group', label: 'nav.ourGroup', route: '/about/group' }
]

const newsItems = [
  { key: 'ktech-news', label: 'nav.ktechNews', route: '/news/ktech' },
  { key: 'kbtg-news', label: 'nav.kbtgNews', route: '/news/kbtg' }
]

const businessItems = [
  { key: 'project-mgmt', label: 'nav.projectManagement', route: '/business/project-management' },
  { key: 'retail-lending', label: 'nav.retailLending', route: '/business/retail-lending' },
  { key: 'scf', label: 'nav.supplyChainFinance', route: '/business/scf' },
  { key: 'blockchain', label: 'nav.blockchain', route: '/business/blockchain' },
  { key: 'mobile-app', label: 'nav.mobileApp', route: '/business/mobile-app' }
]

const careersItems = [
  { key: 'join-us', label: 'nav.joinUs', route: '/careers' },
  { key: 'positions', label: 'nav.positionList', route: '/careers/positions' }
]

onMounted(() => {
  languageStore.initLanguage()
  themeStore.initTheme()
})
</script>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.cyber-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 3rem;
  background: rgba(10, 15, 28, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 255, 204, 0.2);
  box-shadow: 0 0 20px rgba(0, 255, 204, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-logo {
  font-family: 'Orbitron', monospace;
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.2em;
}

.nav-logo .accent {
  color: #00ffcc;
  text-shadow: 0 0 10px rgba(0, 255, 204, 0.8);
}

.nav-links {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.nav-links > * {
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.95rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.nav-links a {
  color: #a0a0a0;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border: 1px solid transparent;
  transition: all 0.3s ease;
}

.nav-links a:hover {
  color: #00ffcc;
  border-color: rgba(0, 255, 204, 0.3);
  box-shadow: 0 0 15px rgba(0, 255, 204, 0.2);
}

.nav-links a.router-link-active {
  color: #00ffcc;
  border-color: rgba(0, 255, 204, 0.5);
  box-shadow: 0 0 20px rgba(0, 255, 204, 0.3);
}

.main-content {
  flex: 1;
}

.cyber-footer {
  padding: 2rem 3rem;
  background: rgba(10, 15, 28, 0.9);
  border-top: 1px solid rgba(0, 255, 204, 0.2);
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-text {
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.9rem;
  color: #888;
}

.footer-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-dot {
  width: 8px;
  height: 8px;
  background: #00ffcc;
  border-radius: 50%;
  animation: blink 2s ease-in-out infinite;
  box-shadow: 0 0 10px rgba(0, 255, 204, 0.8);
}

@keyframes blink {
  0%, 100% {
    opacity: 1;
    box-shadow: 0 0 10px rgba(0, 255, 204, 0.8);
  }
  50% {
    opacity: 0.3;
    box-shadow: none;
  }
}

@media (max-width: 1024px) {
  .nav-links {
    gap: 1rem;
  }
}

@media (max-width: 767px) {
  .nav-links {
    display: none;
  }
}
</style>
