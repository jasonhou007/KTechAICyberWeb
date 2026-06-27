import { describe, it, expect, beforeEach } from 'vitest'
import { useLanguage, initLanguage } from '../../src/composables/useLanguage.js'

// Regression: translations must be bundled (static import), NOT fetch()'d at
// runtime. The old code fetch('/src/locales/<lang>.json') 404'd in production
// (no /src/ in dist) and rendered raw keys like "home.title" everywhere.
describe('i18n translations are bundled (no runtime fetch)', () => {
  beforeEach(() => {
    localStorage.clear()
    initLanguage()
  })

  it('resolves home.title to a real English string, not the raw key', () => {
    const { t } = useLanguage()
    const value = t('home.title')
    expect(typeof value).toBe('string')
    expect(value).toBeTruthy()
    expect(value).not.toBe('home.title') // must not be a placeholder
  })

  it('switches to Chinese and still resolves a key (no fetch needed)', () => {
    const { setLanguage, t } = useLanguage()
    setLanguage('zh')
    const value = t('home.title')
    expect(value).toBeTruthy()
    expect(value).not.toBe('home.title')
  })

  it('returns the raw key only for genuinely-missing keys', () => {
    const { t } = useLanguage()
    expect(t('this.key.does.not.exist')).toBe('this.key.does.not.exist')
  })
})
