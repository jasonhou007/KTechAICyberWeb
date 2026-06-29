/**
 * @file lazy-section.spec.js
 * @description Unit tests for the LazySection wrapper (#224 perf: lazy-mount
 * below-the-fold Home modules so their rAF loops + CSS animations only spin up
 * when scrolled into view).
 *
 * Drives the REAL useIntersectionObserver composable — no mock. In jsdom there
 * is NO IntersectionObserver, so the composable's SSR/unsupported fallback
 * renders the slot immediately. To exercise the "renders nothing before
 * intersection" branch we polyfill a minimal IntersectionObserver whose
 * `isIntersecting` is controlled by the test, then exercise observe() via the
 * wrapper's ref binding.
 *
 * @ticket #224
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import LazySection from '../../src/components/LazySection.vue'

// A controllable IntersectionObserver stand-in. The test flips `intersecting`
// to drive the callback. Entries shaped to match what the composable reads
// (entry.isIntersecting + entry.target).
function makeObserverMock() {
  let cb = null
  const instances = []
  const observers = []
  class MockObserver {
    constructor(callback, opts) {
      cb = callback
      this.opts = opts
      this.observed = []
      instances.push(this)
    }
    observe(el) {
      this.observed.push(el)
    }
    unobserve() {}
    disconnect() {}
  }
  return {
    MockObserver,
    fire({ intersecting = true, target = null } = {}) {
      const tgt = target || (instances[0] && instances[0].observed[0])
      if (cb && tgt) cb([{ isIntersecting: intersecting, target: tgt }])
    },
    instances,
  }
}

describe('LazySection.vue', () => {
  let savedIO
  let savedWindowIO

  beforeEach(() => {
    savedIO = global.IntersectionObserver
    savedWindowIO = window.IntersectionObserver
  })

  afterEach(() => {
    // Restore — some tests delete the observer to exercise the fallback branch.
    if (savedIO) {
      global.IntersectionObserver = savedIO
      window.IntersectionObserver = savedWindowIO
    } else {
      delete global.IntersectionObserver
      delete window.IntersectionObserver
    }
  })

  const mountLazy = (props = {}, slots = {}) =>
    mount(LazySection, {
      props,
      slots: { default: '<div class="slotted">mounted payload</div>' },
      ...slots,
    })

  it('renders nothing in its slot before intersection (lazy)', async () => {
    const { MockObserver } = makeObserverMock()
    global.IntersectionObserver = MockObserver
    window.IntersectionObserver = MockObserver

    const w = mountLazy({ dataTest: 'lazy-x' })
    await flushPromises()
    // Sentinel wrapper exists, but the slotted payload does NOT render until
    // the observer fires an intersection.
    expect(w.find('[data-test="lazy-x"]').exists()).toBe(true)
    expect(w.find('.slotted').exists()).toBe(false)
  })

  it('renders the slot AFTER intersection fires', async () => {
    const obs = makeObserverMock()
    global.IntersectionObserver = obs.MockObserver
    window.IntersectionObserver = obs.MockObserver

    const w = mountLazy({ dataTest: 'lazy-y' })
    await flushPromises()
    expect(w.find('.slotted').exists()).toBe(false)

    obs.fire({ intersecting: true })
    await flushPromises()
    await nextTick()

    expect(w.find('.slotted').exists()).toBe(true)
    expect(w.text()).toContain('mounted payload')
  })

  it('renders immediately (SSR-safe fallback) when IntersectionObserver is absent', async () => {
    // jsdom default: no IntersectionObserver. The composable's observe() sets
    // isVisible=true immediately, so the slot renders on first paint. This is
    // the SSR/legacy-browser fallback — content must never disappear forever.
    delete global.IntersectionObserver
    delete window.IntersectionObserver

    const w = mountLazy({ dataTest: 'lazy-z' })
    await flushPromises()
    expect(w.find('.slotted').exists()).toBe(true)
  })

  it('renders only ONCE and stays mounted after intersection (no flicker-off)', async () => {
    const obs = makeObserverMock()
    global.IntersectionObserver = obs.MockObserver
    window.IntersectionObserver = obs.MockObserver

    const w = mountLazy({ dataTest: 'lazy-sticky' })
    await flushPromises()
    obs.fire({ intersecting: true })
    await flushPromises()
    expect(w.find('.slotted').exists()).toBe(true)

    // Scrolling back out must NOT unmount the payload.
    obs.fire({ intersecting: false })
    await flushPromises()
    expect(w.find('.slotted').exists()).toBe(true)
  })

  it('forwards the dataTest attribute to its wrapper element', async () => {
    delete global.IntersectionObserver
    delete window.IntersectionObserver

    const w = mountLazy({ dataTest: 'lazy-neural-core' })
    await flushPromises()
    expect(w.find('[data-test="lazy-neural-core"]').exists()).toBe(true)
  })

  it('renders the configured tag (default section) as the wrapper', async () => {
    delete global.IntersectionObserver
    delete window.IntersectionObserver

    const w = mountLazy({ dataTest: 'lazy-tag-default' })
    await flushPromises()
    // Default tag is <section> (semantic landmark, matches Home's module wrappers).
    expect(w.find('section[data-test="lazy-tag-default"]').exists()).toBe(true)
  })

  it('passes through observer options (rootMargin, threshold) to the observer constructor', async () => {
    const obs = makeObserverMock()
    global.IntersectionObserver = obs.MockObserver
    window.IntersectionObserver = obs.MockObserver

    mountLazy({ dataTest: 'lazy-opts', rootMargin: '300px', threshold: 0.25 })
    await flushPromises()
    expect(obs.instances.length).toBeGreaterThanOrEqual(1)
    // The composable merges user options into its defaults; rootMargin + the
    // custom threshold must survive into the constructor call.
    expect(obs.instances[0].opts.rootMargin).toBe('300px')
    expect(obs.instances[0].opts.threshold).toBe(0.25)
  })

  it('mounts the slot when focus enters the wrapper (keyboard/AT path, WCAG 2.1.1)', async () => {
    // A keyboard-only user Tabbing into a below-the-fold lazy section, or an AT
    // virtual cursor landing focus inside it, must trigger the mount even when
    // the viewport never intersects the sentinel. focusin bubbles, so a single
    // listener on the wrapper covers focus moving to any slotted descendant.
    const obs = makeObserverMock()
    global.IntersectionObserver = obs.MockObserver
    window.IntersectionObserver = obs.MockObserver

    const w = mount(LazySection, {
      props: { dataTest: 'lazy-focus' },
      slots: { default: '<button class="focus-target">focus me</button>' },
    })
    await flushPromises()
    // Before any focus event: slot is NOT mounted (intersection never fired).
    expect(w.find('.focus-target').exists()).toBe(false)

    // Keyboard focus lands on the slotted button (or its wrapper). focusin
    // bubbles up to the wrapper listener and must flip isVisible -> true.
    const wrapper = w.find('[data-test="lazy-focus"]')
    wrapper.trigger('focusin')
    await flushPromises()
    await nextTick()

    expect(w.find('.focus-target').exists()).toBe(true)
    expect(w.text()).toContain('focus me')
  })

  it('forwards the dataTest attribute to its wrapper element', async () => {
    // CLS guard (iter-16 perf): the wrapper must hold vertical space so the page
    // does not jump when the lazy module mounts. We assert via a non-empty
    // min-height style hook on the wrapper element class.
    const obs = makeObserverMock()
    global.IntersectionObserver = obs.MockObserver
    window.IntersectionObserver = obs.MockObserver

    const w = mountLazy({ dataTest: 'lazy-cls' })
    await flushPromises()
    const wrapper = w.find('[data-test="lazy-cls"]')
    expect(wrapper.exists()).toBe(true)
    // The wrapper carries a reserved-height class so its layout slot is held
    // even before the slot renders.
    expect(wrapper.classes()).toContain('lazy-section')
  })

  it('rejects a tag outside the safe whitelist (defense-in-depth validator)', async () => {
    // The tag prop drives <component :is="tag">, which can instantiate any
    // resolved component name. Restrict it to a whitelist of safe native
    // landmark/wrapper tags so a future caller cannot pass 'script', 'img',
    // or an arbitrary component identifier. Vue emits a console warning when
    // a custom validator returns false.
    delete global.IntersectionObserver
    delete window.IntersectionObserver

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mountLazy({ tag: 'script' })
    await flushPromises()
    expect(warnSpy).toHaveBeenCalled()
    const warned = warnSpy.mock.calls
      .map(c => String(c[0]))
      .join('\n')
    expect(warned).toMatch(/Invalid prop.*tag/)
    warnSpy.mockRestore()
  })

  it('accepts every whitelisted tag without warning', async () => {
    // Whitelist must not regress the documented tag set — every safe native
    // landmark/wrapper tag passes the validator silently.
    delete global.IntersectionObserver
    delete window.IntersectionObserver

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    for (const tag of ['section', 'div', 'article', 'aside', 'main']) {
      const w = mountLazy({ tag, dataTest: `lazy-tag-${tag}` })
      await flushPromises()
      expect(w.find(`${tag}[data-test="lazy-tag-${tag}"]`).exists()).toBe(true)
    }
    const propWarnings = warnSpy.mock.calls
      .filter(c => String(c[0]).match(/Invalid prop.*tag/))
    expect(propWarnings).toHaveLength(0)
    warnSpy.mockRestore()
  })
})
