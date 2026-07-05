/**
 * @file 353-navbar-green.spec.ts
 * @description Live-DOM E2E for Issue #353 — unify navbar item color to brand cyan.
 * @ticket #353
 *
 * Drives the RUNNING app to prove:
 *   - AC1: All 6 navbar items (4 router-links + 2 dropdown triggers) resolve to
 *     brand cyan (#00ffcc) by default. The router-links previously inherited
 *     gray var(--text-secondary); they must now match the Contact / dropdown
 *     cyan.
 *   - AC2: The active-page router-link keeps its ::after underline (width 100%).
 *   - AC3: Cross-page — switching routes moves the underline correctly AND all
 *     6 items remain cyan on every page.
 *
 * Why getComputedStyle (not DOM text/screenshots): cyan-on-dark is subtle in a
 * screenshot and DOM text is colorblind. The strongest programmatic signal is
 * the resolved computed `color` (iter-13/15 programmatic-color gate). We also
 * log every sampled rgb value as primary evidence.
 */

import { test, expect, type Page } from '@playwright/test'

// Resolve origin from PLAYWRIGHT_BASE_URL (override for non-default preview
// ports); fall back to the configured baseURL origin (3000).
const ORIGIN = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'
const BASE = `${ORIGIN}/KTechAICyberWeb/`

/** Convert a CSS hex (#00ffcc) to a comparable rgb string "rgb(0, 255, 204)". */
function hexToRgb(hex: string): string {
  const m = hex.replace('#', '').match(/.{2}/g)
  if (!m) return ''
  const [r, g, b] = m.map((h) => parseInt(h, 16))
  return `rgb(${r}, ${g}, ${b})`
}

/** Resolve --cyan on the document root and convert to the computed-color form. */
async function resolveCyan(page: Page): Promise<{ hex: string; rgb: string }> {
  const hex = await page.evaluate(() => {
    return getComputedStyle(document.documentElement)
      .getPropertyValue('--cyan')
      .trim()
      .toLowerCase()
  })
  return { hex, rgb: hexToRgb(hex) }
}

/** Sample computed color of all 6 nav items + the ::after width of a link. */
async function sampleNav(page: Page) {
  return page.evaluate(() => {
    const rootStyle = getComputedStyle(document.documentElement)
    const cyanHex = rootStyle.getPropertyValue('--cyan').trim().toLowerCase()
    const direct = Array.from(
      document.querySelectorAll<HTMLElement>('.nav-links > li > a'),
    )
    const triggers = Array.from(
      document.querySelectorAll<HTMLElement>('.nav-links .dropdown-trigger'),
    )
    const directColors = direct.map((el) => getComputedStyle(el).color)
    const triggerColors = triggers.map((el) => getComputedStyle(el).color)
    // ::after widths for the 4 direct router-links (Home/About/News/Contact).
    const afterWidths = direct.map((el) =>
      parseFloat(getComputedStyle(el, '::after').width),
    )
    return {
      cyanHex,
      directColors,
      triggerColors,
      afterWidths,
      directTexts: direct.map((el) => (el.textContent || '').trim()),
      triggerTexts: triggers.map((el) => (el.textContent || '').trim()),
    }
  })
}

