/**
 * @file contrast-resolver.spec.js
 * @description Unit tests for the pure helpers used by the #252/#294 E2E
 * contrast gate (tests/e2e/252-color-contrast.spec.ts) to replace screenshot
 * pixel-sampling with COMPUTED-STYLE contrast measurement.
 *
 * Why computed-style over pixel-sampling (issue #294 / #252):
 *   The #252 E2E used to rasterize the .projects-badge to a canvas and sample
 *   glyph-edge pixels. On Mobile Safari (iPhone 13 viewport, webkit engine),
 *   mobile-viewport font anti-aliasing renders glyph-edge pixels at a different
 *   blend, so the sampled fg read rgb(255,0,170) on bg rgb(84,10,68) = 3.88:1
 *   (below the 4.5 AA gate) — while the SAME badge passes on chromium AND
 *   desktop webkit (CI run 28499977525). Source tokens are unchanged across
 *   engines and the genuine computed-style contrast is 5.50:1. Pixel-sampling
 *   is engine-dependent; computed-style is authoritative because the browser
 *   resolves var() -> rgb() identically across engines BEFORE paint.
 *
 * The two pure functions under test live file-local in the 252 E2E spec (YAGNI
 * — not extracted to tests/helpers/). This spec imports them by source path so
 * the unit gate fails loudly if either is removed or its contract changes.
 *
 * RED-PROOF (mandatory per project TDD discipline):
 *   The "transparent bg + multi-color gradient throws" and "transparent bg +
 *   none backgroundImage throws" cases prove the gate is REAL — a future
 *   mutation that silently picks stop[0] of a real 2-color gradient (which has
 *   no single representative color) would produce a FALSE-GREEN contrast
 *   number, so the resolver must throw and force a human decision.
 */
import { describe, it, expect, vi } from 'vitest'

// The two pure helpers live FILE-LOCAL in the #252 E2E spec (per plan:
// "Keep helpers file-local to the 252 spec — do not extract to tests/helpers/,
// YAGNI"). To unit-test them we import the spec's named exports. The spec
// calls @playwright/test's test.describe() at TOP LEVEL, which would crash
// under vitest ("Playwright Test did not expect test.describe() to be called
// here"); vi.mock neutralizes @playwright/test so the import is side-effect-
// free and the named exports become reachable. vi.mock is hoisted by vitest
// before the dynamic import below runs.
vi.mock('@playwright/test', () => ({
  test: Object.assign(() => {}, {
    describe: () => {},
    skip: () => {},
    only: () => {},
    info: () => ({ annotations: { push: () => {} } }),
  }),
  expect: Object.assign(() => ({}), { soft: () => ({}) }),
}))

const { parseCssColor, resolveEffectiveBackground } = await import('../e2e/252-color-contrast.spec.ts')

describe('#294 parseCssColor — rgb()/rgba() tolerance + alpha drop', () => {
  it('parses rgb(10, 10, 10) with spaces', () => {
    expect(parseCssColor('rgb(10, 10, 10)')).toEqual({ r: 10, g: 10, b: 10 })
  })

  it('parses rgb(255,0,170) with no spaces (browser-resolved form)', () => {
    expect(parseCssColor('rgb(255,0,170)')).toEqual({ r: 255, g: 0, b: 170 })
  })

  it('parses rgb(255, 0, 170) with spaces after commas', () => {
    expect(parseCssColor('rgb(255, 0, 170)')).toEqual({ r: 255, g: 0, b: 170 })
  })

  it('parses rgba(255, 0, 170, 0.2) and DROPS the alpha channel', () => {
    // Alpha is dropped because resolveEffectiveBackground only feeds opaque
    // representative colors into the WCAG math; an rgba with alpha<1 has no
    // single opaque representative and is the caller's responsibility (the
    // resolver's fast-path requires an opaque backgroundColor).
    expect(parseCssColor('rgba(255, 0, 170, 0.2)')).toEqual({ r: 255, g: 0, b: 170 })
  })

  it('throws on garbage input (fail-loud)', () => {
    expect(() => parseCssColor('garbage')).toThrow()
  })

  it('throws on empty string (fail-loud)', () => {
    expect(() => parseCssColor('')).toThrow()
  })
})

