/**
 * @file useLanguage.test.ts
 * @description Comprehensive unit tests for the useLanguage composable (i18n backbone).
 * @ticket #140 - Fix i18n: bundle locales (static import) so production shows
 *                 translations, not raw keys.
 *
 * The composable now statically imports the locale JSON at build time instead of
 * fetch()'ing `/src/locales/<lang>.json` at runtime (which 404'd in production
 * because there is no `/src/` in `dist/`). These tests assert the new contract:
 *
 *  - translations are available SYNCHRONOUSLY (no async load, no fetch),
 *  - t() resolves real keys for both en and zh,
 *  - setLanguage/initLanguage switch the active language + persist to localStorage,
 *  - globalThis.fetch is NEVER called by the composable,
 *  - missing keys still fall back to the raw key string.
 *
 * Test Categories:
 * - initLanguage(): restore/default/invalid-fallback from localStorage (no load triggered)
 * - setLanguage(): validate en|zh, persist, ignore invalid codes
 * - toggleLanguage(): bidirectional en <-> zh switching with persistence
 * - t(): dot-notation lookup, missing-key fallback, real en+zh values, language switching
 * - computed properties: languageDisplay ('EN' | '中文'), isEnglish, reactivity
 * - bundled (no fetch): fetch is never called; translations resolve synchronously
 * - getNestedValue: single/multi-level, missing/undefined-safe (tested indirectly)
 *
 * Implementation Notes:
 * - useLanguage holds singleton refs at module scope (translations, currentLanguage).
 *   Translations are seeded from the statically-imported locale JSON. To avoid test
 *   bleed we vi.resetModules() + dynamic-import the module fresh in beforeEach.
 * - Computed refs (languageDisplay, isEnglish) require an active effect scope, so the
 *   composable is invoked inside effectScope() which is disposed in afterEach.
 * - localStorage is fully mocked; no real storage I/O occurs.
 * - We deliberately assert globalThis.fetch is NOT called — the regression guard for
 *   the runtime-fetch bug that left production showing raw i18n keys.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { effectScope, nextTick } from 'vue'

const STORAGE_KEY = 'ktech-language'

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
    // are recreated fresh for every test, seeded from the bundled locale JSON.
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

    // Mock global fetch as a SENTINEL: the bundled composable must never call it.
    // Any invocation is a regression (back to the broken runtime-fetch behavior),
    // so the mock fails the test loudly if fetch is touched.
    fetchMock = vi.fn(() => {
      throw new Error('useLanguage must not call fetch — locales are bundled')
    })
    vi.stubGlobal('fetch', fetchMock)

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

    it('does NOT trigger any fetch when restoring a stored language (translations are bundled)', () => {
      localStorageStore[STORAGE_KEY] = 'zh'

      api.initLanguage()

      // Bundled locales mean no network I/O at all — the regression guard.
      expect(fetchMock).not.toHaveBeenCalled()
      // And the restored language's translations are already available.
      expect(api.t('nav.home')).toBe('首页')
    })

    it('does NOT trigger any fetch when defaulting (no stored value)', () => {
      api.initLanguage()

      expect(fetchMock).not.toHaveBeenCalled()
      expect(api.t('nav.home')).toBe('Home')
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

    it('does NOT fetch when switching language (translations are bundled)', () => {
      api.setLanguage('zh')

      expect(fetchMock).not.toHaveBeenCalled()
      // The new language's translations are already available synchronously.
      expect(api.t('nav.home')).toBe('首页')
    })

    it.each(['fr', 'ja', 'EN', 'Zh', null, undefined, '', 'english', 0 as any])(
      'ignores invalid language code %p — no state change, no localStorage write, no fetch',
      (invalid: any) => {
        // Establish a known prior state.
        api.setLanguage('zh')
        setItemSpy.mockClear()
        fetchMock.mockClear()

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
    it('returns the translated value for a valid top-level key', () => {
      // Translations are bundled, so they resolve synchronously without any load call.
      expect(api.t('nav.logo')).toBe('KTECH.AI')
    })

    it('supports nested dot-notation keys (e.g. "nav.home")', () => {
      expect(api.t('nav.home')).toBe('Home')
      expect(api.t('nav.about')).toBe('About')
    })

    it('returns the key string itself as fallback when the translation is missing', () => {
      expect(api.t('nav.missing')).toBe('nav.missing')
      expect(api.t('nonexistent.key.path')).toBe('nonexistent.key.path')
    })

    it('resolves bundled translations immediately, even before any init/set call', () => {
      // No initLanguage()/setLanguage() called -> currentLanguage defaults to 'en' and
      // the bundled 'en' translations are already in place, so t() resolves directly.
      expect(api.t('nav.home')).toBe('Home')
      expect(api.t('nav.logo')).toBe('KTECH.AI')
    })

    it('reflects the active language (returns zh strings after switching to zh)', () => {
      expect(api.t('nav.home')).toBe('Home')

      api.setLanguage('zh')

      expect(api.t('nav.home')).toBe('首页')
    })

    // ============================================
    // #190 R3: t(key, params) — {name} placeholder interpolation.
    // ROOT CAUSE of the prod "{state}" leak: t() was declared `function t(key)`
    // with no params argument, so callers like t('key.with.{name}', {name})
    // passed the params into a parameter the function never read. The literal
    // "{name}" placeholder survived into the rendered aria-label (Lighthouse
    // evidence). Multiple source callers depend on this contract today
    // (LanguageSwitcher, NeuralCore, NeonPulse), so the fix is a general
    // optional-params argument that replaces {name} placeholders. These tests
    // pin the contract.
    // #239: the test data was migrated off theme.toggleWithState (the theme.*
    // locale block was deleted with ThemeToggle.vue) onto language.switchTo,
    // which carries a {lang} placeholder in BOTH locales.
    // RED-TEST PROOF: against the original `t(key)` signature, every assertion
    // below fails because the placeholder is never replaced.
    // ============================================
    describe('t(key, params) — {name} placeholder interpolation (#190 R3)', () => {
      it('replaces a single {name} placeholder with the param value', () => {
        // language.switchTo = "Switch language (current: {lang})" (en)
        expect(api.t('language.switchTo', { lang: 'English' })).toBe(
          'Switch language (current: English)',
        )
      })

      it('replaces a single placeholder with a CJK value (zh active)', () => {
        api.setLanguage('zh')
        // language.switchTo = "切换语言（当前：{lang}）" (zh)
        expect(api.t('language.switchTo', { lang: '中文' })).toBe(
          '切换语言（当前：中文）',
        )
      })

      it('replaces MULTIPLE placeholders in one string', () => {
        // language.switchTo = "Switch to {lang}" — single placeholder; use a
        // synthetic multi-placeholder key by building the expectation against a
        // known multi-param key. neural.aria.nodeLabel has {layer}/{function}.
        const out = api.t('neural.aria.nodeLabel', { layer: 2, function: 3 })
        expect(out).toContain('2')
        expect(out).toContain('3')
        expect(out).not.toMatch(/\{layer\}|\{function\}/)
      })

      it('returns the key fallback (with placeholders intact) for an unknown key', () => {
        expect(api.t('unknown.key', { foo: 'bar' })).toBe('unknown.key')
      })

      it('leaves unreferenced placeholders untouched (no over-eager replacement)', () => {
        // language.switchTo references {lang}; passing an extra {foo} must
        // not error and must not mutate the {lang} replacement.
        const out = api.t('language.switchTo', { lang: 'English', foo: 'X' })
        expect(out).toBe('Switch language (current: English)')
      })

      it('preserves the no-arg call path (existing t(key) callers unbroken)', () => {
        // The legacy contract: t('nav.home') with no params must still work.
        expect(api.t('nav.home')).toBe('Home')
        expect(api.t('nav.home', undefined)).toBe('Home')
        expect(api.t('nav.home', {})).toBe('Home')
      })
    })
  })

  // ============================================
  // #239 default-language lock: the site defaults to English on first visit
  // (empty localStorage). It does NOT auto-override from navigator.language
  // or prefers-color-scheme — the default is a hard-coded 'en'. These tests
  // pin that no browser-language auto-detection sneaks back in.
  // ============================================
  describe('#239 default-language lock', () => {
    it('initLanguage() defaults to "en" when localStorage is empty', () => {
      // No ktech-language key in storage.
      api.initLanguage()

      expect(api.currentLanguage.value).toBe('en')
    })

    it('initLanguage() does NOT consult navigator.language', () => {
      // Stub navigator.language to a zh locale to prove initLanguage ignores
      // it (the default must be the hard-coded 'en', not a browser override).
      const langGetter = vi.spyOn(navigator, 'language', 'get')
      langGetter.mockReturnValue('zh-CN')

      api.initLanguage()

      expect(api.currentLanguage.value).toBe('en')
      expect(langGetter).not.toHaveBeenCalled()
    })

    it('initLanguage() does NOT consult window.matchMedia', () => {
      // matchMedia is irrelevant to language. The old theme code used it via
      // prefers-color-scheme detection (detectSystemTheme), removed in #248.
      // Assert the language init path never touches matchMedia so a future
      // refactor can't quietly couple language to a media query.
      const mm = vi.fn(() => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }))
      vi.stubGlobal('matchMedia', mm)

      api.initLanguage()

      expect(api.currentLanguage.value).toBe('en')
      expect(mm).not.toHaveBeenCalled()
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
  // Bundled locales — the regression guard for the runtime-fetch bug.
  // (Locales are statically imported; the composable must never call fetch.)
  // ============================================
  describe('bundled locales (no runtime fetch)', () => {
    it('never calls globalThis.fetch during initLanguage', () => {
      api.initLanguage()

      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('never calls globalThis.fetch during setLanguage', () => {
      api.setLanguage('zh')
      api.setLanguage('en')
      api.setLanguage('zh')

      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('has both en and zh translations available synchronously', () => {
      // en is the default.
      expect(api.t('nav.home')).toBe('Home')
      // zh is reachable without any async load.
      api.setLanguage('zh')
      expect(api.t('nav.home')).toBe('首页')
      // Switching back is synchronous too.
      api.setLanguage('en')
      expect(api.t('nav.home')).toBe('Home')
    })

    it('switching back and forth never produces a raw key (no missing-translation flicker)', () => {
      for (let i = 0; i < 5; i++) {
        api.setLanguage(i % 2 === 0 ? 'zh' : 'en')
        const value = api.t('nav.home')
        // Real translations never equal the raw key.
        expect(value).not.toBe('nav.home')
      }
    })
  })

  // ============================================
  // getNestedValue(obj, path) — exercised indirectly via t().
  // (getNestedValue is not exported; we assert its traversal + safety contract.)
  // ============================================
  describe('getNestedValue (indirect via t)', () => {
    it('resolves single-level paths', () => {
      expect(api.t('nav.logo')).toBe('KTECH.AI')
    })

    it('resolves multi-level dot paths', () => {
      expect(api.t('nav.home')).toBe('Home')
    })

    it('returns the key (fallback) for a missing nested key', () => {
      // 'nav' exists but 'nav.nonexistent' does not -> safe traversal -> fallback.
      expect(api.t('nav.nonexistent')).toBe('nav.nonexistent')
    })

    it('handles an undefined intermediate segment safely (no throw)', () => {
      // 'missingRoot.deep.deeper' -> first segment undefined, traversal short-circuits.
      expect(() => api.t('missingRoot.deep.deeper')).not.toThrow()
      expect(api.t('missingRoot.deep.deeper')).toBe('missingRoot.deep.deeper')
    })
  })
})
