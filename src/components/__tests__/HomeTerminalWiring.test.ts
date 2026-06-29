/**
 * @file HomeTerminalWiring.test.ts
 * @description Shipped-app verification that NeuralTerminal is actually wired
 * into Home.vue (#161 AI Neural Terminal — the iter-9 safeguard).
 *
 * WHY THIS TEST EXISTS:
 * The #161 terminal ships a NeuralTerminal.vue component + useTerminal
 * composable. If that component is NEVER rendered inside Home.vue — only
 * tested in isolation — the whole feature is dead code on the shipped app,
 * exactly like the #164 nav overhaul that lived as an orphan until a wiring
 * test was added (see src/__tests__/App.nav-wiring.test.ts). Every isolated
 * NeuralTerminal unit test would still pass while the homepage showed nothing.
 *
 * This test mounts the REAL Home.vue (NeuralTerminal is NOT stubbed) and
 * asserts that the console + its launcher actually appear in the rendered
 * homepage. REMOVING the <NeuralTerminal /> render from Home.vue makes this
 * test fail — that is the regression gate.
 *
 * It also guards the rest of Home's content (hero h1 + subtitle) so the wiring
 * can't silently ship at the cost of dropping existing sections.
 *
 * @ticket #161
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia } from 'pinia'

// matchMedia is required by useTerminal (reduced motion) and the mobile
// breakpoint. happy-dom lacks it; install a benign default.
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

describe('Home.vue -> NeuralTerminal wiring (#161 shipped-app gate)', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    if (wrapper) wrapper.unmount()
  })

  const mountHome = async () => {
    const Home = (await import('../../views/Home.vue')).default
    // #224: NeuralTerminal is now lazy-mounted inside <LazySection>. Mount with
    // a real router + pinia (mirrors Home.spec.js) so the terminal's composable
    // dependencies initialise cleanly; the IntersectionObserver polyfill fires
    // on the microtask queue and the defineAsyncComponent chunk resolves on a
    // later macrotask — wait ~200ms + flush so the slot's
    // [data-test="neural-terminal"] is present before the wiring assertions.
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: Home },
        { path: '/about', component: { template: '<div/>' } },
      ],
    })
    wrapper = mount(Home, { global: { plugins: [createPinia(), router] } })
    // #224: NeuralTerminal is lazy-mounted; POLL until the slot appears
    // (bounded — robust under parallel test load where a fixed sleep flakes).
    const deadline = Date.now() + 2000
    while (Date.now() < deadline) {
      await flushPromises()
      await nextTick()
      if (wrapper.find('[data-test="neural-terminal"]').exists()) break
      await new Promise((r) => setTimeout(r, 25))
    }
    return wrapper
  }

  it('renders the NeuralTerminal root in the shipped homepage (data-test="neural-terminal")', async () => {
    // REGRESSION GATE: if <NeuralTerminal /> is removed from Home.vue, this
    // selector finds nothing and the test fails — the feature is an orphan.
    const w = await mountHome()
    expect(w.find('[data-test="neural-terminal"]').exists()).toBe(true)
  })

  it('renders the NeuralTerminal launcher button in the shipped homepage', async () => {
    const w = await mountHome()
    // The launcher is the user's entry point — if it's missing the terminal is
    // unreachable on the live site even if the component is technically mounted.
    expect(w.find('[data-test="neural-launcher"]').exists()).toBe(true)
    expect(w.find('[data-test="neural-launcher"]').attributes('aria-label')).toBeTruthy()
  })

  it('still renders the Home hero h1 + subtitle (regression guard for surrounding content)', async () => {
    const w = await mountHome()
    expect(w.find('h1').exists()).toBe(true)
    expect(w.find('.subtitle').exists()).toBe(true)
    // The hero description copy survives.
    expect(w.find('.hero-description').exists()).toBe(true)
  })

  it('the terminal root lives inside Home (not a sibling/orphan)', async () => {
    // Confirm the terminal element is actually part of the Home tree, not
    // teleported away to a sibling that the test would still find by accident.
    const w = await mountHome()
    const home = w.find('.home')
    expect(home.exists()).toBe(true)
    expect(home.find('[data-test="neural-terminal"]').exists()).toBe(true)
  })
})
