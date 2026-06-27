/**
 * @file useLanguage.test.ts
 * @description Comprehensive unit tests for the useLanguage composable (i18n backbone).
 * @ticket #109 - TEST-036: useLanguage Composable Unit Tests - TDD with Vitest
 *
 * Test Categories:
 * - initLanguage(): restore/default/invalid-fallback from localStorage
 * - setLanguage(): validate en|zh, persist, ignore invalid codes
 * - toggleLanguage(): bidirectional en <-> zh switching with persistence
 * - t(): dot-notation lookup, missing-key fallback, empty-cache fallback
 * - computed properties: languageDisplay ('EN' | '中文'), isEnglish, reactivity
 * - loadTranslations(): fetch + cache, error -> {} fallback (tested indirectly)
 * - getNestedValue(): single/multi-level, missing/undefined-safe (tested indirectly)
 *
 * TDD Approach:
 * 1. Red: Each `it` defines a precise expected behavior of the public API.
 * 2. Green: Tests pass against the existing useLanguage implementation.
 * 3. Refactor: Shared setup factored into beforeEach; arrange/act/assert kept explicit.
 *
 * Implementation Notes:
 * - useLanguage holds singleton refs at module scope (translations, currentLanguage).
 *   To avoid test bleed we vi.resetModules() + dynamic-import the module fresh in
 *   beforeEach, then reset the localStorage spy and fetch mock.
 * - Computed refs (languageDisplay, isEnglish) require an active effect scope, so the
 *   composable is invoked inside effectScope() which is disposed in afterEach.
 * - fetch and localStorage are fully mocked; no real network or storage I/O occurs.
 * - loadTranslations and getNestedValue are NOT exported; their behavior is exercised
 *   indirectly through initLanguage/setLanguage (which call loadTranslations) and t()
 *   (which calls getNestedValue). The fetch + cache + error-fallback contract of
 *   loadTranslations is asserted by observing fetch call counts and t() output.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { effectScope, nextTick } from 'vue'

const LOCALE_URL = (lang: string) => `/src/locales/${lang}.json`
const STORAGE_KEY = 'ktech-language'

// Locale payloads used to drive fetch mock responses.
const EN_LOCALE = { nav: { home: 'Home', about: 'About' }, greeting: 'Hello' }
const ZH_LOCALE = { nav: { home: '首页', about: '关于' }, greeting: '你好' }

// Module-level type aliases for the dynamically (re)imported composable.
type UseLanguage = typeof import('../useLanguage')['useLanguage']
type UseLanguageApi = ReturnType<UseLanguage>

/**
 * Capture the freshly-imported module + an invoked instance, wired to an active
 * effect scope so the computed refs are usable. Each test receives its own scope.
 */
async function freshUseLanguage(): Promise<{
  useLanguage: UseLanguage
  api: UseLanguageApi
  scope: ReturnType<typeof effectScope>
}> {
  const mod = await import('../useLanguage')
  const scope = effectScope(true)
  let api: UseLanguageApi | undefined
  scope.run(() => {
    api = mod.useLanguage()
  })
  // api is assigned synchronously inside scope.run().
  return { useLanguage: mod.useLanguage, scope, api: api! }
}

