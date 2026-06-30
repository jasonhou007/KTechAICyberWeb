/**
 * @file AsyncLoadError.test.ts
 * @description Unit tests for the shared chunk-load error affordance (#232).
 *
 * Drives the REAL async failure path: a `defineAsyncComponent` whose loader
 * rejects, wired with the SAME onError retry policy Home.vue uses. Asserts the
 * user-visible effect (role=alert, aria-live, localized copy, retry button) and
 * that the loader is genuinely re-invoked on retry — NOT a void no-op
 * (wired-not-just-tested gate, iter-23).
 *
 * RED-TEST PROOF: before AsyncLoadError.vue exists, the import throws
 * "Cannot find module '../AsyncLoadError.vue'" and every case fails.
 *
 * @ticket #232
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineAsyncComponent, h, defineComponent, ref } from 'vue'
import { useLanguage } from '../../composables/useLanguage.js'
import AsyncLoadError from '../AsyncLoadError.vue'

// Bounded promise flush: Vue's async-component scheduler re-tries on the
// microtask queue, so we drain it in a tight loop with a hard ceiling. This
// replaces arbitrary fixed sleeps with a deterministic macrotask pump.
const flushAsync = async (rounds = 20) => {
  for (let i = 0; i < rounds; i++) {
    await flushPromises()
  }
}

describe('AsyncLoadError.vue', () => {
  beforeEach(() => {
    useLanguage().setLanguage('en')
  })

  it('renders the error component when the loader rejects', async () => {
    // Real defineAsyncComponent wired exactly like Home.vue: errorComponent +
    // onError retry policy (<=2 attempts) + timeout.
    const Broken = defineAsyncComponent({
      loader: () => Promise.reject(new Error('chunk fetch failed')),
      errorComponent: AsyncLoadError,
      timeout: 8000,
      onError(err, retry, fail, attempts) {
        if (attempts <= 2) retry()
        else fail()
      },
    })
    const Host = defineComponent({
      render: () => h(Broken),
    })
    const wrapper = mount(Host)
    await flushAsync()

    // User-visible effect: the alert region exists with the en copy.
    expect(wrapper.find('[data-test="async-load-error"]').exists()).toBe(true)
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Reload section')
    wrapper.unmount()
  })

  it('auto-retries up to 2 times before showing the error', async () => {
    // A vi.fn() loader that always rejects. After 1 initial + 2 retries = 3
    // invocations the errorComponent renders.
    const loader = vi.fn(() => Promise.reject(new Error('always fails')))
    const Broken = defineAsyncComponent({
      loader,
      errorComponent: AsyncLoadError,
      timeout: 8000,
      onError(err, retry, fail, attempts) {
        if (attempts <= 2) retry()
        else fail()
      },
    })
    const Host = defineComponent({ render: () => h(Broken) })
    const wrapper = mount(Host)
    await flushAsync()

    expect(loader).toHaveBeenCalledTimes(3)
    expect(wrapper.find('[data-test="async-load-error"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('the Reload button emits retry on click', async () => {
    const wrapper = mount(AsyncLoadError)
    const btn = wrapper.find('[data-test="async-load-error-retry"]')
    // WCAG 2.1.1: a real, focusable, keyboard-activatable native button.
    expect(btn.element.tagName).toBe('BUTTON')
    await btn.trigger('click')
    expect(wrapper.emitted('retry')).toBeTruthy()
    expect(wrapper.emitted('retry')!.length).toBe(1)
    wrapper.unmount()
  })

  it('renders zh copy when language is zh', async () => {
    useLanguage().setLanguage('zh')
    const Broken = defineAsyncComponent({
      loader: () => Promise.reject(new Error('fail')),
      errorComponent: AsyncLoadError,
      timeout: 8000,
      onError(err, retry, fail, attempts) {
        if (attempts <= 2) retry()
        else fail()
      },
    })
    const Host = defineComponent({ render: () => h(Broken) })
    const wrapper = mount(Host)
    await flushAsync()

    expect(wrapper.text()).toContain('重新加载区块')
    wrapper.unmount()
  })

  it('satisfies a11y: role=alert + aria-live=assertive', () => {
    const wrapper = mount(AsyncLoadError)
    const region = wrapper.find('[data-test="async-load-error"]')
    expect(region.attributes('role')).toBe('alert')
    expect(region.attributes('aria-live')).toBe('assertive')
    wrapper.unmount()
  })
})

/**
 * WIRED-NOT-JUST-TESTED gate: the user-facing retry path must actually
 * re-trigger a load. defineAsyncComponent exposes no public re-load API after
 * fail(), so Home.vue bumps a `:key` on the LazySection to force a remount of
 * the async boundary, which re-runs the loader (resetting attempts). This test
 * mounts a host that mirrors that wiring and asserts the loader invocation
 * count rises AFTER the retry click — proving the click is not a no-op.
 */
describe('AsyncLoadError wiring — retry re-invokes the loader', () => {
  beforeEach(() => {
    useLanguage().setLanguage('en')
  })

  it('clicking Reload forces a remount that re-runs the loader', async () => {
    const loader = vi.fn(() => Promise.reject(new Error('fail')))

    // Build the async component the same way Home.vue does.
    const makeBroken = () =>
      defineAsyncComponent({
        loader,
        errorComponent: AsyncLoadError,
        timeout: 8000,
        onError(err, retry, fail, attempts) {
          if (attempts <= 2) retry()
          else fail()
        },
      })

    // Host mirrors Home.vue's :key-bump remount strategy: a reactive counter
    // drives the :key on the async boundary, and bumpRetry() increments it.
    // The errorComponent receives the bumpRetry handler via a prop so the
    // Reload click can reach back up through the async boundary.
    const Host = defineComponent({
      setup() {
        const retryKey = ref(0)
        const bumpRetry = () => {
          retryKey.value++
        }
        return () =>
          h(makeBroken(), {
            key: retryKey.value,
            // Passed as a prop to the errorComponent by Vue's async wrapper.
            onRetry: bumpRetry,
          })
      },
    })

    const wrapper = mount(Host)
    await flushAsync()

    // Initial fail-through: 1 + 2 retries.
    const callsAfterFirstFail = loader.mock.calls.length
    expect(callsAfterFirstFail).toBe(3)
    expect(wrapper.find('[data-test="async-load-error"]').exists()).toBe(true)

    // The wired retry: click the Reload button -> bumpRetry -> :key changes ->
    // async boundary remounts -> loader runs again.
    const retryBtn = wrapper.find('[data-test="async-load-error-retry"]')
    expect(retryBtn.exists()).toBe(true)
    await retryBtn.trigger('click')
    await flushAsync()

    // The loader MUST have been invoked again after the click. If this assertion
    // fails, the retry wiring is a no-op and the test must NOT be weakened.
    expect(loader.mock.calls.length).toBeGreaterThan(callsAfterFirstFail)
    wrapper.unmount()
  })
})
