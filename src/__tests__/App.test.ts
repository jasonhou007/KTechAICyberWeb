/**
 * @file App.test.ts
 * @description Theme -> DOM wiring tests for the App shell (#15 - FEAT-005)
 *
 * The preferences STORE owns the source-of-truth theme value + localStorage
 * persistence. App.vue owns the DOM wiring: it mirrors the active theme onto
 * <html data-theme="..."> and keeps it in sync when the store changes. These
 * tests exercise that contract end-to-end by mounting the REAL App component
 * with a REAL preferences store and asserting the user-visible DOM attribute.
 *
 * Each AC has a test that would fail if the wiring were missing:
 *   - On mount, data-theme reflects the store's initial theme.
 *   - Setting store.theme = 'light' flips <html data-theme> to "light".
 *   - Any non-light theme ('dark' / 'cyber') maps to the dark variant.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { usePreferencesStore } from '../stores/preferences'

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

// Mock the child components — ThemeToggle itself is covered in its own suite;
// here we only care about the App-level theme watcher, so stub the children.
vi.mock('../components/LanguageSwitcher.vue', () => ({
  default: { name: 'LanguageSwitcher', template: '<div class="lang-stub"></div>' },
}))
vi.mock('../components/ThemeToggle.vue', () => ({
  default: { name: 'ThemeToggle', template: '<div class="theme-toggle-stub"></div>' },
}))
vi.mock('../components/SkipLink.vue', () => ({
  default: { name: 'SkipLink', template: '<div class="skip-stub"></div>' },
}))

const App = (await import('../App.vue')).default

describe('App.vue theme -> DOM wiring (#15)', () => {
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

  it('mirrors the store theme onto <html data-theme> on initial mount', async () => {
    const store = usePreferencesStore()
    store.setTheme('dark')
    await mountApp()

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('flips <html data-theme> to "light" when the store theme becomes light', async () => {
    const store = usePreferencesStore()
    store.setTheme('dark')
    await mountApp()

    store.setTheme('light')
    await flushPromises()

    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('maps the cyber theme (and any non-light theme) to the dark DOM variant', async () => {
    const store = usePreferencesStore()
    store.setTheme('dark')
    await mountApp()

    // 'cyber' is the dark-styled default; the DOM attribute must be "dark".
    store.setTheme('cyber')
    await flushPromises()
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')

    // And an explicit 'dark' theme maps to "dark" too.
    store.setTheme('dark')
    await flushPromises()
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })
})