describe('useLanguage composable', () => {
  let localStorageStore: Record<string, string>
  let getItemSpy: ReturnType<typeof vi.fn>
  let setItemSpy: ReturnType<typeof vi.fn>
  let fetchMock: ReturnType<typeof vi.fn>
  let useLanguage: UseLanguage
  let api: UseLanguageApi
  let scope: ReturnType<typeof effectScope>

  beforeEach(async () => {
    // Reset module graph so module-scope singleton refs (translations/currentLanguage)
    // are recreated fresh for every test.
    vi.resetModules()

    // Fresh in-memory localStorage backed by vi.fn instances so call assertions work.
    // happy-dom's localStorage methods are not reliably on Storage.prototype, so we
    // stub the global object directly with a controllable implementation.
    localStorageStore = {}
    getItemSpy = vi.fn((key: string) =>
      Object.prototype.hasOwnProperty.call(localStorageStore, key) ? localStorageStore[key] : null
    )
    setItemSpy = vi.fn((key: string, value: string) => {
      localStorageStore[key] = String(value)
    })
    const removeItemMock = vi.fn((key: string) => {
      delete localStorageStore[key]
    })
    const clearMock = vi.fn(() => {
      localStorageStore = {}
    })
    vi.stubGlobal('localStorage', {
      getItem: getItemSpy,
      setItem: setItemSpy,
      removeItem: removeItemMock,
      clear: clearMock,
      key: vi.fn(() => null),
      length: 0,
    })

    // Mock global fetch; default to a resolver keyed by requested URL.
    fetchMock = vi.fn(async (input: any) => {
      const url = typeof input === 'string' ? input : input.url
      const body = url.includes('/en.json') ? EN_LOCALE : url.includes('/zh.json') ? ZH_LOCALE : {}
      return {
        ok: true,
        status: 200,
        json: async () => body,
      } as any
    })
    vi.stubGlobal('fetch', fetchMock)

    // Silence the expected console.error from loadTranslations error-path tests.
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const fresh = await freshUseLanguage()
    useLanguage = fresh.useLanguage
    scope = fresh.scope
    api = fresh.api
  })

  afterEach(() => {
    scope.stop()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  // ============================================
  // initLanguage()
  // ============================================
  describe('initLanguage()', () => {
    it('defaults to "en" when localStorage has no stored value', () => {
      api.initLanguage()

      expect(api.currentLanguage.value).toBe('en')
      expect(getItemSpy).toHaveBeenCalledWith(STORAGE_KEY)
    })

    it('restores "zh" from localStorage when present', () => {
      localStorageStore[STORAGE_KEY] = 'zh'

      api.initLanguage()

      expect(api.currentLanguage.value).toBe('zh')
    })

    it('restores "en" from localStorage when present', () => {
      localStorageStore[STORAGE_KEY] = 'en'

      api.initLanguage()

      expect(api.currentLanguage.value).toBe('en')
    })

    it('falls back to "en" on an invalid stored value (e.g. "fr")', () => {
      localStorageStore[STORAGE_KEY] = 'fr'

      api.initLanguage()

      expect(api.currentLanguage.value).toBe('en')
    })

    it('triggers a translation load for the restored language', () => {
      localStorageStore[STORAGE_KEY] = 'zh'

      api.initLanguage()

      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(fetchMock).toHaveBeenCalledWith(LOCALE_URL('zh'))
    })

    it('triggers a translation load for the default language when none stored', () => {
      api.initLanguage()

      expect(fetchMock).toHaveBeenCalledWith(LOCALE_URL('en'))
    })
  })

  // ============================================
  // setLanguage(lang)
  // ============================================
  describe('setLanguage(lang)', () => {
    it('sets currentLanguage to "en"', () => {
      api.setLanguage('en')

      expect(api.currentLanguage.value).toBe('en')
    })

    it('sets currentLanguage to "zh"', () => {
      api.setLanguage('zh')

      expect(api.currentLanguage.value).toBe('zh')
    })

    it('persists the value to localStorage under the language key', () => {
      api.setLanguage('zh')

      expect(setItemSpy).toHaveBeenCalledWith(STORAGE_KEY, 'zh')
      expect(localStorageStore[STORAGE_KEY]).toBe('zh')
    })

    it('triggers a translation load for the new language', () => {
      api.setLanguage('en')

      expect(fetchMock).toHaveBeenCalledWith(LOCALE_URL('en'))
    })

    it.each(['fr', 'ja', 'EN', 'Zh', null, undefined, '', 'english', 0 as any])(
      'ignores invalid language code %p — no state change and no localStorage write',
      (invalid: any) => {
        // Establish a known prior state.
        api.setLanguage('zh')
        fetchMock.mockClear()
        setItemSpy.mockClear()

        api.setLanguage(invalid)

        // State must be unchanged from the prior valid 'zh'.
        expect(api.currentLanguage.value).toBe('zh')
        expect(setItemSpy).not.toHaveBeenCalled()
        expect(fetchMock).not.toHaveBeenCalled()
      }
    )
  })

  // ============================================
  // toggleLanguage()
  // ============================================
  describe('toggleLanguage()', () => {
    it('switches "en" -> "zh"', () => {
      api.initLanguage() // defaults to 'en'
      expect(api.currentLanguage.value).toBe('en')

      api.toggleLanguage()

      expect(api.currentLanguage.value).toBe('zh')
    })

    it('switches "zh" -> "en"', () => {
      localStorageStore[STORAGE_KEY] = 'zh'
      api.initLanguage()
      expect(api.currentLanguage.value).toBe('zh')

      api.toggleLanguage()

      expect(api.currentLanguage.value).toBe('en')
    })

    it('persists the new language to localStorage after toggling', () => {
      api.initLanguage() // 'en'

      api.toggleLanguage()

      expect(setItemSpy).toHaveBeenCalledWith(STORAGE_KEY, 'zh')
      expect(localStorageStore[STORAGE_KEY]).toBe('zh')
    })

    it('is idempotent across two toggles (returns to the original language)', () => {
      api.initLanguage() // 'en'

      api.toggleLanguage()
      api.toggleLanguage()

      expect(api.currentLanguage.value).toBe('en')
    })
  })

  // ============================================
  // t(key)
  // ============================================
  describe('t(key)', () => {
    it('returns the translated value for a valid top-level key', async () => {
      // Populate the cache by loading en translations.
      api.setLanguage('en')
      await flushFetches()

      expect(api.t('greeting')).toBe('Hello')
    })

    it('supports nested dot-notation keys (e.g. "nav.home")', async () => {
      api.setLanguage('en')
      await flushFetches()

      expect(api.t('nav.home')).toBe('Home')
      expect(api.t('nav.about')).toBe('About')
    })

    it('returns the key string itself as fallback when the translation is missing', async () => {
      api.setLanguage('en')
      await flushFetches()

      expect(api.t('nav.missing')).toBe('nav.missing')
      expect(api.t('nonexistent.key.path')).toBe('nonexistent.key.path')
    })

    it('returns the key when no translations have been loaded', () => {
      // No initLanguage/setLanguage called -> translations cache is empty for the
      // current language, so t() must fall back to the raw key string.
      expect(api.t('nav.home')).toBe('nav.home')
      expect(api.t('greeting')).toBe('greeting')
    })

    it('reflects the active language (returns zh strings after switching to zh)', async () => {
      api.setLanguage('en')
      await flushFetches()
      expect(api.t('nav.home')).toBe('Home')

      api.setLanguage('zh')
      await flushFetches()
      expect(api.t('nav.home')).toBe('首页')
      expect(api.t('greeting')).toBe('你好')
    })
  })

  // ============================================
  // Computed properties (languageDisplay, isEnglish)
  // ============================================
  describe('computed properties', () => {
    it('languageDisplay is "EN" when currentLanguage is "en"', () => {
      api.initLanguage()

      expect(api.languageDisplay.value).toBe('EN')
    })

    it('languageDisplay is "中文" when currentLanguage is "zh"', () => {
      localStorageStore[STORAGE_KEY] = 'zh'
      api.initLanguage()

      expect(api.languageDisplay.value).toBe('中文')
    })

    it('isEnglish is true when currentLanguage is "en"', () => {
      api.initLanguage()

      expect(api.isEnglish.value).toBe(true)
    })

    it('isEnglish is false when currentLanguage is "zh"', () => {
      localStorageStore[STORAGE_KEY] = 'zh'
      api.initLanguage()

      expect(api.isEnglish.value).toBe(false)
    })

    it('reacts to language changes (languageDisplay updates after toggle)', async () => {
      api.initLanguage()
      expect(api.languageDisplay.value).toBe('EN')
      expect(api.isEnglish.value).toBe(true)

      api.toggleLanguage()
      await nextTick()

      expect(api.languageDisplay.value).toBe('中文')
      expect(api.isEnglish.value).toBe(false)
    })

    it('reacts to direct setLanguage changes', async () => {
      api.setLanguage('en')
      await nextTick()
      expect(api.isEnglish.value).toBe(true)

      api.setLanguage('zh')
      await nextTick()
      expect(api.isEnglish.value).toBe(false)
      expect(api.languageDisplay.value).toBe('中文')
    })
  })

  // ============================================
  // loadTranslations(lang) — exercised indirectly via the public API.
  // (loadTranslations is not exported; we assert its fetch + cache + error contract.)
  // ============================================
  describe('loadTranslations (indirect via setLanguage/initLanguage)', () => {
    it('fetches /src/locales/{lang}.json and caches the result', async () => {
      api.setLanguage('en')
      await flushFetches()

      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(fetchMock).toHaveBeenCalledWith(LOCALE_URL('en'))
      // Cached translation is now reachable through t().
      expect(api.t('greeting')).toBe('Hello')
    })

    it('returns the cached translation on a second load (no duplicate fetch)', async () => {
      api.setLanguage('en')
      await flushFetches()
      expect(fetchMock).toHaveBeenCalledTimes(1)

      // Trigger another load of the same language via a fresh initLanguage call.
      api.initLanguage()
      await flushFetches()

      // Cache hit: fetch must not have been called a second time.
      expect(fetchMock).toHaveBeenCalledTimes(1)
      // Translation still resolves correctly.
      expect(api.t('nav.home')).toBe('Home')
    })

    it('fetches again for a different language (separate cache slot)', async () => {
      api.setLanguage('en')
      await flushFetches()

      api.setLanguage('zh')
      await flushFetches()

      expect(fetchMock).toHaveBeenCalledTimes(2)
      expect(fetchMock).toHaveBeenNthCalledWith(1, LOCALE_URL('en'))
      expect(fetchMock).toHaveBeenNthCalledWith(2, LOCALE_URL('zh'))
    })

    it('returns {} and logs an error when fetch rejects (network failure)', async () => {
      fetchMock.mockRejectedValueOnce(new Error('network down'))

      api.setLanguage('en')
      await flushFetches()

      // Error path swallows failure -> empty translations -> t() falls back to key.
      expect(console.error).toHaveBeenCalled()
      expect(api.t('greeting')).toBe('greeting')
    })

    it('returns {} and logs an error when fetch resolves with a non-ok response (404)', async () => {
      // Simulate response.json() throwing (e.g. 404 HTML body) which the try/catch
      // in loadTranslations treats as a load failure.
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => {
          throw new Error('Unexpected end of JSON input')
        },
      } as any)

      api.setLanguage('en')
      await flushFetches()

      expect(console.error).toHaveBeenCalled()
      expect(api.t('greeting')).toBe('greeting')
    })
  })

  // ============================================
  // getNestedValue(obj, path) — exercised indirectly via t().
  // (getNestedValue is not exported; we assert its traversal + safety contract.)
  // ============================================
  describe('getNestedValue (indirect via t)', () => {
    it('resolves single-level paths', async () => {
      api.setLanguage('en')
      await flushFetches()

      expect(api.t('greeting')).toBe('Hello')
    })

    it('resolves multi-level dot paths', async () => {
      api.setLanguage('en')
      await flushFetches()

      expect(api.t('nav.home')).toBe('Home')
    })

    it('returns the key (fallback) for a missing nested key', async () => {
      api.setLanguage('en')
      await flushFetches()

      // 'nav' exists but 'nav.nonexistent' does not -> safe traversal -> fallback.
      expect(api.t('nav.nonexistent')).toBe('nav.nonexistent')
    })

    it('handles an undefined intermediate segment safely (no throw)', async () => {
      api.setLanguage('en')
      await flushFetches()

      // 'missingRoot.deep.deeper' -> first segment undefined, traversal short-circuits.
      expect(() => api.t('missingRoot.deep.deeper')).not.toThrow()
      expect(api.t('missingRoot.deep.deeper')).toBe('missingRoot.deep.deeper')
    })
  })
})

/**
 * Drain pending microtasks so the async loadTranslations() (await fetch + await .json())
 * resolves before assertions run. Each awaited promise advances the chain by one
 * microtask; looping a handful of times covers the two-step await chain plus Vue's
 * reactive scheduling, keeping the composable test mount-free.
 */
async function flushFetches(): Promise<void> {
  for (let i = 0; i < 10; i++) {
    await Promise.resolve()
  }
  await nextTick()
}
