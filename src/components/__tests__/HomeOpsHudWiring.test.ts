/**
 * @file HomeOpsHudWiring.test.ts
 * @description Shipped-app verification that CyberOpsHud is actually wired
 * into Home.vue (#182 Cyber Ops HUD — the iter-21 safeguard).
 *
 * WHY THIS TEST EXISTS:
 * The #182 HUD ships a CyberOpsHud.vue component + useOpsFeed composable + six
 * widget components. If that section is NEVER rendered inside Home.vue — only
 * tested in isolation — the whole feature is dead code on the shipped app,
 * exactly like the #164 nav overhaul that lived as an orphan until a wiring
 * test was added (see src/__tests__/App.nav-wiring.test.ts) and the #161
 * terminal safeguard (HomeTerminalWiring.test.ts). Every isolated CyberOpsHud
 * unit test would still pass while the homepage showed nothing.
 *
 * This test mounts the REAL Home.vue (CyberOpsHud is NOT stubbed) and asserts
 * that the HUD root appears in the rendered homepage. REMOVING the
 * <CyberOpsHud /> render from Home.vue makes this test fail — that is the
 * regression gate.
 *
 * @ticket #182
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia } from 'pinia'

// matchMedia is required by useOpsFeed (reduced motion + mobile breakpoint).
// happy-dom lacks it; install a benign default (mirrors HomeTerminalWiring).
vi.stubGlobal('matchMedia', (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false,
}))

describe('Home.vue -> CyberOpsHud wiring (#182 shipped-app gate)', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    if (wrapper) wrapper.unmount()
  })

  const mountHome = async () => {
    const Home = (await import('../../views/Home.vue')).default
    // #224: CyberOpsHud is now lazy-mounted inside <LazySection>. Mounting with
    // a real router + pinia (mirroring Home.spec.js) lets the HUD's useOpsFeed
    // composable initialise cleanly; the IntersectionObserver polyfill
    // (tests/setup-intersection-observer.js) fires on the microtask queue and
    // the defineAsyncComponent chunk resolves on a later macrotask. Under
    // parallel test load a fixed sleep is flaky, so POLL until the lazy slot
    // appears (bounded — fails fast if the wiring is genuinely broken).
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: Home },
        { path: '/about', component: { template: '<div/>' } },
      ],
    })
    wrapper = mount(Home, { global: { plugins: [createPinia(), router] } })
    const deadline = Date.now() + 2000
    while (Date.now() < deadline) {
      await flushPromises()
      await nextTick()
      if (wrapper.find('[data-test="cyber-ops-hud"]').exists()) break
      await new Promise((r) => setTimeout(r, 25))
    }
    return wrapper
  }

  it('renders the CyberOpsHud root in the shipped homepage (data-test="cyber-ops-hud")', async () => {
    // REGRESSION GATE: if <CyberOpsHud /> is removed from Home.vue, this
    // selector finds nothing and the test fails — the feature is an orphan.
    const w = await mountHome()
    expect(w.find('[data-test="cyber-ops-hud"]').exists()).toBe(true)
  })

  it('the HUD lives inside the Home root (not a sibling/orphan)', async () => {
    // Confirm the HUD element is actually part of the Home tree, not
    // teleported away to a sibling that the test would still find by accident.
    const w = await mountHome()
    const home = w.find('.home')
    expect(home.exists()).toBe(true)
    expect(home.find('[data-test="cyber-ops-hud"]').exists()).toBe(true)
  })

  it('renders the HUD title (localized, not a raw key)', async () => {
    const w = await mountHome()
    const title = w.find('[data-test="cyber-ops-hud"] .ops-hud-title')
    expect(title.exists()).toBe(true)
    const text = (await title.text()) || ''
    // Must be real copy, not a raw "opsHud.title" key.
    expect(text).not.toContain('opsHud.')
    expect(text.trim().length).toBeGreaterThan(0)
  })

  it('still renders the surrounding Home content (hero h1 + subtitle + forge section)', async () => {
    // Regression guard: wiring the HUD in must not drop existing sections.
    const w = await mountHome()
    expect(w.find('h1').exists()).toBe(true)
    expect(w.find('.subtitle').exists()).toBe(true)
    expect(w.find('[data-test="solution-forge"]').exists()).toBe(true)
  })
})
