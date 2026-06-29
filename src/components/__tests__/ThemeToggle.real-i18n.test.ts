/**
 * @file ThemeToggle.real-i18n.test.ts
 * @description Mounts ThemeToggle against the REAL useLanguage composable to
 *              prove the {state} interpolation bug (#190 R3) is fixed end-to-end.
 * @ticket #190 - residual a11y (R3)
 *
 * WHY A SEPARATE FILE: the sibling ThemeToggle.test.ts mocks useLanguage with a
 * hand-rolled `t(key, params)` that DOES interpolate. That mock PASSES even
 * when the REAL composable never interpolates — so the prod build shipped with
 * a literal "Switch theme: {state}" aria-label (Lighthouse evidence), and the
 * mock test never caught it. A mocked-t test cannot satisfy the i18n invariant
 * (iter-7 lesson). This file imports the REAL composable so the bug would
 * re-assert itself if the binding or t() regresses.
 *
 * ROOT CAUSE: useLanguage.t() was declared as `function t(key)` — it accepted
 * NO second `params` argument. Callers like `t('theme.toggleWithState', {state})`
 * passed {state} into a parameter the function never read, so the literal
 * "{state}" placeholder survived into the rendered aria-label. The fix adds an
 * optional `params` argument that replaces {name} placeholders.
 *
 * RED-TEST PROOF: against the original `t(key)` signature, the first two
 * assertions fail with the aria-label containing literal "{state}".
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { usePreferencesStore } from '../../stores/preferences'
// REAL composable — NOT mocked. This is the whole point of this file.
import ThemeToggle from '../ThemeToggle.vue'

describe('ThemeToggle.vue — real-useLanguage {state} interpolation (#190 R3)', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    setActivePinia(createPinia())
    wrapper = mount(ThemeToggle)
  })

  afterEach(() => {
    wrapper.unmount()
  })

  // --------------------------------------------------------------------------
  // The aria-label must NOT contain the literal placeholder. If t() ignores its
  // params argument (the bug), the rendered aria-label is "Switch theme: {state}".
  // --------------------------------------------------------------------------
  it('light-active: aria-label has NO literal "{state}" and contains "Dark"', async () => {
    const store = usePreferencesStore()
    store.setTheme('light')
    await wrapper.vm.$nextTick()

    const aria = wrapper.find('button.theme-toggle').attributes('aria-label') ?? ''
    expect(
      aria,
      `aria-label must not leak the literal placeholder, got: "${aria}"`,
    ).not.toContain('{state}')
    // The visible label IS the target theme (Dark when light is active).
    expect(aria).toContain('Dark')
  })

  it('dark-active: aria-label has NO literal "{state}" and contains "Light"', async () => {
    const store = usePreferencesStore()
    store.setTheme('dark')
    await wrapper.vm.$nextTick()

    const aria = wrapper.find('button.theme-toggle').attributes('aria-label') ?? ''
    expect(
      aria,
      `aria-label must not leak the literal placeholder, got: "${aria}"`,
    ).not.toContain('{state}')
    expect(aria).toContain('Light')
  })

  // --------------------------------------------------------------------------
  // label-content-name-mismatch (the OTHER half of R3): even after
  // interpolation, the accessible name must still be a superstring of the
  // visible .theme-label text. With the {state} resolved to the visible word,
  // the name = "Switch theme: <word>" which trivially contains "<word>".
  // --------------------------------------------------------------------------
  it('accessible name is a superstring of the visible state label (no mismatch)', async () => {
    const store = usePreferencesStore()
    store.setTheme('dark')
    await wrapper.vm.$nextTick()

    const button = wrapper.find('button.theme-toggle')
    const name = button.attributes('aria-label') ?? ''
    const visible = button.find('.theme-label').text()
    expect(
      name.includes(visible),
      `aria-label "${name}" must contain visible "${visible}"`,
    ).toBe(true)
  })
})
