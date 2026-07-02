import { test, expect } from '@playwright/test'

/**
 * Color contrast — AC #252 (Critical contrast fixes, LIVE computed style).
 *
 * The unit gate (tests/unit/color-audit-252.spec.js) asserts the CSS SOURCE
 * routes through tokens. This E2E asserts the user-visible result: the LIVE
 * getComputedStyle on the two most prominent fixed surfaces clears the WCAG
 * AA 4.5:1 normal-text floor.
 *
 * Fixed surfaces under test:
 *   - /careers  .position-card__badge  (was #8b00ff purple, 3.02:1 FAIL)
 *   - /about    .projects-badge        (was #fff on #ff6600 orange, 2.94:1 FAIL)
 *
 * MEASUREMENT METHOD (#294): computed-style contrast. We read
 *   getComputedStyle(el).color             (resolved foreground)
 *   getComputedStyle(el).backgroundColor   (opaque fast-path) OR
 *   getComputedStyle(el).backgroundImage   (single-color linear-gradient,
 *                                           transparent backgroundColor case)
 * and run the WCAG 2.1 ratio in JS. Computed-style is AUTHORITATIVE: the
 * browser resolves var() -> rgb() IDENTICALLY across engines (chromium,
 * webkit, Mobile Safari) BEFORE paint, so the ratio is deterministic by
 * construction and not subject to font anti-aliasing.
 *
 * WHY NOT PIXEL-SAMPLING (#294 root cause): the prior harness rasterized the
 * .projects-badge to a canvas and sampled glyph-edge pixels. On Mobile Safari
 * (iPhone 13 viewport, webkit engine), mobile-viewport font anti-aliasing
 * renders glyph-edge pixels at a different blend, so the sampled fg read
 * rgb(255,0,170) on bg rgb(84,10,68) = 3.88:1 — below the 4.5 AA gate — while
 * the SAME badge passed on chromium AND desktop webkit (CI run 28499977525).
 * The source tokens are unchanged across engines; the genuine computed-style
 * contrast is 5.50:1 (fg --bg-primary=#0a0a0a on bg --accent-magenta=#ff00aa,
 * the single-color gradient's first stop). Pixel-sampling was an
 * engine-dependent proxy for a property the browser already resolves
 * authoritatively; #294 replaces it with the causal measure.
 *
 * The /careers .position-card__badge test uses the computed-style measure
 * (getComputedStyle + resolveEffectiveBackground), NOT samplePaintedColors.
 * #310 moved the badge background to a fully OPAQUE dark surface (--bg-primary
 * #0a0a0a) specifically so computed-style works: the browser resolves the
 * opaque backgroundColor fast-path deterministically across engines, giving
 * magenta #ff00aa on #0a0a0a = 5.5:1. (PRE-#310 the bg was a 20% magenta
 * TINT composited over the card, where computed-style returned the layer
 * beneath and pixel-sampling read anti-aliased glyph edges + a CI-flaky 4.12:1
 * with light text — both fixed by making the bg opaque.)
 *
 * Note on routes: the PositionList view is served at /careers (see
 * src/main.js route table). About is at /about. Both use the Vite base
 * subpath /KTechAICyberWeb/ (see playwright.config.ts).
 *
 * Tags: @regression @a11y @contrast
 */

const BASE = '/KTechAICyberWeb/'
const CAREERS = `${BASE}careers`
const ABOUT = `${BASE}about`

// ---------- WCAG 2.1 contrast math ----------

function relLum({ r, g, b }: { r: number; g: number; b: number }): number {
  const chan = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b)
}

/** WCAG 2.1 contrast ratio between two {r,g,b} colors (>=1.0). */
function contrastRatio(fg: { r: number; g: number; b: number }, bg: { r: number; g: number; b: number }): number {
  const L1 = relLum(fg)
  const L2 = relLum(bg)
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1]
  return (hi + 0.05) / (lo + 0.05)
}

// ---------- Computed-style color resolution (#294) ----------
//
// parseCssColor + resolveEffectiveBackground are EXPORTED so the unit gate
// (tests/unit/contrast-resolver.spec.js) can drive their contract directly.
// They are file-local to this spec (not extracted to tests/helpers/ — YAGNI);
// the unit spec imports them via vi.mock('@playwright/test') to neutralize
// Playwright's top-level test.describe() during vitest collection.

