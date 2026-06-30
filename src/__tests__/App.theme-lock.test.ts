/**
 * @file App.theme-lock.test.ts
 * @description Focused red-test for the #239 dark-theme lock (AC1).
 *
 * WHY A SEPARATE FILE: App.test.ts stubs the child components (Header etc.)
 * and seeds the store via setTheme() AFTER activating Pinia. This file mounts
 * the REAL App.vue against a REAL Pinia store and seeds theme='light' TWO
 * ways — (a) via persisted localStorage so the store hydrates with light on
 * first access, and (b) via setTheme('light') after mount — and asserts
 * <html data-theme> is "dark" in both cases.
 *
 * RED-TEST PROOF (AC1): this suite FAILS against the old watcher code. The
 * old App.vue did `applyTheme(preferences.theme)` on mount + watched
 * `preferences.theme`; with the store seeded to 'light', <html> would carry
 * data-theme="light" on mount and after setTheme('light'). The #239 lock
 * (a single unconditional setAttribute('data-theme','dark') with no watcher)
 * is the only code that makes both assertions pass.
 *
 * Verified red: temporarily restoring the old applyTheme()+watch(preferences.theme)
 * block makes both `it()` cases below fail (data-theme resolves to "light").
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { usePreferencesStore, PREFERENCES_STORAGE_KEY } from '../stores/preferences'

// Same mocking pattern as App.test.ts: stub the App dependencies that need a
// real router/head manager, but keep the preferences store REAL (usePreferencesStore
// via the active Pinia) so the theme-lock contract is exercised end-to-end.
vi.mock('@vueuse/head', () => ({ useHead: () => {} }))
vi.mock('vue-router', () => ({
  useRoute: () => ({ path: '/', meta: {} }),
  RouterLink: { template: '<a><slot/></a>' },
  RouterView: { template: '<div></div>' },
}))
vi.mock('../i18n', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    loadCurrentTranslations: async () => {},
  }),
  initLanguage: () => {},
}))
vi.mock('../utils/seo', () => ({
  getRouteMeta: () => ({
    title: 't', description: 'd', keywords: 'k',
    ogType: 'website', ogLocale: 'en', ogSiteName: 's', ogUrl: 'u',
    ogImage: 'i', twitterCard: 'summary', twitterSite: 's', twitterImage: 'i',
    canonical: 'c',
  }),
  getStructuredData: () => [],
}))
vi.mock('../components/LanguageSwitcher.vue', () => ({
  default: { name: 'LanguageSwitcher', template: '<div class="lang-stub"></div>' },
}))
vi.mock('../components/SkipLink.vue', () => ({
  default: { name: 'SkipLink', template: '<div class="skip-stub"></div>' },
}))
vi.mock('../components/Header.vue', () => ({
  default: {
    name: 'Header',
    template: '<nav class="header-stub"><slot name="toolbar" /></nav>',
  },
}))

const App = (await import('../App.vue')).default

describe('App.vue dark-theme lock — focused red-test (#239 AC1)', () => {
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

  it('forces <html data-theme="dark"> even when the store HYDRATES with theme="light"', async () => {
    // Seed persisted preferences so the store hydrates with light on first
    // access (the store's state() reads localStorage). The old applyTheme()
    // would have mirrored "light" onto <html> on mount.
    localStorage.setItem(
      PREFERENCES_STORAGE_KEY,
      JSON.stringify({ theme: 'light', language: 'en', rumEnabled: false }),
    )
    const store = usePreferencesStore()
    // Prove the hydration actually seeded light (guards against a future
    // change to the store's hydration that would make this test vacuous).
    expect(store.theme).toBe('light')

    mount(App, { global: { plugins: [pinia] } })
    await flushPromises()

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('forces <html data-theme="dark"> even when setTheme("light") is called AFTER mount', async () => {
    const store = usePreferencesStore()
    store.setTheme('dark')
    mount(App, { global: { plugins: [pinia] } })
    await flushPromises()
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')

    // The old watch(preferences.theme) would have flipped <html> to "light"
    // here. The lock must not react.
    store.setTheme('light')
    await flushPromises()
    // Drain any deferred microtask the old watcher would have used.
    await new Promise((r) => setTimeout(r, 0))

    expect(store.theme).toBe('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })
})
