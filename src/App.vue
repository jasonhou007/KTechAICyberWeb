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
         The language toggle lives here in App.vue so the EN/中文 switch stays
         visible next to the nav regardless of how Header is wired.
         #239: the dark/light theme toggle was removed and the site is now
         locked to the dark theme unconditionally (see setAttribute below). -->
    <Header>
      <template #toolbar>
        <LanguageSwitcher />
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
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useHead } from '@vueuse/head'
import { getRouteMeta, getStructuredData } from './utils/seo'
import { useLanguage, initLanguage } from './i18n'
import LanguageSwitcher from './components/LanguageSwitcher.vue'
import SkipLink from './components/SkipLink.vue'
import Header from './components/Header.vue'

export default {
  name: 'App',
  components: {
    LanguageSwitcher,
    SkipLink,
    Header
  },
  setup() {
    const route = useRoute()

    // #239: the site is locked to the dark theme unconditionally. The previous
    // dark/light toggle (ThemeToggle.vue) and its applyTheme() + watcher were
    // removed; <html data-theme="dark"> is set once here and never flipped.
    // #248: the preferences store no longer owns any theme surface — it only
    // persists language. The lock below is unconditional and reads nothing
    // from the store, so the DOM is always dark regardless of any stale theme
    // value left in a user's localStorage.
    document.documentElement.setAttribute('data-theme', 'dark')

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

    const { t, currentLanguage } = useLanguage()

    // #260: pass the live translator so getRouteMeta resolves per-route
    // document titles from the docTitle / service-title i18n keys (the AC2 fix
    // — every route gets its own localized <title> instead of sharing the
    // static index.html value).
    const currentMeta = computed(() => getRouteMeta(route, t))
    // #300: pass the live translator + active locale so the JSON-LD WebPage
    // schema agrees with document.title (same per-route titleKey) and reflects
    // the active locale in BCP-47 hyphen form. Recomputes on route OR locale
    // change (both reactive). currentLanguage?.value — the focused theme-lock
    // tests mock useLanguage without currentLanguage; reading undefined falls
    // through to getStructuredData's optional-locale (zh-CN) backward-compat
    // path, so those mocks stay green.
    const structuredData = computed(() => getStructuredData(route, t, currentLanguage?.value))

    // #239 / #260: og:locale follows the ACTIVE language, not a static floor.
    // Default is English (en_US); Chinese visitors get zh_CN. This is what
    // social scrapers read off the live DOM after useHead updates it.
    const ogLocale = computed(() => (currentLanguage.value === 'zh' ? 'zh_CN' : 'en_US'))

    // Update head meta tags reactively
    useHead(() => ({
      title: currentMeta.value.title,
      meta: [
        { name: 'description', content: currentMeta.value.description },
        { name: 'keywords', content: currentMeta.value.keywords },
        { name: 'author', content: '开泰远景信息科技有限公司' },
        { name: 'theme-color', content: 'var(--cyan)' },

        // Open Graph
        { property: 'og:type', content: currentMeta.value.ogType },
        { property: 'og:locale', content: ogLocale.value },
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
        { rel: 'icon', href: 'favicon.ico' }
        // #335: the Google Fonts preconnect pair that used to live here was
        // removed. Orbitron + Rajdhani are now self-hosted (see
        // src/assets/styles/fonts.css, font-display: optional), so a preconnect
        // to the third-party font host would be a dead connection with nothing
        // to fetch from it.
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
/* #334 perf: the global accessibility.css + cyber.css sheets were previously
 * loaded here via CSS @import (render-blocking AND serial — each @import is a
 * separate blocking round-trip the browser cannot parallelize). They are now
 * imported JS-side in main.js (after variables.css + main.css, preserving the
 * order they appeared here: accessibility first, then cyber), which lets Vite
 * inline all global CSS into a single bundled stylesheet with no serial fetch.
 * The <style> block is retained for any genuinely component-scoped global
 * rules; it is intentionally empty now. */
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
  /* #335: reserve the full viewport so the footer is positioned at-or-below
   * the fold from FIRST paint, BEFORE any lazy route chunk (About, Services,
   * ...) finishes loading. Without this, on a lazy route the router-view is
   * briefly empty, <main> collapses to ~0 content height, the footer sits
   * high on the page, and when the chunk renders the footer drops to its
   * real position — a 0.097+ CLS hit on /about. flex:1 alone does not
   * guarantee this because .app's min-height:100vh is only a floor on the
   * WHOLE column, and a lazy-route main with no content still lets the
   * footer ride up within that floor. Reserving 100vh on main pushes the
   * footer at least one viewport below the header from the first frame. */
  min-height: 100vh;
}
.cyber-footer {
  padding: 2rem 3rem; background: rgba(10, 10, 15, 0.8);
  border-top: 1px solid var(--accent-cyan-alpha-20);
}
.footer-content { display: flex; justify-content: space-between; align-items: center; }
.footer-text { font-family: var(--font-body); font-size: 0.9rem; color: var(--text-secondary); }
.footer-link {
  margin-left: 1rem;
  color: var(--cyan);
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
  border-color: var(--accent-cyan-alpha-50);
  box-shadow: 0 0 10px var(--accent-cyan-alpha-20);
}
.footer-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  /* #190 color-contrast: explicit high-contrast color so the status text does
     not rely on inheritance (which computed to var(--bg-secondary) on var(--bg-secondary) = 1.48:1,
     failing WCAG AA). var(--text-primary) on the footer bg (var(--bg-primary)) = 14.96:1. */
  color: var(--text-primary);
}
.status-dot {
  width: 8px; height: 8px; background: var(--cyan); border-radius: 50%;
  animation: blink 2s ease-in-out infinite;
}
@keyframes blink {
  0%, 100% { opacity: 1; box-shadow: 0 0 10px var(--cyan); }
  50% { opacity: 0.3; box-shadow: none; }
}
</style>
