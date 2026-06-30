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

    <!-- Site navigation (#164 nav overhaul).
         Header.vue ships the 6 routed items (Home / About Us / News /
         Our Solutions / Join Us / Contact) with dropdowns + mobile hamburger.
         The language + theme toggles live here in App.vue so the hard-won
         EN/中文 + dark/light toggles remain visible next to the nav regardless
         of how Header is wired. -->
    <Header>
      <template #toolbar>
        <LanguageSwitcher />
        <ThemeToggle />
      </template>
    </Header>
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
          <router-link
            to="/terms"
            class="footer-link"
            :aria-label="t('footer.termsOfService')"
          >{{ t('footer.termsOfService') }}</router-link>
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
import { computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useHead } from '@vueuse/head'
import { getRouteMeta, getStructuredData } from './utils/seo'
import { useLanguage, initLanguage } from './i18n'
import { usePreferencesStore } from './stores/preferences'
import LanguageSwitcher from './components/LanguageSwitcher.vue'
import ThemeToggle from './components/ThemeToggle.vue'
import SkipLink from './components/SkipLink.vue'
import Header from './components/Header.vue'

export default {
  name: 'App',
  components: {
    LanguageSwitcher,
    ThemeToggle,
    SkipLink,
    Header
  },
  setup() {
    const route = useRoute()
    const preferences = usePreferencesStore()

    // Apply the persisted theme to <html data-theme="...">. cyber.css only
    // defines dark/light variants, so 'cyber' (the default) is treated as the
    // dark theme. The watcher keeps the DOM in sync whenever the preference
    // changes (e.g. via the ThemeToggle button).
    const applyTheme = (theme) => {
      const resolved = theme === 'light' ? 'light' : 'dark'
      document.documentElement.setAttribute('data-theme', resolved)
    }
    applyTheme(preferences.theme)
    watch(
      () => preferences.theme,
      (theme) => applyTheme(theme),
    )

    // Initialize language on app mount. Translations are bundled at module
    // scope in useLanguage.js (static imports of en.json/zh.json), so they
    // are already available — there is nothing to fetch/load at runtime.
    // (An earlier fetch-based version exposed loadCurrentTranslations() here;
    // it was removed when translations became bundled, and the dangling
    // destructure below threw "loadCurrentTranslations is not a function"
    // on every page load — non-fatal for static text, but it aborted the
    // microtask queue and broke the PositionList page's async positions
    // import so no cards rendered. Removing the dead call lets the page
    // finish loading.)
    onMounted(() => {
      initLanguage()
    })

    const { t } = useLanguage()

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
/* Cyberpunk theme variables (driven by <html data-theme="dark|light">) */
@import './assets/styles/cyber.css';
</style>

<style scoped>
.app { min-height: 100vh; display: flex; flex-direction: column; }
/* Header.vue's nav is position: fixed, so it floats above the page and would
 * cover the top of <main> content. Reserve space equal to the nav height
 * (logo line-height + vertical padding ≈ 5rem) so routed pages start below
 * the fixed header instead of being hidden under it. */
.main-content {
  flex: 1;
  padding-top: 5rem;
}
.cyber-footer {
  padding: 2rem 3rem; background: rgba(10, 10, 15, 0.8);
  border-top: 1px solid rgba(0, 240, 255, 0.2);
}
.footer-content { display: flex; justify-content: space-between; align-items: center; }
.footer-text { font-family: var(--font-body); font-size: 0.9rem; color: #b0b0b0; }
.footer-link {
  margin-left: 1rem;
  color: #00f0ff;
  /* #190 link-in-text-block: persistent underline is the non-color distinguisher
     (the link cyan contrasts poorly with the surrounding footer text, so color
     alone is not an accessible differentiator). */
  text-decoration: underline;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  border-bottom: 1px solid transparent;
  transition: all 0.3s ease;
}
.footer-link:hover {
  border-color: rgba(0, 240, 255, 0.5);
  box-shadow: 0 0 10px rgba(0, 240, 255, 0.2);
}
.footer-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  /* #190 color-contrast: explicit high-contrast color so the status text does
     not rely on inheritance (which computed to #1a1a2e on #39393e = 1.48:1,
     failing WCAG AA). #e0e0e0 on the footer bg (#0a0a0f) = 14.96:1. */
  color: #e0e0e0;
}
.status-dot {
  width: 8px; height: 8px; background: #00f0ff; border-radius: 50%;
  animation: blink 2s ease-in-out infinite;
}
@keyframes blink {
  0%, 100% { opacity: 1; box-shadow: 0 0 10px #00f0ff; }
  50% { opacity: 0.3; box-shadow: none; }
}
</style>