describe('#294 resolveEffectiveBackground — gradient/transparent resolution', () => {
  it('opaque backgroundColor fast-path returns it, ignoring backgroundImage', () => {
    // When backgroundColor is opaque (alpha === 1) it is the painted bg;
    // backgroundImage (gradients/images) layers ON TOP but for the #252 badge
    // the single-color gradient's first stop equals the would-be solid bg, so
    // the opaque fast-path is the authoritative measure.
    const resolved = resolveEffectiveBackground({
      color: 'rgb(10, 10, 10)',
      backgroundImage: 'linear-gradient(135deg, rgb(255, 0, 170), rgb(255, 0, 170))',
      backgroundColor: 'rgb(255, 0, 170)',
    })
    expect(resolved).toEqual({ r: 255, g: 0, b: 170 })
  })

  it('transparent bg + single-color linear-gradient (both stops equal) returns that color', () => {
    // The .projects-badge real case: backgroundColor is rgba(0,0,0,0)
    // (transparent — the gradient paints over it), backgroundImage is a
    // linear-gradient whose two stops resolve to the SAME color. There IS a
    // single representative color, so the resolver returns it.
    const resolved = resolveEffectiveBackground({
      color: 'rgb(10, 10, 10)',
      backgroundImage: 'linear-gradient(135deg, rgb(255, 0, 170), rgb(255, 0, 170))',
      backgroundColor: 'rgba(0, 0, 0, 0)',
    })
    expect(resolved).toEqual({ r: 255, g: 0, b: 170 })
  })

  it('is angle-agnostic: matches the first stop regardless of "to bottom right" prefix', () => {
    const resolved = resolveEffectiveBackground({
      color: 'rgb(10, 10, 10)',
      backgroundImage: 'linear-gradient(to bottom right, rgb(255, 0, 170), rgb(255, 0, 170))',
      backgroundColor: 'rgba(0, 0, 0, 0)',
    })
    expect(resolved).toEqual({ r: 255, g: 0, b: 170 })
  })

  it('RED-PROOF: transparent bg + REAL 2-color gradient (distinct stops) THROWS', () => {
    // A real 2-color gradient has NO single representative color. Silently
    // picking stop[0] would fabricate a contrast number — a false-green risk.
    // The resolver must throw and force a human decision.
    expect(() =>
      resolveEffectiveBackground({
        color: 'rgb(10, 10, 10)',
        backgroundImage: 'linear-gradient(135deg, rgb(255, 0, 170), rgb(0, 255, 0))',
        backgroundColor: 'rgba(0, 0, 0, 0)',
      }),
    ).toThrow()
  })

  it('RED-PROOF: transparent bg + "none" backgroundImage THROWS (fail-loud)', () => {
    // Transparent bg + no gradient => there is no painted bg color on this
    // element at all (it inherits/shows through). Throw rather than guess.
    expect(() =>
      resolveEffectiveBackground({
        color: 'rgb(10, 10, 10)',
        backgroundImage: 'none',
        backgroundColor: 'rgba(0, 0, 0, 0)',
      }),
    ).toThrow()
  })

  it('RED-PROOF: non-linear-gradient backgroundImage THROWS (e.g. url() image)', () => {
    expect(() =>
      resolveEffectiveBackground({
        color: 'rgb(10, 10, 10)',
        backgroundImage: 'url("data:image/png;base64,abc")',
        backgroundColor: 'rgba(0, 0, 0, 0)',
      }),
    ).toThrow()
  })

  it('full genuine #252 badge inputs resolve to magenta (the 5.50:1 case)', () => {
    // Sanity check with the EXACT computed-style strings getComputedStyle
    // produces for .projects-badge in the live browser (per planner analysis).
    const resolved = resolveEffectiveBackground({
      color: 'rgb(10, 10, 10)',
      backgroundImage: 'linear-gradient(135deg, rgb(255, 0, 170), rgb(255, 0, 170))',
      backgroundColor: 'rgba(0, 0, 0, 0)',
    })
    expect(resolved).toEqual({ r: 255, g: 0, b: 170 })
  })
})
