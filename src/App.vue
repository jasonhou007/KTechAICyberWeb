<template>
  <div class="app">
    <!-- JSON-LD Structured Data -->
    <component
      v-for="(schema, index) in structuredData"
      :key="index"
      :is="'script'"
      type="application/ld+json"
      v-text="JSON.stringify(schema)"
    />

    <!-- Skip Link for Accessibility -->
    <SkipLink />

    <nav class="cyber-nav" :aria-label="t('a11y.navLabel')">
      <div class="nav-logo">{{ t('nav.logo') }}</div>
      <div class="nav-links">
        <router-link to="/">{{ t('nav.home') }}</router-link>
        <router-link to="/about">{{ t('nav.about') }}</router-link>
        <router-link to="/news">{{ t('nav.news') }}</router-link>
        <router-link to="/contact">{{ t('nav.contact') }}</router-link>
        <LanguageSwitcher />
      </div>
    </nav>
    <main id="main-content" class="main-content" :aria-label="t('a11y.mainLabel')" role="main">
      <router-view />
    </main>
    <footer class="cyber-footer" role="contentinfo">
      <div class="footer-content">
        <div class="footer-text">
          {{ t('footer.copyright') }}
          <router-link
            to="/privacy"
            class="footer-link"
            :aria-label="t('footer.privacyPolicy')"
          >{{ t('footer.privacyPolicy') }}</router-link>
        </div>
        <div class="footer-status">
          <span class="status-dot" aria-hidden="true"></span>
          <span>{{ t('footer.status') }}</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useHead } from '@vueuse/head'
import { getRouteMeta, getStructuredData } from './utils/seo'
import { useLanguage, initLanguage } from './i18n'
import LanguageSwitcher from './components/LanguageSwitcher.vue'
import SkipLink from './components/SkipLink.vue'

export default {
  name: 'App',
  components: {
    LanguageSwitcher,
    SkipLink
  },
  setup() {
    const route = useRoute()

    // Initialize language on app mount
    onMounted(() => {
      initLanguage()
    })

    const { t, loadCurrentTranslations } = useLanguage()

    // Load translations
    onMounted(async () => {
      await loadCurrentTranslations()
    })

    const currentMeta = computed(() => getRouteMeta(route))
    const structuredData = computed(() => getStructuredData(route))

    // Update head meta tags reactively
    useHead(() => ({
      title: currentMeta.value.title,
      meta: [
        { name: 'description', content: currentMeta.value.description },
        { name: 'keywords', content: currentMeta.value.keywords },
        { name: 'author', content: '开泰远景信息科技有限公司' },
        { name: 'theme-color', content: '#00ffcc' },

        // Open Graph
        { property: 'og:type', content: currentMeta.value.ogType },
        { property: 'og:locale', content: currentMeta.value.ogLocale },
        { property: 'og:site_name', content: currentMeta.value.ogSiteName },
        { property: 'og:title', content: currentMeta.value.title },
        { property: 'og:description', content: currentMeta.value.description },
        { property: 'og:url', content: currentMeta.value.ogUrl },
        { property: 'og:image', content: currentMeta.value.ogImage },
        { property: 'og:image:alt', content: currentMeta.value.title },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },

        // Twitter Cards
        { name: 'twitter:card', content: currentMeta.value.twitterCard },
        { name: 'twitter:site', content: currentMeta.value.twitterSite },
        { name: 'twitter:title', content: currentMeta.value.title },
        { name: 'twitter:description', content: currentMeta.value.description },
        { name: 'twitter:image', content: currentMeta.value.twitterImage },

        // Canonical URL
        { name: 'canonical', href: currentMeta.value.canonical }
      ],
      link: [
        { rel: 'canonical', href: currentMeta.value.canonical },
        { rel: 'icon', href: '/favicon.ico' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: true }
      ],
      script: [
        // Structured data is handled separately in template
      ]
    }))

    return {
      structuredData,
      t
    }
  }
}
</script>

<style>
/* Import global accessibility styles */
@import './styles/accessibility.css';
</style>

<style scoped>
.app { min-height: 100vh; display: flex; flex-direction: column; }
.cyber-nav {
  display: flex; justify-content: space-between; align-items: center;
  padding: 1.5rem 3rem; background: rgba(10, 10, 15, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 240, 255, 0.2);
  position: sticky; top: 0; z-index: 100;
}
.nav-logo {
  font-family: 'Orbitron', monospace; font-size: 1.5rem; font-weight: 700;
  color: #e0e0e0; letter-spacing: 0.2em;
}
.nav-logo .accent { color: #00f0ff; }
.nav-links { display: flex; gap: 2rem; }
.nav-links a {
  font-family: 'Rajdhani', sans-serif; font-size: 1.1rem; font-weight: 500;
  color: #e0e0e0; text-decoration: none; text-transform: uppercase;
  letter-spacing: 0.15em; padding: 0.5rem 1rem;
  border: 1px solid transparent; transition: all 0.3s ease;
}
.nav-links a:hover {
  color: #00f0ff; border-color: rgba(0, 240, 255, 0.3);
  box-shadow: 0 0 20px rgba(0, 240, 255, 0.2);
}
.nav-links a.router-link-active,
.nav-links a[aria-current="page"] {
  color: #00f0ff; border-color: rgba(0, 240, 255, 0.5);
}
.main-content { flex: 1; }
.cyber-footer {
  padding: 2rem 3rem; background: rgba(10, 10, 15, 0.8);
  border-top: 1px solid rgba(0, 240, 255, 0.2);
}
.footer-content { display: flex; justify-content: space-between; align-items: center; }
.footer-text { font-family: 'Rajdhani', sans-serif; font-size: 0.9rem; color: #b0b0b0; }
.footer-link {
  margin-left: 1rem;
  color: #00f0ff;
  text-decoration: none;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  border-bottom: 1px solid transparent;
  transition: all 0.3s ease;
}
.footer-link:hover {
  border-color: rgba(0, 240, 255, 0.5);
  box-shadow: 0 0 10px rgba(0, 240, 255, 0.2);
}
.footer-status { display: flex; align-items: center; gap: 0.5rem; }
.status-dot {
  width: 8px; height: 8px; background: #00f0ff; border-radius: 50%;
  animation: blink 2s ease-in-out infinite;
}
@keyframes blink {
  0%, 100% { opacity: 1; box-shadow: 0 0 10px #00f0ff; }
  50% { opacity: 0.3; box-shadow: none; }
}
</style>
