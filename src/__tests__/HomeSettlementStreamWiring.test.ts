/**
 * @file HomeSettlementStreamWiring.test.ts
 * @description Shipped-app verification that SettlementStream is wired into
 * Home.vue (#206 ambient Settlement Stream — iter-23 safeguard).
 *
 * WHY THIS TEST EXISTS:
 * The #206 stream ships a SettlementStream.vue component + useSettlementStream
 * composable. If the component is NEVER rendered inside Home.vue — only tested
 * in isolation — the whole feature is dead code on the shipped app, exactly
 * like the #164 nav overhaul that lived as an orphan until a wiring test was
 * added (see src/__tests__/App.nav-wiring.test.ts) and the #182 HUD safeguard
 * (HomeOpsHudWiring.test.ts). Every isolated SettlementStream unit test would
 * still pass while the homepage showed no ambient stream.
 *
 * This test mounts the REAL Home.vue (SettlementStream is NOT stubbed) and
 * asserts the stream root appears in the rendered homepage. REMOVING the
 * <SettlementStream /> render from Home.vue makes this test fail — that is the
 * regression gate.
 *
 * @ticket #206
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia } from 'pinia'

// matchMedia is required by useSettlementStream (reduced motion + mobile).
// happy-dom lacks it; install a benign default (mirrors HomeOpsHudWiring).
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

describe('Home.vue -> SettlementStream wiring (#206 shipped-app gate)', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    if (wrapper) wrapper.unmount()
  })

  const mountHome = async () => {
    const Home = (await import('../views/Home.vue')).default
    // #224: heavy modules are lazy-mounted inside <LazySection>. SettlementStream
    // is also lazy-mounted. Mounting with a real router + pinia lets the
    // composables initialise cleanly; the IntersectionObserver polyfill fires
    // on the microtask queue and the defineAsyncComponent chunk resolves on a
    // later macrotask. POLL until the stream slot appears (bounded — fails
    // fast if the wiring is genuinely broken).
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: Home },
        { path: '/about', component: { template: '<div/>' } },
      ],
    })
    // rAF no-op so the composable's loop never spins during the test (the loop
    // starts but its callback never fires — we only assert the wired mount).
    vi.stubGlobal('requestAnimationFrame', () => 1)
    vi.stubGlobal('cancelAnimationFrame', () => {})
    wrapper = mount(Home, { global: { plugins: [createPinia(), router] } })
    const deadline = Date.now() + 2000
    while (Date.now() < deadline) {
      await flushPromises()
      await nextTick()
      if (wrapper.find('[data-test="settlement-stream"]').exists()) break
      await new Promise((r) => setTimeout(r, 25))
    }
    return wrapper
  }

  it('renders the SettlementStream root in the shipped homepage (data-test="settlement-stream")', async () => {
    // REGRESSION GATE: if <SettlementStream /> is removed from Home.vue, this
    // selector finds nothing and the test fails — the feature is an orphan.
    const w = await mountHome()
    expect(w.find('[data-test="settlement-stream"]').exists()).toBe(true)
  })

  it('the stream lives inside the Home root (not a sibling/orphan)', async () => {
    // Confirm the stream element is part of the Home tree, not teleported away
    // to a sibling that the test would still find by accident.
    const w = await mountHome()
    const home = w.find('.home')
    expect(home.exists()).toBe(true)
    expect(home.find('[data-test="settlement-stream"]').exists()).toBe(true)
  })

  it('renders the stream localized copy (no raw settlementStream.* keys)', async () => {
    const w = await mountHome()
    const stream = w.find('[data-test="settlement-stream"]')
    expect(stream.exists()).toBe(true)
    const text = stream.text() || ''
    // Must be real copy, not a raw "settlementStream.title" key.
    expect(text).not.toMatch(/settlementStream\.[a-zA-Z]/)
  })

  it('still renders the surrounding Home content (hero h1 + subtitle)', async () => {
    // Regression guard: wiring the stream in must not drop existing sections.
    const w = await mountHome()
    expect(w.find('h1').exists()).toBe(true)
    expect(w.find('.subtitle').exists()).toBe(true)
  })
})
