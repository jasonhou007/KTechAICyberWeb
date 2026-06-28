/**
 * @file SolutionForge.test.ts
 * @description Unit tests for the SolutionForge view component (#180).
 * @ticket #180
 *
 * Mounts the REAL SolutionForge.vue with the REAL useLanguage (NOT mocked) and
 * drives the actual DOM (clicks, slider input, keyboard) — never mutates
 * composable internals directly. This lifts the view's coverage over the 85%
 * gate (the wiring test only proves it renders; this test exercises its
 * branches: forge flow, glitch flash watcher, assembly-timeline computed,
 * reduced-motion collapse, reroll/reset, AC4 re-forge).
 *
 * Global stubs mirror App.*-wiring.test.ts exactly (matchMedia, a deferred
 * rAF queue, IntersectionObserver) so mount() does not block on happy-dom's
 * native versions. The rAF queue is installed as a DEFERRED queue (callbacks
 * never auto-fire); forge tests drain it explicitly via driveRAF().
 *
 * Verifies localized copy renders in BOTH en and zh (i18n invariant: no raw
 * keys, no English fallback in zh).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { nextTick } from 'vue'
import SolutionForge from '../SolutionForge.vue'

// ---------------------------------------------------------------------------
// Global stubs (mirror App.selfdriving-wiring.test.ts)
// ---------------------------------------------------------------------------

// Deferred rAF queue: callbacks are stored but never auto-fire (so mount does
// not recurse synchronously). Forge tests drain the queue via driveRAF().
const rafQueue: FrameRequestCallback[] = []

function installGlobals(reducedMotion = false) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: reducedMotion && query === '(prefers-reduced-motion: reduce)',
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }))
  vi.stubGlobal(
    'requestAnimationFrame',
    ((cb: FrameRequestCallback) => {
      rafQueue.push(cb)
      return rafQueue.length
    }) as any,
  )
  vi.stubGlobal('cancelAnimationFrame', (() => {}) as any)
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
}

/** Drain the deferred rAF queue until the predicate holds or a sane cap hits. */
async function driveRAF(predicate: () => boolean, cap = 5000) {
  let guard = 0
  while (guard < cap) {
    const cb = rafQueue.shift()
    if (cb) cb(performance.now() + 16)
    await nextTick()
    guard++
    if (predicate()) return true
  }
  return predicate()
}

// ---------------------------------------------------------------------------
// Mount helper
// ---------------------------------------------------------------------------

const routes = [
  { path: '/', component: { template: '<div></div>' } },
  { path: '/services/:id', component: { template: '<div></div>' } },
]
const buildRouter = () => createRouter({ history: createMemoryHistory(), routes })

async function mountForge(reducedMotion = false) {
  rafQueue.length = 0
  installGlobals(reducedMotion)
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = buildRouter()
  // Push to '/' before isReady() so the initial route resolves (isReady() hangs
  // otherwise — it waits for the first navigation to complete).
  await router.push('/')
  await router.isReady()
  const wrapper = mount(SolutionForge, {
    global: { plugins: [pinia, router] },
    attachTo: document.body,
  })
  await flushPromises()
  await wrapper.vm.$nextTick()
  return wrapper
}

