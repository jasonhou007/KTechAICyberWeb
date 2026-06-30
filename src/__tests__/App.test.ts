/**
 * @file App.test.ts
 * @description Dark-theme lock wiring tests for the App shell (#239 / #248).
 *
 * #239 locked the site to the dark theme unconditionally. #248 then removed
 * the now-dead theme surface from the preferences store (state.theme,
 * setTheme/toggleTheme, detectSystemTheme, currentTheme/isDarkTheme): App.vue
 * hardcodes data-theme="dark" once on mount and never flips it, and no
 * shipped code reads a theme from the store. The store now owns only language.
 *
 * These tests pin that locked-dark contract end-to-end by mounting the REAL
 * App component with a REAL preferences store and asserting the user-visible
 * DOM attribute. Each AC has a test that would FAIL if the lock regressed:
 *   - On mount, data-theme is "dark" even when a stale 'light' theme sits in
 *     localStorage (proves App forces dark regardless of persisted state).
 *   - data-theme stays "dark" after a real store mutation (setLanguage),
 *     proving the persist path does not disturb the DOM lock.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { usePreferencesStore, PREFERENCES_STORAGE_KEY } from '../stores/preferences'

// Mock @vueuse/head so App.setup() can register reactive head tags without a
// real <head> manager. useHead just no-ops.
vi.mock('@vueuse/head', () => ({
  useHead: () => {},
}))

// Mock vue-router: provide a stable empty route + RouterLink/RouterView stubs
// so App.vue's <router-view/> and <router-link> render without a real router.
vi.mock('vue-router', () => ({
  useRoute: () => ({ path: '/', meta: {} }),
  RouterLink: { template: '<a><slot/></a>' },
  RouterView: { template: '<div></div>' },
}))

// Mock the i18n barrel so App.setup() doesn't try to load translations during
// these tests. t returns the key (the fallback used everywhere else).
vi.mock('../i18n', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    loadCurrentTranslations: async () => {},
  }),
  initLanguage: () => {},
}))

// Mock SEO helpers — App computes head meta from these, but the tests below
// assert on the theme attribute, not the meta tags.
vi.mock('../utils/seo', () => ({
  getRouteMeta: () => ({
    title: 't', description: 'd', keywords: 'k',
    ogType: 'website', ogLocale: 'en', ogSiteName: 's', ogUrl: 'u',
    ogImage: 'i', twitterCard: 'summary', twitterSite: 's', twitterImage: 'i',
    canonical: 'c',
  }),
  getStructuredData: () => [],
}))

// Mock the child components. #239 deleted ThemeToggle.vue — it is no longer
// mocked here (the component no longer exists). LanguageSwitcher + SkipLink
// are stubbed; Header renders its #toolbar slot so the App shell's toolbar
// wiring still mounts.
vi.mock('../components/LanguageSwitcher.vue', () => ({
  default: { name: 'LanguageSwitcher', template: '<div class="lang-stub"></div>' },
}))
vi.mock('../components/SkipLink.vue', () => ({
  default: { name: 'SkipLink', template: '<div class="skip-stub"></div>' },
}))
// Header.vue owns the routed nav (#164). It is mounted for real + asserted
// end-to-end (dropdown triggers, language toggle, mobile drawer) in its own
// suite AND in the shipped-app wiring test (App.nav-wiring.test.ts). Here we
// stub it so this theme-focused test stays decoupled from Header internals
// (it calls useRouter(), which this suite's vue-router mock intentionally
// omits — stubbing Header avoids coupling the theme contract to nav plumbing).
vi.mock('../components/Header.vue', () => ({
  default: {
    name: 'Header',
    template: '<nav class="header-stub"><slot name="toolbar" /></nav>',
  },
}))

const App = (await import('../App.vue')).default

describe('App.vue dark-theme lock (#239 / #248)', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    pinia = createPinia()
    setActivePinia(pinia)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const mountApp = async () => {
    const wrapper = mount(App, { global: { plugins: [pinia] } })
    await flushPromises()
    await wrapper.vm.$nextTick()
    return wrapper
  }

  it('sets <html data-theme> to "dark" on initial mount regardless of stored theme', async () => {
    // Seed a STALE 'light' theme into localStorage before mount (an existing
    // user from before #248 would carry this). The old code would have
    // mirrored "light" onto <html>; the #239 lock must force "dark" instead.
    localStorage.setItem(
      PREFERENCES_STORAGE_KEY,
      JSON.stringify({ theme: 'light', language: 'en' }),
    )
    await mountApp()

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('stays "dark" after a real store mutation (persist path does not disturb the lock)', async () => {
    // Seed a stale 'light' theme, mount (forces dark), then trigger persist()
    // via setLanguage — a real mutation that rewrites localStorage. The lock
    // must NOT be disturbed by the store's persist path.
    localStorage.setItem(
      PREFERENCES_STORAGE_KEY,
      JSON.stringify({ theme: 'light', language: 'en' }),
    )
    const store = usePreferencesStore()
    await mountApp()

    store.setLanguage('zh')
    await flushPromises()
    await new Promise((r) => setTimeout(r, 0))

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })
})