/**
 * Parse an `rgb()` / `rgba()` CSS color string into {r,g,b}. Alpha (if
 * present) is DROPPED — callers feed only opaque representative colors into
 * the WCAG math. Throws on anything that isn't an rgb()/rgba() triple so the
 * resolver fails loud rather than silently returning a default that masks a
 * malformed computed-style read.
 *
 * Tolerates arbitrary whitespace around commas (browsers emit both
 * "rgb(255,0,170)" and "rgb(255, 0, 170)").
 */
export function parseCssColor(cssStr: string): { r: number; g: number; b: number } {
  if (typeof cssStr !== 'string') {
    throw new Error(`parseCssColor: expected string, got ${typeof cssStr}`)
  }
  const m = cssStr.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
  if (!m) {
    throw new Error(`parseCssColor: not an rgb()/rgba() color: ${JSON.stringify(cssStr)}`)
  }
  return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]) }
}

/**
 * Resolve the EFFECTIVE opaque background color of an element from its
 * computed style, for the WCAG contrast math. Order of preference:
 *
 *   1. Opaque backgroundColor (alpha === 1) fast-path — it is the painted
 *      bg; return it directly, ignoring backgroundImage. (For the .projects-
 *      badge the would-be solid bg equals the single-color gradient's stop,
 *      so this is the authoritative measure when present.)
 *   2. linear-gradient backgroundImage when backgroundColor is transparent —
 *      but ONLY if the gradient has a SINGLE representative color (both stops
 *      resolve equal). The .projects-badge case: bg rgba(0,0,0,0), gradient
 *      linear-gradient(135deg, rgb(255,0,170), rgb(255,0,170)) -> magenta.
 *
 * THROWS (fail-loud — no false-green) when:
 *   - backgroundColor is transparent AND backgroundImage is "none"/empty
 *     (no painted bg on this element at all).
 *   - backgroundImage is a non-linear-gradient (e.g. url() image) — we don't
 *     sample raster images for a representative color.
 *   - backgroundImage is a linear-gradient with DISTINCT stops — there is no
 *     single representative color, so picking stop[0] would fabricate a
 *     contrast number. Force a human decision instead.
 *
 * ANGLE-AGNOSTIC: matches the first rgb()/rgba() token inside
 * `linear-gradient(...)` regardless of a `135deg` / `to bottom right` prefix.
 */
export function resolveEffectiveBackground({
  color,
  backgroundImage,
  backgroundColor,
}: {
  color: string
  backgroundImage: string
  backgroundColor: string
}): { r: number; g: number; b: number } {
  void color // foreground not needed to resolve the bg; kept in signature for symmetry.
  // 1. Opaque backgroundColor fast-path.
  const bgMatches = backgroundColor.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,?\s*([0-9.]*)\s*\)/)
  if (bgMatches) {
    const alpha = bgMatches[4] === '' ? 1 : Number(bgMatches[4])
    if (alpha === 1) {
      return { r: Number(bgMatches[1]), g: Number(bgMatches[2]), b: Number(bgMatches[3]) }
    }
  }
  // 2. backgroundImage must be a linear-gradient we can extract stops from.
  const gradient = backgroundImage.trim()
  if (!gradient.startsWith('linear-gradient(') || !gradient.endsWith(')')) {
    throw new Error(
      `resolveEffectiveBackground: transparent backgroundColor requires a linear-gradient backgroundImage, got backgroundImage=${JSON.stringify(backgroundImage)} backgroundColor=${JSON.stringify(backgroundColor)}`,
    )
  }
  // Extract ALL rgb()/rgba() stops from inside linear-gradient(...).
  const inner = gradient.slice('linear-gradient('.length, -')'.length)
  const stops = [...inner.matchAll(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([0-9.]+))?\s*\)/g)].map(
    (m) => ({ r: Number(m[1]), g: Number(m[2]), b: Number(m[3]) }),
  )
  if (stops.length === 0) {
    throw new Error(
      `resolveEffectiveBackground: linear-gradient has no rgb()/rgba() stops to resolve: ${JSON.stringify(backgroundImage)}`,
    )
  }
  // Single representative color iff every stop resolves equal.
  const first = stops[0]
  const allEqual = stops.every((s) => s.r === first.r && s.g === first.g && s.b === first.b)
  if (!allEqual) {
    throw new Error(
      `resolveEffectiveBackground: linear-gradient has DISTINCT stops (${stops.length} colors) — no single representative color; refusing to fabricate a contrast number. bg=${JSON.stringify(backgroundImage)}`,
    )
  }
  return first
}

