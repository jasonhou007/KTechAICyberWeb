/**
 * @file tests/setup-intersection-observer.js
 * @description Vitest global setup — installs a fire-on-observe
 * IntersectionObserver polyfill so lazy-mounted components (#224 LazySection)
 * render their slots in the test environment.
 *
 * Why: happy-dom ships an IntersectionObserver *constructor* but it never
 * simulates viewport intersection, so the callback never fires and lazy slots
 * stay hidden forever — exactly the useSkeleton isLoading failure mode (iter
 * memory). In a real browser, a component mounted in a test is effectively
 * "in view" of the synthetic viewport, so firing isIntersecting=true on
 * observe() matches real behavior for the unit-test use case.
 *
 * Per-test overrides: any test that installs its own IntersectionObserver
 * mock (e.g. tests/unit/lazy-section.spec.js "renders nothing before
 * intersection", src/components/__tests__/FadeIn.test.ts) replaces this global
 * for the duration of that test, so this polyfill does not interfere with
 * tests that need a non-firing or controllable observer.
 *
 * @ticket #224
 */

class IntersectionObserverPolyfill {
  constructor(callback, options) {
    this.callback = callback
    this.options = options || {}
    this.observed = new Set()
  }
  observe(element) {
    if (!element) return
    this.observed.add(element)
    // Fire as intersecting on the microtask queue. The real IntersectionObserver
    // fires asynchronously (never synchronously inside observe()); deferring to
    // a microtask mirrors that and lets the composable's onIntersect run after
    // the current synchronous mount completes, so isVisible flips cleanly.
    // The defineAsyncComponent chunk load then resolves on a subsequent tick —
    // wiring tests add a macrotask wait + flushPromises to cover that hop.
    Promise.resolve().then(() => {
      if (this.observed.has(element)) {
        this.callback(
          [{ isIntersecting: true, target: element, intersectionRatio: 1 }],
          this,
        )
      }
    })
  }
  unobserve(element) {
    this.observed.delete(element)
  }
  disconnect() {
    this.observed.clear()
  }
  takeRecords() {
    return []
  }
}

// happy-dom ships an IntersectionObserver constructor that never fires the
// callback (no viewport simulation), so lazy slots stay hidden. FORCE-override
// it on both globalThis and window with the fire-on-observe polyfill. Per-test
// mocks that install their own observer (lazy-section.spec.js "renders nothing
// before intersection", FadeIn.test.ts) replace this for their duration.
globalThis.IntersectionObserver = IntersectionObserverPolyfill
if (typeof window !== 'undefined') {
  window.IntersectionObserver = IntersectionObserverPolyfill
}

export { IntersectionObserverPolyfill }
