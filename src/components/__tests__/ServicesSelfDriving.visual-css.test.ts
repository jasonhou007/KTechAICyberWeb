/**
 * @file ServicesSelfDriving.visual-css.test.ts
 * @description CSS-SOURCE VISUAL GATE for the Services Self-Driving demo (#475).
 * @ticket #475 - [CYBER][SERVICES] Extend self-driving ambient demo to Services page
 *
 * Mirrors SelfDrivingDemo.visual-css.test.ts — asserts the component's OWN
 * <style> block contains the load-bearing visual rules as ACTIVE CSS, not just
 * classes on the DOM. DOM tests CANNOT see CSS, so silently deleting the
 * reduced-motion rule, neon gradient, glitch keyframes, or parallax transform
 * would PASS the entire suite while shipping a visually broken demo.
 *
 * Assertions:
 *  1. Root layering: .services-self-driving-demo declares `position: relative`
 *     AND a `z-index` (local stacking context).
 *  2. Neon palette usage: references at least one cyber CSS variable.
 *  3. AC2 GLITCH: a .services-self-driving-glitch rule + @keyframes exist.
 *  4. AC2 PARALLAX: .depth-layer carries a transform hook (will-change).
 *  5. AC4 REDUCED MOTION: @media (prefers-reduced-motion: reduce) kills animations.
 *  6. SCANLINES CONTAINMENT: :deep(.scanlines) override pins overlay to local scope.
 *  7. LIVE-DOM: depth-near plane carries a non-default computed transform.
 *
 * RED-TEST PROOF: removing any asserted CSS rule causes the corresponding test
 * to FAIL, confirming the guard actually enforces the visual contract.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import ServicesSelfDriving from '../ServicesSelfDriving.vue'

// ---------------------------------------------------------------------------
// matchMedia + rAF + IO stubs
// ---------------------------------------------------------------------------
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

/**
 * Read the ServicesSelfDriving SFC source, extract the <style> block, and strip
 * `/* ... *​/` comments so commented-out rules cannot satisfy an assertion.
 */