/**
 * Read the ACTUAL painted text color and background color of an element by
 * rasterizing it to a canvas and sampling pixels. This is the only method
 * robust to:
 *   - gradient backgrounds (getComputedStyle.backgroundColor returns the layer
 *     UNDER the gradient, often transparent)
 *   - semi-transparent rgba backgrounds composited over an ancestor
 *   - CSS variables (the browser resolves them before paint)
 *
 * Samples the glyph area (top-center of the element, where a character is most
 * likely painted) for the FOREGROUND, and a pixel near a horizontal edge
 * (background-only, off the glyphs) for the BACKGROUND. Returns both as
 * {r,g,b}. Falls back to getComputedStyle color/backgroundColor if the canvas
 * read is blocked (returns null).
 */
async function samplePaintedColors(
  page: import('@playwright/test').Page,
  selector: string,
): Promise<{ fg: { r: number; g: number; b: number } | null; bg: { r: number; g: number; b: number } | null; fgCss: string; bgCss: string }> {
  const fgCss = await page.locator(selector).first().evaluate((el) => getComputedStyle(el).color)
  // Element screenshot -> sample pixels via canvas. Playwright element
  // screenshots capture the painted element including its gradient/rgba bg.
  const buf = await page.locator(selector).first().screenshot()
  const sampled = await page.evaluate(async (pngBase64) => {
    const blob = await (await fetch(`data:image/png;base64,${pngBase64}`)).blob()
    const bmp = await createImageBitmap(blob)
    const canvas = document.createElement('canvas')
    canvas.width = bmp.width
    canvas.height = bmp.height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(bmp, 0, 0)
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    // FOREGROUND: scan the middle row for the darkest cluster (text glyphs
    // are typically the most saturated/differentiated pixels). Collect all
    // distinct-ish pixels and pick the one furthest from the row's mean
    // luminance — that's a glyph pixel.
    // BACKGROUND: a corner pixel (0,0) is usually pure background; verify by
    // sampling a few edge pixels and taking the median.
    const midY = Math.floor(canvas.height / 2)
    let bgR = 0, bgG = 0, bgB = 0, bgN = 0
    for (const [x, y] of [[0, 0], [canvas.width - 1, 0], [0, canvas.height - 1], [canvas.width - 1, canvas.height - 1], [0, midY], [canvas.width - 1, midY]]) {
      const i = (y * canvas.width + x) * 4
      bgR += data[i]; bgG += data[i + 1]; bgB += data[i + 2]; bgN++
    }
    const bg = { r: bgR / bgN, g: bgG / bgN, b: bgB / bgN }
    // FOREGROUND: scan mid row, find pixel most distant from bg luminance.
    const bgLum = 0.2126 * bg.r + 0.7152 * bg.g + 0.0722 * bg.b
    let best = { r: bg.r, g: bg.g, b: bg.b, dist: -1 }
    for (let x = 0; x < canvas.width; x++) {
      const i = (midY * canvas.width + x) * 4
      const r = data[i], g = data[i + 1], b = data[i + 2]
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
      const dist = Math.abs(lum - bgLum)
      if (dist > best.dist) best = { r, g, b, dist }
    }
    return { fg: { r: best.r, g: best.g, b: best.b }, bg }
  }, buf.toString('base64'))
  return { fg: sampled.fg, bg: sampled.bg, fgCss, bgCss: '' }
}

