/**
 * @file App.solution-forge-wiring.test.ts
 * @description Shipped-app verification that SolutionForge is actually wired
 * into the homepage (#180 AI Solution Forge configurator).
 *
 * WHY THIS TEST EXISTS:
 * The #180 forge ships a SolutionForge.vue component + useSolutionForge
 * composable. If that component is NEVER rendered inside the app — only tested
 * in isolation — the entire feature is dead code on the shipped site (same
 * class of bug as the #164 nav overhaul that lived as an orphan until a wiring
 * test was added; see App.nav-wiring.test.ts and App.selfdriving-wiring.test.ts
 * for the pattern). Every isolated SolutionForge unit test would still pass
 * while the homepage showed no configurator.
 *
 * This test mounts the REAL App.vue with a REAL router and the REAL child
 * components (i18n is NOT mocked), navigates to the homepage, and asserts that
 * the forge's root element + its config UI actually reach the DOM. If anyone
 * reverts the wiring (removes <SolutionForge /> from Home.vue), this test
 * fails — [data-test="solution-forge"] would vanish.
 *
 * Test that would FAIL if SolutionForge weren't wired:
 *   - [data-test="solution-forge"] is present in the rendered homepage.
 *   - >=5 industry chips render (proves the config UI mounted).
 *   - >=4 priority toggles render (proves the config UI mounted).
 *
 * @ticket #180
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory, type Router } from 'vue-router'

// useHead registers reactive <head> tags; stub it so App.setup() doesn't need
// a real head manager. This is the ONLY App dependency we mock — everything
// else (the router, Home, SolutionForge, i18n) is real.
vi.mock('@vueuse/head', () => ({
  useHead: () => {},
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

// happy-dom lacks matchMedia; install a benign default so useSolutionForge's
// reduced-motion probe doesn't throw.
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

// Deferred rAF so the forge loop does NOT recurse synchronously during mount.
const _rafQueue: FrameRequestCallback[] = []
vi.stubGlobal('requestAnimationFrame', ((cb: FrameRequestCallback) => {
  _rafQueue.push(cb)
  return _rafQueue.length
}) as any)
vi.stubGlobal('cancelAnimationFrame', (() => {}) as any)

// #224: SolutionForge is now lazy-mounted inside <LazySection>, which NEEDS
// IntersectionObserver to fire so the slot renders. The global polyfill
// (tests/setup-intersection-observer.js) already fires isIntersecting=true on
// observe(); re-stub the SAME fire-on-observe behaviour here so this file's
// earlier no-op mock (added when SolutionForge mounted eagerly and its own IO
// throttled) does not override the global and leave the lazy slot hidden.
// The fire is deferred to a microtask so the composable registers first.
vi.stubGlobal(
  'IntersectionObserver',
  class {
    observed = new Set()
    callback: (e: any[], o: any) => void
    constructor(cb: (e: any[], o: any) => void) {
      this.callback = cb
    }
    observe(el: any) {
      if (!el) return
      this.observed.add(el)
      Promise.resolve().then(() => {
        if (this.observed.has(el)) {
          this.callback(
            [{ isIntersecting: true, target: el, intersectionRatio: 1 }],
            this,
          )
        }
      })
    }
    unobserve(el: any) {
      this.observed.delete(el)
    }
    disconnect() {
      this.observed.clear()
    }
    takeRecords() {
      return []
    }
  },
)

// The homepage route MUST resolve to the REAL Home.vue (not a stub) so the
// wiring test genuinely proves SolutionForge renders through the live routing
// path. Other routes are stubs (this test does not assert them).
const Home = (await import('../views/Home.vue')).default

const routes = [
  { path: '/', component: Home },
  { path: '/about', component: { template: '<div></div>' } },
  { path: '/contact', component: { template: '<div></div>' } },
  { path: '/privacy', component: { template: '<div></div>' } },
  { path: '/terms', component: { template: '<div></div>' } },
  { path: '/services/cross-border-payment', component: { template: '<div></div>' } },
  { path: '/services/supply-chain-finance', component: { template: '<div></div>' } },
  { path: '/services/big-data-ai', component: { template: '<div></div>' } },
  { path: '/services/retail-lending', component: { template: '<div></div>' } },
  { path: '/services/digital-asset-custody', component: { template: '<div></div>' } },
  { path: '/services/stablecoin', component: { template: '<div></div>' } },
]

const buildRouter = (): Router =>
  createRouter({ history: createMemoryHistory(), routes })

const App = (await import('../App.vue')).default

describe('App.vue -> SolutionForge wiring (#180 shipped-app gate)', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    localStorage.clear()
    pinia = createPinia()
    setActivePinia(pinia)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const mountApp = async () => {
    const router = buildRouter()
    await router.push('/')
    await router.isReady()
    const wrapper = mount(App, { global: { plugins: [pinia, router] } })
    await flushPromises()
    await wrapper.vm.$nextTick()
    // #224: SolutionForge is now lazy-mounted inside <LazySection> on Home.
    // The IO polyfill fires on the microtask queue and the defineAsyncComponent
    // chunk resolves on a later macrotask. Under parallel test load a fixed
    // sleep is flaky, so POLL until the lazy slot appears (bounded — fails
    // fast if the wiring is genuinely broken).
    const deadline = Date.now() + 3000
    while (Date.now() < deadline) {
      await flushPromises()
      await wrapper.vm.$nextTick()
      if (wrapper.find('[data-test="solution-forge"]').exists()) break
      await new Promise((r) => setTimeout(r, 25))
    }
    return wrapper
  }

  it('renders [data-test="solution-forge"] on the shipped homepage (not only in isolation)', async () => {
    const wrapper = await mountApp()
    expect(wrapper.find('[data-test="solution-forge"]').exists()).toBe(true)
  })

  it('renders >=5 industry chips (proves the config UI mounted)', async () => {
    const wrapper = await mountApp()
    const industries = wrapper.findAll('[data-test="forge-industry"]')
    expect(industries.length).toBeGreaterThanOrEqual(5)
    // Each chip carries a data-key so E2E can target a specific industry.
    for (const chip of industries) {
      expect(chip.attributes('data-key')).toBeTruthy()
    }
  })

  it('renders >=4 priority toggles (proves the config UI mounted)', async () => {
    const wrapper = await mountApp()
    const priorities = wrapper.findAll('[data-test="forge-priority"]')
    expect(priorities.length).toBeGreaterThanOrEqual(4)
    for (const toggle of priorities) {
      expect(toggle.attributes('data-key')).toBeTruthy()
    }
  })

  it('renders the forge button + config region (proves the wiring is live)', async () => {
    const wrapper = await mountApp()
    expect(wrapper.find('[data-test="forge-config"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="forge-button"]').exists()).toBe(true)
  })
})
