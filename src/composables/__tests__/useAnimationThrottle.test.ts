/**
 * @file useAnimationThrottle.test.ts
 * @description Unit tests for useAnimationThrottle (Issue #253 perf).
 * @ticket #253 - Pause always-on view-level timers when the page is hidden
 * OR the element is scrolled offscreen (eliminates the "NeuralTerminal glitch"
 * by stopping the activityDecay interval when nobody is looking at it).
 *
 * The composable is built on VueUse's useDocumentVisibility + useIntersectionObserver.
 * VueUse's useDocumentVisibility reads document.visibilityState and listens for
 * the `visibilitychange` event; its useIntersectionObserver wraps the native IO.
 * The global setup-intersection-observer.js fires isIntersecting=true on observe,
 * so by default an in-DOM target reports visible. Tests that need the
 * "offscreen" branch install a controllable IO that reports isIntersecting=false.
 *
 * Drives a real host component that mounts the composable so onMounted/onUnmounted
 * fire exactly as in production. No internals are mutated.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import { useAnimationThrottle } from '../useAnimationThrottle.js'

// ---------------------------------------------------------------------------
// Controllable IntersectionObserver — overrides the global fire-on-observe
// polyfill so a test can report isIntersecting=false (the "offscreen" branch).
// ---------------------------------------------------------------------------
interface ObserverController {
  callback: IntersectionObserverCallback
  observe: ReturnType<typeof vi.fn>
  unobserve: ReturnType<typeof vi.fn>
  disconnect: ReturnType<typeof vi.fn>
  fire: (entries: Partial<IntersectionObserverEntry>[]) => void
}

const instances: ObserverController[] = []

function installControllableIO() {
  const saved = (globalThis as any).IntersectionObserver
  class FakeIO {
    callback: IntersectionObserverCallback
    options: any
    observe = vi.fn()
    unobserve = vi.fn()
    disconnect = vi.fn()
    takeRecords = vi.fn(() => [])
    root = null
    rootMargin = ''
    thresholds: number[] = []
    constructor(callback: IntersectionObserverCallback, options: any = {}) {
      this.callback = callback
      this.options = options
      const ctrl: ObserverController = {
        callback,
        observe: this.observe,
        unobserve: this.unobserve,
        disconnect: this.disconnect,
        fire: (entries) =>
          callback(
            entries as IntersectionObserverEntry[],
            this as unknown as IntersectionObserver,
          ),
      }
      instances.push(ctrl)
    }
  }
  ;(globalThis as any).IntersectionObserver = FakeIO
  if (typeof window !== 'undefined') {
    ;(window as any).IntersectionObserver = FakeIO
  }
  return () => {
    ;(globalThis as any).IntersectionObserver = saved
    if (typeof window !== 'undefined') {
      ;(window as any).IntersectionObserver = saved
    }
  }
}

function lastObserver(): ObserverController {
  return instances[instances.length - 1]
}

/** Build a host component that mounts the composable against a real ref. */
function makeHost(options: Record<string, unknown> = {}) {
  return defineComponent({
    name: 'ThrottleHost',
    setup() {
      const target = ref<HTMLElement | null>(null)
      const { isPaused } = useAnimationThrottle(target, options)
      return () =>
        h('div', { ref: target, 'data-paused': String(isPaused.value) })
    },
  })
}

describe('useAnimationThrottle (#253)', () => {
  let restoreIO: (() => void) | undefined
  let savedHidden: boolean

  beforeEach(() => {
    instances.length = 0
    savedHidden = document.hidden
    // Default: page visible.
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: false,
    })
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    })
  })

  afterEach(() => {
    if (restoreIO) {
      restoreIO()
      restoreIO = undefined
    }
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: savedHidden,
    })
  })

  it('isPaused is false on mount when the page is visible and the element is in view', async () => {
    const Host = makeHost()
    const wrapper = mount(Host)
    // The global setup-intersection-observer.js polyfill fires
    // isIntersecting=true on observe (real-browser default for an in-DOM
    // element), so isPaused should settle to false.
    await new Promise((r) => setTimeout(r, 0))
    expect(wrapper.find('[data-paused]').attributes('data-paused')).toBe('false')
    wrapper.unmount()
  })

  it('isPaused becomes true when document.visibilityState flips to hidden', async () => {
    const Host = makeHost()
    const wrapper = mount(Host)
    await new Promise((r) => setTimeout(r, 0))
    expect(wrapper.find('[data-paused]').attributes('data-paused')).toBe('false')

    // Flip the page hidden and dispatch the event VueUse listens for.
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: true,
    })
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden',
    })
    document.dispatchEvent(new Event('visibilitychange'))
    await new Promise((r) => setTimeout(r, 0))

    expect(wrapper.find('[data-paused]').attributes('data-paused')).toBe('true')

    // And recovers when visible again.
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: false,
    })
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    })
    document.dispatchEvent(new Event('visibilitychange'))
    await new Promise((r) => setTimeout(r, 0))
    expect(wrapper.find('[data-paused]').attributes('data-paused')).toBe('false')
    wrapper.unmount()
  })

  it('isPaused becomes true when IntersectionObserver reports the element offscreen', async () => {
    // Install a controllable IO so we can report isIntersecting=false.
    restoreIO = installControllableIO()
    const Host = makeHost()
    const wrapper = mount(Host)
    await new Promise((r) => setTimeout(r, 0))
    const obs = lastObserver()
    const target = wrapper.find('div').element

    // Conservative default: BEFORE the first IO callback the composable does not
    // yet know whether the element is in view, so it starts paused (treats
    // intersectionRatio=0 as offscreen). Drive an explicit "in view" callback
    // to bring it back to not-paused, then prove offscreen re-pauses.
    obs.fire([{ isIntersecting: true, target, intersectionRatio: 1 }])
    await new Promise((r) => setTimeout(r, 0))
    expect(wrapper.find('[data-paused]').attributes('data-paused')).toBe('false')

    // Element scrolled out of view.
    obs.fire([{ isIntersecting: false, target, intersectionRatio: 0 }])
    await new Promise((r) => setTimeout(r, 0))
    expect(wrapper.find('[data-paused]').attributes('data-paused')).toBe('true')

    // Scrolls back in.
    obs.fire([{ isIntersecting: true, target, intersectionRatio: 1 }])
    await new Promise((r) => setTimeout(r, 0))
    expect(wrapper.find('[data-paused]').attributes('data-paused')).toBe('false')
    wrapper.unmount()
  })

  it('cleans up its observers/listeners on unmount (no leak, no late mutation)', async () => {
    restoreIO = installControllableIO()
    const Host = makeHost()
    const wrapper = mount(Host)
    await new Promise((r) => setTimeout(r, 0))
    const obs = lastObserver()
    expect(obs.disconnect).toBeDefined()

    wrapper.unmount()

    // After unmount, VueUse should have called disconnect on the IO and removed
    // its visibilitychange listener — flipping visibility must NOT throw and the
    // unmounted wrapper's last attribute stays as it was.
    expect(() => {
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        value: true,
      })
      document.dispatchEvent(new Event('visibilitychange'))
    }).not.toThrow()
    expect(obs.disconnect).toHaveBeenCalled()
  })
})