test.describe('#252 color contrast — WCAG AA on fixed surfaces', () => {
  test('/careers .position-card__badge is in the live DOM (#287 render-bug gate) + contrast measured', async ({ page }) => {
    // #287 fixed the /careers render bug (template refs no longer use .value),
    // so .position-card__badge is now in the live DOM. The HARD gate is the
    // #287 regression assertion: a future regression that suppresses the badge
    // (e.g. reintroducing currentLanguage.value in the template) fails here,
    // not silently — this replaces the old source-fallback that hid the render
    // bug by asserting against the stylesheet instead of the DOM.
    await page.goto(CAREERS)
    const badge = page.locator('.position-card__badge').first()
    await expect(badge, '.position-card__badge must be in the live DOM — render bug #287 must be fixed').toBeVisible({ timeout: 15000 })

    // Measure the computed-style contrast and gate on WCAG AA 4.5:1 (normal
    // text). #310's RESOLVED fix moves the badge background to a fully OPAQUE
    // dark surface (--bg-primary #0a0a0a) and keeps the magenta text, so the
    // ratio is DETERMINISTIC via getComputedStyle (browser resolves var() ->
    // rgb() identically across engines before paint) — magenta #ff00aa on
    // #0a0a0a = 5.5:1, WCAG AA 4.5:1 with ~1.0 margin.
    //
    // History: PRE-#310 the badge measured ~2.25:1 — magenta text on a 20%-
    // opacity magenta tint composited over the card = magenta-on-magenta. An
    // earlier #310 attempt used light text on the unchanged tint, but that
    // measured a CI-flaky 4.12:1 (chromium) because the translucent tint's
    // painted luminance depended on the compositing layer; pixel-sampling also
    // read anti-aliased glyph edges. The opaque bg removes both sources of
    // variance, and computed-style is the same causal measure the /about
    // .projects-badge test below uses (iter-294). The #287 render contract is
    // still gated separately above (toBeVisible).
    const cs = await badge.evaluate((el) => {
      const s = getComputedStyle(el)
      return { color: s.color, backgroundImage: s.backgroundImage, backgroundColor: s.backgroundColor }
    })
    const fg = parseCssColor(cs.color)
    const bg = resolveEffectiveBackground(cs)
    const ratio = contrastRatio(fg, bg)
    const summary =
      `position-card__badge computed-style contrast fg=${JSON.stringify(fg)} bg=${JSON.stringify(bg)} ` +
      `cssColor=${cs.color} cssBgImage=${cs.backgroundImage} cssBgColor=${cs.backgroundColor} ` +
      `ratio=${ratio.toFixed(2)} (>=4.5 AA required, fix #310)`
    // Attach the measurement to the HTML report for traceability.
    test.info().annotations.push({ type: 'contrast-ratio', description: summary })
    expect(ratio, summary).toBeGreaterThanOrEqual(4.5)
  })

  test('/about .projects-badge clears 4.5:1 AA', async ({ page }) => {
    // #294 AC#1 conclusion: this badge's GENUINE computed-style contrast is
    // 5.50:1 — fg --bg-primary (#0a0a0a -> rgb(10,10,10)) on bg --accent-
    // magenta (#ff00aa -> rgb(255,0,170), the single-color linear-gradient's
    // stop). The browser resolves var() -> rgb() IDENTICALLY across engines
    // before paint, so this ratio is deterministic on chromium, desktop
    // webkit, AND Mobile Safari.
    //
    // HISTORY: the prior harness measured this via screenshot pixel-sampling
    // (samplePaintedColors), which on Mobile Safari's iPhone 13 viewport read
    // glyph-edge anti-aliasing as fg=rgb(255,0,170) on bg=rgb(84,10,68) =
    // 3.88:1 (below the 4.5 AA gate) — a HARNESS artifact, not a WCAG
    // failure (CI run 28499977525, Mobile Safari job 84474747742). The same
    // badge passed on chromium and desktop webkit. #294 replaces the engine-
    // dependent pixel-sampling with the causal computed-style measure and
    // UN-SKIPS Mobile Safari (the prior `test.skip(isMobileSafari, ...)` is
    // removed; the signature drops `browserName` since it is no longer used).
    await page.goto(ABOUT)
    const badge = page.locator('.projects-badge').first()
    await expect(badge).toBeVisible()
    // Read the THREE computed-style strings the browser resolves. We pass all
    // three to resolveEffectiveBackground; it picks the opaque-backgroundColor
    // fast-path when present, else extracts the single-color linear-gradient.
    const cs = await badge.evaluate((el) => {
      const s = getComputedStyle(el)
      return { color: s.color, backgroundImage: s.backgroundImage, backgroundColor: s.backgroundColor }
    })
    const fg = parseCssColor(cs.color)
    const bg = resolveEffectiveBackground(cs)
    const ratio = contrastRatio(fg, bg)
    const summary =
      `projects-badge computed-style contrast fg=${JSON.stringify(fg)} bg=${JSON.stringify(bg)} ` +
      `cssColor=${cs.color} cssBgImage=${cs.backgroundImage} cssBgColor=${cs.backgroundColor} ` +
      `ratio=${ratio.toFixed(2)} (>=4.5 AA required)`
    test.info().annotations.push({ type: 'contrast-ratio', description: summary })
    expect(ratio, summary).toBeGreaterThanOrEqual(4.5)
  })
})
