/**
 * @file 188-css-purge.spec.ts
 * @description Visual no-regression E2E for the CSS purge + font consolidation
 * in Issue #188 (Core Web Vitals — "unused CSS is removed").
 * @ticket #188
 *
 * WHY getComputedStyle (not DOM text): the DOM cannot SEE CSS. A font-family
 * revert or a theme-variable dedup regression passes every DOM test. The
 * strongest programmatic signal the browser exposes is the RESOLVED computed
 * style on a rendered element. So we assert:
 *
 *  1. The hero/section headings resolve to a font stack containing "Orbitron"
 *     (the corrected --font-display value — was 'Clash Display', which was
 *     never loaded, so before #188 these resolved to system-ui). RED against
 *     origin/main: today they resolve to system-ui, not Orbitron.
 *  2. body resolves to a monospace stack (cyber.css keeps the intentional
 *     'Courier New' body font).
 *  3. Theme toggle still flips [data-theme] AND changes a sample element's
 *     computed color (proves the cyber.css :root dedup didn't break theming).
 *  4. No `pageerror` console errors on Home (the inline-block removal didn't
 *     orphan a referenced script/style).
 *
 * Run: node_modules/.bin/playwright test 188-css-purge --project=chromium
 *   (the dev server must be running on :3000 — see playwright.config.js
 *   webServer note; reuseExistingServer:true is the default when uncommented.)
 */

import { test, expect, type Page } from '@playwright/test'

// The app is served at the Vite base subpath /KTechAICyberWeb/. Playwright's
// baseURL is origin-only (http://localhost:3000), so page.goto('/') works
// (the server 302-redirects / to the subpath) BUT page.goto('/about') hits the
// origin's /about which 404s (no redirect for deep routes). Specs that
// deep-link must include the subpath explicitly. Mirrors the BASE-constant
// pattern used by 140-router-base.spec.ts.
const BASE = '/KTechAICyberWeb/'
const HOME = `${BASE}`
const ABOUT = `${BASE}about`
// Route is /services/big-data-ai (see src/main.js), NOT /services/big-data.
const SERVICE_BIG_DATA = `${BASE}services/big-data-ai`

/** Read the resolved font-family of the first element matching `selector`. */
async function computedFontFamily(page: Page, selector: string): Promise<string> {
  return page.locator(selector).first().evaluate((el) => {
    return getComputedStyle(el).fontFamily
  })
}

test.describe('#188 CSS purge — visual no-regression', () => {
  test('Home hero heading resolves to Orbitron (corrected --font-display)', async ({ page }) => {
    await page.goto(HOME)
    await page.waitForLoadState('networkidle')
    // Home renders <h1 class="neon-text glitch-text">. After #188 the
    // --font-display variable resolves to 'Orbitron' (was 'Clash Display' =>
    // system-ui). Assert the RESOLVED computed style, not the source.
    const ff = await computedFontFamily(page, 'h1.neon-text')
    console.log('\n[188] Home h1.neon-text computed font-family:', ff)
    expect(ff.toLowerCase()).toContain('orbitron')
  })

  test('Home body resolves to a monospace stack (intentional cyber body font)', async ({ page }) => {
    await page.goto(HOME)
    await page.waitForLoadState('networkidle')
    const ff = await page.evaluate(() => getComputedStyle(document.body).fontFamily)
    console.log('\n[188] body computed font-family:', ff)
    // cyber.css keeps `body { font-family: 'Courier New', monospace }`.
    expect(ff.toLowerCase()).toMatch(/courier|monospace/)
  })

  test('About page-title resolves to Orbitron', async ({ page }) => {
    await page.goto(ABOUT)
    await page.waitForLoadState('networkidle')
    const ff = await computedFontFamily(page, '.page-title')
    console.log('\n[188] About .page-title computed font-family:', ff)
    expect(ff.toLowerCase()).toContain('orbitron')
  })

  test('ServiceBigData hero heading resolves to Orbitron', async ({ page }) => {
    await page.goto(SERVICE_BIG_DATA)
    await page.waitForLoadState('networkidle')
    const ff = await computedFontFamily(page, '#bd-hero-heading')
    console.log('\n[188] ServiceBigData #bd-hero-heading computed font-family:', ff)
    expect(ff.toLowerCase()).toContain('orbitron')
  })

  test('theme toggle flips [data-theme] AND changes a sample element color (cyber.css dedup did not break theming)', async ({ page }) => {
    await page.goto(HOME)
    await page.waitForLoadState('networkidle')
    // Reset to a known theme so the toggle direction is deterministic.
    await page.evaluate(() => {
      localStorage.setItem('ktech-preferences', JSON.stringify({ theme: 'dark', language: 'en' }))
    })
    await page.reload()
    await page.waitForLoadState('networkidle')

    const htmlBefore = await page.locator('html').getAttribute('data-theme')
    // Read the RESOLVED --text-primary variable off <html>. This is the most
    // direct proof that the [data-theme="..."] block in cyber.css still applies
    // after the :root dedup (#188): the variable's value comes straight from
    // the matching [data-theme] selector, with NO CSS transition in the way
    // (transitions only affect properties that consume the var, like body.color,
    // not the var resolution itself). It therefore settles the instant
    // data-theme flips, on every engine — no fixed-timeout wait needed.
    // dark #e0e0e0 vs light #1a1a2e (see cyber.css [data-theme] blocks).
    const varBefore = await page.evaluate(
      () => getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim()
    )
    expect(varBefore, '--text-primary must resolve under [data-theme="dark"]').toBe('#e0e0e0')

    // Click the theme toggle and assert [data-theme] flips.
    await page.locator('.theme-toggle').click()
    const htmlAfter = await page.locator('html').getAttribute('data-theme')
    expect(htmlAfter, 'data-theme must change after toggle click').not.toBe(htmlBefore)

    // The resolved variable must now reflect the light-theme block. expect.poll
    // makes this robust against any engine timing without a magic timeout.
    await expect.poll(
      async () => page.evaluate(
        () => getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim()
      ),
      { timeout: 3000, message: '--text-primary must flip to the light-theme value' },
    ).toBe('#1a1a2e')

    // Belt-and-braces: body.color consumes --text-primary, so once the variable
    // has flipped AND the 300ms `color` transition (`* { transition: color 0.3s }
    //`, cyber.css lines 47-54) has finished interpolating, body.color must settle
    // to the resolved light value. Asserting the EXACT settled color (not just
    // "different from before") proves the transition completed and the consumer
    // reached the new theme — no mid-transition ambiguity. 5s timeout absorbs
    // parallel-worker contention on a shared origin.
    await expect.poll(
      async () => page.evaluate(() => getComputedStyle(document.body).color),
      { timeout: 5000, message: 'body color must settle to the light-theme value' },
    ).toBe('rgb(26, 26, 46)')
  })

  test('no pageerror console errors on Home after purge', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))
    await page.goto(HOME)
    await page.waitForLoadState('networkidle')
    // Allow a moment for any deferred script error to surface.
    await page.waitForTimeout(500)
    console.log('\n[188] pageerror events on Home:', errors)
    expect(errors).toEqual([])
  })
})
