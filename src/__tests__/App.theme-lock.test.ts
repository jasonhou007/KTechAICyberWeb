/**
 * @file App.theme-lock.test.ts
 * @description Focused red-test for the dark-theme lock (AC1, post-#248).
 *
 * WHY A SEPARATE FILE: App.test.ts stubs the child components (Header etc.).
 * This file mounts the REAL App.vue against a REAL Pinia store and seeds a
 * STALE theme='light' into localStorage before mount — simulating an existing
 * user from before #248 — and asserts <html data-theme> is "dark" anyway.
 *
 * RED-TEST PROOF (regression target): this suite FAILS if any future change
 * re-introduces a theme reader in App.vue's setup (e.g. restoring the old
 * applyTheme(preferences.theme) or a watch(preferences.theme)). With a stale
 * 'light' theme seeded in localStorage, such a reader would mirror "light"
 * onto <html>; the #239 lock (a single unconditional
 * setAttribute('data-theme','dark') that reads nothing from the store) is the
 * only code that makes the assertion pass.
 *
 * Verified red: temporarily removing App.vue's setAttribute('data-theme','dark')
 * line makes the it() case below fail (data-theme resolves to null).
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

describe('App.vue dark-theme lock — focused red-test (#248)', () => {
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

  it('forces <html data-theme="dark"> even when localStorage HYDRATES with theme="light"', async () => {
    // Seed persisted preferences with a STALE 'light' theme so an existing
    // user's blob is honored by loadPersisted() (which returns the whole
    // parsed object), simulating a pre-#248 user. The #239 lock must still
    // force "dark" onto <html> regardless.
    localStorage.setItem(
      PREFERENCES_STORAGE_KEY,
      JSON.stringify({ theme: 'light', language: 'en', rumEnabled: false }),
    )
    const store = usePreferencesStore()

    mount(App, { global: { plugins: [pinia] } })
    await flushPromises()

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')

    // AC3 migration: triggering persist() via a real mutation must rewrite
    // localStorage WITHOUT the stale theme key.
    store.setLanguage('zh')
    await flushPromises()
    const raw = JSON.parse(localStorage.getItem(PREFERENCES_STORAGE_KEY) || '{}')
    expect(raw.language).toBe('zh')
    expect('theme' in raw).toBe(false)
  })
})
