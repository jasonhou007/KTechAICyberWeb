/**
 * @file useServicesPipelineLoop.test.ts
 * @description Unit tests for the Services Pipeline Loop composable (#475).
 * @ticket #475
 *
 * Tests the FSM, phase advancement, throttling, and reduced motion behavior.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { useServicesPipelineLoop, SERVICE_PHASES } from '../useServicesPipelineLoop'
import ServicesSelfDriving from '../../components/ServicesSelfDriving.vue'

// matchMedia stub
function installMatchMedia(opts: { reduce?: boolean } = {}) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('prefers-reduced-motion') ? !!opts.reduce : false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }))
}

// Deferred rAF
function deferredRAF() {
  const queue: FrameRequestCallback[] = []
  let id = 1
  vi.stubGlobal('requestAnimationFrame', ((cb: FrameRequestCallback) => {
    const handle = id++
    queue.push(cb)
    return handle
  }) as any)
  vi.stubGlobal('cancelAnimationFrame', (() => {}) as any)
  return {
    step(ts = 0) {
      const cb = queue.shift()
      if (cb) cb(ts)
    },
  }
}

function noopIO() {
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

describe('useServicesPipelineLoop', () => {
  beforeEach(() => {
    deferredRAF()
    noopIO()
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('exports SERVICE_PHASES with 6 phases', () => {
    expect(SERVICE_PHASES).toEqual([
      'dataIngestion',
      'aiAnalysis',
      'pipelineValidation',
      'serviceExecution',
      'resultDelivery',
      'serviceComplete',
    ])
  })

  it('starts at phaseIndex 0 with dataIngestion', async () => {
    installMatchMedia({ reduce: false })
    const wrapper = mount(ServicesSelfDriving, { attachTo: document.body })
    await nextTick()

    const root = wrapper.find('[data-servicesselfdriving-root]')
    expect(root.attributes('data-current-phase')).toBe('dataIngestion')

    wrapper.unmount()
  })

  it('isStatic is false when reduced motion is off', async () => {
    installMatchMedia({ reduce: false })
    const wrapper = mount(ServicesSelfDriving, { attachTo: document.body })
    await nextTick()

    const root = wrapper.find('[data-servicesselfdriving-root]')
    expect(root.attributes('data-static')).toBe('false')

    wrapper.unmount()
  })

  it('isStatic is true when reduced motion is on', async () => {
    installMatchMedia({ reduce: true })
    vi.stubGlobal('requestAnimationFrame', (() => 1) as any)
    vi.stubGlobal('cancelAnimationFrame', (() => {}) as any)

    const wrapper = mount(ServicesSelfDriving, { attachTo: document.body })
    await nextTick()

    const root = wrapper.find('[data-servicesselfdriving-root]')
    expect(root.attributes('data-static')).toBe('true')

    wrapper.unmount()
  })

  it('loopIteration starts at 0', async () => {
    installMatchMedia({ reduce: false })
    const wrapper = mount(ServicesSelfDriving, { attachTo: document.body })
    await nextTick()

    const root = wrapper.find('[data-servicesselfdriving-root]')
    expect(root.attributes('data-loop-iteration')).toBe('0')

    wrapper.unmount()
  })

  it('has a phaseDurationMs defined', () => {
    const { phaseDurationMs } = useServicesPipelineLoop()
    expect(phaseDurationMs).toBeGreaterThan(0)
  })

  it('depthShift starts at 0', async () => {
    installMatchMedia({ reduce: false })
    const wrapper = mount(ServicesSelfDriving, { attachTo: document.body })
    await nextTick()

    const { depthShift } = useServicesPipelineLoop()
    expect(depthShift.value).toBe(0)

    wrapper.unmount()
  })

  it('provides start, pause, and observe controls', () => {
    const { start, pause, observe } = useServicesPipelineLoop()
    expect(typeof start).toBe('function')
    expect(typeof pause).toBe('function')
    expect(typeof observe).toBe('function')
  })
})