function getActiveScopedStyle(): string {
  const componentPath = resolve(__dirname, '..', 'ServicesSelfDriving.vue')
  const source = readFileSync(componentPath, 'utf8')
  const match = source.match(/<style[^>]*>([\s\S]*?)<\/style>/)
  const raw = match ? match[1] : ''
  // Strip block comments so a rule that only exists inside a /* */ comment
  // cannot masquerade as active CSS.
  return raw.replace(/\/\*[\s\S]*?\*\//g, '')
}

describe('ServicesSelfDriving — CSS-source visual gate (#475)', () => {
  let style: string

  beforeEach(() => {
    installMatchMedia({ reduce: false })
    deferredRAF()
    noopIO()
    style = getActiveScopedStyle()
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  // 1. Root layering --------------------------------------------------------

  it('root: .services-self-driving-demo is an IN-FLOW section (position: relative)', () => {
    // Services version is also an in-flow section, not a fixed background
    expect(style).toMatch(/\.services-self-driving-demo\s*\{[^}]*position:\s*relative/s)
    expect(style).not.toMatch(/\.services-self-driving-demo\s*\{[^}]*position:\s*fixed/s)
  })

  it('root: .services-self-driving-demo declares a z-index (local stacking context)', () => {
    expect(style).toMatch(/\.services-self-driving-demo\s*\{[^}]*z-index:\s*0/s)
  })

  // 2. Neon palette usage (no new colors invented) -------------------------

  it('palette: reuses an existing cyber CSS variable (--cyan|--magenta|--neon-*)', () => {
    // At least one of the documented neon tokens must appear as a var() usage
    expect(style).toMatch(
      /var\(--(?:cyan|magenta|neon-green|neon-blue|neon-pink)\b/,
    )
  })

  // 3. AC2 GLITCH transition (real CSS, not an empty div) ------------------

  it('AC2 glitch: .services-self-driving-glitch rule exists in active CSS', () => {
    expect(style).toMatch(/\.services-self-driving-glitch\s*\{/)
  })

  it('AC2 glitch: @keyframes for the glitch tear exist', () => {
    expect(style).toMatch(/@keyframes\s+services-self-driving-glitch-tear/)
  })

  it('AC2 glitch: the glitch animation is one-shot (animation property bound)', () => {
    expect(style).toMatch(/\.services-self-driving-glitch\s*\{[^}]*animation:\s*services-self-driving-glitch-tear/s)
  })

  // 4. AC2 PARALLAX depth (real transform hook) ----------------------------

  it('AC2 parallax: a .depth-layer rule carries a transform hook (will-change: transform)', () => {
    expect(style).toMatch(/\.depth-layer\s*\{[^}]*will-change:\s*transform/s)
  })

  it('AC2 parallax: three distinct depth plane selectors exist (far/mid/near)', () => {
    expect(style).toMatch(/\.depth-far\s*\{/)
    expect(style).toMatch(/\.depth-mid\s*\{/)
    expect(style).toMatch(/\.depth-near\s*\{/)
  })

  // 5. AC4 REDUCED MOTION (seizure-safety contract) ------------------------

  it('AC4 reduced motion: @media (prefers-reduced-motion: reduce) block exists', () => {
    expect(style).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/)
  })

  it('AC4 reduced motion: the @media block kills animation AND transition', () => {
    const blockMatch = style.match(
      /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?)\}\s*\}/,
    )
    expect(blockMatch, 'reduced-motion @media block must exist').not.toBeNull()
    const block = blockMatch![1]
    expect(block).toMatch(/animation:\s*none/)
    expect(block).toMatch(/transition:\s*none/)
  })

  it('AC4 reduced motion: the @media block pins depth + glitch transforms to none', () => {
    const blockMatch = style.match(
      /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?)\}\s*\}/,
    )
    expect(blockMatch).not.toBeNull()
    const block = blockMatch![1]
    expect(block).toMatch(/\.depth-layer/)
    expect(block).toMatch(/transform:\s*none/)
  })

  // 6. SCANLINES CONTAINMENT (services variant) -------------------------------

  it('scanlines: :deep(.scanlines) override re-pins the overlay to position:absolute', () => {
    expect(style).toMatch(/\.services-self-driving-demo\s*:deep\(\.scanlines\)\s*\{[^}]*position:\s*absolute/s)
  })

  it('scanlines: :deep(.scanlines) override sets z-index:0 (NOT 1000)', () => {
    const overrideMatch = style.match(
      /\.services-self-driving-demo\s*:deep\(\.scanlines\)\s*\{([^}]*)\}/s,
    )
    expect(overrideMatch, ':deep(.scanlines) override rule must exist').not.toBeNull()
    const body = overrideMatch![1]
    expect(body).toMatch(/z-index:\s*0\b/)
    expect(body).not.toMatch(/z-index:\s*1000/)
  })

  it('scanlines: a .services-self-driving-scanlines-scope wrapper establishes the local stacking context', () => {
    expect(style).toMatch(/\.services-self-driving-scanlines-scope\s*\{[^}]*position:\s*absolute/s)
    expect(style).toMatch(/\.services-self-driving-scanlines-scope\s*\{[^}]*z-index:\s*0/s)
    expect(style).toMatch(/\.services-self-driving-scanlines-scope\s*\{[^}]*overflow:\s*hidden/s)
  })

  it('scanlines live-DOM: Scanlines is wrapped by .services-self-driving-scanlines-scope', async () => {
    const wrapper = mount(ServicesSelfDriving, { attachTo: document.body })
    await nextTick()
    const scope = wrapper.find('.services-self-driving-scanlines-scope')
    expect(scope.exists()).toBe(true)
    expect(scope.find('.scanlines').exists()).toBe(true)
    const root = wrapper.find('.services-self-driving-demo')
    const directChildScanlines = root.findAll(':scope > .scanlines')
    expect(directChildScanlines.length).toBe(0)
    wrapper.unmount()
  })

  // 7. LIVE-DOM check (inline transform resolves in happy-dom) -------------

  it('live-DOM: the depth-near plane carries a non-default computed transform', async () => {
    const wrapper = mount(ServicesSelfDriving, { attachTo: document.body })
    await nextTick()
    const nearEl = wrapper.find('.depth-near').element as HTMLElement
    const computed = window.getComputedStyle(nearEl).transform
    expect(computed).toBeTruthy()
    expect(computed).not.toBe('none')
    wrapper.unmount()
  })

  it('live-DOM: under reduced motion the depth-near transform collapses to none/0', async () => {
    installMatchMedia({ reduce: true })
    vi.stubGlobal('requestAnimationFrame', (() => 1) as any)
    vi.stubGlobal('cancelAnimationFrame', (() => {}) as any)
    const wrapper = mount(ServicesSelfDriving, { attachTo: document.body })
    await nextTick()
    const nearEl = wrapper.find('.depth-near').element as HTMLElement
    const inline = nearEl.style.transform
    expect(inline).toMatch(/translate3d\(0(?:\.00)?px/)
    wrapper.unmount()
  })
})