test.describe('#353 navbar — unified green/cyan', () => {
  test('AC1+AC2: on /, all 6 nav items are cyan; Home ::after underline = 100%', async ({
    page,
  }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' })
    await page.waitForSelector('.nav-links > li > a', { state: 'attached' })
    // Stabilize hydration.
    await page.waitForTimeout(800)

    const { rgb: cyanRgb, hex: cyanHex } = await resolveCyan(page)
    const sample = await sampleNav(page)

    console.log(
      `[#353 AC1] resolved --cyan = ${cyanHex} -> ${cyanRgb}\n` +
        `  direct router-link colors: ${JSON.stringify(sample.directColors)}\n` +
        `  dropdown-trigger colors:   ${JSON.stringify(sample.triggerColors)}\n` +
        `  direct link texts: ${JSON.stringify(sample.directTexts)}\n` +
        `  trigger texts:     ${JSON.stringify(sample.triggerTexts)}\n` +
        `  ::after widths (px, of 4 direct links): ${JSON.stringify(sample.afterWidths)}`,
    )

    // AC1: every direct router-link color matches resolved --cyan exactly.
    expect(
      sample.directColors.length,
      'must sample the 4 direct router-links (Home, About Us, News, Contact)',
    ).toBeGreaterThanOrEqual(4)
    for (const c of sample.directColors) {
      expect(
        c,
        `direct router-link color ${c} must equal resolved --cyan ${cyanRgb}`,
      ).toBe(cyanRgb)
    }
    // AC1: every dropdown-trigger color matches resolved --cyan exactly.
    expect(
      sample.triggerColors.length,
      'must sample the 2 dropdown triggers (Our Solutions, Join Us)',
    ).toBeGreaterThanOrEqual(2)
    for (const c of sample.triggerColors) {
      expect(
        c,
        `dropdown-trigger color ${c} must equal resolved --cyan ${cyanRgb}`,
      ).toBe(cyanRgb)
    }

    // AC2: Home (first direct link) keeps its active underline.
    // Width is read in px from getComputedStyle. The Home link's ::after is
    // 100% width when active; 100% of an <a> with text "Home" is some px > 0.
    // The non-active links' ::after width is 0px.
    const homeAfter = sample.afterWidths[0]
    expect(
      homeAfter,
      `Home ::after width ${homeAfter}px must be > 0 (active underline present)`,
    ).toBeGreaterThan(0)
    // Sanity: the inactive direct links on / (About Us, News, Contact) have
    // width 0 — proves AC2 "the underline follows the active page" baseline.
    expect(sample.afterWidths[1], 'About Us ::after on / must be 0').toBe(0)
    expect(sample.afterWidths[2], 'News ::after on / must be 0').toBe(0)
    expect(sample.afterWidths[3], 'Contact ::after on / must be 0').toBe(0)
  })

  test('AC3: cross-page — underline follows active route; all items stay cyan', async ({
    page,
  }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' })
    await page.waitForSelector('.nav-links > li > a', { state: 'attached' })
    await page.waitForTimeout(800)
    const { rgb: cyanRgb } = await resolveCyan(page)

    // --- On /: Home underlined, About/News not.
    let s = await sampleNav(page)
    expect(s.afterWidths[0]).toBeGreaterThan(0)
    expect(s.afterWidths[1]).toBe(0)
    expect(s.afterWidths[2]).toBe(0)
    for (const c of [...s.directColors, ...s.triggerColors]) {
      expect(c).toBe(cyanRgb)
    }

    // --- Go to /about: About underlined; Home + News not; colors still cyan.
    await page.goto(`${BASE}about`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(800)
    s = await sampleNav(page)
    console.log(
      `[#353 AC3 /about] direct colors: ${JSON.stringify(s.directColors)}; ` +
        `::after widths: ${JSON.stringify(s.afterWidths)}`,
    )
    expect(s.afterWidths[0], 'Home ::after on /about must be 0').toBe(0)
    expect(s.afterWidths[1], 'About ::after on /about must be > 0').toBeGreaterThan(0)
    expect(s.afterWidths[2], 'News ::after on /about must be 0').toBe(0)
    for (const c of [...s.directColors, ...s.triggerColors]) {
      expect(c).toBe(cyanRgb)
    }

    // --- Go to /news: News underlined; Home + About not; colors still cyan.
    await page.goto(`${BASE}news`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(800)
    s = await sampleNav(page)
    console.log(
      `[#353 AC3 /news] direct colors: ${JSON.stringify(s.directColors)}; ` +
        `::after widths: ${JSON.stringify(s.afterWidths)}`,
    )
    expect(s.afterWidths[0], 'Home ::after on /news must be 0').toBe(0)
    expect(s.afterWidths[1], 'About ::after on /news must be 0').toBe(0)
    expect(s.afterWidths[2], 'News ::after on /news must be > 0').toBeGreaterThan(0)
    for (const c of [...s.directColors, ...s.triggerColors]) {
      expect(c).toBe(cyanRgb)
    }
  })
})
