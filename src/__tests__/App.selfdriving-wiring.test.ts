/**
 * @file App.selfdriving-wiring.test.ts
 * @description Shipped-app verification that SelfDrivingDemo is actually wired
 * into a route a user sees (#203 Self-Driving demo).
 *
 * WHY THIS TEST EXISTS:
 * The #203 demo ships a SelfDrivingDemo.vue component + useAutoDemoLoop
 * composable + 4 child components. If that root component is NEVER rendered
 * inside a real route — only tested in isolation — the entire feature is dead
 * code on the shipped app (same class of bug as the #164 nav overhaul that
 * lived as an orphan until a wiring test was added; see App.nav-wiring.test.ts).
 * Every isolated SelfDrivingDemo unit test would still pass while the site
 * showed no demo.
 *
 * MOUNT STRATEGY (iter-13 occlusion fix):
 * The demo is mounted IN-FLOW inside Home.vue (and About.vue) as a visible
 * flagship <section> — NOT as a global `position: fixed; aria-hidden` ambient
 * background in App.vue. The earlier global-background mount was fully occluded
 * behind every route's opaque foreground (elementFromPoint() at every pipeline
 * card center returned the hero <h1>, not the demo), so the demo was invisible.
 * This test therefore mounts the REAL App.vue + REAL Home.vue (via a real
 * router) and asserts the demo reaches the DOM as VISIBLE, NON-aria-hidden
 * content. If anyone reverts the wiring (removes <SelfDrivingDemo /> from
 * Home.vue), this test fails — [data-selfdriving-root] would vanish from `/`.
 *
 * Test that would FAIL if SelfDrivingDemo weren't wired into Home:
 *   - [data-selfdriving-root] is present in the rendered `/` route.
 *   - data-current-phase is one of the 8 pipeline phases (proves the composable
 *     mounted and bound its FSM state).
 *   - the root is NOT aria-hidden (it is real, visible content now).
 *
 * @ticket #203
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory, type Router } from 'vue-router'

// useHead registers reactive <head> tags; stub it so App.setup() doesn't need
// a real head manager. This is the ONLY App dependency we mock — everything
// else (Header, SelfDrivingDemo, the toggles, i18n, the router) is real.
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

// happy-dom lacks matchMedia; install a benign default so useAutoDemoLoop's
// reduced-motion probe + useNeuralNet's breakpoint listener don't throw.
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

// Deferred rAF so the loop does NOT recurse synchronously during mount.
const _rafQueue: FrameRequestCallback[] = []
vi.stubGlobal('requestAnimationFrame', ((cb: FrameRequestCallback) => {
  _rafQueue.push(cb)
  return _rafQueue.length
}) as any)
vi.stubGlobal('cancelAnimationFrame', (() => {}) as any)

// No-op IntersectionObserver (happy-dom ships one; replace to avoid spurious
// offscreen throttle during the unit mount).
vi.stubGlobal(
  'IntersectionObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return []
    }
  },
)

// Real route components — the demo is wired into Home/About, so we must mount
// the REAL views (not stub templates) for [data-selfdriving-root] to reach the
// DOM. Lazy import mirrors the real router setup.
const Home = (await import('../views/Home.vue')).default
const About = (await import('../views/About.vue')).default

const routes = [
  { path: '/', name: 'home', component: Home },
  { path: '/about', name: 'about', component: About },
]

const buildRouter = (): Router =>
  createRouter({ history: createMemoryHistory(), routes })

const App = (await import('../App.vue')).default

describe('Home route -> SelfDrivingDemo wiring (#203 shipped-app gate)', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    localStorage.clear()
    pinia = createPinia()
    setActivePinia(pinia)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const mountAt = async (path: string) => {
    const router = buildRouter()
    await router.push(path)
    await router.isReady()
    const wrapper = mount(App, { global: { plugins: [pinia, router] } })
    await flushPromises()
    await wrapper.vm.$nextTick()
    return wrapper
  }

  it('renders [data-selfdriving-root] on the home route (not only in isolation)', async () => {
    const wrapper = await mountAt('/')
    expect(wrapper.find('[data-selfdriving-root]').exists()).toBe(true)
  })

  it('binds a real pipeline phase to data-current-phase (proves the FSM mounted)', async () => {
    const wrapper = await mountAt('/')
    const phase = wrapper.find('[data-selfdriving-root]').attributes('data-current-phase')
    expect(phase).toBeTruthy()
    expect([
      'intake', 'triage', 'planner', 'coder',
      'security', 'evaluator', 'merger', 'resolved',
    ]).toContain(phase)
  })

  it('the demo region is NOT aria-hidden — it is visible page content now', async () => {
    // The demo was converted from a global `aria-hidden` ambient background
    // (fully occluded behind the route) to an in-flow flagship section, so the
    // root must NOT carry aria-hidden. This assertion would FAIL on the old
    // ambient-background mount (which set aria-hidden="true").
    const wrapper = await mountAt('/')
    expect(
      wrapper.find('[data-selfdriving-root]').attributes('aria-hidden'),
    ).toBeFalsy()
  })
})