describe('SolutionForge.vue', () => {
  beforeEach(() => {
    localStorage.clear()
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    rafQueue.length = 0
    document.body.innerHTML = ''
  })

  it('renders the config UI with localized title (not a raw key)', async () => {
    const wrapper = await mountForge()
    const title = wrapper.find('.forge-title')
    expect(title.exists()).toBe(true)
    const text = title.text()
    expect(text).not.toContain('forge.')
    expect(text.length).toBeGreaterThan(0)
    expect(wrapper.findAll('[data-test="forge-industry"]').length).toBeGreaterThanOrEqual(5)
    expect(wrapper.findAll('[data-test="forge-priority"]').length).toBeGreaterThanOrEqual(4)
    wrapper.unmount()
  })

  it('clicking Forge drives idle -> computing -> done and renders the blueprint', async () => {
    const wrapper = await mountForge()
    expect(wrapper.find('[data-test="forge-result"]').exists()).toBe(false)

    await wrapper.find('[data-test="forge-button"]').trigger('click')
    await nextTick()
    await driveRAF(() => wrapper.find('[data-test="forge-result"]').exists())

    const result = wrapper.find('[data-test="forge-result"]')
    expect(result.exists()).toBe(true)
    const services = wrapper.find('[data-test="forge-services"]').findAll('li')
    expect(services.length).toBeGreaterThanOrEqual(1)
    expect(services[0].text()).not.toContain('forge.services.')
    const verdict = wrapper.find('[data-test="forge-verdict"]').text()
    expect(verdict).not.toContain('forge.verdicts.')
    expect(wrapper.find('[data-test="forge-cta"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('the assembly stage renders module fly-in steps during computing/done', async () => {
    const wrapper = await mountForge()
    expect(wrapper.find('[data-test="forge-stage"]').exists()).toBe(false)
    await wrapper.find('[data-test="forge-button"]').trigger('click')
    await nextTick()
    const stage = wrapper.find('[data-test="forge-stage"]')
    expect(stage.exists()).toBe(true)
    const modules = stage.findAll('.forge-module')
    expect(modules.length).toBeGreaterThan(1)
    wrapper.unmount()
  })

  it('reroll re-forges and reset clears the stage + result', async () => {
    const wrapper = await mountForge()
    await wrapper.find('[data-test="forge-button"]').trigger('click')
    await nextTick()
    await driveRAF(() => wrapper.find('[data-test="forge-result"]').exists())
    expect(wrapper.find('[data-test="forge-result"]').exists()).toBe(true)

    // Reroll -> re-forges; result stays present.
    await wrapper.find('[data-test="forge-reroll"]').trigger('click')
    await nextTick()
    await driveRAF(() => wrapper.find('[data-test="forge-result"]').exists())
    expect(wrapper.find('[data-test="forge-result"]').exists()).toBe(true)

    // Reset -> stage + result gone.
    await wrapper.find('[data-test="forge-reset"]').trigger('click')
    await nextTick()
    expect(wrapper.find('[data-test="forge-result"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="forge-stage"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('changing industry after a result re-forges (AC4 view-level)', async () => {
    const wrapper = await mountForge()
    await wrapper.find('[data-test="forge-button"]').trigger('click')
    await nextTick()
    await driveRAF(() => wrapper.find('[data-test="forge-result"]').exists())
    expect(wrapper.find('[data-test="forge-result"]').exists()).toBe(true)

    const healthChip = wrapper.find('[data-test="forge-industry"][data-key="health"]')
    await healthChip.trigger('click')
    await nextTick()
    await driveRAF(() => wrapper.find('[data-test="forge-result"]').exists())
    expect(wrapper.find('[data-test="forge-result"]').exists()).toBe(true)
    expect(healthChip.classes()).toContain('active')
    wrapper.unmount()
  })

  it('the scale slider + priority toggles update config state', async () => {
    const wrapper = await mountForge()
    const slider = wrapper.find('[data-test="forge-scale"]')
    await slider.setValue('5')
    expect((slider.element as HTMLInputElement).value).toBe('5')

    const prio = wrapper.find('[data-test="forge-priority"][data-key="speed"]')
    await prio.trigger('click')
    expect(prio.classes()).toContain('active')
    await prio.trigger('click')
    expect(prio.classes()).not.toContain('active')
    wrapper.unmount()
  })

  it('reduced motion: forge jumps to done with a single collapsed timeline step', async () => {
    const wrapper = await mountForge(true)
    await wrapper.find('[data-test="forge-button"]').trigger('click')
    await nextTick()
    await flushPromises()
    // Reduced motion skips the rAF loop -> done immediately, no frames drained.
    expect(wrapper.find('[data-test="forge-result"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="solution-forge"]').classes()).toContain('reduced-motion')
    const modules = wrapper.findAll('.forge-module')
    expect(modules.length).toBe(1)
    wrapper.unmount()
  })

  it('renders localized copy in zh (no English fallback, no raw keys)', async () => {
    // useLanguage reads its language ref at module load; flip it reactively via
    // setLanguage (localStorage alone won't update the already-created ref).
    const { useLanguage } = await import('../../composables/useLanguage')
    useLanguage().setLanguage('zh')
    const wrapper = await mountForge()
    const title = wrapper.find('.forge-title').text()
    expect(title).not.toContain('forge.title')
    expect(title).not.toBe('AI Solution Forge')
    expect(/[一-鿿]/.test(title)).toBe(true)
    // Reset for subsequent tests.
    useLanguage().setLanguage('en')
    wrapper.unmount()
  })
})
